import { lessonFont } from '../../../lib/fonts.mjs';

export const ink = '#172f37',
  muted = '#546962',
  paper = '#f3f0df',
  teal = '#116d70',
  rust = '#aa4334',
  gold = '#c6892e',
  blue = '#385f94',
  light = '#d1d7c6',
  white = '#fffcf0',
  rose = '#e6baaa',
  sea = '#bfddd1',
  yellow = '#f3cb74';
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const ease = (p) => p * p * (3 - 2 * p);
export const f = (v, n = 3) => (Math.abs(v) < 0.5 * 10 ** -n ? 0 : v).toFixed(n).replace('-', '−');
export const cash = (v, digits = 0) => '$' + v.toFixed(digits);
export const sum = (values) => values.reduce((a, b) => a + b, 0);
export function cue(k, beat, phrase, seconds = 0.7) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  return ease(k.reveal(phrase, seconds));
}
export function text(
  c,
  value,
  x,
  y,
  size = 36,
  color = ink,
  align = 'left',
  family = 'Sans',
  weight = 400,
) {
  c.font = lessonFont(size, family.toLowerCase(), weight);
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(String(value), x, y);
}
export function label(c, value, x, y, color = muted, align = 'left', size = 25) {
  text(c, value, x, y, size, color, align, 'Mono', 500);
}
export function rect(c, x, y, w, h, fill, r = 0) {
  c.fillStyle = fill;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function path(c, pts, color, width = 3, fill = null) {
  if (!pts.length) return;
  c.beginPath();
  c.moveTo(...pts[0]);
  for (const p of pts.slice(1)) c.lineTo(...p);
  if (fill) {
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }
  if (color) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.stroke();
  }
}
export const line = (c, x, y, X, Y, color = ink, width = 3) =>
  path(
    c,
    [
      [x, y],
      [X, Y],
    ],
    color,
    width,
  );
export function dot(c, x, y, radius, color, border) {
  c.beginPath();
  c.arc(x, y, radius, 0, 2 * Math.PI);
  c.fillStyle = color;
  c.fill();
  if (border) {
    c.lineWidth = 4;
    c.strokeStyle = border;
    c.stroke();
  }
}
export function board(c, section, title) {
  const g = c.createLinearGradient(0, 0, 1920, 1080);
  g.addColorStop(0, '#fffbea');
  g.addColorStop(1, '#e8e8d5');
  c.fillStyle = g;
  c.fillRect(0, 0, 1920, 1080);
  rect(c, 0, 0, 1920, 17, ink);
  label(c, section.toUpperCase(), 88, 67, teal, 'left', 25);
  text(c, title, 86, 151, 65, ink, 'left', 'Serif');
  line(c, 88, 217, 1832, 217, '#a6b8a9', 2);
}
export function plate(c, x, y, w, h, fill = ink) {
  rect(c, x + 4, y + 8, w, h, '#c5c7b6', 16);
  rect(c, x, y, w, h, fill, 16);
  for (const X of [x + 15, x + w - 15])
    for (const Y of [y + 14, y + h - 14]) {
      dot(c, X, Y, 4, '#82938a');
      line(c, X - 2, Y + 1, X + 2, Y - 1, ink, 1.4);
    }
}
export function ticket(c, x, y, w, h, id, mid, bottom, edge = teal, fill = white) {
  const pts = [
    [x, y + 12],
    [x + 12, y],
    [x + w - 12, y],
    [x + w, y + 12],
    [x + w, y + h],
    [x, y + h],
  ];
  path(c, pts, ink, 2, fill);
  rect(c, x + 2, y + 17, 7, h - 19, edge);
  text(c, id, x + w / 2, y + h * 0.23, Math.min(40, h * 0.23), ink, 'center', 'Mono', 600);
  if (mid !== undefined)
    text(c, mid, x + w / 2, y + h * 0.55, Math.min(32, h * 0.21), muted, 'center', 'Mono');
  if (bottom) {
    line(c, x + 17, y + h * 0.71, x + w - 17, y + h * 0.71, light, 1.5);
    text(c, bottom, x + w / 2, y + h * 0.85, Math.min(26, h * 0.16), edge, 'center', 'Sans', 600);
  }
}
export function readout(c, name, value, x, y, color = teal, size = 57) {
  label(c, name, x, y, muted);
  text(c, value, x, y + 62, size, color, 'left', 'Mono', 500);
}
export function plot(
  c,
  { x = 145, y = 310, w = 1050, h = 470, xrange, yrange, xticks, yticks, xlabel, ylabel },
) {
  const X = (v) => x + (w * (v - xrange[0])) / (xrange[1] - xrange[0]);
  const Y = (v) => y + h - (h * (v - yrange[0])) / (yrange[1] - yrange[0]);
  rect(c, x, y, w, h, '#fffcef', 5);
  for (const t of yticks) {
    const yy = Y(t);
    line(c, x, yy, x + w, yy, light, 2);
    label(c, t, x - 15, yy, muted, 'right', 23);
  }
  for (const t of xticks) {
    const xx = X(t);
    line(c, xx, y, xx, y + h, '#e2e3d3', 1.5);
    label(c, t, xx, y + h + 31, muted, 'center', 23);
  }
  line(c, x, y, x, y + h, muted, 2);
  line(c, x, y + h, x + w, y + h, muted, 2);
  label(c, ylabel, x, y - 31, ink);
  label(c, xlabel, x + w / 2, y + h + 74, ink, 'center');
  return { X, Y, xy: (a, b) => [X(a), Y(b)] };
}
export function curve(c, g, fn, lo, hi, color = teal, width = 6) {
  path(
    c,
    Array.from({ length: 121 }, (_, i) => {
      const x = lerp(lo, hi, i / 120);
      return g.xy(x, fn(x));
    }),
    color,
    width,
  );
}
export function gridTable(
  c,
  { x = 96, y = 310, columns, headers, rows, rowH = 67, highlight = -1, colors = [] },
) {
  const total = sum(columns);
  rect(c, x, y, total, 58, ink, 5);
  let dx = x;
  headers.forEach((v, j) => {
    text(c, v, dx + columns[j] / 2, y + 30, 26, white, 'center', 'Sans', 600);
    dx += columns[j];
  });
  rows.forEach((row, i) => {
    const top = y + 59 + i * rowH;
    rect(c, x, top, total, rowH - 2, i === highlight ? sea : i % 2 === 0 ? '#fffbeb' : '#e7e8d7');
    dx = x;
    row.forEach((v, j) => {
      text(
        c,
        v,
        dx + columns[j] / 2,
        top + rowH / 2,
        Math.min(32, rowH * 0.52),
        colors[j] ?? ink,
        'center',
        'Mono',
      );
      dx += columns[j];
    });
  });
}
