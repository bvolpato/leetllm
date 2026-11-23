// The same two inks identify assigned prompts in every view of the experiment.
export const ink = '#182e37',
  paper = '#f6f2e7',
  white = '#fffdf5',
  mute = '#52676b';
export const aInk = '#285b89',
  bInk = '#137368',
  warn = '#a23f2b',
  gold = '#bd801d';
export const pale = '#e5e6da',
  aPale = '#dbe7ef',
  bPale = '#d1e8dc',
  redPale = '#f3ded2';

export function text(c, value, x, y, size = 38, color = ink, options = {}) {
  const { align = 'left', width = 1700, family = 'Sans', weight = 500 } = options;
  c.save();
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillText(String(value), x, y, width);
  c.restore();
}
export function rect(c, x, y, w, h, fill, r = 0) {
  if (w <= 0 || h <= 0) return;
  c.fillStyle = fill;
  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
  c.fill();
}
export function line(c, x, y, xx, yy, col = ink, width = 4) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.strokeStyle = col;
  c.lineWidth = width;
  c.stroke();
}
export function dot(c, x, y, r, col) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fillStyle = col;
  c.fill();
}
export function arrow(c, x, y, xx, yy, col = ink, width = 5) {
  line(c, x, y, xx, yy, col, width);
  const a = Math.atan2(yy - y, xx - x);
  for (const d of [-0.58, 0.58])
    line(c, xx, yy, xx - 18 * Math.cos(a + d), yy - 18 * Math.sin(a + d), col, width);
}
export function head(c, title) {
  rect(c, 0, 0, 1920, 1080, paper);
  line(c, 84, 164, 1836, 164, ink, 2);
  text(c, title, 84, 124, 68, ink, { family: 'Serif', width: 1752 });
}
export function label(c, v, x, y, color = mute, w = 1600) {
  text(c, v, x, y, 30, color, { weight: 600, width: w });
}
export function note(c, v, color = ink) {
  line(c, 84, 882, 1836, 882, pale, 3);
  text(c, v, 84, 945, 40, color, { family: 'Serif', width: 1740 });
}
export function sheet(c, x, y, w, h, title, tint = ink) {
  rect(c, x + 7, y + 8, w, h, '#dbddcf', 9);
  rect(c, x, y, w, h, white, 9);
  rect(c, x, y, 10, h, tint);
  text(c, title, x + 34, y + 56, 37, tint, { weight: 700, width: w - 66 });
}
export function browser(c, x, y, w, h, title) {
  rect(c, x + 7, y + 9, w, h, '#d4d7c9', 14);
  rect(c, x, y, w, h, white, 14);
  rect(c, x, y, w, 70, ink, 12);
  rect(c, x, y + 47, w, 23, ink);
  for (const [i, col] of [gold, bPale, aPale].entries()) dot(c, x + 29 + 23 * i, y + 35, 6, col);
  text(c, title, x + 106, y + 48, 29, white, { width: w - 130 });
}
export function bubble(c, x, y, w, lines, color = bPale) {
  const h = lines.length * 54 + 28;
  rect(c, x, y, w, h, color, 20);
  lines.forEach((s, i) => text(c, s, x + 26, y + 52 + 54 * i, 36, ink, { width: w - 52 }));
}
export function person(c, x, y, col, letter) {
  dot(c, x, y, 36, col);
  text(c, letter, x, y + 13, 36, white, { align: 'center', weight: 700 });
}
export function clockface(c, x, y, r, time, limit = 3, caption = '', arrived = false) {
  dot(c, x, y, r + 6, ink);
  dot(c, x, y, r, white);
  const angle = (t) => -Math.PI / 2 + (t / 4) * Math.PI * 2;
  for (let i = 0; i < 20; i++) {
    const a = angle(i / 5),
      len = i % 5 === 0 ? 24 : 12;
    line(
      c,
      x + (r - 8) * Math.cos(a),
      y + (r - 8) * Math.sin(a),
      x + (r - len) * Math.cos(a),
      y + (r - len) * Math.sin(a),
      i === Math.round(limit * 5) ? warn : mute,
      i % 5 === 0 ? 5 : 2,
    );
  }
  const a = angle(time);
  line(c, x, y, x + (r - 35) * Math.cos(a), y + (r - 35) * Math.sin(a), arrived ? bInk : ink, 9);
  dot(c, x, y, 10, ink);
  rect(c, x - 65, y + r * 0.53 - 31, 130, 38, white, 5);
  text(c, time.toFixed(2) + ' s', x, y + r * 0.53, 32, ink, { align: 'center', family: 'Mono' });
  if (caption) text(c, caption, x, y + r + 48, 30, arrived ? bInk : mute, { align: 'center' });
}
export function table(
  c,
  { x = 104, y = 250, widths, heads, rows, step = 80, colors = [], highlights = [] },
) {
  const w = widths.reduce((n, k) => n + k, 0);
  rect(c, x, y, w, 64, ink, 7);
  let xx = x;
  heads.forEach((h, i) => {
    text(c, h, xx + 18, y + 43, 29, white, { weight: 600, width: widths[i] - 34 });
    xx += widths[i];
  });
  rows.forEach((row, j) => {
    const yy = y + 64 + j * step;
    rect(c, x, yy, w, step - 2, highlights[j] || (j % 2 ? pale : white));
    let col = x;
    row.forEach((value, i) => {
      text(c, value, col + 18, yy + step * 0.65, Math.min(38, step * 0.54), colors[i] || ink, {
        width: widths[i] - 32,
      });
      col += widths[i];
    });
  });
}
export function ruler(c, x, y, w, min, max, ticks, format = (v) => String(v)) {
  const at = (v) => x + ((v - min) / (max - min)) * w;
  line(c, x, y, x + w, y, mute, 3);
  ticks.forEach((v) => {
    line(c, at(v), y - 7, at(v), y + 10, mute, 3);
    text(c, format(v), at(v), y + 48, 28, mute, { align: 'center' });
  });
  return at;
}
export function whisker(c, at, y, lo, hi, mid, color = bInk) {
  line(c, at(lo), y, at(hi), y, color, 10);
  for (const v of [lo, hi]) line(c, at(v), y - 17, at(v), y + 17, color, 5);
  if (mid !== null) dot(c, at(mid), y, 12, color);
}
export const pct = (x, d = 1) => (100 * x).toFixed(d) + '%';
export const nfmt = (x) => x.toLocaleString('en-US');
export const clamp = (x) => Math.max(0, Math.min(1, x));
export function scene(clock) {
  const b = clock.beat.beatIndex,
    cue = clock.beat.cue;
  const r = clock.reveal(cue, 0.45);
  return {
    b,
    clock,
    p: (i) => (b > i ? 1 : b < i ? 0 : r),
    on: (i) => b > i || (b === i && r >= 1),
    ramp: (phrase, seconds) => clock.reveal(phrase, seconds),
  };
}
