import { deepGemmSentenceProgress, expertPackState } from '../construction.mjs';
import { drawText } from '../defaults.mjs';
import { sentenceCues } from '../fixtures.mjs';
import { drawRowPack } from '../row-pack.mjs';

function drawFirstRow(ctx, api, state, pack, g) {
  const { C } = api;
  const left = 160,
    scale = 3.5,
    top = 550,
    height = 140;
  const x = (row) => left + row * scale;
  const [first, second, third] = pack.segments;
  const compactRow = first.count + second.count;
  const compactKnown = g(0, 3) >= 1;
  const alignedKnown = g(1, 2) >= 1;
  // The row is already in flight during the lead before the first spoken word.
  const lead = Math.min(1, (state.t ?? 0) / 0.4);
  const flight = g(0, 0) + (1 - g(0, 0)) * (0.12 + 0.2 * lead);
  const pinX = x(third.start) + (1 - flight) * 325;
  const lift = (1 - flight) * 206;

  api.focus.target('expert-packed-rows', () => {
    for (const [i, seg] of [first, second, third].entries()) {
      const start = x(seg.start);
      const width = seg.count * scale;
      drawText(ctx, api, 'Expert ' + i, start, top + height + 65, 38);
      const slot = i === 2 ? 7 : 0;
      api.rect(ctx, start + slot, top, width - slot - 3, height, C.cyan, undefined, 3);
      if (slot && flight < 1) {
        api.line(ctx, start - 8, top - 12, start + 12, top - 12, C.yellow, 3);
        api.line(ctx, start - 8, top + height + 12, start + 12, top + height + 12, C.yellow, 3);
      }
      if (i < 2) {
        drawText(ctx, api, seg.count + ' rows', start + width / 2, top + 85, 44, C.bg, 'center');
        const tail = scale * (seg.width - seg.count);
        if (tail > 2) {
          api.rect(ctx, start + width, top, tail - 2, height, C.panel, C.muted, 3);
          if (tail > 142)
            drawText(
              ctx,
              api,
              'padding',
              start + width + tail / 2,
              top + 83,
              32,
              C.muted,
              'center',
            );
        }
      }
    }
    if (g(0, 4) > 0) {
      const end = x(pack.alignment);
      api.line(ctx, left, 427, end, 427, C.muted, 3);
      for (const edge of [left, end]) api.line(ctx, edge, 415, edge, 438, C.muted, 3);
      drawText(ctx, api, '128 rows per block', (left + end) / 2, 397, 36, C.ink, 'center');
    }
  });
  api.focus.target('pack-pin', () => {
    // The full-size tag identifies a single row at the tip of the leader.
    const tagY = top - 181 - lift;
    api.rect(ctx, pinX - 109, tagY, 218, 122, C.yellow, undefined, 12);
    drawText(ctx, api, 'Token 7', pinX, tagY + 52, 48, C.bg, 'center');
    const address = alignedKnown ? third.start : compactKnown && g(1, 0) === 0 ? compactRow : '?';
    drawText(ctx, api, 'Row ' + address, pinX, tagY + 98, 32, C.bg, 'center');
    api.line(ctx, pinX, tagY + 122, pinX, top - lift, C.yellow, 5);
    api.rect(ctx, pinX, top - lift, 6, height, C.yellow, undefined, 0);
    if (compactKnown) {
      const line = alignedKnown
        ? 'Compact row ' + compactRow + '     →     Aligned row ' + third.start
        : state.beat === 1 || g(0, 5) > 0
          ? 'Compact row ' + compactRow + '     →     Aligned row ?'
          : first.count + ' + ' + second.count + ' = row ' + compactRow;
      drawText(ctx, api, line, 960, 906, 55, C.ink, 'center');
    }
  });
}

export function drawIntro(ctx, scene, state, api) {
  const pack = expertPackState(scene.id, state);
  const g = (beat, line) => deepGemmSentenceProgress(scene.id, state, beat, line);
  if (state.t < 0.35) ctx.globalAlpha = 1;
  if (g(1, 3) === 0) return drawFirstRow(ctx, api, state, pack, g);

  drawRowPack(ctx, api, pack, {
    limit: 640,
    pin: 't7 · row ' + pack.segments[2].start,
    showCapacity: pack.allocationReady,
    result: pack.totalsReady
      ? pack.useful + ' useful + ' + pack.padding + ' padding = ' + pack.capacity + ' reserved'
      : 'Expert 2 starts after three 128-row blocks',
    title: '128 rows per block',
    detail: pack.totalsReady
      ? 'Blue rows carry data. Each empty tail belongs to the expert before it.'
      : '',
  });
}
export default { id: 'intro', draw: drawIntro, cues: sentenceCues('intro') };
