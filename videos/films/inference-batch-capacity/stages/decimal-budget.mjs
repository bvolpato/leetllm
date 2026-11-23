import { GiB } from '../fixtures.mjs';
import { capacityEvent } from '../construction.mjs';
import { drawCenteredText, drawFooter, drawStrip } from '../defaults.mjs';
export function drawDecimalBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => capacityEvent(scene, state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('decimal-budget-mechanism', () => {
    const total = 80e9 / GiB,
      weights = 16e9 / GiB,
      runtime = 8,
      kv = total - weights - runtime;
    if (currentBeat === 0) {
      drawCenteredText(
        ctx,
        api,
        '80,000,000,000 available bytes ÷ 2³⁰',
        960,
        300,
        37,
        themeColors.yellow,
      );
      const tw = ev('weights', 0),
        tr = ev('runtime', 0);
      drawStrip(
        ctx,
        api,
        [
          {
            value: weights * tw,
            color: themeColors.blue,
          },
          {
            value: runtime * tr,
            color: themeColors.yellow,
          },
          {
            value: total - weights * tw - runtime * tr,
            color: themeColors.panel,
          },
        ],
        170,
        440,
        1580,
        160,
        total,
      );
      drawCenteredText(
        ctx,
        api,
        done('total', 0) ? '74.506 GiB total' : 'Convert decimal bytes before allocating GiB',
        960,
        790,
        36,
        themeColors.cyan,
      );
      if (done('weights', 0))
        drawCenteredText(ctx, api, '16 GB weights = 14.901 GiB', 540, 915, 31, themeColors.blue);
      if (done('runtime', 0))
        drawCenteredText(ctx, api, '8 GiB runtime / headroom', 1390, 915, 31, themeColors.yellow);
    } else if (currentBeat === 1) {
      const reserve = ev('reserve', 1),
        per = 0.5 + 0.0625 * reserve;
      drawCenteredText(
        ctx,
        api,
        'Pool = 74.5058 − 14.9012 − 8 = ' + (done('pool', 1) ? kv.toFixed(4) + ' GiB' : '?'),
        960,
        315,
        36,
        themeColors.yellow,
      );
      for (let i = 0; i < 104; i++) {
        const x = 165 + (i % 26) * 61,
          y = 445 + Math.floor(i / 26) * 105;
        api.rect(
          ctx,
          x,
          y,
          49,
          (per / 0.5625) * 78,
          i < Math.floor(kv / per) ? themeColors.green : themeColors.panel,
          themeColors.muted,
          0,
        );
      }
      if (done('reserve', 1))
        drawCenteredText(
          ctx,
          api,
          'Each growth reservation: 4,096 + 512 → 0.5625 GiB',
          960,
          925,
          33,
          themeColors.cyan,
        );
      if (done('capacity', 1))
        drawCenteredText(
          ctx,
          api,
          '91 fit · 92 × 0.5625 = 51.75 GiB: exceeds pool',
          960,
          980,
          31,
          themeColors.pink,
        );
    } else {
      drawCenteredText(
        ctx,
        api,
        'The pool stays allocated as requests come and go',
        960,
        300,
        35,
        themeColors.yellow,
      );
      drawStrip(
        ctx,
        api,
        [
          {
            value: weights,
            color: themeColors.blue,
          },
          {
            value: runtime,
            color: themeColors.yellow,
          },
          {
            value: kv,
            color: themeColors.panel,
          },
        ],
        170,
        440,
        1580,
        160,
        total,
      );
      const poolX = 170 + ((weights + runtime) / total) * 1580;
      api.rect(ctx, poolX, 440, (kv / total) * 1580 * 0.6, 160, themeColors.green, undefined, 0);
      drawCenteredText(ctx, api, 'fixed resident KV pool', 1290, 740, 32, themeColors.cyan);
      drawCenteredText(ctx, api, 'live · cached · reusable', 1290, 815, 29, themeColors.green);
      drawCenteredText(
        ctx,
        api,
        'Executor utilization and explicit KV-pool size constrain different allocations',
        960,
        940,
        29,
        themeColors.muted,
      );
    }
    drawFooter(
      ctx,
      api,
      'Separate 80-billion-byte reference budget; never add it to the 32-GiB worksheet',
    );
  });
}
export default {
  id: 'decimal-budget',
  draw: drawDecimalBudget,
  cues: [
    'ic-decimal-budget-total',
    'ic-decimal-budget-weights',
    'ic-decimal-budget-runtime',
    'ic-decimal-budget-pool',
    'ic-decimal-budget-reserve',
    'ic-decimal-budget-capacity',
    'ic-decimal-budget-settings',
  ],
};
