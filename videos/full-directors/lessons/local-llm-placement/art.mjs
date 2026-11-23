// The board and its paper worksheets share the same inks and type hierarchy.
export const ink = '#172f35',
  paper = '#f3efdf',
  teal = '#157b79',
  copper = '#c77b4a';
export const blue = '#528ba7',
  mint = '#80c6ae',
  pale = '#cfdad2',
  fog = '#b2c4bc';
export const gold = '#edc171',
  red = '#ae4337',
  white = '#fff9e9',
  dark = '#103d40';
export const mono = 'Lesson Mono',
  serif = 'Lesson Serif',
  sans = 'Lesson Sans';

export function rect(g, x, y, w, h, fill, stroke, lw = 2, r = 0) {
  if (w <= 0 || h <= 0) return;
  g.beginPath();
  g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.lineWidth = lw;
    g.strokeStyle = stroke;
    g.stroke();
  }
}
export function line(g, points, col, width = 3, dash = []) {
  g.save();
  g.beginPath();
  g.moveTo(...points[0]);
  points.slice(1).forEach((p) => g.lineTo(...p));
  g.strokeStyle = col;
  g.lineWidth = width;
  g.setLineDash(dash);
  g.stroke();
  g.restore();
}
export function label(
  g,
  str,
  x,
  y,
  size = 36,
  color = ink,
  face = sans,
  weight = 500,
  align = 'left',
  max,
) {
  g.font = weight + ' ' + size + 'px "' + face + '"';
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  if (max) g.fillText(String(str), x, y, max);
  else g.fillText(String(str), x, y);
}
export function dot(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
}
export function plate(g, x, y, w, h, col = dark) {
  rect(g, x + 3, y + 8, w, h, '#132e3324', null, 0, 18);
  rect(g, x, y, w, h, col, '#326369', 3, 18);
  for (const xx of [x + 18, x + w - 18])
    for (const yy of [y + 18, y + h - 18]) {
      dot(g, xx, yy, 6, '#aac0ab');
      line(
        g,
        [
          [xx - 4, yy + 2],
          [xx + 4, yy - 2],
        ],
        '#44716d',
        1.7,
      );
    }
}
export function hatch(g, x, y, w, h, col, spacing = 13) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  for (let off = -h; off < w; off += spacing)
    line(
      g,
      [
        [x + off, y + h],
        [x + off + h, y],
      ],
      col,
      2,
    );
  g.restore();
}
export function header(g, section, title, sub, night = false) {
  const bg = night ? '#102f34' : paper,
    main = night ? white : ink,
    muted = night ? fog : '#456461';
  rect(g, 0, 0, 1920, 1080, bg);
  line(
    g,
    [
      [78, 78],
      [305, 78],
    ],
    night ? gold : teal,
    4,
  );
  label(g, section, 335, 77, 26, muted, mono, 600);
  label(g, title, 78, 162, 72, main, serif, 600, 'left', 1765);
  label(g, sub, 82, 238, 32, muted, sans, 500, 'left', 1760);
}
export function foot(g, str, night = false, tint) {
  const col = tint || (night ? gold : teal);
  line(
    g,
    [
      [82, 902],
      [1838, 902],
    ],
    night ? '#597472' : '#aebdb1',
    2,
  );
  rect(g, 82, 926, 8, 40, col);
  label(g, str, 111, 948, 38, night ? white : ink, sans, 600, 'left', 1725);
}
export function chip(g, x, y, w, h, name) {
  for (let i = 20; i < w - 12; i += 21) {
    rect(g, x + i, y - 8, 7, 10, gold);
    rect(g, x + i, y + h - 2, 7, 10, gold);
  }
  rect(g, x, y, w, h, '#152f39', '#8fa99c', 3, 8);
  rect(g, x + 9, y + 8, w - 18, h - 16, '#33555b', '#66817e', 2, 5);
  label(g, name, x + w / 2, y + h / 2, Math.min(37, h * 0.45), white, mono, 600, 'center', w - 25);
}
export function trace(g, x, y, w, h, col, n = 4) {
  for (let i = 0; i < n; i++)
    line(
      g,
      [
        [x, y + i * 8],
        [x + w * 0.3, y + i * 8],
        [x + w * 0.3 + h, y + h + i * 8],
        [x + w, y + h + i * 8],
      ],
      col,
      2,
    );
}
export function strip(g, x, y, w, h, parts, max, empty = '#d5dfd5') {
  rect(g, x, y, w, h, empty);
  let at = x;
  for (const [amount, color] of parts) {
    const width = (w * amount) / max;
    rect(g, at, y, width, h, color);
    if (width > 5)
      line(
        g,
        [
          [at, y],
          [at, y + h],
        ],
        empty,
        2,
      );
    at += width;
  }
  return at;
}
export function clamp(x) {
  return Math.max(0, Math.min(1, x));
}
export function cue(c, b, phrase, seconds = 0) {
  return c.beat.beatIndex === b ? c.reveal(phrase, seconds) : Number(c.beat.beatIndex > b);
}
