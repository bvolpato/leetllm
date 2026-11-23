import test from 'node:test';
import assert from 'node:assert/strict';
import {
  binomialMass,
  poissonMass,
  rareEventBudget,
  mm1Means,
  queuePlan,
  metropolisAcceptance,
  ksGeometry,
  tokenProbabilities,
} from '../animations/sampling.mjs';
const near = (a, b, t = 1e-12) => assert(Math.abs(a - b) < t, `${a} != ${b}`);
test('discrete counts preserve total probability and the binomial variance', () => {
  const n = 100,
    p = 0.72,
    masses = Array.from({ length: n + 1 }, (_, k) => binomialMass(k, n, p));
  near(
    masses.reduce((a, b) => a + b, 0),
    1,
  );
  near(
    masses.reduce((a, v, k) => a + v * k, 0),
    72,
  );
  near(
    masses.reduce((a, v, k) => a + v * (k - 72) ** 2, 0),
    20.16,
  );
  near(poissonMass(0, 0), 1);
  near(poissonMass(2, 0), 0);
});
test('Poisson mixture preserves its supplied mean while enlarging the costly tail', () => {
  const tail = (rate) =>
    1 - Array.from({ length: 6 }, (_, k) => poissonMass(k, rate)).reduce((a, b) => a + b, 0);
  const mixed = 0.88 * tail(1.2) + 0.12 * tail(10);
  assert(mixed > 4 * tail(2.2));
  near(0.88 * 1.2 + 0.12 * 10, 2.256);
});
test('rare-event detection budget is the minimal integer meeting its target', () => {
  const q = 0.0001,
    n = rareEventBudget(q);
  assert.equal(n, 29956);
  assert((1 - q) ** n <= 0.05);
  assert((1 - q) ** (n - 1) > 0.05);
  assert.throws(() => rareEventBudget(0));
});
test('M/M/1 refuses finite stationary means at and above service capacity', () => {
  near(mm1Means(15, 20).total, 0.2);
  near(mm1Means(19, 20).queue, 0.95);
  assert.equal(mm1Means(20, 20).stable, false);
  assert.equal(mm1Means(21, 20).total, undefined);
});
test('a new worker changes admission starts rather than isolated service times', () => {
  const a = [0, 5, 10, 15],
    s = [20, 20, 20, 20],
    one = queuePlan(a, s),
    two = queuePlan(a, s, 2);
  assert.deepEqual(
    one.map((r) => r.total),
    [20, 35, 50, 65],
  );
  assert.deepEqual(
    two.map((r) => r.start),
    [0, 5, 20, 25],
  );
  assert.deepEqual(
    two.map((r) => r.total),
    [20, 20, 30, 30],
  );
  assert(one.every((r) => r.service === 20));
});
test('FCFS chooses an available lane, retains request identity and rejects reversed arrival order', () => {
  assert.deepEqual(
    queuePlan([0, 10, 20], [50, 50, 50]).map((r) => [r.id, r.start, r.finish]),
    [
      [1, 0, 50],
      [2, 50, 100],
      [3, 100, 150],
    ],
  );
  assert.throws(() => queuePlan([10, 0], [1, 1]));
  assert.throws(() => queuePlan([0], [1], 0));
});
test('Metropolis includes the reverse proposal factor and rejects out-of-support proposals', () => {
  assert.equal(metropolisAcceptance(0.5, 0.6), 1);
  const reverse = metropolisAcceptance(0.6, 0.5);
  assert(reverse < 0.4 && reverse > 0.37);
  near(metropolisAcceptance(0.6, 0.5, 0.5), reverse * 0.5);
  assert.equal(metropolisAcceptance(0.6, 1), 0);
});
test('KS checks the left side of a step rather than only the post-step empirical height', () => {
  const g = ksGeometry([0.8], (x) => x)[0];
  near(g.gap, 0.8);
  near(g.before, 0);
  near(g.after, 1);
  assert.throws(() => ksGeometry([], (x) => x));
});
test('temperature changes the categorical probabilities while preserving finite-logit order', () => {
  const cold = tokenProbabilities(0.3),
    base = tokenProbabilities(),
    hot = tokenProbabilities(2);
  for (const row of [cold, base, hot]) {
    near(
      row.reduce((a, b) => a + b, 0),
      1,
    );
    assert(row.every((v, i) => !i || row[i - 1] > v));
  }
  assert(cold[0] > base[0] && base[0] > hot[0]);
  assert(hot[3] > base[3]);
  assert.throws(() => tokenProbabilities(0));
});

import { createCanvas } from '@napi-rs/canvas';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import * as film from '../animations/sampling.mjs';
registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(new URL('../lessons/sampling.lesson.yaml', import.meta.url), root);
function estimatedCueFrame(id, cueId, progress) {
  const scene = lesson.scenes.find((s) => s.id === id),
    sounds = scene.beats.map((b, beatIndex) => {
      const words = b.say.split(/\s+/);
      return {
        beatIndex,
        duration: words.length / 2.5,
        words: words.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 - 0.005 })),
      };
    });
  const timeline = makeSceneTimeline(
    scene,
    sounds.map((s) => s.duration),
    30,
  );
  timeline.sounds = sounds;
  timeline.visualCues = resolveSceneCues(scene, timeline, sounds);
  timeline.cueTiming = 'estimated-lexical-words';
  const cue = timeline.visualCues.find((c) => c.id === cueId),
    time =
      progress < 0
        ? cue.start - 0.01
        : progress > 1
          ? cue.end + cue.linger + 0.01
          : cue.start + (cue.end - cue.start) * progress;
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    frameState(timeline, time, lesson.scenes.indexOf(scene), lesson.scenes.length),
    film.draw,
  );
}
test('the changed queue holds the prediction and earns each relative-deadline count with four retained service intervals', () => {
  const before = estimatedCueFrame('fresh-plan', 'sp-fresh-plan-0', 0.8),
    one = estimatedCueFrame('fresh-plan', 'sp-fresh-one-result', 2),
    two = estimatedCueFrame('fresh-plan', 'sp-fresh-two-result', 2);
  assert(!before.labels.some((l) => /^[24] \/ 4 within/.test(l.text)));
  assert(one.labels.some((l) => l.text === '2 / 4 within own 40 ms'));
  assert(two.labels.some((l) => l.text === '4 / 4 within own 40 ms'));
  for (const audit of [one, two]) {
    assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
    const bars = audit.shapes.filter((s) => s.kind === 'rect' && Math.abs(s.height - 50) < 1e-8);
    assert.equal(bars.length, 4);
    for (const bar of bars) near(bar.width, 252);
  }
});
test('the exponential-race explanation retains the completed perturbed scores when its next beat starts', () => {
  const audit = estimatedCueFrame('gumbel-race', 'sp-gumbel-race-2', -1);
  const clearEndpoint = { x: 280 + ((1 + 0.5) / 4) * 1080, y: 365 + ((5 - 3.75) / 8) * 455 };
  assert(
    audit.shapes.some(
      (s) =>
        s.kind === 'circle' &&
        Math.abs(s.width - 30) < 1e-8 &&
        Math.abs(s.center.x - clearEndpoint.x) < 1e-8 &&
        Math.abs(s.center.y - clearEndpoint.y) < 1e-8,
    ),
  );
});
