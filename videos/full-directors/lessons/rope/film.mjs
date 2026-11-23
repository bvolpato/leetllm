import assert from 'node:assert/strict';
import {
  absoluteExpansion,
  absoluteRow,
  alibiSlopes,
  dot,
  frequencySchedules,
  rotateHead,
  rotatePair,
  softmax,
  toBfloat16,
} from '../../../films/rope/arithmetic.mjs';
import {
  cacheFixture,
  cacheChunkInSlots,
  contentOutputs,
  pairingTrace,
} from '../../../films/rope/model.mjs';
import { CLOCK_FREQUENCIES, content } from '../../../films/rope/fixtures.mjs';
import { blank } from './drawing.mjs';
import { wordsScenes, swapPoints } from './words.mjs';
import {
  geometryScenes,
  fastScore,
  layoutExample,
  partialHead,
  patchTrial,
  routingState,
  shiftedPair,
  slowScore,
  splitOrder,
} from './geometry.mjs';
import {
  lengthScenes,
  bandRate,
  baseTrial,
  biased,
  llamaFrequencyRatio,
  phaseProbe,
  scaledBase,
  temperatureModel,
  trials,
} from './length.mjs';
import { cacheScenes, adaptedRow, cachedPair, candidates, meets, slotOrder } from './cache.mjs';

const scenes = [...wordsScenes, ...geometryScenes, ...lengthScenes, ...cacheScenes];
function close(actual, expected, tol = 1e-10) {
  assert.ok(Math.abs(actual - expected) <= tol, `${actual} differs from ${expected}`);
}
function sameRow(actual, expected) {
  assert.equal(actual.length, expected.length);
  actual.forEach((z, i) => close(z, expected[i]));
}
function check() {
  assert.equal(scenes.length, 32);
  const permuted = [2, 1, 0].map((i) => content[i]);
  permuted.forEach((q, i) => {
    const w = softmax(permuted.map((k) => dot(q, k) / Math.sqrt(2)));
    sameRow(
      [0, 1].map((j) => w.reduce((a, z, k) => a + z * permuted[k][j], 0)),
      contentOutputs[2 - i],
    );
  });
  close(contentOutputs[0][0], 0.802224, 1e-5);
  assert.deepEqual(swapPoints(0)[0], [365, 520]);
  close(swapPoints(1)[0][0], 1555);
  assert.ok(swapPoints(0.5)[0][1] + 200 < swapPoints(0.5)[2][1]);
  sameRow(absoluteRow(2, [1]), [Math.sin(2), Math.cos(2)]);
  close(absoluteExpansion(0).terms[3], absoluteExpansion(4).terms[3]);
  const a = [
    [2, 0],
    [0, 1],
  ];
  assert.ok(Math.abs(absoluteExpansion(0, a).terms[3] - absoluteExpansion(4, a).terms[3]) > 0.05);
  for (const shift of [0, 2, 4, 8]) {
    const s = shiftedPair(shift);
    close(s.q - s.k, 2);
    close(dot(rotatePair([1, 0], s.qa), rotatePair([1, 0], s.ka)), s.score);
    close(s.score, Math.cos(1));
    close(s.projection, Math.cos(1));
  }
  close(shiftedPair(8, 2).score, 2 * Math.cos(1));
  close(fastScore(2 * Math.PI), -1);
  close(fastScore(4 * Math.PI), 1);
  close(slowScore(4 * Math.PI), 0.809017, 0.000001);
  for (const gap of [12, 13]) {
    close(fastScore(gap), dot([1, 0], rotatePair([1, 0], -0.5 * gap)));
    close(slowScore(gap), dot([1, 0], rotatePair([1, 0], -0.05 * gap)));
  }
  close(fastScore(12), 0.960170, 0.000001);
  close(fastScore(13), 0.976588, 0.000001);
  const parts = CLOCK_FREQUENCIES.map((f) => Math.cos(-2 * f));
  assert.deepEqual(
    parts.map((x) => x < 0),
    [true, false, false, false],
  );
  close(parts.reduce((a, z) => a + z, 0) / Math.sqrt(8), 0.9064, 0.001);
  const partial = partialHead();
  assert.deepEqual(partial.rq.slice(4), partial.q.slice(4));
  assert.deepEqual(partial.rk.slice(4), partial.k.slice(4));
  close(
    partial.total,
    partial.parts.reduce((a, z) => a + z, 0),
  );
  close(partial.total / Math.sqrt(8), 0.4453, 0.0001);
  const pair = pairingTrace();
  close(pair.adjacent, pair.converted);
  close(pair.wrong, -1.616, 0.001);
  const { adjacent, rotaryWidth } = layoutExample;
  const order = splitOrder(adjacent.length, rotaryWidth);
  const converted = order.map((i) => adjacent[i]);
  sameRow(converted, [4, 7, -2, -1, 3, 8, 6, 9]);
  const rates = [1, 0.1, 0.01];
  const rotatedAdjacent = rotateHead(adjacent, 5, rates);
  sameRow(
    rotateHead(converted, 5, rates, 'split'),
    order.map((i) => rotatedAdjacent[i]),
  );
  for (const move of [0, 0.5, 1]) {
    const axial = patchTrial(move, false);
    sameRow(axial.offsets, [-1, 0]);
    close(axial.score, 1 + Math.cos(0.5));
    const missingHeight = patchTrial(move, true);
    sameRow(missingHeight.key, axial.key);
    sameRow(missingHeight.query, axial.query);
    sameRow(missingHeight.offsets, [0, 0]);
    close(missingHeight.score, 2);
  }
  for (const p of [3, 4.5, 6]) {
    const { queryAngle, keyAngles, scores, logits, weights, output } = routingState(p);
    const query = rotatePair([1, 0], queryAngle);
    sameRow(scores, keyAngles.map((angle) => dot(query, rotatePair([1, 0], angle))));
    sameRow(logits, scores.map((score) => score / Math.sqrt(2)));
    close(weights.reduce((total, weight) => total + weight, 0), 1);
    sameRow(output, weights);
  }
  close(routingState(3).weights[0], 0.218264, 0.000001);
  close(routingState(6).weights[0], 0.277160, 0.000001);
  close(biased(6, 0.5).logit, 2);
  close(biased(6, 1 / 16).share, 0.437823, 0.00001);
  close(biased(11, 0.5).share, 0);
  assert.deepEqual(alibiSlopes(3), [1 / 16, 1 / 256, 1 / 4]);
  close(16384 * alibiSlopes(8)[7], 64);
  assert.equal(toBfloat16(4097), 4096);
  assert.ok(Math.cos(4097) !== Math.cos(4096));
  assert.equal(phaseProbe(4097, true).phase, phaseProbe(4096).phase);
  const endRows = [16382, 16383].map((id) => phaseProbe(id));
  sameRow(endRows.map((r) => r.phase), [16382, 16383]);
  close(endRows[0].cosine, -0.164359, 0.000001);
  close(endRows[1].cosine, -0.918831, 0.000001);
  const limit = phaseProbe(2 ** 24), next = phaseProbe(2 ** 24 + 1);
  assert.notEqual(limit.id, next.id);
  assert.equal(limit.phase, next.phase);
  close(limit.cosine, 0.626323, 0.000001);
  assert.equal(limit.cosine, next.cosine);
  assert.equal(scaledBase({ ...baseTrial, scale: 1 }), 10000);
  assert.equal(Math.round(scaledBase(baseTrial)), 40890);
  sameRow([baseTrial.query - baseTrial.near, baseTrial.query - baseTrial.far], [1000, 15000]);
  sameRow([1024, 2048, 4096, 8192, 12288].map(llamaFrequencyRatio), [1, 1, 5 / 12, 1 / 8, 1 / 8]);
  const schedule = frequencySchedules(4, 8);
  sameRow(
    schedule.pi,
    schedule.original.map((f) => f / 4),
  );
  close(schedule.ntk[1] / schedule.original[1], 4 ** (-1 / 3));
  close(schedule.yarn[2], 0.003835, 0.000001);
  schedule.yarn.forEach((rate, i) => close(bandRate(schedule, i, false).rate, rate));
  sameRow(
    schedule.original.map((_, i) => bandRate(schedule, i, true).share),
    [1, 1, 0.5, 0],
  );
  close(bandRate(schedule, 2, true).rate, 0.00625);
  const amp = 1 + 0.1 * Math.log(4);
  close(temperatureModel(amp, false).logits[0], amp ** 2);
  assert.ok(temperatureModel(amp, true).shares[2] > 0.999);
  assert.deepEqual(
    trials.map((v) => v.answer === 'lime 7'),
    [true, false],
  );
  assert.deepEqual(candidates.map(meets), [false, true]);
  const elm = candidates[1];
  for (const mismatch of [
    { prompt: elm.prompt + 1 },
    { short: 0.89 },
    { long: 0.83 },
    { cachedRate: 0.01 },
    { queryRate: 0.01 },
  ])
    assert.equal(meets({ ...elm, ...mismatch }), false);
  const cache = cacheFixture(),
    chunk = cacheChunkInSlots([1, 2], slotOrder, true);
  assert.deepEqual(chunk.permissions, [
    [false, true, true],
    [true, true, true],
  ]);
  cache.full.forEach((row, i) => sameRow(row, cache.incremental[i]));
  chunk.outputs.forEach((row, i) => sameRow(row, cache.full[i + 1]));
  const leaked = cacheChunkInSlots([1, 2], slotOrder, false);
  assert.ok(leaked.outputs[0][2] > 0.5);
  sameRow(leaked.outputs[1], chunk.outputs[1]);
  assert.ok(Math.abs(cache.reset[2] - cache.full[2][2]) > 0.01);
  sameRow(adaptedRow(), cache.repaired);
  assert.ok(Math.abs(cache.mixed[0] - cache.repaired[0]) > 0.01);
  const key = cachedPair();
  close(key.stored[0], 0.608351, 0.000001);
  close(key.stored[1], 0.793668, 0.000001);
  for (let step = 0; step <= 40; step++) close(cachedPair(21 + step, 18 + step).score, key.score);
  close(key.score, 0.362358, 0.000001);
  close(cachedPair(21, 2).score, 0.25126, 0.00001);
  close(cachedPair(21, 18, 1).score, 0.96017, 0.00001);
  return true;
}
export default {
  title: 'How Position Changes Attention',
  check,
  draw(c, t) {
    blank(c);
    scenes[t.beat.chapterIndex](c, t);
  },
};
