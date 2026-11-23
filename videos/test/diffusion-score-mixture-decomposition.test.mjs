import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { draw, mixture, scoreProbe } from '../animations/diffusion.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();

function previousScore(point, addedVariance) {
  const centers = [
      [-1.45, -0.65],
      [1.45, -0.65],
      [0, 1.25],
    ],
    variance = 0.07 + addedVariance;
  const logWeights = centers.map(
    ([x, y]) => -((point[0] - x) ** 2 + (point[1] - y) ** 2) / (2 * variance),
  );
  const largest = Math.max(...logWeights),
    weights = logWeights.map((value) => Math.exp(value - largest));
  const total = weights.reduce((sum, value) => sum + value, 0),
    score = [0, 0];
  for (let i = 0; i < centers.length; i++) {
    score[0] += ((weights[i] / total) * (centers[i][0] - point[0])) / variance;
    score[1] += ((weights[i] / total) * (centers[i][1] - point[1])) / variance;
  }
  return score;
}

async function measuredScoreCue() {
  const lesson = await readLesson(path.join(root, 'videos/lessons/diffusion.lesson.yaml'), root);

  const timeline = await loadMeasuredTimeline('diffusion');
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'score'),
    scene = lesson.scenes[sceneIndex];
  const measured = timeline.scenes.find((item) => item.id === scene.id);
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const cue = timing.visualCues.find((item) => item.id === 'score-beat-2-focus-2');
  assert(cue, 'the component explanation must resolve to measured provider words');
  const stateAt = (time) => frameState(timing, time, sceneIndex, lesson.scenes.length);
  const paintAt = (time) => {
    const state = stateAt(time);
    // Keep measured cue phase/progress and linger while disabling focus dimming and outlines.
    state.cues = Object.fromEntries(
      Object.entries(state.cues).map(([id, value]) => [
        id,
        { ...value, active: id === cue.id && value.active, strength: 0 },
      ]),
    );
    state.cueTiming = 'provider-words';
    const context = createCanvas(1920, 1080).getContext('2d');
    return drawFrame(context, lesson, scene, state, draw);
  };
  return { timing, cue, stateAt, paintAt };
}

function nearPoint(actual, expected, tolerance = 1e-6) {
  assert.ok(
    Math.hypot(actual.x - expected.x, actual.y - expected.y) <= tolerance,
    `expected (${actual.x}, ${actual.y}) near (${expected.x}, ${expected.y})`,
  );
}

test('posterior-weighted local Gaussian scores preserve the exact mixture score and density gradient', () => {
  const point = scoreProbe(),
    h = 1e-5;
  for (const addedVariance of [0, 0.8, 3]) {
    const base = mixture(point, addedVariance),
      detailed = mixture(point, addedVariance, { includeComponents: true });
    assert.deepEqual(
      base.score,
      previousScore(point, addedVariance),
      'the aggregate retains the prior floating-point accumulation',
    );
    assert.deepEqual(detailed.score, base.score);
    assert.equal(detailed.density, base.density);
    assert.equal(detailed.components.length, 3);
    assert.ok(
      Math.abs(
        detailed.components.reduce((sum, component) => sum + component.posteriorWeight, 0) - 1,
      ) < 1e-14,
    );
    for (let axis = 0; axis < 2; axis++) {
      const left = [...point],
        right = [...point];
      left[axis] -= h;
      right[axis] += h;
      const mixtureGradient =
        (Math.log(mixture(right, addedVariance).density) -
          Math.log(mixture(left, addedVariance).density)) /
        (2 * h);
      assert.ok(Math.abs(mixtureGradient - base.score[axis]) < 1e-6);
      for (const component of detailed.components) {
        const variance = 0.07 + addedVariance;
        const logGaussian = (q) =>
          -((q[0] - component.center[0]) ** 2 + (q[1] - component.center[1]) ** 2) / (2 * variance);
        const localGradient = (logGaussian(right) - logGaussian(left)) / (2 * h);
        assert.ok(Math.abs(localGradient - component.localScore[axis]) < 1e-6);
        assert.ok(
          Math.abs(
            component.posteriorWeight * component.localScore[axis] - component.contribution[axis],
          ) < 1e-12,
        );
      }
    }
  }
});

test('measured cluster words build a large head-to-tail decomposition and retain its completed score', async () => {
  const { cue, paintAt } = await measuredScoreCue();
  const decomposition = mixture(scoreProbe(), 3, { includeComponents: true });
  const time = (progress) => cue.start + (cue.end - cue.start) * progress;
  const at = (progress) => {
    const audit = paintAt(time(progress));
    return {
      audit,
      vectors: audit.connectors.filter((x) => x.strokeWidth === 6),
      totals: audit.connectors.filter((x) => x.strokeWidth === 7),
    };
  };
  const early = at(0.2),
    middle = at(0.5),
    late = at(0.85),
    before = at(0.999),
    held = at(1.01),
    expired = at(1.5);
  assert.equal(early.vectors.length, 1);
  assert.equal(middle.vectors.length, 2);
  assert.equal(late.vectors.length, 3);
  assert.equal(before.totals.length, 0);
  assert.equal(held.totals.length, 1);
  assert.equal(
    expired.totals.length,
    1,
    'the completed decomposition remains available after the short focus linger',
  );
  assert(held.audit.labels.some((x) => x.text === 'Complete score'));
  const origin = { x: 850, y: 910 },
    scale = 650,
    [first, second, third] = late.vectors;
  nearPoint(first.from, origin);
  nearPoint(first.to, {
    x: origin.x + scale * decomposition.components[0].contribution[0],
    y: origin.y - scale * decomposition.components[0].contribution[1],
  });
  nearPoint(second.from, first.to);
  nearPoint(third.from, second.to);
  nearPoint(third.to, {
    x: third.from.x + scale * decomposition.components[2].contribution[0] * (0.85 * 3 - 2),
    y: third.from.y - scale * decomposition.components[2].contribution[1] * (0.85 * 3 - 2),
  });
  const total = held.totals[0];
  nearPoint(total.from, { x: 1500, y: 865 });
  nearPoint(total.to, {
    x: 1500 + scale * decomposition.score[0],
    y: 865 - scale * decomposition.score[1],
  });
});
