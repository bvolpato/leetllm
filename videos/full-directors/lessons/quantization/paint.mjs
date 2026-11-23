export const W = 1920,
  H = 1080;
export const night = {
  bg: '#142d39',
  ink: '#fbf3d9',
  muted: '#b2c7c8',
  rule: '#4e6a72',
  soft: '#233f4b',
  blue: '#85bfff',
  mint: '#85e2bf',
  gold: '#ffc66e',
  red: '#ff9984',
};
export const day = {
  bg: '#f7f2e5',
  ink: '#183443',
  muted: '#4e6467',
  rule: '#a8b6ae',
  soft: '#e2e8dc',
  blue: '#2b61a2',
  mint: '#086659',
  gold: '#8e510e',
  red: '#a23d2e',
};

export const clamp = (a, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, a));
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const fmt = (n, places = 3) => String(Number(n.toFixed(places))).replace('-', '−');
export const tuple = (row, places) => '(' + row.map((v) => fmt(v, places)).join(', ') + ')';
export function cue(clock, i, phrase, span = 0.45) {
  const b = clock.beat.beatIndex;
  if (b !== i) return +(b > i);
  return clock.reveal(phrase, span);
}
export function spoken(clock, i) {
  if (clock.beat.beatIndex !== i) return +(clock.beat.beatIndex > i);
  return +(clock.elapsed >= clock.speechDuration);
}
export function alpha(ctx, a, fn) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  fn();
  ctx.restore();
}
export function box(ctx, x, y, w, h, fill, stroke, sw = 3) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }
  if (stroke) {
    ctx.lineWidth = sw;
    ctx.strokeStyle = stroke;
    ctx.strokeRect(x, y, w, h);
  }
}
export function line(ctx, x, y, x2, y2, color, sw = 3) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = sw;
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
export function dot(ctx, x, y, r, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
}
export function txt(ctx, value, x, y, size, col, align = 'left', family = 'Sans', weight = 400) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = col;
  ctx.fillText(String(value), x, y);
}
export const num = (ctx, value, x, y, size, col, align = 'left') =>
  txt(ctx, value, x, y, size, col, align, 'Mono');
export const serif = (ctx, value, x, y, size, col, align = 'left') =>
  txt(ctx, value, x, y, size, col, align, 'Serif');
export function arrow(ctx, x, y, x2, y2, col, sw = 5) {
  const d = Math.atan2(y2 - y, x2 - x);
  line(ctx, x, y, x2, y2, col, sw);
  for (const sign of [-1, 1])
    line(
      ctx,
      x2,
      y2,
      x2 - 17 * Math.cos(d + sign * 0.55),
      y2 - 17 * Math.sin(d + sign * 0.55),
      col,
      sw,
    );
}
export function base(ctx, P, section, title) {
  box(ctx, 0, 0, W, H, P.bg);
  txt(ctx, section, 90, 66, 32, P.muted);
  serif(ctx, title, 86, 159, 72, P.ink);
  line(ctx, 90, 226, 1830, 226, P.rule, 2);
}
export function result(ctx, P, title, value, accent = P.mint) {
  line(ctx, 90, 833, 1830, 833, P.rule, 2);
  txt(ctx, title, 92, 900, 39, P.muted);
  num(ctx, value, 1826, 900, 55, accent, 'right');
}
export function stripe(ctx, x, y, w, h, P) {
  box(ctx, x, y, w, h, P.soft);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let dx = -h; dx < w; dx += 18) line(ctx, x + dx, y + h, x + dx + h, y, P.rule, 3);
  ctx.restore();
}
export function span(ctx, x1, x2, y, col) {
  line(ctx, x1, y, x2, y, col);
  line(ctx, x1, y - 12, x1, y + 12, col);
  line(ctx, x2, y - 12, x2, y + 12, col);
}
