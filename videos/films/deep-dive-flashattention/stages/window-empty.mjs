import { gradientFixture } from '../arithmetic.mjs';
import { decodeValues, sampleModel } from '../construction.mjs';
import {
  drawExtensionCell,
  drawExtensionEquation,
  drawExtensionFooter,
  drawExtensionText,
} from '../defaults.mjs';
export function drawWindowEmpty(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('window-empty', state),
      { b: currentBeat, p: progress } = modelState,
      teaching2 = gradientFixture();
    {
      const n = modelState.mask.length,
        k = modelState.mask[0].length;
      drawExtensionText(
        ctx,
        api,
        currentBeat === 2 ? 'Reverse case: L5 / S2' : 'Same case: L2 / S5 · left1 / right0',
        960,
        300,
        35,
        themeColors.yellow,
        'center',
      );
      modelState.mask.forEach((row, i) => {
        const y = 370 + i * (currentBeat === 2 ? 105 : 220);
        drawExtensionText(
          ctx,
          api,
          'i' + i + ' · center ' + (i + k - n),
          180,
          y + 40,
          26,
          themeColors.yellow,
        );
        row.forEach((v, j) =>
          drawExtensionCell(
            ctx,
            api,
            v ? decodeValues[j] : '×',
            540 + j * (1060 / k),
            y,
            1060 / k - 10,
            75,
            v ? themeColors.cyan : themeColors.muted,
          ),
        );
        const ready =
          currentBeat === 2 ? modelState.empty : i === 0 ? modelState.first : modelState.second;
        drawExtensionText(
          ctx,
          api,
          ready ? String(modelState.means[i]) : '?',
          1740,
          y + 45,
          34,
          ready ? themeColors.green : themeColors.muted,
          'center',
        );
      });
      if (currentBeat < 2) {
        drawExtensionEquation(ctx, api, String.raw`c_i=i+S-L,\quad j\in[c_i-1,c_i]`, 960, 900, 39);
        drawExtensionFooter(
          ctx,
          api,
          'Each query averages the values inside its window',
        );
      } else
        drawExtensionFooter(
          ctx,
          api,
          'Three empty rows → zero by documented convention · final rows retain one/two keys',
        );
    }
  });
}
export default {
  id: 'window-empty',
  draw: drawWindowEmpty,
  cues: [
    'fa-window-empty-0',
    'fa-window-empty-1',
    'fa-window-first',
    'fa-window-second',
    'fa-window-empty-2',
    'fa-reverse-zero',
  ],
};
