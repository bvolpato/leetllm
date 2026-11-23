import { cueFraction } from '../cues.mjs';
import { clamp01 } from '../arithmetic.mjs';

export function drawPlacement(ctx, scene, state, api) {
  const { C } = api;
  const inputs = [
      [1, 2],
      [10, 20],
    ],
    sums = inputs[0].map((v, i) => v + inputs[1][i]);
  const centers = [780, 1290],
    colors = [C.blue, C.pink];
  const scatter = state.beat === 2;
  const send = scatter
    ? cueFraction(state, 'scatter-cells', 2, 0.25, 0.55)
    : cueFraction(state, 'replicate-cells', 1, 0.4, 0.67);
  api.focus.target('partials', () => {
    for (const [i, x] of centers.entries())
      api.text(ctx, 'Coordinate ' + i, x, 270, 39, C.ink, 'center');
    inputs.forEach((row, r) => {
      const y = 352 + r * 98;
      api.text(ctx, 'Rank ' + r + ' contributes', 150, y + 24, 37, colors[r]);
      row.forEach((v, i) => {
        api.rect(ctx, centers[i] - 140, y - 39, 280, 81, C.panel, colors[r], 6);
        api.text(ctx, String(v), centers[i], y + 21, 53, colors[r], 'center');
      });
    });
  });
  api.focus.target('sums', () => {
    api.text(ctx, 'Logical vector', 150, 606, 39, C.ink);
    centers.forEach((x, i) => {
      api.line(ctx, x - 150, 520, x + 150, 520, C.muted, 3);
      const spoken =
        i === 0
          ? cueFraction(state, 'first-sum', 1, 0.08, 0.11)
          : cueFraction(state, 'second-sum', 1, 0.17, 0.21);
      api.text(ctx, spoken >= 1 ? String(sums[i]) : '?', x, 615, 72, C.yellow, 'center');
    });
  });
  if (state.beat === 0) return;
  api.focus.target('destinations', () => {
    for (const r of [0, 1]) {
      const left = 240 + 830 * r,
        mid = left + 315;
      api.text(ctx, 'Rank ' + r + ' receives', mid, 930, 40, colors[r], 'center');
      const ids = scatter ? [r] : [0, 1];
      ids.forEach((i, j) => {
        const x = mid + (j - (ids.length - 1) / 2) * 165;
        api.rect(ctx, x - 79, 758, 158, 96, C.panel, colors[r], 5);
        const p = clamp01(2 * send - i);
        if (p >= 1) api.text(ctx, String(sums[i]), x, 826, 54, C.ink, 'center');
        else if (p > 0)
          api.circle(ctx, centers[i] + (x - centers[i]) * p, 641 + p * 164, 12, colors[r]);
      });
    }
    if (send >= 1)
      api.text(ctx, scatter ? 'Reduce-scatter' : 'All-reduce', 960, 1020, 34, C.muted, 'center');
  });
}
export default {
  id: 'placement',
  draw: drawPlacement,
  cues: [
    'partial-columns',
    'sum-columns',
    'first-sum',
    'second-sum',
    'replicate-cells',
    'scatter-cells',
  ],
};
