import {
  balancedChildren,
  cosine,
  fixedWindows,
  parentRevealProgress,
  topicVector,
} from './arithmetic.mjs';
import {
  ENCODE_END,
  ENCODE_START,
  LONG_SECTION,
  PARENT_REVEAL_END,
  PARENT_REVEAL_START,
  POOL_END,
  POOL_START,
  RUNBOOK,
  RUNBOOK_WORDS,
} from './fixtures.mjs';
import {
  lateChunkSnapshot,
  overlapBars,
  overlapSnapshot,
  releaseSnapshot,
} from './construction.mjs';
import {
  answerabilityFixture,
  checkedParents,
  freshEvidence,
  headedSection,
  lateChunkFixture,
  overlapExperiment,
  parentExpansion,
  releaseComparison,
} from './model.mjs';
import assert from 'node:assert/strict';
import { pagingContext, revisedContext } from './packing.mjs';
export function validateModel() {
  const full = pagingContext(10);
  const clipped = pagingContext(9);
  assert.deepEqual(full.returned.map(span => span.start), [0, 5]);
  assert.equal(full.complete, true);
  assert.deepEqual(clipped.returned.map(span => span.text), ['15 minutes with deploy ID.']);
  assert.equal(clipped.budget - clipped.used, 4);
  assert.equal(clipped.complete, false);
  for (const [budget, parent, used, repeated, complete] of [
    [18, false, 18, 6, true],
    [12, false, 9, 0, false],
    [12, true, 12, 0, true],
    [11, true, 0, 0, false],
  ]) {
    const run = revisedContext(budget, { parent });
    assert.deepEqual([run.used, run.repeated, run.complete], [used, repeated, complete]);
  }
  assert.equal(revisedContext(12, { parent: true, allowed: false }).used, 0);
  assert.equal(revisedContext(12, { parent: true, version: 3 }).used, 0);
  assert.deepEqual(
    balancedChildren().map(({ length, start, end, review }) => [length, start, end, review]),
    [
      [5, 0, 30, false],
      [5, 31, 58, false],
      [5, 59, 93, false],
    ],
  );
  assert.ok(balancedChildren(LONG_SECTION, 7, 6).every((row) => row.review && row.length <= 7));
  assert.deepEqual(topicVector('Rollback failures require deploy IDs.'), [2, 0]);
  assert.deepEqual(topicVector('Commander handoff uses the active incident channel.'), [0, 3]);
  assert.equal(cosine([2, 0], [1, 0]), 1);
  assert.equal(cosine([1, 0], [0, 3]), 0);
  assert.equal(cosine([0, 0], [1, 0]), null);
  assert.equal(checkedParents().words, 14);
  assert.equal(
    checkedParents({
      version: 2,
    }).status,
    'stale child-to-parent link',
  );
  assert.equal(
    checkedParents({
      allowed: false,
    }).status,
    'parent access denied',
  );
  assert.equal(
    checkedParents({
      budget: 10,
    }).status,
    'context budget exceeded; select smaller complete evidence',
  );
  assert.equal(freshEvidence().words.length, 12);
  assert.equal(freshEvidence().complete, true);
  assert.equal(
    freshEvidence({
      dropCondition: true,
    }).complete,
    false,
  );
  const six = fixedWindows(RUNBOOK, 6, 2);
  assert.equal(RUNBOOK_WORDS.length, 17);
  assert.equal(six[0].words.join(' '), 'Rollback failure page on-call within 15');
  assert.equal(six[1].words.join(' '), 'within 15 minutes with deploy ID.');
  assert.deepEqual(
    overlapExperiment().map((row) => [row.chunks, row.indexedWords, row.completeRuleChunks]),
    [
      [3, 17, 0],
      [3, 21, 0],
      [5, 33, 0],
    ],
  );
  for (const [beat, progress, overlap, indexed] of [
    [0, 0.35, 0, 17],
    [0, 0.9, 2, 21],
    [1, 0.55, 4, 33],
    [2, 0.01, 4, 33],
  ]) {
    const snapshot = overlapSnapshot(beat, progress);
    assert.equal(snapshot.overlap, overlap);
    assert.equal(snapshot.indexedWords, indexed);
    assert.equal(snapshot.completeRuleChunks, 0);
    assert(snapshot.chunks.every((chunk) => chunk.words.length <= 7));
  }
  for (const progress of [0, 0.12, 0.5, 0.88, 1]) {
    const bars = overlapBars(0, progress);
    assert.deepEqual(
      bars.map((row) => row.width),
      [(800 * 17) / 33, (800 * 21) / 33, 800],
    );
    assert.equal(bars[0].width / bars[2].width, 17 / 33);
    assert.equal(overlapBars(1, progress)[0].opacity, 1);
    assert.equal(overlapBars(2, progress)[0].opacity, 1);
  }
  assert.deepEqual(
    answerabilityFixture().map((row) => row.phraseCheck),
    [false, false, true],
  );
  assert.deepEqual(
    releaseComparison().map((row) => [
      row.wordCount,
      row.withinCap,
      row.answerable,
      row.releasable,
    ]),
    [
      [5, true, false, false],
      [12, false, false, false],
      [10, true, true, true],
    ],
  );
  assert.equal(releaseSnapshot(1, 0.1).evaluatedCount, 1);
  assert.equal(releaseSnapshot(1, 0.8).evaluatedCount, 3);
  assert.equal(releaseSnapshot(2, 0.02).selected, null);
  assert.equal(releaseSnapshot(2, 0.5).selected.id, 'complete-rule');
  assert.equal(parentExpansion().admitted, true);
  assert.equal(
    parentExpansion({
      parentVersion: 'runbook/v2',
    }).admitted,
    false,
  );
  assert.equal(
    parentExpansion({
      authorized: false,
    }).context,
    null,
  );
  assert.equal(parentRevealProgress(0, 0.99), 0);
  assert.equal(parentRevealProgress(1, PARENT_REVEAL_START), 0);
  assert(parentRevealProgress(1, 0.82) > 0 && parentRevealProgress(1, 0.82) < 1);
  assert.equal(parentRevealProgress(1, PARENT_REVEAL_END), 1);
  assert.equal(parentRevealProgress(2, 0.02), 1);
  const beforeEncoding = lateChunkSnapshot(1, ENCODE_START);
  const afterEncoding = lateChunkSnapshot(1, ENCODE_END);
  const beforePooling = lateChunkSnapshot(1, POOL_START);
  const halfwayPooling = lateChunkSnapshot(1, 0.5);
  const afterPooling = lateChunkSnapshot(1, POOL_END);
  assert.equal(beforeEncoding.encodedCount, 0);
  assert.equal(afterEncoding.encodedCount, 8);
  assert.equal(beforePooling.encodedCount, 8);
  assert.equal(beforePooling.pooledCount, 0);
  assert.equal(halfwayPooling.encodedCount, 8);
  assert(halfwayPooling.pooledCount > 0 && halfwayPooling.pooledCount < 4);
  assert.equal(afterPooling.encodedCount, 8);
  assert.equal(afterPooling.pooledCount, 4);
  assert.equal(afterPooling.runningMean, 0.71);
  assert.equal(lateChunkSnapshot(2, 0.88).pooledCount, 4);
  assert.equal(lateChunkFixture().tokens[2].text, 'Maya');
  assert.deepEqual(
    lateChunkFixture().selected.map((index) => lateChunkFixture().tokens[index].text),
    ['page', 'the', 'service', 'owner'],
  );
  const section = headedSection();
  assert(
    section.searchableText.includes(section.heading) &&
      section.searchableText.includes(section.rule),
  );
}
