import {
  appendTrace,
  copyBlocks,
  dot,
  exactDedupTrace,
  rank,
  unorderedPairs,
} from './arithmetic.mjs';
export const TERMS = Object.freeze(['login', 'test', 'fail']);
export const lexicalScore = (words) =>
  TERMS.filter((term) => words.includes(term)).length / TERMS.length;
export const DOCS = Object.freeze(
  [
    {
      id: 'token-fixture',
      name: 'Expired login fixture',
      words: ['login', 'test', 'expired', 'fixture'],
      vector: [1, 0.2, 0.1],
      refine: 0.8,
      detail: 'The login test fixture starts with an expired session',
    },
    {
      id: 'ci-clock',
      name: 'CI clock drift',
      words: ['ci', 'test', 'runner', 'clock', 'drift'],
      vector: [0, 1, 0.2],
      refine: 0.55,
      detail: 'The CI test runner clock is five minutes slow',
    },
    {
      id: 'issuer-check',
      name: 'Old issuer config',
      words: ['verifier', 'expects', 'old', 'issuer'],
      vector: [0.8, 0.1, 0.4],
      refine: 0.95,
      detail:
        'The identity provider changed its issuer value; verifier config still expects the old one',
    },
    {
      id: 'release-guide',
      name: 'Release rollback list',
      words: ['release', 'rollback', 'checklist'],
      vector: [0.1, 0.2, 1],
      refine: 0.2,
      detail: 'Deployment rollback steps',
    },
  ].map((d) =>
    Object.freeze({
      ...d,
      cheap: lexicalScore(d.words),
    }),
  ),
);
export const COLLISION_QUERY = 'missing-login-note';
export const QUERY = Object.freeze([1, 0, 0]);
export const HASH_GRID = Object.freeze({
  x: 185,
  y: 500,
  columns: 4,
  rows: 2,
  columnStep: 410,
  rowStep: 210,
  bucketWidth: 365,
  bucketHeight: 110,
  labelOffset: 30,
  labelSize: 32,
});
export const PREFIX_WORDS = Object.freeze(['play', 'place', 'planet', 'plaza']);
export const PREFIX_QUERY = 'pla';
export const CATALOG = Object.freeze([
  'ci-clock',
  'ci-timeout',
  'docs-index',
  'issuer-check',
  'release-guide',
  'test-runner',
  'token-fixture',
  'verifier-config',
]);
export const SCORES = Object.freeze(
  DOCS.map((d) =>
    Object.freeze({
      ...d,
      score: dot(d.vector, QUERY),
    }),
  ),
);
export const TOP_TWO = Object.freeze(rank(SCORES).slice(0, 2));
export function binarySearchTrace(values = CATALOG, target = 'issuer-check') {
  let lo = 0,
    hi = values.length;
  const result = [];
  while (lo < hi) {
    const before = {
        lo,
        hi,
      },
      mid = Math.floor((lo + hi) / 2),
      found = values[mid] === target;
    if (!found) {
      if (values[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    result.push({
      ...before,
      mid,
      key: values[mid],
      found,
      nextLo: lo,
      nextHi: hi,
    });
    if (found) break;
  }
  return result;
}
export const BINARY_TRACE = Object.freeze(binarySearchTrace());
export const APPENDS = Object.freeze(appendTrace());
export const APPEND_EVENTS = (() => {
  let live = {
      id: 0,
      y: 400,
      capacity: 2,
      values: [1, 2],
    },
    blocks = [live],
    nextId = 1;
  const events = [];
  for (let arrival = 3; arrival <= 8; arrival++) {
    if (live.values.length === live.capacity) {
      const target = {
        id: nextId++,
        y: live.y === 400 ? 700 : 400,
        capacity: live.capacity * 2,
        values: [],
      };
      blocks = [live, target];
      for (const [slot, value] of live.values.entries()) {
        const before = copyBlocks(blocks);
        target.values.push(value);
        events.push({
          type: 'copy',
          value,
          slot,
          sourceY: live.y,
          destinationY: target.y,
          arrival,
          before,
          after: copyBlocks(blocks),
        });
      }
      const before = copyBlocks(blocks),
        slot = target.values.length;
      target.values.push(arrival);
      events.push({
        type: 'append',
        value: arrival,
        slot,
        sourceY: target.y === 400 ? 250 : 550,
        destinationY: target.y,
        arrival,
        before,
        after: copyBlocks([target]),
      });
      live = target;
      blocks = [live];
    } else {
      const before = copyBlocks(blocks),
        slot = live.values.length;
      live.values.push(arrival);
      events.push({
        type: 'append',
        value: arrival,
        slot,
        sourceY: live.y === 400 ? 250 : 550,
        destinationY: live.y,
        arrival,
        before,
        after: copyBlocks(blocks),
      });
    }
  }
  return Object.freeze(events);
})();
export function scoreTrace(rows = DOCS, query = QUERY) {
  if (rows.some((row) => row.vector.length !== query.length))
    throw new RangeError('score vectors must match the query width');
  const events = [];
  for (const [row, doc] of rows.entries()) {
    let sum = 0;
    for (const [column, x] of doc.vector.entries()) {
      const product = x * query[column];
      sum += product;
      events.push({
        id: doc.id,
        row,
        column,
        product,
        sum,
      });
    }
  }
  return events;
}
export const SCORE_TRACE = Object.freeze(scoreTrace());
export function boundedHeapTrace(rows = SCORES, k = 2) {
  if (!Number.isInteger(k) || k < 0) throw new RangeError('k must be a nonnegative integer');
  const heap = [],
    result = [];
  const weaker = (a, b) => a.score < b.score || (a.score === b.score && a.id < b.id);
  for (const candidate of rows) {
    const before = [...heap],
      swaps = [];
    let evicted = null,
      action = 'reject';
    if (heap.length < k) {
      action = 'insert';
      heap.push(candidate);
      let i = heap.length - 1;
      while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (!weaker(heap[i], heap[p])) break;
        swaps.push([i, p]);
        [heap[i], heap[p]] = [heap[p], heap[i]];
        i = p;
      }
    } else if (k && weaker(heap[0], candidate)) {
      action = 'replace';
      evicted = heap[0];
      heap[0] = candidate;
      let i = 0;
      while (2 * i + 1 < heap.length) {
        const left = 2 * i + 1,
          right = left + 1,
          child = right < heap.length && weaker(heap[right], heap[left]) ? right : left;
        if (!weaker(heap[child], heap[i])) break;
        swaps.push([i, child]);
        [heap[i], heap[child]] = [heap[child], heap[i]];
        i = child;
      }
    }
    result.push({
      candidate,
      before,
      heap: [...heap],
      action,
      evicted,
      swaps,
    });
  }
  return result;
}
export const HEAP_TRACE = Object.freeze(boundedHeapTrace());
export const PAIRS = Object.freeze(unorderedPairs(8));
export const DEDUP = Object.freeze(
  exactDedupTrace([
    'expired login test fixture',
    'CI runner clock drift',
    'expired login test fixture',
    'issuer claim requirement',
    'CI runner clock drift',
  ]),
);
export const CACHE_SHAPE = Object.freeze({
  layers: 32,
  kvHeads: 8,
  queryHeads: 32,
  width: 128,
  bytes: 2,
  streams: 16,
});
