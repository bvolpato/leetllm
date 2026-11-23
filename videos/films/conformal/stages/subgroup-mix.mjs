import { clamp, cueDone, cueProgress, phase } from '../construction.mjs';
import { caption, line, text } from '../defaults.mjs';
export function drawSubgroupMix(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const reveal = (id, beat, a = 0.08, z = 0.8) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : cueProgress(cues, id, phase(progress, a, z));
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && cueDone(cues, id, progress >= at));
  const paint = () => {
    const blend = reveal('mixture-change', 1, 0.2, 0.65),
      short = 750 - 250 * blend,
      long = 1000 - short,
      covered = short * 0.96 + long * 0.54,
      x = 310,
      w = 1300,
      swidth = (1300 * short) / 1000;
    text(
      ctx,
      api,
      `short: ${Math.round(short)} requests · 96% covered`,
      960,
      365,
      31,
      themeColors.cyan,
      'center',
    );
    text(
      ctx,
      api,
      `long: ${Math.round(long)} requests · 54% covered`,
      960,
      435,
      31,
      themeColors.yellow,
      'center',
    );
    api.rect(ctx, 310, 520, 1300, 200, themeColors.panel, undefined, 0);
    api.rect(ctx, 310, 520, swidth * 0.96, 200, themeColors.green, undefined, 0);
    api.rect(ctx, 310 + swidth * 0.96, 520, swidth * 0.04, 200, themeColors.pink, undefined, 0);
    api.rect(ctx, 310 + swidth, 520, (1300 - swidth) * 0.54, 200, themeColors.green, undefined, 0);
    api.rect(
      ctx,
      310 + swidth + (1300 - swidth) * 0.54,
      520,
      (1300 - swidth) * 0.46,
      200,
      themeColors.pink,
      undefined,
      0,
    );
    line(ctx, api, 310 + swidth, 500, 310 + swidth, 745, themeColors.yellow, 5);
    text(
      ctx,
      api,
      `${Math.round(short * 0.96)} covered`,
      310 + swidth / 2,
      785,
      29,
      themeColors.cyan,
      'center',
    );
    text(
      ctx,
      api,
      `${Math.round(long * 0.54)} covered`,
      310 + swidth + (1300 - swidth) / 2,
      785,
      29,
      themeColors.yellow,
      'center',
    );
    if (currentBeat > 0 || done('cf-mixture855', 0, 0.86))
      text(
        ctx,
        api,
        `${Math.round(covered)} / 1000 = ${(covered / 10).toFixed(1)}% aggregate coverage`,
        960,
        900,
        35,
        covered >= 800 ? themeColors.green : themeColors.pink,
        'center',
      );
    caption(ctx, api, 'Only the mixture changes; subgroup coverage rates stay fixed.');
  };
  if (api.focus) api.focus.target(`${'subgroup-mix'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'subgroup-mix',
  draw: drawSubgroupMix,
  cues: [
    'subgroup-mix-b1',
    'mixture-total',
    'cf-mixture855',
    'subgroup-mix-b2',
    'mixture-change',
    'cf-mixture750',
    'subgroup-mix-b3',
  ],
};
