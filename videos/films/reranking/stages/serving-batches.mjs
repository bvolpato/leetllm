import {
  caption,
  coreText,
  cueProgress,
  cueVisible,
  focusTargets,
  line,
  rectangle,
} from '../defaults.mjs';
export function drawServingBatches(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    focusTargets(
      ctx,
      api,
      [
        'cost-premises',
        'cost-three',
        'cost-four',
        'rank-three-cost',
        'length-premises',
        'unpadded-work',
        'padded-work',
        'bucket-wait',
        'historical-rate',
        'deadline-rate',
        'deadline-count',
        'timeout-fallback',
      ],
      () => {
        if (currentBeat === 0) {
          coreText(
            ctx,
            api,
            'Supplied sequential cost · 30 ms limit',
            150,
            305,
            34,
            themeColors.ink,
          );
          const unit = 40,
            start = 250;
          coreText(ctx, api, 'overhead', start, 395, 29, themeColors.muted);
          api.rect(ctx, start, 450, 4 * unit, 90, themeColors.muted, undefined, 0);
          coreText(ctx, api, '4', start + 80, 506, 31, themeColors.ink, 'center');
          const count = cueVisible(ctx, api, 'cost-four')
            ? 4
            : cueVisible(ctx, api, 'cost-three')
              ? 3
              : 0;
          for (let i = 0; i < count; i++) {
            const x = start + (4 + 7.5 * i) * unit;
            api.rect(
              ctx,
              x,
              450,
              7.5 * unit - 3,
              90,
              i === 2 ? themeColors.green : themeColors.blue,
              undefined,
              0,
            );
            coreText(ctx, api, 'pair ' + (i + 1), x + 150, 505, 29, themeColors.ink, 'center');
            coreText(ctx, api, '7.5', x + 150, 605, 28, themeColors.muted, 'center');
          }
          const limit = start + 30 * unit;
          line(ctx, api, limit, 350, limit, 435, themeColors.pink, 3);
          line(ctx, api, limit, 650, limit, 740, themeColors.pink, 3);
          coreText(ctx, api, '30 ms', limit, 800, 31, themeColors.pink, 'center');
          if (count)
            coreText(
              ctx,
              api,
              count + ' pairs: ' + (4 + 7.5 * count) + ' ms',
              960,
              900,
              37,
              count === 4 ? themeColors.pink : themeColors.green,
              'center',
            );
          if (cueVisible(ctx, api, 'rank-three-cost'))
            coreText(
              ctx,
              api,
              'Depth 2 fits, but loses the rank-3 target.',
              960,
              980,
              32,
              themeColors.pink,
              'center',
            );
        } else if (currentBeat === 1) {
          coreText(
            ctx,
            api,
            '2 pairs · lengths 64 and 256 · one tile = 16 × 16 entries',
            150,
            300,
            30,
            themeColors.ink,
          );
          const padded = cueVisible(ctx, api, 'padded-work');
          for (let i = 0; i < 2; i++) {
            const x = 180 + i * 800,
              side = 400;
            coreText(
              ctx,
              api,
              'pair ' + (i + 1) + ' · ' + (i ? 256 : 64) + ' tokens',
              x + 200,
              395,
              30,
              themeColors.blue,
              'center',
            );
            const cells = 16;
            for (let r = 0; r < cells; r++)
              for (let c = 0; c < cells; c++) {
                const useful = i === 1 || (r < 4 && c < 4);
                api.rect(
                  ctx,
                  x + c * 25,
                  450 + r * 25,
                  23,
                  23,
                  useful ? themeColors.blue : padded ? themeColors.pink : themeColors.panel,
                  themeColors.muted,
                  0,
                );
              }
            coreText(
              ctx,
              api,
              i ? '65,536 entries' : padded ? '4,096 useful + 61,440 padding' : '4,096 entries',
              x + 200,
              920,
              29,
              i ? themeColors.blue : padded ? themeColors.pink : themeColors.blue,
              'center',
            );
          }
          if (cueVisible(ctx, api, 'unpadded-work'))
            coreText(
              ctx,
              api,
              padded
                ? `Same 2 pairs   ·   ${(2 * 256 ** 2).toLocaleString('en-US')} padded entries   ·   ${((2 * 256 ** 2) / (64 ** 2 + 256 ** 2)).toFixed(2)}× unpadded`
                : `Unpadded total   ·   ${(64 ** 2 + 256 ** 2).toLocaleString('en-US')} entries`,
              960,
              990,
              34,
              padded ? themeColors.pink : themeColors.green,
              'center',
            );
        } else {
          coreText(
            ctx,
            api,
            'Published card: 1,800 pairs/s on its V100 benchmark',
            150,
            310,
            31,
            themeColors.muted,
          );
          coreText(ctx, api, 'Separate supplied deadline worksheet', 150, 430, 34, themeColors.ink);
          if (cueVisible(ctx, api, 'deadline-rate')) {
            rectangle(ctx, api, 250, 525, 1400, 100, themeColors.blue);
            const progress = cueProgress(ctx, api, 'deadline-count');
            api.rect(ctx, 250, 525, 1400 * progress, 100, themeColors.cyan, undefined, 0);
            coreText(
              ctx,
              api,
              '250 ms remaining × 300 pairs/s',
              950,
              590,
              35,
              themeColors.ink,
              'center',
            );
          }
          if (cueVisible(ctx, api, 'deadline-count'))
            coreText(
              ctx,
              api,
              '0.25 × 300 = 75 pairs before generation or tail slack',
              960,
              780,
              36,
              themeColors.yellow,
              'center',
            );
          if (cueVisible(ctx, api, 'timeout-fallback'))
            coreText(
              ctx,
              api,
              'Timeout → marked authorized fallback or abstention',
              960,
              930,
              33,
              themeColors.pink,
              'center',
            );
        }
      },
    );
    caption(
      ctx,
      api,
      'Choose the depth that reaches the evidence within the request deadline.',
    );
  }
}
export default {
  id: 'serving-batches',
  draw: drawServingBatches,
  cues: [
    'cost-premises',
    'cost-three',
    'cost-four',
    'rank-three-cost',
    'length-premises',
    'unpadded-work',
    'padded-work',
    'bucket-wait',
    'historical-rate',
    'deadline-rate',
    'deadline-count',
    'timeout-fallback',
  ],
};
