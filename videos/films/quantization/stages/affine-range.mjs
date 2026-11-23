import { affineGrid } from '../arithmetic.mjs';
import { detailProgress, spokenResult } from '../construction.mjs';
import {
  drawDetailArrow,
  drawDetailEquation,
  drawDetailLine,
  drawDetailText,
  drawEarnedNumber,
  drawFooter,
  fadeDetail,
  formatValue,
} from '../defaults.mjs';
export function drawAffineRange(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'affine-range', beat);
  const body = () => {
    if (beat === 0) {
      drawDetailText(
        ctx,
        api,
        'Calibrated real interval includes zero',
        960,
        300,
        36,
        themeColors.ink,
        'center',
      );
      drawDetailEquation(
        ctx,
        api,
        'S=\\frac{b-a}{q_{\\max}-q_{\\min}}',
        540,
        490,
        64,
        themeColors.cyan,
      );
      drawDetailEquation(
        ctx,
        api,
        'Z=\\operatorname{clip}(q_{\\min}-\\operatorname{round}(a/S))',
        1190,
        690,
        44,
        themeColors.yellow,
      );
      drawDetailEquation(ctx, api, '\\hat{x}=S(q-Z)', 960, 865, 59, themeColors.green);
    } else if (beat === 1) {
      drawDetailText(
        ctx,
        api,
        'real interval [−1, 2] · integer codes [0, 15]',
        960,
        300,
        34,
        themeColors.ink,
        'center',
      );
      const left = 230,
        width = 1460;
      drawDetailLine(ctx, api, left, 560, left + width, 560);
      for (let q = 0; q <= 15; q++) {
        const x = left + (q / 15) * width;
        drawDetailLine(
          ctx,
          api,
          x,
          545,
          x,
          575,
          q === 5 ? themeColors.yellow : themeColors.muted,
          3,
        );
        drawDetailText(
          ctx,
          api,
          q,
          x,
          625,
          28,
          q === 5 ? themeColors.yellow : themeColors.muted,
          'center',
        );
        if (q % 5 === 0)
          drawDetailText(
            ctx,
            api,
            formatValue(ctx, api, 0.2 * (q - 5)),
            x,
            495,
            37,
            q === 5 ? themeColors.green : themeColors.cyan,
            'center',
          );
      }
      drawDetailText(ctx, api, 'real value', 230, 410, 28, themeColors.cyan);
      drawDetailText(ctx, api, 'stored integer code', 230, 695, 28, themeColors.muted);
      drawDetailEquation(ctx, api, 'S=3/15=0.2', 580, 800, 53, themeColors.cyan);
      drawEarnedNumber(ctx, api, 'Z = 5', 1320, 800, progress === 1, themeColors.yellow);
      fadeDetail(ctx, api, progress, () =>
        drawDetailText(
          ctx,
          api,
          'code 5 reconstructs to real zero',
          960,
          915,
          36,
          themeColors.green,
          'center',
        ),
      );
    } else {
      const values = [-2, -1, 0, 0.73, 2, 3];
      const relabeled = spokenResult(state, 'affine-range-build-3', 3, 0.15, 0.34);
      const grid = affineGrid(values, -1, 2, relabeled ? -8 : 0, relabeled ? 7 : 15);
      drawDetailText(
        ctx,
        api,
        beat === 3
          ? 'Same real grid · new signed integer labels'
          : 'Trace encoding, clipping and reconstruction',
        960,
        285,
        35,
        themeColors.ink,
        'center',
      );
      drawDetailText(ctx, api, 'input', 225, 425, 29, themeColors.blue, 'right');
      drawDetailText(ctx, api, 'stored code', 225, 610, 29, themeColors.yellow, 'right');
      drawDetailText(ctx, api, 'decoded', 225, 805, 29, themeColors.green, 'right');
      values.forEach((v, i) => {
        const x = 350 + i * 260;
        const cue = i === 0 ? 'lower-clamp' : i === 5 ? 'upper-clamp' : 'affine-range-build-2';
        const decoded =
          beat === 3 || spokenResult(state, cue, 2, 0.1, i === 0 ? 0.8 : i === 5 ? 0.57 : 0.28);
        api.focus.target('affine-column-' + i, () => {
          drawDetailText(
            ctx,
            api,
            formatValue(ctx, api, v),
            x,
            425,
            43,
            themeColors.blue,
            'center',
          );
          drawDetailArrow(ctx, api, x, 460, x, 535, themeColors.muted);
          drawDetailText(ctx, api, grid.codes[i], x, 610, 43, themeColors.yellow, 'center');
          drawDetailArrow(ctx, api, x, 645, x, 730, themeColors.muted);
          drawEarnedNumber(
            ctx,
            api,
            formatValue(ctx, api, grid.reconstructed[i]),
            x,
            805,
            decoded,
            themeColors.green,
            43,
          );
          if (decoded && (i === 0 || i === 5))
            drawDetailText(ctx, api, 'clipped', x, 915, 29, themeColors.pink, 'center');
          else if (decoded && i === 3)
            drawDetailText(ctx, api, 'rounded', x, 915, 29, themeColors.yellow, 'center');
        });
      });
      if (beat === 3)
        drawDetailText(
          ctx,
          api,
          relabeled ? 'Z = −3 · same decoded values' : 'Z = 5 · unsigned codes',
          960,
          355,
          32,
          themeColors.yellow,
          'center',
        );
    }
    drawFooter(
      ctx,
      api,
      'Declare the rounding rule · an all-zero interval needs a positive-scale convention',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'affine-range'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'affine-range',
  draw: drawAffineRange,
  cues: [
    'affine-range-build-0',
    'affine-range-build-1',
    'affine-range-build-2',
    'upper-clamp',
    'lower-clamp',
    'affine-range-build-3',
  ],
};
