import { appendTrace, budgetFor, decodeCostTrace, rank, unorderedPairs } from './arithmetic.mjs';
import {
  APPENDS,
  BINARY_TRACE,
  CACHE_SHAPE,
  COLLISION_QUERY,
  DEDUP,
  DOCS,
  HEAP_TRACE,
  SCORES,
  SCORE_TRACE,
  TOP_TWO,
  binarySearchTrace,
} from './fixtures.mjs';
import {
  cacheValueBytes,
  collisionChainChecks,
  naivePrefixComparisonCount,
  radixPrefixTrace,
  shortlist,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(
    SCORES.map((d) => d.score),
    [1, 0, 0.8, 0.1],
  );
  assert.deepEqual(
    DOCS.map((d) => d.cheap),
    [2 / 3, 1 / 3, 0, 0],
  );
  assert(!DOCS.some((d) => d.id === COLLISION_QUERY));
  assert.equal(collisionChainChecks(), DOCS.length);
  assert.deepEqual(
    BINARY_TRACE.map((d) => d.mid),
    [4, 2, 3],
  );
  assert.equal(
    binarySearchTrace(
      Array.from(
        {
          length: 65536,
        },
        (_, i) => i,
      ),
      0,
    ).length,
    17,
  );
  assert.equal(APPENDS.at(-1).totalWrites, 14);
  assert.equal(APPENDS[4].writes, 5);
  for (let n = 1; n < 64; n++) assert(appendTrace(n).at(-1).totalWrites < 3 * n);
  assert.equal(SCORE_TRACE.length, 12);
  assert.equal(SCORE_TRACE.filter((x) => x.product === 0).length, 9);
  assert.equal(naivePrefixComparisonCount(), 12);
  assert.deepEqual(radixPrefixTrace(), {
    matched: 'pla',
    complete: true,
    comparisons: 3,
    steps: [
      {
        queryIndex: 0,
        edgeLabel: 'pla',
        edgeIndex: 0,
        matched: true,
      },
      {
        queryIndex: 1,
        edgeLabel: 'pla',
        edgeIndex: 1,
        matched: true,
      },
      {
        queryIndex: 2,
        edgeLabel: 'pla',
        edgeIndex: 2,
        matched: true,
      },
    ],
    branches: ['y', 'ce', 'net', 'za'],
    completions: ['play', 'place', 'planet', 'plaza'],
  });
  assert.deepEqual(
    HEAP_TRACE.map((d) => d.action),
    ['insert', 'insert', 'replace', 'reject'],
  );
  assert.deepEqual(
    rank(HEAP_TRACE.at(-1).heap).map((d) => d.id),
    TOP_TWO.map((d) => d.id),
  );
  assert.deepEqual(
    [4, 5, 8].map((n) => unorderedPairs(n).length),
    [6, 10, 28],
  );
  assert.deepEqual(
    DEDUP.map((d) => d.duplicate),
    [false, false, true, false, true],
  );
  assert.equal(shortlist(2).hits, 1);
  assert.equal(shortlist(3).hits, 2);
  assert.equal(budgetFor(2500, 384, 2).products, 960000);
  assert.equal(budgetFor(4000, 384, 1).within, false);
  assert.deepEqual(
    decodeCostTrace().rows.map((v) => v.keysRead),
    [9, 10, 11],
  );
  assert.equal(decodeCostTrace().keyReads, 30);
  assert.equal(cacheValueBytes(1) / CACHE_SHAPE.streams, 131072);
  assert.equal(cacheValueBytes(1024) / 1024 ** 3, 2);
  assert.equal(cacheValueBytes(4096) / 1024 ** 3, 8);
  assert.equal(CACHE_SHAPE.queryHeads / CACHE_SHAPE.kvHeads, 4);
  return true;
}
