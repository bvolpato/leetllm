import { parseReport } from './arithmetic.mjs';
export const REPORT = parseReport();
export const CANDIDATE_POOL = Object.freeze(
  [true, false, true, false, false].map((passed, i) => ({
    id: 'C' + i,
    passed,
  })),
);
export const CANDIDATE_PAIRS = Object.freeze(
  CANDIDATE_POOL.flatMap((left, i) =>
    CANDIDATE_POOL.slice(i + 1).map((right) => ({
      ids: [left.id, right.id],
      successful: left.passed || right.passed,
    })),
  ),
);
