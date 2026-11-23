const C = {
  desk: '#192c31',
  ruled: '#273d41',
  chalk: '#f5ede0',
  soft: '#bdd1cb',
  paper: '#f2e8d1',
  paper2: '#e4d5b5',
  ink: '#24383b',
  faint: '#687777',
  rule: '#b4af98',
  brass: '#dcb873',
  thread: '#be482c',
  lightThread: '#ffab86',
  teal: '#21665e',
  mint: '#98ddd0',
  red: '#953c30',
};
export { C };
export function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function poly(c, points, fill, stroke, width = 1) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
export function line(c, x, y, X, Y, color, width = 1, dash = []) {
  c.save();
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(X, Y);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
  c.restore();
}
export function circle(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
export function type(
  c,
  msg,
  x,
  y,
  size = 18,
  color = C.ink,
  family = 'Sans',
  weight = 400,
  align = 'left',
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(String(msg), x, y);
}
export function mono(c, msg, x, y, size = 14, color = C.faint, align = 'left') {
  type(c, msg, x, y, size, color, 'Mono', 400, align);
}
export function title(c, s) {
  type(c, s, 38, 56, 32, C.chalk, 'Serif');
}
export function footer(c, s, color = C.soft) {
  line(c, 38, 435, 922, 435, C.ruled, 2);
  type(c, s, 40, 467, 21, color);
}
export function base(c) {
  c.scale(2, 2);
  const g = c.createLinearGradient(0, 0, 960, 540);
  g.addColorStop(0, '#293f43');
  g.addColorStop(1, '#132329');
  rect(c, 0, 0, 960, 540, g);
  for (let x = 0; x < 960; x += 24) line(c, x, 0, x, 540, '#ffffff06');
  for (let y = 0; y < 540; y += 24) line(c, 0, y, 960, y, '#ffffff06');
}
export function sheet(c, x, y, w, h, paper = C.paper) {
  rect(c, x + 5, y + 7, w, h, '#0c171a70');
  rect(c, x + 2, y + 3, w, h, C.paper2);
  const g = c.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, paper);
  g.addColorStop(0.9, paper);
  g.addColorStop(1, '#d1bfa1');
  rect(c, x, y, w, h, g);
}
export function book(c, x, y, w, h, label, folio) {
  rect(c, x - 7, y - 5, w + 12, h + 15, '#94583a');
  for (let i = 4; i >= 0; i--)
    rect(c, x + i * 0.9, y + i * 1.4, w, h, i % 2 ? '#bdae8f' : C.paper2);
  sheet(c, x, y, w, h);
  const gutter = c.createLinearGradient(x, y, x + 44, y);
  gutter.addColorStop(0, '#b4a48a');
  gutter.addColorStop(1, '#f2e8d100');
  rect(c, x, y, 44, h, gutter);
  for (const yy of [y + h * 0.26, y + h * 0.75]) {
    circle(c, x + 16, yy, 6, '#463e32');
    line(c, x - 13, yy - 3, x + 14, yy, '#b4bdb8', 5);
    line(c, x - 12, yy - 4, x + 13, yy - 1, '#f0ede0', 1);
  }
  mono(c, label, x + 36, y + 28, 13, C.faint);
  mono(c, folio, x + w - 17, y + 28, 13, C.faint, 'right');
  line(c, x + 35, y + 39, x + w - 18, y + 39, C.rule);
}
export function passage(c, x, y, w, h, source, subject, lines) {
  book(c, x, y, w, h, source, '');
  type(c, subject, x + 36, y + 80, 26, C.ink, 'Serif');
  for (let i = 0; i < lines.length; i++)
    type(c, lines[i], x + 36, y + 125 + i * 33, 23, C.ink, 'Serif');
}
export function band(c, x, y, w, label, fill = C.teal) {
  rect(c, x, y, w, 31, fill);
  type(c, label, x + 10, y + 22, 16, C.chalk, 'Sans', 600);
}
export function thread(c, from, to, color = C.lightThread) {
  const [x, y] = from,
    [X, Y] = to;
  c.beginPath();
  c.moveTo(x, y);
  c.bezierCurveTo(x + (X - x) * 0.47, y, X - (X - x) * 0.45, Y, X, Y);
  c.lineWidth = 2.6;
  c.strokeStyle = color;
  c.stroke();
  circle(c, x, y, 3.2, color);
  circle(c, X, Y, 3.2, color);
}
export function finger(c, x, y) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.14);
  // The wrist enters from the edge. The extended index stays at the marked line.
  const skin = c.createLinearGradient(0, -4, -55, 78);
  skin.addColorStop(0, '#e4b394');
  skin.addColorStop(0.55, '#c68d70');
  skin.addColorStop(1, '#a86f5b');
  c.beginPath();
  c.moveTo(-260, 60);
  c.lineTo(-177, 35);
  c.bezierCurveTo(-148, 23, -133, 9, -105, 8);
  c.bezierCurveTo(-80, 4, -59, 5, -39, 0);
  c.lineTo(-12, -4);
  c.bezierCurveTo(4, -7, 11, 0, 6, 6);
  c.bezierCurveTo(2, 12, -14, 14, -28, 18);
  c.lineTo(-68, 30);
  c.bezierCurveTo(-48, 28, -44, 39, -54, 49);
  c.bezierCurveTo(-48, 53, -53, 65, -67, 68);
  c.bezierCurveTo(-67, 78, -80, 84, -89, 82);
  c.bezierCurveTo(-105, 97, -133, 95, -150, 92);
  c.lineTo(-257, 116);
  c.closePath();
  c.fillStyle = skin;
  c.fill();
  c.lineWidth = 1.4;
  c.strokeStyle = '#805f54';
  c.stroke();
  c.beginPath();
  c.ellipse(-6, 1, 10, 4, -0.23, 0, Math.PI * 2);
  c.fillStyle = '#f0c9ad';
  c.fill();
  for (const [sx, sy, ex, ey] of [
    [-37, 5, -35, 12],
    [-40, 6, -39, 13],
    [-70, 31, -95, 38],
    [-54, 49, -78, 53],
    [-67, 68, -91, 69],
    [-105, 32, -128, 43],
  ])
    line(c, sx, sy, ex, ey, '#a47764', 1);
  poly(
    c,
    [
      [-262, 54],
      [-157, 24],
      [-140, 97],
      [-259, 129],
    ],
    '#385a60',
    '#728580',
  );
  line(c, -165, 28, -148, 98, '#bec0aa', 1.5, [3, 3]);
  c.restore();
}
export function ribbon(c, x, y, h = 46) {
  poly(
    c,
    [
      [x, y],
      [x + 14, y],
      [x + 14, y + h],
      [x + 7, y + h - 6],
      [x, y + h],
    ],
    C.thread,
  );
  line(c, x + 3, y, x + 3, y + h - 6, '#df9879', 0.8);
}
export function dayCard(c, x, y, w, date, month, answer = '', fill = C.paper) {
  sheet(c, x, y, w, 145, fill);
  rect(c, x, y, w, 28, C.teal);
  type(c, month, x + w / 2, y + 20, 15, C.chalk, 'Mono', 500, 'center');
  type(c, date, x + w / 2, y + 93, 63, C.ink, 'Serif', 400, 'center');
  if (answer) type(c, answer, x + w / 2, y + 127, 17, C.ink, 'Sans', 600, 'center');
  for (const xx of [x + 18, x + w - 18]) {
    circle(c, xx, y + 3, 3.3, '#253d40');
    line(c, xx, y - 5, xx, y + 3, C.brass, 2);
  }
}
export function table(
  c,
  { x = 48, y = 150, w = 864, h = 54, columns, headers, rows, colors = [] },
) {
  sheet(c, x, y, w, h * (rows.length + 1) + 12);
  headers.forEach((v, j) => mono(c, v, x + columns[j], y + h * 0.65, 14, C.faint));
  rows.forEach((row, i) => {
    const top = y + h * (i + 1);
    line(c, x + 15, top, x + w - 15, top, C.rule);
    row.forEach((v, j) =>
      type(c, v, x + columns[j], top + h * 0.66, 21, colors[i]?.[j] ?? C.ink, j ? 'Mono' : 'Serif'),
    );
  });
}
