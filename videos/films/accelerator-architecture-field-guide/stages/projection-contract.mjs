import { projection } from '../arithmetic.mjs';
import { accEvent } from '../construction.mjs';
import {
  drawArrow,
  drawBar,
  drawCard,
  drawCenteredText,
  drawFooter,
  drawText,
} from '../defaults.mjs';
export function drawProjectionContract(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => accEvent(scene, state, name, beat),
    resultComplete = (name, beat) => ev(name, beat) === 1,
    B = (name, beat) => ev(name, beat) > 0;
  api.focus.target('projection-contract-mechanism', () => {
    const M = 8;
    if (currentBeat === 0) {
      drawCenteredText(
        ctx,
        api,
        'Same W · 4,096 × 11,008 · BF16 2 B/value',
        960,
        290,
        34,
        themeColors.yellow,
      );
      teaching.grid({
        x: 690,
        y: 390,
        width: 530,
        height: 370,
        rows: 4,
        columns: 6,
        fill: themeColors.panel,
        stroke: themeColors.yellow,
        fontSize: 26,
      });
      drawText(ctx, api, 'W', 955, 830, 44, themeColors.yellow, 'center');
      if (resultComplete('weights', 0))
        drawCenteredText(ctx, api, '86 MiB', 955, 910, 38, themeColors.yellow);
      drawCard(ctx, api, 'DECODE\n8 requests × 1 row', 110, 475, 450, 180, themeColors.blue, 33);
      drawCard(
        ctx,
        api,
        resultComplete('prefill', 0)
          ? 'PREFILL\n8 × 4,096 = 32,768 rows'
          : 'PREFILL\n8 prompts × 4,096 positions',
        1350,
        475,
        450,
        180,
        themeColors.cyan,
        31,
      );
    } else if (currentBeat === 1) {
      const bands = Math.ceil(4 * ev('pair', 1));
      drawCenteredText(ctx, api, 'One input row', 355, 318, 33, themeColors.blue);
      teaching.grid({
        x: 130,
        y: 390,
        width: 450,
        height: 85,
        rows: 1,
        columns: 4,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        highlights: Array.from({ length: bands }, (_, column) => ({
          row: 0,
          column,
          fill: '#224254',
          stroke: themeColors.blue,
        })),
      });
      drawCenteredText(ctx, api, 'One weight column', 955, 318, 33, themeColors.yellow);
      teaching.grid({
        x: 740,
        y: 355,
        width: 430,
        height: 242,
        rows: 4,
        columns: 4,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        highlights: Array.from({ length: bands }, (_, row) => ({
          row,
          column: 2,
          fill: '#4c421e',
          stroke: themeColors.yellow,
        })),
      });
      drawArrow(ctx, api, 600, 433, 710, 433, themeColors.blue);
      drawArrow(ctx, api, 1200, 433, 1320, 433, themeColors.cyan);
      drawCenteredText(ctx, api, 'One output element', 1535, 318, 33, themeColors.cyan);
      teaching.grid({
        x: 1360,
        y: 355,
        width: 350,
        height: 242,
        rows: 4,
        columns: 4,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        highlights: bands === 4 ? [{ row: 1, column: 2, fill: themeColors.cyan }] : [],
      });
      drawCenteredText(ctx, api, '4,096 paired features', 355, 555, 30, themeColors.muted);
      if (B('work', 1))
        drawCenteredText(ctx, api, 'F = 2 × M × K × N', 960, 710, 43, themeColors.yellow);
      if (B('bytes', 1)) {
        [
          ['X read', M * 4096 * 2, themeColors.blue],
          ['W read', 4096 * 11008 * 2, themeColors.yellow],
          ['Y written', M * 11008 * 2, themeColors.cyan],
        ].forEach(([name, bytes, col], i) => {
          drawText(ctx, api, name, 150 + i * 590, 850, 31, col);
          drawText(ctx, api, bytes.toLocaleString() + ' bytes', 150 + i * 590, 920, 29, col);
        });
      }
    } else {
      [
        ['DECODE', 8],
        ['PREFILL', 32768],
      ].forEach(([name, rows], i) => {
        const q = projection(rows),
          y = 385 + i * 280;
        drawText(
          ctx,
          api,
          name + ' · M = ' + rows.toLocaleString(),
          150,
          y,
          32,
          i ? themeColors.cyan : themeColors.blue,
        );
        drawBar(
          ctx,
          api,
          700,
          y - 30,
          1000,
          q.intensity,
          3000,
          i ? themeColors.cyan : themeColors.blue,
        );
        if (resultComplete('intensity', 2))
          drawText(
            ctx,
            api,
            q.intensity.toFixed(1) + ' FLOP/B',
            1700,
            y + 80,
            35,
            themeColors.yellow,
            'right',
          );
      });
    }
    drawFooter(ctx, api, 'Cold inputs   ·   read X and W once   ·   write Y once');
  });
}
export default {
  id: 'projection-contract',
  draw: drawProjectionContract,
  cues: [
    'ag-projection-contract-weights',
    'ag-projection-contract-prefill',
    'ag-projection-contract-decode',
    'ag-projection-contract-pair',
    'ag-projection-contract-work',
    'ag-projection-contract-bytes',
    'ag-projection-contract-intensity',
  ],
};
