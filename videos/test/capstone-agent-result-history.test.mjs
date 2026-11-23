import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import * as agent from '../animations/capstone-production-llm-agent.mjs';
const { createCanvas } = createRequire(import.meta.url)('@napi-rs/canvas');
const lesson = await readRepositoryLesson(
  'videos/lessons/capstone-production-llm-agent.lesson.yaml',
);
registerLessonFonts();
const canvas = createCanvas(1920, 1080);
function prepare(id) {
  const scene = lesson.scenes.find((s) => s.id === id),
    index = lesson.scenes.indexOf(scene),
    sounds = scene.beats.map((b, beatIndex) => {
      const words = b.say.split(/\s+/);
      return {
        beatIndex,
        duration: words.length / 3,
        words: words.map((text, i) => ({ text, start: i / 3, end: (i + 1) / 3 - 0.005 })),
      };
    }),
    timing = makeSceneTimeline(
      scene,
      sounds.map((s) => s.duration),
    );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing);
  return { scene, index, timing };
}
function paint(p, time) {
  const a = drawFrame(
    canvas.getContext('2d'),
    lesson,
    p.scene,
    frameState(p.timing, time, p.index, lesson.scenes.length),
    agent.draw,
  );
  return a.labels.filter((l) => l.alpha > 0.05).map((l) => l.text);
}
const visible = (labels, text) => labels.some((v) => v.includes(text));

test('effect,permission and budget results wait for completed clauses', () => {
  const cases = [
    ['replay', 'retry-commit', 'Local effect committed'],
    ['replay', 'duplicate-replay', 'Duplicate ignored'],
    ['expiry', 'expired-execution', 'BLOCK: expired'],
    ['expiry', 'digest-mismatch', 'BLOCK: packet changed'],
    ['expiry', 'expiry-stale-result', 'BLOCK: stale preconditions'],
    ['trace-budget', 'budget-token-result', '570 /900'],
    ['trace-budget', 'budget-ms-result', '530 /1200'],
    ['trace-budget', 'budget-pass-result', '→all pass'],
    ['trace-budget', 'budget-expanded-result', '1070 /900'],
    ['trace-budget', 'budget-fail-result', '→all three exceed'],
    [
      'operational-contract',
      'durable-counterfactual-result',
      'Previously committed effect remains1',
    ],
    ['synthesis', 'synthesis-packet-result', 'BLOCK: packet changed'],
    ['synthesis', 'synthesis-stale-result', 'BLOCK: stale preconditions'],
    ['synthesis', 'synthesis-commit-result', 'Local effect committed'],
    ['synthesis', 'synthesis-replay-result', 'Duplicate ignored'],
  ];
  for (const [id, key, label] of cases) {
    const p = prepare(id),
      cue = p.timing.visualCues.find((c) => c.id === key);
    assert(!visible(paint(p, cue.end - 0.001), label), id + '/' + key + ' remains pending');
    assert(visible(paint(p, cue.end + 0.001), label), id + '/' + key + ' completes');
  }
});

test('the four earned attempt outcomes persist beside one committed effect', () => {
  const p = prepare('synthesis'),
    keys = [
      'synthesis-packet-result',
      'synthesis-stale-result',
      'synthesis-commit-result',
      'synthesis-replay-result',
    ],
    names = [
      '1 · packet changed',
      '2 · stale preconditions',
      '3 · committed',
      '4 · duplicate ignored',
    ];
  for (let stage = 0; stage < 4; stage++) {
    const cue = p.timing.visualCues.find((c) => c.id === keys[stage]),
      labels = paint(p, cue.end + 0.001);
    for (let i = 0; i < 4; i++)
      assert.equal(visible(labels, names[i]), i <= stage, 'stage' + stage + '/attempt' + i);
    assert(labels.includes('COUNT(*) = ' + (stage >= 2 ? 1 : 0)));
  }
  assert.deepEqual(
    agent.composedRepairFixture().steps.map((s) => s.effects),
    [0, 0, 1, 1],
  );
});
