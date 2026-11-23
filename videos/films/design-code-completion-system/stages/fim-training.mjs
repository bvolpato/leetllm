import {
  completionBox,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawFimTraining(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0));
  const drawMechanism = () => {
    const pre = 'is_allowed =',
      mid = 'graph.allows(request)',
      suf = 'return is_allowed';
    completionHeading(ctx, api, 'One original hole · explicit checkpoint sentinel order');
    const row = (label, items, y) => {
      completionText(ctx, api, label, 180, y + 45, 28, themeColors.muted);
      let x = 470;
      for (const [v, col, w] of items) {
        completionBox(ctx, api, v, x, y, w, 84, col);
        x += w + 20;
      }
    };
    {
      row(
        'File',
        [
          ['prefix', themeColors.blue, 300],
          ['middle', themeColors.green, 300],
          ['suffix', themeColors.cyan, 300],
        ],
        390,
      );
      row(
        'PSM',
        [
          ['PRE + prefix', themeColors.blue, 390],
          ['SUF + suffix', themeColors.cyan, 390],
          ['MID', themeColors.green, 200],
        ],
        610,
      );
      if (currentBeat > 0)
        row(
          'Joint SPM',
          [
            ['PRE SUF + suffix', themeColors.cyan, 420],
            ['MID + prefix', themeColors.blue, 390],
            ['generate middle', themeColors.green, 250],
          ],
          830,
        );
      completionFooter(
        ctx,
        api,
        currentBeat === 2
          ? 'Use the token IDs and ordering the checkpoint learned'
          : 'Causal generation sees both preserved segments before predicting the missing middle',
      );
    }
  };
  api.focus.target('cc-fim-training-mechanism', drawMechanism);
  return;
}
export default {
  id: 'fim-training',
  draw: drawFimTraining,
  cues: ['cc-fim-training-0', 'cc-fim-training-1', 'cc-fim-psm', 'cc-fim-spm', 'cc-fim-training-2'],
};
