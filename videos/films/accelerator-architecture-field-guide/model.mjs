import {
  hardwareDecision,
  localMemorySpills,
  motion,
  nearestRank,
  pallasOwnershipTrace,
  product2x2State,
  projection,
  ringTraffic,
  sharedBound,
  serviceTrace,
  sequentialOffload,
  sum,
  traversal,
  waveReduction,
} from './arithmetic.mjs';
import { ids, tracks } from './fixtures.mjs';
import assert from 'node:assert/strict';
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot,
    q = motion(state.beatP);
  if (id === 'intro') {
    const compute = 200e12 * (1 + (step === 2 ? Math.min(1, q / 0.65) : 0));
    return {
      step,
      q,
      compute,
      rows: [projection(32768, compute), projection(8, compute)],
    };
  }
  if (id === 'reuse')
    return {
      step,
      q,
      ...projection(step === 0 ? 8 : step === 1 ? Math.round(8 * 4096 ** q) : 32768),
    };
  if (id === 'offload') {
    const fraction = step === 0 ? 0 : step === 1 ? 0.1 * q : 0.1;
    return { step, q, ...sequentialOffload(fraction) };
  }
  if (id === 'lanes') {
    const helperProgress = motion((state.beatP - 0.03) / 0.27);
    const count =
      step === 0
        ? 64
        : step === 1
          ? Math.max(32, 64 - Math.floor(32 * helperProgress + 1e-9))
          : Math.min(64, 32 + Math.floor(32 * q + 1e-9));
    return {
      step,
      q,
      helperProgress,
      count,
      values: Array.from(
        {
          length: 64,
        },
        (_, i) => i + 1,
      ),
      result: (count * (count + 1)) / 2,
      requiredResult: (64 * 65) / 2,
    };
  }
  if (id === 'tile-order')
    return {
      step,
      q,
      traces: [0, 1].map((order) =>
        traversal(
          order,
          step === 0
            ? 0
            : step === 1
              ? [0.01, 0.07, 0.13, 0.19].filter((at) => state.beatP >= at + order * 0.22).length
              : 4,
        ),
      ),
    };
  if (id === 'topology') {
    const layers = 80,
      reductionsPerLayer = 2,
      totalReductions = layers * reductionsPerLayer;
    const reductions = step === 0 ? Math.floor(totalReductions * q + 1e-9) : totalReductions;
    const activeLayer = Math.max(1, Math.ceil(reductions / reductionsPerLayer));
    const completedLayers = activeLayer - 1,
      completedHere = reductions - completedLayers * reductionsPerLayer;
    return {
      step,
      q,
      layers,
      reductionsPerLayer,
      totalReductions,
      reductions,
      activeLayer,
      completedLayers,
      layerTicks: Array.from(
        {
          length: reductionsPerLayer,
        },
        (_, i) => i < completedHere,
      ),
      ms: [5, 20].map((us) => (reductions * us) / 1000),
    };
  }
  const requests = Array.from(
    {
      length: 20,
    },
    (_, i) => ({
      first: i !== 0,
      generation: i !== 1,
      tokens: 100,
    }),
  );
  return {
    step,
    q,
    requests,
    first: requests.filter((r) => r.first).length,
    generation: requests.filter((r) => r.generation).length,
    joint: requests.filter((r) => r.first && r.generation).length,
  };
}
export function validateOriginalModel() {
  assert(Math.abs(projection(8).intensity - 7.9786) < 0.001);
  assert(projection(32768).computeMs > projection(32768).memoryMs);
  assert(projection(8).computeMs < projection(8).memoryMs);
  assert.equal(projection(8).floorMs, projection(8, 400e12).floorMs);
  const before = sampleModel('intro', {
      beat: 2,
      beatP: 0.12,
    }),
    during = sampleModel('intro', {
      beat: 2,
      beatP: 0.5,
    }),
    after = sampleModel('intro', {
      beat: 2,
      beatP: 0.88,
    });
  assert(before.compute < during.compute && during.compute <= after.compute);
  assert(before.rows[0].floorMs > after.rows[0].floorMs);
  assert.equal(before.rows[1].floorMs, after.rows[1].floorMs);
  assert.equal(traversal(0).kib, 18);
  assert.equal(traversal(1).kib, 12);
  assert.deepEqual(
    traversal(0).events.map((e) => [e.xLoad, e.wLoad]),
    [
      [true, true],
      [false, true],
      [true, true],
      [false, true],
    ],
  );
  assert.deepEqual(
    traversal(1).events.map((e) => [e.xLoad, e.wLoad]),
    [
      [true, true],
      [true, false],
      [true, true],
      [true, false],
    ],
  );
  assert.equal(
    sampleModel('tile-order', {
      beat: 0,
      beatP: 0.99,
    }).traces[0].count,
    0,
  );
  assert.equal(
    sampleModel('tile-order', {
      beat: 1,
      beatP: 0.12,
    }).traces[0].count,
    2,
  );
  assert.equal(
    sampleModel('tile-order', {
      beat: 1,
      beatP: 0.12,
    }).traces[1].count,
    0,
  );
  assert.equal(
    sampleModel('tile-order', {
      beat: 1,
      beatP: 0.4,
    }).traces[1].count,
    3,
  );
  assert.equal(
    sampleModel('tile-order', {
      beat: 1,
      beatP: 0.5,
    }).traces[1].count,
    4,
  );
  assert.equal(
    sampleModel('tile-order', {
      beat: 2,
      beatP: 0.01,
    }).traces[1].kib,
    12,
  );
  const lanesContract = sampleModel('lanes', {
    beat: 0,
    beatP: 0.5,
  });
  assert.equal(lanesContract.count, 64);
  assert.equal(lanesContract.result, 2080);
  const lanesHelperStart = sampleModel('lanes', {
    beat: 1,
    beatP: 0.12,
  });
  const lanesHelperSpokenHalf = sampleModel('lanes', {
    beat: 1,
    beatP: 0.25,
  });
  const lanesHelperEnd = sampleModel('lanes', {
    beat: 1,
    beatP: 0.99,
  });
  assert(lanesHelperStart.count < 64 && lanesHelperStart.count > 32);
  assert.equal(lanesHelperSpokenHalf.count, 32);
  assert(lanesHelperStart.count > lanesHelperSpokenHalf.count);
  assert.equal(lanesHelperEnd.count, 32);
  assert.equal(lanesHelperEnd.result, 528);
  const lanesRepairStart = sampleModel('lanes', {
    beat: 2,
    beatP: 0.01,
  });
  const lanesRepairMid = sampleModel('lanes', {
    beat: 2,
    beatP: 0.5,
  });
  const lanesRepairEnd = sampleModel('lanes', {
    beat: 2,
    beatP: 0.99,
  });
  assert.equal(lanesRepairStart.count, 32);
  assert(
    lanesRepairStart.count < lanesRepairMid.count && lanesRepairMid.count < lanesRepairEnd.count,
  );
  assert.equal(lanesRepairEnd.count, 64);
  assert.equal(lanesRepairEnd.result, lanesRepairEnd.requiredResult);
  for (const laneState of [
    lanesContract,
    lanesHelperStart,
    lanesHelperSpokenHalf,
    lanesHelperEnd,
    lanesRepairStart,
    lanesRepairMid,
    lanesRepairEnd,
  ]) {
    assert.equal(laneState.result, (laneState.count * (laneState.count + 1)) / 2);
    assert.equal(laneState.requiredResult, 2080);
  }
  assert.equal(
    sampleModel('gates', {
      beat: 2,
      beatP: 0.5,
    }).joint,
    18,
  );
  for (const id of ids)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.1, 0.5, 0.8, 0.999999]) {
        const s = sampleModel(id, {
          beat,
          beatP,
        });
        assert.equal(s.step, beat);
        if (id === 'offload') {
          assert(s.fraction >= 0 && s.fraction <= 0.1);
          assert.equal(s.total, s.hostMs + s.residentMs);
          assert(Math.abs(s.residentBytes + s.hostBytes - 16e9) < 1e-5);
          assert.equal(s.hostMs, (s.hostBytes / 64e9) * 1000);
          assert.equal(s.residentMs, (s.residentBytes / 3.35e12) * 1000);
        }
        if (id === 'tile-order')
          for (const row of s.traces) {
            assert.equal(row.kib, row.xLoads + 4 * row.wLoads);
            assert.equal(row.kib, sum(row.events.map((e) => e.addedKiB)));
            assert.equal(row.events.length, row.count);
            assert.deepEqual(row.current, row.events.at(-1) ?? null);
          }
      }
  return true;
}
export function validateModel() {
  validateOriginalModel();
  for (const [size, faulty, repaired] of [
    [63, 528, 2016],
    [64, 528, 2080],
    [65, 593, 2145],
    [66, 659, 2211],
  ]) {
    assert.equal(waveReduction(size, 32).total, faulty);
    assert.equal(waveReduction(size, 64).total, repaired);
  }
  for (const [lateId, joint, tokens] of [
    [2, 18, 1800],
    [1, 19, 1900],
  ]) {
    const s = serviceTrace(lateId);
    assert.deepEqual([s.first.length, s.later.length, s.p95First, s.p95Later], [19, 19, 100, 20]);
    assert.deepEqual([s.joint.length, s.eligibleTokens], [joint, tokens]);
  }
  assert.equal(2 * 4096 * 11008, 86 * 2 ** 20);
  assert.deepEqual(product2x2State(8).sums, [
    [19, 22],
    [43, 50],
  ]);
  for (let i = 0; i <= 8; i++) {
    const s = product2x2State(i);
    assert.equal(
      s.counts.flat().reduce((a, b) => a + b, 0),
      i,
    );
  }
  assert.deepEqual(
    localMemorySpills({
      psumLive: 6,
      sbufLive: 4,
    }),
    {
      psumLive: 6,
      sbufLive: 4,
      psumCapacity: 4,
      sbufCapacity: 8,
      psumToSbuf: 2,
      sbufTotal: 6,
      sbufToHbm: 0,
    },
  );
  assert.equal(
    localMemorySpills({
      psumLive: 6,
      sbufLive: 7,
    }).sbufToHbm,
    1,
  );
  assert.equal(
    localMemorySpills({
      psumLive: 3,
      sbufLive: 6,
    }).sbufToHbm,
    0,
  );
  assert.equal(sharedBound(192 * 1024, 64 * 1024), 3);
  assert.equal(sharedBound(192 * 1024, 96 * 1024), 2);
  assert.equal(ringTraffic(128 * 1024, 4).sentPerRank, 192 * 1024);
  assert.equal(ringTraffic(128 * 1024, 4).chunkBytes, 32 * 1024);
  assert.deepEqual(
    hardwareDecision().map((r) => [r.p95First, r.eligible, r.raw, r.tokensPerDollar]),
    [
      [400, false, 50, null],
      [250, true, 40, 20000],
    ],
  );
  assert.equal(nearestRank([...Array(19).fill(1), 9]), 1);
  assert.deepEqual(
    pallasOwnershipTrace('consecutive')
      .filter((r) => r.complete)
      .map((r) => r.sum),
    [3, 7],
  );
  assert(pallasOwnershipTrace('interleaved').some((r) => r.lost));
  assert.equal(8 / 128, 0.0625);
  assert.equal((18 * 100) / 10, 180);
  assert.equal((63 * 64) / 2, 2016);
  assert.equal((65 * 66) / 2, 2145);
  return true;
}
