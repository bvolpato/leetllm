import {
  bankModel,
  edgeOwnership,
  laneSectorCoverage,
  resourceCapacity,
  sectorModel,
  sectorTransition,
  transpose,
} from './arithmetic.mjs';
import { compact, compactProgress, sharedTileSnapshot } from './construction.mjs';
import { copyPass } from './copy-check.mjs';
import { columnRequests } from './bank-desk.mjs';
import { freshEdgeReadout, sampleModel, timingEvidence } from './model.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  for (const n of [1, 4, 7]) {
    const a = transpose(n);
    assert.equal(new Set(a.map((e) => e.target.join(','))).size, n * n);
    assert(a.every((e) => e.value === e.target[1] * n + e.target[0]));
  }
  for (const beat of [0, 1])
    for (let i = 0; i <= 100; i++) {
      const s = sharedTileSnapshot(beat, i / 100);
      assert(s.read <= s.loaded);
      if (!s.ready) assert.equal(s.read, 0);
      if (s.read) assert.equal(s.arrived, 16);
      assert(
        s.entries
          .slice(0, s.read)
          .every((entry) => entry.value === entry.source[0] * 4 + entry.source[1]),
      );
    }
  assert.equal(sharedTileSnapshot(0, 1).read, 16);
  assert.equal(sharedTileSnapshot(1, 1).read, 9);
  assert.equal(sharedTileSnapshot(1, 1).arrived, 16);
  assert.equal(sectorModel(false).sectors.length, 32);
  assert.equal(sectorModel(true).sectors.length, 4);
  assert.equal(sectorModel(false).fraction, 0.125);
  for (let converted = 0; converted <= 32; converted++) {
    const s = sectorTransition(converted);
    assert.equal(s.payload, s.addresses.length * 4);
    assert.equal(s.sectors.length, new Set(s.addresses.map((a) => Math.floor(a / 32))).size);
    assert.equal(s.fraction, s.payload / (32 * s.sectors.length));
  }
  assert.equal(bankModel(32).conflict, 32);
  assert.equal(bankModel(33).conflict, 1);
  assert.equal(bankModel(33).sharedBytes - bankModel(32).sharedBytes, 128);
  assert.equal(bankModel(34).conflict, 2);
  assert.deepEqual(compact().offsets, [0, 0, 1, 1, 2, 3, 3, 3]);
  assert.deepEqual(compact().indexes, [1, 3, 4, 7]);
  assert.deepEqual(compactProgress(4).offsets, [0, 0, 1, 1, '·', '·', '·', '·']);
  assert.deepEqual(compactProgress(4).indexes, [1, 3]);
  assert.equal(
    sampleModel('primitives', {
      beat: 1,
      beatP: 0.02,
    }).visible,
    0,
  );
  assert.equal(
    sampleModel('primitives', {
      beat: 1,
      beatP: 0.5,
    }).visible,
    5,
  );
  assert.equal(
    sampleModel('primitives', {
      beat: 1,
      beatP: 0.99,
    }).visible,
    8,
  );
  assert.equal(
    sampleModel('barrier', {
      beat: 0,
      beatP: 0.8,
    }).result,
    null,
  );
  assert.equal(
    sampleModel('barrier', {
      beat: 1,
      beatP: 0.8,
    }).result,
    10,
  );
  assert.equal(
    sampleModel('intro', {
      beat: 0,
      beatP: 0.99,
    }).visible,
    0,
  );
  assert.equal(
    sampleModel('intro', {
      beat: 1,
      beatP: 0,
    }).visible,
    0,
  );
  const visible = sampleModel('intro', {
    beat: 1,
    beatP: 0.4,
  }).visible;
  assert(visible > 0 && visible < 16);
  assert.equal(
    sampleModel('intro', {
      beat: 1,
      beatP: 0.99,
    }).visible,
    16,
  );
  return true;
}
export function validateModel() {
  validateOriginalModel();
  for (const [initial, pass, count, mismatches, word] of [
    ['previous', 'skipped', 15, 0, 0x40c00000],
    ['poison', 'skipped', 15, 1, 0xffffffff],
    ['poison', 'repaired', 16, 0, 0x40c00000],
  ]) {
    const result = copyPass(initial, pass, count);
    assert.equal(result.mismatches, mismatches);
    assert.equal(result.words[9], word);
    assert.equal(result.written.has(9), pass === 'repaired');
  }
  for (const stride of [32, 33, 34, 36]) {
    assert.deepEqual(columnRequests(stride, 32), bankModel(stride).counts);
  }
  assert.equal(columnRequests(34, 16)[0], 1);
  assert.equal(columnRequests(34, 17)[0], 2);
  assert.equal(laneSectorCoverage(7).sectors.length, 5);
  assert.equal(laneSectorCoverage(33).fraction, 0.8);
  assert.equal(edgeOwnership(73, 2, 0).producers.length, 288);
  assert.equal(edgeOwnership(67, 2, 0).producers.length, 96);
  assert.equal(resourceCapacity(48).blocks, 5);
  assert(timingEvidence().paddingRangesOverlap);
  assert(timingEvidence().allTiledBelowNaive);
  assert.equal(freshEdgeReadout().outputIndex, null);
  return true;
}
