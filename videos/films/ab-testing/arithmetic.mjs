export const rate = (arm) => arm.resolved / arm.n;
export const standardError = (a, b, nA, nB) => Math.sqrt((a * (1 - a)) / nA + (b * (1 - b)) / nB);
export const groundingRate = (arm) => arm.groundingFailures / arm.n;
export const requiredN = (baseline, effect, alphaZ = 1.96, powerZ = 0.8416) =>
  (2 * baseline * (1 - baseline) * (alphaZ + powerZ) ** 2) / effect ** 2;
export const abClamp = (value) => Math.max(0, Math.min(1, value));
export const abNormalCdf = (x) => {
  const sign = x < 0 ? -1 : 1,
    z = Math.abs(x) / Math.sqrt(2),
    t = 1 / (1 + 0.3275911 * z),
    erf =
      1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
        t *
        Math.exp(-z * z);
  return 0.5 * (1 + sign * erf);
};
