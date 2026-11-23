import {
  actionMeanNll,
  admissionReceipt,
  advantages,
  fleetReady,
  maskedNll,
  ppoReceipt,
  scalarResume,
  stampTurnRewards,
} from './arithmetic.mjs';
import { mask, trace } from './fixtures.mjs';
import { restoreProbe, sampleModel } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateSkyChapters();
  assert.deepEqual(
    sampleModel('group', {
      beat: 2,
      beatP: 0,
      cues: {
        'group-equal-rewards': {
          phase: 'after',
          progress: 1,
        },
      },
    }).centered,
    [0, 0, 0, 0],
  );
  assert.deepEqual(restoreProbe(1).reference, restoreProbe(1).restored);
  assert.equal(restoreProbe(1).reference.weight, 0.98);
  assert.deepEqual(restoreProbe(0.49).reference, {
    weight: 1,
    velocity: 0,
    step: 10,
  });
  assert.deepEqual(restoreProbe(0.5).reference, {
    weight: 0.98,
    velocity: 0.2,
    step: 11,
  });
  assert.equal(maskedNll([-0.2, -0.4, 0, -0.6, -0.8]), 0.5);
  assert.equal(maskedNll([-0.2, -0.4, NaN, -0.6, -0.8]), 0.5);
  assert(Math.abs(maskedNll([-0.2, -0.4, 0, -0.6, -1.2]) - 0.6) < 1e-12);
  assert.deepEqual(advantages([1, 0, 1, 0]).centered, [0.5, -0.5, 0.5, -0.5]);
  assert.deepEqual(advantages([1, 1, 1, 1]).centered, [0, 0, 0, 0]);
  trace.forEach((row) => {
    assert(row.accepted + row.running <= 2 + row.step);
    assert(row.accepted - row.step + 1 + row.running <= 3);
  });
  assert.equal(trace.at(-1).step - trace.at(-1).scheduled, 3);
  for (let b = 0; b < 3; b++) {
    const s = sampleModel('filter', {
      beat: b,
      beatP: 0,
    });
    assert(s.accepted + s.running <= s.limit);
    assert.equal(s.submitted, s.accepted + s.running + s.filtered);
  }
  assert.equal(
    sampleModel('replicas', {
      beat: 1,
      beatP: 0,
    }).resume,
    false,
  );
  assert.equal(
    sampleModel('replicas', {
      beat: 2,
      beatP: 0,
    }).resume,
    true,
  );
  return true;
}
export function validateSkyChapters() {
  assert.equal(actionMeanNll([-0.2, -0.4, NaN, -0.6, -0.8], mask), 0.5);
  assert.deepEqual(
    stampTurnRewards(
      [
        [-0.2, 1],
        [1, 4],
      ],
      4,
    ),
    [0, -0.2, 0, 0],
  );
  assert.deepEqual(
    stampTurnRewards(
      [
        [-0.2, 1],
        [1, 4],
      ],
      6,
      {
        eos: true,
      },
    ),
    [0, -0.2, 0, 0, 0, 1],
  );
  assert.equal(ppoReceipt(0.5, -0.5).surrogate, -0.4);
  assert.equal(
    admissionReceipt({
      B: 2,
      S: 1,
      step: 7,
      accepted: 13,
      running: 2,
      workers: 4,
    }).outstanding,
    3,
  );
  assert.equal(fleetReady([19, 19, 19], 19, true, [true, true, false]), false);
  assert(
    Math.abs(
      scalarResume(
        {
          weight: 2,
          velocity: 0.4,
        },
        -0.25,
      ).weight - 1.995,
    ) < 1e-12,
  );
  return true;
}
