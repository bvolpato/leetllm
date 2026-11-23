import { DOCS, TRANSITIONS } from './fixtures.mjs';
export function memoryBudget({
  batch = 16,
  sequence = 2048,
  layers = 32,
  heads = 32,
  groupedHeads = 8,
  headDim = 128,
  bytes = 2,
  parameters = 8_000_000_000,
} = {}) {
  const weights = (parameters * bytes) / 1e9;
  const perTokenMha = 2 * layers * heads * headDim * bytes;
  const perTokenGqa = 2 * layers * groupedHeads * headDim * bytes;
  return {
    weightsGb: weights,
    perTokenMha,
    perTokenGqa,
    mhaGb: (perTokenMha * batch * sequence) / 1e9,
    gqaGb: (perTokenGqa * batch * sequence) / 1e9,
    batch,
    sequence,
    layers,
    heads,
    groupedHeads,
    headDim,
    bytes,
  };
}
export function trafficBudget({
  requestsPerMinute = 4000,
  inputTokens = 1200,
  outputTokens = 450,
  assumedCapacity = 125_000,
} = {}) {
  if (
    ![requestsPerMinute, inputTokens, outputTokens, assumedCapacity].every(Number.isFinite) ||
    requestsPerMinute < 0 ||
    inputTokens < 0 ||
    outputTokens < 0 ||
    assumedCapacity <= 0
  ) {
    throw new RangeError('traffic rates and token counts must be finite and nonnegative');
  }
  const tokensPerMinute = requestsPerMinute * (inputTokens + outputTokens);
  const tokensPerSecond = tokensPerMinute / 60;
  const headroom = assumedCapacity - tokensPerSecond;
  return {
    requestsPerMinute,
    inputTokens,
    outputTokens,
    tokensPerMinute,
    tokensPerSecond,
    assumedCapacity,
    headroom,
    headroomFraction: headroom / assumedCapacity,
  };
}
export function queueAdmission(queuedTokens, serviceTokensPerSecond, waitBudgetSeconds) {
  if (
    ![queuedTokens, serviceTokensPerSecond, waitBudgetSeconds].every(Number.isFinite) ||
    queuedTokens < 0 ||
    serviceTokensPerSecond <= 0 ||
    waitBudgetSeconds < 0
  ) {
    throw new RangeError('invalid queue capacity input');
  }
  const estimatedWait = queuedTokens / serviceTokensPerSecond;
  return {
    queuedTokens,
    serviceTokensPerSecond,
    waitBudgetSeconds,
    estimatedWait,
    admitted: estimatedWait <= waitBudgetSeconds,
  };
}
export function dualResourceAdmission({
  prefillTokens = 10_000,
  prefillRate = 80_000,
  activeDecode = 48,
  maxDecode = 64,
  freeKvBlocks = 120,
  neededKvBlocks = 16,
  waitBudget = 0.25,
} = {}) {
  const counts = [activeDecode, maxDecode, freeKvBlocks, neededKvBlocks];
  if (counts.some((value) => !Number.isInteger(value) || value < 0))
    throw new RangeError('resource counts must be nonnegative integers');
  const prefill = queueAdmission(prefillTokens, prefillRate, waitBudget);
  const decode = activeDecode < maxDecode;
  const kv = freeKvBlocks >= neededKvBlocks;
  return {
    prefill,
    decode,
    kv,
    admitted: prefill.admitted && decode && kv,
  };
}
export function servingSnapshot(seconds, { joined = true } = {}) {
  if (!Number.isFinite(seconds) || seconds < 0)
    throw new RangeError('service time must be nonnegative');
  const rate = 125_000,
    requests = [
      {
        id: 'A',
        tokens: 10_000,
      },
      {
        id: 'B',
        tokens: 10_000,
      },
      ...(joined
        ? [
            {
              id: 'R-104',
              tokens: 5_000,
            },
          ]
        : []),
    ];
  let consumed = seconds * rate,
    active = null,
    remaining = 0;
  const completed = [],
    waiting = [];
  for (const request of requests) {
    if (consumed >= request.tokens) {
      consumed -= request.tokens;
      completed.push(request.id);
    } else if (!active) {
      active = request.id;
      remaining = request.tokens - consumed;
      consumed = 0;
    } else waiting.push(request.id);
  }
  const ahead = Math.max(0, 20_000 - seconds * rate),
    requestStarted = joined && seconds >= 0.16,
    requestComplete = completed.includes('R-104');
  return {
    seconds,
    rate,
    active,
    remaining,
    waiting,
    completed,
    ahead,
    remainingWait: ahead / rate,
    observedWait: requestStarted ? 0.16 : null,
    requestStarted,
    requestComplete,
    capacity: 1,
    usedSlots: active ? 1 : 0,
    waitingCapacity: 2,
    kvCapacity: 8,
    usedKv: active ? 2 : 0,
    freeKv: active ? 6 : 8,
  };
}
export function eligibleDocuments(documents = DOCS, userGroups = ['employees']) {
  const allowed = new Set(userGroups);
  return documents
    .filter((document) => !document.deleted && document.groups.some((group) => allowed.has(group)))
    .sort((a, b) => b.score - a.score);
}
export function canTransition(from, to) {
  return (TRANSITIONS[from] ?? []).includes(to);
}
export function retryMode(action, receiverEnforcesIdempotency = false) {
  if (action === 'repo_read') return 'automatic';
  if (
    ['sandbox_provision', 'create_commit', 'post_comment'].includes(action) &&
    receiverEnforcesIdempotency === true
  )
    return 'automatic-with-idempotency';
  return 'reconcile-or-review';
}
export function releaseGate({
  recall = 0.94,
  faithfulness = 0.93,
  leaks = 0,
  recallMinimum = 0.92,
  faithfulnessMinimum = 0.95,
} = {}) {
  const minima = {
    recall: 0.92,
    faithfulness: 0.95,
  };
  const failures = [];
  if (
    !Number.isFinite(recall) ||
    recall < minima.recall ||
    recall > 1 ||
    recallMinimum !== minima.recall
  )
    failures.push('recall');
  if (
    !Number.isFinite(faithfulness) ||
    faithfulness < minima.faithfulness ||
    faithfulness > 1 ||
    faithfulnessMinimum !== minima.faithfulness
  )
    failures.push('faithfulness');
  if (!Number.isInteger(leaks) || leaks !== 0) failures.push('permission_leaks');
  return {
    recall,
    faithfulness,
    leaks,
    minima,
    failures,
    launchAllowed: failures.length === 0,
  };
}
