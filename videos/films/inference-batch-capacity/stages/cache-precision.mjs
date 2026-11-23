import { capacityEvent } from '../construction.mjs';
import { drawCapacityText, drawCenteredText, drawFooter, drawStrip } from '../defaults.mjs';
export function drawCachePrecision(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => capacityEvent(scene, state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('cache-precision-mechanism', () => {
    const p = ev('half', 0),
      width = 2 - p;
    drawCenteredText(
      ctx,
      api,
      'Change KV element width · weights and bandwidth remain fixed',
      960,
      300,
      33,
      themeColors.yellow,
    );
    if (currentBeat === 0) {
      [
        ['K', themeColors.blue],
        ['V', themeColors.green],
      ].forEach(([name, color], i) => {
        drawCenteredText(ctx, api, name, 170, 475 + i * 200, 36, color);
        for (let j = 0; j < 8; j++)
          api.rect(ctx, 300 + j * 180, 410 + i * 200, (130 * width) / 2, 115, color, undefined, 0);
      });
      drawCenteredText(
        ctx,
        api,
        ((128 * width) / 2).toFixed(0) + ' KiB / retained position',
        960,
        850,
        37,
        themeColors.cyan,
      );
      if (done('capacity', 0))
        drawCenteredText(
          ctx,
          api,
          '51.6046 GiB pool: 8K: 51 → 103 · 128K: 3 → 6 raw payloads',
          960,
          955,
          31,
          themeColors.yellow,
        );
    } else if (currentBeat === 1) {
      const p = ev('traffic', 1);
      drawCenteredText(ctx, api, 'Raw attention read term', 960, 420, 39, themeColors.cyan);
      drawCenteredText(
        ctx,
        api,
        '2 arrays × batch × length × layers × KV heads × width × element bytes',
        960,
        550,
        29,
        themeColors.yellow,
      );
      drawStrip(
        ctx,
        api,
        [
          {
            value: 2 - p,
            color: themeColors.green,
          },
          {
            value: p,
            color: themeColors.panel,
          },
        ],
        230,
        710,
        1460,
        100,
        2,
      );
      drawCenteredText(
        ctx,
        api,
        'Element width ' +
          (2 - p).toFixed(2) +
          ' B · raw KV traffic ' +
          (((2 - p) / 2) * 100).toFixed(0) +
          '%',
        960,
        930,
        34,
        themeColors.green,
      );
    } else {
      drawCenteredText(
        ctx,
        api,
        'Keep the effective model,cache format and calibration together',
        960,
        350,
        33,
        themeColors.yellow,
      );
      const rows = [
        ['scale granularity', 'per tensor / per head'],
        ['layer selection', 'some remain unquantized'],
        ['engine support', 'model + hardware + backend'],
        ['admission', 'output quality + peaks + gap tails'],
      ];
      rows.forEach(([a, z], i) => {
        drawCapacityText(ctx, api, a, 200, 490 + i * 115, 30, themeColors.muted);
        drawCapacityText(
          ctx,
          api,
          z,
          700,
          490 + i * 115,
          32,
          i === 3 ? themeColors.green : themeColors.cyan,
        );
      });
    }
    drawFooter(
      ctx,
      api,
      'Narrower cache entries need fewer bytes per history',
    );
  });
}
export default {
  id: 'cache-precision',
  draw: drawCachePrecision,
  cues: [
    'ic-cache-precision-half',
    'ic-cache-precision-capacity',
    'ic-cache-precision-traffic',
    'ic-cache-precision-quality',
  ],
};
