import test from 'node:test';
import assert from 'node:assert/strict';
import {
  visionProject,
  visionRotary,
  visionPreln,
  visionPadding,
  visionSiglip,
  visionCandidateRanking,
  visionPrefixBudget,
  visionFreshState,
  visionMixture,
} from '../animations/vision-transformers.mjs';
const near = (a, b) => assert(Math.abs(a - b) < 1e-11, `${a} versus ${b}`);

test('the retained null-space intervention disappears before the bridge and a new coordinate preserves it', () => {
  const source = [2, 3, 6, 7];
  for (const d of [-3, -1, 0.25, 2, 4]) {
    const changed = [source[0] + d, source[1], source[2] - d, source[3]];
    assert.deepEqual(visionProject(source), visionProject(changed));
    near(visionProject(changed, true)[2] - visionProject(source, true)[2], 2 * d);
  }
});
test('row and column rotary pairs retain relative offsets under shared grid translation', () => {
  for (const q of [
    [0, 0],
    [2, 3],
    [-2, 4],
  ])
    for (const offset of [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, -1],
    ])
      for (const shift of [
        [2, 5],
        [-4, 3],
      ]) {
        const key = q.map((v, i) => v + offset[i]),
          a = visionRotary(q, key),
          b = visionRotary(
            q.map((v, i) => v + shift[i]),
            key.map((v, i) => v + shift[i]),
          );
        near(a.score, b.score);
      }
  near(visionRotary([2, 3], [3, 4]).score, 0);
});
test('Pre-LN branch normalization retains the original residual values instead of replacing them', () => {
  const base = visionPreln(),
    shifted = visionPreln([12, 14]);
  for (let i = 0; i < 2; i++) {
    near(base.norm[i], shifted.norm[i]);
    near(base.update[i], shifted.update[i]);
    near(shifted.output[i] - base.output[i], 10);
  }
  near(base.output[0], 2.341343079857511);
  near(base.output[1], 4.3413230804574905);
});
test('masked padding preserves the valid readout while unmasked zero values steal probability mass', () => {
  const base = visionPadding(0);
  for (const count of [1, 4, 11]) {
    const masked = visionPadding(count, true),
      wrong = visionPadding(count, false);
    assert.deepEqual(masked.output, base.output);
    near(
      masked.weights.reduce((a, b) => a + b, 0),
      1,
    );
    assert(wrong.weights.slice(2).every((w) => w > 0));
    assert(wrong.output[0] < base.output[0]);
  }
});
test('a copied candidate changes the denominator without changing the original candidate scores', () => {
  const original = visionCandidateRanking(),
    copy = visionCandidateRanking(true),
    p = original.probabilities[0];
  assert.equal(copy.scores[0], original.scores[0]);
  assert.equal(copy.scores[1], original.scores[0]);
  assert.equal(copy.scores[2], original.scores[1]);
  near(copy.probabilities[0], p / (1 + p));
  near(copy.probabilities[0], copy.probabilities[1]);
  near(
    copy.probabilities.reduce((a, b) => a + b, 0),
    1,
  );
  const sigmoid = visionSiglip();
  near(sigmoid.objective, sigmoid.sum / 2);
  assert(sigmoid.objective > sigmoid.sum / 4);
});
test('visual slots and raw retained KV grow linearly while the fixed text contribution remains owned', () => {
  const small = visionPrefixBudget(224),
    large = visionPrefixBudget(448),
    merged = visionPrefixBudget(448, 512, 4, 4);
  assert.equal(large.visual, 4 * small.visual);
  assert.equal(large.total, 2 * small.total);
  assert.equal(large.mib, 2 * small.mib);
  assert.equal(merged.visual, 1024);
  assert.equal(merged.text, 512);
  assert.equal(small.bytesPerSlot, 128 * 1024);
  assert.equal(visionPrefixBudget(224, 0).mib, 32);
});
test('shared vector accumulation uses the same cue-owned terms, partial endpoint and causal zeros', () => {
  const before = { phase: 'before', progress: 0 },
    after = { phase: 'after', progress: 1 },
    cues = { 'attention-build-mixture': before };
  assert.deepEqual(visionMixture(1, 0.99, cues).accumulation.sum, [0, 0]);
  const current = visionMixture(1, 0.1, {
    'attention-build-mixture': { phase: 'during', progress: 0.5 },
  });
  assert.equal(current.accumulation.completedCount, 1);
  for (let i = 0; i < 2; i++)
    near(
      current.accumulation.sum[i],
      current.terms[0].values[i] * current.terms[0].weight +
        0.5 * current.terms[1].values[i] * current.terms[1].weight,
    );
  const full = visionMixture(1, 0, { 'attention-build-mixture': after });
  assert.deepEqual(full.accumulation.sum, full.output);
  const causal = visionMixture(2, 0);
  assert.deepEqual(causal.accumulation.sum, [1, 0]);
  assert.equal(causal.accumulation.terms.filter((t) => t.zero).length, 2);
});
test('the new-input answer and repair remain withheld before their own spoken cues', () => {
  const before = { phase: 'before', progress: 0 },
    after = { phase: 'after', progress: 1 };
  assert.equal(visionFreshState(0, 0.99).reveal, false);
  assert.equal(visionFreshState(1, 0.99, { 'fresh-projection-equality': before }).reveal, false);
  const initial = visionFreshState(2, 0.99, {
    'fresh-third-coordinate': before,
    'fresh-distinguishable': before,
  });
  assert.equal(initial.repair, false);
  const repaired = visionFreshState(2, 0, {
    'fresh-third-coordinate': after,
    'fresh-distinguishable': after,
  });
  assert.deepEqual(repaired.outA, [4.5, 1, -4]);
  assert.deepEqual(repaired.outB, [4.5, 1, -2]);
  assert.deepEqual(
    initial,
    visionFreshState(2, 0, { 'fresh-third-coordinate': before, 'fresh-distinguishable': before }),
  );
});
