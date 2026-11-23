import { usefulCost } from '../arithmetic.mjs';
import { sceneClock } from '../scene-clock.mjs';
import {
  formatParallelNumber,
  parallelBar,
  parallelFooter,
  parallelLine,
  parallelRectangle,
  parallelText,
} from '../defaults.mjs';
export function drawFitLatencyCost(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const clock = sceneClock(scene, state);
  const resultComplete = (name) => clock.done('mp-fit-latency-cost-' + name);
  api.focus.target('mp-fit-latency-cost-mechanism', () => {
    if (currentBeat < 2) {
      parallelText(
        ctx,
        api,
        'First token   ·   p95 ≤ 400 ms',
        720,
        300,
        32,
        themeColors.ink,
        'center',
      );
      parallelText(
        ctx,
        api,
        'Time per output token   ·   p95 ≤ 55 ms',
        1390,
        300,
        32,
        themeColors.ink,
        'center',
      );
      const rows = [
        {
          tp: 1,
          ttft: null,
          tpot: null,
          fit: false,
        },
        {
          tp: 2,
          ttft: 310,
          tpot: 45,
          fit: true,
        },
        {
          tp: 4,
          ttft: 430,
          tpot: 62,
          fit: true,
        },
      ];
      rows.forEach((r, i) => {
        const y = 400 + i * 170;
        parallelText(ctx, api, 'TP' + r.tp, 180, y + 45, 32, themeColors.blue);
        if (!r.fit) {
          parallelText(
            ctx,
            api,
            resultComplete('fit') ? 'Weights exceed GPU memory' : 'Weight memory',
            450,
            y + 45,
            31,
            themeColors.pink,
          );
          return;
        }
        const done = resultComplete(r.tp === 2 ? 'two' : 'four');
        parallelBar(ctx, api, done ? r.ttft : 0, 500, 450, y, 560, 65, themeColors.blue);
        parallelBar(ctx, api, done ? r.tpot : 0, 75, 1160, y, 390, 65, themeColors.cyan);
        parallelLine(
          ctx,
          api,
          450 + (560 * 400) / 500,
          y - 10,
          450 + (560 * 400) / 500,
          y + 80,
          themeColors.yellow,
        );
        parallelLine(
          ctx,
          api,
          1160 + (390 * 55) / 75,
          y - 10,
          1160 + (390 * 55) / 75,
          y + 80,
          themeColors.yellow,
        );
        parallelText(ctx, api, done ? r.ttft + ' ms' : '?', 1020, y + 42, 28, themeColors.blue);
        parallelText(ctx, api, done ? r.tpot + ' ms' : '?', 1590, y + 42, 28, themeColors.cyan);
        if (resultComplete('gate'))
          parallelText(
            ctx,
            api,
            r.tp === 2 ? 'eligible' : 'hold',
            1740,
            y + 120,
            30,
            r.tp === 2 ? themeColors.green : themeColors.pink,
            'right',
          );
      });
      parallelFooter(
        ctx,
        api,
        currentBeat === 0
          ? 'A layout must clear both yellow limits'
          : 'Check first-token time and individual token gaps for the same request',
      );
    } else {
      parallelText(
        ctx,
        api,
        'Cost comparison for two layouts that meet both limits',
        960,
        300,
        32,
        themeColors.ink,
        'center',
      );
      [
        [6, 620, 'a'],
        [12, 900, 'b'],
      ].forEach(([price, rate, name], i) => {
        const x = 200 + i * 850,
          col = i ? themeColors.cyan : themeColors.blue;
        parallelRectangle(ctx, api, x, 400, 720, 475, col);
        parallelText(ctx, api, '$' + price + ' / hour', x + 35, 465, 34, col);
        parallelText(ctx, api, rate + ' useful tokens / second', x + 35, 545, 31, col);
        if (resultComplete('hourly'))
          parallelText(
            ctx,
            api,
            (rate * 3600).toLocaleString('en-US') + ' useful tokens / hour',
            x + 35,
            645,
            29,
            themeColors.yellow,
          );
        if (resultComplete(name))
          parallelText(
            ctx,
            api,
            '$' +
              formatParallelNumber(ctx, api, usefulCost(price, rate), 2) +
              ' / million useful tokens',
            x + 35,
            795,
            31,
            themeColors.green,
          );
      });
      parallelFooter(
        ctx,
        api,
        'Billed useful service includes idle time and the rest of the system in a real measurement.',
      );
    }
  });
}
export default {
  id: 'fit-latency-cost',
  draw: drawFitLatencyCost,
  cues: [
    'mp-fit-latency-cost-0',
    'mp-fit-latency-cost-fit',
    'mp-fit-latency-cost-two',
    'mp-fit-latency-cost-four',
    'mp-fit-latency-cost-gate',
    'mp-fit-latency-cost-1',
    'mp-fit-latency-cost-2',
    'mp-fit-latency-cost-a',
    'mp-fit-latency-cost-b',
    'mp-fit-latency-cost-hourly',
    'mp-fit-latency-cost-divide',
  ],
};
