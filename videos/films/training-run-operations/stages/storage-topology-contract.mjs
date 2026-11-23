import { clamp, motion } from '../arithmetic.mjs';
import { trainingCue, trainingStarted } from '../construction.mjs';
import { drawBox, drawCell, drawFooter, drawRow, drawText } from '../defaults.mjs';
import assert from 'node:assert/strict';
export function drawStorageTopologyContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    q = motion(progress);
  api.focus.target('storage-topology-contract-mechanism', () => {
    if (beat === 0) {
      drawText(
        ctx,
        api,
        '70B parameters · minimum full host ledger',
        960,
        285,
        38,
        themeColors.blue,
        'center',
      );
      const parametersB = 70,
        weightGB = parametersB * 2,
        momentGB = parametersB * 4,
        totalGB = weightGB + 2 * momentGB;
      assert.equal(totalGB, 700);
      let x = 210;
      for (const [v, label, color] of [
        [weightGB, 'BF16 weights', themeColors.blue],
        [momentGB, 'FP32 moment 1', themeColors.cyan],
        [momentGB, 'FP32 moment 2', themeColors.yellow],
      ]) {
        const width = v * 2.1;
        drawBox(ctx, api, x, 390, width, 290, color);
        drawText(ctx, api, label, x + width / 2, 465, width < 400 ? 28 : 32, color, 'center');
        drawText(ctx, api, v + ' GB', x + width / 2, 575, 45, color, 'center');
        x += width;
      }
      if (trainingStarted(state, 'storage-topology-contract-step-1', progress > 0.6))
        drawText(
          ctx,
          api,
          '≥ ' + totalGB + ' decimal GB',
          960,
          840,
          55,
          themeColors.yellow,
          'center',
        );
      drawFooter(ctx, api, 'Add master weights and buffers to size the destination host.');
    } else {
      const values = Array.from(
          {
            length: 8,
          },
          (_, i) => i + 8,
        ),
        loaded =
          beat === 2 ? trainingCue(state, 'storage-topology-contract-step-3', clamp(q * 2)) : q;
      drawText(
        ctx,
        api,
        'Supplied source tensor · global coordinates 8…15',
        960,
        285,
        36,
        themeColors.blue,
        'center',
      );
      drawRow(ctx, api, values, 245, 380, 170, themeColors.blue);
      drawText(
        ctx,
        api,
        'Destination requests logical slice [10, 12)',
        960,
        beat === 1 ? 950 : 600,
        36,
        themeColors.cyan,
        'center',
      );
      if (beat === 1) {
        values.forEach((v, i) => {
          if (v >= 10 && v < 12) {
            const dx = 790 + (v - 10) * 190,
              sy = 455,
              dy = 680,
              xx = 245 + i * 179 + (dx - (245 + i * 179)) * loaded,
              yy = sy + (dy - sy) * loaded;
            drawCell(ctx, api, v, xx, yy, 170, 85, themeColors.cyan, 36);
          }
        });
        drawText(
          ctx,
          api,
          'Metadata selects intersections by tensor identity and coordinates',
          960,
          870,
          30,
          themeColors.yellow,
          'center',
        );
      } else {
        drawText(
          ctx,
          api,
          'Pinned PyTorch 2.14 filesystem reader',
          960,
          650,
          32,
          themeColors.yellow,
          'center',
        );
        const width = 8 * 150,
          xx = 350;
        drawBox(ctx, api, xx, 715, width, 115, themeColors.muted);
        if (loaded > 0)
          api.rect(ctx, xx + 4, 719, (width - 8) * loaded, 107, themeColors.blue, undefined, 0);
        drawText(
          ctx,
          api,
          loaded === 1
            ? '8 values in CPU memory'
            : loaded > 0
              ? 'Loading the source tensor'
              : 'How many values enter CPU memory?',
          950,
          790,
          32,
          loaded > 0.7 ? themeColors.bg : themeColors.ink,
          'center',
        );
        if (trainingStarted(state, 'storage-narrow', progress > 0.35)) {
          drawCell(ctx, api, 10, 775, 870, 170, 75, themeColors.cyan, 32);
          drawCell(ctx, api, 11, 970, 870, 170, 75, themeColors.cyan, 32);
        }
      }
      if (beat === 1)
        drawFooter(ctx, api, 'Copy the coordinates shared by the saved and requested ranges.');
    }
  });
}
export default {
  id: 'storage-topology-contract',
  draw: drawStorageTopologyContract,
  cues: [
    'storage-topology-contract-step-1',
    'storage-weight',
    'storage-moment',
    'storage-topology-contract-step-2',
    'storage-metadata',
    'storage-topology-contract-step-3',
    'storage-narrow',
  ],
};
