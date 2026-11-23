import { rawKVBytes } from './arithmetic.mjs';
import { finalRequest, latency, quality } from './fixtures.mjs';
export function plurality(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].reduce((a, v) => (v[1] > a[1] ? v : a))[0];
}
export function chooseBudget(limitMs = 1000) {
  let best = -1;
  for (const [i, value] of quality.entries()) {
    if (latency[i] <= limitMs && (best < 0 || value > quality[best])) best = i;
  }
  return best;
}
export function chooseFeasible(rows, qualityFloor = 0.84, latencyLimit = 1000) {
  const eligible = rows.filter(
    (r) => r.quality >= qualityFloor && r.latency <= latencyLimit && Number.isFinite(r.cost),
  );
  return eligible.length ? eligible.reduce((a, b) => (b.cost < a.cost ? b : a)) : null;
}
export function retainedBranchLedger(retained = 6) {
  if (!Number.isInteger(retained) || retained < 4 || retained > 6)
    throw new RangeError('Keep the checked candidate among the retained four to six branches');
  const { prompt, continuation, answers, geometry, poolBytes, scores } = finalRequest;
  const positions = prompt + retained * continuation;
  const bytes = rawKVBytes({ ...geometry, positions });
  const originalPositions = prompt + answers.length * continuation;
  const matchingDraft = answers.findIndex((value) => value === originalPositions);
  return {
    retained,
    positions,
    bytes,
    gib: bytes / 2 ** 30,
    fits: bytes <= poolBytes,
    promptOwners: 1,
    selected: matchingDraft < 0 ? null : `C${matchingDraft + 1}`,
    verifiedAnswer: answers[matchingDraft] ?? null,
    spentTokens: answers.length * continuation,
    spentScoreCalls: scores.length,
  };
}
