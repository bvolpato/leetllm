import { RESIDUALS } from '../fixtures.mjs';
import { clamp, cueDone } from '../construction.mjs';
import { caption, dot, equation, line, panel, text } from '../defaults.mjs';
export function drawTiesBound(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && cueDone(cues, id, progress >= at));
  const paint = () => {
    if (currentBeat === 0) {
      text(
        ctx,
        api,
        'Two distinct request identities have residual 3 ms.',
        960,
        350,
        32,
        themeColors.cyan,
        'center',
      );
      for (let i = 0; i < 9; i++) {
        const x = 220 + i * 180;
        panel(ctx, api, x - 60, 440, 120, 110, () => {
          text(ctx, api, `C${i + 1}`, x, 476, 24, themeColors.muted, 'center');
          text(
            ctx,
            api,
            RESIDUALS[i],
            x,
            525,
            37,
            i === 1 || i === 2 ? themeColors.yellow : themeColors.cyan,
            'center',
          );
        });
      }
      if (done('cf-zero-ties', 0, 0.58)) {
        line(ctx, api, 240, 725, 1680, 725, themeColors.green, 7);
        for (let i = 0; i < 10; i++) dot(ctx, api, 300 + i * 145, 725, themeColors.green, 10);
        text(
          ctx,
          api,
          'all scores 0 · inclusive radius 0 · coverage 100%',
          960,
          815,
          33,
          themeColors.green,
          'center',
        );
      }
      caption(ctx, api, 'Keep repeated rows; include the threshold boundary.');
    } else if (currentBeat === 1) {
      if (done('cf-distinct-ranks', 1, 0.4))
        equation(
          ctx,
          api,
          String.raw`\mathrm{distinct:}\quad\frac{k}{n+1}=\frac8{10}=0.8`,
          960,
          440,
          52,
          themeColors.green,
        );
      line(ctx, api, 430, 650, 1490, 650, themeColors.muted, 4);
      if (done('cf-distinct-ranks', 1, 0.4))
        line(ctx, api, 430, 650, 1278, 650, themeColors.green, 13);
      if (done('cf-looser-bound', 1, 0.85))
        line(ctx, api, 1278, 650, 1384, 650, themeColors.yellow, 13);
      text(ctx, api, '0', 430, 705, 26, themeColors.muted, 'center');
      if (done('cf-distinct-ranks', 1, 0.4))
        text(ctx, api, '80% exact', 1278, 590, 28, themeColors.green, 'center');
      if (done('cf-looser-bound', 1, 0.85))
        text(ctx, api, '90% looser upper bound', 1384, 765, 28, themeColors.yellow, 'center');
      text(ctx, api, '100%', 1490, 705, 26, themeColors.muted, 'center');
      caption(ctx, api, 'The exact distinct-rank result and a looser inequality can both be true.');
    } else {
      panel(ctx, api, 200, 390, 620, 290, () => {
        text(ctx, api, 'fixed fitted procedure', 510, 445, 32, themeColors.yellow, 'center');
        text(ctx, api, 'calibration sample', 510, 535, 31, themeColors.cyan, 'center');
        text(ctx, api, 'new outcome', 510, 615, 31, themeColors.green, 'center');
      });
      panel(ctx, api, 1010, 390, 710, 290, () => {
        text(
          ctx,
          api,
          'one realized calibration sample',
          1365,
          465,
          30,
          themeColors.cyan,
          'center',
        );
        text(ctx, api, 'many test outcomes', 1365, 565, 31, themeColors.green, 'center');
        text(ctx, api, 'observed rate can differ', 1365, 635, 27, themeColors.muted, 'center');
      });
      text(ctx, api, 'joint marginal probability', 510, 790, 31, themeColors.ink, 'center');
      text(
        ctx,
        api,
        'conditional on this calibration sample',
        1365,
        790,
        30,
        themeColors.ink,
        'center',
      );
      caption(ctx, api, 'A marginal theorem is not a per-request or per-tenant probability.');
    }
  };
  if (api.focus) api.focus.target(`${'ties-bound'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'ties-bound',
  draw: drawTiesBound,
  cues: [
    'ties-bound-b1',
    'ties-all-zero',
    'cf-zero-ties',
    'ties-bound-b2',
    'cf-distinct-ranks',
    'cf-looser-bound',
    'ties-bound-b3',
  ],
};
