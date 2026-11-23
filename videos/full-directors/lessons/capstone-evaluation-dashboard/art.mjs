export const C = {
  night: '#142a31',
  deep: '#0b1b21',
  body: '#203c43',
  line: '#4b676b',
  pale: '#f4f0dd',
  ink: '#142d33',
  soft: '#aec6c3',
  teal: '#88dfbe',
  red: '#ffa387',
  amber: '#f5ce78',
  greenInk: '#13624e',
  redInk: '#913e2d',
  blue: '#adcbe7',
  paper: '#dce9dc',
  muted: '#526966',
};
export const mix = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);
export function cue(clock, beat, phrase, seconds = 0) {
  const index = clock.beat.beatIndex;
  return index < beat ? 0 : index > beat ? 1 : clock.reveal(phrase, seconds);
}
export function end(clock, beat) {
  return (
    clock.beat.beatIndex > beat ||
    (clock.beat.beatIndex === beat && clock.elapsed >= clock.speechDuration)
  );
}
export function rect(c, x, y, w, h, fill, stroke = null, r = 0, lw = 2) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.lineWidth = lw;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
export function path(c, points, fill, stroke = null, lw = 2) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  if (fill) {
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.lineWidth = lw;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
export function line(c, x1, y1, x2, y2, color = C.line, width = 2) {
  path(
    c,
    [
      [x1, y1],
      [x2, y2],
    ],
    null,
    color,
    width,
  );
}
export function dot(c, x, y, r, fill, stroke = null, lw = 2) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = lw;
    c.stroke();
  }
}
export function txt(
  c,
  string,
  x,
  y,
  size = 32,
  color = C.pale,
  family = 'Sans',
  weight = 500,
  align = 'left',
  max = Infinity,
) {
  const s = String(string);
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  const width = c.measureText(s).width;
  if (width > max) c.font = weight + ' ' + (size * max) / width + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(s, x, y);
}
export function label(c, s, x, y, color = C.soft, max = Infinity) {
  txt(c, s, x, y, 22, color, 'Mono', 500, 'left', max);
}
export function heading(c, small, big) {
  label(c, small, 65, 58, C.amber);
  txt(c, big, 62, 130, 57, C.pale, 'Serif', 400, 'left', 1470);
}
export function baseplate(c) {
  const g = c.createLinearGradient(0, 0, 1500, 930);
  g.addColorStop(0, '#234047');
  g.addColorStop(0.5, C.night);
  g.addColorStop(1, C.deep);
  c.fillStyle = g;
  c.fillRect(0, 0, 1600, 900);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (let x = 36; x < 1590; x += 24) line(c, x, 877, x, x % 120 === 36 ? 863 : 872, C.line, 1);
}
export function slide(c, x, y, w, h, fill = C.pale) {
  const cut = Math.min(24, h / 5);
  const points = [
    [x, y + cut],
    [x + cut, y],
    [x + w, y],
    [x + w, y + h - cut],
    [x + w - cut, y + h],
    [x, y + h],
  ];
  path(
    c,
    points.map(([a, b]) => [a + 3, b + 8]),
    '#071a20',
  );
  path(c, points, fill, '#9eafa3', 2);
  for (const [sx, sy] of [
    [x + 15, y + 26],
    [x + w - 15, y + h - 26],
  ])
    dot(c, sx, sy, 4, C.body);
}
export function mark(c, x, y, v, r = 19, dark = false) {
  const color = v ? (dark ? C.greenInk : C.teal) : dark ? C.redInk : C.red;
  dot(c, x, y, r, color);
  const inner = dark ? C.pale : C.ink;
  if (v)
    path(
      c,
      [
        [x - r * 0.5, y],
        [x - r * 0.12, y + r * 0.38],
        [x + r * 0.54, y - r * 0.39],
      ],
      null,
      inner,
      r * 0.19,
    );
  else {
    line(c, x - r * 0.36, y - r * 0.36, x + r * 0.36, y + r * 0.36, inner, r * 0.18);
    line(c, x - r * 0.36, y + r * 0.36, x + r * 0.36, y - r * 0.36, inner, r * 0.18);
  }
}
export function key(c, x, y, id, size = 52, fill = C.amber) {
  const r = size / 2;
  path(
    c,
    [
      [x - r, y - r * 0.56],
      [x - r * 0.56, y - r],
      [x + r, y - r],
      [x + r, y + r * 0.6],
      [x + r * 0.6, y + r],
      [x - r, y + r],
    ],
    fill,
  );
  txt(c, id, x, y + 1, size * 0.62, C.ink, 'Mono', 700, 'center');
}
export function docIcon(c, x, y, scale = 1, locked = true) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  path(
    c,
    [
      [4, 3],
      [88, 3],
      [111, 26],
      [111, 136],
      [4, 136],
    ],
    '#ebcf94',
    C.ink,
    4,
  );
  path(
    c,
    [
      [88, 3],
      [88, 26],
      [111, 26],
    ],
    '#a88c64',
    C.ink,
    3,
  );
  for (let i = 0; i < 3; i++) line(c, 22, 39 + i * 13, 78 - i * 9, 39 + i * 13, C.muted, 3);
  if (locked) {
    c.beginPath();
    c.arc(74, 95, 15, Math.PI, 0);
    c.lineTo(89, 105);
    c.strokeStyle = C.ink;
    c.lineWidth = 5;
    c.stroke();
    rect(c, 52, 98, 45, 32, C.ink, null, 6);
    dot(c, 74, 112, 4, C.amber);
  }
  c.restore();
}
export function wrapped(
  c,
  s,
  x,
  y,
  w,
  size,
  leading,
  color = C.ink,
  family = 'Serif',
  weight = 400,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  const lines = [];
  let lineText = '';
  for (const word of s.split(/\s+/)) {
    const next = lineText ? lineText + ' ' + word : word;
    if (lineText && c.measureText(next).width > w) {
      lines.push(lineText);
      lineText = word;
    } else lineText = next;
  }
  lines.push(lineText);
  lines.forEach((l, i) => txt(c, l, x, y + leading * i, size, color, family, weight));
  return lines.length;
}
export function stamp(c, x, y, word, color = C.amber, w = 470) {
  rect(c, x, y, w, 68, null, color, 5, 3);
  txt(c, word, x + w / 2, y + 35, 33, color, 'Mono', 600, 'center', w - 26);
}
