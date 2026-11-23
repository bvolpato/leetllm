import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import {
  draw,
  logitConversionFrame,
  overflowRepairFrame,
  bestOfNFrame,
  mctsBackupFrame,
  stablePolicy,
} from '../animations/beam-search.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();
const root = fileURLToPath(new URL('../../', import.meta.url));
const lesson = await readLesson(
  new URL('../lessons/beam-search.lesson.yaml', import.meta.url),
  root,
);
const canvas = createCanvas(1920, 1080);
function paint(id, beat, progress) {
  const scene = lesson.scenes.find((s) => s.id === id),
    state = {
      t: 20,
      beat,
      beatP: 0.9,
      opacity: 1,
      cues: {
        [`${id}-build-${beat}`]: {
          progress,
          phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
          active: false,
          strength: 0,
          targets: [],
        },
      },
    };
  return drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
}

test('the original score row keeps its input meaning before any maximum subtraction', () => {
  const audit = paint('logit-shift', 0, 0);
  assert(
    !audit.labels.some((l) => l.text === 'shifted score'),
    'unshifted inputs must not claim to be shifted',
  );
  for (const input of ['3.000', '2.500', '1.000', '-1.000'])
    assert(audit.labels.some((l) => l.text === input));
});

test('the repaired overflow paths retain actual shifted inputs before exponentiation', () => {
  const audit = paint('logit-boundaries', 0, 1);
  for (const value of ['0', '-1', '-2'])
    assert(
      audit.labels.some((l) => l.text.replaceAll('−', '-') === value && l.y > 500 && l.y < 700),
      `missing owned shifted input ${value}`,
    );
  assert.deepEqual(layoutIssues(audit), []);
});

test('Best-of-N withholds its evaluator winner until the scores support that choice', () => {
  const before = paint('best-of-n', 0, 0);
  assert(
    !before.labels.some((l) => /Outcome maximum selects A/.test(l.text)),
    'unknown scores cannot already select A',
  );
  const after = paint('best-of-n', 0, 1);
  assert(after.labels.some((l) => l.text === '0.96'));
  assert(after.labels.some((l) => /Outcome maximum selects A/.test(l.text)));
  assert.deepEqual(layoutIssues(after), []);
});

test('the completed MCTS backup updates the active child and its displayed parent', () => {
  const audit = paint('thought-search', 2, 1);
  assert(
    audit.labels.some((l) => /visits 3/.test(l.text) && l.x > 1000 && l.y > 500 && l.y < 820),
    'the active B panel must increment its visits',
  );
  assert(
    audit.labels.some((l) => /Parent.*visits 11/.test(l.text)),
    'the displayed ancestor must receive the same completed backup',
  );
  assert(
    audit.labels.some((l) => /7\/15/.test(l.text) && l.x > 1000 && l.y > 500 && l.y < 820),
    'the active B panel must show its updated mean',
  );
  assert.deepEqual(layoutIssues(audit), []);
});

const near = (a, b) => assert(Math.abs(a - b) < 1e-12, `${a} differs from ${b}`);
const cueState = (id, beat, progress) => ({
  beat,
  beatP: 0.9,
  cues: { [`${id}-build-${beat}`]: { progress } },
});
test('every revealed exponential is computed from a completed maximum subtraction and totals wait for the complete row', () => {
  for (let k = 0; k <= 100; k++) {
    const frame = logitConversionFrame(cueState('logit-shift', 1, k / 100));
    frame.inputs.forEach((input, i) => near(frame.shifted[i], input - frame.removedOffset));
    if (frame.weightsVisible) {
      assert.equal(frame.subtraction, 1);
      frame.weights.forEach((value, i) => near(value, Math.exp(frame.shifted[i])));
    }
    assert.equal(frame.total !== null, frame.weightsVisible === 4);
    if (frame.total !== null)
      near(
        frame.total,
        frame.weights.reduce((a, b) => a + b, 0),
      );
    if (frame.probabilitiesVisible) assert.equal(frame.weightsVisible, 4);
  }
  const end = logitConversionFrame(cueState('logit-shift', 1, 1));
  assert.deepEqual(end.shifted, [0, -0.5, -2, -4]);
  assert.equal(end.probabilitiesVisible, 4);
  end.probabilities.forEach((value, i) => near(value, end.weights[i] / end.total));
});
test('separate measured operation cues cannot exponentiate before subtraction or normalize before all weights exist', () => {
  const state = {
    beat: 1,
    beatP: 0.9,
    cues: {
      'logit-shift-subtract': { progress: 0.5 },
      'logit-shift-exponentiate': { progress: 1 },
      'logit-shift-normalize': { progress: 1 },
    },
  };
  assert.equal(logitConversionFrame(state).weightsVisible, 0);
  assert.equal(logitConversionFrame(state).probabilitiesVisible, 0);
  state.cues['logit-shift-subtract'].progress = 1;
  state.cues['logit-shift-exponentiate'].progress = 0.5;
  const partial = logitConversionFrame(state);
  assert.equal(partial.weightsVisible, 2);
  assert.equal(partial.total, null);
  assert.equal(partial.probabilitiesVisible, 0);
});
test('the overflow control remains nonfinite while the repaired owned path uses exact finite shifted values', () => {
  for (let k = 0; k <= 100; k++) {
    const frame = overflowRepairFrame(cueState('logit-boundaries', 0, k / 100));
    assert(frame.rawWeights.every((value) => value === Infinity));
    frame.shifted.forEach((value, i) => assert.equal(value, frame.inputs[i] - frame.maximum));
    if (frame.weightsVisible) assert.equal(frame.shiftedVisible, 3);
    frame.weights.forEach((value, i) => near(value, Math.exp(frame.shifted[i])));
  }
  assert.deepEqual(overflowRepairFrame(cueState('logit-boundaries', 0, 1)).shifted, [0, -1, -2]);
});
test('the outcome decision follows all supplied scores rather than a generator log-score preference', () => {
  for (const p of [0, 0.1, 0.5, 0.75, 0.999])
    assert.equal(bestOfNFrame(cueState('best-of-n', 0, p)).winner, null);
  const end = bestOfNFrame(cueState('best-of-n', 0, 1));
  assert.equal(end.known, 3);
  assert.equal(end.winner, end.candidates.reduce((a, b) => (a.score > b.score ? a : b)).id);
  assert.equal(end.candidates.reduce((a, b) => (a.log > b.log ? a : b)).id, 'B');
});
test('one rollout adds one child and one ancestor visit, with no selection score during a partial backup', () => {
  const before = mctsBackupFrame(cueState('thought-search', 2, 0));
  assert.deepEqual(
    before.nodes.map((n) => n.visits),
    [8, 2],
  );
  near(before.parent.mean, 0.44);
  const between = mctsBackupFrame(cueState('thought-search', 2, 0.5));
  assert(between.childUpdated && !between.parentUpdated);
  assert(between.nodes.every((n) => n.selectionScore === null));
  const after = mctsBackupFrame(cueState('thought-search', 2, 1)),
    a = after.nodes[0],
    b = after.nodes[1];
  assert.deepEqual(
    after.nodes.map((n) => n.visits),
    [8, 3],
  );
  near(b.rewardSum, 1.4);
  near(b.mean, 7 / 15);
  near(a.mean, 0.4);
  assert.equal(after.parent.visits, a.visits + b.visits);
  near(after.parent.rewardSum, a.rewardSum + b.rewardSum);
  near(after.parent.mean, 4.6 / 11);
  after.nodes.forEach((n) => near(n.selectionScore, n.mean + Math.sqrt(Math.log(11) / n.visits)));
});

test('intermediate native backup frames keep the reward path drawable and the child/parent status explicit', () => {
  for (const progress of [0.1, 0.3, 0.5, 0.7, 0.9]) {
    const audit = paint('thought-search', 2, progress);
    assert.deepEqual(layoutIssues(audit), [], `backup ${progress}`);
    const model = mctsBackupFrame(cueState('thought-search', 2, progress));
    assert(audit.labels.some((l) => l.text === `B · visits ${model.nodes[1].visits}`));
    if (model.childUpdated && !model.parentUpdated)
      assert(audit.labels.some((l) => l.text === 'Selection waits for the parent update'));
  }
});
