import assert from 'node:assert/strict';
import { opening, reduction, shuffle, barrier, grid } from './lanes.mjs';
import { scan, blelloch, blockScan } from './prefix.mjs';
import { precision, softmax, output } from './numeric.mjs';
import { exampleRuns, inTolerance } from './examples.mjs';
import { selection, testing, finish } from './practice.mjs';
import {
  sum,
  widths,
  starts,
  ends,
  strips,
  tree,
  plays,
  downs,
  totals,
  offsets,
  locals,
  globalRows,
  passes,
  metadata,
  flags,
  dest,
  packed,
  groups,
  leaders,
  argmax,
  laneValues,
  peer,
  alive,
  exited,
  warp,
  priorRecords,
  lookBack,
  large,
  residual,
  raw,
  rounded,
  left,
  right,
  max64,
  chunks,
  common,
  states,
  masses,
  denom,
  probs,
  chunkValues,
  numerator,
  vector,
  useful,
  rate,
  before,
  after,
  scanWork,
} from './examples.mjs';

const painters = {
  c01: opening,
  c02: reduction,
  c03: shuffle,
  c04: barrier,
  grid,
  c05: scan,
  downsweep: blelloch,
  offsets: blockScan,
  c06: precision,
  c07: softmax,
  outputs: output,
  writes: selection,
  lab: testing,
  c08: finish,
};
function draw(ctx, clock) {
  painters[clock.beat.chapterId](ctx, clock);
}
function check() {
  assert.deepEqual(tree, [strips, [5, 9, 8, 14], [14, 22], [36]]);
  for (let level = 0; level < tree.length; level++) {
    tree[level].forEach((v, i) =>
      assert.equal(v, sum(strips.slice(i * 2 ** level, (i + 1) * 2 ** level))),
    );
  }
  assert.deepEqual(peer(laneValues, alive, 10, 16), { source: 26, received: 0, add: true });
  assert.equal(peer(laneValues, exited, 10, 16).received, undefined);
  assert.equal(peer(laneValues, alive, 16, 16).add, false);
  assert.equal(warp.at(-1)[0], 26);
  assert.deepEqual(passes, [4194304, 8192, 16, 1]);
  assert.deepEqual(ends, [widths, [3, 4, 5, 6], [3, 4, 8, 10]]);
  assert.deepEqual(starts, [0, 3, 4, 8]);
  const raster = Array(10).fill(null);
  starts.forEach((lo, i) => {
    for (let p = lo; p < lo + widths[i]; p++) {
      assert.equal(raster[p], null);
      raster[p] = 'YCOT'[i];
    }
    assert.equal(lo + widths[i], ends.at(-1)[i]);
  });
  assert.equal(raster.join(''), 'YYYCOOOOTT');
  assert.deepEqual(
    downs.states.map((row) => row.values),
    [
      [3, -1, 4, 1],
      [3, 2, 4, 5],
      [3, 2, 4, 7],
      [3, 2, 4, 0],
      [3, 0, 4, 2],
      [0, 3, 2, 6],
    ],
  );
  assert.deepEqual(scanWork(32), {
    hillis: 129,
    blelloch: 62,
    hillisStages: 5,
    blellochStages: 10,
  });
  assert.equal(scanWork(512).hillis, 4097);
  assert.equal(scanWork(512).blelloch, 1022);
  assert.deepEqual(totals, [7, 4]);
  assert.deepEqual(offsets, [0, 7]);
  assert.deepEqual(locals[1], [0, 5, -4, -2]);
  globalRows.flat().forEach((v, i) => assert.equal(v, sum(plays.slice(0, i))));
  assert.deepEqual(metadata, [
    [262144, 512, 1],
    [262145, 513, 2, 1],
  ]);
  assert.equal(lookBack(priorRecords), 14);
  assert.equal(lookBack([...priorRecords.slice(0, 2), { type: 'X' }]), null);
  assert.equal(left, residual);
  assert.equal(rounded, -large);
  assert.equal(right, 0);
  assert(inTolerance(left));
  assert(!inTolerance(right));
  assert(exampleRuns.every(inTolerance));
  assert(exampleRuns[0] !== exampleRuns[1]);
  assert(raw > -large && raw < -large + 4);
  assert.equal(max64 + 1n, 2n ** 63n);
  assert.equal(max64 + 1n - 1n, max64);
  assert.deepEqual(
    states.map((s) => s.maximum),
    [2, 4],
  );
  assert.deepEqual(
    states.map((s) => s.denominator.toFixed(3)),
    ['1.368', '1.018'],
  );
  assert.deepEqual(
    masses.map((v) => v.toFixed(3)),
    ['0.185', '1.018'],
  );
  assert.equal(denom.toFixed(3), '1.203');
  assert(denom >= 1);
  assert(Math.abs(denom - sum(chunks.flat().map((x) => Math.exp(x - common)))) < 1e-14);
  assert(Math.abs(sum(probs) - 1) < 1e-14);
  assert.deepEqual(chunkValues, [[1, 0], [0, 1]]);
  assert.deepEqual(numerator.map((v) => v.toFixed(3)), ['0.185', '1.018']);
  assert.deepEqual(vector.map((v) => v.toFixed(3)), ['0.154', '0.846']);
  assert(Math.abs(vector[0] - sum(probs.slice(0, 2))) < 1e-14);
  assert(Math.abs(vector[1] - sum(probs.slice(2))) < 1e-14);
  assert.deepEqual(flags, [1, 0, 1, 1, 1, 0, 1, 1]);
  assert.equal(dest[1], dest[2]);
  assert.equal(dest[2], 1);
  assert.deepEqual(packed, [3, 4, 1, 5, 2, 6]);
  assert.deepEqual(groups.map(sum), [7, 0, 4]);
  assert.equal(argmax(leaders), 0);
  assert.throws(() => argmax([]));
  assert.throws(() => argmax([NaN]));
  assert.equal(useful, 12288);
  assert.equal(rate, 4.096);
  assert.equal(before.width, after.width);
  assert.equal(before.width, 15);
  assert.deepEqual(before.starts, [0, 3, 4, 8, 10]);
  assert.deepEqual(after.starts, [0, 3, 8, 12, 14]);
  for (const row of [before, after]) {
    const painted = Array(row.width).fill(null);
    row.lengths.forEach((n, i) => {
      for (let j = row.starts[i]; j < row.starts[i] + n; j++) {
        assert.equal(painted[j], null);
        painted[j] = row.order[i];
      }
    });
    assert(painted.every((i) => i !== null));
    assert.equal(row.starts[4], row.base);
  }
}
export default {
  title: 'GPU Parallel Primitives: From Lane Ownership to Global Prefixes',
  draw,
  check,
};
