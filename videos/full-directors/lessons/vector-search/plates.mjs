export const P = {
  paper: '#f7f2e5',
  ink: '#172d39',
  dim: '#536772',
  grid: '#d3d9d3',
  sea: '#116e79',
  lagoon: '#d6eae1',
  berry: '#843755',
  blush: '#f1dfe1',
  gold: '#f4b444',
  rust: '#a74a23',
  blue: '#2d4f84',
  pale: '#e0e6ed',
  white: '#fffcf4',
};
export function text(
  c,
  str,
  x,
  y,
  size = 19,
  color = P.ink,
  align = 'left',
  family = 'Sans',
  weight = 400,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(String(str), x, y);
}
export function line(c, x, y, u, v, color = P.grid, w = 1, dash = []) {
  c.save();
  c.setLineDash(dash);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.stroke();
  c.restore();
}
export function rect(c, x, y, w, h, color, edge) {
  if (color) {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  }
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = 1.3;
    c.strokeRect(x, y, w, h);
  }
}
export function circle(c, x, y, r, fill, edge, width = 1.5) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = width;
    c.stroke();
  }
}
export function polygon(c, points, fill, edge) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const xy of points.slice(1)) c.lineTo(...xy);
  c.closePath();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = 1.2;
    c.stroke();
  }
}
export function title(c, str, kicker) {
  rect(c, 0, 0, 960, 540, P.paper);
  text(c, kicker, 32, 29, 14, P.sea, 'left', 'Mono', 600);
  text(c, str, 31, 65, 34, P.ink, 'left', 'Serif');
  line(c, 32, 92, 928, 92, P.ink);
}
export function footer(c, str, color = P.ink) {
  line(c, 32, 451, 928, 451, P.grid);
  text(c, str, 32, 479, 20, color, 'left', 'Sans', 500);
}
export function chip(c, v, x, y, color = P.ink, r = 16) {
  circle(c, x, y, r, color);
  text(c, v, x, y + 0.5, r * 1.35, P.white, 'center', 'Sans', 600);
}
export function row(c, x, y, label, value, w = 310, color = P.ink) {
  text(c, label, x, y, 17, P.dim);
  text(c, value, x + w, y, 22, color, 'right', 'Mono', 500);
  line(c, x, y + 19, x + w, y + 19, P.grid);
}
export function pair(c, ids, x, y, label) {
  text(c, label, x, y - 32, 14, P.dim, 'left', 'Mono');
  for (let i = 0; i < 2; i++) {
    rect(c, x + i * 72, y - 12, 64, 50, ids[i] ? P.ink : P.white, P.ink);
    text(
      c,
      ids[i] ?? '?',
      x + 32 + i * 72,
      y + 14,
      30,
      ids[i] ? P.paper : P.dim,
      'center',
      'Serif',
      600,
    );
  }
}
export function caption(c, s, x, y) {
  text(c, s, x, y, 15, P.dim, 'left', 'Mono');
}
export function heading(c, s, x, y) {
  text(c, s, x, y, 22, P.ink, 'left', 'Serif', 600);
}
export function clip(c, x, y, w, h, fn) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  fn();
  c.restore();
}
export const lerp = (a, b, t) => a + (b - a) * t;
export const mixPoint = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export function cue(clock, n, phrase, span = 0.65) {
  const b = clock.beat.beatIndex + 1;
  return b === n ? clock.reveal(phrase, span) : Number(b > n);
}
export function on(clock, n, phrase) {
  return cue(clock, n, phrase, 0) === 1;
}
export function done(clock, n) {
  const b = clock.beat.beatIndex + 1;
  return b > n || (b === n && clock.elapsed >= clock.speechDuration);
}
export function grid(c, x, y, w, h, step = 24) {
  for (let u = x; u <= x + w; u += step) line(c, u, y, u, y + h, P.grid, 0.65);
  for (let v = y; v <= y + h; v += step) line(c, x, v, x + w, v, P.grid, 0.65);
}
export function arrow(c, a, b, col, width = 3) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    len = Math.hypot(dx, dy);
  if (len < 1) return;
  const u = dx / len,
    v = dy / len,
    tip = Math.min(10, len * 0.4);
  line(c, ...a, b[0] - u * tip * 0.6, b[1] - v * tip * 0.6, col, width);
  polygon(
    c,
    [
      b,
      [b[0] - u * tip - v * tip * 0.5, b[1] - v * tip + u * tip * 0.5],
      [b[0] - u * tip + v * tip * 0.5, b[1] - v * tip - u * tip * 0.5],
    ],
    col,
  );
}
