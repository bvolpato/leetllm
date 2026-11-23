export const logFact = (n) =>
  Array.from(
    {
      length: n,
    },
    (_, i) => Math.log(i + 1),
  ).reduce((a, v) => a + v, 0);
export const betaConstants = new Map();
export function betaDensity(a, b, p) {
  if (p < 0 || p > 1) return 0;
  if (p === 0) return a === 1 ? b : 0;
  if (p === 1) return b === 1 ? a : 0;
  const key = a + ',' + b;
  let c = betaConstants.get(key);
  if (c === undefined) {
    c = logFact(a + b - 1) - logFact(a - 1) - logFact(b - 1);
    betaConstants.set(key, c);
  }
  return Math.exp(c + (a - 1) * Math.log(p) + (b - 1) * Math.log1p(-p));
}
export const area = (a, b, low = 0, high = 1) => {
  const n = 1600,
    h = (high - low) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++)
    sum += betaDensity(a, b, low + i * h) * (i === 0 || i === n ? 0.5 : 1);
  return sum * h;
};
export const betaVariance = (a, b) => (a * b) / ((a + b) ** 2 * (a + b + 1));
export function betaTailProbability(a, b, threshold = 0.7) {
  if (threshold <= 0) return 1;
  if (threshold >= 1) return 0;
  const n = a + b - 1;
  let probability = 0;
  for (let j = 0; j < a; j++)
    probability += Math.exp(
      logFact(n) -
        logFact(j) -
        logFact(n - j) +
        j * Math.log(threshold) +
        (n - j) * Math.log1p(-threshold),
    );
  return probability;
}
export const weightedArea = (high) => {
  const n = 400,
    h = high / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const x = i * h;
    sum += x * betaDensity(10, 4, x) * (i === 0 || i === n ? 0.5 : 1);
  }
  return sum * h;
};
export function integrate(fn, low = 0, high = 1, n = 1280) {
  if (high <= low) return 0;
  const h = (high - low) / n;
  let sum = fn(low) + fn(high);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * fn(low + i * h);
  return (sum * h) / 3;
}
export function betaQuantile(a, b, probability) {
  let low = 0,
    high = 1;
  for (let i = 0; i < 60; i++) {
    const m = (low + high) / 2;
    if (1 - betaTailProbability(a, b, m) < probability) low = m;
    else high = m;
  }
  return (low + high) / 2;
}
export function rootOnBranch(fn, target, low, high, increasing) {
  for (let i = 0; i < 55; i++) {
    const m = (low + high) / 2;
    if (fn(m) < target === increasing) low = m;
    else high = m;
  }
  return (low + high) / 2;
}
