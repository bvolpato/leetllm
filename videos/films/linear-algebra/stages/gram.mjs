import { gramCalculation, gramConstruction, gramProductCues } from '../model.mjs';
import { caption, equation, target, text } from '../defaults.mjs';
export function drawGram(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const f = (v, n = 2) => (Math.abs(v) < 0.5 * 10 ** -n ? 0 : v).toFixed(n);
  const matrix = (values, x, y, cell, color, cellStyle) =>
    api.components.matrix({
      values,
      x,
      y,
      cellSize: cell,
      gap: 8,
      cellStyle,
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
    const model = gramCalculation();
    const { activeProduct, entryCount } = gramConstruction(state);
    const p = model.products[activeProduct];
    const names = ['Slow flag', 'Rollback flag'];
    const colors = [themeColors.blue, themeColors.pink];
    target(ctx, api, 'gram-column-product', () => {
      text(ctx, api, names[p.row], 360, 310, 30, colors[p.row], 'center');
      text(ctx, api, names[p.column], 700, 310, 30, colors[p.column], 'center');
      matrix(
        model.columns[p.row].map((v) => [v]),
        305,
        375,
        100,
        colors[p.row],
      );
      matrix(
        model.columns[p.column].map((v) => [v]),
        645,
        375,
        100,
        colors[p.column],
      );
      equation(
        ctx,
        api,
        p.terms.map(([a, z]) => `${a}\\times${z}`).join('+') +
          '=' +
          (activeProduct < entryCount ? p.value : '?'),
        560,
        845,
        48,
        themeColors.yellow,
      );
    });
    api.arrow(ctx, 850, 540, 1040, 540, themeColors.yellow, 7);
    target(ctx, api, 'gram-matrix', () => {
      equation(ctx, api, 'G=A^TA', 1375, 310, 49, themeColors.yellow);
      matrix(
        model.gram.map((row, i) => row.map((v, j) => (i * row.length + j < entryCount ? v : '·'))),
        1235,
        395,
        125,
        themeColors.yellow,
        (_, row, column) => row === p.row && column === p.column
          ? { fill: themeColors.yellow, textColor: themeColors.panel }
          : undefined,
      );
    });
    caption(ctx, api, 'One feature-column dot product fills one Gram entry');
  }
}
export default {
  id: 'gram',
  draw: drawGram,
  cues: ['gram-column-products', ...gramProductCues],
};
