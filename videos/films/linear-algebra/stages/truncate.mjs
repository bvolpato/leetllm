import { A, labels } from '../fixtures.mjs';
import { event } from '../construction.mjs';
import { compressionFrame } from '../model.mjs';
import { line, plane, ring, target, text } from '../defaults.mjs';

export function drawTruncate(ctx, scene, state, api) {
  const { C } = api;
  const colors = [C.blue, C.pink, C.green];
  const c = compressionFrame(state);
  const beat = state.beat ?? 0;
  const q = plane(ctx, api, [-0.35, 1.35, -0.35, 1.35], 135, 335, 700, 495);
  text(ctx, api, 'Feature plane', 470, 275, 37, C.ink, 'center');
  line(ctx, api, q, [-0.25, -0.25], [1.25, 1.25], C.yellow, 3);
  target(ctx, api, 'discard-contrast', () => {
    A.forEach((v, i) => {
      const current = q.point(...c.rows[i]);
      ring(ctx, api, q.point(...v), colors[i], 7);
      line(ctx, api, q, v, c.rows[i], colors[i], 3);
      ring(ctx, api, current, colors[i], i === 1 ? 20 : 13);
    });
  });
  text(ctx, api, 'Ticket', 860, 320, 28, C.muted);
  text(ctx, api, 'Saved score', 1240, 320, 28, C.muted, 'center');
  text(ctx, api, 'Rebuilt flags', 1560, 320, 28, C.muted, 'center');
  target(ctx, api, 'collapsed-route', () => {
    A.forEach((row, i) => {
      const y = 405 + 140 * i;
      text(ctx, api, labels[i], 860, y + 12, 33, colors[i]);
      text(ctx, api, '[' + row.join(', ') + ']', 860, y + 53, 26, C.muted);
      api.rect(ctx, 1145, y - 44, 190, 84, C.panel, C.muted, 8);
      text(
        ctx,
        api,
        c.progress === 1 ? c.coordinates[i][0].toFixed(3) : '…',
        1240,
        y + 14,
        39,
        C.ink,
        'center',
      );
      c.rows[i].forEach((v, j) => {
        const x = 1502 + j * 116;
        text(ctx, api, v.toFixed(2), x, y + 12, 33, colors[i], 'center');
        if (beat > 0 && Math.abs(v - row[j]) > 0.01)
          api.line(ctx, x - 37, y + 29, x + 37, y + 29, C.yellow, 3);
      });
    });
  });
  target(ctx, api, 'reconstruction-error', () => {
    const inspected = event(state, 1, 'reconstruction-error') === 1;
    const footer =
      beat === 0
        ? 'One shared direction for all three tickets'
        : inspected
          ? '√(4 × 0.5²) = ' + c.error.toFixed(0) + '    Frobenius error'
          : 'Compare the four underlined entries with the original flags.';
    text(ctx, api, footer, 960, 925, 39, inspected ? C.yellow : C.ink, 'center');
  });
}

export default {
  id: 'truncate',
  draw: drawTruncate,
  cues: ['discard-contrast', 'collapsed-route', 'reconstruction-error'],
};
