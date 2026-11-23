// Drawing units are half-size. The host supplies the 1920 × 1080 canvas and fonts.
export const C = {
  paper: '#f5f0dd',
  white: '#fffbed',
  ink: '#182d37',
  muted: '#4d666b',
  rule: '#b4c0b5',
  grid: '#dfe1d2',
  teal: '#136b61',
  mint: '#98ddad',
  blue: '#31588a',
  pale: '#d3e1e7',
  rust: '#a13924',
  peach: '#f4c4a6',
  gold: '#e9ae4c',
  dark: '#152e35',
  screen: '#19383c',
  trace: '#9fe4b0',
};
export const fmt = (n) => n.toLocaleString('en-US');
export const mix = (a, b, t) => a + (b - a) * t;
export function box(g, x, y, w, h, fill, stroke = null, r = 0) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = 1;
    g.stroke();
  }
}
export function line(g, x, y, ex, ey, color = C.rule, width = 1, dashed = false) {
  g.save();
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(ex, ey);
  g.strokeStyle = color;
  g.lineWidth = width;
  if (dashed) g.setLineDash([4, 4]);
  g.stroke();
  g.restore();
}
export function dot(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fillStyle = color;
  g.fill();
}
export function tx(
  g,
  t,
  x,
  y,
  size = 18,
  color = C.ink,
  face = 'Sans',
  weight = 500,
  align = 'left',
) {
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.fillText(String(t), x, y);
}
export function label(g, t, x, y, color = C.muted) {
  tx(g, t, x, y, 13, color, 'Mono', 500);
}
export function serif(g, t, x, y, size = 32, color = C.ink) {
  tx(g, t, x, y, size, color, 'Serif', 500);
}
export function opacity(g, a, fn) {
  if (a <= 0) return;
  g.save();
  g.globalAlpha *= a;
  fn();
  g.restore();
}
export function grid(g, x, y, w, h, step = 24, color = C.grid) {
  for (let i = x; i <= x + w; i += step) line(g, i, y, i, y + h, color, 0.5);
  for (let j = y; j <= y + h; j += step) line(g, x, j, x + w, j, color, 0.5);
}
export function frame(g, k, context, title, dark = false) {
  g.fillStyle = dark ? C.dark : C.paper;
  g.fillRect(0, 0, 960, 540);
  const fg = dark ? C.white : C.ink,
    sub = dark ? '#a9c7c4' : C.muted;
  line(g, 37, 45, 923, 45, dark ? '#466366' : C.rule, 1);
  label(g, 'MODEL GATEWAY   /   ' + context.toUpperCase(), 39, 32, sub);
  tx(g, 'DESIGN INTERVIEW', 921, 32, 12, sub, 'Mono', 500, 'right');
  serif(g, title, 36, 99, 36, fg);
}
export function foot(g, small, large, tone = C.teal, dark = false) {
  const fg = dark ? C.white : C.ink;
  line(g, 38, 413, 921, 413, dark ? '#6e918e' : C.rule);
  label(g, small, 38, 438, dark ? C.mint : tone);
  tx(g, large, 38, 475, 24, fg, 'Sans', 600);
}
export function chip(g, t, x, y, color = C.teal, bg = C.white) {
  g.font = '600 15px "Lesson Sans"';
  const w = Math.ceil(g.measureText(t).width) + 26;
  box(g, x, y, w, 30, bg, color, 4);
  tx(g, t, x + 13, y + 21, 15, color, 'Sans', 600);
  return w;
}
export function cue(k, b, phrase, width = 0.36) {
  const i = k.beat.beatIndex;
  return i > b ? 1 : i < b ? 0 : k.reveal(phrase, width);
}
export function ruledText(g, x, y, w, t, v, tone = C.ink) {
  line(g, x, y + 12, x + w, y + 12, C.rule);
  label(g, t, x, y - 9);
  tx(g, v, x + w, y + 1, 20, tone, 'Sans', 600, 'right');
}
export function arrow(g, x, y, x2, color = C.teal) {
  line(g, x, y, x2, y, color, 2);
  line(g, x2 - 7, y - 5, x2, y, color, 2);
  line(g, x2 - 7, y + 5, x2, y, color, 2);
}
export function paper(g, x, y, w, h, fill = C.white) {
  box(g, x + 3, y + 5, w, h, '#23363b19', null, 3);
  box(g, x, y, w, h, fill, C.rule, 3);
  for (let i = x + 12; i < x + w - 8; i += 16) {
    dot(g, i, y + 9, 2.25, '#c6c9b8');
  }
}
export function scope(g, x, y, w, h) {
  box(g, x - 5, y - 5, w + 10, h + 10, '#315054', null, 9);
  box(g, x, y, w, h, C.screen, null, 6);
  grid(g, x + 10, y + 12, w - 20, h - 24, 20, '#345354');
}
export function mark(g, x, y, t, color = C.teal) {
  dot(g, x, y - 5, 5, color);
  tx(g, t, x + 14, y, 17, color, 'Sans', 600);
}
