import { stablePolicy } from '../arithmetic.mjs';
import { overflowRepairFrame, policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyCard, drawPolicyEquation, drawPolicyText } from '../defaults.mjs';
export function drawLogitBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('logit-boundaries', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'logit-boundaries'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    if (beat === 0) {
      const frame = overflowRepairFrame(state),
        xs = [530, 1040, 1550];
      drawPolicyText(
        ctx,
        api,
        'Repair the route before exponentiation',
        960,
        285,
        36,
        themeColors.ink,
        'center',
      );
      drawPolicyText(
        ctx,
        api,
        'Failed control: exp(1000), exp(999), exp(998) overflow',
        960,
        345,
        30,
        themeColors.pink,
        'center',
      );
      drawPolicyText(ctx, api, 'input z', 145, 435, 29, themeColors.muted);
      drawPolicyText(ctx, api, 'z − 1000', 145, 615, 29, themeColors.muted);
      drawPolicyText(ctx, api, 'exp(z − 1000)', 145, 795, 27, themeColors.muted);
      target(() =>
        frame.inputs.forEach((value, i) => {
          const x = xs[i];
          drawPolicyText(ctx, api, String(value), x, 435, 42, colors[i], 'center');
          if (i < frame.shiftedVisible) {
            api.arrow(ctx, x, 455, x, 552, colors[i], 3);
            drawPolicyText(ctx, api, '−1000', x + 70, 515, 28, colors[i]);
            drawPolicyText(ctx, api, String(frame.shifted[i]), x, 615, 41, colors[i], 'center');
          } else drawPolicyText(ctx, api, '…', x, 615, 37, themeColors.muted, 'center');
          if (i < frame.weightsVisible) {
            api.arrow(ctx, x, 635, x, 734, colors[i], 3);
            drawPolicyText(ctx, api, 'exp', x + 70, 695, 28, colors[i]);
            drawPolicyText(ctx, api, frame.weights[i].toFixed(3), x, 795, 41, colors[i], 'center');
          } else drawPolicyText(ctx, api, '…', x, 795, 37, themeColors.muted, 'center');
        }),
      );
      if (frame.weightsVisible === 3)
        drawPolicyEquation(
          ctx,
          api,
          String.raw`\operatorname{softmax}([0,-1,-2])\approx[.665,.245,.090]`,
          960,
          900,
          40,
          themeColors.green,
          'center',
        );
      drawCaption(
        ctx,
        api,
        'Subtract the shared maximum, then exponentiate these finite shifted values.',
      );
    } else if (beat === 1) {
      const labels = ['finite', 'masked', 'all masked', 'NaN / +∞'];
      drawPolicyText(
        ctx,
        api,
        'Finite scores [0, −1000]: probability underflows; direct log-softmax preserves the gap.',
        960,
        310,
        29,
        themeColors.ink,
        'center',
      );
      drawPolicyText(ctx, api, 'ordinary probability', 480, 415, 29, themeColors.muted, 'center');
      drawPolicyText(
        ctx,
        api,
        'direct log probability',
        1400,
        415,
        29,
        themeColors.muted,
        'center',
      );
      drawPolicyText(ctx, api, '0', 480, 515, 48, themeColors.pink, 'center');
      drawPolicyText(
        ctx,
        api,
        stablePolicy([0, -1000]).logProbabilities[1].toFixed(0),
        1400,
        515,
        48,
        themeColors.green,
        'center',
      );
      target(() =>
        labels.forEach((s, i) => {
          const x = 180 + i * 430;
          drawPolicyCard(
            ctx,
            api,
            'logit-boundaries',
            s,
            x,
            665,
            365,
            82,
            i < 2 ? themeColors.blue : themeColors.pink,
            30,
          );
          drawPolicyText(
            ctx,
            api,
            progress > 0 ? (i === 0 ? 'normalize' : i === 1 ? 'mass 0' : 'reject row') : '?',
            x + 182,
            845,
            31,
            i < 2 ? themeColors.green : themeColors.pink,
            'center',
          );
        }),
      );
      drawCaption(ctx, api, 'A normalizer needs at least one finite unmasked candidate.');
    } else {
      const log = stablePolicy([0, -1000]).logProbabilities[1];
      drawPolicyText(
        ctx,
        api,
        'A tiny probability can underflow',
        960,
        310,
        36,
        themeColors.ink,
        'center',
      );
      target(() => {
        drawPolicyText(ctx, api, 'ordinary probability', 475, 470, 30, themeColors.muted, 'center');
        drawPolicyText(ctx, api, '0.000… → 0', 475, 615, 47, themeColors.pink, 'center');
        drawPolicyText(ctx, api, 'direct log-softmax', 1370, 470, 30, themeColors.muted, 'center');
        drawPolicyText(ctx, api, log.toFixed(0), 1370, 615, 47, themeColors.green, 'center');
      });
      drawPolicyEquation(
        ctx,
        api,
        String.raw`\log p_i=(z_i-m)-\log\sum_j e^{z_j-m}`,
        960,
        835,
        43,
        themeColors.cyan,
        'center',
      );
      drawCaption(
        ctx,
        api,
        'Taking log after an underflowed probability has already lost the information.',
      );
    }
  }
  return;
}
export default {
  id: 'logit-boundaries',
  draw: drawLogitBoundaries,
  cues: ['logit-boundaries-build-0', 'logit-boundaries-exponentiate', 'logit-boundaries-build-1'],
};
