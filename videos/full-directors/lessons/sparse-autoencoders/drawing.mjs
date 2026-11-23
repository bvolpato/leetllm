export const C = {
  paper: '#f5efdf',
  light: '#fffbf0',
  ink: '#202f35',
  muted: '#506264',
  line: '#ccc7b6',
  faint: '#e5dfcd',
  blue: '#176496',
  pink: '#ae4054',
  green: '#21705b',
  gold: '#a46119',
  teal: '#157b80',
  dark: '#17383d',
};
export const mix = (a, b, t) => a + (b - a) * t;
export const fmt = (v, d = 2) => Number(v.toFixed(d)).toString().replace('-', '−');
export const pair = (a) => '(' + a.map((v) => fmt(v)).join(', ') + ')';
export function words(c, s, x, y, size = 42, color = C.ink, opt = {}) {
  c.fillStyle = color;
  c.textAlign = opt.align ?? 'left';
  c.textBaseline = 'middle';
  c.font = (opt.weight ?? 400) + ' ' + size + 'px "Lesson ' + (opt.face ?? 'Sans') + '"';
  c.fillText(String(s), x, y);
}
export const numeral = (c, s, x, y, size = 50, col = C.ink, align = 'left') =>
  words(c, s, x, y, size, col, { face: 'Mono', align });
export const heading = (c, s, x = 88, y = 110, size = 68) =>
  words(c, s, x, y, size, C.ink, { face: 'Serif' });
export function box(c, x, y, w, h, fill, stroke = null, r = 0) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 2;
    c.stroke();
  }
}
export function line(c, x, y, xx, yy, color = C.line, width = 3, dash = []) {
  c.beginPath();
  c.setLineDash(dash);
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.lineWidth = width;
  c.strokeStyle = color;
  c.stroke();
  c.setLineDash([]);
}
export function poly(c, points, fill, stroke = null, width = 2) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
export function circle(c, x, y, r, fill, stroke = null, width = 3) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
export function arrow(c, x, y, xx, yy, color, width = 10) {
  const dx = xx - x,
    dy = yy - y,
    len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len,
    uy = dy / len,
    h = Math.min(len * 0.65, width * 2.9),
    hw = h * 0.48;
  line(c, x, y, xx - h * 0.8 * ux, yy - h * 0.8 * uy, color, width);
  poly(
    c,
    [
      [xx, yy],
      [xx - h * ux + hw * uy, yy - h * uy - hw * ux],
      [xx - h * ux - hw * uy, yy - h * uy + hw * ux],
    ],
    color,
  );
}
export function alpha(c, a, fn) {
  if (a <= 0) return;
  c.save();
  c.globalAlpha *= a;
  fn();
  c.restore();
}
export function ground(c) {
  const wash = c.createLinearGradient(0, 0, 1820, 1080);
  wash.addColorStop(0, '#fcf8ec');
  wash.addColorStop(0.61, C.paper);
  wash.addColorStop(1, '#e8e0cf');
  c.fillStyle = wash;
  c.fillRect(0, 0, 1920, 1080);
}
export function ruler(
  c,
  x,
  y,
  unit,
  max,
  { step = 0.1, major = 1, ink = C.muted, labels = true } = {},
) {
  line(c, x, y, x + unit * max, y, ink, 3);
  for (let j = 0; j <= Math.round(max / step); j++) {
    const n = j * step,
      px = x + unit * n,
      m = Math.abs(n / major - Math.round(n / major)) < 1e-6;
    line(c, px, y, px, y + (m ? 22 : 10), ink, m ? 3 : 1.6);
    if (m && labels) numeral(c, fmt(n), px, y + 49, 29, ink, 'center');
  }
}
export function plane(c, x, y, u, { xmin = 0, xmax = 3, ymin = 0, ymax = 1.5, step = 0.5 } = {}) {
  const P = (v) => [x + v[0] * u, y - v[1] * u];
  for (let k = Math.ceil(xmin / step); k <= xmax / step; k++)
    line(
      c,
      x + k * step * u,
      y - ymax * u,
      x + k * step * u,
      y - ymin * u,
      k === 0 ? C.muted : C.faint,
      k === 0 ? 3 : 2,
    );
  for (let k = Math.ceil(ymin / step); k <= ymax / step; k++)
    line(
      c,
      x + xmin * u,
      y - k * step * u,
      x + xmax * u,
      y - k * step * u,
      k === 0 ? C.muted : C.faint,
      k === 0 ? 3 : 2,
    );
  return {
    p: P,
    vector: (a, b, col, w = 12) => arrow(c, ...P(a), ...P(b), col, w),
    point: (v, col = C.ink, r = 10) => circle(c, ...P(v), r, col, C.light, 3),
  };
}
export function cue(clock, beat, phrase, span = 0.55) {
  const i = clock.beat.beatIndex + 1;
  return i > beat ? 1 : i < beat ? 0 : clock.reveal(phrase, span);
}
export function pivot(c, x, y) {
  circle(c, x, y, 10, '#c8bda8', '#635d51', 2);
  line(c, x - 4, y + 4, x + 4, y - 4, '#686457', 2);
}
export function pin(c, x, y, endY, color = C.ink) {
  line(c, x, y, x, endY, color, 3, [7, 7]);
  poly(
    c,
    [
      [x - 10, endY - 14],
      [x + 10, endY - 14],
      [x, endY],
    ],
    color,
  );
}
export function span(c, x, xx, y, col) {
  line(c, x, y, xx, y, col, 4);
  line(c, x, y - 11, x, y + 11, col, 4);
  line(c, xx, y - 11, xx, y + 11, col, 4);
}
export function labelValue(c, name, value, x, y, col = C.ink, size = 62) {
  words(c, name, x, y, 31, C.muted);
  numeral(c, value, x, y + 68, size, col);
}
export const subtitle = (c, s, x, y, col = C.muted) => words(c, s, x, y, 35, col);
