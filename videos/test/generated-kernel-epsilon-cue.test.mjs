import { readFile } from 'node:fs/promises';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { timelineFromMeasuredFixture } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as animation from '../animations/ai-generated-kernel-engineering.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();
async function fixture(sceneId) {
  const id = 'ai-generated-kernel-engineering';
  const lesson = await readLesson(path.join(root, `videos/lessons/${id}.lesson.yaml`), root);

  const index = lesson.scenes.findIndex((scene) => scene.id === sceneId),
    current = lesson.scenes[index];
  const original = JSON.parse(
    await readFile(
      new URL('./fixtures/measured-narration/' + id + '.json', import.meta.url),
      'utf8',
    ),
  );
  const measuredScene = original.scenes.find((s) => s.id === sceneId);
  // These regressions cover only the original unchanged measured beats. New chapters have no fabricated provider timing.
  const scene = { ...current, beats: current.beats.slice(0, measuredScene.beats.length) };
  const timeline = timelineFromMeasuredFixture(
    { ...original, scenes: [measuredScene] },
    { ...lesson, scenes: [scene] },
  );
  const measured = timeline.scenes[0];
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

test('squared-scale epsilon and actual outputs agree by the measured multiplication clause and remain equal', async () => {
  const { timing, state, paint } = await fixture('epsilon');
  const cue = timing.visualCues.find((cue) => cue.id === 'epsilon-beat-2-focus-1');
  for (const time of [cue.end, cue.end + 1, timing.duration - 0.3]) {
    const current = animation.sampleModel('epsilon', state(time));
    assert(
      Math.abs(current.value - current.reference) < 1e-12,
      'the actual normalized value must regain its reference by the explained scaling operation',
    );
    assert.equal(current.eps, 1e-5 * current.a ** 2);
    const audit = paint(time);
    assert(audit.labels.some((label) => label.text === 'Output ' + current.reference.toFixed(6)));
  }
  assert(
    cue.targets.includes('epsilon-epsilon-s-eps-toexponential-2'),
    'the scaling clause must focus changing epsilon',
  );
});

test('interpolating common-scale values do not assert a completed unqualified normalization equation', async () => {
  const { timing, state, paint } = await fixture('intro');
  const beat = timing.beats[1];
  const time = Array.from({ length: 200 }, (_, i) => beat.start + (beat.duration * i) / 200).find(
    (time) => {
      const current = animation.sampleModel('intro', state(time));
      return (
        current.stage === 5 && current.normalizedProgress > 0 && current.normalizedProgress < 1
      );
    },
  );
  assert(Number.isFinite(time));
  const audit = paint(time);
  assert(
    audit.labels.some((label) => label.text.includes('Target:') && label.text.includes('0.8485')),
    'the final normalization equation must be labeled as a target during the actual interpolation',
  );
});
