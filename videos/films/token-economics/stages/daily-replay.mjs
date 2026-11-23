import { cueProgress } from '../construction.mjs';
import {
  conciseMicro,
  dailySlices,
  dailyTotalMicro,
  evaluationMicro,
  optimizedDailyMicro,
  prefixMicro,
  semanticHits,
} from '../fixtures.mjs';
import { usd } from '../forecast-calendar.mjs';
import { text } from '../defaults.mjs';

export default {
  id: 'daily-replay',
  cues: ['price-cohorts', 'change-exception', 'avoided-cost', 'avoided-total'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const beat = state.beat ?? 0,
      p = state.beatP ?? 0;
    const price = beat > 1 ? 1 : beat === 1 ? cueProgress(state, 'price-cohorts', p) : 0;
    const short = beat > 2 || (beat === 2 && cueProgress(state, 'change-exception', p) > 0);
    const rows = [
      ['Stored policy reply', 'Stored text returned', semanticHits, 0, C.green],
      [
        'Generated policy reply',
        '1,800 input · 1,280 read · 180 output',
        dailySlices[0].requests,
        prefixMicro,
        C.blue,
      ],
      [
        'Live order',
        '900 input · 0 read · 95 output',
        dailySlices[1].requests,
        dailySlices[1].cost,
        C.cyan,
      ],
      [
        'Access exception',
        '2,200 input · 1,280 read · ' + (short ? 130 : 220) + ' output',
        dailySlices[2].requests,
        short ? conciseMicro : dailySlices[2].cost,
        C.pink,
      ],
    ];
    text(ctx, api, 'Support requests', 155, 288, 39, C.ink, 'left');
    text(ctx, api, 'Calls per day', 826, 288, 30, C.muted);
    text(ctx, api, 'USD per call', 1100, 288, 30, C.muted);
    text(ctx, api, 'Generation per day', 1500, 288, 32, C.ink);
    api.focus.target('cohorts', () => {
      rows.forEach(([name, detail, count, unit, color], i) => {
        const y = 390 + i * 128;
        text(ctx, api, name, 155, y, 36, color, 'left');
        text(ctx, api, detail, 155, y + 45, 27, C.muted, 'left');
        text(ctx, api, count.toLocaleString('en-US'), 826, y, 36, C.ink);
        text(ctx, api, usd(unit, unit ? 6 : 2), 1100, y, 33, C.ink);
        const spend = count * unit;
        const progress = api.clamp(4 * price - i);
        if (progress > 0 && spend)
          api.rect(ctx, 1320, y + 17, 410 * (spend / 11025000) * progress, 19, color, undefined, 0);
        if (progress === 1) text(ctx, api, usd(spend, 3), 1320, y, 35, color, 'left');
      });
    });
    if (beat === 0)
      text(ctx, api, 'Which group spends the most on generation?', 960, 942, 40, C.ink);
    if (beat === 1 && price === 1)
      text(ctx, api, 'Live orders: 3,000 × $0.003675 = $11.025 per day', 960, 942, 38, C.cyan);
    if (beat >= 2) {
      api.focus.target('daily-total', () => {
        const support = short
          ? optimizedDailyMicro
          : dailySlices.reduce((sum, r) => sum + r.requests * r.cost, 0);
        text(
          ctx,
          api,
          usd(support, 3) +
            ' support  +  ' +
            usd(evaluationMicro, 3) +
            ' evaluation  =  ' +
            usd(support + evaluationMicro, 3) +
            ' / day',
          960,
          901,
          39,
          C.ink,
        );
      });
      if (beat === 3)
        api.focus.target('avoided', () => {
          const price = cueProgress(state, 'avoided-cost', api.phase(p, 0.1, 0.2)) > 0;
          const total = cueProgress(state, 'avoided-total', api.phase(p, 0.35, 0.5)) === 1;
          text(
            ctx,
            api,
            price
              ? 'Avoided generation: 3,200 × ' +
                  usd(prefixMicro, 5) +
                  ' = ' +
                  (total
                    ? usd(semanticHits * prefixMicro, 3) +
                      ' outside the ' +
                      usd(dailyTotalMicro, 3) +
                      ' total'
                    : '?')
              : 'What did the stored answers avoid?',
            960,
            991,
            30,
            C.green,
          );
        });
    }
  },
};
