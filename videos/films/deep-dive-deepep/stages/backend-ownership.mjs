import { chapterModel } from '../construction.mjs';
import {
  drawChapterArrow,
  drawChapterBox,
  drawChapterLine,
  drawChapterTarget,
  drawChapterText,
} from '../defaults.mjs';
export function drawBackendOwnership(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('backend-ownership', state),
    currentBeat = m.b,
    progress2 = m.p;
  const progress = Math.max(0, Math.min(1, (progress2 - 0.07) / 0.65)),
    step = (n) => Math.min(n, Math.floor(progress * (n + 1)));
  drawChapterTarget(ctx, api, 'de-backend-ownership-mechanism', () => {
    const names = [
        'Host NCCL communicator',
        'Physical domains + Gin',
        'Queues + signals',
        'Registered window',
        'Device pointers',
      ],
      n = currentBeat ? 5 : step(5);
    drawChapterText(
      ctx,
      api,
      'Own the registered window until its last consumer completes',
      960,
      275,
      34,
      themeColors.yellow,
      'center',
    );
    names.forEach((v, i) => {
      if (i < n) {
        const x = 210 + (i % 2) * 850,
          y = 350 + Math.floor(i / 2) * 210;
        drawChapterBox(ctx, api, v, x, y, 690, i % 2 ? themeColors.pink : themeColors.blue, 110);
        if (i % 2) drawChapterArrow(ctx, api, 920, y + 55, 1040, y + 55, themeColors.cyan);
        else if (i) {
          drawChapterLine(ctx, api, 1405, y - 100, 1405, y - 50, themeColors.cyan);
          drawChapterLine(ctx, api, 1405, y - 50, 555, y - 50, themeColors.cyan);
          drawChapterArrow(ctx, api, 555, y - 50, 555, y - 15, themeColors.cyan);
        }
      }
    });
    if (currentBeat) {
      api.rect(ctx, 1180, 830, 430, 55, themeColors.pink, undefined, 0);
      drawChapterText(ctx, api, 'Outstanding consumer', 1395, 920, 28, themeColors.pink, 'center');
      drawChapterText(
        ctx,
        api,
        'Retire after the dependency completes; do not replace the communicator early',
        960,
        1020,
        28,
        themeColors.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'backend-ownership',
  draw: drawBackendOwnership,
  cues: ['de-backend-ownership-b0', 'de-backend-ownership-b1'],
};
