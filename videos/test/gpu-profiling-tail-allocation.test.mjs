import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw, sampleModel } from '../animations/gpu-profiling-correctness-benchmarking.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

registerLessonFonts();
const root = fileURLToPath(new URL('../../', import.meta.url));
const lesson = await readLesson(
  new URL('../lessons/gpu-profiling-correctness-benchmarking.lesson.yaml', import.meta.url),
  root,
);
const index = lesson.scenes.findIndex((scene) => scene.id === 'tail'),
  scene = lesson.scenes[index];
const measured = (await loadMeasuredTimeline('gpu-profiling-correctness-benchmarking')).scenes[0];
const timing = {
  ...measured,
  visualCues: resolveSceneCues(scene, measured),
  cueTiming: 'provider-words',
};
const words = measured.sounds[1].words,
  tightenWord = words.findIndex((word) => word.text === 'Tighten');
assert.deepEqual(
  words.slice(tightenWord, tightenWord + 3).map((word) => word.text),
  ['Tighten', 'the', 'allocation'],
);
const tightenStart = timing.beats[1].start + words[tightenWord].start;
const tightenEnd = timing.beats[1].start + words[tightenWord + 2].end;
const canvas = createCanvas(1920, 1080),
  ctx = canvas.getContext('2d');
function paint(time) {
  const state = frameState(timing, time, index, lesson.scenes.length);
  const audit = drawFrame(ctx, lesson, scene, state, draw);
  assert.deepEqual(layoutIssues(audit), [], `native geometry at ${time}s`);
  return { audit, model: sampleModel('tail', state) };
}

test('spare allocation survives the measured hidden-store explanation before tightening', () => {
  const spare = timing.visualCues.find((cue) => cue.id === 'tail-beat-2-focus-1');
  const hidden = timing.visualCues.find((cue) => cue.id === 'tail-beat-2-focus-2');
  for (const time of [
    timing.beats[1].start + 0.1,
    spare.start,
    (spare.start + spare.end) / 2,
    spare.end,
    (hidden.start + hidden.end) / 2,
    hidden.end,
    tightenStart - 0.02,
  ]) {
    const { audit, model } = paint(time);
    assert(
      audit.labels.some((label) => label.text === 'Allocation has spare space'),
      `the painted allocation must stay spare during the hidden-store clause at ${time}s`,
    );
    assert.equal(model.allocated, 8);
    assert.deepEqual(model.writes, [0, 1, 2, 3, 4, 5]);
    assert(!audit.labels.some((label) => label.text.includes('now crosses')));
  }
});

test('the physical boundary, allocation count and overrun result agree through tightening and hold', () => {
  for (const [time, allocated] of [
    [tightenStart, 8],
    [tightenStart + 0.5 * (tightenEnd - tightenStart), 7],
    [tightenEnd - 0.02, 6],
    [tightenEnd, 5],
    [tightenEnd + 0.3, 5],
    [timing.beats[1].end, 5],
  ]) {
    const { audit, model } = paint(time);
    assert.equal(model.allocated, allocated);
    const target = audit.targets.find((target) => target.id === 'tail-physical-allocation');
    assert(target, 'the allocation must have a painted spatial boundary');
    const outline = audit.shapes.find(
      (shape) => shape.kind === 'rect' && shape.y === 395 && shape.height === 160,
    );
    assert(outline, 'the physical allocation outline must actually be drawn');
    assert.equal(outline.x, 170);
    assert.equal(outline.width, 195 * allocated);
    const pixel = ctx.getImageData(Math.round(outline.x + outline.width), 400, 1, 1).data;
    assert(pixel[2] > pixel[0] && pixel[2] > pixel[1], 'the blue physical edge must be visible');
    const overrun = model.writes.some((position) => position >= allocated);
    assert.equal(
      audit.labels.some((label) => label.text.includes('now crosses')),
      overrun,
    );
    assert.equal(
      audit.labels.some((label) => label.text === 'Exact-sized allocation'),
      allocated === 5,
    );
    assert(
      audit.labels.some((label) => label.text === 'Physical allocation: ' + allocated + ' slots'),
    );
    assert.equal(model.valid, 5);
    assert.deepEqual(model.writes, [0, 1, 2, 3, 4, 5]);
    const stored = ctx.getImageData(1147, 430, 1, 1).data;
    assert(stored[0] > stored[1], 'the same extra store at position5 must remain painted');
  }
});
