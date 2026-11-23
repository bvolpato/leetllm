import { customerQuestion, trusted } from './fixtures.mjs';
import { createHmac } from 'node:crypto';

export function actionReceipt(actionKey, operations) {
  const sameIntent = operations.filter((operation) => operation.key === actionKey);
  const lookup = sameIntent.find((operation) => operation.kind === 'status' && operation.jobId);
  return {
    writes: sameIntent.filter((operation) => operation.kind === 'create').length,
    jobId: lookup?.jobId ?? null,
  };
}

export function redactedTelemetry(input) {
  const usage = input.usage,
    hasUsage = usage !== null && usage !== undefined;
  if (
    hasUsage &&
    ![usage.inputTokens, usage.outputTokens].every((value) => Number.isInteger(value) && value >= 0)
  )
    throw new Error('Usage requires nonnegative integer token counts');
  return {
    model: 'provider-model-id',
    promptVersion: 'rotation_decision@2',
    latencyMs: 840,
    inputTokens: hasUsage ? usage.inputTokens : null,
    outputTokens: hasUsage ? usage.outputTokens : null,
    estimatedCost: hasUsage ? (usage.inputTokens * 2 + usage.outputTokens * 6) / 1_000_000 : null,
    status: hasUsage ? 'ok' : 'usage_pending',
    questionFingerprint: createHmac('sha256', input.fingerprintKey)
      .update(input.question)
      .digest('hex')
      .slice(0, 32),
  };
}
export function checkRotation(candidate, facts = trusted) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
    return {
      status: 'invalid_shape',
    };
  const keys = Object.keys(candidate).sort();
  if (keys.join(',') !== 'decision,minimum_key_age_days,source_line_ids')
    return {
      status: 'invalid_fields',
    };
  if (
    typeof candidate.decision !== 'string' ||
    !['eligible', 'not_eligible'].includes(candidate.decision)
  )
    return {
      status: 'invalid_decision',
    };
  if (
    typeof candidate.minimum_key_age_days !== 'number' ||
    !Number.isInteger(candidate.minimum_key_age_days)
  )
    return {
      status: 'invalid_threshold',
    };
  if (
    !Array.isArray(candidate.source_line_ids) ||
    candidate.source_line_ids.some((value) => typeof value !== 'string')
  )
    return {
      status: 'invalid_sources',
    };
  if (
    candidate.minimum_key_age_days !== facts.thresholdDays ||
    candidate.source_line_ids.join(',') !== facts.policyId
  )
    return {
      status: 'policy_mismatch',
    };
  const expected =
    facts.stale && facts.ageDays >= facts.thresholdDays ? 'eligible' : 'not_eligible';
  return candidate.decision === expected
    ? {
        status: 'accepted',
        expected,
      }
    : {
        status: 'fact_mismatch',
        expected,
      };
}
export function validationCases() {
  const candidates = [
    {
      label: 'candidate disagrees with facts',
      value: {
        decision: 'not_eligible',
        minimum_key_age_days: 30,
        source_line_ids: ['P-7'],
      },
    },
    {
      label: 'candidate changes the policy',
      value: {
        decision: 'eligible',
        minimum_key_age_days: 90,
        source_line_ids: ['P-7'],
      },
    },
    {
      label: 'candidate matches trusted state',
      value: {
        decision: 'eligible',
        minimum_key_age_days: 30,
        source_line_ids: ['P-7'],
      },
    },
  ];
  return candidates.map((row) => ({
    ...row,
    result: checkRotation(row.value),
  }));
}
export function retryPlan() {
  const deadline = 20,
    firstAttempt = {
      start: 0,
      end: 14,
    },
    retryAfter = 2;
  const jitterCeiling = 1,
    randomDraw = 0.5,
    wait = retryAfter + jitterCeiling * randomDraw;
  const secondAttempt = {
    start: firstAttempt.end + wait,
    duration: 3,
  };
  secondAttempt.end = secondAttempt.start + secondAttempt.duration;
  return {
    deadline,
    firstAttempt,
    retryAfter,
    randomDraw,
    wait,
    secondAttempt,
    remainingAfterFirst: deadline - firstAttempt.end,
    remainingAfterWait: deadline - secondAttempt.start,
    fits: secondAttempt.end <= deadline,
    shortBudget: 1.2,
    shortBudgetFits: retryAfter < 1.2,
  };
}
export function classifyFailure(status, code) {
  if (status === 429 && code === 'rate_limit') return 'bounded_retry';
  if (status === 429 && code === 'credit_balance_exhausted') return 'fix_quota';
  if (status === 401 || status === 403) return 'fix_credentials_or_access';
  if ([500, 502, 503, 504].includes(status)) return 'bounded_retry';
  return 'inspect';
}
export function breakerSnapshot(step) {
  const states = [
    {
      state: 'closed',
      failures: 0,
      primary: true,
      fallback: false,
      probe: false,
    },
    {
      state: 'open',
      failures: 2,
      primary: false,
      fallback: true,
      probe: false,
    },
    {
      state: 'half_open',
      failures: 2,
      primary: true,
      fallback: true,
      probe: true,
    },
  ];
  return {
    ...states[Math.min(step, 2)],
    threshold: 2,
    cooldownSeconds: 10,
    recovery: {
      success: 'closed',
      failure: 'open',
    },
    failureRows: [
      ['429 rate limit', classifyFailure(429, 'rate_limit').replaceAll('_', ' ')],
      [
        '429 credit exhausted',
        classifyFailure(429, 'credit_balance_exhausted').replaceAll('_', ' '),
      ],
      ['401 unauthorized', classifyFailure(401, '').replaceAll('_', ' ')],
    ],
  };
}
export function idempotentJobTrace(step) {
  const jobs = new Map();
  const createOnce = (intentKey, accountId) => {
    if (jobs.has(intentKey)) {
      const saved = jobs.get(intentKey);
      if (saved.accountId !== accountId)
        throw new Error('intent key reused with different arguments');
      return {
        jobId: saved.jobId,
        created: false,
      };
    }
    const jobId = 'JOB-001';
    jobs.set(intentKey, {
      accountId,
      jobId,
    });
    return {
      jobId,
      created: true,
    };
  };
  const first = step > 0 ? createOnce('intent-7e3b', trusted.accountId) : null;
  const retry = step > 1 ? createOnce('intent-7e3b', trusted.accountId) : null;
  return {
    step,
    jobs: jobs.size,
    first,
    retry,
    intentKey: 'intent-7e3b',
    safe: !retry || (first.jobId === retry.jobId && jobs.size === 1),
  };
}
export function streamSnapshot(step) {
  const chunks = ['Account ', '10234 ', 'is eligible ', 'under P-7.'];
  const shown = chunks.slice(0, step === 0 ? 0 : step === 1 ? 2 : 4);
  return {
    step,
    metadataAt: 0.2,
    firstTextAt: 3,
    completedAt: 5,
    now: step === 0 ? 0.2 : step === 1 ? 3.6 : 5,
    chunks,
    shown,
    buffer: shown.join(''),
    terminal: step === 2,
    ttftSeconds: 3,
    totalSeconds: 5,
    readyForValidation: step === 2,
  };
}
export function costTrace() {
  const inputTokens = 250,
    outputTokens = 80,
    inputRate = 2,
    outputRate = 6;
  const inputCost = (inputTokens * inputRate) / 1_000_000;
  const outputCost = (outputTokens * outputRate) / 1_000_000;
  const dailyCalls = 200_000,
    days = 30,
    totalCost = inputCost + outputCost;
  return {
    inputTokens,
    outputTokens,
    inputRate,
    outputRate,
    inputCost,
    outputCost,
    totalCost,
    dailyCalls,
    days,
    monthlyCost: totalCost * dailyCalls * days,
    log: redactedTelemetry({
      question: customerQuestion,
      fingerprintKey: 'dev-only-fingerprint-key',
      usage: {
        inputTokens,
        outputTokens,
      },
    }),
  };
}

export function reservation({ floor, ceiling, draw, call, check, remaining }) {
  const jitter = ceiling * draw;
  const wait = floor + jitter;
  const required = wait + call + check;
  return {
    floor,
    ceiling,
    draw,
    jitter,
    wait,
    call,
    check,
    required,
    remaining,
    admitted: wait < remaining && required <= remaining,
  };
}

export function deadlineReservation(remaining) {
  const { retryAfter, randomDraw, secondAttempt } = retryPlan();
  return reservation({
    remaining,
    floor: retryAfter,
    ceiling: 1,
    draw: randomDraw,
    call: secondAttempt.duration,
    check: 0.4,
  });
}

export function jitterWindows(full) {
  const base = 1,
    cap = 8,
    draw = 0.5;
  let previous = base;
  return [1, 2].map((retry) => {
    const low = full ? 0 : base;
    const high = full ? Math.min(cap, base * 2 ** (retry - 1)) : 3 * previous;
    const wait = Math.min(cap, low + draw * (high - low));
    previous = wait;
    return { low, high, wait };
  });
}

export const deltas = ['Account ', 'acct_10234 ', 'is eligible ', 'under P-7.'];
export function bufferThrough(count) {
  return deltas.slice(0, count).join('');
}

export function streamComparison(state, clock) {
  const { beat, beatP } = state;
  const cue = (id, owner) => {
    if (clock) return { progress: clock.p(id), after: clock.after(id), started: clock.started(id) };
    const item = state.cues?.[id];
    if (item)
      return {
        progress: item.progress,
        after: item.phase === 'after',
        started: item.phase !== 'before',
      };
    const progress = Math.max(0, Math.min(1, beat - owner + beatP));
    return { progress, after: progress === 1, started: progress > 0 };
  };
  const fill = ['eight-chars', 'nineteen-chars', 'thirty-one-chars', 'forty-one-chars'];
  const firstCount =
    beat > 0
      ? deltas.length
      : clock || state.cues?.['eight-chars']
        ? fill.filter((id) => cue(id, 0).after).length
        : Math.min(4, Math.floor(5 * beatP));
  const drop = cue('draft-dropped', 2);
  const partial = drop.started;
  const secondCount = partial
    ? Math.min(2, Math.floor(3 * drop.progress))
    : Math.min(4, Math.floor(5 * cue('draft-repeat', 1).progress));
  return {
    firstCount,
    secondCount,
    partial,
    receivedEnd: cue('draft-terminal', 0).after,
    atEof: cue('draft-eof', 1).after,
    secondFailed: cue('draft-failed', 2).after,
    dropFinished: drop.after,
  };
}

export const totalInput = 2000,
  writes = 100,
  output = 200,
  reasoning = 80;
export const rates = { ordinary: 2, cached: 0.5, writes: 2.5, output: 6 };

export function usageReceipt(cached) {
  const ordinary = totalInput - cached - writes;
  const cost =
    (ordinary * rates.ordinary +
      cached * rates.cached +
      writes * rates.writes +
      output * rates.output) /
    1_000_000;
  return { ordinary, cached, writes, output, visible: output - reasoning, cost };
}

export const accountB = { ageDays: 28, stale: true, thresholdDays: 21, policyId: 'P-7' };
export const accountBCandidate = {
  decision: 'eligible',
  minimum_key_age_days: 30,
  source_line_ids: ['P-7'],
};
export const freshBudget = reservation({
  floor: 1,
  ceiling: 2,
  draw: 0.25,
  call: 2,
  check: 0.7,
  remaining: 10 - 6,
});

// Each pair is the supplied first and second draw for one worker in the article's plot.
export const workerDraws = [
  [0.15, 0.3],
  [0.35, 0.75],
  [0.55, 0.2],
  [0.75, 0.8],
  [0.25, 0.55],
  [0.9, 0.4],
];
