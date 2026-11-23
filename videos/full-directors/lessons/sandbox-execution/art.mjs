export const C = {
  wall: '#f0ede4',
  paper: '#fffcf2',
  ink: '#20323a',
  muted: '#52656a',
  line: '#b4c1bb',
  teal: '#09685c',
  pale: '#d8eee1',
  red: '#a4442f',
  blush: '#fae3d4',
  ochre: '#815516',
  gold: '#f0c471',
  navy: '#1e3441',
  white: '#fffced',
  blue: '#265e83',
};

export function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function path(c, pts, fill, stroke, width = 3) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  if (fill) {
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
export function line(c, x, y, xx, yy, color = C.line, w = 3) {
  path(
    c,
    [
      [x, y],
      [xx, yy],
    ],
    null,
    color,
    w,
  );
}
export function disk(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
export function label(c, value, x, y, size, opts = {}) {
  const { color = C.ink, face = 'Sans', weight = 500, align = 'left', max = Infinity } = opts;
  const str = String(value);
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  const measured = c.measureText(str).width;
  if (measured > max)
    c.font = weight + ' ' + Math.floor((size * max) / measured) + 'px "Lesson ' + face + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(str, x, y);
}
export function mono(c, v, x, y, size = 34, opts = {}) {
  label(c, v, x, y, size, { face: 'Mono', ...opts });
}
export function cap(c, v, x, y, opts = {}) {
  label(c, v, x, y, 25, { weight: 700, color: C.muted, ...opts });
}
export function panel(c, x, y, w, h, fill = C.paper, edge = C.line) {
  rect(c, x, y, w, h, edge);
  rect(c, x + 2, y + 2, w - 4, h - 4, fill);
}
export function page(c, x, y, w, h, color = C.paper) {
  const fold = 38;
  path(
    c,
    [
      [x + 7, y + 9],
      [x + w - fold, y + 9],
      [x + w + 7, y + fold],
      [x + w + 7, y + h + 9],
      [x + 7, y + h + 9],
    ],
    '#d7d9ce',
  );
  path(
    c,
    [
      [x, y],
      [x + w - fold, y],
      [x + w, y + fold],
      [x + w, y + h],
      [x, y + h],
    ],
    color,
    C.line,
    2,
  );
  path(
    c,
    [
      [x + w - fold, y],
      [x + w - fold, y + fold],
      [x + w, y + fold],
    ],
    '#dce1d5',
    C.line,
    2,
  );
}
export function frame(c, kicker, heading) {
  rect(c, 0, 0, 1920, 1080, C.wall);
  rect(c, 0, 0, 1920, 12, C.navy);
  cap(c, kicker.toUpperCase(), 75, 75, { color: C.teal });
  label(c, heading, 72, 178, 74, { face: 'Serif', max: 1780 });
  line(c, 75, 218, 1845, 218, C.ink, 3);
}
export function tag(c, v, x, y, w, tone = C.teal, bg = C.pale) {
  rect(c, x, y, w, 60, bg);
  rect(c, x, y, 7, 60, tone);
  label(c, v, x + 22, y + 42, 35, { color: tone, weight: 600, max: w - 38 });
}
export function result(c, v, detail, color = C.teal) {
  rect(c, 75, 828, 1770, 104, C.navy);
  rect(c, 75, 828, 10, 104, color === C.red ? '#ffa87e' : '#72d1ac');
  label(c, v, 106, 896, 47, { color: C.white, face: 'Serif', max: detail ? 1000 : 1680 });
  if (detail) mono(c, detail, 1810, 892, 31, { align: 'right', color: '#c5e5da', max: 665 });
}
export function arrow(c, x, y, xx, color = C.teal) {
  line(c, x, y, xx - 11, y, color, 5);
  path(
    c,
    [
      [xx - 16, y - 12],
      [xx + 1, y],
      [xx - 16, y + 12],
    ],
    color,
  );
}
export const clamp = (x) => Math.max(0, Math.min(1, x));
// Earlier beats retain the settled state. Only the current beat consults word timing.
export function cue(clock, beat, phrase, span = 0) {
  if (clock.beat.beatIndex !== beat) return Number(clock.beat.beatIndex > beat);
  return clock.reveal(phrase, span);
}

export function spokenProgress(clock, beat, phrase) {
  if (clock.beat.beatIndex !== beat) return Number(clock.beat.beatIndex > beat);
  const { start, end } = clock.wordCue(phrase);
  return clock.reveal(phrase, end - start, { captionStart: phrase });
}
