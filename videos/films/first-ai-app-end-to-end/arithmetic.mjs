export const clamp = (p) => Math.max(0, Math.min(1, p));
export const phase = (p, a, b) => clamp((p - a) / (b - a));
