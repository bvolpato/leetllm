import { visionBound } from '../construction.mjs';
import { arrow, card, detailText, footer, line, patchGrid, title } from '../defaults.mjs';
export function drawResolutionGrid(ctx, scene, state, api) {
  api.focus.target('resolution-grid-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = visionBound(state.beatP ?? 0);
    {
      title(ctx, api, 'Separate class state from the spatial patch-position grid');
      card(ctx, api, 'CLS\n[0,1,2]', 190, 400, 180, 110, themeColors.yellow, 25);
      patchGrid(ctx, api, 14, 14, 440, 380, 420, 420, 0, themeColors.blue);
      arrow(ctx, api, 920, 590, 1040, 590);
      const rows = currentBeat === 0 ? 16 : 16,
        cols = currentBeat === 0 ? 16 : 20;
      patchGrid(ctx, api, rows, cols, 1110, 380, 520, 420, 0, themeColors.cyan);
      card(ctx, api, 'CLS\n[0,1,2]', 1660, 400, 180, 110, themeColors.yellow, 25);
      line(ctx, api, 280, 400, 280, 335, themeColors.yellow, 3);
      line(ctx, api, 280, 335, 1740, 335, themeColors.yellow, 3);
      arrow(ctx, api, 1740, 335, 1740, 390, themeColors.yellow);
      detailText(ctx, api, '14×14 +1 =197', 650, 890, 33, themeColors.blue, 'center');
      detailText(
        ctx,
        api,
        `${rows}×${cols} +1 =${rows * cols + 1}`,
        1370,
        890,
        33,
        themeColors.cyan,
        'center',
      );
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'Match interpolation coordinates and checkpoint settings; this toy uses bicubic, align corners false'
          : 'Resize each patch-position feature channel; retain the exact class vector',
      );
    }
    return true;
  });
}
export default {
  id: 'resolution-grid',
  draw: drawResolutionGrid,
  cues: ['resolution-grid-beat-0', 'resolution-grid-beat-1', 'resolution-grid-beat-2'],
};
