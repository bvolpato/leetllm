import {
  bandwidthPoint,
  prefixPageState,
  referenceHistory,
  reservation,
  revisedCapacityRows,
  scheduleRequests,
  speculativeAcceptance,
  speculativeExpectation,
} from './arithmetic.mjs';
import {
  GiB,
  KiB,
  bytesPerToken,
  hardware,
  pool,
  referencePoolBytes,
  sceneIds,
} from './fixtures.mjs';
import { sampleModel } from './construction.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  assert.equal(bytesPerToken, 128 * KiB);
  assert.equal(pool, 16 * GiB);
  assert.equal(4096 * bytesPerToken, 0.5 * GiB);
  for (const sceneId of sceneIds)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.15, 0.25, 0.5, 0.75, 0.999999]) {
        const s = sampleModel(sceneId, {
          beat,
          beatP,
        });
        assert.equal(s.step, beat);
        if (sceneId === 'growth') {
          assert(s.used <= pool && s.used + s.request.bytes > pool);
          if (beat === 0 || s.p >= 0.55) assert.equal(s.capacity, [32, 25, 7][beat]);
        }
        if (sceneId === 'pages') {
          assert.equal(s.slots - s.logical, s.waste);
          assert(
            s.rows.every(
              (row) =>
                row.slots % 16 === 0 && row.slots >= row.logical && row.slots - row.logical < 16,
            ),
          );
        }
        if (sceneId === 'bandwidth') {
          assert(Math.abs(s.tps - (s.batch * 1000) / s.ms) < 1e-9);
          assert.equal(s.bytes, hardware.weights + s.kvRead);
        }
        if (sceneId === 'operating-point') {
          if (s.p >= 0.65 || beat === 2) assert.equal(s.selected.batch, beat === 0 ? 24 : 16);
          for (const row of s.rows)
            if (row.batch === s.selected?.batch)
              assert(
                row.memoryTested &&
                  row.memoryPass &&
                  (beat === 0 || (row.latencyTested && row.latencyPass)),
              );
        }
        if (sceneId === 'partition')
          assert(s.weights + s.runtime + s.allocatedPool <= hardware.total);
      }
  const page = sampleModel('pages', {
    beat: 2,
    beatP: 0.9,
  });
  assert.equal(
    sampleModel('operating-point', {
      beat: 0,
      beatP: 0.15,
    }).selected,
    null,
  );
  assert.equal(
    sampleModel('operating-point', {
      beat: 1,
      beatP: 0.15,
    }).selected,
    null,
  );
  assert.deepEqual(
    page.rows.map((row) => row.slots),
    [4608, 4608, 4624],
  );
  assert.equal(page.waste, 18);
  assert.equal(reservation(4096, 512).bytes + 16 * bytesPerToken, reservation(4097, 512).bytes);
  assert.deepEqual(
    [1, 8, 24].map((batch) => bandwidthPoint(batch).ms),
    [25, 32, 48],
  );
  assert.equal(bandwidthPoint(16).tps, 400);
  for (const id of sceneIds)
    assert.equal(
      sampleModel(id, {
        beat: 0,
        beatP: 1,
      }).step,
      1,
    );
  return true;
}
export function validateModel() {
  validateOriginalModel();
  const bpt70 = 2 * 80 * 8 * 128 * 2,
    referencePool = referencePoolBytes;
  assert.equal(bpt70, 320 * KiB);
  assert.equal(8192 * bpt70, 2.5 * GiB);
  assert.equal(64 * 8192 * bpt70, 160 * GiB);
  assert.deepEqual(
    [4096, 16384, 32768, 65536, 131072].map((length) => referenceHistory(length).count),
    [103, 25, 12, 6, 3],
  );
  const longest = referenceHistory(131072);
  assert.equal(longest.gib, 16);
  assert.equal(longest.occupied, 48);
  assert.equal(longest.free.toFixed(2), '3.60');
  assert(longest.free < longest.gib);
  assert.equal(Math.floor(referencePool / (4608 * bytesPerToken)), 91);
  assert.equal(Math.floor((referencePool + 12e9) / (0.5 * GiB)), 125);
  assert.deepEqual(
    [8192, 131072].map((L) => Math.floor(referencePool / ((L * bytesPerToken) / 2))),
    [103, 6],
  );
  assert.equal(92 * 0.5625, 51.75);
  assert.equal((15 / 16) * 100, 93.75);
  assert.equal(scheduleRequests([2, 2, 5, 3, 1], 3, false).reads, 8);
  assert.equal(scheduleRequests([2, 2, 5, 3, 1], 3, true).reads, 5);
  assert.equal(scheduleRequests([1, 4, 2, 2], 2, false).reads, 6);
  assert.equal(scheduleRequests([1, 4, 2, 2], 2, true).reads, 5);
  assert.deepEqual(scheduleRequests([2, 2, 5, 3, 1], 3, true).frames[2].before, [2, 3, 4]);
  assert.equal(scheduleRequests([2, 2, 5, 3, 1], 3, true).tokens, 13);
  assert.deepEqual(prefixPageState(0).pages[0].values, ['p', 'q', 'r', null]);
  assert.equal(prefixPageState(2).pages[0].references, 1);
  assert.equal(prefixPageState(2).B, 12);
  assert.deepEqual(
    prefixPageState(3).pages.map((p) => p.values),
    [
      ['p', 'q', 'r', 'a'],
      ['p', 'q', 'r', 'b'],
    ],
  );
  assert.equal(speculativeAcceptance([0.7, 0.3], [0.8, 0.2], 0, 0.5).accepted, true);
  assert.equal(speculativeAcceptance([0.2, 0.8], [0.3, 0.7], 1, 0.9).accepted, true);
  assert.deepEqual(speculativeAcceptance([0, 1], [1, 0], 0, 0.5).residual, [0, 1]);
  assert(Math.abs(speculativeExpectation(4, 0.8, 0.1, 1).rate - 2.4011428571428577) < 1e-12);
  assert(speculativeExpectation(4, 0.3, 0.15, 1).rate < 1);
  assert.equal(
    revisedCapacityRows()
      .filter((r) => r.eligible)
      .at(-1).batch,
    24,
  );
  assert(Math.abs(revisedCapacityRows()[1].costPerMillion - 5 / 6) < 1e-12);
  return true;
}
