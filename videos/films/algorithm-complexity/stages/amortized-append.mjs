import { lerp, q, smooth } from '../construction.mjs';
import { appendSnapshot } from '../model.mjs';
import { box, focus, math, text } from '../defaults.mjs';
export function drawAmortizedAppend(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  {
    const s = appendSnapshot(state);
    focus(ctx, api, themeColors, 'append-work', () => {
      text(ctx, api, themeColors, 'Array references · doubling capacity', 960, 270, 38);
      for (const block of s.blocks) {
        text(ctx, api, themeColors, 'Allocated', 125, block.y + 35, 31, themeColors.muted);
        text(
          ctx,
          api,
          themeColors,
          'capacity ' + block.capacity,
          125,
          block.y + 80,
          31,
          themeColors.muted,
        );
        for (let i = 0; i < block.capacity; i++)
          box(
            ctx,
            api,
            themeColors,
            i < block.values.length ? 'note ' + block.values[i] : '',
            225 + i * 185,
            block.y,
            160,
            100,
            i < block.values.length ? themeColors.blue : themeColors.muted,
            29,
          );
      }
      if (s.active && s.travel > 0) {
        const e = s.active,
          x = 305 + e.slot * 185,
          down = e.destinationY > e.sourceY;
        const fromY = e.type === 'copy' ? e.sourceY + (down ? 120 : -20) : e.destinationY - 100,
          toY = e.destinationY + (down ? -20 : 120),
          y = lerp(fromY, toY, smooth(s.travel));
        api.rect(ctx, x - 13, y - 13, 26, 26, themeColors.yellow);
        text(
          ctx,
          api,
          themeColors,
          (e.type === 'copy' ? 'Copy existing reference ' : 'Append new reference ') + e.value,
          960,
          850,
          33,
          themeColors.yellow,
        );
      } else
        text(
          ctx,
          api,
          themeColors,
          s.completed === 12
            ? 'Eight references stored'
            : 'Existing references remain while a new block is filled',
          960,
          850,
          31,
          themeColors.muted,
        );
    });
    focus(ctx, api, themeColors, 'append-total', () => {
      text(
        ctx,
        api,
        themeColors,
        'Writes including copies: ' + s.totalWrites,
        960,
        920,
        40,
        themeColors.yellow,
      );
      if (q(state, 'append-bound', 1) === 1)
        math(
          ctx,
          api,
          themeColors,
          String.raw`W_{\mathrm{total}}(n)<3n\quad\Rightarrow\quad O(1)\;\text{amortized per append}`,
          960,
          1020,
          35,
          themeColors.green,
        );
    });
  }
}
export default {
  id: 'amortized-append',
  draw: drawAmortizedAppend,
  cues: ['append-resize', 'append-sequence', 'append-total', 'append-bound'],
};
