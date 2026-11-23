import { clamp, zeroFailureUpper } from '../arithmetic.mjs';
import { chapterText, footer, formatDecimal, pill, segment } from '../defaults.mjs';
export function drawZeroRisk(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cue = (k) => state.cues?.['mv-zero-risk-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('zero-risk-mechanism', () => {
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'Missing evidence and observed failure are different',
        960,
        300,
        36,
        themeColors.yellow,
      );
      pill(ctx, api, 'review pending', 500, 500, 610, themeColors.yellow);
      pill(ctx, api, 'attributed unsafe = 1', 1430, 500, 740, themeColors.pink);
      if (B('hold')) chapterText(ctx, api, 'HOLD widening', 500, 710, 39, themeColors.yellow);
      if (B('abort')) chapterText(ctx, api, 'ABORT exposure', 1430, 710, 39, themeColors.pink);
      chapterText(
        ctx,
        api,
        'Minimum volume and latency can still be missing',
        960,
        900,
        32,
        themeColors.muted,
      );
      footer(ctx, api, 'Wrong attribution or malformed counters require investigation');
    } else {
      const n = 1200,
        upper = zeroFailureUpper(n),
        plot = teaching.axes({
          x: 280,
          y: 400,
          width: 1250,
          height: 460,
          xDomain: [0, 0.008],
          yDomain: [0, 1],
          xTicks: [0, 0.002, 0.004, 0.006, 0.008],
          yTicks: [0, 0.5, 1],
          xLabel: 'assumed failure probability p',
          yLabel: 'Pr(0 failures)',
          fontSize: 24,
        }),
        points = Array.from(
          {
            length: 101,
          },
          (_, i) => ({
            x: (i / 100) * 0.008,
            y: Math.pow(1 - (i / 100) * 0.008, n),
          }),
        );
      if (currentBeat > 1 || B('power'))
        teaching.curve({
          plot,
          points,
          color: themeColors.cyan,
          width: 4,
        });
      const a = plot.point(0, 0.05),
        z = plot.point(0.008, 0.05);
      if (currentBeat > 1 || B('alpha')) {
        segment(ctx, api, a.x, a.y, z.x, z.y, themeColors.yellow, 2);
        chapterText(ctx, api, 'α = .05', 1670, a.y + 10, 29, themeColors.yellow);
      }
      if (currentBeat > 1 || B('bound'))
        chapterText(ctx, api, 'p upper = 1 − α^(1/n)', 960, 325, 37, themeColors.cyan);
      if (currentBeat > 1 && resultComplete('value')) {
        const q = plot.point(upper, 0.05);
        api.circle(ctx, q.x, q.y, 10, themeColors.yellow);
        chapterText(
          ctx,
          api,
          'n = 1,200 · upper = ' + formatDecimal(ctx, api, 100 * upper, 3) + '%',
          960,
          980,
          36,
          themeColors.yellow,
        );
      }
      footer(
        ctx,
        api,
        'Fixed n in advance · independent trials · constant p · correct failure labels',
      );
    }
  });
}
export default {
  id: 'zero-risk',
  draw: drawZeroRisk,
  cues: [
    'mv-zero-risk-hold',
    'mv-zero-risk-abort',
    'mv-zero-risk-power',
    'mv-zero-risk-bound',
    'mv-zero-risk-alpha',
    'mv-zero-risk-value',
    'mv-zero-risk-limits',
  ],
};
