import { researchEvent } from '../construction.mjs';
import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionBox,
  drawResearchConstructionDot,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionLine,
  drawResearchConstructionText,
} from '../defaults.mjs';
export function drawCovariance(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('covariance', state),
    currentBeat = modelState.b;
  const E = (beat, sentence) => researchEvent('covariance', state, beat, sentence),
    resultComplete = (beat, sentence) => E(beat, sentence) === 1;
  api.focus.target('rs-covariance-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      'Same marginals · negative covariance · zero mean difference',
    );
    const x = (v) => 310 + v * 620,
      y = (v) => 770 - v * 400;
    drawResearchConstructionLine(ctx, api, 300, 785, 975, 785);
    drawResearchConstructionLine(ctx, api, 300, 785, 300, 345);
    modelState.x.forEach((v, i) => {
      drawResearchConstructionDot(ctx, api, x(v), y(modelState.y[i]), themeColors.cyan, 13);
      drawResearchConstructionText(
        ctx,
        api,
        `(${v.toFixed(2)},${modelState.y[i].toFixed(2)})`,
        x(v) + 18,
        y(modelState.y[i]) - 15,
        24,
        themeColors.cyan,
      );
    });
    drawResearchConstructionText(ctx, api, 'baseline', 600, 858, 29, themeColors.blue);
    drawResearchConstructionText(ctx, api, 'candidate =1−baseline', 300, 315, 28, themeColors.cyan);
    if (resultComplete(1, 2))
      drawResearchConstructionBox(
        ctx,
        api,
        'Var sparse = Var shaped = .15625',
        1080,
        360,
        620,
        100,
        themeColors.blue,
        30,
      );
    if (resultComplete(1, 1))
      drawResearchConstructionBox(
        ctx,
        api,
        'Covariance = −.15625',
        1080,
        520,
        620,
        95,
        themeColors.yellow,
        31,
      );
    if (resultComplete(1, 3))
      drawResearchConstructionBox(
        ctx,
        api,
        'Independent mean variance .0625\nPaired mean variance .125',
        1080,
        690,
        620,
        145,
        themeColors.pink,
        31,
      );
    drawResearchConstructionFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'The mean difference stays zero. Pairing increased variance here.'
        : 'Var(mean Δ) = [Var(A) + Var(B) − 2 Cov(A,B)] / 5',
    );
  });
}
export default {
  id: 'covariance',
  draw: drawCovariance,
  cues: [
    'rs-covariance-0',
    'rsx-covariance-b0-s0',
    'rsx-covariance-b0-s1',
    'rsx-covariance-b0-s2',
    'rs-covariance-1',
    'rsx-covariance-b1-s0',
    'rsx-covariance-b1-s1',
    'rsx-covariance-b1-s2',
    'rsx-covariance-b1-s3',
    'rs-covariance-2',
    'rsx-covariance-b2-s0',
    'rsx-covariance-b2-s1',
    'rsx-covariance-b2-s2',
  ],
};
