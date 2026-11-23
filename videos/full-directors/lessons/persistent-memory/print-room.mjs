export const C = {
  bg: '#122a32',
  panel: '#1b3841',
  deep: '#0c2027',
  edge: '#57737a',
  dim: '#b8c9c6',
  white: '#faf4e5',
  paper: '#f4ead5',
  shade: '#d9cdb3',
  ink: '#1b3439',
  faint: '#566761',
  teal: '#83dfc6',
  green: '#245b4e',
  apricot: '#ffc38e',
  amber: '#834820',
  violet: '#cbbdf1',
  rose: '#ffae9e',
};
export function box(g, x, y, w, h, fill, r = 0, stroke) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = 2;
    g.stroke();
  }
}
export function line(g, x, y, X, Y, color = C.edge, width = 2, dashes = []) {
  g.save();
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(X, Y);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.setLineDash(dashes);
  g.stroke();
  g.restore();
}
export function txt(
  g,
  value,
  x,
  y,
  size = 36,
  color = C.white,
  { font = 'Sans', weight = 400, align = 'left', width } = {},
) {
  g.fillStyle = color;
  g.font = weight + ' ' + size + 'px "Lesson ' + font + '"';
  g.textAlign = align;
  if (width && g.measureText(value).width > width) {
    g.font =
      weight +
      ' ' +
      Math.floor((size * width) / g.measureText(value).width) +
      'px "Lesson ' +
      font +
      '"';
  }
  g.fillText(String(value), x, y);
}
export const mono = (g, v, x, y, size = 29, c = C.teal, opt = {}) =>
  txt(g, v, x, y, size, c, { font: 'Mono', ...opt });
export const serif = (g, v, x, y, size = 55, c = C.white, opt = {}) =>
  txt(g, v, x, y, size, c, { font: 'Serif', ...opt });
export function paper(g, x, y, w, h, fill = C.paper) {
  g.save();
  g.shadowBlur = 12;
  g.shadowColor = '#07181c77';
  g.shadowOffsetY = 5;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + w, y);
  g.lineTo(x + w, y + h);
  const n = Math.round(w / 20);
  for (let i = n - 1; i >= 0; i--) {
    g.lineTo(x + ((i + 0.5) * w) / n, y + h - 5);
    g.lineTo(x + (i * w) / n, y + h);
  }
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  g.restore();
}
export function overline(g, value, x, y, onPaper = false) {
  mono(g, value.toUpperCase(), x, y, 24, onPaper ? C.faint : C.dim);
}
export function stamp(g, value, x, y, color = C.green, w) {
  g.save();
  g.translate(x, y);
  g.rotate(-0.028);
  g.font = '700 27px "Lesson Sans"';
  const width = w ?? g.measureText(value).width + 34;
  box(g, 0, -36, width, 49, null, 4, color);
  txt(g, value, 16, 0, 27, color, { weight: 700, width: width - 31 });
  g.restore();
}
export function dot(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
}
export const lerp = (a, b, t) => a + (b - a) * t;
export function ramp(c, beat, phrase, duration = 0.65) {
  const i = c.beat.beatIndex;
  if (i !== beat) return i > beat ? 1 : 0;
  return c.reveal(phrase, duration);
}
export const on = (c, b, phrase) => ramp(c, b, phrase, 0) === 1;
export function head(g, section, title, kicker = 'BILLING   /   WEBHOOK') {
  g.fillStyle = C.bg;
  g.fillRect(0, 0, 1920, 1080);
  overline(g, section, 82, 75);
  mono(g, kicker, 1838, 75, 23, C.dim, { align: 'right' });
  serif(g, title, 78, 179, 76, C.white, { width: 1760 });
  line(g, 82, 215, 1838, 215, C.edge);
}
export function caption(g, text, sub) {
  line(g, 84, 858, 1836, 858, C.edge);
  txt(g, text, 85, 918, 42, C.white, { width: 1740 });
  if (sub) txt(g, sub, 86, 971, 31, C.dim, { width: 1740 });
}
export function printer(g, x, y, w) {
  box(g, x - 11, y - 17, w + 22, 42, '#102127', 11, '#516b71');
  box(g, x + 6, y - 5, w - 12, 14, '#060f12', 6);
}
export function invoice(g, x, y, letter, w = 68, h = 72) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + w - 13, y);
  g.lineTo(x + w, y + 13);
  g.lineTo(x + w, y + h);
  g.lineTo(x, y + h);
  g.closePath();
  g.fillStyle = C.white;
  g.fill();
  g.strokeStyle = C.faint;
  g.lineWidth = 2;
  g.stroke();
  line(g, x + w - 14, y + 1, x + w - 14, y + 14, C.faint);
  line(g, x + w - 14, y + 14, x + w - 1, y + 14, C.faint);
  mono(g, letter, x + w / 2, y + h * 0.7, h * 0.61, C.ink, { align: 'center', weight: 700 });
}
export function slip(g, e, x, y, w, h, selected = false) {
  paper(g, x, y, w, h, selected ? '#d6efe0' : C.paper);
  overline(g, 'Replay log', x + 24, y + 43, true);
  mono(g, '#' + e.id, x + w - 24, y + 45, 32, C.ink, { align: 'right', weight: 700 });
  line(g, x + 24, y + 64, x + w - 24, y + 64, '#9caa9c', 2, [7, 6]);
  ['First delivery', 'Repeat delivery'].forEach((t, i) => {
    const yy = y + 105 + i * (h > 210 ? 77 : 59);
    txt(g, t, x + 26, yy + 9, 29, C.ink);
    invoice(g, x + w - 85, yy - 29, e.invoices[i], 51, 48);
  });
}
