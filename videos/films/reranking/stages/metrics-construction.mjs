import {
  coreEquation,
  coreText,
  cueDone,
  cueProgress,
  cueVisible,
  focusTargets,
  rectangle,
} from '../defaults.mjs';
export function drawMetricsConstruction(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    focusTargets(
      ctx,
      api,
      [
        'rr-premises',
        'mrr-before',
        'promote-first',
        'keep-missing',
        'recall-ceiling',
        'graded-premises',
        'dcg-terms',
        'ideal-terms',
        'ndcg-value',
        'deduplicate-gain',
      ],
      () => {
        if (currentBeat === 0) {
          const move = cueProgress(ctx, api, 'promote-first');
          coreText(
            ctx,
            api,
            'Same three queries, including the miss',
            150,
            310,
            34,
            themeColors.ink,
          );
          [0, 1, 2].forEach((i) => {
            const x = 230 + i * 570;
            coreText(ctx, api, 'Q' + (i + 1), x + 160, 390, 34, themeColors.yellow, 'center');
            for (let r = 0; r < 3; r++) {
              rectangle(ctx, api, x, 440 + r * 110, 320, 75, themeColors.muted);
              coreText(
                ctx,
                api,
                String(r + 1),
                x - 35,
                487 + r * 110,
                27,
                themeColors.muted,
                'right',
              );
            }
            if (i < 2) {
              const y = 440 + (i === 0 ? 2 * (1 - move) : 0) * 110;
              rectangle(ctx, api, x, y, 320, 75, themeColors.green);
              coreText(ctx, api, 'relevant', x + 160, y + 49, 29, themeColors.green, 'center');
            } else coreText(ctx, api, 'none found', x + 160, 875, 30, themeColors.pink, 'center');
            if (cueVisible(ctx, api, 'rr-premises'))
              coreText(
                ctx,
                api,
                i === 0
                  ? move === 1
                    ? 'RR = 1'
                    : move > 0
                      ? 'RR pending'
                      : 'RR = 1/3'
                  : i === 1
                    ? 'RR = 1'
                    : 'RR = 0',
                x + 160,
                825,
                32,
                i < 2 ? themeColors.green : themeColors.pink,
                'center',
              );
          });
          if (move === 0 && cueDone(ctx, api, 'mrr-before'))
            coreEquation(
              ctx,
              api,
              String.raw`\mathrm{MRR}=\frac{1/3+1+0}{3}=\frac49`,
              960,
              960,
              42,
              themeColors.cyan,
            );
          else if (cueDone(ctx, api, 'promote-first'))
            coreEquation(
              ctx,
              api,
              String.raw`\mathrm{MRR}=\frac{1+1+0}{3}=\frac23`,
              960,
              960,
              42,
              themeColors.cyan,
            );
          else if (cueVisible(ctx, api, 'mrr-before'))
            coreText(ctx, api, 'MRR pending', 960, 960, 32, themeColors.muted, 'center');
        } else {
          const ideal = currentBeat === 2;
          coreText(
            ctx,
            api,
            ideal ? 'Same labels · ideal ordering' : 'Actual ordering · cutoff k=2',
            150,
            305,
            34,
            themeColors.ink,
          );
          const grades = ideal ? [2, 1, 0] : [0, 2, 1],
            weights = [1, 1 / Math.log2(3), 0.5];
          coreEquation(
            ctx,
            api,
            String.raw`\frac{2^{\mathrm{grade}}-1}{\log_2(\mathrm{rank}+1)}`,
            1480,
            266,
            36,
            themeColors.yellow,
          );
          const reveal = ideal
            ? cueProgress(ctx, api, 'ideal-terms')
            : cueProgress(ctx, api, 'dcg-terms');
          grades.forEach((g, i) => {
            const x = 230 + i * 550;
            coreText(ctx, api, 'rank ' + (i + 1), x + 170, 395, 31, themeColors.muted, 'center');
            rectangle(ctx, api, x, 450, 340, 120, i < 2 ? themeColors.blue : themeColors.muted);
            coreText(
              ctx,
              api,
              'grade ' + g,
              x + 170,
              520,
              35,
              i < 2 ? themeColors.blue : themeColors.muted,
              'center',
            );
            if (i < 2 && reveal > i * 0.3) {
              coreText(
                ctx,
                api,
                'gain ' + (2 ** g - 1),
                x + 170,
                655,
                31,
                themeColors.yellow,
                'center',
              );
              coreText(
                ctx,
                api,
                '÷ log₂(' + String(i + 2) + ')',
                x + 170,
                725,
                31,
                themeColors.ink,
                'center',
              );
              const value = (2 ** g - 1) * weights[i];
              if (cueDone(ctx, api, ideal ? 'ideal-terms' : 'dcg-terms')) {
                api.rect(ctx, x, 790, (340 * value) / 3, 40, themeColors.green, undefined, 0);
                coreText(ctx, api, value.toFixed(3), x + 170, 900, 31, themeColors.green, 'center');
              }
            }
            if (i === 2)
              coreText(ctx, api, 'outside cutoff', x + 170, 660, 29, themeColors.muted, 'center');
          });
          if (ideal && cueDone(ctx, api, 'ndcg-value'))
            coreEquation(
              ctx,
              api,
              String.raw`\mathrm{NDCG@2}=\frac{1.893}{3.631}=0.521`,
              960,
              990,
              40,
              themeColors.green,
            );
          else if (!ideal && cueDone(ctx, api, 'dcg-terms'))
            coreText(
              ctx,
              api,
              'DCG@2 = 0 + 3/log₂3 = 1.893',
              960,
              990,
              33,
              themeColors.green,
              'center',
            );
        }
      },
    );
  }
}
export default {
  id: 'metrics-construction',
  draw: drawMetricsConstruction,
  cues: [
    'rr-premises',
    'mrr-before',
    'promote-first',
    'keep-missing',
    'recall-ceiling',
    'graded-premises',
    'dcg-terms',
    'ideal-terms',
    'ndcg-value',
    'deduplicate-gain',
  ],
};
