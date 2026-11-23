import {
  PERMITTED_NOTE_IDS,
  FRESH_QUERY,
  LINKS,
  MESSAGES,
  QUERY,
  UPDATED_MESSAGES,
} from './fixtures.mjs';
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const smooth = (x) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const terms = (s) => [...new Set(s.toLowerCase().match(/[a-z]+/g) ?? [])];
export function buildIndex(rows = MESSAGES) {
  const index = new Map();
  for (const r of rows)
    for (const term of terms(r.text)) {
      if (!index.has(term)) index.set(term, new Set());
      index.get(term).add(r.id);
    }
  return index;
}
export function scoreRows(rows = MESSAGES, query = QUERY) {
  const queryTerms = terms(query);
  return rows.map((r) => ({
    id: r.id,
    score: queryTerms.filter((t) => terms(r.text).includes(t)).length,
  }));
}
export function indexedScores(index, query = QUERY) {
  const scores = new Map();
  for (const term of terms(query))
    for (const id of index.get(term) ?? []) scores.set(id, (scores.get(id) ?? 0) + 1);
  return [...scores].map(([id, score]) => ({
    id,
    score,
  }));
}
export const rank = (rows) =>
  [...rows].filter((r) => r.score > 0).sort((a, b) => b.score - a.score || a.id - b.id);
export const search = (rows = MESSAGES, query = QUERY, k = 2) =>
  k > 0
    ? rank(indexedScores(buildIndex(rows), query))
        .slice(0, k)
        .map((r) => r.id)
    : [];
export const weaker = (a, b) => a.score < b.score || (a.score === b.score && a.id > b.id);
export function heapTrace(scores = scoreRows(), order = [3, 2, 0, 1], k = 2) {
  const heap = [],
    trace = [];
  for (const id of order) {
    const incoming = scores.find((r) => r.id === id),
      before = [...heap],
      swaps = [];
    let action = 'discard',
      evicted = null,
      unsifted = [...heap];
    if (incoming.score > 0 && k > 0 && (heap.length < k || weaker(heap[0], incoming))) {
      if (heap.length < k) {
        heap.push(incoming);
        action = 'insert';
      } else {
        evicted = heap[0];
        heap[0] = incoming;
        action = 'replace';
      }
      unsifted = [...heap];
      let i = action === 'insert' ? heap.length - 1 : 0;
      if (action === 'insert') {
        while (i > 0) {
          const p = Math.floor((i - 1) / 2);
          if (!weaker(heap[i], heap[p])) break;
          [heap[i], heap[p]] = [heap[p], heap[i]];
          swaps.push([i, p]);
          i = p;
        }
      } else {
        while (true) {
          let n = i;
          for (const child of [i * 2 + 1, i * 2 + 2])
            if (child < heap.length && weaker(heap[child], heap[n])) n = child;
          if (n === i) break;
          [heap[i], heap[n]] = [heap[n], heap[i]];
          swaps.push([i, n]);
          i = n;
        }
      }
    }
    trace.push({
      incoming,
      before,
      unsifted,
      after: [...heap],
      swaps,
      action,
      evicted,
      winners: rank(heap),
    });
  }
  return trace;
}
export function ownershipSnapshot(mode, remove = false) {
  const stored = [0, 2],
    request = mode === 'alias' ? stored : [...stored];
  if (remove) request.shift();
  return {
    stored,
    request,
    nextCaller: [...stored],
    sharesList: request === stored,
  };
}
export function eligibleTopK(k = 2) {
  const ranked = rank(scoreRows()),
    eligible = (r) => PERMITTED_NOTE_IDS.includes(r.id);
  return {
    ranked,
    selectedThenFiltered: ranked.slice(0, k).filter(eligible),
    filteredThenSelected: ranked.filter(eligible).slice(0, k),
  };
}
export function breadthFirstTrace() {
  const pending = [0],
    discovered = new Set(pending),
    trace = [
      {
        current: null,
        pending: [...pending],
        discovered: [...discovered],
        skipped: [],
      },
    ];
  while (pending.length) {
    const current = pending.shift(),
      skipped = [];
    for (const next of LINKS[current])
      if (discovered.has(next)) skipped.push(next);
      else {
        discovered.add(next);
        pending.push(next);
      }
    trace.push({
      current,
      pending: [...pending],
      discovered: [...discovered],
      skipped,
    });
  }
  return trace;
}
export function capacityState(claim = false, admit = false) {
  return {
    slots: claim ? [admit ? 5 : null, 4] : [3, 4],
    head: claim ? 1 : 0,
    pending: admit ? [] : [5],
    logicalOrder: claim ? (admit ? [4, 5] : [4]) : [3, 4],
    claimed: claim ? 3 : null,
  };
}
export function doublingHistory(count, initial = 3) {
  let capacity = initial,
    copied = 0;
  const steps = [];
  for (let i = 0; i < count; i++) {
    const priorCapacity = capacity,
      copy = i === capacity ? i : 0;
    if (copy) capacity *= 2;
    copied += copy;
    steps.push({
      size: i + 1,
      capacity,
      priorCapacity,
      copy,
      copied,
      writes: i + 1,
      total: copied + i + 1,
    });
  }
  return {
    steps,
    capacity,
    copied,
    writes: count,
    total: copied + count,
  };
}
export const toyBucket = (word) =>
  [...word.toLowerCase()].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 2;
export function collisionWorksheet(hashOnly = false) {
  const entries = [
      ['charged', [0, 2, 3]],
      ['twice', [0, 2]],
    ],
    map = new Map(entries.map(([word, ids]) => [hashOnly ? toyBucket(word) : word, ids]));
  return {
    entries,
    bucket: entries.map(([word]) => toyBucket(word)),
    charged: map.get(hashOnly ? 0 : 'charged'),
    twice: map.get(hashOnly ? 0 : 'twice'),
  };
}
export function permittedFreshRanking(permittedIds = PERMITTED_NOTE_IDS) {
  const all = rank(scoreRows(UPDATED_MESSAGES, FRESH_QUERY)),
    allowed = new Set(permittedIds);
  return {
    all,
    late: all.slice(0, 2).filter((r) => allowed.has(r.id)),
    early: all.filter((r) => allowed.has(r.id)).slice(0, 2),
  };
}
