import {
  A,
  B,
  R,
  blellochTrace,
  exclusive,
  f,
  onlineSoftmax,
  reductionLevels,
  scanLevels,
  shuffleLevels,
} from './arithmetic.mjs';
export const ARTICLE_INPUT = Object.freeze([3, -1, 4, 1, 5, -9, 2, 6]);
export const INPUT = ARTICLE_INPUT;
export const REDUCTION = reductionLevels(INPUT);
export const SCAN = scanLevels(INPUT.slice(0, 4));
export const SHUFFLE = shuffleLevels(INPUT);
export const LEFT = f(f(A + B) + R);
export const RIGHT = f(A + f(B + R));
export const FIRST = onlineSoftmax([[2, 1]]);
export const ALL = onlineSoftmax([
  [2, 1],
  [4, 0],
]);
export const ARTICLE_PREFIX = Object.freeze(exclusive(ARTICLE_INPUT));
export const ODD_ROW = Object.freeze([2, -3, 5, 1, -2, 4, 6]);
export const SWAPPED_ROW = Object.freeze(
  ODD_ROW.map((v, i) => (i === 3 ? ODD_ROW[5] : i === 5 ? ODD_ROW[3] : v)),
);
export const BLELLOCH = blellochTrace();
export function buildAttentionFixture() {
  const ATTENTION = {
    old: FIRST.denominator * Math.exp(-2),
    fresh: 1 + Math.exp(-4),
  };
  ATTENTION.total = ATTENTION.old + ATTENTION.fresh;
  ATTENTION.output = [ATTENTION.old / ATTENTION.total, ATTENTION.fresh / ATTENTION.total];
  return {
    ATTENTION,
  };
}
export const { ATTENTION } = buildAttentionFixture();
