export const C = {
  bg: '#f3f0e9',
  paper: '#fffcf5',
  ink: '#182d38',
  soft: '#52636b',
  line: '#bcc8c6',
  sea: '#116b69',
  mint: '#c8e6d9',
  sky: '#c6ddec',
  blue: '#346485',
  plum: '#6c527c',
  lilac: '#e5dceb',
  red: '#91462e',
  peach: '#f4d6bb',
  gold: '#ac7227',
  pale: '#e9e6dc',
};
export function label(ctx, t, x, y, size = 20, color = C.ink, opt = {}) {
  let f = size;
  const font = () => {
    ctx.font = (opt.bold ? 600 : 400) + ' ' + f + 'px "Lesson ' + (opt.face || 'Sans') + '"';
  };
  font();
  if (opt.w && ctx.measureText(String(t)).width > opt.w) {
    f *= opt.w / ctx.measureText(String(t)).width;
    font();
  }
  ctx.textAlign = opt.align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(String(t), x, y);
}
export const mid = (c, t, x, y, s = 20, color = C.ink, w) =>
  label(c, t, x, y, s, color, { align: 'center', w });
export const mono = (c, t, x, y, s = 19, color = C.ink, w) =>
  label(c, t, x, y, s, color, { face: 'Mono', w });
export function box(c, x, y, w, h, fill, stroke = null, r = 6) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1.4;
    c.stroke();
  }
}
export function line(c, x1, y1, x2, y2, color = C.line, width = 1.5, dash = []) {
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
export function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
export function crescent(c, x, y, r, ink = C.blue) {
  c.save();
  c.translate(x, y);
  c.scale(r, r);
  c.beginPath();
  c.moveTo(0.10, -0.98);
  c.bezierCurveTo(-1.35, -0.84, -1.21, 1.18, 0.26, 0.96);
  c.bezierCurveTo(0.65, 0.90, 0.93, 0.66, 1.03, 0.35);
  c.bezierCurveTo(0.10, 0.61, -0.50, -0.23, 0.10, -0.98);
  c.fillStyle = ink;
  c.fill();
  c.restore();
}
export function tag(c, t, x, y, w, fill = C.pale, color = C.ink, h = 36) {
  box(c, x, y, w, h, fill, null, 5);
  mid(c, t, x + w / 2, y + h / 2 + 6, 18, color, w - 12);
}
export function head(c, series, title) {
  c.fillStyle = C.bg;
  c.fillRect(0, 0, 1920, 1080);
  c.scale(2, 2);
  label(c, 'SGLang', 40, 42, 19, C.sea, { bold: true });
  line(c, 124, 23, 124, 44, C.line);
  label(c, series, 140, 41, 17, C.soft);
  line(c, 40, 58, 920, 58);
  if (title) label(c, title, 40, 108, 39, C.ink, { face: 'Serif', w: 881 });
}
export function note(c, t, color = C.sea) {
  line(c, 40, 443, 920, 443, C.line);
  label(c, t, 40, 473, 21, color, { w: 880 });
}
export function rows(c, items, x, y, w, { height = 48, labels = 0.41 } = {}) {
  items.forEach(([a, b, color = C.ink], i) => {
    const top = y + i * height;
    line(c, x, top, x + w, top);
    label(c, a, x, top + height * 0.68, 19, C.soft, { w: w * labels - 12 });
    label(c, b, x + w * labels, top + height * 0.68, 23, color, { w: w * (1 - labels) - 2 });
  });
}
export function cells(c, values, x, y, w, h, styles = [], gap = 5) {
  const cw = (w - gap * (values.length - 1)) / values.length;
  values.forEach((v, i) => {
    const color = styles[i] || C.paper;
    box(c, x + i * (cw + gap), y, cw, h, color, C.line, 3);
    mid(c, v, x + i * (cw + gap) + cw / 2, y + h / 2 + 7, 22, C.ink, cw - 5);
  });
}
export function step(k, beat, phrase, span = 0.5) {
  const i = k.beat.beatIndex;
  return i === beat ? k.reveal(phrase, span) : Number(i > beat);
}
export const on = (k, b, p) => step(k, b, p, 0) === 1;
export const choose = (k, b, p, a, z) => (on(k, b, p) ? z : a);
export const mix = (a, b, t) => a + (b - a) * t;
export function panel(c, x, y, w, h, name, accent = C.sea) {
  box(c, x, y, w, h, C.paper, C.line, 10);
  line(c, x + 2, y + 20, x + 2, y + h - 20, accent, 4);
  label(c, name, x + 20, y + 35, 19, accent, { bold: true, w: w - 40 });
}
export function trace(c, xs, y, labels, active) {
  line(c, xs[0], y, xs.at(-1), y, C.line, 3);
  line(c, xs[0], y, xs[Math.max(0, active)], y, C.sea, 3);
  xs.forEach((x, i) => {
    dot(c, x, y, i === active ? 10 : 6, i <= active ? C.sea : C.line);
    mid(c, labels[i], x, y + 36, 18, i === active ? C.sea : C.soft);
  });
}
// Each address on the rack occupies an equal fraction of its reservation.
export function buffer(c, x, y, w, h, received, total, n) {
  const gap = 5,
    unit = total / n,
    cw = (w - (n - 1) * gap) / n;
  for (let i = 0; i < n; i++) {
    const left = x + i * (cw + gap),
      fraction = Math.max(0, Math.min(1, (received - i * unit) / unit));
    box(c, left, y, cw, h, C.paper, C.line, 3);
    if (fraction > 0) {
      c.fillStyle = C.mint;
      c.fillRect(left + 1, y + 1, (cw - 2) * fraction, h - 2);
    }
    mid(c, unit + ' MiB', left + cw / 2, y + h / 2 + 6, 19, C.ink, cw - 4);
  }
}
