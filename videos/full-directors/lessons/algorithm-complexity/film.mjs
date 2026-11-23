import assert from 'node:assert/strict';
import { prepareCaptions } from './captions.mjs';
import { press } from './press.mjs';
import {
  reader,
  scan,
  catalog,
  hash,
  radix,
  append,
  hits,
  mergeRuns,
  insertAt,
  insertedKey,
  buckets,
  prefix,
  splitAt,
  embeddingPath,
} from './catalog.mjs';
import {
  vectors,
  heap,
  pairs,
  trials,
  repairState,
  squared,
  cutoff,
  serviceProducts,
  scoreStreamState,
  scoreWorkspace,
  replayPairs,
} from './scoring.mjs';
import {
  attention,
  cache,
  queue,
  decode,
  bytesPerToken,
  causalCells,
  continuationCost,
  scheduler,
  arrivalsBy,
  executionStart,
} from './decoder.mjs';
import { guard, payoff, tinyPlan, plans, readings, offlineOrder, estimate } from './decision.mjs';
import {
  DOCS,
  CATALOG,
  BINARY_TRACE,
  binarySearchTrace,
  APPENDS,
  APPEND_EVENTS,
  DEDUP,
  SCORE_TRACE,
  HEAP_TRACE,
  PAIRS,
  PREFIX_WORDS,
} from '../../../films/algorithm-complexity/fixtures.mjs';
import { cacheValueBytes } from '../../../films/algorithm-complexity/model.mjs';

const scenes = [
  reader,
  scan,
  catalog,
  hash,
  radix,
  append,
  vectors,
  heap,
  pairs,
  attention,
  cache,
  queue,
  guard,
  payoff,
];
const dark = new Set([1, 3, 5, 7, 9, 10]);

function check() {
  assert.deepEqual(hits, [2, 1, 0, 0]);
  assert.deepEqual(
    mergeRuns.map((r) => r.i),
    [0, 4, 1, 5],
  );
  assert.deepEqual(
    BINARY_TRACE.map((r) => r.mid),
    [4, 2, 3],
  );
  assert.deepEqual(
    binarySearchTrace(CATALOG, CATALOG[0]).map((r) => r.mid),
    [4, 2, 1, 0],
  );
  assert.equal(
    binarySearchTrace(
      Array.from({ length: 65536 }, (_, i) => i),
      0,
    ).length,
    17,
  );
  const expanded = CATALOG.toSpliced(insertAt, 0, insertedKey);
  assert.deepEqual(expanded, [...expanded].sort());
  assert.deepEqual(
    buckets[6].map((d) => d.id),
    ['issuer-check'],
  );
  assert.equal(buckets[5].length, 2);
  assert.deepEqual(prefix.completions, PREFIX_WORDS);
  assert.equal(prefix.comparisons, 3);
  assert.equal(splitAt, 3);
  assert(
    embeddingPath.every(
      (v, i) => i === 0 || Math.hypot(...v) < Math.hypot(...embeddingPath[i - 1]),
    ),
  );
  assert.deepEqual(
    APPENDS.map((e) => e.writes),
    [1, 1, 3, 1, 5, 1, 1, 1],
  );
  assert.equal(APPEND_EVENTS.filter((e) => e.type === 'copy').length, 6);
  assert.equal(APPENDS.at(-1).totalWrites, 14);
  assert.equal(SCORE_TRACE.length, 12);
  assert.deepEqual(
    SCORE_TRACE.filter((e) => e.column === 2).map((e) => e.sum),
    [1, 0, 0.8, 0.1],
  );
  assert.equal(serviceProducts, 38400000);
  for (const [beatIndex, progress, scores, rootFirst, pending] of [
    [0, 0, [], [], null],
    [0, 0.5, [1], [0], null],
    [0, 1, [1, 0], [1, 0], null],
    [1, 0, [1, 0], [1, 0], null],
    [1, 1, [1, 0, 0.8], [1, 0], 2],
    [2, 1, [1, 0, 0.8, 0.1], [2, 0], null],
  ]) {
    const state = scoreStreamState({ beat: { beatIndex }, reveal: () => progress });
    assert.deepEqual(HEAP_TRACE.slice(0, state.scored).map((e) => e.candidate.score), scores);
    assert.deepEqual(state.slots.map((d) => d.id), rootFirst.map((i) => DOCS[i].id));
    assert.equal(state.full, rootFirst.length === 2);
    assert.equal(state.pending?.id ?? null, pending === null ? null : DOCS[pending].id);
    assert.equal(state.products, scores.length * 3);
  }
  for (const released of [false, true]) {
    const { scratch, winners, products } = scoreWorkspace({
      beat: { beatIndex: 8 },
      reveal: () => Number(released),
    });
    assert.deepEqual(
      scratch && [scratch.id, scratch.score],
      released ? null : ['release-guide', 0.1],
    );
    assert.deepEqual(
      winners.map((d) => [d.id, d.score]),
      [
        ['issuer-check', 0.8],
        ['token-fixture', 1],
      ],
    );
    assert.equal(products, 12);
  }
  assert.deepEqual(
    HEAP_TRACE.map((e) => e.action),
    ['insert', 'insert', 'replace', 'reject'],
  );
  assert.deepEqual(
    HEAP_TRACE.at(-1).heap.map((e) => e.id),
    ['issuer-check', 'token-fixture'],
  );
  assert.deepEqual(
    trials.map((e) => e.swaps.length),
    [2, 0],
  );
  for (const e of trials) assert.deepEqual(repairState(e, true, e.swaps.length), e.heap);
  assert.deepEqual(
    [4, 5, 8].map((n) => PAIRS.filter((pair) => pair.right < n).length),
    [6, 10, 28],
  );
  assert.deepEqual(
    replayPairs.map(({ left, right }) => [left, right]),
    [
      [0, 1],
      [0, 2],
      [0, 3],
    ],
  );
  assert.deepEqual(
    Array.from({ length: 7 }, (_, i) => PAIRS.filter(({ right }) => right === i + 1).length),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.deepEqual(
    DOCS.slice(1).map((_, i) => squared(0, i + 1).reduce((a, b) => a + b, 0) <= cutoff),
    [false, true, false],
  );
  assert.equal(DEDUP.at(-1).unique.length, 3);
  assert.equal(causalCells(8), 36);
  assert.deepEqual(
    decode.rows.map((r) => r.keysRead),
    [9, 10, 11],
  );
  assert.equal(decode.keyReads, 30);
  assert.deepEqual(continuationCost(8, 3), { old: 24, added: 6, total: decode.keyReads });
  assert.deepEqual(continuationCost(16, 3), { old: 48, added: 6, total: 54 });
  assert.deepEqual(continuationCost(16, 4), { old: 64, added: 10, total: 74 });
  assert.equal(continuationCost(8, 0).total, 0);
  assert.equal(bytesPerToken, 128 * 1024);
  assert.deepEqual(
    [1024, 4096].map((n) => cacheValueBytes(n) / 1024 ** 3),
    [2, 8],
  );
  assert.equal(executionStart - scheduler.timer, 20);
  assert.deepEqual([0, scheduler.timer, executionStart, 40].map(arrivalsBy), [1, 1, 1, 2]);
  assert.equal(tinyPlan.products, 9);
  assert.equal(tinyPlan.within, false);
  assert.deepEqual(
    plans.map((p) => [p.products, p.within]),
    [
      [960000, true],
      [1536000, false],
      [1536000, false],
    ],
  );
  assert.deepEqual(
    readings.map((r) => [r.cheapReads, r.refineReads, r.hits]),
    [
      [4, 2, 1],
      [4, 3, 2],
      [4, 4, 2],
    ],
  );
  assert.deepEqual(
    readings[1].winners.map((d) => d.id),
    ['issuer-check', 'token-fixture'],
  );
  assert.deepEqual(
    offlineOrder.map((d) => [d.id, d.refine]),
    [
      ['issuer-check', 0.95],
      ['token-fixture', 0.8],
      ['ci-clock', 0.55],
      ['release-guide', 0.2],
    ],
  );
  assert.deepEqual(offlineOrder.slice(0, 2), readings[0].reference);
  assert.deepEqual([3, 2.6].map(estimate), [6, 5.2]);
}

export default {
  title: 'How Work Grows with the Input',
  check,
  preparePicture: prepareCaptions,
  draw(ctx, clock) {
    const chapter = clock.beat.chapterIndex;
    scenes[chapter](press(ctx, dark.has(chapter)), clock);
  },
};
