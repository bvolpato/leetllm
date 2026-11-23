import { dcg } from '../arithmetic.mjs';
import { bar, box, cueVisible, footer, rankingText } from '../defaults.mjs';
export function drawMetricContracts(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('metric-contracts-mechanism', () => {
    if (currentBeat === 0) {
      rankingText(ctx, api, 'Fixed label-printer universe · P5/P6/P4 · grades3/2/1', 150, 270, 32);
      const grades = [1, 3, 2],
        gainReady = cueVisible(ctx, api, 'metric-gains'),
        discountReady = cueVisible(ctx, api, 'metric-discount');
      ['P4', 'P5', 'P6'].forEach((id, i) => {
        const y = 390 + i * 145,
          gain = 2 ** grades[i] - 1,
          discount = Math.log2(i + 2);
        rankingText(
          ctx,
          api,
          'rank ' + (i + 1) + ' · ' + id + ' · grade ' + grades[i],
          170,
          y + 36,
          29,
          themeColors.blue,
        );
        if (gainReady) {
          bar(
            ctx,
            api,
            730,
            y,
            600,
            56,
            gain / (discountReady ? discount : 1),
            7,
            themeColors.cyan,
          );
          if (discountReady)
            rankingText(
              ctx,
              api,
              gain + ' / log2(' + (i + 2) + ') = ' + (gain / discount).toFixed(3),
              1420,
              y + 38,
              28,
              themeColors.cyan,
            );
          else
            api.math(
              ctx,
              String.raw`2^{${grades[i]}}-1=${gain}`,
              1420,
              y + 38,
              28,
              themeColors.cyan,
            );
        }
      });
      if (cueVisible(ctx, api, 'metric-normalize')) {
        rankingText(
          ctx,
          api,
          'Observed DCG ' + dcg(grades).toFixed(3) + ' / fixed IDCG ' + dcg([3, 2, 1]).toFixed(3),
          960,
          885,
          34,
          themeColors.yellow,
          'center',
        );
        rankingText(
          ctx,
          api,
          'NDCG = ' + (dcg(grades) / dcg([3, 2, 1])).toFixed(3),
          960,
          960,
          38,
          themeColors.green,
          'center',
        );
      }
    } else if (currentBeat === 1) {
      rankingText(ctx, api, 'Binary candidate recall uses grade ≥2', 150, 270, 34);
      ['P4', 'P5', 'P6'].forEach((id, i) => {
        const grade = [1, 3, 2][i];
        box(ctx, api, id + ' · grade' + grade, 170 + i * 560, 390, 500, 90, themeColors.blue, 33);
        if (cueVisible(ctx, api, 'metric-recall'))
          rankingText(
            ctx,
            api,
            grade >= 2 ? 'Relevant' : 'Not binary-relevant',
            420 + i * 560,
            590,
            29,
            grade >= 2 ? themeColors.green : themeColors.muted,
            'center',
          );
      });
      if (cueVisible(ctx, api, 'metric-recall')) {
        rankingText(
          ctx,
          api,
          'Retrieved relevant2 / eligible relevant2 =1',
          960,
          745,
          36,
          themeColors.cyan,
          'center',
        );
        rankingText(
          ctx,
          api,
          'Grade1 still owns gain1 in NDCG',
          960,
          835,
          31,
          themeColors.yellow,
          'center',
        );
      }
      if (cueVisible(ctx, api, 'metric-guards'))
        box(
          ctx,
          api,
          'Duplicate P5 / changed grade / unknown P99 → reject',
          210,
          925,
          1500,
          70,
          themeColors.pink,
          29,
        );
    } else {
      rankingText(ctx, api, 'MRR worksheet · first relevant product at rank3', 150, 270, 34);
      [0, 1, 3].forEach((grade, i) => {
        box(
          ctx,
          api,
          'Rank' + (i + 1) + ' · grade' + grade,
          180 + i * 560,
          405,
          500,
          90,
          grade >= 2 ? themeColors.green : themeColors.blue,
          32,
        );
        rankingText(
          ctx,
          api,
          grade >= 2 ? 'first relevant' : 'not relevant',
          430 + i * 560,
          625,
          29,
          grade >= 2 ? themeColors.green : themeColors.muted,
          'center',
        );
      });
      if (cueVisible(ctx, api, 'metric-mrr')) {
        rankingText(
          ctx,
          api,
          'Reciprocal rank =1 /3 ≈0.333',
          960,
          825,
          41,
          themeColors.cyan,
          'center',
        );
        footer(ctx, api, 'Average per-query reciprocal ranks; no relevant result contributes0.');
      }
    }
  });
}
export default {
  id: 'metric-contracts',
  draw: drawMetricContracts,
  cues: [
    'metric-gains',
    'metric-discount',
    'metric-normalize',
    'metric-recall',
    'metric-guards',
    'metric-mrr',
  ],
};
