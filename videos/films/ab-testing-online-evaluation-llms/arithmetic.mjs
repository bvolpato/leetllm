export const clamp = (p) => Math.max(0, Math.min(1, p));
export const motion = (p) => {
  const q = clamp((p - 0.08) / 0.68);
  return q * q * (3 - 2 * q);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export function erfcPositive(x) {
  const t = 1 / (1 + 0.5 * x);
  return (
    t *
    Math.exp(
      -x * x -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    )
  );
}
export function betaDensity(x, alpha, beta) {
  if (x < 0 || x > 1) return 0;
  if (x === 0) return alpha === 1 ? beta : 0;
  if (x === 1) return beta === 1 ? alpha : 0;
  const logFactorial = (n) => {
    let v = 0;
    for (let i = 2; i <= n; i++) v += Math.log(i);
    return v;
  };
  return Math.exp(
    logFactorial(alpha + beta - 1) -
      logFactorial(alpha - 1) -
      logFactorial(beta - 1) +
      (alpha - 1) * Math.log(x) +
      (beta - 1) * Math.log(1 - x),
  );
}
