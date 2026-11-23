import { directed } from '../construction.mjs';
import {
  drawAddedEquation,
  drawAddedLine,
  drawAddedNote,
  drawAddedP,
  drawAddedText,
} from '../defaults.mjs';
export function drawActivationBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawAddedP(ctx, api, id) === 1;
  api.focus.target('activation-budget-construction', () => {
    if (currentBeat === 0) {
      drawAddedText(
        ctx,
        api,
        'One input batch in float32',
        160,
        285,
        33,
        themeColors.cyan,
      );
      const count = 32 * 128 * 768,
        p = drawAddedP(ctx, api, 'activation-input');
      const dimensions = [
        ['batch', 32],
        ['tokens', 128],
        ['features', 768],
      ];
      dimensions.forEach(([label, n], i) => {
        const x = 200 + i * 540;
        drawAddedText(ctx, api, label, x, 440, 29, themeColors.muted);
        drawAddedText(
          ctx,
          api,
          n,
          x,
          545,
          61,
          [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
        );
        if (i < 2) drawAddedText(ctx, api, '×', x + 330, 545, 50, themeColors.muted);
      });
      if (done('activation-input'))
        drawAddedEquation(
          ctx,
          api,
          '32\\times128\\times768\\times4=12\\;\\mathrm{MiB}',
          960,
          750,
          53,
          themeColors.green,
        );
      if (done('activation-input')) {
        drawAddedLine(ctx, api, 250, 880, 1630, 880, themeColors.muted, 3);
        ['input', 'saved activations', 'workspace', 'optimizer states'].forEach((s, i) =>
          drawAddedText(
            ctx,
            api,
            s,
            220 + i * 415,
            950,
            27,
            i ? themeColors.yellow : themeColors.blue,
          ),
        );
      }
      drawAddedNote(
        ctx,
        api,
        'The actual input has ' +
          count.toLocaleString('en') +
          ' elements. Backward also needs saved activations.',
      );
    } else if (currentBeat <= 2) {
      const halfBatch = directed(state, 'activation-halving', 2);
      const halfLength = directed(state, 'activation-length', 2);
      const planes = 4 - Math.round(2 * halfBatch);
      const side = 8 - Math.round(4 * halfLength);
      drawAddedText(ctx, api, 'Stored attention scores   /   one head, one layer', 160, 280, 36, themeColors.ink);
      for (const [panel, label] of ['Halve the batch', 'Halve the length'].entries()) {
        const x = 190 + panel * 842;
        const color = panel === 0 ? themeColors.cyan : themeColors.yellow;
        drawAddedText(ctx, api, label, x, 380, 37, color);
        api.focus.target(panel === 0 ? 'batch-grids' : 'length-grids', () => {
          for (let b = 0; b < 4; b++) {
            const left = x + (b % 2) * 244, top = 430 + Math.floor(b / 2) * 210;
            api.rect(ctx, left - 4, top - 4, 187, 187, themeColors.panel, themeColors.muted, 0);
            for (let q = 0; q < 8; q++) {
              for (let k = 0; k < 8; k++) {
                const keep = panel === 0 ? b < planes : q < side && k < side;
                if (keep) api.rect(ctx, left + k * 23, top + q * 23, 19, 19, color, undefined, 0);
              }
            }
          }
        });
        const count = panel === 0 ? planes * 8 * 8 : 4 * side * side;
        drawAddedText(ctx, api, count + ' scores', x, 930, 41, color);
      }
      drawAddedNote(ctx, api, 'Each square is one query position paired with one key position.');
    } else {
      drawAddedText(
        ctx,
        api,
        'If the backend stores every score   /   two bytes per score',
        160,
        285,
        33,
        themeColors.cyan,
      );
      const p = drawAddedP(ctx, api, 'activation-large-grid'),
        counts = [
          ['B', 32],
          ['heads', 12],
          ['layers', 12],
          ['query T', 2048],
          ['key T', 2048],
          ['bytes', 2],
        ];
      counts.forEach(([label, value], i) => {
        const x = 170 + (i % 3) * 560,
          y = 420 + Math.floor(i / 3) * 210;
        drawAddedText(ctx, api, label, x, y, 28, themeColors.muted);
        if (p > (i + 1) / 8)
          drawAddedText(
            ctx,
            api,
            value,
            x,
            y + 90,
            48,
            [themeColors.blue, themeColors.cyan, themeColors.yellow][i % 3],
          );
      });
      if (done('activation-large-grid'))
        drawAddedEquation(
          ctx,
          api,
          '32\\times12\\times12\\times2048^2\\times2\\approx38.7\\;\\mathrm{GB}',
          960,
          900,
          48,
          themeColors.green,
        );
      drawAddedNote(
        ctx,
        api,
        'Memory-efficient attention can avoid allocating this full grid.',
      );
    }
  });
}
export default {
  id: 'activation-budget',
  draw: drawActivationBudget,
  cues: ['activation-input', 'activation-grid', 'activation-halving', 'activation-length', 'activation-large-grid'],
};
