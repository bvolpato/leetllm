import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { evaluateMotionFrames } from '../lib/motion-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/gpu-failure-operations.mjs';
registerLessonFonts();
const fixture = JSON.parse(
    fs.readFileSync(
      new URL('./fixtures/measured-narration/gpu-fragments-probe.json', import.meta.url),
    ),
  ),
  lesson = await readRepositoryLesson('videos/lessons/gpu-failure-operations.lesson.yaml'),
  index = lesson.scenes.findIndex((s) => s.id === fixture.scene),
  scene = lesson.scenes[index],
  timeline = makeSceneTimeline(
    scene,
    fixture.sounds.map((s) => s.duration),
    fixture.fps,
  );
timeline.sounds = fixture.sounds;
timeline.visualCues = resolveSceneCues(scene, timeline, fixture.sounds);
const rgb = (canvas) => {
  const rgba = canvas.getContext('2d').getImageData(0, 0, 1920, 1080).data,
    data = new Uint8Array(1920 * 1080 * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4) {
    data[j++] = rgba[i];
    data[j++] = rgba[i + 1];
    data[j++] = rgba[i + 2];
  }
  return { width: 1920, height: 1080, data };
};
test('the same request visibly traverses separated holes during the actual provider explanation', () => {
  const frames = fixture.samples.map((s) => {
    const canvas = createCanvas(1920, 1080),
      audit = drawFrame(
        canvas.getContext('2d'),
        lesson,
        scene,
        frameState(timeline, s.time, index, lesson.scenes.length),
        draw,
      );
    assert.deepEqual([...(audit.issues ?? []), ...layoutIssues(audit)], []);
    const labels = audit.labels.map((l) => l.text).join('\n');
    assert(labels.includes('same 1.50 GiB request'));
    assert(labels.includes('total 6.10 GiB · largest 0.88 GiB'));
    return rgb(canvas);
  });
  assert.equal(
    evaluateMotionFrames(frames, fixture.declaration).passed,
    true,
    'the complete block-comparison operation must remain visible inside its unchanged measured motion region',
  );
});
