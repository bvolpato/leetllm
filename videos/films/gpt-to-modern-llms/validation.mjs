import { attention, attentionState, hidden, secondContext } from './fixtures.mjs';
import { allocationState, attentionCueState, cacheState, sampleModel } from './construction.mjs';
import {
  learningTrace,
  outputProjection,
  projectContext,
  rotaryPair,
  sharedQueryRead,
} from './model.mjs';
import {
  checkReply,
  chooseRun,
  expertInputs,
  routeExperts,
  live,
  overnight,
  largerWorker,
} from './workload.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert(Math.abs(attention.reduce((s, x) => s + x, 0) - 1) < 1e-12);
  assert.deepEqual(attentionState(0.5).vector, [0.1, 0]);
  assert.deepEqual(
    hidden.map((x) => +x.toFixed(9)),
    [0.2, 0.8],
  );
  const at = (p) => attentionCueState(1, p);
  assert.deepEqual(at(0.35).vector, [0, 0.7]);
  assert.deepEqual(at(0.58).vector, [0.1, 0.7]);
  for (let index = 0; index <= 1000; index++) {
    const progress = index / 1000,
      current = attentionCueState(1, progress);
    assert.deepEqual(
      current.vector,
      [0, 1].map((axis) => current.contributions.reduce((sum, value) => sum + value[axis], 0)),
    );
    assert.equal(current.admitted, current.fractions.filter((value) => value === 1).length);
    assert.deepEqual(attentionCueState(0, progress).vector, [0, 0]);
    assert.deepEqual(
      attentionCueState(2, progress).vector.map((x) => +x.toFixed(9)),
      [0.2, 0.8],
    );
    if (progress >= 0.81) assert.equal(current.admitted, 4);
  }
  const output = outputProjection();
  assert.deepEqual(
    output.logits.map((x) => +x.toFixed(2)),
    [0.9, 0.52, 0.06, -0.36],
  );
  assert.equal(output.selected, 'Docs');
  assert.equal(projectContext(secondContext).selected, '.');
  assert.deepEqual(checkReply(output.selected), { allowed: true, correct: true });
  assert.deepEqual(checkReply(output.selected + projectContext(secondContext).selected), {
    allowed: false,
    correct: false,
  });
  assert.deepEqual(checkReply('Bug'), { allowed: true, correct: false });
  assert.deepEqual(
    [live, overnight, largerWorker].map((limits) => chooseRun(limits).id),
    ['A', 'A', 'B'],
  );
  assert.deepEqual(
    expertInputs.map(({ logits }) =>
      routeExperts(logits).map(({ id, share }) => [id, +share.toFixed(3)]),
    ),
    [
      [
        [0, 0.87],
        [2, 0.13],
      ],
      [
        [1, 0.818],
        [2, 0.182],
      ],
    ],
  );
  assert.equal(3 * 12 * 32, 2 * 12 * 48);
  assert.equal((60e9 * 2) / 1e9, 120);
  assert.equal((47e9 * 2) / 1e9, 94);
  assert.equal((4 / (1 + Math.exp(-1))).toFixed(2), '2.92');
  const firstRead = sharedQueryRead([1, 0]),
    secondRead = sharedQueryRead([0, 1]);
  assert.deepEqual(firstRead.keys, secondRead.keys);
  assert.deepEqual(firstRead.values, secondRead.values);
  assert.equal(firstRead.output[0].toFixed(3), '1.462');
  assert.equal(firstRead.output[1].toFixed(3), '0.538');
  firstRead.output.forEach((v, i) => assert(Math.abs(v - secondRead.output[1 - i]) < 1e-12));
  const before = rotaryPair(9, 3);
  const together = rotaryPair(19, 13);
  const closer = rotaryPair(19, 16);
  assert(Math.abs(before.score - together.score) < 1e-12);
  assert.equal(before.score.toFixed(3), '0.565');
  assert.equal(closer.score.toFixed(3), '0.296');
  const trace = learningTrace();
  assert(trace[12].probabilities[0] > trace[0].probabilities[0] + 0.35);
  for (const [i, current] of trace.entries()) {
    assert(Math.abs(current.probabilities.reduce((s, x) => s + x, 0) - 1) < 1e-12);
    assert.deepEqual(outputProjection(current.weights).logits, current.logits);
    if (i) assert(current.probabilities[0] > trace[i - 1].probabilities[0]);
  }
  for (const p of [0, 0.12, 0.5, 0.88, 1]) {
    assert.equal(
      sampleModel('prompting-and-training', {
        beat: 0,
        beatP: p,
      }).learned.step,
      0,
    );
    assert.equal(
      sampleModel('prompting-and-training', {
        beat: 2,
        beatP: p,
      }).learned.step,
      12,
    );
    assert.equal(allocationState(1, p).compute, 384);
    const current = cacheState(1, p);
    assert.equal(current.scalars, current.positions * current.kvHeads * current.width * 2);
    assert(current.groups.every((x) => x >= 0 && x < current.kvHeads));
  }
  assert.equal(cacheState(0, 0).positions, 1);
  assert.deepEqual([cacheState(0, 1).scalars, cacheState(1, 1).scalars], [128, 32]);
  assert.equal(
    sampleModel('task-interfaces', {
      beat: 1,
      beatP: 0.88,
    }).row,
    2,
  );
  return true;
}
