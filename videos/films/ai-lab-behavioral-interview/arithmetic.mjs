import { CASES, PASSING_CASES, PHASES } from './fixtures.mjs';
import assert from 'node:assert/strict';
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const smooth = (value) => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};
export function offlineDecision(checks, otherGatesPass) {
  if (
    !checks ||
    typeof checks !== 'object' ||
    Array.isArray(checks) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(checks)) ||
    Object.keys(checks).length !== CASES.length ||
    CASES.some((id) => !Object.hasOwn(checks, id) || checks[id] !== true)
  ) {
    return {
      action: 'hold',
      candidateTraffic: 0,
      reason: 'authorization evidence incomplete',
    };
  }
  if (otherGatesPass !== true)
    return {
      action: 'hold',
      candidateTraffic: 0,
      reason: 'other release evidence incomplete',
    };
  return {
    action: 'eligible for approved canary',
    candidateTraffic: 5,
    reason: 'required offline gates pass',
  };
}
export function canaryDecision({ checks, otherGatesPass, p95Ms, windowComplete }) {
  const offline = offlineDecision(checks, otherGatesPass);
  if (offline.candidateTraffic === 0)
    return {
      ...offline,
      canaryTraffic: 0,
    };
  if (windowComplete !== true || !Number.isFinite(p95Ms) || p95Ms < 0) {
    return {
      action: 'hold canary review',
      candidateTraffic: 5,
      canaryTraffic: 5,
      reason: 'latency evidence incomplete',
    };
  }
  if (p95Ms >= 500)
    return {
      action: 'withdraw candidate traffic',
      candidateTraffic: 0,
      canaryTraffic: 0,
      reason: 'strict latency limit reached',
    };
  return {
    action: 'eligible for next-stage approval',
    candidateTraffic: 20,
    canaryTraffic: 5,
    reason: 'required checks pass',
  };
}
export function storyAt(time) {
  if (!Number.isFinite(time) || time < 0 || time > 6)
    throw new RangeError('story phase must be between zero and six');
  const phase = Math.min(6, Math.floor(time));
  const repaired = time >= 3.6;
  const offlinePass = time >= 4.6;
  const canary = time >= 4.8;
  const windowComplete = time >= 6;
  const canaryProgress = canary ? clamp((time - 4.8) / (6 - 4.8)) : 0;
  const checks = repaired ? PASSING_CASES : Object.fromEntries(CASES.map((id) => [id, false]));
  const release = canaryDecision({
    checks,
    otherGatesPass: offlinePass,
    p95Ms: windowComplete ? 420 : null,
    windowComplete,
  });
  return {
    time,
    phase: PHASES[phase],
    checks,
    repaired,
    offlinePass,
    canary,
    canaryProgress,
    windowComplete,
    candidateTraffic: 5 * canaryProgress,
    p95Ms: windowComplete ? 420 : null,
    latencyLimit: 500,
    release,
  };
}
export function nearestRank(values, fraction) {
  assert(
    Array.isArray(values) &&
      values.length &&
      values.every((x) => typeof x === 'number' && Number.isFinite(x) && x >= 0),
  );
  assert(Number.isFinite(fraction) && fraction > 0 && fraction <= 1);
  const sorted = [...values].sort((a, b) => a - b),
    rank = Math.ceil(sorted.length * fraction);
  return {
    sorted,
    rank,
    value: sorted[rank - 1],
    count: sorted.length,
  };
}
export function launchRecommendation(
  checks,
  { stage = 'offline', p95Ms = null, windowComplete = false, otherGatesPass = false } = {},
) {
  if (!['offline', 'canary'].includes(stage)) throw new RangeError('unknown release stage');
  return stage === 'offline'
    ? offlineDecision(checks, otherGatesPass)
    : canaryDecision({
        checks,
        otherGatesPass,
        p95Ms,
        windowComplete,
      });
}
export function gatePredicates(checks, otherGatesPass, windowComplete, p95Ms) {
  const dictionary = Boolean(
      checks &&
      typeof checks === 'object' &&
      !Array.isArray(checks) &&
      [Object.prototype, null].includes(Object.getPrototypeOf(checks)),
    ),
    exactKeys =
      dictionary &&
      Object.keys(checks).length === CASES.length &&
      CASES.every((id) => Object.hasOwn(checks, id)),
    literalTrue = exactKeys && CASES.every((id) => checks[id] === true),
    finiteLatency = typeof p95Ms === 'number' && Number.isFinite(p95Ms) && p95Ms >= 0;
  return {
    dictionary,
    exactKeys,
    literalTrue,
    otherGates: otherGatesPass === true,
    completeWindow: windowComplete === true,
    finiteLatency,
    belowLimit: finiteLatency && p95Ms < 500,
  };
}
export function claimHeadroom(observed = 420, limit = 500, baseline = null) {
  assert(Number.isFinite(observed) && Number.isFinite(limit) && limit > 0);
  return {
    gap: limit - observed,
    headroom: (limit - observed) / limit,
    improvement: baseline === null ? null : (baseline - observed) / baseline,
  };
}
export function effectDecision({ readGranted, bulkExportGranted, ownerApproved }) {
  return {
    triage: readGranted === true,
    bulkExport: bulkExportGranted === true && ownerApproved === true,
    exportCount: bulkExportGranted === true && ownerApproved === true ? 1 : 0,
  };
}
export function publicRehearsalPacket(fields) {
  assert(
    Array.isArray(fields) &&
      fields.every((x) => typeof x.text === 'string' && typeof x.private === 'boolean'),
  );
  return fields.filter((x) => !x.private).map((x) => x.text);
}
export function storySupports(prompt) {
  return ['launch judgment', 'disagreement', 'safety'].includes(prompt);
}
export function holdoutOverlap(development, proposedHoldout) {
  const seen = new Set(development);
  return [...new Set(proposedHoldout)].filter((id) => seen.has(id));
}
export function freshDecisionState({
  withdrawn = false,
  laterValue = false,
  laterEligible = false,
} = {}) {
  const original = launchRecommendation(PASSING_CASES, {
      stage: 'canary',
      p95Ms: 500,
      windowComplete: true,
      otherGatesPass: true,
    }),
    later = launchRecommendation(PASSING_CASES, {
      stage: 'canary',
      p95Ms: 480,
      windowComplete: true,
      otherGatesPass: true,
    });
  return {
    originalP95: 500,
    originalResult: withdrawn ? original : null,
    laterP95: laterValue ? 480 : null,
    laterResult: laterEligible ? later : null,
    routerTraffic: null,
    ownerApproval: 'required',
    improvement: null,
    recurrence: null,
  };
}
export function routingConcentration() {
  return {
    total: 20,
    candidate: 1,
    overallShare: 1 / 20,
    tenantA: {
      total: 1,
      candidate: 1,
      share: 1,
    },
    tenantB: {
      total: 19,
      candidate: 0,
      share: 0,
    },
    leakRate: null,
  };
}
