import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshTracking,
  canaryAction,
  pricedTokens,
  validateModel,
} from '../animations/experiment-tracking-mlflow-wandb.mjs';
const state = (sentence, progress = 1) => ({
  beat: 1,
  cues: Object.fromEntries(
    Array.from({ length: 5 }, (_, i) => [
      `tr-fresh-contract-1-${i}`,
      { progress: i < sentence ? 1 : i === sentence ? progress : 0 },
    ]),
  ),
});
test('a valid digest does not admit duplicated membership and configuration repair updates the actual loaded state', () => {
  const initial = freshTracking({ beat: 0, beatP: 1 });
  assert(!initial.canonical);
  assert.equal(initial.rows.length, 6);
  assert.equal(new Set(initial.rows.map((r) => r.id)).size, 5);
  assert.equal(initial.temperature, 0.6);
  assert(!initial.reveal);
  const held = freshTracking(state(0, 0.999));
  assert(!held.reveal);
  const diagnosed = freshTracking(state(0));
  assert(diagnosed.reveal);
  assert(!diagnosed.repair);
  const fixed = freshTracking(state(3));
  assert(fixed.canonical);
  assert.equal(new Set(fixed.rows.map((r) => r.id)).size, 6);
  assert.equal(fixed.temperature, 0);
  assert(fixed.configMatches);
  assert.notEqual(fixed.digest, initial.digest);
  assert.equal(fixed.promotion, false);
});
test('known unsafe claim precedence survives incomplete review and token buckets stay disjoint', () => {
  assert.equal(canaryAction(1, false), 'ABORT CANARY');
  assert.equal(canaryAction(0, false), 'PAUSE FOR REVIEW');
  assert.equal(canaryAction(0, true), 'CONTINUE MONITORING');
  assert.throws(() => canaryAction(true, false));
  const cost = pricedTokens({ uncached: 800, cached: 1200, output: 100, rates: [3, 0.3, 9] });
  assert.deepEqual(cost.terms, [2400, 360, 900]);
  assert.equal(cost.total, 0.00366);
  validateModel();
});
