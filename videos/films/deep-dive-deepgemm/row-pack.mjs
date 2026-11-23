import { drawText } from './defaults.mjs';

// Each lane uses the same packed M axis. The strip below joins those lanes into memory order.
export function drawRowPack(
  ctx,
  api,
  pack,
  { limit, title, result, detail, pin, showCapacity, edgeExpert, blockTicks = true },
) {
  const { C } = api;
  const x = (row) => 355 + (row / limit) * 1230;
  const barHeight = 46;
  const y = (i) => 358 + i * (pack.rows.length === 3 ? 139 : 107);
  function bar(left, top, segment, height) {
    const real = x(segment.count) - x(0);
    const width = x(segment.width) - x(0);
    if (width > real + 1) {
      api.rect(ctx, left + real, top, width - real, height, C.panel, C.muted, 0);
    }
    if (real > 0) api.rect(ctx, left, top, real, height, C.cyan, undefined, 0);
    if (blockTicks) {
      for (let local = pack.alignment; local < segment.width; local += pack.alignment) {
        const tick = left + x(local) - x(0);
        api.line(ctx, tick, top + 1, tick, top + height - 1, C.bg, 3);
      }
    }
  }

  api.focus.target('expert-packed-rows', () => {
    drawText(ctx, api, title, 130, 232, 38);
    drawText(ctx, api, pack.assemble === 0 ? 'Expert row' : 'Row offset', 130, 312, 30, C.muted);
    for (let tick = 0; tick <= limit; tick += limit > 768 ? 256 : 128) {
      api.line(ctx, x(tick), 301, x(tick), 318, C.muted, 2);
      drawText(ctx, api, tick, x(tick), 289, 26, C.muted, 'center');
    }
    api.line(ctx, x(0), 310, x(limit), 310, C.muted, 2);
    for (const [i, seg] of pack.segments.entries()) {
      const left = x(seg.start);
      const top = y(i);
      drawText(ctx, api, 'Expert ' + i, 130, top + 23, 35);
      drawText(ctx, api, seg.count + ' useful', 130, top + 61, 26, C.cyan);
      bar(left, top, seg, barHeight);
      if (!seg.count) {
        api.line(ctx, left, top + 2, left, top + barHeight - 2, C.muted, 3);
        drawText(ctx, api, 'empty', left - 18, top + 34, 27, C.muted, 'right');
      }
      if (showCapacity) {
        drawText(ctx, api, pack.capacities[i] + ' reserved', 1805, top + 34, 28, C.muted, 'right');
      }
    }
    if (pin) {
      api.focus.target('pack-pin', () => {
        const left = x(pack.segments[2].start);
        const top = y(2);
        api.line(ctx, left, top - 9, left, top + barHeight + 15, C.yellow, 5);
        api.circle(ctx, left, top - 10, 8, C.yellow);
        drawText(ctx, api, pin, left + 14, top + barHeight + 33, 29, C.yellow);
      });
    }
    if (edgeExpert !== undefined) {
      const count = pack.rows[edgeExpert];
      const edge = Math.floor((count - 1) / pack.alignment) * pack.alignment;
      drawText(ctx, api, 'Expert ' + edgeExpert + ' · magnified', 130, 787, 31);
      drawText(ctx, api, 'Local row index', 130, 829, 27, C.muted);
      const left = 615,
        cell = 155;
      for (let i = 0; i < 4; i++) {
        const row = edge - 2 + i;
        const color = row === count - 1 ? C.yellow : row < count ? C.cyan : C.panel;
        const offset = left + i * cell + (i >= 2 ? 12 : 0);
        api.rect(ctx, offset, 751, cell - 5, 65, color, C.muted, 0);
        drawText(
          ctx,
          api,
          row,
          offset + (cell - 5) / 2,
          797,
          33,
          row < count ? C.bg : C.muted,
          'center',
        );
      }
      const split = left + 2 * cell + 4;
      api.line(ctx, split, 735, split, 831, C.yellow, 3);
      drawText(ctx, api, 'Block boundary', split, 867, 29, C.yellow, 'center');
      drawText(ctx, api, 'Last row', left + cell * 2.5 + 10, 737, 26, C.yellow, 'center');
    } else if (pack.assemble === 1) {
      drawText(ctx, api, 'One buffer', 130, 824, 30);
      for (const seg of pack.segments) {
        bar(x(seg.start), 786, seg, 48);
        if (seg.width > 0) api.line(ctx, x(seg.start), 787, x(seg.start), 833, C.bg, 3);
      }
    }
  });
  api.focus.target('pack-result', () => {
    drawText(ctx, api, result, 960, 920, 43, C.ink, 'center');
    if (detail) drawText(ctx, api, detail, 960, 995, 32, C.muted, 'center');
  });
}
