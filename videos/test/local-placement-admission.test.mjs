import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { admission, layerFlag, draw } from '../animations/local-llm-placement.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { frameState } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { estimatedTimeline } from '../lib/stage-lesson.mjs';
registerLessonFonts();
const lesson = await readRepositoryLesson('videos/lessons/local-llm-placement.lesson.yaml'),
  scene = lesson.scenes.find((s) => s.id === 'fresh-admission');
const [timing] = estimatedTimeline({ ...lesson, scenes: [scene] }).scenes;
timing.cueTiming = 'estimated-lexical-words';
function paint(cueId, offsetFromEnd = 0) {
  const cue = timing.visualCues.find((item) => item.id === cueId);
  assert(cue, `Missing spoken cue ${cueId}`);
  const state = frameState(timing, cue.end + offsetFromEnd, 0, 1);
  for (const item of Object.values(state.cues)) item.strength = 0;
  const audit = drawFrame(createCanvas(1920, 1080).getContext('2d'), lesson, scene, state, draw);
  const weights = audit.labels.find((label) => label.text.includes('GB weights'));
  const limit = audit.labels.find((label) => label.text === '16 GB limit');
  const filled = audit.shapes.filter(
    (shape) =>
      shape.fillAlpha > 0 &&
      shape.strokeAlpha === 0 &&
      shape.y <= weights.y &&
      shape.y + shape.height >= weights.y + weights.height,
  );
  const rightEdge = Math.max(...filled.map((shape) => shape.x + shape.width));
  return {
    labels: audit.labels.map((label) => label.text),
    segments: filled.length,
    overLimit: rightEdge > limit.x + limit.width / 2,
  };
}
test('the output slot consumes one of the pinned GPU-layer slots', () => {
  const r = layerFlag(40, 24);
  assert.equal(r.hiddenGpu, 23);
  assert(r.outputGpu);
  assert(!r.inputGpu);
  assert.deepEqual(
    r.hidden.filter((x) => x.gpu).map((x) => x.i),
    Array.from({ length: 23 }, (_, i) => 17 + i),
  );
  assert.equal(layerFlag(40, 0).hiddenGpu, 0);
  assert.equal(layerFlag(40, 41).hiddenGpu, 40);
});
test('memory repair changes the actual session count without repairing the protected quality case', () => {
  assert(Math.abs(admission(8).total - 16.579321856) < 1e-10);
  assert(!admission(8).fits);
  assert(Math.abs(admission(7).total - 15.706906624) < 1e-10);
  assert(admission(7).fits);
  const question = paint('session-question');
  assert(
    !question.labels.some((t) => t.includes('16.579') || t.includes('15.707') || t === 'Queued'),
  );
  assert(!paint('eight-total', -1 / 30).labels.some((t) => t.includes('16.579')));
  const rejected = paint('eight-total');
  assert(rejected.labels.some((t) => t.startsWith('16.579 GB') && t.includes('8 logs')));
  assert.equal(rejected.segments - question.segments, 8);
  assert(rejected.overLimit);
  const queued = paint('queue-eight');
  assert(queued.labels.includes('Queued'));
  assert.equal(queued.segments, rejected.segments - 1);
  assert(!queued.overLimit);
  assert(!paint('seven-fit', -1 / 30).labels.some((t) => t.includes('15.707')));
  const result = paint('seven-fit');
  assert(result.labels.some((t) => t.startsWith('15.707 GB') && t.includes('7 logs')));
  assert(!paint('ask-promote').labels.includes('still fails'));
  const reviewed = paint('inspect-command');
  assert(reviewed.labels.some((t) => t.startsWith('15.707 GB')));
  assert(reviewed.labels.includes('still fails'));
  assert(
    reviewed.labels.some(
      (t) => t.includes('rollback --target v6') && t.includes('missing --confirm'),
    ),
  );
  assert(paint('local-handoff').labels.some((t) => t.startsWith('Hold candidate')));
});
