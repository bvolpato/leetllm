import { finiteReluSecant } from '../arithmetic.mjs';
import { batchGradient } from '../model.mjs';
import { neuralFrame } from '../construction.mjs';
import {
  axes,
  curve,
  dot,
  focusTarget,
  formatNumber,
  head,
  line,
  note,
  text,
} from '../defaults.mjs';
export function drawCornerCheck(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'corner-check-mechanism', () => {
    head(
      ctx,
      api,
      currentBeat === 0
        ? 'Independent gradients agree at the tested positive branches'
        : 'The central secant depends on which sides it samples',
    );
    if (currentBeat === 0) {
      const g = batchGradient(),
        gv = [g.dw1.flat(), g.db1, g.dw2, [g.db2]],
        labels = ['W₁ (4 entries)', 'b₁ (2 entries)', 'W₂ (2 entries)', 'c (1 entry)'];
      gv.forEach((r, i) => {
        const y = 410 + i * 140;
        text(ctx, api, labels[i], 260, y, 30, themeColors.cyan);
        text(
          ctx,
          api,
          r.map((v) => formatNumber(ctx, api, v, 5)).join('   '),
          930,
          y,
          29,
          themeColors.ink,
          'center',
        );
        text(ctx, api, 'NumPy = autograd', 1550, y, 28, themeColors.green, 'center');
      });
      note(
        ctx,
        api,
        'Both weight arrays also passed two-sided finite differences; actual CPU double-precision evidence.',
      );
    } else {
      const z = currentBeat === 1 ? 0 : 0.05,
        epsilon = currentBeat === 1 ? 0.15 : 0.15 - 0.13 * cueProgress('corner-check-beat-2', 2),
        plot = axes(ctx, api, {
          x: 300,
          y: 430,
          width: 1100,
          height: 340,
          xDomain: [-0.25, 0.3],
          yDomain: [-0.05, 0.3],
          xTicks: [-0.2, 0, 0.1, 0.2],
          yTicks: [0, 0.1, 0.2],
          xLabel: 'same pre-activation',
          yLabel: 'ReLU',
        });
      curve(ctx, api, plot, (x) => Math.max(0, x), -0.25, 0.3, themeColors.cyan);
      const a = plot.point(z - epsilon, Math.max(0, z - epsilon)),
        q = plot.point(z + epsilon, Math.max(0, z + epsilon));
      line(ctx, api, a.x, a.y, q.x, q.y, themeColors.yellow, 5);
      dot(ctx, api, a.x, a.y);
      dot(ctx, api, q.x, q.y);
      text(
        ctx,
        api,
        'z ' + formatNumber(ctx, api, z) + ' · ε ' + formatNumber(ctx, api, epsilon),
        1600,
        440,
        31,
        themeColors.ink,
        'center',
      );
      if (currentBeat > 1 || resultComplete('corner-secant-result', 1)) {
        text(
          ctx,
          api,
          'secant ' + formatNumber(ctx, api, finiteReluSecant(z, epsilon)),
          1600,
          600,
          34,
          themeColors.yellow,
          'center',
        );
        text(ctx, api, 'backward ' + (z === 0 ? 0 : 1), 1600, 700, 32, themeColors.cyan, 'center');
      }
      text(
        ctx,
        api,
        z === 0 ? 'corner: no ordinary derivative' : 'shrink ε below distance to corner',
        960,
        925,
        34,
        themeColors.ink,
        'center',
      );
      note(
        ctx,
        api,
        'A crossed branch or floating-point cancellation changes what the finite difference measures.',
      );
    }
    return;
  });
}
export default {
  id: 'corner-check',
  draw: drawCornerCheck,
  cues: [
    'corner-check-beat-0',
    'corner-check-beat-1',
    'corner-secant-result',
    'corner-check-beat-2',
  ],
};
