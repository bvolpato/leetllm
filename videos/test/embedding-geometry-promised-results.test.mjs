import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as model from '../animations/embedding-geometry.mjs';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

async function paintCue(sceneId, cueId, fraction = 0.5) {
  registerLessonFonts();
  const root = new URL('../../', import.meta.url).pathname;
  const lesson = await readLesson(root + 'videos/lessons/embedding-geometry.lesson.yaml', root);
  const scene = lesson.scenes.find((scene) => scene.id === sceneId);
  const sounds = scene.beats.map((beat, beatIndex) => ({
    beatIndex,
    words: beat.say.split(/\s+/).map((text, i) => ({ text, start: i * 0.4, end: (i + 1) * 0.4 })),
  }));
  const timing = makeSceneTimeline(
    scene,
    sounds.map((sound) => sound.words.at(-1).end),
  );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing);
  timing.cueTiming = 'provider-words';
  const cue = timing.visualCues.find((cue) => cue.id === cueId),
    time = Math.max(0, cue.start + (cue.end - cue.start) * fraction);
  const canvas = createCanvas(1920, 1080);
  return {
    cue,
    audit: drawFrame(
      canvas.getContext('2d'),
      lesson,
      scene,
      frameState(timing, time, lesson.scenes.indexOf(scene), lesson.scenes.length),
      model.draw,
    ),
  };
}

test('nearest-candidate narration paints actual ranked passages and focuses their result', async () => {
  const { audit, cue } = await paintCue('opening', 'opening-nearest-candidates-b1-1');
  const labels = audit.labels.filter((label) => label.alpha > 0.35).map((label) => label.text);
  for (const passage of model.METRICS) {
    assert(
      labels.some((text) => text.includes(passage.phrase)),
      `Candidate ${passage.id} must be visible during nearest candidates`,
    );
    assert(labels.some((text) => text.includes(passage.cosine.toFixed(3))));
  }
  assert(cue.targets.includes('nearest-candidates'));
});

test('the squared-distance clause paints both computed pairs and focuses the stated identity', async () => {
  const { audit } = await paintCue('normalize', 'normalize-unit-metric-equivalence-b2-1');
  const labels = audit.labels.filter((label) => label.alpha > 0.35);
  for (const row of model.UNIT_METRICS) {
    assert(
      labels.some((label) => label.text.includes(row.score.toFixed(3))),
      `Unit score ${row.id} must be visible`,
    );
    assert(
      labels.some((label) => label.text.includes(row.squaredDistance.toFixed(3))),
      `Squared distance ${row.id} must be visible`,
    );
    assert(Math.abs(row.squaredDistance - (2 - 2 * row.score)) < 1e-12);
  }
  const equation = labels.find((label) => label.text.includes('2-2'));
  assert(equation, 'The actual squared-distance identity must be painted');
  const target = audit.targets.find((target) => target.id === 'unit-metric-equivalence');
  const center = { x: equation.x + equation.width / 2, y: equation.y + equation.height / 2 };
  assert(
    center.x >= target.x &&
      center.x <= target.x + target.width &&
      center.y >= target.y &&
      center.y <= target.y + target.height,
    'The spoken identity must be inside its focus target',
  );
});

test('the upward-query answers wait for complete pair and normalized-verdict clauses', async () => {
  for (const [cueId, answer] of [
    ['fresh-dot-complete', 'A 0.200 · B 2.000'],
    ['fresh-cosine-complete', 'A 0.196 · B 0.447'],
    ['fresh-l2-complete', 'A 1.281 · B 4.123'],
    ['fresh-unit-complete', 'Unit-vector cosine / dot / L2² all choose B'],
  ]) {
    const before = (await paintCue('fresh-query', cueId, 0.99)).audit.labels.map((row) => row.text);
    assert(!before.includes(answer), `${cueId} revealed its answer before completion`);
    const after = (await paintCue('fresh-query', cueId, 1.01)).audit.labels.map((row) => row.text);
    assert(after.includes(answer), `${cueId} did not reveal its completed answer`);
  }
});

test('the supplied graph needs the retained worse route to expose its exact nearest point', () => {
  const narrow = model.graphSearch(1),
    intermediate = model.graphSearch(2),
    wider = model.graphSearch(3);
  assert.equal(narrow.winner, 'D');
  assert.equal(intermediate.winner, 'D');
  assert(!intermediate.events.some((row) => row.id === 'A'));
  assert.equal(wider.winner, 'E');
  assert(
    wider.events.findIndex((row) => row.id === 'A') <
      wider.events.findIndex((row) => row.id === 'C'),
  );
  assert(Math.abs(wider.distanceSquared - 0.01) < 1e-12);
});

test('the calibration intervention changes the actual candidate coordinates before publishing its winner', () => {
  const f = model.calibrationRanking();
  assert.equal(f.originalWinner, 1);
  assert.deepEqual(f.coarse[0], f.coarse[1]);
  assert.equal(f.coarseWinner, 0);
  assert.equal(f.fineWinner, 1);
  const active = (phase, progress) => ({ phase, progress });
  const partial = model.calibrationRankingFrame({
    cues: { 'calibration-direction-coarse': active('active', 0.5) },
  });
  assert.deepEqual(partial.rows[0], f.coarse[0]);
  assert.deepEqual(partial.rows[1], f.original[1]);
  assert.equal(partial.winner, null);
  const coarse = model.calibrationRankingFrame({
    cues: { 'calibration-direction-coarse': active('after', 1) },
  });
  assert.equal(coarse.winner, 0);
  const fine = model.calibrationRankingFrame({
    cues: {
      'calibration-direction-coarse': active('after', 1),
      'calibration-direction-fine': active('after', 1),
    },
  });
  assert.deepEqual(fine.rows, f.fine);
  assert.equal(fine.winner, 1);
});
