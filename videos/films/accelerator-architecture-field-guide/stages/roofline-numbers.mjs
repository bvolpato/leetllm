import { projection } from '../arithmetic.mjs';
import { accEvent } from '../construction.mjs';
import { drawCenteredText, drawFooter, drawText } from '../defaults.mjs';
export function drawRooflineNumbers(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => accEvent(scene, state, name, beat),
    resultComplete = (name, beat) => ev(name, beat) === 1,
    B = (name, beat) => ev(name, beat) > 0;
  api.focus.target('roofline-numbers-mechanism', () => {
    const doubled = currentBeat > 1 || (currentBeat === 1 && B('double', 1)),
      compute = 200e12 * (1 + (doubled ? ev('double', 1) : 0));
    drawCenteredText(
      ctx,
      api,
      'Hypothetical ceilings · ' + (compute / 1e12).toFixed(0) + ' TFLOP/s · 1 TB/s',
      960,
      285,
      33,
      themeColors.yellow,
    );
    [32768, 8].forEach((rows, i) => {
      const m = projection(rows, compute),
        max = i ? 0.1 : 16,
        x = 600,
        w = 1100,
        y = 410 + i * 300;
      drawText(
        ctx,
        api,
        i ? 'DECODE · axis 0–0.1 ms' : 'PREFILL · axis 0–16 ms',
        140,
        y - 20,
        29,
        i ? themeColors.pink : themeColors.cyan,
      );
      drawText(ctx, api, 'Compute   F / P', 140, y + 65, 30, themeColors.cyan);
      drawText(ctx, api, 'Transfer   Q / B', 140, y + 155, 30, themeColors.pink);
      api.rect(ctx, x, y, (w * m.computeMs) / max, 65, themeColors.cyan, undefined, 0);
      api.rect(ctx, x, y + 90, (w * m.memoryMs) / max, 65, themeColors.pink, undefined, 0);
      if (currentBeat > 0) {
        drawText(
          ctx,
          api,
          m.computeMs.toFixed(3) + ' ms',
          1750,
          y + 45,
          29,
          themeColors.cyan,
          'right',
        );
        drawText(
          ctx,
          api,
          m.memoryMs.toFixed(3) + ' ms',
          1750,
          y + 135,
          29,
          themeColors.pink,
          'right',
        );
      }
      if (resultComplete('result', 1) || currentBeat > 1)
        drawCenteredText(
          ctx,
          api,
          'max = ' + m.floorMs.toFixed(3) + ' ms',
          1130,
          y + 225,
          33,
          themeColors.yellow,
        );
    });
    drawFooter(ctx, api, 'Separate linear scales    ·    perfect overlap    ·    one projection');
  });
}
export default {
  id: 'roofline-numbers',
  draw: drawRooflineNumbers,
  cues: [
    'ag-roofline-numbers-rates',
    'ag-roofline-numbers-divide',
    'ag-roofline-numbers-prefill',
    'ag-roofline-numbers-decode',
    'ag-roofline-numbers-double',
    'ag-roofline-numbers-result',
    'ag-roofline-numbers-scales',
  ],
};
