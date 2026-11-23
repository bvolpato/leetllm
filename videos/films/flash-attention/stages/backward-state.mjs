import { attentionInventory, flashExtensionFrame } from '../model.mjs';
import {
  drawFlashExtensionL,
  drawFlashExtensionNum,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawBackwardState(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('backward-state', state),
    currentBeat = f.beat,
    progress = f.progress;
  const paint = () => {
    const inv = attentionInventory(8, 32, 8192);
    drawFlashExtensionText(
      ctx,
      api,
      'The same batch / head / sequence configuration',
      960,
      290,
      36,
      themeColors.ink,
      'center',
    );
    drawFlashExtensionRectangle(ctx, api, 270, 430, 1050, 220, themeColors.blue);
    drawFlashExtensionText(ctx, api, 'Saved P: 32 GiB', 795, 540, 46, themeColors.bg, 'center');
    drawFlashExtensionL(
      ctx,
      api,
      [
        {
          x: 270,
          y: 720,
        },
        {
          x: 1320,
          y: 720,
        },
      ],
      themeColors.cyan,
      9,
    );
    drawFlashExtensionText(
      ctx,
      api,
      'FP32 LSE: 8 MiB (schematic thickness)',
      795,
      790,
      32,
      themeColors.cyan,
      'center',
    );
    drawFlashExtensionNum(
      ctx,
      api,
      'Array-only ratio',
      (inv.score / inv.lse).toLocaleString() + '×',
      420,
      themeColors.yellow,
    );
    drawFlashExtensionNum(ctx, api, 'P write + read', '64 GiB', 650, themeColors.pink);
    drawFlashExtensionText(
      ctx,
      api,
      'Q / K / V references and saved O remain',
      960,
      910,
      35,
      themeColors.ink,
      'center',
    );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('backward-state-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'backward-state',
  draw: drawBackwardState,
  cues: [
    'backward-state-beat-1',
    'backward-state-beat-2',
    'fa-state-ratio',
    'backward-state-beat-3',
  ],
};
