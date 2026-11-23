import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rlvrGroupUpdate,
  rlvrRepair,
  rlvrClipped,
  rlvrKl,
  rlvrReduction,
  rlvrDecimalCheck,
  rlvrMixedProbability,
} from '../animations/verifiable-rewards.mjs';
import { draw } from '../animations/verifiable-rewards.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';

import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
const close = (a, b, tolerance = 1e-9) => assert(Math.abs(a - b) < tolerance, `${a} != ${b}`);

test('infrastructure quarantine and parser repair alter the same identified reward population separately', () => {
  const bad = rlvrRepair(0),
    infra = rlvrRepair(1),
    strict = rlvrRepair(2);
  assert.deepEqual(bad.active, ['R1', 'R2', 'R3', 'R4']);
  assert.deepEqual(infra.active, ['R1', 'R2', 'R3']);
  assert.deepEqual(strict.active, infra.active);
  assert.deepEqual(infra.quarantined, ['R4']);
  assert.deepEqual(strict.quarantined, ['R4']);
  assert.deepEqual(infra.rewards, [1, 1, 0]);
  assert.deepEqual(strict.rewards, [1, 0, 0]);
  close(infra.std, strict.std);
  close(infra.advantages[0], Math.SQRT1_2);
  close(strict.advantages[0], Math.SQRT2);
  close(
    strict.advantages.reduce((a, b) => a + b, 0),
    0,
  );
});
test('a zero scalar group loss has the independently computed nonzero initial coordinate gradient', () => {
  const rewards = [1, 0, 0],
    v = rlvrGroupUpdate(rewards, 0.3),
    n = rewards.length,
    old = 1 / n;
  const loss = (z) => {
    const e = z.map(Math.exp),
      sum = e.reduce((a, b) => a + b, 0);
    return -e.reduce((s, x, i) => s + (x / sum / old) * v.advantages[i], 0) / n;
  };
  close(loss([0, 0, 0]), 0);
  const eps = 1e-5;
  for (let i = 0; i < n; i++) {
    const plus = [0, 0, 0],
      minus = [0, 0, 0];
    plus[i] = eps;
    minus[i] = -eps;
    close((loss(plus) - loss(minus)) / (2 * eps), v.gradient[i]);
  }
  close(v.probabilities[0], 0.3820124419074972);
  close(
    v.probabilities.reduce((a, b) => a + b, 0),
    1,
  );
  const eight = rlvrGroupUpdate([1, 0, 0, 1, 0, 1, 0, 1], 0.1);
  close(eight.expectedReward, 0.5062496744995104);
  assert.deepEqual(
    rlvrGroupUpdate([1, 1, 1]).gradient,
    [0, 0, 0].map((x) => -x),
  );
});
test('full-expectation and fixed-sampled-weight KL values agree while finite-difference gradients differ', () => {
  const theta = Math.log(4),
    v = rlvrKl(theta),
    eps = 1e-5;
  close(v.full, v.expectedSample);
  const full = (z) => rlvrKl(z).full,
    fixed = (z) => rlvrKl(z).sample.reduce((s, k, i) => s + v.p[i] * k, 0);
  close((full(theta + eps) - full(theta - eps)) / (2 * eps), v.fullGradient);
  close((fixed(theta + eps) - fixed(theta - eps)) / (2 * eps), v.fixedGradient);
  close(v.fullGradient, 0.2218070977791825);
  close(v.fixedGradient, 0.3);
});
test('token reduction retains all six active terms while changing their actual weight and loss', () => {
  const mean = rlvrReduction(0),
    global = rlvrReduction(1);
  close(mean.loss, 1);
  close(global.loss, 2 / 3);
  assert.deepEqual(mean.lengths, global.lengths);
  assert.deepEqual(mean.terms, global.terms);
  close(2 * mean.weights[0] + 4 * mean.weights[1], 1);
  close(2 * global.weights[0] + 4 * global.weights[1], 1);
  for (const [ratio, a, want] of [
    [0.7, 2, 1.4],
    [1.4, 2, 2.4],
    [0.7, -2, -1.6],
    [1.4, -2, -2.8],
  ])
    close(rlvrClipped(ratio, a).surrogate, want);
});
test('bounded decimal comparison preserves inclusive equality and a tail that binary floats erase', () => {
  assert.equal(rlvrDecimalCheck('50.36', '50.35', '0.01').pass, true);
  assert.equal(rlvrDecimalCheck('50.361', '50.35', '0.01').pass, false);
  assert.equal(Number('0.10000000000000000001'), Number('0.1'));
  assert.equal(rlvrDecimalCheck('0.10000000000000000001', '0.1').pass, false);
  assert.throws(() => rlvrDecimalCheck('1', '1', '-1'));
});
test('independent mixed-group probability handles impossible and certain groups without a false advantage', () => {
  close(rlvrMixedProbability(0.01, 64).mixed, 0.474403512474438);
  assert.equal(rlvrMixedProbability(0, 64).mixed, 0);
  assert.equal(rlvrMixedProbability(1, 64).mixed, 0);
});

test('derived categorical probabilities stay clear of their logit guides during the scene fade', async () => {
  registerLessonFonts();
  const lesson = await readRepositoryLesson('videos/lessons/verifiable-rewards.lesson.yaml'),
    scene = lesson.scenes.find((s) => s.id === 'categorical-step');
  for (const opacity of [1, 0.98, 0.9561042524005391, 0.9, 0.7])
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const cues = Object.fromEntries(
        scene.beats
          .flatMap((b) => b.visual_cues ?? [])
          .map((c) => [
            c.id,
            {
              phase: 'after',
              progress: 1,
              reveal: 1,
              active: false,
              strength: 0,
              targets: c.targets,
            },
          ]),
      );
      cues['vr-step-categorical-step'] = { ...cues['vr-step-categorical-step'], progress };
      const audit = drawFrame(
        createCanvas(1920, 1080).getContext('2d'),
        lesson,
        scene,
        {
          beat: 2,
          beatP: 1,
          t: 65.33333333333333,
          duration: 65.56666666666666,
          opacity,
          cueTiming: 'provider-words',
          cues,
        },
        draw,
      );
      assert.deepEqual([...audit.issues, ...layoutIssues(audit)], [], opacity + '/' + progress);
    }
});
