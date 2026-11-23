import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as animation from '../animations/vision-transformers.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();

async function fixture() {
  const id = 'vision-transformers';
  const lesson = await readLesson(path.join(root, `videos/lessons/${id}.lesson.yaml`), root);

  const timeline = await loadMeasuredTimeline(id);
  const index = lesson.scenes.findIndex((scene) => scene.id === 'budget');
  const scene = lesson.scenes[index],
    measured = timeline.scenes.find((item) => item.id === scene.id);
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const state = (time) => frameState(timing, time, index, lesson.scenes.length);
  const model = (time) => {
    const current = state(time);
    return animation.budgetSnapshot(current.beat, current.beatP, current.cues);
  };
  const paint = (time) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      state(time),
      animation.draw,
    );
  return { timing, model, paint };
}

test('the narrated sixteenfold clause constructs both actual pair-grid axes before its end', async () => {
  const { timing, model, paint } = await fixture();
  const cue = timing.visualCues.find((cue) => cue.id === 'budget-attention-block-count-b2-1');
  const states = Array.from({ length: 41 }, (_, i) =>
    model(cue.start + ((cue.end - cue.start) * i) / 40),
  );
  assert.equal(states.at(-1).keyGroups * states.at(-1).queryGroups, 16);
  assert.equal(states[0].keyGroups, 1);
  assert.equal(states[0].queryGroups, 1);
  assert(
    states.some((state) => state.keyGroups === 4 && state.queryGroups === 1),
    'retain the key-only strip before adding queries',
  );
  assert(
    states.every(
      (state, i) =>
        !i ||
        state.keyGroups * state.queryGroups >= states[i - 1].keyGroups * states[i - 1].queryGroups,
    ),
  );
  for (const time of [cue.end, cue.end + 0.1, timing.duration - 0.3]) {
    const current = model(time);
    assert.equal(current.keyGroups, 4);
    assert.equal(current.queryGroups, 4);
    const audit = paint(time);
    const blocks = audit.targets.filter((target) => target.id === 'attention-pair-blocks');
    assert(blocks.length > 0);
    const bottom = Math.max(...blocks.map((block) => block.y + block.height));
    const top = Math.min(...blocks.map((block) => block.y));
    assert(
      Math.abs(bottom - top - 400) <= 2,
      'the painted grid must have four query groups, not only the four-key strip',
    );
  }
});
