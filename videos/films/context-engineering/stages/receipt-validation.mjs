import { boundedContext, contextDone, contextProgress } from '../arithmetic.mjs';
import { completeResume, contextResumeFixture } from '../recovery.mjs';
import {
  drawCompleteColumns,
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompleteLine,
  drawCompleteRecord,
  drawCompleteText,
} from '../defaults.mjs';
export function drawReceiptValidation(ctx, scene, state, api) {
  if (paintReceiptValidation(ctx, scene, state, api)) return;
}
function paintReceiptValidation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat, start = 0.08, end = 0.88) =>
      contextProgress(state, id, beat, start, end),
    resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  drawCompleteFocus(ctx, api, 'ce-receipt-validation-mechanism', () => {
    drawCompleteHeading(
      ctx,
      api,
      currentBeat === 0
        ? 'Graph validity is checked before any done label'
        : currentBeat === 1
          ? 'Exact input membership is part of the receipt contract'
          : 'A digest check has a trusted local boundary',
    );
    if (currentBeat === 0) {
      const cycle = cueProgress('ce-graph-cycle', 0);
      ['collect', 'verify cause', 'report'].forEach((name, i) => {
        const x = 150 + i * 560;
        drawCompleteRecord(
          ctx,
          api,
          name,
          i < 2 ? 'done label supplied' : 'pending',
          x,
          450,
          500,
          themeColors.blue,
          125,
        );
        if (i < 2) drawCompleteLine(ctx, api, x + 510, 510, x + 545, 510, themeColors.muted, 3);
      });
      if (cycle > 0) {
        drawCompleteLine(ctx, api, 1240, 650, 400, 650, themeColors.pink, 3);
        drawCompleteLine(ctx, api, 400, 650, 400, 600, themeColors.pink, 3);
        if (cycle === 1)
          drawCompleteText(
            ctx,
            api,
            'cycle → reject before reading done receipts',
            150,
            830,
            34,
            themeColors.pink,
          );
      }
      drawCompleteText(
        ctx,
        api,
        'Unique IDs · valid status · known distinct dependencies',
        150,
        970,
        30,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      const mismatch = resultComplete('ce-input-set-error', 1),
        f = contextResumeFixture();
      if (mismatch) f.tasks[0].inputs.push('authorization.json');
      let error;
      try {
        completeResume(f.tasks, f.files, f.receipts);
      } catch (e) {
        error = e.message;
      }
      drawCompleteColumns(
        ctx,
        api,
        ['declared manifest', 'receipt input keys'],
        [
          ['deploy.json', 'deploy.json'],
          [
            mismatch ? 'authorization.json added' : 'no additional input',
            mismatch ? 'MISSING' : 'same exact set',
          ],
        ],
        150,
        420,
        [760, 800],
        170,
      );
      drawCompleteText(
        ctx,
        api,
        mismatch ? error : 'same task / evaluator / version / Boolean true',
        150,
        855,
        34,
        mismatch ? themeColors.pink : themeColors.green,
      );
      drawCompleteText(
        ctx,
        api,
        'Artifact and every input digest are recomputed separately',
        150,
        970,
        29,
        themeColors.yellow,
      );
    } else {
      drawCompleteRecord(
        ctx,
        api,
        'checkpoint root',
        'relative-path resolution boundary',
        150,
        420,
        750,
        themeColors.blue,
        110,
      );
      drawCompleteRecord(
        ctx,
        api,
        '../outside.json',
        'reject resolved outside root',
        1050,
        420,
        690,
        themeColors.pink,
        110,
      );
      drawCompleteText(
        ctx,
        api,
        'If files can change during the check, enforce the directory boundary at open.',
        150,
        740,
        30,
        themeColors.yellow,
      );
      drawCompleteText(
        ctx,
        api,
        'Matching hashes tie the current bytes to the checked result.',
        150,
        930,
        34,
        themeColors.cyan,
      );
    }
    drawCompleteFooter(
      ctx,
      api,
      'A trusted manifest and evaluator define what a valid local receipt can certify.',
    );
  });
  return true;
}
export default {
  id: 'receipt-validation',
  draw: drawReceiptValidation,
  cues: [
    'ce-receipt-validation-1',
    'ce-graph-cycle',
    'ce-receipt-validation-2',
    'ce-input-set-error',
    'ce-receipt-validation-3',
  ],
};
