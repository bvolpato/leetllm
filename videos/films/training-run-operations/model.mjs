import { clamp, firstAdaptiveMovement, motion, trainingMemory } from './arithmetic.mjs';
import { DEADLINE_WARNING_CUE, advance, baseline, fresh, lost, saved } from './fixtures.mjs';
import {
  reshardConstruction,
  tokenReduction,
  trainingFreshState,
  warningSeconds,
} from './construction.mjs';
import assert from 'node:assert/strict';
import { trainingRun, drillRun, boundary, canFinish, nextDrillGroup } from './boundaries.mjs';
export function validateConstructions() {
  assert.equal(
    tokenReduction({
      beat: 0,
      beatP: 1,
    }).resultReady,
    false,
  );
  assert.equal(
    tokenReduction({
      beat: 0,
      beatP: 1,
    }).predict,
    true,
  );
  assert.equal(
    tokenReduction({
      beat: 1,
      beatP: 3 / 23.144,
    }).resultReady,
    false,
  );
  assert.equal(
    tokenReduction({
      beat: 1,
      beatP: 4.3 / 23.144,
    }).resultReady,
    true,
  );
  assert.deepEqual(
    [0.75, 1.25, 1.75, 2.25].map(
      (t) =>
        tokenReduction({
          beat: 1,
          beatP: (t + 0.001) / 23.144,
        }).sum,
    ),
    [10, 8, 6, 4],
  );
  const final = tokenReduction({
    beat: 1,
    beatP: 1,
  });
  assert.equal(final.sum / final.count, 1);
  for (let i = 0; i <= 1000; i++) {
    const trace = reshardConstruction({
        beat: 0,
        beatP: i / 1000,
      }),
      arrived = trace.slices.filter((s) => s.progress === 1);
    assert.deepEqual(
      trace.slices.flatMap((s) => s.coordinates),
      Array.from(
        {
          length: 16,
        },
        (_, i) => i,
      ),
    );
    assert.equal(arrived.length, trace.arrived);
    assert.equal(trace.slices.filter((s) => s.progress > 0 && s.progress < 1).length <= 1, true);
    trace.slices.forEach((s) =>
      s.coordinates.forEach((c) => assert.equal(Math.floor(c / 4), s.savedOwner)),
    );
  }
  const restored = reshardConstruction({
    beat: 1,
    beatP: 0,
  });
  assert.equal(restored.arrived, 8);
  assert.equal(restored.probeCoordinate, 6);
  assert.equal(restored.probeDestinationOwner, 3);
}
export function sampleModel(id, state) {
  const beat = state.beat ?? 0,
    b = Math.min(1, beat),
    p = clamp(state.beatP ?? 0),
    q = motion(p),
    D = b ? 8 : 4,
    K = b ? 4 : 8,
    attempt = Math.min(3, Math.floor(q * 4)),
    step = b ? 7 + Math.floor(q * 5) : Math.floor(q * 7),
    savedSlices = Array.from(
      {
        length: 4,
      },
      (_, r) =>
        Array.from(
          {
            length: 4,
          },
          (_, i) => 4 * r + i,
        ),
    ),
    destinationSlices = Array.from(
      {
        length: 8,
      },
      (_, r) => [2 * r, 2 * r + 1],
    ),
    destinationCount = b ? 8 : Math.min(8, Math.ceil(p * 8));
  const results = [true, false, true].slice(0, attempt),
    successful = results.filter(Boolean).length;
  return {
    b,
    q,
    D,
    K,
    batch: 2 * D * K,
    attempt,
    successful,
    consumed: attempt * 64,
    results,
    time: b ? 30 + q * 90 : q * 30,
    step,
    fullWeight: baseline[step].w,
    resetWeight: b ? lost[step - 7].w : null,
    tokenMean: (10 - 2 - 2 - 2) / 4,
    replicaMean: (10 - 2) / 2,
    warning: warningSeconds(state),
    savedSlices,
    destinationSlices,
    destinationCount,
    visibleDestinations: destinationSlices.slice(0, destinationCount),
  };
}
export function validateModel() {
  const run = boundary(trainingRun);
  const drill = boundary(drillRun);
  assert.deepEqual([run.saved, run.pending, run.live], [117760, 40, 117800]);
  assert.equal(boundary({ ...trainingRun, replicas: 8, rounds: 4 }).perUpdate, run.perUpdate);
  assert.equal(canFinish(120, 20, 90, 10), true);
  assert.equal(canFinish(119, 20, 90, 10), false);
  assert.equal(canFinish(59, 12, 40, 8), false);
  assert.deepEqual([drill.saved, drill.pending, drill.live], [1752, 12, 1764]);
  const reference = nextDrillGroup(drill.saved);
  assert.deepEqual(reference, [42, 17, 63, 8, 91, 34]);
  assert.equal(nextDrillGroup(drill.live).filter((id, i) => id === reference[i]).length, 0);
  assert.deepEqual(nextDrillGroup(drill.live - drill.pending), reference);
  validateTrainingExpansion();
  validateConstructions();
  assert.deepEqual(advance(saved, 5), advance(fresh, 12));
  assert(Math.abs(lost.at(-1).w - baseline[12].w) > 1e-4);
  assert.equal(
    sampleModel('replicas', {
      beat: 0,
      beatP: 1,
    }).batch,
    64,
  );
  assert.equal(
    sampleModel('replicas', {
      beat: 1,
      beatP: 1,
    }).batch,
    64,
  );
  const s = sampleModel('overflow', {
    beat: 1,
    beatP: 1,
  });
  assert.equal(s.consumed, 192);
  assert.equal(s.successful, 2);
  assert.equal(s.tokenMean, 1);
  assert.equal(s.replicaMean, 4);
  assert.equal(20 + 90 + 10, 120);
  for (const seconds of [0, 2.575, DEADLINE_WARNING_CUE.shortenAt - 0.001])
    assert.equal(
      sampleModel('deadline', {
        beat: 1,
        beatP: seconds / DEADLINE_WARNING_CUE.beatDuration,
      }).warning,
      120,
    );
  for (const seconds of [DEADLINE_WARNING_CUE.shortenAt + 0.001, 10, 21.32])
    assert.equal(
      sampleModel('deadline', {
        beat: 1,
        beatP: seconds / DEADLINE_WARNING_CUE.beatDuration,
      }).warning,
      119,
    );
  for (const beat of [0, 1])
    for (const beatP of [0.02, 0.25, 0.5, 0.75, 0.98]) {
      const s = sampleModel('moments', {
        beat,
        beatP,
      });
      assert.equal(s.fullWeight, advance(fresh, s.step).w);
      if (beat)
        assert.equal(
          s.resetWeight,
          advance(
            {
              ...saved,
              m: 0,
              v: 0,
            },
            s.step - 7,
          ).w,
        );
      else assert.equal(s.resetWeight, null);
    }
  for (const beat of [0, 1]) {
    let previous = 0;
    for (const beatP of [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]) {
      const s = sampleModel('reshard', {
          beat,
          beatP,
        }),
        coordinates = s.visibleDestinations.flat();
      assert.deepEqual(
        s.savedSlices.flat(),
        Array.from(
          {
            length: 16,
          },
          (_, i) => i,
        ),
      );
      assert.deepEqual(s.destinationSlices.flat(), s.savedSlices.flat());
      assert.equal(new Set(coordinates).size, coordinates.length);
      assert.equal(coordinates.length, 2 * s.destinationCount);
      s.visibleDestinations.forEach((slice, r) =>
        assert.deepEqual(
          slice,
          s.savedSlices[Math.floor(r / 2)].slice((r % 2) * 2, (r % 2) * 2 + 2),
        ),
      );
      assert(s.destinationCount >= previous);
      assert.equal(s.destinationCount, beat ? 8 : beatP === 0 ? 0 : Math.ceil(beatP * 8));
      previous = s.destinationCount;
    }
  }
  assert.equal(
    sampleModel('reshard', {
      beat: 0,
      beatP: 0.5,
    }).destinationCount,
    4,
  );
  assert.equal(
    sampleModel('reshard', {
      beat: 0,
      beatP: 0.98,
    }).destinationCount,
    8,
  );
  assert.equal(
    sampleModel('reshard', {
      beat: 1,
      beatP: 0,
    }).destinationCount,
    8,
  );
  return true;
}
export function validateTrainingExpansion() {
  for (const g of [-1e12, -1, -1e-30, 0, 1e-30, 1, 1e12])
    assert(Math.abs(firstAdaptiveMovement(g, 0.002, 1e-8)) <= 0.002);
  assert(Math.abs(firstAdaptiveMovement(1e-9, 0.002, 1e-8) - 0.00018181818181818183) < 1e-15);
  assert.equal(trainingMemory(70e9, 4, 24).baseFits, false);
  assert.equal(trainingMemory(70e9, 4, 48).baseFits, true);
  assert.equal(trainingMemory(70e9, 4, 48).fullTrainingFitKnown, false);
  const cues = Object.fromEntries(
    [
      'fresh-cost',
      'fresh-fails',
      'fresh-retain',
      'fresh-restore-step-2',
      'fresh-range',
      'fresh-restore-step-3',
    ].map((id) => [
      id,
      {
        phase: 'before',
        progress: 0,
      },
    ]),
  );
  assert.deepEqual(
    Object.entries(
      trainingFreshState({
        beat: 0,
        beatP: 1,
        cues,
      }),
    )
      .filter(([k]) => ['cost', 'failed', 'retained', 'count', 'range', 'owner'].includes(k))
      .map(([, v]) => v),
    [false, false, false, false, false, false],
  );
  assert.equal(
    trainingFreshState({
      beat: 1,
      beatP: 1,
      cues,
    }).count,
    false,
  );
  cues['fresh-cost'] = {
    phase: 'during',
    progress: 0.1,
  };
  assert.equal(
    trainingFreshState({
      beat: 1,
      beatP: 1,
      cues,
    }).cost,
    false,
  );
  cues['fresh-cost'] = {
    phase: 'after',
    progress: 1,
  };
  assert.equal(
    trainingFreshState({
      beat: 1,
      beatP: 1,
      cues,
    }).cost,
    true,
  );
  assert.equal(
    trainingFreshState({
      beat: 1,
      beatP: 1,
      cues,
    }).count,
    false,
  );
  const final = trainingFreshState({
    beat: 2,
    beatP: 1,
  });
  assert.equal(final.consumed, 1752);
  assert.equal(final.destinationOwner, 4);
  assert.equal(final.neededSeconds, 60);
}
