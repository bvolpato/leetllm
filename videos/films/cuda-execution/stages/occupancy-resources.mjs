import { residentResources, tileReuse } from '../arithmetic.mjs';
import { tokenValues } from '../fixtures.mjs';
import { clamp, mix } from '../construction.mjs';
import {
  drawAddedAnimate,
  drawAddedCell,
  drawAddedLine,
  drawAddedNote,
  drawAddedP,
  drawAddedText,
} from '../defaults.mjs';
export function drawOccupancyResources(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawAddedP(ctx, api, id) === 1,
    v = drawAddedP(ctx, api, 'occupancy-reuse');
  const number = (value) => (Number.isInteger(value) ? String(value) : value.toPrecision(5));
  api.focus.target('occupancy-resources-construction', () => {
    if (currentBeat === 2) {
      drawAddedText(
        ctx,
        api,
        'Keep the larger tile   /   two passes over eight values',
        160,
        285,
        31,
        themeColors.cyan,
      );
      drawAddedText(ctx, api, '16 / 64 resident warps', 180, 400, 32, themeColors.blue);
      for (let i = 0; i < 64; i++)
        api.rect(
          ctx,
          190 + (i % 8) * 68,
          465 + Math.floor(i / 8) * 48,
          51,
          31,
          i < 16 ? themeColors.blue : themeColors.panel,
          i < 16 ? themeColors.blue : '#343943',
          2,
        );
      drawAddedText(ctx, api, '25% occupancy', 440, 930, 38, themeColors.blue, 'center');
      const load = api.phase(v, 0, 0.45),
        read = api.phase(v, 0.45, 1),
        model = tileReuse(tokenValues, 2, true);
      drawAddedText(ctx, api, 'global values', 900, 330, 29, themeColors.blue);
      drawAddedText(ctx, api, 'block-shared tile', 900, 595, 29, themeColors.cyan);
      const completed = Math.min(16, Math.floor(read * 16)),
        current = completed === 16 ? -1 : completed % 8;
      tokenValues.forEach((value, i) => {
        const x = 900 + i * 105,
          q = drawAddedAnimate(ctx, api, load, i, 8);
        drawAddedText(ctx, api, 'T' + i, x + 42, 370, 22, themeColors.muted, 'center');
        drawAddedCell(ctx, api, value, x, 390, 85, 65, themeColors.blue, 29);
        drawAddedCell(ctx, api, q === 1 ? value : '?', x, 620, 85, 65, themeColors.cyan, 29);
        if (q > 0 && q < 1)
          drawAddedText(
            ctx,
            api,
            value,
            x + 42,
            mix(485, 565, q),
            27,
            themeColors.yellow,
            'center',
          );
        if (read > 0 && current === i)
          api.rect(ctx, x - 5, 615, 95, 75, 'transparent', themeColors.yellow, 4);
        model.reads.forEach((pass, j) => {
          const progress = clamp(read * 16 - (j * 8 + i)),
            y = 765 + j * 100;
          if (progress > 0) {
            drawAddedCell(
              ctx,
              api,
              pass[i].value,
              x,
              y,
              85,
              65,
              progress === 1 ? themeColors.yellow : themeColors.muted,
              29,
            );
            if (progress < 1)
              drawAddedLine(ctx, api, x, y + 72, x + 85 * progress, y + 72, themeColors.yellow, 4);
          }
        });
      });
      drawAddedText(ctx, api, 'pass 1', 870, 805, 27, themeColors.yellow, 'right');
      drawAddedText(ctx, api, 'pass 2', 870, 905, 27, themeColors.yellow, 'right');
      drawAddedText(
        ctx,
        api,
        Math.min(8, Math.floor(load * 8)) +
          ' global loads · ' +
          completed +
          ' / ' +
          model.sharedReads +
          ' shared reads',
        1330,
        975,
        29,
        completed === 16 ? themeColors.green : themeColors.yellow,
        'center',
      );
      drawAddedNote(
        ctx,
        api,
        'Both passes read the same tile.',
      );
      return;
    }
    const p = currentBeat === 1 ? drawAddedP(ctx, api, 'occupancy-two') : 0,
      shared = currentBeat === 0 ? 16 : mix(16, 32, p),
      resources = residentResources(shared),
      resident =
        currentBeat === 0
          ? Math.floor(drawAddedP(ctx, api, 'occupancy-block') * 8)
          : p > 0
            ? resources.warps
            : 8 + 8 * Math.floor(drawAddedP(ctx, api, 'occupancy-four') * 3);
    drawAddedText(
      ctx,
      api,
      'Hypothetical SM · 64 warp slots / 64 KiB shared',
      160,
      285,
      33,
      themeColors.cyan,
    );
    for (let i = 0; i < 64; i++) {
      const x = 220 + (i % 16) * 88,
        y = 430 + Math.floor(i / 16) * 83;
      api.rect(
        ctx,
        x,
        y,
        73,
        55,
        i < resident ? (i < 8 ? themeColors.cyan : themeColors.blue) : themeColors.panel,
        i < resident ? themeColors.blue : '#343943',
        2,
      );
      if (i % 16 === 0)
        drawAddedText(ctx, api, i + '–' + (i + 15), 195, y + 38, 22, themeColors.muted, 'right');
    }
    drawAddedText(ctx, api, 'resident warp slots', 220, 815, 29, themeColors.muted);
    drawAddedText(ctx, api, resident + ' / 64', 1430, 815, 44, themeColors.blue, 'center');
    if (currentBeat === 0) {
      if (done('occupancy-block')) {
        drawAddedText(ctx, api, '256 threads → 8 warps', 320, 930, 33, themeColors.cyan);
        drawAddedText(ctx, api, '256 × 32 = 8,192 registers', 1100, 930, 33, themeColors.yellow);
      }
    } else {
      const n = resident / 8;
      if (currentBeat === 1) {
        drawAddedText(
          ctx,
          api,
          n + ' resident blocks × ' + number(shared) + ' KiB shared',
          260,
          920,
          32,
          themeColors.yellow,
        );
        if (done('occupancy-four') || done('occupancy-two'))
          drawAddedText(
            ctx,
            api,
            Math.round((resident / 64) * 100) + '% occupancy',
            1450,
            920,
            35,
            themeColors.green,
            'center',
          );
      }
    }
    drawAddedNote(
      ctx,
      api,
      'Each square is one resident warp slot on this SM.',
    );
  });
}
export default {
  id: 'occupancy-resources',
  draw: drawOccupancyResources,
  cues: ['occupancy-block', 'occupancy-four', 'occupancy-two', 'occupancy-reuse'],
};
