export const QUANT_WEIGHTS = Object.freeze([1.2, 0.61]);
export const CALIBRATION = Object.freeze([
  [5, 4],
  [1, 1],
]);
export const HELD_OUT = Object.freeze([
  [1, 0],
  [0, 1],
]);
export const AWQ_INPUTS = Object.freeze([
  [10, 8, -10, -8],
  [1, -1, 1, -1],
]);
export const DETAIL_SCENES = new Set([
  'budget-inventory',
  'affine-range',
  'codec-contract',
  'group-sum',
  'factor-order',
  'gptq-layout',
  'awq-search',
  'precision-sweep',
  'kernel-path',
  'roofline',
  'precision-roles',
  'pool-subtraction',
  'container-layout',
  'q4k-unpack',
  'offload-count',
  'artifact-lineage',
  'paired-evaluation',
  'diagnose',
  'fresh-quantization',
]);
