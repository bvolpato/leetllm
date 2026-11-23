export const tables = 4;
export const seats = 8;
export const extras = 12;
export const answer = tables * seats + extras;
export const candidates = [32, 32, 44, 48];
export const scored = [
  {
    answer: 44,
    score: 0.82,
  },
  {
    answer: 32,
    score: 0.7,
  },
  {
    answer: 48,
    score: 0.95,
  },
];
export const scores = [0.61, 0.76, 0.78, 0.781, 0.781];
export const prune = [8, 2, 3, 1];
export const budgets = [0, 128, 512, 2048];
export const quality = [0.71, 0.78, 0.83, 0.8];
export const latency = [220, 310, 610, 1840];
export const kvPerToken = 2 * 32 * 8 * 128 * 2;
export const finalRequest = {
  prompt: 3000,
  continuation: 500,
  geometry: { layers: 24, kvHeads: 4, width: 128, scalarBytes: 2 },
  poolBytes: 256 * 2 ** 20,
  answers: [3500, 3500, 6000, 21000, 4500, 5500],
  scores: [0.96, 0.88, 0.82, 0.74, 0.73, 0.69],
};
export const PRUNING_CUE = Object.freeze({
  beatSpan: 18.17,
  audioDuration: 17.52,
  hold: 0.65,
  start: 2.825,
  settle: 7.25,
});
export const PRUNING_MEASURED_TIMELINE = Object.freeze({
  fps: 30,
  duration: 55.6,
  beats: [
    {
      start: 0.4,
      until: 17.896,
    },
    {
      start: 17.896,
      until: 36.066,
    },
    {
      start: 36.066,
      until: 55.27,
    },
  ],
});
