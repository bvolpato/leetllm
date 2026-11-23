import { directedCue } from '../construction.mjs';
import { rotaryScore } from '../arithmetic.mjs';
import { drawUnitPair } from '../unit-pair.mjs';

export function drawSharedShift(ctx, scene, state, api) {
  const { C, text, line, circle, focus } = api;
  const label = (v, x, y, size, color) => text(ctx, v, x, y, size, color, 'center');
  const move = Math.round(8 * api.ease(directedCue(state, 'shift-both', 1)));
  const m = 5 + move,
    n = 3 + move,
    theta = 0.5;
  const queryLength = 1 + directedCue(state, 'double-query', 3);
  const score = rotaryScore([queryLength, 0], [1, 0], m, n, [theta]);
  const xAt = (p) => 225 + (p - 3) * 144;
  focus.target('paired-positions', () => {
    line(ctx, xAt(3), 340, xAt(13), 340, C.muted, 3);
    for (let i = 3; i <= 13; i++) {
      line(ctx, xAt(i), 330, xAt(i), 349, C.muted, 2);
      label(String(i), xAt(i), 399, 29, C.muted);
    }
    line(ctx, xAt(n), 307, xAt(m), 307, C.pink, 4);
    for (const [p, name, color] of [
      [n, 'K', C.yellow],
      [m, 'Q', C.cyan],
    ]) {
      line(ctx, xAt(p), 307, xAt(p), 340, color, 4);
      circle(ctx, xAt(p), 340, 10, color);
      label(name, xAt(p), 277, 42, color);
    }
  });
  focus.target('shifted-arrows', () =>
    drawUnitPair(ctx, api, {
      x: 520,
      y: 696,
      radius: 188,
      queryAngle: m * theta,
      keyAngle: n * theta,
      queryLength,
    }),
  );
  label(
    state.beat === 3
      ? 'Query length  ' + queryLength.toFixed(2) + '     Key length  1'
      : 'Both content vectors start at [1, 0]',
    520,
    977,
    32,
    C.muted,
  );
  focus.target('shifted-score', () => {
    label('Key position minus query position', 1310, 550, 34, C.muted);
    label(n + ' - ' + m + ' = ' + (n - m), 1310, 652, 55, C.pink);
    label('Dot product  ' + score.toFixed(3), 1310, 798, 52, C.green);
    if (state.beat === 0) label('After both move +8:  ?', 1310, 938, 36, C.ink);
    if (state.beat === 2)
      api.math(
        ctx,
        String.raw`R(m\theta)^\top R(n\theta)=R((n-m)\theta)`,
        1310,
        948,
        37,
        C.ink,
        'center',
      );
    if (state.beat === 3) label(queryLength.toFixed(2) + ' × 1 × cos(-1)', 1310, 948, 37, C.ink);
  });
}
export default {
  id: 'shared-shift',
  draw: drawSharedShift,
  cues: ['shift-prediction', 'shift-both', 'read-offset', 'cancel-rotations', 'double-query'],
};
