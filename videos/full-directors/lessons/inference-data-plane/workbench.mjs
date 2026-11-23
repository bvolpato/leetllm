export const C = {
  paper: '#f5f0e3',
  ink: '#123b3c',
  dim: '#4c6864',
  line: '#9aa99c',
  well: '#123b3c',
  inset: '#092a2e',
  bright: '#f8f3df',
  soft: '#acc9bc',
  copper: '#e89955',
  blue: '#88c8e4',
  green: '#a5d6a2',
  red: '#b04432',
  rust: '#944817',
  teal: '#216965',
  gray: '#d5d9cb',
  shadow: '#bcc4b7',
};
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const index = (clock) => clock.beat.beatIndex;
export function cue(clock, beat, phrase, duration = 0) {
  const i = index(clock);
  return i === beat ? clock.reveal(phrase, duration) : Number(i > beat);
}
export function box(ctx, x, y, w, h, fill, stroke = null, radius = 0, width = 2) {
  if (w <= 0 || h <= 0) return;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(radius, w / 2, h / 2));
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}
export function line(ctx, x, y, x2, y2, color = C.line, w = 3) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
}
export function label(
  ctx,
  str,
  x,
  y,
  size = 32,
  color = C.ink,
  family = 'Sans',
  weight = 500,
  align = 'left',
) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(str), x, y);
}
export function mono(ctx, str, x, y, size = 30, color = C.ink, align = 'left') {
  label(ctx, str, x, y, size, color, 'Mono', 500, align);
}
export function title(ctx, clock, sub) {
  box(ctx, 0, 0, 1920, 1080, C.paper);
  line(ctx, 92, 180, 1828, 180, C.ink, 3);
  label(ctx, sub, 94, 67, 25, C.teal, 'Mono', 600);
  label(ctx, clock.beat.chapterTitle, 90, 145, 64, C.ink, 'Serif', 500);
}
export function foot(ctx, str, color = C.ink) {
  line(ctx, 92, 856, 1828, 856);
  label(ctx, str, 94, 917, 35, color, 'Serif', 500);
}
export function screw(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = C.line;
  ctx.fill();
  line(ctx, x - 3, y + 3, x + 3, y - 3, C.well, 2);
}
export function chassis(ctx, x, y, w, h, name) {
  box(ctx, x + 4, y + 7, w, h, C.shadow, null, 19);
  const enamel = ctx.createLinearGradient(x, y, x + w * 0.3, y + h);
  enamel.addColorStop(0, '#225153');
  enamel.addColorStop(0.35, C.well);
  enamel.addColorStop(1, '#0c3031');
  box(ctx, x, y, w, h, enamel, C.ink, 19);
  line(ctx, x + 36, y + 73, x + w - 36, y + 73, '#63827a', 1);
  screw(ctx, x + 17, y + 17);
  screw(ctx, x + w - 17, y + 17);
  screw(ctx, x + 17, y + h - 17);
  screw(ctx, x + w - 17, y + h - 17);
  label(ctx, name, x + 36, y + 56, 30, C.bright, 'Sans', 600);
}
export function socket(ctx, x, y, w, h, fraction, color, cells = 16) {
  box(ctx, x, y, w, h, C.inset, C.soft, 4);
  box(ctx, x + 3, y + 3, (w - 6) * clamp(fraction), h - 6, color, null, 2);
  for (let j = 1; j < cells; j++)
    line(ctx, x + (w * j) / cells, y + 3, x + (w * j) / cells, y + h - 3, C.well, 2);
  line(ctx, x + 3, y + h * 0.48, x + w - 3, y + h * 0.48, C.well, 2);
}
export function cable(ctx, x, y, x2, y2, sag = 35, color = C.well) {
  for (const [stroke, w] of [
    [C.line, 18],
    [color, 12],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 65, y + sag, x2 - 65, y2 + sag, x2, y2);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = w;
    ctx.stroke();
  }
}
export function printer(ctx, x, y, w, word = '', amount = 1, name = 'Decoder output') {
  box(ctx, x + 3, y + 6, w, 201, C.shadow, null, 16);
  box(ctx, x, y, w, 201, C.well, null, 16);
  label(ctx, name, x + 28, y + 43, 26, C.bright, 'Sans', 600);
  box(ctx, x + 26, y + 64, w - 52, 107, C.inset, C.dim, 10);
  const roll = ctx.createLinearGradient(x, y + 68, x, y + 164);
  roll.addColorStop(0, '#d5d4c9');
  roll.addColorStop(0.16, '#fffbed');
  roll.addColorStop(0.83, '#fffbed');
  roll.addColorStop(1, '#e4e2d3');
  box(ctx, x + 39, y + 68, w - 78, 96, roll, null, 2);
  for (let i = 0; i < 7; i++) {
    box(ctx, x + 44, y + 73 + i * 12, 7, 5, C.gray, null, 2);
    box(ctx, x + w - 51, y + 73 + i * 12, 7, 5, C.gray, null, 2);
  }
  const left = x + 74;
  ctx.font = '600 55px "Lesson Mono"';
  const inkWidth = word ? ctx.measureText(word).width * amount : 0;
  if (word) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(left - 2, y + 70, inkWidth + 2, 90);
    ctx.clip();
    label(ctx, word, left, y + 136, 55, C.ink, 'Mono', 600);
    ctx.restore();
  }
  const head = left + inkWidth;
  box(ctx, head - 17, y + 56, 34, 16, C.copper, C.rust, 3);
  ctx.beginPath();
  ctx.moveTo(head - 7, y + 72);
  ctx.lineTo(head, y + 83);
  ctx.lineTo(head + 7, y + 72);
  ctx.closePath();
  ctx.fillStyle = C.rust;
  ctx.fill();
}
export function bar(ctx, x, y, w, h, f, color, bg = C.gray) {
  box(ctx, x, y, w, h, bg, null, 4);
  box(ctx, x, y, w * clamp(f), h, color, null, 4);
}
export function arrow(ctx, x, y, x2, y2, color = C.ink) {
  line(ctx, x, y, x2, y2, color, 4);
  const angle = Math.atan2(y2 - y, x2 - x);
  for (const d of [-0.55, 0.55])
    line(ctx, x2, y2, x2 - 16 * Math.cos(angle + d), y2 - 16 * Math.sin(angle + d), color, 4);
}
export function ledger(ctx, x, y, width, rows, step = 70) {
  rows.forEach(([name, value, color], i) => {
    const yy = y + i * step;
    line(ctx, x, yy + 17, x + width, yy + 17, C.line, 2);
    label(ctx, name, x, yy, 29, C.dim);
    mono(ctx, value, x + width, yy, 31, color || C.ink, 'right');
  });
}
