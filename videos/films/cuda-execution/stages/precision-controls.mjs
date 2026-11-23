import { precisionFailureTraces, roundedFormat } from '../arithmetic.mjs';
import { drawAddedArrow, drawAddedNote, drawAddedP, drawAddedText } from '../defaults.mjs';
export function drawPrecisionControls(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawAddedP(ctx, api, id) === 1;
  api.focus.target('precision-controls-construction', () => {
    if (currentBeat === 0) {
      drawAddedText(
        ctx,
        api,
        'One backward pass   /   loss scale 128',
        160,
        285,
        34,
        themeColors.cyan,
      );
      const gradient = 2 ** -25,
        scale = 128,
        p = drawAddedP(ctx, api, 'amp-unscale');
      const stages = [
        ['gradient', gradient],
        ['× 128', gradient * 128],
        ['FP16 stored', roundedFormat(gradient * 128, 10, -14, 15)],
        ['unscale in FP32', gradient],
      ];
      stages.forEach(([name, value], i) => {
        const x = 180 + i * 425;
        drawAddedText(ctx, api, name, x, 440, 31, i === 1 ? themeColors.yellow : themeColors.muted);
        if (p > (i + 1) / 6)
          drawAddedText(
            ctx,
            api,
            value.toExponential(3),
            x,
            570,
            33,
            i === 3 ? themeColors.green : themeColors.cyan,
            'left',
            true,
          );
        if (i < 3) drawAddedArrow(ctx, api, x + 285, 540, x + 360, 540, themeColors.blue);
      });
      drawAddedText(ctx, api, 'Direct FP16 storage', 180, 790, 31, themeColors.muted);
      drawAddedText(
        ctx,
        api,
        '2⁻²⁵ → ' + roundedFormat(gradient, 10, -14, 15),
        820,
        790,
        41,
        themeColors.pink,
      );
      if (done('amp-unscale'))
        drawAddedText(
          ctx,
          api,
          'Unscale before the optimizer update',
          960,
          935,
          39,
          themeColors.green,
          'center',
        );
      drawAddedNote(
        ctx,
        api,
        'Unscale into FP32 gradients before the optimizer step.',
      );
    } else if (currentBeat === 1) {
      drawAddedText(
        ctx,
        api,
        'Two calculations produced NaN in FP16',
        160,
        285,
        30,
        themeColors.cyan,
      );
      const p = drawAddedP(ctx, api, 'amp-diagnosis'),
        traces = precisionFailureTraces();
      drawAddedText(ctx, api, 'Overflow route', 190, 400, 33, themeColors.blue);
      drawAddedText(ctx, api, 'Underflow route', 1040, 400, 33, themeColors.cyan);
      drawAddedText(ctx, api, '300 × 300 = 90,000', 190, 495, 34, themeColors.ink);
      drawAddedText(ctx, api, 'tiny = 2⁻²⁵', 1040, 495, 34, themeColors.ink);
      if (p > 0.15) {
        drawAddedArrow(ctx, api, 450, 530, 450, 575, themeColors.yellow);
        drawAddedArrow(ctx, api, 1310, 530, 1310, 575, themeColors.yellow);
        drawAddedText(ctx, api, 'FP16 product → infinity', 190, 635, 31, themeColors.yellow);
        drawAddedText(
          ctx,
          api,
          'FP16 tiny → ' + traces.underflow.stored,
          1040,
          635,
          31,
          themeColors.yellow,
        );
      }
      if (p > 0.55) {
        drawAddedText(ctx, api, '∞ − ∞ → NaN', 190, 755, 39, themeColors.pink);
        drawAddedText(ctx, api, '0 ÷ 0 → NaN', 1040, 755, 39, themeColors.pink);
      }
      if (done('amp-diagnosis')) {
        drawAddedText(
          ctx,
          api,
          'FP32 difference → ' + traces.overflow.fp32,
          190,
          875,
          34,
          themeColors.green,
        );
        drawAddedText(
          ctx,
          api,
          'FP32 ratio → ' + traces.underflow.fp32,
          1040,
          875,
          34,
          themeColors.green,
        );
      }
      drawAddedNote(
        ctx,
        api,
        'FP16 example with subnormal values and round-to-nearest-even.',
      );
    } else {
      const input = Math.fround(1.0001);
      const reduced = roundedFormat(input, 10, -126, 127);
      const switched = done('tf32-storage');
      const color = [themeColors.blue, themeColors.yellow, themeColors.cyan];
      drawAddedText(ctx, api, 'One output   /   only nonzero term is weight × 1', 160, 280, 38, themeColors.ink);
      drawAddedText(ctx, api, 'Example with nearest-even input rounding', 160, 353, 29, themeColors.muted);
      ['Input tensor', 'Multiply input', 'Output tensor'].forEach((label, i) => {
        const x = 180 + 555 * i;
        drawAddedText(ctx, api, label, x, 458, 35, color[i]);
        // Keep sign and exponent in both modes. TF32 rounds the fraction to ten bits.
        for (let bit = 0; bit < 32; bit++) {
          const active = i !== 1 || !switched || bit < 19;
          api.rect(ctx, x + (bit % 16) * 24, 510 + Math.floor(bit / 16) * 47,
            20, 35, active ? color[i] : themeColors.panel, color[i], 0);
        }
        const value = i === 0 || !switched ? input : reduced;
        drawAddedText(ctx, api, value === 1 ? '1' : '≈ ' + value.toFixed(7), x, 688, 35, color[i], 'left', true);
        const detail = ['4 bytes', switched ? 'TF32 inputs' : 'IEEE FP32 inputs', '4 bytes'][i];
        drawAddedText(ctx, api, detail, x, 775, 31, themeColors.muted);
        if (i < 2) drawAddedArrow(ctx, api, x + 405, 548, x + 502, 548, themeColors.muted);
      });
      drawAddedText(ctx, api, 'FP32 accumulation', 735, 849, 30, themeColors.muted);
      drawAddedNote(ctx, api, 'A million stored float32 values occupy 4,000,000 bytes in either mode.');
    }
  });
}
export default {
  id: 'precision-controls',
  draw: drawPrecisionControls,
  cues: ['amp-unscale', 'amp-diagnosis', 'tf32-storage'],
};
