export const softmax = (z) => {
  const a = z.map((v) => Math.exp(v - Math.max(...z))),
    total = a.reduce((x, y) => x + y);
  return a.map((v) => v / total);
};
export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export const mix = (a, b, p) => a + (b - a) * clamp01(p);
export const format = (v, d = 3) => Number(v.toFixed(d)).toString();
export const head = (h, w, b) => w.map((r, j) => r.reduce((sum, v, i) => sum + v * h[i], b[j]));
