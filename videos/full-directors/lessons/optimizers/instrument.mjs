// Canvas coordinates describe a 1200 by 675 instrument face.
export const C = {
  case: '#173b3b',
  caseDark: '#102c2e',
  paper: '#f3ebd6',
  ink: '#223536',
  soft: '#556965',
  grid: '#ccbf9e',
  steel: '#808f86',
  blue: '#196591',
  green: '#287653',
  copper: '#a14d31',
  gold: '#c69748',
  cream: '#fff4d7',
  rose: '#aa4a61',
  pale: '#ded5bc',
};
export const mix = (a, b, t) => a + (b - a) * t;
export const clamp = (v) => Math.max(0, Math.min(1, v));
export function f(n, d = 3) {
  if (Math.abs(n) < 0.5 * 10 ** -d) return '0';
  return String(Number(n.toFixed(d))).replace('-', '−');
}
export const pair = (v, d = 3) => '(' + v.map((x) => f(x, d)).join(', ') + ')';
export function cue(clock, beat, phrase, span = 0.85) {
  const n = clock.beat.beatIndex + 1;
  return n === beat ? clock.reveal(phrase, span) : Number(n > beat);
}
export function label(c, s, x, y, size = 23, color = C.ink, align = 'left', family = 'Sans') {
  c.fillStyle = color;
  c.font = size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(String(s), x, y);
}
export function line(c, x1, y1, x2, y2, col = C.grid, w = 1) {
  c.strokeStyle = col;
  c.lineWidth = w;
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
}
export function box(c, x, y, w, h, fill, stroke) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1;
    c.strokeRect(x, y, w, h);
  }
}
export function poly(c, pts, fill, stroke, w = 1) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.lineWidth = w;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
export function circle(c, x, y, r, fill, stroke, w = 2) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = w;
    c.stroke();
  }
}
export function wash(c, x, y, x2, y2, colors) {
  const g = c.createLinearGradient(x, y, x2, y2);
  colors.forEach((v, i) => g.addColorStop(i / (colors.length - 1), v));
  return g;
}
function screw(c, x, y) {
  circle(c, x, y, 5, C.gold, C.caseDark);
  line(c, x - 2.6, y + 2, x + 2.6, y - 2, C.caseDark, 1.6);
}
export function face(c, title, setup, shorterPanel = 0) {
  c.scale(1.6, 1.6);
  box(c, 0, 0, 1200, 675, wash(c, 0, 0, 1200, 675, [C.case, '#24504b', C.caseDark]));
  label(c, title, 48, 43, 42, C.cream, 'left', 'Serif');
  label(c, setup, 50, 73.5, 20, '#d0dacb');
  const panelTrim = shorterPanel + 7;
  box(c, 27, 91, 1146, 402.5 - panelTrim, '#0c2527');
  box(c, 30, 86, 1140, 400.5 - panelTrim, wash(c, 0, 68.5, 1100, 502.5, ['#fff7e0', C.paper, '#e9dfc6']));
  for (const x of [43, 1157]) for (const y of [99, 472.5 - panelTrim]) screw(c, x, y);
  // Keep the instruments at their original scale and leave room for two caption lines.
  c.translate(0, -42.5 - shorterPanel / 2);
}
export function note(c, msg, detail = '') {
  // Keep both lines above two captions at the narrow phone width.
  label(c, msg, 49, 543, 24, C.cream, 'left', 'Serif');
  if (detail) label(c, detail, 50, 566, 20, '#c7d9cc');
}
export function arrow(c, x, y, xx, yy, col, width = 4) {
  const dx = xx - x,
    dy = yy - y,
    len = Math.hypot(dx, dy);
  if (len < 1) return;
  const u = dx / len,
    v = dy / len,
    h = Math.min(len, 12);
  line(c, x, y, xx - u * h * 0.6, yy - v * h * 0.6, col, width);
  poly(
    c,
    [
      [xx, yy],
      [xx - u * h - v * h * 0.42, yy - v * h + u * h * 0.42],
      [xx - u * h + v * h * 0.42, yy - v * h - u * h * 0.42],
    ],
    col,
  );
}
export function head(c, title, x, y, col = C.ink) {
  label(c, title, x, y, 25, col, 'left', 'Serif');
}
export function number(c, s, x, y, col = C.ink, size = 29, align = 'left') {
  label(c, s, x, y, size, col, align, 'Mono');
}
export function pin(c, x, y, col, r = 9) {
  circle(c, x + 2, y + 3, r, '#857e67');
  circle(c, x, y, r, col, '#373f39', 1.3);
  circle(c, x - 2, y - 2, Math.max(1, r * 0.3), C.cream);
}
// The open notch is the old position. The solid carriage and its pointer share the numerical axis.
export function rail(
  c,
  { x = 90, y, w = 1000, lo, hi, from, to, color = C.blue, title, read, ticks = [lo, hi], p = 1 },
) {
  const map = (n) => x + ((n - lo) * w) / (hi - lo),
    a = from === undefined ? undefined : map(from);
  if (title) head(c, title, x, y - 39, color);
  if (read) number(c, read, x + w, y - 39, color, 24, 'right');
  box(c, x, y - 3, w, 7, '#b7b49d');
  box(c, x, y - 2, w, 2, C.soft);
  for (let i = 0; i <= 40; i++)
    line(c, x + (i * w) / 40, y + 5, x + (i * w) / 40, y + (i % 5 ? 10 : 16), C.steel);
  for (const t of ticks) {
    line(c, map(t), y - 8, map(t), y + 14, C.soft, 1.5);
    label(c, f(t, 4), map(t), y + 37, 16, C.soft, 'center', 'Mono');
  }
  if (lo < 0 && hi > 0) line(c, map(0), y - 23, map(0), y + 14, C.ink, 1.7);
  if (a === undefined) return;
  const z = map(mix(from, to, p));
  line(c, a, y - 9, z, y - 9, color, 4);
  circle(c, a, y - 9, 6, C.paper, color, 2);
  poly(
    c,
    [
      [z - 8, y - 26],
      [z + 8, y - 26],
      [z, y - 12],
    ],
    color,
  );
  pin(c, z, y - 28, color, 6);
}
export function plot(
  c,
  { x, y, w, h, xmax, ymin, ymax, series, ticks = [], xticks = [], limit, labels = true },
) {
  const px = (v) => x + (w * v) / xmax,
    py = (v) => y + h - ((v - ymin) * h) / (ymax - ymin);
  for (let i = 0; i <= 10; i++) line(c, x + (w * i) / 10, y, x + (w * i) / 10, y + h, C.grid, 0.6);
  for (let i = 0; i <= 5; i++) line(c, x, y + (h * i) / 5, x + w, y + (h * i) / 5, C.grid, 0.6);
  for (const t of ticks) {
    line(c, x, py(t), x + w, py(t), C.grid);
    if (labels) label(c, f(t, 3), x - 9, py(t) + 5, 15, C.soft, 'right', 'Mono');
  }
  line(c, x, y, x, y + h, C.steel);
  line(c, x, y + h, x + w, y + h, C.steel);
  if (ymin < 0 && ymax > 0) line(c, x, py(0), x + w, py(0), C.soft, 1.5);
  for (const t of xticks) label(c, f(t), px(t), y + h + 23, 16, C.soft, 'center', 'Mono');
  if (limit !== undefined) {
    c.setLineDash([6, 4]);
    line(c, x, py(limit), x + w, py(limit), C.copper, 2);
    c.setLineDash([]);
  }
  for (const s of series) {
    if (!s.values.length) continue;
    c.beginPath();
    s.values.forEach((v, i) => (i ? c.lineTo(px(i), py(v)) : c.moveTo(px(i), py(v))));
    c.strokeStyle = s.color;
    c.lineWidth = s.width ?? 3;
    c.setLineDash(s.dash ?? []);
    c.stroke();
    c.setLineDash([]);
    if (s.dots) s.values.forEach((v, i) => circle(c, px(i), py(v), 3, s.color));
    pin(c, px(s.values.length - 1), py(s.values.at(-1)), s.color, 5);
  }
  return { px, py };
}
export function scaleBar(c, x, y, width, fraction, color, text) {
  box(c, x, y, width, 22, C.pale, C.steel);
  if (fraction > 0) box(c, x, y, width * clamp(fraction), 22, color);
  if (text) label(c, text, x, y - 8, 19, color);
}
