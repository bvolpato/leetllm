import { cue, phase } from '../construction.mjs';
import { biasVarianceState, wilson } from '../model.mjs';
import { axes, caption, focusTarget, interval, panel, text } from '../defaults.mjs';
export function drawBiasAndPrior(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      const n = 100 + Math.floor(9900 * cue(state, 'more-routine', 0.18, 0.33)),
        v = biasVarianceState(n),
        plot = axes(
          ctx,
          api,
          260,
          410,
          1140,
          390,
          [0.05, 0.25],
          [0, 1],
          [0.05, 0.1, 0.12, 0.176, 0.2, 0.25],
          [],
          'queue-rate target',
          '',
        ),
        at = plot.point(0.12, 0.5),
        truth = plot.point(0.176, 0.5),
        lo = plot.point(0.12 - v.standardError, 0.5),
        hi = plot.point(0.12 + v.standardError, 0.5);
      focusTarget(ctx, api, 'routine-spread', () => {
        api.line(ctx, lo.x, at.y, hi.x, at.y, themeColors.blue, 15);
        api.circle(ctx, at.x, at.y, 8, themeColors.blue);
        text(ctx, api, '±1 standard error', at.x, at.y + 67, 28, themeColors.blue, 'center');
      });
      api.line(ctx, truth.x, 370, truth.x, 800, themeColors.yellow, 4);
      focusTarget(ctx, api, 'bias-distance', () => {
        const gap = cue(state, 'bias-gap', 0.36, 0.5);
        if (gap > 0) {
          const end = api.lerp(at.x, truth.x, gap);
          api.line(ctx, at.x, 480, end, 480, themeColors.yellow, 4);
          api.line(ctx, at.x, 470, at.x, 490, themeColors.yellow, 3);
          api.line(ctx, end, 470, end, 490, themeColors.yellow, 3);
        }
        if (gap >= 1)
          text(ctx, api, '5.6 points', (at.x + truth.x) / 2, 452, 31, themeColors.yellow, 'center');
      });
      text(
        ctx,
        api,
        'Average over routine samples · 12%',
        at.x,
        345,
        30,
        themeColors.blue,
        'center',
      );
      text(ctx, api, 'queue 17.6%', truth.x, 925, 30, themeColors.yellow, 'center');
      text(ctx, api, `n = ${n.toLocaleString('en-US')}`, 1600, 420, 36, themeColors.blue, 'center');
      text(
        ctx,
        api,
        `bias² ${v.squaredBias.toFixed(6)}`,
        1600,
        570,
        34,
        themeColors.pink,
        'center',
      );
      text(
        ctx,
        api,
        `variance ${v.variance.toFixed(6)}`,
        1600,
        690,
        30,
        themeColors.cyan,
        'center',
      );
      text(ctx, api, `MSE ${v.mse.toFixed(6)}`, 1600, 810, 31, themeColors.ink, 'center');
      caption(
        ctx,
        api,
        'Independent draws from the routine lane · same population mix and slice rates',
      );
    } else if (currentBeat === 1) {
      const plot = axes(
          ctx,
          api,
          270,
          410,
          1300,
          420,
          [0, 1],
          [0, 3],
          [0, 0.2, 0.4, 0.6, 0.8, 1],
          [0, 1, 2, 3],
          'candidate rate',
          'density',
        ),
        q = phase(state.beatP ?? 0, 0.08, 0.55);
      const points = Array.from(
        {
          length: 201,
        },
        (_, i) => {
          const x = i / 200;
          return {
            x,
            y: 6 * x * (1 - x),
          };
        },
      );
      api.teaching.curve({
        plot,
        points,
        color: themeColors.blue,
        width: 4,
      });
      api.teaching.curve({
        plot,
        points: points.map(({ x }) => ({
          x,
          y: 168 * x * x * (1 - x) ** 5,
        })),
        color: themeColors.green,
        width: 6,
        progress: q,
      });
      text(
        ctx,
        api,
        'Beta(2,2) prior + 1/5 labels → Beta(3,6)',
        960,
        280,
        35,
        themeColors.muted,
        'center',
      );
      if (q === 1) {
        const mode = plot.point(2 / 7, 0),
          mean = plot.point(1 / 3, 0);
        api.line(ctx, mode.x, 410, mode.x, 830, themeColors.yellow, 3);
        api.line(ctx, mean.x, 410, mean.x, 830, themeColors.pink, 3);
        text(ctx, api, 'mode 2/7', mode.x - 20, 935, 30, themeColors.yellow, 'right');
        text(ctx, api, 'mean 3/9', mean.x + 20, 935, 30, themeColors.pink);
      }
      caption(
        ctx,
        api,
        'Posterior mode and posterior mean answer different summary questions · prior terms add no labels',
      );
    } else {
      text(
        ctx,
        api,
        'One preselected bucket has compatible evidence',
        960,
        280,
        35,
        themeColors.muted,
        'center',
      );
      const plot = axes(
        ctx,
        api,
        260,
        430,
        750,
        330,
        [0, 0.4],
        [0, 1],
        [0, 0.1, 0.2, 0.3, 0.4],
        [],
        'bucket outcome rate',
        '',
      );
      interval(ctx, api, plot, wilson(16, 100), 0.5, themeColors.green, 1, 0.16);
      const forecast = plot.point(0.2, 0.5);
      api.line(ctx, forecast.x, 390, forecast.x, 770, themeColors.yellow, 4);
      text(ctx, api, 'forecast 20%', forecast.x, 345, 31, themeColors.yellow, 'center');
      ['B2', 'B3', 'B4', 'B5'].forEach((label, i) =>
        panel(ctx, api, 1180 + (i % 2) * 260, 420 + Math.floor(i / 2) * 210, 210, 150, () => {
          text(
            ctx,
            api,
            label,
            1285 + (i % 2) * 260,
            470 + Math.floor(i / 2) * 210,
            31,
            themeColors.muted,
            'center',
          );
          text(
            ctx,
            api,
            '?',
            1285 + (i % 2) * 260,
            535 + Math.floor(i / 2) * 210,
            52,
            themeColors.yellow,
            'center',
          );
        }),
      );
      text(
        ctx,
        api,
        'Other buckets remain unmeasured',
        1450,
        900,
        31,
        themeColors.yellow,
        'center',
      );
      caption(
        ctx,
        api,
        'Choose bins before outcomes · a search across many comparisons needs a declared analysis plan',
      );
    }
    return;
  }
}
export default {
  id: 'bias-and-prior',
  draw: drawBiasAndPrior,
  cues: ['more-routine', 'bias-gap'],
};
