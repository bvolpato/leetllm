import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as animation from '../animations/deep-dive-tinker.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();
async function fixture() {
  const id = 'deep-dive-tinker',
    lesson = await readLesson(path.join(root, `videos/lessons/${id}.lesson.yaml`), root);

  const timeline = await loadMeasuredTimeline(id);
  const index = lesson.scenes.findIndex((scene) => scene.id === 'snapshots'),
    scene = lesson.scenes[index];
  const measured = timeline.scenes.find((item) => item.id === scene.id);
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const state = (time) => frameState(timing, time, index, lesson.scenes.length);
  const paint = (time) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      state(time),
      animation.draw,
    );
  return { timing, state, paint };
}
test('the measured verifier clause focuses its actual computed result and verification readout', async () => {
  const { timing, state, paint } = await fixture();
  const cue = timing.visualCues.find((cue) => cue.id === 'snapshots-beat-3-focus-1');
  let pending = 0,
    passed = 0;
  for (let time = cue.start + 0.08; time < cue.end - 0.04; time += 1 / timing.fps) {
    const current = state(time),
      model = animation.sampleModel('snapshots', current),
      audit = paint(time);
    assert.equal(model.result, 2);
    assert.equal(model.passed, true);
    const parts = audit.targets.filter((target) => cue.targets.includes(target.id));
    assert(
      parts.length >= 2,
      'both the actual result and verifier readout must be present throughout the phrase',
    );
    assert(
      parts.every((part) => part.y >= 700),
      'the verifier clause must not focus the upstream response card',
    );
    assert(
      parts.some((part) => part.markCounts.math > 0),
      'the computed min result belongs to the active semantic target',
    );
    const text = audit.labels.map((label) => label.text);
    if (model.graderVisible) {
      assert(text.includes('Local verifier · 2 = 2 · PASS'));
      passed++;
    } else {
      assert(text.includes('Local verifier · comparison pending'));
      pending++;
    }
  }
  assert(
    pending > 0 && passed > 0,
    'the unchanged measured evaluation boundary must separate pending and PASS',
  );
});
