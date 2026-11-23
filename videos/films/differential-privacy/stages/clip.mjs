import { clipVector } from '../arithmetic.mjs';

export function drawClip(ctx, scene, state, api) {
  const { C, focus } = api;
  const text = (v, x, y, size, color = C.ink, align = 'left') => api.text(ctx, v, x, y, size, color, align);
  if (state.beat === 3) {
    const norm = Math.hypot(0.71, 0.71);
    const p = focus.progress('round-coordinates', 0);
    const x = (length) => 400 + (length - 0.999) * 185000;
    focus.target('precision-ruler', () => {
      text('Unit vector', 260, 290, 37, C.muted);
      text('(1/√2, 1/√2)', 260, 398, 54, C.cyan);
      if (p > 0) text('Rounded for storage    (0.71, 0.71)', 880, 397, 42, C.pink);
      api.line(ctx, x(0.999), 654, x(1.006), 654, C.muted, 4);
      for (const length of [1, 1.002, 1.004, 1.006]) {
        api.line(ctx, x(length), 657, x(length), 682, C.muted, 3);
        text(length.toFixed(3), x(length), 735, 32, C.muted, 'center');
      }
      api.line(ctx, x(1), 559, x(1), 652, C.yellow, 4);
      text('C = 1', x(1), 522, 36, C.yellow, 'center');
      api.circle(ctx, x(1 + (norm - 1) * p), 654, 15, C.pink);
      const caption = p === 0 ? 'Length after clipping = 1' : p < 1 ? 'Rounding both coordinates up' : 'Stored norm ≈ ' + norm.toFixed(5);
      text(caption, 960, 895, 48, p > 0 ? C.pink : C.cyan, 'center');
    });
    return;
  }
  const raw = [3, 4], bound = 1, result = clipVector(raw, bound);
  const amount = focus.progress('shorten-vector', 0);
  const scale = 1 + (result.scale - 1) * amount;
  const origin = [415, 795], unit = 115;
  const point = ([x, y]) => [origin[0] + x * unit, origin[1] - y * unit];
  focus.target('gradient-plane', () => {
    api.line(ctx, 190, origin[1], 995, origin[1], C.muted, 2);
    api.line(ctx, origin[0], 995, origin[0], 255, C.muted, 2);
    api.circle(ctx, ...origin, unit, 'transparent', C.yellow, 4);
    text('C = 1', 265, 924, 34, C.yellow);
    api.line(ctx, ...origin, ...point(raw), C.muted, 2);
    api.circle(ctx, ...point(raw), 9, C.panel, C.pink, 3);
    text('R4   (3, 4)', 790, 337, 37, C.pink);
    api.arrow(ctx, ...origin, ...point(raw.map(v => v * scale)), C.pink, 7);
    api.arrow(ctx, ...origin, ...point([0.4, 0.3]), C.cyan, 6);
    text('R1   (0.4, 0.3)', 1045, 355, 38, C.cyan);
    text('Length 0.5   ·   inside', 1045, 421, 32, C.muted);
    text('R4   ·   length ' + (result.norm * scale).toFixed(2), 1045, 570, 46, C.pink);
    const line = amount === 1 ? 'Contribution   (0.6, 0.8)' : 'Contribution   (?, ?)';
    text(line, 1045, 674, 45, amount === 1 ? C.green : C.ink);
    text(amount > 0 ? 'Scale both coordinates by C / 5.' : 'Where does R4 meet the circle?', 1045, 790, 34);
    text('Clip each record before adding it to the batch sum.', 960, 1012, 33, C.ink, 'center');
  });
}
export default { id: 'clip', draw: drawClip, cues: ['record-gradient', 'predict-tip', 'shorten-vector', 'round-coordinates'] };
