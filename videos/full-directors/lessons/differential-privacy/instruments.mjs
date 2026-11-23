export const P = {
  paper: '#f6f1e4',
  light: '#fffaf0',
  ink: '#172f36',
  muted: '#52686a',
  line: '#a9b6aa',
  teal: '#176b66',
  jade: '#ace0be',
  blue: '#2c6286',
  sky: '#b8dcf0',
  brass: '#c38e40',
  gold: '#f3cb7c',
  plum: '#8d3f52',
  rose: '#eeb6b0',
  dark: '#142e36',
  soft: '#e3e6d7',
};
export const mix = (a, b, t) => a + (b - a) * t;
export const lerpPoint = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
export const neat = (v, digits = 3) => String(Number(v.toFixed(digits))).replace('-', '−');
export const pair = (v) => '(' + v.map((n) => neat(n)).join(', ') + ')';
export function cue(clock, beat, phrase, span = 0) {
  const current = clock.beat.beatIndex + 1;
  if (current !== beat) return Number(current > beat);
  return clock.reveal(phrase, span);
}
export function type(
  c,
  value,
  x,
  y,
  size = 42,
  color = P.ink,
  align = 'left',
  face = 'Sans',
  weight = 500,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(String(value), x, y);
}
export function line(c, x1, y1, x2, y2, color = P.line, width = 3, dash = []) {
  c.save();
  c.setLineDash(dash);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.restore();
}
export function rect(c, x, y, w, h, fill, stroke, r = 0, sw = 2) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = sw;
    c.stroke();
  }
}
export function dot(c, x, y, r, fill, stroke, sw = 2) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = sw;
    c.stroke();
  }
}
export function arrow(c, a, b, color, width = 9) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    len = Math.hypot(dx, dy);
  if (len < 1) return;
  const head = Math.min(len * 0.42, width * 3.2),
    ux = dx / len,
    uy = dy / len;
  const back = [b[0] - head * ux, b[1] - head * uy];
  line(c, ...a, ...back, color, width);
  c.beginPath();
  c.moveTo(...b);
  c.lineTo(back[0] - uy * head * 0.41, back[1] + ux * head * 0.41);
  c.lineTo(back[0] + uy * head * 0.41, back[1] - ux * head * 0.41);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
export function background(c, dark = false) {
  const g = c.createLinearGradient(0, 0, 1800, 1080);
  g.addColorStop(0, dark ? '#203f47' : '#fbf7eb');
  g.addColorStop(1, dark ? '#10262f' : '#e7e7d6');
  c.fillStyle = g;
  c.fillRect(0, 0, 1920, 1080);
}
export function heading(c, heading, sub = '', dark = false) {
  type(c, heading, 110, 115, 68, dark ? P.light : P.ink, 'left', 'Serif');
  if (sub) type(c, sub, 115, 204, 34, dark ? P.sky : P.muted);
}
export function bracket(c, x1, x2, y, label, color = P.plum, size = 36) {
  line(c, x1, y, x2, y, color, 4);
  line(c, x1, y - 13, x1, y + 13, color, 4);
  line(c, x2, y - 13, x2, y + 13, color, 4);
  if (label) type(c, label, (x1 + x2) / 2, y + 47, size, color, 'center');
}
export function ruler(c, x, y, unit, max, step = 0.25) {
  rect(c, x - 28, y, unit * max + 56, 81, '#e0c492', '#b29568', 9);
  for (let i = 0; i <= Math.round(max / step); i++) {
    const k = i * step,
      xx = x + unit * k,
      big = Math.abs(k - Math.round(k)) < 1e-8;
    line(c, xx, y + 2, xx, y + (big ? 32 : 16), P.muted, big ? 4 : 2);
    if (big) type(c, neat(k), xx, y + 54, 30, P.ink, 'center', 'Mono');
  }
}
export function screw(c, x, y) {
  dot(c, x, y, 9, '#b69968', '#735e42', 2);
  line(c, x - 4, y + 3, x + 4, y - 3, '#735e42', 2);
}
export function plate(c, x, y, w, h, fill = P.light) {
  rect(c, x + 3, y + 11, w, h, '#15343a20', null, 20);
  rect(c, x, y, w, h, fill, '#abb5a8', 20);
  for (const xx of [x + 27, x + w - 27]) for (const yy of [y + 27, y + h - 27]) screw(c, xx, yy);
}
export function segment(c, x, y, w, h, color, ink, value, name = '') {
  if (w <= 0) return;
  rect(c, x + 2, y + 7, w - 3, h, '#152e3924', null, 8);
  rect(c, x, y, w - 2, h, color, ink, 8, 2);
  line(c, x + 15, y + 7, x + w - 17, y + 7, '#ffffff88', 3);
  line(c, x + 15, y + h - 8, x + w - 17, y + h - 8, ink, 2);
  const labelSize = Math.min(44, Math.max(22, w / 3.25));
  if ((name.startsWith('Alice') || name === 'Bao') && w > 140) {
    line(c, x + w - 24, y + 13, x + w - 24, y + h - 14, ink, 1.5, [4, 5]);
    dot(c, x + 14, y + h / 2, 4, P.light, ink, 1);
  }
  type(c, value, x + w / 2, y + h * (name ? 0.65 : 0.52), labelSize, ink, 'center', 'Mono', 600);
  if (name) type(c, name, x + w / 2, y + h * 0.28, Math.min(28, w / 3.3), ink, 'center');
}
export function graph(c, { x, y, scale, xmin, xmax, ymin, ymax, step = 1, dark = false }) {
  const pt = (v) => [x + scale * v[0], y - scale * v[1]];
  const grid = dark ? '#36545a' : '#cbd2c5',
    axis = dark ? '#b5cac2' : '#617b73';
  for (let a = Math.ceil(xmin / step) * step; a <= xmax + 0.00001; a += step) {
    line(
      c,
      ...pt([a, ymin]),
      ...pt([a, ymax]),
      Math.abs(a) < 1e-8 ? axis : grid,
      Math.abs(a) < 1e-8 ? 3 : 1.5,
    );
    if (a !== 0 && Number.isInteger(a))
      type(c, neat(a), pt([a, 0])[0], y + 27, 24, axis, 'center', 'Mono');
  }
  for (let a = Math.ceil(ymin / step) * step; a <= ymax + 0.00001; a += step) {
    line(c, ...pt([xmin, a]), ...pt([xmax, a]), a === 0 ? axis : grid, a === 0 ? 3 : 1.5);
    if (a !== 0 && Number.isInteger(a))
      type(c, neat(a), x - 27, pt([0, a])[1], 24, axis, 'right', 'Mono');
  }
  return pt;
}
export function readout(c, x, y, label, value, color = P.ink, dark = false) {
  type(c, label, x, y, 31, dark ? '#cad9d2' : P.muted);
  type(c, value, x, y + 68, 58, color, 'left', 'Mono', 500);
}
