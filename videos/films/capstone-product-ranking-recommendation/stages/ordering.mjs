import { sum } from '../arithmetic.mjs';
import { orderingFrame, sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawOrdering(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('ordering', state);
  {
    const o = orderingFrame(state.beat ?? 0, state.beatP ?? 0),
      changed = o.committed;
    if (state.cues) {
      o.idealReady ||= state.cues['ordering-b1-3'].phase !== 'before';
      o.normalizationReady ||= state.cues['ordering-b2-1'].phase !== 'before';
    }
    text(
      ctx,
      api,
      'The same relevance judgments, at different positions',
      960,
      278,
      35,
      themeColors.ink,
      'center',
    );
    [1, 2, 3].forEach((rank, i) =>
      text(ctx, api, 'Rank ' + rank, 290 + i * 280, 355, 29, themeColors.muted, 'center'),
    );
    text(ctx, api, 'Grade → gain → position discount', 1430, 355, 29, themeColors.cyan, 'center');
    o.rows.forEach((row, i) => {
      const y = 415 + i * 130,
        color =
          row.id === 'P5'
            ? themeColors.yellow
            : row.id === 'P6'
              ? themeColors.cyan
              : themeColors.blue;
      api.focus.target('ranked-products', () =>
        card(ctx, api, row.id + ' · grade ' + row.grade, 190 + row.slot * 280, y, 200, color, 84),
      );
      if (o.gainReady) {
        const formula =
          i < o.discountCount
            ? String.raw`\frac{2^{${row.grade}}-1}{\log_2(${row.rank}+1)}=\frac{${row.gain}}{${row.discount.toFixed(3)}}=${row.contribution.toFixed(3)}`
            : String.raw`2^{${row.grade}}-1=${row.gain}`;
        api.focus.target('discount-calculation', () =>
          api.rect(
            ctx,
            1115,
            y,
            660,
            84,
            themeColors.panel,
            changed ? themeColors.green : themeColors.line,
            12,
          ),
        );
        api.focus.target('discount-calculation', () =>
          api.math(ctx, formula, 1445, y + 42, 31, changed ? themeColors.green : color, 'center'),
        );
      } else
        text(ctx, api, 'Human judgment stays with ' + row.id, 1445, y + 51, 27, color, 'center');
    });
    if (o.discountCount > 0) {
      api.focus.target('dcg-total', () =>
        text(
          ctx,
          api,
          o.inTransit
            ? 'Moving the same product IDs · recomputing after arrival'
            : (changed ? 'Treatment' : 'Control') +
                (o.discountReady ? ' DCG = ' : ' DCG subtotal = ') +
                o.rows
                  .slice(0, o.discountCount)
                  .map((row) => row.contribution.toFixed(3))
                  .join(' + ') +
                ' = ' +
                sum(o.rows.slice(0, o.discountCount).map((row) => row.contribution)).toFixed(3),
          960,
          865,
          29,
          o.inTransit ? themeColors.yellow : changed ? themeColors.green : themeColors.cyan,
          'center',
        ),
      );
    }
    if (o.idealReady)
      api.focus.target('ideal-gain', () =>
        api.math(
          ctx,
          String.raw`\mathrm{IDCG}_{P5,P6,P4}=7+\frac{3}{\log_2 3}+\frac12=${o.idealDcg.toFixed(3)}`,
          960,
          925,
          32,
          themeColors.muted,
          'center',
        ),
      );
    if (o.predict)
      text(
        ctx,
        api,
        'Which product should receive Rank 1?',
        960,
        1000,
        31,
        themeColors.yellow,
        'center',
      );
    else if (o.normalizationReady && !o.inTransit)
      api.focus.target('normalized-gain', () =>
        api.math(
          ctx,
          String.raw`\mathrm{NDCG}=\frac{${o.currentDcg.toFixed(3)}}{${o.idealDcg.toFixed(3)}}=${o.ndcg.toFixed(3)}`,
          960,
          1000,
          38,
          changed ? themeColors.green : themeColors.yellow,
          'center',
        ),
      );
    else if (o.inTransit)
      text(
        ctx,
        api,
        'The judgments stay fixed; position changes each discounted contribution',
        960,
        1000,
        28,
        themeColors.yellow,
        'center',
      );
    else
      api.math(
        ctx,
        String.raw`\mathrm{DCG}=\sum_i\frac{2^{r_i}-1}{\log_2(i+1)}`,
        960,
        1000,
        35,
        themeColors.yellow,
        'center',
      );
  }
}
export default {
  id: 'ordering',
  draw: drawOrdering,
  cues: [
    'ordering-b1-1',
    'ordering-b1-2',
    'ordering-b1-3',
    'ordering-b2-1',
    'ordering-b2-2',
    'ordering-b2-3',
  ],
};
