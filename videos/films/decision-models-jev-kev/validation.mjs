import { confidence, softmax } from './arithmetic.mjs';
import {
  ASSERTION_TICKETS,
  FOUR_CHOICE_POLICY,
  RELEASE_CASES,
  RELEASE_POLICY,
  confidenceCue,
  p,
  pointer,
  records,
  updated,
  z,
} from './fixtures.mjs';
import {
  optionRemovalSnapshot,
  pointerProjectionSnapshot,
  releaseRoutingSnapshot,
  removalBeatSeconds,
  report,
  routeScoredChoice,
  sampleModel,
  updateSnapshot,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateRiskCues() {
  const before = sampleModel('risk', {
    beat: 1,
    beatP: confidenceCue - 1e-6,
  });
  const after = sampleModel('risk', {
    beat: 1,
    beatP: confidenceCue,
  });
  assert.equal(before.field, 'p_max');
  assert.equal(before.gate.accepted.length, 4);
  assert.equal(before.gate.coverage, 0.5);
  assert.equal(before.gate.risk, 0.25);
  assert(before.gate.accepted.some((r) => r.p === 0.86));
  assert.equal(after.field, 'confidence');
  assert.equal(after.gate.accepted.length, 3);
  assert.equal(after.gate.coverage, 3 / 8);
  assert.equal(after.gate.risk, 1 / 3);
  assert(!after.gate.accepted.some((r) => r.p === 0.86));
  assert.equal(after.gate.errors, before.gate.errors);
  for (const seconds of [3.45, 4.5125, 9.9, 19.344]) {
    const current = sampleModel('risk', {
      beat: 1,
      beatP: seconds / (19.344 + 0.8),
    });
    assert.equal(current.field, 'confidence');
    assert.deepEqual(current.gate, after.gate);
  }
  const probabilityPhrase = sampleModel('risk', {
    beat: 1,
    beatP: 1.425 / (19.344 + 0.8),
  });
  assert.deepEqual(probabilityPhrase.gate, before.gate);
  assert.equal(
    sampleModel('risk', {
      beat: 0,
      beatP: 0.99,
    }).field,
    'p_max',
  );
  for (let i = 0; i <= 100; i++) {
    const current = sampleModel('risk', {
      beat: 1,
      beatP: i / 100,
    });
    const accepted = records.filter(
      (r) => (current.field === 'confidence' ? confidence(r.p) : r.p) >= 0.8,
    );
    assert.deepEqual(current.gate.accepted, accepted);
    assert.equal(current.gate.coverage, accepted.length / records.length);
    assert.equal(current.gate.risk, accepted.filter((r) => !r.correct).length / accepted.length);
  }
}
export function validateReleaseRouting() {
  assert(Object.isFrozen(RELEASE_POLICY));
  const low = routeScoredChoice(RELEASE_CASES[0]),
    high = routeScoredChoice(RELEASE_CASES[1]);
  assert.equal(low.route, 'human-review');
  assert.equal(high.route, 'investigation');
  assert.equal(low.value, confidence(0.65));
  assert.equal(high.value, confidence(0.9));
  assert.equal(low.cutoff, 0.8);
  assert.equal(high.cutoff, 0.8);
  assert.equal(high.actionAuthorized, false);
  assert.equal(high.effects, 0);
  assert.equal(
    routeScoredChoice({
      choice: 'invented',
      p: 0.99,
    }).route,
    'human-review',
  );
  assert.equal(
    routeScoredChoice({
      choice: 'B',
      p: NaN,
    }).valid,
    false,
  );
  for (const progress of [0, 0.2, 0.45, 0.7, 1]) {
    const state = releaseRoutingSnapshot({
      beat: 1,
      cues: {
        'release-b2-1': {
          phase: 'during',
          progress,
        },
      },
    });
    assert.equal(state.record.id, 'R-high');
    assert.equal(state.gateProcessed, progress >= 0.45);
    assert.equal(state.delivered, progress === 1);
    assert.equal(state.lowDelivered, true);
    assert.equal(state.record.actionAuthorized, false);
  }
  const before = releaseRoutingSnapshot({
    beat: 1,
    cues: {
      'release-b2-1': {
        phase: 'before',
        progress: 0,
      },
      'release-b1-1': {
        phase: 'after',
        progress: 1,
      },
    },
  });
  assert.equal(before.record.id, 'R-low');
  assert.equal(before.delivered, true);
}
export function validateModel() {
  const [review, queue] = ASSERTION_TICKETS.map((ticket) =>
    routeScoredChoice(ticket, FOUR_CHOICE_POLICY),
  );
  assert(Math.abs(review.value - 0.6) < 1e-12);
  assert(Math.abs(queue.value - 0.68) < 1e-12);
  assert.equal(review.route, 'human-review');
  assert.equal(queue.route, 'investigation');
  assert.equal(queue.actionAuthorized, false);
  assert.equal(queue.effects, 0);
  validateReleaseRouting();
  assert.equal(updateSnapshot(1, 8 / 22.88).amount, 1);
  assert(updateSnapshot(1, 8 / 22.88).scores[1] > z[1]);
  assert(updateSnapshot(1, 8 / 22.88).scores[0] < z[0]);
  assert.equal(optionRemovalSnapshot(3 / removalBeatSeconds).removed, true);
  assert.equal(optionRemovalSnapshot(5 / removalBeatSeconds).normalized, false);
  assert.equal(optionRemovalSnapshot(6 / removalBeatSeconds).normalized, true);
  validateRiskCues();
  assert.equal(pointerProjectionSnapshot(0, 1).count, 0);
  assert.equal(pointerProjectionSnapshot(1, 0.3).count, 1);
  assert.equal(pointerProjectionSnapshot(1, 0.9).count, 3);
  assert(Math.abs(p[1] - 0.24472847105479764) < 1e-12);
  assert(softmax(updated)[1] > p[1]);
  assert(Math.abs(-Math.log(p[1]) - 1.4076059644443804) < 1e-12);
  assert(Math.abs(pointer[1] - Math.sqrt(2)) < 1e-12);
  assert.equal(softmax(pointer).indexOf(Math.max(...softmax(pointer))), 1);
  assert(softmax(pointer, 2)[1] < softmax(pointer)[1]);
  assert.equal(report((p) => p, 0.8).accepted.length, 4);
  assert.equal(report(confidence, 0.8).accepted.length, 3);
  assert.equal(report((p) => p, 0.8).risk, 0.25);
  assert.equal(report(confidence, 0.8).risk, 1 / 3);
  assert.equal(report((p) => p, 1).risk, null);
  let previous = 1;
  for (const beat of [0, 1])
    for (const beatP of [0.02, 0.25, 0.5, 0.75, 0.98]) {
      const s = sampleModel('temperature', {
        beat,
        beatP,
      });
      assert(s.temperature >= previous);
      if (beat) assert.equal(s.temperature, 2);
      assert.deepEqual(s.pointerP, softmax(pointer, s.temperature));
      assert.equal(s.pointerP.indexOf(Math.max(...s.pointerP)), 1);
      previous = s.temperature;
    }
  assert(
    sampleModel('temperature', {
      beat: 0,
      beatP: 0.5,
    }).temperature > 1,
  );
  return true;
}
