export const sum = (a) => a.reduce((x, y) => x + y, 0);
export function prefillCohortWork(hitLength = 2048, missLength = 2048) {
  const hit = 400 * hitLength * 0.25,
    miss = 400 * missLength,
    total = hit + miss;
  return {
    hit,
    miss,
    total,
    gpus: Math.ceil(total / 20000),
  };
}
export function correctionDistribution(target, draft) {
  const residual = target.map((p, i) => Math.max(0, p - draft[i])),
    mass = sum(residual);
  return {
    residual,
    mass,
    probabilities: mass ? residual.map((p) => p / mass) : null,
  };
}
export function completeTraceQuantiles() {
  const rows = Array.from(
    {
      length: 20,
    },
    (_, i) => ({
      id: i + 1,
      a: i === 0 ? 100 : 1,
      b: i === 1 ? 100 : 1,
    }),
  );
  const percentile = (values) =>
    [...values].sort((a, b) => a - b)[Math.ceil(0.95 * values.length) - 1];
  return {
    rows: rows.map((r) => ({
      ...r,
      total: r.a + r.b,
    })),
    rank: 19,
    complete: percentile(rows.map((r) => r.a + r.b)),
    stageSum: percentile(rows.map((r) => r.a)) + percentile(rows.map((r) => r.b)),
  };
}
