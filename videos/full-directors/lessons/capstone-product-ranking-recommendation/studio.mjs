export const ink = '#192e3b',
  muted = '#495f65',
  teal = '#126f70',
  blue = '#3059a3',
  red = '#aa3b2b',
  gold = '#eebc53',
  paper = '#f7f3e8',
  pale = '#e0e9e1',
  lineColor = '#acbcb4';
export const colors = {
  P4: '#4473a5',
  P5: '#27877c',
  P6: '#bc7250',
  P8: '#936262',
  P11: '#797ba3',
};
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const mix = (a, b, p) => a + (b - a) * p;
export const ease = (p) => p * p * (3 - 2 * p);
export const f = (x, n = 2) => x.toFixed(n);
export function cue(k, beat, words, span = 0) {
  const n = k.beat.beatIndex + 1;
  return n > beat ? 1 : n < beat ? 0 : k.reveal(words, span);
}
export function box(c, x, y, w, h, color, r = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function stroke(c, x1, y1, x2, y2, color = ink, width = 2, dash = []) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.restore();
}
export function dotMark(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
export function oval(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
  c.fill();
}
export function poly(c, points, color, outline) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = color;
  c.fill();
  if (outline) {
    c.strokeStyle = outline;
    c.lineWidth = 1.4;
    c.stroke();
  }
}
export function type(c, t, x, y, size = 18, opt = {}) {
  const { color = ink, align = 'left', face = 'Sans', weight = 400, max } = opt;
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  if (max) c.fillText(String(t), x, y, max);
  else c.fillText(String(t), x, y);
}
export const mono = (c, t, x, y, size = 17, color = ink, align = 'left') =>
  type(c, t, x, y, size, { face: 'Mono', color, align });
export const head = (c, t, x = 46, y = 62, size = 36) => type(c, t, x, y, size, { face: 'Serif' });
export const sub = (c, t, x, y, color = muted) => type(c, t, x, y, 16, { color, weight: 600 });
export function background(c) {
  const gradient = c.createLinearGradient(0, 0, 960, 540);
  gradient.addColorStop(0, '#fcf8ec');
  gradient.addColorStop(0.65, '#f3efe1');
  gradient.addColorStop(1, '#e6e9df');
  box(c, 0, 0, 960, 540, gradient);
}
export function slot(c, x, y, w = 162, h = 95) {
  c.save();
  c.setLineDash([7, 6]);
  c.strokeStyle = '#758c87';
  c.lineWidth = 1.8;
  c.beginPath();
  c.roundRect(x, y, w, h, 9);
  c.stroke();
  c.restore();
}
export function stamp(c, text, x, y, color = teal, size = 18) {
  c.save();
  c.font = '600 ' + size + 'px "Lesson Sans"';
  const w = c.measureText(text).width + 24;
  box(c, x, y - 16, w, 32, color, 3);
  type(c, text, x + 12, y, size, { color: '#fffdf4', weight: 600 });
  c.restore();
}
export function barcode(c, x, y, w = 50, h = 11) {
  const widths = [2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 2, 1];
  let at = 0;
  const scale = w / widths.reduce((a, v) => a + v + 1, 0);
  for (const width of widths) {
    box(c, x + at * scale, y, width * scale, h, ink);
    at += width + 1;
  }
}
// A thermal roll is visible through the lid. The peel strip belongs to the product as it moves.
export function machine(c, p, x, y, scale = 1, feed = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const col = colors[p.id] ?? teal;
  oval(c, 1, 21, 68, 7, 'rgba(24,44,53,.13)');
  box(c, -65, -37, 130, 59, ink, 12);
  const shell = c.createLinearGradient(-55, -70, 55, 12);
  shell.addColorStop(0, '#fffaf0');
  shell.addColorStop(0.67, '#d0d6c8');
  shell.addColorStop(1, '#9db4ad');
  c.fillStyle = shell;
  c.beginPath();
  c.moveTo(-61, -32);
  c.quadraticCurveTo(-64, -43, -49, -73);
  c.quadraticCurveTo(-44, -86, -29, -86);
  c.lineTo(33, -86);
  c.quadraticCurveTo(46, -85, 54, -67);
  c.lineTo(64, -38);
  c.quadraticCurveTo(68, -22, 53, -21);
  c.lineTo(-48, -21);
  c.quadraticCurveTo(-60, -21, -61, -32);
  c.fill();
  poly(
    c,
    [
      [-40, -72],
      [34, -72],
      [42, -49],
      [-47, -49],
    ],
    '#657e7c',
  );
  poly(
    c,
    [
      [-31, -68],
      [23, -68],
      [28, -54],
      [-35, -54],
    ],
    '#ecedd7',
  );
  for (let i = 0; i < 5; i++) stroke(c, -29, -66 + i * 2.1, 23, -66 + i * 2.1, '#a2b0a2', 0.8);
  box(c, -63, -23, 126, 12, col, 4);
  dotMark(c, 47, -16, 2.3, '#f1dc80');
  box(c, -44, -4, 89, 8, '#070f14', 3);
  const length = 10 + 32 * feed;
  poly(
    c,
    [
      [-34, 0],
      [36, 0],
      [32, length],
      [-39, length],
    ],
    '#fffdf0',
    '#c7ccbc',
  );
  c.save();
  c.beginPath();
  c.rect(-39, 1, 76, length - 1);
  c.clip();
  if (scale >= 0.65 && feed > 0.1) mono(c, p.id, -28, 12, 13);
  barcode(c, -29, 23, 49, 8);
  c.restore();
  c.restore();
}
export function printerRow(
  c,
  rows,
  { xs = [182, 480, 778], y = 238, scale = 1, caption = (p) => p.id, detail } = {},
) {
  rows.forEach((p, i) => {
    machine(c, p, xs[i], y, scale);
    type(c, caption(p, i), xs[i], y + 52 * scale + 20, 22, { align: 'center', weight: 600 });
    if (detail) mono(c, detail(p, i), xs[i], y + 52 * scale + 49, 17, muted, 'center');
  });
}
export function ruled(c, x, y, w, lines, gap = 49) {
  lines.forEach(([a, b], i) => {
    stroke(c, x, y + i * gap + gap / 2, x + w, y + i * gap + gap / 2, lineColor, 1);
    type(c, a, x, y + i * gap, 18);
    mono(c, b, x + w, y + i * gap, 17, ink, 'right');
  });
}
export function strip(c, x, y, w, h) {
  box(c, x + 3, y + 5, w, h, '#d8d8ca', 4);
  box(c, x, y, w, h, '#fffcf2', 3);
  for (let xx = x + 8; xx < x + w - 5; xx += 13) dotMark(c, xx, y + 7, 1.6, '#bac6ba');
}
export function caption(c, t, x = 46, y = 462) {
  type(c, t, x, y, 21, { color: teal, weight: 600 });
}
export function cells(c, { x, y, n, cols = 10, step = 15, r = 4, fill }) {
  for (let i = 0; i < n; i++)
    dotMark(c, x + (i % cols) * step, y + Math.floor(i / cols) * step, r, fill(i));
}
