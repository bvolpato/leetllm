import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

const animation = await import(
  process.env.SEARCH_FUSION_MODULE ?? '../animations/design-llm-powered-search-engine.mjs'
);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();

test('the fusion caption names the visible leader only after its branch completes', async () => {
  const id = 'design-llm-powered-search-engine';
  const lesson = await readLesson(path.join(root, `videos/lessons/${id}.lesson.yaml`), root);
  const index = lesson.scenes.findIndex((scene) => scene.id === 'fusion'),
    scene = lesson.scenes[index];
  const measured = (await loadMeasuredTimeline(id)).scenes.find((scene) => scene.id === 'fusion');
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const ctx = createCanvas(1920, 1080).getContext('2d'),
    seen = new Set();
  for (let frame = 0; frame < timing.frames; frame++) {
    const state = frameState(timing, frame / timing.fps, index, lesson.scenes.length);
    const model = animation.sampleModel(scene.id, state);
    const held = frame >= timing.frames - 15;
    if (seen.has(model.count) && !held) continue;
    const labels = drawFrame(ctx, lesson, scene, state, animation.draw).labels.map(
      (label) => label.text,
    );
    const caption = labels.at(-1);
    if (!caption) continue;
    seen.add(model.count);
    if (!model.count) assert.equal(caption, 'Add each rank contribution once');
    else if (model.count % 2)
      assert.equal(caption, 'Partial branch sum · next rank contribution pending');
    else if (Math.abs(model.scores.Policy - model.scores.Exception) < 1e-12) {
      assert.equal(caption, 'Tie after the current complete branches');
    } else {
      const leader = model.scores.Policy > model.scores.Exception ? 'Policy' : 'Exception';
      const branch = ['lexical', 'dense', 'authorized rewrite'][model.active.at(-1).branch];
      assert.equal(caption, `${leader} ranks first after the ${branch} branch`);
      if (branch === 'lexical') assert.equal(model.lists.length, 2);
    }
  }
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3, 4, 5, 6]);
});
