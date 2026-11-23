import { samplingExtensionModel } from '../construction.mjs';
import {
  drawSamplingExtensionCurve,
  drawSamplingExtensionD,
  drawSamplingExtensionEquation,
  drawSamplingExtensionFooter,
  drawSamplingExtensionL,
  drawSamplingExtensionNum,
  drawSamplingExtensionPlot,
  drawSamplingExtensionText,
} from '../defaults.mjs';
export function drawInverseContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = samplingExtensionModel(state, 'inverse-contract'),
    currentBeat = f.beat,
    progress = f.progress;
  api.focus.target('sp-inverse-contract-visual', () => {
    if (currentBeat === 0) {
      const q = drawSamplingExtensionPlot(
        ctx,
        api,
        [0, 3],
        [0, 1],
        280,
        360,
        1050,
        460,
        'value',
        'cumulative probability',
      );
      drawSamplingExtensionL(
        ctx,
        api,
        [
          q.point(0, 0),
          q.point(1, 0),
          q.point(1, 0.3),
          q.point(2, 0.3),
          q.point(2, 1),
          q.point(3, 1),
        ],
        themeColors.cyan,
        5,
      );
      drawSamplingExtensionL(
        ctx,
        api,
        [q.point(0, 0.6), q.point(2 * progress, 0.6)],
        themeColors.yellow,
        4,
      );
      if (progress === 1)
        drawSamplingExtensionL(ctx, api, [q.point(2, 0.6), q.point(2, 0)], themeColors.yellow, 4);
      drawSamplingExtensionNum(ctx, api, 'Retained rank', 'u = 0.6', 410, themeColors.yellow);
      drawSamplingExtensionNum(
        ctx,
        api,
        'First CDF ≥ rank',
        progress === 1 ? 'value = 2' : '?',
        620,
      );
    } else if (currentBeat === 1) {
      const q = drawSamplingExtensionPlot(
        ctx,
        api,
        [0, 1],
        [0, 0.25],
        250,
        365,
        1050,
        455,
        'uniform rank u',
        'exponential seconds',
      );
      drawSamplingExtensionCurve(
        ctx,
        api,
        q,
        (u) => -Math.log1p(-Math.min(u, 0.999)) / 20,
        0,
        0.99,
        themeColors.cyan,
      );
      drawSamplingExtensionEquation(
        ctx,
        api,
        't=-\\log(1-u)/20',
        1500,
        430,
        35,
        themeColors.ink,
        'center',
      );
      drawSamplingExtensionNum(
        ctx,
        api,
        'Rank u = 0.5',
        progress === 1 ? (-Math.log(0.5) / 20).toFixed(4) + ' s' : '?',
        600,
        themeColors.yellow,
      );
    } else {
      const q = drawSamplingExtensionPlot(
        ctx,
        api,
        [0, 1],
        [0, 1],
        280,
        400,
        1000,
        360,
        'uniform rank',
        '',
      );
      drawSamplingExtensionL(ctx, api, [q.point(0, 0.4), q.point(1, 0.4)], themeColors.blue, 12);
      drawSamplingExtensionD(ctx, api, q.point(0, 0.4).x, q.point(0, 0.4).y, themeColors.pink, 15);
      drawSamplingExtensionD(
        ctx,
        api,
        q.point(0.25, 0.4).x,
        q.point(0.25, 0.4).y,
        themeColors.green,
        15,
      );
      drawSamplingExtensionText(
        ctx,
        api,
        '0: redraw for log / quantile',
        430,
        340,
        31,
        themeColors.pink,
      );
      drawSamplingExtensionText(
        ctx,
        api,
        '1: excluded by Python random()',
        1180,
        340,
        28,
        themeColors.muted,
        'center',
      );
      drawSamplingExtensionNum(ctx, api, 'Finite sample median', '6.03 s', 430);
      drawSamplingExtensionNum(ctx, api, 'Model median', '6.00 s', 650, themeColors.yellow);
    }
    drawSamplingExtensionFooter(
      ctx,
      api,
      'Ideal quantile law; finite generator, numeric inversion and sample variation are separate contracts',
    );
  });
}
export default {
  id: 'inverse-contract',
  draw: drawInverseContract,
  cues: ['sp-inverse-contract-0', 'sp-inverse-contract-1', 'sp-inverse-contract-2'],
};
