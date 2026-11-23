import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/pretraining-data.mjs';
const lesson = await readLesson(
  new URL('../lessons/pretraining-data.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
function paint(id, beat, values) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          { ...c, phase: 'before', progress: 0, strength: 0, active: false },
        ]),
      ),
    );
  for (const [key, p] of Object.entries(values)) {
    const name = 'pt-' + id + '-' + key;
    cues[name] = {
      ...cues[name],
      phase: p === 1 ? 'after' : p === 0 ? 'before' : 'during',
      progress: p,
      strength: 0,
      active: false,
    };
  }
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 10, duration: 100, opacity: 1, beat, beatP: 0.5, cues, cueTiming: 'explicit-regression' },
    draw,
  );
}
for (const [y, count, label] of [
  [460, 410000, 'Training: 410,000'],
  [610, 50000, 'Validation: 50,000'],
])
  test(label + ' has a truthful fixed width whenever its final count is printed', () => {
    for (const p of [0, 0.3, 0.999, 1]) {
      const a = paint('score-contracts', 1, { labels: p }),
        bars = a.shapes.filter(
          (s) => s.x === 260 && s.y === y && s.height === 40 && s.width < 1400,
        ),
        width = bars[0]?.width ?? 0;
      assert(a.labels.some((l) => l.text === label));
      assert(Math.abs(width - (1400 * count) / 460000) < 1e-8, 'fixed quantity at ' + p);
    }
  });
test('both verified LSH edges wait for the complete pair and rule clause', () => {
  for (const p of [0, 0.5, 0.999])
    assert(!paint('lsh-chain', 1, { pass: p }).labels.some((l) => l.text === '2/3 ≥ .6'));
  assert.equal(
    paint('lsh-chain', 1, { pass: 1 }).labels.filter((l) => l.text === '2/3 ≥ .6').length,
    2,
  );
});
for (const [name, beat, cue, setup, y, expected] of [
  ['shifted targets', 1, 'shifted', {}, 595, ['12', '99', 'ignore', '99', 'ignore']],
  ['unshifted labels', 2, 'unshifted', {}, 595, ['11', '12', '99', 'ignore', '99']],
  [
    'internal shift output',
    2,
    'internal-shift',
    { 'unshifted': 1 },
    800,
    ['12', '99', 'ignore', '99'],
  ],
])
  test(name + ' keeps supplied inputs while its result waits', () => {
    const values = (a) =>
      a.labels
        .filter((l) => l.alpha > 0.1 && l.x > 430 && l.y >= y && l.y < y + 70)
        .map((l) => l.text);
    for (const p of [0.01, 0.5, 0.999]) {
      const a = paint('label-layout', beat, { ...setup, [cue]: p });
      assert(!values(a).includes('ignore'), 'computed result remains pending');
      assert(a.labels.some((l) => l.text === '11' && l.y < 400));
    }
    assert.deepEqual(values(paint('label-layout', beat, { ...setup, [cue]: 1 })), expected);
  });
