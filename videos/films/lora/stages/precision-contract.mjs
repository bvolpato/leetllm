import { point } from '../geometry.mjs';
import { text, rect, arrow } from '../defaults.mjs';
export function drawPrecisionContract(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  ctx.save();
  {
    api.focus.target('precision-contract-mechanism', () => {
      const promoted = api.focus.progress('precision-promote', stage(0, 0.4, 0.8));
      const trainer = api.focus.progress('precision-trainer', stage(1, 0.3, 0.7));
      const temp = api.focus.progress('precision-temporary', stage(2, 0.15, 0.6));
      text(ctx, api, 'FOUR INDEPENDENT PRECISION CHOICES', 190, 285, 31, themeColors.muted);
      const rows = [
        ['base storage', '4-bit packed (quantized path)', themeColors.blue],
        ['base computation', 'BF16 requested separately', themeColors.cyan],
        [
          'adapter factors',
          beat >= 1 && trainer >= 0.999
            ? 'TRL quantized path: BF16'
            : promoted >= 0.999
              ? 'PEFT default promotion: FP32'
              : 'BF16 before default promotion',
          themeColors.yellow,
        ],
        ['optimizer state', 'inspect moments and master copies', themeColors.pink],
      ];
      for (const [i, [label, value, color]] of rows.entries()) {
        const y = 390 + i * 130;
        text(ctx, api, label, 190, y, 32, color);
        rect(ctx, api, 660, y - 45, 1010, 75, themeColors.panel, color, 8);
        text(ctx, api, value, 700, y + 5, 31, color);
      }
      if (beat === 0 && promoted >= 0.999)
        text(
          ctx,
          api,
          'Pinned CPU check: BF16 base / FP32 factors; promotion off retains BF16.',
          190,
          995,
          29,
          themeColors.muted,
        );
      if (beat === 1 && trainer >= 0.999)
        text(
          ctx,
          api,
          'TRL 1.17.1 quantized-model cast excludes the DoRA magnitude vector.',
          190,
          995,
          29,
          themeColors.muted,
        );
      if (beat === 2) {
        const y = 910;
        rect(ctx, api, 660, y, 250, 60, '#79aaff30', themeColors.blue);
        text(ctx, api, 'packed W', 785, y + 41, 28, themeColors.blue, 'center');
        if (temp > 0) {
          arrow(ctx, api, point(940, y + 30), point(1080, y + 30), themeColors.cyan, 5);
          rect(ctx, api, 1110, y - 10, 560 * temp, 90, '#63deec30', themeColors.cyan, 4);
          if (temp >= 0.999)
            text(ctx, api, 'dequantized temporary', 1385, y + 45, 28, themeColors.cyan, 'center');
        }
        text(
          ctx,
          api,
          'bnb 0.50.2 standard four-bit input-gradient path',
          190,
          1015,
          27,
          themeColors.muted,
        );
      }
    });
  }
  ctx.restore();
}
export default {
  id: 'precision-contract',
  draw: drawPrecisionContract,
  cues: [
    'precision-contract-1',
    'precision-promote',
    'precision-contract-2',
    'precision-trainer',
    'precision-contract-3',
    'precision-temporary',
  ],
};
