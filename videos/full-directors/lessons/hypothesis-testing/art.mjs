export const P = {
  paper: '#f4f0e5',
  white: '#fffdf5',
  ink: '#172e39',
  slate: '#456068',
  line: '#a2b0a8',
  faint: '#d9dfd4',
  teal: '#087a75',
  sea: '#c3e2d5',
  rust: '#a34735',
  blush: '#f0d0bb',
  gold: '#ad720b',
  straw: '#f5df9e',
  dark: '#173f49',
  night: '#0e313a',
  light: '#e7f2e8',
};
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => ((t = clamp(t)), t * t * (3 - 2 * t));
export const total = (values) => values.reduce((a, b) => a + b, 0);
export const pct = (v, digits = 1) => Number((100 * v).toFixed(digits)) + '%';
export const points = (v, digits = 2) =>
  (v > 0 ? '+' : v < 0 ? '−' : '') + Number(Math.abs(100 * v).toFixed(digits));
export const bi = (k) => k.beat.beatIndex;
export function cue(k, b, phrase, span = 0.7, options) {
  if (bi(k) !== b) return Number(bi(k) > b);
  return k.reveal(phrase, span, options);
}
export function rect(c, x, y, w, h, fill, r = 0, stroke = null) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
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
export function line(c, x1, y1, x2, y2, color = P.ink, width = 3, dash = []) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.restore();
}
export function dot(c, x, y, r, fill, stroke = null) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.lineWidth = 2;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
export function text(c, str, x, y, size = 40, color = P.ink, opts = {}) {
  const { face = 'Sans', align = 'left', weight = 400, max = 1800 } = opts;
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.textBaseline = 'middle';
  c.textAlign = align;
  c.fillStyle = color;
  c.fillText(String(str), x, y, max);
}
export const label = (c, str, x, y, size = 27, color = P.slate, align = 'left') =>
  text(c, str, x, y, size, color, { face: 'Mono', align });
export const title = (c, str, x, y, size = 60, color = P.ink, align = 'left', max = 1700) =>
  text(c, str, x, y, size, color, { face: 'Serif', align, max });
export function base(c, k, section, heading) {
  rect(c, 0, 0, 1920, 1080, P.paper);
  const grain = c.createLinearGradient(0, 0, 1920, 1080);
  grain.addColorStop(0, '#fffdf459');
  grain.addColorStop(0.65, '#e3e3cb1c');
  grain.addColorStop(1, '#a7b6a52b');
  rect(c, 0, 0, 1920, 1080, grain);
  label(c, section, 94, 70, 26, P.slate);

  line(c, 94, 108, 1826, 108, P.line, 2);
  title(c, heading, 94, 186, 72, P.ink, 'left', 1740);
}
export function note(c, left, right = '', color = P.teal) {
  line(c, 94, 858, 1826, 858, P.line, 2);
  title(c, left, 94, 922, 48, P.ink, 'left', right ? 1060 : 1732);
  if (right) text(c, right, 1826, 922, 44, color, { face: 'Mono', align: 'right', max: 642 });
}
export function captionSafeNote(c, left, right = '', color = P.teal) {
  line(c, 94, 811, 1826, 811, P.line, 2);
  title(c, left, 94, 840, 42, P.ink, 'left', right ? 1060 : 1732);
  if (right) text(c, right, 1826, 840, 41, color, { face: 'Mono', align: 'right', max: 642 });
}
export function ticket(c, x, y, w, h, fill = P.white) {
  c.save();
  c.translate(x, y);
  const n = Math.min(10, h * 0.1),
    mid = h / 2;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(w - 15, 0);
  c.lineTo(w, 15);
  c.lineTo(w, mid - n);
  c.arc(w, mid, n, -Math.PI / 2, Math.PI / 2, true);
  c.lineTo(w, h);
  c.lineTo(0, h);
  c.lineTo(0, mid + n);
  c.arc(0, mid, n, Math.PI / 2, -Math.PI / 2, true);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  c.lineWidth = 2;
  c.strokeStyle = P.line;
  c.stroke();
  c.restore();
}
export function mark(c, x, y, value, r = 24) {
  if (value === null) {
    dot(c, x, y, r, P.straw);
    label(c, '?', x, y, Math.round(r * 1.25), P.ink, 'center');
    return;
  }
  dot(c, x, y, r, value ? P.teal : P.faint);
  if (value) {
    line(c, x - r * 0.5, y, x - r * 0.13, y + r * 0.34, P.white, r * 0.18);
    line(c, x - r * 0.13, y + r * 0.34, x + r * 0.54, y - r * 0.37, P.white, r * 0.18);
  } else {
    line(c, x - r * 0.44, y, x + r * 0.44, y, P.slate, r * 0.18);
  }
}
export function bracket(c, x, y, w, clr = P.gold, depth = 15) {
  line(c, x, y, x + w, y, clr, 4);
  line(c, x, y, x, y + depth, clr, 4);
  line(c, x + w, y, x + w, y + depth, clr, 4);
}
export function arrow(c, x, y, x2, y2, color = P.slate) {
  line(c, x, y, x2, y2, color, 4);
  const a = Math.atan2(y2 - y, x2 - x);
  for (const d of [-0.62, 0.62])
    line(c, x2, y2, x2 - 16 * Math.cos(a + d), y2 - 16 * Math.sin(a + d), color, 4);
}
export function meter(
  c,
  {
    x = 164,
    y = 658,
    w = 1580,
    min = -0.15,
    max = 0.3,
    ticks = [-0.1, 0, 0.1, 0.2, 0.3],
    threshold = 0.02,
    axis = 'B − A   /   percentage points',
    tickLabel = points,
  } = {},
) {
  const at = (v) => x + (w * (v - min)) / (max - min);
  line(c, x, y, x + w, y, P.slate, 3);
  for (const v of ticks) {
    line(c, at(v), y - 10, at(v), y + 12, P.slate, 3);
    label(c, tickLabel(v), at(v), y + 42, 26, P.slate, 'center');
  }
  if (axis) label(c, axis, x + w, y + 98, 27, P.slate, 'right');
  if (threshold !== null) {
    line(c, at(threshold), y - 236, at(threshold), y, P.gold, 4, [10, 7]);
    label(c, 'minimum  ' + points(threshold), at(threshold), y - 268, 31, P.gold, 'center');
  }
  return at;
}
export function interval(c, at, y, range, estimate, color = P.teal, labels = true) {
  const [lo, hi] = range;
  line(c, at(lo), y, at(hi), y, color, 12);
  for (const v of [lo, hi]) {
    line(c, at(v), y - 18, at(v), y + 18, color, 4);
    if (labels) label(c, points(v), at(v), y + 49, 31, color, 'center');
  }
  if (estimate !== null) dot(c, at(estimate), y, 12, P.white, color);
}
export function pool(
  c,
  values,
  { x = 145, y = 425, w = 1560, selected = [], reveal = true, names = null, ids = true } = {},
) {
  const step = w / values.length,
    d = Math.min(116, step * 0.8),
    h = d * 1.14;
  values.forEach((v, i) => {
    const cx = x + step * (i + 0.5),
      active = selected.includes(i);
    ticket(c, cx - d / 2, y, d, h, active ? P.straw : P.white);
    if (names) title(c, names[i], cx, y + h * 0.33, Math.min(d * 0.39, 43), P.ink, 'center');
    if (reveal) mark(c, cx, y + h * (names ? 0.7 : 0.42), v, d * 0.205);
    if (ids)
      label(
        c,
        String(i + 1).padStart(2, '0'),
        cx,
        y + h * 0.81,
        Math.min(d * 0.23, 28),
        P.slate,
        'center',
      );
    if (active) line(c, cx - d / 2, y + h + 9, cx + d / 2, y + h + 9, P.gold, 7);
  });
}
