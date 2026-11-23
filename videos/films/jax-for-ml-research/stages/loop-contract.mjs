import { doublingTraces } from '../arithmetic.mjs';
import { drawLeftText, drawText } from '../defaults.mjs';
import { operationProgress, resultAfter } from '../../../lib/lesson-definition.mjs';

export function drawLoopContract(ctx, scene, state, api) {
  const { C } = api;
  const changed = operationProgress(state, 'loop-input-three') > 0;
  const start = changed ? 3 : 1;
  const trace = doublingTraces(start);
  const built = operationProgress(state, 'loop-eight');
  const whileDone = resultAfter(state, 'loop-twelve');
  const scanDone = resultAfter(state, 'scan-twenty-four');
  const xs = [607, 950, 1293, 1636];
  api.focus.target('loop-traces', () => {
    drawLeftText(ctx, api, 'Starting value    ' + start, 112, 288, 48, C.ink);
    ['Input', 'First double', 'Second double', 'Third double'].forEach((s, i) =>
      drawText(ctx, api, s, xs[i], 408, 31, C.muted),
    );
    for (const [i, values] of [trace.dynamic, trace.fixed].entries()) {
      const y = 560 + 193 * i,
        color = i ? C.cyan : C.blue;
      drawLeftText(ctx, api, i ? 'Exactly 3 steps' : 'While value < 8', 112, y + 13, 41, color);
      xs.forEach((x, j) => {
        if (j >= values.length && whileDone) {
          drawText(ctx, api, 'stopped', x, y + 13, 39, C.muted);
          return;
        }
        const shown = !changed
          ? j <= Math.floor(built * 3)
          : j === 0 || (whileDone && j <= 2) || scanDone;
        if (j && shown) api.arrow(ctx, xs[j - 1] + 70, y, x - 70, y, color, 5);
        drawText(ctx, api, shown ? values[j] : '?', x, y + 15, 57, shown ? color : C.muted);
      });
    }
  });
  api.focus.target('loop-derivative', () => {
    drawLeftText(
      ctx,
      api,
      resultAfter(state, 'scan-derivative')
        ? 'Three fixed doublings     derivative = 2 × 2 × 2 = ' + trace.derivative
        : 'Each loop iteration returns the same shapes and dtypes.',
      112,
      956,
      39,
      C.ink,
    );
  });
}
export default {
  id: 'loop-contract',
  draw: drawLoopContract,
  cues: ['loop-eight', 'scan-derivative', 'loop-input-three', 'loop-twelve', 'scan-twenty-four'],
};
