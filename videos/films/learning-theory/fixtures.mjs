import { growthCeiling, noiseFit, riskAtRatio } from './arithmetic.mjs';
import assert from 'node:assert/strict';
export const n = 40;
export const errors = 4;
export const delta = 0.05;
export const empiricalRisk = errors / n;
export const hoeffdingRadius = (count, confidence = delta) =>
  Math.sqrt(Math.log(2 / confidence) / (2 * count));
export const unionRadius = (hypotheses, count = n, confidence = delta) =>
  Math.sqrt(Math.log((2 * hypotheses) / confidence) / (2 * count));
export const searchCounts = [1, 10, 100, 1000];
export const bounds = searchCounts.map((h) => ({
  hypotheses: h,
  radius: unionRadius(h),
  upper: empiricalRisk + unionRadius(h),
}));
export const triangleFixture = [
  [-55, 45],
  [55, 45],
  [0, -35],
];
export const VC_BEAT_2_SPAN = 14.52 + 0.6;
export const VC_BEAT_3_SPAN = 15.24 + 0.75;
export const repeatedErrors = [4, 8, 11, 5, 9, 7, 12, 6, 10, 3, 9, 20];
export const fixedSampleLosses = Array.from(
  {
    length: 40,
  },
  (_, i) => ([2, 11, 23, 37].includes(i) ? 1 : 0),
);
export function buildNoiseValidation() {
  assert.equal(growthCeiling(10, 3), 176);
  assert.equal(growthCeiling(50, 3), 20876);
  assert.equal(riskAtRatio(2), 1.5);
  assert.equal(Math.ceil(Math.log(2 / 0.05) / (2 * 0.05 ** 2)), 738);
  assert.equal(Math.ceil(Math.log(2000 / 0.05) / (2 * 0.025 ** 2)), 8478);
  const noiseMean = (key) =>
    Array.from(
      {
        length: 256,
      },
      (_, mask) => noiseFit(mask)[key],
    ).reduce((a, b) => a + b) / 256;
  assert.equal(noiseMean('threshold'), 0.4560546875);
  assert.equal(noiseMean('constant'), 0.2734375);
  return {
    noiseMean,
  };
}
export const { noiseMean } = buildNoiseValidation();
