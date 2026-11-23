// Drawing tools for the ticket reader, plotting surface and measuring instruments.
export const C = {
  paper: '#f3efdf',
  paper2: '#fffbea',
  ink: '#192e31',
  muted: '#4b635e',
  rule: '#b4beb0',
  blue: '#156889',
  pink: '#ac435c',
  green: '#167257',
  gold: '#91621a',
  metal: '#af9970',
  glass: '#143a3c',
  light: '#eff3df',
  mint: '#a5e5bf',
  coral: '#ffad9e',
  sky: '#96d8ef',
};
export const colors = [C.blue, C.pink, C.green, C.gold];
export const names = ['Slow pages', 'Rollback', 'Both issues', 'Invoice'];
export const clamp = (t) => Math.max(0, Math.min(1, t));
export const mix = (a, b, t) => a + (b - a) * t;
export const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
export const times = (v, k) => v.map((x) => x * k);
export const plus = (a, b) => a.map((v, i) => v + b[i]);
export const lerpRow = (a, b, t) => a.map((v, i) => mix(v, b[i], t));
export const num = (n, digits = 2) =>
  (Math.abs(n) < 0.5 * 10 ** -digits ? '0' : String(Number(n.toFixed(digits)))).replace('-', '−');
export const vec = (row, digits = 2) => '[' + row.map((v) => num(v, digits)).join(',  ') + ']';
export function cue(clock, beat, words, seconds = 0.85) {
  if (clock.beat.beatIndex !== beat) return Number(clock.beat.beatIndex > beat);
  const t = clock.reveal(words, seconds);
  return t * t * (3 - 2 * t);
}
export function type(c, s, x, y, size = 36, color = C.ink, opt = {}) {
  c.fillStyle = color;
  c.textAlign = opt.align || 'left';
  c.textBaseline = 'middle';
  c.font = `${opt.bold ? '700' : '400'} ${size}px "Lesson ${opt.face || 'Sans'}"`;
  c.fillText(String(s), x, y, ...(opt.width ? [opt.width] : []));
}
export const mono = (c, s, x, y, size = 40, col = C.ink, align = 'left', width) =>
  type(c, s, x, y, size, col, { face: 'Mono', align, width });
export const title = (c, s, x, y, size = 52, col = C.ink) => type(c, s, x, y, size, col, { face: 'Serif' });
export function rect(c, x, y, w, h, fill, r = 0, edge) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = 2;
    c.stroke();
  }
}
export function path(c, pts, col, width = 4, closed = false, fill) {
  c.beginPath();
  c.moveTo(...pts[0]);
  pts.slice(1).forEach((p) => c.lineTo(...p));
  if (closed) c.closePath();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (col) {
    c.strokeStyle = col;
    c.lineWidth = width;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.stroke();
  }
}
export const line = (c, x, y, X, Y, col = C.rule, w = 3) =>
  path(
    c,
    [
      [x, y],
      [X, Y],
    ],
    col,
    w,
  );
export function disk(c, x, y, r, col, edge, w = 3) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  if (col) {
    c.fillStyle = col;
    c.fill();
  }
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = w;
    c.stroke();
  }
}
export function arrow(c, a, b, col = C.ink, w = 6) {
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 2) return;
  line(c, ...a, ...b, col, w);
  const len = Math.min(19, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.4);
  path(
    c,
    [
      b,
      [b[0] - len * Math.cos(angle - 0.45), b[1] - len * Math.sin(angle - 0.45)],
      [b[0] - len * Math.cos(angle + 0.45), b[1] - len * Math.sin(angle + 0.45)],
    ],
    col,
    2,
    true,
    col,
  );
}
export function screw(c, x, y) {
  disk(c, x, y, 8, '#cabd9e', '#766e59', 2);
  line(c, x - 4, y + 3, x + 4, y - 3, '#746c58', 2);
}
export function base(c, heading, section) {
  const g = c.createLinearGradient(0, 0, 1920, 1080);
  g.addColorStop(0, '#faf7e9');
  g.addColorStop(0.7, C.paper);
  g.addColorStop(1, '#e3e2cf');
  rect(c, 0, 0, 1920, 1080, g);
  rect(c, 0, 0, 1920, 17, C.glass);
  type(c, section, 92, 73, 30, C.muted, { bold: true });
  title(c, heading, 90, 153, 65);
  line(c, 92, 221, 1828, 221, C.rule, 2);
}
export function note(c, s, y = 959) {
  line(c, 92, y - 44, 1828, y - 44, C.rule, 2);
  type(c, s, 96, y, 37, C.ink, { width: 1720 });
}
export function matrix(c, rows, x, y, opts = {}) {
  const { cw = 102, rh = 78, sz = 42, col = C.ink, digits = 2, highlight, empty } = opts;
  const w = cw * rows[0].length,
    h = rh * rows.length;
  path(
    c,
    [
      [x + 14, y],
      [x, y],
      [x, y + h],
      [x + 14, y + h],
    ],
    col,
    4,
  );
  path(
    c,
    [
      [x + w - 14, y],
      [x + w, y],
      [x + w, y + h],
      [x + w - 14, y + h],
    ],
    col,
    4,
  );
  rows.forEach((row, i) =>
    row.forEach((v, j) => {
      const on = highlight?.(i, j);
      if (on) rect(c, x + j * cw + 8, y + i * rh + 5, cw - 16, rh - 10, on, 6);
      const val = empty?.(i, j) ? '·' : typeof v === 'number' ? num(v, digits) : v;
      mono(c, val, x + (j + 0.5) * cw, y + (i + 0.5) * rh, sz, on ? C.light : col, 'center', cw - 14);
    }),
  );
}
// The edge holes register each physical ticket in the same two feature columns.
export function ticket(c, i, row, x, y, w = 565, h = 128) {
  rect(c, x + 3, y + 6, w, h, '#b4b6a4', 9);
  rect(c, x, y, w, h, C.paper2, 9, '#c1bfa8');
  rect(c, x + 1, y + 1, 13, h - 2, colors[i], 5);
  for (let k = 0; k < 4; k++) disk(c, x + 35, y + 18 + (k * (h - 36)) / 3, 4.5, '#b5b39e');
  type(c, names[i], x + 67, y + h * 0.5, 35, colors[i], { bold: true, width: w - 310 });
  row.forEach((v, j) => {
    const px = x + w - 192 + j * 113;
    disk(c, px, y + h / 2, 31, v ? '#8c8d7c' : '#e8e8d6', v ? '#c9c2a8' : '#d3d3c1', 2);
    if (v) disk(c, px + 1, y + h / 2 + 2, 27, colors[i]);
    mono(c, num(v), px, y + h / 2 + 1, 34, v ? C.light : C.muted, 'center');
  });
}
export function ticketStack(c, rows, x = 102, y = 333, w = 580, step = 157) {
  type(c, 'Slow', x + w - 192, y - 36, 25, C.muted, { align: 'center' });
  type(c, 'Rollback', x + w - 79, y - 36, 25, C.muted, { align: 'center' });
  rows.forEach((row, i) => ticket(c, i, row, x, y + i * step, w, step - 27));
}
export function gauge(c, x, y, w, lo, hi, step = 1, label = '') {
  if (label) type(c, label, x, y - 82, 36, C.muted);
  rect(c, x, y - 9, w, 18, '#c7b38a', 3);
  const at = (v) => x + ((v - lo) / (hi - lo)) * w;
  for (let v = lo; v <= hi + step * 0.02; v += step) {
    const xx = at(v);
    line(c, xx, y - 12, xx, y + 19, C.ink, 3);
    mono(c, num(v, 3), xx, y + 47, 27, C.muted, 'center');
  }
  return at;
}
export function point(c, x, y, i, r = 13) {
  disk(c, x, y, r + 3, C.paper2);
  disk(c, x, y, r, colors[i]);
}
export function plane(c, ox, oy, scale, range, labels = ['Slow', 'Rollback']) {
  const [xmin, xmax, ymin, ymax] = range;
  const p = ([x, y]) => [ox + x * scale, oy - y * scale];
  for (let x = Math.ceil(xmin); x <= xmax; x++)
    path(c, [p([x, ymin]), p([x, ymax])], x === 0 ? C.muted : '#cdd3c3', x === 0 ? 3 : 1.5);
  for (let y = Math.ceil(ymin); y <= ymax; y++)
    path(c, [p([xmin, y]), p([xmax, y])], y === 0 ? C.muted : '#cdd3c3', y === 0 ? 3 : 1.5);
  type(c, labels[0], ox + xmax * scale, oy + 37, 27, C.muted, { align: 'right' });
  type(c, labels[1], ox + 12, oy - ymax * scale - 23, 27, C.muted);
  return p;
}
export function straightedge(c, p, d, lo, hi) {
  const a = p(times(d, lo)),
    b = p(times(d, hi));
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const length = Math.hypot(b[1] - a[1], b[0] - a[0]);
  c.save();
  c.translate(...a);
  c.rotate(ang);
  rect(c, 0, -10, length, 21, '#c3a56bb3', 3);
  for (let i = 0; i < length; i += 19) line(c, i, -10, i, i % 95 === 0 ? 9 : 1, '#806739', 1.5);
  c.restore();
}
export function instrument(c, x, y, w, h) {
  const metal = c.createLinearGradient(x, y, x + w, y + h);
  metal.addColorStop(0, '#d2d3b9');
  metal.addColorStop(0.45, '#a5b19b');
  metal.addColorStop(1, '#909b86');
  rect(c, x + 2, y + 9, w, h, '#9da18f', 27);
  rect(c, x, y, w, h, metal, 27, '#86907d');
  for (const a of [x + 24, x + w - 24]) for (const b of [y + 24, y + h - 24]) screw(c, a, b);
}
export function dial(c, x, y, r, value, lo, hi, col, label) {
  disk(c, x, y, r + 18, '#c7cbb5', '#85917c', 2);
  const angle = (v) => Math.PI * (0.75 + (1.5 * (v - lo)) / (hi - lo));
  for (let i = 0; i <= 20; i++) {
    const a = angle(mix(lo, hi, i / 20));
    line(
      c,
      x + (r + 3) * Math.cos(a),
      y + (r + 3) * Math.sin(a),
      x + (r + 11) * Math.cos(a),
      y + (r + 11) * Math.sin(a),
      C.muted,
      2,
    );
  }
  const g = c.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, '#f5f0d9');
  g.addColorStop(1, '#909c87');
  disk(c, x, y, r, g, C.muted);
  const a = angle(value);
  line(
    c,
    x + 0.35 * r * Math.cos(a),
    y + 0.35 * r * Math.sin(a),
    x + 0.86 * r * Math.cos(a),
    y + 0.86 * r * Math.sin(a),
    col,
    8,
  );
  mono(c, num(value, 3), x, y + r + 53, 38, C.ink, 'center');
  type(c, label, x, y - r - 53, 31, C.ink, { align: 'center' });
}
