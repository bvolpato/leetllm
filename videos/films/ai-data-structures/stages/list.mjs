import { clamp, mix, smooth } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import {
  drawCaption,
  drawCard,
  drawEquation,
  drawReference,
  drawText,
  withFocus,
} from '../defaults.mjs';
export function drawList(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (id, beat = 0, start, end) => q(state, id, beat, start, end);
  {
    const gap = 285,
      x0 = 180;
    if (currentBeat === 0) {
      drawText(ctx, api, 'List slots', 180, 330, 30, themeColors.muted);
      for (let id = 0; id < 3; id++)
        withFocus(ctx, api, 'list-ref-' + id, () => {
          drawReference(ctx, api, id, x0 + id * gap, 480);
          drawText(
            ctx,
            api,
            'slot ' + id,
            x0 + id * gap + 115,
            610,
            28,
            themeColors.muted,
            'center',
          );
        });
      drawCaption(ctx, api, 'Stable message identity; current list position', themeColors.cyan);
    } else if (currentBeat === 1) {
      const grow = progress('list-grow', 1),
        append = progress('list-append', 1, 0.68, 0.88),
        seat = grow >= 0.98 ? append : 0;
      const sourceX = 1260,
        sourceY = 385,
        destinationX = 960,
        destinationY = 630,
        oldAlpha = 1 - smooth(clamp((grow - 0.92) / 0.08));
      withFocus(ctx, api, 'list-storage', () => {
        drawText(
          ctx,
          api,
          grow >= 0.98 ? 'Old array · released' : 'Old array · full · 3 slots',
          180,
          345,
          29,
          grow >= 0.98 ? themeColors.muted : themeColors.cyan,
        );
        api.line(ctx, 170, 360, 940, 360, grow >= 0.98 ? themeColors.muted : themeColors.cyan, 2);
        drawText(ctx, api, 'Larger array · 6 slots', 1710, 585, 29, themeColors.muted, 'right');
        api.line(ctx, 170, 610, 1730, 610, themeColors.muted, 2);
        for (let slot = 0; slot < 3; slot++) {
          drawCard(ctx, api, '', 180 + slot * 260, 385, 230, 78, themeColors.muted);
        }
        for (let slot = 0; slot < 6; slot++) {
          drawCard(
            ctx,
            api,
            '',
            180 + slot * 260,
            630,
            230,
            78,
            slot === 3 && seat >= 0.98 ? themeColors.green : themeColors.muted,
          );
          drawText(
            ctx,
            api,
            'slot ' + slot,
            180 + slot * 260 + 115,
            734,
            23,
            slot === 3 && seat >= 0.98 ? themeColors.green : themeColors.muted,
            'center',
          );
        }
        for (let id = 0; id < 3; id++) {
          const x = 180 + id * 260,
            copy = clamp((grow - id * 0.18) / 0.56),
            copyY = mix(sourceY + 82, destinationY, copy);
          withFocus(ctx, api, 'list-old-ref-' + id, () =>
            drawReference(ctx, api, id, x, sourceY, themeColors.cyan, oldAlpha),
          );
          if (copy > 0.08) {
            if (copyY > sourceY + 96)
              api.arrow(ctx, x + 115, sourceY + 78, x + 115, copyY, themeColors.green, 3);
            withFocus(ctx, api, 'list-copy-ref-' + id, () =>
              drawReference(ctx, api, id, x, copyY, themeColors.green, clamp(copy * 4)),
            );
          }
        }
      });
      withFocus(ctx, api, 'list-ref-3', () => {
        const x = mix(sourceX, destinationX, seat),
          y = mix(sourceY, destinationY, seat);
        drawReference(ctx, api, 3, x, y, themeColors.green);
        if (seat < 0.98)
          drawText(
            ctx,
            api,
            'Incoming reference',
            x + 115,
            y - 28,
            25,
            themeColors.green,
            'center',
          );
      });
      drawText(
        ctx,
        api,
        'Completed copies: ' +
          [0, 1, 2].filter((id) => clamp((grow - id * 0.18) / 0.56) >= 0.98).length +
          ' / 3',
        530,
        850,
        30,
        themeColors.green,
        'center',
      );
      drawText(
        ctx,
        api,
        'New append stored: ' + Number(seat >= 0.98) + ' / 1',
        1370,
        850,
        30,
        themeColors.cyan,
        'center',
      );
      drawCaption(
        ctx,
        api,
        'Copy the three old references first; then append M3',
        themeColors.cyan,
      );
    } else {
      const shift = progress('list-shift', 2);
      withFocus(ctx, api, 'list-reference-row', () => {
        for (let id = 0; id < 4; id++)
          withFocus(ctx, api, 'list-ref-' + id, () => {
            const x = x0 + (id + shift) * gap;
            drawReference(ctx, api, id, x, 520, themeColors.yellow);
            drawText(
              ctx,
              api,
              shift < 0.02
                ? 'slot ' + id
                : shift > 0.98
                  ? 'slot ' + (id + 1)
                  : id + ' → ' + (id + 1),
              x + 115,
              670,
              28,
              themeColors.muted,
              'center',
            );
          });
        if (shift > 0.84) {
          const p = clamp((shift - 0.84) / 0.16);
          drawReference(ctx, api, 4, x0, mix(310, 520, p), themeColors.green);
          drawText(ctx, api, 'New request', x0 + 115, 745, 26, themeColors.green, 'center');
        }
      });
      drawEquation(
        ctx,
        api,
        'T_{\\mathrm{front\\ insert}}=\\Theta(n)',
        960,
        900,
        46,
        themeColors.yellow,
      );
    }
  }
}
export default {
  id: 'list',
  draw: drawList,
  cues: ['list-read', 'list-grow', 'list-append', 'list-shift'],
};
