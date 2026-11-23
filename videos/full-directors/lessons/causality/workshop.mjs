export const C = {
  felt: '#173a36',
  deep: '#0e2726',
  edge: '#526961',
  ivory: '#fbefd5',
  cream: '#e8dcc0',
  ink: '#1b3632',
  muted: '#a7bcb0',
  brass: '#e7b869',
  blue: '#78ccdf',
  green: '#9bd4ac',
  red: '#e49b84',
  blueInk: '#216275',
  redInk: '#934a3e',
  brassInk: '#855c29',
  greenInk: '#316343',
};
export const num = (n, digits = 2) => String(Number(n.toFixed(digits)));
export const pct = (n, digits = 1) => num(n * 100, digits) + '%';
export const sign = (n, digits = 1) => (n > 0 ? '+' : '') + num(n, digits).replace('-', '−');
export const mix = (a, b, t) => a + (b - a) * t;
export function cue(clock, beat, phrase, duration = 0) {
  const index = clock.beat.beatIndex;
  if (index < beat - 1) return 0;
  if (index > beat - 1) return 1;
  return clock.reveal(phrase, duration);
}
export function rect(ctx, x, y, w, h, color, r = 0) {
  ctx.fillStyle = color;
  if (!r) {
    ctx.fillRect(x, y, w, h);
    return;
  }
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
export function line(ctx, x, y, xx, yy, color = C.edge, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(xx, yy);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
export function dot(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}
export function text(
  ctx,
  str,
  x,
  y,
  size = 20,
  color = C.ivory,
  align = 'left',
  family = 'Sans',
  weight = 400,
) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(str), x, y);
}
export function title(ctx, str) {
  text(ctx, str, 38, 63, 37, C.ivory, 'left', 'Serif');
}
export function stamp(ctx, str, x, y, color = C.brass) {
  text(ctx, str, x, y, 13, color, 'left', 'Mono', 600);
}
export function bench(ctx) {
  const g = ctx.createLinearGradient(0, 0, 940, 540);
  g.addColorStop(0, '#284b42');
  g.addColorStop(0.48, C.felt);
  g.addColorStop(1, C.deep);
  rect(ctx, 0, 0, 960, 540, g);
}
export function stock(ctx, x, y, w, h, tint = C.ivory) {
  rect(ctx, x + 2, y + 5, w, h, '#102723', 3);
  rect(ctx, x, y, w, h, tint, 3);
  for (const yy of [y + 15, y + h - 15]) {
    dot(ctx, x, yy, 4, C.felt);
    dot(ctx, x + w, yy, 4, C.felt);
  }
}
export function labelValue(ctx, x, y, label, value, w = 370, color = C.ink) {
  text(ctx, label, x, y, 17, color);
  text(ctx, value, x + w, y, 23, color, 'right', 'Mono', 500);
}
export function arrow(ctx, x1, y1, x2, y2, color = C.brass, width = 3) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  line(ctx, x1, y1, x2 - 4 * Math.cos(a), y2 - 4 * Math.sin(a), color, width);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  for (const off of [-0.48, 0.48])
    ctx.lineTo(x2 - 13 * Math.cos(a + off), y2 - 13 * Math.sin(a + off));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
export function rule(ctx, x, y, w, color = C.edge) {
  line(ctx, x, y, x + w, y, color);
}
export function screw(ctx, x, y) {
  dot(ctx, x, y, 4, '#929481');
  line(ctx, x - 2, y + 2, x + 2, y - 2, C.ink, 1.1);
}
export function slug(ctx, x, y, w, h, fill, caption, fg = C.ink) {
  rect(ctx, x, y + 2, w, h, C.deep, 2);
  rect(ctx, x, y, w, h, fill, 2);
  if (w > 10 && h > 8) {
    dot(ctx, x, y + h / 2, Math.min(2, h / 5), C.deep);
    dot(ctx, x + w, y + h / 2, Math.min(2, h / 5), C.deep);
  }
  if (caption)
    text(ctx, caption, x + w / 2, y + h * 0.69, Math.min(14, h * 0.48), fg, 'center', 'Mono', 500);
}
export function scale(ctx, x, y, w, low, high, ticks, unit = '') {
  rule(ctx, x, y, w, C.muted);
  const pos = (n) => x + (w * (n - low)) / (high - low);
  for (const n of ticks) {
    line(ctx, pos(n), y - 4, pos(n), y + 5, C.muted);
    text(ctx, num(n) + unit, pos(n), y + 24, 14, C.cream, 'center', 'Mono');
  }
  return pos;
}
