import { facts, grantPermit, grantRequest, ids, lanes, policy } from './fixtures.mjs';
import {
  Breaker,
  GrantLedger,
  compile,
  execute,
  rank,
  replyChecks,
  retry,
  violations,
} from './model.mjs';
import { after, progress } from './timing.mjs';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  ids.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-initial`,
        snapshot: {
          step: 0,
        },
      },
      cues: (id === 'deadline'
        ? [0, 1, 2, 3, 4]
        : id === 'transfer'
          ? [0, 1, 2, 3]
          : [0, 1, 2]
      ).map((step) => ({
        id: `${id}-${step}`,
        beat: step,
        at: 0,
        snapshot: {
          step,
        },
      })),
    }),
  ]),
);
export function cueProgress(cue, fallback) {
  if (!cue) return Math.max(0, Math.min(1, fallback));
  if (cue.phase === 'before') return 0;
  if (cue.phase === 'after') return 1;
  return Math.max(0, Math.min(1, cue.progress ?? fallback));
}
export function filterEvidence(beat, progress, context = beat === 2 ? 70000 : 24000) {
  const fields = ['data', 'context', 'schema', 'citations', 'review', 'cost'];
  const completed = Math.floor(
    Math.max(0, Math.min(1, (progress - (beat === 2 ? 0.16 : 0.04)) / (beat === 2 ? 0.6 : 0.72))) *
      (beat === 2 ? 6 : 36) +
      1e-9,
  );
  const contract = compile({
    ...facts,
    context,
  });
  const rows = lanes.map((lane, i) => ({
    lane,
    checks: fields.map((field, j) => ({
      field,
      checked:
        beat === 0 ? i * 6 + j < completed : beat === 1 || field !== 'context' || i < completed,
      pass: !violations(lane, contract).includes(field),
    })),
  }));
  const admitted = rows
    .filter((row) => row.checks.every((check) => check.checked && check.pass))
    .map((row) => row.lane.id);
  return {
    rows,
    admitted,
    completed,
    fields,
  };
}
export function publicationSnapshot(state) {
  const beat = state.beat;
  const words = progress(state, 'publish-words', 1, 0.03, 0.32);
  const wordCount = beat === 1 ? Math.ceil(3 * words) : 0;
  const published = wordCount > 0;
  const timeout = after(state, 'retry-classifier', 0, 0.58);
  const drop = after(state, 'latch-output', 1, 0.5);
  const failure = beat === 0 && timeout ? 'timeout' : beat === 1 && drop ? 'drop' : null;
  return {
    published,
    failure,
    wordCount,
    visibleText: ['Your', 'access', 'request…'].slice(0, wordCount).join(' '),
    mayRetry: retry(failure, published),
  };
}
export function deadlinePlayback(beat, beatP, cues) {
  const state = { beat, beatP, cues };
  const slow = beat === 1 || beat === 2;
  const cap = after(state, 'lower-cap', 3, 0.32) ? 8000 : policy.requestCap;
  const run = execute(slow ? 1800 : 940, cap);
  const primaryEnd = run.spans[0].end;
  const earlyC = progress(state, 'early-timeout', 0, 0.05, 0.3);
  const earlyD = progress(state, 'local-runs', 0, 0.48, 0.69);
  const slowC = progress(state, 'late-timeout', 1, 0.15, 0.54);
  const cursor = slow
    ? primaryEnd * slowC
    : beat >= 3
      ? primaryEnd
      : primaryEnd * earlyC + (run.elapsed - primaryEnd) * earlyD;
  const earlyDone = after(state, 'early-finish', 0, 0.84);
  const skip = after(state, 'skip-local', 2, 0.14);
  const denied = after(state, 'decline-spend', 4, 0.28);
  const complete = slow ? skip : beat >= 3 ? denied : earlyDone;
  const completedSpans = run.spans.filter((span) => span.end <= cursor);
  const activeSpan = complete
    ? null
    : run.spans.find((span, i) => {
        const started = i === 0 || (beat === 0 && earlyD > 0);
        return started && span.start <= cursor && cursor < span.end;
      });
  return {
    ...run,
    cursor,
    earlyC,
    earlyD,
    slowC,
    earlyDone,
    skip,
    denied,
    cap,
    complete,
    completedSpent: completedSpans.reduce((total, span) => total + span.charge, 0),
    currentOutcome: complete
      ? run.reason
      : activeSpan
        ? activeSpan.lane.id + ' attempt running'
        : 'Fallback reservation check pending',
  };
}
export function grantReplay(beat, beatP, cues) {
  const state = { beat, beatP, cues };
  const ledger = new GrantLedger(),
    first = ledger.execute(grantRequest, grantPermit);
  const consumed = after(state, 'consume-receipt', 1, 0.435);
  const replayed = after(state, 'replay-write', 1, 0.615);
  const replay = replayed ? ledger.execute(grantRequest, grantPermit) : null;
  return {
    request: grantRequest,
    first,
    replay,
    consumed,
    replayed,
    effects: ledger.effects,
    rowCount: ledger.rows.size,
    receipt: first.receipt,
    consumeProgress: progress(state, 'consume-receipt', 1, 0.39, 0.435),
    replayProgress: progress(state, 'replay-write', 1, 0.57, 0.615),
  };
}
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot,
    p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.1) / 0.62));
  if (id === 'filter' && step === 2) {
    const raw = state.beatP ?? 0,
      cue = state.cues?.['oversized-input'];
    const inputProgress = cueProgress(cue, Math.max(0, Math.min(1, (raw - 0.01) / 0.13))),
      checkProgress = cue ? inputProgress : raw;
    const context = 24000 + 46000 * inputProgress,
      contract = compile({
        ...facts,
        context,
      }),
      evidence = filterEvidence(step, checkProgress, context);
    return {
      step,
      p,
      contract,
      context,
      inputProgress,
      evidence,
      rows: evidence.rows,
      ordered: rank(contract),
    };
  }
  const contract = compile({
    ...facts,
    ...(id === 'contract' && step === 2
      ? {
          data: 'public',
          citations: false,
        }
      : {}),
    context: id === 'filter' && step === 2 ? 70000 : 24000,
  });
  if (id === 'deadline') {
    return {
      step,
      p,
      ...deadlinePlayback(step, state.beatP ?? 0, state.cues),
    };
  }
  if (id === 'rank') {
    const faster = progress(state, 'measure-local', 1, 0.08, 0.46);
    const registry = lanes.map((lane) =>
      lane.id === 'D'
        ? { ...lane, latency: Math.round(lane.latency + (700 - lane.latency) * faster) }
        : lane,
    );
    const preference = progress(state, 'prefer-time', 1, 0.55, 0.82) > 0 ? 'latency' : 'cost';
    return {
      step,
      p,
      contract,
      preference,
      byCost: rank(contract, 'cost', registry),
      ordered: rank(contract, preference, registry),
    };
  }
  if (id === 'publication') {
    const reply = {
      schema: policy.schema,
      answer: 'Send this case for review.',
      status: 'complete',
      citations: step === 2 ? ['E99'] : ['E1'],
      review: 'pending',
    };
    const evidenceIds = ['E1'];
    return {
      step,
      p,
      evidenceIds,
      ...publicationSnapshot(state),
      ...replyChecks(reply, evidenceIds),
      reply,
    };
  }
  if (id === 'breaker') {
    const breaker = new Breaker();
    const failuresSeen = Math.ceil(2 * progress(state, 'health-failures', 0, 0.12, 0.56));
    for (let i = 0; i < failuresSeen; i++) breaker.fail(i);
    const first = after(state, 'probe-lease', 1, 0.5) ? breaker.permit(11) : null;
    const second = after(state, 'deny-second', 2, 0.09) ? breaker.permit(11.1) : null;
    if (after(state, 'close-breaker', 2, 0.27)) breaker.success();
    let healthRoutes;
    if (step === 0 && progress(state, 'two-open', 0, 0.72, 0.92) > 0) {
      const local = new Breaker();
      local.fail(0);
      local.fail(1);
      const targets = { C: breaker, D: local, E: new Breaker() };
      healthRoutes = rank(contract).map((lane) => ({
        lane: lane.id,
        allowed: targets[lane.id].permit(6),
      }));
    }
    return { step, p, failuresSeen, first, second, healthRoutes, ...breaker };
  }
  if (id === 'synthesis') {
    const runs = [execute(940, 10000, 24000, null), execute(), execute(940, 10000, 70000)];
    return {
      step,
      p,
      runs,
      grant: grantReplay(step, state.beatP ?? 0, state.cues),
    };
  }
  if (id === 'transfer') {
    const changed = after(state, 'transfer-change', 2, 0.45);
    const primary = changed ? 1400 : 1399;
    const run = execute(primary);
    const endpoint = primary + lanes.find((lane) => lane.id === 'D').latency;
    const reveal = changed
      ? after(state, 'second-sum', 3, 0.32)
      : after(state, 'first-sum', 1, 0.36);
    const settled = changed
      ? after(state, 'second-dispatch', 3, 0.55)
      : after(state, 'first-dispatch', 1, 0.62);
    return {
      step,
      p,
      primary,
      changed,
      endpoint,
      reveal,
      settled,
      admitted: run.served?.id === 'D',
      run,
    };
  }
  return {
    step,
    p,
    contract,
    rows: lanes.map((lane) => ({
      ...lane,
      failures: violations(lane, contract),
    })),
    ordered: rank(contract),
  };
}
