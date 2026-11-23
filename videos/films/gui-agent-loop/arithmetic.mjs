export const progressBetween = (value, start, end) =>
  Math.max(0, Math.min(1, (value - start) / (end - start)));
