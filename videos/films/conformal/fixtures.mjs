export const PREDICTIONS = [30, 35, 40, 45, 50, 55, 60, 65, 70];
export const ACTUALS = [32, 32, 43, 41, 55, 49, 67, 57, 82];
export const RESIDUALS = PREDICTIONS.map((v, i) => Math.abs(ACTUALS[i] - v));
export const SORTED = [...RESIDUALS].sort((a, b) => a - b);
export const ALPHA = 0.2;
export const RANK = 8;
export const THRESHOLD = 8;
export const DISPLAY_ORDER = [5, 0, 8, 2, 6, 1, 7, 3, 4];
export const TEST_PREDICTIONS = [40, 42, 38, 44];
export const TEST_OUTCOMES = [44, 48, 35, 55];
export const SCALES = [2, 2, 2, 2, 3, 3, 4, 4, 4];
export const TEST_SCALES = [3, 3.5, 2, 6];
export const ROUTER = Array.from(
  {
    length: 9,
  },
  (_, i) => ({
    id: `R${i + 1}`,
    score: (i + 1) / 10,
    wrong: [0, 5, 8].includes(i),
  }),
);
