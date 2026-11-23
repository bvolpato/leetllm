import assert from 'node:assert/strict';
import { bg, cueClock } from './art.mjs';
import {
  m,
  shifted,
  cacheMask,
  gaze,
  scoresBytes,
  stepsForTiles,
  allowedShares,
  erasedShares,
  wrongAxis,
  symmetricScores,
  symmetricShares,
} from './fixtures.mjs';
import {
  opening,
  projections,
  scoring,
  softmaxScene,
  mixture,
  matrixScene,
  maskScene,
} from './reading.mjs';
import { variance, patterns, heads, paperScene, gradient, gradientState } from './heads.mjs';
import { cost, decode, stability, flash, tileState, diagnosis } from './memory.mjs';
import { reader, ending, revisedValues } from './practice.mjs';

const scenes = [
  opening,
  projections,
  scoring,
  softmaxScene,
  mixture,
  matrixScene,
  maskScene,
  variance,
  patterns,
  heads,
  paperScene,
  gradient,
  cost,
  decode,
  stability,
  flash,
  diagnosis,
  reader,
  ending,
];
function draw(c, clock) {
  c.save();
  c.scale(1.6, 1.6);
  const n = clock.beat.chapterIndex;
  bg(c, n >= 12 && n <= 16 ? '#eff1e9' : n === 9 ? '#f6eddd' : '#f8f3e7');
  scenes[n](c, cueClock(clock));
  c.restore();
}
function check() {
  const fixed = (a) => a.map((n) => n.toFixed(2));
  assert.deepEqual(fixed(m.OUTPUT[1]), ['1.42', '1.58']);
  m.close(m.DROPPED_SHARE * 0.5, m.WEIGHTS[1][1], 1e-12);
  assert.deepEqual(fixed(m.blendOf([0, m.DROPPED_SHARE], m.V)), fixed(m.DROPPED_OUTPUT));
  assert.deepEqual(fixed(m.DROPPED_OUTPUT), ['1.16', '2.32']);
  assert.deepEqual(
    m.V.map((v, i) => fixed(v.map((n) => n * m.WEIGHTS[1][i]))),
    [
      ['0.84', '0.42'],
      ['0.58', '1.16'],
    ],
  );
  assert.deepEqual(fixed(shifted(0, 1)), ['0.21', '0.79']);
  assert.deepEqual(fixed(m.HEAD2_OUTPUT), ['0.33', '0.67']);
  assert.equal(symmetricScores[0][1], symmetricScores[1][0]);
  assert.deepEqual(fixed(symmetricShares[1]), ['0.27', '0.73']);
  assert.deepEqual(fixed(wrongAxis[1]), ['0.45', '0.55']);
  wrongAxis.forEach((row) => m.close(row[0] + row[1], 1, 1e-12));
  assert.deepEqual(fixed(allowedShares), ['0.73', '0.27', '0.00']);
  assert.deepEqual(fixed(erasedShares), ['0.05', '0.02', '0.00']);
  assert.deepEqual(cacheMask([3, 4], [0, 1, 2, 3, 4], [1]), [
    [true, false, true, true, false],
    [true, false, true, true, true],
  ]);
  assert.deepEqual(cacheMask([0], [0, 1, 2, 3, 4]), [[true, false, false, false, false]]);
  for (const [n, r, indices] of [
    [8, 3, [2, 0]],
    [8, 4, [3, 0]],
    [4, 3, [2, 0]],
  ]) {
    const rows = gaze(n, r);
    assert.deepEqual(
      rows.map((w) => w.indexOf(Math.max(...w))),
      indices,
    );
    rows.forEach((w) =>
      m.close(
        w.reduce((a, b) => a + b),
        1,
        1e-12,
      ),
    );
  }
  assert.equal(scoresBytes(8, 32, 8192), m.SCORE_BYTES);
  assert.equal(scoresBytes(4, 16, 4096) / 2 ** 30, 2);
  assert.deepEqual(
    [64, 8, 1].map((h) => Math.round(m.cacheBytes(h) / 1e9)),
    [344, 43, 5],
  );
  const end = (b) => ({ b, at: (n) => Number(b >= n) });
  assert.deepEqual(fixed(gradientState(end(4)).shares), ['0.66', '0.34']);
  assert.deepEqual(gradientState(end(4)).out, [3, -1]);
  assert.deepEqual(fixed(gradientState(end(6)).slope), ['0.00', '0.00']);
  assert.deepEqual(gradientState(end(7)).shares, [0, 1]);
  assert.deepEqual(fixed(gradientState(end(8)).shares), ['0.01', '0.99']);
  for (const high of [1001, 1002]) {
    const tr = stepsForTiles(high);
    const full = m.softmax(tr.scores).reduce((a, w, i) => a + w * tr.values[i], 0);
    m.close(full, tr.output, 1e-12);
    m.close(tileState(end(high === 1001 ? 11 : 16)).sum, tr.sum, 1e-12);
  }
  m.close(tileState(end(8)).sum, Math.exp(-1), 1e-12);
  assert.equal(tileState(end(8)).highIn, false);
  assert.equal(stepsForTiles(1002).sum.toFixed(2), '1.19');
  assert.deepEqual(fixed(m.NEW_QUERY), ['2.50', '3.50']);
  assert.deepEqual(fixed(m.NEW_SCORES), ['2.70', '3.90']);
  for (const t of [0, 0.5, 1]) {
    const out = m.blendOf(m.NEW_WEIGHTS, revisedValues(t));
    m.close(out[0], m.NEW_OUTPUT[0], 1e-12);
    m.close(out[1] - m.NEW_OUTPUT[1], 2 * t * m.NEW_WEIGHTS[0], 1e-12);
  }
  assert.deepEqual(fixed(m.blendOf(m.NEW_WEIGHTS, revisedValues(1))), ['1.30', '2.30']);
}
export default { title: 'How Attention Builds Context', draw, check };
