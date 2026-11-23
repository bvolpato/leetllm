import { chapterModel } from '../construction.mjs';
import {
  drawChapterArrow,
  drawChapterBox,
  drawChapterGrid,
  drawChapterLine,
  drawChapterTarget,
  drawChapterText,
} from '../defaults.mjs';
export function drawVersionBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('version-boundary', state),
    currentBeat = m.b,
    progress2 = m.p;
  const progress = Math.max(0, Math.min(1, (progress2 - 0.07) / 0.65));
  drawChapterTarget(ctx, api, 'de-version-boundary-mechanism', () => {
    drawChapterText(
      ctx,
      api,
      'One token row and two expert choices',
      960,
      275,
      34,
      themeColors.yellow,
      'center',
    );
    drawChapterLine(ctx, api, 300, 425, 1620, 425);
    [420, 1400].forEach((x) => drawChapterLine(ctx, api, x, 405, x, 445));
    drawChapterText(ctx, api, 'Historical V2 pin', 420, 360, 30, themeColors.blue, 'center');
    drawChapterText(
      ctx,
      api,
      currentBeat ? 'V2.5 migration' : 'CPU example',
      1400,
      360,
      30,
      themeColors.pink,
      'center',
    );
    drawChapterBox(ctx, api, 'ElasticBuffer', 190, 475, 460, themeColors.blue, 110);
    drawChapterGrid(
      ctx,
      api,
      [['a', '[1, 0]', 'E2 / E3']],
      180,
      665,
      620,
      110,
      themeColors.blue,
      28,
    );
    drawChapterArrow(ctx, api, 810, 720, 1070, 720, themeColors.yellow);
    if (currentBeat) {
      ['EPBuffer', 'BucketBuffer', 'PPBuffer', 'EngramBuffer'].forEach((label, i) =>
        drawChapterBox(
          ctx,
          api,
          label,
          1100 + (i % 2) * 340,
          475 + Math.floor(i / 2) * 170,
          310,
          i === 0 ? themeColors.green : themeColors.muted,
        ),
      );
      drawChapterText(
        ctx,
        api,
        'Host extension → runtime DeepJIT specialization',
        960,
        955,
        31,
        themeColors.cyan,
        'center',
      );
      drawChapterText(
        ctx,
        api,
        'V1 / NVSHMEM removed at this migration',
        1400,
        865,
        28,
        themeColors.pink,
        'center',
      );
    } else {
      drawChapterBox(
        ctx,
        api,
        'Expert slots → source row a',
        1100,
        580,
        620,
        themeColors.cyan,
        125,
      );
      drawChapterText(
        ctx,
        api,
        'Check the returned coordinates',
        1410,
        810,
        27,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'version-boundary',
  draw: drawVersionBoundary,
  cues: ['de-version-boundary-b0', 'de-version-boundary-b1'],
};
