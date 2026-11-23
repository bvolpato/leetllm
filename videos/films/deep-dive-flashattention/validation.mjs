import {
  gradientFixture,
  keepMask,
  localMask,
  meanMask,
  packedAverage,
  referenceCases,
  sum,
  summary,
  tileSummary,
} from './arithmetic.mjs';
import { scores, values } from './fixtures.mjs';
import {
  decodeValues,
  fallbackScores,
  sampleModel,
  sampleOriginalModel,
  transferQueries,
  transferValues,
} from './construction.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  const z = summary(4),
    w = scores.map((v) => Math.exp(v - 3)),
    dense = [0, 1].map((d) => sum(w.map((p, i) => p * values[i][d])) / sum(w));
  const cases = referenceCases();
  assert(cases.every((test) => test.passed));
  assert.deepEqual(cases[2].tiled, [0]);
  assert(cases[3].tiled[0] < 20);
  assert(cases[3].tiled[1] > 100);
  z.output.forEach((v, i) => assert(Math.abs(v - dense[i]) < 1e-12));
  assert(Math.abs(summary(4, false).output[0] - dense[0]) > 0.01);
  assert.deepEqual(keepMask(2, 5, 'right'), [
    [true, true, true, true, false],
    [true, true, true, true, true],
  ]);
  assert.deepEqual(
    keepMask(5, 2, 'right').slice(0, 3),
    Array.from(
      {
        length: 3,
      },
      () => [false, false],
    ),
  );
  assert.equal(
    sampleOriginalModel('intro', {
      beat: 2,
      beatP: 0.5,
    }).scoreBytes,
    2048,
  );
  assert.deepEqual(
    sampleOriginalModel('packed', {
      beat: 1,
      beatP: 1,
    }).offsets,
    [0, 3, 5],
  );
  assert.deepEqual(
    sampleOriginalModel('packed', {
      beat: 2,
      beatP: 0.5,
      cues: { 'packed-admit': { phase: 'after' }, 'packed-restore': { phase: 'before' } },
    }).offsets,
    [0, 4, 5],
  );
  assert.deepEqual(
    sampleOriginalModel('packed', {
      beat: 2,
      beatP: 1,
    }).offsets,
    [0, 3, 5],
  );
  assert.equal(
    sampleOriginalModel('contracts', {
      beat: 1,
      beatP: 0,
    }).ready,
    false,
  );
  assert.equal(
    sampleOriginalModel('contracts', {
      beat: 2,
      beatP: 0,
    }).fallbackGiB,
    32,
  );
  assert.equal(
    sampleOriginalModel('online', {
      beat: 1,
      beatP: 1,
    }).alpha,
    1,
  );
  assert.equal(
    sampleOriginalModel('online', {
      beat: 2,
      beatP: 1,
    }).alpha,
    Math.exp(-1),
  );
  for (const beatP of [0, 0.25, 0.75, 0.999])
    assert.equal(
      sampleOriginalModel('online', {
        beat: 3,
        beatP,
      }).oldL,
      summary(2).l * Math.exp(-1),
    );
  return true;
}
export function validateModel() {
  validateOriginalModel();
  const g = gradientFixture();
  assert(Math.abs(sum(g.p) - 1) < 1e-12);
  assert(Math.abs(sum(g.dS)) < 1e-12);
  const eps = 1e-5,
    loss = (q) => {
      const a = scores.map((v) => v * q),
        m = Math.max(...a),
        w = a.map((v) => Math.exp(v - m)),
        n = sum(w);
      return sum(w.map((v, i) => v * (values[i][0] - values[i][1]))) / n;
    };
  assert(Math.abs((loss(1 + eps) - loss(1 - eps)) / (2 * eps) - g.dQ) < 1e-8);
  assert.deepEqual(meanMask(localMask(2, 5, 1, 0)), [35, 45]);
  assert.deepEqual(meanMask(keepMask(5, 2, 'right'), [10, 20]), [0, 0, 0, 10, 15]);
  assert.equal(packedAverage(3), 14 / 3);
  assert.equal(packedAverage(4), 28.5);
  assert.equal(
    sampleModel('workspace-accounting', {
      beat: 1,
      beatP: 1,
    }).scoreBytes,
    32 * 2 ** 30,
  );
  assert.equal(
    sampleModel('workspace-accounting', {
      beat: 1,
      beatP: 1,
    }).lseBytes,
    8 * 2 ** 20,
  );
  assert.deepEqual(meanMask(keepMask(2, 5, 'left'), decodeValues), [10, 15]);
  assert.deepEqual(meanMask(keepMask(2, 5, 'right'), decodeValues), [25, 30]);
  assert.deepEqual(
    meanMask(keepMask(transferQueries, transferValues.length, 'right'), transferValues),
    [0, 0, 6, 9, 14],
  );
  assert.deepEqual(
    [3, 2, 1].map((n) => {
      const buffer = fallbackScores(n);
      return [buffer.scoreBytes, buffer.fits];
    }),
    [
      [720, false],
      [480, true],
      [240, true],
    ],
  );
  assert.equal(sampleModel('intro', { beat: 1, beatP: 1 }).pairsVisited, 64);
  assert.equal(sampleModel('intro', { beat: 3, beatP: 1 }).pairsVisited, 1024);
  assert(values.every((v) => sum(v) === 10));
  assert(Math.abs(sum(g.output) - 10) < 1e-12);
  const first = summary(2),
    next = tileSummary(2, 4);
  const wrong = first.u.map((v, d) => (v + next.u[d]) / g.l);
  assert.deepEqual(
    wrong.map((v) => v.toFixed(3)),
    ['5.877', '9.691'],
  );
  assert.deepEqual(
    sampleModel('layout-heads', {
      beat: 1,
      beatP: 1,
    }).map,
    [0, 0, 0, 1, 1, 1],
  );
  return true;
}
