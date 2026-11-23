import {
  bf16,
  communicationBudget,
  deferredWaitTrace,
  destinationExpectation,
  phase,
  redundantGradient,
  sum,
} from './arithmetic.mjs';
import { chapterIds, finalToken, hidden, ids, routes } from './fixtures.mjs';
import {
  Deferred,
  alignedLayout,
  combine,
  expertReturnReceipt,
  ledger,
  resolveAlignedSlot,
  roundTripAligned,
  weightedExpertRow,
} from './model.mjs';
import assert from 'node:assert/strict';
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
export function dispatchExpansionSnapshot(p) {
  const delivered = p >= 0.23,
    expanded = delivered ? Math.min(2, Math.floor(Math.max(0, p - 0.28) / 0.12)) : 0;
  return {
    delivered,
    expanded,
    rows: delivered ? 1 : 0,
    expertRows: [2, 3].slice(0, expanded),
  };
}
export function combineTrace(beat, progress, cues) {
  const seconds = progress * [18.048, 17.112, 20.28][beat],
    q = cues?.['de-combine-reverse']?.progress ?? Math.max(0, Math.min(1, (seconds - 0.1) / 8.4)),
    data = ledger(),
    weightProgress =
      beat === 0 ? 0 : beat === 1 ? Math.max(0, Math.min(1, (seconds - 0.1) / 3.7)) : 1;
  const rows = data.slots.map((row) => {
    const applied =
      beat === 0
        ? 0
        : beat === 1
          ? (cues?.[row.topk === 0 ? 'de-combine-e0' : 'de-combine-e3']?.progress ??
            Math.max(
              0,
              Math.min(1, (seconds - (row.topk === 0 ? 0.1 : 2.5)) / (row.topk === 0 ? 2.1 : 1.3)),
            ))
          : 1;
    return {
      ...row,
      weightProgress: applied,
      value: row.raw.map((v) => v * (applied === 1 ? row.weight : 1 + (row.weight - 1) * applied)),
    };
  });
  if (beat === 2) rows.reverse();
  const count = beat === 2 ? Math.min(rows.length, Math.floor(q * (rows.length + 1))) : rows.length;
  const output = Object.fromEntries(Object.keys(hidden).map((id) => [id, [0, 0]]));
  for (const row of rows.slice(0, count))
    output[row.token] = output[row.token].map((v, i) => v + row.value[i]);
  return {
    q,
    seconds,
    rows,
    count,
    weightProgress,
    output,
  };
}
export function topologyTrace(state) {
  if (state.beat > 0)
    return {
      hybrid: true,
      directProgress: 1,
      railProgress: 1,
      localProgress: 1,
    };
  const cue = (id, fallback) => state.cues?.[id]?.progress ?? fallback;
  const p = state.beatP ?? 0,
    hybrid = state.cues
      ? Boolean(
          state.cues['topology-beat-1-focus-2'] &&
          state.cues['topology-beat-1-focus-2'].phase !== 'before',
        )
      : p >= 0.32;
  return {
    hybrid,
    directProgress: cue('topology-direct-domain', Math.min(1, p / 0.3)),
    railProgress: cue('topology-rail-hop', Math.max(0, Math.min(1, (p - 0.5) / 0.2))),
    localProgress: cue('topology-beat-1-focus-1', Math.max(0, Math.min(1, (p - 0.73) / 0.2))),
  };
}
export function sampleModel(id, state) {
  if (chapterIds.has(id)) return chapterModel(id, state);
  const { b } = tracks[id].sample(state).snapshot,
    q = phase(b > state.beat ? 0 : state.beatP),
    base = {
      b,
      q,
    };
  if (id === 'dispatch') {
    const choices = {
      ...routes,
      a:
        b === 0
          ? routes.a
          : b === 1
            ? [
                [2, 0.7],
                [3, 0.3],
              ]
            : [
                [2, 0.7],
                [-1, 0.3],
              ],
    };
    return {
      ...base,
      choices,
      ...ledger(choices),
    };
  }
  if (id === 'layout') {
    const layout = alignedLayout([3, 1], b === 0 ? 1 : 4),
      results = layout.records.map((record) => ({
        slot: record.slot,
        value: record.value,
      })),
      restored = roundTripAligned(layout, [...results].reverse());
    let attempt;
    try {
      attempt = {
        slot: 3,
        accepted: true,
        ...resolveAlignedSlot(layout, 3, 999),
      };
    } catch (error) {
      attempt = {
        slot: 3,
        accepted: false,
        error: error.message,
      };
    }
    return {
      ...base,
      ...layout,
      restored,
      attempt,
      rejectedPadding: !attempt.accepted,
    };
  }
  if (id === 'combine') {
    const data = ledger(),
      inverse = new Map(data.slots.map((row) => [row.key, row.token])),
      rows = data.slots.map((row) => ({
        key: row.key,
        value: row.raw.map((v) => v * (b === 0 ? 1 : row.weight)),
      }));
    if (b === 2) rows.reverse();
    return {
      ...base,
      rows,
      output: combine(rows, inverse),
      contributions: b === 0 ? [1, 4] : [0.7, 1.2],
      doubleWeighted: 0.7 ** 2 + 4 * 0.3 ** 2,
    };
  }
  if (id === 'rounding')
    return {
      ...base,
      rawSubtotal: 256 + 1,
      rounded: bf16(256 + 1),
      staged: bf16(bf16(256 + 1) - 256),
      single: bf16(256 + 1 - 256),
    };
  if (id === 'topology') {
    const logical = b === 2 ? 100 * 2 ** 20 : 0,
      remote = logical / 2;
    return {
      ...base,
      ...topologyTrace(state),
      logical,
      remote,
      logicalRate: logical / 0.001 / 1e9,
      remoteRate: remote / 0.001 / 1e9,
    };
  }
  if (id === 'precision') {
    const width = 7168,
      bf = width * 2,
      scaleGroups = width / 128,
      scaleBytes = scaleGroups * 4,
      fp8 = width + scaleBytes;
    return {
      ...base,
      width,
      bf,
      scaleGroups,
      scaleBytes,
      fp8,
      ratio: bf / fp8,
      current: b === 0 ? bf : fp8,
    };
  }
  if (id === 'events') {
    const event = new Deferred(['rows', 'indices', 'gates', 'handle']),
      first = b > 0 ? event.wait() : null,
      second = b === 2 ? event.wait() : undefined,
      time = b === 0 ? 0 : b === 1 ? 6 * q : 6;
    return {
      ...base,
      first,
      second,
      waitCalls: event.calls,
      time,
      deviceReady: time >= 4,
      consumerDone: time >= 6,
    };
  }
  if (id === 'resources') {
    const pairs = [];
    for (let i = 0; i < 4; i++)
      for (let j = i + 1; j < 4; j++)
        pairs.push({
          experts: [i, j],
          destinations: new Set([Math.floor(i / 2), Math.floor(j / 2)]).size,
        });
    const sms = 12,
      allocated = 128,
      directRequested = Math.min(sms, 9),
      hybridRequested = sms * 16 + 1;
    return {
      ...base,
      pairs,
      expected: sum(pairs.map((v) => v.destinations)) / pairs.length,
      sms,
      allocated,
      directRequested,
      hybridRequested,
      direct: Math.min(directRequested, allocated),
      hybrid: Math.min(hybridRequested, allocated),
    };
  }
  return base;
}
export const completed = (state, id, fallback = false) =>
  state.cues ? (state.cues[id]?.progress ?? 0) >= 1 : fallback;
export function freshDeepEPState(state) {
  const b = state.beat ?? 0,
    rebuild = b > 1 || (b === 1 && completed(state, 'de-fresh-route', false)),
    choices = rebuild ? finalToken.current : finalToken.cached,
    gates = finalToken.gates,
    row = weightedExpertRow(finalToken.input, choices, gates);
  return {
    b,
    choices,
    gates,
    raw: row.raw,
    contributions: row.contributions,
    output: row.output,
    rebuild,
    firstVisible: b > 1 || (b === 1 && completed(state, 'de-fresh-first', false)),
    secondVisible: b > 1 || (b === 1 && completed(state, 'de-fresh-second', false)),
    outputVisible: b > 1 || (b === 1 && completed(state, 'de-fresh-result', false)),
    staleVisible: b > 2 || (b === 2 && completed(state, 'de-stale-result', false)),
    returnReceipt: expertReturnReceipt(finalToken.input, choices, gates),
    returnVisible: b > 2 || (b === 2 && completed(state, 'de-fresh-inverse', false)),
    waitPresent:
      b < 3 ||
      (b === 3 && !completed(state, 'de-fresh-remove-wait', false)) ||
      (b === 4 && completed(state, 'de-fresh-wait', false)),
    dependencyVerdict: b === 4 && completed(state, 'de-fresh-wait', false),
  };
}
export function chapterModel(id, state) {
  assert(chapterIds.has(id), 'Unimplemented DeepEP chapter');
  const b = state.beat ?? 0,
    p = Math.max(0, Math.min(1, state.beatP ?? 0)),
    base = {
      b,
      p,
    };
  if (id === 'layout-boundaries')
    return {
      ...base,
      layout: alignedLayout([3, 1], 4),
    };
  if (id === 'backward-operators') {
    const a = weightedExpertRow([1, 0], [0, 3], [0.7, 0.3]),
      upstream = [2, 1];
    return {
      ...base,
      D: ledger().slots.map((r) => Object.keys(hidden).map((t) => (t === r.token ? 1 : 0))),
      inputGradient: upstream.map((x) => x * (0.7 + 4 * 0.3)),
      gateGradient: a.raw.map((v) => sum(v.map((x, i) => x * upstream[i]))),
    };
  }
  if (id === 'logical-receipts')
    return {
      ...base,
      local: 50 * 2 ** 20,
      remote: 50 * 2 ** 20,
      logical: 100 * 2 ** 20,
      seconds: 0.001,
      logicalRate: (100 * 2 ** 20) / 0.001 / 1e9,
      remoteRate: (50 * 2 ** 20) / 0.001 / 1e9,
    };
  if (id === 'scale-contract')
    return {
      ...base,
      groups: 56,
      scaleBytes: 224,
      fp8: 7392,
      bf16: 14336,
      wrongDecoded: 10 * 2,
      correctDecoded: 10 * 0.5,
    };
  if (id === 'buffer-capacity')
    return {
      ...base,
      capacity: 12,
      first: 8,
      second: 5,
      concurrent: 13,
      excess: 1,
    };
  if (id === 'deferred-contract')
    return {
      ...base,
      ...deferredWaitTrace(b ? 2 : 1),
    };
  if (id === 'redundant-experts')
    return {
      ...base,
      owners: [0, 2],
      participants: [0, 1, 2, 3],
      original: [2, 4],
      extra: [1, 3],
      result: redundantGradient([2, 4], [1, 3], [0, 1, 2, 3], [0, 1, 2, 3]),
    };
  if (id === 'balanced-assumptions')
    return {
      ...base,
      pairs: [
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 2],
        [1, 3],
        [2, 3],
      ].map((pair) => ({
        pair,
        destinations: new Set(pair.map((x) => Math.floor(x / 2))).size,
      })),
      expected: destinationExpectation(4, 2, 2),
    };
  if (id === 'resource-budget')
    return {
      ...base,
      ...communicationBudget(15.2, {
        preferOverlap: b === 0 && completed(state, 'de-sm-floor', false) ? false : true,
      }),
      serialA: [1, 4, 1],
      serialB: [0.7, 4.5, 0.8],
    };
  if (id === 'earned-return')
    return {
      ...base,
      ...freshDeepEPState(state),
    };
  return base;
}
