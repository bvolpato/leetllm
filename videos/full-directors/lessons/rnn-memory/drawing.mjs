import { lessonFont } from '../../../lib/fonts.mjs';

// Coordinates are in the host's 1920 × 1080 picture.
export const paper = '#f6f1e6',
  pale = '#fffcf4',
  ink = '#172e39',
  mute = '#536571',
  rule = '#bcc6c1',
  teal = '#076e73',
  blue = '#245b93',
  red = '#a54236',
  gold = '#94651b',
  green = '#32764d',
  blush = '#f0d9ca',
  sea = '#c4e0d9';
export const night = '#122838',
  chalk = '#f7eedb',
  fog = '#a6bdc6',
  ice = '#8ce1cf',
  flame = '#ffba7b',
  rose = '#f79d97';
export const clamp = (v) => Math.max(0, Math.min(1, v));
export const lerp = (a, b, v) => a + (b - a) * clamp(v);
export const fmt = (v, d = 3) => Number(v).toFixed(d).replace('-', '−');
export const pair = (xs, d = 3) => '[' + xs.map((v) => fmt(v, d)).join(', ') + ']';
export const cue = (k, beat, phrase, seconds = 0.8, options) => {
  if (k.beat.beatIndex !== beat - 1) return Number(k.beat.beatIndex > beat - 1);
  const t = k.reveal(phrase, seconds, options);
  return t * t * (3 - 2 * t);
};
export function rect(c, x, y, w, h, fill) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}
export function line(c, x1, y1, x2, y2, color = rule, width = 3, dash = []) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.restore();
}
export function ellipse(c, x, y, rx, ry, fill, tilt = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, tilt, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}
export const dot = (c, x, y, r, fill) => ellipse(c, x, y, r, r, fill);
export function poly(c, points, color) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
export function arrow(c, x, y, ex, ey, color, width = 6) {
  const a = Math.atan2(ey - y, ex - x),
    head = Math.min(22, Math.hypot(ex - x, ey - y) * 0.45);
  const hx = ex - head * Math.cos(a),
    hy = ey - head * Math.sin(a);
  line(c, x, y, hx, hy, color, width);
  poly(
    c,
    [
      [ex, ey],
      [hx + head * 0.45 * Math.sin(a), hy - head * 0.45 * Math.cos(a)],
      [hx - head * 0.45 * Math.sin(a), hy + head * 0.45 * Math.cos(a)],
    ],
    color,
  );
}
export function text(
  c,
  value,
  x,
  y,
  size = 40,
  color = ink,
  align = 'left',
  family = 'Sans',
  weight = 400,
) {
  c.font = lessonFont(size, family.toLowerCase(), weight);
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(String(value), x, y);
}
export const num = (c, v, x, y, size = 40, color = ink, align = 'left') =>
  text(c, v, x, y, size, color, align, 'Mono');
export const title = (c, v, dark = false) =>
  text(c, v, 105, 100, 69, dark ? chalk : ink, 'left', 'Serif');
export function note(c, v, y = 935, dark = false) {
  text(c, v, 960, y, 38, dark ? fog : mute, 'center');
}
export function footFormula(c, v, dark = false) {
  line(c, 108, 838, 1812, 838, dark ? '#3c5461' : rule, 2);
  num(c, v, 960, 870, 44, dark ? chalk : ink, 'center');
}
export function alpha(c, a, draw) {
  if (a <= 0) return;
  c.save();
  c.globalAlpha *= clamp(a);
  draw();
  c.restore();
}
// Both animals face right. The camera can flip the entire chase without reversing the text.
export function animal(c, kind, x, y, scale, color, phase = 0, facing = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale * facing, scale);
  const dog = kind === 'dog';
  const stride = Math.sin(phase) * 11;
  for (const [hip, side] of [
    [-46, -1],
    [-30, 1],
    [29, -1],
    [42, 1],
  ]) {
    const knee = hip + (hip < 0 ? -17 : 16) + side * stride;
    const foot = knee + (hip < 0 ? -15 : 20) + side * stride;
    line(c, hip, 4, knee, 30, color, dog ? 14 : 10);
    line(c, knee, 30, foot, 46 + side * 3, color, dog ? 10 : 8);
    line(c, foot, 46 + side * 3, foot + 10, 46 + side * 3, color, 8);
  }
  ellipse(c, -5, -4, dog ? 64 : 53, dog ? 26 : 21, color, -0.07);
  c.beginPath();
  c.moveTo(dog ? -60 : -51, -9);
  if (dog) c.bezierCurveTo(-90, -15, -109, -36, -118, -28);
  else c.bezierCurveTo(-94, -5, -113, -57, -85, -68);
  c.lineWidth = dog ? 13 : 10;
  c.lineCap = 'round';
  c.strokeStyle = color;
  c.stroke();
  ellipse(c, 46, -22, dog ? 24 : 15, 30, color, 0.32);
  ellipse(c, 63, -41, dog ? 30 : 23, dog ? 25 : 20, color);
  if (dog) {
    ellipse(c, 85, -35, 24, 13, color, -0.12);
    ellipse(c, 48, -36, 11, 25, '#172c39', 0.3);
    dot(c, 105, -40, 5, '#172c39');
  } else {
    poly(
      c,
      [
        [45, -49],
        [44, -79],
        [65, -58],
      ],
      color,
    );
    poly(
      c,
      [
        [62, -58],
        [82, -79],
        [83, -48],
      ],
      color,
    );
    poly(
      c,
      [
        [81, -43],
        [94, -39],
        [80, -30],
      ],
      color,
    );
    for (const d of [-5, 1, 7]) line(c, 83, -34, 101, -34 + d, color, 1.6);
  }
  dot(c, dog ? 75 : 74, -46, 3, pale);
  c.restore();
}
