export const IDS = [
  'opening',
  'boundary',
  'sft',
  'group-credit',
  'trajectory-datum',
  'lora-path',
  'clock',
  'snapshots',
];
export const FULL = Object.freeze([10, 11, 20, 21]);
export const INPUTS = FULL.slice(0, -1);
export const TARGETS = FULL.slice(1);
export const TARGET_WEIGHTS = Object.freeze([0, 1, 1]);
export const CLAMP_CASES = Object.freeze([
  [-1, 0, 2, 0],
  [1, 0, 2, 1],
  [3, 0, 2, 2],
  [3, 2, 2, 2],
  [-4, -3, -1, -3],
]);
export const SAMPLE_FIXTURE = Object.freeze({
  x: 3,
  lo: 0,
  hi: 2,
  expected: 2,
});
export const SAMPLE_LOGPROBS = Object.freeze([0, -0.4, -0.8]);
export const SAMPLE_ADVANTAGES = Object.freeze([0, 0.5, 0.5]);
export const ACTION_MASK = Object.freeze([0, 1, 1]);
export const SENTENCES = {
  opening: [3, 3, 2],
  'capability-receipt': [3, 4],
  boundary: [2, 3, 4],
  'primitive-receipts': [5, 4],
  'async-contract': [5, 4],
  'chunk-order': [3, 5, 3],
  sft: [4, 3, 4],
  'datum-validation': [2, 4, 4],
  'group-credit': [3, 3, 3],
  'uniform-groups': [3, 4],
  'trajectory-datum': [3, 4, 4],
  'trajectory-branch': [4, 4],
  'loss-boundary': [4, 4, 4],
  'lora-path': [3, 3, 3],
  'lora-geometry': [5, 5, 4, 5],
  'lora-evidence': [4, 4],
  clock: [3, 3, 4],
  'queue-recovery': [5, 4, 4],
  snapshots: [4, 3, 5],
  'artifact-contract': [4, 4, 4],
  'data-terms': [4, 3, 4],
  'source-responsibility': [5, 5, 3],
  'local-evidence': [3, 3],
  'transport-comparison': [3, 4],
  'fresh-run': [6, 6],
};
export const X = [1, 2, -1, 0, 1, -2];
export const BASE_OUTPUT = [1, 2, -1, 0];
export const A2 = [
  [1, 0, 1, 0, 0, 0],
  [0, 1, 0, 1, 0, 0],
];
export const A4 = [...A2, [0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 1]];
export const B2 = [
  [1, 0],
  [0, 1],
  [1, -1],
  [-1, 1],
];
export const B4 = [
  [1, 0, 1, 0],
  [0, 1, 0, 0],
  [1, -1, 0, 1],
  [-1, 1, 0, 0],
];
