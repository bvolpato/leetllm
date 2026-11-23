import { chapterModel } from '../construction.mjs';
import {
  drawChapterArrow,
  drawChapterBox,
  drawChapterGrid,
  drawChapterTarget,
  drawChapterText,
} from '../defaults.mjs';
export function drawLegacyExperimental(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('legacy-experimental', state),
    currentBeat = m.b;
  drawChapterTarget(ctx, api, 'de-legacy-experimental-mechanism', () => {
    if (!currentBeat) {
      drawChapterText(
        ctx,
        api,
        'Trace a weighted row through the replacement transport',
        960,
        275,
        34,
        themeColors.yellow,
        'center',
      );
      drawChapterGrid(
        ctx,
        api,
        [
          ['Contract', 'Archived V1', 'Historical V2', 'V2.5 migration'],
          ['Public object', 'Buffer', 'ElasticBuffer', 'Dedicated buffers'],
          ['Transport boundary', 'NVSHMEM paths', 'NCCL Gin', 'NCCL / DeepJIT'],
          ['Legacy low-latency claim', 'Separate zero-SM path', 'Not inherited', 'Legacy removed'],
        ],
        130,
        390,
        1660,
        420,
        themeColors.blue,
        28,
      );
    } else {
      drawChapterText(
        ctx,
        api,
        'Engram is a supplied-index entry lookup',
        960,
        280,
        36,
        themeColors.yellow,
        'center',
      );
      drawChapterGrid(
        ctx,
        api,
        [
          ['index 0', 'index 1', 'index 2', 'index 3'],
          ['entry A', 'entry B', 'entry C', 'entry D'],
        ],
        200,
        390,
        1500,
        180,
        themeColors.blue,
        29,
      );
      const index = 2;
      const progress = state.cues?.['de-engram-entry']?.progress ?? 0;
      const from = 380 + index * 375;
      if (progress > 0)
        drawChapterArrow(
          ctx,
          api,
          from,
          600,
          from + (960 - from) * progress,
          600 + 210 * progress,
          themeColors.cyan,
        );
      drawChapterBox(
        ctx,
        api,
        progress === 1 ? 'Requested entry ' + String.fromCharCode(65 + index) : 'Remote entry',
        650,
        840,
        620,
        themeColors.cyan,
        105,
      );
      drawChapterText(
        ctx,
        api,
        'Fetch the entry from its owner and read its scale locally',
        960,
        1020,
        28,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'legacy-experimental',
  draw: drawLegacyExperimental,
  cues: ['de-legacy-experimental-b0', 'de-legacy-experimental-b1', 'de-engram-entry'],
};
