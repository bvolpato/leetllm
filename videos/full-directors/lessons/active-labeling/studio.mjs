// Drawing units are half-size pixels on the 1920 by 1080 course canvas.
export const C = {
  paper: '#f6f0df',
  white: '#fffaf0',
  ink: '#182e3d',
  muted: '#536571',
  line: '#b7b7a9',
  blue: '#265f9c',
  blueWash: '#dce9f2',
  green: '#14705d',
  greenWash: '#daebdc',
  red: '#a34331',
  redWash: '#f4ded0',
  honey: '#e6b75b',
  night: '#142d3c',
  fog: '#9ab3bd',
  mint: '#74d3ad',
  sky: '#81b4ed',
};
export function word(g, s, x, y, size = 18, color = C.ink, opts = {}) {
  g.font = (opts.weight || 400) + ' ' + size + 'px "Lesson ' + (opts.face || 'Sans') + '"';
  g.fillStyle = color;
  g.textAlign = opts.align || 'left';
  g.textBaseline = 'middle';
  g.fillText(String(s), x, y, opts.max || 1600);
}
export const mono = (g, s, x, y, size = 15, color = C.muted, align = 'left', max) =>
  word(g, s, x, y, size, color, { face: 'Mono', align, max });
export const title = (g, s, x = 44, y = 56, size = 36, color = C.ink) =>
  word(g, s, x, y, size, color, { face: 'Serif' });
export function line(g, x, y, X, Y, color = C.line, w = 1, dash = []) {
  g.save();
  g.setLineDash(dash);
  g.strokeStyle = color;
  g.lineWidth = w;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(X, Y);
  g.stroke();
  g.restore();
}
export function rect(g, x, y, w, h, fill, stroke, r = 0, sw = 1) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = sw;
    g.stroke();
  }
}
export function dot(g, x, y, r, fill, stroke, sw = 1) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = sw;
    g.stroke();
  }
}
export function arrow(g, x, y, X, Y, color = C.muted, w = 2) {
  line(g, x, y, X, Y, color, w);
  const a = Math.atan2(Y - y, X - x);
  for (const turn of [-0.48, 0.48])
    line(g, X, Y, X - 10 * Math.cos(a + turn), Y - 10 * Math.sin(a + turn), color, w);
}
export function field(g, night = false) {
  const grad = g.createLinearGradient(0, 0, 960, 540);
  grad.addColorStop(0, night ? '#152f40' : '#fbf6e9');
  grad.addColorStop(1, night ? '#102532' : '#ece4d0');
  g.fillStyle = grad;
  g.fillRect(0, 0, 960, 540);
}
export function heading(g, s, kicker, night = false) {
  mono(g, kicker, 44, 29, 12, night ? C.mint : C.green);
  title(g, s, 44, 67, 34, night ? C.white : C.ink);
}
export function ticket(g, x, y, w, h, fill = C.white, stroke = C.line) {
  g.save();
  g.translate(x, y);
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(w, 0);
  g.lineTo(w, h * 0.52 - 6);
  g.arc(w, h * 0.52, 6, -Math.PI / 2, Math.PI / 2, true);
  g.lineTo(w, h);
  g.lineTo(0, h);
  g.lineTo(0, h * 0.52 + 6);
  g.arc(0, h * 0.52, 6, Math.PI / 2, -Math.PI / 2, true);
  g.closePath();
  g.shadowColor = '#16262e20';
  g.shadowBlur = 5;
  g.shadowOffsetY = 3;
  g.fillStyle = fill;
  g.fill();
  g.shadowColor = 'transparent';
  g.strokeStyle = stroke;
  g.lineWidth = 1;
  g.stroke();
  g.restore();
}
export function band(g, label, x, y, w, ink = C.blue, tint = C.blueWash, h = 34) {
  rect(g, x, y, w, h, tint, null, 3);
  rect(g, x, y, 4, h, ink);
  word(g, label, x + 13, y + h / 2, 17, ink, { max: w - 23, weight: 600 });
}
export function stack(g, x, y, w, h, color = C.white) {
  rect(g, x + 9, y + 9, w, h, C.line, C.line, 5);
  rect(g, x + 5, y + 5, w, h, C.paper, C.line, 5);
  rect(g, x, y, w, h, color, C.line, 5);
}
export function ruled(g, x, y, w, rows, space) {
  for (let i = 0; i < rows; i++) line(g, x, y + i * space, x + w, y + i * space, C.line, 1);
}
// Every cue belongs to one chapter-local beat. It latches for subsequent beats.
export function shot(clock) {
  const b = clock.beat.beatIndex + 1;
  const cue = (n, phrase, span = 0) => (b > n ? 1 : b < n ? 0 : clock.reveal(phrase, span));
  const after = (n, phrase, transition = 0, captionStart = false) => {
    if (b !== n) return b > n ? 1 : 0;
    const { start, end } = clock.wordCue(phrase);
    return clock.reveal(phrase, end - start + transition, { captionStart }) === 1
      ? 1
      : transition && Math.max(0, (clock.elapsed - end) / transition);
  };
  return { b, cue, after, elapsed: clock.elapsed };
}
export const ease = (t) => {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
};
export const pct = (n) => Math.round(n * 100) + '%';
export const f = (n, d = 2) => n.toFixed(d);
