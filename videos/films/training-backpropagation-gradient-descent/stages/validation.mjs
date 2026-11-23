import { sampleModel } from '../model.mjs';
import {
  drawTrainingArrow,
  drawTrainingDot,
  drawTrainingMath,
  drawTrainingPanel,
  drawTrainingRuler,
  drawTrainingText,
  trainingAxes,
  withTrainingFocus,
} from '../defaults.mjs';
export function paintValidation(ctx, scene, state, api, C, c, t, b, s) {
  if (b === 0) {
    const roles = [
      ['Train', 'updates parameters', C.blue],
      ['Validation', 'chooses checkpoint', C.green],
      ['Test', 'final evaluation', C.yellow],
    ];
    roles.forEach(([name, detail, color], i) =>
      withTrainingFocus(ctx, api, ['training-role', 'validation-role', 'test-role'][i], () => {
        const x = 170 + i * 575;
        drawTrainingPanel(ctx, api, C, c, x, 400, 430, 320, color, () => {
          drawTrainingText(ctx, api, C, name, x + 215, 460, 42, color, 'center');
          for (let j = 0; j < 6; j++)
            drawTrainingDot(
              ctx,
              api,
              C,
              x + 100 + (j % 3) * 115,
              535 + Math.floor(j / 3) * 75,
              color,
              17,
            );
        });
        drawTrainingText(ctx, api, C, detail, x + 215, 810, 31, color, 'center');
      }),
    );
    drawTrainingText(
      ctx,
      api,
      C,
      'Keep related requests together; match the split to the deployment question',
      960,
      1010,
      29,
      C.muted,
      'center',
    );
  } else if (b === 1) {
    const plot = trainingAxes(ctx, api, t, {
      x: 260,
      y: 355,
      width: 1070,
      height: 500,
      xDomain: [1, 7],
      yDomain: [0, 5],
      xTicks: [1, 2, 3, 4, 5, 6, 7],
      yTicks: [0, 1, 2, 3, 4, 5],
      xLabel: 'epoch',
      yLabel: 'simulated validation loss',
    });
    const points = s.values.slice(0, s.visibleEpochs).map((v, i) => ({
      x: i + 1,
      y: v,
    }));
    withTrainingFocus(ctx, api, 'validation-curve', () => {
      t.curve({
        plot,
        points,
        color: C.cyan,
        width: 5,
      });
      t.scatter({
        plot,
        points: points.map((q) => ({
          ...q,
          radius: 10,
          color: q.x === s.bestEpoch ? C.green : C.blue,
        })),
      });
    });
    withTrainingFocus(ctx, api, 'best-checkpoint', () => {
      drawTrainingPanel(ctx, api, C, c, 1430, 390, 340, 165, C.green, () => {
        drawTrainingText(ctx, api, C, 'Saved checkpoint', 1600, 445, 30, C.green, 'center');
        drawTrainingText(
          ctx,
          api,
          C,
          s.bestEpoch ? `epoch ${s.bestEpoch}` : 'waiting',
          1600,
          515,
          43,
          C.green,
          'center',
        );
      });
      if (s.bestEpoch) {
        const best = plot.point(s.bestEpoch, s.bestLoss);
        drawTrainingDot(ctx, api, C, best.x, best.y, C.green, 17);
      }
      if (s.restore > 0) drawTrainingArrow(ctx, api, C, 1600, 590, 1600, 745, C.green, 6);
    });
    withTrainingFocus(ctx, api, 'validation-patience', () => {
      drawTrainingText(
        ctx,
        api,
        C,
        'Evaluations without progress',
        1600,
        845,
        28,
        C.muted,
        'center',
      );
      drawTrainingText(
        ctx,
        api,
        C,
        `${s.trace.at(-1)?.counter ?? 0} / 3`,
        1600,
        920,
        46,
        C.pink,
        'center',
      );
    });
    drawTrainingText(
      ctx,
      api,
      C,
      'Save every lower loss; restore the saved parameters when patience runs out',
      960,
      1030,
      29,
      C.muted,
      'center',
    );
  } else {
    drawTrainingText(
      ctx,
      api,
      C,
      'The first learning step we checked',
      960,
      300,
      41,
      C.ink,
      'center',
    );
    withTrainingFocus(ctx, api, 'final-request', () => {
      drawTrainingRuler(ctx, api, C, 560, 4);
      drawTrainingArrow(ctx, api, C, 730, 625, 1130, 625, C.green, 6);
      drawTrainingText(ctx, api, C, 'prediction · 2 to 4 ms', 960, 740, 40, C.green, 'center');
      drawTrainingMath(ctx, api, C, String.raw`g_w=-8\qquad g_b=-4`, 960, 865, 46, C.yellow);
      drawTrainingMath(ctx, api, C, String.raw`L:8\longrightarrow2`, 960, 1000, 52, C.green);
    });
  }
  return;
}
export function drawValidationStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  return paintValidation(ctx, scene, state, api, C, c, t, b, s);
}
export default {
  id: 'validation',
  draw: drawValidationStage,
  cues: [
    'validation-roles',
    'validation-test',
    'validation-build',
    'validation-best',
    'validation-patience',
    'validation-restore',
    'validation-return',
  ],
};
