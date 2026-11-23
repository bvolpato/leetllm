export const TAU = Math.PI * 2;
export const CENTERS = [
  [-1.45, -0.65],
  [1.45, -0.65],
  [0, 1.25],
];
export const CLEAN_VARIANCE = 0.07;
export const MAX_ADDED_VARIANCE = 3;
export const SCORE_PROBE = Object.freeze([0.2, -0.4]);
export const TOP_PIXEL = 5 * 16 + 3;
export const SHADOW_PIXEL = 10 * 16 + 7;
export const ORIGINAL_SCENES = new Set([
  'intro',
  'forward',
  'coefficients',
  'training',
  'reverse',
  'score',
  'transport',
  'samplers',
  'conditioning',
  'guidance',
  'latent',
  'compute',
  'reproducibility',
  'recap',
]);
