import { decomposition, prefixStates, sampleProposal } from './arithmetic.mjs';
import { CHAIN, CHAIN_CUES, P, Q } from './fixtures.mjs';
import { completedCue } from './construction.mjs';
import assert from 'node:assert/strict';
export function residualSnapshot(beat, progress, cues) {
  const cue = cues?.['matching-laws'];
  const requestedAmount = cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : Math.max(0, Math.min(1, cue.progress))
    : beat === 2
      ? Math.max(0, Math.min(1, (progress - 0.3) / 0.18))
      : 0;
  const p = [...P],
    candidate = Q.map((value, i) => value + (P[i] - value) * requestedAmount);
  const matched = candidate.every((value, i) => value.toFixed(2) === p[i].toFixed(2));
  const amount = matched ? 1 : requestedAmount,
    q = matched ? [...p] : candidate;
  return {
    p,
    q,
    amount,
    result: decomposition(p, q),
  };
}
export function acceptanceTestSnapshot(beat, p, u = 0.8) {
  assert(u >= 0 && u < 1);
  const alpha = decomposition().acceptance[1];
  return {
    alpha,
    u,
    drawVisible: beat === 2 && p >= 0.36,
    evaluated: beat === 2 && p >= 0.58,
    accepted: u < alpha,
  };
}
export function verifyChain(draws = CHAIN.map((row) => row.uniform)) {
  const accepted = [];
  for (let i = 0; i < CHAIN.length; i++) {
    const row = CHAIN[i],
      d = decomposition(row.p, row.q),
      word = row.words[row.candidate];
    if (draws[i] < d.acceptance[row.candidate]) accepted.push(word);
    else {
      // All reachable rejection rows in this chain have a single residual event.
      const correction = row.words[sampleProposal(d.residual, 0.5)];
      return {
        accepted,
        correction,
        discarded: CHAIN.slice(i).map((x) => x.words[x.candidate]),
        committed: [...accepted, correction],
      };
    }
  }
  return {
    accepted,
    bonus: 'EOS',
    committed: [...accepted, 'EOS'],
  };
}
export function chainSnapshot(beat, beatP) {
  const b = Math.max(0, Math.floor(beat ?? 0)),
    p = Math.max(0, Math.min(1, beatP ?? 0)),
    result = verifyChain();
  const acceptedCount = b === 0 ? 0 : b > 1 || p >= CHAIN_CUES.accept ? 1 : 0;
  const rejected = b > 1 || (b === 1 && p >= CHAIN_CUES.reject);
  const discarded = b > 1 || (b === 1 && p >= CHAIN_CUES.discard);
  const corrected = b > 1 || (b === 1 && p >= CHAIN_CUES.correction);
  return {
    accepted: result.accepted.slice(0, acceptedCount),
    rejectedIndex: result.accepted.length,
    rejected,
    discarded,
    corrected,
    correction: result.correction,
    committed: result.committed,
  };
}
export function transferSnapshot(beat = 0, beatP = 0, cues) {
  const b = Math.max(0, Math.floor(beat ?? 0)),
    p = Math.max(0, Math.min(1, beatP ?? 0)),
    row = CHAIN[1],
    result = decomposition(row.p, row.q);
  const amount = (id, fallback) => {
    const cue = cues?.[id];
    return Math.max(
      0,
      Math.min(
        1,
        cue
          ? cue.phase === 'before'
            ? 0
            : cue.phase === 'after'
              ? 1
              : cue.progress
          : fallback
            ? 1
            : 0,
      ),
    );
  };
  const rejected = b > 1 || (b === 1 && amount('rejection-ratio', p >= 0.25) > 0);
  const discarded = b > 1 || (b === 1 && amount('discard-dependent', p >= 0.42) > 0);
  const deficitProgress = b > 1 ? 1 : b === 1 ? amount('positive-deficit', p >= 0.58) : 0;
  const residualProgress = b > 1 ? 1 : b === 1 ? amount('normalize-residual', p >= 0.72) : 0;
  const corrected = b > 1 || (b === 1 && amount('sample-correction', p >= 0.82) > 0);
  const trimProgress = b > 2 ? 1 : b === 2 ? amount('trim-provisional-kv', p >= 0.4) : 0;
  const trimmed = trimProgress >= 1;
  const cleanupKV = [
    'sang',
    trimProgress === 0 ? 'softly' : trimProgress < 0.5 ? 'removing: softly' : 'removed: softly',
    trimProgress === 0
      ? 'today'
      : trimProgress < 0.5
        ? 'today'
        : trimProgress < 1
          ? 'removing: today'
          : 'removed: today',
  ];
  const finishedForward = cues?.['cache-nearby'];
  const forwarded = b > 2 || (b === 2 && (finishedForward
    ? finishedForward.phase === 'after'
    : amount('forward-nearby', p >= 0.8) >= 1));
  assert(
    !forwarded || trimmed,
    'the correction must be forwarded only after provisional rejected KV state is removed',
  );
  const chain = verifyChain(),
    candidate = row.candidate,
    verifiedKV = ['sang', 'softly', 'today'];
  assert.equal(row.words[candidate], 'softly');
  assert.equal(result.acceptance[candidate], 0.5);
  assert.equal(row.uniform > 0.5, true);
  assert.deepEqual(result.deficit, [0, 0.3, 0]);
  assert.deepEqual(result.residual, [0, 1, 0]);
  assert.equal(chain.correction, 'nearby');
  return {
    prefix: ['The', 'bird', 'sang'],
    candidate: row.words[candidate],
    suffix: row.words[2],
    targetProbability: row.p[candidate],
    proposalProbability: row.q[candidate],
    acceptance: result.acceptance[candidate],
    draw: row.uniform,
    rejected,
    discarded,
    deficitVisible: deficitProgress > 0,
    deficitProgress,
    residualProgress,
    deficit: result.deficit,
    residualMass: result.z,
    residual: result.residual,
    corrected,
    correction: chain.correction,
    committed: ['The', 'bird', ...chain.committed],
    verifiedKV,
    cleanupKV,
    trimProgress,
    retainedKV: trimmed ? ['sang'] : verifiedKV,
    trimmed,
    forwarded,
    cache: forwarded ? ['sang', 'nearby'] : trimmed ? ['sang'] : [],
    pending: corrected && !forwarded ? ['nearby'] : [],
  };
}
export function freshStateFrame(state) {
  const b = state.beat ?? 0,
    known = (beat, id) => b > beat || (b === beat && completedCue(state, id)),
    rejected = known(1, 'sd-fresh-reject'),
    corrected = known(1, 'sd-fresh-correction'),
    provisionalFirst = known(2, 'sd-fresh-82'),
    provisional = known(2, 'sd-fresh-provisional'),
    rolledBack = known(2, 'sd-fresh-rollback'),
    pending = known(2, 'sd-fresh-pending'),
    processed = known(2, 'sd-fresh-process');
  const p = [0.15, 0.25, 0.6];
  const q = [0.45, 0.35, 0.2];
  const law = decomposition(p, q);
  const [candidate, suffix] = [2, 3];
  const correction = sampleProposal(law.residual, 0.5) + 1;
  const [root, first, last] = prefixStates([candidate, suffix], 8);
  const repaired = prefixStates([correction], root).at(-1);
  return {
    words: ['nearby', 'softly', 'today'], p, q, law, candidate, suffix, correction,
    uniform: 0.8, alpha: law.acceptance[candidate - 1],
    root, first, last, repaired,
    rejected,
    corrected,
    provisionalFirst,
    provisional,
    rolledBack,
    pending: pending && !processed,
    processed,
    committed: corrected ? [correction] : [],
    provisionalCache: rolledBack ? null : provisional ? last : provisionalFirst ? first : null,
    cache: processed ? repaired : root,
    discarded: [first, last],
  };
}
