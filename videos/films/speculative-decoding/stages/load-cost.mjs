import { expectedYield } from '../arithmetic.mjs';
import { completedCue } from '../construction.mjs';
import {
  drawConstructionsBox,
  drawConstructionsCenter,
  drawConstructionsLine,
  drawConstructionsText,
} from '../defaults.mjs';
export function drawLoadCost(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    done = (beat, cue) => currentBeat > beat || (currentBeat === beat && completedCue(state, cue));
  api.focus.target('sd-load-cost-mechanism', () => {
    drawConstructionsCenter(
      ctx,
      api,
      ['One weight read shared across a batch', 'Compute-limited example',
        'Measured throughput relative to ordinary decoding'][currentBeat],
      245,
    );
    if (currentBeat === 0) {
      const ridge = 989.5 / 3.35;
      drawConstructionsLine(ctx, api, 250, 620, 1690, 620, themeColors.muted, 3);
      [1, 64, ridge].forEach((v) => {
        const x = 250 + (v / 320) * 1400;
        drawConstructionsLine(ctx, api, x, 600, x, 645, themeColors.blue, 5);
        drawConstructionsText(
          ctx,
          api,
          v === ridge ? 'dense ridge 295.4' : String(v) + ' FLOPs/byte',
          x,
          735,
          29,
          v === ridge ? themeColors.yellow : themeColors.blue,
          'center',
        );
      });
      drawConstructionsCenter(
        ctx,
        api,
        '64 ordinary streams still fall below this weight-only ridge',
        865,
        themeColors.blue,
        34,
      );
    } else if (currentBeat === 1) {
      const yield_ = expectedYield(0.8, 2),
        cost = 3 + 0.2;
      drawConstructionsBox(
        ctx,
        api,
        'Toy K=2 · α=0.8 · draft cost=0.1',
        220,
        365,
        1480,
        themeColors.blue,
      );
      drawConstructionsText(
        ctx,
        api,
        'Verification: 3 equal-cost positions',
        960,
        570,
        35,
        themeColors.blue,
        'center',
      );
      for (let i = 0; i < 3; i++) api.rect(ctx, 350 + i * 375, 650, 330, 65, themeColors.blue);
      if (done(1, 'sd-compute-bound'))
        drawConstructionsCenter(
          ctx,
          api,
          'Yield ' +
            yield_.toFixed(2) +
            ' ÷ total cost ' +
            cost.toFixed(2) +
            ' = ' +
            (yield_ / cost).toFixed(3) +
            '×',
          895,
          themeColors.pink,
          42,
        );
      drawConstructionsCenter(
        ctx,
        api,
        'This bound assumes equal per-position compute cost and full compute limitation',
        1010,
        themeColors.muted,
      );
    } else {
      const vals = [0.99, 1.38],
        xs = [500, 1360];
      drawConstructionsText(
        ctx,
        api,
        'EAGLE-3 paper · one H100 · batch 64',
        960,
        330,
        32,
        themeColors.muted,
        'center',
      );
      drawConstructionsLine(ctx, api, 270, 800, 1710, 800, themeColors.muted);
      vals.forEach((v, i) => {
        const show = done(2, i ? 'sd-historical-throughput' : 'sd-original-throughput');
        if (show) {
          api.rect(
            ctx,
            xs[i] - 180,
            800 - v * 230,
            360,
            v * 230,
            i ? themeColors.green : themeColors.blue,
          );
          drawConstructionsText(
            ctx,
            api,
            v.toFixed(2) + '×',
            xs[i],
            745 - v * 230,
            38,
            i ? themeColors.green : themeColors.blue,
            'center',
          );
        }
        drawConstructionsText(
          ctx,
          api,
          i ? 'EAGLE-3 chain' : 'Original EAGLE',
          xs[i],
          875,
          32,
          i ? themeColors.green : themeColors.blue,
          'center',
        );
      });
      drawConstructionsCenter(
        ctx,
        api,
        '8B target · MT-Bench · SGLang 0.4.4 · depth 3 · no tree',
        1010,
        themeColors.muted,
      );
    }
  });
  return;
}
export default {
  id: 'load-cost',
  draw: drawLoadCost,
  cues: [
    'sd-load-cost-b0',
    'sd-load-cost-b1',
    'sd-compute-bound',
    'sd-load-cost-b2',
    'sd-historical-throughput',
    'sd-original-throughput',
  ],
};
