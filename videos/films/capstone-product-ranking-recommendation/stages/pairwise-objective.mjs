import { sum } from '../arithmetic.mjs';
import { arrow, cueProgress, cueVisible, footer, rankingText } from '../defaults.mjs';
export function drawPairwiseObjective(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('pairwise-objective-mechanism', () => {
    const d = [-0.1, 0.6],
      gradient = d.map((v) => -v / 2),
      weights = gradient.map((v) => -0.3 * v),
      margin = sum(d.map((v, i) => v * weights[i]));
    rankingText(ctx, api, 'Actual CSV pair · A2 preferred to A1', 150, 270, 34);
    const plot = teaching.axes({
      x: 220,
      y: 405,
      width: 520,
      height: 520,
      xDomain: [-0.25, 1],
      yDomain: [-0.25, 1],
      xTicks: [0, 0.5, 1],
      yTicks: [0, 0.5, 1],
      xLabel: 'text match',
      yLabel: 'quality',
      equalUnits: true,
      fontSize: 23,
    });
    const A1 = plot.point(0.95, 0.3),
      A2 = plot.point(0.85, 0.9),
      zero = plot.point(0, 0);
    api.circle(ctx, A1.x, A1.y, 10, themeColors.blue);
    api.circle(ctx, A2.x, A2.y, 10, themeColors.green);
    rankingText(ctx, api, 'A1', A1.x - 55, A1.y + 35, 25, themeColors.blue);
    rankingText(ctx, api, 'A2', A2.x - 55, A2.y - 20, 25, themeColors.green);
    if (cueVisible(ctx, api, 'pair-difference')) {
      arrow(
        ctx,
        api,
        A1.x,
        A1.y,
        A2.x,
        A2.y,
        themeColors.yellow,
        cueProgress(ctx, api, 'pair-difference'),
      );
      rankingText(ctx, api, 'd = [−0.10, +0.60]', 1050, 405, 36, themeColors.yellow);
    }
    if (currentBeat === 0) {
      if (cueVisible(ctx, api, 'pair-margin'))
        rankingText(ctx, api, 'margin = w · d', 1050, 600, 40, themeColors.cyan);
    } else if (currentBeat === 1) {
      rankingText(ctx, api, 'At w=[0,0]: sigmoid(−margin)=0.5', 1000, 355, 29, themeColors.muted);
      if (cueProgress(ctx, api, 'pair-gradient') === 1)
        rankingText(ctx, api, '∇loss = −d×0.5 = [0.05, −0.30]', 1000, 550, 31, themeColors.pink);
      if (cueVisible(ctx, api, 'pair-update')) {
        const tip = plot.point(weights[0] * 6, weights[1] * 6);
        arrow(
          ctx,
          api,
          zero.x,
          zero.y,
          tip.x,
          tip.y,
          themeColors.cyan,
          cueProgress(ctx, api, 'pair-update'),
        );
        rankingText(ctx, api, 'w =0 −0.3∇loss', 1000, 690, 37, themeColors.cyan);
        if (cueProgress(ctx, api, 'pair-update') === 1)
          rankingText(
            ctx,
            api,
            '[−0.015, 0.090] · margin ' + margin.toFixed(4),
            1000,
            790,
            31,
            themeColors.green,
          );
        footer(
          ctx,
          api,
          'Weight arrow is displayed6× for visibility; feature axes remain in actual units.',
        );
      }
    } else {
      rankingText(ctx, api, 'log(1+exp(−margin))', 1050, 515, 38, themeColors.cyan);
      if (cueVisible(ctx, api, 'pair-average'))
        rankingText(
          ctx,
          api,
          'Mean over every directed training pair',
          1050,
          610,
          31,
          themeColors.blue,
        );
      if (cueVisible(ctx, api, 'pair-regularize'))
        rankingText(
          ctx,
          api,
          '+ λw gradient · +½λ||w||² objective',
          1050,
          750,
          31,
          themeColors.yellow,
        );
      footer(
        ctx,
        api,
        'Stable sigmoid evaluation avoids an unstable direct exponential; linear scorer differs from neural RankNet.',
      );
    }
  });
}
export default {
  id: 'pairwise-objective',
  draw: drawPairwiseObjective,
  cues: [
    'pair-difference',
    'pair-margin',
    'pair-gradient',
    'pair-update',
    'pair-average',
    'pair-regularize',
  ],
};
