export const ink = '#102f39',
  deep = '#09242d',
  grid = '#345460',
  soft = '#abc7c8',
  white = '#f5efd9';
export const gold = '#ffd17b',
  mint = '#7be0c4',
  blue = '#85c8fa',
  rose = '#ffa49a';
export const paper = '#f2e9cf',
  paperInk = '#203e46';
export function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function line(c, x, y, X, Y, color = grid, width = 2, dash = []) {
  c.beginPath();
  c.setLineDash(dash);
  c.moveTo(x, y);
  c.lineTo(X, Y);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
  c.setLineDash([]);
}
export function poly(c, pts, fill, stroke = null, width = 2) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.lineWidth = width;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
export function circle(c, x, y, r, fill, stroke = null, width = 2) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.lineWidth = width;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
export function arrow(c, x, y, X, Y, color = white, width = 4, head = 14) {
  line(c, x, y, X, Y, color, width);
  const a = Math.atan2(Y - y, X - x);
  poly(
    c,
    [
      [X, Y],
      [X - head * Math.cos(a - 0.5), Y - head * Math.sin(a - 0.5)],
      [X - head * Math.cos(a + 0.5), Y - head * Math.sin(a + 0.5)],
    ],
    color,
  );
}
export function text(
  c,
  str,
  x,
  y,
  size = 32,
  color = white,
  align = 'left',
  face = 'Sans',
  weight = 400,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '", "Lesson Symbols", "Lesson Math"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(String(str), x, y);
}
export const mono = (c, str, x, y, size = 31, color = white, align = 'left') =>
  text(c, str, x, y, size, color, align, 'Mono');
export const title = (c, str, x = 76, y = 104, size = 55, col = white) =>
  text(c, str, x, y, size, col, 'left', 'Serif');
export function label(c, str, x, y, color = soft) {
  text(c, str, x, y, 23, color, 'left', 'Sans', 600);
}
export function pane(c, x, y, w, h, col = deep) {
  rect(c, x, y, w, h, col);
  line(c, x, y, x + w, y, grid, 2);
  line(c, x, y + h, x + w, y + h, grid, 2);
}
export function base(c) {
  c.scale(1.2, 1.2);
  const g = c.createLinearGradient(0, 0, 1550, 930);
  g.addColorStop(0, '#173e49');
  g.addColorStop(0.65, '#0e2e39');
  g.addColorStop(1, '#071f2a');
  rect(c, 0, 0, 1600, 900, g);
}
export function note(c, str, x, y, color = soft, size = 29) {
  text(c, str, x, y, size, color);
}
export function plate(c, x, y, w, h) {
  rect(c, x + 9, y + 12, w, h, '#081f27');
  rect(c, x, y, w, h, paper);
  line(c, x + 20, y + 19, x + w - 20, y + 19, '#afa487', 1);
}
export function screw(c, x, y) {
  circle(c, x, y, 6, '#899a94');
  line(c, x - 3, y + 2, x + 3, y - 2, ink, 1.5);
}
export function knob(c, x, y, name, col, r = 15) {
  circle(c, x, y, r, deep, col, 3);
  circle(c, x, y, r * 0.52, col);
  if (name) text(c, name, x, y - r - 20, 28, col, 'center');
}
export function gridPlot(c, x, y, w, h, step = 54) {
  pane(c, x, y, w, h);
  for (let i = x + step; i < x + w; i += step) line(c, i, y, i, y + h, '#254853', 1);
  for (let j = y + step; j < y + h; j += step) line(c, x, j, x + w, j, '#254853', 1);
}
export function dim(c, x1, x2, y, txt, color = gold) {
  line(c, x1, y, x2, y, color, 2);
  for (const x of [x1, x2]) line(c, x, y - 8, x, y + 8, color, 2);
  text(c, txt, (x1 + x2) / 2, y + 26, 25, color, 'center');
}
export function cue(clock, beat, phrase, duration = 0) {
  const i = clock.beat.beatIndex;
  return i < beat ? 0 : i > beat ? 1 : clock.reveal(phrase, duration);
}
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const fmt = (v, n = 2) => Number(v.toFixed(n)).toString().replace('-', '−');
export const pair = (v, n = 2) => '(' + v.map((x) => fmt(x, n)).join(', ') + ')';
export function summary(c, rows, x = 1040, y = 275, step = 105) {
  rows.forEach(([name, val, col = white], i) => {
    label(c, name, x, y + step * i);
    mono(c, val, x, y + step * i + 46, 36, col);
  });
}
export function chartBar(c, x, y, maxw, f, col) {
  rect(c, x, y, maxw, 12, grid);
  if (f > 0) rect(c, x, y, maxw * Math.min(1, f), 12, col);
}
