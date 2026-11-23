import { cueMotion } from '../construction.mjs';
import { detailText, footer, patchGrid, title } from '../defaults.mjs';
export function drawVariableResolution(ctx, scene, state, api) {
  api.focus.target('variable-resolution-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    {
      title(ctx, api, 'Preserve aspect ratio within a supported token budget');
      patchGrid(ctx, api, 8, 16, 220, 430, 640, 320, 0);
      patchGrid(ctx, api, 12, 8, 1250, 350, 256, 384, 0, themeColors.cyan);
      detailText(ctx, api, '128 valid patches', 560, 855, 31, themeColors.blue, 'center');
      detailText(ctx, api, '96 valid patches', 1380, 920, 31, themeColors.cyan, 'center');
      const paddingCount = Math.floor(
        32 * cueMotion(state, 1, 'variable-resolution-beat-1', 0.63, 0.85),
      );
      if (paddingCount > 0) {
        for (let i = 0; i < paddingCount; i++)
          api.rect(
            ctx,
            1250 + (i % 8) * 32,
            734 + Math.floor(i / 8) * 32,
            30,
            30,
            themeColors.muted + '40',
            themeColors.muted,
            1,
          );
        detailText(
          ctx,
          api,
          '96 + ' + paddingCount + ' = ' + (96 + paddingCount) + ' slots',
          1380,
          325,
          30,
          themeColors.yellow,
          'center',
        );
      }
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'Inspect real masks through every layer and the attention-pooling readout'
          : 'Both rectangles fit within the same patch budget',
      );
    }
    return true;
  });
}
export default {
  id: 'variable-resolution',
  draw: drawVariableResolution,
  cues: ['variable-resolution-beat-0', 'variable-resolution-beat-1', 'variable-resolution-beat-2'],
};
