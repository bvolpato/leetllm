import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
const require = createRequire(import.meta.url),
  source = process.env.LEETLLM_RAY_REPAIR_SOURCE;
const module = source
  ? await import(
      'data:text/javascript;base64,' +
        Buffer.from(
          fs
            .readFileSync(source, 'utf8')
            .replace(
              "from 'vizmatic'",
              "from '" + pathToFileURL(require.resolve('vizmatic')).href + "'",
            ),
        ).toString('base64')
    )
  : await import('../animations/deep-dive-ray.mjs');
const phase = (phase, progress = 0.99) => ({
  phase,
  progress: phase === 'before' ? 0 : phase === 'after' ? 1 : progress,
});
function paint(id, beat, cues = {}) {
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Reservation and ownership comparison' },
    { beat, beatP: 0.5, opacity: 1, cues },
    module.draw,
  )
    .labels.filter((x) => x.alpha > 0.1)
    .map((x) => x.text);
}
test('strict initial reservation conclusion waits while the supplied nodes remain visible', () => {
  const cues = { 'ray-placement-pending': phase('during') };
  let labels = paint('placement', 1, cues);
  assert(labels.includes('Node 0 · 2 GPUs available'));
  assert(labels.includes('Node 1 · 2 GPUs available'));
  assert(!labels.some((x) => x.startsWith('All four bundles pending')));
  labels = paint('placement', 1, { 'ray-placement-pending': phase('after') });
  assert(labels.includes('All four bundles pending · initial allocation stays atomic'));
});
test('a larger node is a premise before its four reservations are published', () => {
  let labels = paint('placement', 2, { 'ray-placement-reserved': phase('during') });
  assert(labels.includes('Node 0 · 4 GPUs available'));
  assert(!labels.some((x) => /^bundle [0-3]$/.test(x)));
  assert(!labels.includes('All four bundles reserved'));
  labels = paint('placement', 2, { 'ray-placement-reserved': phase('after') });
  for (let n = 0; n < 4; n++) assert(labels.includes('bundle ' + n));
  assert(labels.includes('All four bundles reserved'));
  assert.equal(paint('placement', 0).filter((x) => /^bundle [0-3]$/.test(x)).length, 4);
});
test('the general bundle rule does not advance the later four-GPU worked case', async () => {
  const p =
      process.env.LEETLLM_RAY_REPAIR_MARKUP ??
      path.resolve(new URL('../lessons/deep-dive-ray.lesson.yaml', import.meta.url).pathname),
    lesson = await readRepositoryLesson(p),
    scene = lesson.scenes.find((s) => s.id === 'bundle-membership'),
    sounds = scene.beats.map((b, i) => {
      const words = b.say.trim().split(/\s+/);
      return {
        beatIndex: i,
        duration: words.length * 0.4,
        words: words.map((text, n) => ({ text, start: n * 0.4, end: (n + 1) * 0.4 - 0.005 })),
      };
    }),
    timing = makeSceneTimeline(
      scene,
      sounds.map((s) => s.duration),
      30,
    );
  timing.visualCues = resolveSceneCues(scene, timing, sounds);
  const independent = structuredClone(scene);
  independent.beats.forEach((b) => delete b.visual_cues);
  independent.beats[1].visual_cues = [
    { id: 'general', phrase: 'Every individual bundle must fit on one node', targets: ['probe'] },
    {
      id: 'worked',
      phrase:
        'Replacing four one-GPU bundles with one four-GPU bundle cannot split that larger bundle across two smaller nodes',
      targets: ['probe'],
    },
  ];
  const c = resolveSceneCues(independent, timing, sounds),
    general = c.find((x) => x.id === 'general'),
    worked = c.find((x) => x.id === 'worked');
  const at = (time) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      frameState(timing, time, 0, 1),
      module.draw,
    ).labels.map((x) => x.text);
  assert(!at(general.end + 0.001).includes('Single GPU4 bundle cannot fit either node'));
  assert(!at(worked.end - 0.001).includes('Single GPU4 bundle cannot fit either node'));
  assert(at(worked.end + 0.001).includes('Single GPU4 bundle cannot fit either node'));
});
test('the fresh old-handle footer retains a neutral comparison through the owner result clause', () => {
  const labels = paint('fresh-owner', 1, {
    'ray-fresh-owner-error': phase('during'),
    'ray-fresh-batch-result': phase('before'),
  });
  assert(labels.includes('Node B · X bytes survive'));
  assert(labels.includes('Restored ledger · B41 →5'));
  assert(!labels.some((x) => x.startsWith('Old X stays unavailable')));
  assert(!labels.includes('get(X): OwnerDiedError'));
  const result = paint('fresh-owner', 1, {
    'ray-fresh-owner-error': phase('after'),
    'ray-fresh-batch-result': phase('before'),
  });
  assert(result.includes('get(X): OwnerDiedError'));
  assert(result.some((x) => x.startsWith('Old X stays unavailable')));
  assert(!result.includes('replay(B41):5 · no increment'));
});
