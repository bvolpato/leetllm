export const C = {
  ink: '#172f36',
  shadow: '#0a2328',
  teal: '#155b60',
  pine: '#164746',
  brass: '#dfb36b',
  cream: '#f8efd8',
  paper: '#fff8e6',
  pink: '#f5cbc1',
  mint: '#c4e4d0',
  red: '#ad473c',
  blue: '#25578c',
  muted: '#576b69',
  rule: '#aab1a2',
  white: '#fff7df',
  faint: '#73918b',
};
export const beat = (clock) => clock.beat.beatIndex + 1;
export function cue(clock, n, phrase, seconds = 0) {
  const current = beat(clock);
  if (current !== n) return current > n ? 1 : 0;
  if (phrase === '$') return Number(clock.elapsed >= clock.speechDuration);
  return clock.reveal(phrase, seconds);
}
export const ease = (t) => t * t * (3 - 2 * t);
export const lerp = (a, b, t) => a + (b - a) * t;
export function box(g, x, y, w, h, color, r = 0) {
  g.fillStyle = color;
  if (!r) return g.fillRect(x, y, w, h);
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}
export function line(g, x, y, xx, yy, color, width = 1) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(xx, yy);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}
export function dot(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fillStyle = color;
  g.fill();
}
export function text(
  g,
  s,
  x,
  y,
  size = 22,
  color = C.ink,
  family = 'Sans',
  weight = 400,
  align = 'left',
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  g.textAlign = align;
  g.fillStyle = color;
  g.fillText(String(s), x, y);
}
export const mono = (g, s, x, y, size = 18, color = C.muted, align = 'left') =>
  text(g, s, x, y, size, color, 'Mono', 400, align);
export const head = (g, s, x, y, size = 43, color = C.ink) =>
  text(g, s, x, y, size, color, 'Serif');
export function paper(g, x, y, w, h, fill = C.paper, perforated = false) {
  g.save();
  g.shadowColor = '#061f3044';
  g.shadowBlur = 12;
  g.shadowOffsetX = 3;
  g.shadowOffsetY = 7;
  box(g, x, y, w, h, fill, 2);
  g.restore();
  if (perforated) {
    g.save();
    g.setLineDash([4, 4]);
    line(g, x + 23, y + 2, x + 23, y + h - 2, '#8e988a', 1);
    g.restore();
    for (let dy = 18; dy < h - 5; dy += 31) dot(g, x + 11, y + dy, 3.6, C.pine);
  }
}
export function rule(g, x, y, w, color = C.ink) {
  line(g, x, y, x + w, y, color, 2.4);
  line(g, x, y + 5, x + w, y + 5, color, 0.8);
}
export function stamp(g, s, x, y, color = C.blue, size = 19) {
  g.save();
  g.translate(x, y);
  g.rotate(-0.026);
  g.font = '600 ' + size + 'px "Lesson Sans"';
  const w = g.measureText(s).width + 26;
  g.strokeStyle = color;
  g.lineWidth = 2;
  g.strokeRect(0, -size - 5, w, size + 15);
  text(g, s, 13, 0, size, color, 'Sans', 600);
  g.restore();
}
export function board(g, top = '#194d4e', bottom = '#0f3339') {
  const grad = g.createLinearGradient(0, 0, 960, 675);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  box(g, 0, 0, 1200, 675, grad);
  // Fine grooves catch the light on the lacquered counter.
  for (let y = 9; y < 675; y += 13) line(g, 0, y, 1200, y - 24, '#fff6db07', 0.7);
}
export function label(g, s, x, y, color = C.brass) {
  mono(g, s, x, y, 16, color);
}
export function arrow(g, x, y, xx, yy, color, width = 3) {
  line(g, x, y, xx, yy, color, width);
  const a = Math.atan2(yy - y, xx - x);
  for (const sign of [-1, 1])
    line(
      g,
      xx,
      yy,
      xx - 12 * Math.cos(a + sign * 0.55),
      yy - 12 * Math.sin(a + sign * 0.55),
      color,
      width,
    );
}
export function circleInk(g, x, y, rx, ry, progress = 1, color = C.red) {
  if (progress <= 0) return;
  g.beginPath();
  g.ellipse(x, y, rx, ry, -0.05, -Math.PI * 0.55, (-0.55 + 2 * progress) * Math.PI);
  g.strokeStyle = color;
  g.lineWidth = 3.3;
  g.stroke();
}
export function receipt(g, x, y, w, h, fill = C.cream) {
  g.save();
  g.shadowColor = '#08202242';
  g.shadowBlur = 10;
  g.shadowOffsetY = 5;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + w, y);
  g.lineTo(x + w, y + h);
  const teeth = Math.ceil(w / 13);
  for (let i = teeth - 1; i >= 0; i--) {
    g.lineTo(x + (w * (i + 0.5)) / teeth, y + h - 5);
    g.lineTo(x + (w * i) / teeth, y + h);
  }
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  g.restore();
}
export function portrait(g, x, y, name) {
  const maya = name === 'Maya';
  g.save();
  g.translate(x, y);
  dot(g, 0, 0, 30, maya ? '#f1cc92' : '#a8d6c8');
  g.beginPath();
  g.arc(0, 0, 30, 0, Math.PI * 2);
  g.clip();
  dot(g, -1, -7, maya ? 17 : 14, maya ? '#493538' : '#4b3b36');
  box(g, -12, -11, 24, 27, maya ? '#ab704d' : '#c98f6e', 9);
  box(g, -5, 11, 10, 12, maya ? '#ab704d' : '#c98f6e');
  g.beginPath();
  g.ellipse(0, 32, 24, 16, 0, 0, Math.PI * 2);
  g.fillStyle = maya ? C.blue : C.teal;
  g.fill();
  g.beginPath();
  g.moveTo(-15, -8);
  g.quadraticCurveTo(-3, -30, 13, -14);
  g.quadraticCurveTo(6, -5, -3, -10);
  g.lineTo(-12, -3);
  g.fillStyle = '#423332';
  g.fill();
  g.restore();
}
export function signature(g, name, x, y, progress = 1) {
  g.save();
  g.beginPath();
  g.rect(x - 5, y - 32, 140 * progress, 47);
  g.clip();
  g.translate(x, y);
  g.transform(1, 0, -0.22, 1, 0, 0);
  text(g, name, 0, 0, 34, C.blue, 'Serif');
  g.beginPath();
  g.moveTo(2, 6);
  g.bezierCurveTo(29, 3, 93, -7, 103, 0);
  g.strokeStyle = C.blue;
  g.lineWidth = 2.3;
  g.stroke();
  g.restore();
}
export const usd = (cents) => '$' + (cents / 100).toFixed(2);
