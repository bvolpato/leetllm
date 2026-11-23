import {
  completionBox,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawBatchCost(ctx, scene, state, api) {
  api.focus.target('cc-batch-cost-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = Math.max(0, Math.min(1, state.beatP ?? 0));
    {
      completionHeading(ctx, api, 'Illustrative scheduling rounds · request identities persist');
      const stage = Math.floor(progress * 4),
        active = stage < 2 ? ['A: short', 'B: long'] : ['C: newly admitted', 'B: long'];
      active.forEach((v, i) =>
        completionBox(
          ctx,
          api,
          v,
          300 + i * 800,
          420,
          620,
          120,
          i ? themeColors.pink : themeColors.blue,
        ),
      );
      for (let i = 0; i < 4; i++)
        api.rect(
          ctx,
          380 + i * 300,
          695,
          230,
          75,
          themeColors.panel,
          i <= stage ? themeColors.cyan : themeColors.muted,
          2,
          5,
        );
      completionText(
        ctx,
        api,
        stage < 2 ? 'C waits for a runnable seat' : 'A completed → C uses the released seat',
        960,
        865,
        36,
        themeColors.green,
        'center',
      );
      completionFooter(
        ctx,
        api,
        currentBeat
          ? 'Include work spent on requests cancelled after admission'
          : 'Budget input and output tokens for each scheduling round',
      );
    }
    return true;
  });
}
export default {
  id: 'batch-cost',
  draw: drawBatchCost,
  cues: ['cc-batch-cost-0', 'cc-batch-cost-1'],
};
