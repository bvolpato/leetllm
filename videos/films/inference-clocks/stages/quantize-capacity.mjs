import { capacityFixture } from '../arithmetic.mjs';
import { quantizedCapacityFrame } from '../model.mjs';
import { passage } from '../trace.mjs';
import { drawUpgradeBar, drawUpgradeEquation, drawUpgradeText } from '../defaults.mjs';
export function drawQuantizeCapacity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    f = capacityFixture();
  const target = currentBeat === 3 ? 'quantize-capacity-extension' : 'quantize-capacity-mechanism';
  api.focus.target(target, () => {
    const f2 = quantizedCapacityFrame(state),
      per = f2.perUser;
    if (currentBeat === 0) {
      drawUpgradeText(
        ctx,
        api,
        'Same dimensions: 2 × 16 layers × 4 KV heads × 256 coordinates',
        960,
        285,
        34,
        themeColors.muted,
        'center',
      );
      drawUpgradeText(
        ctx,
        api,
        '32,768 stored values per position · eight accounting chunks × 4,096 values',
        960,
        375,
        31,
        themeColors.ink,
        'center',
      );
      drawUpgradeText(ctx, api, '2 bytes/value', 185, 510, 31, themeColors.blue);
      drawUpgradeText(ctx, api, '1 byte/value', 185, 770, 31, themeColors.green);
      for (let i = 0; i < 8; i++) {
        drawUpgradeBar(ctx, api, 480 + i * 140, 440, 140, 100, themeColors.blue);
        api.line(ctx, 480 + i * 140, 440, 480 + i * 140, 540, themeColors.bg, 2);
        if (i < f2.oneByteChunks) {
          drawUpgradeBar(ctx, api, 480 + i * 70, 700, 70, 100, themeColors.green);
          api.line(ctx, 480 + i * 70, 700, 480 + i * 70, 800, themeColors.bg, 2);
        }
      }
      drawUpgradeText(
        ctx,
        api,
        '65,536 raw bytes / position',
        1040,
        610,
        36,
        themeColors.blue,
        'center',
      );
      drawUpgradeText(
        ctx,
        api,
        f2.oneByteChunks === 8
          ? '32,768 raw bytes / position'
          : f2.oneByteChunks + ' of 8 one-byte chunks constructed',
        1040,
        875,
        36,
        f2.oneByteChunks === 8 ? themeColors.green : themeColors.muted,
        'center',
      );
      drawUpgradeText(
        ctx,
        api,
        'A smaller KV value makes each cache page smaller',
        960,
        1000,
        30,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      drawUpgradeText(
        ctx,
        api,
        'Supplied device budget · decimal GB, same dimensions and reservations',
        960,
        270,
        33,
        themeColors.muted,
        'center',
      );
      api.rect(ctx, 220, 355, 1440, 105, themeColors.panel, themeColors.muted, 3);
      if (f2.device)
        drawUpgradeText(ctx, api, '80 GB total', 960, 325, 35, themeColors.ink, 'center');
      if (f2.weights) {
        drawUpgradeBar(ctx, api, 220, 355, 54 * 18, 105, themeColors.blue);
        drawUpgradeText(ctx, api, '54 GB weights', 706, 425, 32, themeColors.ink, 'center');
      }
      if (f2.reserve) {
        drawUpgradeBar(ctx, api, 220 + 54 * 18, 355, 8 * 18, 105, themeColors.pink);
        drawUpgradeText(ctx, api, '8 GB', 220 + 58 * 18, 425, 28, themeColors.bg, 'center');
      }
      if (f2.pool) {
        drawUpgradeBar(ctx, api, 220 + 62 * 18, 355, 18 * 18, 105, themeColors.green);
        drawUpgradeText(ctx, api, '18 GB KV', 220 + 71 * 18, 425, 30, themeColors.bg, 'center');
        drawUpgradeText(
          ctx,
          api,
          '80 − 54 − 8 = 18 GB dedicated to growing KV',
          960,
          530,
          36,
          themeColors.green,
          'center',
        );
      }
      const rows = [
        {
          bytes: per,
          count: f2.twoUsers,
          complete: f2.twoResult,
          color: themeColors.blue,
          label: '2 B/value',
        },
        {
          bytes: per / 2,
          count: f2.oneUsers,
          complete: f2.oneResult,
          color: themeColors.green,
          label: '1 B/value',
        },
      ];
      rows.forEach((row, i) => {
        const y = 665 + i * 205,
          width = (row.bytes / f2.poolBytes) * 1440;
        api.rect(ctx, 220, y, 1440, 70, themeColors.panel, themeColors.muted, 2);
        if (f2.positions) {
          drawUpgradeText(
            ctx,
            api,
            row.label + ' · 5,120 × ' + (i ? '32,768' : '65,536') + ' B',
            220,
            y - 40,
            29,
            row.color,
          );
          for (let j = 0; j < row.count; j++)
            api.rect(ctx, 220 + j * width, y, width, 70, row.color, themeColors.bg, 1);
          drawUpgradeText(
            ctx,
            api,
            row.complete
              ? 'floor(18e9 / ' + row.bytes.toLocaleString('en-US') + ') = ' + row.count + ' users'
              : 'Placed ' + row.count + ' complete allocations',
            1740,
            y - 40,
            29,
            row.complete ? row.color : themeColors.muted,
            'right',
          );
          drawUpgradeText(
            ctx,
            api,
            row.bytes.toLocaleString('en-US') + ' raw bytes / user',
            960,
            y + 120,
            29,
            row.color,
            'center',
          );
        }
      });
      drawUpgradeText(
        ctx,
        api,
        'Each rectangle is one complete raw user payload on the same 18 GB capacity scale',
        960,
        1020,
        27,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 2) {
      drawUpgradeText(
        ctx,
        api,
        'What does each request need from the state pool?',
        960,
        275,
        33,
        themeColors.muted,
        'center',
      );
      const rows = [
        ['Component', 'Per-request allocation', 'Additional contract'],
        ['Raw KV values', '335.5 → 167.8 MB', 'same 5,120 positions'],
        ['Quantization scales', 'additional bytes', 'backend layout / calibration'],
        ['Tail slack', 'additional reserved slots', 'page/block allocation'],
        ['Unquantized recurrent state', 'fixed per request', 'does not shrink with KV'],
        ['Request buffers', 'additional bytes', 'measure actual lifetime'],
      ];
      rows.forEach((row, i) => {
        const y = 350 + i * 86;
        row.forEach((v, j) =>
          drawUpgradeText(
            ctx,
            api,
            v,
            155 + j * 560,
            y,
            27,
            i ? (j === 1 ? themeColors.yellow : themeColors.ink) : themeColors.muted,
          ),
        );
        api.line(ctx, 150, y + 25, 1770, y + 25, themeColors.panel, 2);
      });
      drawUpgradeText(
        ctx,
        api,
        'Charge each allocation to the pool that holds it',
        960,
        865,
        27,
        themeColors.muted,
        'center',
      );
      drawUpgradeEquation(
        ctx,
        api,
        String.raw`n\,(b_{KV}+b_{scales}+b_{slack}+b_{fixed}+b_{buffers})\le B_{state}`,
        960,
        925,
        40,
        themeColors.yellow,
      );
      drawUpgradeText(
        ctx,
        api,
        'Verify backend support, quality, latency and complete-workload cost before deployment',
        960,
        1015,
        28,
        themeColors.muted,
        'center',
      );
    } else {
      drawUpgradeText(
        ctx,
        api,
        'One short chat · 8 GiB shared state pool',
        960,
        285,
        39,
        themeColors.ink,
        'center',
      );
      const rec = f.hybrid.recurrent / 1024 ** 2;
      const original = f.hybrid.kv / 1024 ** 2;
      const shrink = passage(state, 3, 'quantize-capacity-core-extension', 0.41, 0.52);
      [original, original / 2].forEach((kv, i) => {
        if (i && shrink === 0) return;
        const y = 430 + i * 250;
        drawUpgradeBar(ctx, api, 260, y, rec * 8, 100, themeColors.blue);
        drawUpgradeBar(
          ctx,
          api,
          260 + rec * 8,
          y,
          (i ? original - (original - kv) * shrink : kv) * 8,
          100,
          i ? themeColors.green : themeColors.pink,
        );
        if (i && shrink < 1) return;
        drawUpgradeText(
          ctx,
          api,
          rec + ' MiB recurrent + ' + kv + ' MiB KV = ' + (rec + kv) + ' MiB',
          960,
          y - 45,
          35,
          themeColors.ink,
          'center',
        );
        drawUpgradeText(
          ctx,
          api,
          Math.floor(f.hybrid.pool / ((rec + kv) * 1024 ** 2)) + ' users',
          1640,
          y + 70,
          42,
          i ? themeColors.green : themeColors.pink,
          'center',
        );
      });
      if (shrink === 1)
        drawUpgradeText(
          ctx,
          api,
          'Each chat saves 4 MiB · two more chats fit in the pool',
          960,
          995,
          36,
          themeColors.yellow,
          'center',
        );
    }
  });
}
export default {
  id: 'quantize-capacity',
  draw: drawQuantizeCapacity,
  cues: [
    'quantize-capacity-b1',
    'ic-one-byte-row',
    'quantize-capacity-b2',
    'ic-cap-device',
    'ic-cap-weights',
    'ic-cap-reserve',
    'ic-cap-pool',
    'ic-cap-positions',
    'ic-cap-53',
    'ic-cap-107',
    'quantize-capacity-b3',
    'quantize-capacity-core-extension',
  ],
};
