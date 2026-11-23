// Shared instruments for Luna's form, key and trace reader.
export const C = {
  ink: '#14332f',
  dim: '#47645b',
  paper: '#faf2db',
  base: '#e6debf',
  rim: '#a99e75',
  forest: '#143a35',
  deep: '#0d2927',
  panel: '#234b43',
  light: '#e8efd9',
  muted: '#acc3ae',
  brass: '#f5bd54',
  gold: '#98600e',
  mint: '#92deb6',
  ok: '#17654e',
  coral: '#ff9c87',
  red: '#983c2f',
  wire: '#718b78',
  white: '#fffdf1',
};
export function box(c, x, y, w, h, fill, r = 0, stroke = null, lw = 2) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.lineWidth = lw;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
export function line(c, x, y, X, Y, color, width = 3) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(X, Y);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
export function circle(c, x, y, r, fill, stroke = null, lw = 2) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = lw;
    c.stroke();
  }
}
export function poly(c, points, fill, stroke = null, lw = 2) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = lw;
    c.stroke();
  }
}
export function txt(
  c,
  s,
  x,
  y,
  size = 38,
  color = C.ink,
  family = 'Sans',
  align = 'left',
  weight = 400,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillStyle = color;
  c.fillText(String(s), x, y);
}
export const mono = (c, s, x, y, size = 30, col = C.ink, align = 'left') =>
  txt(c, s, x, y, size, col, 'Mono', align);
export const serif = (c, s, x, y, size = 66, col = C.ink, align = 'left') =>
  txt(c, s, x, y, size, col, 'Serif', align);
export const label = (c, s, x, y, col = C.dim, size = 23) =>
  txt(c, s, x, y, size, col, 'Sans', 'left', 600);
export function screw(c, x, y) {
  circle(c, x, y, 7, '#94a594', '#294b40', 2);
  line(c, x - 3, y + 3, x + 3, y - 3, '#345248', 2);
}
export function stage(c, title, dark = false) {
  const grad = c.createLinearGradient(0, 0, 1920, 1080);
  if (dark) {
    grad.addColorStop(0, '#10332f');
    grad.addColorStop(1, '#244a40');
  } else {
    grad.addColorStop(0, '#fff6dd');
    grad.addColorStop(1, '#d8d1ae');
  }
  c.fillStyle = grad;
  c.fillRect(0, 0, 1920, 1080);
  serif(c, title, 105, 138, 72, dark ? C.light : C.ink);
  line(c, 110, 180, 1810, 180, dark ? '#5e7e6d' : '#a6a283', 2);
}
export function enamel(c, x, y, w, h) {
  box(c, x + 5, y + 10, w, h, '#0a24222a', 20);
  box(c, x, y, w, h, '#36594e', 20, C.ink, 4);
  box(c, x + 10, y + 10, w - 20, h - 20, C.forest, 13, '#78917c', 2);
  for (const X of [x + 27, x + w - 27]) for (const Y of [y + 27, y + h - 27]) screw(c, X, Y);
}
export function key(c, x, y, k = 1, angle = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(k, k);
  const profile = [
    [-64, -39],
    [-43, -63],
    [16, -63],
    [56, -35],
    [70, -16],
    [200, -16],
    [226, -2],
    [212, 13],
    [196, 13],
    [184, 30],
    [165, 30],
    [156, 14],
    [145, 14],
    [135, 30],
    [119, 30],
    [112, 14],
    [69, 14],
    [52, 39],
    [20, 61],
    [-39, 61],
    [-64, 40],
  ];
  const gradient = c.createLinearGradient(0, -64, 30, 63);
  gradient.addColorStop(0, '#ffdf85');
  gradient.addColorStop(0.35, '#f4b948');
  gradient.addColorStop(1, '#bd802c');
  c.save();
  c.translate(1, 8);
  poly(c, profile, '#795328', C.ink, 3);
  c.restore();
  poly(c, profile, gradient, '#634d29', 3);
  circle(c, -27, -2, 15, '#314c42', '#fff1bc', 4);
  line(c, 67, -5, 198, -5, '#a56f26', 4);
  line(c, 67, -9, 195, -9, '#ffe59a', 3);
  line(c, -47, -34, -32, -48, '#fff2bb', 3);
  line(c, -32, -48, 13, -48, '#fff2bb', 3);
  c.restore();
}
export function cursor(c, x, y) {
  poly(
    c,
    [
      [x, y],
      [x + 5, y + 48],
      [x + 18, y + 35],
      [x + 30, y + 56],
      [x + 40, y + 51],
      [x + 27, y + 29],
      [x + 46, y + 25],
    ],
    C.white,
    C.ink,
    3,
  );
}
export const shortId = (id) => id.slice(0, 6) + '…';
export const human = (s) => s.replaceAll('_', ' ');
export function form(
  c,
  x,
  y,
  w,
  h,
  {
    status = 'Ready',
    account = 'acct_10234',
    report = 'Service-account key is stale.',
    trace,
    showKey = true,
    pending = false,
    reload = false,
    click = false,
  },
) {
  box(c, x + 7, y + 12, w, h, '#0a292b30', 23);
  box(c, x, y, w, h, C.paper, 23, C.ink, 4);
  box(c, x + 2, y + 2, w - 4, 78, C.forest, [21, 21, 0, 0]);
  circle(c, x + 42, y + 40, 8, '#edc56e');
  circle(c, x + 67, y + 40, 8, '#87b09a');
  mono(c, '127.0.0.1:8000', x + 103, y + 51, 29, C.light);
  c.save();
  c.translate(x + w - 52, y + 42);
  c.strokeStyle = reload ? C.brass : C.light;
  c.lineWidth = 4;
  c.beginPath();
  c.arc(0, 0, 16, 0.65, 5.9);
  c.stroke();
  poly(
    c,
    [
      [15, -17],
      [20, -3],
      [6, -6],
    ],
    reload ? C.brass : C.light,
  );
  c.restore();
  const inset = w > 1000 ? 65 : 38,
    left = x + inset,
    top = y + 80;
  if (showKey) key(c, x + w - 209, top + 113, w > 1000 ? 0.77 : 0.53, -0.15);
  label(c, 'Fixture account', left, top + 62);
  mono(c, account, left, top + 121, w > 1000 ? 53 : 39);
  label(c, 'Report', left, top + 191);
  txt(c, report, left, top + 240, w > 1000 ? 42 : 31);
  const buttonY = top + 279;
  box(c, left, buttonY, 286, 75, pending ? '#d8d4bd' : C.forest, 10);
  txt(
    c,
    'Check policy',
    left + 143,
    buttonY + 50,
    34,
    pending ? C.dim : C.light,
    'Sans',
    'center',
    600,
  );
  if (click) cursor(c, left + 235, buttonY + 48);
  if (reload) cursor(c, x + w - 54, y + 55);
  const statusY = y + h - (trace ? 91 : 68);
  line(c, left, statusY - 65, x + w - inset, statusY - 65, C.rim, 2);
  const color =
    status.startsWith('Eligible') || status.startsWith('Not eligible')
      ? C.ok
      : status.startsWith('Request')
        ? C.red
        : C.ink;
  circle(c, left + 10, statusY - 14, 9, pending ? C.brass : color);
  txt(c, status, left + 37, statusY, w > 1000 ? 48 : 36, color, 'Sans', 'left', 600);
  if (trace) mono(c, 'Trace ' + shortId(trace), left + 38, statusY + 48, 28, C.dim);
}
export function fileRow(
  c,
  x,
  y,
  w,
  h,
  row,
  { title = 'rotation_tasks.sqlite3', details = true } = {},
) {
  box(c, x + 10, y + 13, w, h, '#18393135', 9);
  box(c, x, y, w, h, C.paper, 9, C.ink, 3);
  box(c, x + 1, y + 1, w - 2, 59, C.base, [8, 8, 0, 0]);
  mono(c, title, x + 25, y + 40, 26, C.dim);
  if (!row) {
    serif(c, 'Empty table', x + 32, y + 140, 52);
    return;
  }
  mono(c, shortId(row.trace_id), x + 32, y + 118, 37, C.ink);
  mono(c, 'v' + row.version, x + w - 32, y + 118, 36, C.ink, 'right');
  const color = row.status === 'failed' ? C.red : row.status === 'completed' ? C.ok : C.gold;
  box(c, x + 31, y + 148, 8, h - 178, color, 4);
  txt(c, row.status, x + 59, y + 205, 48, color, 'Sans', 'left', 600);
  if (details)
    mono(
      c,
      row.error_code || row.result_json?.decision || 'result = NULL',
      x + 60,
      y + 262,
      31,
      C.ink,
    );
}
export function packet(c, x, y, w = 88, color = C.brass) {
  box(c, x - w / 2, y - w * 0.32, w, w * 0.64, color, 5, C.ink, 3);
  line(c, x - w / 2 + 3, y - w * 0.31 + 2, x, y + 2, C.ink, 3);
  line(c, x, y + 2, x + w / 2 - 3, y - w * 0.31 + 2, C.ink, 3);
}
export function wire(c, x, y, X, { progress = 0, broken = 0, color = C.wire } = {}) {
  const center = (x + X) / 2,
    dir = Math.sign(X - x);
  line(c, x, y, center - dir * broken * 31, y, color, 5);
  line(c, center + dir * broken * 31, y, X, y, color, 5);
  if (broken) {
    line(c, center - 11, y - 18, center + 11, y + 18, C.coral, 6);
    line(c, center + 11, y - 18, center - 11, y + 18, C.coral, 6);
  }
  if (progress > 0 && progress < 1) packet(c, x + (X - x) * progress, y, 68, C.brass);
}
export function stamp(c, x, y, words, good = true, size = 35) {
  const ink = good ? C.ok : C.red;
  c.save();
  c.translate(x, y);
  c.rotate(-0.032);
  c.font = '700 ' + size + 'px "Lesson Sans"';
  const w = c.measureText(words).width + 48;
  box(c, 0, -size - 12, w, size + 30, good ? '#dfedd3' : '#f6d7c1', 6, ink, 4);
  txt(c, words, 23, 0, size, ink, 'Sans', 'left', 700);
  c.restore();
}
export const mix = (a, b, t) => a + (b - a) * t;
export const clamp = (t) => Math.min(1, Math.max(0, t));
export function cue(clock, b, phrase, seconds = 0.65) {
  const index = clock.beat.beatIndex;
  if (index !== b) return index > b ? 1 : 0;
  return clock.reveal(phrase, seconds);
}
