import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as animation from '../animations/speculative-decoding.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();

async function fixture() {
  const id = 'speculative-decoding',
    lesson = await readLesson(path.join(root, `videos/lessons/${id}.lesson.yaml`), root);

  const timeline = await loadMeasuredTimeline(id);
  const index = lesson.scenes.findIndex((scene) => scene.id === 'residual'),
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

test('the measured zero-total clause paints zero deficits and explicitly skips normalization', async () => {
  const { timing, paint } = await fixture();
  const cue = timing.visualCues.find((cue) => cue.id === 'zero-residual');
  for (const time of [
    cue.start + 0.08,
    (cue.start + cue.end) / 2,
    cue.end - 0.04,
    timing.beats.at(-1).end - 1,
  ]) {
    const audit = paint(time),
      labels = audit.labels.map((label) => label.text);
    assert(
      labels.includes('Normalization skipped'),
      'the unreachable correction branch must not display a normalized bird probability',
    );
    assert(labels.includes('Rejection impossible · no correction draw'));
    assert(
      !labels.includes('0.30'),
      'the old nonzero deficit cannot remain during the zero-total claim',
    );
    assert(
      !labels.includes('1.00'),
      'the zero residual must not be normalized to a valid distribution',
    );
    assert.equal(labels.filter((label) => label === '0.00').length, 3);
  }
});

test('the displayed comparison feeds matching laws to the same residual calculation and preserves the original example beforehand', async () => {
  const { timing, state } = await fixture();
  const snapshot = (time) => {
    const current = state(time);
    return animation.residualSnapshot(current.beat, current.beatP, current.cues);
  };
  const zero = timing.visualCues.find((cue) => cue.id === 'zero-residual');
  const first = snapshot(timing.beats[1].end - 0.1);
  assert.deepEqual(first.p, animation.P);
  assert.deepEqual(first.q, animation.Q);
  assert.deepEqual(first.result.residual, [1, 0, 0]);
  for (const time of [zero.start + 0.08, zero.end, timing.beats.at(-1).end - 0.1]) {
    const current = snapshot(time);
    assert.deepEqual(current.p, current.q);
    assert.deepEqual(current.result.deficit, [0, 0, 0]);
    assert.equal(current.result.z, 0);
    assert.equal(current.result.residual, null);
    assert.deepEqual(current.result, animation.decomposition(current.p, current.q));
  }
});

test('matching readouts cannot coexist with a normalized nonzero residual during the measured transition', async () => {
  const { timing, state, paint } = await fixture();
  const matching = timing.visualCues.find((cue) => cue.id === 'matching-laws');
  const zero = timing.visualCues.find((cue) => cue.id === 'zero-residual');
  for (let time = matching.start; time <= zero.end; time += 1 / timing.fps) {
    const current = state(time),
      model = animation.residualSnapshot(current.beat, current.beatP, current.cues);
    const matchingReadout = model.q.every(
      (value, index) => value.toFixed(2) === model.p[index].toFixed(2),
    );
    if (!matchingReadout) continue;
    assert.deepEqual(
      model.q,
      model.p,
      'a displayed matching law must be the actual law used by the residual calculation',
    );
    assert.equal(model.result.z, 0);
    assert.equal(model.result.residual, null);
    const labels = paint(time).labels.map((label) => label.text);
    assert(labels.includes('Normalization skipped'));
    assert(!labels.includes('1.00'));
  }
});
