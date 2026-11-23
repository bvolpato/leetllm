import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { resolveSceneCues, sampleNarrationCues } from '../lib/narration-cues.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

const root = new URL('../..', import.meta.url).pathname;
const lab =
  root + '/build/video-delivery-20261106/shard-1/technical/streaming-features-encoded-repair';
const { draw } = await import(
  process.env.STREAMING_BEFORE === '1'
    ? new URL(lab + '/source-before.mjs', 'file:')
    : new URL('../animations/streaming-features.mjs', import.meta.url)
);
const lesson = await readLesson(root + '/videos/lessons/streaming-features.lesson.yaml', root);
const timeline = await loadMeasuredTimeline('streaming-features');
const scene = lesson.scenes.find((s) => s.id === 'fresh-request'),
  index = lesson.scenes.indexOf(scene);
const tm = structuredClone(timeline.scenes.find((saved) => saved.id === scene.id));
tm.visualCues = resolveSceneCues(scene, tm);
tm.cueTiming = 'provider-words';
registerLessonFonts();
function paint(time) {
  const state = frameState(tm, time, index, lesson.scenes.length);
  return drawFrame(createCanvas(1920, 1080).getContext('2d'), lesson, scene, state, draw)
    .labels.filter((l) => l.alpha > 0.1)
    .map((l) => l.text);
}
function boundary(shortId) {
  const id = 'sf-fresh-request-' + shortId,
    c = tm.visualCues.find((c) => c.id === id);
  assert(c, 'Declared cue ' + id);
  let n = Math.floor(c.end * 30);
  while (sampleNarrationCues([c], n / 30)[id].phase !== 'after') n++;
  while (sampleNarrationCues([c], (n - 1) / 30)[id].phase === 'after') n--;
  return { c, before: (n - 1) / 30, after: n / 30 };
}
test('the fresh footer withholds computed source lag through its incomplete clause', () => {
  const { c, before, after } = boundary('lag');
  for (const time of [tm.beats[2].start + 0.3, (c.start + c.end) / 2, before]) {
    const labels = paint(time);
    assert(labels.some((s) => s === 'current heartbeat age 20 min'));
    assert(!labels.some((s) => s.includes('pipeline lag 30 min')));
    assert(!labels.some((s) => s.includes('30 min lag')));
  }
  const labels = paint(after);
  assert(labels.some((s) => s.includes('pipeline lag 30 min')));
  assert(labels.some((s) => s.includes('30 min lag')));
});
test('the earned lag summary yields to the separately earned fallback', () => {
  const { before, after } = boundary('fallback');
  assert(paint(before).some((s) => s.includes('Heartbeat age 20 min and pipeline lag 30 min')));
  assert(!paint(before).some((s) => s.startsWith('Validated degraded fallback')));
  assert(paint(after).some((s) => s.startsWith('Validated degraded fallback')));
});
