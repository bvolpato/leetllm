import { lessonFont } from '../../../lib/fonts.mjs';

export const C = {
  ink: '#183734',
  deep: '#103b35',
  field: '#23534b',
  light: '#f9f0d5',
  paper: '#fff8e3',
  rule: '#a4ab8e',
  muted: '#4b6860',
  mint: '#aee4bd',
  ok: '#216549',
  gold: '#f3c65d',
  rust: '#aa4a34',
  coral: '#ffad89',
  blue: '#3c6385',
  pale: '#d7e2da',
  white: '#fffcf2',
};
export const fmt = (n) => n.toLocaleString('en-US');
export const cents = (n, digits = 3) => (n / 10000).toFixed(digits) + '¢';
export const smooth = (n) => n * n * (3 - 2 * n);

export function cue(k, beat, phrase, duration = 0) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  return k.reveal(phrase, duration);
}
export function spoken(k, beat) {
  return k.beat.beatIndex > beat || (k.beat.beatIndex === beat && k.elapsed >= k.speechDuration);
}
export function box(g, x, y, w, h, fill, r = 0, stroke = null, sw = 2) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = sw;
    g.stroke();
  }
}
export function line(g, x, y, xx, yy, color = C.ink, width = 3, dash = []) {
  g.save();
  g.setLineDash(dash);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(xx, yy);
  g.stroke();
  g.restore();
}
export function circle(g, x, y, r, fill, stroke = null, sw = 2) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = sw;
    g.stroke();
  }
}
export function txt(
  g,
  s,
  x,
  y,
  size = 36,
  color = C.ink,
  face = 'sans',
  align = 'left',
  weight = 400,
) {
  g.font = lessonFont(size, face, weight);
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillText(String(s), x, y);
}
export function small(g, s, x, y, color = C.muted, size = 28) {
  txt(g, s, x, y, size, color, 'mono');
}
export function base(g, light = false) {
  const a = light ? '#ebe5cf' : '#2e5c50',
    b = light ? '#dddac0' : '#163d38';
  const grad = g.createLinearGradient(0, 0, 1920, 1080);
  grad.addColorStop(0, a);
  grad.addColorStop(1, b);
  g.fillStyle = grad;
  g.fillRect(0, 0, 1920, 1080);
  // The ruled surface continues around a sheet or instrument as the camera moves closer.
  const grid = light ? 'rgba(64,86,65,.08)' : 'rgba(216,242,206,.055)';
  for (let x = 0; x < 1920; x += 48) line(g, x, 0, x, 1080, grid, 1);
  for (let y = 0; y < 1080; y += 48) line(g, 0, y, 1920, y, grid, 1);
}
export function paper(g, x, y, w, h, fill = C.paper) {
  box(g, x + 10, y + 12, w, h, 'rgba(20,37,31,.20)', 6);
  box(g, x, y, w, h, fill, 6);
}
export function strip(g, x, y, w, h, fill = C.light) {
  paper(g, x, y, w, h, fill);
  for (let i = 18; i < h - 6; i += 36) {
    circle(g, x + 13, y + i, 4, C.rule);
    circle(g, x + w - 13, y + i, 4, C.rule);
  }
}
export function mark(g, x, y, pass, r = 15) {
  const color = pass ? C.ok : C.rust;
  circle(g, x, y, r, pass ? '#d1e5c8' : '#f2d6c1');
  if (pass) {
    line(g, x - 0.53 * r, y, x - 0.12 * r, y + 0.4 * r, color, 3);
    line(g, x - 0.12 * r, y + 0.4 * r, x + 0.56 * r, y - 0.42 * r, color, 3);
  } else {
    line(g, x - r * 0.42, y - r * 0.42, x + r * 0.42, y + r * 0.42, color, 3);
    line(g, x + r * 0.42, y - r * 0.42, x - r * 0.42, y + r * 0.42, color, 3);
  }
}
export function stamp(g, s, x, y, color = C.ok, size = 36) {
  g.font = lessonFont(size, 'mono', 400);
  const w = g.measureText(s).width + 42;
  box(g, x, y - size - 12, w, size + 30, null, 4, color, 3);
  txt(g, s, x + 21, y, size, color, 'mono');
}
export function arrow(g, x, y, xx, color = C.ink) {
  const dir = Math.sign(xx - x);
  line(g, x, y, xx, y, color, 4);
  line(g, xx, y, xx - dir * 13, y - 9, color, 4);
  line(g, xx, y, xx - dir * 13, y + 9, color, 4);
}
