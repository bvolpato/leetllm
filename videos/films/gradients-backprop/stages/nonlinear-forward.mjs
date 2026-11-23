import { cueProgress, number } from '../latency-ruler.mjs';
import { gradientClamp, hiddenUnit } from '../arithmetic.mjs';
import { gradientDone } from '../construction.mjs';
import {
  drawExtensionCaption,
  drawExtensionText,
  drawHiddenUnitGraph,
  withTarget,
} from '../defaults.mjs';
export function drawNonlinearForward(ctx, scene, state, api) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = gradientClamp(state.beatP ?? 0),
    cues = state.cues;
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && gradientDone(cues, id, progress2 > at));
  const paint = () => {
    if (currentBeat === 0) {
      const shift = cueProgress(state, api, 'hidden-affine-shift', 0, 0.4, 0.53);
      const hinge = cueProgress(state, api, 'hidden-first-hinge', 0, 0.56, 0.65);
      const second = cueProgress(state, api, 'hidden-second-hinge', 0, 0.77, 0.88);
      const plot = teaching.axes({
        x: 450, y: 400, width: 1040, height: 425,
        xDomain: [-2, 2], yDomain: [-2, 4],
        xTicks: [-2, -1, 0, 1, 2], yTicks: [-2, 0, 2, 4],
        xLabel: 'input', yLabel: '', fontSize: 26,
      });
      const segment = (x1, y1, x2, y2, color, width) =>
        api.path(ctx, [plot.point(x1, y1), plot.point(x2, y2)], { color, width, clip: plot.bounds });
      if (hinge === 0) {
        const bias = 0.5 * shift;
        segment(-2, -2 + bias, 2, 2 + bias, themeColors.cyan, 6);
        drawExtensionText(ctx, api, shift === 0 ? '½ × (2 × input) = input' : 'input + ' + number(bias, 2),
          960, 313, 43, themeColors.cyan, 'center');
      } else {
        segment(-2, -1.5, -0.5, 0, themeColors.muted, 2);
        segment(-0.5, 0, -0.5 - 1.5 * hinge, 0, themeColors.cyan, 6);
        segment(-0.5, 0, 0.5, 1, themeColors.cyan, 6);
        segment(0.5, 1, 2, 2.5, second > 0 ? themeColors.muted : themeColors.cyan, second > 0 ? 2 : 6);
        if (second > 0) {
          const x = 0.5 + 1.5 * second;
          segment(0.5, 1, x, 2 * x, themeColors.cyan, 6);
        }
        drawExtensionText(ctx, api, second > 0 ? 'ReLU(x + 0.5) + ReLU(x − 0.5)' : 'ReLU(x + 0.5)',
          960, 313, 43, themeColors.cyan, 'center');
      }
    } else {
      const s = hiddenUnit(),
        forward =
          currentBeat > 1
            ? 3
            : done('hidden-prediction', 1, 0.75)
              ? 3
              : done('hidden-z', 1, 0.45)
                ? 2
                : done('hidden-h', 1, 0.35)
                  ? 1
                  : 0;
      const reverse = [
        ['nonlinear-forward-b3', 0.12], ['hidden-output-pair', 0.38],
        ['hidden-gate-return', 0.64], ['hidden-reverse-values', 0.85],
      ].filter(([id, fallback]) => done(id, 2, fallback)).length;
      drawHiddenUnitGraph(ctx, api, s, {
        forward,
        result: done('hidden-loss', 1, 0.9),
        reverse,
        gradientQuestion: currentBeat > 1,
      });
      drawExtensionCaption(
        ctx,
        api,
        'Same stored forward values support every factor in the reverse walk.',
      );
    }
  };
  withTarget(ctx, api, 'nonlinear-forward-mechanism', paint);
  ctx.restore();
}
export default {
  id: 'nonlinear-forward',
  draw: drawNonlinearForward,
  cues: [
    'nonlinear-forward-b1',
    'hidden-affine-shift', 'hidden-first-hinge', 'hidden-second-hinge',
    'nonlinear-forward-b2',
    'hidden-h',
    'hidden-z',
    'hidden-prediction',
    'hidden-loss',
    'nonlinear-forward-b3',
    'hidden-output-pair',
    'hidden-gate-return',
    'hidden-reverse-values',
  ],
};
