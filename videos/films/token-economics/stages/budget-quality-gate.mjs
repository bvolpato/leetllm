import { cueProgress } from '../construction.mjs';
import {
  budgetMicro,
  coldNightExtraMicro,
  evaluationMicro,
  monthlyMicro,
  optimizedDailyMicro,
  qualityRate,
} from '../fixtures.mjs';
import { text } from '../defaults.mjs';
import { usd } from '../forecast-calendar.mjs';

export default {
  id: 'budget-quality-gate',
  cues: ['grow-support', 'review-sample', 'cold-month'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const beat = state.beat ?? 0;
    const growth =
      beat === 2 ? 1 : beat === 1 ? cueProgress(state, 'grow-support', state.beatP ?? 0) : 0;
    const cold = beat === 3 ? cueProgress(state, 'cold-month', state.beatP ?? 0) : 0;
    const evaluation = evaluationMicro + Math.round(coldNightExtraMicro * cold);
    const extra = Math.round(optimizedDailyMicro * 0.1 * growth);
    const support = optimizedDailyMicro + extra,
      total = 30 * (support + evaluation);
    text(ctx, api, '30-day generation forecast', 185, 303, 44, C.ink, 'left');
    api.focus.target('daily-terms', () => {
      text(ctx, api, 'Support  ' + usd(support, 4) + ' / day', 185, 404, 39, C.cyan, 'left');
      text(
        ctx,
        api,
        'Nightly checks  ' + usd(evaluation) + ' / day',
        1030,
        404,
        39,
        C.yellow,
        'left',
      );
      const x = 185,
        y = 544,
        scale = 1510 / 840e6;
      const supportWidth = 30 * support * scale;
      api.rect(ctx, x, y, supportWidth, 87, C.cyan, undefined, 0);
      api.rect(ctx, x + supportWidth, y, 30 * evaluation * scale, 87, C.yellow, undefined, 0);
      const budgetX = x + budgetMicro * scale;
      api.line(ctx, budgetX, y - 50, budgetX, y + 115, C.ink, 4);
      text(ctx, api, '$750 budget', budgetX, y - 70, 32, C.ink);
      text(
        ctx,
        api,
        usd(total) + ' forecast',
        x,
        725,
        54,
        total > budgetMicro ? C.pink : C.ink,
        'left',
      );
      text(
        ctx,
        api,
        total === monthlyMicro
          ? '$32.82 left at base traffic'
          : 'Base forecast  ' + usd(monthlyMicro),
        1700,
        720,
        35,
        C.muted,
        'right',
      );
    });
    if (beat === 0)
      text(ctx, api, 'Support volume rises 10%. Which daily term changes?', 960, 897, 38, C.ink);
    if (beat === 1 && growth === 1)
      text(
        ctx,
        api,
        usd(total - budgetMicro) + ' over budget with the same nightly checks',
        960,
        897,
        38,
        C.pink,
      );
    if (beat === 2)
      api.focus.target('quality-report', () => {
        text(
          ctx,
          api,
          'Cited answers  1,994 / 2,000   (' + (100 * qualityRate).toFixed(1) + '%)',
          185,
          846,
          35,
          C.green,
          'left',
        );
        text(ctx, api, 'Unsafe stored replies  0 / 1,200 reviewed', 185, 916, 35, C.green, 'left');
        text(ctx, api, 'Volume forecast: HOLD', 1700, 906, 38, C.pink, 'right');
      });
    if (beat === 3 && cold === 1)
      text(
        ctx,
        api,
        '30 cold nights × $2.88 extra = $86.40 above the base forecast',
        960,
        897,
        38,
        C.ink,
      );
  },
};
