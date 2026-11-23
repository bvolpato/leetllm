import { phase, reuse, vvClamp } from './arithmetic.mjs';
import { ids, r1, sharedPrefix } from './fixtures.mjs';
import { references, schedule } from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  ids.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-initial`,
        snapshot: {
          b: 0,
        },
      },
      cues: [0, 1, 2].map((b) => ({
        id: `${id}-${b}`,
        beat: b,
        at: 0,
        snapshot: {
          b,
        },
      })),
    }),
  ]),
);
export function budgetTrace(beat, progress, cues) {
  const row = schedule()[beat];
  const state = { beat, beatP: progress, cues };
  const at = (names) => vvProgress(state, 'budget-' + names[beat], beat);
  const reserved = at(['active-decode', 'reserve-again', 'both-decode']) > 0;
  const placed = at(['first-prompt-slice', 'prompt-tail', 'both-decode']);
  const promptInputs = Math.ceil(row.r1Prefill * placed);
  const decodeInputs = Math.ceil(row.r1Decode * placed);
  const assigned = Number(reserved) + promptInputs + decodeInputs;
  const returned = at(['first-return', 'first-output', 'next-output']) === 1;
  const prior = r1.length - row.left - row.r1Prefill;
  const prefillCompleted = returned ? promptInputs : 0;
  return {
    ...row,
    reserved,
    promptInputs,
    decodeInputs,
    assigned,
    returned,
    completed: returned ? assigned : 0,
    prior,
    prefillCompleted,
    consumed: prior + prefillCompleted,
    left: r1.length - prior - prefillCompleted,
  };
}
export function lifetimeTrace(beat, progress, cues) {
  const seconds = progress * [17.496, 18.124, 19.152][beat],
    q = progress;
  const done = (id, fallback) => (cues?.[id] ? cues[id].phase === 'after' : fallback);
  const retired = beat > 1 || (beat === 1 && done('lifetime-retire-r0', seconds >= 2.6)),
    popped = beat === 2 && done('lifetime-pop', seconds >= 3),
    cleared = popped && done('lifetime-remove-old-hash', seconds >= 4.5),
    assigned = cleared && done('lifetime-assign-live-reference', seconds >= 8.5);
  const tables = {
    ...(retired
      ? {}
      : {
          R0: [12, 41],
        }),
    R1: [12, 73, 90],
    ...(assigned
      ? {
          R2: [41],
        }
      : {}),
  };
  return {
    q,
    retired,
    cleared,
    assigned,
    tables,
    refs: references(tables),
    free: retired && !popped,
    oldHash: !cleared,
  };
}
export function goodputReceiptState(beat, cues) {
  const begun = (id) => !cues?.[id] || cues[id].phase !== 'before',
    window = 100;
  const rows = [
    {
      id: 'A',
      offered: 1000,
      complete: 600,
      passed: 550,
    },
    {
      id: 'B',
      offered: 800,
      complete: 780,
      passed: 752,
    },
  ].map((row) => ({
    ...row,
    unfinishedOrFailed: row.offered - row.complete,
    outsideLimits: row.complete - row.passed,
    goodput: row.passed / window,
    wrong: ((row.offered / window) * row.passed) / row.complete,
  }));
  return {
    window,
    rows,
    offeredReady: true,
    completeReady: beat > 0 || begun('goodput-successful-receipts'),
    passedReady: beat > 0 || begun('goodput-compliant-receipts'),
    rateReady: beat > 1 || (beat === 1 && begun('goodput-divide-window')),
    wrongReady: beat === 2 && begun('goodput-beat-3-focus-1'),
  };
}
export function sampleModel(id, state) {
  if (VV_NEW.has(id)) return vvState(id, state);
  const { b } = tracks[id].sample(state).snapshot,
    q = phase(b > state.beat ? 0 : state.beatP),
    base = {
      b,
      q,
    };
  if (id === 'intro')
    return {
      ...base,
      path: ['API front end', 'Engine core', 'GPU workers'],
      r0Work: 1,
      r1Work: 9,
    };
  if (id === 'blocks') {
    const position = b === 0 ? 0 : b === 1 ? 4 : 6;
    return {
      ...base,
      position,
      logical: Math.floor(position / 4),
      offset: position % 4,
      physical: [12, 41][Math.floor(position / 4)],
    };
  }
  if (id === 'prefix') {
    const change = state.cues?.['prefix-config-change'],
      adapter = b === 2 && (change ? change.phase !== 'before' : q >= 0.35) ? 'B' : 'A',
      compatible = adapter === 'A',
      reused = compatible ? reuse(sharedPrefix, r1.length) : 0;
    return {
      ...base,
      shared: sharedPrefix,
      reused,
      compute: r1.length - reused,
      adapter,
      compatible,
      tables: {
        R0: [12, 41],
        R1: compatible ? [12, 73, 90] : [101, 102, 103],
      },
    };
  }
  if (id === 'budget')
    return {
      ...base,
      ...schedule()[b],
    };
  if (id === 'lifetime') {
    const tables =
      b === 0
        ? {
            R0: [12, 41],
            R1: [12, 73, 90],
          }
        : b === 1
          ? {
              R1: [12, 73, 90],
            }
          : {
              R1: [12, 73, 90],
              R2: [41],
            };
    return {
      ...base,
      tables,
      refs: references(tables),
      free: b === 1 ? [41] : [],
      oldHash: b < 2,
    };
  }
  if (id === 'admission') {
    const remainingTokens = 4,
      requestedTokens = b === 2 ? 5 : 2,
      freeBlocks = b === 0 ? 0 : 1,
      requiredBlocks = 1;
    return {
      ...base,
      remainingTokens,
      requestedTokens,
      freeBlocks,
      requiredBlocks,
      tokenFits: requestedTokens <= remainingTokens,
      memoryFits: freeBlocks >= requiredBlocks,
      admitted: requestedTokens <= remainingTokens && freeBlocks >= requiredBlocks,
    };
  }
  if (id === 'goodput')
    return {
      ...base,
      ...goodputReceiptState(b, state.cues),
    };
  return {
    ...base,
    events: [
      {
        id: 'Input',
        duration: 20,
      },
      {
        id: 'Queue',
        duration: 80,
      },
      {
        id: 'Prefill',
        duration: 40,
      },
      {
        id: 'Deliver',
        duration: 10,
      },
    ],
    total: 150,
    request: 'R1',
    assigned: 5,
    blocks: [12, 73, 90],
  };
}
export const VV_NEW = new Set([
  'entry-contract',
  'fragmentation',
  'historical-evidence',
  'process-owners',
  'prefix-limit',
  'hash-context',
  'pool-structures',
  'chunk-clock',
  'running-preemption',
  'queue-order',
  'runner-contract',
  'parallel-costs',
  'runner-versions',
  'goodput-denominator',
  'event-metrics',
  'route-security',
  'media-limits',
  'tenant-cache',
  'source-diagnosis',
  'project-identity',
  'fresh-admission',
]);
export function vvProgress(s, id, b) {
  if (s.beat < b) return 0;
  if (s.beat > b) return 1;
  const q = s.cues?.[id];
  return q
    ? q.phase === 'before'
      ? 0
      : q.phase === 'after'
        ? 1
        : vvClamp(q.progress)
    : vvClamp(((s.beatP ?? 0) - 0.05) / 0.9);
}
export function vvState(id, s) {
  const b = s.beat ?? 0,
    P = (name, beat = b) => vvProgress(s, 'vv-' + id + '-' + name, beat),
    D = (name, beat = b) => P(name, beat) === 1,
    p = P('op-' + b),
    z = {
      b,
      p,
    };
  if (id === 'prefix-limit') {
    const apc = b === 1 && P('apc-input', 1) > 0,
      stage = b === 2 ? 3 : apc ? 0 : P('match-eight', 1) > 0 ? 2 : P('match-seven', 1) > 0 ? 1 : 0,
      length = b === 2 ? 8 : 9,
      shared = b === 2 ? 8 : stage === 0 ? 6 : stage === 1 ? 7 : 8,
      ready =
        b === 0
          ? false
          : b === 1
            ? D(
                apc
                  ? 'apc-step'
                  : stage === 0
                    ? 'match-six'
                    : stage === 1
                      ? 'match-seven'
                      : 'match-eight',
                1,
              )
            : D('prompt-eight', 2);
    return {
      ...z,
      apc,
      stage,
      length,
      shared,
      skipped: reuse(shared, length),
      compute: length - reuse(shared, length),
      ready,
    };
  }
  if (id === 'pool-structures') {
    const touch = b === 2 && D('touch-nine', 2),
      allocate = b === 2 && D('allocate-head', 2);
    return {
      ...z,
      touch,
      allocate,
      queue: allocate ? [55] : touch ? [71, 55] : [71, 55, 9],
      refs: {
        71: Number(allocate),
        55: 0,
        9: Number(touch),
      },
      old71Hash: !allocate,
    };
  }
  if (id === 'chunk-clock')
    return {
      ...z,
      schedule: schedule(),
      firstReady: D('cost-eight', 1),
      secondReady: D('cost-seven', 1),
      largerReady: D('cap-ten', 2),
      durations: b === 2 ? [12] : [8, 7],
    };
  if (id === 'process-owners') {
    const multi = b === 1 && P('parallel-seventeen', 1) > 0;
    return {
      ...z,
      multi,
      A: multi ? 4 : 1,
      D: multi ? 4 : 1,
      N: multi ? 8 : 4,
      total: multi ? 17 : 6,
      ready: b === 1 && (multi ? D('parallel-seventeen', 1) : D('single-six', 1)),
    };
  }
  if (id === 'fresh-admission') {
    const restored = P('restore-adapter', 2) > 0,
      counts = D('hit-counts', 3),
      admitted = D('hit-admitted', 3);
    const skipped = restored ? reuse(10, 13) : 0;
    const compute = 13 - skipped;
    return {
      ...z,
      restored,
      counts,
      admitted,
      miss: !restored && D('miss', 1),
      wait: !restored && D('memory-wait', 1),
      skipped,
      compute,
      blocks: Math.ceil(compute / 4),
      used: compute + 1,
      latencyReady: D('latency-total', 5),
    };
  }
  return z;
}
