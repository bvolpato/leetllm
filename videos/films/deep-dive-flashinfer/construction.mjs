import { clip, merge, mergeReference, mix, part, phase, prefix } from './arithmetic.mjs';
import { EXTRA_IDS, ids, requests } from './fixtures.mjs';
import { address, readSlot } from './model.mjs';
import { clauseEnded } from './cache-picture.mjs';
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
export function pageLookupFrame(position, beat, progress) {
  const stage = beat === 1 ? Math.min(3, 1 + Math.floor(progress * 3)) : 3;
  return {
    stage,
    entry: Math.floor(position / 4),
    slot: position % 4,
    page: address(position).page,
  };
}
export function mergeConstruction(beat, progress) {
  const received =
    beat === 0
      ? 0
      : beat > 1
        ? 6
        : Math.min(6, Math.floor(Math.max(0, (progress - 0.06) / 0.42) * 6));
  const a = Math.min(4, received),
    z = Math.max(0, received - 4);
  return {
    received,
    a,
    z,
    output: received ? [a / received, z / received] : null,
  };
}
export function flashCue(state, id, beat, fallback = [0.04, 0.94]) {
  if ((state.beat ?? 0) < beat) return 0;
  if ((state.beat ?? 0) > beat) return 1;
  const c = state.cues?.[id];
  return c
    ? c.phase === 'before'
      ? 0
      : c.phase === 'after'
        ? 1
        : clip(c.progress)
    : part(state.beatP ?? 0, ...fallback);
}
export function flashinferExtensionFrame(id, state) {
  const b = state.beat ?? 0,
    p = flashCue(state, 'fi-' + id + '-' + b, b),
    r = flashCue(state, 'fi-' + id + '-' + b + '-result', b, [0.8, 0.99]),
    at = (name, beat = b) => flashCue(state, 'fi-' + id + '-' + name, beat, [0.65, 0.9]),
    s = {
      id,
      b,
      p,
      r,
      done: r === 1,
    };
  if (id === 'causal-rule') {
    const transfer = b >= 3;
    const keys = transfer ? 7 : 9;
    const queries = transfer ? 3 : 4;
    let row = transfer ? 1 : 0;
    if (b === 1) {
      row = ['rule-seven', 'rule-eight', 'rule-nine'].filter((cue, i) =>
        clauseEnded(state, cue, 1, [0.46, 0.58, 0.68][i]),
      ).length;
    }
    const position = keys - queries + row;
    let mode = 'correct';
    if (b === 2) {
      const named = state.cues?.['rule-open'];
      if (named) {
        if (state.cues['rule-restore']?.phase === 'after') mode = 'repaired';
        else if (named.phase !== 'before') mode = 'unmasked';
        else if (state.cues['rule-top']?.phase !== 'before') mode = 'top-left';
      } else {
        mode = p < 0.35 ? 'top-left' : p < 0.65 ? 'unmasked' : 'repaired';
      }
    }
    const maskBoundary = mode === 'top-left' ? row : mode === 'unmasked' ? keys - 1 : position;
    return { ...s, keys, queries, row, mode, position, maskBoundary, visible: maskBoundary + 1 };
  }
  if (id === 'page-permutation') {
    const sorted = b === 0 ? at('sort', 0) === 1 : b === 1 ? at('repair', 1) !== 1 : false,
      pages = sorted ? [3, 6, 14] : [3, 14, 6];
    return {
      ...s,
      pages,
      sorted,
      page: pages[1],
      slot: 1,
      invalidTail: sorted,
      diagnosis: b > 0 || at('wrongpage', 0) === 1,
    };
  }
  if (id === 'merge-recurrence')
    return {
      ...s,
      relative: [1, 0.5],
      shares: [2 / 3, 1 / 3],
      parent: Math.log2(6),
      ready: b > 2 || (b === 2 && at('parent', 2) === 1),
    };
  if (id === 'merge-units') {
    const factor = b === 0 ? (p < 0.35 ? 0 : p < 0.72 ? 1 : 2) : 1,
      bs = [Math.log(4), Math.log(2)].map((x) => x / Math.LN2 ** factor),
      m = merge([1, 0], bs[0], [0, 1], bs[1]);
    return {
      ...s,
      factor,
      bs,
      merged: m,
    };
  }
  if (id === 'merge-domain')
    return {
      ...s,
      result: mergeReference([1e308], 0, [1e308], 0),
      halfReady: b === 2 && at('half', 2) === 1,
    };
  if (id === 'merge-partition') {
    const duplicate = b === 0 && at('duplicate', 0) === 1;
    return {
      ...s,
      duplicate,
      keys: duplicate ? ['k0', 'k1', 'k0'] : ['k0', 'k1'],
      mass: duplicate ? 3 : 2,
      numerator: duplicate ? [2, 1] : [1, 1],
      output: duplicate ? [2 / 3, 1 / 3] : [0.5, 0.5],
    };
  }
  if (id === 'offset-migration') {
    const tokens = prefix(requests.map((r) => r.q));
    const qStride = 32 * 192,
      oStride = 32 * 128;
    return {
      ...s,
      tokens,
      qStride,
      oStride,
      q: tokens.map((x) => x * qStride),
      o: tokens.map((x) => x * oStride),
      qReady: clauseEnded(state, 'fi-offset-migration-qoffset', 0, 0.7),
      oReady: clauseEnded(state, 'fi-offset-migration-ooffset', 1, 0.3),
    };
  }
  if (id === 'split-schedule')
    return {
      ...s,
      lanes: b >= 1 ? 2 : 4,
      chunks: [4, 4, 4, 4],
      finish: b >= 1 ? 9 : 5,
      speed: 16 / (b >= 1 ? 9 : 5),
      resultReady: b > 1 || (b === 0 && at('four', 0) === 1) || (b === 1 && at('two', 1) === 1),
      speedReady: b === 0 && at('speed', 0) === 1,
    };
  if (id === 'integration-lease') {
    const writtenEarly = clauseEnded(state, 'lease-early-write', 0, 0.65);
    const writtenLate = clauseEnded(state, 'lease-late-write', 2, 0.74);
    const early = readSlot({
      writeBefore: writtenEarly,
      read: clauseEnded(state, 'lease-early-read', 1, 0.32),
      writeAfter: false,
    });
    const waiting = readSlot({
      writeBefore: false,
      read: clauseEnded(state, 'lease-late-read', 1, 0.58),
      writeAfter: writtenLate,
    });
    return {
      ...s,
      runs: [early, waiting],
      writtenEarly,
      writtenLate,
      completed: clauseEnded(state, 'lease-event', 2, 0.4),
    };
  }
  if (id === 'profile-boundary') {
    const original = [0.8, 0.2, 0.1, 1.6, 0.3];
    const repaired = original.map((ms, i) => (i === 3 ? ms / 2 : ms));
    return {
      ...s,
      original,
      repaired,
      total: original.reduce((sum, ms) => sum + ms, 0),
      next: repaired.reduce((sum, ms) => sum + ms, 0),
      repairProgress: flashCue(state, 'fi-profile-boundary-1', 1, [0, 0.23]),
      totalReady: clauseEnded(state, 'fi-profile-boundary-total', 0, 0.75),
      repairReady: clauseEnded(state, 'fi-profile-boundary-1-result', 1, 0.47),
      speedReady: clauseEnded(state, 'fi-profile-boundary-speed', 1, 0.76),
    };
  }
  if (id === 'fresh-tail') {
    const pages = [9, 2],
      pageSize = 8,
      oldTail = 7;
    const oldLength = (pages.length - 1) * pageSize + oldTail;
    const tail = oldTail + 1;
    return {
      ...s,
      pages,
      pageSize,
      tail,
      oldLength,
      newLength: oldLength + 1,
      oldPlan: oldLength,
      lengthReady: clauseEnded(state, 'fi-fresh-tail-length', 1, 0.15),
      planVerdictReady: clauseEnded(state, 'fi-fresh-tail-plan', 1, 0.55),
      leaseVerdictReady: clauseEnded(state, 'fi-fresh-tail-lease', 1, 0.78),
      refreshed: clauseEnded(state, 'fi-fresh-tail-refresh', 2, 0.22),
      complete: clauseEnded(state, 'fi-fresh-tail-complete', 2, 0.68),
      currentTick:
        b < 2 ? 12 : mix(12, 14, flashCue(state, 'fi-fresh-tail-complete', 2, [0.52, 0.68])),
    };
  }
  return s;
}
export function sampleModel(id, state) {
  if (EXTRA_IDS.has(id)) return flashinferExtensionFrame(id, state);
  const { b } = tracks[id].sample(state).snapshot,
    q = phase(b > state.beat ? 0 : state.beatP);
  const base = {
    b,
    q,
    queryOffsets: prefix(requests.map((r) => r.q)),
    pageOffsets: prefix(requests.map((r) => r.pages.length)),
  };
  if (id === 'intro' || id === 'pointers')
    return {
      ...base,
      focus: b,
      rows: requests.reduce((v, r) => v + r.q, 0),
      padded: requests.length * Math.max(...requests.map((r) => r.q)),
    };
  if (id === 'pages') {
    const position = b === 0 ? Math.floor(q * 4) : b === 1 ? 5 : 8;
    return {
      ...base,
      position,
      ...address(position),
      length: 4 * 2 + 1,
    };
  }
  if (id === 'causal') {
    const row = b === 0 ? 0 : b === 1 ? (q < 0.5 ? 1 : 2) : 3;
    return {
      ...base,
      row,
      mask: Array.from(
        {
          length: 4,
        },
        (_, i) =>
          Array.from(
            {
              length: 9,
            },
            (_, j) => j <= 5 + i,
          ),
      ),
    };
  }
  if (id === 'merge')
    return {
      ...base,
      correct: merge([1, 0], 2, [0, 1], 1),
      wrong: merge([1, 0], 2 * Math.LN2, [0, 1], Math.LN2),
      overlap: merge([0.5, 0.5], 1, [1, 0], 0),
    };
  if (id === 'planning') {
    const appended =
        b > 1 ||
        (b === 1 &&
          (state.cues?.['planning-append']
            ? state.cues['planning-append'].phase === 'after'
            : q >= 0.2)),
      refreshed = b === 2 && flashCue(state, 'planning-beat-3-focus-1', 2, [0.04, 0.3]) === 1,
      currentTail = appended ? 2 : 1,
      plannedTail = refreshed ? 2 : 1;
    return {
      ...base,
      pages: [3, 14, 6],
      appended,
      refreshed,
      currentTail,
      plannedTail,
      currentLength: 8 + currentTail,
      plannedLength: 8 + plannedTail,
      valid: currentTail === plannedTail,
    };
  }
  const chunks = [4, 4, 4, 4],
    mergeCost = 1,
    completionTick = 10,
    endTick = 12;
  const active = state.cues?.['synthesis-reader-active']?.progress ?? 0;
  const event = state.cues?.['synthesis-reader-event']?.progress ?? 0;
  const time =
    b === 0
      ? 0
      : b > 1
        ? endTick
        : state.cues
          ? event > 0
            ? 9 + 3 * event
            : 9 * active
          : q * endTick;
  return {
    ...base,
    serial: chunks.reduce((sum, cost) => sum + cost, 0),
    chunks,
    mergeCost,
    parallel: Math.max(...chunks) + mergeCost,
    time,
    completionTick,
    endTick,
    lease: time < completionTick,
    complete: time >= completionTick,
  };
}
