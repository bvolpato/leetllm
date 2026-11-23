import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  alignmentFreshStep,
  alignmentFreshFrame,
  alignmentGae,
  alignmentClipping,
  alignmentTokenScores,
  alignmentReduction,
  draw,
} from '../animations/preference-alignment.mjs';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
const { createCanvas } = createRequire(new URL('../package.json', import.meta.url))(
  '@napi-rs/canvas',
);
const close = (a, b, tolerance = 1e-9) => assert(Math.abs(a - b) < tolerance, `${a} != ${b}`);

test('fresh three-logit DPO derivatives match independent central differences', () => {
  const v = alignmentFreshStep(),
    loss = (z) => Math.log1p(Math.exp(-0.5 * (z[0] - z[2]))),
    epsilon = 1e-5;
  for (let i = 0; i < 3; i++) {
    const plus = [...v.logits],
      minus = [...v.logits];
    plus[i] += epsilon;
    minus[i] -= epsilon;
    close((loss(plus) - loss(minus)) / (2 * epsilon), v.gradient[i]);
  }
  close(v.updated[1], v.logits[1]);
  assert(v.probabilities[1] > v.start[1]);
  assert(v.loss < v.beforeLoss);
  for (let i = 0; i <= 100; i++)
    close(
      alignmentFreshStep(i / 100).probabilities.reduce((a, p) => a + p, 0),
      1,
    );
});
test('terminal credit propagates once with the declared lambda and bootstrap', () => {
  assert.deepEqual(alignmentGae([0, 0, 1], [0, 0, 0, 0], 1, 0.5).advantages, [0.25, 0.5, 1]);
  assert.deepEqual(alignmentGae([0, 0, 1], [0, 0, 0, 0], 1, 1).advantages, [1, 1, 1]);
  const continuing = alignmentGae([0, 0, 1], [0, 0, 0, 2], 1, 1);
  assert.deepEqual(continuing.advantages, [3, 3, 3]);
});
test('clipping preserves all four signed plateau and active branches', () => {
  const epsilon = 1e-5;
  for (const [ratio, advantage, slope] of [
    [1.4, 2, 0],
    [0.7, -2, 0],
    [0.7, 2, 2],
    [1.4, -2, -2],
  ]) {
    const derivative =
      (alignmentClipping(ratio + epsilon, advantage).surrogate -
        alignmentClipping(ratio - epsilon, advantage).surrogate) /
      (2 * epsilon);
    close(derivative, slope);
  }
});
test('positional masks retain real zero IDs and isolate EOS cache changes', () => {
  const v = alignmentTokenScores(),
    withoutEos = alignmentTokenScores(0, 0, false);
  assert.deepEqual(v.selected, [false, false, true, true, true, false]);
  assert.equal(v.fixture.rejectedIds[3], 0);
  assert(v.rejectedTerms[3] < 0);
  close(v.chosenRef - withoutEos.chosenRef, Math.log(Math.exp(2) / (4 + Math.exp(2))));
  assert.equal(alignmentTokenScores(0, 1000).loss, v.loss);
  assert(alignmentTokenScores(1).loss < v.loss);
});
test('changing the reduction preserves token contributions while reversing the actual scores', () => {
  const start = alignmentReduction(0),
    mean = alignmentReduction(1);
  close(start.margin, 0.1);
  close(mean.margin, -0.05);
  close(start.rows[0].score, 0.4);
  close(start.rows[1].score, 0.3);
  close(mean.rows[0].score, 0.1);
  close(mean.rows[1].score, 0.15);
  for (let i = 0; i <= 100; i++) {
    const v = alignmentReduction(i / 100);
    for (const row of v.rows) {
      close(row.contribution * row.count, row.sum);
      close(row.score, row.contribution * row.count * row.weight);
    }
  }
  close(alignmentReduction(2 / 3).margin, 0);
});
test('fresh prediction holds all outputs and each normalized reveal independently', () => {
  const premature = alignmentFreshFrame({
    beat: 0,
    stepProgress: 1,
    gradientHeard: true,
    probabilitiesHeard: [true, true, true],
    lossHeard: true,
  });
  assert.equal(premature.showGradient, false);
  assert.deepEqual(premature.showProbabilities, [false, false, false]);
  assert.equal(premature.showTotal, false);
  assert.equal(premature.showLoss, false);
  const partial = alignmentFreshFrame({
    beat: 2,
    gradientHeard: true,
    probabilitiesHeard: [true, true, false],
  });
  assert.equal(partial.showGradient, false);
  assert.deepEqual(partial.showProbabilities, [true, true, false]);
  assert.equal(partial.showTotal, false);
  const complete = alignmentFreshFrame({
    beat: 2,
    probabilitiesHeard: [true, true, true],
    lossHeard: true,
  });
  assert.equal(complete.showTotal, true);
  assert.equal(complete.showLoss, true);
});
test('fresh normalized payoff replaces derivative arrows without crossing its labels', async () => {
  registerLessonFonts();
  const root = new URL('../../', import.meta.url).pathname,
    lesson = await readLesson(root + 'videos/lessons/preference-alignment.lesson.yaml', root),
    scene = lesson.scenes.find((s) => s.id === 'fresh-transfer');
  const sounds = scene.beats.map((beat) => {
    const words = beat.say.trim().split(/\s+/);
    return {
      duration: words.length / 2.5,
      words: words.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 - 0.005 })),
    };
  });
  const timeline = makeSceneTimeline(
    scene,
    sounds.map((s) => s.duration),
  );
  timeline.sounds = sounds;
  timeline.visualCues = resolveSceneCues(scene, timeline, sounds);
  timeline.cueTiming = 'estimated-lexical-words';
  const state = frameState(
      timeline,
      timeline.beats[2].end - 0.1,
      lesson.scenes.indexOf(scene),
      lesson.scenes.length,
    ),
    canvas = createCanvas(1920, 1080),
    audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
  assert.deepEqual([...(audit.issues ?? []), ...layoutIssues(audit)], []);
});

test('model-owner connectors clear snapshot text through the measured scene fade', () => {
  registerLessonFonts();
  for (const opacity of [1, 0.98, 0.9561042524005391, 0.9, 0.7]) {
    const canvas = createCanvas(1920, 1080),
      state = {
        beat: 2,
        beatP: 1,
        t: 65.33333333333333,
        duration: 65.56666666666666,
        opacity,
        cues: {},
      };
    const frame = drawFrame(
      canvas.getContext('2d'),
      {},
      { id: 'role-ownership', title: 'Keep model roles separate' },
      state,
      draw,
    );
    assert.deepEqual([...(frame.issues ?? []), ...layoutIssues(frame)], []);
  }
});
