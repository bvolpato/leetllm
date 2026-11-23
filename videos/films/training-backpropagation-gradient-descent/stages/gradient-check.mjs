import { lossAt } from '../arithmetic.mjs';
import { cueProgress, finiteDifference, sampleModel } from '../model.mjs';
import {
  drawTrainingCurve,
  drawTrainingDot,
  drawTrainingLine,
  drawTrainingMath,
  drawTrainingText,
  trainingAxes,
  withTrainingFocus,
} from '../defaults.mjs';
export function paintGradientCheck(ctx, scene, state, api, C, t, D) {
  const check = finiteDifference();
  const plot = trainingAxes(ctx, api, t, {
    x: 250,
    y: 355,
    width: 1000,
    height: 470,
    xDomain: [0.975, 1.025],
    yDomain: [7.8, 8.2],
    xTicks: [0.98, 1, 1.02],
    yTicks: [7.8, 8, 8.2],
    xLabel: 'weight w · bias held at zero',
    yLabel: 'loss · ms²',
  });
  drawTrainingCurve(ctx, api, t, plot, (w) => lossAt(w), 0.975, 1.025, C.cyan);
  withTrainingFocus(ctx, api, 'finite-samples', () => {
    const lo = plot.point(0.99, check.minus),
      hi = plot.point(1.01, check.plus);
    drawTrainingDot(ctx, api, C, lo.x, lo.y, C.pink, 15);
    drawTrainingDot(ctx, api, C, hi.x, hi.y, C.blue, 15);
    drawTrainingText(ctx, api, C, 'w − ε', lo.x, lo.y - 40, 29, C.pink, 'center');
    drawTrainingText(ctx, api, C, 'w + ε', hi.x, hi.y + 60, 29, C.blue, 'center');
    drawTrainingLine(ctx, api, C, lo.x, lo.y, hi.x, hi.y, C.yellow, 4);
  });
  withTrainingFocus(ctx, api, 'finite-ratio', () => {
    drawTrainingMath(
      ctx,
      api,
      C,
      String.raw`\frac{L(w+\epsilon)-L(w-\epsilon)}{2\epsilon}`,
      1540,
      440,
      43,
      C.yellow,
    );
    drawTrainingMath(ctx, api, C, String.raw`\epsilon=0.01`, 1540, 565, 39, C.muted);
  });
  withTrainingFocus(ctx, api, 'finite-comparison', () => {
    drawTrainingText(ctx, api, C, 'Numerical slope', 1540, 705, 30, C.cyan, 'center');
    drawTrainingMath(ctx, api, C, D('check-match', 1) ? '-8.000000' : '?', 1540, 775, 47, C.cyan);
    drawTrainingText(ctx, api, C, 'Backward gradient', 1540, 885, 30, C.green, 'center');
    drawTrainingMath(ctx, api, C, '-8.000000', 1540, 955, 47, C.green);
  });
  drawTrainingText(
    ctx,
    api,
    C,
    'Two extra forward evaluations check one smooth parameter',
    760,
    975,
    30,
    C.muted,
    'center',
  );
  return;
}
export function drawGradientCheckStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  const P = (id, beat = 0) => cueProgress(state, id, beat),
    D = (id, beat = 0) => P(id, beat) === 1;
  return paintGradientCheck(ctx, scene, state, api, C, t, D);
}
export default {
  id: 'gradient-check',
  draw: drawGradientCheckStage,
  cues: ['check-minus', 'check-ratio', 'check-match'],
};
