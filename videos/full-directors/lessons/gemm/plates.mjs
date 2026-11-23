export const paper = '#f4efdf',
  ink = '#232943',
  dim = '#585b69',
  rule = '#b8b7a8';
export const blue = '#344896',
  rose = '#aa394b',
  teal = '#176c64',
  gold = '#e8bc69';
export const softBlue = '#dee2ef',
  softRose = '#f3d9d2',
  softTeal = '#d6e7d9';
export const white = '#fffaf0';

export function text(
  c,
  value,
  x,
  y,
  size = 38,
  color = ink,
  align = 'left',
  face = 'Sans',
  weight = 400,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(String(value).replace(/-(?=\d)/g, '−'), x, y);
}
export function line(c, x, y, xx, yy, color = rule, width = 2) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
export function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function circle(c, x, y, radius, color) {
  c.beginPath();
  c.arc(x, y, radius, 0, 2 * Math.PI);
  c.fillStyle = color;
  c.fill();
}
export function fade(c, alpha, draw) {
  if (alpha <= 0) return;
  c.save();
  c.globalAlpha *= Math.min(1, alpha);
  draw();
  c.restore();
}
export function base(c, title, section) {
  const bg = c.createLinearGradient(0, 0, 1900, 1080);
  bg.addColorStop(0, '#faf7ed');
  bg.addColorStop(1, '#ece6d6');
  rect(c, 0, 0, 1920, 1080, bg);
  text(c, section, 94, 80, 29, dim);
  text(c, title, 89, 169, 66, ink, 'left', 'Serif');
  line(c, 92, 230, 1828, 230, ink, 2);
}
export function note(c, s, color = ink) {
  if (s) text(c, s, 95, 899, 39, color, 'left', 'Serif');
}
export function plate(c, x, y, w, h, color, dark = false) {
  c.save();
  c.shadowColor = '#38343126';
  c.shadowOffsetX = 3;
  c.shadowOffsetY = 7;
  c.shadowBlur = 10;
  rect(c, x, y, w, h, color);
  c.restore();
  for (let yy = y + 5; yy < y + h; yy += 9)
    line(c, x + 2, yy, x + w - 2, yy, dark ? '#ffffff09' : '#352f4710', 1);
}
export function matrix(
  c,
  data,
  x,
  y,
  w,
  h,
  { fill = white, tint = blue, select = () => false, size = 54, format, outlines = true } = {},
) {
  const rows = data.length,
    cols = data[0].length,
    cw = w / cols,
    rh = h / rows;
  data.forEach((row, i) =>
    row.forEach((v, j) => {
      const live = select(i, j);
      rect(
        c,
        x + j * cw,
        y + i * rh,
        cw - (outlines ? 2 : 0),
        rh - (outlines ? 2 : 0),
        live ? tint : fill,
      );
      if (v !== null)
        text(
          c,
          format ? format(v, i, j) : v,
          x + (j + 0.5) * cw,
          y + (i + 0.51) * rh,
          size,
          live ? white : ink,
          'center',
          'Serif',
        );
    }),
  );
  if (outlines) {
    line(c, x - 3, y, x - 3, y + h - 2, tint, 4);
    line(c, x + w, y, x + w, y + h - 2, tint, 4);
  }
}
export function mark(c, value, x, y, radius = 43, color = rose) {
  circle(c, x, y, radius, color);
  text(c, value, x, y, radius * 1.24, white, 'center', 'Serif');
}
export function cue(clock, beat, phrase, span = 0) {
  const i = clock.beat.beatIndex;
  return i === beat ? clock.reveal(phrase, span) : Number(i > beat);
}
export const smooth = (t) => t * t * (3 - 2 * t);
export const ix = (n) => Array.from({ length: n }, (_, i) => i);
