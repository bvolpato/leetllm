import { weightedTicketFixture } from '../model.mjs';
import { cellGrid, code, datum, focusProgress, footer, label } from '../defaults.mjs';
export function drawWeightChoices(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  const pc = (v, d = 1) => Number((100 * v).toFixed(d)) + '%',
    num = (v, d = 3) => Number(v.toFixed(d));
  api.focus.target('cau-weight-choices-mechanism', () => {
    const choices = true,
      clipping = q('clip-five') > 0,
      stabilize = !clipping ? 1 - 0.5 * q('stabilize-half') : 1,
      clip = clipping ? 10 - 5 * q('clip-five') : Infinity,
      arms = weightedTicketFixture({
        stabilize,
        clip,
      }),
      clipped = clip <= 5,
      totalEarned = clipping ? done('clip-total') : true;
    arms.forEach((a, i) => {
      const x = 200 + i * 850,
        color = i ? themeColors.pink : themeColors.cyan;
      label(ctx, api, a.arm + ' · ' + a.observed + ' actual tickets', x + 260, 300, color, 33);
      cellGrid(ctx, api, a.tickets, x, 355);
      let xx = x;
      a.groups.forEach((g, j) => {
        const rare = g.count === 10,
          earned = true,
          width = g.mass * 2.5;
        if (!clipping || totalEarned)
          api.rect(ctx, xx, 590, width, 55, j ? themeColors.red : themeColors.green, undefined, 5);
        code(
          ctx,
          api,
          `${g.count} × ${num(g.weight, 4)}`,
          x,
          690 + j * 43,
          27,
          j ? themeColors.red : themeColors.green,
        );
        xx += width;
      });
      code(
        ctx,
        api,
        'weighted total: ' + (totalEarned ? num(a.mass) : '?'),
        x,
        800,
        30,
        themeColors.yellow,
      );
      {
        datum(
          ctx,
          api,
          'ESS ' + num(a.ess, 2),
          x + 260,
          850,
          done('ess-result') && (!clipping || done('clipped-difference')),
          themeColors.yellow,
          34,
        );
        datum(
          ctx,
          api,
          pc(a.rate, 2),
          x + 260,
          920,
          clipping ? done('clipped-rates') : true,
          color,
          38,
        );
      }
    });
    label(
      ctx,
      api,
      'Tiles: resolved / failed · bars: low-risk / high-risk weight mass',
      960,
      535,
      themeColors.muted,
      27,
    );
    if (done('clipped-difference'))
      label(ctx, api, 'Clipped contrast: −3.33 points', 960, 270, themeColors.pink, 32);
    footer(
      ctx,
      api,
      clipping
        ? 'Separate raw-weight cap: common weights stay 10/9.'
        : 'Multiply every weight by the same constant; the normalized mean stays fixed.',
    );
  });
}
export default {
  id: 'weight-choices',
  draw: drawWeightChoices,
  cues: [
    'cau-weight-choices-0',
    'cau-ess-result',
    'cau-weight-choices-1',
    'cau-stabilize-half',
    'cau-weight-choices-2',
    'cau-clip-five',
    'cau-clipped-rates',
    'cau-clipped-difference',
    'cau-clip-total',
  ],
};
