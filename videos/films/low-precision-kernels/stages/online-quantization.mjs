import { clip01 } from '../encoding.mjs';
import { cueDone, sampleModel } from '../construction.mjs';
import { dot, labelText, line, rectangle } from '../defaults.mjs';
export function drawOnlineQuantization(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('online-quantization', state),
    currentBeat = modelState.step,
    progress2 = modelState.q;
  const ready = (name) => cueDone(state, 'lp-online-quantization-' + name);
  api.focus.target('lp-online-quantization-trace', () => {
    if (currentBeat === 0) {
      labelText(ctx, api, 'Reported DeepSeek-V3 grouping', 150, 300, 33);
      teaching.grid({
        x: 230,
        y: 365,
        width: 1430,
        height: 120,
        rows: 1,
        columns: 32,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        highlights: Array.from(
          {
            length: Math.floor(progress2 * 32),
          },
          (_, column) => ({
            row: 0,
            column,
            fill: themeColors.blue,
            stroke: themeColors.panel,
          }),
        ),
      });
      labelText(
        ctx,
        api,
        '1 × 128 activation group · four elements per visible cell',
        960,
        545,
        29,
        themeColors.blue,
        'center',
      );
      teaching.grid({
        x: 200,
        y: 625,
        width: 220,
        height: 220,
        rows: 8,
        columns: 8,
        fill: themeColors.panel,
        stroke: themeColors.pink,
      });
      labelText(ctx, api, 'W: 128 × 128', 310, 905, 25, themeColors.pink, 'center');
      labelText(ctx, api, '16 × 16 values/cell', 310, 960, 20, themeColors.muted, 'center');
      const tiles = Math.floor(progress2 * 4);
      for (let i = 0; i < 4; i++) {
        const x = 620 + (i % 2) * 570,
          y = 630 + Math.floor(i / 2) * 145;
        rectangle(ctx, api, x, y, 450, 95, i < tiles ? themeColors.cyan : themeColors.muted);
        labelText(
          ctx,
          api,
          'K ' + i * 128 + '…' + (i * 128 + 127),
          x + 225,
          y + 58,
          26,
          themeColors.ink,
          'center',
        );
      }
      labelText(
        ctx,
        api,
        ready('promote')
          ? 'Each 128-term partial → CUDA-core FP32 accumulation'
          : 'Internal partials build before promotion',
        1120,
        955,
        29,
        themeColors.yellow,
        'center',
      );
      labelText(
        ctx,
        api,
        'Reported H800 recipe · not a universal tensor-core interval',
        960,
        1015,
        27,
        themeColors.muted,
        'center',
      );
    } else {
      const names = ['BF16 read', 'quantize', 'FP8 write', 'MMA read'];
      names.forEach((name, i) => {
        const x = 150 + i * 440;
        rectangle(ctx, api, x, 385, 330, 115, i === 2 ? themeColors.pink : themeColors.blue);
        labelText(
          ctx,
          api,
          name,
          x + 165,
          455,
          30,
          i === 2 ? themeColors.pink : themeColors.blue,
          'center',
        );
        if (i) line(ctx, api, x - 110, 443, x, 443, themeColors.muted, 3);
        const k = clip01(progress2 * 4 - i);
        if (k > 0) dot(ctx, api, x + 30 + 270 * k, 550, themeColors.yellow, 11);
      });
      labelText(
        ctx,
        api,
        'Implemented reported path retains conversion traffic',
        960,
        660,
        32,
        themeColors.blue,
        'center',
      );
      for (let i = 0; i < 12; i++)
        line(ctx, api, 340 + i * 100, 805, 380 + i * 100, 805, themeColors.muted, 3);
      labelText(
        ctx,
        api,
        ready('future') ? 'Cast with TMA: proposed future optimization' : 'Separate future path',
        960,
        900,
        32,
        themeColors.yellow,
        'center',
      );
      labelText(
        ctx,
        api,
        'Pinned DeepGEMM leaves cast/transposition to caller or preceding fusion',
        960,
        1020,
        26,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'online-quantization',
  draw: drawOnlineQuantization,
  cues: [
    'lp-online-quantization-build-0',
    'lp-online-quantization-promote',
    'lp-online-quantization-build-1',
    'lp-online-quantization-future',
  ],
};
