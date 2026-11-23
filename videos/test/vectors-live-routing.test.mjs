import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import definition, * as vectors from '../films/vectors/index.mjs';
import { EXTENDED_SCENES } from '../films/vectors/model.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';

const repository = fileURLToPath(new URL('../..', import.meta.url));
const lesson = await readLesson(
  new URL('../lessons/vectors.lesson.yaml', import.meta.url),
  repository,
);
registerLessonFonts();

function invoke(draw, id) {
  const canvas = createCanvas(1920, 1080);
  const scene = lesson.scenes.find((scene) => scene.id === id) ?? { ...lesson.scenes[0], id };
  const state = { beat: 1, beatP: 0.8, t: 10, duration: 20, opacity: 1 };
  let error;
  let returned;
  drawFrame(canvas.getContext('2d'), lesson, scene, state, (ctx, scene, state, api) => {
    try {
      returned = draw(ctx, scene, state, api);
    } catch (caught) {
      error = caught;
    }
  });
  return { error, returned };
}

test('vectors draw preserves live extended-scene routing and original errors', () => {
  assert.strictEqual(vectors.EXTENDED_SCENES, EXTENDED_SCENES);
  assert.strictEqual(definition.draw, vectors.draw);
  assert.equal(vectors.draw.length, 4);
  const original = [...EXTENDED_SCENES];
  const restore = () => {
    EXTENDED_SCENES.clear();
    for (const id of original) EXTENDED_SCENES.add(id);
  };
  const cases = [
    { id: 'intro' },
    { id: 'latency-gradient' },
    {
      id: 'latency-gradient',
      operation: 'delete',
      error: 'Unknown vectors scene latency-gradient',
    },
    { id: 'intro', operation: 'add', error: 'Unknown extended vector scene intro' },
    { id: 'unknown-extra', error: 'Unknown vectors scene unknown-extra' },
    { id: 'unknown-extra', operation: 'add', error: 'Unknown extended vector scene unknown-extra' },
    { id: 'latency-gradient', operation: 'readd' },
  ];
  try {
    for (const draw of [vectors.draw, definition.draw]) {
      for (const scenario of cases) {
        restore();
        if (scenario.operation === 'readd') {
          EXTENDED_SCENES.delete(scenario.id);
          EXTENDED_SCENES.add(scenario.id);
        } else if (scenario.operation) {
          EXTENDED_SCENES[scenario.operation](scenario.id);
        }
        const observed = invoke(draw, scenario.id);
        if (scenario.error) {
          assert(observed.error instanceof Error, scenario.error);
          assert.equal(observed.error.message, scenario.error);
        } else {
          assert.equal(observed.error, undefined);
          assert.equal(observed.returned, undefined);
        }
      }
    }
  } finally {
    restore();
  }
  assert.deepEqual([...EXTENDED_SCENES], original);
});
