export const P = {
  paper: '#f7f3e8',
  ink: '#182f36',
  muted: '#48636a',
  line: '#a1aaa1',
  surface: '#fffcf2',
  empty: '#e0e3d8',
  k: '#176e69',
  kPale: '#bfe5d4',
  v: '#695288',
  vPale: '#ded3e8',
  gold: '#a65514',
  bright: '#efb64d',
  goldPale: '#fae3ad',
  bad: '#9c3545',
  badPale: '#f2cdd0',
  rail: '#294a50',
};
export const clamp = (v) => Math.max(0, Math.min(1, v));
export const bno = (c) => c.beat.beatIndex + 1;
export const cue = (c, b, s, d = 0.45) => (bno(c) > b ? 1 : bno(c) < b ? 0 : c.reveal(s, d));
export const on = (c, b, s) => cue(c, b, s, 0) === 1;
export function box(g, x, y, w, h, fill, stroke = null, lw = 2) {
  if (fill) {
    g.fillStyle = fill;
    g.fillRect(x, y, w, h);
  }
  if (stroke) {
    g.lineWidth = lw;
    g.strokeStyle = stroke;
    g.strokeRect(x, y, w, h);
  }
}
export function line(g, x, y, u, v, col = P.line, lw = 3) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(u, v);
  g.strokeStyle = col;
  g.lineWidth = lw;
  g.stroke();
}
export function txt(g, str, x, y, size = 38, opts = {}) {
  const { col = P.ink, f = 'Sans', align = 'left', weight = 500, max = 1760 } = opts;
  g.fillStyle = col;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.font = weight + ' ' + size + 'px "Lesson ' + f + '"';
  g.fillText(String(str), x, y, max);
}
export function cap(g, str, x, y, opt = {}) {
  txt(g, str, x, y, 28, { col: P.muted, weight: 600, ...opt });
}
export function mono(g, str, x, y, size = 38, opt = {}) {
  txt(g, str, x, y, size, { f: 'Mono', ...opt });
}
export function heading(g, topic, question) {
  box(g, 0, 0, 1920, 1080, P.paper);
  cap(g, topic, 86, 72, { col: P.k });
  txt(g, question, 82, 166, 74, { f: 'Serif', weight: 500, max: 1750 });
  line(g, 85, 239, 1835, 239, P.ink, 2);
}
export function footer(g, lead, body = '') {
  line(g, 85, 836, 1835, 836, P.line, 2);
  txt(g, lead, 86, 884, 42, { weight: 600, max: 1740 });
  if (body) txt(g, body, 88, 945, 31, { col: P.muted, max: 1740 });
}
export function hatch(g, x, y, w, h, col = '#a9b2a8') {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  for (let k = -h; k < w; k += 16) line(g, x + k, y + h, x + k + h, y, col, 2);
  g.restore();
}
export function chip(g, x, y, w, h, label, fill = P.kPale, opts = {}) {
  const col = opts.col || P.ink;
  box(g, x, y + 7, w, h, P.rail);
  box(g, x, y, w, h, fill, P.rail, 2);
  txt(g, label, x + w / 2, y + h / 2, opts.size || 38, {
    align: 'center',
    col,
    weight: 600,
    max: w - 14,
  });
}
export function arrow(g, x, y, u, v, col = P.gold, lw = 5) {
  line(g, x, y, u, v, col, lw);
  const a = Math.atan2(v - y, u - x);
  line(g, u, v, u - 18 * Math.cos(a - 0.5), v - 18 * Math.sin(a - 0.5), col, lw);
  line(g, u, v, u - 18 * Math.cos(a + 0.5), v - 18 * Math.sin(a + 0.5), col, lw);
}
export function slot(g, x, y, w, h, label, filled = true, active = false) {
  box(g, x, y, w, h, filled ? P.surface : P.empty, active ? P.gold : P.rail, active ? 5 : 2);
  if (!filled) hatch(g, x + 2, y + 2, w - 4, h - 4);
  else {
    box(g, x + 4, y + 4, (w - 8) / 2, 10, P.k);
    box(g, x + w / 2, y + 4, (w - 8) / 2, 10, P.v);
  }
  if (label !== null && label !== undefined)
    txt(g, label, x + w / 2, y + h / 2 + 5, Math.min(h * 0.45, 38), {
      align: 'center',
      weight: 600,
      max: w - 10,
    });
}
export function bar(g, x, y, w, h, fraction, color = P.k) {
  box(g, x, y, w, h, P.empty, P.line);
  box(g, x, y, w * clamp(fraction), h, color);
}
export function bays(g, x, y, w, h, n, filled, active = -1, labels = []) {
  const pitch = w / n;
  for (let i = 0; i < n; i++)
    slot(g, x + i * pitch, y, pitch - 5, h, labels[i], i < filled, i === active);
}
export function block(g, x, y, w, id, values, owner = '', focus = -1) {
  cap(g, 'BLOCK ' + id, x, y - 31, { col: P.ink });
  if (owner) cap(g, owner, x + w, y - 31, { align: 'right' });
  // The sockets stay in place while the board's owner or contents change.
  box(g, x - 12, y + 1, w + 23, 101, '#bbc2b4');
  for (let pin = 0; pin < 32; pin++) {
    const px = x + (pin * w) / 32 + 4;
    box(g, px, y + 86, Math.max(4, w / 32 - 10), 14, '#bb9458');
    line(g, px + 3, y + 89, px + 3, y + 99, '#eace9c', 2);
  }
  box(g, x - 7, y - 6, w + 12, 101, P.rail);
  bays(g, x, y, w, 81, 4, values.length, focus, values);
  for (let i = 0; i < 4; i++)
    mono(g, i, x + ((i + 0.5) * w) / 4, y + 119, 23, { align: 'center', col: P.muted });
}
export function metric(g, label, value, x, y, max = 580, col = P.ink) {
  cap(g, label, x, y);
  txt(g, value, x, y + 66, 62, { f: 'Mono', col, max });
}
