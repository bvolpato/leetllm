export const SETTINGS = Object.freeze({
  sgd: 0.018,
  momentum: 0.018,
  adam: 0.08,
  beta1: 0.9,
  beta2: 0.999,
  epsilon: 1e-8,
});
export const loss = ([a, b]) => (100 * a * a + b * b) / 2;
export const gradient = ([a, b]) => [100 * a, b];
export const scheduledRate = (k) =>
  k < 4 ? (0.08 * k) / 4 : 0.04 * (1 + Math.cos((Math.PI * (k - 4)) / 35));
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const point = (w) => ({
  x: w[0],
  y: w[1],
});
export const vector = (p) => [p.x, p.y];
export const fmt = (v, digits = 3) =>
  Math.abs(v) < 0.5 * 10 ** -digits ? '0' : Number(v.toFixed(digits)).toString();
export const pair = (w, digits = 3) => '(' + w.map((v) => fmt(v, digits)).join(', ') + ')';
export const texPair = (w, digits = 3) =>
  '\\left(' + w.map((v) => fmt(v, digits)).join(',\\;') + '\\right)';
export function simulate(
  kind,
  { steps = 40, start = [1, 1], rate = SETTINGS[kind], decay = 0, coupled = 0 } = {},
) {
  let w = [...start],
    m = [0, 0],
    v = [0, 0];
  const records = [];
  for (let t = 1; t <= steps; t++) {
    const before = [...w],
      oldMean = [...m],
      oldSquare = [...v],
      dataGradient = gradient(w);
    const g = dataGradient.map((x, j) => x + coupled * w[j]);
    const eta = typeof rate === 'function' ? rate(t - 1) : rate;
    if (kind !== 'sgd') m = m.map((x, j) => 0.9 * x + 0.1 * g[j]);
    if (kind === 'adam') v = v.map((x, j) => 0.999 * x + 0.001 * g[j] ** 2);
    const correctedMean = m.map((x) => x / (1 - 0.9 ** t));
    const correctedSquare = v.map((x) => x / (1 - 0.999 ** t));
    const scale = correctedSquare.map(Math.sqrt);
    const direction =
      kind === 'sgd'
        ? g
        : kind === 'momentum'
          ? m
          : correctedMean.map((x, j) => x / (scale[j] + SETTINGS.epsilon));
    const dataUpdate = direction.map((x) => -eta * x),
      shrink = w.map((x) => -eta * decay * x);
    const update = dataUpdate.map((x, j) => x + shrink[j]);
    w = w.map((x, j) => x + update[j]);
    records.push({
      t,
      eta,
      before,
      oldMean,
      oldSquare,
      gradient: g,
      dataGradient,
      mean: [...m],
      square: [...v],
      correctedMean,
      correctedSquare,
      scale,
      normalized: direction,
      dataUpdate,
      shrink,
      update,
      next: [...w],
      loss: loss(w),
    });
  }
  return {
    kind,
    start: [...start],
    records,
    points: [point(start), ...records.map((r) => point(r.next))],
  };
}
export function scalarAdamWStep({
  weight,
  gradient,
  mean = 0,
  square = 0,
  count = 0,
  rate = 0.1,
  decay = 0.01,
  epsilon = 1e-8,
}) {
  if (gradient === null)
    return {
      weight,
      mean,
      square,
      count,
      dataStep: 0,
      shrink: 0,
      skipped: true,
    };
  const nextMean = 0.9 * mean + 0.1 * gradient,
    nextSquare = 0.999 * square + 0.001 * gradient ** 2,
    nextCount = count + 1;
  const dataStep =
    (rate * (nextMean / (1 - 0.9 ** nextCount))) /
    (Math.sqrt(nextSquare / (1 - 0.999 ** nextCount)) + epsilon);
  const shrink = rate * decay * weight;
  return {
    weight: weight - dataStep - shrink,
    mean: nextMean,
    square: nextSquare,
    count: nextCount,
    dataStep,
    shrink,
    skipped: false,
  };
}
export function trajectory(kind, steps = 40) {
  return simulate(kind, {
    steps,
  }).points;
}
export function optimizerFirstStep(kind, start = [1, 1]) {
  const r = simulate(kind, {
    start,
    steps: 1,
  }).records[0];
  return {
    ...r,
    start: [...start],
  };
}
