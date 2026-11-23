export const C = {
  ink: '#182f33',
  pine: '#164e4e',
  deep: '#123c40',
  teal: '#16796d',
  sea: '#b8d8c6',
  leaf: '#d7e9d8',
  brass: '#dda95c',
  copper: '#93512f',
  red: '#a44434',
  rose: '#f3c5ad',
  cream: '#fff6de',
  paper: '#fffaf0',
  muted: '#536767',
  rule: '#aab8a7',
  chalk: '#f0ead8',
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export function paint(c, x, y, w, h, fill, r = 0, stroke = null) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.lineWidth = 1;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
export function line(c, x, y, X, Y, color = C.rule, width = 1) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(X, Y);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
export function poly(c, pts, fill, stroke = null, width = 1) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.lineWidth = width;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
export function circle(c, x, y, r, fill, edge = null) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = 1.5;
    c.stroke();
  }
}
export function type(c, s, x, y, size = 18, opt = {}) {
  c.save();
  c.font = (opt.weight ?? 500) + ' ' + size + 'px "Lesson ' + (opt.family ?? 'Sans') + '"';
  c.fillStyle = opt.color ?? C.ink;
  c.textAlign = opt.align ?? 'left';
  c.textBaseline = 'alphabetic';
  c.fillText(String(s), x, y, opt.max ?? 2000);
  c.restore();
}
export const mono = (c, s, x, y, size = 16, opt = {}) =>
  type(c, s, x, y, size, { family: 'Mono', ...opt });
export const serif = (c, s, x, y, size = 25, opt = {}) =>
  type(c, s, x, y, size, { family: 'Serif', ...opt });
export function block(c, s, x, y, w, size = 21, leading = 27, opt = {}) {
  c.save();
  c.font = (opt.weight ?? 500) + ' ' + size + 'px "Lesson ' + (opt.family ?? 'Serif') + '"';
  let row = '';
  for (const word of s.split(' ')) {
    if (row && c.measureText(row + ' ' + word).width > w) {
      type(c, row, x, y, size, { family: 'Serif', ...opt });
      y += leading;
      row = '';
    }
    row += (row ? ' ' : '') + word;
  }
  if (row) type(c, row, x, y, size, { family: 'Serif', ...opt });
  c.restore();
  return y + leading;
}
export function screw(c, x, y, r = 3.2) {
  circle(c, x, y, r, '#c4bc9f', '#626d62');
  line(c, x - r * 0.55, y + r * 0.55, x + r * 0.55, y - r * 0.55, '#52625a', 1);
}
export function gradient(c, x, y, X, Y, colors) {
  const g = c.createLinearGradient(x, y, X, Y);
  colors.forEach((v, i) => g.addColorStop(i / (colors.length - 1), v));
  return g;
}
export function plate(c, x, y, w, h, opt = {}) {
  const fill = opt.dark
    ? gradient(c, x, y, x + w, y + h, ['#355f5c', C.deep, '#173d40'])
    : gradient(c, x, y, x + w, y + h, ['#fff9e6', '#e9e4cf']);
  paint(c, x + 2, y + 5, w, h, '#c6c6b4', 6);
  paint(c, x, y, w, h, fill, 6, opt.dark ? '#19383a' : '#9aa799');
  for (const dx of [9, w - 9]) for (const dy of [9, h - 9]) screw(c, x + dx, y + dy, 2.7);
}
export function paper(c, x, y, w, h, fill = C.paper) {
  paint(c, x + 3, y + 4, w, h, '#bfbaaa', 2);
  paint(c, x, y, w, h, fill, 2, '#c5b99f');
}
export function badge(c, s, x, y, w, mode = 'good', size = 15) {
  const colors = {
    good: [C.leaf, C.deep],
    bad: [C.rose, '#762e24'],
    pending: ['#f6dfab', '#69451a'],
    dark: [C.pine, C.paper],
  };
  const [fill, ink] = colors[mode];
  paint(c, x, y, w, 30, fill, 3);
  type(c, s, x + w / 2, y + 21, size, { align: 'center', weight: 700, color: ink, max: w - 10 });
}
export function header(c, title, right) {
  const bg = gradient(c, 0, 0, 900, 540, ['#f8f5e8', '#e8eddf', '#dddccc']);
  c.fillStyle = bg;
  c.fillRect(0, 0, 960, 540);
  paint(c, 0, 0, 960, 6, C.pine);
  c.save();
  c.font = '500 16px "Lesson Mono"';
  const titleWidth = 927 - 34 - Math.min(165, c.measureText(right).width) - 30;
  c.restore();
  serif(c, title, 34, 65, 39, { max: titleWidth });
  mono(c, right, 927, 59, 16, { align: 'right', color: C.muted, max: 165 });
  line(c, 34, 84, 926, 84, '#a6b4a6');
}
export function foot(c, s, color = C.deep) {
  line(c, 38, 451, 922, 451, '#a9b7a8');
  type(c, s, 40, 480, 20, { color, weight: 600, max: 880 });
}
export function key(c, x, y, scale = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const gold = gradient(c, 0, -33, 18, 34, ['#f9e6a8', '#cf9957', '#af793d']);
  const edge = '#765738';
  poly(
    c,
    [
      [-4, -8],
      [120, -8],
      [127, -1],
      [119, 6],
      [114, 6],
      [114, 14],
      [102, 14],
      [102, 7],
      [94, 7],
      [94, 17],
      [81, 17],
      [81, 7],
      [69, 7],
      [69, 12],
      [57, 12],
      [57, 8],
      [-4, 8],
    ],
    gold,
    edge,
    2,
  );
  circle(c, -13, 0, 31, gold, edge);
  circle(c, -20, -2, 11, C.deep, edge);
  line(c, 12, -4, 116, -4, '#fff0bc', 2);
  line(c, 9, 2, 96, 2, '#a27345', 1.5);
  c.restore();
}
export function keyCradle(c, x, y, w, h) {
  plate(c, x, y, w, h, { dark: true });
  const cx = x + w * 0.48;
  mono(c, 'PRODUCTION KEY', x + 20, y + 35, 14, { color: C.chalk });
  serif(c, 'A300', x + 20, y + 82, 41, { color: C.paper });
  const scale = Math.min((w - 55) / 178, (h - 100) / 100, 1.42),
    kx = cx - 37 * scale,
    ky = y + h * 0.55;
  for (const dx of [-17, 89]) {
    const px = kx + dx * scale;
    paint(c, px - 7, ky - 13, 14, 39, '#243c3c', 5);
  }
  key(c, kx, ky, scale);
  paint(c, x + 20, y + h - 51, w - 40, 31, '#1b3539', 3, '#668379');
  circle(c, x + 35, y + h - 36, 4.7, C.brass);
  type(c, 'Disabled', x + 49, y + h - 30, 17, { color: C.cream });
}
export function arrow(c, x, y, X, Y, color = C.teal) {
  line(c, x, y, X, Y, color, 2);
  const a = Math.atan2(Y - y, X - x);
  poly(
    c,
    [
      [X, Y],
      [X - 10 * Math.cos(a - 0.45), Y - 10 * Math.sin(a - 0.45)],
      [X - 10 * Math.cos(a + 0.45), Y - 10 * Math.sin(a + 0.45)],
    ],
    color,
  );
}
export function rail(c, labels, selected, x, y, w) {
  const gap = w / (labels.length - 1);
  line(c, x, y, x + w, y, '#b5baaa', 4);
  if (selected > 0) line(c, x, y, x + gap * selected, y, C.teal, 4);
  labels.forEach((s, i) => {
    circle(
      c,
      x + i * gap,
      y,
      9,
      i <= selected ? C.teal : '#eae9d6',
      i <= selected ? C.teal : C.rule,
    );
    type(c, s, x + i * gap, y + 32, 16, {
      align: 'center',
      color: i <= selected ? C.deep : C.muted,
      max: gap - 8,
    });
  });
}
