export const C = {
  wall: '#d8dfd6',
  paper: '#fff5d8',
  shade: '#b4c6b7',
  ink: '#172e32',
  navy: '#18323a',
  deep: '#10262d',
  grid: '#39535a',
  mist: '#a9c5c0',
  white: '#f6f1dd',
  brass: '#f1bc67',
  rust: '#ab5137',
  orange: '#ff9d70',
  mint: '#96e0bd',
  teal: '#227568',
  blue: '#89c8ec',
  indigo: '#46617b',
};
export const clamp = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
export function cue(clock, beat, phrase, seconds = 0.5) {
  if (clock.beat.beatIndex < beat) return 0;
  if (clock.beat.beatIndex > beat) return 1;
  return clock.reveal(phrase, seconds);
}
export function rect(g, x, y, w, h, fill, r = 0, stroke = null) {
  g.beginPath();
  if (r) g.roundRect(x, y, w, h, r);
  else g.rect(x, y, w, h);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = 1.5;
    g.stroke();
  }
}
export function line(g, points, color, width = 2, dash = []) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.setLineDash(dash);
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
  g.restore();
}
export function circle(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}
export function text(
  g,
  str,
  x,
  y,
  size = 24,
  color = C.ink,
  font = 'Sans',
  weight = 500,
  align = 'left',
  max = Infinity,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + font + '"';
  const width = g.measureText(String(str)).width;
  if (width > max)
    g.font = weight + ' ' + Math.floor((size * max) / width) + 'px "Lesson ' + font + '"';
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillText(String(str), x, y);
}
export function mono(g, s, x, y, size, col, align = 'left', max = Infinity) {
  text(g, s, x, y, size, col, 'Mono', 500, align, max);
}
export function cap(g, s, x, y, col = C.teal, size = 16) {
  text(g, s.toUpperCase(), x, y, size, col, 'Sans', 700);
}
export function background(g, dark = false) {
  const wash = g.createLinearGradient(0, 0, 1050, 750);
  wash.addColorStop(0, dark ? '#19353c' : '#eef0df');
  wash.addColorStop(1, dark ? '#10232b' : '#cad8ca');
  rect(g, 0, 0, 1200, 675, wash);
}
export function heading(g, kicker, title, dark = false) {
  cap(g, kicker, 56, 54, dark ? C.mint : C.teal, 17);
  text(g, title, 53, 116, 48, dark ? C.white : C.ink, 'Serif', 500, 'left', 1090);
}
export function screw(g, x, y) {
  circle(g, x, y, 5, '#627976');
  line(
    g,
    [
      [x - 2, y + 2],
      [x + 2, y - 2],
    ],
    C.deep,
    1.3,
  );
}
export function housing(g, x, y, w, h) {
  rect(g, x + 3, y + 7, w, h, '#00000021', 15);
  rect(g, x, y, w, h, C.navy, 15);
  rect(g, x + 7, y + 7, w - 14, h - 14, null, 11, '#4c6868');
  for (const a of [x + 18, x + w - 18]) for (const b of [y + 17, y + h - 17]) screw(g, a, b);
}
export function tape(g, x, y, w, h, fill = C.paper) {
  rect(g, x + 2, y + 4, w, h, '#071b221d', 2);
  rect(g, x, y, w, h, fill, 2);
  for (let j = 12; j < w - 5; j += 22) {
    circle(g, x + j, y + 7, 2.2, '#a8b2a0');
    circle(g, x + j, y + h - 7, 2.2, '#a8b2a0');
  }
}
export function chip(g, s, x, y, w, fill = C.paper, col = C.ink, h = 38) {
  rect(g, x, y, w, h, fill, 5);
  mono(g, s, x + w / 2, y + h * 0.69, Math.min(22, h * 0.51), col, 'center', w - 14);
}
export function result(g, label, value, x, y, col = C.ink, dark = false) {
  cap(g, label, x, y, dark ? C.mist : C.teal);
  text(g, value, x, y + 43, 36, col, 'Serif', 500, 'left', 1100 - x);
}
export function arrow(g, x1, y1, x2, y2, col, width = 3) {
  line(
    g,
    [
      [x1, y1],
      [x2, y2],
    ],
    col,
    width,
  );
  const a = Math.atan2(y2 - y1, x2 - x1);
  line(
    g,
    [
      [x2 - 13 * Math.cos(a - 0.55), y2 - 13 * Math.sin(a - 0.55)],
      [x2, y2],
      [x2 - 13 * Math.cos(a + 0.55), y2 - 13 * Math.sin(a + 0.55)],
    ],
    col,
    width,
  );
}
