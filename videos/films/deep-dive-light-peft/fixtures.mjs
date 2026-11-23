export const IDS = [
  'opening',
  'cost',
  'handoff',
  'heads',
  'ffn',
  'adapter',
  'evidence',
  'deployment',
];
export const HEAD_SCORES = Object.freeze([0.91, 0.08, 0.72, 0.54]);
export const FFN = Object.freeze([
  {
    id: 'L0-n1',
    score: 0.07,
    layer: 0,
  },
  {
    id: 'L0-n2',
    score: 0.63,
    layer: 0,
  },
  {
    id: 'L0-n3',
    score: 0.42,
    layer: 0,
  },
  {
    id: 'L1-n1',
    score: 0.15,
    layer: 1,
  },
  {
    id: 'L1-n2',
    score: 0.31,
    layer: 1,
  },
]);
export const MODULE_SCORES = Object.freeze([0.04, 0.31, 0.11]);
export const RANK_SCORES = Object.freeze([0.02, 0.17, 0.03, 0.22]);
export const MODULE_RATIO = 0.33;
export const RANK_RATIO = 0.5;
export const HEAD_CUT = 0.25;
export const FFN_CUT = 0.4;
export const TABLE1 = Object.freeze([
  {
    name: 'Baseline LoRA',
    retained: 100,
    average: 93.3,
    speed: 1.0,
  },
  {
    name: 'Light · 72%',
    retained: 72,
    average: 92.2,
    speed: 1.4,
  },
  {
    name: 'Light · 67%',
    retained: 67,
    average: 91.9,
    speed: 1.6,
  },
]);
export const FIGURE4 = Object.freeze({
  retained: 67,
  weightMemory: 32,
  activationMemory: 40,
  peakMemory: 39,
  speed: 2.2,
});
export const TABLE5 = Object.freeze({
  model: 'OPT-6.7B',
  retained: 52,
  modules: 48,
  inferenceSpeed: 1.6,
  loadMemory: 6.4,
  baselineMemory: 12.5,
});
export const IDENTITY_FIXTURE = Object.freeze({
  baseA: [0, 2, 3],
  baseB: [0, 1, 3],
});
export const TOKEN_COST = Object.freeze({
  qkv: 3 * 8 * 8,
  output: 8 * 8,
  ffnUp: 8 * 32,
  ffnDown: 32 * 8,
});
export const CENTERED_SCORE_DIFFERENCE = {
  paperMagnitude: Math.abs(2) + Math.abs(-2),
  trainerSignedMean: Math.abs((2 + -2) / 2),
};
