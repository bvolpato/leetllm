export const clamp = (p) => Math.max(0, Math.min(1, p));
export const motion = (p) => {
  const q = clamp((p - 0.08) / 0.68);
  return q * q * (3 - 2 * q);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export const pipeline = (values) => ({
  input: [...values],
  affine: values.map((x) => 2 * x + 1),
  squares: values.map((x) => (2 * x + 1) ** 2),
  result: sum(values.map((x) => (2 * x + 1) ** 2)),
});
export function schedule(safe) {
  const ops = [
      ['copy', 'copy', 3],
      ['affine', 'compute', 4],
      ['square', 'compute', 2],
      ['reduce', 'compute', 1],
    ],
    ready = {},
    times = {};
  ops.forEach(([name, stream, duration], issue) => {
    const dependency = name === 'affine' && safe ? times.copy.end : 0,
      start = Math.max(issue, ready[stream] ?? 0, dependency);
    times[name] = {
      start,
      end: start + duration,
      stream,
    };
    ready[stream] = start + duration;
  });
  return times;
}
export const graphPrices = Object.freeze({ setupUs: 12000, eagerUs: 18, replayUs: 12 });
export function graphCost(n) {
  const { eagerUs, replayUs, setupUs } = graphPrices;
  return {
    n,
    eager: (n * eagerUs) / 1000,
    graph: (setupUs + n * replayUs) / 1000,
  };
}
export function eventOverlap(progress) {
  const clock = 10 * clamp(progress),
    chain = schedule(true);
  return {
    clock,
    operations: [
      ...Object.entries(chain).map(([id, row]) => ({
        id,
        ...row,
      })),
      {
        id: 'independent',
        start: 2,
        end: 8,
        stream: 'other',
      },
    ].map((row) => ({
      ...row,
      visible: clock > row.start,
      shownEnd: Math.min(row.end, clock),
    })),
  };
}
export function replayOwnership(progress) {
  const p = clamp(progress),
    consumed = p >= 0.45,
    overwritten = p >= 0.8;
  return {
    consumer: 'CPU-1',
    outputAllocation: 'O',
    oldGeneration: 'O1',
    oldValue: pipeline([0, 0, 0, 0]).result,
    consumed,
    overwritten,
    readReceipt: consumed ? 4 : null,
    storedGeneration: overwritten ? 'O2' : 'O1',
    storedValue: overwritten ? pipeline([1, 1, 1, 1]).result : 4,
  };
}
export function paddingEffects(masked, transformed, guarded = false) {
  const result = pipeline([1, 2, 3, 4, 5, 6, 0, 0]),
    writes = transformed
      ? result.squares
          .map((value, index) => ({
            slot: index,
            owner: index < 6 ? 'R' + (index + 1) : 'FOREIGN',
            value,
            authorized: index < 6,
          }))
          .filter((row) => !guarded || row.authorized)
      : [];
  return {
    writes,
    unauthorized: writes.filter((row) => !row.authorized),
    total: sum(result.squares.filter((_, i) => !masked || i < 6)),
  };
}
export function bucketFor(request, pool = [1, 2, 4, 8, 16]) {
  return pool.find((n) => n >= request) ?? null;
}
export function runtimeFreshState({ copy = false, mask = false } = {}) {
  const input = copy ? [-1, 0, 2, 0] : [1, 2, 3, 4],
    valid = mask ? [1, 1, 1, 0] : [1, 1, 1, 1],
    squares = pipeline(input).squares;
  return {
    allocation: 'A',
    maskAllocation: 'M',
    outputAllocation: 'O',
    input,
    valid,
    squares,
    total: sum(squares.map((x, i) => x * valid[i])),
  };
}
