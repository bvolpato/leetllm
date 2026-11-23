import { corpus, policyCases } from './fixtures.mjs';
export function pairCounts(rows) {
  const counts = new Map();
  for (const row of rows) {
    for (let index = 0; index < row.tokens.length - 1; index++) {
      const pair = row.tokens[index] + '|' + row.tokens[index + 1];
      counts.set(pair, (counts.get(pair) ?? 0) + row.frequency);
    }
  }
  return counts;
}
export function mergePair(tokens, pair) {
  const [left, right] = pair.split('|');
  const merged = [];
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index] === left && tokens[index + 1] === right) {
      merged.push(left + right);
      index++;
    } else merged.push(tokens[index]);
  }
  return merged;
}
export function bpeState(step) {
  let rows = corpus.map((row) => ({
    ...row,
    tokens: [...row.word],
  }));
  const countsBefore = pairCounts(rows);
  const selected = [...countsBefore].sort((a, b) => b[1] - a[1])[0];
  if (step > 0)
    rows = rows.map((row) => ({
      ...row,
      tokens: mergePair(row.tokens, selected[0]),
    }));
  const countsAfter = pairCounts(rows);
  return {
    rows,
    counts: [...(step > 0 ? countsAfter : countsBefore)].sort((a, b) => b[1] - a[1]),
    selected: selected[0],
    selectedCount: selected[1],
    lossLow: -Math.log(0.2),
    lossHigh: -Math.log(0.8),
  };
}
export function computeRows() {
  return [
    {
      name: 'Gopher',
      parametersB: 280,
      tokensB: 300,
    },
    {
      name: 'Chinchilla',
      parametersB: 70,
      tokensB: 1400,
    },
    {
      name: 'Llama 3 8B',
      parametersB: 8,
      tokensB: 15000,
    },
  ].map((row) => ({
    ...row,
    flops: 6 * row.parametersB * 1e9 * row.tokensB * 1e9,
  }));
}
export function policyShift(step) {
  const facts = {
    ageDays: 42,
    stale: true,
  };
  const thresholdDays = step === 0 ? 30 : 60;
  const checkerThreshold = step === 2 ? 60 : 30;
  return {
    facts,
    thresholdDays,
    decision: facts.stale && facts.ageDays >= thresholdDays ? 'eligible' : 'ineligible',
    checkerThreshold,
    checkerDecision: facts.stale && facts.ageDays >= checkerThreshold ? 'eligible' : 'ineligible',
    weightsRevision: 'checkpoint-v4',
    checkerRevision: step === 2 ? 'checker-v2' : 'checker-v1',
  };
}
export function verifierScore(candidate) {
  return Number(
    candidate.eligible === true &&
      candidate.policy_id === 'P-7' &&
      candidate.rotation_started === false,
  );
}
export function postTrainingCases() {
  const honest = {
    eligible: true,
    policy_id: 'P-7',
    rotation_started: false,
  };
  const inventedAction = {
    ...honest,
    rotation_started: true,
  };
  const proseContradiction = {
    ...honest,
    text: 'Rotation completed successfully!',
  };
  return [
    {
      name: 'honest answer',
      score: verifierScore(honest),
      textChecked: false,
    },
    {
      name: 'invented action field',
      score: verifierScore(inventedAction),
      textChecked: false,
    },
    {
      name: 'contradictory prose',
      score: verifierScore(proseContradiction),
      textChecked: false,
    },
  ];
}
export function expectedPolicyAnswer(row) {
  return {
    decision: row.stale && row.age >= 30 ? 'eligible' : 'not eligible',
    policy: 'P-7',
    action: false,
  };
}
export function scorePolicyCase(row) {
  const expected = expectedPolicyAnswer(row);
  return (
    row.decision === expected.decision &&
    row.policy === expected.policy &&
    row.action === expected.action
  );
}
export function releaseGate(report) {
  const blockers = [];
  const int = (v) => Number.isInteger(v) && v >= 0;
  if (
    !int(report.policyCasesTotal) ||
    report.policyCasesTotal === 0 ||
    !int(report.policyCasesPassed) ||
    report.policyCasesPassed > report.policyCasesTotal ||
    !int(report.actionClaims) ||
    (report.p95DecisionMs !== null && !int(report.p95DecisionMs))
  )
    blockers.push('invalid report');
  if (report.policyCasesPassed !== report.policyCasesTotal) blockers.push('policy cases');
  if (report.actionClaims !== 0) blockers.push('action claims');
  if (!Number.isFinite(report.p95DecisionMs)) blockers.push('latency measurement pending');
  else if (report.p95DecisionMs > report.budgetMs) blockers.push('latency budget');
  return {
    verdict: blockers.length ? 'BLOCK' : 'PROMOTE',
    blockers,
  };
}
export function fixtureReport() {
  return {
    policyCasesPassed: policyCases.filter(scorePolicyCase).length,
    policyCasesTotal: policyCases.length,
    actionClaims: policyCases.filter((row) => row.action).length,
    p95DecisionMs: null,
    budgetMs: 1000,
  };
}
export function weightMemory(tokens = 32768) {
  const parameters = 70e9;
  const bytes = [2, 1, 0.5].map(
    (bytesPerParameter) => (parameters * bytesPerParameter) / 1024 ** 3,
  );
  const { layers, kvHeads, headDim, bytesPerElement } = {
    layers: 80,
    kvHeads: 8,
    headDim: 128,
    bytesPerElement: 2,
  };
  const cachePerRequest = (2 * layers * kvHeads * headDim * tokens * bytesPerElement) / 1024 ** 3;
  const twoRequestSubtotal = bytes[2] + 2 * cachePerRequest;
  return {
    parameters,
    tokens,
    layers,
    kvHeads,
    headDim,
    bytesPerElement,
    precisions: ['BF16', 'INT8', 'INT4'],
    bytes,
    cachePerRequest,
    twoRequestSubtotal,
    shortfallAt48: twoRequestSubtotal - 48,
    remainingAt60: 60 - twoRequestSubtotal,
  };
}
export function servingWindow() {
  const shortRequest = 15,
    longRequest = 600;
  return {
    shortRequest,
    longRequest,
    staticIdle: longRequest - shortRequest,
    cacheBlockTokens: 4,
  };
}
export function policyDiagnosis(step) {
  const checkerThreshold = step === 0 ? 30 : 60;
  const boundary = [59, 60].map((age) => ({
    age,
    decision: age >= checkerThreshold ? 'eligible' : 'ineligible',
  }));
  return {
    source: {
      version: 'P-7 v2',
      threshold: 60,
    },
    retrieved: {
      version: 'P-7 v2',
      threshold: 60,
    },
    checker: {
      version: step > 0 ? 'checker v2' : 'checker v1',
      threshold: checkerThreshold,
    },
    weights: 'checkpoint v4',
    boundary: step === 2 ? boundary : [],
  };
}
export function quantizationToy() {
  const w = [0.24, 0.44],
    x = [10, 1],
    dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0),
    round = (a) => a.map((v) => Math.round(v * 10) / 10),
    scaledW = [w[0] * 2, w[1]],
    scaledX = [x[0] / 2, x[1]];
  return {
    w,
    x,
    exact: dot(w, x),
    rounded: round(w),
    plain: dot(round(w), x),
    scaledW,
    scaledX,
    scaledExact: dot(scaledW, scaledX),
    scaledRounded: round(scaledW),
    scaled: dot(round(scaledW), scaledX),
  };
}
export function responseCacheDecision({ request, policy, checker, cached }) {
  if (policy.version !== checker.policyVersion || policy.threshold !== checker.threshold)
    return {
      kind: 'checker_mismatch',
    };
  const identity = [
    request.id,
    request.age,
    request.stale,
    request.model,
    policy.version,
    checker.version,
  ].join('|');
  if (cached?.identity === identity)
    return {
      kind: 'hit',
      identity,
      ...cached.answer,
    };
  return {
    kind: 'recompute',
    identity,
    eligible: request.stale && request.age >= policy.threshold,
    executed: false,
  };
}

export const releaseExample = {
  report: {
    policyCasesPassed: 20,
    policyCasesTotal: 20,
    actionClaims: 0,
    p95DecisionMs: 780,
    budgetMs: 1000,
  },
  bundle: {
    weights: 'v4',
    tokenizer: 'T2',
    template: '4',
    policy: 'P-7 v1',
    runtime: 'R6',
    cases: 'E3',
  },
};

export function reportMatchesRelease(evaluated, intended) {
  const fields = Object.keys(evaluated);
  return (
    fields.length === Object.keys(intended).length &&
    fields.every((field) => Object.hasOwn(intended, field) && evaluated[field] === intended[field])
  );
}

export const replyRequest = { id: 'K10234', age: 75, stale: true, model: 'v4' };
export const oldRule = { version: 'P-7 v2', threshold: 60 };
export const activeRule = { version: 'P-7 v3', threshold: 90 };
export const oldChecker = {
  version: 'C2',
  policyVersion: oldRule.version,
  threshold: oldRule.threshold,
};
export const activeChecker = {
  version: 'C3',
  policyVersion: activeRule.version,
  threshold: activeRule.threshold,
};

export function checkReply(request, cached) {
  return responseCacheDecision({ request, policy: activeRule, checker: activeChecker, cached });
}

export function storeReply(decision) {
  return {
    identity: decision.identity,
    answer: { eligible: decision.eligible, executed: decision.executed },
  };
}

// The old application indexed its stored reply by only two fields.
export function replayShortKey(storedRequest, incoming) {
  const shortKey = (request) => [request.id, request.model].join('|');
  const answer = responseCacheDecision({
    request: storedRequest,
    policy: oldRule,
    checker: oldChecker,
  });
  const entry = new Map([[shortKey(storedRequest), answer]]);
  return entry.get(shortKey(incoming));
}
