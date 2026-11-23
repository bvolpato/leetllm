import { norm } from '../arithmetic.mjs';
import { incidentFrame } from '../construction.mjs';
import { incidentModel } from '../model.mjs';
import {
  formatNumber,
  formatVector,
  incidentAxis,
  incidentMath,
  incidentMatrix,
  incidentNote,
  incidentText,
  strokeArrow,
  strokeLine,
} from '../defaults.mjs';
export function drawMatrixBound(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = incidentModel(),
    f = incidentFrame('matrix-bound', state),
    { b: currentBeat, p: progress, cue, started } = f;
  api.focus.target('matrix-bound-operation', () => {
    if (currentBeat === 0) {
      incidentMath(
        ctx,
        api,
        String.raw`J_t=\operatorname{diag}(1-h_t^2)W_h`,
        960,
        330,
        45,
        themeColors.cyan,
      );
      const count = Math.min(5, Math.floor(6 * cue('bound-product', progress)));
      for (let i = 0; i < 5; i++) {
        const x = 300 + i * 325;
        incidentText(ctx, api, 'J' + (i + 1), x, 530, 40, themeColors.pink, 'center');
        if (i < count) {
          const radius = 110 * 0.75 ** (i + 1);
          api.circle(ctx, x, 720, radius, themeColors.panel, themeColors.cyan, 3);
          incidentText(
            ctx,
            api,
            formatNumber(ctx, api, 0.75 ** (i + 1)),
            x,
            860,
            25,
            themeColors.cyan,
            'center',
          );
        }
        if (i < 4) strokeArrow(ctx, api, x + 110, 520, x + 220, 520, themeColors.muted, 2);
      }
      incidentMath(
        ctx,
        api,
        String.raw`\|J_t\|_2\leq\gamma\sigma_{\max}(W_h)<1\ \Rightarrow\ \text{uniform contraction}`,
        960,
        925,
        37,
        themeColors.yellow,
      );
      incidentNote(
        ctx,
        api,
        'Circles show a supplied uniform bound 0.75 per step, not a measured gradient.',
      );
    } else if (currentBeat === 1) {
      incidentMatrix(
        ctx,
        api,
        [
          [0.5, 1],
          [0, 0.5],
        ],
        205,
        315,
        themeColors.pink,
        80,
      );
      incidentText(ctx, api, 'σmax ≈ 1.207', 285, 575, 30, themeColors.pink, 'center');
      incidentMath(
        ctx,
        api,
        String.raw`W^n=\begin{bmatrix}0.5^n&n0.5^{n-1}\\0&0.5^n\end{bmatrix}`,
        1280,
        355,
        38,
        themeColors.ink,
      );
      const origin = {
          x: 900,
          y: 845,
        },
        scale = 320;
      strokeArrow(
        ctx,
        api,
        origin.x - 50,
        origin.y,
        origin.x + 450,
        origin.y,
        themeColors.muted,
        2,
      );
      strokeArrow(
        ctx,
        api,
        origin.x,
        origin.y + 20,
        origin.x,
        origin.y - 400,
        themeColors.muted,
        2,
      );
      incidentText(ctx, api, '0', origin.x - 20, origin.y + 35, 23, themeColors.muted);
      incidentText(ctx, api, '1', origin.x + scale, origin.y + 35, 23, themeColors.muted);
      m.matrixPowers.slice(0, f.nonNormalSteps + 1).forEach((value, i) => {
        const x = origin.x + scale * value[0],
          y = origin.y - scale * value[1];
        if (i) {
          const old = m.matrixPowers[i - 1];
          strokeLine(
            ctx,
            api,
            origin.x + scale * old[0],
            origin.y - scale * old[1],
            x,
            y,
            themeColors.border,
            2,
          );
        }
        api.circle(
          ctx,
          x,
          y,
          i === f.nonNormalSteps ? 10 : 5,
          i === f.nonNormalSteps ? themeColors.yellow : themeColors.pink,
          themeColors.pink,
          1,
        );
        if (i < 4)
          incidentText(
            ctx,
            api,
            'n=' + i,
            i === 3 ? x - 100 : x + 15,
            i === 3 ? y - 50 : y - 12,
            24,
            themeColors.muted,
          );
      });
      const value = m.matrixPowers[f.nonNormalSteps];
      incidentText(
        ctx,
        api,
        'n=' +
          f.nonNormalSteps +
          '   v=' +
          formatVector(ctx, api, value) +
          '   ‖v‖=' +
          formatNumber(ctx, api, norm(value)),
        960,
        953,
        32,
        themeColors.yellow,
        'center',
      );
      incidentNote(
        ctx,
        api,
        'A largest singular value above one permits growth. This actual path eventually decays.',
      );
    } else {
      const toX = incidentAxis(ctx, api, 260, 620, 1400, -15, 0);
      incidentText(ctx, api, 'log₁₀ |gradient|', 960, 350, 35, themeColors.ink, 'center');
      const exponent = 50 * cue('finite-decay', progress),
        value = 0.6 ** exponent;
      const x = toX(Math.log10(value));
      api.circle(ctx, x, 620, 12, themeColors.yellow, themeColors.yellow, 1);
      incidentMath(
        ctx,
        api,
        String.raw`0.6^{${formatNumber(ctx, api, exponent, 0)}}=${value.toExponential(2).replace('e', String.raw`\times10^{`) + '}'}`,
        960,
        790,
        44,
        themeColors.yellow,
      );
      incidentText(
        ctx,
        api,
        'Float32 normal minimum ≈ 1.18 × 10⁻³⁸',
        960,
        875,
        30,
        themeColors.cyan,
        'center',
      );
      incidentNote(
        ctx,
        api,
        'Small optimization effect can precede underflow. Learning rate and parameter scale affect update rounding.',
      );
    }
  });
}
export default {
  id: 'matrix-bound',
  draw: drawMatrixBound,
  cues: [
    'matrix-bound-0',
    'bound-product',
    'matrix-bound-1',
    'matrix-powers',
    'matrix-bound-2',
    'finite-decay',
  ],
};
