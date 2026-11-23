import { drawArrow, drawBox, drawMatrix, drawText, mark } from '../defaults.mjs';
import { resultAfter } from '../../../lib/lesson-definition.mjs';
export function drawIndexingBounds(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const paint = () => {
    drawMatrix(ctx, api, [10, 20, 30], 250, 390, {
      cw: 200,
      ch: 120,
      label: 'original value',
    });
    if (currentBeat === 0) {
      drawMatrix(ctx, api, [10, 99, 30], 1080, 390, {
        cw: 200,
        ch: 120,
        color: themeColors.green,
        label: 'returned by original.at[1].set(99)',
      });
      drawArrow(ctx, api, 850, 450, 1040, 450, themeColors.yellow);
      drawText(
        ctx,
        api,
        'What will a write or a read at index 9 do?',
        960,
        750,
        33,
        themeColors.yellow,
      );
      drawBox(ctx, api, 'original[1] = 99 → TypeError', 420, 850, 1080, 90, themeColors.pink);
    } else {
      const dropped = resultAfter(state, 'index-drop'),
        clipped = resultAfter(state, 'index-clip');
      drawBox(ctx, api, 'original.at[9].set(99)', 230, 650, 635, 90, themeColors.pink);
      drawArrow(ctx, api, 530, 745, 530, 805, themeColors.muted);
      drawMatrix(ctx, api, [10, 20, 30], 250, 830, {
        cw: 200,
        ch: 100,
        color: themeColors.blue,
        known: dropped,
      });
      drawBox(ctx, api, 'original.at[9].get()', 1050, 650, 610, 90, themeColors.yellow);
      if (clipped) {
        drawArrow(ctx, api, 1350, 745, 1515, 830, themeColors.yellow);
        drawBox(ctx, api, '30 · clipped last entry', 1180, 845, 550, 85, themeColors.green);
      }
      drawText(ctx, api, 'Requested index', 1370, 380, 35, themeColors.muted);
      drawText(ctx, api, '9', 1370, 494, 88, themeColors.yellow);
    }
  };
  mark(ctx, api, 'jx-indexing-bounds-mechanism', paint);
}
export default {
  id: 'indexing-bounds',
  draw: drawIndexingBounds,
  cues: ['jx-indexing-bounds-b0', 'jx-indexing-bounds-b1', 'index-drop', 'index-clip'],
};
