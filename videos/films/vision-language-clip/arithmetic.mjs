import assert from 'node:assert/strict';
export function prefixCosts(crops = 4, side = 336, patch = 14) {
  assert(Number.isInteger(side / patch));
  const visual = crops * (side / patch) ** 2,
    bytesPerToken = 80 * 8 * 128 * 2 * 2;
  return {
    visual,
    total: visual + 180,
    bytesPerToken,
    visualMiB: (visual * bytesPerToken) / 2 ** 20,
  };
}
export const pairLogisticLoss = (logit, positive) => {
  const signed = positive ? -logit : logit;
  return Math.max(0, signed) + Math.log1p(Math.exp(-Math.abs(signed)));
};
