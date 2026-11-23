import { cueProgress, sampleModel } from '../model.mjs';
import {
  drawTrainingMath,
  drawTrainingText,
  trainingAxes,
  withTrainingFocus,
} from '../defaults.mjs';
export function paintLearningRate(ctx, scene, state, api, C, t, b, P) {
  if (b < 2) {
    withTrainingFocus(ctx, api, 'rate-construction', () => {
      drawTrainingMath(
        ctx,
        api,
        C,
        String.raw`\Delta\hat y=(\Delta w)x+\Delta b`,
        960,
        280,
        46,
        C.blue,
      );
      drawTrainingMath(ctx, api, C, String.raw`=-\eta e\,x^2-\eta e`, 960, 360, 44, C.blue);
    });
    withTrainingFocus(ctx, api, 'rate-residual-rule', () =>
      drawTrainingMath(
        ctx,
        api,
        C,
        b === 0 && P('rate-general') > 0
          ? String.raw`e_{\rm next}=[1-\eta(x^2+1)]e`
          : String.raw`e_{\rm next}=(1-5\eta)e`,
        960,
        450,
        50,
        C.yellow,
      ),
    );
    const plot = trainingAxes(ctx, api, t, {
      x: 260,
      y: 560,
      width: 1130,
      height: 330,
      xDomain: [0, 4],
      yDomain: [-16, 22],
      xTicks: [0, 1, 2, 3, 4],
      yTicks: [-16, 0, 6, 20],
      xLabel: 'optimizer steps',
      yLabel: 'prediction · ms',
    });
    t.curve({
      plot,
      points: [
        {
          x: 0,
          y: 6,
        },
        {
          x: 4,
          y: 6,
        },
      ],
      color: C.muted,
      width: 2,
    });
    [0.1, 0.2, 0.5, 0.4].forEach((rate, i) => {
      const p = P(['rate-contract', 'rate-exact', 'rate-diverge', 'rate-boundary'][i], 1),
        count = Math.floor(p * 4 + 1e-9);
      const points = Array.from(
        {
          length: count + 1,
        },
        (_, k) => ({
          x: k,
          y: 6 - 4 * (1 - 5 * rate) ** k,
        }),
      );
      const col = [C.green, C.cyan, C.pink, C.yellow][i];
      withTrainingFocus(ctx, api, 'rate-trajectory-' + i, () => {
        t.curve({
          plot,
          points,
          color: col,
          width: 5,
        });
        t.scatter({
          plot,
          points: points.map((q) => ({
            ...q,
            radius: 8,
            color: col,
          })),
        });
        drawTrainingText(ctx, api, C, `η = ${rate}`, 1600, 610 + i * 100, 36, col, 'center');
      });
    });
    drawTrainingText(
      ctx,
      api,
      C,
      'The target stays at 6 ms; the step size changes the path',
      960,
      1030,
      30,
      C.muted,
      'center',
    );
  } else {
    drawTrainingText(
      ctx,
      api,
      C,
      'Keep the prediction; reverse input and initial weight',
      960,
      300,
      39,
      C.ink,
      'center',
    );
    drawTrainingMath(
      ctx,
      api,
      C,
      String.raw`x=2,\ w=1\quad\longrightarrow\quad w'=1.8`,
      960,
      465,
      48,
      C.blue,
    );
    withTrainingFocus(ctx, api, 'signed-input-update', () => {
      drawTrainingMath(
        ctx,
        api,
        C,
        P('rate-sign', 2) > 0
          ? String.raw`x=-2,\ w=-1\quad\longrightarrow\quad w'=-1.8`
          : String.raw`x=-2,\ w=-1\quad\longrightarrow\quad w'=?`,
        960,
        680,
        48,
        C.yellow,
      );
      drawTrainingMath(ctx, api, C, String.raw`g_w=+8\qquad g_b=-4`, 960, 810, 43, C.yellow);
      if (P('rate-sign-payoff', 2) > 0)
        drawTrainingMath(
          ctx,
          api,
          C,
          String.raw`\hat y:2\longrightarrow4\qquad L:8\longrightarrow2`,
          960,
          995,
          48,
          C.green,
        );
    });
  }
  return;
}
export function drawLearningRateStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  const P = (id, beat = 0) => cueProgress(state, id, beat);
  return paintLearningRate(ctx, scene, state, api, C, t, b, P);
}
export default {
  id: 'learning-rate',
  draw: drawLearningRateStage,
  cues: [
    'rate-paths',
    'rate-rule',
    'rate-general',
    'rate-contract',
    'rate-exact',
    'rate-diverge',
    'rate-boundary',
    'rate-sign',
    'rate-sign-payoff',
  ],
};
