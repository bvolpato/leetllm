import {
  decode8,
  encode8,
  floatAdds,
  grids,
  halfAdds,
  roundTrip,
  roundedOverflow,
  stochasticNeighbor,
  sum,
} from './encoding.mjs';
import { extendedIds, ids } from './fixtures.mjs';
import {
  blockContraction,
  experiment,
  freshGroupWorksheet,
  orientationWorksheet,
  projection,
} from './model.mjs';
import { sampleModel, sampleOriginalModel } from './construction.mjs';
import assert from 'node:assert/strict';
export const close = (a, b, tolerance = 1e-10) =>
  assert(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);
export function validateOriginalModel() {
  close(decode8(0x38), 1);
  close(decode8(0x7e), 448);
  close(decode8(1), 2 ** -9);
  assert(Number.isNaN(decode8(0x7f)));
  assert(Number.isNaN(decode8(0x80, 'fnuz')));
  assert(Object.is(decode8(0x80), -0));
  close(decode8(0x38, 'fnuz'), 0.5);
  assert.equal(encode8(1.0625).code, 0x38);
  assert.equal(encode8(1.1875).code, 0x3a);
  for (const format of ['ocp', 'fnuz'])
    for (const item of grids[format]) close(encode8(item.value, format).value, item.value);
  assert.equal(encode8(500).value, 448);
  assert.equal(encode8(1, 'fnuz').code, 0x40);
  close(roundTrip(500, 10 / 448).reconstructed, 10);
  close(roundTrip(500, 500 / 448).reconstructed, 500);
  close(experiment.tensor[0][0].reconstructed, 0);
  close(experiment.block[0][0].reconstructed, 0.0009765625);
  close(experiment.block[1][3].reconstructed, 512);
  close(experiment.reference[1], 7.75);
  close(experiment.blockOutput[1], 7.75);
  assert.deepEqual(experiment.scales, [2 ** -8, 2]);
  assert.deepEqual(projection(true).original.slice(-1), [500]);
  assert.deepEqual(projection(true).reconstructed.slice(-1), [512]);
  assert.deepEqual(halfAdds, [1024, 1024, 1024, 1024, 1024]);
  assert.deepEqual(floatAdds, [1024, 1024.25, 1024.5, 1024.75, 1025]);
  assert.deepEqual([blockContraction().correct, blockContraction().wrong], [34, 25]);
  for (const id of ids)
    for (const beat of [0, 1, 2])
      for (const beatP of [0, 1e-9, 0.119999, 0.12, 0.399999, 0.4, 0.5, 0.819999, 0.82, 0.999999]) {
        const s = sampleOriginalModel(id, {
          beat,
          beatP,
        });
        assert.equal(s.step, beat);
        if (id === 'projection') {
          close(s.original, s.trace.original[s.count]);
          close(s.reconstructed, s.trace.reconstructed[s.count]);
        }
        if (id === 'traffic') {
          assert.equal(s.packed, 66);
          assert(s.written <= 256 && s.reread <= 256);
          assert(s.reread === 0 || s.written === 256);
        }
        if (id === 'block-scales') close(s.running, sum(s.contributions.slice(0, s.ready)));
        if (id === 'contract') assert.equal(s.result, beat === 0 ? 1 : 2);
      }
  for (const id of ids) {
    for (let beat = 0; beat < 2; beat++)
      assert.deepEqual(
        sampleOriginalModel(id, {
          beat,
          beatP: 1,
        }),
        sampleOriginalModel(id, {
          beat: beat + 1,
          beatP: 0,
        }),
      );
    assert.equal(
      sampleOriginalModel(id, {
        beat: 2,
        beatP: 1,
      }).q,
      1,
    );
  }
  return true;
}
export function validateModel() {
  validateOriginalModel();
  assert.equal(roundedOverflow(449).result, 448);
  assert.equal(roundedOverflow(449).overflow, false);
  assert.equal(roundedOverflow(465).rounded, 480);
  assert.equal(roundedOverflow(465).result, 448);
  assert(
    Number.isNaN(
      roundedOverflow(465, {
        saturate: false,
      }).result,
    ),
  );
  assert.equal(
    roundedOverflow(65536, {
      saturate: false,
      format: 'e5m2',
    }).result,
    Infinity,
  );
  close(stochasticNeighbor(1.01).p, 0.08);
  close(stochasticNeighbor(1.01).expected, 1.01);
  const o = orientationWorksheet();
  assert.equal(o.rowScales[0], 2);
  assert.equal(o.columnScales[1], 2 ** -8);
  assert.equal(o.rowTiny.reconstructed, 0);
  assert.equal(o.columnTiny.reconstructed, 0.0009765625);
  const f = freshGroupWorksheet();
  assert.deepEqual(
    [f.scale, f.tiny.reconstructed, f.spike.reconstructed, f.zeroScale],
    [2, 0, 704, 1],
  );
  const split = freshGroupWorksheet(true);
  assert.deepEqual(split.scales, [2 ** -18, 2]);
  assert.equal(split.tiny.reconstructed, 0.0009765625);
  assert.equal(split.spike.reconstructed, f.spike.reconstructed);
  const mixed = projection();
  const productErrors = mixed.reconstructedTerms.map((term, i) => term - mixed.originalTerms[i]);
  assert.deepEqual(productErrors, Array(4).fill([0, 0, 0, -0.75, 0, 0, 0, 0.75]).flat());
  for (const id of extendedIds)
    for (
      let beat = 0;
      beat <
      (id === 'format-budget'
        ? 4
        : id === 'online-quantization' || id === 'orientation' || id === 'reference-ladder'
          ? 2
          : 3);
      beat++
    )
      for (const beatP of [0, 0.1, 0.5, 0.99, 1]) {
        const s = sampleModel(id, {
          beat,
          beatP,
        });
        assert(s.q >= 0 && s.q <= 1);
      }
  for (const name of ['Scale', 'Tiny', 'Spike', 'Zero'])
    assert.equal(
      sampleModel('fresh-group', {
        beat: 0,
        beatP: 1,
      })['show' + name],
      false,
    );
  return true;
}
