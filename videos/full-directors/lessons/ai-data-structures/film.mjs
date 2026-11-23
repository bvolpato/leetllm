import assert from 'node:assert/strict';
import { prepareCaptions } from './captions.mjs';
import {
  MESSAGES,
  UPDATED_MESSAGES,
  QUERY,
  FRESH_QUERY,
  NEXT_CALLER_IDS,
  LINKS,
} from '../../../films/ai-data-structures/fixtures.mjs';
import {
  buildIndex,
  terms,
  scoreRows,
  search,
  rank,
  doublingHistory,
  collisionWorksheet,
  breadthFirstTrace,
  capacityState,
  ownershipSnapshot,
  eligibleTopK,
  permittedFreshRanking,
} from '../../../films/ai-data-structures/arithmetic.mjs';
import { background } from './archive.mjs';
import {
  opening,
  lists,
  representation,
  movement,
  scan,
  invert,
  collision,
  membership,
  counters,
  lab,
  ledger,
  shifts,
  postingTrace,
  animalDocs,
  animalSearch,
} from './retrieval.mjs';
import {
  heap,
  heapOrder,
  queue,
  workers,
  policies,
  arrivals,
  repairStart,
  siftPath,
  heapExample,
  overflowStates,
} from './sorting-room.mjs';
import {
  tree,
  graph,
  pathCost,
  trie,
  invariants,
  prefixMatches,
  checksForLab,
  replayWrites,
} from './paths.mjs';
import {
  ownership,
  eligibility,
  publish,
  lru,
  returnQuery,
  finalCase,
  nextCallerRanking,
  recency,
  lruTrace,
  billingRun,
  changedTerms,
} from './dispatch.mjs';

const chapters = [
  opening,
  lists,
  representation,
  movement,
  scan,
  invert,
  collision,
  membership,
  counters,
  heap,
  heapOrder,
  lab,
  ledger,
  queue,
  workers,
  policies,
  tree,
  graph,
  pathCost,
  trie,
  invariants,
  ownership,
  eligibility,
  publish,
  lru,
  returnQuery,
  finalCase,
];
function check() {
  const index = buildIndex(),
    updated = buildIndex(UPDATED_MESSAGES);
  assert.deepEqual([...index.get('charged')], [0, 2, 3]);
  const occurrences = MESSAGES[0].text.toLowerCase().match(/\btwice\b/g);
  assert.equal(occurrences.length, 2);
  assert.equal([...index.get('twice')].filter((id) => id === 0).length, 1);
  assert.deepEqual(
    scoreRows().map((r) => r.score),
    [2, 0, 2, 1],
  );
  assert.deepEqual(search(MESSAGES, QUERY), [0, 2]);
  for (const [word, ids] of collisionWorksheet().entries)
    assert.deepEqual(ids, [...index.get(word)]);
  assert.deepEqual(collisionWorksheet().bucket, [0, 0]);
  assert.deepEqual(collisionWorksheet(true).charged, [0, 2]);
  assert.equal(shifts(7), 21);
  assert.equal(shifts(50000), 1249975000);
  assert.deepEqual(
    doublingHistory(7).steps.map((s) => s.copy),
    [0, 0, 0, 3, 0, 0, 6],
  );
  assert.equal(doublingHistory(7).total, 16);
  assert.equal(postingTrace().length, 5);
  assert.equal(new Set(postingTrace().map((r) => r.id)).size, 3);
  assert.deepEqual(
    arrivals.map((s) => s.action),
    ['insert', 'insert', 'replace', 'discard'],
  );
  assert.equal(arrivals[2].evicted.id, 3);
  assert.deepEqual(
    arrivals[2].unsifted.map((r) => r.id),
    [0, 2],
  );
  assert.deepEqual(
    arrivals[2].after.map((r) => r.id),
    [2, 0],
  );
  assert.deepEqual(
    arrivals[3].winners.map((r) => r.id),
    [0, 2],
  );
  assert.ok(
    heapExample.slice(1).every((v) => v >= heapExample[0]) && heapExample[1] > heapExample[0],
  );
  const sift = siftPath(repairStart);
  assert.deepEqual(sift.path, [0, 1, 3]);
  assert.deepEqual(sift.frames.at(-1), [2, 3, 4, 9, 6, 7, 8]);
  assert.ok(checksForLab().every((r) => r[1]));
  const animals = animalSearch(animalDocs, 'Red red FOX');
  assert.deepEqual(animals.ranked, [2, 3]);
  assert.deepEqual([...animals.postings.get('red')], [0, 2, 3]);
  assert.deepEqual(animalSearch(animalDocs, 'fox,').ranked, []);
  assert.deepEqual(animalSearch(animalDocs, 'red fox', 0).ranked, []);
  const empty = animalSearch(animalDocs.slice(0, 3), 'otter');
  assert.deepEqual(empty.ranked, []);
  assert.equal(empty.postings.size, 8);
  assert.deepEqual(capacityState(true, true).slots, [5, 4]);
  assert.deepEqual(capacityState(true, true).logicalOrder, [4, 5]);
  assert.deepEqual(overflowStates().recent, [2, 3]);
  assert.deepEqual(overflowStates().waiting, [0, 2]);
  assert.equal(overflowStates().rejected, 3);
  const bfs = breadthFirstTrace();
  assert.deepEqual(
    bfs.map((r) => r.pending),
    [[0], [2, 3], [3], []],
  );
  assert.deepEqual(
    bfs.map((r) => r.skipped),
    [[], [], [3], [0]],
  );
  assert.equal(
    bfs.at(-1).discovered.reduce((sum, id) => sum + LINKS[id].length, 0),
    4,
  );
  assert.deepEqual(prefixMatches('charg'), ['charge', 'charged', 'charges']);
  assert.deepEqual(
    prefixMatches('charg').filter((w) => index.has(w)),
    ['charged'],
  );
  assert.deepEqual(replayWrites([2, 2]), [[2, 'embedding']]);
  assert.deepEqual(ownershipSnapshot('alias', true).stored, [2]);
  assert.deepEqual(ownershipSnapshot('copy', true).stored, [0, 2]);
  assert.deepEqual(
    eligibleTopK().selectedThenFiltered.map((r) => r.id),
    [2],
  );
  assert.deepEqual(
    eligibleTopK().filteredThenSelected.map((r) => r.id),
    [2, 3],
  );
  const delta = changedTerms();
  assert.deepEqual(delta, { drop: ['was', 'charged', 'twice'], add: ['can', 'sign', 'in'] });
  for (const w of delta.drop) assert.ok(!updated.get(w)?.has(2));
  for (const w of delta.add) assert.ok(updated.get(w).has(2));
  assert.deepEqual(search(UPDATED_MESSAGES), [0, 3]);
  assert.deepEqual(recency.slice(1), [
    ['charged', 'twice'],
    ['twice', 'charged'],
    ['charged', 'sign'],
  ]);
  assert.deepEqual(lruTrace(['a', 'b', 'c', 'a', 'd'], 3).at(-1), ['c', 'a', 'd']);
  const early = billingRun(false),
    together = billingRun(true);
  assert.deepEqual(
    early.map((s) => [s.notesVersion, s.indexVersion, s.status, s.saved]),
    [
      [7, 7, 'No entry yet', []],
      [8, 7, 'No entry yet', []],
      [8, 7, 'Cache miss', []],
      [8, 7, 'Saved under v8', [0, 2]],
      [8, 8, 'Saved under v8', [0, 2]],
      [8, 8, 'Cache hit', [0, 2]],
    ],
  );
  assert.deepEqual(
    together.map((s) => [s.notesVersion, s.indexVersion, s.status, s.saved]),
    [
      [7, 7, 'No entry yet', []],
      [8, 8, 'No entry yet', []],
      [8, 8, 'Cache miss', []],
      [8, 8, 'Saved under v8', [0, 3]],
    ],
  );
  for (const [scope, expected] of [
    [
      [2, 3],
      [2, 3],
    ],
    [NEXT_CALLER_IDS, [1, 2]],
  ]) {
    assert.deepEqual(
      permittedFreshRanking(scope).early.map((r) => r.id),
      expected,
    );
    assert.deepEqual(
      rank(scoreRows(UPDATED_MESSAGES, FRESH_QUERY).filter((r) => scope.includes(r.id)))
        .slice(0, 2)
        .map((r) => r.id),
      expected,
    );
  }
  assert.deepEqual(permittedFreshRanking().late, []);
  assert.deepEqual(nextCallerRanking.map(({ id, score }) => [id, score]), [
    [1, 1],
    [2, 1],
    [3, 1],
  ]);
  assert.deepEqual(terms(QUERY), ['charged', 'twice']);
  return true;
}
export default {
  title: 'Which Notes Should the Assistant Read?',
  preparePicture: prepareCaptions,
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(1.6, 1.6);
    const sceneTitles = {
      'c25-b04': 'Cache freshness when the version changes first',
      'c25-b04-replay': 'Cache freshness when notes and index change together',
      'c25-b05': 'What does a tuple protect?',
    };
    background(ctx, sceneTitles[clock.beat.id] ?? clock.beat.chapterTitle);
    ctx.translate(78, 10);
    ctx.scale(0.87, 0.87);
    chapters[clock.beat.chapterIndex](ctx, clock);
    ctx.restore();
  },
  check,
};
