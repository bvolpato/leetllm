import { clamp, complete } from '../arithmetic.mjs';
import { A, labels } from '../fixtures.mjs';
import { event } from '../construction.mjs';
import { caption, plane, ring, target, text } from '../defaults.mjs';
export function drawTickets(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const colors = [themeColors.blue, themeColors.pink, themeColors.green];
  const f = (v, n = 2) => (Math.abs(v) < 0.5 * 10 ** -n ? 0 : v).toFixed(n);
  const matrix = (values, x, y, cell = 88, color = themeColors.cyan) =>
    api.components.matrix({
      values,
      x,
      y,
      cellSize: cell,
      gap: 8,
      format: (v) => (typeof v === 'number' ? Number(f(v, 3)).toString() : v),
      style: {
        fill: themeColors.panel,
        stroke: color,
        textColor: color,
        fontSize: 34,
        padding: 8,
      },
    });
  {
    const p = event(state, 0, 'ticket-coordinates'),
      q = plane(
        ctx,
        api,
        [-0.45, 1.45, -0.45, 1.45],
        700,
        300,
        1000,
        560,
        'slow-page signal',
        'rollback signal',
      );
    text(ctx, api, 'slow   rollback', 410, 295, 28, themeColors.muted, 'center');
    target(ctx, api, 'ticket-coordinates', () =>
      A.forEach((v, i) => {
        const z = q.point(...v),
          progress = clamp(3 * p - i),
          from = {
            x: 630,
            y: 420 + i * 155,
          },
          current = {
            x: from.x + (z.x - from.x) * progress,
            y: from.y + (z.y - from.y) * progress,
          };
        matrix([v], 310, 350 + i * 155, 72, colors[i]);
        text(ctx, api, labels[i], 280, 340 + i * 155, 27, colors[i]);
        api.line(ctx, from.x, from.y, current.x, current.y, '#8d9cb966', 2);
        ring(ctx, api, current, colors[i], 13);
        text(ctx, api, 't' + i, 555, 430 + i * 155, 29, colors[i]);
        if (complete(progress))
          text(
            ctx,
            api,
            't' + i,
            current.x + (i === 1 ? -32 : 32),
            current.y + (i === 0 ? 46 : i === 1 ? -30 : 0),
            29,
            colors[i],
            i === 1 ? 'right' : 'left',
          );
      }),
    );
    caption(ctx, api, 'The point is the feature row · color keeps the ticket identity');
  }
}
export default {
  id: 'tickets',
  draw: drawTickets,
  cues: ['ticket-coordinates'],
};
