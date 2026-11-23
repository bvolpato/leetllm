import { fmt } from './arithmetic.mjs';

export const signed = (value) => (value > 0 ? '+' + fmt(value) : fmt(value).replace('-', '−'));

// The width of each item is its coefficient in the gradient of the objective.
export function itemShares(
  ctx,
  api,
  window,
  {
    halfPerBatch = 0,
    grouped = false,
    showGradients = false,
    showFractions = false,
    showMeans = false,
    target = 'items',
  } = {},
) {
  const { C } = api;
  const x0 = 180,
    width = 1560,
    y = 389,
    height = 174;
  const n = window.targets.length;
  const [leftCount, rightCount] = window.counts;
  const firstShare = leftCount / n + (0.5 - leftCount / n) * halfPerBatch;
  const divide = x0 + width * firstShare;
  api.focus.target(target, () => {
    if (grouped) {
      for (const [i, [from, to]] of [
        [x0, divide],
        [divide, x0 + width],
      ].entries()) {
        const center = (from + to) / 2;
        const count = window.counts[i];
        api.line(ctx, from + 5, y - 20, to - 5, y - 20, C.muted, 3);
        api.line(ctx, from + 5, y - 20, from + 5, y - 8, C.muted, 3);
        api.line(ctx, to - 5, y - 20, to - 5, y - 8, C.muted, 3);
        const ready = halfPerBatch === 1 || halfPerBatch === 0;
        const share = halfPerBatch === 1 ? '1/2' : count + '/' + n;
        const label = 'Batch ' + (i + 1) + '  ·  ' + count + (count === 1 ? ' item' : ' items');
        api.text(
          ctx,
          showFractions && ready ? label + '  ·  ' + share : label,
          center,
          y - 48,
          33,
          C.ink,
          'center',
        );
        if (showMeans) {
          const g = window.means[i];
          const v = Number.isInteger(g) ? signed(g) : signed(Math.round(g * count)) + '/' + count;
          api.text(ctx, 'Mean gradient  ' + v, center, y + height + 57, 33, C.ink, 'center');
        }
      }
    }
    let left = x0;
    for (const [i, value] of window.targets.entries()) {
      const group = i < leftCount ? 0 : 1;
      const span = width * (group ? (1 - firstShare) / rightCount : firstShare / leftCount);
      const center = left + span / 2;
      const color = grouped && group ? C.yellow : C.cyan;
      api.rect(ctx, left + 3, y, span - 6, height, C.panel, color, 6);
      api.text(ctx, 'target  ' + value, center, y + 49, 33, C.ink, 'center');
      if (showGradients)
        api.text(ctx, 'g = ' + signed(window.gradients[i]), center, y + 103, 40, color, 'center');
      if (showFractions && (halfPerBatch === 0 || halfPerBatch === 1)) {
        const denominator = halfPerBatch === 1 ? 2 * window.counts[group] : n;
        api.text(ctx, 'share  1/' + denominator, center, y + 150, 29, C.ink, 'center');
      }
      left += span;
    }
  });
}
