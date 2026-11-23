export const C = {
  ink: '#202f40',
  blue: '#284e86',
  dim: '#526267',
  muted: '#d4d0bb',
  page: '#f0e8d7',
  light: '#fff8e6',
  teal: '#226858',
  mint: '#d7e6d0',
  red: '#a03e2a',
  pink: '#f3ccba',
  ochre: '#bc7929',
  yellow: '#f2c65c',
  white: '#ffffff',
  slate: '#18333f',
  ice: '#d5ece6',
};
export function txt(c, text, x, y, size = 24, opt = {}) {
  c.save();
  c.fillStyle = opt.color || C.ink;
  c.textAlign = opt.align || 'left';
  const family = opt.family || 'Sans';
  const style = opt.italic ? 'italic ' : '';
  const weight = opt.bold ? '600 ' : '400 ';
  const font = (s) => style + weight + s + 'px "Lesson ' + family + '"';
  c.font = font(size);
  if (opt.w && c.measureText(String(text)).width > opt.w) {
    c.font = font(Math.floor((size * opt.w) / c.measureText(String(text)).width));
  }
  c.fillText(String(text), x, y);
  c.restore();
}
export function box(c, x, y, w, h, fill, stroke, sw = 1) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = sw;
    c.strokeRect(x, y, w, h);
  }
}
export function line(c, x, y, x2, y2, color = C.ink, width = 2) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
export function disc(c, x, y, r, fill, stroke, sw = 2) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = sw;
    c.stroke();
  }
}
export function arrow(c, x, y, ex, ey, color = C.red, p = 1, width = 3) {
  if (p <= 0) return;
  const tx = x + (ex - x) * p,
    ty = y + (ey - y) * p,
    a = Math.atan2(ey - y, ex - x);
  line(c, x, y, tx, ty, color, width);
  c.save();
  c.translate(tx, ty);
  c.rotate(a);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-12, -5);
  c.lineTo(-12, 5);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.restore();
}
export function paper(c, x, y, w, h, fill = C.light, edge = '#b6b09c') {
  box(c, x + 4, y + 6, w, h, '#28333e1c');
  box(c, x, y, w, h, fill, edge);
}
export function on(c, p, paint) {
  if (p <= 0) return;
  c.save();
  c.globalAlpha *= Math.min(1, p);
  paint();
  c.restore();
}
export function mark(c, b, phrase, span = 0.45) {
  const now = c.beat.beatIndex + 1;
  return now > b ? 1 : now < b ? 0 : c.reveal(phrase, span);
}
export const cut = (c, b, phrase) => mark(c, b, phrase, 0);
export function base(c, title, section, tone = C.page) {
  box(c, 0, 0, 1200, 675, tone);
  const grain = tone === C.slate ? '#ffffff08' : '#3947560d';
  for (let i = 0; i < 170; i++)
    box(c, (i * 191 + i * i * 7) % 1200, (i * 181 + i * i * 5) % 675, 2 + (i % 3), 1, grain);
  const dark = tone === C.slate;
  txt(c, section, 48, 49, 17, { color: dark ? '#b3cfc8' : C.teal, bold: true });
  line(c, 48, 64, 1152, 64, dark ? '#5b787a' : '#a6ae9f', 1);
  txt(c, title, 48, 124, 49, { family: 'Serif', color: dark ? C.light : C.ink, w: 1100 });
}
export function foot(c, text, dark = false) {
  line(c, 48, 565, 1152, 565, dark ? '#547078' : '#a4ac9e', 1);
  txt(c, text, 49, 605, 24, { color: dark ? C.ice : C.ink, w: 1095 });
}
export function slip(
  c,
  x,
  y,
  w,
  h,
  kicker,
  lines,
  { color = C.teal, fill = C.light, size = 27 } = {},
) {
  paper(c, x, y, w, h, fill);
  box(c, x, y, 6, h, color);
  txt(c, kicker, x + 19, y + 31, 18, { color, bold: true, w: w - 37 });
  for (const [i, t] of lines.entries())
    txt(c, t, x + 19, y + 72 + i * (size + 8), size, { family: 'Serif', w: w - 38 });
}
export function put(c, x, y, k, fn) {
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  fn();
  c.restore();
}
export function node(c, x, y, name, { color = C.blue, fill = C.light, w = 160 } = {}) {
  paper(c, x - w / 2, y - 23, w, 48, fill, color);
  txt(c, name, x, y + 9, 25, { align: 'center', color, w: w - 16, family: 'Serif' });
}
