import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterArrow,
  drawSkyChapterBox,
  drawSkyChapterFoot,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawVersionContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('version-contract', state),
    cueProgress = () => api.focus.progress(`sky-${'version-contract'}-b${currentBeat}`, progress);
  api.focus.target('sky-version-contract-mechanism', () => {
    drawSkyChapterTitle(ctx, api, 'Which source produced this trajectory?');
    drawSkyChapterBox(ctx, api, 'query-42_0', 720, 390, 480, 105, themeColors.yellow, 38);
    drawSkyChapterBox(ctx, api, 'pin 955c3e23…', 210, 605, 600, 100, themeColors.blue, 37);
    drawSkyChapterBox(ctx, api, 'CPU method harness', 1110, 605, 600, 100, themeColors.cyan, 35);
    drawSkyChapterArrow(ctx, api, 720, 495, 510, 585, themeColors.blue);
    drawSkyChapterArrow(ctx, api, 1200, 495, 1410, 585, themeColors.cyan);
    if (!currentBeat) {
      drawSkyChapterText(
        ctx,
        api,
        'skyrl-train / skyrl-tx',
        520,
        820,
        31,
        themeColors.muted,
        'center',
      );
      drawSkyChapterArrow(ctx, api, 890, 805, 1050, 805, themeColors.blue);
      drawSkyChapterText(ctx, api, 'unified skyrl', 1380, 820, 34, themeColors.blue, 'center');
    } else {
      const n = Math.min(4, Math.floor(cueProgress() * 5));
      ['capacity', 'filtering', 'epoch state', 'reward stamps'].forEach((v, i) =>
        drawSkyChapterBox(
          ctx,
          api,
          n > i ? v + ' ✓' : v,
          260 + i * 400,
          810,
          360,
          90,
          n > i ? themeColors.green : themeColors.muted,
          28,
        ),
      );
    }
    drawSkyChapterFoot(ctx, api, 'SkyRL source at 955c3e23');
  });
}
export default {
  id: 'version-contract',
  draw: drawVersionContract,
  cues: ['sky-version-contract-b0', 'sky-version-contract-b1'],
};
