import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';

const root = resolve(import.meta.dirname, '../..');
const lesson = await readLesson(resolve(root, 'videos/lessons/query-expansion.lesson.yaml'), root);
const animation = await import(
  pathToFileURL(
    resolve(root, process.env.QX_TEST_SOURCE ?? 'videos/animations/query-expansion.mjs'),
  )
);
const { createCanvas } = createRequire(import.meta.url)('@napi-rs/canvas');
registerLessonFonts();
const canvas = createCanvas(1920, 1080);
function labels(sceneId, cueId, after) {
  const scene = lesson.scenes.find((s) => s.id === sceneId);
  const sounds = scene.beats.map((beat, beatIndex) => {
    const words = beat.say.split(/\s+/);
    return {
      beatIndex,
      duration: words.length / 2.5,
      words: words.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 - 0.005 })),
    };
  });
  const timing = makeSceneTimeline(
    scene,
    sounds.map((s) => s.duration),
  );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing, sounds);
  const cue = timing.visualCues.find((c) => c.id === cueId),
    time = cue.end + (after ? 0.034 : -0.034);
  return drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    frameState(timing, time, lesson.scenes.indexOf(scene), lesson.scenes.length),
    animation.draw,
  ).labels.map((x) => x.text);
}
const cases = [
  [
    'hyde-vectors',
    'qx-mean-result',
    (s) => s.some((x) => x.includes('Current coordinate accumulation')),
    (s) => s.some((x) => x.includes('[0.30,0.70,0.30]')),
  ],
  [
    'self-rag-branches',
    'reflection-normalize',
    (s) => !s.some((x) => x.includes('=0.96')),
    (s) => s.some((x) => x.includes('=0.96')),
  ],
  ['self-rag-branches', 'qx-weighted-a', (s) => !s.includes('0.922'), (s) => s.includes('0.922')],
  ['self-rag-branches', 'qx-weighted-b', (s) => !s.includes('0.534'), (s) => s.includes('0.534')],
  [
    'self-rag-branches',
    'qx-branch-winner',
    (s) => !s.some((x) => x.startsWith('A wins')),
    (s) => s.some((x) => x.startsWith('A wins')),
  ],
  [
    'latency-waterfall',
    'qx-ttft-result',
    (s) => s.includes('Completed TTFT pending'),
    (s) => s.includes('395 ms'),
  ],
  [
    'latency-waterfall',
    'qx-percentile-result',
    (s) => !s.includes('19th sorted total = 110 ms'),
    (s) => s.includes('19th sorted total = 110 ms'),
  ],
  [
    'latency-waterfall',
    'qx-fanout-result',
    (s) => !s.some((x) => x.includes('.857')),
    (s) => s.some((x) => x.includes('.857')),
  ],
  ['route-release', 'route-gate', (s) => !s.includes('PASS'), (s) => s.includes('PASS')],
  [
    'route-release',
    'qx-tight-result',
    (s) => !s.some((x) => x.startsWith('No eligible route')),
    (s) => s.some((x) => x.startsWith('No eligible route')),
  ],
];
for (const [scene, cue, pending, complete] of cases)
  test(`${scene} completes ${cue} before painting its final consequence`, () => {
    assert(pending(labels(scene, cue, false)), 'completed consequence appeared during its clause');
    assert(complete(labels(scene, cue, true)), 'completed consequence missing after its clause');
  });
test('the route prediction holds between the question and its unchanged answer', () => {
  const s = lesson.scenes.find((s) => s.id === 'route-release');
  assert(s.beats[1].say.endsWith('Which route passes both?'));
  assert(s.beats[1].hold >= 1.5);
  assert.equal(s.beats[2].say, 'Rewrite does: point nine four and three hundred forty.');
});
