import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DOCUMENT_DRAWS,
  documentSample,
  bpeReplay,
  packRecords,
  independentObjective,
  restoreRecords,
} from '../animations/pretraining-data.mjs';

test('the same supplied draws conserve document identity while their token masses change', () => {
  assert.equal(DOCUMENT_DRAWS.length, 10);
  const balanced = documentSample(0.5),
    compensated = documentSample(0.9),
    blocks = documentSample(0.5, [100, 100]);
  assert.deepEqual(balanced.counts, [5, 5]);
  assert.deepEqual(balanced.tokens, [500, 4500]);
  assert.deepEqual(compensated.counts, [9, 1]);
  assert.deepEqual(compensated.tokens, [900, 900]);
  assert.deepEqual(blocks.tokens, [500, 500]);
  assert.equal(
    documentSample(0.05).categories[0],
    1,
    'a draw on the upper boundary belongs to the next interval',
  );
  assert.equal(documentSample(0).counts[0], 0);
  assert.equal(documentSample(1).counts[1], 0);
});

test('merge inference preserves learned order and does not merge overlapping matches twice', () => {
  assert.deepEqual(bpeReplay(['aaa'], [['a', 'a']]), [['aa', 'a', '</w>']]);
  assert.deepEqual(
    bpeReplay(
      ['abc'],
      [
        ['a', 'b'],
        ['ab', 'c'],
      ],
    ),
    [['abc', '</w>']],
  );
  assert.deepEqual(
    bpeReplay(
      ['abc'],
      [
        ['ab', 'c'],
        ['a', 'b'],
      ],
    ),
    [['ab', 'c', '</w>']],
  );
});

test('packing conserves all identified records, including an awkward low-utilization case', () => {
  const lengths = [7, 6, 5, 5, 3, 2],
    bins = packRecords(lengths);
  assert.deepEqual(
    bins
      .flat()
      .map((v) => v.id)
      .sort((a, b) => a - b),
    [0, 1, 2, 3, 4, 5],
  );
  assert.equal(
    bins.flat().reduce((n, v) => n + v.n, 0),
    28,
  );
  assert(bins.every((b) => b.reduce((n, v) => n + v.n, 0) <= 10));
  assert.equal(packRecords([6, 6, 6]).length, 3);
  assert.throws(() => packRecords([11]));
});

test('one internal shift and a pre-shifted target agree on the same eligible predictions', () => {
  const v = independentObjective([11, 12, 99, 21, 99], [0, 0, 0, 1, 1]);
  assert.deepEqual(v.targets, [12, 99, -100, 99, -100]);
  assert.deepEqual(v.labels.slice(1), v.targets.slice(0, -1));
  assert.equal(v.mask[3][2], 0);
  assert.equal(v.mask[4][3], 1);
  assert.equal(v.mask[3][4], 0);
  assert.equal(v.targets.filter((v) => v !== -100).length, 3);
});

test('restoring consumed progress retains unconsumed prefetched records without seed replay', () => {
  const order = ['0', '5', '1', '2', '3', '4'],
    r = restoreRecords(order, 2, 4);
  assert.deepEqual([...r.prefix, ...r.suffix], order);
  assert.deepEqual(r.skippedByReader, ['1', '2']);
  assert.deepEqual(r.repeatedBySeed, ['0', '5']);
  assert.throws(() => restoreRecords(order, 4, 2));
});

test('the source-specific prediction uses the actual cue rather than an old scene-second offset', async () => {
  const { filterState } = await import('../animations/pretraining-data.mjs');
  const before = filterState({
    beat: 2,
    beatP: 0.12,
    t: 44.93,
    cues: { 'filter-b3-1': { phase: 'before', progress: 0 } },
  });
  assert.equal(before.sourceRule, false);
  assert.equal(before.tokens, 800);
  assert(before.records.some((r) => r.id === 'C'));
  const after = filterState({
    beat: 2,
    beatP: 0.5,
    t: 51.33,
    cues: { 'filter-b3-1': { phase: 'after', progress: 1 } },
  });
  assert.equal(after.tokens, 680);
  assert(!after.records.some((r) => r.id === 'C'));
});
