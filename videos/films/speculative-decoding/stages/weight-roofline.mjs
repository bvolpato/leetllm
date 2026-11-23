import { weightWorksheet } from '../arithmetic.mjs';
import { completedCue } from '../construction.mjs';
import {
  drawConstructionsBox,
  drawConstructionsCenter,
  drawConstructionsLine,
  drawConstructionsText,
} from '../defaults.mjs';
export function drawWeightRoofline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    done = (beat, cue) => currentBeat > beat || (currentBeat === beat && completedCue(state, cue)),
    cp = (cue) => {
      const v = state.cues?.[cue];
      return v ? (v.phase === 'after' ? 1 : v.phase === 'before' ? 0 : v.progress) : progress2;
    };
  api.focus.target('sd-weight-roofline-mechanism', () => {
    const f = weightWorksheet();
    if (currentBeat === 0) {
      drawConstructionsCenter(
        ctx,
        api,
        '30 billion active BF16 weights × 2 bytes · simplified matrix-only worksheet',
        245,
      );
      drawConstructionsText(
        ctx,
        api,
        'Resident HBM weights · 12 accounting chunks × 5 GB',
        960,
        335,
        31,
        themeColors.blue,
        'center',
      );
      const progress = cp('sd-weight-bytes'),
        count = Math.min(12, Math.floor(progress * 12)),
        fraction = progress * 12 - count;
      for (let i = 0; i < 12; i++) {
        const x = 170 + i * 130;
        drawConstructionsBox(ctx, api, 'W' + (i + 1), x, 395, 110, themeColors.blue, 75);
        drawConstructionsText(ctx, api, '5 GB', x + 55, 525, 24, themeColors.muted, 'center');
        if (i === count && count < 12 && progress > 0) {
          drawConstructionsBox(
            ctx,
            api,
            'W' + (i + 1),
            x,
            580 + fraction * 140,
            110,
            themeColors.cyan,
            70,
          );
          drawConstructionsText(
            ctx,
            api,
            'read copy',
            x + 55,
            560 + fraction * 140,
            22,
            themeColors.cyan,
            'center',
          );
        }
      }
      drawConstructionsText(
        ctx,
        api,
        'Chunks serviced: ' + count + ' / 12',
        960,
        835,
        32,
        themeColors.cyan,
        'center',
      );
      api.rect(ctx, 200, 890, 1440, 42, themeColors.panel, themeColors.muted, 3);
      if (count > 0) api.rect(ctx, 200, 890, (1440 * count) / 12, 42, themeColors.blue);
      drawConstructionsCenter(
        ctx,
        api,
        'Serviced bytes: ' + count * 5 + ' GB · completed matrix work: ' + count * 5 + ' GFLOPs',
        1010,
        themeColors.blue,
        32,
      );
    } else if (currentBeat === 1) {
      drawConstructionsCenter(
        ctx,
        api,
        'Same worksheet · both resource floors use one 0–20 ms scale',
        245,
      );
      drawConstructionsText(
        ctx,
        api,
        '60 GB ÷ 3.35 TB/s',
        960,
        345,
        32,
        themeColors.blue,
        'center',
      );
      drawConstructionsText(ctx, api, 'Memory', 180, 515, 31, themeColors.blue);
      drawConstructionsText(ctx, api, 'Dense compute', 180, 735, 31, themeColors.cyan);
      drawConstructionsLine(ctx, api, 480, 850, 1720, 850, themeColors.muted, 3);
      for (const v of [0, 5, 10, 15, 20]) {
        const x = 480 + (v / 20) * 1240;
        drawConstructionsLine(ctx, api, x, 835, x, 870, themeColors.muted, 2);
        drawConstructionsText(ctx, api, v + ' ms', x, 920, 27, themeColors.muted, 'center');
      }
      if (done(1, 'sd-roof-floor')) {
        api.rect(ctx, 480, 465, (f.memoryMs / 20) * 1240, 75, themeColors.blue);
        api.rect(ctx, 480, 685, (f.computeMs / 20) * 1240, 75, themeColors.cyan);
        drawConstructionsText(
          ctx,
          api,
          f.memoryMs.toFixed(2) + ' ms',
          480 + (f.memoryMs / 20) * 1240,
          430,
          35,
          themeColors.blue,
          'right',
        );
        drawConstructionsText(
          ctx,
          api,
          f.computeMs.toFixed(3) + ' ms',
          675,
          735,
          35,
          themeColors.cyan,
        );
        const edge = 480 + (f.memoryMs / 20) * 1240;
        drawConstructionsLine(ctx, api, edge, 455, edge, 830, themeColors.yellow, 3);
      } else
        drawConstructionsText(
          ctx,
          api,
          '60 GFLOPs ÷ 989.5 TFLOP/s dense peak',
          960,
          635,
          32,
          themeColors.cyan,
          'center',
        );
      drawConstructionsCenter(
        ctx,
        api,
        'Overlapping resources give max(memory, compute), not their sum',
        1010,
        themeColors.yellow,
        31,
      );
    } else {
      drawConstructionsCenter(
        ctx,
        api,
        'Weight-only throughput roof · min(bandwidth × intensity, dense peak)',
        245,
      );
      const X = (v) => 300 + (v / 320) * 1350,
        Y = (v) => 820 - (v / 1050) * 420;
      drawConstructionsLine(ctx, api, 300, 400, 300, 820, themeColors.muted, 3);
      drawConstructionsLine(ctx, api, 300, 820, 1650, 820, themeColors.muted, 3);
      for (const v of [0, 250, 500, 750, 1000]) {
        drawConstructionsLine(ctx, api, 285, Y(v), 1650, Y(v), themeColors.panel, 1);
        drawConstructionsText(ctx, api, String(v), 265, Y(v) + 9, 26, themeColors.muted, 'right');
      }
      for (const v of [0, 64, 128, 256, 320]) {
        drawConstructionsLine(ctx, api, X(v), 820, X(v), 836, themeColors.muted, 2);
        drawConstructionsText(ctx, api, String(v), X(v), 885, 27, themeColors.muted, 'center');
      }
      drawConstructionsText(ctx, api, 'TFLOP/s', 300, 355, 28, themeColors.muted);
      drawConstructionsText(ctx, api, 'FLOPs per byte', 1650, 940, 27, themeColors.muted, 'right');
      drawConstructionsLine(ctx, api, X(0), Y(0), X(f.ridge), Y(989.5), themeColors.blue, 5);
      drawConstructionsLine(ctx, api, X(f.ridge), Y(989.5), X(320), Y(989.5), themeColors.blue, 5);
      api.circle(ctx, X(1), Y(3.35), 9, themeColors.cyan);
      if (done(2, 'sd-roof-ridge')) {
        drawConstructionsLine(
          ctx,
          api,
          X(f.ridge),
          Y(989.5),
          X(f.ridge),
          820,
          themeColors.yellow,
          3,
        );
        drawConstructionsText(
          ctx,
          api,
          'Dense ridge ' + f.ridge.toFixed(1),
          X(f.ridge),
          365,
          30,
          themeColors.yellow,
          'center',
        );
      }
      drawConstructionsText(
        ctx,
        api,
        'I = 1 → 3.35 TFLOP/s bound',
        480,
        1010,
        29,
        themeColors.cyan,
      );
      if (done(2, 'sd-roof-fraction'))
        drawConstructionsText(
          ctx,
          api,
          ((3.35 / 989.5) * 100).toFixed(2) + '% of dense peak',
          1560,
          1010,
          31,
          themeColors.yellow,
          'right',
        );
    }
  });
  return;
}
export default {
  id: 'weight-roofline',
  draw: drawWeightRoofline,
  cues: [
    'sd-weight-roofline-b0',
    'sd-weight-bytes',
    'sd-weight-roofline-b1',
    'sd-roof-floor',
    'sd-weight-roofline-b2',
    'sd-roof-ridge',
    'sd-roof-fraction',
  ],
};
