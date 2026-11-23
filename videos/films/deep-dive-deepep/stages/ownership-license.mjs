import { chapterModel } from '../construction.mjs';
import {
  drawChapterBox,
  drawChapterLine,
  drawChapterTarget,
  drawChapterText,
} from '../defaults.mjs';
export function drawOwnershipLicense(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('ownership-license', state),
    currentBeat = m.b,
    progress2 = m.p;
  const progress = Math.max(0, Math.min(1, (progress2 - 0.07) / 0.65));
  drawChapterTarget(ctx, api, 'de-ownership-license-mechanism', () => {
    drawChapterText(
      ctx,
      api,
      'What goes into the deployment image?',
      960,
      275,
      34,
      themeColors.yellow,
      'center',
    );
    const rows = currentBeat
      ? [
          ['CUDA / NCCL', 'their terms'],
          ['Archived NVSHMEM', 'legacy image inventory'],
          ['Weights / data / firmware', 'separate artifact terms'],
        ]
      : [
          ['DeepSeek source pin', 'MIT notice'],
          ['Named collaborators', 'snapshot attribution'],
          ['Other deployed artifacts', 'check each component’s terms'],
        ];
    rows.forEach((r, i) => {
      drawChapterBox(ctx, api, r[0], 220, 360 + i * 205, 720, themeColors.blue, 105);
      drawChapterBox(
        ctx,
        api,
        r[1],
        1050,
        360 + i * 205,
        650,
        i === 0 ? themeColors.cyan : themeColors.muted,
        105,
      );
      drawChapterLine(ctx, api, 950, 410 + i * 205, 1040, 410 + i * 205);
    });
    drawChapterText(
      ctx,
      api,
      currentBeat
        ? 'Archived V1 methods use NVSHMEM'
        : 'Include the source license and copyright notice',
      960,
      1020,
      28,
      themeColors.muted,
      'center',
    );
  });
}
export default {
  id: 'ownership-license',
  draw: drawOwnershipLicense,
  cues: ['de-ownership-license-b0', 'de-ownership-license-b1'],
};
