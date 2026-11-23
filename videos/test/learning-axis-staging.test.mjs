import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw, hoeffdingRadius, growthCeiling } from '../animations/learning-theory.mjs';
const lesson = await readLesson(
  new URL('../lessons/learning-theory.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
function paint(id, beat, overrides = {}, p = 0.5) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          {
            ...c,
            phase: i < beat ? 'after' : 'before',
            progress: i < beat ? 1 : 0,
            strength: 0,
            active: false,
          },
        ]),
      ),
    );
  for (const [id, q] of Object.entries(overrides))
    cues[id] = {
      phase: q === 0 ? 'before' : q === 1 ? 'after' : 'during',
      progress: q,
      strength: 0,
      active: false,
    };
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 35, duration: 100, opacity: 1, beat, beatP: p, cueTiming: 'explicit-test-cues', cues },
    draw,
  );
}
test('the S12 endpoint represents its full Hoeffding upper bound on the actually drawn axis', () => {
  const a = paint('one-predictor', 2, {}, 1),
    ticks = a.labels
      .filter((l) => l.fontSize === 27 && /^0\.\d+$/.test(l.text))
      .sort((a, b) => a.x - b.x),
    last = ticks.at(-1),
    axis = a.connectors.find((c) => c.from.y === 890 && c.to.y === 890 && c.to.x > c.from.x),
    bar = a.connectors.find((c) => c.from.y === 824 && c.to.y === 824 && c.to.x > c.from.x);
  assert(bar && axis && last);
  const represented = (Number(last.text) * (bar.to.x - axis.from.x)) / (axis.to.x - axis.from.x);
  assert(
    Math.abs(represented - (20 / 40 + hoeffdingRadius(40))) < 1e-10,
    `actual upper ${represented}`,
  );
});
for (const [n, word] of [
  [4, 'four'],
  [10, 'ten'],
  [50, 'fifty'],
]) {
  test(`growth input ${n} remains the stated case throughout its calculation`, () => {
    const a = paint('growth-function', 1, { ['growth-' + word + '-inputs']: 1 });
    assert(a.labels.some((l) => l.text === `n = ${n} inputs · VC dimension 3`));
  });
  test(`growth result for ${n} waits for its complete numeric clause`, () => {
    for (const p of [0, 0.5, 0.999, 1]) {
      const a = paint('growth-function', 1, {
          ['growth-' + word + '-inputs']: 1,
          ['growth-' + word + '-result']: p,
        }),
        has = a.labels.some(
          (l) => l.text === growthCeiling(n, 3).toLocaleString('en-US') && l.fontSize === 85,
        );
      assert.equal(has, p === 1);
    }
  });
}
test('the narrated gamma-two case is held at its actual parameter and component values', () => {
  const a = paint('interpolation-risk', 1, { 'gamma-two-inputs': 1, 'gamma-two-result': 1 }, 0.95);
  for (const v of ['γ = 2.00', 'bias² 0.50', 'variance 1.00', 'total 1.50'])
    assert(
      a.labels.some((l) => l.text === v),
      v,
    );
});
test('gamma-two components stay pending until the full result clause completes', () => {
  const a = paint('interpolation-risk', 1, { 'gamma-two-inputs': 1, 'gamma-two-result': 0.5 });
  assert(
    !a.labels.some(
      (l) =>
        l.text.startsWith('bias² ') ||
        l.text.startsWith('variance ') ||
        l.text.startsWith('total '),
    ),
  );
});
test('the preconditioned path is constructed in its spoken beat and reaches the actual endpoint', () => {
  const during = paint('optimizer-geometry', 1, {
    'optimizer-zero-update': 1,
    'optimizer-null-update': 1,
    'optimizer-preconditioned-update': 0.5,
  });
  assert(during.labels.some((l) => l.text === 'preconditioned'));
  const after = paint('optimizer-geometry', 1, {
    'optimizer-zero-update': 1,
    'optimizer-null-update': 1,
    'optimizer-preconditioned-update': 1,
  });
  assert(after.labels.some((l) => l.text === '(0.059, 0.471)'));
});
test('growth counting slots show the actual number of possible assignments before the64-slot display cap', () => {
  for (const [n, word] of [
    [4, 'four'],
    [10, 'ten'],
  ]) {
    const a = paint('growth-function', 1, {
        ['growth-' + word + '-inputs']: 1,
        ['growth-' + word + '-result']: 1,
      }),
      slots = a.shapes.filter((s) => s.width === 42 && s.height === 49);
    assert.equal(slots.length, Math.min(64, 2 ** n));
  }
});
test('a pending gamma-two result shows only its input guide and keeps the solved risk point withheld', () => {
  const during = paint('interpolation-risk', 1, { 'gamma-two-inputs': 1, 'gamma-two-result': 0.5 });
  assert(!during.shapes.some((s) => s.kind === 'circle' && Math.abs(s.width - 26) < 1e-8));
  const after = paint('interpolation-risk', 1, { 'gamma-two-inputs': 1, 'gamma-two-result': 1 });
  assert(
    after.shapes.some(
      (s) => s.kind === 'circle' && Math.hypot(s.center.x - 810, s.center.y - 740) < 1e-8,
    ),
  );
});
