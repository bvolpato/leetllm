export const unit = (value) => Math.max(0, Math.min(1, value));
export const smooth = (value) => {
  const x = unit(value);
  return x * x * (3 - 2 * x);
};
export const cueProgress = (seconds, start, end) => smooth((seconds - start) / (end - start));
export const stageCount = (progress) =>
  progress <= 0 ? 0 : progress >= 1 ? 3 : Math.min(2, Math.ceil(progress * 3));
// These are manual support annotations for exact fixture revisions.
