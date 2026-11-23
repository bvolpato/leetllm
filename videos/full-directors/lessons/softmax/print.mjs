export const ink = '#202e34',
  muted = '#566269',
  paper = '#fff9ed',
  rule = '#b8b4a6';
export const fill = ['#78adce', '#86c29c', '#e39da0'];
export const dye = ['#245778', '#226647', '#973e50'];
export const gold = '#a85a15';
export const words = ['ran', 'slept', 'ate'];
export const mono = 'Lesson Mono',
  serif = 'Lesson Serif',
  sans = 'Lesson Sans';
export const fmt = (x, n = 3) =>
  Number.isFinite(x)
    ? x.toFixed(n).replace('-', '−')
    : x === Infinity
      ? '∞'
      : x === -Infinity
        ? '−∞'
        : 'undefined';
export const pct = (x, n = 1) => fmt(100 * x, n) + '%';
export const signed = (x, n = 3) => (x > 0 ? '+' : '') + fmt(x, n);
export const mix = (a, b, t) => a + (b - a) * t;
export const mixRows = (a, b, t) => a.map((v, i) => mix(v, b[i], t));
export function cue(clock, beat, phrase, duration = 0.8, options) {
  if (clock.beat.beatIndex !== beat) return Number(clock.beat.beatIndex > beat);
  const t = clock.reveal(phrase, duration, options);
  return t * t * (3 - 2 * t);
}
export function spoken(clock, beat, phrase, options) {
  return cue(clock, beat, phrase, 0, options) === 1;
}
export function box(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function line(c, x, y, xx, yy, color = rule, width = 2, dash = []) {
  c.save();
  c.beginPath();
  c.setLineDash(dash);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.stroke();
  c.restore();
}
export function dot(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
export function txt(c, value, x, y, size = 32, color = ink, face = sans, align = 'left', maxWidth) {
  c.save();
  c.font = '400 ' + size + 'px "' + face + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  if (maxWidth) c.fillText(String(value), x, y, maxWidth);
  else c.fillText(String(value), x, y);
  c.restore();
}
export function label(c, s, x, y, align = 'left') {
  txt(c, s, x, y, 24, muted, sans, align);
}
export function number(c, s, x, y, size = 48, color = ink, align = 'left') {
  txt(c, s, x, y, size, color, mono, align);
}
export function heading(c, s) {
  txt(c, s, 76, 95, 60, ink, serif, 'left', 1450);
}
export function substrate(c, tint) {
  box(c, 0, 0, 1600, 900, tint);
  box(c, 35, 35, 1530, 795, '#00000019');
  box(c, 30, 26, 1535, 796, paper);
  for (const [x, y, sx, sy] of [
    [50, 48, 1, 1],
    [1544, 48, -1, 1],
    [50, 800, 1, -1],
    [1544, 800, -1, -1],
  ]) {
    line(c, x, y, x + sx * 14, y, muted, 1.5);
    line(c, x, y, x, y + sy * 14, muted, 1.5);
  }
}
export function strip(c, x, y, w, h, shares, colors = fill) {
  box(c, x, y, w, h, '#e5e1d6');
  let at = 0;
  shares.forEach((v, i) => {
    if (v > 0) {
      box(c, x + w * at, y, w * v, h, colors[i]);
      if (at > 0) line(c, x + w * at, y, x + w * at, y + h, paper, 2);
    }
    at += v;
  });
  line(c, x, y + h, x + w, y + h, ink, 2);
}
export function wordsKey(c, x, y, step, shares, names = words, places = 1) {
  names.forEach((v, i) => {
    dot(c, x + i * step, y, 9, fill[i]);
    txt(c, v, x + i * step + 19, y, 29, dye[i], serif);
    if (shares) number(c, pct(shares[i], places), x + i * step + 19, y + 49, 32);
  });
}
export function lanes(
  c,
  values,
  { x = 278, y = 270, w = 690, step = 112, refs, names = words, n = 1 } = {},
) {
  values.forEach((v, i) => {
    const yy = y + i * step;
    txt(c, names[i], x - 25, yy + 18, 35, dye[i], serif, 'right');
    box(c, x, yy, w, 40, '#e9e5d9');
    box(c, x, yy, w * v, 40, fill[i]);
    line(c, x, yy + 40, x + w, yy + 40, rule, 1);
    if (refs) line(c, x + w * refs[i], yy - 9, x + w * refs[i], yy + 51, ink, 3, [5, 5]);
    number(c, pct(v, n), x + w + 22, yy + 19, 30);
  });
}
export function table(
  c,
  headers,
  rows,
  { xs, top = 220, step = 100, colors = [], sizes = [] } = {},
) {
  headers.forEach((h, j) => label(c, h, xs[j], top));
  line(c, 76, top + 30, 1515, top + 30);
  rows.forEach((row, i) => {
    const y = top + step * (i + 1);
    row.forEach((v, j) =>
      txt(c, v, xs[j], y, sizes[j] || 38, colors[i] || ink, j === 0 ? serif : mono),
    );
    line(c, 76, y + step * 0.45, 1515, y + step * 0.45, rule, 1);
  });
}
export function arrow(c, x, y, xx, yy, color = ink, width = 4) {
  line(c, x, y, xx, yy, color, width);
  const a = Math.atan2(yy - y, xx - x);
  line(c, xx - 15 * Math.cos(a - 0.5), yy - 15 * Math.sin(a - 0.5), xx, yy, color, width);
  line(c, xx - 15 * Math.cos(a + 0.5), yy - 15 * Math.sin(a + 0.5), xx, yy, color, width);
}
export function fraction(c, x, y, top, bottom, w = 290) {
  number(c, top, x, y - 39, 35, ink, 'center');
  line(c, x - w / 2, y, x + w / 2, y, ink, 3);
  number(c, bottom, x, y + 39, 35, ink, 'center');
}
export function legendRule(c, s) {
  line(c, 84, 700, 154, 700, ink, 3, [7, 6]);
  label(c, s, 172, 700);
}
