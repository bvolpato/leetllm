import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { pathToFileURL } from 'node:url';
const { draw } = await import(
  process.env.VALIDATION_SOURCE_MODULE
    ? pathToFileURL(process.env.VALIDATION_SOURCE_MODULE)
    : new URL('../animations/validation.mjs', import.meta.url)
);
registerLessonFonts();
const cue = (progress) => ({
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  progress,
  active: progress > 0 && progress < 1,
  reveal: 1,
  strength: 0,
});
function paint(remove, fallback = 0) {
  const ctx = createCanvas(1920, 1080).getContext('2d');
  const state = {
    beat: 1,
    beatP: 0.5,
    t: 20,
    duration: 50,
    opacity: 1,
    cues: Object.fromEntries(
      Object.entries({
        'source-group': 1,
        'source-exposed': 1,
        'source-remove': remove,
        'source-fallback': fallback,
        'source-result': fallback,
      }).map(([id, p]) => [id, cue(p)]),
    ),
  };
  const audit = drawFrame(
    ctx,
    { id: 'validation' },
    { id: 'source-transfer', title: 'Test source exposure' },
    state,
    draw,
  );
  assert.deepEqual(layoutIssues(audit), [], 'native geometry');
  return audit.labels;
}
test('removing a source moves every family member out of tuning and erases its lookup before fallback', () => {
  const family = [
    'Source C: retention 7 days',
    'C1: 7-day rule',
    'C2: after a week',
    'Q: retention period?',
  ];
  const before = paint(0);
  for (const text of family)
    assert(before.find((label) => label.text === text).x < 960, text + ' is initially in tuning');
  assert(before.some((label) => label.text === 'Lookup memory: C → 7 days'));
  const removed = paint(1);
  for (const text of family)
    assert(removed.find((label) => label.text === text).x > 960, text + ' must leave tuning');
  assert(removed.some((label) => label.text === 'Lookup memory: C entry removed'));
  assert(removed.some((label) => label.text === 'Recompute without C: ?'));
  assert(!removed.some((label) => label.text === 'Recomputed fallback: 30 days → wrong'));
  const complete = paint(1, 1);
  assert(complete.some((label) => label.text === 'Earlier exposed result: 7 days → correct'));
  assert(complete.some((label) => label.text === 'Recomputed fallback: 30 days → wrong'));
});
test('source family remains legible while crossing the split boundary', () => {
  for (let step = 0; step <= 120; step++) paint(step / 120);
});
