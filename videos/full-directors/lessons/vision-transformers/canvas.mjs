import { incidentScreen, pixelStrip } from '../../../films/vision-transformers/incident.mjs';

export const C = {
  bg: '#101e29',
  plate: '#20343f',
  rim: '#4e6872',
  ink: '#f6f4e8',
  sub: '#bed0cf',
  cyan: '#76dbe1',
  gold: '#ffd17d',
  red: '#ff9187',
  blue: '#96bafa',
  green: '#9de3ad',
  deep: '#0a1821',
  purple: '#d7b0ec',
};
export const inks = [C.cyan, C.gold, C.red, C.blue];
export function rect(c, x, y, w, h, fill, stroke, lineWidth = 2) {
  if (fill) {
    c.fillStyle = fill;
    c.fillRect(x, y, w, h);
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = lineWidth;
    c.strokeRect(x, y, w, h);
  }
}
export function line(c, x, y, xx, yy, color = C.rim, width = 3) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
export function arrow(c, x, y, xx, yy, color = C.cyan, width = 6) {
  line(c, x, y, xx, yy, color, width);
  const a = Math.atan2(yy - y, xx - x),
    l = width * 3.5;
  c.beginPath();
  c.moveTo(xx, yy);
  c.lineTo(xx - l * Math.cos(a - 0.47), yy - l * Math.sin(a - 0.47));
  c.lineTo(xx - l * Math.cos(a + 0.47), yy - l * Math.sin(a + 0.47));
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
export function disc(c, x, y, r, fill, stroke) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 3;
    c.stroke();
  }
}
export function text(c, v, x, y, size = 42, color = C.ink, align = 'left', family = 'Sans') {
  c.font = '500 ' + size + 'px "Lesson ' + family + '", "Lesson Symbols", "Lesson Math"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(String(v), x, y);
}
export const mono = (c, v, x, y, size = 45, color = C.ink, align = 'left') =>
  text(c, v, x, y, size, color, align, 'Mono');
export const caption = (c, v, x, y) => text(c, v, x, y, 33, C.sub);
export const title = (c, v) => text(c, v, 105, 107, 64, C.ink, 'left', 'Serif');
export const fmt = (v, d = 3) => String(Number(v.toFixed(d))).replace('-', '−');
export const vec = (a, d = 3) => '[' + a.map((v) => fmt(v, d)).join(', ') + ']';
export const mix = (a, b, t) => a + (b - a) * t;
export const range = (n) => Array.from({ length: n }, (_, i) => i);
export const sum = (a) => a.reduce((s, v) => s + v, 0);
export const dot = (a, b) => sum(a.map((v, i) => v * b[i]));
export function cue(k, b, phrase, seconds = 0) {
  const n = k.beat.beatIndex + 1;
  return n > b ? 1 : n < b ? 0 : k.reveal(phrase, seconds);
}
export function grid(c, x, y, rows, cols, pitch, paint, gap = 2) {
  for (let r = 0; r < rows; r++)
    for (let col = 0; col < cols; col++)
      rect(c, x + col * pitch, y + r * pitch, pitch - gap, pitch - gap, paint(r, col));
}
export function cell(c, x, y, w, h, v, color = C.cyan, size = 48) {
  rect(c, x, y, w, h, C.plate, color, 2);
  mono(c, v, x + w / 2, y + h / 2, size, color, 'center');
}
export function screen(c, x, y, scale, opts = {}) {
  incidentScreen(
    c,
    {
      C: { muted: C.rim, ink: C.ink, red: C.red, blue: C.blue, yellow: C.gold },
      rect: (c, x, y, w, h, f, s) => rect(c, x, y, w, h, f, s),
      text,
    },
    x,
    y,
    scale,
    opts,
  );
}
export function strip(c, values, x, y, unit) {
  pixelStrip(c, { rect }, values, x, y, unit);
}
export function dial(c, x, y, r, angles, colors) {
  disc(c, x, y, r, C.deep, C.rim);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    line(
      c,
      x + (r - 13) * Math.cos(a),
      y - (r - 13) * Math.sin(a),
      x + r * Math.cos(a),
      y - r * Math.sin(a),
      C.rim,
      3,
    );
  }
  angles.forEach((a, i) => {
    const len = r * 0.92;
    arrow(c, x, y, x + Math.cos(a) * len, y - Math.sin(a) * len, colors[i], i ? 7 : 12);
  });
  disc(c, x, y, 9, C.ink);
}
