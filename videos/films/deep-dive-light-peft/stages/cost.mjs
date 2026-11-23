import { projectionLedger } from '../model.mjs';
import {
  chapterFooter,
  chapterPanel,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawCost(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const ledger = projectionLedger(state);
    chapterSubtitle(ctx, api, themeColors, 'One token · hidden width 8 · FFN width 32');
    const grid = (r, x, y, cell, color, target) =>
      focusScope(ctx, api, target, () => {
        chapterText(
          ctx,
          api,
          themeColors,
          r.label +
            ': ' +
            r.rows +
            ' × ' +
            r.columns +
            (r.counted === r.pairs ? ' = ' + r.pairs : ''),
          x + (r.columns * cell) / 2,
          y - 26,
          28,
          color,
          'center',
        );
        for (let row = 0; row < r.rows; row++)
          for (let column = 0; column < r.columns; column++)
            api.rect(
              ctx,
              x + column * cell,
              y + row * cell,
              cell - 1,
              cell - 1,
              row * r.columns + column < r.counted ? color : themeColors.panel,
              themeColors.muted,
              0,
            );
        chapterText(
          ctx,
          api,
          themeColors,
          r.counted + ' / ' + r.pairs + ' pairs',
          x + (r.columns * cell) / 2,
          y + r.rows * cell + 42,
          25,
          color,
          'center',
        );
      });
    focusScope(ctx, api, 'cost-projection-ledger', () =>
      ledger.products
        .slice(0, 4)
        .forEach((r, i) =>
          grid(r, 240 + i * 370, 355, 22, themeColors.blue, 'cost-' + r.id + '-product'),
        ),
    );
    focusScope(ctx, api, 'cost-ffn-ledger', () => {
      grid(ledger.products[4], 260, 690, 12, themeColors.cyan, 'cost-ffn-up-product');
      grid(ledger.products[5], 800, 640, 9, themeColors.cyan, 'cost-ffn-down-product');
    });
    focusScope(ctx, api, 'cost-dense-total', () => {
      chapterPanel(
        ctx,
        api,
        themeColors,
        'Counted pairs / token: ' + ledger.counted,
        1040,
        650,
        700,
        95,
        themeColors.yellow,
        32,
      );
    });
    focusScope(ctx, api, 'cost-token-total', () => {
      if (ledger.fourTokens)
        chapterText(
          ctx,
          api,
          themeColors,
          '4 tokens × ' + ledger.counted + ' = ' + 4 * ledger.counted + ' pairs',
          1390,
          805,
          31,
          themeColors.yellow,
          'center',
        );
    });
    focusScope(ctx, api, 'cost-adapter-product', () => {
      if (beat === 2) {
        const n = Math.round(ledger.adapter * 16);
        for (let i = 0; i < 16; i++)
          api.rect(
            ctx,
            1100 + (i % 8) * 63,
            870 + Math.floor(i / 8) * 38,
            48,
            26,
            i < n ? themeColors.purple : themeColors.panel,
            themeColors.muted,
            0,
          );
        chapterText(
          ctx,
          api,
          themeColors,
          n === 16 ? 'Rank 1 · 8 × 1 + 1 × 8 = 16' : 'Rank 1 · two matching projections',
          1390,
          965,
          27,
          themeColors.purple,
          'center',
        );
      }
    });
    chapterFooter(
      ctx,
      api,
      themeColors,
      'Each lit cell is one multiply-accumulate pair · attention-score products add separate work.',
    );
  }
}
export default {
  id: 'cost',
  draw: drawCost,
  cues: [
    'cost-beat-1-focus-1',
    'cost-query-product',
    'cost-key-product',
    'cost-value-product',
    'cost-output-product',
    'cost-beat-2-focus-1',
    'cost-ffn-products',
    'cost-four-tokens',
    'cost-beat-3-focus-1',
  ],
};
