import { mix, warpSectors } from '../arithmetic.mjs';
import { sceneClock } from '../worksheet.mjs';
import { drawChapterText, drawNote, drawTitle } from '../defaults.mjs';
export function drawAddressOrder(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const clock = sceneClock(state);
  api.focus.target('address-order-construction', () => {
    if (currentBeat < 2) {
      const packed = clock.progress('kg-sector-packed', 0, 0.18, 0.33);
      const spaced = clock.progress('kg-sector-eight-byte', 0, 0.62, 0.77);
      const far = clock.progress('kg-sector-spread', 1, 0.19, 0.4);
      const stride = far > 0 ? 8 : spaced > 0 ? 2 : 1;
      const fraction = far > 0 ? far : spaced > 0 ? spaced : packed;
      const access = warpSectors(stride);
      const count = Math.ceil(32 * fraction);
      const offsets = new Set(access.addresses.slice(0, count));
      drawChapterText(ctx, api, 'One mark = one 4-byte load', 175, 277, 38, themeColors.cyan);
      drawChapterText(ctx, api, 'One box = one 32-byte sector', 1745, 277, 38, themeColors.ink, 'right');
      for (let sector = 0; sector < 32; sector++) {
        const x = 276 + (sector % 8) * 184;
        const y = 379 + Math.floor(sector / 8) * 107;
        if (sector % 8 === 0)
          drawChapterText(ctx, api, sector + '–' + (sector + 7), 241, y + 52, 31, themeColors.muted, 'right');
        api.rect(ctx, x, y, 164, 76, themeColors.panel, themeColors.muted, 4);
        for (let word = 0; word < 8; word++) {
          if (offsets.has(sector * 32 + word * 4))
            api.rect(ctx, x + 6 + word * 19, y + 17, 16, 42, themeColors.cyan, undefined, 2);
        }
      }
      drawChapterText(ctx, api, 'Start-to-start spacing    ' + (stride * 4) + ' bytes', 174, 886, 37, themeColors.ink);
      drawChapterText(ctx, api, count + ' / 32 lanes mapped', 1740, 886, 34, themeColors.muted, 'right');
      const answered = stride === 1 ? clock.after('kg-sector-four', 0, 0.39, 0.51)
        : stride === 2 ? clock.after('kg-sector-eight', 1, 0, 0.09)
        : clock.after('kg-sector-thirty-two', 1, 0.44, 0.57);
      const footer = answered ? access.sectors.length + ' requested sectors   ·   ' + access.usefulBytes + ' useful bytes'
        : stride === 2 && count === 32 ? 'How many sectors contain a load?' : 'Addresses are relative to a 32-byte-aligned base.';
      drawChapterText(ctx, api, footer, 960, 990, 40, themeColors.yellow, 'center');
    } else if (currentBeat === 2) {
      const ordering = clock.progress('kg-address-order-race', 2, 0.44, 0.58);
      const repaired = ordering === 1;
      drawTitle(
        ctx,
        api,
        'Two threads share one slot',
        'One block on one streaming multiprocessor',
      );
      api.line(ctx, 300, 580, 1650, 580, themeColors.muted, 2);
      api.line(ctx, 300, 780, 1650, 780, themeColors.muted, 2);
      drawChapterText(ctx, api, 'producer', 230, 580, 29, themeColors.blue, 'right');
      drawChapterText(ctx, api, 'consumer', 230, 780, 29, themeColors.pink, 'right');
      api.circle(ctx, 1050, 580, 12, themeColors.blue);
      drawChapterText(ctx, api, 'write 7', 1050, 505, 42, themeColors.blue, 'center');
      const readX = mix(700, 1490, ordering);
      api.circle(ctx, readX, 780, 12, repaired ? themeColors.green : themeColors.pink);
      drawChapterText(
        ctx,
        api,
        repaired ? 'read 7' : ordering > 0 ? 'move the read' : 'read too early',
        readX,
        865,
        40,
        repaired ? themeColors.green : themeColors.pink,
        'center',
      );
      if (repaired) {
        api.line(ctx, 1200, 525, 1200, 830, themeColors.yellow, 4);
        drawChapterText(ctx, api, 'synchronize', 1200, 435, 34, themeColors.yellow, 'center');
      }
      drawNote(ctx, api, 'Time increases from left to right');
    } else {
      const outside = clock.progress('kg-slot-outside', 3, 0.12, 0.23) > 0;
      const unwritten = clock.progress('kg-slot-unwritten', 3, 0.23, 0.30) > 0;
      const reducing = clock.progress('kg-slot-padding', 3, 0.43, 0.51) > 0;
      const ones = clock.after('kg-slot-ones', 3, 0.60, 0.67);
      const zeros = clock.after('kg-slot-zeros', 3, 0.75, 0.80);
      const left = 475, cell = 108;
      const squareTerms = [1, 2, 3, 4, 5].map(v => v * v);
      const terms = [...squareTerms, ...Array(3).fill(zeros ? 0 : 1)];
      const label = (str, x, y, size, color, align) => drawChapterText(ctx, api, str, x, y, size, color, align);
      const slot = (index, y, value, color) => {
        const x = left + index * cell;
        api.rect(ctx, x, y, cell - 6, 94, themeColors.panel, color, 4);
        if (value !== '') label(String(value), x + (cell - 6) / 2, y + 63, 42, color, 'center');
      };
      label('Slot index', 420, 316, 36, themeColors.muted, 'right');
      label('Allocation', 420, 437, 40, themeColors.ink, 'right');
      for (let i = 0; i < 8; i++) {
        label(String(i), left + i * cell + 51, 316, 34, themeColors.muted, 'center');
        slot(i, 373, '', themeColors.blue);
      }
      if (outside) {
        const tip = left + 8 * cell + 51;
        label('8', tip, 316, 34, themeColors.pink, 'center');
        api.arrow(ctx, tip, 478, tip, 381, themeColors.pink, 5);
        label('Outside', tip + 82, 437, 40, themeColors.pink);
      }
      if (unwritten) {
        label('Initialization', 420, 631, 40, themeColors.ink, 'right');
        for (let i = 0; i < 8; i++) slot(i, 567, i === 3 ? '?' : '', i === 3 ? themeColors.yellow : themeColors.blue);
        label('Slot 3 unwritten', 1400, 631, 37, themeColors.yellow);
      }
      if (reducing) {
        label('Squared terms', 420, 825, 40, themeColors.ink, 'right');
        terms.forEach((value, i) => slot(i, 761, i < 5 || ones ? value : '', i < 5 ? themeColors.cyan : zeros ? themeColors.green : themeColors.pink));
        if (ones) label('Sum   ' + terms.reduce((a, b) => a + b, 0), 1400, 825, 44, zeros ? themeColors.green : themeColors.pink);
        label('Padded lanes', left + 6.5 * cell, 928, 35, themeColors.muted, 'center');
      }
    }
  });
}
export default {
  id: 'address-order',
  draw: drawAddressOrder,
  cues: [
    'kg-sector-packed', 'kg-sector-four', 'kg-sector-eight-byte',
    'kg-sector-eight', 'kg-sector-spread', 'kg-sector-thirty-two',
    'kg-address-order-race',
    'kg-address-order-voice-2', 'kg-address-order-voice-3',
    'kg-slot-outside', 'kg-slot-unwritten', 'kg-slot-padding', 'kg-slot-ones', 'kg-slot-zeros',
  ],
};
