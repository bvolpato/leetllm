import { chapterModel } from '../construction.mjs';
import {
  drawChapterArrow,
  drawChapterBox,
  drawChapterLine,
  drawChapterTarget,
  drawChapterText,
} from '../defaults.mjs';
export function drawVisibilityFence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('visibility-fence', state),
    currentBeat = m.b,
    progress2 = m.p;
  const progress = Math.max(0, Math.min(1, (progress2 - 0.07) / 0.65));
  drawChapterTarget(ctx, api, 'de-visibility-fence-mechanism', () => {
    drawChapterText(
      ctx,
      api,
      'Mixed fabric   ·   NVLink writes and a Gin barrier',
      960,
      280,
      32,
      themeColors.yellow,
      'center',
    );
    const steps = ['NVLink writes', 'System fence', 'Publish signal', 'Consumer wait', 'Read rows'];
    steps.forEach((v, i) => {
      const x = 150 + i * 350;
      drawChapterBox(ctx, api, v, x, 450, 320, i === 1 ? themeColors.pink : themeColors.blue, 110);
      if (i < 4)
        drawChapterArrow(
          ctx,
          api,
          x + 325,
          505,
          x + 345,
          505,
          i === 1 ? themeColors.pink : themeColors.cyan,
        );
    });
    if (currentBeat || progress > 0.45) {
      drawChapterLine(ctx, api, 220, 760, 1700, 760, themeColors.muted);
      drawChapterText(ctx, api, 'submitted', 340, 840, 31, themeColors.blue, 'center');
      drawChapterText(ctx, api, 'visible to peer', 960, 840, 31, themeColors.pink, 'center');
      drawChapterText(ctx, api, 'consumer ordered', 1540, 840, 31, themeColors.cyan, 'center');
      drawChapterText(
        ctx,
        api,
        'Each step orders the next use of the row',
        960,
        990,
        31,
        themeColors.muted,
        'center',
      );
    } else
      drawChapterText(
        ctx,
        api,
        'Historical pin precedes the mixed-fabric fence repair',
        960,
        850,
        32,
        themeColors.pink,
        'center',
      );
  });
}
export default {
  id: 'visibility-fence',
  draw: drawVisibilityFence,
  cues: ['de-visibility-fence-b0', 'de-visibility-fence-b1'],
};
