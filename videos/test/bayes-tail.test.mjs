import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import {
  betaDensity,
  betaTailProbability,
  draw,
  evidenceSnapshot,
  predictiveCountDistribution,
  priorIntervalSnapshot,
  updateSnapshot,
} from '../animations/bayes.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

test('the opening sweep stays legible and holds the reading and decision for their spoken answers', async () => {
  registerLessonFonts();
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const lesson = await readLesson(new URL('../lessons/bayes.lesson.yaml', import.meta.url), root);
  const scene = lesson.scenes[0];
  const [timing] = (await loadMeasuredTimeline('bayes')).scenes;
  timing.visualCues = resolveSceneCues(scene, timing);
  timing.cueTiming = 'provider-words';
  const reading = timing.visualCues.find((cue) => cue.id === 'opening-reading');
  const decision = timing.visualCues.find((cue) => cue.id === 'opening-decision');
  const canvas = createCanvas(1920, 1080);
  for (let frame = 0; frame < timing.frames; frame++) {
    const time = frame / timing.fps;
    const state = frameState(timing, time, 0, lesson.scenes.length);
    const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
    assert.deepEqual(layoutIssues(audit), [], `Intro geometry at frame ${frame}`);
    const labels = audit.labels.map((label) => label.text);
    assert.equal(labels.includes('57.9%'), time >= reading.end, `Tail reading at ${time}s`);
    assert.equal(labels.includes('Hold traffic'), time >= decision.end, `Decision at ${time}s`);
  }
});

test('release-tail probabilities match independent density integration', () => {
  for (const [a, b] of [
    [10, 4],
    [46, 13],
    [82, 22],
  ]) {
    const n = 4000,
      h = 0.3 / n;
    let integral = 0;
    for (let i = 0; i <= n; i++)
      integral += betaDensity(a, b, 0.7 + i * h) * (i === 0 || i === n ? 0.5 : 1) * h;
    assert.ok(Math.abs(betaTailProbability(a, b) - integral) < 1e-7);
  }
  assert.ok(Math.abs(betaTailProbability(10, 4) - 0.57939435) < 1e-8);
  assert.ok(Math.abs(betaTailProbability(82, 22) - 0.98104897) < 1e-8);
  assert.equal(betaTailProbability(10, 4, 0), 1);
  assert.equal(betaTailProbability(10, 4, 1), 0);
});

test('alternative evidence continues across the paragraph boundary without combining samples', () => {
  assert.deepEqual(evidenceSnapshot(0, 1), evidenceSnapshot(1, 0));
  let previousTail = 0;
  for (const beat of [0, 1])
    for (let i = 0; i <= 100; i++) {
      const v = evidenceSnapshot(beat, i / 100);
      assert.equal(v.passes / v.total, 0.8);
      assert.equal(v.a + v.b, v.total + 4);
      assert.equal(v.threshold, 0.7);
      assert.ok(v.tail >= previousTail - 1e-12);
      previousTail = v.tail;
    }
  const final = evidenceSnapshot(1, 1);
  assert.deepEqual([final.total, final.passes, final.a, final.b], [100, 80, 82, 22]);
  assert.equal(evidenceSnapshot(2, 0).tail, final.tail);
});

test('each pass arrives before failures and the completed posterior stays held', () => {
  const cue = (progress) => ({ phase: 'during', progress });
  for (let passes = 0; passes <= 8; passes++) {
    const v = updateSnapshot(1, 0.5, {
      'posterior-pass-arrivals': cue(passes / 8),
      'posterior-failure-arrivals': cue(0),
    });
    assert.deepEqual([v.passes, v.fails, v.a, v.b], [passes, 0, 2 + passes, 2]);
  }
  for (let fails = 0; fails <= 2; fails++) {
    const v = updateSnapshot(1, 0.8, {
      'posterior-pass-arrivals': cue(1),
      'posterior-failure-arrivals': cue(fails / 2),
    });
    assert.deepEqual([v.passes, v.fails, v.a, v.b], [8, fails, 10, 2 + fails]);
  }
  assert.equal(
    updateSnapshot(1, 0.9, {
      'posterior-pass-arrivals': cue(0.5),
      'posterior-failure-arrivals': cue(1),
    }).fails,
    0,
  );
  assert.deepEqual([updateSnapshot(2, 0).a, updateSnapshot(2, 0).b], [10, 4]);
});

test('shrinking the rate interval removes probability while its density stays positive', () => {
  let previous = 1;
  for (let i = 0; i <= 50; i++) {
    const v = priorIntervalSnapshot(2, i / 50);
    assert.ok(v.probability <= previous + 1e-12);
    assert.ok(Math.abs(v.density - 1.44) < 1e-12);
    previous = v.probability;
  }
  assert.equal(priorIntervalSnapshot(2, 1).probability, 0);
  assert.equal(priorIntervalSnapshot(2, 1).width, 0);
});

test('future count probabilities integrate the uncertain rate and preserve its predictive mean', () => {
  const rows = predictiveCountDistribution(),
    combinations = [1, 5, 10, 10, 5, 1],
    n = 4000,
    h = 1 / n;
  for (const row of rows) {
    let integral = 0;
    for (let i = 0; i <= n; i++) {
      const p = i * h;
      integral +=
        combinations[row.passes] *
        p ** row.passes *
        (1 - p) ** (5 - row.passes) *
        betaDensity(10, 4, p) *
        (i === 0 || i === n ? 0.5 : 1) *
        h;
    }
    assert.ok(Math.abs(row.probability - integral) < 1e-10);
  }
  assert.ok(Math.abs(rows.reduce((sum, row) => sum + row.probability, 0) - 1) < 1e-12);
  assert.ok(
    Math.abs(rows.reduce((sum, row) => sum + row.passes * row.probability, 0) - (5 * 10) / 14) <
      1e-12,
  );
});
