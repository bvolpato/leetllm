export const paper = '#f4efdf',
  ink = '#19333a',
  muted = '#496168',
  line = '#97a9a1';
export const teal = '#1e756e',
  rust = '#ac452a',
  blue = '#3b6687',
  gold = '#f0b74b',
  light = '#deeadf';
export const runColors = ['#f6be46', '#fff1c7', '#f16b30', '#2e2b42'];
export const stripColors = [
  '#53878c',
  '#87ae9e',
  '#e6bb67',
  '#bb714b',
  '#466882',
  '#7092a6',
  '#bc8263',
  '#d7ae86',
];
export const mix = (a, b, t) => a + (b - a) * t;
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const fmt = (x) => String(x).replace('-', '−');
export function cue(clock, beat, phrase, span = 0.45) {
  const index = clock.beat.beatIndex;
  if (index !== beat) return Number(index > beat);
  return clock.reveal(phrase, span);
}
export function alpha(c, t, paint) {
  if (t <= 0) return;
  c.save();
  c.globalAlpha *= clamp(t);
  paint();
  c.restore();
}
export function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function rule(c, x1, y1, x2, y2, color = line, w = 3) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.lineWidth = w;
  c.strokeStyle = color;
  c.stroke();
}
export function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
export function label(
  c,
  value,
  x,
  y,
  size = 42,
  color = ink,
  align = 'left',
  family = 'Sans',
  weight = 500,
) {
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillText(String(value), x, y);
}
export function num(c, v, x, y, size = 54, color = ink) {
  label(c, fmt(v), x, y, size, color, 'center', 'Mono');
}
export function header(c, section, title) {
  rect(c, 0, 0, 1920, 1080, paper);
  label(c, section, 80, 60, 29, teal, 'left', 'Mono', 600);
  label(c, title, 76, 146, 74, ink, 'left', 'Serif', 500);
  rule(c, 80, 216, 1840, 216, ink, 3);
}
export function note(c, s, color = muted) {
  rule(c, 80, 867, 1840, 867, line, 2);
  label(c, s, 80, 919, 40, color);
}
export function pixels(c, colors, x, y, w, h, limit = colors.length) {
  colors.forEach((col, i) => {
    rect(c, x + i * w, y, w - 1, h, col);
    if (i >= limit) rect(c, x + i * w, y, w - 1, h, light);
    c.strokeStyle = ink;
    c.lineWidth = 1.5;
    c.strokeRect(x + i * w + 0.75, y + 0.75, w - 1.5, h - 1.5);
  });
}
export function tag(c, v, x, y, w = 135, h = 90, color = light, foreground = ink, size = 53) {
  rect(c, x - w / 2, y - h / 2, w, h, color);
  rule(c, x - w / 2, y + h / 2, x + w / 2, y + h / 2, foreground, 3);
  num(c, v, x, y, size, foreground);
}
export function hatch(c, x, y, w, h) {
  rect(c, x, y, w, h, '#dde3d8');
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  for (let k = -h; k < w; k += 20) rule(c, x + k, y + h, x + k + h, y, '#a6b9af', 3);
  c.restore();
}
export function bracket(c, x1, x2, y, caption, color = ink) {
  rule(c, x1, y, x1, y + 13, color);
  rule(c, x2, y, x2, y + 13, color);
  rule(c, x1, y + 13, x2, y + 13, color);
  label(c, caption, (x1 + x2) / 2, y + 46, 33, color, 'center');
}
export function arrow(c, x1, y1, x2, y2, color = teal, width = 5) {
  rule(c, x1, y1, x2, y2, color, width);
  const a = Math.atan2(y2 - y1, x2 - x1),
    l = 16;
  rule(c, x2, y2, x2 - l * Math.cos(a - 0.48), y2 - l * Math.sin(a - 0.48), color, width);
  rule(c, x2, y2, x2 - l * Math.cos(a + 0.48), y2 - l * Math.sin(a + 0.48), color, width);
}
export function band(c, vals, x, y, w, { colors, focus = -1, fs = 47 } = {}) {
  const pitch = w / vals.length;
  vals.forEach((v, i) =>
    tag(
      c,
      v,
      x + (i + 0.5) * pitch,
      y,
      pitch - 8,
      76,
      colors?.[i] ?? (i === focus ? '#f4cf98' : light),
      ink,
      fs,
    ),
  );
}
