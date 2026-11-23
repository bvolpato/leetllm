export const P = {
  ink: '#192e36',
  dim: '#48616a',
  paper: '#f4f0de',
  white: '#fffdf1',
  line: '#adb9b2',
  night: '#102d38',
  deep: '#091e26',
  mint: '#8ce4bd',
  teal: '#00725f',
  blue: '#315c93',
  sky: '#a8d4ff',
  red: '#aa3947',
  pink: '#ffc7c7',
  gold: '#e8b357',
  orange: '#ed895a',
};
export const clamp = (n) => Math.max(0, Math.min(n, 1));
export const mix = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);
export const beat = (c) => c.beat.beatIndex + 1;
export function cue(c, n, phrase, duration = 0.7) {
  return beat(c) === n ? c.reveal(phrase, duration) : Number(beat(c) > n);
}
export function rect(g, x, y, w, h, fill, r = 0) {
  if (w <= 0 || h <= 0) return;
  g.fillStyle = fill;
  g.beginPath();
  g.roundRect(x, y, w, h, Math.min(r, h / 2, w / 2));
  g.fill();
}
export function line(g, x, y, u, v, col = P.line, w = 2) {
  g.strokeStyle = col;
  g.lineWidth = w;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(u, v);
  g.stroke();
}
export function dot(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}
export function txt(g, s, x, y, size = 33, col = P.ink, face = 'Sans', align = 'left', max = 1550) {
  g.fillStyle = col;
  g.font = `400 ${size}px "Lesson ${face}"`;
  g.textAlign = align;
  g.fillText(String(s), x, y, max);
}
export function mono(g, s, x, y, size = 28, col = P.ink, align = 'left', max = 1500) {
  txt(g, s, x, y, size, col, 'Mono', align, max);
}
export function plate(g, x, y, w, h, col = P.white, r = 12) {
  rect(g, x + 5, y + 8, w, h, '#0c273324', r);
  rect(g, x, y, w, h, col, r);
}
export function surface(g, dark = false) {
  g.scale(1.2, 1.2);
  const grad = g.createLinearGradient(0, 0, 1500, 900);
  grad.addColorStop(0, dark ? '#173e4c' : '#f5f0df');
  grad.addColorStop(1, dark ? '#0b242d' : '#dfdfce');
  rect(g, 0, 0, 1600, 900, grad);
  for (let x = 20; x < 1600; x += 40)
    for (let y = 20; y < 900; y += 40) rect(g, x, y, 2, 2, dark ? '#82a6a12b' : '#61766b2e');
}
export function heading(g, subject, detail = '', dark = false) {
  txt(g, subject, 64, 93, 58, dark ? P.paper : P.ink, 'Serif', 'left', 1460);
  if (detail) mono(g, detail, 67, 146, 25, dark ? P.mint : P.dim);
}
export function readout(g, x, y, label, value, { w = 450, col = P.ink, dark = false } = {}) {
  line(g, x, y, x + w, y, dark ? '#729195' : P.line, 2);
  mono(g, label, x, y + 36, 22, dark ? P.mint : P.dim, 'left', w);
  txt(g, value, x, y + 104, 54, col, 'Serif', 'left', w);
}
export function screen(g, x, y, w, h, label) {
  plate(g, x, y, w, h, '#5b7376', 18);
  rect(g, x + 5, y + 5, w - 10, h - 11, '#adb9b0', 14);
  rect(g, x + 15, y + 14, w - 30, h - 30, P.night, 10);
  dot(g, x + w - 29, y + h - 10, 3, P.teal);
  if (label) mono(g, label, x + 38, y + 51, 21, P.mint, 'left', w - 78);
}
export function stripe(g, x, y, n, step = 54, col = P.teal) {
  for (let j = 0; j < n; j++) rect(g, x + j * step, y, step - 7, 34, col, 3);
}
export function strip(g, x, y, w, h, s, col = P.white, ink = P.ink, size = 35) {
  plate(g, x, y, w, h, col, 5);
  for (let v = y + 12; v < y + h - 7; v += 16) dot(g, x + 10, v, 2.8, '#526b6a66');
  txt(g, s, x + w / 2, y + h / 2 + size * 0.34, size, ink, 'Mono', 'center', w - 34);
}
export function ledger(g, headers, rows, { x = 70, y = 185, w = 1460, widths, step = 71 } = {}) {
  const widthsPx = widths || headers.map(() => w / headers.length);
  plate(g, x, y, w, step * (rows.length + 1) + 12, P.white, 7);
  let a = x;
  headers.forEach((v, j) => {
    mono(g, v, a + 18, y + step * 0.65, 23, P.dim, 'left', widthsPx[j] - 35);
    a += widthsPx[j];
  });
  rows.forEach((row, i) => {
    const top = y + step * (i + 1);
    line(g, x + 15, top, x + w - 15, top, P.line, 1.4);
    let xx = x;
    row.forEach((s, j) => {
      const [value, color] = Array.isArray(s) ? s : [s, P.ink];
      txt(g, value, xx + 18, top + step * 0.69, 34, color, 'Sans', 'left', widthsPx[j] - 34);
      xx += widthsPx[j];
    });
  });
}
export function axis(g, x, y, w, max, ticks, col = P.dim) {
  line(g, x, y, x + w, y, col, 3);
  for (const t of ticks) {
    const px = x + (w * t) / max;
    line(g, px, y - 7, px, y + 11, col, 2);
    mono(g, t, px, y + 43, 22, col, 'center');
  }
}
