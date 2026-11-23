import { observationCue } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterText,
  drawHeading,
  drawRectangle,
  drawTable,
  withTarget,
} from '../defaults.mjs';
export function drawSampleWeights(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (beat, n) => observationCue(state, 'sample-weights', beat, n),
    resultComplete = (beat, n) => progress(beat, n) === 1;
  {
    if (currentBeat === 0) {
      drawHeading(ctx, api, 'Use each trace’s retention probability');
      withTarget(ctx, api, 'weight-operation', () => {
        drawTable(
          ctx,
          api,
          ['Retained record', 'Inclusion probability', 'Weight'],
          [
            ['trace i', 'pᵢ > 0', '1 / pᵢ'],
            ['unsafe subset', 'same known design', 'sum unsafe weights'],
            ['all retained traces', 'same known design', 'sum all weights'],
          ],
          140,
          345,
          [500, 590, 530],
          135,
        );
        if (resultComplete(0, 4))
          drawChapterText(
            ctx,
            api,
            'Weighted rate estimate = unsafe weight sum / all weight sum',
            140,
            925,
            33,
            themeColors.cyan,
          );
        if (resultComplete(0, 5))
          drawChapterText(
            ctx,
            api,
            'A ratio estimate can have finite-sample bias',
            140,
            985,
            29,
            themeColors.yellow,
          );
      });
    } else if (currentBeat === 1) {
      const alternative = resultComplete(1, 5);
      drawHeading(
        ctx,
        api,
        alternative
          ? 'Second sample  /  same six requests'
          : 'First sample  /  three retained traces',
      );
      withTarget(ctx, api, 'weight-premises', () => {
        drawChapterCard(
          ctx,
          api,
          'Unsafe trace A',
          'p=1 → weight 1',
          140,
          355,
          500,
          themeColors.pink,
          150,
        );
        drawChapterCard(
          ctx,
          api,
          'Unsafe trace B',
          'p=1 → weight 1',
          690,
          355,
          500,
          themeColors.pink,
          150,
        );
        drawChapterCard(
          ctx,
          api,
          'Safe trace C',
          alternative ? 'Absent from this sample' : 'p = 1/4',
          1240,
          355,
          520,
          alternative ? themeColors.muted : themeColors.blue,
          150,
        );
      });
      withTarget(ctx, api, 'weighted-result', () => {
        drawChapterText(ctx, api, 'Unsafe estimated total', 140, 650, 30, themeColors.pink);
        drawRectangle(ctx, api, 140, 700, 240, 65, themeColors.pink, null);
        drawChapterText(ctx, api, '2', 410, 745, 32, themeColors.pink);
        if (!alternative && resultComplete(1, 2)) {
          drawChapterText(ctx, api, 'Safe estimated total', 760, 650, 30, themeColors.blue);
          drawRectangle(ctx, api, 760, 700, 480, 65, themeColors.blue, null);
          drawChapterText(ctx, api, '1 / .25 = 4', 1270, 745, 32, themeColors.blue);
        }
        if (resultComplete(1, 3) && !alternative)
          drawChapterText(
            ctx,
            api,
            'Estimated rate = 2 / (2 + 4) = 1/3',
            140,
            915,
            36,
            themeColors.cyan,
          );
      });
      withTarget(ctx, api, 'alternate-sample', () => {
        if (!alternative)
          drawChapterText(
            ctx,
            api,
            'Full window    2 unsafe out of 6 requests',
            140,
            990,
            28,
            themeColors.muted,
          );
        if (alternative) {
          drawChapterText(
            ctx,
            api,
            'No safe trace retained · safe estimated total 0',
            140,
            850,
            31,
            themeColors.yellow,
          );
          drawChapterText(
            ctx,
            api,
            'Estimated rate = 2 / (2 + 0) = 1',
            140,
            930,
            36,
            themeColors.pink,
          );
          drawChapterText(
            ctx,
            api,
            'Known population remains 2 unsafe / 6 requests',
            140,
            990,
            29,
            themeColors.muted,
          );
        }
      });
    } else {
      drawHeading(ctx, api, 'Reconstruction needs a working sampling and label design');
      withTarget(ctx, api, 'weight-limitations', () => {
        drawChapterCard(
          ctx,
          api,
          'Positive retention probability',
          'known p > 0 → finite weight 1/p',
          140,
          365,
          760,
          themeColors.blue,
          150,
        );
        drawChapterCard(
          ctx,
          api,
          'Zero-retention group',
          resultComplete(2, 2)
            ? 'p=0 → absent; no reconstruction'
            : 'a group may never reach storage',
          1000,
          365,
          760,
          themeColors.pink,
          150,
        );
        if (progress(2, 3) > 0)
          drawChapterCard(
            ctx,
            api,
            'Prefer pre-sampling counters',
            'ingress + detected outcomes + evaluator coverage',
            140,
            705,
            1620,
            themeColors.green,
            145,
          );
        if (resultComplete(2, 4))
          drawChapterText(
            ctx,
            api,
            'Weighting cannot find an undetected defect or restore a missing ledger',
            140,
            965,
            30,
            themeColors.yellow,
          );
      });
    }
  }
  return true;
}
export default {
  id: 'sample-weights',
  draw: drawSampleWeights,
  cues: [
    'ob-sample-weights-1-1',
    'ob-sample-weights-1-2',
    'ob-sample-weights-1-3',
    'ob-sample-weights-1-4',
    'ob-sample-weights-1-5',
    'ob-sample-weights-2-1',
    'ob-sample-weights-2-2',
    'ob-sample-weights-2-3',
    'ob-sample-weights-2-4',
    'ob-sample-weights-2-5',
    'ob-sample-weights-3-1',
    'ob-sample-weights-3-2',
    'ob-sample-weights-3-3',
    'ob-sample-weights-3-4',
  ],
};
