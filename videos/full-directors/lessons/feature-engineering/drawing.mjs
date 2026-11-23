export const C = {
  stock: '#f3efdf',
  ink: '#192f38',
  slate: '#45616a',
  line: '#a7b4ac',
  pale: '#dce2d5',
  white: '#fffcf0',
  teal: '#086960',
  mint: '#b6dcc9',
  aqua: '#66c6ae',
  rust: '#a4442f',
  blush: '#f2c1a5',
  gold: '#efb744',
  indigo: '#53568a',
};
export const mix = (a, b, p) => a + (b - a) * p;
export const ease = (x) => x * x * (3 - 2 * x);
export function rect(g, x, y, w, h, color, r = 0) {
  g.fillStyle = color;
  if (!r) return g.fillRect(x, y, w, h);
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}
export function line(g, x, y, xx, yy, color = C.line, width = 3) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(xx, yy);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}
export function dot(g, x, y, r, color) {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fill();
}
export function poly(g, points, color) {
  g.fillStyle = color;
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
export function txt(
  g,
  s,
  x,
  y,
  size = 40,
  color = C.ink,
  align = 'left',
  family = 'Sans',
  weight = 500,
) {
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  g.fillText(String(s), x, y);
}
export const num = (g, s, x, y, size = 49, color = C.ink, align = 'center') =>
  txt(g, s, x, y, size, color, align, 'Mono');
export const cap = (g, s, x, y, color = C.slate, align = 'left') =>
  txt(g, s, x, y, 25, color, align, 'Mono', 600);
export function paper(g) {
  rect(g, 0, 0, 1920, 1080, C.stock);
}
export function head(g, kicker, title) {
  cap(g, kicker, 105, 91, C.teal);
  txt(g, title, 100, 176, 74, C.ink, 'left', 'Serif', 500);
}
export function screw(g, x, y) {
  dot(g, x, y, 7, C.slate);
  line(g, x - 3, y + 2, x + 3, y - 2, C.pale, 2);
}
export function panel(g, x, y, w, h, color = C.white) {
  rect(g, x + 7, y + 9, w, h, '#182f381a', 15);
  rect(g, x, y, w, h, C.slate, 15);
  rect(g, x + 2, y + 2, w - 4, h - 4, color, 14);
}
export function labelValue(g, x, y, label, value, color = C.teal, size = 58) {
  cap(g, label, x, y);
  num(g, value, x, y + 63, size, color, 'left');
}
// Job cartridges have a notched top, an ID strip and contacts on the right.
export function job(g, x, y, w, h, color = C.teal) {
  poly(
    g,
    [
      [x, y + 0.18 * h],
      [x + 0.17 * w, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    C.ink,
  );
  poly(
    g,
    [
      [x + 3, y + 0.18 * h + 1],
      [x + 0.17 * w + 1, y + 3],
      [x + w - 4, y + 3],
      [x + w - 4, y + h - 6],
      [x + 3, y + h - 6],
    ],
    color,
  );
  rect(g, x + 0.15 * w, y + 0.32 * h, 0.47 * w, 0.16 * h, C.white, 1);
  for (let i = 0; i < 3; i++)
    rect(g, x + w * 0.76, y + h * (0.18 + 0.22 * i), w * 0.24, h * 0.1, C.gold);
}
export function jobs(g, n, x, y, cols, w = 76, h = 43, gap = 12, color = C.teal) {
  for (let i = 0; i < n; i++)
    job(g, x + (i % cols) * (w + gap), y + Math.floor(i / cols) * (h + gap), w, h, color);
}
export function register(g, x, y, w, h, value) {
  rect(g, x, y, w, h, C.ink, 10);
  rect(g, x + 9, y + 8, w - 18, h - 18, '#153e3c', 6);
  num(g, value, x + w / 2, y + h / 2, Math.min(70, h * 0.58), C.aqua);
}
export function strip(g, x, y, w, h) {
  panel(g, x, y, w, h, C.white);
  for (let i = x + 18; i < x + w - 8; i += 33) {
    rect(g, i, y + 10, 12, 8, C.pale, 2);
    rect(g, i, y + h - 19, 12, 8, C.pale, 2);
  }
}
export function rail(g, x, y, w) {
  rect(g, x, y, w, 10, C.slate, 4);
  rect(g, x, y, w, 3, C.line, 2);
}
// A cue on a later beat stays settled when the viewer seeks forward.
export function cue(k, b, phrase, duration = 0) {
  if (k.beat.beatIndex !== b) return Number(k.beat.beatIndex > b);
  return k.reveal(phrase, duration);
}
export function end(k, b) {
  return k.beat.beatIndex > b || (k.beat.beatIndex === b && k.elapsed >= k.speechDuration - 1e-8);
}
export const hhmm = (m) =>
  String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
export const decimal = (x, n = 3) => String(Number(x.toFixed(n)));
