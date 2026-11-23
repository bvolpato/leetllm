import { GiB, bytesPerToken } from '../fixtures.mjs';
import { capacityEvent } from '../construction.mjs';
import { drawCapacityText, drawCenteredText, drawFooter, drawStrip } from '../defaults.mjs';
export function drawWeightCompression(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => capacityEvent(scene, state, name, beat),
    done = (name, beat) => ev(name, beat) === 1,
    begun = (name, beat) => ev(name, beat) > 0;
  api.focus.target('weight-compression-mechanism', () => {
    if (currentBeat === 0) {
      const p = ev('weights', 0),
        weight = 16 - 12 * p;
      drawCenteredText(
        ctx,
        api,
        'Same 8B parameters · only weight precision changes',
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
            value: weight,
            color: themeColors.blue,
          },
          {
            value: 16 - weight,
            color: themeColors.panel,
          },
        ],
        190,
        455,
        1540,
        170,
        16,
      );
      drawCenteredText(
        ctx,
        api,
        (2 - 1.5 * p).toFixed(2) + ' B/weight → ' + weight.toFixed(1) + ' decimal GB',
        960,
        785,
        35,
        themeColors.blue,
      );
      if (done('floor', 0))
        drawCenteredText(
          ctx,
          api,
          'Weight serialization floor: 4.78 → 1.19 ms at published3.35 TB/s',
          960,
          930,
          31,
          themeColors.green,
        );
    } else if (currentBeat === 1) {
      const p = ev('saved', 1),
        saved = (12e9 / GiB) * p,
        pool = 51.604644775390625 + saved;
      drawCenteredText(
        ctx,
        api,
        'Separate 80-billion-byte reference; released bytes go to its pool',
        960,
        300,
        31,
        themeColors.yellow,
      );
      drawStrip(
        ctx,
        api,
        [
          {
            value: 51.604644775390625,
            color: themeColors.green,
          },
          {
            value: saved,
            color: themeColors.cyan,
          },
          {
            value: 12e9 / GiB - saved,
            color: themeColors.panel,
          },
        ],
        180,
        455,
        1560,
        170,
        51.604644775390625 + 12e9 / GiB,
      );
      drawCenteredText(
        ctx,
        api,
        'pool ' + pool.toFixed(3) + ' GiB',
        960,
        810,
        39,
        themeColors.green,
      );
      if (done('capacity', 1))
        drawCenteredText(
          ctx,
          api,
          'Raw 0.50 GiB histories: 103 → 125 · +22',
          960,
          935,
          36,
          themeColors.cyan,
        );
    } else {
      const long = begun('long', 2),
        kv = (64 * (long ? 16384 : 4096) * bytesPerToken) / 1e9,
        compressed = ev('ratio', 2);
      drawCenteredText(
        ctx,
        api,
        'Fixed batch 64 · ' + (long ? '16K' : '4K') + ' histories · only weight bytes shrink',
        960,
        295,
        32,
        themeColors.yellow,
      );
      [
        ['before', 16],
        ['after', 16 - 12 * compressed],
      ].forEach(([label, w], i) => {
        const y = 470 + i * 220;
        drawCapacityText(ctx, api, label, 140, y + 60, 31, themeColors.muted);
        drawStrip(
          ctx,
          api,
          [
            {
              value: w,
              color: themeColors.blue,
            },
            {
              value: kv,
              color: themeColors.pink,
            },
          ],
          380,
          y,
          1340,
          110,
          16 + kv,
        );
        drawCenteredText(
          ctx,
          api,
          'W ' + w.toFixed(2) + ' + KV ' + kv.toFixed(2) + ' = ' + (w + kv).toFixed(2) + ' GB',
          1040,
          y + 170,
          32,
          themeColors.ink,
        );
      });
      if (done(long ? 'long' : 'ratio', 2))
        drawCenteredText(
          ctx,
          api,
          'Bandwidth-only rate ratio ' + ((16 + kv) / (4 + kv)).toFixed(2) + '×',
          960,
          975,
          35,
          long ? themeColors.pink : themeColors.green,
        );
    }
    drawFooter(
      ctx,
      api,
      currentBeat === 2 && begun('long', 2)
        ? '64 histories at 16K need 128 GiB for the cache alone'
        : 'The weight segment shrinks while the history reads stay the same',
    );
  });
}
export default {
  id: 'weight-compression',
  draw: drawWeightCompression,
  cues: [
    'ic-weight-compression-weights',
    'ic-weight-compression-floor',
    'ic-weight-compression-saved',
    'ic-weight-compression-capacity',
    'ic-weight-compression-current',
    'ic-weight-compression-ratio',
    'ic-weight-compression-long',
  ],
};
