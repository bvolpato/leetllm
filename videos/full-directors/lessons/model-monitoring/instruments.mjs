export const C = {
  dark: '#163332',
  deep: '#102726',
  cream: '#fcf1d7',
  paper: '#f3e5c5',
  ink: '#233837',
  muted: '#526763',
  rule: '#b3b49a',
  mint: '#8dd6b5',
  sea: '#1b766e',
  gold: '#e8b565',
  brass: '#937032',
  red: '#ad4937',
  coral: '#ffad90',
  white: '#fffbef',
};
export function box(c, x, y, w, h, fill, r = 0) {
  c.fillStyle = fill;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function circle(c, x, y, r, fill, stroke, width = 2) {
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
export function line(c, points, color, width = 3, dash = []) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.setLineDash(dash);
  c.stroke();
  c.setLineDash([]);
}
export function txt(
  c,
  s,
  x,
  y,
  size = 42,
  col = C.ink,
  { align = 'left', family = 'Sans', weight = 400, max } = {},
) {
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = col;
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  if (max && c.measureText(String(s)).width > max) {
    const adjusted = Math.floor((size * max) / c.measureText(String(s)).width);
    c.font = weight + ' ' + adjusted + 'px "Lesson ' + family + '"';
  }
  c.fillText(String(s), x, y);
}
export const mono = (c, s, x, y, size, col, align = 'left') =>
  txt(c, s, x, y, size, col, { family: 'Mono', align });
export const serif = (c, s, x, y, size, col, align = 'left') =>
  txt(c, s, x, y, size, col, { family: 'Serif', align });
export function surface(c, dark = false) {
  const g = c.createLinearGradient(0, 0, 1650, 1080);
  g.addColorStop(0, dark ? '#244b45' : '#fff5dd');
  g.addColorStop(1, dark ? C.deep : '#e8d9b7');
  box(c, 0, 0, 1920, 1080, g);
}
export function paper(c, x, y, w, h, perforate = true) {
  box(c, x + 6, y + 10, w, h, '#112c2b55', 8);
  box(c, x, y, w, h, C.cream, 8);
  if (perforate) for (let px = x + 22; px < x + w - 8; px += 36) circle(c, px, y + 16, 5, C.dark);
}
export function heading(c, kicker, title, dark = false) {
  mono(c, kicker, 96, 69, 28, dark ? C.gold : C.sea);
  serif(c, title, 92, 160, 70, dark ? C.cream : C.ink);
}
export function item(c, label, value, x, y, { dark = false, size = 66 } = {}) {
  txt(c, label, x, y, 33, dark ? C.mint : C.muted);
  mono(c, value, x, y + 77, size, dark ? C.cream : C.ink);
}
export function screw(c, x, y) {
  circle(c, x, y, 11, C.brass, C.gold, 2);
  line(
    c,
    [
      [x - 5, y + 4],
      [x + 5, y - 4],
    ],
    C.deep,
    2,
  );
}
export function arrow(c, x, y, x2, y2, col, w = 5) {
  line(
    c,
    [
      [x, y],
      [x2, y2],
    ],
    col,
    w,
  );
  let a = Math.atan2(y2 - y, x2 - x);
  line(
    c,
    [
      [x2 - 16 * Math.cos(a - 0.48), y2 - 16 * Math.sin(a - 0.48)],
      [x2, y2],
      [x2 - 16 * Math.cos(a + 0.48), y2 - 16 * Math.sin(a + 0.48)],
    ],
    col,
    w,
  );
}
export function stamp(c, s, x, y, col = C.sea, size = 41) {
  c.font = '600 ' + size + 'px "Lesson Sans"';
  const w = c.measureText(s).width + 44;
  c.lineWidth = 4;
  c.strokeStyle = col;
  c.strokeRect(x, y - 39, w, 73);
  txt(c, s, x + 22, y, size, col, { weight: 600 });
}
export function beats(clock) {
  const beat = clock.beat.beatIndex + 1;
  function at(n, phrase, options) {
    if (beat !== n) return beat > n;
    if (!phrase) return true;
    if (phrase === 'END') return clock.elapsed >= clock.speechDuration;
    return clock.reveal(phrase, 0, options) === 1;
  }
  function motion(n, phrase, seconds) {
    if (beat !== n) return Number(beat > n);
    return clock.reveal(phrase, seconds);
  }
  return { beat, at, motion, clock };
}
export const pct = (v) => Math.round(100 * v) + '%';
export const fix = (v, d = 2) => v.toFixed(d);
export const sum = (a) => a.reduce((s, x) => s + x, 0);
