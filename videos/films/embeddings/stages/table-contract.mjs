import { V } from '../fixtures.mjs';
import { event } from '../construction.mjs';
import { arrow, card, centeredText, extensionText, footer, numberMatrix } from '../defaults.mjs';
export function drawTableContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => event(state, name, beat);
  const fmt = (v) => (Math.abs(v) < 1e-10 ? '0' : Number(v.toFixed(3)).toString());
  api.focus.target('table-contract-mechanism', () => {
    const charge = currentBeat > 0 && ev('charge-fixture', 1) > 0,
      rows = charge
        ? [
            [0.8, 0.2],
            [0.2, 1],
            [1, 0.1],
          ]
        : Object.values(V),
      names = charge ? ['charge', 'invoice', 'phone'] : Object.keys(V),
      selection = ev('onehot', 0);
    centeredText(
      ctx,
      api,
      charge
        ? 'Separate article fixture · same charge ID in two contexts'
        : 'Same bank lookup · one-hot row times E',
      960,
      285,
      34,
      themeColors.yellow,
    );
    numberMatrix(ctx, api, themeColors, fmt, [[1, ...Array(rows.length - 1).fill(0)]], 170, 440, {
      cell: 105,
      color: themeColors.yellow,
      label: 'one-hot selector',
    });
    extensionText(ctx, api, '×', 690, 545, 58, themeColors.muted);
    numberMatrix(ctx, api, themeColors, fmt, rows, 890, 350, {
      cell: 105,
      rowNames: names,
      label: 'E · vocabulary × 2',
    });
    extensionText(ctx, api, '=', 1230, 545, 58, themeColors.muted);
    if (selection > 0) {
      const sx = 1107,
        sy = 402,
        ex = 1450,
        ey = 500;
      arrow(
        ctx,
        api,
        sx,
        sy,
        sx + (ex - sx) * selection,
        sy + (ey - sy) * selection,
        themeColors.yellow,
      );
      numberMatrix(ctx, api, themeColors, fmt, [rows[0]], 1430, 510, {
        cell: 115,
        color: themeColors.green,
        label: 'gathered row',
        visible: () => selection === 1,
      });
    }
    centeredText(
      ctx,
      api,
      charge
        ? 'invoice occurrence and phone occurrence keep the same starting row'
        : 'V row addresses · d features · IDs carry no metric distance',
      960,
      890,
      32,
      themeColors.ink,
    );
    if (currentBeat === 2) {
      const n = Math.floor(3 * ev('pieces', 2));
      ['token', 'sub', 'word']
        .slice(0, n)
        .forEach((x, i) =>
          card(
            ctx,
            api,
            x,
            495 + i * 320,
            755,
            260,
            [themeColors.yellow, themeColors.cyan, themeColors.blue][i],
          ),
        );
    }
    footer(
      ctx,
      api,
      'The table is learned during training; a fixed lookup is independent of its current sentence',
    );
  });
}
export default {
  id: 'table-contract',
  draw: drawTableContract,
  cues: ['emb-onehot', 'emb-charge-fixture', 'emb-pieces'],
};
