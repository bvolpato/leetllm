import { exampleGradients } from '../arithmetic.mjs';
import { history, rows } from '../fixtures.mjs';
import { drawLeftText, drawText } from '../defaults.mjs';
import { operationProgress, resultAfter } from '../../../lib/lesson-definition.mjs';

const perExample = exampleGradients();
export function drawGradient(ctx, scene, state, api) {
  const { C } = api;
  const mean = history[0].gradient;
  if (state.beat === 0) {
    const build = operationProgress(state, 'gradient-row');
    const average = resultAfter(state, 'gradient-mean');
    drawLeftText(ctx, api, 'At zero weights and bias', 110, 257, 38, C.ink);
    drawLeftText(ctx, api, 'Row', 115, 363, 30, C.muted);
    drawLeftText(ctx, api, '2 × residual × first feature', 362, 363, 30, C.muted);
    drawText(ctx, api, 'Contribution to the first weight', 1385, 363, 30, C.muted);
    api.focus.target('gradient-rows', () => {
      perExample.forEach((g, i) => {
        const y = 457 + i * 102;
        const color = i === 3 ? C.yellow : C.cyan;
        drawLeftText(ctx, api, '[' + rows[i].x.join(', ') + ']', 115, y, 40, C.blue);
        drawLeftText(ctx, api, '2 × (' + -rows[i].y + ') × ' + rows[i].x[0], 370, y, 42, C.ink);
        const end = 1575 + 43 * g[0];
        api.line(ctx, 1020, y - 13, 1575, y - 13, C.muted, 2);
        const p = i === 3 ? build : 1;
        const x = 1575 + (end - 1575) * p;
        api.line(ctx, 1575, y - 13, x, y - 13, color, 8);
        api.circle(ctx, x, y - 13, 9, color);
        drawText(ctx, api, p < 1 ? '?' : g[0], 1705, y, 45, color);
      });
    });
    api.focus.target('gradient-result', () =>
      drawLeftText(
        ctx,
        api,
        'Mean     (−4 + 0 − 2 ' +
          (build === 1 ? '− 12' : '+ ?') +
          ') / 4 = ' +
          (average ? mean[0] : '?'),
        115,
        938,
        51,
        C.ink,
      ),
    );
    return;
  }
  api.focus.target('gradient-update', () => {
    const returned = resultAfter(state, 'gradient-step');
    ['Leaf', 'Gradient', 'Update at learning rate 0.05', 'New value'].forEach((s, j) =>
      drawLeftText(ctx, api, s, [112, 510, 818, 1490][j], 336, 32, C.muted),
    );
    ['Weight 0', 'Weight 1', 'Bias'].forEach((label, j) => {
      const y = 475 + 150 * j;
      drawLeftText(ctx, api, label, 112, y, 47, C.blue);
      drawLeftText(ctx, api, mean[j], 510, y, 47, C.cyan);
      drawLeftText(ctx, api, '0 − 0.05 × (' + mean[j] + ')', 818, y, 45, C.ink);
      drawLeftText(ctx, api, returned ? history[1].p[j].toFixed(3) : '?', 1490, y, 53, C.yellow);
    });
    api.text(
      ctx,
      'value_and_grad(batch_loss)   →   (loss, gradient tree)',
      114,
      945,
      38,
      C.ink,
      'left',
      'mono',
    );
  });
}
export default {
  id: 'gradient',
  draw: drawGradient,
  cues: ['gradient-row', 'gradient-mean', 'gradient-step'],
};
