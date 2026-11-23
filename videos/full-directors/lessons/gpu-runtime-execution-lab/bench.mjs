// A trace probe, a ceramic memory package and a copper contact share one scale.
export const colors = {
  paper: '#f6eedc',
  muted: '#a9bdba',
  ink: '#152d32',
  dark: '#142b30',
  grid: '#385657',
  teal: '#93e5cf',
  gold: '#ffd084',
  coral: '#ffab8b',
  lilac: '#c6bbff',
  blue: '#a2d7ff',
};
export const { paper, muted, ink, dark, grid, teal, gold, coral, lilac, blue } = colors;
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export function rect(c, x, y, w, h, color, r = 0) {
  c.fillStyle = color;
  if (r) {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fill();
  } else c.fillRect(x, y, w, h);
}
export function line(c, points, color, width = 3) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.stroke();
}
export function poly(c, points, color) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
export function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
export function txt(
  c,
  s,
  x,
  y,
  size = 40,
  color = paper,
  align = 'left',
  family = 'Sans',
  weight = 500,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(String(s), x, y);
}
export function mono(c, s, x, y, size = 42, color = paper, align = 'center') {
  txt(c, s, x, y, size, color, align, 'Mono', 500);
}
export function opacity(c, alpha, draw) {
  if (alpha <= 0) return;
  c.save();
  c.globalAlpha *= alpha;
  draw();
  c.restore();
}
export function screw(c, x, y) {
  dot(c, x, y, 8, '#0c1d20');
  dot(c, x - 1, y - 1, 6, '#77918e');
  line(
    c,
    [
      [x - 3, y + 2],
      [x + 3, y - 3],
    ],
    '#263e43',
    2,
  );
}
export function bench(c, material, title, legend) {
  const tones = {
    scope: ['#244442', '#0c1d25'],
    memory: ['#3f454e', '#172631'],
    plot: ['#243d55', '#101f33'],
    queue: ['#59433c', '#231f26'],
  };
  const [a, b] = tones[material];
  const g = c.createLinearGradient(0, 0, 1250, 1080);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  rect(c, 0, 0, 1920, 1080, g);
  // Edge fingers and screw holes locate the lesson in a single instrument.
  for (let x = 120; x < 1820; x += 30) rect(c, x, 1030, 14, 54, '#ad926943', 3);
  for (const x of [40, 1880]) for (const y of [42, 995]) screw(c, x, y);
  txt(c, legend, 92, 68, 30, '#c0cebf', 'left', 'Mono');
  txt(c, title, 88, 151, 68, paper, 'left', 'Serif', 500);
  line(
    c,
    [
      [90, 211],
      [1830, 211],
    ],
    '#9caea16b',
    2,
  );
}
export function frame(c, x, y, w, h) {
  rect(c, x, y + 8, w, h, '#081b21', 16);
  rect(c, x, y, w, h, '#637675', 16);
  rect(c, x + 3, y + 3, w - 6, h - 6, '#183136', 14);
}
export function chip(
  c,
  x,
  y,
  w,
  h,
  value,
  { accent = teal, selected = false, empty = false } = {},
) {
  const n = Math.max(2, Math.floor(w / 33));
  for (let i = 0; i < n; i++) {
    const px = x + ((i + 0.5) * w) / n - 4;
    rect(c, px, y - 6, 8, 10, '#a4997a');
    rect(c, px, y + h - 1, 8, 10, '#baa882');
  }
  rect(c, x + 2, y + 5, w, h, '#081d25', 8);
  rect(c, x, y, w, h, empty ? '#3b5456' : selected ? accent : '#eae3d1', 8);
  rect(c, x + 4, y + 4, w - 8, h - 8, empty ? '#233c40' : selected ? '#f5c881' : '#e4e0d1', 6);
  dot(c, x + 11, y + 11, 3, empty ? '#526f6f' : '#999481');
  if (value !== null)
    mono(c, value, x + w / 2, y + h / 2 + 2, Math.min(54, h * 0.65), empty ? muted : ink);
}
export function pill(c, x, y, w, s, color = teal) {
  rect(c, x, y, w, 54, color, 27);
  txt(c, s, x + w / 2, y + 28, 29, ink, 'center', 'Sans', 700);
}
export function foot(c, s, color = teal) {
  line(
    c,
    [
      [91, 887],
      [1827, 887],
    ],
    '#79949175',
    2,
  );
  txt(c, s, 94, 935, 38, color);
}
export function ruler(c, x, y, width, max, color = muted, step = 1) {
  line(
    c,
    [
      [x, y],
      [x + width, y],
    ],
    color,
    2,
  );
  for (let n = 0; n <= max; n += step) {
    const xx = x + (n * width) / max;
    line(
      c,
      [
        [xx, y],
        [xx, y + 10],
      ],
      color,
      2,
    );
    mono(c, n, xx, y + 34, 28, color);
  }
}
export function timeBar(c, x, y, scale, start, end, color, label) {
  if (end <= start) return;
  const left = x + start * scale,
    w = (end - start) * scale;
  rect(c, left + 1, y, w - 2, 60, color, 6);
  if (label) txt(c, label, left + w / 2, y + 31, 30, ink, 'center', 'Sans', 700);
}
// Referencing a later or earlier beat keeps observed states stable on a replay.
export function cue(clock, index, phrase, seconds = 0.48) {
  if (clock.beat.beatIndex !== index) return clock.beat.beatIndex > index ? 1 : 0;
  return clock.reveal(phrase, seconds);
}
export function on(clock, index, phrase) {
  return cue(clock, index, phrase, 0) === 1;
}
