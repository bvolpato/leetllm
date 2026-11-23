export const bound = (value) => Math.max(0, Math.min(1, value));
export const timedProgress = (elapsed, from, until) => {
  const p = bound((elapsed - from) / (until - from));
  return p * p * (3 - 2 * p);
};
