import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import {
  draw,
  sampleModel,
  sectorTransition,
  validateModel,
} from '../animations/gpu-kernel-performance-engineering-lab.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = new URL('../../', import.meta.url).pathname;
registerLessonFonts();
const lesson = await readLesson(
  root + 'videos/lessons/gpu-kernel-performance-engineering-lab.lesson.yaml',
  root,
);
const baseline = await loadMeasuredTimeline('gpu-kernel-performance-engineering-lab');
const scene = lesson.scenes.find((s) => s.id === 'sectors');
const previous = baseline.scenes.find((s) => s.id === scene.id);
const timing = {
  ...previous,
  visualCues: resolveSceneCues(scene, previous),
  cueTiming: 'provider-words',
};
const readCue = timing.visualCues.find((c) => c.id === 'sectors-beat-1-focus-2');
const storeCue = timing.visualCues.find((c) => c.id === 'sectors-naive-store');
function paint(time, beatP) {
  const state = frameState(timing, time, lesson.scenes.indexOf(scene), lesson.scenes.length);
  for (const cue of Object.values(state.cues)) cue.strength = 0;
  if (beatP !== undefined) state.beatP = beatP;
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const audit = drawFrame(ctx, lesson, scene, state, draw);
  return { state, audit, pixels: ctx.getImageData(250, 625, 1420, 220).data };
}
function footprint(result, count) {
  assert(
    result.audit.labels.some(
      (l) =>
        l.text === `${count} touched sectors · ${(400 / count).toFixed(1)}% payload fraction` &&
        l.alpha > 0.9,
    ),
  );
  const labels = result.audit.labels.filter((l) => l.y >= 625 && l.y < 845 && /^\d+$/.test(l.text));
  assert.equal(labels.length, count, 'The actual computed sector cells must be painted.');
}
test('the measured aligned-read clause paints four sectors with focus disabled', () => {
  for (const progress of [0.1, 0.5, 0.98]) {
    const result = paint(readCue.start + progress * (readCue.end - readCue.start));
    footprint(result, 4);
    assert.deepEqual(
      sampleModel('sectors', result.state).addresses,
      Array.from({ length: 32 }, (_, i) => i * 4),
    );
  }
});
test('the naive-store clause changes the address-derived footprint and holds its result', () => {
  const initial = paint(storeCue.start);
  footprint(initial, 4);
  for (const progress of [0.25, 0.5, 1]) {
    const result = paint(storeCue.start + progress * (storeCue.end - storeCue.start) + 1e-7);
    const expected = sectorTransition(32 - Math.floor(32 * progress + 1e-6));
    footprint(result, expected.sectors.length);
    assert.deepEqual(sampleModel('sectors', result.state).addresses, expected.addresses);
  }
  for (const beatP of [0.01, 0.5, 0.99]) footprint(paint(storeCue.end + 0.2, beatP), 32);
  const final = paint(storeCue.end + 0.2);
  const changed = initial.pixels.reduce(
    (n, value, i) => n + (i % 4 !== 3 && value !== final.pixels[i] ? 1 : 0),
    0,
  );
  assert(changed > 3000, 'Sector content must change without a focus pulse.');
});
test('the later adjacent-store sweep and the other numerical contracts remain valid', () => {
  validateModel();
  const counts = [0, 0.5, 0.99].map(
    (beatP) => sampleModel('sectors', { beat: 1, beatP }).sectors.length,
  );
  assert.equal(counts[0], 32);
  assert(counts[1] > 4 && counts[1] < 32);
  assert.equal(counts[2], 4);
  assert.equal(sectorTransition(0).fraction, 0.125);
  assert.equal(sectorTransition(32).fraction, 1);
});
