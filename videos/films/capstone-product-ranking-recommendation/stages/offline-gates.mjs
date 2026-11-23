import { dcg } from '../arithmetic.mjs';
import { bar, box, cueVisible, footer, rankingText } from '../defaults.mjs';
export function drawOfflineGates(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('offline-gates-mechanism', () => {
    if (currentBeat === 0) {
      rankingText(
        ctx,
        api,
        'Hand-entered regression scores · separate from fitted model',
        150,
        270,
        32,
      );
      ['insulated-bag', 'label-printer'].forEach((name, i) => {
        const y = 410 + i * 220,
          baseline = i ? 0.7363636171343382 : 0.9721212198129314;
        rankingText(ctx, api, name, 170, y + 35, 30, themeColors.blue);
        if (cueVisible(ctx, api, 'offline-per-query')) {
          bar(ctx, api, 610, y, 1020, 55, baseline, 1, themeColors.blue);
          rankingText(ctx, api, baseline.toFixed(3), 1800, y + 35, 32, themeColors.blue, 'right');
          bar(ctx, api, 610, y + 90, 1020, 55, 1, 1, themeColors.green);
          rankingText(ctx, api, '1.000', 1800, y + 125, 32, themeColors.green, 'right');
        }
      });
      if (cueVisible(ctx, api, 'offline-mean'))
        rankingText(
          ctx,
          api,
          'Equal-query mean: 0.854 →1.000',
          960,
          940,
          38,
          themeColors.yellow,
          'center',
        );
    } else if (currentBeat === 1) {
      const removed = cueVisible(ctx, api, 'offline-drop');
      rankingText(ctx, api, 'Insulated-bag · fixed eligible universe P1/P3/P2', 150, 270, 33);
      ['P1', 'P3', 'P2'].forEach((id, i) => {
        box(
          ctx,
          api,
          id + ' · grade' + [3, 2, 1][i],
          200 + i * 550,
          400,
          450,
          95,
          id === 'P3' && removed ? themeColors.pink : themeColors.blue,
          32,
        );
        if (id === 'P3' && removed)
          rankingText(ctx, api, 'Missing before ranking', 975, 650, 29, themeColors.pink, 'center');
      });
      if (cueVisible(ctx, api, 'offline-universe')) {
        rankingText(
          ctx,
          api,
          'Survivor-only NDCG =1.000',
          960,
          770,
          35,
          themeColors.blue,
          'center',
        );
        rankingText(
          ctx,
          api,
          'Fixed-universe NDCG =' + (dcg([3, 1]) / dcg([3, 2, 1])).toFixed(3) + ' · recall =1/2',
          960,
          875,
          36,
          themeColors.pink,
          'center',
        );
      }
      footer(
        ctx,
        api,
        'The ranker cannot place an absent product; keep component and per-query gates.',
      );
    } else {
      rankingText(ctx, api, 'Synthetic scoring samples · milliseconds', 150, 270, 33);
      const values = [11, 13, 12, 15, 14, 16, 13, 12, 17, 18].sort((a, b) => a - b);
      values.forEach((v, i) => {
        const x = 190 + i * 155,
          height = (330 * v) / 20;
        rankingText(ctx, api, i + 1, x + 40, 390, 24, themeColors.muted, 'center');
        api.rect(ctx, x, 455, 80, 330, themeColors.panel, themeColors.muted, 0);
        api.rect(
          ctx,
          x,
          785 - height,
          80,
          height,
          i === 9 && cueVisible(ctx, api, 'offline-percentile')
            ? themeColors.yellow
            : themeColors.blue,
          undefined,
          0,
        );
        rankingText(
          ctx,
          api,
          v + '',
          x + 40,
          845,
          29,
          i === 9 && cueVisible(ctx, api, 'offline-percentile')
            ? themeColors.yellow
            : themeColors.blue,
          'center',
        );
      });
      if (cueVisible(ctx, api, 'offline-percentile'))
        rankingText(
          ctx,
          api,
          'ceil(10×0.95)=10 →18ms ≤20ms',
          960,
          940,
          38,
          themeColors.yellow,
          'center',
        );
      if (cueVisible(ctx, api, 'offline-synthetic'))
        footer(
          ctx,
          api,
          'These values were supplied, not timed; full-search and scoring endpoints differ.',
        );
    }
  });
}
export default {
  id: 'offline-gates',
  draw: drawOfflineGates,
  cues: [
    'offline-per-query',
    'offline-mean',
    'offline-drop',
    'offline-universe',
    'offline-gates',
    'offline-percentile',
    'offline-synthetic',
  ],
};
