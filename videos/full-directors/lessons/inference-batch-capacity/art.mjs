export const C = {
  paper: '#f5f2e9',
  ink: '#152e3d',
  blue: '#274864',
  blueLight: '#66829b',
  sea: '#136d68',
  green: '#24847a',
  mint: '#b5d9c5',
  moss: '#508b7f',
  amber: '#c77d33',
  orange: '#a54b28',
  light: '#dfdfd0',
  bare: '#e9e7dc',
  dim: '#536671',
  rule: '#a7b1ab',
  white: '#fbfaf2',
};
export function rect(c, x, y, w, h, fill, outline, width = 2) {
  if (fill) {
    c.fillStyle = fill;
    c.fillRect(x, y, w, h);
  }
  if (outline) {
    c.strokeStyle = outline;
    c.lineWidth = width;
    c.strokeRect(x, y, w, h);
  }
}
export function line(c, x, y, xx, yy, color = C.rule, width = 2) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
export function txt(
  c,
  value,
  x,
  y,
  size = 36,
  color = C.ink,
  face = 'Sans',
  align = 'left',
  weight = 400,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(String(value), x, y);
}
export const mono = (c, value, x, y, size = 30, col = C.ink, align = 'left') =>
  txt(c, value, x, y, size, col, 'Mono', align);
export const big = (c, value, x, y, size = 70, col = C.ink, align = 'left') =>
  txt(c, value, x, y, size, col, 'Serif', align);
export const mid = (c, value, x, y, size = 34, col = C.ink) =>
  txt(c, value, x, y, size, col, 'Sans', 'center');
export function circle(c, x, y, r, fill, stroke) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 2;
    c.stroke();
  }
}
export function hatch(c, x, y, w, h, bg = C.bare, fg = C.rule, pitch = 14) {
  if (w < 0.3 || h < 0.3) return;
  rect(c, x, y, w, h, bg);
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  for (let i = -h; i < w; i += pitch) line(c, x + i, y + h, x + i + h, y, fg, 2);
  c.restore();
}
export function weight(c, x, y, w, h) {
  rect(c, x, y, w, h, C.blue);
  if (w < 10) return;
  for (let i = 5; i < w - 3; i += 12) {
    line(c, x + i, y + 4, x + i, y + h - 4, C.blueLight, 1);
    rect(c, x + i - 2, y + h * 0.25, 4, Math.min(14, h * 0.24), C.blueLight);
  }
}
// A paired stripe represents keys and values in the same span of memory.
export function kv(c, x, y, w, h, owner = 0) {
  if (w <= 0) return;
  const colors = [C.green, '#397d70', '#246d7c', '#447b60'];
  const lower = ['#93c8ae', '#accb9e', '#87bac3', '#a7c293'];
  const k = owner % colors.length;
  rect(c, x, y, w, h, colors[k]);
  rect(c, x, y + h * 0.55, w, h * 0.45, lower[k]);
  for (let i = 4; i < w - 2; i += 10) {
    const t = (Math.floor(i / 10) * 7 + owner * 3) % 13;
    rect(c, x + i, y + 3, 2, Math.max(1, (h * 0.45 - 5) * (0.4 + t / 20)), lower[k]);
    rect(c, x + i, y + h * 0.57, 2, Math.max(1, (h * 0.38 - 3) * (1 - t / 22)), colors[k]);
  }
}
export function bracket(c, x, xx, y, label, color = C.dim) {
  line(c, x, y, xx, y, color);
  line(c, x, y - 8, x, y + 8, color);
  line(c, xx, y - 8, xx, y + 8, color);
  if (label) mono(c, label, (x + xx) / 2, y + 42, 29, color, 'center');
}
export function mark(c, x, y, h, color = C.orange) {
  line(c, x, y, x, y + h, color, 4);
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x - 9, y - 8);
  c.lineTo(x + 9, y - 8);
  c.lineTo(x, y + 1);
  c.fill();
}
export function label(c, value, x, y) {
  mono(c, value, x, y, 29, C.dim);
}
export function base(c, clock, subject, title) {
  rect(c, 0, 0, 1920, 1080, C.paper);
  line(c, 82, 104, 1838, 104, C.ink, 2);
  txt(c, subject, 82, 79, 33, C.sea, 'Sans', 'left', 600);
  big(c, title, 82, 202, 67);
}
export function foot(c, msg, col = C.ink, size = 38) {
  line(c, 82, 815, 1838, 815);
  txt(c, msg, 82, 874, size, col, 'Sans', 'left', 500);
}
export const clamp = (n) => Math.max(0, Math.min(1, n));
export const ease = (n) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
export const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 4 });
export const bidx = (clock) => clock.beat.beatIndex;
export function cue(clock, beat, phrase, duration = 0) {
  return bidx(clock) === beat ? clock.reveal(phrase, duration) : Number(bidx(clock) > beat);
}
