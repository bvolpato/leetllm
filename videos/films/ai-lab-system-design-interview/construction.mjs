import { clamp, lerp, segment, smooth } from './arithmetic.mjs';
import { DOCS, SCENES, SYSTEM_EXTENSION_SCENES, TRANSITIONS } from './fixtures.mjs';
import {
  canTransition,
  dualResourceAdmission,
  eligibleDocuments,
  memoryBudget,
  queueAdmission,
  releaseGate,
  retryMode,
  servingSnapshot,
  trafficBudget,
} from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  SCENES.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-first-principle`,
        snapshot: {
          step: 0,
        },
      },
      cues: [
        {
          id: `${id}-next-layer`,
          beat: 1,
          at: 0,
          snapshot: {
            step: 1,
          },
        },
      ],
    }),
  ]),
);
export function systemCue(state, id, beat, kind = 'operation') {
  if ((state.beat ?? 0) < beat) return 0;
  if ((state.beat ?? 0) > beat) return 1;
  const cue = state.cues?.[`sd-${id}-${beat}-${kind}`];
  if (cue) return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : clamp(cue.progress);
  return clamp(
    ((state.beatP ?? 0) - (kind === 'result' ? 0.77 : 0.04)) / (kind === 'result' ? 0.2 : 0.9),
  );
}
export function namedSystemCue(state, id, beat, fallback = 0.8) {
  if ((state.beat ?? 0) < beat) return 0;
  if ((state.beat ?? 0) > beat) return 1;
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : clamp(cue.progress)
    : segment(state.beatP ?? 0, fallback, fallback + 0.12);
}
export function spokenResult(state, id, beat, fallback) {
  const current = state.beat ?? 0;
  if (current !== beat) return current > beat;
  const cue = state.cues?.[id];
  return cue ? cue.phase === 'after' : (state.beatP ?? 0) >= fallback;
}

export function systemExtensionFrame(id, state) {
  const beat = state.beat ?? 0,
    op = systemCue(state, id, beat),
    result = systemCue(state, id, beat, 'result'),
    done = result === 1;
  const frame = {
    id,
    beat,
    op,
    result,
    done,
  };
  if (id === 'cache-bytes')
    return {
      ...frame,
      factors: [2, 32, 8, 128, 2],
      perToken: 2 * 32 * 8 * 128 * 2,
      positions: 16 * 2048,
      cache: memoryBudget(),
      factorCount: Math.min(5, Math.floor(op * 6)),
      resultReady: beat > 0 || done,
    };
  if (id === 'demand-sensitivity') {
    const output = beat === 0 ? 450 : Math.round(lerp(450, 900, beat > 1 ? 1 : op));
    return {
      ...frame,
      output,
      traffic: trafficBudget({
        outputTokens: output,
      }),
      resultReady: beat > 1 || (beat === 1 && done),
    };
  }
  if (id === 'quota-reservation') {
    const reserve = beat > 0 ? 1 : namedSystemCue(state, 'sd-quota-reserved', 0, 0.35),
      settle = beat > 0 ? 1 : namedSystemCue(state, 'sd-quota-refunded', 0, 0.65),
      reserved = reserve === 1 ? 1800 : 0,
      refunded = reserved === 1800 && settle === 1 ? 280 : 0,
      claim = beat > 1 ? 1 : namedSystemCue(state, 'sd-quota-claim', 1, 0.7),
      naive = beat > 1 ? 1 : namedSystemCue(state, 'sd-quota-naive', 1, 0.4),
      deny = beat > 1 ? 1 : namedSystemCue(state, 'sd-quota-deny', 1, 0.83);
    return {
      ...frame,
      reserveProgress: reserve,
      refundProgress: settle,
      reserved,
      refunded,
      balance: 10000 - reserved + refunded,
      naiveReady: naive === 1,
      firstClaim: claim === 1,
      secondDenied: claim === 1 && deny === 1,
      pending: beat === 2,
      concurrentRemaining: claim === 1 ? 30 : 100,
    };
  }
  if (id === 'phase-latency') {
    const times = [200, 210, 220, 500];
    const first = spokenResult(state, 'phase-first', 1, 0.3);
    const middle = namedSystemCue(state, 'phase-short', 1, 0.45);
    const last = spokenResult(state, 'phase-last', 1, 0.74);
    const n = last ? 4 : first ? 1 + Math.floor(middle * 2) : 0;
    return {
      ...frame,
      times,
      n,
      ttft: times[0],
      gaps: times.slice(1).map((t, i) => t - times[i]),
      tpot: (times.at(-1) - times[0]) / (times.length - 1),
      longGap: spokenResult(state, 'phase-long', 2, 0.23),
      resultReady: spokenResult(state, 'phase-mean', 2, 0.56),
    };
  }
  if (id === 'cache-compatibility')
    return {
      ...frame,
      adapter: beat === 0 && op < 0.4 ? 'A1' : 'A2',
      changed: beat > 0 || op >= 0.4,
      granted: beat === 0,
      provider: beat < 2 ? 'route A' : 'route B',
      reuse: beat === 0 ? 'recompute' : beat === 1 ? 'deny' : 'miss',
    };
  if (id === 'concurrent-claim') {
    const slotClaimed = spokenResult(state, 'claim-first', 1, 0.42);
    const resourcesReleased = spokenResult(state, 'claim-release', 2, 0.28);
    const occupied = slotClaimed && !resourcesReleased;
    const activeDecode = occupied ? 64 : 63;
    const freeKvBlocks = occupied ? 0 : 16;
    const capacity = dualResourceAdmission({ activeDecode, freeKvBlocks });
    return {
      ...frame,
      slotClaimed,
      resourcesReleased,
      activeDecode,
      freeKvBlocks,
      capacity,
      secondRejected: spokenResult(state, 'claim-reject', 1, 0.75),
      wait: capacity.prefill.estimatedWait,
    };
  }
  if (id === 'acl-freshness')
    return {
      ...frame,
      age: 20,
      budget: 60,
      fresh: 20 <= 60,
      grant: false,
      revocationAge: 1,
      resultReady: beat > 1 || (beat === 1 && done),
    };
  if (id === 'task-claims')
    return {
      ...frame,
      stored: (beat === 1 && op > 0.62) || beat > 1 ? 'running' : 'blocked',
      staleClaim: beat > 1 || (beat === 1 && op > 0.28),
      claimed: beat > 1 || (beat === 1 && op > 0.62),
      terminalReopen: canTransition('complete', 'running'),
    };
  if (id === 'retry-and-cancel')
    return {
      ...frame,
      mode: retryMode('create_commit', beat === 0 ? false : 'True'),
      intent: beat === 2 && op > 0.14,
      receipt: beat === 2 && op > 0.5,
      exit: beat === 2 && done,
      commit: 'c42',
      attempt: 'W1',
    };
  if (id === 'typed-release') {
    const next = beat === 2;
    const altered = beat === 1 && spokenResult(state, 'packet-edit', 1, 0.42);
    const bool = spokenResult(state, 'packet-bool', 2, 0.43);
    const zero = spokenResult(state, 'packet-zero', 2, 0.65);
    const leaks = next ? (zero ? 0 : bool ? false : null) : 0;
    const echo = altered ? 0 : 0.95;
    const packet = releaseGate({
      recall: next ? 0.96 : 0.94,
      faithfulness: next ? 0.97 : 0.93,
      leaks,
      faithfulnessMinimum: echo,
    });
    return {
      ...frame,
      ...packet,
      next,
      altered,
      echo,
      allowed: packet.launchAllowed,
      denied: spokenResult(state, 'packet-deny', 1, 0.68),
    };
  }
  if (id === 'canary-controller') {
    const cases = [
        {
          error: null,
          latency: null,
          leaks: 1,
        },
        {
          error: 0.01,
          latency: 900,
          leaks: 0,
        },
        {
          error: 0.011,
          latency: 800,
          leaks: 0,
        },
      ],
      i = beat === 0 ? 0 : beat === 1 ? (done ? 1 : 2) : 2;
    return {
      ...frame,
      cases,
      index: i,
      decision: i === 0 ? 'rollback' : i === 1 ? 'expand' : 'hold',
    };
  }
  if (id === 'decision-rehearsal') {
    const lengths = [4, 5, 5, 6, 8, 7, 5, 5];
    return {
      ...frame,
      lengths,
      total: lengths.reduce((a, b) => a + b, 0),
      elapsed: beat === 1 ? 45 * op : beat > 1 ? 45 : 0,
    };
  }
  if (id === 'fresh-boundary') {
    const repairInputs = spokenResult(state, 'sd-fresh-repair-inputs', 2, 0.3);
    const measured = dualResourceAdmission({
      prefillTokens: 25_000,
      prefillRate: 125_000,
      activeDecode: 63,
      maxDecode: 64,
      freeKvBlocks: 16,
      neededKvBlocks: 16,
    });
    const age = repairInputs ? 10 : 75;
    const leakEvidence = repairInputs ? 0 : null;
    const gate = releaseGate({ recall: 0.96, faithfulness: 0.97, leaks: leakEvidence });
    return {
      ...frame,
      measured,
      queue: measured.prefill.estimatedWait,
      capacity: measured.admitted,
      age,
      acl: age <= 60,
      leakEvidence,
      gate,
      release: gate.launchAllowed,
      capacityReady: spokenResult(state, 'sd-fresh-capacity', 1, 0.35),
      aclReady: spokenResult(state, 'sd-fresh-acl', 1, 0.6),
      releaseReady: spokenResult(state, 'sd-fresh-release', 1, 0.93),
      answersReady: spokenResult(state, 'sd-fresh-release', 1, 0.93),
      repairInputs,
      repairReady: spokenResult(state, 'sd-fresh-repair-result', 2, 0.63),
      financeGranted: eligibleDocuments().some((doc) => doc.id === 'finance-plan'),
    };
  }
  return frame;
}
export function memoryTrace(beat, progress, cues) {
  const seconds = progress * [17.408, 18.944][beat],
    phase = (a, b) => clamp((seconds - a) / (b - a));
  const grow = cues?.['memory-grow-cache'],
    group = cues?.['memory-quarter-heads'];
  const heads =
    beat === 0
      ? Math.min(32, Math.floor(32 * (grow ? grow.progress : phase(3.59, 7.9)) + 1e-9))
      : 32 - Math.min(24, Math.floor(24 * (group ? group.progress : phase(4.79, 8.9)) + 1e-9));
  const shape = memoryBudget(),
    perHeadGb = shape.mhaGb / 32;
  return {
    seconds,
    heads,
    weightsGb: shape.weightsGb,
    kvGb: heads * perHeadGb,
    fullKvGb: shape.mhaGb,
  };
}
export function admissionSnapshot(beat, p, { comparisonQueuedTokens = 50_000, cues } = {}) {
  const state = { beat, beatP: p, cues };
  const join = namedSystemCue(state, 'admission-join', 0, 0.52);
  const seconds =
    0.08 * namedSystemCue(state, 'admission-drain-a', 1, 0.02) +
    0.08 * namedSystemCue(state, 'admission-drain-b', 1, 0.19) +
    0.04 * namedSystemCue(state, 'admission-drain-own', 1, 0.65);
  const service = servingSnapshot(seconds, { joined: join === 1 });
  const rejectReady = spokenResult(state, 'admission-verdict', 2, 0.82);
  const comparison = queueAdmission(comparisonQueuedTokens, 125_000, 0.25);
  const comparisonLabel = !rejectReady
    ? 'evaluate admission'
    : comparison.admitted
      ? 'ADMIT · budget fits'
      : '503 shared overload';
  const comparisonDetail = !rejectReady
    ? 'R-105 admission decision pending'
    : comparison.admitted
      ? 'R-105 joins the queue; allocate resources when service starts'
      : 'R-105 receives no slot or KV allocation';
  return {
    ...service,
    join,
    rejectReady,
    comparison,
    comparisonLabel,
    comparisonDetail,
    allowed: queueAdmission(20_000, 125_000, 0.25),
  };
}
export const MEMORY = memoryBudget();
export const TRAFFIC = trafficBudget();
export const SMALL_QUEUE = queueAdmission(20_000, 125_000, 0.25);
export const LARGE_QUEUE = queueAdmission(50_000, 125_000, 0.25);
export const TWO_RESOURCES = dualResourceAdmission();
export const ELIGIBLE = eligibleDocuments();
export const GATE = releaseGate();
export function sampleModel(sceneId, state) {
  if (SYSTEM_EXTENSION_SCENES.includes(sceneId)) return systemExtensionFrame(sceneId, state);
  if (!tracks[sceneId]) throw new Error(`unknown system-design scene: ${sceneId}`);
  const held = tracks[sceneId].sample({
    beat: state.beat ?? 0,
    beatP: state.beatP ?? 0,
  });
  const step = held.snapshot.step,
    p = clamp(state.beatP ?? 0),
    q = smooth(p);
  if (sceneId === 'opening')
    return {
      step,
      q,
      queuePressure: namedSystemCue(state, 'opening-unfold', 2, 0.05),
      response: spokenResult(state, 'opening-status', 2, 0.58)
        ? '503 shared overload'
        : 'admission decision',
    };
  if (sceneId === 'contract')
    return {
      step,
      q,
      stage: Math.min(4, Math.floor(q * 5)),
      requestId: 'R-104',
      receipt: step
        ? 'policy · quota · route · queue · provider'
        : 'request ID assigned before auth',
    };
  if (sceneId === 'memory') {
    const activeHeads = step ? MEMORY.groupedHeads : MEMORY.heads;
    const currentKvGb = step ? MEMORY.gqaGb : MEMORY.mhaGb;
    return {
      step,
      q,
      ...MEMORY,
      currentKvGb,
      activeHeads,
      compared: step ? 'GQA' : 'MHA',
    };
  }
  if (sceneId === 'demand')
    return {
      step,
      q,
      ...TRAFFIC,
      revealedTokensPerSecond: TRAFFIC.tokensPerSecond * q,
    };
  if (sceneId === 'admission')
    return {
      step,
      q,
      sim: admissionSnapshot(state.beat ?? 0, p, {
        comparisonQueuedTokens: state.comparisonQueuedTokens,
        cues: state.cues,
      }),
      small: SMALL_QUEUE,
      large: LARGE_QUEUE,
      dual: TWO_RESOURCES,
      overQuota: {
        status: 429,
        reason: 'caller rate limit',
        fleetIdle: true,
      },
      sharedFull: {
        status: 503,
        reason: 'shared capacity',
        underQuota: true,
      },
    };
  if (sceneId === 'permissions')
    return {
      step,
      q,
      documents: DOCS,
      eligible: ELIGIBLE,
      selected: step ? (q < 0.5 ? null : (ELIGIBLE[0]?.id ?? null)) : null,
    };
  if (sceneId === 'agent-state')
    return {
      step,
      q,
      transitions: TRANSITIONS,
      retryRead: retryMode('repo_read'),
      retryWrite: retryMode('create_commit'),
      retrySafeWrite: retryMode('create_commit', true),
      cancelConfirmed: step === 1 && q >= 1,
    };
  return {
    step,
    q,
    ...GATE,
  };
}
