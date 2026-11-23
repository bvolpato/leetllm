import { kl } from './arithmetic.mjs';
import {
  INITIAL,
  LEARNING_CUES,
  POLICY_STUDENT,
  POLICY_TEACHER,
  RELEASE_CANDIDATES,
  TEACHER,
} from './fixtures.mjs';
import {
  jointFixture,
  learningSnapshot,
  objectiveSnapshot,
  policySelection,
  prefixSnapshot,
  projectionFixture,
  releaseChecks,
  studentTrace,
} from './model.mjs';
import assert from 'node:assert/strict';
import { stableSoftmax, entropy } from 'vizmatic';
export function validateModel() {
  assert.equal(kl([0.5, 0.5], [1, 0]), Infinity);
  assert(Math.abs(kl([1, 0], [0.5, 0.5]) - Math.log(2)) < 1e-12);
  assert.equal(kl([1, 0], [1, 0]), 0);
  assert.equal(projectionFixture(0).sse, 2);
  assert(projectionFixture(1).sse < 1e-28);
  assert.deepEqual(projectionFixture(0).gradient[1], [-2, -4]);
  assert(Math.abs(projectionFixture(1, true).sse - 1.48) < 1e-12);
  assert.equal(kl(POLICY_TEACHER, POLICY_STUDENT), 0);
  assert.deepEqual(
    policySelection().map((row) => row.outcome),
    ['keep', 'skip', 'reject'],
  );
  assert.deepEqual(RELEASE_CANDIDATES.map(releaseChecks), [
    { accuracy: true, policy: false, latency: true, cost: true },
    { accuracy: true, policy: true, latency: true, cost: true },
  ]);
  assert(Math.abs(jointFixture().forward - 0.5054993671264424) < 1e-7);
  assert(Math.abs(jointFixture().reverse - 0.5308811775736597) < 1e-7);
  const trace = studentTrace();
  assert(trace.at(-1).loss < trace[0].loss / 20);
  for (let i = 1; i < trace.length; i++) assert(trace[i].loss <= trace[i - 1].loss + 1e-12);
  assert(Math.abs(kl(stableSoftmax(TEACHER), stableSoftmax(TEACHER))) < 1e-12);
  assert(entropy(stableSoftmax(TEACHER, 5)) > entropy(stableSoftmax(TEACHER, 1)));
  assert(Math.abs(stableSoftmax(TEACHER).reduce((a, b) => a + b, 0) - 1) < 1e-12);
  assert.equal(objectiveSnapshot(0, 0).total, 0);
  assert(objectiveSnapshot(0, 0.5).total > objectiveSnapshot(1, 1).total);
  assert.equal(objectiveSnapshot(0, 1).total, objectiveSnapshot(1, 1).total);
  assert(
    Math.abs(objectiveSnapshot(2, 0).total - kl(stableSoftmax(TEACHER), stableSoftmax(INITIAL))) <
      1e-12,
  );
  assert.equal(objectiveSnapshot(1, 0).count, 4);
  assert(objectiveSnapshot(1, 0).terms[2] < 0);
  assert(objectiveSnapshot(1, 0).terms[3] < 0);
  const before = learningSnapshot(2, 0),
    finished = learningSnapshot(2, 1);
  assert(before.gradient > 0);
  assert(before.base.probs[2] > stableSoftmax(TEACHER)[2]);
  for (const seconds of [0, 0.1125, 2.3125, 4.05, 7.5]) {
    const frame = learningSnapshot(2, seconds / LEARNING_CUES.predictionBeatDuration);
    assert.deepEqual(frame.current.logits, before.current.logits);
    assert.equal(frame.showGradient, false);
  }
  assert.equal(
    learningSnapshot(2, 8.925 / LEARNING_CUES.predictionBeatDuration).showGradient,
    true,
  );
  assert.deepEqual(learningSnapshot(1, 1).current.logits, before.current.logits);
  assert.deepEqual(learningSnapshot(1, 0).current.logits, learningSnapshot(0, 1).current.logits);
  assert(
    Math.abs(finished.current.logits[2] - (before.current.logits[2] - 0.8 * before.gradient)) <
      1e-12,
  );
  assert(finished.current.logits[2] < before.current.logits[2]);
  assert(finished.current.loss < before.current.loss);
  for (let i = 0; i <= 100; i++) {
    const f = learningSnapshot(2, i / 100);
    assert(Math.abs(f.current.probs.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    assert(f.current.probs.every((p) => p > 0));
  }
  assert.equal(prefixSnapshot(0, 0).referenceCount, 0);
  assert.deepEqual(prefixSnapshot(0, 1).reference, ['bird', 'in', 'the', 'garden']);
  assert.deepEqual(prefixSnapshot(1, 1).visited, ['dog', 'near', 'the', 'gate']);
  assert.equal(prefixSnapshot(1, 5.5 / 15.288).feedback, 0);
  for (const values of [prefixSnapshot(2, 0).referenceTeacher, prefixSnapshot(2, 0).visitedTeacher])
    assert.equal(
      values.reduce((a, b) => a + b, 0),
      1,
    );
  assert.deepEqual(prefixSnapshot(1, 1).visited, prefixSnapshot(2, 0).visited);
  return true;
}
