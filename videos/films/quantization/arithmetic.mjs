import { AWQ_INPUTS, CALIBRATION, QUANT_WEIGHTS } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { multiplyMatrices, weightedVectorState } from 'vizmatic';
export function squaredOutputError(candidate, inputs = CALIBRATION, reference = QUANT_WEIGHTS) {
  return inputs[0].reduce((sum, _, column) => {
    const residual = reference.reduce(
      (value, w, row) => value + (candidate[row] - w) * inputs[row][column],
      0,
    );
    return sum + residual ** 2;
  }, 0);
}
export function awqReconstruct(factor) {
  const scaled = [0.3 * factor, 2],
    step = Math.max(...scaled.map(Math.abs)) / 7;
  return scaled.map(
    (w, i) => (Math.max(-7, Math.min(7, Math.round(w / step))) * step) / (i === 0 ? factor : 1),
  );
}
export function introLayer(input) {
  const sourceWeight = 0.73,
    code = Math.round(sourceWeight / 0.1),
    weight = 0.1 * code;
  return {
    input,
    sourceWeight,
    code,
    weight,
    source: sourceWeight * input,
    reconstructed: weight * input,
    error: (weight - sourceWeight) * input,
  };
}
export function calibrationHessian(columns = CALIBRATION[0].length) {
  return CALIBRATION.map((row) =>
    CALIBRATION.map(
      (other) =>
        2 * row.slice(0, columns).reduce((total, value, index) => total + value * other[index], 0),
    ),
  );
}
export function quantizationMemory(cacheGiB = 2) {
  const weights = ((7e9 * 4) / 8 + Math.ceil(7e9 / 128) * 2) / 2 ** 30,
    other = 1,
    capacity = 8;
  const total = weights + other + cacheGiB;
  return {
    weights,
    other,
    cache: cacheGiB,
    capacity,
    total,
    fits: total <= capacity,
  };
}
export function gptqFrame({ nearest = 0, first = 0, compensation = 0, last = 0 } = {}) {
  const h = calibrationHessian(),
    det = h[0][0] * h[1][1] - h[0][1] * h[1][0],
    inverse = [
      [h[1][1] / det, -h[0][1] / det],
      [-h[1][0] / det, h[0][0] / det],
    ];
  const [a, b] = QUANT_WEIGHTS;
  const [qa, qb] = QUANT_WEIGHTS.map(Math.round);
  const target = b - ((a - qa) * inverse[1][0]) / inverse[0][0];
  const candidates = [
    [a + (qa - a) * nearest, b + (qb - b) * nearest],
    [a + (qa - a) * first, b + (target - b) * compensation + (Math.round(target) - target) * last],
  ];
  return candidates.map((weights) => ({
    weights,
    residuals: CALIBRATION[0].map((_, column) =>
      weights.reduce((sum, w, row) => sum + (w - QUANT_WEIGHTS[row]) * CALIBRATION[row][column], 0),
    ),
    error: squaredOutputError(weights),
  }));
}
export const awqError = (factor) =>
  squaredOutputError(awqReconstruct(factor), AWQ_INPUTS, [0.3, 2]) / 4;
export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export function roundEven(value) {
  const lower = Math.floor(value),
    fraction = value - lower;
  return fraction === 0.5 ? (lower % 2 === 0 ? lower : lower + 1) : Math.round(value);
}
export function affineGrid(values, lower = -1, upper = 2, qmin = 0, qmax = 15) {
  assert(upper > lower && lower <= 0 && upper >= 0 && qmax > qmin);
  const scale = (upper - lower) / (qmax - qmin),
    zero = Math.max(qmin, Math.min(qmax, qmin - roundEven(lower / scale)));
  const codes = values.map((value) =>
    Math.max(qmin, Math.min(qmax, roundEven(value / scale) + zero)),
  );
  return {
    scale,
    zero,
    codes,
    reconstructed: codes.map((code) => scale * (code - zero)),
  };
}
export function teachingCodec() {
  const codes = [0, -4, 7, -1, 2],
    bytes = new Uint8Array(15),
    view = new DataView(bytes.buffer);
  view.setUint32(0, codes.length, true);
  view.setFloat64(4, 2.4 / 7, true);
  for (let i = 0; i < codes.length; i++)
    bytes[12 + Math.floor(i / 2)] |= (codes[i] & 15) << ((i % 2) * 4);
  return {
    bytes,
    codes,
    count: view.getUint32(0, true),
    scale: view.getFloat64(4, true),
  };
}
export function decodeTeachingCodec(bytes) {
  assert(bytes instanceof Uint8Array && bytes.length >= 12, 'Truncated codec header');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    count = view.getUint32(0, true),
    scale = view.getFloat64(4, true);
  assert(count > 0, 'Invalid zero weight count');
  assert(Number.isFinite(scale) && scale > 0, 'Invalid reconstruction scale');
  assert(bytes.length === 12 + Math.ceil(count / 2), 'Truncated or extra code payload');
  return Array.from(
    {
      length: count,
    },
    (_, i) => {
      const nibble = (bytes[12 + Math.floor(i / 2)] >> ((i % 2) * 4)) & 15,
        code = nibble > 7 ? nibble - 16 : nibble;
      assert(code !== -8, 'Reserved narrow-range code');
      const value = scale * code;
      assert(Number.isFinite(value), 'Reconstruction overflow');
      return value;
    },
  );
}
export function groupedReduction(progress = 1) {
  const codes = [2, -1, 3, 1],
    inputs = [4, 2, -1, 5],
    partials = [
      codes[0] * inputs[0] + codes[1] * inputs[1],
      codes[2] * inputs[2] + codes[3] * inputs[3],
    ];
  const scales = [0.25, 2],
    terms = partials.map((partial, i) => ({
      id: 'group-' + i,
      label: 'group ' + i,
      weight: scales[i],
      values: [partial, 0],
    }));
  const accumulation = weightedVectorState({
    terms,
    progress,
  });
  return {
    codes,
    inputs,
    partials,
    scales,
    accumulation,
    total: accumulation.sum[0],
    wrong: scales[0] * partials.reduce((a, b) => a + b, 0),
  };
}
export function precisionExperiment(bits) {
  const weights = [0.3, -1.2, 2, 0.7],
    inputs = [
      [2, -1, 3],
      [1, 2, -1],
      [-1, 0.5, 2],
      [0.2, -2, 1],
    ],
    qmax = 2 ** (bits - 1) - 1,
    scale = 2 / qmax;
  const codes = weights.map((w) => Math.max(-qmax, Math.min(qmax, roundEven(w / scale)))),
    restored = codes.map((q) => q * scale);
  const residuals = inputs[0].map((_, column) =>
    weights.reduce((sum, w, row) => sum + (w - restored[row]) * inputs[row][column], 0),
  );
  return {
    bits,
    weights,
    inputs,
    qmax,
    scale,
    codes,
    restored,
    residuals,
    mse: residuals.reduce((a, v) => a + v * v, 0) / 3,
    payload: Math.ceil((weights.length * bits) / 8),
  };
}
export function nominalRoofline(name) {
  const { bandwidth, dense } = {
    A100: {
      bandwidth: 2.039e12,
      dense: 312e12,
    },
    H100: {
      bandwidth: 3.35e12,
      dense: 989.5e12,
    },
  }[name];
  return {
    bandwidth,
    dense,
    ridge: dense / bandwidth,
    intensityOneShare: bandwidth / dense,
    bf16Milliseconds: (54e9 / bandwidth) * 1000,
    compactMilliseconds: (13.921875e9 / bandwidth) * 1000,
  };
}
export function cachePool(weightGB, includeRecurrent = false) {
  const attention = 2 * 16 * 4 * 256 * 5120 * 2,
    recurrent = 48 * 48 * 128 * 128 * 4,
    perUser = attention + (includeRecurrent ? recurrent : 0),
    pool = (80 - 8 - weightGB) * 1e9;
  return {
    weightGB,
    pool,
    attention,
    recurrent,
    perUser,
    users: Math.floor(pool / perUser),
  };
}
export function trailingPlacement(blocks, slots) {
  assert(Number.isInteger(blocks) && blocks >= 0 && Number.isInteger(slots) && slots >= 0);
  const start = Math.max(blocks + 1 - slots, 0);
  return {
    start,
    input: 'CPU',
    gpuBlocks: Array.from(
      {
        length: blocks,
      },
      (_, i) => i,
    ).filter((i) => i >= start),
    outputGPU: slots > 0,
  };
}
export function freshQuantizationBudget(cache = 4) {
  const codes = (6e9 * 4) / 8 / 1e9,
    scales = ((6e9 / 64) * 2) / 1e9,
    blockWeights = (6e9 * 4.5) / 8 / 1e9,
    other = 0.75,
    capacity = 8;
  return {
    codes,
    scales,
    blockWeights,
    other,
    cache,
    capacity,
    totalA: codes + scales + other + cache,
    totalB: blockWeights + other + cache,
  };
}
export function deferredBlockUpdate(progress = 1) {
  const errors = [
      [0.2, -0.1],
      [0.1, 0.3],
    ],
    crossFactor = [
      [0.5, -0.25, 0.2],
      [0.1, 0.4, -0.3],
    ],
    before = [
      [0.8, -0.4, 1.3],
      [0.7, 1.1, -0.6],
    ];
  const product = multiplyMatrices(errors, crossFactor);
  const after = before.map((row, i) => row.map((v, j) => v - product[i][j] * clamp01(progress)));
  return {
    errors,
    crossFactor,
    before,
    product,
    after,
  };
}
