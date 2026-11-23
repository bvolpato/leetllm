export const paper = '#fbf3dd',
  ink = '#172b36',
  blue = '#2355b6',
  sky = '#5588da',
  orange = '#c74922',
  green = '#266658',
  faint = '#d8ceb6',
  slate = '#50616b',
  chalk = '#fff9e9',
  lightBlue = '#d2e0ee',
  lightOrange = '#f1d1b8';
export const palette = [sky, blue, orange];
export const words = ['fix', 'this', 'test', 'and', 'run', 'it'];
export const fmt = (x, digits = 3) => Number(x.toFixed(digits)).toString();

export function text(
  ctx,
  value,
  x,
  y,
  size = 40,
  color = ink,
  face = 'Sans',
  align = 'left',
  weight = 400,
) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(String(value), x, y);
}
export function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
export function edge(ctx, x, y, w, h, color = ink, width = 3, dash = []) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
}
export function line(ctx, x0, y0, x1, y1, color = ink, width = 3, dash = []) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.setLineDash([]);
}
export function arrow(ctx, x0, y0, x1, y1, color = ink, width = 5) {
  const angle = Math.atan2(y1 - y0, x1 - x0);
  line(ctx, x0, y0, x1, y1, color, width);
  for (const offset of [-0.55, 0.55]) {
    line(
      ctx,
      x1,
      y1,
      x1 - 22 * Math.cos(angle + offset),
      y1 - 22 * Math.sin(angle + offset),
      color,
      width,
    );
  }
}
export function dot(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
}
export function fade(ctx, alpha, paint) {
  if (alpha === 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  paint();
  ctx.restore();
}
export function page(ctx, title, overline) {
  rect(ctx, 0, 0, 1920, 1080, paper);
  text(ctx, overline, 105, 72, 30, slate, 'Mono');
  text(ctx, title, 100, 173, 78, ink, 'Serif');
}
export function brace(ctx, x0, x1, y, label, color = ink, size = 35) {
  line(ctx, x0, y - 13, x0, y, color);
  line(ctx, x0, y, x1, y, color);
  line(ctx, x1, y, x1, y - 13, color);
  text(ctx, label, (x0 + x1) / 2, y + 50, size, color, 'Sans', 'center');
}
export function note(ctx, message, color = ink) {
  line(ctx, 108, 945, 1804, 945, faint, 2);
  text(ctx, message, 110, 1008, 39, color);
}
export function cue(clock, beat, phrase, duration = 0) {
  if (clock.beat.beatIndex !== beat - 1) return Number(clock.beat.beatIndex > beat - 1);
  return clock.reveal(phrase, duration);
}
export function grid(ctx, x, y, cols, rows, size, paintCell) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) paintCell(x + col * size, y + row * size, row, col);
  }
}
