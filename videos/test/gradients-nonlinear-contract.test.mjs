import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import {
  NONLINEAR_START,
  hiddenUnit,
  hiddenStep,
  nonlinearPredictionState,
  batchGradientState,
  BATCH_HISTORY,
  reluBranchState,
  reluCornerDifference,
  draw,
} from '../animations/gradients-backprop.mjs';
registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname,
  lesson = await readLesson(root + 'videos/lessons/gradients-backprop.lesson.yaml', root),
  near = (a, b) => assert(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
test('the four-knob reverse walk agrees with independent smooth-point central differences', () => {
  const s = hiddenUnit();
  assert.deepEqual(s.gradient, [-4, -2, -2, -1]);
  near(s.loss, 0.25);
  for (let i = 0; i < 4; i++) {
    const a = [...NONLINEAR_START],
      z = [...a],
      h = 1e-5;
    a[i] += h;
    z[i] -= h;
    const finite = (hiddenUnit(a).loss - hiddenUnit(z).loss) / (2 * h);
    assert(Math.abs(finite - s.gradient[i]) < 1e-7);
  }
  assert.deepEqual(NONLINEAR_START, [1.5, -1, 2, 0.5]);
});
test('rate comparisons reset the same origin and the changed request earns a distinct update', () => {
  const high = hiddenStep(0.05),
    low = hiddenStep(0.025),
    fresh = hiddenStep(0.05, 1, 2);
  near(high.after.prediction, 5.8);
  near(high.after.loss, 0.64);
  near(low.after.prediction, 5.1375);
  near(low.after.loss, 0.01890625);
  assert.deepEqual(high.before.weights, low.before.weights);
  assert.deepEqual(fresh.before.gradient, [-2, -2, -0.5, -1]);
  near(fresh.after.prediction, 1.9675);
  near(fresh.after.loss, 0.00105625);
});
test('an inactive hidden gate blocks upstream derivatives without blocking the output bias', () => {
  const s = hiddenUnit([1.5, -4, 2, 0.5]);
  near(s.h, -1);
  near(s.loss, 20.25);
  assert.deepEqual(
    s.gradient.map((x) => (x === 0 ? 0 : x)),
    [0, 0, 0, -9],
  );
  const branch = reluBranchState(-0.5);
  near(branch.promptGradient, 0);
  assert.equal(branch.queueGradient, -6);
  assert.equal(branch.loss, 9);
});
test('the corner has incompatible one-sided slopes and a different centered probe', () => {
  const s = reluCornerDifference(0.001);
  near(s.left, 0);
  near(s.right, -11.996);
  near(s.center, -5.998);
  assert.notEqual(s.center, 0);
  assert.throws(() => reluCornerDifference(0), RangeError);
});
test('the full row mean and complete101-update trajectory come from the retained paired requests', () => {
  const s = batchGradientState();
  assert.equal(s.loss, 43.375);
  assert.deepEqual(
    s.rows.map((r) => r.gradient),
    [
      [-5, -2.5],
      [-20, -10],
      [-39, -6.5],
      [-80, -40],
    ],
  );
  assert.deepEqual(s.gradient, [-36, -14.75]);
  near(BATCH_HISTORY[1].weights[0], 1.08);
  near(BATCH_HISTORY[1].weights[1], 0.4425);
  assert.equal(BATCH_HISTORY.at(-1).step, 101);
  assert(BATCH_HISTORY.at(-1).loss < 0.001);
  for (let i = 1; i < BATCH_HISTORY.length; i++)
    assert(BATCH_HISTORY[i].loss < BATCH_HISTORY[i - 1].loss);
});
test('the fresh answer and update remain hidden until their actual declared voice cues finish', () => {
  const before = { phase: 'before', progress: 0 },
    after = { phase: 'after', progress: 1 },
    held = nonlinearPredictionState(1, 0.99, {
      'fresh-hidden-forward': before,
      'fresh-hidden-gradient': before,
    });
  assert.equal(held.showForward, false);
  assert.equal(held.showGradient, false);
  const shown = nonlinearPredictionState(1, 0.01, {
    'fresh-hidden-forward': after,
    'fresh-hidden-gradient': after,
  });
  assert.equal(shown.showForward, true);
  assert.equal(shown.showGradient, true);
  assert.deepEqual(shown.weights, NONLINEAR_START);
  const moving = nonlinearPredictionState(2, 0.99, {
    'fresh-hidden-update': { phase: 'during', progress: 0.5 },
    'fresh-hidden-result': before,
  });
  assert.equal(moving.update, 0.5);
  assert.equal(moving.showAfter, false);
  near(moving.weights[0], 1.55);
  const completed = nonlinearPredictionState(2, 0.01, {
    'fresh-hidden-update': after,
    'fresh-hidden-result': after,
  });
  assert.equal(completed.showAfter, true);
  near(hiddenUnit(completed.weights, 1, 2).loss, 0.00105625);
});
function frame(id, beat, beatP, cues) {
  const canvas = createCanvas(1920, 1080);
  return drawFrame(
    canvas.getContext('2d'),
    lesson,
    lesson.scenes.find((s) => s.id === id),
    {
      beat,
      beatP,
      p: (beat + beatP) / 3,
      t: 10,
      duration: 60,
      opacity: 1,
      ...(cues ? { cues } : {}),
    },
    draw,
  );
}
test('painted fresh state preserves the new request and withholds its final loss before the reveal', () => {
  const a = frame('fresh-nonlinear', 0, 0.98),
    z = frame('fresh-nonlinear', 2, 0.98);
  assert.deepEqual(layoutIssues(a), []);
  assert.deepEqual(layoutIssues(z), []);
  assert(a.labels.some((x) => x.text === 'target 2'));
  assert(!a.labels.some((x) => x.text === '0.0011'));
  assert(z.labels.some((x) => x.text === '1.9675'));
  assert(z.labels.some((x) => x.text === '0.0011'));
  assert(z.labels.some((x) => x.text.includes('loss 0.00105625')));
  assert(z.labels.some((x) => x.text.includes('original h = 0.5')));
  assert(z.labels.some((x) => x.text.includes('original}=(-2,-2,-0.5,-1)')));
});
test('input sensitivity uses the incoming weight rather than the input feature used for a parameter derivative', () => {
  const s = hiddenUnit(),
    h = 1e-5,
    finite =
      (hiddenUnit(NONLINEAR_START, 2 + h, 5).loss - hiddenUnit(NONLINEAR_START, 2 - h, 5).loss) /
      (2 * h);
  assert(Math.abs(s.inputGradient - finite) < 1e-7);
  assert.equal(s.inputGradient, -3);
  assert.equal(s.gradient[0], -4);
  const painted = frame('nonlinear-forward', 2, 0.99);
  assert.deepEqual(layoutIssues(painted), []);
  assert(painted.labels.some((x) => x.text === 'input −3'));
  assert(painted.labels.some((x) => x.text.includes('w_1') && x.text.includes('-4')));
});
