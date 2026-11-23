import assert from 'node:assert/strict';
import { prepareCaptions } from './captions.mjs';

import { LOGITS, PROBS, TARGET, GRAD, UPDATED, FRESH_LOGITS } from '../../../films/softmax/fixtures.mjs';
import {
  lossTrace,
  crossEntropy,
  positiveTemperature,
  positionReduction,
} from '../../../films/softmax/arithmetic.mjs';
import { completeModel, freshState, validateModel } from '../../../films/softmax/model.mjs';
import { substrate } from './print.mjs';
import {
  opening,
  gaps,
  exponentials,
  mass,
  price,
  jacobian,
  gradient,
  update,
  cooling,
  transfer,
} from './word-pages.mjs';
import { readers, readerState, lossChoice, apiInput, limits, smoothing } from './target-pages.mjs';
import {
  trainingTape,
  alignedLosses,
  ignored,
  candidate,
  weighting,
  weighted,
  tiles,
  twoReports,
  report,
} from './batch-pages.mjs';

const painters = [
  opening,
  gaps,
  exponentials,
  mass,
  price,
  jacobian,
  gradient,
  update,
  cooling,
  transfer,
  readers,
  lossChoice,
  apiInput,
  limits,
  smoothing,
  trainingTape,
  ignored,
  candidate,
  weighting,
  tiles,
  twoReports,
];
function draw(ctx, clock) {
  const index = clock.beat.chapterIndex;
  ctx.save();
  try {
    ctx.scale(1.2, 1.2);
    substrate(ctx, index < 10 ? '#b57c64' : index < 15 ? '#a2afa7' : '#89a5ae');
    painters[index](ctx, clock);
  } finally {
    ctx.restore();
  }
}
function check() {
  validateModel();
  const model = completeModel();
  const near = (a, b) => assert(Math.abs(a - b) < 1e-8, `Expected ${a} to equal ${b}`);
  assert.deepEqual(
    PROBS.map((v) => Math.round(100 * v)),
    [84, 11, 4],
  );
  assert.equal(TARGET, 1);
  const h = 1e-5;
  LOGITS.forEach((_, i) => {
    const plus = LOGITS.map((z, j) => z + (j === i ? h : 0)),
      minus = LOGITS.map((z, j) => z - (j === i ? h : 0));
    near((lossTrace(plus, TARGET).loss - lossTrace(minus, TARGET).loss) / (2 * h), GRAD[i]);
    const upper = lossTrace(plus, TARGET).probabilities;
    const lower = lossTrace(minus, TARGET).probabilities;
    upper.forEach((v, j) => near((v - lower[j]) / (2 * h), model.jacobian[j][i]));
  });
  assert(positiveTemperature(LOGITS, 0.35)[1] < 0.01);
  assert(lossTrace(UPDATED, 1).probabilities[1] > lossTrace(UPDATED, 1).probabilities[0]);
  near(lossTrace(LOGITS, 2).loss - lossTrace(LOGITS, 1).loss, 1);
  const cat = freshState(1);
  near(cat.gradient[2], cat.before.probabilities[2] - 1);
  cat.logits.forEach((z, j) => near(z, FRESH_LOGITS[j] - 1.5 * cat.gradient[j]));
  assert(cat.probabilities[2] > cat.before.probabilities[2]);
  assert.equal(crossEntropy(model.smooth, positiveTemperature([0, model.smoothGap, -Infinity], 1)), Infinity);
  const match = readerState(1, 0, 0, 0),
    miss = readerState(1, 1, 0, 0);
  near(match.loss, Math.log(2));
  near(match.kl, 0);
  near(miss.loss, -0.5 * Math.log(0.8 * 0.2));
  assert(miss.kl > 0);
  assert.equal(readerState(1, 1, 1, 1).loss, Infinity);
  const next = alignedLosses(false),
    current = alignedLosses(true);
  near(next[0].loss - current[0].loss, 2);
  near(current[1].loss - next[1].loss, 2);
  assert(next[0].loss > next[1].loss && current[0].loss < current[1].loss);
  const a = positionReduction([LOGITS, [0.5, 0, 2], [100, -100, 0]], [1, 2, -100]);
  const b = positionReduction([LOGITS, [0.5, 0, 2], [-50, 80, 20]], [1, 2, -100]);
  near(a.mean, b.mean);
  assert.equal(a.count, 2);
  const w = weighted([2, 4], [Math.log(2), Math.log(2)]);
  near(w.integer, Math.log(2));
  near(w.float, 3 * Math.log(2));
  const [firstTile, nextTile] = model.tiles;
  near(firstTile.total, 1 + Math.exp(-3));
  near(nextTile.retained, firstTile.total * Math.exp(2 - 4));
  near(nextTile.incoming, 1 + Math.exp(-4));
  near(nextTile.total, nextTile.retained + nextTile.incoming);
  const scores = [...firstTile.values, ...nextTile.values];
  near(nextTile.logSumExp - firstTile.values[0], lossTrace(scores, 0).loss);
  const before = report(0.25, 2),
    bad = report(0.25, 3),
    better = report(0.5, 2);
  near(bad.mean, better.mean);
  near(bad.total, before.total);
  assert(better.total < bad.total);
  assert.deepEqual(before.p, bad.p);
  assert.equal(before.count, better.count);
}
export default { title: 'Teach a Model What Happened Next', preparePicture: prepareCaptions, draw, check };
