// All drawing coordinates use the 960 by 540 composition. The host doubles the canvas.
export const ink = '#182f32',
  dim = '#465c5b',
  red = '#973e32',
  teal = '#126b64';
export const blue = '#35598a',
  gold = '#9a6325',
  paper = '#fff8e8',
  pale = '#d5cdb8';
export const colors = [blue, red, teal, gold];
export const clamp = (v) => Math.max(0, Math.min(1, v));
export const mix = (a, b, p) => a + (b - a) * clamp(p);
export const blend = (a, b, p) => a.map((v, i) => mix(v, b[i], p));
export const fmt = (v, d = 2) =>
  typeof v === 'number' ? Number(v.toFixed(d)).toString().replace('-', '−') : String(v);
export const vector = (row, d = 2) => '[' + row.map((v) => fmt(v, d)).join('   ') + ']';
export const pct = (v) => (v * 100).toFixed(1) + '%';

export function type(c, s, x, y, size = 20, color = ink, face = 'Sans', align = 'left', max = 900) {
  c.font = (face === 'Sans' ? '600 ' : '400 ') + size + 'px "Lesson ' + face + '"';
  c.textBaseline = 'middle';
  c.textAlign = align;
  c.fillStyle = color;
  c.fillText(String(s), x, y, max);
}
export function line(c, x, y, x2, y2, color = ink, width = 2) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
export function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
export function box(c, x, y, w, h, color, r = 0) {
  if (w <= 0 || h <= 0) return;
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function arrow(c, x, y, x2, y2, color = teal, width = 3) {
  line(c, x, y, x2, y2, color, width);
  const a = Math.atan2(y2 - y, x2 - x);
  if (Math.hypot(y2 - y, x2 - x) < 2) return;
  for (const side of [-1, 1])
    line(
      c,
      x2,
      y2,
      x2 - 10 * Math.cos(a + side * 0.45),
      y2 - 10 * Math.sin(a + side * 0.45),
      color,
      width,
    );
}
function gradient(c, x, y, x2, y2, stops) {
  const g = c.createLinearGradient(x, y, x2, y2);
  stops.forEach(([p, v]) => g.addColorStop(p, v));
  return g;
}
export function bench(c, title, register) {
  c.fillStyle = gradient(c, 0, 0, 930, 540, [
    [0, '#fffbef'],
    [0.5, '#f3ead8'],
    [1, '#e2d6bd'],
  ]);
  c.fillRect(0, 0, 960, 540);
  box(c, 0, 0, 960, 16, ink);
  // Fit the complete page above the two-line caption band without changing diagram proportions.
  const pageScale = 0.90;
  c.translate((960 * (1 - pageScale)) / 2, 0);
  c.scale(pageScale, pageScale);
  type(c, register, 45, 47, 15, teal, 'Mono');
  type(c, title, 42, 88, 39, ink, 'Serif', 'left', 875);
  line(c, 43, 120, 917, 120, '#b1a895', 1);
  // Fine engraved ticks on the edge of the composing bed.
  for (let i = 0; i <= 86; i++)
    line(c, 48 + i * 10, 121, 48 + i * 10, 121 + (i % 5 ? 3 : 6), '#b1a895', 1);
}
export function foot(c, s) {
  line(c, 43, 452, 917, 452, '#b1a895', 1);
  type(c, s, 47, 466, 20, dim, 'Sans', 'left', 867);
}
export function slug(c, x, y, w, h, word, active = false) {
  box(c, x + 3, y + 7, w, h, '#817b69', 3);
  box(
    c,
    x,
    y,
    w,
    h,
    gradient(
      c,
      x,
      y,
      x + w,
      y + h,
      active
        ? [
            [0, '#29766e'],
            [1, '#154e51'],
          ]
        : [
            [0, '#526269'],
            [1, '#273f42'],
          ],
    ),
    3,
  );
  line(c, x + 3, y + 3, x + w - 3, y + 3, active ? '#91b9a3' : '#a6b0a3', 1.5);
  line(c, x + 7, y + h - 7, x + w - 6, y + h - 7, '#9bb3a355', 1);
  type(c, word, x + w / 2, y + h * 0.49, Math.min(35, h * 0.55), paper, 'Serif', 'center', w - 12);
}
export function blank(c, x, y, w, h) {
  box(c, x, y, w, h, '#dbd2be', 3);
  line(c, x + 3, y + 2, x + w - 3, y + 2, '#877f70', 3);
  type(c, '?', x + w / 2, y + h / 2, 30, dim, 'Serif', 'center');
}
export function typeLine(
  c,
  words,
  { x = 56, y = 175, w = 845, h = 66, selected = -1, slot = false, lift = 0, columns } = {},
) {
  const n = words.length + (slot ? 1 : 0),
    step = w / (columns ?? n),
    bed = step * n;
  box(c, x - 8, y + h + 6, bed + 12, 12, '#77684f', 2);
  line(c, x - 5, y + h + 8, x + bed, y + h + 8, '#c9b78e', 2);
  box(c, x - 9, y + 5, 6, h + 11, '#8f8167', 2);
  box(c, x + bed - 3, y + 4, 8, h + 12, '#8f8167', 2);
  words.forEach((s, i) =>
    slug(c, x + i * step, y - (i === selected ? lift : 0), step - 10, h, s, i === selected),
  );
  if (slot) blank(c, x + words.length * step, y, step - 10, h);
  return (i) => x + step * (i + 0.5) - 5;
}
// Use the centers returned by the type line for quantities owned by individual tokens.
export function tokenValues(c, center, values, y, color, digits = 3) {
  const width = center(1) - center(0) - 10;
  values.forEach((value, i) => {
    const x = center(i) - width / 2;
    box(c, x, y + 2, width, 42, pale, 2);
    box(c, x, y, width, 42, paper, 2);
    box(c, x, y, width, 3, color);
    type(c, fmt(value, digits), center(i), y + 22, 22, ink, 'Mono', 'center', width - 8);
  });
}
export function row(
  c,
  name,
  vals,
  y,
  color = teal,
  { x = 47, w = 865, label = 220, h = 46, d = 2 } = {},
) {
  type(c, name, x, y + h / 2, 20, color, 'Sans', 'left', label - 13);
  const dx = (w - label) / vals.length;
  vals.forEach((v, i) => {
    const left = x + label + dx * i;
    box(c, left, y + 3, dx - 6, h, '#bdbaa8', 2);
    box(c, left, y, dx - 6, h, paper, 2);
    box(c, left, y, dx - 6, 3, color);
    type(
      c,
      fmt(v, d),
      left + (dx - 6) / 2,
      y + h * 0.55,
      Math.min(22, dx * 0.5),
      ink,
      'Mono',
      'center',
      dx - 12,
    );
  });
}
export function strip(c, x, y, w, h, shares, names, palette = colors) {
  let off = 0;
  shares.forEach((v, i) => {
    box(c, x + off, y, w * v, h, palette[i % palette.length]);
    if (names && w * v > 45)
      type(c, names[i], x + off + (w * v) / 2, y + h / 2, 18, paper, 'Sans', 'center', w * v - 8);
    off += v * w;
  });
}
export function grid(
  c,
  x,
  y,
  vals,
  { cw = 63, ch = 40, paint = () => paper, fg = () => ink, size = 18, format = fmt } = {},
) {
  vals.forEach((r, i) =>
    r.forEach((v, j) => {
      box(c, x + j * cw, y + i * ch, cw - 3, ch - 3, paint(v, i, j), 2);
      if (v !== '')
        type(
          c,
          format(v),
          x + (j + 0.5) * cw - 1,
          y + (i + 0.5) * ch - 1,
          size,
          fg(v, i, j),
          'Mono',
          'center',
          cw - 7,
        );
    }),
  );
}
// One brass shutter per key. A shut aperture leaves its value out of the read.
export function shutters(
  c,
  n,
  open,
  { x = 57, y = 235, w = 846, h = 90, words = [], weights, opening = 1 } = {},
) {
  const dx = w / n;
  box(c, x - 8, y - 8, w + 16, h + 16, '#716550', 4);
  box(c, x - 5, y - 5, w + 10, h + 10, '#cbb990', 4);
  for (let j = 0; j < n; j++) {
    const xx = x + j * dx,
      legal = j < open,
      closed = legal ? 1 - opening : 1;
    box(c, xx + 5, y, dx - 10, h, '#fff8df', 4);
    type(c, words[j] ?? 'key ' + j, xx + dx / 2, y + h * 0.35, 22, ink, 'Serif', 'center', dx - 15);
    if (weights)
      type(c, pct(weights[j]), xx + dx / 2, y + h * 0.72, 19, teal, 'Mono', 'center', dx - 15);
    if (closed > 0) {
      const height = h * closed;
      box(c, xx + 5, y, dx - 10, height, '#985146', 3);
      line(c, xx + 10, y + height - 3, xx + dx - 10, y + height - 3, '#6e372e', 2);
      if (closed > 0.9) type(c, 'closed', xx + dx / 2, y + h * 0.55, 19, paper, 'Sans', 'center');
    }
  }
}
export function cue(clock, beat, phrase, span = 0.8) {
  const i = clock.beat.beatIndex;
  return i < beat ? 0 : i > beat ? 1 : clock.reveal(phrase, span);
}
export function throughCue(clock, beat, phrase, { captionStart = false } = {}) {
  const i = clock.beat.beatIndex;
  if (i !== beat) return i > beat ? 1 : 0;
  const { start, end } = clock.wordCue(phrase);
  return clock.reveal(phrase, end - start, { captionStart });
}
export function afterCue(clock, beat, phrase, options) {
  return throughCue(clock, beat, phrase, options) === 1;
}
export function label(c, s, x, y, color = dim) {
  type(c, s, x, y, 16, color, 'Mono');
}
export function signedBars(
  c,
  vals,
  names,
  { x = 60, y = 305, w = 835, unit = 67, color = teal, d = 2 } = {},
) {
  const step = w / vals.length;
  line(c, x, y, x + w, y, dim, 1.3);
  vals.forEach((v, i) => {
    const cx = x + (i + 0.5) * step,
      end = y - v * unit;
    box(
      c,
      cx - step * 0.18,
      Math.min(y, end),
      step * 0.36,
      Math.max(1, Math.abs(end - y)),
      v < 0 ? red : color,
      2,
    );
    type(c, fmt(v, d), cx, end + (v >= 0 ? -15 : 16), 18, v < 0 ? red : color, 'Mono', 'center');
    type(c, names[i], cx, 436, 18, ink, 'Sans', 'center', step - 7);
  });
}
export function plot(c, { x, y, scale, minX, maxX, minY, maxY }) {
  const at = (a, b) => [x + a * scale, y - b * scale];
  line(c, ...at(minX, 0), ...at(maxX, 0), '#a99f8b', 1.4);
  line(c, ...at(0, minY), ...at(0, maxY), '#a99f8b', 1.4);
  return at;
}
