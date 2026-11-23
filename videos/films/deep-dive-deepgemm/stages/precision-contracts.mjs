import { sampleDeepGemmChapter } from '../construction.mjs';
import { drawBox, drawLink, drawSubtitle, drawText } from '../defaults.mjs';
export function drawPrecisionContracts(ctx, scene, state, api) {
  return api.focus.target('precision-contracts-construction', () => {
    const { C: themeColors } = api,
      modelState = sampleDeepGemmChapter('precision-contracts', state),
      { b: currentBeat, g: teaching2 } = modelState;
    {
      drawSubtitle(ctx, api, 'A scale belongs to a block of operand values');
      const formats = [
        ['E4M3', 1, 4, 3, themeColors.blue],
        ['E2M1', 1, 2, 1, themeColors.pink],
      ];
      formats.forEach(([name, sign, exponent, mantissa, color], r) => {
        const fields = [
          ...Array(sign).fill('S'),
          ...Array(exponent).fill('E'),
          ...Array(mantissa).fill('M'),
        ];
        drawText(ctx, api, name, 150, 390 + r * 150, 36, color);
        fields.forEach((field, i) =>
          drawBox(
            ctx,
            api,
            field,
            420 + i * 90,
            330 + r * 150,
            75,
            82,
            field === 'S' ? themeColors.yellow : field === 'E' ? color : themeColors.cyan,
            31,
          ),
        );
      });
      if (currentBeat === 0) {
        drawText(
          ctx,
          api,
          'Low-bit operand → product → FP32 accumulator',
          960,
          745,
          38,
          themeColors.cyan,
          'center',
        );
        if (teaching2(0, 4) > 0)
          drawBox(
            ctx,
            api,
            'BF16 output is another conversion boundary',
            480,
            855,
            960,
            90,
            themeColors.green,
            31,
          );
      } else if (currentBeat === 1) {
        [
          ['SM90 · FP32 scales', 'K groups of 128', themeColors.blue],
          ['SM100 · packed UE8M0', '4 scale bytes per int32 · K groups of 32', themeColors.pink],
        ].forEach(([name, detail, color], i) => {
          drawBox(ctx, api, name, 160 + i * 850, 680, 750, 85, color, 30);
          drawText(ctx, api, detail, 535 + i * 850, 850, 27, color, 'center');
        });
        if (teaching2(1, 3) > 0)
          for (let i = 0; i < 4; i++)
            drawBox(ctx, api, 's' + i, 1040 + i * 155, 900, 125, 65, themeColors.pink, 26);
      } else {
        const operand = drawBox(
            ctx,
            api,
            'Same logical tensor shape',
            180,
            700,
            620,
            100,
            themeColors.blue,
            34,
          ),
          reader = drawBox(
            ctx,
            api,
            'Architecture + scale recipe',
            1100,
            700,
            650,
            100,
            themeColors.pink,
            33,
          );
        drawLink(ctx, api, operand, reader, teaching2(2, 1), themeColors.yellow);
        drawText(
          ctx,
          api,
          teaching2(2, 3) > 0
            ? 'Reject incompatible format before tile tuning'
            : 'Shape equality leaves representation unchecked',
          960,
          920,
          34,
          teaching2(2, 3) > 0 ? themeColors.pink : themeColors.muted,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'precision-contracts',
  draw: drawPrecisionContracts,
  cues: [
    'precision-contracts-b0',
    'dg-precision-contracts-0-0',
    'dg-precision-contracts-0-1',
    'dg-precision-contracts-0-2',
    'dg-precision-contracts-0-3',
    'dg-precision-contracts-0-4',
    'precision-contracts-b1',
    'dg-precision-contracts-1-0',
    'dg-precision-contracts-1-1',
    'dg-precision-contracts-1-2',
    'dg-precision-contracts-1-3',
    'dg-precision-contracts-1-4',
    'precision-contracts-b2',
    'dg-precision-contracts-2-0',
    'dg-precision-contracts-2-1',
    'dg-precision-contracts-2-2',
    'dg-precision-contracts-2-3',
    'dg-precision-contracts-2-4',
  ],
};
