export function predictsMask(separator, point) {
  return separator.a * point[0] + separator.b * point[1] >= separator.threshold;
}
export const riskAtRatio = (ratio) =>
  ratio < 1 ? ratio / (1 - ratio) : 1 - 1 / ratio + 1 / (ratio - 1);
export const choose = (n, k) =>
  k > n
    ? 0
    : Array.from(
        {
          length: k,
        },
        (_, i) => (n - i) / (i + 1),
      ).reduce((a, b) => a * b, 1);
export const growthCeiling = (n, d) =>
  Array.from(
    {
      length: Math.min(n, d) + 1,
    },
    (_, k) => choose(n, k),
  ).reduce((a, b) => a + b, 0);
export const noiseAssignment = (mask) =>
  Array.from(
    {
      length: 8,
    },
    (_, i) => ((mask >> i) & 1 ? 1 : -1),
  );
export function cutCorrelation(signs, split) {
  return signs.reduce((sum, sign, i) => sum + sign * (i < split ? -1 : 1), 0) / signs.length;
}
export function noiseFit(mask) {
  const signs = noiseAssignment(mask);
  const correlations = Array.from({ length: signs.length + 1 }, (_, split) =>
    cutCorrelation(signs, split),
  );
  return {
    signs,
    split: correlations.indexOf(Math.max(...correlations)),
    threshold: Math.max(...correlations),
    constant: Math.abs(signs.reduce((a, b) => a + b, 0)) / 8,
  };
}
