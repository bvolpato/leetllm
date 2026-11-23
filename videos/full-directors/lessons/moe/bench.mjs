export const C = {
  ink: '#242c2b',
  mid: '#52625e',
  light: '#f7f4e7',
  rule: '#b9b8a8',
  teal: '#116d66',
  rust: '#9c4825',
  plum: '#614765',
  red: '#9a3337',
  green: '#227058',
  board: '#273c39',
  board2: '#344b46',
  seam: '#506963',
  brass: '#f3bb69',
  ice: '#98ddd2',
  chalk: '#f1f1df',
  faint: '#b2c2b7',
};
export const ease = (t) => t * t * (3 - 2 * t);
export const mix = (a, b, t) => a + (b - a) * t;
export const fmt = (v, n = 3) => Number(v.toFixed(n)).toString();
export const vec = (v) => '[' + v.map((x) => fmt(x)).join(', ') + ']';
export const expert = (e) => 'E' + (e + 1);
export function cue(k, b, phrase, duration = 0.55) {
  if (k.beat.beatIndex !== b) return Number(k.beat.beatIndex > b);
  return k.reveal(phrase, duration);
}
export function type(
  c,
  str,
  x,
  y,
  size = 20,
  color = C.ink,
  align = 'left',
  family = 'Sans',
  weight = 500,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(String(str), x, y);
}
export function mono(c, str, x, y, size = 20, color = C.ink, align = 'left') {
  type(c, str, x, y, size, color, align, 'Mono');
}
export function rule(c, x, y, u, v, color = C.rule, width = 1) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
export function box(c, x, y, w, h, fill, stroke = null, r = 0) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1;
    c.stroke();
  }
}
export function dot(c, x, y, r, fill) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fillStyle = fill;
  c.fill();
}
export function arrow(c, x, y, u, v, color = C.teal, width = 3, head = 8) {
  const ang = Math.atan2(v - y, u - x);
  if (Math.hypot(u - x, v - y) < 1) return;
  rule(c, x, y, u, v, color, width);
  c.beginPath();
  c.moveTo(u, v);
  for (const a of [ang - 0.5, ang + 0.5]) c.lineTo(u - head * Math.cos(a), v - head * Math.sin(a));
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
export function path(c, points, color, width = 2, fraction = 1) {
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let remain = lengths.reduce((a, b) => a + b, 0) * fraction;
  c.beginPath();
  c.moveTo(...points[0]);
  let end = points[0];
  for (let i = 0; i < lengths.length && remain > 0; i++) {
    const a = points[i],
      b = points[i + 1],
      t = Math.min(1, remain / lengths[i]);
    end = [mix(a[0], b[0], t), mix(a[1], b[1], t)];
    c.lineTo(...end);
    remain -= lengths[i];
  }
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
  return end;
}
export function alpha(c, p, draw) {
  if (p <= 0) return;
  c.save();
  c.globalAlpha *= p;
  draw();
  c.restore();
}
export function board(c, x, y, w, h) {
  const g = c.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, C.board2);
  g.addColorStop(1, '#1e3431');
  box(c, x + 2, y + 4, w, h, '#45514d40', null, 12);
  box(c, x, y, w, h, g, C.seam, 12);
  for (const px of [x + 11, x + w - 11])
    for (const py of [y + 11, y + h - 11]) {
      dot(c, px, py, 3.1, '#9aab9c');
      rule(c, px - 1.5, py + 1, px + 1.5, py - 1, '#3f544e', 1);
    }
}
export function base(c, title) {
  c.scale(2, 2);
  const bg = c.createLinearGradient(0, 0, 960, 540);
  bg.addColorStop(0, '#e9e5d4');
  bg.addColorStop(0.55, '#f8f4e8');
  bg.addColorStop(1, '#eee9d7');
  c.fillStyle = bg;
  c.fillRect(0, 0, 960, 540);
  type(c, title, 39, 50, 34, C.ink, 'left', 'Serif', 500);
  rule(c, 40, 82, 920, 82, '#a9ab9b', 1.1);
}
export function foot(c, message, color = C.ink) {
  rule(c, 40, 445, 920, 445, C.rule);
  type(c, message, 42, 470, 19, color);
}
export function tag(c, str, x, y, w, fill = C.board, fg = C.chalk) {
  box(c, x, y, w, 32, fill, null, 5);
  mono(c, str, x + w / 2, y + 16, 17, fg, 'center');
}
// A socket shows an FFN as three ranks of connected units. Its weights
// remain on the board when the token trace moves to another socket.
export function chip(c, x, y, w, h, name, live = false) {
  const body = live ? '#526960' : '#354a45',
    pins = live ? C.brass : '#8c9b8e';
  for (let i = 1; i < 6; i++)
    for (const yy of [y - 4, y + h]) box(c, x + (w * i) / 6 - 2, yy, 4, 4, pins);
  box(c, x, y, w, h, body, live ? C.brass : '#839686', 5);
  const points = [0.22, 0.5, 0.78].map((rx, i) =>
    Array.from({ length: i === 1 ? 3 : 2 }, (_, j) => [
      x + w * rx,
      y + 12 + j * (i === 1 ? 6 : 10),
    ]),
  );
  for (const i of [0, 1])
    for (const a of points[i])
      for (const b of points[i + 1]) rule(c, ...a, ...b, live ? '#c1b991' : '#73877b', 0.8);
  for (const rank of points) for (const a of rank) dot(c, ...a, 2.2, live ? C.brass : C.faint);
  mono(c, name, x + w / 2, y + h - 12, 17, live ? C.brass : C.chalk, 'center');
}
export function gridPlot(c, x, y, unit, maxX, maxY) {
  for (let i = 0; i <= Math.floor(maxX * 2); i++) {
    const u = x + (unit * i) / 2;
    rule(c, u, y, u, y - maxY * unit, i === 0 ? C.mid : '#d6d6c6', i === 0 ? 1.7 : 0.8);
    if (i % 2 === 0) mono(c, i / 2, u, y + 16, 12, C.mid, 'center');
  }
  for (let i = 0; i <= Math.floor(maxY * 2); i++) {
    const v = y - (unit * i) / 2;
    rule(c, x, v, x + unit * maxX, v, i === 0 ? C.mid : '#d6d6c6', i === 0 ? 1.7 : 0.8);
    if (i > 0 && i % 2 === 0) mono(c, i / 2, x - 12, v, 12, C.mid, 'right');
  }
  mono(c, 'x', x + unit * maxX + 9, y + 1, 15, C.mid);
  mono(c, 'y', x, y - maxY * unit - 12, 15, C.mid, 'center');
}
