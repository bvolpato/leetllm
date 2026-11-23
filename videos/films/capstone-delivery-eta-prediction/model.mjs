import { clock } from './arithmetic.mjs';
import { orders, scans } from './fixtures.mjs';
export function admitted(cutoff) {
  return scans.filter((row) => row.event <= cutoff && row.available <= cutoff);
}
export function decisions(threshold, ageRule = false) {
  return orders.map((row) => {
    const warn = ageRule ? row.age >= 18 : row.risk >= threshold;
    return {
      ...row,
      warn,
      penalty: warn && !row.late ? 8 : !warn && row.late ? row.miss : 0,
    };
  });
}
export function historySummary(durations) {
  return {
    count: durations.length,
    earliest: clock((10 + Math.min(...durations)) % 24),
    latest: clock((10 + Math.max(...durations)) % 24),
  };
}
