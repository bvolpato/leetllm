export const C = {
  paper: '#f4efdf',
  leaf: '#fcf7e9',
  ink: '#233c3c',
  muted: '#526661',
  rule: '#b4b4a2',
  sea: '#216b75',
  pale: '#c6e0d7',
  clay: '#ac513b',
  rose: '#ecd0b9',
  gold: '#af813e',
  sun: '#ecd09a',
  forest: '#3e6856',
  night: '#193a40',
  light: '#e2ece1',
};

export const clamp = (n) => Math.max(0, Math.min(1, n));
export const mix = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);
export const beat = (k) => k.beat.beatIndex + 1;
export function cue(k, n, phrase, duration = 0) {
  if (beat(k) < n) return 0;
  if (beat(k) > n) return 1;
  return k.reveal(phrase, duration);
}
export function rect(g, x, y, w, h, fill, r = 0) {
  g.fillStyle = fill;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}
export function line(g, x, y, x2, y2, col = C.rule, width = 3) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x2, y2);
  g.strokeStyle = col;
  g.lineWidth = width;
  g.stroke();
}
export function circle(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fill();
}
export function poly(g, points, col) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(...points[0]);
  points.slice(1).forEach((pt) => g.lineTo(...pt));
  g.closePath();
  g.fill();
}
export function text(
  g,
  value,
  x,
  y,
  size = 40,
  col = C.ink,
  face = 'Sans',
  align = 'left',
  max = 1860,
) {
  g.font = '400 ' + size + 'px "Lesson ' + face + '"';
  g.textBaseline = 'alphabetic';
  g.textAlign = align;
  g.fillStyle = col;
  g.fillText(String(value), x, y, max);
}
export const mono = (g, v, x, y, n = 36, col = C.ink, align = 'left', max) =>
  text(g, v, x, y, n, col, 'Mono', align, max);
export const serif = (g, v, x, y, n = 60, col = C.ink, align = 'left', max) =>
  text(g, v, x, y, n, col, 'Serif', align, max);
export function base(g, col = C.paper) {
  rect(g, 0, 0, 1920, 1080, col);
}
export function heading(g, sub, title) {
  text(g, sub, 96, 90, 30, C.sea, 'Mono');
  line(g, 96, 113, 1824, 113, C.rule, 2);
  serif(g, title, 96, 216, 74, C.ink, 'left', 1730);
}
export function chip(g, v, x, y, w, h = 76, fill = C.pale, col = C.ink, size = 37) {
  rect(g, x, y + 4, w, h, '#6a75622a', 7);
  rect(g, x, y, w, h, fill, 7);
  mono(g, v, x + w / 2, y + h / 2 + size * 0.34, size, col, 'center', w - 10);
}
export function arrow(g, x, y, x2, y2, col = C.sea, width = 6) {
  const a = Math.atan2(y2 - y, x2 - x);
  line(g, x, y, x2, y2, col, width);
  poly(
    g,
    [
      [x2, y2],
      [x2 - 19 * Math.cos(a - 0.5), y2 - 19 * Math.sin(a - 0.5)],
      [x2 - 19 * Math.cos(a + 0.5), y2 - 19 * Math.sin(a + 0.5)],
    ],
    col,
  );
}
export const percent = (p) => (100 * p).toFixed(1).replace(/\.0$/, '') + '%';
export function share(g, x, y, w, h, p, left = C.sea, right = C.clay) {
  rect(g, x, y, w, h, right);
  rect(g, x, y, w * p, h, left);
}
export function sheet(g, x, y, w, h, color = C.leaf) {
  rect(g, x + 8, y + 12, w, h, '#37483f25', 3);
  rect(g, x, y, w, h, color, 3);
  line(g, x + 1, y + 1, x + w - 1, y + 1, '#ffffff', 3);
}
export function rows(
  g,
  columns,
  data,
  { x = 100, y = 320, w = 1720, dy = 100, widths, colors = [] } = {},
) {
  const frac = widths ?? columns.map(() => 1 / columns.length);
  let cx = x;
  columns.forEach((name, j) => {
    text(g, name, cx + 14, y, 32, C.muted, 'Sans', 'left', w * frac[j] - 22);
    cx += w * frac[j];
  });
  line(g, x, y + 22, x + w, y + 22, C.ink, 3);
  data.forEach((row, i) => {
    let px = x;
    row.forEach((v, j) => {
      text(
        g,
        v,
        px + 14,
        y + (i + 1) * dy,
        43,
        colors[i] ?? C.ink,
        j === 0 ? 'Serif' : 'Sans',
        'left',
        w * frac[j] - 22,
      );
      px += w * frac[j];
    });
    line(g, x, y + (i + 1) * dy + 24, x + w, y + (i + 1) * dy + 24, C.rule, 2);
  });
}
export function rule(g, x, y, w, min, max, ticks, caption, col = C.muted) {
  const pos = (v) => x + (w * (v - min)) / (max - min);
  line(g, x, y, x + w, y, col, 3);
  ticks.forEach((v) => {
    const xp = pos(v);
    line(g, xp, y - 8, xp, y + 10, col, 3);
    mono(g, v, xp, y + 48, 27, col, 'center');
  });
  text(g, caption, x + w / 2, y + 101, 34, col, 'Sans', 'center');
  return pos;
}
export function withAlpha(g, a, fn) {
  g.save();
  g.globalAlpha *= clamp(a);
  fn();
  g.restore();
}
