import { SORTED } from '../fixtures.mjs';
import { clamp, cueDone } from '../construction.mjs';
import { caption, equation, panel, text } from '../defaults.mjs';
export function drawIndexContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && cueDone(cues, id, progress >= at));
  const paint = () => {
    text(ctx, api, 'rank', 180, 355, 28, themeColors.muted);
    text(ctx, api, 'zero-based index', 180, 440, 28, themeColors.muted);
    text(ctx, api, 'score · ms', 180, 535, 28, themeColors.cyan);
    SORTED.forEach((v, i) => {
      const x = 440 + i * 145;
      text(ctx, api, i + 1, x, 355, 28, i === 7 ? themeColors.yellow : themeColors.muted, 'center');
      text(ctx, api, i, x, 440, 28, i === 7 ? themeColors.yellow : themeColors.muted, 'center');
      panel(ctx, api, x - 52, 480, 104, 90, () =>
        text(
          ctx,
          api,
          v,
          x,
          539,
          37,
          i === 7
            ? themeColors.yellow
            : currentBeat === 1 && i === 8
              ? themeColors.pink
              : themeColors.cyan,
          'center',
        ),
      );
    });
    if (currentBeat === 0)
      equation(
        ctx,
        api,
        done('cf-zero-index', 0)
          ? String.raw`s_{(8)}=\mathrm{sorted}[7]=8`
          : String.raw`s_{(8)}=\mathrm{sorted}[,?,]`,
        960,
        750,
        48,
        themeColors.yellow,
      );
    if (currentBeat === 1 && done('cf-numpy-higher', 1)) {
      equation(ctx, api, String.raw`\lceil(n-1)\cdot(8/9)\rceil=8`, 960, 705, 44, themeColors.pink);
      equation(
        ctx,
        api,
        String.raw`\mathrm{higher}(8/9)=\mathrm{sorted}[8]=12`,
        960,
        825,
        42,
        themeColors.pink,
      );
      caption(ctx, api, 'The same nine scores · different library position convention');
    }
    if (currentBeat === 2) {
      const inf = done('cf-infinity', 2, 0.45);
      text(ctx, api, '80% → rank 8 → 8 ms', 540, 700, 31, themeColors.cyan, 'center');
      if (done('cf-ninety-percent', 2, 0.3))
        text(ctx, api, '90% → rank 9 → 12 ms', 1290, 700, 31, themeColors.cyan, 'center');
      if (inf) {
        equation(
          ctx,
          api,
          String.raw`95\%\;\Rightarrow\;k=10>9\;\Rightarrow\;q=+\infty`,
          960,
          815,
          43,
          themeColors.pink,
        );
        caption(
          ctx,
          api,
          done('cf-minimum-n', 2, 0.9)
            ? 'No clipped rank · n = 19 is the first finite 95% observed threshold.'
            : 'The requested rank exceeds the available calibration scores.',
        );
      }
    }
  };
  if (api.focus) api.focus.target(`${'index-contract'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'index-contract',
  draw: drawIndexContract,
  cues: [
    'index-contract-b1',
    'cf-zero-index',
    'index-contract-b2',
    'cf-numpy-higher',
    'index-contract-b3',
    'rank-infinite',
    'cf-ninety-percent',
    'cf-infinity',
    'cf-minimum-n',
  ],
};
