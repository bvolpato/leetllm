import { cachedBlockRelease } from '../arithmetic.mjs';
import {
  drawAddedArrow,
  drawAddedLine,
  drawAddedNote,
  drawAddedP,
  drawAddedText,
} from '../defaults.mjs';
export function drawAllocatorLedger(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawAddedP(ctx, api, id) === 1,
    v = drawAddedP(ctx, api, 'allocator-idle');
  const number = (value) => (Number.isInteger(value) ? String(value) : value.toPrecision(5));
  api.focus.target('allocator-ledger-construction', () => {
    const p =
        currentBeat === 1 ? drawAddedP(ctx, api, 'allocator-return') : currentBeat === 2 ? 1 : 0,
      a = cachedBlockRelease(p);
    drawAddedText(ctx, api, 'Who holds each gibibyte?', 160, 285, 34, themeColors.cyan);
    for (let i = 0; i < 11; i++) {
      const x = 180 + i * 140,
        free = i >= 8 && i < 10;
      if (free && currentBeat === 2) continue;
      const q = free ? a.blocks[i - 8].motion : 0,
        yy = free ? 430 - 150 * q : 430;
      api.rect(
        ctx,
        x,
        yy,
        115,
        155,
        themeColors.panel,
        i < 8 ? themeColors.blue : free ? themeColors.yellow : themeColors.pink,
        2,
      );
      drawAddedText(
        ctx,
        api,
        i < 8 ? 'live ' + i : free ? 'free ' + (i - 8) : 'context',
        x + 57,
        yy + 80,
        25,
        i < 8 ? themeColors.blue : free ? themeColors.yellow : themeColors.pink,
        'center',
        true,
      );
      if (free && q > 0)
        drawAddedArrow(ctx, api, x + 57, yy - 15, x + 57, yy - 55, themeColors.yellow);
      if (free && q === 1)
        drawAddedText(ctx, api, 'returned', x + 57, yy + 120, 21, themeColors.yellow, 'center');
    }
    const show = currentBeat !== 0 || done('allocator-counts');
    if (show) {
      drawAddedText(
        ctx,
        api,
        'allocated ' + number(a.allocated),
        380,
        710,
        37,
        themeColors.blue,
        'center',
      );
      drawAddedText(
        ctx,
        api,
        'reserved ' + number(a.reserved),
        960,
        710,
        37,
        themeColors.yellow,
        'center',
      );
      drawAddedText(
        ctx,
        api,
        'modeled driver ' + number(a.modeledDriver),
        1520,
        710,
        37,
        themeColors.pink,
        'center',
      );
    }
    if (currentBeat === 2) {
      drawAddedText(
        ctx,
        api,
        'Memory retained while waiting for CPU input',
        160,
        825,
        32,
        themeColors.ink,
      );
      drawAddedLine(ctx, api, 260, 920, 1640, 920, '#343943', 12);
      const busy = api.phase(v, 0.72, 0.9);
      if (busy > 0)
        drawAddedLine(ctx, api, 1280, 920, 1280 + 250 * busy, 920, themeColors.green, 12);
      drawAddedText(
        ctx,
        api,
        v < 0.72 ? 'compute idle' : 'short compute burst',
        1650,
        875,
        27,
        v < 0.72 ? themeColors.muted : themeColors.green,
        'right',
      );
    } else
      drawAddedText(
        ctx,
        api,
        currentBeat === 1
          ? 'Unused cache still held   ' + (a.reserved - a.allocated) + ' GiB'
          : 'One block represents one GiB',
        960,
        900,
        33,
        themeColors.ink,
        'center',
      );
    drawAddedNote(
      ctx,
      api,
      'This example includes one GiB outside the allocator for the CUDA context.',
    );
  });
}
export default {
  id: 'allocator-ledger',
  draw: drawAllocatorLedger,
  cues: ['allocator-counts', 'allocator-return', 'allocator-idle'],
};
