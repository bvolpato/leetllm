// The case, faceplate and colors are shared by the instruments in the serving room.
export const P = {
  paper: '#f5f0e5',
  light: '#fffcf4',
  ink: '#1b302e',
  sub: '#49615b',
  grid: '#bac6b9',
  quiet: '#dce3d7',
  run: '#086d65',
  pale: '#b9ded0',
  wait: '#9c641a',
  gold: '#f4cc76',
  fail: '#9c3e2b',
  blush: '#f1c3ad',
  case: '#253f3d',
  metal: '#526c64',
  white: '#ffffff',
};
export function label(c, str, x, y, size = 34, color = P.ink, opt = {}) {
  c.fillStyle = color;
  c.font = (opt.bold ? 700 : 400) + ' ' + size + 'px "Lesson ' + (opt.font || 'Sans') + '"';
  c.textAlign = opt.align || 'left';
  c.textBaseline = 'middle';
  c.fillText(String(str), x, y);
}
export function rect(c, x, y, w, h, fill, radius = 0, stroke = null, lw = 2) {
  if (w <= 0 || h <= 0) return;
  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(radius, h / 2, w / 2));
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = lw;
    c.stroke();
  }
}
export function line(c, x, y, ex, ey, color = P.grid, lw = 2, dash = []) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = lw;
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(ex, ey);
  c.stroke();
  c.restore();
}
export function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
export const mono = { font: 'Mono' };
export const center = { align: 'center' };
export function frame(c, scene, heading, meta) {
  c.fillStyle = P.paper;
  c.fillRect(0, 0, 1920, 1080);
  label(c, scene.toUpperCase(), 88, 80, 30, P.run, mono);
  label(c, meta, 1832, 80, 29, P.sub, { align: 'right', font: 'Mono' });
  line(c, 88, 121, 1832, 121, P.ink, 3);
  label(c, heading, 84, 212, 72, P.ink, { font: 'Serif' });
}
export function footer(c, message, color = P.ink) {
  line(c, 88, 879, 1832, 879, P.grid, 2);
  rect(c, 88, 909, 7, 53, color, 3);
  label(c, message, 120, 936, 39, color);
}
export function screw(c, x, y) {
  dot(c, x, y, 7, P.metal);
  line(c, x - 3, y + 3, x + 3, y - 3, P.light, 1.5);
}
export function faceplate(c, x, y, w, h) {
  rect(c, x, y, w, h, P.case, 18);
  for (const dx of [17, w - 17]) for (const dy of [17, h - 17]) screw(c, x + dx, y + dy);
}
export function ruler(c, x1, x2, y, lo, hi, ticks, fmt = String) {
  line(c, x1, y, x2, y, P.sub, 3);
  for (const v of ticks) {
    const x = x1 + ((x2 - x1) * (v - lo)) / (hi - lo);
    line(c, x, y, x, y + 13, P.sub, 3);
    label(c, fmt(v), x, y + 38, 28, P.sub, center);
  }
}
export function phase(clock, beatIndex, phrase, seconds = 0) {
  if (clock.beat.beatIndex !== beatIndex) return Number(clock.beat.beatIndex > beatIndex);
  return clock.reveal(phrase, seconds);
}
export const nice = (n) => n.toLocaleString('en-US');
