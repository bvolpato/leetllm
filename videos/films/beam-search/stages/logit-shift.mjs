import { POLICY_TOKENS } from '../fixtures.mjs';
import { stablePolicy } from '../arithmetic.mjs';
import { logitConversionFrame, policyCueProgress } from '../construction.mjs';
import { drawCaption, drawLine, drawPolicyText } from '../defaults.mjs';
export function drawLogitShift(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('logit-shift', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'logit-shift'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const stage = Math.min(beat, 2),
      frame = logitConversionFrame(state),
      xs = [610, 940, 1270, 1600];
    drawPolicyText(
      ctx,
      api,
      stage === 0
        ? 'Supplied logits · predict the largest probability'
        : stage === 1
          ? 'Follow one score row through three operations'
          : 'Divide each weight by the same total',
      960,
      285,
      34,
      themeColors.ink,
      'center',
    );
    if (stage === 2) {
      target(() =>
        teaching.categoricalSampling({
          x: 230,
          y: 365,
          width: 1460,
          height: 590,
          fontSize: 25,
          categories: POLICY_TOKENS.map((label, i) => ({
            id: label,
            label,
            mass: policy.probabilities[i],
            color: colors[i],
          })),
          draws: [
            {
              id: 'u=.75',
              uniform: 0.75,
            },
          ],
          normalization: 'probabilities',
          visibleDraws: progress === 1 ? 1 : 0,
          drawProgress: progress === 1 ? 0 : progress,
          showEmpirical: false,
        }),
      );
      if (progress === 1)
        drawPolicyText(
          ctx,
          api,
          'Selected token: revoke',
          960,
          850,
          34,
          themeColors.pink,
          'center',
        );
      drawCaption(
        ctx,
        api,
        'The supplied uniform rank .75 lands in revoke. This is one next-token event.',
      );
      return;
    }
    POLICY_TOKENS.forEach((name, i) =>
      drawPolicyText(ctx, api, name, xs[i], 365, 32, colors[i], 'center'),
    );
    target(() => {
      drawPolicyText(ctx, api, 'input z', 145, 450, 29, themeColors.muted);
      frame.inputs.forEach((value, i) =>
        drawPolicyText(ctx, api, value.toFixed(3), xs[i], 450, 41, colors[i], 'center'),
      );
      if (stage === 0) {
        drawLine(ctx, api, 430, 735, 1730, 735, themeColors.muted, 2);
        frame.inputs.forEach((value, i) => {
          const x = xs[i],
            yy = 735 - value * 55;
          drawLine(ctx, api, x, 735, x, yy, colors[i], 6);
          api.circle(ctx, x, yy, 9, colors[i]);
        });
        drawPolicyText(ctx, api, 'Score zero', 145, 743, 29, themeColors.muted);
        return;
      }
      api.focus.target('logit-shift-subtracted-row', () => {
        drawPolicyText(
          ctx,
          api,
          frame.subtraction === 1 ? 'z − 3' : `subtracting ${frame.removedOffset.toFixed(3)}`,
          145,
          590,
          28,
          frame.subtraction === 1 ? themeColors.ink : themeColors.yellow,
        );
        frame.shifted.forEach((value, i) => {
          if (frame.subtraction > 0) {
            api.arrow(ctx, xs[i], 468, xs[i], 532, colors[i], 3);
            drawPolicyText(ctx, api, value.toFixed(3), xs[i], 590, 39, colors[i], 'center');
          } else drawPolicyText(ctx, api, '…', xs[i], 590, 36, themeColors.muted, 'center');
        });
      });
      api.focus.target('logit-shift-exponential-row', () => {
        drawPolicyText(ctx, api, 'exp(z − 3)', 145, 730, 29, themeColors.muted);
        frame.weights.forEach((value, i) => {
          if (i < frame.weightsVisible) {
            api.arrow(ctx, xs[i], 608, xs[i], 674, colors[i], 3);
            drawPolicyText(ctx, api, value.toFixed(3), xs[i], 730, 39, colors[i], 'center');
          } else drawPolicyText(ctx, api, '…', xs[i], 730, 36, themeColors.muted, 'center');
        });
      });
      api.focus.target('logit-shift-probability-row', () => {
        drawPolicyText(ctx, api, 'weight / Z', 145, 870, 29, themeColors.muted);
        frame.probabilities.forEach((value, i) => {
          if (i < frame.probabilitiesVisible) {
            api.arrow(ctx, xs[i], 748, xs[i], 814, colors[i], 3);
            drawPolicyText(ctx, api, value.toFixed(3), xs[i], 870, 39, colors[i], 'center');
          } else drawPolicyText(ctx, api, '…', xs[i], 870, 36, themeColors.muted, 'center');
        });
      });
      if (frame.total !== null)
        drawPolicyText(
          ctx,
          api,
          `Z = ${frame.total.toFixed(6)} · sum of the unrounded weights`,
          960,
          945,
          28,
          themeColors.yellow,
          'center',
        );
    });
    drawCaption(
      ctx,
      api,
      stage === 0
        ? 'The input scores can be negative and need not sum to one.'
        : 'One common offset cancels. Displayed numbers are rounded.',
    );
  }
  return;
}
export default {
  id: 'logit-shift',
  draw: drawLogitShift,
  cues: [
    'logit-shift-build-0',
    'logit-shift-build-1',
    'logit-shift-subtract',
    'logit-shift-exponentiate',
    'logit-shift-normalize',
    'logit-shift-build-2',
  ],
};
