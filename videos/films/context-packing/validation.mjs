import { GiB, cachePayload, fullPairs, localPairs } from './arithmetic.mjs';
import { approval, exchanges, ids, limit, mandatory } from './fixtures.mjs';
import { longContextModel, sampleModel } from './construction.mjs';
import { pack, verifyNote } from './model.mjs';
import assert from 'node:assert/strict';
export function validateLongContext() {
  assert.equal(fullPairs(10), 55);
  assert.equal(localPairs(10, 4), 34);
  const cache = longContextModel('cache-shape', {
    beat: 1,
    beatP: 1,
  });
  assert.equal(cache.one / GiB, 40);
  assert.equal((cache.one * 4) / GiB, 160);
  assert.equal(
    cachePayload({
      layers: 80,
      heads: 64,
      width: 128,
      tokens: 131072,
    }) / GiB,
    320,
  );
  const mixed = longContextModel('mixed-layers', {});
  assert.equal(mixed.local / GiB, 0.3125);
  assert.equal(mixed.global / GiB, 2);
  assert.equal(mixed.total / GiB, 2.3125);
  assert.equal(mixed.wrong / GiB, 48);
  assert.equal(longContextModel('position-dials', {}).mapped, 2048);
  assert.equal(
    longContextModel('basis-consistency', {
      beat: 1,
      beatP: 1,
    }).score,
    Math.cos(0.5),
  );
  assert.equal(longContextModel('cache-execution', {}).uncached, 146600);
  assert.equal(longContextModel('cache-execution', {}).reused, 50600);
  assert.equal(longContextModel('distributed-context', {}).rounded, 1088);
  assert.equal(longContextModel('distributed-context', {}).wrong, 1040);
  const turn = longContextModel('your-turn', {});
  assert.equal(turn.total, 34);
  assert.equal(turn.attempted, 43);
}
export function validateModel() {
  validateLongContext();
  assert.deepEqual(
    pack(exchanges).kept.map((row) => row.id),
    ['E3 newest', 'E2 middle'],
  );
  assert.equal(pack(exchanges).total, 30);
  assert.throws(() => pack([], 26), /Mandatory/);
  assert(
    !verifyNote({
      approved: true,
      source: 'D1',
    }),
  );
  assert(
    !verifyNote({
      ...approval,
      source: 'D2',
    }),
  );
  assert(
    !verifyNote({
      ...approval,
      approved: false,
    }),
  );
  assert(verifyNote(approval));
  for (const id of ids)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.25, 0.5, 0.75, 0.999999]) {
        const s = sampleModel(id, {
          beat,
          beatP,
        });
        assert.equal(s.step, beat);
        if (['complete-turns', 'compaction', 'synthesis'].includes(id)) {
          assert.equal(s.input + s.output, s.total);
          assert(s.total <= limit);
          assert.equal(s.input, mandatory + s.kept.reduce((sum, item) => sum + item.units, 0));
        }
        if (id === 'placement') {
          assert(s.full);
          assert(s.input + s.output <= s.limit);
          assert.equal(s.edge, beat !== 1);
        }
        if (id === 'exact-counts') {
          assert.equal(s.counts.A + s.counts.B, s.selected.length);
          assert.deepEqual(
            s.sources,
            s.selected.map((row) => row.id),
          );
          if (beat === 0) assert.equal(s.winner, 'A');
          else if (s.complete) assert.equal(s.winner, 'B');
        }
      }
  assert.equal(
    sampleModel('compaction', {
      beat: 1,
      beatP: 0.12,
    }).valid,
    false,
  );
  assert.equal(
    sampleModel('compaction', {
      beat: 1,
      beatP: 0.5,
    }).valid,
    true,
  );
  assert.deepEqual(
    sampleModel('exact-counts', {
      beat: 1,
      beatP: 0.12,
    }).counts,
    {
      A: 0,
      B: 0,
    },
  );
  assert.deepEqual(
    sampleModel('exact-counts', {
      beat: 1,
      beatP: 0.5,
    }).counts,
    {
      A: 2,
      B: 2,
    },
  );
  assert.deepEqual(
    sampleModel('compaction', {
      beat: 2,
      beatP: 0.9,
    }).kept.map((row) => row.id),
    ['D1 checked note', 'E3 newest'],
  );
  assert.deepEqual(
    sampleModel('exact-counts', {
      beat: 1,
      beatP: 0.9,
    }).counts,
    {
      A: 2,
      B: 3,
    },
  );
  for (const id of ids)
    assert.equal(
      sampleModel(id, {
        beat: 0,
        beatP: 1,
      }).step,
      1,
    );
  return true;
}
