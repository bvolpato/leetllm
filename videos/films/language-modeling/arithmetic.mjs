export const bound = (x) => Math.max(0, Math.min(1, x));
export const phase = (p, a = 0.1, b = 0.8) => bound((p - a) / (b - a));
