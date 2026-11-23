import { chapterModel } from '../construction.mjs';
import {
  drawChapterBox,
  drawChapterEquation,
  drawChapterGrid,
  drawChapterTarget,
  drawChapterText,
} from '../defaults.mjs';
export function drawRuntimeIdentity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('runtime-identity', state),
    currentBeat = m.b,
    progress2 = m.p;
  const progress = Math.max(0, Math.min(1, (progress2 - 0.07) / 0.65));
  drawChapterTarget(ctx, api, 'de-runtime-identity-mechanism', () => {
    if (!currentBeat) {
      drawChapterText(
        ctx,
        api,
        'Supplied version receipt · both pass their configured minimum',
        960,
        275,
        33,
        themeColors.yellow,
        'center',
      );
      drawChapterBox(ctx, api, 'Header branch < 2.31', 220, 390, 640, themeColors.blue, 105);
      drawChapterBox(ctx, api, 'Loaded runtime version', 1060, 390, 640, themeColors.pink, 105);
      const repair = progress > 0.6;
      drawChapterText(ctx, api, '2.30.2', 540, 630, 52, themeColors.blue, 'center');
      drawChapterText(
        ctx,
        api,
        repair ? '2.30.2' : '2.30.3',
        1380,
        630,
        52,
        repair ? themeColors.green : themeColors.pink,
        'center',
      );
      drawChapterEquation(
        ctx,
        api,
        repair ? '23002=23002' : '23002\\ne23003',
        960,
        810,
        45,
        repair ? themeColors.green : themeColors.pink,
      );
      drawChapterText(
        ctx,
        api,
        'Older-header path checks exact loaded identity; newer branch requests runtime-version device communicator',
        960,
        1010,
        27,
        themeColors.muted,
        'center',
      );
    } else {
      drawChapterGrid(
        ctx,
        api,
        [
          ['Migration prerequisite', 'Named source floor'],
          ['CUDA toolkit', '13.1'],
          ['PyTorch', '2.10'],
          ['NCCL', '2.32.3'],
          ['GPU / compiler', 'Hopper+ / C++20'],
        ],
        250,
        330,
        1420,
        470,
        themeColors.blue,
        29,
      );
      drawChapterText(
        ctx,
        api,
        'Also inspect peer map, Gin, RDMA rails, queues and symmetric memory',
        960,
        960,
        30,
        themeColors.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'runtime-identity',
  draw: drawRuntimeIdentity,
  cues: ['de-runtime-identity-b0', 'de-runtime-identity-b1'],
};
