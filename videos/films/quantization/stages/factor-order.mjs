import { calibrationHessian, deferredBlockUpdate } from '../arithmetic.mjs';
import { detailProgress, spokenResult } from '../construction.mjs';
import {
  drawAxis,
  drawDetailArrow,
  drawDetailEquation,
  drawDetailText,
  drawEarnedNumber,
  drawFooter,
  drawMatrix,
  fadeDetail,
  formatValue,
} from '../defaults.mjs';
export function drawFactorOrder(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'factor-order', beat);
  const body = () => {
    if (beat === 0) {
      drawDetailEquation(
        ctx,
        api,
        'w_j\\leftarrow w_j-e\\frac{K_{jq}}{K_{qq}}',
        960,
        320,
        55,
        themeColors.ink,
      );
      drawDetailText(
        ctx,
        api,
        'e = 1.2 − 1 = 0.2 · K₀₀ = 1 · K₁₀ = −4.5',
        960,
        425,
        36,
        themeColors.yellow,
        'center',
      );
      const x = 420 + 1060 * ((0.61 + 0.9 * progress) / 2.1);
      drawAxis(ctx, api, 420, 720, 1060, 2.1, 'still-free neighbor weight');
      api.circle(ctx, 420 + (1060 * 0.61) / 2.1, 720, 8, themeColors.muted);
      api.circle(ctx, x, 720, 14, themeColors.cyan);
      drawDetailText(
        ctx,
        api,
        formatValue(ctx, api, 0.61 + 0.9 * progress),
        x,
        665,
        40,
        themeColors.cyan,
        'center',
      );
      drawEarnedNumber(
        ctx,
        api,
        '0.61 − 0.2 × (−4.5) = 1.51 → 2',
        960,
        905,
        progress === 1,
        themeColors.green,
        42,
      );
    } else if (beat === 1) {
      const hessian = calibrationHessian();
      const fixed = spokenResult(state, 'fix-coordinate', 1, 0.09, 0.32);
      const inverted = spokenResult(state, 'invert-free', 1, 0.5, 0.66);
      drawMatrix(
        ctx,
        api,
        fixed
          ? [
              ['', ''],
              ['', hessian[1][1]],
            ]
          : hessian,
        300,
        400,
        'H',
        themeColors.blue,
        135,
      );
      drawMatrix(
        ctx,
        api,
        [
          [1, -4.5],
          [-4.5, 20.5],
        ],
        900,
        400,
        'full H⁻¹',
        themeColors.yellow,
        135,
      );
      if (fixed) {
        drawMatrix(ctx, api, [[hessian[1][1]]], 1530, 390, 'free H', themeColors.blue, 125);
        drawDetailArrow(ctx, api, 1592, 540, 1592, 575, themeColors.cyan);
        drawMatrix(
          ctx,
          api,
          [[inverted ? 1 / hessian[1][1] : '?']],
          1530,
          655,
          'free H⁻¹',
          themeColors.green,
          125,
        );
      }
      fadeDetail(ctx, api, progress, () =>
        drawDetailText(
          ctx,
          api,
          '20.5 belongs to the full inverse',
          1050,
          800,
          30,
          themeColors.yellow,
          'center',
        ),
      );
      drawDetailText(
        ctx,
        api,
        'The inverse of the remaining block changes',
        960,
        920,
        38,
        themeColors.ink,
        'center',
      );
    } else if (beat === 2) {
      const centers = [420, 960, 1500],
        labels = ['damp H', 'invert', 'upper factor'];
      labels.forEach((label, i) =>
        drawDetailText(
          ctx,
          api,
          label,
          centers[i],
          350,
          34,
          [themeColors.blue, themeColors.cyan, themeColors.green][i],
          'center',
        ),
      );
      drawDetailEquation(ctx, api, 'H+\\lambda I', centers[0], 550, 57, themeColors.blue);
      drawDetailEquation(ctx, api, '(H+\\lambda I)^{-1}', centers[1], 550, 49, themeColors.cyan);
      drawDetailEquation(ctx, api, 'U^{\\top}U', centers[2], 550, 62, themeColors.green);
      drawDetailArrow(ctx, api, 610, 530, 730, 530);
      drawDetailArrow(ctx, api, 1170, 530, 1290, 530, themeColors.green);
      drawDetailText(
        ctx,
        api,
        'dead columns → damping → factorization check',
        960,
        760,
        37,
        themeColors.yellow,
        'center',
      );
      drawDetailText(
        ctx,
        api,
        'Relative damping may be zero; numerical checks still matter',
        960,
        875,
        30,
        themeColors.muted,
        'center',
      );
    } else {
      const f = deferredBlockUpdate(progress);
      drawDetailText(
        ctx,
        api,
        'Supplied deferred-update worksheet · normalized column errors',
        960,
        285,
        32,
        themeColors.ink,
        'center',
      );
      drawMatrix(ctx, api, f.errors, 220, 390, 'E · earlier block', themeColors.yellow);
      drawDetailEquation(ctx, api, '\\times', 530, 495, 44, themeColors.ink);
      drawMatrix(ctx, api, f.crossFactor, 650, 390, 'cross-block factor', themeColors.cyan);
      drawDetailEquation(ctx, api, '=', 1100, 495, 44, themeColors.ink);
      drawMatrix(ctx, api, f.product, 1260, 390, 'E × cross factor', themeColors.pink);
      drawDetailEquation(
        ctx,
        api,
        'W_{\\mathrm{later}}\\leftarrow W_{\\mathrm{later}}-E U_{\\mathrm{cross}}',
        960,
        630,
        39,
        themeColors.ink,
      );
      drawMatrix(ctx, api, f.before, 260, 720, 'later columns · before', themeColors.blue, 135);
      drawMatrix(
        ctx,
        api,
        f.after,
        1260,
        720,
        progress === 1 ? 'after deferred update' : 'applying deferred update',
        themeColors.green,
        135,
      );
      drawDetailArrow(ctx, api, 750, 855, 1150, 855, themeColors.pink);
    }
    drawFooter(
      ctx,
      api,
      beat === 3
        ? 'The matrix worksheet explains deferred work · no full GPU quantizer runtime was measured'
        : 'A declared two-weight CPU example · the full GPU quantizer is a separate execution',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'factor-order'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'factor-order',
  draw: drawFactorOrder,
  cues: [
    'factor-order-build-0',
    'factor-order-build-1',
    'fix-coordinate',
    'invert-free',
    'factor-order-build-2',
    'factor-order-build-3',
  ],
};
