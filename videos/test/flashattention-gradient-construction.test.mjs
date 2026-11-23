import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleModel, gradientFixture } from '../animations/deep-dive-flashattention.mjs';

test('gradient construction keeps scalar operation progress separate from probability rows', () => {
  const s = sampleModel('gradient-rule', { beat: 1, beatP: 0.47 });
  assert.equal(typeof s.p, 'number');
  assert(Number.isFinite(s.p));
  assert.equal(s.count, 2);
  const g = gradientFixture();
  assert.equal(g.p.length, 4);
  assert(Math.abs(g.dS.reduce((a, v) => a + v, 0)) < 1e-12);
});
