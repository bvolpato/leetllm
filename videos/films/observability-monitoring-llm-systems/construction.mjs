import { EVENTS, RATE, fields, receipts, tracks } from './fixtures.mjs';
import {
  alert,
  clamp,
  estimate,
  exportRecord,
  guardedDispatch,
  joinReviews,
  motion,
  repeatCount,
  sum,
  summarize,
  unsafeServeBounds,
} from './arithmetic.mjs';
export function observationCue(state, scene, beat, sentence) {
  if (state.beat > beat) return 1;
  if (state.beat < beat) return 0;
  const cue = state.cues?.[`ob-${scene}-${beat + 1}-${sentence}`];
  return cue ? (cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : clamp(cue.progress)) : 0;
}
export function freshAdmissionConstruction(state) {
  const p = (b, n) => observationCue(state, 'fresh-window', b, n),
    done = (b, n) => p(b, n) === 1;
  const deadline = done(2, 1) ? 16 : 12,
    next = done(2, 3) ? 0.03 : 0.05;
  let effects = 0;
  const result = guardedDispatch(['L', 'L', 'M', 'M'], 12, deadline, () => ++effects, {
    spent: 0.06,
    next,
    limit: 0.1,
  });
  const cue = state.cues?.['ob-fresh-window-3-5'],
    dispatchProgress =
      state.beat > 2 ? 1 : cue?.phase === 'after' ? clamp((state.t - cue.end) / 0.4) : 0;
  return {
    deadline,
    next,
    reserved: 0.06 + next,
    repeats: 2,
    result,
    effects: dispatchProgress === 1 ? effects : 0,
    dispatchProgress,
    showRepeat: done(1, 1),
    showTime: done(1, 2),
    showSpend: done(1, 3),
    showRepairedTime: done(2, 2),
    showRepairedSpend: done(2, 4),
    showDispatch: done(2, 5),
  };
}
export function boundConstruction(state) {
  const changed = state.beat >= 2 && observationCue(state, 'unknown-bounds', 2, 1) > 0;
  const events = [
    {
      id: 'R1',
      served: true,
      unsafe: true,
    },
    {
      id: 'R2',
      served: true,
      unsafe: false,
    },
    {
      id: 'R3',
      served: false,
      unsafe: false,
    },
    {
      id: 'R4',
      served: true,
      unsafe: null,
    },
    {
      id: 'R5',
      served: true,
      unsafe: null,
    },
    {
      id: 'R6',
      served: false,
      unsafe: null,
    },
    {
      id: 'R7',
      served: false,
      unsafe: null,
    },
  ];
  if (changed) events.pop();
  return {
    ...unsafeServeBounds(events, 7),
    events,
    changed,
  };
}
export function exportSelection(record, progress, registryProgress = 1) {
  const allowedEntries = Object.entries(exportRecord(record)),
    p = clamp(progress);
  const completed = Math.min(allowedEntries.length, Math.floor(p * allowedEntries.length + 1e-9));
  const selectedEntries = allowedEntries.slice(0, completed),
    registryReady = clamp(registryProgress) === 1;
  return {
    allowedEntries,
    selectedEntries,
    registryReady,
    exportedEntries: registryReady ? selectedEntries : [],
    rows: allowedEntries.map(([key, value], index) => ({
      key,
      value,
      progress: clamp(p * allowedEntries.length - index),
    })),
    blockedEntries: Object.entries(record).filter(([key]) => !fields.includes(key)),
  };
}
export function denominatorConstruction(beat, p) {
  const seconds = p * (beat ? 27.29 : 23.714),
    removed = beat ? Math.min(3, Math.floor(clamp((seconds - 1.4) / (4.2 - 1.4)) * 3 + 1e-9)) : 0;
  const removedIds = ['202', '203', '204'].slice(0, removed),
    selected = receipts.filter((row) => !removedIds.includes(row.id)),
    rows = joinReviews(EVENTS, selected);
  return {
    rows,
    removedIds,
    ...summarize(rows),
    ...unsafeServeBounds(rows, 6),
  };
}
export function costConstruction(beat, p) {
  const seconds = p * (beat ? 23.306 : 20.618),
    event = {
      ...EVENTS[5],
      cached: beat && seconds >= 6.4 ? 202 : 80,
    };
  let cost = null,
    error = null;
  try {
    cost = estimate(event);
  } catch (e) {
    error = e.message;
  }
  const allocated = beat ? 80 : Math.round(80 * clamp((seconds - 6.8) / (9.6 - 6.8))),
    uncached = event.input - allocated;
  const pricedTerms = beat
    ? 3
    : seconds >= 14.5
      ? 3
      : seconds >= 12.3
        ? 2
        : seconds >= 11.6
          ? 1
          : 0;
  const terms = [121 * RATE.uncached, 80 * RATE.cached, 30 * RATE.output],
    subtotal = terms.slice(0, pricedTerms).reduce((a, b) => a + b, 0) / 1e6;
  return {
    event,
    cost,
    error,
    uncached: event.input - event.cached,
    totalVisible: beat > 0 || seconds >= 4.7,
    cacheVisible: beat > 0 || seconds >= 6.8,
    allocated,
    unallocated: uncached,
    partitionReady: beat > 0 || seconds >= 9.6,
    pricedTerms,
    subtotal,
    costReady: beat > 0 || seconds >= 16.1,
  };
}
export function sampleModel(id, state) {
  const { beat } = tracks[id].sample(state).snapshot,
    q = motion(beat > state.beat ? 0 : state.beatP),
    base = {
      beat,
      q,
    };
  if (id === 'opening') {
    const count = beat === 0 ? Math.min(6, Math.floor(q * 6)) : 6;
    return {
      ...base,
      rows: EVENTS.slice(0, count),
      showReviews: beat > 0,
    };
  }
  if (id === 'join') {
    const received =
      beat === 0 ? Math.floor(q * 4) : state.beatP < 0.29 ? 4 : state.beatP < 0.38 ? 5 : 6;
    return {
      ...base,
      received,
      rows: joinReviews(EVENTS, receipts.slice(0, received)),
      ...summarize(joinReviews(EVENTS, receipts.slice(0, received))),
    };
  }
  if (id === 'denominators')
    return {
      ...base,
      ...denominatorConstruction(beat, state.beatP),
    };
  if (id === 'latency') {
    const progress = clamp((state.beatP - 0.04) / 0.36),
      time = beat === 0 ? 240 * progress : 240 + 215 * progress,
      arrivals = Array.from(
        {
          length: 30,
        },
        (_, i) => 240 + (i * 215) / 29,
      ).filter((t) => t <= time + 1e-9),
      last = arrivals.at(-1),
      post =
        arrivals.length > 1
          ? {
              tokens: arrivals.length - 1,
              ms: last - 240,
            }
          : null;
    return {
      ...base,
      time,
      arrivals,
      post,
      tps: post ? post.tokens / (post.ms / 1000) : null,
    };
  }
  if (id === 'trace')
    return {
      ...base,
      time: beat === 0 ? 90 * q : 90 + 340 * q,
    };
  if (id === 'cost')
    return {
      ...base,
      ...costConstruction(beat, state.beatP),
    };
  if (id === 'privacy') {
    const record = {
      request: '206',
      prompt: beat === 0 ? 'deploy-answerer-v1.1' : 'Private operator message',
      evidence: 'deploy-policy@17',
      route: 'serve',
      input: 201,
      output: 30,
      rawMessage: 'Is this approved?',
      rawAnswer: 'Approval invented.',
    };
    let exported = null,
      error = null;
    try {
      exported = exportRecord(record);
    } catch (e) {
      error = e.message;
    }
    return {
      ...base,
      record,
      exported,
      error,
    };
  }
  if (id === 'sampling') {
    const broken = beat === 0 && state.beatP >= 0.72,
      rows = broken
        ? EVENTS.map((e, i) =>
            i === 5
              ? {
                  ...e,
                  ttft: NaN,
                }
              : e,
          )
        : EVENTS,
      retained = rows.filter((e) => ['201', '205', '206'].includes(e.id));
    return {
      ...base,
      broken,
      rows,
      findings: alert(rows),
      full: summarize(rows),
      retained,
      stored: summarize(retained, 3),
      cost: sum(EVENTS.map(estimate)),
      p95: Math.max(...EVENTS.map((e) => e.ttft)),
    };
  }
  const cueProgress = (id) => {
    const cue = state.cues?.[id];
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : clamp(cue.progress)
      : null;
  };
  const changedProgress = cueProgress('changed-marker'),
    observationProgress = cueProgress('repeat-observations');
  const changed =
    beat > 0 || (changedProgress === null ? state.beatP >= 0.75 : changedProgress > 0);
  const n = changed
    ? 3
    : observationProgress === null
      ? Math.min(3, Math.floor(clamp((state.beatP - 0.04) / 0.36) * 3))
      : Math.min(3, Math.ceil(3 * observationProgress));
  const observations = Array.from(
      {
        length: n,
      },
      (_, i) => ['lookup_status', 'operation-42', changed && i === 2 ? 'scan:18' : 'scan:17'],
    ),
    repeats = repeatCount(observations);
  let callbackExecutions = 0;
  const budget = {
      spent: 0.006,
      next: 0.003,
      limit: 0.01,
    },
    dispatch = guardedDispatch(
      observations,
      observations.length,
      5,
      () => ++callbackExecutions,
      budget,
    );
  return {
    ...base,
    changed,
    observations,
    repeats,
    budget,
    elapsed: observations.length,
    deadline: 5,
    dispatch,
    callbackExecutions,
    stopped: !dispatch.executed,
  };
}
