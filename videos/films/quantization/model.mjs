import { HELD_OUT, QUANT_WEIGHTS } from './fixtures.mjs';
import {
  affineGrid,
  awqError,
  cachePool,
  decodeTeachingCodec,
  freshQuantizationBudget,
  gptqFrame,
  groupedReduction,
  introLayer,
  precisionExperiment,
  roundEven,
  squaredOutputError,
  teachingCodec,
  trailingPlacement,
} from './arithmetic.mjs';
import assert from 'node:assert/strict';
export function validateDetailedQuantization() {
  const affine = affineGrid([-2, -1, 0, 0.73, 2, 3]);
  assert.equal(affine.zero, 5);
  assert.deepEqual(affine.codes, [0, 0, 5, 9, 15, 15]);
  assert.deepEqual(
    affineGrid([-2, -1, 0, 0.73, 2, 3], -1, 2, -8, 7).reconstructed,
    affine.reconstructed,
  );
  assert.equal(roundEven(-2.5), -2);
  assert.equal(roundEven(3.5), 4);
  const codec = teachingCodec();
  assert.deepEqual(Array.from(codec.bytes.slice(12)), [192, 247, 2]);
  assert.equal(decodeTeachingCodec(codec.bytes).length, 5);
  const truncated = codec.bytes.slice();
  truncated[0] = 7;
  assert.throws(() => decodeTeachingCodec(truncated), /payload/);
  const reserved = codec.bytes.slice();
  reserved[12] = 0xc8;
  assert.throws(() => decodeTeachingCodec(reserved), /Reserved/);
  assert.equal(groupedReduction().total, 5.5);
  assert.equal(groupedReduction().wrong, 2);
  assert(Math.abs(precisionExperiment(2).mse - 1.0072) < 1e-12);
  assert(Math.abs(precisionExperiment(4).mse - 0.06700952380952381) < 1e-12);
  assert.equal(cachePool(54).users, 53);
  assert.equal(cachePool(13.92).users, 173);
  assert.equal(cachePool(13.92, true).users, 119);
  assert.deepEqual(trailingPlacement(12, 5).gpuBlocks, [8, 9, 10, 11]);
  assert.equal(freshQuantizationBudget().totalA, 7.9375);
  assert.equal(freshQuantizationBudget().totalB, 8.125);
  assert.equal(freshQuantizationBudget(3.875).totalB, 8);
}
export function validateModel() {
  assert(
    Math.abs(
      gptqFrame({
        nearest: 1,
      })[0].error - 0.5402,
    ) < 1e-12,
  );
  assert(
    Math.abs(
      gptqFrame({
        first: 1,
        compensation: 1,
      })[1].weights[1] - 1.51,
    ) < 1e-12,
  );
  assert(
    Math.abs(
      gptqFrame({
        first: 1,
        compensation: 1,
        last: 1,
      })[1].error - 0.5002,
    ) < 1e-12,
  );
  const layer = introLayer(1.5);
  assert.equal(layer.code, 7);
  assert(Math.abs(layer.reconstructed - 1.05) < 1e-12);
  assert(Math.abs(layer.error + 0.045) < 1e-12);
  assert.equal((7e9 * 16) / 8 / ((7e9 * 4) / 8), 4);
  assert.equal(16 / (128 * 4), 0.03125);
  const source = [0.15, -1.22, 2.4, -0.45, 0.73],
    scale = 2.4 / 7,
    codes = source.map((w) => Math.max(-7, Math.min(7, Math.round(w / scale)))),
    packed = [];
  for (let i = 0; i < codes.length; i += 2)
    packed.push((codes[i] & 15) | (((codes[i + 1] ?? 0) & 15) << 4));
  assert.deepEqual(codes, [0, -4, 7, -1, 2]);
  assert.deepEqual(packed, [0xc0, 0xf7, 0x02]);
  const unpacked = packed
    .flatMap((byte) => [byte & 15, byte >> 4])
    .slice(0, codes.length)
    .map((code) => (code > 7 ? code - 16 : code));
  assert.deepEqual(unpacked, codes);
  const h = [
      [82, 18],
      [18, 4],
    ],
    det = h[0][0] * h[1][1] - h[0][1] ** 2,
    inv = [
      [h[1][1] / det, -h[0][1] / det],
      [-h[1][0] / det, h[0][0] / det],
    ];
  const corrected = QUANT_WEIGHTS.map(
    (w, i) => w - ((QUANT_WEIGHTS[0] - 1) / inv[0][0]) * inv[i][0],
  );
  assert(Math.abs(corrected[1] - 1.51) < 1e-12);
  assert(squaredOutputError([1, 2]) < squaredOutputError([1, 1]));
  assert(squaredOutputError([1, 2], HELD_OUT) > squaredOutputError([1, 1], HELD_OUT));
  assert(Math.abs(awqError(1) - 0.016734693877551) < 1e-12);
  assert(Math.abs(awqError(8) - 0.003265306122449) < 1e-12);
  for (const factor of [1, 2, 4, 8]) assert.equal(0.3 * factor * (10 / factor), 3);
  validateDetailedQuantization();
  return true;
}
