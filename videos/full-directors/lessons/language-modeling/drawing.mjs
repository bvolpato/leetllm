import { Path2D } from '@napi-rs/canvas';
export const C = {
  paper: '#f7f1e2',
  ink: '#162d34',
  muted: '#526568',
  line: '#b2b6a9',
  faint: '#e4e2d4',
  blue: '#245e79',
  teal: '#25796f',
  gold: '#d29b46',
  red: '#ac4536',
  plum: '#705777',
  cream: '#fff8e9',
  mint: '#b7d8c6',
  rose: '#edc4b3',
  sand: '#ead5a6',
};
export const clamp = (t) => Math.min(1, Math.max(0, t));
export const ease = (t) => t * t * (3 - 2 * t);
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export const product = (a) => a.reduce((x, y) => x * y, 1);
export const pct = (p) => Math.round(1000 * p) / 10 + '%';
export const fixed = (x, d = 2) => x.toFixed(d).replace('-', '−');
export function rect(c, x, y, w, h, fill, stroke, lineWidth = 1) {
  if (fill) {
    c.fillStyle = fill;
    c.fillRect(x, y, w, h);
  }
  if (stroke) {
    c.lineWidth = lineWidth;
    c.strokeStyle = stroke;
    c.strokeRect(x, y, w, h);
  }
}
export function line(c, x, y, xx, yy, color = C.line, width = 1) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
export function dot(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
export function polygon(c, pts, fill) {
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(...pts[0]);
  for (const p of pts.slice(1)) c.lineTo(...p);
  c.closePath();
  c.fill();
}
export function type(c, msg, x, y, size = 21, color = C.ink, opt = {}) {
  c.font = (opt.weight || 400) + ' ' + size + 'px "Lesson ' + (opt.face || 'Sans') + '"';
  c.textBaseline = 'middle';
  c.textAlign = opt.align || 'left';
  c.fillStyle = color;
  c.fillText(String(msg), x, y, opt.max || 890);
}
export function tag(c, msg, x, y, color = C.muted) {
  type(c, msg.toUpperCase(), x, y, 14, color, { weight: 700 });
}
export function big(c, msg, x, y, size = 37, color = C.ink) {
  type(c, msg, x, y, size, color, { face: 'Serif' });
}
export function token(c, word, x, y, w = 126, opt = {}) {
  const h = opt.h || 57;
  const fill = opt.fill || C.cream;
  rect(c, x, y + 4, w, h, opt.edge || C.line);
  rect(c, x, y, w, h, fill, opt.edge || C.line);
  if (word !== '')
    type(c, word, x + w / 2, y + h / 2, opt.size || 26, opt.color || C.ink, {
      align: 'center',
      face: opt.face || 'Serif',
      max: w - 10,
    });
}
export function row(c, words, x, y, w, gap = 7, opts = []) {
  words.forEach((word, i) => token(c, word, x + i * (w + gap), y, w, opts[i]));
}
export function rail(c, x, y, w, h, parts, palette = [C.blue, C.teal, C.red, C.plum], font = 18) {
  let left = x;
  for (const [i, [label, p]] of parts.entries()) {
    const width = w * p;
    rect(c, left, y, width, h, palette[i % palette.length]);
    if (i > 0) line(c, left, y, left, y + h, C.paper, 2);
    if (label && width > 16)
      type(c, label, left + width / 2, y + h / 2, font, C.cream, {
        align: 'center',
        weight: 600,
        max: width - 7,
      });
    left += width;
  }
}
export function ticks(c, x, y, width, count, step = 1) {
  line(c, x, y, x + width, y);
  for (let i = 0; i <= count; i++)
    line(
      c,
      x + (i / count) * width,
      y,
      x + (i / count) * width,
      y + (i % step === 0 ? 10 : 5),
      C.muted,
    );
}
export function bracket(c, x, y, w, label, color = C.teal) {
  line(c, x, y, x, y + 8, color, 2);
  line(c, x, y + 8, x + w, y + 8, color, 2);
  line(c, x + w, y, x + w, y + 8, color, 2);
  type(c, label, x + w / 2, y + 27, 19, color, {
    align: 'center',
    weight: 600,
    max: Math.max(w + 50, 150),
  });
}
export function heading(c, title, section) {
  rect(c, 0, 0, 960, 540, C.paper);
  tag(c, section, 44, 36, C.teal);
  big(c, title, 42, 83, 39);
  line(c, 44, 121, 916, 121, C.line, 1);
}
export function cue(k, b, phrase, span = 0.48) {
  const index = k.beat.beatIndex;
  return index === b ? ease(k.reveal(phrase, span)) : Number(index > b);
}
export function hatching(c, x, y, w, h, color = C.line) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  for (let i = -h; i < w; i += 9) line(c, x + i, y + h, x + i + h, y, color, 1.2);
  c.restore();
}
export function arrow(c, x, y, xx, yy, color = C.teal) {
  line(c, x, y, xx, yy, color, 2);
  const a = Math.atan2(yy - y, xx - x);
  polygon(
    c,
    [
      [xx, yy],
      [xx - 11 * Math.cos(a - 0.42), yy - 11 * Math.sin(a - 0.42)],
      [xx - 11 * Math.cos(a + 0.42), yy - 11 * Math.sin(a + 0.42)],
    ],
    color,
  );
}
// The same animal changes pose when a token is committed to the line.
const outlines = new Map();
function cut(c, d, fill) {
  if (!outlines.has(d)) outlines.set(d, new Path2D(d));
  c.fillStyle = fill;
  c.fill(outlines.get(d));
}
export function animal(c, x, y, scale, kind, pose = 'stand') {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const fur = '#33474c',
    mark = '#8fa4a2',
    cream = '#e8dfbb';
  if (kind === 'dog') {
    cut(
      c,
      'M15 43 Q31 32 54 40 L70 41 Q77 33 79 24 L91 20 Q100 20 99 30 L113 34 Q116 43 100 45 L86 47 L78 57 L77 76 L86 79 L75 80 Q71 80 70 74 L66 60 L41 58 Q36 71 30 76 L36 78 L22 79 L25 64 L19 57 Q13 58 7 52 Q0 43 1 27 L5 26 Q8 47 15 43Z',
      '#956438',
    );
    cut(c, 'M80 23 Q70 23 70 36 Q69 53 80 57 Q89 51 88 35 Q88 22 80 23Z', '#45382e');
    cut(c, 'M37 40 Q48 38 60 42 Q64 48 59 52 Q44 53 36 48Z', '#513f31');
    cut(c, 'M23 73 L29 72 L28 76 L36 78 L22 79Z M75 72 L78 73 L77 76 L86 79 L74 80Z', cream);
    dot(c, 97, 30, 1.6, C.ink);
    dot(c, 112, 35, 2.5, C.ink);
  } else if (pose === 'slept') {
    cut(c, 'M6 67 C4 47 22 30 47 30 Q70 27 85 47 L91 69 Q82 82 48 83 C22 84 8 78 6 67Z', fur);
    cut(c, 'M65 52 L65 32 L76 42 L88 34 L91 54 Q99 62 88 68 Q74 73 63 62Z', fur);
    cut(c, 'M7 62 Q16 79 51 74 Q67 72 75 65 Q84 61 86 67 Q74 84 40 82 Q13 84 7 68Z', mark);
    cut(c, 'M25 40 Q27 48 36 50 L31 39Z M39 35 Q42 44 47 47 L45 34Z', mark);
    line(c, 78, 55, 85, 57, cream, 1.8);
  } else {
    const sits = pose === 'sat';
    if (sits) {
      cut(
        c,
        'M17 74 Q14 53 28 39 Q39 28 52 34 Q61 37 68 22 L81 28 Q75 44 75 55 L77 74 Q85 75 84 79 L69 79 L63 60 Q59 57 58 67 L58 75 Q68 76 65 80 L24 80Z',
        fur,
      );
      cut(c, 'M31 73 Q16 76 4 63 Q-3 55 -6 58 Q-9 68 7 77 Q25 87 48 77Z', mark);
    } else {
      cut(
        c,
        'M18 47 Q32 35 56 40 Q76 43 81 31 L90 31 Q92 46 80 55 L76 74 L84 76 Q83 81 70 79 L67 59 Q54 65 37 59 L28 73 L35 77 Q31 80 20 79 L23 62 L19 55 Q9 58 1 51 Q-8 41 -5 28 Q-4 23 -1 25 Q4 29 1 35 Q2 52 18 47Z',
        fur,
      );
      cut(c, 'M32 40 Q34 49 39 51 L38 39Z M45 39 Q46 46 51 48 L50 39Z', mark);
    }
    c.translate(sits ? 66 : 79, sits ? 24 : 32);
    cut(
      c,
      'M-12 1 L-13 -18 L-2 -9 Q3 -11 8 -9 L16 -18 L15 -1 Q22 6 18 11 Q13 21 2 20 Q-10 18 -14 11Z',
      fur,
    );
    cut(c, 'M-11 -14 L-5 -8 L-10 -7Z M10 -8 L14 -14 L13 -6Z', mark);
    cut(c, 'M0 11 Q4 8 8 12 Q10 9 14 11 Q14 17 7 17 Q2 17 0 14Z', cream);
    dot(c, 3, 4, 1.7, cream);
    dot(c, 14, 4, 1.6, cream);
    cut(c, 'M6 9 L10 9 L8 12Z', '#c08d76');
    line(c, 0, 12, -14, 10, mark, 1);
    line(c, 13, 13, 25, 11, mark, 1);
  }
  c.restore();
}
