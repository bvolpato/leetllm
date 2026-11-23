import { complete, sum } from '../arithmetic.mjs';
import { labels } from '../fixtures.mjs';
import { rankFrame } from '../model.mjs';
import { arrow, caption, curve, equation, plane, target, text } from '../defaults.mjs';
export function drawRankNull(ctx, scene, state, api) {
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
  const outputRow = (values, y = 830, prefix = 'svd-ticket-') =>
    values.forEach((v, i) =>
      target(ctx, api, prefix + i, () => {
        const x = 300 + i * 470;
        api.rect(ctx, x, y, 380, 108, themeColors.panel, colors[i], 2, 8);
        text(ctx, api, 't' + i + ' · ' + labels[i], x + 190, y + 31, 24, colors[i], 'center');
        text(ctx, api, v === null ? '?' : f(v, 3), x + 190, y + 82, 42, colors[i], 'center');
      }),
    );
  {
    const c = rankFrame({
      ...state,
      beat: currentBeat + 1,
    });
    target(ctx, api, 'duplicate-columns', () => {
      text(ctx, api, 'feature table', 285, 350, 27, themeColors.blue, 'center');
      matrix(
        c.table.map((row) => row.map((v) => (Number.isInteger(v) ? v : '…'))),
        205,
        400,
        70,
        themeColors.blue,
      );
      equation(ctx, api, complete(c.duplicate) ? 'B' : 'A\\to B', 285, 690, 30, themeColors.blue);
    });
    {
      const q = plane(ctx, api, [-1.5, 3.5, -2, 3], 170, 300, 1000, 430, 'weight 1', 'weight 2');
      curve(
        ctx,
        api,
        q,
        [
          [-1.5, 3],
          [3.5, -2],
        ],
        '#8d9cb966',
        3,
      );
      target(ctx, api, 'nullspace-rule', () => {
        arrow(ctx, api, q, [0, 0], c.weights, themeColors.yellow);
        equation(
          ctx,
          api,
          'w=[' + f(c.weights[0]) + ',' + f(c.weights[1]) + ']^T',
          1430,
          435,
          41,
          themeColors.yellow,
        );
      });
      equation(ctx, api, 'w_1+w_2=' + f(sum(c.weights)), 1430, 300, 36, themeColors.yellow);
      equation(ctx, api, 'B[1,-1]^T=0', 1430, 640, 47, themeColors.yellow);
      if (currentBeat === 1) {
        const p = q.point(...c.minimum);
        api.path(
          ctx,
          [
            {
              x: p.x + 8,
              y: p.y - 8,
            },
            {
              x: p.x + 30,
              y: p.y - 30,
            },
          ],
          {
            id: 'minimum-norm-reference',
            color: themeColors.green,
            width: 2,
          },
        );
        text(ctx, api, 'minimum norm', p.x + 45, p.y - 40, 29, themeColors.green);
      }
      outputRow(c.prediction, 850, 'prediction-');
    }
    caption(ctx, api, 'The three ticket predictions stay fixed while the weights move');
  }
}
export default {
  id: 'rank-null',
  draw: drawRankNull,
  cues: ['nullspace-rule', 'minimum-weight'],
};
