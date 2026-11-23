import { spokenProgress, spokenResult } from '../construction.mjs';

const scale = 0.1;
const first = 0.73;
const next = 0.76;
const code = Math.round(next / scale);
const restored = code * scale;

export function drawGrid(ctx, scene, state, api) {
  const { C } = api;
  const move = spokenProgress(state, 'new-weight', 1, 0.06, 0.35);
  const snap = spokenProgress(state, 'nearest-level', 2, 0.04, 0.26);
  const decoded = spokenResult(state, 'nearest-level', 2, 0.04, 0.26);
  const gap = spokenResult(state, 'rounding-gap', 2, 0.38, 0.6);
  const value = api.lerp(first, next, move);
  const x = (w) => 245 + ((w - 0.6) / 0.3) * 1440;

  api.focus.target('grid-spacing', () => {
    api.text(ctx, 'Step size  ' + scale, 200, 290, 43, C.muted);
    api.text(ctx, 'Zero-point  0', 1685, 290, 36, C.muted, 'right');
    api.line(ctx, x(0.6), 570, x(0.9), 570, C.muted, 4);
    for (const mark of [6, 7, 8, 9]) {
      const location = x(mark * scale);
      api.line(ctx, location, 543, location, 597, C.ink, 4);
      api.text(ctx, (mark * scale).toFixed(2), location, 667, 51, C.ink, 'center', 'mono');
    }
  });
  api.focus.target('raw-weight', () => {
    const rawX = x(value);
    api.text(ctx, value.toFixed(2), rawX, 405, 57, C.blue, 'center', 'mono');
    api.line(ctx, rawX, 475, rawX, 565, C.blue, 3);
    api.circle(ctx, rawX, 457, 15, C.blue);
  });
  api.focus.target('grid-code', () => {
    if (snap > 0) {
      const point = api.lerp(x(next), x(restored), snap);
      api.circle(ctx, point, api.lerp(457, 568, snap), 17, C.cyan);
    }
    const prompt = move === 0 ? 'Real values' : 'Which integer code stores the nearest mark?';
    api.text(
      ctx,
      decoded ? 'Stored code  ' + code : prompt,
      960,
      798,
      48,
      decoded ? C.cyan : C.ink,
      'center',
    );
  });
  api.focus.target('rounding-residual', () => {
    if (gap) {
      api.line(ctx, x(next), 505, x(restored), 505, C.yellow, 5);
      for (const n of [next, restored]) api.line(ctx, x(n), 491, x(n), 519, C.yellow, 4);
      api.text(
        ctx,
        '+' + (restored - next).toFixed(2),
        x(restored) + 26,
        510,
        35,
        C.yellow,
        'left',
        'mono',
      );
    }
    const valueLine = decoded
      ? code + ' × ' + scale + ' = ' + restored.toFixed(2)
      : 'Nearest mark = code × step size';
    if ((state.beat ?? 0) < 3) api.text(ctx, valueLine, 960, 925, 41, C.muted, 'center');
  });
  if (state.beat === 3) {
    api.focus.target('encode-decode', () => {
      api.math(
        ctx,
        'q=\\operatorname{clip}(\\operatorname{round}(w/S)+Z)',
        620,
        943,
        43,
        C.ink,
        'center',
      );
      api.math(ctx, '\\hat{w}=S(q-Z)', 1470, 943, 48, C.cyan, 'center');
    });
  }
}

export default {
  id: 'grid',
  draw: drawGrid,
  cues: ['grid-scale', 'new-weight', 'ask-code', 'nearest-level', 'rounding-gap', 'codec-steps'],
};
