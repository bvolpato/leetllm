import { drawArrow, drawBox, drawLine, drawMatrix, drawText, mark } from '../defaults.mjs';
export function drawMeasurementContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const paint = () => {
    drawText(
      ctx,
      api,
      'CPU benchmark · input placed before the timer starts',
      960,
      270,
      34,
      themeColors.yellow,
    );
    drawMatrix(ctx, api, [512, 64], 190, 410, {
      cw: 170,
      ch: 100,
      color: themeColors.blue,
      label: 'input shape · float32',
    });
    drawBox(ctx, api, 'Xᵀ @ (X − mean)', 750, 405, 650, 110, themeColors.cyan, 35);
    drawMatrix(ctx, api, [64, 64], 1450, 410, {
      cw: 150,
      ch: 100,
      color: themeColors.green,
      label: 'result shape',
    });
    drawArrow(ctx, api, 550, 460, 720, 460, themeColors.muted);
    if (currentBeat === 0) {
      drawBox(ctx, api, 'First call · wait for result', 185, 720, 650, 100, themeColors.blue);
      drawBox(ctx, api, 'Warm call · wait for result', 1050, 720, 680, 100, themeColors.green);
      drawText(ctx, api, 'Compare the two 64 × 64 results', 960, 935, 33, themeColors.yellow);
    } else if (currentBeat === 1) {
      const xs = [200, 650, 1100, 1550];
      ['trace / compile', 'dispatch', 'execute', 'wait all leaves'].forEach((s, i) =>
        drawBox(
          ctx,
          api,
          s,
          xs[i] - 50,
          670,
          350,
          90,
          i === 0 ? themeColors.yellow : themeColors.cyan,
        ),
      );
      drawLine(ctx, api, 150, 830, 1850, 830, themeColors.yellow, 3);
      drawText(ctx, api, 'cold completion interval', 1000, 905, 31, themeColors.yellow);
      drawLine(ctx, api, 600, 785, 1850, 785, themeColors.green, 3);
      drawText(ctx, api, 'warm synchronized per-call interval', 1160, 610, 30, themeColors.green);
      drawText(
        ctx,
        api,
        'Throughput = completed calls ÷ elapsed seconds',
        960,
        995,
        34,
        themeColors.ink,
      );
    } else {
      drawMatrix(ctx, api, ['shape', 'dtype', 'device'], 220, 690, {
        cw: 230,
        ch: 100,
        color: themeColors.blue,
        label: 'match both frameworks',
      });
      drawMatrix(ctx, api, ['transfer', 'data', 'checkpoint'], 1100, 690, {
        cw: 230,
        ch: 100,
        color: themeColors.yellow,
        label: 'declare included boundaries',
      });
      drawText(
        ctx,
        api,
        'To include the transfer, start both timers before device placement.',
        960,
        935,
        31,
        themeColors.muted,
      );
    }
  };
  mark(ctx, api, 'jx-measurement-contract-mechanism', paint);
}
export default {
  id: 'measurement-contract',
  draw: drawMeasurementContract,
  cues: ['jx-measurement-contract-b0', 'jx-measurement-contract-b1', 'jx-measurement-contract-b2'],
};
