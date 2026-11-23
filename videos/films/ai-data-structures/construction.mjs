import { UPDATED_MESSAGES } from './fixtures.mjs';
import { clamp, search, smooth } from './arithmetic.mjs';
export function q(state, id, beat = 0, start = 0.15, end = 0.78) {
  const cue = state.cues?.[id];
  return cue
    ? smooth(cue.progress)
    : state.beat < beat
      ? 0
      : state.beat > beat
        ? 1
        : smooth((state.beatP - start) / (end - start));
}
export function indexBuildState(state) {
  const p = [
      q(state, 'index-first-charged', 0, 0.18, 0.46),
      q(state, 'index-first-twice', 0, 0.52, 0.78),
      q(state, 'index-second', 1),
      q(state, 'index-third', 2),
    ],
    charged = [],
    twice = [];
  if (p[0] >= 0.98) charged.push(0);
  if (p[1] >= 0.98) twice.push(0);
  if (clamp(p[2] * 2) >= 0.98) charged.push(2);
  if (clamp((p[2] - 0.5) * 2) >= 0.98) twice.push(2);
  if (p[3] >= 0.98) charged.push(3);
  return {
    progress: p,
    charged,
    twice,
  };
}
export function scoreState(state) {
  const first = q(state, 'score-charged', 0),
    second = q(state, 'score-twice', 1),
    counts = [0, 0, 0, 0],
    visited = [];
  for (const [ids, p, term] of [
    [[0, 2, 3], first, 'charged'],
    [[0, 2], second, 'twice'],
  ])
    for (const [i, id] of ids.entries())
      if (p >= (i + 1) / ids.length - 1e-8) {
        counts[id]++;
        visited.push({
          term,
          id,
        });
      }
  return {
    counts,
    visited,
    first,
    second,
  };
}
export function treeWalkState(p) {
  const branch = clamp(p / 0.22),
    walk = clamp((p - 0.22) / 0.78) * 3;
  return {
    branch,
    visited: [0, 2, 3].slice(0, Math.floor(walk + 1e-8)),
    active: walk < 3 ? [0, 2, 3][Math.floor(walk)] : null,
    arrival: walk < 3 ? walk % 1 : 1,
  };
}
export function graphWalkState(state) {
  const discover = q(state, 'graph-discover', 0),
    duplicate = q(state, 'graph-duplicate', 1),
    cycle = q(state, 'graph-cycle', 1, 0.55, 0.8),
    claim = clamp(discover / 0.18),
    enqueue2 = clamp((discover - 0.18) / 0.42),
    enqueue3 = clamp((discover - 0.62) / 0.38);
  return {
    discover,
    duplicate,
    cycle,
    claim,
    enqueue2,
    enqueue3,
    discovered: [0, ...(enqueue2 > 0 ? [2] : []), ...(enqueue3 > 0 ? [3] : [])],
    pending: [
      ...(enqueue2 >= 1 && duplicate < 0.45 ? [2] : []),
      ...(enqueue3 >= 1 && cycle < 0.45 ? [3] : []),
    ],
  };
}
export function freshnessState(state) {
  const edit = q(state, 'freshness-edit', 0, 0.01, 0.1),
    postings = q(state, 'freshness-postings', 0, 0.51, 0.66),
    publish = q(state, 'freshness-publish', 1),
    miss = q(state, 'freshness-miss', 1, 0.65, 0.88),
    recompute = q(state, 'freshness-recompute', 2, 0, 0.28),
    store = q(state, 'freshness-store', 2, 0.4, 0.72),
    published = publish >= 0.98,
    newResult = recompute === 1 ? search(UPDATED_MESSAGES) : null;
  return {
    edit,
    postings,
    publish,
    miss,
    recompute,
    store,
    published,
    version: published ? 8 : 7,
    charged: postings >= 0.98 ? [0, 3] : [0, 2, 3],
    twice: postings >= 0.98 ? [0] : [0, 2],
    oldEntry: [0, 2],
    newResult,
    cache8: store === 1 ? newResult : null,
  };
}
export function appendWorksheetState(beat, progress) {
  const u = clamp(progress),
    total = beat === 0 ? u * 6 : 6 + u,
    completed = Math.min(7, Math.floor(total + 1e-9)),
    step = beat === 0 && u === 1 ? 5 : Math.min(6, Math.floor(total)),
    fraction = total - step,
    resize = step === 3 || step === 6,
    capacity = step < 3 ? 3 : step < 6 ? 6 : 12,
    copies =
      (step === 6 ? 3 : 0) +
      (resize ? Math.min(step, Math.floor(clamp(fraction / 0.8) * step)) : step >= 4 ? 3 : 0);
  return {
    completed,
    step,
    fraction,
    resize,
    capacity,
    copies: completed === 7 ? 9 : copies,
    writes: completed,
  };
}
