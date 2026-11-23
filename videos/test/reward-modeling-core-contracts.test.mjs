import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stablePairLoss,
  rewardHeadFit,
  finalUnmasked,
  rewardEnsemble,
  rewardFreshScreen,
} from '../animations/reward-modeling.mjs';

test('mask readout rejects empty input and follows the greatest unmasked position rather than a padding assumption', () => {
  assert.equal(finalUnmasked([1, 1, 0]), 1);
  assert.equal(finalUnmasked([0, 1, 1]), 2);
  assert.equal(finalUnmasked([1, 0, 1, 0]), 2);
  assert.throws(() => finalUnmasked([0, 0]), /empty/);
  assert.throws(() => finalUnmasked([1, 0.5]), /binary/);
});
test('the executed fit preserves the controlled failure despite perfect training rank', () => {
  const c = rewardHeadFit([
      [1, 1],
      [1, 1],
    ]).weights,
    b = rewardHeadFit([
      [1, 1],
      [1, -1],
    ]).weights;
  const rank = (w, d) => w.reduce((s, x, i) => s + x * d[i], 0) > 0;
  assert(
    [
      [1, 1],
      [1, 1],
    ].every((d) => rank(c, d)),
  );
  assert(
    [
      [1, 1],
      [1, -1],
    ].every((d) => rank(b, d)),
  );
  const held = [
    [1, -2],
    [1, -3],
    [1, 0],
  ];
  assert.equal(held.filter((d) => rank(c, d)).length, 1);
  assert.equal(held.filter((d) => rank(b, d)).length, 3);
  assert.equal(b[1], 0);
  assert(Math.abs(c[0] - c[1]) < 1e-12);
});
test('extreme pair logits remain finite while unanimous scores retain shared error', () => {
  assert.equal(stablePairLoss(-1000), 1000);
  assert.equal(stablePairLoss(1000), 0);
  assert.deepEqual(rewardEnsemble([1, 3, 5], 0.5), { mean: 3, sd: 2, aggregate: 2 });
  assert.deepEqual(rewardEnsemble([7, 7, 7]), { mean: 7, sd: 0, aggregate: 7 });
});
test('fresh pair, ensemble and source results stay independently held at late progress until their own narration cues', () => {
  const ids = ['fresh-pair-result', 'fresh-ensemble-result', 'fresh-source-result'],
    cues = Object.fromEntries(ids.map((id) => [id, { phase: 'before', progress: 0 }]));
  assert.deepEqual(rewardFreshScreen({ beat: 0, beatP: 1, cues }), {
    pair: false,
    ensemble: false,
    source: false,
    hold: false,
  });
  assert.deepEqual(rewardFreshScreen({ beat: 1, beatP: 1, cues }), {
    pair: false,
    ensemble: false,
    source: false,
    hold: false,
  });
  cues[ids[0]] = { phase: 'after', progress: 1 };
  assert.deepEqual(rewardFreshScreen({ beat: 1, beatP: 1, cues }), {
    pair: true,
    ensemble: false,
    source: false,
    hold: false,
  });
  cues[ids[1]] = { phase: 'after', progress: 1 };
  assert.deepEqual(rewardFreshScreen({ beat: 1, beatP: 1, cues }), {
    pair: true,
    ensemble: true,
    source: false,
    hold: false,
  });
});

test('the scalar sum appears at its spoken number without waiting for a beat-ending linger', async () => {
  const { scoreHeadConstruction } = await import('../animations/reward-modeling.mjs');
  const cues = {
    'head-a-first': { phase: 'after', progress: 1 },
    'head-a-second': { phase: 'after', progress: 1 },
    'head-a-sum': { phase: 'during', progress: 0.9 },
    'head-a-result': { phase: 'before', progress: 0 },
  };
  assert.equal(scoreHeadConstruction({ beat: 2, beatP: 0.99, cues }).scoreVisible, false);
  cues['head-a-result'] = { phase: 'during', progress: 0.1 };
  const v = scoreHeadConstruction({ beat: 2, beatP: 0.99, cues });
  assert.equal(v.scoreVisible, true);
  assert.equal(v.score, 1.8);
  cues['head-a-second'] = { phase: 'during', progress: 0.9 };
  assert.equal(scoreHeadConstruction({ beat: 2, beatP: 0.99, cues }).scoreVisible, false);
});
