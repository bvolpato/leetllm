export const ink = '#213b3b',
  teal = '#176963',
  green = '#246651',
  rust = '#aa462c',
  red = '#963e35',
  navy = '#213e50',
  muted = '#526661',
  gold = '#cea148',
  white = '#fff8e5',
  paper = '#eee2c6',
  pale = '#dce8d5',
  pink = '#f2c7b6',
  yellow = '#f6dc94',
  blue = '#cddfe2',
  dark = '#193c40',
  light = '#e0efcb';
export const ease = (t) => t * t * (3 - 2 * t);
export function painterClock(clock) {
  const b = clock.beat.beatIndex + 1;
  const cue = (n, s, d = 0) => (b > n ? 1 : b < n ? 0 : clock.reveal(s, d));
  const after = (n, phrase, duration = 0) => {
    if (b !== n) return Number(b > n);
    const { start, end } = clock.wordCue(phrase);
    const phraseDuration = end - start;
    const total = phraseDuration + duration;
    const progress = clock.reveal(phrase, total, { captionStart: phrase });
    if (progress === 1) return 1;
    return duration ? Math.max(0, (progress * total - phraseDuration) / duration) : 0;
  };
  return { b, cue, after, progress: clock.progress };
}
export function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function line(c, x, y, u, v, color = ink, w = 2) {
  c.strokeStyle = color;
  c.lineWidth = w;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.stroke();
}
export function path(c, pts, color, w = 2, fill = false) {
  c.beginPath();
  c.moveTo(...pts[0]);
  for (const p of pts.slice(1)) c.lineTo(...p);
  if (fill) {
    c.closePath();
    c.fillStyle = color;
    c.fill();
  } else {
    c.strokeStyle = color;
    c.lineWidth = w;
    c.stroke();
  }
}
export function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
export function font(c, size, face = 'Sans', weight = 400) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
}
export function txt(
  c,
  s,
  x,
  y,
  size = 24,
  color = ink,
  face = 'Sans',
  weight = 400,
  max = Infinity,
) {
  font(c, size, face, weight);
  c.fillStyle = color;
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  const str = String(s);
  const measured = c.measureText(str).width;
  if (measured > max) font(c, (size * max) / measured, face, weight);
  c.fillText(str, x, y);
}
export const label = (c, s, x, y, color = muted, w = 1000) =>
  txt(c, s, x, y, 16, color, 'Sans', 700, w);
export const mono = (c, s, x, y, size = 23, color = ink, w = 1000) =>
  txt(c, s, x, y, size, color, 'Mono', 400, w);
export function para(c, s, x, y, w, size = 28, leading = size * 1.3, color = ink, face = 'Serif') {
  font(c, size, face);
  let row = '';
  for (const word of s.split(/\s+/)) {
    const next = row ? row + ' ' + word : word;
    if (row && c.measureText(next).width > w) {
      txt(c, row, x, y, size, color, face);
      y += leading;
      row = word;
    } else row = next;
  }
  if (row) txt(c, row, x, y, size, color, face);
  return y;
}
export function base(c, kind = 'linen') {
  const colors = {
    linen: ['#bfaa84', '#d9c8a3', '#bda780'],
    green: ['#3a6460', '#4a736c', '#375c59'],
    blue: ['#294956', '#375a64', '#23414e'],
    clay: ['#c18769', '#d5a084', '#be836a'],
  };
  const [a, b, d] = colors[kind];
  const g = c.createLinearGradient(0, 0, 1170, 680);
  g.addColorStop(0, b);
  g.addColorStop(0.7, a);
  g.addColorStop(1, d);
  rect(c, 0, 0, 1200, 675, g);
  c.save();
  c.globalAlpha = 0.1;
  for (let i = 0; i < 35; i++) {
    const y = 12 + i * 20;
    line(c, 0, y, 1200, y + ((i * 7) % 13) - 6, ink, i % 3 === 0 ? 1.1 : 0.5);
  }
  c.restore();
}
export function leaf(c, x, y, w, h, fill = white, binding = null) {
  rect(c, x + 5, y + 7, w, h, '#213b3b30');
  rect(c, x + 1, y + 3, w, h, '#b6a98c');
  rect(c, x, y, w, h, fill);
  if (binding) {
    rect(c, x, y, 10, h, binding);
    line(c, x + 16, y + 3, x + 16, y + h - 3, '#34464033', 1);
  }
}
export function folio(c, x, y, w, h, fill = white, color = teal) {
  rect(c, x - 6, y + 1, w + 12, h + 12, color);
  rect(c, x + 1, y + 6, w, h + 3, '#baa98c');
  for (const lift of [5, 3, 1]) line(c, x + 4, y + h + lift, x + w - 1, y + h + lift, '#ded1b7', 1);
  leaf(c, x, y, w, h, fill, color);
}
export function book(c, x, y, w, h, left = white, right = paper) {
  rect(c, x - 9, y - 5, w + 18, h + 20, navy);
  for (let i = 3; i > 0; i--) rect(c, x + i, y + i * 3, w, h, '#c0b39d');
  rect(c, x, y, w / 2, h, left);
  rect(c, x + w / 2, y, w / 2, h, right);
  const spine = c.createLinearGradient(x + w / 2 - 24, 0, x + w / 2 + 28, 0);
  spine.addColorStop(0, '#54462e00');
  spine.addColorStop(0.48, '#54462e25');
  spine.addColorStop(0.52, '#54462e47');
  spine.addColorStop(1, '#54462e00');
  rect(c, x + w / 2 - 24, y, 52, h, spine);
  line(c, x + w / 2, y, x + w / 2, y + h, '#9e957f', 1);
}
export function heading(c, labelText, title, x, y, w, color = ink) {
  label(c, labelText, x, y, color, w);
  txt(c, title, x, y + 50, 44, color, 'Serif', 400, w);
}
export function stamp(c, words, x, y, w, color = green, size = 22) {
  c.strokeStyle = color;
  c.lineWidth = 2.4;
  c.strokeRect(x, y, w, 39);
  txt(c, words, x + 9, y + 27, size, color, 'Sans', 700, w - 18);
}
export function mark(c, x, y, code, w = 89, h = 27, color = ink) {
  const digits = [...code.slice(0, 10)].map((v) => parseInt(v, 16));
  const raw = digits.flatMap((v) => [1 + (v % 3), 1 + (Math.floor(v / 4) % 3)]);
  const unit = w / raw.reduce((a, b) => a + b, 0);
  let pos = x;
  raw.forEach((v, i) => {
    if (i % 2 === 0) rect(c, pos, y, v * unit, h, color);
    pos += v * unit;
  });
}
export function hashMark(c, hash, x, y, w = 265, color = ink) {
  mark(c, x, y - 21, hash, 60, 23, color);
  mono(c, hash.slice(0, 10), x + 71, y, 21, color, w - 72);
}
export function band(c, text, x, y, w, color = teal, fill = pale) {
  rect(c, x, y, w, 45, fill);
  rect(c, x, y, 5, 45, color);
  txt(c, text, x + 15, y + 30, 23, color, 'Sans', 600, w - 25);
}
export function fold(c, x, y, w, h, color = yellow) {
  path(
    c,
    [
      [x + 4, y + 5],
      [x + w + 4, y + 5],
      [x + w + 4, y + h - 19],
      [x + w - 18, y + h + 5],
      [x + 4, y + h + 5],
    ],
    '#2334322a',
    1,
    true,
  );
  path(
    c,
    [
      [x, y],
      [x + w, y],
      [x + w, y + h - 23],
      [x + w - 23, y + h],
      [x, y + h],
    ],
    color,
    1,
    true,
  );
  path(
    c,
    [
      [x + w - 23, y + h],
      [x + w - 23, y + h - 23],
      [x + w, y + h - 23],
    ],
    '#b98e4c',
    1,
    true,
  );
}
export function bracket(c, x1, x2, y, color = teal, w = 4) {
  path(
    c,
    [
      [x1, y + 13],
      [x1, y],
      [x2, y],
      [x2, y + 13],
    ],
    color,
    w,
  );
}
export function link(c, x1, y1, x2, y2, color = teal, p = 1) {
  const x = x1 + (x2 - x1) * p,
    y = y1 + (y2 - y1) * p;
  line(c, x1, y1, x, y, color, 4);
  dot(c, x1, y1, 5, color);
  if (p > 0) dot(c, x, y, 5, color);
}
export function steps(c, used, max, x, y, w) {
  const cell = w / max;
  for (let i = 0; i < max; i++) {
    rect(c, x + i * cell, y, cell - 6, 37, i < used ? teal : '#c3c6ad');
    mono(c, i + 1, x + i * cell + 8, y + 26, 18, i < used ? white : ink);
  }
}
