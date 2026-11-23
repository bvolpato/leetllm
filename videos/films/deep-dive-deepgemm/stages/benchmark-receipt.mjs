import { sampleDeepGemmChapter } from '../construction.mjs';
import { drawBox, drawEquation, drawSubtitle, drawText } from '../defaults.mjs';
export function drawBenchmarkReceipt(ctx, scene, state, api) {
  return api.focus.target('benchmark-receipt-construction', () => {
    const { C: themeColors } = api,
      modelState = sampleDeepGemmChapter('benchmark-receipt', state),
      { b: currentBeat, g: teaching2 } = modelState;
    const done = (beat, index) => teaching2(beat, index) >= 1;
    {
      drawSubtitle(ctx, api, 'April Mega MoE benchmark · average across eight ranks');
      if (currentBeat === 0) {
        const x = 440,
          scale = 9;
        drawText(ctx, api, 'Legacy', 180, 470, 33, themeColors.muted);
        drawText(ctx, api, 'Mega MoE', 180, 665, 33, themeColors.blue);
        api.rect(
          ctx,
          x,
          400,
          modelState.baseline * scale,
          105,
          themeColors.panel,
          themeColors.muted,
          4,
        );
        api.rect(
          ctx,
          x,
          595,
          modelState.candidate * scale * teaching2(0, 1),
          105,
          themeColors.blue,
          undefined,
          4,
        );
        if (done(0, 1)) drawText(ctx, api, '56.5 µs', 1050, 665, 43, themeColors.blue);
        if (done(0, 2))
          drawText(
            ctx,
            api,
            '1.96× speedup · implied baseline 110.74 µs',
            960,
            820,
            38,
            themeColors.yellow,
            'center',
          );
        if (done(0, 4))
          drawText(ctx, api, 'Time cut ≈ 49.0%', 960, 930, 47, themeColors.green, 'center');
      } else if (currentBeat === 1) {
        drawBox(ctx, api, '512 source tokens / rank', 150, 370, 700, 100, themeColors.blue, 34);
        drawBox(
          ctx,
          api,
          'Balanced 3,072 expert rows / rank',
          1030,
          370,
          740,
          100,
          themeColors.cyan,
          32,
        );
        drawEquation(ctx, api, '6\\cdot3072\\cdot4096\\cdot2048', 960, 625, 55);
        if (done(1, 0))
          drawText(
            ctx,
            api,
            'Reported duration 146.5 µs',
            960,
            760,
            38,
            themeColors.blue,
            'center',
          );
        if (done(1, 1))
          drawText(
            ctx,
            api,
            'Balanced work / duration ≈ 1,055 TFLOP/s',
            960,
            895,
            39,
            themeColors.green,
            'center',
          );
        drawText(
          ctx,
          api,
          'Bandwidth columns = estimated bytes ÷ elapsed time',
          960,
          965,
          28,
          themeColors.muted,
          'center',
        );
      } else {
        [
          ['Flash', 'H 4,096 · I 2,048', themeColors.blue],
          ['Pro', 'H 7,168 · I 3,072', themeColors.pink],
        ].forEach(([name, shape, color], i) => {
          drawBox(ctx, api, name, 170 + i * 850, 355, 740, 90, color, 38);
          drawText(ctx, api, shape, 540 + i * 850, 535, 34, color, 'center');
        });
        const skipped = teaching2(2, 2) > 0;
        drawBox(
          ctx,
          api,
          skipped ? 'Legacy import failed' : 'Legacy baseline dependency',
          170,
          650,
          740,
          110,
          skipped ? themeColors.pink : themeColors.muted,
          32,
        );
        drawBox(
          ctx,
          api,
          skipped ? 'Reference agreement untested' : 'Correctness comparison',
          1020,
          650,
          740,
          110,
          skipped ? themeColors.yellow : themeColors.muted,
          31,
        );
        if (teaching2(2, 1) > 0)
          drawText(
            ctx,
            api,
            'GPU SKU / clocks / topology / warmup: unknown in the receipt',
            960,
            910,
            30,
            themeColors.muted,
            'center',
          );
      }
    }
  });
}
export default {
  id: 'benchmark-receipt',
  draw: drawBenchmarkReceipt,
  cues: [
    'benchmark-receipt-b0',
    'dg-benchmark-receipt-0-0',
    'dg-benchmark-receipt-0-1',
    'dg-benchmark-receipt-0-2',
    'dg-benchmark-receipt-0-3',
    'dg-benchmark-receipt-0-4',
    'benchmark-receipt-b1',
    'dg-benchmark-receipt-1-0',
    'dg-benchmark-receipt-1-1',
    'dg-benchmark-receipt-1-2',
    'benchmark-receipt-b2',
    'dg-benchmark-receipt-2-0',
    'dg-benchmark-receipt-2-1',
    'dg-benchmark-receipt-2-2',
    'dg-benchmark-receipt-2-3',
    'dg-benchmark-receipt-2-4',
  ],
};
