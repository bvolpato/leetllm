import { cue, scoreFrame } from '../construction.mjs';
import { scoreStatistic } from '../model.mjs';
import { axes, caption, equation, focusTarget, interval, text, percent } from '../defaults.mjs';
export function drawScoreInterval(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const f = scoreFrame(state),
      v = f.interval,
      wald = 0.16,
      margin = 1.96 * Math.sqrt((0.16 * 0.84) / 100);
    if (currentBeat === 0) {
      const plot = axes(
        ctx,
        api,
        250,
        420,
        1400,
        320,
        [0, 0.4],
        [0, 1],
        [0, 0.1, 0.16, 0.2, 0.3, 0.4],
        [],
        'candidate population rate',
        '',
      );
      const q = cue(state, 'wald-range', 0.25, 0.75);
      focusTarget(ctx, api, 'wald-interval', () =>
        interval(
          ctx,
          api,
          plot,
          {
            low: 0.16 - margin * q,
            high: 0.16 + margin * q,
          },
          0.5,
          themeColors.blue,
          1,
          0.16,
        ),
      );
      equation(
        ctx,
        api,
        '\\widehat{SE}=\\sqrt{.16(.84)/100}\\approx.037',
        960,
        320,
        45,
        themeColors.ink,
        'center',
      );
      text(
        ctx,
        api,
        'Wald · observed fraction supplies the scale',
        960,
        890,
        32,
        themeColors.blue,
        'center',
      );
      caption(ctx, api, '16/100 from the original weekly sample');
    } else {
      const plot = axes(
        ctx,
        api,
        220,
        360,
        1000,
        430,
        [0.04, 0.36],
        [0, 5],
        [0.05, 0.1, 0.16, 0.2, 0.3, 0.35],
        [0, 1.96, 4],
        'candidate population rate',
        '|score|',
      );
      const points = Array.from(
        {
          length: 161,
        },
        (_, i) => {
          const x = 0.04 + i * 0.002;
          return {
            x,
            y: Math.min(5, scoreStatistic(16, 100, x)),
          };
        },
      );
      api.teaching.curve({
        plot,
        points,
        color: themeColors.cyan,
        width: 4,
      });
      const cutoff = plot.point(0.04, 1.96);
      api.line(ctx, cutoff.x, cutoff.y, plot.point(0.36, 1.96).x, cutoff.y, themeColors.yellow, 3);
      if (f.acceptedVisible) {
        const a = plot.point(v.low, 0),
          z = plot.point(f.acceptedHigh, 0);
        api.line(ctx, a.x, 925, z.x, 925, themeColors.green, 13);
      }
      focusTarget(ctx, api, 'candidate-score', () => {
        const p = plot.point(f.candidate, Math.min(5, f.score));
        api.line(ctx, p.x, p.y, p.x, 790, f.fits ? themeColors.green : themeColors.pink, 3);
        api.circle(ctx, p.x, p.y, 13, f.fits ? themeColors.green : themeColors.pink);
        text(
          ctx,
          api,
          'candidate ' + percent(f.candidate),
          1510,
          420,
          33,
          themeColors.ink,
          'center',
        );
        text(
          ctx,
          api,
          f.fits ? 'ACCEPT · score ≤ 1.96' : 'OUTSIDE · score > 1.96',
          1510,
          500,
          29,
          f.fits ? themeColors.green : themeColors.pink,
          'center',
        );
      });
      equation(
        ctx,
        api,
        '|z(p)|=\\frac{|16-100p|}{\\sqrt{100p(1-p)}}',
        1510,
        650,
        34,
        themeColors.cyan,
        'center',
      );
      if (
        currentBeat === 1 &&
        cue(state, 'threshold-example', 0.39, 0.49) > 0 &&
        f.candidate === 0.2
      )
        text(ctx, api, '|16 − 20| / 4 = 1', 1510, 790, 38, themeColors.yellow, 'center');
      if (currentBeat === 2) {
        focusTarget(ctx, api, 'score-projection', () => {
          for (const p of [v.low, v.high]) {
            const a = plot.point(p, 1.96);
            api.line(ctx, a.x, a.y, a.x, api.lerp(a.y, 790, f.projection), themeColors.green, 4);
            if (f.projection > 0)
              api.line(ctx, a.x, 875, a.x, api.lerp(875, 925, f.projection), themeColors.green, 4);
          }
        });
        focusTarget(ctx, api, 'wilson-interval', () =>
          text(
            ctx,
            api,
            f.endpointsKnown
              ? 'Wilson ' + percent(v.low) + ' – ' + percent(v.high)
              : 'accepted candidates → interval',
            1510,
            790,
            30,
            themeColors.green,
            'center',
          ),
        );
        focusTarget(ctx, api, 'staffing-threshold', () => {
          const p = plot.point(0.2, 0);
          api.line(ctx, p.x, 900, p.x, 950, themeColors.pink, 4);
          text(ctx, api, '20% staffing threshold', 1510, 890, 29, themeColors.pink, 'center');
        });
      }
      caption(ctx, api, 'Each candidate supplies its own binomial sampling scale');
    }
  }
}
export default {
  id: 'score-interval',
  draw: drawScoreInterval,
  cues: [
    'wald-range',
    'candidate-sweep',
    'threshold-example',
    'finish-sweep',
    'score-project',
    'score-endpoints',
    'threshold-cross',
  ],
};
