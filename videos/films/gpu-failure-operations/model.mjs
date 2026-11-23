import {
  fragments,
  gpuReceiptFixtures,
  ids,
  soakTelemetry,
  suppliedAdmissionReceipts,
  suppliedDiagnostics,
} from './fixtures.mjs';
import {
  classifyGpuReceipt,
  containmentTrace,
  covered,
  diagnosticRun,
  freshGpuReceipt,
  gpuIncident,
  historyRing,
  ledger,
  mix,
  motion,
  nodeActions,
  readmission,
  sum,
} from './arithmetic.mjs';
import assert from 'node:assert/strict';
import { createCueTrack } from 'vizmatic';
export const track = (ids) =>
  Object.fromEntries(
    ids.map((id) => [
      id,
      createCueTrack({
        initial: {
          id: id + '-initial',
          snapshot: {
            step: 0,
          },
        },
        cues: [0, 1, 2].map((step) => ({
          id: id + '-' + step,
          beat: step,
          at: 0,
          snapshot: {
            step,
          },
        })),
      }),
    ]),
  );
export const tracks = track(ids);
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot,
    q = motion(state.beatP);
  if (id === 'intro')
    return {
      step,
      q,
      ...ledger(),
      request: 1.5,
    };
  if (id === 'fragments')
    return {
      step,
      q,
      fragments,
      total: sum(fragments),
      request: 1.5,
      largest: Math.max(...fragments),
      probe: step === 0 ? 0 : Math.min(fragments.length - 1, Math.floor(q * fragments.length)),
      fits: fragments.some((x) => x >= 1.5),
    };
  if (id === 'ownership')
    return {
      step,
      q,
      ...ledger(step === 0 ? 39.38 : null),
    };
  if (id === 'contain') {
    const arrivals = step === 0 ? Math.floor(6 * q) : 6,
      admittedAffected = 0,
      peer = arrivals;
    return {
      step,
      q,
      arrivals,
      admittedAffected,
      peer,
      inflight: step === 0 ? 2 : Math.max(0, 2 - Math.floor(2 * q)),
      ready: false,
      fatal: step > 0,
    };
  }
  if (id === 'diagnostics') {
    const index =
        step === 0 ? 0 : step === 1 ? (state.beatP < 0.3 ? 0 : state.beatP < 0.45 ? 1 : 2) : 2,
      receipt = suppliedDiagnostics[index];
    return {
      step,
      q,
      receipt,
      results: receipt.results,
      complete: covered(receipt.results),
    };
  }
  if (id === 'soak') {
    const points = Array.from(
      {
        length: 8,
      },
      (_, i) => ({
        cycle: i + 1,
        restarted: 31 + i * 1.1,
        repaired: 31 + (i % 3) * 0.3,
      }),
    );
    const cycle = 1 + 7 * q,
      index = Math.min(6, Math.floor(cycle - 1)),
      fraction = cycle - 1 - index;
    const current = {
      cycle,
      restarted: mix(points[index].restarted, points[index + 1].restarted, fraction),
      repaired: mix(points[index].repaired, points[index + 1].repaired, fraction),
    };
    return {
      step,
      q,
      points: [...points.filter((r) => r.cycle < cycle), current],
      current,
      headroom: {
        restarted: 40 - current.restarted,
        repaired: 40 - current.repaired,
      },
    };
  }
  const received = step === 0 ? (state.beatP < 0.68 ? 6 : state.beatP < 0.82 ? 7 : 8) : 8,
    receipts = suppliedAdmissionReceipts.slice(0, received);
  return {
    step,
    q,
    receipts,
    ...readmission(receipts),
    quietTelemetry: true,
  };
}
export function validateSoak() {
  const early = sampleModel('soak', {
    beat: 1,
    beatP: 0,
  });
  const middle = sampleModel('soak', {
    beat: 1,
    beatP: 0.42,
  });
  const late = sampleModel('soak', {
    beat: 1,
    beatP: 0.99,
  });
  assert.equal(early.current.cycle, 1);
  assert.equal(late.current.cycle, 8);
  assert(middle.current.cycle > 1 && middle.current.cycle < 8);
  for (const state of [early, middle, late]) {
    assert.equal(state.headroom.restarted, 40 - state.current.restarted);
    assert.equal(state.headroom.repaired, 40 - state.current.repaired);
    assert.deepEqual(state.points.at(-1), state.current);
  }
  assert(late.headroom.restarted < 1.5);
  assert(late.headroom.repaired > 8);
}
export function validateModel() {
  validateSoak();
  validateGpuConstructions();
  assert.equal(diagnosticRun(suppliedDiagnostics[0]).exitStatus, 0);
  assert(!diagnosticRun(suppliedDiagnostics[0]).coverage);
  assert.equal(diagnosticRun(suppliedDiagnostics[1]).exitStatus, 1);
  assert(diagnosticRun(suppliedDiagnostics[2]).coverage);
  assert(!nodeActions(0.4).newPlacementAllowed);
  assert.equal(nodeActions(0.4).ephemeralBlocks, 2);
  assert.equal(nodeActions(1).ephemeralBlocks, 0);
  assert.deepEqual(nodeActions(1).durableReceipts, ['Q1', 'Q2']);
  assert(!nodeActions(1).newPlacementAllowed);
  for (const row of soakTelemetry) assert.equal(row.headroom, 40 - (31 + (row.cycle - 1) * 1.1));
  for (const beat of [0, 1])
    for (let i = 0; i <= 100; i++) {
      const t = containmentTrace(beat, i / 100);
      assert.deepEqual(
        t.existing.map((r) => r.id),
        ['R1', 'R2'],
      );
      assert(t.existing.every((r) => r.owner === 'GPU-0/P17'));
      assert(t.rows.every((r) => r.owner === 'admission queue' || r.owner === 'GPU-1/P8'));
      if (t.relaunched) assert(t.stopped && t.fatal);
    }
  const l = ledger();
  assert(Math.abs(l.allocated + l.reserveGap + l.outside + l.free - l.capacity) < 1e-12);
  assert(Math.abs(sum(fragments) - 6.1) < 1e-12);
  assert.equal(Math.max(...fragments), 0.88);
  assert(!fragments.some((x) => x >= 1.5));
  assert.equal(ledger(null).outside, null);
  assert(
    !covered({
      pcie: 'Pass',
      bandwidth: 'Skip',
    }),
  );
  assert(
    !covered({
      pcie: 'Pass',
      bandwidth: 'Pass',
      memory: 'Fail',
    }),
  );
  assert(
    covered({
      pcie: 'Pass',
      bandwidth: 'Pass',
    }),
  );
  assert(
    sampleModel('readmit', {
      beat: 0,
      beatP: 0.5,
    }).quarantined,
  );
  assert(
    sampleModel('readmit', {
      beat: 0,
      beatP: 0.75,
    }).quarantined,
  );
  assert(
    sampleModel('readmit', {
      beat: 0,
      beatP: 0.9,
    }).quarantined,
  );
  assert(
    sampleModel('readmit', {
      beat: 1,
      beatP: 0.9,
    }).quarantined,
  );
  assert(readmission(suppliedAdmissionReceipts.slice(0, 5)).quarantined);
  assert(
    readmission(
      suppliedAdmissionReceipts.map((r) => ({
        ...r,
        owner: 'GPU-1/new-process',
      })),
    ).quarantined,
  );
  assert(
    readmission([
      ...suppliedAdmissionReceipts,
      {
        ...suppliedAdmissionReceipts[5],
        status: 'Fail',
      },
    ]).quarantined,
  );
  assert(readmission(suppliedAdmissionReceipts).quarantined);
  assert(
    !readmission(suppliedAdmissionReceipts, 'GPU-0/new-process', {
      workload: true,
      platform: true,
    }).quarantined,
  );
  assert.equal(
    sampleModel('diagnostics', {
      beat: 1,
      beatP: 0.1,
    }).results.bandwidth,
    'Skip',
  );
  assert.equal(
    sampleModel('diagnostics', {
      beat: 1,
      beatP: 0.35,
    }).results.bandwidth,
    'Fail',
  );
  assert.equal(
    sampleModel('diagnostics', {
      beat: 1,
      beatP: 0.5,
    }).complete,
    true,
  );
  for (const beatP of [0, 0.2, 0.5, 0.8, 0.99]) {
    const s = sampleModel('contain', {
      beat: 0,
      beatP,
    });
    assert.equal(s.peer, s.arrivals);
    assert.equal(s.admittedAffected, 0);
  }
  return true;
}
export function validateGpuConstructions() {
  const [summarizer, embedder] = gpuReceiptFixtures;
  const liveDemand = (r) => r.pytorch_allocated_gib + r.oom_request_gib;
  assert.equal(liveDemand(summarizer).toFixed(2), '31.60');
  assert.equal((liveDemand(embedder) - embedder.capacity_gib).toFixed(2), '0.10');
  const blockFloor = summarizer.oom_request_gib;
  const firstViolation = soakTelemetry.find((sample) => sample.layout < blockFloor);
  assert.equal(firstViolation?.cycle, 5);
  assert.equal(firstViolation.layout.toFixed(2), '1.40');
  assert(soakTelemetry.every((sample) => sample.revised.layout >= blockFloor));
  assert.deepEqual(
    gpuReceiptFixtures.map((r) => classifyGpuReceipt(r).hypothesis),
    [
      'allocator-fragmentation',
      'application-capacity',
      'outside-pytorch',
      'device-memory-fault',
      'fabric-fault',
      'clock-limited',
      'process-corrupted',
      'driver-runtime',
    ],
  );
  assert.equal(classifyGpuReceipt(freshGpuReceipt()).outside, 3.5);
  assert.equal(
    classifyGpuReceipt(
      freshGpuReceipt({
        oom_request_gib: null,
      }),
    ).hypothesis,
    'oom-unresolved',
  );
  const mixed = classifyGpuReceipt(
    freshGpuReceipt({
      dcgm_findings: ['memory'],
      cuda_error: 'illegal_address',
    }),
  );
  assert.equal(mixed.hypothesis, 'device-memory-fault');
  assert(mixed.mustRelaunch);
  const incident = gpuIncident([], {
    key: 'GPU-G0/I1',
    kind: 'fault',
  });
  assert.deepEqual(
    gpuIncident(incident, {
      key: 'GPU-G0/I1',
      kind: 'quiet',
    }),
    incident,
  );
  assert.deepEqual(historyRing(['A', 'B', 'C', 'D', 'E', 'F'], 4).retained, ['C', 'D', 'E', 'F']);
  return true;
}
