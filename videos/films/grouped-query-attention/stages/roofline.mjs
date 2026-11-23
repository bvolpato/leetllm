import { chapterModel } from '../construction.mjs';
import { chapterEquation, chapterText, grid, note, operation } from '../defaults.mjs';
export function drawRoofline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('roofline', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    if (currentBeat < 2) {
      chapterText(
        ctx,
        api,
        '64 distinct query rows · 8 stored histories',
        960,
        280,
        37,
        themeColors.cyan,
      );
      grid(ctx, api, 240, 370, 8, 8, 48, (r, c) =>
        r * 8 + c < Math.ceil(64 * progress) || currentBeat > 0
          ? themeColors.blue
          : themeColors.panel,
      );
      chapterText(ctx, api, 'query heads', 420, 825, 29, themeColors.blue);
      grid(ctx, api, 810, 400, 1, 8, 56, () => themeColors.green);
      grid(ctx, api, 810, 525, 1, 8, 56, () => themeColors.pink);
      chapterText(ctx, api, 'K', 745, 440, 36, themeColors.green);
      chapterText(ctx, api, 'V', 745, 565, 36, themeColors.pink);
      operation(ctx, api, 'roofline', () =>
        chapterEquation(
          ctx,
          api,
          currentBeat === 0
            ? String.raw`QK^\top+AV:\quad4BH_qSd`
            : String.raw`I=\frac{4BH_qSd}{2BH_{kv}SdP}=\frac2P\frac{H_q}{H_{kv}}`,
          1120,
          740,
          currentBeat === 0 ? 43 : 37,
          themeColors.yellow,
        ),
      );
      chapterText(
        ctx,
        api,
        currentBeat === 0
          ? 'Two matrix products retain all query heads'
          : 'B = 1 · S = 3 · d = 4 · P = 2 bytes',
        1100,
        850,
        29,
        themeColors.muted,
      );
      if (currentBeat === 1)
        chapterText(
          ctx,
          api,
          `${m.flops} FLOPs / ${m.readBytes} B = 8 FLOPs/B`,
          1100,
          930,
          35,
          themeColors.yellow,
        );
    } else {
      chapterText(
        ctx,
        api,
        'Ideal cache-read intensity against a dense hardware ceiling',
        960,
        275,
        35,
        themeColors.cyan,
      );
      const x = 280,
        y = 840,
        w = 1320,
        h = 420;
      api.line(ctx, x, y, x + w, y, themeColors.muted, 2);
      api.line(ctx, x, y, x, y - h, themeColors.muted, 2);
      const sx = (v) => x + (Math.log2(v) / 9) * w,
        sy = (v) => y - (h * v) / 989.5;
      const points = [1, 8, 64, 295.373, 512].map((v) => ({
        x: sx(v),
        y: sy(Math.min(989.5, 3.35 * v)),
      }));
      api.path(ctx, points, {
        color: themeColors.blue,
        width: 5,
      });
      [1, 8, 64].forEach((v, i) => {
        api.circle(ctx, sx(v), sy(3.35 * v), 8, themeColors.yellow, themeColors.yellow, 1);
        chapterText(
          ctx,
          api,
          ['MHA 1', 'GQA-8 8', 'MQA 64'][i],
          sx(v),
          y + 65,
          27,
          themeColors.yellow,
        );
      });
      operation(ctx, api, 'roofline', () =>
        chapterText(
          ctx,
          api,
          `ridge ≈ ${m.ridge.toFixed(1)} FLOPs/B`,
          1240,
          385,
          37,
          themeColors.yellow,
        ),
      );
      chapterText(ctx, api, 'dense rate ceiling · TFLOPs/s', 540, 345, 28, themeColors.blue);
      note(
        ctx,
        api,
        'Ideal single-read model · measure actual traffic, kernels and service latency',
      );
    }
  }
}
export default {
  id: 'roofline',
  draw: drawRoofline,
  cues: ['roofline-0', 'roofline-1', 'roofline-2'],
};
