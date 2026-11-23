import test from 'node:test';
import assert from 'node:assert/strict';
import {
  exampleGradients,
  momentumFixture,
  capturedCalls,
  paddedReduction,
  doublingTraces,
  weightPenalty,
  regularizedHistory,
  projectionFixture,
  regression,
  draw,
} from '../animations/jax-for-ml-research.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
const root = new URL('../../', import.meta.url).pathname;
const lessonPromise = readLesson(root + 'videos/lessons/jax-for-ml-research.lesson.yaml', root);
async function painted(sceneId, beat, overrides = {}) {
  registerLessonFonts();
  const lesson = await lessonPromise,
    scene = lesson.scenes.find((s) => s.id === sceneId);
  const cues = Object.fromEntries(
    scene.beats.flatMap((b, i) =>
      (b.visual_cues ?? []).map((c) => [
        c.id,
        {
          ...c,
          phase: i < beat ? 'after' : 'before',
          progress: i < beat ? 1 : 0,
          strength: 0,
          reveal: i < beat ? 1 : 0,
        },
      ]),
    ),
  );
  for (const [id, progress] of Object.entries(overrides))
    Object.assign(cues[id], {
      progress,
      reveal: progress,
      phase: progress === 1 ? 'after' : progress ? 'during' : 'before',
    });
  const canvas = createCanvas(1920, 1080);
  return drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    { beat, beatP: 0.5, t: 0, opacity: 1, cues, cueTiming: 'estimated-lexical-words' },
    draw,
  );
}
const texts = (frame) => frame.labels.map((x) => x.text);

test('mapped gradients retain individual rows whose mean equals the scalar-loss gradient', () => {
  const mapped = exampleGradients();
  assert.deepEqual(mapped, [
    [-4, -0, -4],
    [0, 2, 2],
    [-2, -2, -2],
    [-12, -6, -6],
  ]);
  assert.deepEqual(
    mapped[0].map((_, j) => mapped.reduce((sum, row) => sum + row[j], 0) / 4),
    regression([0, 0, 0]).gradient,
  );
  assert.equal((-2 + 2) / 2, 0);
  assert.equal((Math.abs(-2) + Math.abs(2)) / 2, 2);
});
test('the actual dropout mask changes features before computing momentum', () => {
  const result = momentumFixture();
  assert.deepEqual(result.features, [
    [4 / 3, 0],
    [0, 4 / 3],
    [4 / 3, 4 / 3],
    [0, 0],
  ]);
  assert.deepEqual(result.gradient, [-2, 0, -2.5]);
  assert.deepEqual(result.nextParams, [0.1, 0, 0.125]);
});
test('a zero new gradient can still move parameters through the retained momentum', () => {
  const result = momentumFixture(
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [0, 0, 1.25],
    [2, -1, 0],
  );
  assert.deepEqual(result.gradient, [0, 0, 0]);
  assert.deepEqual(result.nextVelocity, [1.8, -0.9, 0]);
  assert(Math.abs(result.nextParams[0] + 0.09) < 1e-12);
  assert.equal(result.nextParams[2], 1.25);
});
test('same contracts reuse captured values while changed shapes or weak typing retrace', () => {
  const calls = capturedCalls([
    { length: 3, global: 2 },
    { length: 3, global: 4 },
    { length: 5, global: 4 },
    { length: 3, global: 7, weak: true },
  ]);
  assert.deepEqual(
    calls.results.map((r) => r.result),
    [6, 6, 20, 21],
  );
  assert.deepEqual(calls.traces, [3, 5, 3]);
  assert.deepEqual(
    calls.results.map((r) => r.variant),
    ['A', 'A', 'B', 'C'],
  );
});
test('padding uses valid counts and preserves a finite all-invalid diagnostic', () => {
  assert.equal(paddedReduction([4, 1, 1, 9, 0, 0], [1, 1, 1, 1, 0, 0]).masked, 3.75);
  assert.equal(paddedReduction([4, 1, 1, 9, 0, 0], [1, 1, 1, 1, 0, 0]).naive, 2.5);
  assert.deepEqual(paddedReduction([4, 1, 1, 9, 0, 0], [0, 0, 0, 0, 0, 0]), {
    sum: 0,
    count: 0,
    naive: 2.5,
    masked: 0,
  });
});
test('a fixed unroll and a data-dependent stop disagree on the changed input', () => {
  assert.deepEqual(doublingTraces(1).dynamic, [1, 2, 4, 8]);
  assert.deepEqual(doublingTraces(3), {
    dynamic: [3, 6, 12],
    fixed: [3, 6, 12, 24],
    derivative: 8,
  });
});
test('weight-only regularization has the finite-difference derivative and changed objective', () => {
  const w = [2, -1],
    lambda = 0.1,
    eps = 1e-5,
    r = weightPenalty(w, lambda);
  for (let j = 0; j < 2; j++) {
    const plus = w.slice(),
      minus = w.slice();
    plus[j] += eps;
    minus[j] -= eps;
    assert(
      Math.abs(
        (weightPenalty(plus, lambda).value - weightPenalty(minus, lambda).value) / (2 * eps) -
          r.gradient[j],
      ) < 1e-9,
    );
  }
  assert.equal(r.biasGradient, 0);
  assert.equal(r.value, 0.5);
  const h = regularizedHistory();
  assert.equal(h.length, 81);
  assert.equal(h.at(-1).objective.toFixed(6), '0.399595');
  for (const p of h)
    assert(Math.abs(p.objective - p.mse - weightPenalty(p.p.slice(0, 2)).value) < 1e-12);
});
test('transposition preserves square shape and changes the numerical projection', () => {
  assert.deepEqual(projectionFixture().output, [7, 10]);
  assert.deepEqual(projectionFixture().transposed, [5, 11]);
});
test('the divided-feature column stays unknown until actual rescaling is complete', async () => {
  const before = await painted('state-replay', 0);
  const after = await painted('state-replay', 0, { 'state-mask': 1 });
  const right = (frame) =>
    frame.labels.filter((x) => x.x > 1200 && x.y > 380 && x.y < 820).map((x) => x.text);
  assert.deepEqual(right(before), Array(8).fill('?'));
  assert.deepEqual(right(after), ['1.3333', '0', '0', '1.3333', '1.3333', '1.3333', '0', '0']);
});
test('the empty mask persists while explaining why momentum can move an empty batch', async () => {
  const frame = await painted('masked-padding', 2);
  const mask = frame.labels.filter((x) => x.y > 570 && x.y < 670).map((x) => x.text);
  assert.deepEqual(mask, Array(6).fill('0'));
  assert(texts(frame).includes('new gradient = 0'));
});
test('the debugging ladder retains actual scalar, aggregate and per-row artifacts', async () => {
  const frame = await painted('evidence-preservation', 1),
    values = (x0, x1) =>
      frame.labels.filter((x) => x.x > x0 && x.x < x1 && x.y > 570 && x.y < 780).map((x) => x.text);
  assert.deepEqual(values(200, 570), ['3.75']);
  assert.deepEqual(values(650, 1010), ['-4.5', '-1.5', '-2.5']);
  const mapped = ['-4', '0', '-4', '0', '2', '2', '-2', '-2', '-2', '-12', '-6', '-6'];
  assert.deepEqual(values(1090, 1450), mapped);
  assert.deepEqual(values(1530, 1890), mapped);
});
test('fresh call results and explicit repair wait for their own complete result anchors', async () => {
  const pending = texts(await painted('fresh-boundary', 1));
  assert(pending.includes('6'));
  assert(!pending.includes('20'));
  const revealed = texts(
    await painted('fresh-boundary', 1, { 'fresh-repeat': 1, 'fresh-newshape': 1 }),
  );
  assert(revealed.includes('20'));
  assert(!texts(await painted('fresh-boundary', 2)).includes('12'));
  assert(texts(await painted('fresh-boundary', 2, { 'fresh-explicit': 1 })).includes('12'));
});
test('a partially transposed matrix withholds its output until the operation finishes', async () => {
  const moving = texts(await painted('dynamic-static', 1, { 'static-transpose': 0.5 }));
  assert(moving.includes('W → Wᵀ'));
  assert(moving.includes('?'));
  assert(!moving.includes('5'));
  const done = texts(await painted('dynamic-static', 1, { 'static-transpose': 1 }));
  assert(done.includes('5'));
  assert(done.includes('11'));
});
