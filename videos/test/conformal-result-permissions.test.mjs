import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
const model = await import(
  process.env.CONFORMAL_TEST_SOURCE
    ? pathToFileURL(process.env.CONFORMAL_TEST_SOURCE)
    : new URL('../animations/conformal.mjs', import.meta.url)
);
const lesson = await readLesson(
  new URL('../lessons/conformal.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
const cue = (progress) => ({
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  progress,
  strength: 0,
  active: false,
});
function paint(id, beat, overrides = {}) {
  const scene = lesson.scenes.find((s) => s.id === id);
  const cues = Object.fromEntries(
    scene.beats.flatMap((b) => b.visual_cues.map((c) => [c.id, cue(1)])),
  );
  for (const [id, p] of Object.entries(overrides)) cues[id] = cue(p);
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 40, duration: 80, opacity: 1, beat, beatP: 0.9, cues, cueTiming: 'explicit-contract' },
    model.draw,
  )
    .labels.filter((l) => l.alpha > 0.25)
    .map((l) => l.text);
}
test('new fixed library-index and softmax-threshold results wait for their complete clauses', () => {
  for (const p of [0, 0.5, 0.999]) {
    assert(
      !paint('index-contract', 0, { 'cf-zero-index': p }).some((t) => t.includes('sorted}[7]=8')),
    );
    assert(
      !paint('classifier-score', 1, { 'cf-softmax-threshold': p, 'cf-softmax-set': 0 }).includes(
        'separate q = 0.4',
      ),
    );
  }
  assert(paint('index-contract', 0).some((t) => t.includes('sorted}[7]=8')));
  assert(paint('classifier-score', 1).includes('separate q = 0.4'));
});
test('the fresh rank and covered/deadline verdicts have separate complete-clause permissions', () => {
  for (const p of [0, 0.5, 0.999]) {
    assert(!paint('fresh-deadline', 1, { 'cf-fresh-rank': p }).some((t) => t.includes('rceil=18')));
    const text = paint('fresh-deadline', 1, { 'cf-fresh-deadline': p });
    assert(text.some((t) => t === '59 is covered'));
    assert(!text.some((t) => t.includes('deadline missed')));
  }
  assert(paint('fresh-deadline', 1).some((t) => t === '59 is covered · deadline missed'));
});
test('cumulative scores conserve labeled mass through partial construction and stable tie ordering', () => {
  for (const probabilities of [
    [0.98, 0.01, 0.005, 0.005],
    [0.25, 0.25, 0.25, 0.25],
    [0.1, 0.4, 0.2, 0.3],
  ])
    for (let frame = 0; frame <= 120; frame++) {
      const rows = model.cumulativeScoreConstruction(probabilities, frame / 120);
      assert.equal(new Set(rows.map((r) => r.label)).size, 4);
      let prefix = 0;
      for (const row of rows) {
        assert.equal(row.probability, probabilities[row.label]);
        assert(Math.abs(row.current - (prefix + row.probability * row.amount)) < 1e-12);
        assert.equal(row.complete, row.amount === 1);
        prefix += row.probability;
        assert(Math.abs(row.score - prefix) < 1e-12);
      }
    }
  assert.deepEqual(
    model.cumulativeScoreConstruction([0.25, 0.25, 0.25, 0.25], 1).map((r) => r.label),
    [0, 1, 2, 3],
  );
});
test('normalized radii and endpoints derive from the same frozen scales during construction', () => {
  for (let index = 0; index < 4; index++)
    for (let frame = 0; frame <= 120; frame++) {
      const p = frame / 120,
        s = model.normalizedIntervalConstruction(index, p);
      assert(Math.abs(s.radius - 2 * s.scale * p) < 1e-12);
      assert(Math.abs(s.upper - s.lower - 2 * s.radius) < 1e-12);
      assert.equal(s.complete, p === 1);
    }
  const rows = model.normalizedCalibrationConstruction(1);
  assert.deepEqual(
    rows.map((r) => r.id),
    Array.from({ length: 9 }, (_, i) => 'C' + (i + 1)),
  );
  assert(rows.every((r) => r.score === r.residual / r.scale));
  assert.deepEqual(
    [0, 1, 2, 3].map((i) => {
      const s = model.normalizedIntervalConstruction(i, 1);
      return [s.lower, s.upper, s.covered];
    }),
    [
      [34, 46, true],
      [35, 49, true],
      [34, 42, true],
      [32, 56, true],
    ],
  );
});
