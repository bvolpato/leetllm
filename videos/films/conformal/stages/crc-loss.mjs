import { clamp } from '../construction.mjs';
import { caption, dot, equation, line, text } from '../defaults.mjs';
export function drawCrcLoss(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const paint = () => {
    const xpos = (v) => 350 + 1190 * v;
    for (const [i, score] of [0.1, 0.6, 0.9].entries()) {
      const yy = 440 + i * 140,
        zero = yy + 75,
        col = [themeColors.pink, themeColors.yellow, themeColors.cyan][i],
        xx = xpos(score);
      text(ctx, api, 'score ' + score, 185, yy + 8, 25, col);
      text(ctx, api, '1', 310, yy + 8, 22, themeColors.muted, 'right');
      text(ctx, api, '0', 310, zero + 8, 22, themeColors.muted, 'right');
      line(ctx, api, 350, yy, xx, yy, col, 4);
      line(ctx, api, xx, yy, xx, zero, col, 4);
      line(ctx, api, xx, zero, 1540, zero, col, 4);
      dot(ctx, api, xx, zero, col, 6);
    }
    for (const v of [0, 0.1, 0.6, 0.9, 1])
      text(ctx, api, v, xpos(v), 910, 24, themeColors.muted, 'center');
    if (currentBeat > 0)
      equation(
        ctx,
        api,
        String.raw`\frac{n\widehat R(\lambda)+1}{n+1}\le\alpha`,
        960,
        310,
        46,
        themeColors.yellow,
      );
    else
      text(
        ctx,
        api,
        'Choose the costly event and its denominator first.',
        960,
        305,
        34,
        themeColors.ink,
        'center',
      );
    caption(
      ctx,
      api,
      currentBeat === 2
        ? 'Expected loss over calibration + future · not a conditional high-probability certificate.'
        : 'Bounded loss · non-increasing curves · right continuity · valid fallback',
    );
  };
  if (api.focus) api.focus.target(`${'crc-loss'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'crc-loss',
  draw: drawCrcLoss,
  cues: ['crc-loss-b1', 'crc-loss-b2', 'crc-loss-b3'],
};
