import { clamp } from '../construction.mjs';
import { axis, caption, dot, equation, line, panel, text } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const paint = () => {
    const pl = axis(
        ctx,
        api,
        [20, 70],
        580,
        'next response · milliseconds',
        [20, 30, 40, 50, 60, 70],
      ),
      x = pl.point(40, 0.5).x,
      d = pl.point(50, 0.5).x;
    line(ctx, api, d, 420, d, 610, themeColors.pink, 3);
    text(ctx, api, 'deadline 50', d, 380, 31, themeColors.pink, 'center');
    dot(ctx, api, x, 590, themeColors.yellow, 17);
    text(ctx, api, 'point prediction 40', x, 535, 34, themeColors.yellow, 'center');
    if (currentBeat === 0) {
      equation(ctx, api, String.raw`|Y_{\rm next}-40|\;?`, 960, 870, 48, themeColors.ink);
      caption(ctx, api, 'How large can the next miss be?');
    } else if (currentBeat === 1) {
      panel(ctx, api, 230, 790, 690, 120, () => {
        text(ctx, api, 'new-outcome set', 575, 838, 30, themeColors.cyan, 'center');
        text(ctx, api, 'prediction interval', 575, 881, 27, themeColors.muted, 'center');
      });
      panel(ctx, api, 1000, 790, 690, 120, () => {
        text(ctx, api, 'population quantity', 1345, 838, 30, themeColors.ink, 'center');
        text(
          ctx,
          api,
          'confidence interval for a mean',
          1345,
          881,
          27,
          themeColors.muted,
          'center',
        );
      });
      caption(ctx, api, 'Freeze a predictor, then calibrate its score.');
    } else {
      text(
        ctx,
        api,
        'C1  C2  C3  C4  C5  C6  C7  C8  C9',
        960,
        830,
        34,
        themeColors.cyan,
        'center',
      );
      caption(ctx, api, 'Supplied arithmetic fixture · no production latency model');
    }
  };
  if (api.focus) api.focus.target(`${'intro'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-b1', 'intro-b2', 'intro-b3'],
};
