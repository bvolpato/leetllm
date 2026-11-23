export const C = {
  linen: '#f2ecdc',
  paper: '#fff9e9',
  ink: '#182f32',
  muted: '#526764',
  dark: '#1b383a',
  bezel: '#29484a',
  metal: '#a7b3a6',
  track: '#d5d9c8',
  grid: '#c6cbb9',
  green: '#277567',
  mint: '#b5ddbd',
  orange: '#a54f24',
  copper: '#d89058',
  plum: '#66517e',
  pink: '#a13e50',
  pale: '#f2d1b5',
  screen: '#dce9cc',
  white: '#fffbed',
};

export function box(ctx, x, y, w, h, fill, r = 0, stroke = null, lw = 1) {
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(0, w), Math.max(0, h), r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}
export function line(ctx, pts, color = C.ink, w = 2) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
}
export function dot(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
export function txt(ctx, s, x, y, size = 20, color = C.ink, opt = {}) {
  ctx.fillStyle = color;
  ctx.textAlign = opt.align || 'left';
  ctx.textBaseline = 'middle';
  ctx.font = (opt.weight || 500) + ' ' + size + 'px "Lesson ' + (opt.font || 'Sans') + '"';
  ctx.fillText(String(s), x, y);
}
export function mono(ctx, s, x, y, size = 20, color = C.ink, align = 'left') {
  txt(ctx, s, x, y, size, color, { font: 'Mono', weight: 500, align });
}
export function serif(ctx, s, x, y, size = 30, color = C.ink, align = 'left') {
  txt(ctx, s, x, y, size, color, { font: 'Serif', weight: 500, align });
}
export function screw(ctx, x, y) {
  dot(ctx, x, y, 5, C.metal);
  line(
    ctx,
    [
      [x - 2, y + 2],
      [x + 2, y - 2],
    ],
    C.bezel,
    1.3,
  );
}
export function base(ctx, title, tag = 'FIELD READER') {
  ctx.scale(2, 2);
  const g = ctx.createLinearGradient(0, 0, 960, 540);
  g.addColorStop(0, '#f8f3e6');
  g.addColorStop(1, '#e8e2d1');
  box(ctx, 0, 0, 960, 540, g);
  box(ctx, 0, 0, 960, 9, C.dark);
  line(
    ctx,
    [
      [32, 81],
      [928, 81],
    ],
    C.metal,
    1,
  );
  serif(ctx, title, 34, 48, 30);
  txt(ctx, tag, 928, 48, 14, C.muted, { align: 'right', weight: 600 });
}
export function note(ctx, s, color = C.ink) {
  line(
    ctx,
    [
      [34, 451],
      [926, 451],
    ],
    C.metal,
    1,
  );
  serif(ctx, s, 480, 467, 22, color, 'center');
}
export function shell(ctx, x, y, w, h) {
  box(ctx, x + 2, y + 4, w, h, '#c9c7b9', 16);
  box(ctx, x, y, w, h, C.dark, 16);
  box(ctx, x + 6, y + 6, w - 12, h - 12, C.bezel, 12);
  for (const dx of [13, w - 13]) for (const dy of [13, h - 13]) screw(ctx, x + dx, y + dy);
}
export function form(ctx, x, y, w, h) {
  box(ctx, x + 3, y + 4, w, h, '#cfc9b7', 4);
  box(ctx, x, y, w, h, C.paper, 4, C.metal);
}
export function pill(ctx, s, x, y, w, fill = C.green, ink = C.white) {
  box(ctx, x, y, w, 29, fill, 6);
  txt(ctx, s, x + w / 2, y + 15, 16, ink, { align: 'center', weight: 600 });
}
export function meter(ctx, x, y, w, h, f, color) {
  box(ctx, x, y, w, h, C.track, 2);
  if (f > 0) box(ctx, x, y, w * Math.min(1, f), h, color, 2);
}
export const unit = (v) => Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
export const fmt = (v) => Number(v.toFixed(3)).toString();
export const at = (clock, words) => clock.reveal(words, 0) === 1;
export const done = (c) => c.elapsed >= c.speechDuration;
export function pathPoint(points, t) {
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let left = t * lengths.reduce((a, b) => a + b, 0);
  for (const [i, n] of lengths.entries()) {
    if (left <= n) {
      const f = left / n;
      return points[i].map((v, j) => v + (points[i + 1][j] - v) * f);
    }
    left -= n;
  }
  return points.at(-1);
}
