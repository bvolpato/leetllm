import { after, progress, started, signed } from '../decisions.mjs';

export function drawBaseCoefficient(ctx, scene, state, api) {
  const { C } = api;
  const label = (v, x, y, size, col, align = 'left') => api.text(ctx, v, x, y, size, col, align);
  const base = 2,
    code = 2.4,
    math = 1.8,
    a = 0.7,
    b = 0.5;
  const right = a * (code - base),
    left = b * (math - base);
  const result = base + right + left,
    endpoints = a * code + b * math,
    correction = (1 - a - b) * base;
  const x = (v) => 230 + (v - 1.75) * 1620;
  label('Code', 230, 320, 38, C.blue);
  label('0.7 × (2.4 − 2.0)', 230, 390, 47, C.blue);
  label('Math', 980, 320, 38, C.pink);
  label('0.5 × (1.8 − 2.0)', 980, 390, 47, C.pink);
  api.focus.target('base-ruler', () => {
    api.line(ctx, x(1.75), 664, x(2.64), 664, C.muted, 3);
    for (const v of [math, base, code, 2.6]) {
      api.line(ctx, x(v), 651, x(v), 679, C.muted, 3);
      label(v.toFixed(1), x(v), 732, 33, C.muted, 'center');
    }
    api.circle(ctx, x(base), 664, 12, C.ink);
    if (after(state, 'step-result')) {
      api.circle(ctx, x(result), 664, 13, C.yellow);
      label(result.toFixed(2), x(result), 728, 41, C.yellow, 'center');
    }
  });
  const displacement = (id, name, start, delta, y, col) =>
    api.focus.target(name, () => {
      const p = progress(state, id);
      if (p > 0) api.arrow(ctx, x(start), y, x(start + delta * p), y, col, 6);
      if (after(state, id))
        label(signed(delta), (x(start) + x(start + delta)) / 2, y - 18, 33, col, 'center');
    });
  displacement('step-code', 'code-delta', base, right, 610, C.blue);
  displacement('step-math', 'math-delta', base + right, left, 505, C.pink);
  api.focus.target('endpoint', () => {
    if (started(state, 'endpoint-sum')) {
      const p = progress(state, 'correction');
      api.circle(ctx, x(endpoints + correction * p), 664, 8, C.cyan);
      label(
        'Weighted endpoints   ' + (after(state, 'endpoint-sum') ? endpoints.toFixed(2) : '?'),
        230,
        849,
        40,
        C.cyan,
      );
      if (after(state, 'correction'))
        label('Base correction   ' + signed(correction), 980, 849, 40, C.yellow);
    }
    if (started(state, 'reverse-delta')) {
      const delta = code - base;
      label('Reverse the Code delta', 215, 968, 39, C.ink);
      label('−1 × (' + signed(delta) + ') = ' + signed(-delta), 1120, 968, 44, C.blue);
    } else if (state.beat >= 2)
      label('Base coefficient = 1 − (0.7 + 0.5) = −0.2', 960, 968, 40, C.ink, 'center');
  });
}
export default {
  id: 'base-coefficient',
  draw: drawBaseCoefficient,
  cues: [
    'base-inputs',
    'step-code',
    'step-math',
    'step-result',
    'endpoint-sum',
    'correction',
    'base-rule',
    'reverse-delta',
  ],
};
