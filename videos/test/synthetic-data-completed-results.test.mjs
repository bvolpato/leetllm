import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { resolveSceneCues, sampleNarrationCues } from '../lib/narration-cues.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
const root = new URL('../..', import.meta.url).pathname,
  lab = root + '/build/video-delivery-20261106/shard-1/technical/synthetic-data-encoded-repair';
const { draw } = await import(
  process.env.SYNTHETIC_BEFORE === '1'
    ? new URL(lab + '/source-before.mjs', 'file:')
    : new URL('../animations/synthetic-data.mjs', import.meta.url)
);
const lesson = await readLesson(root + '/videos/lessons/synthetic-data.lesson.yaml', root),
  timeline = await loadMeasuredTimeline('synthetic-data');
registerLessonFonts();
function states(sid, cid) {
  const scene = lesson.scenes.find((x) => x.id === sid),
    tm = structuredClone(timeline.scenes.find((x) => x.id === sid));
  tm.visualCues = resolveSceneCues(scene, tm);
  tm.cueTiming = 'provider-words';
  const c = tm.visualCues.find((x) => x.id === cid);
  let frame = Math.floor(c.end * 30);
  while (sampleNarrationCues([c], frame / 30)[cid].phase !== 'after') frame++;
  while (sampleNarrationCues([c], (frame - 1) / 30)[cid].phase === 'after') frame--;
  return { scene, tm, c, frame };
}
function paint(sid, cid, role) {
  const { scene, tm, c, frame } = states(sid, cid),
    time =
      role === 'after' ? frame / 30 : role === 'last' ? (frame - 1) / 30 : (c.start + c.end) / 2;
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    frameState(tm, time, lesson.scenes.indexOf(scene), lesson.scenes.length),
    draw,
  );
}
const visible = (a, text) => a.labels.some((l) => l.alpha > 0.1 && l.text.includes(text));
const contracts = [
  ['execution-boundaries', 'edited-test-result', '10,000 ≤ 10,000 → pass'],
  ['execution-boundaries', 'trusted-failure', '10,000 ≤ 100 → fail'],
  ['admission-economics', 'four-calls', '2 rows × 2 orders = 4 calls'],
  ['admission-economics', 'pool-b-admitted', 'B admitted to this fixture pool'],
  ['admission-economics', 'pool-c-rejected', 'C rejected against B'],
  ['safe-preferences', 'safe-target', 'chosen → reject bypass'],
  ['safe-preferences', 'rejected-function-result', 'rejected → return success'],
  ['judge', 'judge-remap-result', 'B 0.70, A 0.30. The winner flipped'],
  ['fresh-admission', 'fresh-results', '0.005'],
];
for (const [sid, cid, text] of contracts)
  test(`${sid}: ${cid} completes before its fixed result`, () => {
    for (const role of ['during', 'last'])
      assert.equal(visible(paint(sid, cid, role), text), false, role);
    assert.equal(visible(paint(sid, cid, 'after'), text), true);
  });
test('both edited-test operands stay inspectable while their verdicts wait', () => {
  const a = paint('execution-boundaries', 'edited-test-result', 'during');
  assert(visible(a, '10,000 ≤ 10,000'));
  assert(visible(a, '10,000 ≤ 100'));
});
test('judge remapping has a real neutral target before its result', () => {
  const a = paint('judge', 'judge-remap-result', 'during');
  assert(visible(a, 'comparison pending'));
  assert(a.targets.some((t) => t.id === 'remapped-probability'));
});
test('the fresh measurements stay neutral until the retained release clause', () => {
  const a = paint('fresh-admission', 'fresh-results', 'after');
  assert(visible(a, '0.92'));
  assert(visible(a, '0.76'));
  assert(visible(a, '0.005'));
  assert(!visible(a, 'HOLD · rare-case'));
});
