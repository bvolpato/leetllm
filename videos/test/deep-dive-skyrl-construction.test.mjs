import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import {
  actionMeanNll,
  stampTurnRewards,
  admissionReceipt,
  counterTransition,
  liveRewardDecision,
  ppoReceipt,
  criticPairGate,
  normalizedClip,
  scalarResume,
  restoreProbe,
  fleetReady,
  stickyReplica,
  draw,
} from '../animations/deep-dive-skyrl.mjs';

const near = (actual, expected) => assert(Math.abs(actual - expected) < 1e-12);

test('the action mask excludes observations before numerical loss validation', () => {
  near(actionMeanNll([-0.2, -0.4, NaN, -0.6, -0.8], [1, 1, 0, 1, 1]), 0.5);
  assert.throws(() => actionMeanNll([-0.2, NaN], [1, 1]));
  assert.throws(() => actionMeanNll([-0.2], [0]));
  assert.throws(() => actionMeanNll([-0.2], [1, 0]));
});

test('turn endpoints respect truncation and the selected EOS or scalar-return contract', () => {
  const endpoints = [
    [-0.2, 1],
    [1, 4],
  ];
  assert.deepEqual(stampTurnRewards(endpoints, 5), [0, -0.2, 0, 0, 1]);
  assert.deepEqual(stampTurnRewards(endpoints, 4), [0, -0.2, 0, 0]);
  assert.deepEqual(stampTurnRewards(endpoints, 6, { eos: true }), [0, -0.2, 0, 0, 0, 1]);
  assert.equal(stampTurnRewards(endpoints, 6, { custom: true }), 1);
  assert.throws(() => stampTurnRewards(endpoints, 0));
});

test('admission removes consumed work and obeys both aggregate and worker margins', () => {
  const r = admissionReceipt({ B: 2, S: 2, step: 4, accepted: 10, running: 1, workers: 6 });
  assert.deepEqual(
    [r.consumed, r.limit, r.charged, r.outstanding, r.budget, r.available],
    [6, 12, 11, 5, 6, 1],
  );
  assert.equal(
    admissionReceipt({ B: 2, S: 2, step: 4, accepted: 7, running: 4, workers: 4 }).available,
    0,
  );
  const fresh = admissionReceipt({ B: 2, S: 1, step: 7, accepted: 13, running: 2, workers: 4 });
  assert.deepEqual([fresh.charged, fresh.limit, fresh.outstanding, fresh.budget], [15, 16, 3, 4]);
});

test('reservation, successful completion and filtering conserve submitted identities', () => {
  const start = { submitted: 4, accepted: 2, filtered: 0, running: 2 };
  const reserved = counterTransition(start, 'reserve');
  const completed = counterTransition(reserved, 'complete');
  const filtered = counterTransition(completed, 'filter');
  assert.deepEqual(reserved, { submitted: 5, accepted: 2, filtered: 0, running: 3 });
  assert.deepEqual(completed, { submitted: 5, accepted: 3, filtered: 0, running: 2 });
  assert.deepEqual(filtered, { submitted: 5, accepted: 2, filtered: 1, running: 2 });
  assert.deepEqual(start, { submitted: 4, accepted: 2, filtered: 0, running: 2 });
  assert.throws(() => counterTransition({ ...start, submitted: 5 }, 'reserve'));
});

test('zero-variance filtering uses live alternatives and preserves a singleton', () => {
  const equalLive = liveRewardDecision([1, 1, 0], [1, 1, 0]);
  assert.deepEqual(equalLive.selected, [1, 1]);
  assert.equal(equalLive.keep, false);
  assert.equal(liveRewardDecision([1, 0], [1, 0]).keep, true);
  assert.equal(liveRewardDecision([1, 0], [1, 1]).keep, true);
});

test('PPO applies the minimum to signed advantages and converts threshold conventions', () => {
  near(ppoReceipt(1.5, 0.5).surrogate, 0.6);
  near(ppoReceipt(0.5, -0.5).surrogate, -0.4);
  near(ppoReceipt(0.5, -0.5).loss, 0.4);
  const eps = normalizedClip(0.8, 1.2);
  near(eps.eps_clip_low, 0.2);
  near(eps.eps_clip_high, 0.2);
  assert.equal(criticPairGate([0.2, 0.4], null, [1, 1]), false);
  assert.equal(criticPairGate([0.2, 0.4], [0.7, 0.1], [1, 1]), true);
  assert.equal(criticPairGate([0.2], [0.7, 0.1], [1, 1]), false);
});

test('serialized next-update equivalence depends on velocity and the next example', () => {
  const saved = { weight: 2, velocity: 0.4 };
  const full = scalarResume(saved, 0.5),
    reset = scalarResume(saved, 0.5, { weightOnly: true }),
    stale = scalarResume(saved, -0.25);
  assert.notEqual(full.restored, saved);
  assert.deepEqual(JSON.parse(full.serialized), saved);
  near(full.weight, 1.92);
  near(reset.weight, 1.95);
  near(stale.weight, 1.995);
  assert.deepEqual(restoreProbe(0.49).restored, { weight: 1, velocity: 0, step: 10 });
  assert.deepEqual(restoreProbe(0.5).restored, { weight: 0.98, velocity: 0.2, step: 11 });
  assert.notEqual(restoreProbe(1).reference, restoreProbe(1).restored);
});

test('sticky sessions and fleet admission require their own complete evidence', () => {
  assert.equal(stickyReplica('Q42', {}, [1, 3, 2]), 0);
  assert.equal(stickyReplica('Q42', { Q42: 0 }, [9, 0, 1]), 0);
  assert.equal(fleetReady([18, 19, 19], 19, true, [true, true, true]), false);
  assert.equal(fleetReady([19, 19, 19], 19, false, [true, true, true]), false);
  assert.equal(fleetReady([19, 19, 19], 19, true, [true, false, true]), false);
  assert.equal(fleetReady([19, 19, 19], 19, true, [true, true]), false);
  assert.equal(fleetReady([19, 19, 19], 19, true, [true, true, true]), true);
});

function painted(id, beat, progress = {}) {
  const labels = [],
    noop = () => {};
  const api = {
    C: {
      ink: 'white',
      muted: 'gray',
      panel: 'black',
      blue: 'blue',
      cyan: 'cyan',
      green: 'green',
      pink: 'pink',
      yellow: 'yellow',
    },
    text: (_, text, x, y, size, color) => labels.push({ text: String(text), color }),
    math: (_, text, x, y, size, color) => labels.push({ text: String(text), color }),
    rect: noop,
    line: noop,
    arrow: noop,
    focus: {
      target: (_, paint) => paint(),
      progress: (cue, fallback) => progress[cue] ?? fallback,
    },
  };
  draw({}, { id }, { beat, beatP: 0.999, cues: {} }, api);
  return labels;
}

test('KV replay changes cache cells without changing delivered tokens or historical scores', () => {
  const stages = [0, 0.4, 0.6, 1].map((p) => painted('cache-recompute', 0, { 'sky-kv-clear': p }));
  for (const labels of stages) {
    for (const identity of ['11', '12', '90', '21', '22'])
      assert(labels.some((v) => v.text === identity));
    for (const score of ['-0.2', '-0.4', 'context', '-0.6', '-0.8'])
      assert(labels.some((v) => v.text === score));
    assert(labels.some((v) => v.text === 'Emitted action tokens: 4 · never resampled'));
  }
  assert.equal(stages[0].filter((v) => v.text === 'KV11').length, 5);
  assert.equal(stages[1].filter((v) => v.text === 'KV11').length, 1);
  assert.equal(stages[2].filter((v) => v.text === 'KV19').length, 1);
  assert.equal(stages[3].filter((v) => v.text === 'KV19').length, 5);
});

test('fresh outcomes stay pending until completed clauses and valid fleet evidence', () => {
  const question = painted('earned-handoff', 0);
  assert(!question.some((v) => v.text.includes('KEEP PAUSED') || v.text.includes('MAY RESUME')));
  assert(
    !painted('earned-handoff', 1, { 'sky-fresh-paused': 0.999 }).some((v) =>
      v.text.includes('KEEP PAUSED'),
    ),
  );
  assert(
    painted('earned-handoff', 1, { 'sky-fresh-paused': 1 }).some((v) =>
      v.text.includes('KEEP PAUSED'),
    ),
  );
  const incomplete = painted('earned-handoff', 2, { 'sky-fresh-resume': 1 });
  assert(!incomplete.some((v) => v.text.includes('MAY RESUME') || v.color === 'green'));
  const ready = painted('earned-handoff', 2, { 'sky-fresh-replica': 1, 'sky-fresh-resume': 1 });
  assert(ready.some((v) => v.text === 'NEW GENERATION MAY RESUME' && v.color === 'green'));
});

test('a completed future has traversed the backend rather than only being persisted', () => {
  const complete = painted('tinker-futures', 0, { 'sky-future-completion': 1 });
  assert(complete.some((v) => v.text === 'F7: completed' && v.color === 'green'));
  assert(complete.some((v) => v.text === 'backend: execute' && v.color === 'blue'));
});

test('standardization and the epoch barrier leave actual native text unobscured', async () => {
  const { createCanvas } = createRequire(import.meta.url)('@napi-rs/canvas');
  registerLessonFonts();
  const lesson = await readRepositoryLesson('videos/lessons/deep-dive-skyrl.lesson.yaml');
  const canvas = createCanvas(1920, 1080);
  for (const [id, time] of [
    ['reward-normalization', 23.8],
    ['schedule-comparison', 42.2],
  ]) {
    const index = lesson.scenes.findIndex((scene) => scene.id === id),
      scene = lesson.scenes[index];
    const sounds = scene.beats.map((beat) => {
      const words = beat.say.trim().split(/\s+/);
      return {
        duration: words.length / 2.5,
        words: words.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 - 0.005 })),
      };
    });
    const timing = makeSceneTimeline(
      scene,
      sounds.map((sound) => sound.duration),
      30,
    );
    timing.sounds = sounds;
    timing.visualCues = resolveSceneCues(scene, timing, sounds);
    const audit = drawFrame(
      canvas.getContext('2d'),
      lesson,
      scene,
      frameState(timing, time, index, lesson.scenes.length),
      draw,
    );
    assert.deepEqual([...(audit.issues ?? []), ...layoutIssues(audit)], [], id);
  }
});
