import { cueProgress, sampleModel } from '../model.mjs';
import {
  drawTrainingCurve,
  drawTrainingDot,
  drawTrainingLine,
  drawTrainingMath,
  drawTrainingText,
  trainingAxes,
  withTrainingFocus,
} from '../defaults.mjs';
export function paintSensitivity(ctx, scene, state, api, C, t, P, D) {
  const plot = trainingAxes(ctx, api, t, {
    x: 250,
    y: 360,
    width: 850,
    height: 450,
    xDomain: [0, 8],
    yDomain: [0, 20],
    xTicks: [0, 2, 4, 6, 8],
    yTicks: [0, 8, 16],
    xLabel: 'prediction · ms',
    yLabel: 'half-squared loss · ms²',
  });
  drawTrainingCurve(ctx, api, t, plot, (x) => 0.5 * (x - 6) ** 2, 0, 8, C.cyan);
  const current = 2 + 0.25 * P('sensitivity-nudge');
  withTrainingFocus(ctx, api, 'loss-point', () => {
    const q = plot.point(current, 0.5 * (current - 6) ** 2);
    drawTrainingDot(ctx, api, C, q.x, q.y, C.blue, 17);
  });
  withTrainingFocus(ctx, api, 'slope-ratio', () => {
    const a = plot.point(1, 12),
      z = plot.point(3, 4);
    drawTrainingLine(ctx, api, C, a.x, a.y, z.x, z.y, C.yellow, 5);
    drawTrainingMath(
      ctx,
      api,
      C,
      D('sensitivity-slope-result', 1)
        ? String.raw`\left.\frac{\partial L}{\partial\hat y}\right|_{\hat y=2}=-4`
        : String.raw`\frac{\partial L}{\partial\hat y}=?`,
      680,
      970,
      42,
      C.yellow,
    );
  });
  withTrainingFocus(ctx, api, 'parameter-nudges', () => {
    drawTrainingText(ctx, api, C, 'The same parameter nudge', 1480, 300, 32, C.ink, 'center');
    drawTrainingText(ctx, api, C, 'weight', 1270, 425, 30, C.blue);
    drawTrainingText(ctx, api, C, 'bias', 1270, 615, 30, C.cyan);
  });
  withTrainingFocus(ctx, api, 'weight-sensitivity', () => {
    const p = P('sensitivity-weight', 2);
    drawTrainingLine(ctx, api, C, 1270, 510, 1270 + 380 * (0.5 + 0.5 * p), 510, C.blue, 16);
    drawTrainingMath(ctx, api, C, p === 1 ? String.raw`2\epsilon` : '?', 1730, 525, 40, C.blue);
    drawTrainingLine(ctx, api, C, 1270, 700, 1460, 700, C.cyan, 16);
    drawTrainingMath(ctx, api, C, p === 1 ? String.raw`\epsilon` : '?', 1530, 715, 40, C.cyan);
  });
  withTrainingFocus(ctx, api, 'parameter-gradients', () => {
    if (!D('sensitivity-gradients', 2)) {
      drawTrainingMath(ctx, api, C, 'g_w=?', 1480, 860, 43, C.blue);
      drawTrainingMath(ctx, api, C, 'g_b=?', 1480, 965, 43, C.cyan);
      return;
    }
    drawTrainingMath(ctx, api, C, String.raw`g_w=(-4)\,2=-8`, 1480, 860, 43, C.blue);
    drawTrainingMath(ctx, api, C, String.raw`g_b=(-4)\,1=-4`, 1480, 965, 43, C.cyan);
  });
  return;
}
export function drawSensitivityStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  const P = (id, beat = 0) => cueProgress(state, id, beat),
    D = (id, beat = 0) => P(id, beat) === 1;
  return paintSensitivity(ctx, scene, state, api, C, t, P, D);
}
export default {
  id: 'sensitivity',
  draw: drawSensitivityStage,
  cues: [
    'sensitivity-nudge',
    'sensitivity-slope',
    'sensitivity-slope-result',
    'sensitivity-compare',
    'sensitivity-weight',
    'sensitivity-gradients',
  ],
};
