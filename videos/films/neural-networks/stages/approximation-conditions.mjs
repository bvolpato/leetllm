import { approximation, targetCurve } from '../arithmetic.mjs';
import { neuralFrame } from '../construction.mjs';
import {
  arrow,
  axes,
  curve,
  dot,
  focusTarget,
  head,
  line,
  note,
  pill,
  text,
} from '../defaults.mjs';
export function drawApproximationConditions(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'approximation-conditions-mechanism', () => {
    if (currentBeat === 0) {
      head(ctx, api, 'A uniform approximation existence statement on a compact domain');
      const plot = axes(ctx, api, {
        x: 300,
        y: 420,
        width: 1320,
        height: 360,
        xDomain: [0, 4],
        yDomain: [0, 1],
        xTicks: [0, 1, 2, 3, 4],
        yTicks: [0, 0.5, 1],
        xLabel: 'closed bounded interval',
      });
      curve(ctx, api, plot, targetCurve, 0, 4, themeColors.muted);
      curve(ctx, api, plot, (x) => approximation(x, 8), 0, 4, themeColors.yellow);
      text(
        ctx,
        api,
        'biases + continuous non-polynomial activation + linear output',
        960,
        875,
        32,
        themeColors.cyan,
        'center',
      );
      text(
        ctx,
        api,
        'enough width depends on the target and requested error',
        960,
        965,
        30,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      head(ctx, api, 'More squared affine terms still occupy the same polynomial span');
      const n = 1 + Math.floor(cueProgress('polynomial-width', 1) * 5);
      for (let i = 0; i < n; i++) {
        const x = 300 + i * 265;
        pill(ctx, api, '(a' + i + 'x+b' + i + ')²', x, 440, 245, themeColors.cyan, 28);
        arrow(ctx, api, x, 485, 960, 680, themeColors.muted, 1);
      }
      pill(ctx, api, 'A x² + B x + C', 960, 750, 820, themeColors.yellow, 48, 110);
      text(
        ctx,
        api,
        'arbitrary width · degree stays at most 2',
        960,
        950,
        34,
        themeColors.yellow,
        'center',
      );
      note(
        ctx,
        api,
        'A fixed degree-d polynomial activation yields degree ≤d after affine input and a linear sum.',
      );
    } else {
      head(ctx, api, 'Two measurements, at x = 0 and x = 1');
      const plot = axes(ctx, api, {
        x: 300,
        y: 410,
        width: 1100,
        height: 400,
        xDomain: [0, 1],
        yDomain: [0, 1.6],
        xTicks: [0, 0.25, 0.5, 1],
        yTicks: [0, 0.5, 1, 1.5],
        xLabel: 'input',
        yLabel: 'output',
      });
      const straight = cueProgress('straight-fit', 2);
      const bend = cueProgress('bow-fit', 2);
      const bowed = (x) => x + bend * 4 * x * (1 - x);
      if (straight > 0) curve(ctx, api, plot, (x) => x, 0, 1, themeColors.cyan, straight);
      if (bend > 0) curve(ctx, api, plot, bowed, 0, 1, themeColors.blue);
      for (const x of [0, 1]) {
        const q = plot.point(x, x);
        dot(ctx, api, q.x, q.y, themeColors.yellow, 14);
      }
      if (S('probe-fit', 2)) {
        const x = 0.25;
        const a = plot.point(x, x),
          b = plot.point(x, bowed(x));
        line(ctx, api, a.x, a.y, b.x, b.y, themeColors.muted, 3);
        dot(ctx, api, a.x, a.y, themeColors.cyan, 12);
        dot(ctx, api, b.x, b.y, themeColors.blue, 12);
        text(ctx, api, 'At x = 0.25', 1590, 435, 37, themeColors.ink, 'center');
        if (resultComplete('fit-values', 2)) {
          text(ctx, api, 'Line   ' + x, 1590, 555, 43, themeColors.cyan, 'center');
          text(ctx, api, 'Arc   ' + bowed(x), 1590, 675, 43, themeColors.blue, 'center');
        }
      }
    }
    return;
  });
}
export default {
  id: 'approximation-conditions',
  draw: drawApproximationConditions,
  cues: [
    'approximation-conditions-beat-0',
    'approximation-conditions-beat-1',
    'polynomial-width',
    'approximation-conditions-beat-2',
    'straight-fit',
    'bow-fit',
    'probe-fit',
    'fit-values',
  ],
};
