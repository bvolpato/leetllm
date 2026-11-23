import {
  compareReturnedRows,
  expertProjectionFlops,
  expertWeightedReturn,
  gemmTile,
  packing,
  scaledDot,
  sum,
} from './arithmetic.mjs';
import {
  finalRuns,
  freshReference,
  layerRuns,
  parallel,
  routedReturns,
  serial,
} from './fixtures.mjs';
import { chunkScheduleState, expertPackState, sampleModel, scaleTrace } from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const atEnd = (beat) => ({ beat, beatP: 1 });
  const pin = (scene, beat) => expertPackState(scene, atEnd(beat)).segments[2].start;
  assert.equal(pin('intro', 0), 256);
  assert.equal(pin('intro', 1), 384);
  assert.deepEqual(
    [0, 1, 2].map((b) => pin('packing', b)),
    [256, 384, 512],
  );
  const narrow = expertPackState('fresh-contract', atEnd(1));
  const wide = expertPackState('fresh-contract', atEnd(2));
  assert.deepEqual(narrow.capacities, [128, 384, 0]);
  assert.deepEqual(wide.capacities, [256, 512, 0]);
  assert.equal(narrow.padding, 159);
  assert.equal(wide.padding, 415);
  const gate = chunkScheduleState(atEnd(1));
  assert.equal(gate.time, 1);
  assert.deepEqual(gate.owners, ['A', null]);
  assert.deepEqual(
    [0, 2, 3].map((b) => chunkScheduleState(atEnd(b)).time),
    [8, 6, 8],
  );
  const reference = routedReturns.map((row) => expertWeightedReturn(row.values, row.weights).total);
  assert.deepEqual(reference, [7, 3]);
  for (const [delivered, pass] of [
    [reference, true],
    [[...reference].reverse(), false],
  ]) {
    const checked = compareReturnedRows(reference, delivered);
    assert.equal(checked.total, 10);
    assert.equal(checked.pass, pass);
  }
  assert.deepEqual(
    layerRuns.map((run) => run.prep + run.kernel),
    [120, 130],
  );
  const checks = finalRuns.map((run) => compareReturnedRows(freshReference.values, run.returned));
  assert.deepEqual(
    checks.map((check) => check.total),
    [14, 14],
  );
  assert.deepEqual(
    checks.map((check) => check.pass),
    [true, false],
  );
  assert.deepEqual(
    finalRuns.map((run) => run.elapsed),
    [120, 105],
  );
  assert.equal(scaleTrace(0, 1).currentSum, 9);
  assert.equal(scaleTrace(1, 2.34 / 17.932).contributions[1], 3.75);
  assert.equal(scaleTrace(1, 1).currentSum, 6.5);
  assert.deepEqual(packing(128).padded, [128, 256, 128, 128]);
  assert.equal(packing(128).useful, 416);
  assert.equal(packing(128).capacity, 640);
  assert.equal(packing(256).capacity, 1024);
  assert.deepEqual(
    [
      [1, 2],
      [0, -1],
    ].map((row) =>
      [
        [3, 4],
        [1, -1],
      ].map((weight) => sum(row.map((v, k) => v * weight[k]))),
    ),
    [
      [11, -1],
      [-4, 1],
    ],
  );
  assert.equal(scaledDot().result, 6.5);
  assert.equal(scaledDot().explicit, scaledDot().result);
  assert.equal(packing(128).usefulFlops, 20937965568);
  assert.equal(packing(128).paddedFlops, 32212254720);
  assert.equal(expertProjectionFlops(640), 6 * 640 * 4096 * 2048);
  for (const events of [serial, parallel])
    for (const id of ['A', 'B']) {
      const own = events.filter((e) => e.id.startsWith(id));
      assert(own[0].end <= own[1].start);
      assert(own[1].end <= own[2].start);
    }
  for (const lane of [0, 1]) {
    const events = parallel.filter((e) => e.lane === lane).sort((a, b) => a.start - b.start);
    for (let i = 1; i < events.length; i++) assert(events[i - 1].end <= events[i].start);
  }
  assert.equal(Math.max(...parallel.map((e) => e.end)), 6);
  assert.equal(Math.max(...serial.map((e) => e.end)), 8);
  assert.equal(
    sampleModel('movement', {
      beat: 0,
      beatP: 0.99,
    }).ready,
    false,
  );
  assert.equal(
    sampleModel('movement', {
      beat: 1,
      beatP: 0.9,
    }).ready,
    true,
  );
  for (const beat of [0, 1, 2])
    for (const beatP of [0, 0.5, 0.99]) {
      const current = sampleModel('dot', {
        beat,
        beatP,
      });
      assert.equal(
        current.total,
        sum(current.a.slice(0, current.count).map((v, i) => v * current.z[i])),
      );
    }
  for (const p of [0, 0.125, 0.25, 0.5, 0.875, 1]) {
    const tile = gemmTile(p);
    assert.equal(
      tile.partial,
      sum(tile.a[tile.i].slice(0, tile.coordinates).map((v, k) => v * tile.z[tile.j][k])),
    );
    assert.equal(tile.completed, Math.floor(Math.floor(p * 8) / 2));
  }
  assert.deepEqual(gemmTile(1).result, [
    [11, -1],
    [-4, 1],
  ]);
  assert.equal(
    sampleModel('dot', {
      beat: 0,
      beatP: 0.99,
    }).total,
    11,
  );
  assert.equal(
    sampleModel('dot', {
      beat: 2,
      beatP: 0,
    }).total,
    -4,
  );
  assert.equal(
    sampleModel('indexer', {
      beat: 2,
      beatP: 0,
    }).selectedToken,
    40 + 1,
  );
  return true;
}
