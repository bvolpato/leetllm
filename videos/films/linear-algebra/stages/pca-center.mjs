import { A, mean } from '../fixtures.mjs';
import { pcaFrame } from '../model.mjs';
import { caption, equation, line, plane, ring, target, text } from '../defaults.mjs';
export function drawPcaCenter(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const colors = [themeColors.blue, themeColors.pink, themeColors.green];
  const pointRows = (plot, values, prefix) =>
    values.forEach((v, i) =>
      target(ctx, api, prefix + '-' + i, () => {
        const p = plot.point(...v),
          same = values.some(
            (other, j) => j < i && Math.hypot(...v.map((n, k) => n - other[k])) < 1e-6,
          );
        ring(ctx, api, p, colors[i], same ? 21 : 13);
        text(
          ctx,
          api,
          't' + i,
          p.x + (i === 2 ? -35 : 0),
          p.y + (i === 0 ? 52 : -32),
          28,
          colors[i],
          i === 2 ? 'right' : 'center',
        );
      }),
    );
  {
    const c = pcaFrame({
        ...state,
        beat: 0,
      }),
      q = plane(ctx, api, [-0.9, 1.2, -0.9, 1.2], 200, 315, 1520, 540);
    A.forEach((v, i) => line(ctx, api, q, v, c.rows[i], '#8d9cb944', 2));
    target(ctx, api, 'centering-rule', () => {
      pointRows(q, c.rows, 'centered');
      const center = mean.map((v) => v * (1 - c.center)),
        p = q.point(...center);
      api.path(
        ctx,
        [
          {
            x: p.x - 14,
            y: p.y,
          },
          {
            x: p.x + 14,
            y: p.y,
          },
        ],
        {
          color: themeColors.yellow,
          width: 4,
        },
      );
      api.path(
        ctx,
        [
          {
            x: p.x,
            y: p.y - 14,
          },
          {
            x: p.x,
            y: p.y + 14,
          },
        ],
        {
          color: themeColors.yellow,
          width: 4,
        },
      );
      equation(ctx, api, '\\mu', p.x - 35, p.y + 45, 30, themeColors.yellow);
    });
    text(ctx, api, 'Mean mentions per training ticket', 750, 265, 35, themeColors.muted, 'center');
    equation(ctx, api, '\\mu=[2/3,2/3]', 1260, 264, 39, themeColors.yellow);
    equation(ctx, api, 'X_c=X-\\mu_{training}', 960, 945, 44, themeColors.yellow);
    caption(ctx, api, 'Training counts (slow, rollback)     (1, 0)     (0, 1)     (1, 1)');
  }
}
export default {
  id: 'pca-center',
  draw: drawPcaCenter,
  cues: ['centering-rule'],
};
