import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { resolveSceneCues, sampleNarrationCues } from '../lib/narration-cues.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
const root = new URL('../..', import.meta.url).pathname,
  lab =
    root + '/build/video-delivery-20261106/shard-1/technical/embedding-projection-encoded-repair',
  freeze =
    process.env.PROJECTION_BEFORE === '1'
      ? JSON.parse(fs.readFileSync(lab + '/freeze-before.json'))
      : undefined;
const { draw } = await import(
  process.env.PROJECTION_BEFORE === '1'
    ? pathToFileURL(freeze.snapshot + '/videos/animations/embedding-projection.mjs')
    : new URL('../animations/embedding-projection.mjs', import.meta.url)
);
const lesson = await readLesson(root + '/videos/lessons/embedding-projection.lesson.yaml', root),
  timeline = await loadMeasuredTimeline('embedding-projection');
registerLessonFonts();
function states(sceneId, cueId) {
  const scene = lesson.scenes.find((s) => s.id === sceneId),
    tm = structuredClone(timeline.scenes.find((s) => s.id === sceneId));
  tm.visualCues = resolveSceneCues(scene, tm);
  tm.cueTiming = 'provider-words';
  const c = tm.visualCues.find((c) => c.id === cueId);
  assert(c, 'Declared ' + cueId);
  let n = Math.floor(c.end * 30);
  while (sampleNarrationCues([c], n / 30)[cueId].phase !== 'after') n++;
  while (sampleNarrationCues([c], (n - 1) / 30)[cueId].phase === 'after') n--;
  return { scene, tm, c, n };
}
function paint(sceneId, cueId, role) {
  const { scene, tm, c, n } = states(sceneId, cueId),
    time = role === 'after' ? n / 30 : role === 'last' ? (n - 1) / 30 : (c.start + c.end) / 2;
  const a = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    frameState(tm, time, lesson.scenes.indexOf(scene), lesson.scenes.length),
    draw,
  );
  return a.labels.filter((l) => l.alpha > 0.1).map((l) => l.text);
}
const contracts = [
  ['pca-fit', 'pca-scores', 'Coordinates: −√2, 0, +√2'],
  ['random-projection', 'jl-dimension', 'k ≥ 6,368'],
  ['scalar-binary', 'codec-bytes', 'float 1,024 B'],
  ['scalar-binary', 'oversample', '240 candidates'],
  ['product-quantization', 'pq-storage', '64×'],
  ['product-quantization', 'pq-lookup', '.050 + .050 = .100'],
  ['release-experiment', 'release-pick', 'PASS'],
  ['release-experiment', 'release-24', '24× raw coordinate/code saving'],
  ['fresh-projection', 'fresh-doc', 'projected [2, −1]'],
  ['fresh-projection', 'fresh-query', 'projected [2.2, 0.4]'],
  ['fresh-projection', 'fresh-cosine', 'Cosine = 0.8'],
  ['fresh-projection', 'fresh-negative-query', 'projected [-2.2, -0.4]'],
  ['fresh-projection', 'fresh-negative', 'Cosine = -0.8'],
  ['fresh-projection', 'fresh-repair', 'Same artifact →'],
  ['fresh-projection', 'fresh-recover', 'Controlled repair restores cosine .8'],
  ['fresh-projection', 'fresh-old-cosine', 'Original uncentered cosine ≈ .949'],
];
for (const [sid, cid, label] of contracts)
  test(`${cid}: the computed result waits for its complete spoken clause`, () => {
    for (const role of ['during', 'last'])
      assert(!paint(sid, cid, role).some((s) => s.includes(label)), role);
    assert(
      paint(sid, cid, 'after').some((s) => s.includes(label)),
      'after',
    );
  });
test('fresh projection keeps supplied input identities and a real operation while coordinates wait', () => {
  const p = paint('fresh-projection', 'fresh-doc', 'during');
  assert(p.includes('Document [4, 2]'));
  assert(p.includes('Query [3, 3]'));
  assert(p.includes('Center [4, 2] − [2, 1]'));
  assert(p.includes('Project with saved ordered directions'));
});
test('the query sign-change keeps the document coordinate and withholds the new query and cosine', () => {
  const p = paint('fresh-projection', 'fresh-negative-query', 'during');
  assert(p.includes('projected [2, −1]'));
  assert(p.includes('Query-only sign change: projection pending'));
  assert(p.includes('Cosine comparison pending'));
  assert(!p.some((s) => s.startsWith('Cosine =')));
});
test('artifact loading remains pending until the whole repair and replay operation completes', () => {
  const p = paint('fresh-projection', 'fresh-repair', 'during');
  assert(p.includes('Loading saved mean, basis and normalization · replay pending'));
  assert(p.includes('Replay result comparison pending'));
});
