import {
  correctionCounterexample,
  decomposition,
  deliverUntilStop,
  expectedYield,
  isolationFixture,
  prefixStates,
  sampleProposal,
  transformedLaw,
  verificationBudget,
  visibility,
} from './arithmetic.mjs';
import { CHAIN_CUES, P, Q, SAMPLING_COUNTS, TWO_GAP_Q } from './fixtures.mjs';
import {
  acceptanceTestSnapshot,
  chainSnapshot,
  freshStateFrame,
  residualSnapshot,
  transferSnapshot,
  verifyChain,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateConstructions();
  for (const [p, q] of [
    [P, Q],
    [
      [1, 0, 0],
      [0, 1, 0],
    ],
    [
      [0.2, 0.3, 0.5],
      [0.2, 0.3, 0.5],
    ],
  ]) {
    const result = decomposition(p, q);
    assert(Math.abs(result.z - (1 - result.overlap.reduce((a, v) => a + v, 0))) < 1e-12);
    result.overlap.forEach((v, i) => assert(Math.abs(v + result.deficit[i] - p[i]) < 1e-12));
    if (result.residual) assert(Math.abs(result.residual.reduce((a, v) => a + v, 0) - 1) < 1e-12);
    else assert.equal(result.z, 0);
  }
  assert.deepEqual(decomposition().residual, [1, 0, 0]);
  const split = decomposition(P, TWO_GAP_Q);
  assert(Math.abs(split.z - 0.3) < 1e-12);
  assert(Math.abs(split.residual[0] - 2 / 3) < 1e-12);
  assert(Math.abs(split.residual[1] - 1 / 3) < 1e-12);
  assert.equal(split.residual[2], 0);
  P.forEach((value, i) => assert(Math.abs(split.overlap[i] + split.z * split.residual[i] - value) < 1e-12));
  assert(Math.abs(expectedYield(0.8, 5) - 3.68928) < 1e-12);
  assert.equal(expectedYield(1, 5), 6);
  const matched = residualSnapshot(2, 1);
  assert.deepEqual(matched.p, matched.q);
  assert.deepEqual(matched.result.deficit, [0, 0, 0]);
  assert.equal(matched.result.z, 0);
  assert.equal(matched.result.residual, null);
  assert.equal(sampleProposal(Q, 0.35), 1);
  assert.equal(sampleProposal(Q, 0.05), 0);
  assert.equal(sampleProposal(Q, 0.95), 2);
  assert(!acceptanceTestSnapshot(2, 0.12).evaluated);
  assert(!acceptanceTestSnapshot(2, 0.5).evaluated);
  assert(acceptanceTestSnapshot(2, 0.88).evaluated);
  assert(!acceptanceTestSnapshot(2, 0.88).accepted);
  assert(acceptanceTestSnapshot(2, 0.88, 0.2).accepted);
  assert.deepEqual(deliverUntilStop(['sang', 'EOS', 'today']), {
    delivered: ['sang'],
    stopped: true,
    discarded: ['today'],
  });
  assert.deepEqual(deliverUntilStop(['sang']), {
    delivered: ['sang'],
    stopped: false,
    discarded: [],
  });
  assert(0.8 > Math.min(1, 0.3 / 0.6));
  assert.deepEqual(verifyChain().committed, ['sang', 'nearby']);
  assert.deepEqual(verifyChain().discarded, ['softly', 'today']);
  assert.deepEqual(verifyChain([0.2, 0.2, 0.1]).committed, ['sang', 'softly', 'today', 'EOS']);
  const rows = chainSnapshot(0, 0.98);
  assert.equal(rows.rejected, false);
  assert.equal(rows.discarded, false);
  assert.equal(rows.corrected, false);
  const accepted = chainSnapshot(1, 0.35);
  assert.deepEqual(accepted.accepted, ['sang']);
  assert.equal(accepted.rejected, false);
  const rejected = chainSnapshot(1, 0.58);
  assert.equal(rejected.rejected, true);
  assert.equal(rejected.discarded, false);
  assert.equal(rejected.corrected, false);
  const truncated = chainSnapshot(1, 0.68);
  assert.equal(truncated.discarded, true);
  assert.equal(truncated.corrected, false);
  const correction = chainSnapshot(1, 0.9);
  assert.equal(correction.correction, 'nearby');
  assert.equal(correction.corrected, true);
  assert.deepEqual(correction.committed, ['sang', 'nearby']);
  assert.equal(chainSnapshot(1, CHAIN_CUES.accept - 1e-6).accepted.length, 0);
  assert.equal(chainSnapshot(1, CHAIN_CUES.accept).accepted.length, 1);
  assert.equal(chainSnapshot(1, CHAIN_CUES.reject - 1e-6).rejected, false);
  assert.equal(chainSnapshot(1, CHAIN_CUES.reject).rejected, true);
  assert.equal(chainSnapshot(1, CHAIN_CUES.discard - 1e-6).discarded, false);
  assert.equal(chainSnapshot(1, CHAIN_CUES.discard).discarded, true);
  assert.equal(chainSnapshot(1, CHAIN_CUES.correction - 1e-6).corrected, false);
  assert.equal(chainSnapshot(1, CHAIN_CUES.correction).corrected, true);
  const held = chainSnapshot(2, 0.02);
  assert.equal(held.rejected, true);
  assert.equal(held.discarded, true);
  assert.equal(held.corrected, true);
  assert.deepEqual(held.committed, ['sang', 'nearby']);
  const transfer = transferSnapshot(1, 0.9);
  assert.equal(transfer.acceptance, 0.5);
  assert.equal(transfer.draw, 0.8);
  assert.equal(transfer.rejected, true);
  assert.equal(transfer.discarded, true);
  assert.equal(transfer.deficitVisible, true);
  assert.equal(transfer.residualProgress, 1);
  assert.deepEqual(transfer.deficit, [0, 0.3, 0]);
  assert.deepEqual(transfer.residual, [0, 1, 0]);
  assert.equal(transfer.correction, 'nearby');
  const pending = transferSnapshot(2, 0.5),
    forwarded = transferSnapshot(2, 0.9);
  assert.deepEqual(pending.retainedKV, ['sang']);
  assert.deepEqual(pending.pending, ['nearby']);
  assert.deepEqual(forwarded.cache, ['sang', 'nearby']);
  assert.deepEqual(forwarded.pending, []);
  assert.throws(
    () =>
      transferSnapshot(2, 0.9, {
        'trim-provisional-kv': {
          phase: 'before',
          progress: 0,
        },
        'forward-nearby': {
          phase: 'after',
          progress: 1,
        },
      }),
    /forwarded only after/,
  );
  return true;
}
export function validateConstructions() {
  const law = transformedLaw();
  assert(Math.abs(law.retained - 0.85) < 1e-12);
  assert(Math.abs(law.target[0] - 11 / 17) < 1e-12);
  assert.deepEqual(law.acceptance, [1, 1, 0]);
  const wrong = correctionCounterexample();
  wrong.correct.forEach((v, i) => assert(Math.abs(v - wrong.p[i]) < 1e-12));
  [0.48, 0.4, 0.12].forEach((v, i) => assert(Math.abs(v - wrong.wrong[i]) < 1e-12));
  assert.deepEqual(prefixStates([1, 2, 3]), [0, 1, 12, 123]);
  assert.deepEqual(prefixStates([1, 2, 4]), [0, 1, 12, 124]);
  assert.deepEqual(visibility([null, null, 0, 1], 2), [1, 0, 1, 0]);
  const a = isolationFixture(),
    c = isolationFixture(10000);
  assert.equal(a.tree.result, c.tree.result);
  assert(c.flat.result > a.flat.result * 90);
  assert.equal(verificationBudget(16, 4).inputs, 80);
  assert(!verificationBudget(16, 4).fits);
  assert(verificationBudget(16, 2).fits);
  assert.equal(
    SAMPLING_COUNTS.reduce((a, v) => a + v, 0),
    60000,
  );
  const before = freshStateFrame({
    beat: 0,
    beatP: 0.99,
  });
  assert(!before.rejected && !before.corrected && !before.processed);
  assert(Math.abs(before.alpha - 5 / 7) < 1e-12);
  assert(before.uniform > before.alpha);
  assert.deepEqual(before.law.residual, [0, 0, 1]);
  assert.equal(before.correction, before.suffix);
  assert.equal(before.last, 823);
  assert.equal(before.repaired, 83);
  const hold = freshStateFrame({
    beat: 2,
    beatP: 0.99,
    cues: Object.fromEntries(
      ['sd-fresh-provisional', 'sd-fresh-rollback', 'sd-fresh-pending', 'sd-fresh-process'].map(
        (id) => [
          id,
          {
            phase: 'before',
            progress: 0,
          },
        ],
      ),
    ),
  });
  assert(!hold.processed);
  assert.equal(hold.cache, 8);
  return true;
}
