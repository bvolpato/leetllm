import { sampleModel } from '../construction.mjs';
import { drawCard, drawEquation, drawFooter, drawGrid, drawText } from '../defaults.mjs';
export function drawPipelineScaling(ctx, scene, state, api) {
  return api.focus.target('pt-pipeline-scaling-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('pipeline-scaling', state),
      { b: currentBeat, p: progress } = modelState;
    {
      drawText(
        ctx,
        api,
        currentBeat === 2
          ? 'Unequal microbatch sizes require sample-count weighting'
          : 'Mean loss in each equal-sized microbatch',
        960,
        285,
        35,
        themeColors.yellow,
        'center',
      );
      if (currentBeat < 2) {
        drawGrid(
          ctx,
          api,
          [modelState.values.map((v, i) => (i < modelState.count ? v : ''))],
          220,
          400,
          1480,
          110,
          themeColors.blue,
        );
        drawText(
          ctx,
          api,
          'Accumulated sum: ' + (modelState.showSum ? modelState.subtotal : '?'),
          960,
          650,
          39,
          modelState.showSum ? themeColors.cyan : themeColors.yellow,
          'center',
        );
        drawCard(ctx, api, 'Divide once by 4', 220, 750, 660, themeColors.green, 100);
        drawCard(ctx, api, 'Divide a second time by 4', 1040, 750, 660, themeColors.pink, 100);
        drawText(
          ctx,
          api,
          modelState.showMean ? '5' : '?',
          550,
          960,
          48,
          modelState.showMean ? themeColors.green : themeColors.yellow,
          'center',
        );
        drawText(
          ctx,
          api,
          modelState.showDouble ? '1.25' : '?',
          1370,
          960,
          48,
          modelState.showDouble ? themeColors.pink : themeColors.yellow,
          'center',
        );
      } else {
        drawGrid(
          ctx,
          api,
          [
            ['Microbatch', 'Mean gradient', 'Samples'],
            ['A', '2', '1'],
            ['B', '4', '3'],
          ],
          290,
          390,
          1340,
          250,
          themeColors.blue,
        );
        drawEquation(
          ctx,
          api,
          String.raw`\frac{1\cdot2+3\cdot4}{1+3}=3.5`,
          960,
          840,
          48,
          themeColors.green,
        );
        drawFooter(
          ctx,
          api,
          'An unweighted mean would produce 3 and describe a different objective',
        );
      }
    }
  });
}
export default {
  id: 'pipeline-scaling',
  draw: drawPipelineScaling,
  cues: [
    'pt-pipeline-scaling-0',
    'pt-pipeline-scaling-1',
    'pt-micro-sum',
    'pt-micro-mean',
    'pt-micro-double',
    'pt-pipeline-scaling-2',
  ],
};
