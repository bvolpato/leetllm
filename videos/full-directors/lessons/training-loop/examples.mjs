import assert from 'node:assert/strict';
import { oneTrainingStep, fitHistory, LOOP_BIGRAM } from '../../../films/training-loop/model.mjs';
import {
  loopMomentum,
  loopMicrobatch,
  epochMean,
  loopClip,
  loopAmpOrder,
} from '../../../films/training-loop/arithmetic.mjs';
import {
  measuredValidation,
  fitInputs,
  fitTargets,
} from '../../../films/training-loop/fixtures.mjs';
import { cue, finish, spokenProgress } from './bench.mjs';

export {
  fitHistory,
  LOOP_BIGRAM,
  loopMomentum,
  loopMicrobatch,
  epochMean,
  loopClip,
  loopAmpOrder,
  measuredValidation,
};
export const batch = oneTrainingStep();
export const tickets = [0, 1, 2, 4, 5, 6].map((index, i) => ({
  id: 101 + i,
  x: fitInputs[index],
  target: fitTargets[index],
}));
export const lossRows = [
  [2, -1],
  [-0.5, 1.5],
].map((logits, i) => {
  const exp = logits.map((v) => Math.exp(v - Math.max(...logits))),
    z = exp[0] + exp[1];
  const p = exp.map((v) => v / z);
  return { logits, p, loss: -Math.log(p[i]) };
});
export function forward(w, features) {
  const scores = w.map((row) => row.reduce((sum, v, j) => sum + v * features[j], 0));
  const gap = scores[1] - scores[0];
  return { scores, gap, route: gap > 0 ? 'Escalation' : 'Standard', p: 1 / (1 + Math.exp(-gap)) };
}
export function opening(k) {
  const grad = cue(k, 2, 'The gradient buffer fills'),
    stepped = cue(k, 4, 'The weights change');
  const rescored = cue(k, 4, 'Escalation wins');
  const weights = stepped ? batch.updated : batch.weights;
  return {
    weights,
    gradient: grad ? batch.gradient : null,
    scored: forward(rescored ? weights : batch.weights, [1, 1]),
    stepped,
    rescored,
  };
}
export function nextUpdate(weights) {
  const examples = [
    { x: [1, 1], y: 1 },
    { x: [-1, -1], y: 0 },
  ];
  const predictions = examples.map((t) => forward(weights, t.x));
  return weights.map((row, i) =>
    row.map((w, j) => {
      const grad = examples.reduce((sum, { x, y }, r) => {
        const p = i ? predictions[r].p : 1 - predictions[r].p;
        return sum + ((p - Number(y === i)) * x[j]) / examples.length;
      }, 0);
      return w - 0.2 * grad;
    }),
  );
}
export const savedWeights = JSON.parse(JSON.stringify(batch.updated));
export const stale = [
    [-1, -1],
    [1, 1],
  ],
  held = [1.5, 1];
export function ending(k) {
  const replay = cue(k, 6, 'Rewind to the same'),
    cleared = cue(k, 6, 'Now run backward');
  const added = replay ? cue(k, 6, 'The held out ticket stays') : cue(k, 3, 'Subtract those');
  const stepped = replay
    ? cue(k, 7, 'On the same held out ticket')
    : cue(k, 3, 'Score the held out ticket');
  const read = replay ? cue(k, 7, 'Mark the new route') : finish(k, 3);
  const before = cleared ? null : stale;
  const grad = added
    ? batch.gradient.map((row, i) => row.map((v, j) => v + (before?.[i][j] ?? 0)))
    : before;
  const weights = stepped ? grad.map((row) => row.map((v) => -0.2 * v)) : batch.weights;
  const scored = read ? forward(weights, held) : null;
  const old = replay
    ? forward(
        stale.map((row, i) => row.map((v, j) => -0.2 * (v + batch.gradient[i][j]))),
        held,
      )
    : null;
  return { replay, cleared, added, stepped, read, before, grad, weights, scored, old };
}
export function checkpoint(k) {
  const failure = cue(k, 5, 'Try a separate save'),
    firstSave = cue(k, 3, 'On a first save') && !cue(k, 4, 'On Linux');
  const replaced = !failure && spokenProgress(k, 3, 'replace the live path') === 1;
  const failed = cue(k, 5, 'Open the live name again');
  const staged = failure
    ? Math.floor(2 * cue(k, 5, 'The writer fails', 0.8))
    : Math.min(4, Math.floor(4 * cue(k, 1, 'Write the new model', 2.2)));
  const flushed = !failure && cue(k, 2, 'then sync');
  const synced = !failure && cue(k, 2, 'All of the new data');
  return {
    failure,
    failed,
    firstSave,
    replaced,
    staged,
    flushed,
    synced,
    dirSynced: !failure && cue(k, 4, 'Check the storage contract'),
    live: replaced ? 81 : 80,
  };
}
export const entropy = (counts) => {
  const n = counts.reduce((a, b) => a + b, 0);
  return counts.reduce((s, c) => c ? s - (c / n) * Math.log(c / n) : s, 0);
};
export const trainingChars = LOOP_BIGRAM.chars.filter(
  (_, i) => LOOP_BIGRAM.totals[i] > 0 || LOOP_BIGRAM.counts.some((row) => row[i] > 0),
);
export const successors = ['A', 'A', 'A', 'B'];
export const successorCounts = ['A', 'B'].map((letter) => successors.filter((s) => s === letter).length);
export function exampleCheck() {
  assert.deepEqual(batch.gradient, [
    [0.5, 0.5],
    [-0.5, -0.5],
  ]);
  assert.deepEqual(batch.updated, [
    [-0.1, -0.1],
    [0.1, 0.1],
  ]);
  assert.deepEqual(forward(batch.weights, [1, 1]).scores, [0, 0]);
  assert.equal(forward(batch.updated, [1, 1]).gap, 0.4);
  assert.equal(lossRows[0].loss.toFixed(6), '0.048587');
  assert.equal(lossRows[1].loss.toFixed(6), '0.126928');
  assert.deepEqual(
    tickets.map((t) => t.target),
    [0, 0, 0, 1, 1, 1],
  );
  assert.equal(epochMean([0.2, 0.5], [4, 2]), 0.3);
  assert.deepEqual(loopMicrobatch(true).gradient, [0.75, 0.5]);
  assert.deepEqual(loopMicrobatch(false).gradient, [2 / 3, 0.5]);
  assert.equal(loopMomentum(1, null).weight, 0.9);
  assert.equal(loopMomentum(1, 0).weight, 0.81);
  assert.equal(loopMomentum(1, -1).weight, 0.91);
  assert.equal(loopMomentum(0, -1).weight, 1);
  assert.equal(fitHistory[0].loss.toFixed(4), '0.6521');
  assert.equal(fitHistory[120].loss.toFixed(4), '0.0056');
  assert.equal(fitHistory[120].correct, 8);
  assert.equal(measuredValidation.bestEpoch, 60);
  assert.deepEqual(loopClip([6, 8], 5).gradient, [3, 4]);
  assert.equal(loopAmpOrder().wrongNorm, 0.25);
  assert.equal(loopAmpOrder().correctNorm, 2);
  assert.equal(LOOP_BIGRAM.bestStep, 111);
  assert.equal(LOOP_BIGRAM.unseen, 24);
  assert.equal(LOOP_BIGRAM.validationPairs, 75);
  assert.equal(LOOP_BIGRAM.floor.toFixed(3), '1.015');
  assert.deepEqual(successorCounts, [3, 1]);
  assert.equal(entropy(successorCounts).toFixed(3), '0.562');
  assert.equal(entropy([4, 0]), 0);
  assert.equal(LOOP_BIGRAM.chars.length, 21);
  assert.equal(trainingChars.length, 16);
  for (const chars of [LOOP_BIGRAM.chars, trainingChars]) {
    assert.ok(chars.includes('t') && chars.includes('h'));
  }
  assert.notEqual(savedWeights, batch.updated);
  assert.deepEqual(nextUpdate(savedWeights), nextUpdate(batch.updated));
  assert.equal(nextUpdate(savedWeights)[1][0].toFixed(3), '0.180');
  const clock = (b, spoken = [], done = false) => ({
    beat: { beatIndex: b - 1 },
    reveal: (phrase) => Number(spoken.includes(phrase)),
    wordCue: () => ({ start: 0, end: 1 }),
    elapsed: Number(done),
    speechDuration: 1,
  });
  const pending = opening(clock(2, ['The gradient buffer fills']));
  assert.deepEqual(pending.gradient, batch.gradient);
  assert.deepEqual(pending.weights, batch.weights);
  assert.equal(pending.scored.gap, 0);
  const ready = checkpoint(clock(2, ['then sync', 'All of the new data']));
  assert.equal(ready.staged, 4);
  assert.ok(ready.synced);
  assert.equal(ready.live, 80);
  assert.equal(checkpoint(clock(3, ['Still eighty'])).live, 80);
  assert.equal(checkpoint(clock(3, ['replace the live path'])).live, 81);
  assert.equal(checkpoint(clock(5, ['Try a separate save'])).live, 80);
  const first = ending(clock(4)),
    rewound = ending(clock(6, ['Rewind to the same'])),
    cleared = ending(clock(6, ['Rewind to the same', 'Now run backward'])),
    last = ending(clock(8));
  assert.equal(first.scored.gap, -0.5);
  assert.deepEqual(rewound.grad, stale);
  assert.deepEqual(rewound.weights, batch.weights);
  assert.equal(cleared.grad, null);
  assert.equal(cleared.scored, null);
  assert.deepEqual(last.grad, batch.gradient);
  assert.equal(last.scored.gap, 0.5);
  assert.equal(Math.round(last.scored.p * 100), 62);
  assert.equal(Math.round(first.scored.p * 100), 38);
}
