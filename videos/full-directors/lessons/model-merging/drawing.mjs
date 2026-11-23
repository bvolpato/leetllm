export const ink = '#203139',
  paper = '#f5f0e2',
  muted = '#52676b',
  rule = '#aab6ac';
export const code = '#a24429',
  math = '#3158a1',
  chat = '#246c5e',
  gold = '#a16b10';
export const colors = [code, math, chat],
  bright = ['#ffab82', '#95baff', '#83d5b8'];
export const dark = '#162d33',
  pale = '#d0ded4',
  white = '#fffaf0',
  pink = '#ac3842';
export const mix = (a, b, t) => a + (b - a) * t;
export function cue(k, b, phrase, span = 0) {
  if (k.beat.beatIndex !== b) return Number(k.beat.beatIndex > b);
  return k.reveal(phrase, span);
}
export function text(
  c,
  s,
  x,
  y,
  size = 36,
  color = ink,
  align = 'left',
  face = 'Sans',
  weight = 400,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(String(s), x, y);
}
export function mono(c, s, x, y, size = 39, color = ink, align = 'left') {
  text(c, s, x, y, size, color, align, 'Mono');
}
export function title(c, s, sub = '') {
  text(c, s, 90, 108, 70, ink, 'left', 'Serif');
  if (sub) text(c, sub, 94, 193, 33, muted);
}
export function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function box(c, x, y, w, h, fill, edge = rule, r = 12, lw = 2) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = lw;
    c.stroke();
  }
}
export function line(c, x, y, x1, y1, color = rule, w = 3) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x1, y1);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
}
export function dash(c, x, y, x1, y1, color = rule, w = 3) {
  c.save();
  c.setLineDash([10, 12]);
  line(c, x, y, x1, y1, color, w);
  c.restore();
}
export function dot(c, x, y, r, color, stroke = null, w = 2) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  if (color) {
    c.fillStyle = color;
    c.fill();
  }
  if (stroke) {
    c.lineWidth = w;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
export function polygon(c, points, fill) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}
export function arrow(c, x, y, u, v, color = ink, w = 6) {
  const len = Math.hypot(u - x, v - y);
  if (len < 1) return;
  const a = Math.atan2(v - y, u - x),
    h = Math.min(len, w * 2 + 10);
  line(c, x, y, u - h * 0.7 * Math.cos(a), v - h * 0.7 * Math.sin(a), color, w);
  polygon(
    c,
    [
      [u, v],
      [u - h * Math.cos(a) + h * 0.46 * Math.sin(a), v - h * Math.sin(a) - h * 0.46 * Math.cos(a)],
      [u - h * Math.cos(a) - h * 0.46 * Math.sin(a), v - h * Math.sin(a) + h * 0.46 * Math.cos(a)],
    ],
    color,
  );
}
export function screw(c, x, y) {
  dot(c, x, y, 8, '#bbcbc3');
  line(c, x - 4, y + 3, x + 4, y - 3, dark, 2);
}
export function heading(c, s, x, y, color = muted) {
  text(c, s, x, y, 30, color, 'left', 'Sans', 600);
}
export function number(v, n = 2) {
  return String(Number(v.toFixed(n))).replace('-', '−');
}
export function signed(v, n = 2) {
  return v > 0 ? '+' + number(v, n) : number(v, n);
}
export function grid(c, x, y, w, h, step, col = '#d8dbce') {
  for (let i = 0; i <= w; i += step) line(c, x + i, y, x + i, y + h, col, 1.5);
  for (let i = 0; i <= h; i += step) line(c, x, y + i, x + w, y + i, col, 1.5);
}
