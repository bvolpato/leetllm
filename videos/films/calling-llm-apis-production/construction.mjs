import { phase } from './arithmetic.mjs';
import { sceneIds, trusted } from './fixtures.mjs';
import {
  accountB,
  accountBCandidate,
  bufferThrough,
  freshBudget,
  jitterWindows,
  workerDraws,
  streamComparison,
  usageReceipt,
  breakerSnapshot,
  costTrace,
  idempotentJobTrace,
  retryPlan,
  streamSnapshot,
  validationCases,
} from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  sceneIds.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: id + '-0',
        snapshot: {
          step: 0,
        },
      },
      cues: [1, 2].map((step) => ({
        id: id + '-' + step,
        beat: step,
        at: 0,
        snapshot: {
          step,
        },
      })),
    }),
  ]),
);
export function timeoutSnapshot(p) {
  const now = 12 * phase(p, 0.04, 0.84),
    deadline = 4,
    remoteEnd = 16;
  return {
    now,
    deadline,
    remoteEnd,
    timedOut: now >= deadline,
    remoteActive: now >= 0.4 && now < remoteEnd,
    clientWait: Math.min(now, deadline),
    remoteWork: Math.max(0, now - 0.4),
    acknowledgedRemoteResult: null,
  };
}
export function retryConstruction(beat, progress) {
  const elapsed = Math.max(0, Math.min(1, progress)) * [10.278, 10.83, 13.784][Math.min(beat, 2)];
  const plan = retryPlan();
  const time =
    beat === 0
      ? 14 * phase(elapsed, 2.75, 4.5)
      : beat === 1
        ? 14 + 2 * phase(elapsed, 1.3625, 2.8375) + 0.5 * phase(elapsed, 3.9625, 4.975)
        : 16.5 + 3 * phase(elapsed, 0.2, 2.925);
  return {
    ...plan,
    elapsed,
    time,
    remaining: plan.deadline - time,
    shortComparison: beat === 2 && elapsed >= 4.575,
  };
}
export function breakerConstruction(beat, progress, cues) {
  const elapsed = Math.max(0, Math.min(1, progress)) * [11.694, 10.47, 16.28][Math.min(beat, 2)];
  const threshold = cues?.['breaker-failure-two-b2-1'],
    first = cues?.['breaker-first-receipt'];
  const thresholdReached = threshold && threshold.phase !== 'before';
  const failures =
    beat === 1 && threshold
      ? thresholdReached
        ? 2
        : first && first.phase !== 'before'
          ? 1
          : 0
      : beat === 0
        ? 0
        : beat === 1
          ? Number(elapsed >= 1.15) + Number(elapsed >= 3.5)
          : 2;
  const state =
    beat === 1 && threshold
      ? thresholdReached
        ? 'open'
        : 'closed'
      : beat === 0 || (beat === 1 && elapsed < 4.2)
        ? 'closed'
        : beat === 1 || elapsed < 2.1
          ? 'open'
          : 'half_open';
  return {
    ...breakerSnapshot(beat),
    elapsed,
    failures,
    state,
    cooldown: beat < 2 ? 0 : 10 * phase(elapsed, 0.1, 1.175),
    probeProgress: beat < 2 ? 0 : phase(elapsed, 1.425, 2.1),
    success: beat === 2 && elapsed >= 4.1125,
    failure: beat === 2 && elapsed >= 6.5875,
    failFast: beat === 1 && elapsed >= 5.2,
    fallback: beat === 1 && elapsed >= 7.7125,
  };
}
export function costConstruction(beat, progress) {
  const costs = costTrace();
  const elapsed = Math.max(0, Math.min(1, progress)) * [10.062, 10.88, 15.104][Math.min(beat, 2)];
  const inputProgress = beat > 0 ? 1 : phase(elapsed, 1.1125, 3.4);
  const outputProgress = beat > 0 ? 1 : phase(elapsed, 3.7, 5.575);
  return {
    ...costs,
    elapsed,
    inputProgress,
    outputProgress,
    currentInput: costs.inputCost * inputProgress,
    currentOutput: costs.outputCost * outputProgress,
    dailyVisible: beat === 1 && elapsed >= 1.5625,
    daysVisible: beat === 1 && elapsed >= 2.425,
    monthlyVisible: beat === 1 && elapsed >= 4.85,
  };
}
export function snapshot(id, step, p) {
  if (id === 'opening')
    return {
      step,
      p,
      facts: trusted,
      rejectedCandidate: validationCases()[0],
      ...timeoutSnapshot(p),
    };
  if (id === 'candidate-validation')
    return {
      step,
      p,
      ...validationCases()[step],
    };
  if (id === 'timeout-retry')
    return {
      step,
      p,
      ...retryConstruction(step, p),
    };
  if (id === 'circuit-breaker')
    return {
      step,
      p,
      ...breakerConstruction(step, p),
    };
  if (id === 'idempotency')
    return {
      step,
      p,
      ...idempotentJobTrace(step),
    };
  if (id === 'streaming')
    return {
      ...streamSnapshot(step),
      p,
    };
  if (id === 'cost-privacy')
    return {
      step,
      p,
      ...costConstruction(step, p),
    };
  return {
    step,
    p,
    request: {
      task: 'decide_rotation',
      account: trusted.accountId,
      policy: trusted.policyId,
      promptVersion: 'rotation_decision@2',
      credential: 'server-side secret',
    },
  };
}
export function sampleOriginalModel(sceneId, state) {
  const sampled = tracks[sceneId].sample(state).snapshot.step;
  const beatP = Math.max(0, Math.min(1, state.beatP ?? 0));
  const step = beatP === 1 && state.beat < 2 ? state.beat + 1 : sampled;
  return sceneId === 'circuit-breaker'
    ? {
        step,
        p: beatP,
        ...breakerConstruction(step, beatP, state.cues),
      }
    : snapshot(sceneId, step, beatP);
}
export const API_CHAPTERS = new Set([
  'secret-probe',
  'domain-wire',
  'parser-layers',
  'failure-receipt',
  'timeout-contract',
  'admission-limits',
  'jitter-geometry',
  'deadline-floor',
  'breaker-clock',
  'write-uncertainty',
  'format-contract',
  'sdk-wire',
  'stream-events',
  'stream-failures',
  'usage-subsets',
  'telemetry-scope',
  'execution-shapes',
  'fresh-request',
]);
export const progressOf = (state, id) => state.cues?.[id]?.progress ?? state.beatP ?? 0;
export function apiChapterState(id, state) {
  const beat = state.beat,
    p = phase(progressOf(state, 'ap-' + id + '-' + beat), 0, 1),
    settled = p >= 0.999999;
  const result = {
    beat,
    p,
    settled,
  };
  if (id === 'jitter-geometry')
    return {
      ...result,
      fullWaits: jitterWindows(true).map((row) => row.wait),
      decorrelatedWaits: jitterWindows(false).map((row) => row.wait),
      arrivals: workerDraws.map(([first, second]) => first + 2 * second),
    };
  if (id === 'usage-subsets') {
    const shift = beat < 2 ? 0 : beat > 2 ? 1 : progressOf(state, 'cache-shift');
    const row = usageReceipt(1200 + Math.round(400 * shift));
    return {
      ...result,
      input: { ordinary: row.ordinary, cached: row.cached, write: row.writes },
      output: { visible: row.visible, reasoning: row.output - row.visible, total: row.output },
      cost: row.cost,
    };
  }
  if (id === 'stream-failures') {
    const stream = streamComparison(state);
    const count = beat === 0 ? stream.firstCount : stream.secondCount;
    const lengths = [1, 2, 3, 4].map((n) => bufferThrough(n).length);
    const status =
      beat === 0
        ? stream.receivedEnd
          ? 'completed'
          : 'pending'
        : (stream.partial ? stream.dropFinished : stream.secondFailed)
          ? 'failed'
          : 'pending';
    return { ...result, ...stream, lengths, count, length: bufferThrough(count).length, status };
  }
  if (id === 'fresh-request')
    return {
      ...result,
      age: accountB.ageDays,
      threshold: accountB.thresholdDays,
      candidateThreshold: accountBCandidate.minimum_key_age_days,
      ...freshBudget,
      reserve: freshBudget.check,
      total: freshBudget.required,
    };
  if (id === 'breaker-clock') {
    const events = [
      [100, 101, 102, 103, 104, 113],
      [114, 114],
      [114, 115, 116, 126, 127],
      [114],
      [],
    ][beat];
    return {
      ...result,
      events,
      eventCount: Math.min(events.length, Math.floor(p * (events.length + 1))),
    };
  }
  if (id === 'timeout-contract')
    return {
      ...result,
      clock: 8 * p,
      readEvents: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5],
      firstText: null,
    };
  return result;
}
export function sampleModel(id, state) {
  return API_CHAPTERS.has(id) ? apiChapterState(id, state) : sampleOriginalModel(id, state);
}
