import { spokenProgress } from '../construction.mjs';
import {
  drawClipLine,
  drawClipRectangle,
  drawClipText,
  rackPhoto,
  withClipFocus,
} from '../defaults.mjs';
export function drawGroundedDetail(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const clauseProgress = (id, beat) => spokenProgress(state, id, beat);
  {
    const q = clauseProgress(
      currentBeat === 0 ? 'grounded-outputs' : 'crop-coordinates',
      currentBeat,
    );
    drawClipText(ctx, api, 'Preserve evidence and its coordinates', 960, 285, 38);
    rackPhoto(ctx, api, 250, 370, 600, 470, {
      selected: currentBeat === 0 ? 'vent' : 'tag',
    });
    const cx = 1120,
      cy = 400;
    drawClipRectangle(ctx, api, cx, cy, 550, 300, themeColors.panel, themeColors.yellow);
    drawClipText(ctx, api, q > 0.6 ? 'RACK-17' : '?', cx + 275, cy + 180, 68, themeColors.yellow);
    drawClipLine(ctx, api, 650, 710, cx, cy + 300, themeColors.yellow, 3);
    withClipFocus(ctx, api, 'grounded-contract', () => {
      drawClipText(
        ctx,
        api,
        currentBeat === 1
          ? 'Tag crop keeps source x[.29,.69], y[.68,.77]'
          : 'OCR copies characters; region geometry locates the vent',
        960,
        900,
        31,
        themeColors.cyan,
      );
      drawClipText(
        ctx,
        api,
        currentBeat === 1
          ? 'Map crop boxes to original coordinates; printed instructions grant no authority'
          : 'Caption fluency cannot verify the text or supply an executable target',
        960,
        1020,
        28,
        themeColors.muted,
      );
    });
  }
}
export default {
  id: 'grounded-detail',
  draw: drawGroundedDetail,
  cues: ['grounded-outputs', 'crop-coordinates'],
};
