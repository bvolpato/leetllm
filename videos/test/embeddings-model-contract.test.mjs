import test from 'node:test';
import assert from 'node:assert/strict';
import {
  negativeSamplingState,
  NEGATIVE_OUTPUTS,
  countRepresentation,
  gloveResidual,
  subwordComposition,
  occurrenceVisibility,
  centerPopulation,
  cosine,
  rotateEmbedding,
  extendedEmbeddingState,
} from '../animations/embeddings.mjs';

const close = (a, b) => assert(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('the supplied negative-sampling step follows the loss derivative with fixed output owners', () => {
  const start = [0.6, -0.4],
    state = negativeSamplingState(1, start);
  const loss = (u) =>
    NEGATIVE_OUTPUTS.reduce((sum, row, i) => {
      const score = row.reduce((n, v, j) => n + v * u[j], 0),
        z = i === 0 ? -score : score;
      return sum + Math.max(z, 0) + Math.log1p(Math.exp(-Math.abs(z)));
    }, 0);
  for (let j = 0; j < 2; j++) {
    const left = [...start],
      right = [...start];
    left[j] -= 1e-6;
    right[j] += 1e-6;
    close((loss(right) - loss(left)) / 2e-6, state.gradient[j]);
    close(state.updated[j], start[j] - 0.1 * state.gradient[j]);
  }
  assert(state.loss < state.lossBefore);
  assert.deepEqual(negativeSamplingState(0, start).updated, start);
});

test('the PPMI fixture uses marginal independence and separates its disconnected context blocks', () => {
  const m = countRepresentation();
  close(m.expected[0][0], (14 * 15) / 53);
  close(m.ppmi[0][0], Math.log((8 * 53) / (14 * 15)));
  close(m.ppmi[0][2], 0);
  close(cosine(m.vectors[0], m.vectors[1]), 1);
  close(cosine(m.vectors[0], m.vectors[2]), 0);
});

test('GloVe weighting acts on log residuals and caps the count weight at one', () => {
  const fit = gloveResidual(5, Math.log(20));
  close(fit.squared, Math.log(4) ** 2);
  close(fit.weight, (5 / 100) ** 0.75);
  close(fit.weighted, Math.log(4) ** 2 * (5 / 100) ** 0.75);
  close(gloveResidual(300).weight, 1);
  assert.throws(() => gloveResidual(0));
});

test('repeated subword buckets remain repeated contributions and masks preserve available occurrences', () => {
  const r = subwordComposition(
    [1, 0, 1],
    [
      [2, -1],
      [0.5, 3],
    ],
  );
  assert.deepEqual(r.sum, [3, 5]);
  assert.deepEqual(r.mean, [1, 5 / 3]);
  assert.deepEqual(occurrenceVisibility(true, 0, ['charge', 'the', 'phone']), ['charge']);
  assert.deepEqual(occurrenceVisibility(true, 0, ['charge', 'the', 'invoice']), ['charge']);
  assert.deepEqual(occurrenceVisibility(false, 0, ['charge', 'the', 'invoice']), [
    'charge',
    'the',
    'invoice',
  ]);
});

test('centering can create an undefined zero vector and fresh migration waits for the actual reveal', () => {
  assert.deepEqual(
    centerPopulation([
      [10, 1],
      [10, 2],
      [10, 3],
    ]).centered[1],
    [0, 0],
  );
  const x = [0.6, 0.8],
    y = [1, 0],
    a = 0.73;
  close(cosine(rotateEmbedding(x, a), rotateEmbedding(y, a)), cosine(x, y));
  assert(Math.abs(cosine(x, rotateEmbedding(y, a)) - cosine(x, y)) > 0.1);
  const held = extendedEmbeddingState('fresh-representation', {
    beat: 1,
    cues: {
      'emb-fresh-docs': { phase: 'after' },
      'emb-fresh-query': { phase: 'before' },
      'emb-fresh-scores': { phase: 'before' },
    },
  });
  assert.equal(held.scoresVisible, false);
  assert.equal(held.repaired, false);
  const repaired = extendedEmbeddingState('fresh-representation', {
    beat: 1,
    cues: {
      'emb-fresh-docs': { phase: 'after' },
      'emb-fresh-query': { phase: 'after' },
      'emb-fresh-scores': { phase: 'after' },
      'emb-fresh-repaired': { phase: 'after' },
    },
  });
  assert.equal(repaired.scoresVisible, true);
  assert.equal(repaired.repaired, true);
  close(repaired.scores[0], 0);
  close(repaired.scores[1], 1);
});
