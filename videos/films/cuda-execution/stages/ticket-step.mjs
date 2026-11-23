import { directed, mix } from '../construction.mjs';
import { sum } from '../arithmetic.mjs';
import { tokenValues } from '../fixtures.mjs';
import {
  drawAddedAnimate,
  drawAddedArrow,
  drawAddedCell,
  drawAddedLine,
  drawAddedNote,
  drawAddedP,
  drawAddedText,
} from '../defaults.mjs';
export function drawTicketStep(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawAddedP(ctx, api, id) === 1;
  api.focus.target('ticket-step-construction', () => {
    if (currentBeat === 0) {
      drawAddedText(
        ctx,
        api,
        'Same token owners · add feature and ticket axes',
        160,
        285,
        33,
        themeColors.cyan,
      );
      const p = drawAddedP(ctx, api, 'ticket-pool'),
        gx = 210,
        gy = 420,
        cw = 43,
        rh = 48,
        completed = Math.min(8, Math.floor(p * 8)),
        partial = sum(tokenValues.slice(0, completed));
      for (let layer = 3; layer >= 0; layer--) {
        const ox = layer * 18,
          oy = -layer * 24,
          xx = 210 + ox - 12,
          yy = 420 + oy - 15;
        if (layer) {
          drawAddedLine(ctx, api, xx, yy, xx + 16 * 43 + 24, yy, themeColors.muted, 2);
          drawAddedLine(
            ctx,
            api,
            xx + 16 * 43 + 24,
            yy,
            xx + 16 * 43 + 24,
            yy + 8 * 48 + 30,
            themeColors.muted,
            2,
          );
        } else
          api.rect(ctx, xx, yy, 16 * 43 + 24, 8 * 48 + 30, themeColors.panel, themeColors.blue, 2);
        if (layer === 0)
          for (let row = 0; row < 8; row++)
            for (let col = 0; col < 16; col++) {
              const yy = 420 + row * 48,
                color =
                  col === 0 ? (row < completed ? themeColors.yellow : themeColors.cyan) : '#343943';
              api.rect(ctx, 210 + col * 43, yy, 43 - 3, 48 - 3, themeColors.panel, color, 1);
              if (col === 0)
                drawAddedText(
                  ctx,
                  api,
                  tokenValues[row],
                  210 + 43 / 2,
                  yy + 33,
                  25,
                  color,
                  'center',
                );
            }
      }
      drawAddedText(ctx, api, '4 tickets × 8 tokens × 16 features', 190, 895, 29, themeColors.blue);
      if (p > 0) {
        drawAddedArrow(ctx, api, 990, 590, 1150, 590, themeColors.cyan);
        for (let ticket = 0; ticket < 4; ticket++)
          for (let col = 0; col < 16; col++)
            api.rect(
              ctx,
              1190 + col * 29,
              440 + ticket * 75,
              26,
              58,
              themeColors.panel,
              col === 0 ? themeColors.cyan : '#343943',
              1,
            );
        if (done('ticket-pool'))
          drawAddedText(ctx, api, '4 × 16', 1410, 815, 39, themeColors.green, 'center');
      }
      if (p > 0)
        drawAddedText(
          ctx,
          api,
          done('ticket-pool')
            ? 'Worked feature 0: 21 ÷ 8 = 2.625'
            : 'Feature 0: ' + completed + ' / 8 inputs · partial sum ' + partial,
          190,
          960,
          31,
          done('ticket-pool') ? themeColors.green : themeColors.yellow,
        );
      if (done('ticket-logits')) {
        drawAddedText(ctx, api, 'W: 3 × 16 · bias: 3', 1250, 900, 30, themeColors.yellow, 'center');
        drawAddedText(
          ctx,
          api,
          '51 parameters → logits 4 × 3',
          1250,
          960,
          32,
          themeColors.green,
          'center',
        );
      }
      drawAddedNote(ctx, api, 'Each pooled feature averages its own eight token positions.');
    } else if (currentBeat < 3) {
      const repair = directed(state, 'ticket-move-labels', 2);
      const failed = directed(state, 'ticket-label-failure', 1) === 1 && repair < 1;
      api.focus.target('tensor-sizes', () => {
        const known = directed(state, 'ticket-byte-count', 1) === 1;
        const shapes = [['input', [4, 8, 16]], ['pooled', [4, 16]], ['logits', [4, 3]]];
        shapes.forEach(([label, dims], i) => {
          const x = 175 + i * 570;
          const bytes = 4 * dims.reduce((a, b) => a * b);
          drawAddedText(ctx, api, label + '   ' + dims.join(' × '), x, 280, 34, themeColors.ink);
          drawAddedText(ctx, api, known ? 'FP32   ' + bytes.toLocaleString('en') + ' B' : '? B', x, 353, 38, themeColors.cyan);
        });
      });
      drawAddedText(ctx, api, 'CPU', 155, 550, 37, themeColors.blue);
      drawAddedText(ctx, api, 'cuda:0', 155, 785, 37, themeColors.cyan);
      drawAddedLine(ctx, api, 150, 626, 1750, 626, themeColors.muted, 2);
      drawAddedCell(ctx, api, 'model', 360, 710, 210, 100, themeColors.cyan, 32);
      drawAddedCell(ctx, api, 'features', 625, 710, 245, 100, themeColors.cyan, 32);
      api.focus.target('ticket-labels', () => {
        drawAddedCell(ctx, api, 'labels [0, 2, 1, 0]', 965, 470, 355, 100, themeColors.blue, 28);
        if (directed(state, 'ticket-label-bytes', 1, 0.42, 0.59) === 1)
          drawAddedText(ctx, api, 'int64   4 × 8 B = 32 B', 1142, 445, 29, themeColors.blue, 'center');
        if (repair > 0 && repair < 1)
          drawAddedCell(ctx, api, '[0, 2, 1, 0]', 1030, mix(580, 655, repair),
            225, 45, themeColors.cyan, 24);
        if (repair === 1)
          drawAddedCell(ctx, api, 'labels [0, 2, 1, 0]', 965, 710, 355, 100, themeColors.cyan, 28);
      });
      api.focus.target('loss-input', () => {
        const color = failed ? themeColors.pink : repair === 1 ? themeColors.green : themeColors.muted;
        drawAddedCell(ctx, api, 'loss', 1450, 710, 240, 100, color, 35);
        if (failed)
          drawAddedText(ctx, api, 'device mismatch', 1568, 887, 30, color, 'center');
        if (repair === 1)
          drawAddedArrow(ctx, api, 1344, 760, 1425, 760, color);
      });
    } else {
      drawAddedText(
        ctx,
        api,
        'One optimizer step on the four tickets',
        160,
        285,
        32,
        themeColors.cyan,
      );
      const stages = [
        'same device',
        'logits 4 × 3',
        'cross-entropy',
        'backward',
        'finite gradients',
        'SGD update',
      ];
      stages.forEach((s, i) => {
        const x = 180 + (i % 3) * 540,
          y = 430 + Math.floor(i / 3) * 260,
          q = drawAddedAnimate(ctx, api, drawAddedP(ctx, api, 'ticket-complete'), i, 6);
        drawAddedText(ctx, api, i + 1, x, y, 29, themeColors.muted);
        drawAddedLine(
          ctx,
          api,
          x + 60,
          y + 20,
          x + 450,
          y + 20,
          q === 1 ? themeColors.green : '#343943',
          5,
        );
        drawAddedText(
          ctx,
          api,
          s,
          x + 60,
          y + 95,
          31,
          q === 1 ? themeColors.green : themeColors.muted,
        );
        if (i < 5 && q === 1)
          drawAddedArrow(ctx, api, x + 465, y + 20, x + 510, y + 20, themeColors.green);
      });
      if (done('ticket-complete'))
        drawAddedText(
          ctx,
          api,
          'Weights updated',
          960,
          940,
          41,
          themeColors.green,
          'center',
        );
      drawAddedNote(
        ctx,
        api,
        'Random features test the training step. Classifier quality needs labeled evaluation data.',
      );
    }
  });
}
export default {
  id: 'ticket-step',
  draw: drawTicketStep,
  cues: ['ticket-pool', 'ticket-logits', 'ticket-byte-count', 'ticket-label-bytes', 'ticket-label-failure', 'ticket-move-labels', 'ticket-complete'],
};
