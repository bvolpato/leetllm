export const paper = '#f8f3e7';
export const ink = '#192f33';
export const muted = '#506664';
export const rule = '#bdc2b4';
export const green = '#146859';
export const mint = '#c3ddca';
export const red = '#ad4028';
export const peach = '#f1c4a4';
export const gold = '#deb765';
export const cream = '#fffdf4';
export const num = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });
export const mix = (a, b, t) => a + (b - a) * t;
export const clamp = (t) => Math.max(0, Math.min(1, t));

export function type(ctx, str, x, y, size = 40, color = ink, options = {}) {
  const { face = 'Sans', align = 'left', weight = 400 } = options;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(String(str), x, y);
}
export function mono(c, s, x, y, size = 39, color = ink, align = 'left') {
  type(c, s, x, y, size, color, { face: 'Mono', align });
}
export function small(c, s, x, y, color = muted, align = 'left') {
  type(c, s, x, y, 28, color, { weight: 600, align });
}
export function line(c, points, color = rule, width = 3) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineJoin = 'round';
  c.stroke();
}
export function rect(c, x, y, w, h, fill, r = 0, stroke = null) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 2;
    c.stroke();
  }
}
export function circle(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fillStyle = color;
  c.fill();
}
export function fade(c, t, fn) {
  if (t <= 0) return;
  c.save();
  c.globalAlpha *= t;
  fn();
  c.restore();
}
export function base(c, k, title, section) {
  c.fillStyle = paper;
  c.fillRect(0, 0, 1920, 1080);
  rect(c, 0, 0, 1920, 13, green);
  small(c, 'REPOSITORY ASSISTANT', 82, 75, green);
  small(c, section, 1838, 75, muted, 'right');
  type(c, title, 78, 166, 68, ink, { face: 'Serif' });
  line(
    c,
    [
      [82, 229],
      [1838, 229],
    ],
    rule,
    2,
  );
}
export function foot(c, text, tone = ink) {
  line(
    c,
    [
      [82, 833],
      [1838, 833],
    ],
    rule,
    2,
  );
  rect(c, 82, 867, 8, 68, tone, 2);
  type(c, text, 112, 900, 46, tone, { face: 'Serif' });
}
// A cue remains settled for the rest of the chapter, including prediction holds.
export function cue(k, beat, phrase, seconds = 0.5) {
  const i = k.beat.beatIndex;
  return i === beat ? k.reveal(phrase, seconds) : Number(i > beat);
}
export function sheet(c, x, y, w, h, fill = cream) {
  rect(c, x + 4, y + 7, w, h, '#d6d1c2', 7);
  rect(c, x, y, w, h, fill, 7, '#b8b7a7');
}
export function bracket(c, x1, x2, y, label, color = green) {
  line(
    c,
    [
      [x1, y - 11],
      [x1, y],
      [x2, y],
      [x2, y - 11],
    ],
    color,
    3,
  );
  type(c, label, (x1 + x2) / 2, y + 35, 34, color, { align: 'center', weight: 600 });
}
export function header(c, s, x, y) {
  small(c, s.toUpperCase(), x, y);
}
export function finger(c, x, y, scale = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.rotate(-0.19);
  c.fillStyle = '#c38964';
  c.strokeStyle = '#754e3d';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-15, 25);
  c.bezierCurveTo(-24, -15, 9, -28, 19, 0);
  c.lineTo(34, 56);
  c.bezierCurveTo(68, 36, 102, 58, 109, 82);
  c.lineTo(132, 133);
  c.lineTo(58, 165);
  c.bezierCurveTo(31, 149, 13, 130, -11, 108);
  c.bezierCurveTo(-34, 84, -17, 70, 7, 86);
  c.closePath();
  c.fill();
  c.stroke();
  rect(c, -13, -9, 25, 36, '#efc4a2', 10, '#a8745a');
  line(
    c,
    [
      [7, 53],
      [24, 49],
    ],
    '#9b684e',
    2,
  );
  c.restore();
}
