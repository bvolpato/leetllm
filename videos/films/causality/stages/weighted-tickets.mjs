import { weightedTicketFixture } from '../model.mjs';
import { cellGrid, code, datum, focusProgress, footer, label } from '../defaults.mjs';
export function drawWeightedTickets(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  const pc = (v, d = 1) => Number((100 * v).toFixed(d)) + '%',
    num = (v, d = 3) => Number(v.toFixed(d));
  api.focus.target('cau-weighted-tickets-mechanism', () => {
    const choices = false,
      clipping = false,
      stabilize = 1,
      clip = Infinity,
      arms = weightedTicketFixture({
        stabilize,
        clip,
      }),
      clipped = clip <= 5,
      totalEarned = done('common-weight');
    arms.forEach((a, i) => {
      const x = 200 + i * 850,
        color = i ? themeColors.pink : themeColors.cyan;
      label(ctx, api, a.arm + ' · ' + a.observed + ' actual tickets', x + 260, 300, color, 33);
      cellGrid(ctx, api, a.tickets, x, 355);
      let xx = x;
      a.groups.forEach((g, j) => {
        const rare = g.count === 10,
          earned = done(rare ? 'rare-weight' : 'common-weight'),
          width = g.mass * 2.5;
        api.rect(
          ctx,
          xx,
          590,
          earned ? width : 1,
          55,
          j ? themeColors.red : themeColors.green,
          undefined,
          5,
        );
        if (earned)
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
          'weighted successes ' + num(a.successMass),
          x + 260,
          850,
          done('weighted-successes'),
          color,
          31,
        );
        datum(ctx, api, pc(a.rate, 0), x + 260, 925, done('weighted-rates'), color, 39);
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
    footer(ctx, api, 'Weight mass is not the count of independently observed tickets.');
  });
}
export default {
  id: 'weighted-tickets',
  draw: drawWeightedTickets,
  cues: [
    'cau-weighted-tickets-0',
    'cau-weighted-tickets-1',
    'cau-rare-weight',
    'cau-common-weight',
    'cau-weighted-tickets-2',
    'cau-weighted-successes',
    'cau-weighted-rates',
  ],
};
