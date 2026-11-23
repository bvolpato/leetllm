import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as animation from '../animations/linear-algebra.mjs';
import { makeSceneTimeline, frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
registerLessonFonts();
const lesson = await readLesson(
  new URL('../lessons/linear-algebra.lesson.yaml', import.meta.url).pathname,
  new URL('../../', import.meta.url).pathname,
);
function timed(id) {
  const scene = lesson.scenes.find((s) => s.id === id),
    words = scene.beats[0].say
      .split(/\s+/)
      .map((text, i) => ({ text, start: i * 0.32, end: (i + 1) * 0.32 })),
    timing = makeSceneTimeline(scene, [words.at(-1).end]);
  timing.sounds = [{ beatIndex: 0, words }];
  timing.visualCues = resolveSceneCues(scene, timing);
  return {
    scene,
    timing,
    at(name, p) {
      const c = timing.visualCues.find((c) => c.id === name);
      return frameState(timing, c.start + p * (c.end - c.start), 0, 1);
    },
  };
}
const gram = timed('gram'),
  action = timed('gram-action');
const paint = (scene, state) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    scene,
    {
      ...state,
      opacity: 1,
      cues: Object.fromEntries(
        Object.entries(state.cues).map(([id, c]) => [id, { ...c, strength: 0 }]),
      ),
    },
    animation.draw,
  );

test('narrated feature-column products fill one computed Gram cell at a time', () => {
  for (let count = 0; count <= 4; count++) {
    const state = gram.at('gram-column-products', count / 4),
      frame = paint(gram.scene, state);
    const cells = frame.labels
      .filter((l) => l.x > 1200 && l.x < 1600 && l.y > 400 && l.y < 700)
      .map((l) => l.text);
    assert.deepEqual(
      cells,
      ['2', '1', '1', '2'].map((v, i) => (i < count ? v : '·')),
    );
    assert.equal(animation.gramConstruction(state).entryCount, count);
  }
  const held = frameState(gram.timing, gram.timing.beats[0].until - 0.05, 0, 1);
  assert.equal(animation.gramConstruction(held).entryCount, 4);
});

test('Gram actions and output norms derive from the supplied feature columns', () => {
  const model = animation.gramCalculation();
  assert.deepEqual(model.gram, [
    [2, 1],
    [1, 2],
  ]);
  assert.deepEqual(
    model.directions.map((row) => row.eigenvalue),
    [3, 1],
  );
  for (const row of model.directions) {
    row.action.forEach((v, i) => assert(Math.abs(v - row.eigenvalue * row.vector[i]) < 1e-12));
    assert(Math.abs(row.squaredNorm - row.eigenvalue) < 1e-12);
    assert(Math.abs(row.norm ** 2 - row.squaredNorm) < 1e-12);
  }
  const changed = animation.gramCalculation([
    [2, 0],
    [0, 1],
  ]);
  assert.deepEqual(changed.gram, [
    [4, 0],
    [0, 1],
  ]);
  assert.deepEqual(
    changed.directions.map((row) => row.norm),
    [2, 1],
  );
});

test('the actual action narration establishes eigenvalues before revealing singular strengths', () => {
  const before = action.at('gram-eigen-directions', 0),
    stretched = action.at('gram-eigen-directions', 1),
    completed = action.at('common-strength-b3-1', 1);
  assert.deepEqual(animation.gramConstruction(before).directionProgress, [0, 0]);
  assert.deepEqual(animation.gramConstruction(stretched).directionProgress, [1, 1]);
  assert.equal(animation.gramConstruction(stretched).normProgress, 0);
  assert.equal(animation.gramConstruction(completed).normProgress, 1);
  const a = paint(action.scene, stretched),
    z = paint(action.scene, completed);
  assert(!a.labels.some((l) => l.kind === 'math' && l.text.includes('\\sigma_1')));
  assert(z.labels.some((l) => l.kind === 'math' && l.text.includes('\\sigma_1=\\sqrt3')));
});
