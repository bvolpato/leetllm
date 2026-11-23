import { CONDITIONAL_ROWS, SENTENCE, SPLIT_CAT, TARGET_PROBS } from './fixtures.mjs';
import { LOSS, conditionalDistribution, counts, extendedLanguageState, selectSample } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  Object.values(CONDITIONAL_ROWS).forEach((row) =>
    assert(Math.abs(row.reduce((n, [, p]) => n + p, 0) - 1) < 1e-12),
  );
  assert.deepEqual(counts(), {
    sat: 2,
    slept: 1,
    ate: 0,
  });
  assert.equal(selectSample('The cat', 0.75), 'slept');
  assert.equal(selectSample('The cat slept', 0.95), 'end');
  let prefix = 'start';
  SENTENCE.forEach((word, i) => {
    assert.equal(
      conditionalDistribution(prefix).find((item) => item.token === word).probability,
      TARGET_PROBS[i],
    );
    prefix = i === 0 ? word : prefix + ' ' + word;
  });
  assert(Math.abs(Math.exp(-4 * LOSS) - 0.2304) < 1e-12);
  assert(Math.abs(SPLIT_CAT[0] * SPLIT_CAT[1] - TARGET_PROBS[1]) < 1e-12);
  assert.equal(
    conditionalDistribution('The dog').find((item) => item.token === 'slept').probability,
    0.3,
  );
  assert.equal(
    conditionalDistribution('The dog').reduce((a, b) => (a.probability > b.probability ? a : b))
      .token,
    'ate',
  );
  for (const [beat, expected, reason] of [
    [1, ['runs', 'end'], 'end token'],
    [3, ['waits', 'here'], 'output limit'],
  ]) {
    const run = extendedLanguageState('fresh-budgeted-rollout', { beat, beatP: 1 });
    assert.deepEqual(
      run.history.accepted.map((v) => v.token),
      expected,
    );
    assert.deepEqual(
      run.history.kv.map((v) => v.token),
      ['A', 'red', 'fox', expected[0]],
    );
    assert.equal(run.stopReason, reason);
    assert.equal(run.probability, 1 / 8);
    assert(Math.abs(run.perplexity - Math.sqrt(8)) < 1e-12);
  }
  return true;
}
