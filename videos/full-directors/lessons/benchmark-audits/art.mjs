export const C = {
  bg: '#f1eddf',
  paper: '#fffcf0',
  shade: '#dbd6c7',
  ink: '#102e34',
  fine: '#586e6a',
  line: '#a6b3a6',
  pass: '#116b59',
  fail: '#ae402f',
  gold: '#dcaa43',
  plum: '#69507b',
  cold: '#1c535b',
  pale: '#dae9dc',
  rose: '#f5dad0',
  steel: '#c0d4ce',
};

export function fill(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function path(c, points, fillColor, stroke, width = 2) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  if (fillColor) {
    c.closePath();
    c.fillStyle = fillColor;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
export function line(c, x, y, x2, y2, color = C.line, width = 3) {
  path(
    c,
    [
      [x, y],
      [x2, y2],
    ],
    null,
    color,
    width,
  );
}
export function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
export function letter(c, str, x, y, size = 40, color = C.ink, opts = {}) {
  c.save();
  c.fillStyle = color;
  c.textAlign = opts.align ?? 'left';
  c.textBaseline = 'middle';
  c.font = (opts.bold ? '700 ' : '400 ') + size + 'px "Lesson ' + (opts.face ?? 'Sans') + '"';
  c.fillText(String(str), x, y, opts.max ?? 1780);
  c.restore();
}
export function mono(c, str, x, y, size = 34, color = C.ink, opts = {}) {
  letter(c, str, x, y, size, color, { ...opts, face: 'Mono' });
}
export function powerFormula(c, expression, exponent, x, y, size, suffix = '') {
  c.save();
  mono(c, expression, x, y, size);
  c.font = '400 ' + size + 'px "Lesson Mono"';
  const exponentX = x + c.measureText(expression).width + 2;
  const exponentSize = Math.round(size * 0.7);
  mono(c, exponent, exponentX, y - size * 0.48, exponentSize);
  if (suffix) {
    c.font = '400 ' + exponentSize + 'px "Lesson Mono"';
    mono(c, suffix, exponentX + c.measureText(exponent).width + 12, y, size);
  }
  c.restore();
}
export function serif(c, str, x, y, size = 58, color = C.ink, opts = {}) {
  letter(c, str, x, y, size, color, { ...opts, face: 'Serif' });
}
export function label(c, str, x, y) {
  letter(c, str, x, y, 30, C.fine, { bold: true });
}
export function sheet(c, x, y, w, h, stock = C.paper) {
  const pts = [
    [x, y],
    [x + w - 22, y],
    [x + w, y + 22],
    [x + w, y + h],
    [x, y + h],
  ];
  path(
    c,
    pts.map(([a, b]) => [a + 4, b + 6]),
    C.shade,
  );
  path(c, pts, stock, C.line, 2);
}
export function slot(c, x, y, w, h = 56) {
  fill(c, x, y, w, h, C.shade);
  line(c, x, y, x + w, y, '#8c988f', 4);
}
export function mark(c, x, y, pass, size = 20, color = pass ? C.pass : C.fail) {
  if (pass)
    path(
      c,
      [
        [x - size * 0.7, y],
        [x - size * 0.18, y + size * 0.55],
        [x + size * 0.8, y - size * 0.65],
      ],
      null,
      color,
      Math.max(3, size * 0.24),
    );
  else {
    line(
      c,
      x - size * 0.55,
      y - size * 0.55,
      x + size * 0.55,
      y + size * 0.55,
      color,
      Math.max(3, size * 0.22),
    );
    line(
      c,
      x - size * 0.55,
      y + size * 0.55,
      x + size * 0.55,
      y - size * 0.55,
      color,
      Math.max(3, size * 0.22),
    );
  }
}
export function medallion(c, x, y, value, r = 30) {
  dot(c, x, y, r, value ? C.pale : C.rose);
  mark(c, x, y, value, r * 0.65);
}
export function arrow(c, x, y, x2, y2, color = C.cold) {
  const a = Math.atan2(y2 - y, x2 - x);
  line(c, x, y, x2, y2, color, 5);
  path(
    c,
    [
      [x2 - 18 * Math.cos(a - 0.45), y2 - 18 * Math.sin(a - 0.45)],
      [x2, y2],
      [x2 - 18 * Math.cos(a + 0.45), y2 - 18 * Math.sin(a + 0.45)],
    ],
    null,
    color,
    5,
  );
}
export const clamp = (t) => Math.max(0, Math.min(1, t));
export const mix = (a, b, t) => a + (b - a) * t;
export function cue(clock, b, phrase, duration = 0.65) {
  if (clock.beat.beatIndex !== b) return +(clock.beat.beatIndex > b);
  const t = clock.reveal(phrase, duration);
  return t * t * (3 - 2 * t);
}
export function base(c, room, title) {
  fill(c, 0, 0, 1920, 1080, C.bg);
  fill(c, 0, 0, 1920, 18, C.ink);
  letter(c, room, 90, 85, 30, C.cold, { bold: true });
  serif(c, title, 86, 166, 70, C.ink, { max: 1752 });
  line(c, 90, 235, 1830, 235, C.ink, 3);
}
export function note(c, words, x = 100, y = 900, color = C.cold) {
  letter(c, words, x, y, 39, color, { max: 1780 - x + 90 });
}
export function reading(c, x, y, heading, rows, w = 720) {
  label(c, heading, x, y);
  rows.forEach((row, i) => letter(c, row, x, y + 80 + i * 67, 47, C.ink, { max: w }));
}
export function ticks(c, x1, x2, y, min, max, step, format) {
  line(c, x1, y, x2, y, C.ink, 3);
  for (let n = min; n < max + step * 0.001; n += step) {
    const x = mix(x1, x2, (n - min) / (max - min));
    line(c, x, y - 10, x, y + 14, C.fine, 2);
    mono(c, format(n), x, y + 46, 27, C.fine, { align: 'center' });
  }
}
