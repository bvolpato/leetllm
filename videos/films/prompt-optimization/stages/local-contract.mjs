import { cueComplete, cueProgress, detailPanel, detailText, progressArrow } from '../defaults.mjs';
import { paymentCase } from '../policy-sheet.mjs';
export function drawLocalContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('local-contract-mechanism', () => {
    if (currentBeat === 0) {
      api.text(ctx, 'Training request', 130, 288, 37, themeColors.muted);
      api.text(ctx, 'Roll back payment-tests?', 130, 397, 66, themeColors.ink);
      api.text(ctx, 'Policy record', 130, 538, 37, themeColors.blue);
      api.text(
        ctx,
        paymentCase.recordId + ' permits this rollback.',
        130,
        625,
        44,
        themeColors.ink,
      );
      if (cueProgress(ctx, api, 'local-proof'))
        api.text(ctx, 'DSPy 3.4.0  ·  local model double', 130, 971, 34, themeColors.muted);
      if (cueProgress(ctx, api, 'typed-proposals')) {
        api.text(ctx, 'Proposed reply', 1100, 538, 37, themeColors.cyan);
        api.text(ctx, 'SERVE  ·  ' + paymentCase.recordId, 1100, 625, 47, themeColors.ink);
      }
      if (cueProgress(ctx, api, 'cot-output')) {
        api.text(ctx, 'reasoning', 130, 814, 40, themeColors.yellow, 'left', 'mono');
        api.text(
          ctx,
          '“The approval covers rolling back payment-tests.”',
          458,
          814,
          47,
          themeColors.ink,
        );
      }
    } else {
      detailText(ctx, api, 'Labeled training set', 500, 290, 45, themeColors.blue);
      detailText(ctx, api, 'Compiled copy', 1400, 290, 45, themeColors.cyan);
      const demos = ['Rollback  →  SERVE · approval-4412', 'Deploy  →  ABSTAIN · empty ID'];
      const copied = cueComplete(ctx, api, 'labeled-compiled');
      demos.forEach((label, i) => {
        const y = 445 + i * 146;
        detailPanel(ctx, api, label, 500, y, themeColors.blue, 810);
        const copying = cueProgress(ctx, api, 'labeled-slots');
        if (copying > 0) progressArrow(ctx, api, 925, y, 1030, y, themeColors.cyan, copying);
        detailPanel(
          ctx,
          api,
          copied ? label : 'Example slot ' + (i + 1),
          1450,
          y,
          copied ? themeColors.cyan : themeColors.muted,
          775,
        );
      });
      if (copied)
        detailText(ctx, api, 'Compiled examples: ' + demos.length, 1450, 765, 41, themeColors.cyan);
      detailText(ctx, api, 'Original student: 0 examples', 500, 765, 39, themeColors.ink);
      if (cueProgress(ctx, api, 'teacher-copy'))
        detailText(
          ctx,
          api,
          'A teacher can use the same model as the student.',
          960,
          909,
          37,
          themeColors.yellow,
        );
    }
  });
}
export default {
  id: 'local-contract',
  draw: drawLocalContract,
  cues: [
    'local-proof',
    'typed-proposals',
    'cot-output',
    'labeled-copy',
    'labeled-slots',
    'labeled-compiled',
    'teacher-copy',
  ],
};
