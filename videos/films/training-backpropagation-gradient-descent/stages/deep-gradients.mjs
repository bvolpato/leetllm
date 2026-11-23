import { sampleModel } from '../model.mjs';
import {
  drawTrainingArrow,
  drawTrainingCurve,
  drawTrainingMath,
  drawTrainingPanel,
  drawTrainingText,
  formatTrainingNumber,
  trainingAxes,
  withTrainingFocus,
} from '../defaults.mjs';
export function paintDeepGradients(ctx, scene, state, api, C, c, t, b, s) {
  if (b === 0) {
    const chain = (factor, completed, top, color, id) =>
      withTrainingFocus(ctx, api, id, () => {
        drawTrainingText(
          ctx,
          api,
          C,
          factor < 1 ? 'Contracting local derivatives' : 'Expanding local derivatives',
          960,
          top - 70,
          36,
          color,
          'center',
        );
        for (let i = 0; i < 6; i++) {
          const x = 230 + i * 290,
            known = i <= completed;
          drawTrainingPanel(ctx, api, C, c, x - 95, top, 190, 105, known ? color : C.muted, () =>
            drawTrainingText(
              ctx,
              api,
              C,
              known ? formatTrainingNumber(ctx, api, factor ** i, 5) : '?',
              x,
              top + 67,
              35,
              known ? color : C.muted,
              'center',
            ),
          );
          if (i < 5) {
            drawTrainingArrow(
              ctx,
              api,
              C,
              x + 112,
              top + 55,
              x + 177,
              top + 55,
              i < completed ? color : C.muted,
              4,
            );
            drawTrainingMath(
              ctx,
              api,
              C,
              `\\times${factor}`,
              x + 145,
              top + 155,
              29,
              i < completed ? color : C.muted,
            );
          }
        }
      });
    chain(0.5, s.contractionSteps, 370, C.cyan, 'contracting-signal');
    chain(1.5, s.expansionSteps, 730, C.pink, 'expanding-signal');
    drawTrainingText(
      ctx,
      api,
      C,
      'One upstream signal passes through five local multiplications',
      960,
      1040,
      29,
      C.muted,
      'center',
    );
  } else {
    const plot = trainingAxes(ctx, api, t, {
      x: 370,
      y: 360,
      width: 700,
      height: 550,
      xDomain: [0, 10],
      yDomain: [0, 10],
      xTicks: [0, 3, 6, 10],
      yTicks: [0, 4, 8, 10],
      xLabel: 'gradient coordinate 1',
      yLabel: 'gradient coordinate 2',
    });
    drawTrainingCurve(ctx, api, t, plot, (x) => Math.sqrt(Math.max(0, 25 - x * x)), 0, 5, C.green);
    const o = plot.point(0, 0),
      old = plot.point(6, 8),
      q = plot.point(...s.currentVector);
    drawTrainingArrow(ctx, api, C, o.x, o.y, old.x, old.y, C.muted, 3);
    withTrainingFocus(ctx, api, 'clipped-gradient-vector', () =>
      drawTrainingArrow(ctx, api, C, o.x, o.y, q.x, q.y, C.green, 7),
    );
    withTrainingFocus(ctx, api, 'clipping-result', () => {
      drawTrainingText(ctx, api, C, 'Target after clipping', 1470, 405, 29, C.muted, 'center');
      drawTrainingMath(ctx, api, C, String.raw`(6,8)\longrightarrow(3,4)`, 1470, 470, 47, C.green);
      drawTrainingMath(
        ctx,
        api,
        C,
        String.raw`\alpha_{\rm target}=\min(1,5/10)=0.5`,
        1470,
        625,
        40,
        C.yellow,
      );
      drawTrainingText(
        ctx,
        api,
        C,
        `Current norm · ${formatTrainingNumber(ctx, api, s.currentNorm, 2)}`,
        1470,
        760,
        38,
        C.green,
        'center',
      );
      drawTrainingText(
        ctx,
        api,
        C,
        'One common scale preserves direction',
        1470,
        850,
        29,
        C.muted,
        'center',
      );
    });
    withTrainingFocus(ctx, api, 'clipping-order', () =>
      drawTrainingText(
        ctx,
        api,
        C,
        b === 2 ? 'backward → unscale (AMP) → clip → optimizer step' : 'Threshold radius · 5',
        960,
        1030,
        31,
        C.yellow,
        'center',
      ),
    );
  }
  return;
}
export function drawDeepGradientsStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  return paintDeepGradients(ctx, scene, state, api, C, c, t, b, s);
}
export default {
  id: 'deep-gradients',
  draw: drawDeepGradientsStage,
  cues: ['deep-contract', 'deep-expand', 'deep-clip', 'deep-order'],
};
