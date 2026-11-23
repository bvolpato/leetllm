import { lessonFont } from '../../../lib/fonts.mjs';
import { documents, SHORT } from '../../../films/recommendation/fixtures.mjs';

export const C = {
  paper: '#f7f0df',
  field: '#e9dfc7',
  ink: '#172f34',
  quiet: '#4c6262',
  rule: '#a9afa0',
  teal: '#126e65',
  gold: '#edb84e',
  red: '#a23a39',
  blue: '#2c5f88',
  pale: '#fff9eb',
  dark: '#132f33',
  muted: '#b9d0c3',
};
export const ids = [
  'api-guide',
  'retry-runbook',
  'sdk-example',
  'blog-post',
  'legacy-changelog',
  'private-draft',
  'stale-guide',
];
export const hues = ['#19756c', '#365e8b', '#9f5435', '#80546f', '#626b61', '#913c43', '#756649'];
export const name = (id) => SHORT[id];
export const hue = (id) => hues[ids.indexOf(id)];
export const doc = (id) => documents.find((d) => d.id === id);
export const B = (clock) => clock.beat.beatIndex + 1;
export function cue(clock, beat, words, span = 0) {
  const b = B(clock);
  return b < beat ? 0 : b > beat ? 1 : clock.reveal(words, span);
}
export function spoken(clock, beat, words) {
  const b = B(clock);
  if (b !== beat) return b > beat;
  const { start, end } = clock.wordCue(words);
  return clock.reveal(words, end - start, { captionStart: false }) === 1;
}
export function rect(c, x, y, w, h, fill, stroke, weight = 2) {
  if (fill) {
    c.fillStyle = fill;
    c.fillRect(x, y, w, h);
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = weight;
    c.strokeRect(x, y, w, h);
  }
}
export function line(c, points, color = C.ink, width = 3) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.stroke();
}
export function circle(c, x, y, r, color, stroke) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  if (color) {
    c.fillStyle = color;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 3;
    c.stroke();
  }
}
export function text(
  c,
  s,
  x,
  y,
  size = 35,
  color = C.ink,
  font = 'sans',
  align = 'left',
  max = 1800,
) {
  c.save();
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.font = lessonFont(size, font, 400);
  const w = c.measureText(String(s)).width;
  if (w > max) c.font = lessonFont(Math.floor((size * max) / w), font, 400);
  c.fillText(String(s), x, y);
  c.restore();
}
export function base(c, dark = false) {
  rect(c, 0, 0, 1920, 1080, dark ? C.dark : C.paper);
}
export function heading(c, title, kicker, dark = false) {
  const ink = dark ? C.pale : C.ink,
    muted = dark ? C.muted : C.quiet;
  text(c, kicker, 105, 98, 31, muted, 'mono');
  text(c, title, 100, 205, 76, ink, 'serif', 'left', 1710);
}
export function shelf(c, x, y, w) {
  rect(c, x, y, w, 17, '#9b7959');
  rect(c, x, y + 17, w, 17, '#684e3d');
  line(
    c,
    [
      [x + 5, y + 4],
      [x + w - 4, y + 4],
    ],
    '#ceb897',
    3,
  );
}
export function glyph(c, id, x, y, size, color) {
  c.save();
  c.translate(x, y);
  c.scale(size / 100, size / 100);
  const stroke = (pts, w = 6) => line(c, pts, color, w);
  if (id === ids[0]) {
    stroke([
      [8, 12],
      [8, 85],
      [94, 85],
    ]);
    for (let i = 0; i < 3; i++)
      stroke([
        [24, 66 - i * 18],
        [49 + i * 14, 66 - i * 18],
      ]);
  } else if (id === ids[1]) {
    c.beginPath();
    c.arc(50, 54, 31, -2.8, 1.5 * Math.PI);
    c.strokeStyle = color;
    c.lineWidth = 7;
    c.stroke();
    stroke([
      [36, 14],
      [54, 23],
      [39, 36],
    ]);
    stroke([
      [34, 56],
      [46, 67],
      [67, 43],
    ]);
  } else if (id === ids[2]) {
    stroke([
      [33, 27],
      [12, 51],
      [32, 74],
    ]);
    stroke([
      [65, 26],
      [89, 50],
      [67, 75],
    ]);
    stroke([
      [58, 20],
      [43, 82],
    ]);
  } else if (id === ids[3]) {
    stroke([
      [10, 26],
      [89, 26],
    ]);
    stroke([
      [10, 43],
      [89, 43],
    ]);
    rect(c, 10, 58, 33, 24, color);
    stroke([
      [54, 59],
      [89, 59],
    ]);
    stroke([
      [54, 78],
      [80, 78],
    ]);
  } else if (id === ids[4]) {
    stroke([
      [21, 13],
      [21, 87],
    ]);
    for (let i = 0; i < 3; i++) {
      circle(c, 21, 24 + i * 25, 7, color);
      stroke([
        [38, 24 + i * 25],
        [85 - i * 8, 24 + i * 25],
      ]);
    }
  } else if (id === ids[5]) {
    c.beginPath();
    c.arc(50, 43, 18, Math.PI, 2 * Math.PI);
    c.strokeStyle = color;
    c.lineWidth = 7;
    c.stroke();
    rect(c, 22, 42, 56, 42, color);
    circle(c, 50, 58, 4, hue(id));
  } else {
    circle(c, 50, 50, 33, null, color);
    stroke([
      [50, 28],
      [50, 52],
      [66, 63],
    ]);
  }
  c.restore();
}
export function book(c, id, x, y, w, h, { label = name(id), sub = '', muted = false } = {}) {
  const edge = Math.max(6, Math.round(w * 0.035)),
    cover = muted ? '#747a73' : hue(id);
  rect(c, x + 8, y + 9, w, h, '#b6ab91');
  rect(c, x + 3, y + 3, w, h, '#e3d4b5');
  for (let j = 2; j <= 6; j += 2)
    line(
      c,
      [
        [x + 8, y + h + j],
        [x + w + 2, y + h + j],
      ],
      '#b4a487',
      1,
    );
  rect(c, x, y, w, h, cover);
  const binding = Math.max(17, w * 0.066);
  rect(c, x, y, binding, h, '#14252847');
  line(
    c,
    [
      [x + binding, y + 1],
      [x + binding, y + h - 1],
    ],
    '#10282070',
    2,
  );
  line(
    c,
    [
      [x + binding + 4, y + 1],
      [x + binding + 4, y + h - 2],
    ],
    '#ffffff42',
    2,
  );
  for (const end of [0.1, 0.86]) {
    rect(c, x + 1, y + end * h, binding - 2, 3, '#e8d8b198');
    rect(c, x + 1, y + end * h + 8, binding - 2, 2, '#e8d8b17a');
  }
  const right = x + w;
  line(
    c,
    [
      [right - 41, y + 5],
      [right - 5, y + 5],
      [right - 5, y + 40],
    ],
    '#f4eace55',
    2,
  );
  line(
    c,
    [
      [right - 43, y + h - 6],
      [right - 6, y + h - 6],
      [right - 6, y + h - 43],
    ],
    '#f4eace55',
    2,
  );
  const ribbon = x + w * 0.78;
  c.beginPath();
  c.moveTo(ribbon, y + h - 1);
  c.lineTo(ribbon + 19, y + h - 1);
  c.lineTo(ribbon + 19, y + h + 16);
  c.lineTo(ribbon + 10, y + h + 11);
  c.lineTo(ribbon, y + h + 16);
  c.closePath();
  c.fillStyle = '#c89f53';
  c.fill();
  const pad = Math.max(edge + 10, w * 0.105);
  text(
    c,
    label,
    x + pad,
    y + h * 0.25,
    Math.min(58, w * 0.13),
    C.pale,
    'serif',
    'left',
    w - pad * 1.4,
  );
  glyph(c, id, x + w * 0.33, y + h * 0.33, Math.min(w * 0.38, h * 0.45), C.pale);
  if (sub)
    text(
      c,
      sub,
      x + pad,
      y + h * 0.9,
      Math.min(33, w * 0.092),
      C.pale,
      'mono',
      'left',
      w - pad * 1.35,
    );
}
export function spine(c, id, x, y, w, h, detail = '', dim = false) {
  const color = dim ? '#726e68' : hue(id);
  rect(c, x + 4, y + 5, w, h, '#c6bca8');
  rect(c, x, y, w, h, color);
  rect(c, x, y, 15, h, '#1326234a');
  line(
    c,
    [
      [x + 16, y + 4],
      [x + 16, y + h - 4],
    ],
    '#ffffff70',
    2,
  );
  rect(c, x + w - 8, y + 4, 13, h - 8, '#d8cbb2');
  for (const off of [8, 14, 20])
    line(
      c,
      [
        [x + w - 7, y + h - off],
        [x + w + 5, y + h - off],
      ],
      '#a89a84',
      1,
    );
  glyph(c, id, x + 25, y + 6, h - 12, C.pale);
  const offset = h + 35;
  text(
    c,
    name(id),
    x + offset,
    y + h * 0.65,
    Math.min(37, h * 0.5),
    C.pale,
    'serif',
    'left',
    w - offset - (detail ? w * 0.36 : 12),
  );
  if (detail)
    text(
      c,
      detail,
      x + w - 15,
      y + h * 0.65,
      Math.min(30, h * 0.41),
      C.pale,
      'mono',
      'right',
      w * 0.35,
    );
}
export function pocket(c, x, y, w, h, label) {
  rect(c, x, y, w, h, '#e4dac3');
  line(
    c,
    [
      [x, y],
      [x, y + h],
      [x + w, y + h],
      [x + w, y],
    ],
    '#9e9683',
    3,
  );
  if (label) text(c, label, x + w / 2, y + h * 0.66, 32, C.quiet, 'sans', 'center', w - 40);
}
export function arrow(c, x, y, X, Y, color = C.quiet) {
  line(
    c,
    [
      [x, y],
      [X, Y],
    ],
    color,
    4,
  );
  const a = Math.atan2(Y - y, X - x);
  line(
    c,
    [
      [X - 16 * Math.cos(a - 0.55), Y - 16 * Math.sin(a - 0.55)],
      [X, Y],
      [X - 16 * Math.cos(a + 0.55), Y - 16 * Math.sin(a + 0.55)],
    ],
    color,
    4,
  );
}
export function tag(c, s, x, y, color = C.teal) {
  text(c, s, x, y, 31, color, 'mono');
}
export function frac(v, n = 3) {
  return Number(v).toFixed(n);
}
export function formula(c, s, x, y, w = 1650, size = 48, color = C.ink) {
  text(c, s, x, y, size, color, 'mono', 'left', w);
}
export function dots(c, x, y, count, columns, size, shade) {
  for (let i = 0; i < count; i++)
    circle(c, x + (i % columns) * size, y + Math.floor(i / columns) * size, size * 0.34, shade(i));
}
