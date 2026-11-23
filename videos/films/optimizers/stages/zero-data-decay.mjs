import { ZERO_DECAY } from '../fixtures.mjs';
import { fmt } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import {
  drawScaleAndDecayMath,
  drawScaleAndDecayTarget,
  drawScaleAndDecayText,
} from '../defaults.mjs';
export function drawZeroDataDecay(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    currentBeat = state.beat ?? 0;
  const phase = (id, b) => cueProgress(state, id, b);
  {
    const oldProgress = currentBeat === 2 ? phase('old-moment-zero', 2) : 0;
    const low = currentBeat === 1 ? 9.85 : currentBeat === 2 ? 9.985 - 0.085 * oldProgress : 9.985;
    const high =
      currentBeat === 1 ? 10.02 : currentBeat === 2 ? 10.005 + 0.015 * oldProgress : 10.005;
    const x = (v) => 300 + ((v - low) / (high - low)) * 1350;
    const weightRail = (y, endpoint, p, color, label) => {
      api.line(ctx, 300, y, 1650, y, themeColors.muted, 2);
      for (const v of [9.9, 9.95, 9.99, 10].filter(
        (v) =>
          v >= low &&
          v <= high &&
          (currentBeat !== 0 || v !== 9.99 || phase('zero-result', 0) === 1),
      )) {
        api.line(ctx, x(v), y - 10, x(v), y + 10, themeColors.muted, 2);
        drawScaleAndDecayText(
          ctx,
          api,
          themeColors,
          String(v),
          x(v),
          y + 46,
          27,
          themeColors.muted,
          'center',
        );
      }
      api.circle(ctx, x(10), y, 7, themeColors.bg, themeColors.ink, 2);
      if (p > 0) api.arrow(ctx, x(10), y, x(10 + (endpoint - 10) * p), y, color, 7);
      drawScaleAndDecayText(ctx, api, themeColors, label, 230, y - 55, 34, color);
    };
    drawScaleAndDecayText(
      ctx,
      api,
      themeColors,
      'θold = 10 · η = 0.1 · λ = 0.01 · gdata = 0 · ε = 10⁻⁸',
      170,
      245,
      31,
      themeColors.muted,
    );
    if (currentBeat === 0) {
      drawScaleAndDecayTarget(ctx, api, 'zero-input', () => {
        drawScaleAndDecayText(ctx, api, themeColors, 'DATA INPUT', 240, 355, 27, themeColors.muted);
        drawScaleAndDecayText(ctx, api, themeColors, 'gdata = 0', 240, 420, 40, themeColors.cyan);
        api.arrow(ctx, 520, 400, 680, 400, themeColors.cyan, 4);
        drawScaleAndDecayText(
          ctx,
          api,
          themeColors,
          'm = 0 · v = 0',
          760,
          420,
          40,
          themeColors.cyan,
        );
        api.arrow(ctx, 1140, 400, 1300, 400, themeColors.cyan, 4);
        drawScaleAndDecayText(
          ctx,
          api,
          themeColors,
          'data move = 0',
          1380,
          420,
          36,
          themeColors.cyan,
        );
      });
      drawScaleAndDecayTarget(ctx, api, 'zero-shrink', () => {
        weightRail(
          660,
          9.99,
          phase('zero-result', 0),
          themeColors.yellow,
          'Separate decay uses the prior parameter',
        );
        drawScaleAndDecayMath(
          ctx,
          api,
          themeColors,
          '\\Delta\\theta_{decay}=-0.1(0.01)(10)',
          330,
          835,
          47,
          themeColors.yellow,
        );
      });
      drawScaleAndDecayTarget(ctx, api, 'zero-result', () =>
        drawScaleAndDecayText(
          ctx,
          api,
          themeColors,
          phase('zero-result', 0) === 1 ? 'New θ = 9.99 · both moments remain zero' : 'New θ = ?',
          960,
          990,
          39,
          themeColors.green,
          'center',
        ),
      );
    } else if (currentBeat === 1) {
      drawScaleAndDecayTarget(ctx, api, 'coupled-input', () => {
        drawScaleAndDecayMath(
          ctx,
          api,
          themeColors,
          '\\tfrac{\\lambda}{2}\\theta^2',
          260,
          350,
          48,
          themeColors.pink,
        );
        api.arrow(ctx, 500, 340, 660, 340, themeColors.pink, 5);
        drawScaleAndDecayMath(
          ctx,
          api,
          themeColors,
          '\\nabla=\\lambda\\theta',
          760,
          350,
          47,
          themeColors.pink,
        );
      });
      drawScaleAndDecayTarget(ctx, api, 'coupled-penalty-gradient', () => {
        drawScaleAndDecayText(
          ctx,
          api,
          themeColors,
          phase('coupled-penalty-gradient', 1) === 1
            ? 'Penalty gradient = 0.1 → both Adam moments'
            : 'Penalty gradient = ?',
          1120,
          350,
          30,
          themeColors.pink,
        );
      });
      drawScaleAndDecayTarget(ctx, api, 'coupled-data', () =>
        weightRail(
          560,
          9.9,
          phase('coupled-data', 1),
          themeColors.pink,
          'Coupled first adaptive step',
        ),
      );
      weightRail(840, 9.99, 1, themeColors.yellow, 'Decoupled AdamW comparison · same prior θ');
      drawScaleAndDecayTarget(ctx, api, 'coupled-end', () =>
        drawScaleAndDecayText(
          ctx,
          api,
          themeColors,
          phase('coupled-end', 1) === 1
            ? 'Coupled ≈ 9.9 · decoupled = 9.99'
            : 'Compare the two new weights = ?',
          960,
          1040,
          35,
          themeColors.green,
          'center',
        ),
      );
    } else {
      drawScaleAndDecayTarget(ctx, api, 'gradient-representation', () =>
        drawScaleAndDecayText(
          ctx,
          api,
          themeColors,
          'Change only the current gradient representation',
          170,
          345,
          34,
          themeColors.ink,
        ),
      );
      drawScaleAndDecayTarget(ctx, api, 'zero-tensor', () => {
        weightRail(
          480,
          ZERO_DECAY.cold.weight,
          phase('zero-tensor', 2),
          themeColors.yellow,
          'Zero tensor · cold moments · step and decay execute',
        );
      });
      drawScaleAndDecayTarget(ctx, api, 'none-skip', () => {
        weightRail(
          680,
          ZERO_DECAY.absent.weight,
          0,
          themeColors.cyan,
          'grad = None · parameter step skipped',
        );
        if (phase('none-skip', 2) === 1) {
          api.circle(ctx, x(10), 680, 11, themeColors.cyan);
          drawScaleAndDecayText(
            ctx,
            api,
            themeColors,
            'θ stays 10',
            1740,
            750,
            31,
            themeColors.cyan,
            'right',
          );
        }
      });
      drawScaleAndDecayTarget(ctx, api, 'old-moment-zero', () => {
        if (oldProgress > 0) {
          weightRail(
            925,
            ZERO_DECAY.retained.weight,
            oldProgress,
            themeColors.pink,
            'Supplied old m₁ = 1, v₁ = 0.1 · current zero tensor · count 1 → 2',
          );
          drawScaleAndDecayText(
            ctx,
            api,
            themeColors,
            oldProgress === 1
              ? 'm₂ = 0.9 · v₂ = 0.0999 · θ ≈ ' + fmt(ZERO_DECAY.retained.weight)
              : 'Retained moments also create a data displacement.',
            960,
            1045,
            29,
            themeColors.pink,
            'center',
          );
        } else
          drawScaleAndDecayText(
            ctx,
            api,
            themeColors,
            'Current gradient alone does not specify the update.',
            960,
            1020,
            30,
            themeColors.muted,
            'center',
          );
      });
    }
  }
}
export default {
  id: 'zero-data-decay',
  draw: drawZeroDataDecay,
  cues: [
    'zero-input',
    'zero-shrink',
    'zero-result',
    'coupled-input',
    'coupled-penalty-gradient',
    'coupled-data',
    'coupled-end',
    'gradient-representation',
    'zero-tensor',
    'none-skip',
    'old-moment-zero',
  ],
};
