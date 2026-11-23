export const C = {
  paper: '#f6f1df',
  white: '#fffcef',
  ink: '#142e35',
  faint: '#d9d8c7',
  soft: '#e6e5d5',
  dim: '#526567',
  blue: '#175985',
  blueLight: '#e1edf1',
  teal: '#006d62',
  mint: '#dbebe1',
  rust: '#af4029',
  peach: '#f6decf',
  gold: '#e8b853',
  dark: '#173940',
};
export function type(c, value, x, y, size = 42, opts = {}) {
  const { color = C.ink, face = 'Sans', align = 'left', weight = 400, width } = opts;
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  if (width) c.fillText(String(value), x, y, width);
  else c.fillText(String(value), x, y);
}
export function rect(c, x, y, w, h, fill, stroke = null, lw = 2, r = 0) {
  c.beginPath();
  if (r) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.lineWidth = lw;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
export function line(c, x, y, X, Y, color = C.faint, width = 3, dash = []) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(X, Y);
  c.stroke();
  c.restore();
}
export function arrow(c, x, y, X, Y, color = C.teal, width = 5) {
  line(c, x, y, X, Y, color, width);
  const a = Math.atan2(Y - y, X - x),
    len = 16;
  for (const off of [-0.5, 0.5])
    line(c, X, Y, X - len * Math.cos(a + off), Y - len * Math.sin(a + off), color, width);
}
export function dot(c, x, y, r, fill) {
  c.fillStyle = fill;
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fill();
}
export function path(c, d, color, stroke = null, width = 2) {
  c.beginPath();
  for (const [op, ...args] of d) c[op](...args);
  if (color) {
    c.fillStyle = color;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
export function bird(c, x, y, scale = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const silhouette = [
    ['moveTo', -110, 12],
    ['lineTo', -49, 15],
    ['bezierCurveTo', -25, -3, -8, -23, 15, -28],
    ['bezierCurveTo', 30, -64, 65, -65, 82, -44],
    ['lineTo', 110, -38],
    ['lineTo', 84, -28],
    ['bezierCurveTo', 79, 11, 57, 36, 18, 38],
    ['bezierCurveTo', -12, 38, -33, 28, -51, 25],
    ['lineTo', -103, 27],
    ['closePath'],
  ];
  path(c, silhouette, C.ink);
  path(
    c,
    [
      ['moveTo', -65, 17],
      ['bezierCurveTo', -25, 9, 5, -21, 36, -19],
      ['bezierCurveTo', 27, 6, -3, 24, -43, 23],
      ['closePath'],
    ],
    C.teal,
  );
  for (let i = 0; i < 4; i++)
    line(c, -44 + i * 14, 18 - i * 4, -16 + i * 12, 7 - i * 5, C.mint, 1.7);
  dot(c, 69, -43, 4, C.paper);
  for (const lx of [12, 30]) {
    line(c, lx, 34, lx - 4, 51, C.ink, 3);
    line(c, lx - 15, 51, lx + 5, 51, C.ink, 3);
  }
  c.restore();
}
export function frame(c, section, heading) {
  rect(c, 0, 0, 1920, 1080, C.paper);
  rect(c, 0, 0, 1920, 12, C.teal);
  type(c, section, 94, 83, 30, { face: 'Mono', color: C.teal });
  type(c, heading, 90, 178, 82, { face: 'Serif', width: 1740 });
  line(c, 92, 245, 1828, 245, C.ink, 2);
}
export function footer(c, text, accent = C.teal) {
  line(c, 94, 905, 1826, 905, C.faint, 3);
  rect(c, 94, 938, 9, 62, accent);
  type(c, text, 132, 968, 43, { face: 'Serif', width: 1685 });
}
export function cell(c, x, y, w, h, word, opts = {}) {
  const { color = C.blue, fill = C.white, detail, outline = false } = opts;
  rect(c, x, y, w, h, fill, outline ? color : C.faint, outline ? 5 : 2, 9);
  if (word !== undefined && word !== null) {
    rect(c, x + 2, y + h - 8, w - 4, 6, color);
    type(c, word, x + w / 2, y + (detail ? h * 0.36 : h * 0.5), opts.size || 42, {
      face: opts.face || 'Serif',
      align: 'center',
      width: w - 18,
      color,
    });
  }
  if (detail !== undefined)
    type(c, detail, x + w / 2, y + h * 0.73, opts.small || 29, {
      face: 'Mono',
      align: 'center',
      color: C.dim,
      width: w - 12,
    });
}
export function row(c, items, x, y, pitch, h, options = {}) {
  items.forEach((w, i) =>
    cell(c, x + pitch * i, y, pitch - 10, h, w, { ...options, ...options.item?.(w, i) }),
  );
}
export function caption(c, text, x, y, opts = {}) {
  type(c, text, x, y, 30, { face: 'Mono', color: C.dim, ...opts });
}
export function heading(c, text, x, y, width = 1200) {
  type(c, text, x, y, 49, { face: 'Serif', width });
}
export function cue(clock, b, phrase, duration = 0) {
  if (clock.beat.beatIndex !== b) return Number(clock.beat.beatIndex > b);
  return clock.reveal(phrase, duration);
}
export function end(clock, b) {
  return (
    clock.beat.beatIndex > b ||
    (clock.beat.beatIndex === b && clock.elapsed >= clock.speechDuration)
  );
}
export const smooth = (t) => t * t * (3 - 2 * t);
export const lerp = (a, b, t) => a + (b - a) * t;
export function fade(c, t, fn) {
  if (t <= 0) return;
  c.save();
  c.globalAlpha *= t;
  fn();
  c.restore();
}
