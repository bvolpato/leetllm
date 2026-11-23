// The counter, bound sheets and claim tickets use the same paper and thread colors.
export const paper = '#f6e9ca',
  ink = '#233831',
  faint = '#617269',
  gold = '#efbd72',
  chalk = '#fff1d6',
  mint = '#a8d7c0',
  coral = '#f6a58f',
  teal = '#246554',
  rust = '#91412f';
export const serif = 'Lesson Serif',
  sans = 'Lesson Sans',
  mono = 'Lesson Mono';
export const mix = (a, b, t) => a + (b - a) * t;
export function cue(k, beat, words, duration = 0.65, captionStart) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  const t = k.reveal(words, duration, { captionStart });
  return t * t * (3 - 2 * t);
}
export function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function line(c, x, y, u, v, color, w = 3) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
}
export function poly(c, pts, color) {
  c.beginPath();
  c.moveTo(...pts[0]);
  for (const p of pts.slice(1)) c.lineTo(...p);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
export function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fillStyle = color;
  c.fill();
}
export function arrow(c, x, y, u, v, col, w = 5) {
  line(c, x, y, u, v, col, w);
  const a = Math.atan2(v - y, u - x),
    size = 4 + w * 2;
  poly(
    c,
    [
      [u, v],
      [u - size * Math.cos(a - 0.46), v - size * Math.sin(a - 0.46)],
      [u - size * Math.cos(a + 0.46), v - size * Math.sin(a + 0.46)],
    ],
    col,
  );
}
export function txt(
  c,
  s,
  x,
  y,
  size = 40,
  color = chalk,
  family = sans,
  align = 'left',
  max = 1760,
  weight = 400,
) {
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "' + family + '"';
  c.fillText(String(s), x, y, max);
}
export function ground(c, style = 'felt') {
  const light = style === 'slate' ? '#2d414e' : style === 'wood' ? '#694f3e' : '#34554a';
  const dark = style === 'slate' ? '#101e29' : style === 'wood' ? '#352b25' : '#122b28';
  const g = c.createLinearGradient(0, 0, 1820, 1080);
  g.addColorStop(0, light);
  g.addColorStop(1, dark);
  rect(c, 0, 0, 1920, 1080, g);
  if (style === 'wood') {
    for (let y = 25; y < 1080; y += 85) {
      line(c, 0, y, 1920, y + 9, '#382c2677', 3);
      line(c, 0, y + 4, 1920, y + 12, '#ba97832b', 2);
    }
  } else {
    for (let x = -1080; x < 1920; x += 19) line(c, x, 1080, x + 1080, 0, '#ffffff05', 1);
  }
}
export function title(c, context, question) {
  txt(c, context, 100, 90, 28, gold, mono);
  txt(c, question, 97, 182, 68, chalk, serif, 'left', 1725);
}
export function sheet(c, x, y, w, h, fill = paper) {
  rect(c, x + 7, y + 10, w, h, '#10191466');
  rect(c, x, y, w, h, fill);
  rect(c, x, y + h - 5, w, 4, '#b8a682');
}
export function ticket(c, x, y, w, h, fill = paper) {
  const shape = [
    [x + 22, y],
    [x + w - 16, y],
    [x + w, y + 16],
    [x + w, y + h - 16],
    [x + w - 16, y + h],
    [x + 22, y + h],
    [x, y + h - 22],
    [x, y + 22],
  ];
  poly(
    c,
    shape.map(([a, b]) => [a + 4, b + 7]),
    '#0b1a1466',
  );
  poly(c, shape, fill);
  dot(c, x + 22, y + h / 2, 7, '#99886a');
  dot(c, x + 22, y + h / 2, 4, '#283a30');
}
export function strip(c, x, y, w, id, words, fill = paper) {
  ticket(c, x, y, w, 66, fill);
  txt(c, id, x + 48, y + 45, 32, teal, mono, 'left', Math.min(w * 0.31, 215), 600);
  txt(
    c,
    words,
    x + Math.min(w * 0.34, 258),
    y + 45,
    34,
    ink,
    sans,
    'left',
    w - Math.min(w * 0.34, 258) - 20,
  );
}
export function heading(c, s, x, y, w = 1600, color = mint) {
  txt(c, s, x, y, 32, color, mono, 'left', w);
}
export function stitch(c, x, y, u, v, color = gold) {
  c.save();
  c.setLineDash([12, 8]);
  line(c, x, y, u, v, color, 3);
  c.restore();
}
export function book(c, x, y, w, h, name, edition) {
  rect(c, x - 10, y - 6, w + 16, h + 21, '#814e3b');
  sheet(c, x, y, w, h);
  for (let i = 0; i < 3; i++)
    line(c, x + 6, y + h - 2 + i * 3, x + w - 7, y + h - 2 + i * 3, '#b7a485', 1.3);
  rect(c, x + 18, y, 5, h, '#ad8e65');
  rect(c, x + 25, y, 2, h, '#e0c694');
  txt(c, edition, x + 50, y + 55, 27, faint, mono, 'left', w - 85);
  txt(c, name, x + 48, y + 130, 57, ink, serif, 'left', w - 80);
  line(c, x + 46, y + 158, x + w - 40, y + 158, '#a6997a', 2);
}
export function stamp(c, words, x, y, color = teal, w = 340) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.026);
  c.lineWidth = 3;
  c.strokeStyle = color;
  c.strokeRect(0, 0, w, 53);
  txt(c, words, w / 2, 38, 29, color, mono, 'center', w - 20, 600);
  c.restore();
}
export function finger(c, x, y, scale = 0.8) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.beginPath();
  c.moveTo(-14, 64);
  c.lineTo(-12, 15);
  c.bezierCurveTo(-10, -5, 9, -6, 14, 12);
  c.lineTo(21, 74);
  c.bezierCurveTo(29, 56, 43, 57, 47, 72);
  c.bezierCurveTo(60, 60, 73, 70, 76, 83);
  c.bezierCurveTo(94, 75, 105, 91, 105, 108);
  c.bezierCurveTo(106, 135, 90, 161, 74, 177);
  c.lineTo(-10, 177);
  c.bezierCurveTo(-23, 135, -52, 124, -60, 99);
  c.bezierCurveTo(-67, 77, -50, 74, -39, 83);
  c.lineTo(-15, 105);
  c.closePath();
  c.fillStyle = '#dcab82';
  c.fill();
  c.strokeStyle = '#614735';
  c.lineWidth = 3;
  c.stroke();
  rect(c, -18, 162, 105, 35, '#bdc7b4');
  line(c, 0, 49, 9, 49, '#ae795d', 2);
  c.restore();
}
export function ledger(
  c,
  x,
  y,
  widths,
  headers,
  rows,
  { rowH = 75, font = 32, highlights = [], caption = '' } = {},
) {
  const w = widths.reduce((a, b) => a + b, 0),
    top = caption ? 85 : 0;
  sheet(c, x, y, w, top + 80 + rows.length * rowH + 20);
  if (caption) txt(c, caption, x + 32, y + 58, 43, ink, serif, 'left', w - 60);
  let left = x;
  for (let j = 0; j < headers.length; j++) {
    txt(c, headers[j], left + 24, y + top + 49, 26, faint, mono, 'left', widths[j] - 36);
    left += widths[j];
  }
  line(c, x + 20, y + top + 68, x + w - 20, y + top + 68, '#958668', 2);
  rows.forEach((row, i) => {
    const yy = y + top + 73 + i * rowH;
    if (highlights[i]) rect(c, x + 12, yy, w - 24, rowH - 2, highlights[i]);
    let xx = x;
    row.forEach((val, j) => {
      txt(
        c,
        val,
        xx + 24,
        yy + rowH * 0.67,
        font,
        ink,
        j === 0 ? mono : sans,
        'left',
        widths[j] - 34,
      );
      xx += widths[j];
    });
    line(c, x + 20, yy + rowH - 1, x + w - 20, yy + rowH - 1, '#ae9f824c', 2);
  });
}
