import { apply, complete } from '../arithmetic.mjs';
import { U } from '../fixtures.mjs';
import { rankFrame } from '../model.mjs';
import { caption, curve, equation, plane, target, text } from '../defaults.mjs';
import { dotProduct } from 'vizmatic';
export function drawRankCollapse(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const f = (v, n = 2) => (Math.abs(v) < 0.5 * 10 ** -n ? 0 : v).toFixed(n);
  const grid = (plot, map, min = -1, max = 1, step = 0.5, lineColor = '#8d9cb955') => {
    for (let k = min; k <= max + 1e-9; k += step)
      for (const ends of [
        [
          [min, k],
          [max, k],
        ],
        [
          [k, min],
          [k, max],
        ],
      ])
        curve(ctx, api, plot, ends.map(map), lineColor, 2);
  };
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
    const c = rankFrame({
      ...state,
      beat: 0,
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
      const q = plane(ctx, api, [-3, 3, -2, 2], 190, 315, 1540, 550, '', '');
      target(ctx, api, 'duplicate-columns', () =>
        grid(
          q,
          (v) => U.map((direction) => dotProduct(apply(c.table, v), direction)),
          -1.5,
          1.5,
          0.25,
          '#8d9cb9bb',
        ),
      );
      equation(
        ctx,
        api,
        complete(c.duplicate)
          ? '\\operatorname{rank}(B)=1'
          : '\\text{copy the first column into the second}',
        960,
        945,
        44,
        themeColors.yellow,
      );
    }
    caption(ctx, api, 'The matrix keeps two columns while its output loses a whole direction');
  }
}
export default {
  id: 'rank-collapse',
  draw: drawRankCollapse,
  cues: ['duplicate-columns'],
};
