import { dcg } from '../arithmetic.mjs';
import { diversifiedPair } from '../model.mjs';
import {
  bar,
  box,
  cueProgress,
  cueVisible,
  footer,
  miniSlate,
  rankingText,
  tile,
} from '../defaults.mjs';
export function drawFunnelContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('funnel-contract-mechanism', () => {
    if (currentBeat === 0) {
      rankingText(ctx, api, 'Authored catalog · 10 listings · 2 query identities', 150, 265, 34);
      const groups = [
        ['insulated-bag', ['P9', 'P1', 'P10', 'P2', 'P3'], [0.99, 0.96, 0.95, 0.88, 0.84]],
        ['label-printer', ['P8', 'P11', 'P5', 'P6', 'P4'], [0.98, 0.97, 0.93, 0.86, 0.74]],
      ];
      groups.forEach(([name, ids, scores], g) => {
        const x = 170 + g * 860;
        rankingText(ctx, api, name, x, 350, 31, themeColors.cyan);
        ids.forEach((id, i) => {
          const rejected = ['P9', 'P10', 'P8', 'P11'].includes(id),
            y = 405 + i * 100;
          tile(ctx, api, id, scores[i], x, y, rejected ? themeColors.pink : themeColors.blue, 450);
          if (cueVisible(ctx, api, 'funnel-catalog'))
            rankingText(
              ctx,
              api,
              rejected ? 'ineligible' : 'candidate',
              x + 515,
              y + 46,
              26,
              rejected ? themeColors.pink : themeColors.green,
            );
        });
      });
      if (cueVisible(ctx, api, 'funnel-cutoffs'))
        footer(
          ctx,
          api,
          'Fixture: candidate budget3 / display3; change and evaluate these cutoffs separately.',
        );
    } else if (currentBeat === 1) {
      rankingText(
        ctx,
        api,
        'Same eligible identities · architecture cannot grant permission',
        150,
        270,
        33,
      );
      miniSlate(
        ctx,
        api,
        [
          {
            id: 'P4',
          },
          {
            id: 'P5',
          },
          {
            id: 'P6',
          },
        ],
        170,
        400,
        350,
      );
      rankingText(ctx, api, 'Linear fixture: score = w · features', 780, 415, 32, themeColors.cyan);
      box(ctx, api, 'Shared preference: P5 > P4', 760, 500, 960, 90, themeColors.green, 32);
      if (cueVisible(ctx, api, 'funnel-pair')) {
        const delta = Math.abs(((7 - 1) * (1 - 1 / Math.log2(3))) / dcg([3, 2, 1]));
        rankingText(
          ctx,
          api,
          'LambdaMART: pair updates can carry |ΔNDCG|',
          760,
          710,
          31,
          themeColors.yellow,
        );
        rankingText(
          ctx,
          api,
          'Grade3 ↔ grade1 at ranks1/2: ' + delta.toFixed(3) + ' metric change',
          760,
          800,
          27,
          themeColors.yellow,
        );
      }
      footer(
        ctx,
        api,
        'This lab fits a two-feature linear pairwise objective; no LambdaMART trainer is executed.',
      );
    } else {
      const second = cueVisible(ctx, api, 'mmr-second'),
        rows = second
          ? diversifiedPair(cueProgress(ctx, api, 'mmr-second'))
          : [
              {
                id: 'P5',
                positive: 0.6 * 0.96,
                value: 0.6 * 0.96,
                subtracted: 0,
              },
              {
                id: 'P6',
                positive: 0.6 * 0.84,
                value: 0.6 * 0.84,
                subtracted: 0,
              },
              {
                id: 'P4',
                positive: 0.6 * 0.45,
                value: 0.6 * 0.45,
                subtracted: 0,
              },
            ];
      rankingText(ctx, api, 'MMR worksheet · 0.6 relevance − 0.4 max similarity', 150, 270, 33);
      if (second)
        box(
          ctx,
          api,
          'Selected P5 · keep its identity fixed',
          180,
          355,
          1520,
          75,
          themeColors.green,
          30,
        );
      rows.forEach((row, i) => {
        const y = (second ? 510 : 420) + i * 150,
          x = 480,
          scale = 1700;
        rankingText(
          ctx,
          api,
          row.id,
          170,
          y + 35,
          34,
          row.id === 'P4' ? themeColors.yellow : themeColors.blue,
        );
        bar(
          ctx,
          api,
          x,
          y,
          1020,
          55,
          row.positive * (second ? 1 : cueProgress(ctx, api, 'mmr-first')),
          0.6,
          themeColors.blue,
        );
        if (row.subtracted > 0)
          api.rect(
            ctx,
            x + scale * row.value,
            y,
            scale * row.subtracted,
            55,
            themeColors.pink,
            undefined,
            0,
          );
        if (cueProgress(ctx, api, 'mmr-first') === 1)
          rankingText(ctx, api, row.value.toFixed(3), 1630, y + 38, 35, themeColors.cyan, 'right');
        rankingText(
          ctx,
          api,
          second
            ? cueProgress(ctx, api, 'mmr-second') === 1
              ? '0.6×' + row.relevance + ' − 0.4×' + row.similarity + ' = ' + row.value.toFixed(3)
              : row.positive.toFixed(3) +
                ' − applied ' +
                row.subtracted.toFixed(3) +
                ' = ' +
                row.value.toFixed(3)
            : 'Redundancy is0 before the first selection',
          x,
          y + 110,
          27,
          themeColors.muted,
        );
      });
      if (second && cueProgress(ctx, api, 'mmr-second') === 1)
        rankingText(
          ctx,
          api,
          'P4 wins slot2: 0.230 > 0.144',
          960,
          955,
          36,
          themeColors.green,
          'center',
        );
      footer(
        ctx,
        api,
        'Computed diversification worksheet; no MMR constructor is implemented in the article lab.',
      );
    }
  });
}
export default {
  id: 'funnel-contract',
  draw: drawFunnelContract,
  cues: ['funnel-catalog', 'funnel-cutoffs', 'funnel-pair', 'mmr-first', 'mmr-second'],
};
