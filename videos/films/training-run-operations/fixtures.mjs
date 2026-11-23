export const targets = [1, -2, 3, 0.5];
export function advance(input, n) {
  const s = {
    ...input,
  };
  for (let i = 0; i < n; i++) {
    const g = s.w - targets[s.cursor % 4];
    s.step++;
    s.m = 0.9 * s.m + 0.1 * g;
    s.v = 0.999 * s.v + 0.001 * g * g;
    const lr = 0.05 / (1 + 0.1 * (s.step - 1));
    s.w -= (lr * (s.m / (1 - 0.9 ** s.step))) / (Math.sqrt(s.v / (1 - 0.999 ** s.step)) + 1e-8);
    s.cursor++;
  }
  return s;
}
export function buildAdamTrajectories() {
  const fresh = {
      w: 0,
      m: 0,
      v: 0,
      step: 0,
      cursor: 0,
    },
    saved = advance(fresh, 7);
  const baseline = Array.from(
    {
      length: 13,
    },
    (_, i) => advance(fresh, i),
  );
  const lost = Array.from(
    {
      length: 6,
    },
    (_, i) =>
      advance(
        {
          ...saved,
          m: 0,
          v: 0,
        },
        i,
      ),
  );
  return {
    fresh,
    saved,
    baseline,
    lost,
  };
}
export const { fresh, saved, baseline, lost } = buildAdamTrajectories();
export const DEADLINE_WARNING_CUE = {
  beatDuration: 21.32,
  shortenAt: 3.335333333333338,
};
