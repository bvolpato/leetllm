import { target, text, withMpsRootFrame } from '../defaults.mjs';
import { cueComplete } from '../arithmetic.mjs';

export function paintPrecision(ctx, scene, state, api, C, c, t, s) {
  const n = s.input[0];
  const x = (value) => 300 + (value - n) * 323;
  const number = (v) => v.toLocaleString('en-US');
  const moving = s.shift > 0 && s.shift < 1;
  text(ctx, api, C, 'CPU features  /  float64', 960, 265, 39, C.ink, 'center');
  for (let v = n; v <= n + 4; v++) {
    api.line(ctx, x(v), 398, x(v), 424, C.muted, 3);
    if (s.input.includes(v) || (moving && v === n + 3))
      text(ctx, api, C, number(v), x(v), 359, 35, v === n ? C.blue : C.yellow, 'center');
  }
  api.line(ctx, 222, 412, 1670, 412, C.muted, 3);
  api.line(ctx, 222, 716, 1670, 716, C.cyan, 4);
  for (const v of [n, n + 2, n + 4]) {
    api.line(ctx, x(v), 699, x(v), 735, C.cyan, 4);
    text(ctx, api, C, number(v), x(v), 816, 37, C.cyan, 'center');
  }
  text(ctx, api, C, 'float32', 1749, 726, 29, C.cyan, 'center');
  if (s.showParity) {
    target(ctx, api, 'parity-key', () => {
      for (const tick of [n, n + 2, n + 4]) {
        const even = (tick / 2) % 2 === 0;
        text(ctx, api, C, even ? 'even' : 'odd', x(tick), 874, 37, C.ink, 'center');
      }
      if (s.step === 1)
        text(ctx, api, C, number(n) + ' ÷ 2 = ' + number(n / 2), 960, 579, 50, C.ink, 'center');
    });
  }
  if (s.replay && s.shift === 1 && s.merge === 0) {
    const middle = s.input[1];
    api.line(ctx, x(middle - 1), 586, x(middle + 1), 586, C.yellow, 3);
    for (const v of [middle - 1, middle, middle + 1])
      api.line(ctx, x(v), 574, x(v), 598, C.yellow, 3);
  }
  target(ctx, api, 'rounding-points', () => {
    s.input.forEach((value, i) => {
      const color = i ? C.yellow : C.blue;
      const start = i && s.replay ? x(n + 1 + 2 * s.shift) : x(value),
        end = x(s.cast[i]);
      const progress = s.replay && !i ? 1 : s.merge;
      const xx = start + (end - start) * progress;
      const yy = 455 + ((i ? 754 : 677) - 455) * progress;
      api.rect(ctx, start - 8, 425, 16, 16, color, color, 2);
      api.rect(ctx, xx - 18, yy - 17, 36, 34, color, color, i ? 2 : 16);
    });
  });
  const gapBracket = (id, pair, y, label, color) => target(ctx, api, id, () => {
    const left = x(pair[0]), right = x(pair[1]);
    api.line(ctx, left, y, right, y, color, 3);
    api.line(ctx, left, y - 9, left, y + 9, color, 3);
    api.line(ctx, right, y - 9, right, y + 9, color, 3);
    text(ctx, api, C, label + '   ' + (pair[1] - pair[0]), (left + right) / 2, y - 16, 36, color, 'center');
  });
  if (s.inputGap) gapBracket('input-gap', s.input, 544, 'Original gap', C.yellow);
  if (s.storedGap) gapBracket('stored-gap', s.cast, 642, 'Gap after cast', C.cyan);
  target(ctx, api, 'precision-question', () => {
    if (s.subtractFirst) {
      const gap = Math.fround(s.input[1] - s.input[0]);
      text(ctx, api, C, 'Subtract first     float32(yellow − blue) = ' + gap, 960, 974, 45, C.green, 'center');
      return;
    }
    const result = s.merged && (s.replay || cueComplete(state.cues, 'rounding-result', s.p > 0.5));
    const label = !result ? 'Where will the halfway value land?'
      : s.replay ? 'Yellow stores ' + number(s.cast[1]) : 'Both store ' + number(s.cast[0]);
    text(ctx, api, C, label, 960, 974, 45, result ? C.ink : C.yellow, 'center');
  });
}
export function drawPrecisionStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, paintPrecision);
}
export default {
  id: 'precision',
  draw: drawPrecisionStage,
  cues: [
    'cast-prediction', 'rounding-snap', 'rounding-result', 'even-significands',
    'move-midpoint', 'cast-next-midpoint', 'original-gap', 'rounded-gap', 'subtract-first',
  ],
};
