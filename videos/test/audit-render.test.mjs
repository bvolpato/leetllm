import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { auditLessonFrames, galleryPngEncoder } from '../render.mjs';
import { makeSceneTimeline } from '../lib/lesson.mjs';
import { lessonIntro } from '../lib/brand.mjs';

test('gallery PNG reuse keeps a one-pixel change, including its alpha', async () => {
  const canvas = createCanvas(8, 8);
  const ctx = canvas.getContext('2d');
  const encode = galleryPngEncoder(canvas);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 8, 8);
  const first = await encode();
  ctx.fillRect(0, 0, 8, 8);
  assert.equal(await encode(), first);
  ctx.clearRect(7, 7, 1, 1);
  const changed = await encode();
  assert.notDeepEqual(changed, first);
  assert.deepEqual(changed, await canvas.encode('png'));
  ctx.fillRect(7, 7, 1, 1);
  assert.deepEqual(await encode(), first);
});

function example(opening) {
  const scene = {
    id: 'example',
    title: 'A short explanation',
    beats: [{ say: 'A short explanation.', hold: 0 }],
  };
  const lesson = { id: 'example', scenes: [scene], opening };
  const intro = lessonIntro(lesson, 30);
  const timing = { ...makeSceneTimeline(scene, [0.1], 30), start: intro.duration };
  return {
    lesson,
    timeline: {
      fps: 30,
      intro,
      scenes: [timing],
    },
  };
}

test('audit-only drawing covers every intro and narrative frame in movie order', () => {
  const { lesson, timeline } = example(),
    observed = [],
    narrativeTimes = [];
  const report = auditLessonFrames(
    lesson,
    timeline,
    (ctx, scene, state, api) => {
      narrativeTimes.push(state.t);
      api.text(ctx, 'visible explanation', 300, 300, 30);
    },
    (scene) => observed.push(scene.scene),
  );
  assert.deepEqual(observed, ['leetllm-intro', 'example']);
  assert.equal(report.scenes[0].frames, 120);
  assert.equal(report.frames, 120 + timeline.scenes[0].frames);
  assert.equal(report.expectedFrames, report.frames);
  assert.equal(report.issueFrames, 0);
  assert.equal(report.passed, true);
  assert.equal(narrativeTimes.length, timeline.scenes[0].frames);
  assert.equal(narrativeTimes[0], 0);
  assert.equal(narrativeTimes.at(-1), (timeline.scenes[0].frames - 1) / 30);
});

test('a one-frame narrative violation fails the audit while retaining complete intro coverage', () => {
  const { lesson, timeline } = example();
  const report = auditLessonFrames(lesson, timeline, (ctx, scene, state, api) => {
    if (state.t === 0.5) api.text(ctx, 'outside the frame', 3000, 3000, 30);
  });
  assert.equal(report.passed, false);
  assert.equal(report.frames, 120 + timeline.scenes[0].frames);
  assert.equal(report.issueFrames, 1);
  assert.equal(report.scenes[0].scene, 'leetllm-intro');
  assert.equal(report.scenes[1].issues[0].firstFrame, 15);
});

test('a legacy opening setting keeps the brand frames and audits the first teaching frame', () => {
  const { lesson, timeline } = example('lesson');
  const report = auditLessonFrames(lesson, timeline, (ctx, scene, state, api) => {
    if (state.t === 0) api.text(ctx, 'outside the frame', 3000, 3000, 30);
  });
  assert.equal(report.frames, 120 + timeline.scenes[0].frames);
  assert.deepEqual(
    report.scenes.map((s) => s.scene),
    ['leetllm-intro', 'example'],
  );
  assert.equal(report.scenes[1].issues[0].firstFrame, 0);
  assert.equal(report.passed, false);
});
