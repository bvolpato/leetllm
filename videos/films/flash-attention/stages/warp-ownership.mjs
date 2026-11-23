import { SCORES, VALUES } from '../fixtures.mjs';
import { flashExtensionFrame, summarize } from '../model.mjs';
import {
  drawFlashExtensionEquation,
  drawFlashExtensionFooter,
  drawFlashExtensionL,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawWarpOwnership(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('warp-ownership', state),
    currentBeat = f.beat,
    progress = f.progress,
    colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
  const paint = () => {
    const qSplit = currentBeat > 0,
      T0 = summarize(SCORES, VALUES),
      other = summarize([0, 0, 0], VALUES);
    drawFlashExtensionText(
      ctx,
      api,
      qSplit
        ? 'Separate query rows own separate outputs'
        : 'One query: partial key blocks must combine',
      960,
      290,
      37,
      themeColors.ink,
      'center',
    );
    for (let i = 0; i < 2; i++) {
      const x = 290 + i * 850;
      drawFlashExtensionRectangle(ctx, api, x, 410, 650, 180, themeColors.panel, colors[i]);
      drawFlashExtensionText(
        ctx,
        api,
        'Warp ' + i + ' (teaching layout)',
        x + 325,
        465,
        30,
        colors[i],
        'center',
      );
      drawFlashExtensionText(
        ctx,
        api,
        qSplit
          ? 'Q' + i + ' output ' + (i ? other.u / other.l : T0.u / T0.l).toFixed(3)
          : 'K/V tile ' + i + ' partial state',
        x + 325,
        540,
        33,
        colors[i],
        'center',
      );
    }
    if (!qSplit) {
      drawFlashExtensionL(
        ctx,
        api,
        [
          {
            x: 615,
            y: 610,
          },
          {
            x: 615,
            y: 700,
          },
          {
            x: 960,
            y: 700,
          },
        ],
        themeColors.blue,
        4,
      );
      drawFlashExtensionL(
        ctx,
        api,
        [
          {
            x: 1465,
            y: 610,
          },
          {
            x: 1465,
            y: 700,
          },
          {
            x: 960,
            y: 700,
          },
        ],
        themeColors.cyan,
        4,
      );
      drawFlashExtensionEquation(
        ctx,
        api,
        'O=32.405\\quad\\text{after weighted merge}',
        960,
        810,
        40,
        themeColors.yellow,
        'center',
      );
    } else
      drawFlashExtensionText(
        ctx,
        api,
        'No cross-warp output merge for these owned Q rows',
        960,
        800,
        36,
        themeColors.green,
        'center',
      );
    drawFlashExtensionFooter(
      ctx,
      api,
      'Q0 scores [1,2,3]; Q1 scores [0,0,0]; both use V [10,20,40]. Other dependencies remain',
    );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('warp-ownership-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'warp-ownership',
  draw: drawWarpOwnership,
  cues: ['warp-ownership-beat-1', 'warp-ownership-beat-2', 'fa-split-q', 'warp-ownership-beat-3'],
};
