import { batchComparison } from '../batch.mjs';
import { drawLeftText, drawText } from '../defaults.mjs';
import { operationProgress, resultAfter } from '../../../lib/lesson-definition.mjs';

const short = batchComparison(2, 4);
const slotWidth = 408;
const left = 140;

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  // The zeros are already falling when the global opening cuts to this canvas.
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const counted = operationProgress(state, 'intro-all');
  const masked = operationProgress(state, 'intro-divisor');
  const validCount = short.loss.count;
  const slots = short.batch.length;
  const extra = slots - validCount;
  const bracketWidth = (validCount + extra * (counted - masked)) * slotWidth;

  drawLeftText(ctx, api, 'Squared error per row', left, 270, 38, C.ink);
  short.batch.forEach((row, i) => {
    const x = left + (i + 0.5) * slotWidth;
    const color = row.valid ? C.cyan : C.blue;
    api.focus.target(row.valid ? 'example-' + i : 'padding-' + i, () => {
      if (row.valid) {
        const side = Math.sqrt(row.squared);
        for (let r = 0; r < side; r++) {
          for (let c = 0; c < side; c++) {
            api.rect(
              ctx,
              x - 12 - (side - c) * 81,
              508 - side * 40.5 + r * 81,
              74,
              74,
              color,
              null,
              0,
              4,
            );
          }
        }
        drawText(ctx, api, row.squared, x + 77, 544, 104, C.ink);
      } else {
        const descent = Math.max(0, Math.min(1, state.t / 1.15 + 0.12 * (slots - i)));
        const y = 508 - 147 * (1 - descent * descent);
        api.circle(ctx, x, y, 78, C.panel, color, 5);
        drawText(ctx, api, row.squared, x, y + 34, 96, color);
      }
      api.line(ctx, x - 180, 604, x + 180, 604, color, 3);
      drawText(
        ctx,
        api,
        row.valid
          ? 'Pred ' + row.prediction + '   ·   Target ' + String(row.y).replace('-', '−')
          : 'Padding',
        x,
        660,
        33,
        color,
      );
    });
  });
  api.focus.target('counted-rows', () => {
    api.line(ctx, left, 690, left, 713, C.yellow, 5);
    api.line(ctx, left, 713, left + bracketWidth, 713, C.yellow, 5);
    api.line(ctx, left + bracketWidth, 713, left + bracketWidth, 690, C.yellow, 5);
  });

  api.focus.target('real-mean', () => {
    drawLeftText(ctx, api, 'Two real examples', left, 830, 37, C.cyan);
    drawLeftText(
      ctx,
      api,
      short.loss.sum + ' ÷ ' + validCount + ' = ' + short.loss.masked,
      left,
      951,
      85,
      C.ink,
    );
  });
  api.focus.target('logged-mean', () => {
    const repaired = resultAfter(state, 'intro-divisor');
    const reported = resultAfter(state, 'intro-report');
    drawLeftText(
      ctx,
      api,
      repaired ? 'Log · mean over real examples' : 'Log · mean over all four slots',
      986,
      830,
      37,
      C.yellow,
    );
    let expression = 'losses.mean() = ?';
    if (repaired) {
      const answer = resultAfter(state, 'intro-restore') ? short.loss.masked : '?';
      expression = short.loss.sum + ' ÷ ' + validCount + ' = ' + answer;
    } else if (counted === 1) {
      expression = short.loss.sum + ' ÷ ' + slots + ' = ' + (reported ? short.loss.naive : '?');
    }
    drawLeftText(ctx, api, expression, 986, 951, 77, C.ink);
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-pad',
    'intro-square',
    'intro-mean',
    'intro-all',
    'intro-report',
    'intro-divisor',
    'intro-restore',
  ],
};
