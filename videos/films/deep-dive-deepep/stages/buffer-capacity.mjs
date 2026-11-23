import { chapterModel } from '../construction.mjs';
import {
  drawChapterBox,
  drawChapterEquation,
  drawChapterTarget,
  drawChapterText,
} from '../defaults.mjs';
export function drawBufferCapacity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('buffer-capacity', state),
    currentBeat = m.b;
  const allocated = state.cues?.['de-buffer-capacity-b0']?.phase === 'after';
  drawChapterTarget(ctx, api, 'de-buffer-capacity-mechanism', () => {
    drawChapterText(
      ctx,
      api,
      'Supplied finite row envelope · capacity 12',
      960,
      280,
      36,
      themeColors.yellow,
      'center',
    );
    Array.from(
      {
        length: 12,
      },
      (_, i) => {
        const x = 170 + i * 132;
        api.rect(ctx, x, 420, 115, 130, themeColors.panel, themeColors.muted, 2);
        if (currentBeat && i < 8)
          api.rect(ctx, x + 7, 427, 101, 116, themeColors.blue, undefined, 0);
        drawChapterText(ctx, api, i, x + 57, 600, 25, themeColors.muted, 'center');
      },
    );
    if (!currentBeat) {
      drawChapterBox(
        ctx,
        api,
        allocated ? 'Allocated storage for 12 rows' : 'Size hint: plan for 12 rows',
        590,
        735,
        740,
        allocated ? themeColors.cyan : themeColors.muted,
        110,
      );
      drawChapterText(
        ctx,
        api,
        'Construct the buffer to reserve the planned bytes',
        960,
        970,
        31,
        themeColors.muted,
        'center',
      );
    } else {
      drawChapterText(ctx, api, 'Session A: 8 live rows', 520, 745, 32, themeColors.blue, 'center');
      drawChapterText(
        ctx,
        api,
        'Session B asks for 5 more',
        1400,
        745,
        32,
        themeColors.pink,
        'center',
      );
      drawChapterEquation(ctx, api, '8+5=13>12', 960, 875, 47, themeColors.pink);
      drawChapterText(
        ctx,
        api,
        'One extra row needs space while session A is still reading',
        960,
        1010,
        28,
        themeColors.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'buffer-capacity',
  draw: drawBufferCapacity,
  cues: ['de-buffer-capacity-b0', 'de-buffer-capacity-b1'],
};
