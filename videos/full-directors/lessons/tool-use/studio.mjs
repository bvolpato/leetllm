export const P = {
  paper: '#f5efdf',
  pale: '#fffaee',
  ink: '#172e33',
  teal: '#146861',
  sea: '#377981',
  dim: '#526966',
  rule: '#a9b8ac',
  night: '#102e35',
  light: '#e8f0da',
  mint: '#abddc1',
  rust: '#9b3c2b',
  rose: '#f6c0a5',
  brass: '#efbc62',
  gold: '#80530f',
  blue: '#344e88',
};
export function box(c, x, y, w, h, color, r = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function line(c, x, y, u, v, color = P.rule, width = 2, dash = []) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.stroke();
  c.restore();
}
export function path(c, points, color) {
  c.fillStyle = color;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}
export function circle(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
export function text(
  c,
  value,
  x,
  y,
  size = 24,
  color = P.ink,
  family = 'Sans',
  width = 1100,
  weight = 400,
) {
  c.save();
  c.fillStyle = color;
  c.textBaseline = 'alphabetic';
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  const measured = c.measureText(String(value)).width;
  if (measured > width)
    c.font = weight + ' ' + (size * width) / measured + 'px "Lesson ' + family + '"';
  c.fillText(String(value), x, y);
  c.restore();
}
export const mono = (c, s, x, y, size = 23, color = P.teal, width = 1100) =>
  text(c, s, x, y, size, color, 'Mono', width);
export const serif = (c, s, x, y, size = 44, color = P.ink, width = 1100) =>
  text(c, s, x, y, size, color, 'Serif', width);
export function label(c, s, x, y, color = P.dim, w = 1050) {
  text(c, s, x, y, 19, color, 'Sans', w, 600);
}
export function page(c, title, section, dark = false) {
  box(c, 0, 0, 1200, 675, dark ? P.night : P.paper);
  label(c, section, 65, 69, dark ? P.mint : P.teal);
  serif(c, title, 62, 144, 53, dark ? P.pale : P.ink, 1075);
  line(c, 64, 177, 1136, 177, dark ? '#52716e' : P.rule, 1.5);
}
export function slip(c, x, y, w, h, tint = P.pale) {
  box(c, x + 4, y + 6, w, h, '#152a3026', 3);
  box(c, x, y, w, h, tint, 3);
  line(c, x + 15, y + 11, x + 15, y + h - 11, '#d6b99a', 1.5, [5, 4]);
}
export function chip(c, s, x, y, w = 190, color = P.teal, ink = P.pale) {
  box(c, x, y, w, 40, color, 4);
  mono(c, s, x + 12, y + 28, 21, ink, w - 24);
}
export function rows(c, x, y, w, entries, { dy = 75, valueX = w * 0.45, dark = false } = {}) {
  entries.forEach(([name, value, accent], i) => {
    const top = y + i * dy;
    label(c, name, x, top + 25, dark ? P.light : P.dim, valueX - 12);
    mono(c, value, x + valueX, top + 28, 24, accent ?? (dark ? P.mint : P.teal), w - valueX);
    line(c, x, top + 45, x + w, top + 45, dark ? '#476567' : P.rule, 1);
  });
}
export function arrow(c, x, y, u, v, color = P.teal, width = 3) {
  const a = Math.atan2(v - y, u - x);
  line(c, x, y, u, v, color, width);
  path(
    c,
    [
      [u, v],
      [u - 14 * Math.cos(a - 0.43), v - 14 * Math.sin(a - 0.43)],
      [u - 14 * Math.cos(a + 0.43), v - 14 * Math.sin(a + 0.43)],
    ],
    color,
  );
}
export function cue(k, beat, phrase, seconds = 0) {
  const now = k.beat.beatIndex + 1;
  if (now !== beat) return Number(now > beat);
  return phrase ? k.reveal(phrase, seconds) : Number(k.elapsed >= k.speechDuration);
}
export function gauge(c, x, y, w, value, max, limit, unit, color = P.sea) {
  box(c, x, y, w, 16, '#b9c7b9', 3);
  if (value != null) box(c, x, y, (w * value) / max, 16, color, 3);
  if (limit != null) {
    const mark = x + (w * limit) / max;
    line(c, mark, y - 14, mark, y + 28, P.rust, 3);
    mono(c, 'cap ' + limit + unit, Math.min(mark - 33, x + w - 90), y + 59, 19, P.rust, 175);
  }
}
export const pretty = (v) => Number(v.toFixed(3)).toString();
