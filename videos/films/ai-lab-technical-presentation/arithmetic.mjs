export const clamp = (value) => Math.max(0, Math.min(1, value));
export const smooth = (value) => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};
export function pairedEvidence(baseline, candidate) {
  if (!baseline || !candidate || typeof baseline !== 'object' || typeof candidate !== 'object')
    throw new TypeError('paired results must be objects');
  const ids = Object.keys(baseline),
    candidateIds = Object.keys(candidate);
  if (
    !ids.length ||
    ids.length !== candidateIds.length ||
    ids.some((id) => !Object.hasOwn(candidate, id))
  )
    throw new RangeError('paired results need the same nonempty query IDs');
  if (ids.some((id) => typeof baseline[id] !== 'boolean' || typeof candidate[id] !== 'boolean'))
    throw new TypeError('paired outcomes must be booleans');
  const counts = {
    both: 0,
    baselineOnly: 0,
    candidateOnly: 0,
    neither: 0,
  };
  for (const id of ids) {
    const oldHit = baseline[id],
      newHit = candidate[id];
    if (oldHit && newHit) counts.both++;
    else if (oldHit) counts.baselineOnly++;
    else if (newHit) counts.candidateOnly++;
    else counts.neither++;
  }
  const baselineHits = counts.both + counts.baselineOnly;
  const candidateHits = counts.both + counts.candidateOnly;
  return {
    n: ids.length,
    counts,
    baselineHits,
    candidateHits,
    baselineRate: baselineHits / ids.length,
    candidateRate: candidateHits / ids.length,
    percentagePointChange: (100 * (candidateHits - baselineHits)) / ids.length,
  };
}
export function incidentsPerMillion(count, requests) {
  if (!Number.isInteger(count) || count < 0)
    throw new RangeError('incident count must be a nonnegative integer');
  if (!Number.isInteger(requests) || requests <= 0)
    throw new RangeError('request exposure must be a positive integer');
  return (count / requests) * 1_000_000;
}
export function serviceGate({
  successfulP95Ms,
  attempts,
  timeouts,
  latencyLimitMs = 800,
  minimumSuccess = 0.99,
}) {
  if (
    !Number.isFinite(successfulP95Ms) ||
    successfulP95Ms < 0 ||
    !Number.isFinite(latencyLimitMs) ||
    latencyLimitMs <= 0
  )
    throw new RangeError('latency values must be finite and nonnegative');
  if (
    !Number.isInteger(attempts) ||
    attempts <= 0 ||
    !Number.isInteger(timeouts) ||
    timeouts < 0 ||
    timeouts > attempts
  )
    throw new RangeError('attempt and timeout counts must describe whole requests');
  if (!Number.isFinite(minimumSuccess) || minimumSuccess < 0 || minimumSuccess > 1)
    throw new RangeError('success threshold must be between zero and one');
  const successFraction = (attempts - timeouts) / attempts;
  const latencyPasses = successfulP95Ms < latencyLimitMs;
  const successPasses = successFraction >= minimumSuccess;
  return {
    successfulP95Ms,
    attempts,
    timeouts,
    latencyLimitMs,
    minimumSuccess,
    successFraction,
    latencyPasses,
    successPasses,
    passes: latencyPasses && successPasses,
  };
}
export function sourceWaitBudget() {
  const wait = 1000,
    other = 200,
    hop = 20;
  return {
    wait,
    other,
    hop,
    before: wait + other,
    after: wait + other + hop,
  };
}
export function interruptedBudget() {
  const total = 15,
    context = 2,
    path = 4,
    questions = 3,
    old = [3, 3, 1],
    replacement = [2, 3, 1];
  return {
    total,
    context,
    path,
    questions,
    remaining: total - context - path - questions,
    oldContinuation: old.reduce((a, b) => a + b, 0),
    newContinuation: replacement.reduce((a, b) => a + b, 0),
    old,
    replacement,
  };
}
