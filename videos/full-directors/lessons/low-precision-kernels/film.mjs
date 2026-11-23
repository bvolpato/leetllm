import assert from 'node:assert/strict';
import {
  decode8,
  encode8,
  roundedOverflow,
  roundHalf,
  halfAdds,
  floatAdds,
} from '../../../films/low-precision-kernels/encoding.mjs';
import { experiment, projection } from '../../../films/low-precision-kernels/model.mjs';
import {
  input,
  sample,
  size,
} from '../../../director-cuts/lessons/low-precision-kernels/lunar-image.mjs';
import {
  capture,
  grids,
  scales,
  stale,
  fresh,
  subProbes,
  chance,
  midpoints,
} from './encoding-scenes.mjs';
import {
  groups,
  projections,
  factors,
  accumulators,
  halfProposals,
  orientation,
  contraction,
  spikeSelector,
  traceState,
} from './contraction-scenes.mjs';
import {
  memory,
  consumer,
  packed,
  padded,
  mx4,
  nv4,
  traffic,
  sameGroup,
  apart,
  imageState,
  srcCode,
  recode,
  restored,
  dim,
  availableRows,
  fullTileRows,
} from './consumer-scenes.mjs';

const painters = [
  capture,
  grids,
  scales,
  groups,
  projections,
  factors,
  accumulators,
  memory,
  consumer,
];
function draw(ctx, clock) {
  painters[clock.beat.chapterIndex](ctx, clock);
}
function check() {
  assert.deepEqual(
    [stale.scaled, stale.value, stale.reconstructed, -stale.error / stale.original],
    [22400, 448, 10, 0.98],
  );
  assert.equal(fresh.reconstructed, 500);
  assert.deepEqual(
    midpoints.map((v) => encode8(v).code),
    [0x38, 0x3a],
  );
  assert.deepEqual(
    subProbes.map((p) => p.code),
    [0, 2],
  );
  assert.deepEqual([chance.p, chance.expected], [0.25, 1.03125]);
  assert.deepEqual(
    [roundedOverflow(449).overflow, roundedOverflow(465).rounded, roundedOverflow(465).result],
    [false, 480, 448],
  );
  assert(Number.isNaN(roundedOverflow(465, { saturate: false }).result));
  assert.equal(roundedOverflow(65536, { saturate: false, format: 'e5m2' }).result, Infinity);
  assert.deepEqual(experiment.scales, [2 ** -8, 2]);
  assert.deepEqual(
    [
      experiment.tensor[0][0].reconstructed,
      experiment.block[0][0].reconstructed,
      experiment.block[1][3].reconstructed,
    ],
    [0, 0.0009765625, 512],
  );
  assert.deepEqual(
    [orientation.rowTiny.reconstructed, orientation.columnTiny.reconstructed],
    [0, 0.0009765625],
  );
  const trace = projection();
  assert.deepEqual([trace.original.at(-1), trace.reconstructed.at(-1)], [7.75, 7.75]);
  assert.deepEqual(
    trace.reconstructedTerms.map((v, i) => v - trace.originalTerms[i]),
    Array(4).fill([0, 0, 0, -0.75, 0, 0, 0, 0.75]).flat(),
  );
  assert.deepEqual([spikeSelector.original.at(-1), spikeSelector.reconstructed.at(-1)], [500, 512]);
  assert.deepEqual(contraction.contributions, [10, 24]);
  assert.deepEqual([contraction.correct, contraction.wrong], [34, 25]);
  assert.deepEqual(halfAdds, [1024, 1024, 1024, 1024, 1024]);
  assert.deepEqual(floatAdds, [1024, 1024.25, 1024.5, 1024.75, 1025]);
  assert.deepEqual(halfProposals, [1024.25, 1024.25, 1024.25, 1024.25]);
  assert.deepEqual(halfProposals.map(roundHalf), halfAdds.slice(1));
  assert.deepEqual([packed.total, padded.total, mx4.total, nv4.total], [66, 330, 34, 40]);
  assert.deepEqual(
    [padded.blocks, padded.elements, mx4.scaleBytes, nv4.scaleBytes],
    [10, 320, 2, 8],
  );
  assert.equal(fullTileRows - availableRows, 14);
  assert.deepEqual([srcCode, recode, decode8(srcCode, 'fnuz')], [0x38, 0x40, 0.5]);
  assert(Object.is(decode8(0x80, 'ocp'), -0));
  assert(Number.isNaN(decode8(0x80, 'fnuz')));
  assert.deepEqual(restored, input);
  assert.equal(dim[sample.index], 96);
  assert.deepEqual(
    [
      sameGroup.tiny.reconstructed,
      apart.tiny.reconstructed,
      sameGroup.spike.reconstructed,
      apart.spike.reconstructed,
    ],
    [0, 0.0009765625, 704, 704],
  );
  const frame = (b, reveal) => ({ beat: { beatIndex: b }, reveal });
  assert.equal(traceState(frame(1, () => 1)).decoded, 31);
  assert.equal(traceState(frame(2, () => 1)).decoded, 32);
  assert.equal(traceState(frame(3, () => 1)).pos, 3);
  assert.equal(traceState(frame(3, (p) => (p.startsWith('Sweep') ? 1 : 0))).pos, 2);
  for (const [phrase, expected] of [
    ['Replay', 4],
    ['Later', 8],
    ['The last', 31],
  ]) {
    const order = ['Replay', 'Later', 'The last'];
    const count = traceState(
      frame(1, (p) =>
        Number(order.slice(0, order.indexOf(phrase) + 1).some((a) => p.startsWith(a))),
      ),
    ).decoded;
    assert.equal(count, expected);
  }
  assert.deepEqual(traffic(frame(1, (p) => (p.startsWith('Write') ? 1 : 0))), {
    direct: false,
    written: 256,
    read: 0,
  });
  assert.deepEqual(traffic(frame(1, () => 1)), { direct: false, written: 256, read: 256 });
  assert.deepEqual(traffic(frame(2, () => 1)), { direct: true, written: 0, read: 0 });
  assert.equal(imageState(frame(1, () => 1)).value, 96);
  assert.equal(imageState(frame(2, (p) => (p.startsWith('Store') ? 1 : 0))).value, 96);
  assert.equal(imageState(frame(2, () => 1)).value, 192);
  for (const [beat, scan, before, after] of [
    [1, 'The crater pixel falls', 192, 96],
    [2, 'Run the multiplication again', 96, 192],
  ]) {
    for (const [row, expected] of [
      [sample.row, before],
      [sample.row + 1, after],
    ]) {
      const probe = imageState(frame(beat, (phrase) => (phrase === scan ? row / size : 1)));
      assert.equal(probe.row, row);
      assert.equal(probe.probeWritten, row > sample.row);
      assert.equal(probe.value, expected);
    }
  }
}
export default { title: 'Low-precision kernels: which value reaches the multiplier?', draw, check };
