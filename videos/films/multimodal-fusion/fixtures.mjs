export const PATCH_SIZE = 14;
export const IMAGE_224 = 224;
export const IMAGE_336 = 336;
export const VISUAL_TOKENS_224 = (IMAGE_224 / PATCH_SIZE) ** 2;
export const VISUAL_TOKENS_336 = (IMAGE_336 / PATCH_SIZE) ** 2;
export const TEXT_TOKENS = 2200;
export const CONTEXT_LIMIT = 4096;
export const OUTPUT_RESERVE = 300;
export const MAX_PREFIX = CONTEXT_LIMIT - OUTPUT_RESERVE;
export const VIEWS = 5;
export const DASHBOARD = Object.freeze({
  hours: [1, 2, 3, 4, 5, 6],
  afterHour: 3,
  series: [
    {
      name: 'Line A',
      tone: 'blue',
      values: [3.4, 3.8, 4.1, 3.9, 3.5, 3.2],
    },
    {
      name: 'Line B',
      tone: 'green',
      values: [5.4, 5.3, 5.2, 6.4, 7.7, 9.0],
    },
    {
      name: 'Line C',
      tone: 'pink',
      values: [8.3, 7.8, 7.4, 7.2, 7.0, 6.8],
    },
  ],
});
export const TEXT_STATE = [0.2, 0.1, 0.7];
export const VISUAL_KEYS = [
  [0.2, 0.05, 0.75],
  [0.8, 0.1, 0.1],
  [0.05, 0.9, 0.05],
];
export const VISUAL_VALUES = [
  [0.1, 0.0, 0.9],
  [0.8, 0.1, 0.1],
  [0.1, 0.8, 0.1],
];
export const CROP_CANDIDATES = [
  { name: 'global', label: 'Global thumbnail', score: 0.01, tone: 'blue' },
  { name: 'axis', label: 'Time axis', score: 0.96, tone: 'yellow' },
  { name: 'badge', label: 'Paging badge', score: 0.85, tone: 'pink' },
  { name: 'blank', label: 'Empty margin', score: 0.02, tone: 'muted' },
];
export const FRESH_CLOCK = { deploy: [200, 220], firstRise: [221, 250], revisedRise: [220, 250] };
export const EXPANDED_SCENES = new Set([
  'case-contract',
  'decoded-budget',
  'encoder-directions',
  'multi-block-interface',
  'score-work',
  'zero-insertion',
  'training-stages',
  'joint-and-posttraining',
  'adaptive-crops',
  'audio-clock',
  'evidence-time',
  'artifact-lineage',
  'cache-lifetime',
  'cache-bytes',
  'ready-recovery',
  'safety-boundary',
  'diagnosis-release',
  'fresh-incident',
]);
