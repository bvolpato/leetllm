import { readFile } from 'node:fs/promises';
import { loadImage } from '@napi-rs/canvas';
import { lessonFont } from '../../../lib/fonts.mjs';

async function art(name) {
  return loadImage(await readFile(new URL(name + '.svg', import.meta.url)));
}
export const [kingfisher, egret, marsh] = await Promise.all(
  ['kingfisher', 'egret', 'marsh'].map(art),
);
export const C = {
  paper: '#f5f0e5',
  card: '#fffcf4',
  ink: '#203737',
  muted: '#536664',
  line: '#b7c2b5',
  pine: '#146258',
  mint: '#b5dfc9',
  brass: '#94531c',
  gold: '#f1bc6b',
  red: '#a04437',
  rose: '#f3c1ae',
  sea: '#316780',
  blue: '#b9dbe4',
  dark: '#183838',
  white: '#fff9e9',
};
export const fmt = (n) => n.toLocaleString('en-US');
export function measure(c, value, size, face = 'sans', weight = 400) {
  c.font = lessonFont(size, face, weight);
  return c.measureText(String(value)).width;
}
export function text(
  c,
  value,
  x,
  y,
  size,
  color = C.ink,
  face = 'sans',
  weight = 400,
  align = 'left',
) {
  c.font = lessonFont(size, face, weight);
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(String(value), x, y);
}
export function line(c, x1, y1, x2, y2, color = C.line, width = 3) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.lineWidth = width;
  c.strokeStyle = color;
  c.stroke();
}
export function box(c, x, y, w, h, color, r = 0) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = color;
  c.fill();
}
export function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fillStyle = color;
  c.fill();
}
export function portrait(c, img, x, y, r) {
  dot(c, x, y, r + 5, C.card);
  c.save();
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.clip();
  c.drawImage(img, x - r, y - r, 2 * r, 2 * r);
  c.restore();
}
export function sky(c, x, y, w, h) {
  box(c, x, y, w, h, '#23394c', 12);
  const pts = [
    [0.1, 0.75],
    [0.27, 0.43],
    [0.43, 0.55],
    [0.65, 0.28],
    [0.83, 0.39],
  ];
  for (let i = 1; i < pts.length; i++)
    line(
      c,
      x + w * pts[i - 1][0],
      y + h * pts[i - 1][1],
      x + w * pts[i][0],
      y + h * pts[i][1],
      '#98c4d2',
      3,
    );
  for (const [a, b] of pts) {
    dot(c, x + w * a, y + h * b, 10, C.gold);
    dot(c, x + w * a, y + h * b, 4, C.card);
  }
}
export function page(c, section, title, dark = false) {
  const g = c.createLinearGradient(0, 0, 1920, 1080);
  g.addColorStop(0, dark ? '#173536' : '#f9f4e8');
  g.addColorStop(1, dark ? '#244647' : '#eaece1');
  c.fillStyle = g;
  c.fillRect(0, 0, 1920, 1080);
  text(c, section, 92, 83, 28, dark ? C.mint : C.pine, 'sans', 600);
  line(c, 92, 105, 1828, 105, dark ? '#54716b' : C.line, 2);
  text(c, title, 88, 212, 72, dark ? C.white : C.ink, 'serif');
}
export function label(c, s, x, y, dark = false) {
  text(c, s, x, y, 30, dark ? C.mint : C.muted, 'sans', 600);
}
export function stamp(c, s, x, y, fill = C.pine, ink = C.white, size = 37) {
  const w = measure(c, s, size, 'sans', 600) + 56;
  box(c, x, y, w, size + 32, fill, 8);
  text(c, s, x + 28, y + size + 6, size, ink, 'sans', 600);
}
export function ruledPage(c, x, y, w, h) {
  box(c, x + 11, y + 16, w, h, '#c4c5b6', 11);
  box(c, x + 4, y + 7, w, h, '#e5dfcb', 11);
  box(c, x, y, w, h, C.card, 11);
  box(c, x, y, 19, h, C.pine, 4);
}
export function clockCue(k, index, phrase, seconds = 0) {
  if (k.beat.beatIndex < index) return 0;
  if (k.beat.beatIndex > index) return 1;
  return k.reveal(phrase, seconds);
}
export function initials(c, x, y, r) {
  dot(c, x, y, r + 5, C.card);
  dot(c, x, y, r, '#354356');
  text(c, 'RB', x, y + r * 0.31, r * 0.9, C.white, 'serif', 400, 'center');
}
