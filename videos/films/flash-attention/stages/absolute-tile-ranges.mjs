import { flashExtensionFrame } from '../model.mjs';
import {
  drawFlashExtensionFooter,
  drawFlashExtensionNum,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawAbsoluteTileRanges(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('absolute-tile-ranges', state),
    currentBeat = f.beat,
    progress = f.progress,
    colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
  const paint = () => {
    if (currentBeat < 2) {
      let counts = {
        past: 0,
        boundary: 0,
        future: 0,
      };
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++) {
          const k = j < i ? 'past' : j === i ? 'boundary' : 'future';
          counts[k]++;
          drawFlashExtensionRectangle(
            ctx,
            api,
            300 + j * 125,
            355 + i * 125,
            105,
            105,
            k === 'past'
              ? themeColors.cyan + '60'
              : k === 'boundary'
                ? themeColors.yellow + '70'
                : themeColors.panel,
            colors[k === 'past' ? 1 : k === 'boundary' ? 2 : 0],
          );
          drawFlashExtensionText(
            ctx,
            api,
            k === 'future' ? '×' : k === 'boundary' ? '△' : '✓',
            352 + j * 125,
            423 + i * 125,
            36,
            k === 'future' ? themeColors.muted : themeColors.ink,
            'center',
          );
        }
      drawFlashExtensionNum(ctx, api, 'Computed / total', '10 / 16', 420);
      drawFlashExtensionNum(ctx, api, 'Future skipped', '6 / 16', 630, themeColors.pink);
    } else {
      const q = api.teaching.axes({
          x: 300,
          y: 790,
          width: 1280,
          height: 1,
          xDomain: [0, 320],
          yDomain: [0, 1],
          xTicks: [0, 64, 128, 192, 256, 320],
          yTicks: [],
          xLabel: 'absolute token position',
          yLabel: '',
        }),
        ranges = [
          ['Q128..255', 128, 256, themeColors.yellow],
          ['K0..127', 0, 128, themeColors.cyan],
          ['K128..191', 128, 192, themeColors.blue],
          ['K256..319', 256, 320, themeColors.pink],
        ];
      ranges.forEach(([name, start, end, color], i) => {
        const x = q.point(start, 0).x,
          w = q.point(end, 0).x - x,
          y = 340 + i * 115;
        drawFlashExtensionRectangle(ctx, api, x, y, w, 62, color);
        drawFlashExtensionText(ctx, api, name, 175, y + 42, 26, color, 'center');
      });
      drawFlashExtensionText(ctx, api, 'past', 556, 925, 32, themeColors.cyan, 'center');
      drawFlashExtensionText(ctx, api, 'boundary', 940, 925, 32, themeColors.blue, 'center');
      drawFlashExtensionText(ctx, api, 'future', 1452, 925, 32, themeColors.pink, 'center');
    }
    drawFlashExtensionFooter(
      ctx,
      api,
      'Compare the first and last absolute positions in each tile',
    );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('absolute-tile-ranges-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'absolute-tile-ranges',
  draw: drawAbsoluteTileRanges,
  cues: [
    'absolute-tile-ranges-beat-1',
    'fa-tile-count',
    'absolute-tile-ranges-beat-2',
    'absolute-tile-ranges-beat-3',
  ],
};
