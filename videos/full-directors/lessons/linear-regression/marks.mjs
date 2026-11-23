export const C = {
  paper: '#f4efdf',
  ink: '#152f32',
  subtle: '#4c6463',
  rule: '#bac3b5',
  case: '#29484a',
  dark: '#102d31',
  glass: '#13383b',
  grid: '#365558',
  soft: '#adc5bd',
  white: '#f8f2dd',
  gold: '#ffd276',
  cyan: '#81e2e8',
  lilac: '#e2b3ff',
  green: '#a7e6ac',
  rose: '#ffada0',
  ochre: '#91551b',
  teal: '#16727a',
  plum: '#704281',
};
export const mix = (a, b, t) => a + (b - a) * t;
export const fmt = (v, p = 1) => Number(v.toFixed(p)).toString().replace('-', '−');
export const signed = (v, p = 1) => (v > 0 ? '+' : '') + fmt(v, p);
export function text(
  g,
  str,
  x,
  y,
  size = 36,
  color = C.ink,
  align = 'left',
  family = 'Lesson Sans',
  weight = 400,
) {
  g.fillStyle = color;
  g.font = `${weight} ${size}px "${family}", "Lesson Symbols", "Lesson Math"`;
  g.textBaseline = 'middle';
  g.textAlign = align;
  g.fillText(String(str), x, y);
}
export const mono = (g, str, x, y, s = 32, color = C.ink, align = 'left') =>
  text(g, str, x, y, s, color, align, 'Lesson Mono');
export const serif = (g, str, x, y, s = 52, color = C.ink, align = 'left') =>
  text(g, str, x, y, s, color, align, 'Lesson Serif');
export function line(g, x1, y1, x2, y2, color, width = 3, dash = []) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.setLineDash(dash);
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
  g.restore();
}
export function poly(g, points, color, width = 4) {
  if (!points.length) return;
  g.save();
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.lineWidth = width;
  g.strokeStyle = color;
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
  g.restore();
}
export function dot(g, x, y, r, fill, edge = null, lw = 3) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (edge) {
    g.strokeStyle = edge;
    g.lineWidth = lw;
    g.stroke();
  }
}
export function rect(g, x, y, w, h, fill, r = 0) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
}
export function screen(g, x, y, w, h) {
  rect(g, x, y + 6, w, h, '#c5c5b5', 26);
  rect(g, x, y, w, h, C.case, 26);
  rect(g, x + 11, y + 11, w - 22, h - 22, C.dark, 18);
  for (const xx of [x + 20, x + w - 20])
    for (const yy of [y + 20, y + h - 20]) {
      dot(g, xx, yy, 5, '#66827e');
      line(g, xx - 2, yy + 2, xx + 2, yy - 2, C.dark, 1.5);
    }
}
export function frame(g, title, subject) {
  rect(g, 0, 0, 1920, 1080, C.paper);
  mono(g, subject.toUpperCase(), 84, 69, 27, C.subtle);
  line(g, 82, 103, 1836, 103, C.rule, 2);
  serif(g, title, 80, 172, 66);
}
export function pulse(g, x, y, color = C.gold, k = 1) {
  const pts = [
    [-28, 0],
    [-11, 0],
    [-6, 5],
    [0, -30],
    [6, 8],
    [12, 0],
    [28, 0],
  ];
  poly(
    g,
    pts.map(([a, b]) => [x + a * k, y + b * k]),
    color,
    4 * k,
  );
}
export function scale(a, b, c, d) {
  return (v) => c + ((v - a) * (d - c)) / (b - a);
}
export function axisPlot(
  g,
  {
    left = 210,
    right = 1100,
    top = 330,
    bottom = 785,
    xd = [0, 6],
    yd = [0, 250],
    xt = [0, 1, 2, 3, 4, 5, 6],
    yt = [0, 50, 100, 150, 200, 250],
    xName = 'Context  (100 tokens)',
    xNameOffset = 70,
    xTickOffset = 29,
    yName = 'Reply time  (ms)',
  } = {},
) {
  const X = scale(...xd, left, right),
    Y = scale(...yd, bottom, top);
  for (const v of xt) {
    line(g, X(v), top, X(v), bottom, C.grid, 1.5);
    mono(g, fmt(v), X(v), bottom + xTickOffset, 25, C.soft, 'center');
  }
  for (const v of yt) {
    line(g, left, Y(v), right, Y(v), C.grid, 1.5);
    mono(g, fmt(v), left - 16, Y(v), 25, C.soft, 'right');
  }
  line(g, left, top, left, bottom, C.soft, 2);
  line(g, left, bottom, right, bottom, C.soft, 2);
  text(g, yName, left, top - 36, 29, C.white);
  text(g, xName, (left + right) / 2, bottom + xNameOffset, 29, C.white, 'center');
  return { X, Y, left, right, top, bottom, xd, yd };
}
export function trace(g, plot, fn, color = C.cyan, width = 6, lo = plot.xd[0], hi = plot.xd[1]) {
  g.save();
  g.beginPath();
  g.rect(plot.left - 3, plot.top - 3, plot.right - plot.left + 6, plot.bottom - plot.top + 6);
  g.clip();
  poly(
    g,
    Array.from({ length: 81 }, (_, i) => {
      const x = mix(lo, hi, i / 80);
      return [plot.X(x), plot.Y(fn(x))];
    }),
    color,
    width,
  );
  g.restore();
}
export function square(g, x, y, side, unit, color = C.gold, edge = C.ochre) {
  if (side < 0.02) return;
  const w = side * unit;
  rect(g, x - w / 2, y - w, w, w, color, 1);
  for (let n = 1; n < side - 1e-4; n++) {
    line(g, x - w / 2 + n * unit, y - w, x - w / 2 + n * unit, y, edge, 1.6);
    line(g, x - w / 2, y - n * unit, x + w / 2, y - n * unit, edge, 1.6);
  }
}
export function readout(g, label, value, x, y, color = C.teal, size = 55) {
  text(g, label, x, y, 31, C.subtle);
  mono(g, value, x, y + 64, size, color);
}
export const cue = (c, phrase, span = 0.65) => c.reveal(phrase, span);
