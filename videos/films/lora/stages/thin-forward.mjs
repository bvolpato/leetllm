import { EXAMPLE } from '../fixtures.mjs';
import { forward } from '../model.mjs';
import { cueMotion, resultAfter } from '../construction.mjs';
import { num, point } from '../geometry.mjs';
import { text, line, circle } from '../defaults.mjs';

export function drawThinForward(ctx, scene, state, api) {
  const { C } = api;
  const alternate = resultAfter(state, 'forward-new-input', 3, 0.25);
  const x = alternate ? [1, 1] : EXAMPLE.x;
  const scale = 2;
  const f = forward(scale, x);
  const baseReady = alternate || resultAfter(state, 'forward-base', 0, 0.78);
  const zReady = alternate
    ? resultAfter(state, 'forward-zero', 4, 0.32)
    : resultAfter(state, 'forward-difference', 1, 0.32);
  const correctionReady = alternate ? zReady : resultAfter(state, 'forward-scale', 1, 0.88);
  const move = alternate ? 0 : cueMotion(state, 'forward-add', 2, 0.07, 0.55);
  const sumReady = alternate
    ? resultAfter(state, 'forward-unchanged', 4, 0.73)
    : resultAfter(state, 'forward-sum', 2, 0.75);
  const vec = (v) => '[' + v.map(num).join(', ') + ']';
  const coordinate = (value) => 990 + 58 * value;

  api.focus.target('forward-input', () => {
    text(ctx, api, 'Input x', 175, 270, 34, C.cyan);
    text(ctx, api, vec(x), 175, 365, 76, C.cyan, 'left', 'mono');
  });
  api.focus.target('forward-factors', () => {
    text(ctx, api, 'A measures the difference', 175, 490, 34, C.yellow);
    const difference = x[0] + ' − ' + x[1] + ' = ' + (zReady ? num(f.intermediate[0]) : '?');
    text(ctx, api, difference, 175, 570, 55, C.yellow, 'left', 'mono');
    text(ctx, api, 'B expands it along [0.5, 1]', 175, 690, 34, C.yellow);
    text(ctx, api, 'Scale ×' + scale, 175, 752, 38, C.muted);
    text(
      ctx,
      api,
      correctionReady ? 'Correction  ' + vec(f.correction) : 'Correction  ?',
      175,
      852,
      40,
      C.yellow,
    );
  });

  for (const [i, row] of EXAMPLE.W.entries()) {
    const y = 444 + i * 268;
    api.focus.target('forward-rails', () => {
      const computation = row[0] + ' × ' + x[0] + ' + ' + row[1] + ' × ' + x[1];
      text(ctx, api, 'Output ' + (i + 1), 975, y - 139, 32, C.muted);
      text(
        ctx,
        api,
        computation + ' = ' + (baseReady ? num(f.base[i]) : '?'),
        975,
        y - 74,
        42,
        C.blue,
        'left',
        'mono',
      );
      line(ctx, api, point(coordinate(0), y), point(coordinate(13), y), C.muted, 2);
      for (const tick of [0, 3, 6, 9, 12]) {
        const tickX = coordinate(tick);
        line(ctx, api, point(tickX, y - 8), point(tickX, y + 8), C.muted, 2);
        text(ctx, api, String(tick), tickX, y + 50, 27, C.muted, 'center');
      }
      if (baseReady) {
        const start = coordinate(f.base[i]);
        const end = coordinate(f.base[i] + f.correction[i] * move);
        if (move > 0) line(ctx, api, point(start, y), point(end, y), C.yellow, 9);
        circle(ctx, api, start, y, 11, C.blue);
        if (move > 0 || (alternate && sumReady))
          circle(ctx, api, end, y, alternate ? 6 : 10, C.yellow);
      }
    });
  }
  api.focus.target('forward-answer', () => {
    text(ctx, api, 'Adapted output', 975, 862, 34, C.ink);
    text(
      ctx,
      api,
      sumReady ? vec(f.output) : '[?, ?]',
      975,
      949,
      68,
      sumReady ? C.green : C.muted,
      'left',
      'mono',
    );
  });
}

export default {
  id: 'thin-forward',
  draw: drawThinForward,
  cues: [
    'forward-base',
    'forward-difference',
    'forward-scale',
    'forward-add',
    'forward-sum',
    'forward-new-input',
    'forward-zero',
    'forward-unchanged',
  ],
};
