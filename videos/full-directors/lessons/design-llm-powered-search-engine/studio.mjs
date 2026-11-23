export const C = {
  paper: '#f4f0e5',
  page: '#fffcf4',
  ink: '#172f2c',
  dim: '#516662',
  rule: '#abbbb0',
  pine: '#16483e',
  forest: '#103831',
  mint: '#bbdfb6',
  green: '#276a46',
  honey: '#f5c66b',
  lemon: '#ffe3a8',
  orange: '#a74626',
  blush: '#f2cec0',
  blue: '#355782',
  ice: '#dce6ed',
  white: '#fffaf0',
  night: '#152f32',
  grid: '#3a5654',
};
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export function cue(c, b, phrase, span = 0.6) {
  const i = c.beat.beatIndex;
  return i === b ? c.reveal(phrase, span) : Number(i > b);
}
export function afterCue(c, b, phrase) {
  const i = c.beat.beatIndex;
  if (i !== b) return i > b;
  const { start, end } = c.wordCue(phrase);
  return c.reveal(phrase, end - start, { captionStart: phrase }) === 1;
}
export function rect(g, x, y, w, h, fill, r = 0, stroke = null) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = 1;
    g.stroke();
  }
}
export function line(g, x, y, X, Y, color = C.rule, width = 1) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(X, Y);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}
export function text(
  g,
  s,
  x,
  y,
  size = 19,
  col = C.ink,
  face = 'Sans',
  weight = 400,
  align = 'left',
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillStyle = col;
  g.fillText(String(s), x, y);
}
export function mono(g, s, x, y, size = 13, col = C.dim, align = 'left') {
  text(g, s, x, y, size, col, 'Mono', 500, align);
}
export function serif(g, s, x, y, size = 28, col = C.ink, align = 'left') {
  text(g, s, x, y, size, col, 'Serif', 400, align);
}
export function para(g, s, x, y, width, size = 20, spacing = 28, col = C.ink, face = 'Serif') {
  g.font = '400 ' + size + 'px "Lesson ' + face + '"';
  const rows = [];
  let run = '';
  for (const word of s.split(' ')) {
    const next = run ? run + ' ' + word : word;
    if (run && g.measureText(next).width > width) {
      rows.push(run);
      run = word;
    } else run = next;
  }
  if (run) rows.push(run);
  rows.forEach((r, i) => text(g, r, x, y + i * spacing, size, col, face));
  return y + rows.length * spacing;
}
export function dot(g, x, y, r, fill, stroke = null) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = 2;
    g.stroke();
  }
}
export function tag(g, s, x, y, color = C.pine, bg = C.mint) {
  g.font = '500 13px "Lesson Mono"';
  const w = g.measureText(s).width + 20;
  rect(g, x, y - 17, w, 26, bg, 4);
  mono(g, s, x + 10, y + 1, 13, color);
  return w;
}
export function alpha(g, a, draw) {
  if (a <= 0) return;
  g.save();
  g.globalAlpha *= a;
  draw();
  g.restore();
}
export function paper(g, x, y, w, h, fill = C.page) {
  rect(g, x + 4, y + 6, w, h, '#23342b24', 4);
  rect(g, x, y, w, h, fill, 4);
}
export function frame(g, chapter, title, dark = false) {
  g.scale(2, 2);
  const grad = g.createLinearGradient(0, 0, 960, 540);
  grad.addColorStop(0, dark ? '#112d2d' : C.paper);
  grad.addColorStop(1, dark ? '#213c3b' : '#e9e5d6');
  g.fillStyle = grad;
  g.fillRect(0, 0, 960, 540);
  const ink = dark ? C.white : C.ink,
    dim = dark ? '#b1c7bb' : C.dim;
  mono(g, 'CodeAtlas   /   ' + chapter, 40, 30, 13, dim);
  line(g, 40, 42, 920, 42, dark ? C.grid : C.rule);
  serif(g, title, 40, 89, 36, ink);
}
export function footer(g, s, dark = false) {
  line(g, 40, 463, 920, 463, dark ? C.grid : C.rule);
  text(g, s, 40, 490, 18, dark ? C.white : C.ink, 'Sans', 500);
}
export function calendarNote(g, s) {
  text(g, s, 936, 30, 18, C.ink, 'Sans', 500, 'right');
}
export function calendar(g, x, y, dayCount, day, limit, showLimit = true) {
  const cw = 32,
    ch = 31;
  for (let n = 1; n <= dayCount; n++) {
    const cx = x + ((n - 1) % 10) * cw,
      cy = y + Math.floor((n - 1) / 10) * ch;
    const inside = showLimit && n <= limit;
    rect(g, cx, cy, cw - 2, ch - 2, inside ? (n <= 30 ? C.mint : C.honey) : '#e1e4d9', 2);
    mono(g, n, cx + 15, cy + 20, 13, C.ink, 'center');
    if (n === day) {
      g.save();
      g.translate(cx + 14, cy + 14);
      g.rotate(-0.12);
      g.beginPath();
      g.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
      g.strokeStyle = C.orange;
      g.lineWidth = 2.7;
      g.stroke();
      g.restore();
    }
  }
}
export function quoteLines(g, doc, startY, lines, selectedEnd, options = {}) {
  const { x = 472, size = 22, leading = 32, fill = C.lemon, visibleRows = lines.length } = options;
  if (lines.join(' ') !== doc.text) throw Error('Quote wrapping no longer matches ' + doc.key);
  let offset = 0;
  for (const [i, row] of lines.slice(0, visibleRows).entries()) {
    const y = startY + i * leading;
    g.font = '400 ' + size + 'px "Lesson Serif"';
    const count = clamp((selectedEnd - offset) / row.length) * row.length;
    if (count > 0) {
      const whole = Math.floor(count),
        lo = g.measureText(row.slice(0, whole)).width;
      const hi = g.measureText(row.slice(0, whole + 1)).width;
      const w = lerp(lo, hi, count - whole);
      rect(g, x - 2, y - size + 1, w + 3, size + 5, fill, 2);
    }
    serif(g, row, x, y, size);
    offset += row.length + 1;
  }
}
