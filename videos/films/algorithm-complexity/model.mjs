import {
  budgetFor,
  collectRadixWords,
  decodeCostTrace,
  hashKey,
  radixNode,
  rank,
  rankLexical,
} from './arithmetic.mjs';
import {
  APPEND_EVENTS,
  BINARY_TRACE,
  CACHE_SHAPE,
  COLLISION_QUERY,
  DOCS,
  HASH_GRID,
  HEAP_TRACE,
  PAIRS,
  PREFIX_QUERY,
  PREFIX_WORDS,
  SCORE_TRACE,
  TERMS,
} from './fixtures.mjs';
import { cueProgress, q } from './construction.mjs';
export function collisionChainChecks(chain = DOCS, query = COLLISION_QUERY) {
  let checks = 0;
  for (const note of chain) {
    checks++;
    if (note.id === query) return checks;
  }
  return checks;
}
export function hashBucketGeometry(bucket) {
  if (!Number.isInteger(bucket) || bucket < 0 || bucket >= HASH_GRID.columns * HASH_GRID.rows)
    throw new RangeError('bucket index is outside the displayed table');
  return {
    x: HASH_GRID.x + (bucket % HASH_GRID.columns) * HASH_GRID.columnStep,
    y: HASH_GRID.y + Math.floor(bucket / HASH_GRID.columns) * HASH_GRID.rowStep,
    width: HASH_GRID.bucketWidth,
    height: HASH_GRID.bucketHeight,
  };
}
export function issuerHashRouteGeometry() {
  const bucket = hashKey('issuer-check'),
    bounds = hashBucketGeometry(bucket),
    previousRow = hashBucketGeometry(bucket - HASH_GRID.columns);
  const nextBucket =
    bucket % HASH_GRID.columns < HASH_GRID.columns - 1 ? hashBucketGeometry(bucket + 1) : null;
  const destination = {
    x: bounds.x + bounds.width * 0.32,
    y: bounds.y,
  };
  const points = [
    {
      x: 690,
      y: 307,
    },
    {
      x: nextBucket ? (bounds.x + bounds.width + nextBucket.x) / 2 : bounds.x + bounds.width + 22,
      y: 307,
    },
    {
      x: nextBucket ? (bounds.x + bounds.width + nextBucket.x) / 2 : bounds.x + bounds.width + 22,
      y:
        (previousRow.y +
          previousRow.height +
          bounds.y -
          HASH_GRID.labelOffset -
          HASH_GRID.labelSize) /
        2,
    },
    {
      x: destination.x,
      y:
        (previousRow.y +
          previousRow.height +
          bounds.y -
          HASH_GRID.labelOffset -
          HASH_GRID.labelSize) /
        2,
    },
    destination,
  ];
  return {
    bucket,
    bounds,
    destination,
    points,
  };
}
export function buildRadixTree(words = PREFIX_WORDS) {
  return radixNode([...new Set(words)]);
}
export function naivePrefixComparisonCount(query = PREFIX_QUERY, words = PREFIX_WORDS) {
  let comparisons = 0;
  for (const word of words) {
    for (let i = 0; i < Math.min(query.length, word.length); i++) {
      comparisons++;
      if (query[i] !== word[i]) break;
    }
  }
  return comparisons;
}
export function radixPrefixTrace(query = PREFIX_QUERY, words = PREFIX_WORDS) {
  let node = buildRadixTree(words),
    index = 0,
    comparisons = 0;
  const steps = [];
  while (index < query.length) {
    const edge = node.children.find((candidate) => candidate.label[0] === query[index]);
    if (!edge) break;
    let offset = 0;
    while (offset < edge.label.length && index < query.length) {
      const matched = edge.label[offset] === query[index];
      comparisons++;
      steps.push({
        queryIndex: index,
        edgeLabel: edge.label,
        edgeIndex: offset,
        matched,
      });
      if (!matched) break;
      index++;
      offset++;
    }
    if (steps.at(-1)?.matched === false) break;
    node = edge.node;
  }
  const matched = query.slice(0, index),
    complete = matched === query;
  return {
    matched,
    complete,
    comparisons,
    steps,
    branches: complete ? node.children.map((edge) => edge.label) : [],
    completions: complete ? collectRadixWords(node) : [],
  };
}
export function appendSnapshot(state) {
  const first = cueProgress(state, 'append-resize', 0),
    rest = cueProgress(state, 'append-sequence', 1),
    position = first * 3 + rest * 9;
  const completed = Math.min(APPEND_EVENTS.length, Math.floor(position + 1e-9)),
    active = APPEND_EVENTS[completed] ?? null;
  const blocks =
    position === 0
      ? [
          {
            id: 0,
            y: 400,
            capacity: 2,
            values: [1, 2],
          },
        ]
      : active
        ? active.before
        : APPEND_EVENTS.at(-1).after;
  return {
    blocks,
    active,
    travel: position === 12 ? 0 : position - completed,
    completed,
    totalWrites: 2 + completed,
    first,
    rest,
  };
}
export function shortlist(k = 3) {
  const selected = rankLexical(DOCS).slice(0, k),
    winners = rank(selected, 'refine').slice(0, 2),
    reference = rank(DOCS, 'refine').slice(0, 2);
  const hits = winners.filter((w) => reference.some((r) => r.id === w.id)).length;
  return {
    selected,
    winners,
    reference,
    hits,
    recall: hits / 2,
    cheapReads: DOCS.length,
    refineReads: selected.length,
  };
}
export function decodeSequenceSnapshot(state) {
  const trace = decodeCostTrace(),
    progress = q(state, 'attention-rows', 1),
    rowWork = progress * trace.consumedInputs;
  const completedRows = Math.min(trace.consumedInputs, Math.floor(rowWork + 1e-9));
  const activeRow = completedRows < trace.consumedInputs ? completedRows : -1;
  const activeReads =
    activeRow >= 0
      ? Math.floor((rowWork - completedRows) * trace.rows[activeRow].keysRead + 1e-9)
      : 0;
  const keyReads =
    trace.rows.slice(0, completedRows).reduce((sum, row) => sum + row.keysRead, 0) + activeReads;
  return {
    ...trace,
    progress,
    completedRows,
    activeRow,
    activeReads,
    keyReads,
    cachePositions: trace.initialKeys + completedRows + (progress > 0 && activeRow >= 0 ? 1 : 0),
  };
}
export const cacheValueBytes = (length) =>
  2 *
  CACHE_SHAPE.layers *
  CACHE_SHAPE.kvHeads *
  CACHE_SHAPE.width *
  CACHE_SHAPE.bytes *
  CACHE_SHAPE.streams *
  length;
export function cacheVolumeSnapshot(state) {
  const progress = q(state, 'cache-grow', 2),
    length = 1024 + Math.round(3072 * progress);
  return {
    progress,
    length,
    bytes: cacheValueBytes(length),
    gib: cacheValueBytes(length) / 1024 ** 3,
    scoreCells: length ** 2,
  };
}
export function batchWaitSnapshot(state) {
  const timeout = 10,
    busy = q(state, 'batch-busy', 1),
    busyUntil = 30 * busy,
    start = Math.max(timeout, busyUntil);
  return {
    timeout,
    busyUntil,
    start,
    formation: timeout,
    executionQueue: start - timeout,
  };
}
export function openingSnapshot(state) {
  const open = q(state, 'opening-open', 0),
    terms = q(state, 'opening-terms', 1),
    rest = terms === 1 ? q(state, 'opening-rest', 1) : 0;
  const compared = Math.min(3, Math.floor(terms * 3 + 1e-9)),
    inspected = (compared === 3 ? 1 : 0) + Math.floor(rest * 3 + 1e-9);
  const matches = TERMS.slice(0, compared).filter((term) => DOCS[0].words.includes(term)).length;
  const scores = DOCS.map((doc) => TERMS.filter((term) => doc.words.includes(term)).length);
  return {
    open,
    compared,
    matches,
    scores,
    inspected,
    winnerReady: q(state, 'opening-result', 1) === 1 && inspected === 4,
  };
}
export function radixPrefixSnapshot(state) {
  const compare = q(state, 'prefix-scan', 0),
    edge = q(state, 'prefix-edge', 1),
    walk = q(state, 'prefix-walk', 1),
    branch = q(state, 'prefix-branch', 1),
    count = q(state, 'prefix-count', 1);
  const letters = Math.floor(PREFIX_QUERY.length * compare + 1e-9),
    traversed = Math.floor(PREFIX_QUERY.length * walk + 1e-9);
  return {
    compare,
    edge,
    walk,
    branch,
    count,
    letters,
    scanChecks: letters * PREFIX_WORDS.length,
    traversed,
    trace: radixPrefixTrace(),
  };
}
export function scanSnapshot(state) {
  const add = q(state, 'scan-double', 0),
    n = 4 + Math.floor(4 * add + 1e-9),
    visited = Math.floor(8 * q(state, 'scan-visits', 0) + 1e-9);
  return {
    n,
    visited: Math.min(n, visited),
    bound: q(state, 'scan-linear', 0),
    notation: q(state, 'scan-notation', 1),
    inner: q(state, 'scan-inner', 1),
  };
}
export function binarySnapshot(state) {
  const first = q(state, 'binary-first', 0),
    rest = q(state, 'binary-rest', 0),
    completed = (first === 1 ? 1 : 0) + Math.floor(2 * rest + 1e-9);
  return {
    completed,
    row: completed ? BINARY_TRACE[completed - 1] : null,
    insertion: q(state, 'binary-insert', 1),
    bound: q(state, 'binary-bound', 1),
  };
}
export function scoringSnapshot(state) {
  const first = q(state, 'vector-first', 0),
    rest = q(state, 'vector-rest', 1),
    completed = Math.floor(3 * first + 1e-9) + Math.floor(9 * rest + 1e-9);
  const n = 4 + Math.floor(4 * q(state, 'vector-size', 1) + 1e-9),
    d = 3 + Math.floor(3 * q(state, 'vector-both', 1) + 1e-9);
  return {
    completed,
    events: SCORE_TRACE.slice(0, completed),
    n,
    d,
    products: n * d,
    originalExample: n === 4 && d === 3,
  };
}
export function heapSnapshot(state) {
  const first = q(state, 'heap-first', 0),
    replace = q(state, 'heap-replace', 1),
    reject = q(state, 'heap-reject', 1);
  const completed =
    Math.min(2, Math.floor(first * 2 + 1e-9)) + (replace === 1 ? 1 : 0) + (reject === 1 ? 1 : 0);
  return {
    first,
    replace,
    reject,
    completed,
    heap: completed ? HEAP_TRACE[completed - 1].heap : [],
    path: q(state, 'heap-path', 2),
    bill: q(state, 'heap-bill', 2),
  };
}
export function pairSnapshot(state) {
  const first = q(state, 'pairs-first', 0),
    add = q(state, 'pairs-add', 0),
    eight = q(state, 'pairs-eight', 1);
  const count =
    Math.floor(6 * first + 1e-9) + Math.floor(4 * add + 1e-9) + Math.floor(18 * eight + 1e-9);
  return {
    count,
    pairs: PAIRS.slice(0, count),
    n: eight > 0 ? 8 : add > 0 ? 5 : 4,
    dedup: q(state, 'dedup-arrivals', 2),
    meaning: q(state, 'dedup-meaning', 2),
  };
}
export function budgetSnapshot(state) {
  const next = (state.beat ?? 0) > 0,
    count = q(state, next ? 'budget-over' : 'budget-count', next ? 1 : 0),
    check = count === 1 ? q(state, next ? 'budget-stop' : 'budget-check', next ? 1 : 0) : 0,
    winners = q(state, 'budget-k', 1);
  const bill = budgetFor(next ? 4000 : 2500, 384, winners === 1 ? 1 : 2);
  return {
    ...bill,
    count,
    check,
    run: !next && check === 1 ? q(state, 'budget-run', 0) : 0,
    scored: !next && check === 1 ? Math.floor(bill.n * q(state, 'budget-run', 0)) : 0,
  };
}
export function shortlistSnapshot(state) {
  const first = q(state, 'shortlist-two', 0),
    expand = q(state, 'shortlist-three', 1),
    k = expand === 1 ? 3 : 2;
  return {
    ...shortlist(k),
    first,
    expand,
    referenceReady: q(state, 'shortlist-reference', 1) === 1,
    resultReady: q(state, 'shortlist-payoff', 1) === 1 && expand === 1,
    chosen: q(state, 'shortlist-choice', 2) === 1,
  };
}
