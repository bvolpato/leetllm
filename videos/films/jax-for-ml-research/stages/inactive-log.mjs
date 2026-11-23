import { drawLeftText, drawText } from '../defaults.mjs';
import { operationProgress, resultAfter } from '../../../lib/lesson-definition.mjs';

export function drawInactiveLog(ctx, scene, state, api) {
  const { C } = api;
  const safe = operationProgress(state, 'log-safe-input') > 0;
  const tested = resultAfter(state, safe ? 'log-safe-gradient' : 'log-nan');
  drawLeftText(ctx, api, 'Output = where(x > 0, log(argument), 0)', 110, 280, 45, C.ink);
  api.focus.target('log-input', () => {
    drawLeftText(
      ctx,
      api,
      safe ? 'argument = where(x > 0, x, 1)' : 'argument = x',
      112,
      369,
      44,
      C.yellow,
    );
  });
  api.focus.target('log-rows', () => {
    const xs = [235, 586, 936, 1290, 1648];
    ['Input x', 'Argument', 'Log', 'Output', 'Gradient'].forEach((s, i) =>
      drawText(ctx, api, s, xs[i], 506, 33, C.muted),
    );
    for (const [i, x] of [0, 2].entries()) {
      const arg = safe && x <= 0 ? 1 : x;
      const logValue = Math.log(arg);
      const forward = x > 0 ? logValue : 0;
      const known = resultAfter(state, 'log-forward');
      const grad = x > 0 ? 1 / x : safe ? 0 : NaN;
      const cells = [
        x,
        arg,
        arg === 0 ? '−∞' : Number(logValue.toFixed(3)),
        known ? Number(forward.toFixed(3)) : '?',
        tested ? String(grad) : '?',
      ];
      const y = 636 + i * 140;
      api.line(ctx, 120, y + 32, 1810, y + 32, C.muted, 2);
      cells.forEach((value, j) =>
        drawText(
          ctx,
          api,
          value,
          xs[j],
          y,
          55,
          j === 1
            ? C.yellow
            : (j === 2 && !arg) || (j === 4 && Number.isNaN(grad) && tested)
              ? C.pink
              : C.ink,
        ),
      );
    }
  });
  drawLeftText(
    ctx,
    api,
    safe
      ? 'The positive row keeps its original argument.'
      : 'Check the backward pass at the inactive row.',
    112,
    947,
    39,
    C.cyan,
  );
}
export default {
  id: 'inactive-log',
  draw: drawInactiveLog,
  cues: ['log-forward', 'log-nan', 'log-safe-input', 'log-safe-gradient'],
};
