import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scalarReverseTrace,
  posteriorFixture,
  crossReadFixture,
  freshDiffusionSnapshot,
} from '../animations/diffusion.mjs';

test('the carried scalar state resumes with the next saved draw rather than restarting the stream', () => {
  const { rows, restoredNext, resetNext, final } = scalarReverseTrace();
  assert.deepEqual(
    rows.map((r) =>
      [r.input, r.prediction, r.mean, r.draw, r.next].map((v) => Number(v.toFixed(3))),
    ),
    [
      [1.25, 0.603, 1.193, -0.256, 1.141],
      [1.141, 0.534, 1.086, 0.511, 1.174],
      [1.174, 0.528, 1.111, 0, 1.111],
    ],
  );
  assert.equal(rows[1].input, rows[0].next);
  assert.equal(rows[2].input, restoredNext);
  assert(Math.abs(resetNext - restoredNext) > 0.1);
  assert.equal(final, rows[2].next);
});

test('unknown clean identity retains between-component uncertainty', () => {
  const v = posteriorFixture();
  assert.equal(v.mean, 0);
  assert(Math.abs(v.total - 5 / 9) < 1e-12);
  assert(Math.abs(v.total - (v.within + v.means.reduce((n, x) => n + (x * x) / 2, 0))) < 1e-12);
  assert(v.total > v.within);
});

test('changed spatial queries recompute shares while preserving the same prompt keys and values', () => {
  const a = crossReadFixture(),
    b = crossReadFixture([0.45, 0.1, 0.4]);
  assert.deepEqual(a.keys, b.keys);
  assert.deepEqual(a.values, b.values);
  assert.notDeepEqual(a.shares, b.shares);
  assert(Math.abs(a.shares.reduce((n, x) => n + x, 0) - 1) < 1e-12);
  assert.deepEqual(
    a.output.map((x) => Number(x.toFixed(3))),
    [0.589, 0.311],
  );
  for (let i = 0; i < 2; i++)
    assert.equal(
      a.output[i],
      a.shares.reduce((n, w, j) => n + w * a.values[j][i], 0),
    );
});

test('fresh work, old-attempt fencing, derivative hold and commit reveal on separate completed clauses', () => {
  const cues = Object.fromEntries(
    ['fresh-work', 'fresh-old', 'fresh-current', 'fresh-commit'].map((x) => [
      'df-' + x,
      { phase: 'before', progress: 0 },
    ]),
  );
  for (const name of ['fresh-work', 'fresh-old', 'fresh-current']) {
    const field = { 'fresh-work': 'work', 'fresh-old': 'old', 'fresh-current': 'current' }[name];
    cues['df-' + name] = { phase: 'during', progress: 0.999 };
    assert.equal(freshDiffusionSnapshot({ beat: 1, beatP: 1, cues })[field], null);
    cues['df-' + name] = { phase: 'after', progress: 1 };
    assert.notEqual(freshDiffusionSnapshot({ beat: 1, beatP: 1, cues })[field], null);
  }
  cues['df-fresh-commit'] = { phase: 'during', progress: 0.999 };
  assert.equal(freshDiffusionSnapshot({ beat: 2, beatP: 1, cues }).published, false);
  cues['df-fresh-commit'] = { phase: 'after', progress: 1 };
  assert.equal(freshDiffusionSnapshot({ beat: 2, beatP: 1, cues }).published, true);
});
