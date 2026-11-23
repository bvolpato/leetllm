import { buildCurrentSlate } from '../model.mjs';
import { box, cueProgress, cueVisible, footer, miniSlate, rankingText } from '../defaults.mjs';
export function drawFreshRanking(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  api.focus.target('fresh-ranking-mechanism', () => {
    const { C } = api,
      b = state.beat ?? 0;
    {
      const data = [
          {
            id: 'J1',
            x: 0.8,
            y: 0.2,
            score: 0.16,
            stock: true,
            allowed: true,
            seller: 'S1',
          },
          {
            id: 'J2',
            x: 0.7,
            y: 0.9,
            score: 1.01,
            stock: true,
            allowed: true,
            seller: 'S2',
          },
          {
            id: 'J3',
            x: 0.6,
            y: 0.6,
            score: 0.66,
            stock: !cueVisible(ctx, api, 'ranking-stock'),
            allowed: true,
            seller: 'S3',
          },
        ],
        fallback = {
          id: 'J5',
          x: 0.5,
          y: 0.3,
          score: 0.31,
          stock: true,
          allowed: true,
          seller: 'S5',
        },
        reveal = b > 0 || cueProgress(ctx, api, 'ranking-order') === 1,
        newscore = b > 1 || cueProgress(ctx, api, 'ranking-newscore') === 1;
      rankingText(
        ctx,
        api,
        'Portable-lamp worksheet · supplied rounded w=[−0.1,1.2]',
        150,
        270,
        32,
        C.cyan,
      );
      if (b < 2)
        data.forEach((r, i) => {
          const y = 390 + i * 160,
            progress = b > 0 ? 1 : cueProgress(ctx, api, 'ranking-j' + (i + 1));
          box(
            ctx,
            api,
            r.id + ' · [' + r.x + ',' + r.y + ']',
            170,
            y,
            500,
            80,
            r.stock ? C.blue : C.pink,
            31,
          );
          if (progress > 0) {
            const positive = 1.2 * r.y,
              negative = 0.1 * r.x,
              scale = 550;
            api.rect(ctx, 760, y + 70, positive * scale * progress, 18, C.cyan, undefined, 0);
            api.rect(
              ctx,
              760 + r.score * scale * progress,
              y + 70,
              negative * scale * progress,
              18,
              C.pink,
              undefined,
              0,
            );
          }
          if (b > 0 || progress === 1)
            rankingText(
              ctx,
              api,
              '−0.1×' + r.x + ' +1.2×' + r.y + ' = ' + r.score.toFixed(2),
              760,
              y + 49,
              30,
              C.cyan,
            );
          if (!r.stock) rankingText(ctx, api, 'stock false', 1560, y + 49, 30, C.pink);
        });
      if (b === 0) {
        if (!reveal)
          rankingText(
            ctx,
            api,
            'Predict the order; keep the supplied features fixed',
            960,
            940,
            38,
            C.yellow,
            'center',
          );
        else rankingText(ctx, api, 'J2 > J3 > J1', 960, 940, 41, C.green, 'center');
      }
      if (b === 1) {
        if (cueVisible(ctx, api, 'ranking-fallback')) {
          box(ctx, api, 'New eligible J5 · [0.5,0.3]', 170, 900, 500, 75, C.yellow, 28);
          if (newscore) rankingText(ctx, api, '−0.05 +0.36 =0.31', 760, 945, 31, C.cyan);
        }
        if (cueProgress(ctx, api, 'ranking-rebuild') === 1)
          rankingText(
            ctx,
            api,
            'Current eligible order: J2 > J5 > J1',
            960,
            345,
            33,
            C.green,
            'center',
          );
        else if (cueVisible(ctx, api, 'ranking-stock'))
          footer(
            ctx,
            api,
            'Reject the stale J2/J3/J1 proposal; its score cannot override changed stock.',
          );
      }
      if (b === 2) {
        const order = buildCurrentSlate([
          ...data.map((r) => ({
            ...r,
            stock: r.id !== 'J3',
          })),
          fallback,
        ]);
        rankingText(
          ctx,
          api,
          'Current eligible objects · same supplied scorer',
          170,
          350,
          29,
          C.blue,
        );
        [...data, fallback].forEach((r, i) => {
          const y = 395 + i * 105;
          box(
            ctx,
            api,
            r.id + ' · [' + r.x + ',' + r.y + '] · ' + r.score.toFixed(2),
            170,
            y,
            650,
            75,
            r.stock ? C.blue : C.pink,
            29,
          );
          if (!r.stock) rankingText(ctx, api, 'excluded', 860, y + 47, 26, C.pink);
        });
        if (cueVisible(ctx, api, 'ranking-save')) {
          miniSlate(ctx, api, order, 1110, 405, 580);
          rankingText(
            ctx,
            api,
            'Retained new snapshot · ' + order.map((r) => r.id).join(' / '),
            960,
            875,
            35,
            C.green,
            'center',
          );
        }
        if (cueVisible(ctx, api, 'ranking-click'))
          box(
            ctx,
            api,
            'Later click → retained request + product + time/attribution checks',
            210,
            925,
            1500,
            75,
            C.yellow,
            29,
          );
      }
    }
  });
}
export default {
  id: 'fresh-ranking',
  draw: drawFreshRanking,
  cues: [
    'ranking-predict',
    'ranking-reveal',
    'ranking-j1',
    'ranking-j2',
    'ranking-j3',
    'ranking-order',
    'ranking-stock',
    'ranking-fallback',
    'ranking-newscore',
    'ranking-rebuild',
    'ranking-save',
    'ranking-click',
  ],
};
