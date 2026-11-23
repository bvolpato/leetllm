// Coordinates are in the course host's native 1920 by 1080 picture.
export const C = {
  paper: '#f7f4e9',
  white: '#fffdf5',
  ink: '#153439',
  dim: '#4b6263',
  faint: '#c3cfc7',
  metal: '#dce6dd',
  blue: '#235999',
  green: '#087665',
  yellow: '#efb73d',
  ochre: '#825607',
  red: '#ac4556',
  rose: '#f2dce0',
  mint: '#d1eadd',
  dark: '#163c40',
};
export const mix = (a, b, t) => a + (b - a) * t;
export function at(clock, beat, phrase, seconds = 0) {
  const current = clock.beat.beatIndex + 1;
  if (current !== beat) return current > beat ? 1 : 0;
  return clock.reveal(phrase, seconds);
}
export function box(g, x, y, w, h, fill, stroke, thickness = 2, r = 0) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.lineWidth = thickness;
    g.strokeStyle = stroke;
    g.stroke();
  }
}
export function line(g, x, y, u, v, color = C.ink, width = 3, dash = []) {
  g.beginPath();
  g.setLineDash(dash);
  g.moveTo(x, y);
  g.lineTo(u, v);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
  g.setLineDash([]);
}
export function dot(g, x, y, r, color, edge) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fillStyle = color;
  g.fill();
  if (edge) {
    g.strokeStyle = edge;
    g.lineWidth = 3;
    g.stroke();
  }
}
export function text(
  g,
  s,
  x,
  y,
  size = 36,
  color = C.ink,
  align = 'left',
  face = 'Sans',
  weight = 500,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillStyle = color;
  g.fillText(String(s), x, y);
}
export const num = (g, s, x, y, size = 46, color = C.ink, align = 'left') =>
  text(g, s, x, y, size, color, align, 'Mono', 500);
export function title(g, name, sub) {
  text(g, name, 96, 133, 70, C.ink, 'left', 'Serif', 500);
  if (sub) text(g, sub, 100, 206, 34, C.dim);
}
export function screw(g, x, y) {
  dot(g, x, y, 8, C.faint, C.dim);
  line(g, x - 4, y + 3, x + 4, y - 3, C.dim, 2);
}
export function casing(g, x, y, w, h, color = C.metal) {
  box(g, x, y, w, h, color, C.dim, 3, 16);
  for (const dx of [20, w - 20]) for (const dy of [20, h - 20]) screw(g, x + dx, y + dy);
}
export function scale(g, l, r, y, ticks, col = C.ink) {
  line(g, l, y, r, y, col, 4);
  for (const x of ticks) line(g, x, y - 17, x, y + 18, col, 4);
}
export function pointer(g, x, y, color = C.yellow) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x - 13, y - 24);
  g.lineTo(x - 13, y - 49);
  g.lineTo(x + 13, y - 49);
  g.lineTo(x + 13, y - 24);
  g.closePath();
  g.fillStyle = color;
  g.fill();
  g.strokeStyle = C.ink;
  g.lineWidth = 2.5;
  g.stroke();
}
export function fade(g, t, fn) {
  if (t <= 0) return;
  g.save();
  g.globalAlpha *= t;
  fn();
  g.restore();
}
export function arr(g, x, y, u, v, color = C.dim) {
  line(g, x, y, u, v, color, 3);
  const a = Math.atan2(v - y, u - x);
  line(g, u, v, u - 16 * Math.cos(a - 0.46), v - 16 * Math.sin(a - 0.46), color, 3);
  line(g, u, v, u - 16 * Math.cos(a + 0.46), v - 16 * Math.sin(a + 0.46), color, 3);
}
export function brace(g, x, u, y, label, color = C.dim) {
  line(g, x, y, u, y, color, 2);
  line(g, x, y - 8, x, y + 8, color, 2);
  line(g, u, y - 8, u, y + 8, color, 2);
  text(g, label, (x + u) / 2, y + 47, 30, color, 'center');
}
export function bitword(g, x, y, exp, frac, width = 720, bits = null) {
  const kinds = [1, exp, frac],
    cols = [C.red, C.green, C.blue];
  const unit = width / (1 + exp + frac);
  let n = 0;
  for (const [group, count] of kinds.entries()) {
    for (let i = 0; i < count; i++, n++) {
      box(
        g,
        x + n * unit,
        y,
        unit - 3,
        78,
        bits && bits[n] === '0' ? C.paper : cols[group],
        cols[group],
        2,
        4,
      );
      if (bits)
        num(
          g,
          bits[n],
          x + (n + 0.5) * unit,
          y + 53,
          34,
          bits[n] === '0' ? C.dim : C.white,
          'center',
        );
    }
    const start = x + (n - count) * unit,
      end = x + n * unit - 3;
    text(
      g,
      [String(count) + ' sign', count + ' exponent', count + ' fraction'][group],
      (start + end) / 2,
      y + 121,
      26,
      cols[group],
      'center',
    );
  }
}
export const fmt = (v) =>
  Number.isFinite(v)
    ? Number(v.toFixed(8)).toLocaleString('en-US', { maximumFractionDigits: 8 })
    : '∞';
export function reading(g, x, y, name, value, color = C.ink) {
  text(g, name, x, y, 32, C.dim);
  num(g, value, x, y + 72, 55, color);
}
