export const ink = '#18313c',
  muted = '#506a6d',
  paper = '#f6f2e6';
export const teal = '#086b64',
  brass = '#a0520b',
  blue = '#235783',
  rust = '#a43d36',
  grid = '#bbc7bb';
export const clamp = (n) => Math.max(0, Math.min(1, n));
export function num(n, digits = 2) {
  const rounded = Number(n.toFixed(digits));
  return String(rounded).replace('-', '−');
}
export const vector = (v, d = 2) => '[ ' + v.map((n) => num(n, d)).join('   ') + ' ]';
export function cue(clock, beat, words, duration = 0) {
  const index = clock.beat.beatIndex + 1;
  if (index !== beat) return Number(index > beat);
  return clock.reveal(words, duration);
}
export function text(c, s, x, y, size = 38, color = ink, align = 'left', face = 'Sans', weight = 500) {
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(String(s), x, y);
}
export const mono = (c, s, x, y, size = 38, color = ink, align = 'left') =>
  text(c, s, x, y, size, color, align, 'Mono');
export function plotNumber(c, s, x, y, size, color, align = 'left') {
  c.font = '500 ' + size + 'px "Lesson Mono"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.lineWidth = 8;
  c.lineJoin = 'round';
  c.strokeStyle = paper;
  c.strokeText(s, x, y);
  mono(c, s, x, y, size, color, align);
}
export function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function line(c, x1, y1, x2, y2, color = ink, w = 3, dash = []) {
  c.beginPath();
  c.setLineDash(dash);
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
  c.setLineDash([]);
}
export function path(c, pts, fill, stroke, w = 3, closed = true) {
  c.beginPath();
  c.moveTo(...pts[0]);
  for (const pt of pts.slice(1)) c.lineTo(...pt);
  if (closed) c.closePath();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = w;
    c.stroke();
  }
}
export function circle(c, x, y, r, fill, stroke, w = 3) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.lineWidth = w;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
export function arrow(c, x1, y1, x2, y2, color = ink, width = 5) {
  const a = Math.atan2(y2 - y1, x2 - x1),
    len = Math.min(22, Math.hypot(x2 - x1, y2 - y1) * 0.5);
  line(c, x1, y1, x2, y2, color, width);
  path(
    c,
    [
      [x2, y2],
      [x2 - len * Math.cos(a - 0.46), y2 - len * Math.sin(a - 0.46)],
      [x2 - len * Math.cos(a + 0.46), y2 - len * Math.sin(a + 0.46)],
    ],
    color,
  );
}
export function base(c) {
  rect(c, 0, 0, 1920, 1080, paper);
  // The drafting grid stays behind the physical scales and their readings.
  for (let x = 30; x < 1920; x += 48) for (let y = 30; y < 1080; y += 48) rect(c, x, y, 2, 2, '#d3d7ca');
}
export function title(c, s, context) {
  text(c, s, 92, 94, 65, ink, 'left', 'Serif', 500);
  if (context) text(c, context, 94, 172, 33, muted);
}
export function rule(c, x, y, w, min, max, step, labelEvery = 1) {
  rect(c, x, y, w, 12, ink);
  const project = (v) => x + ((v - min) / (max - min)) * w;
  const count = Math.round((max - min) / step);
  for (let i = 0; i <= count; i++) {
    const v = min + i * step,
      px = project(v),
      major = i % labelEvery === 0;
    line(c, px, y + 12, px, y + (major ? 43 : 25), ink, major ? 3 : 2);
    if (major) mono(c, num(v, 3), px, y + 72, 28, muted, 'center');
  }
  return project;
}
export function gaugeBlock(c, x, y, w, h, color, light, mark) {
  const d = 14;
  rect(c, x, y, w, h, color);
  path(
    c,
    [
      [x, y],
      [x + d, y - d],
      [x + w + d, y - d],
      [x + w, y],
    ],
    light,
    ink,
    2,
  );
  path(
    c,
    [
      [x + w, y],
      [x + w + d, y - d],
      [x + w + d, y + h - d],
      [x + w, y + h],
    ],
    color,
    ink,
    2,
  );
  line(c, x, y, x, y + h, ink, 3);
  line(c, x, y + h, x + w, y + h, ink, 3);
  if (mark !== undefined) mono(c, mark, x + w / 2, y + h / 2, 38, '#fff9e9', 'center');
}
export function range(c, x1, x2, y, label, color = muted) {
  line(c, x1, y, x2, y, color, 3);
  line(c, x1, y - 10, x1, y + 10, color, 3);
  line(c, x2, y - 10, x2, y + 10, color, 3);
  if (label) text(c, label, (x1 + x2) / 2, y - 36, 33, color, 'center');
}
export function socket(c, s, x, y, w = 150, color = teal) {
  rect(c, x - w / 2 + 4, y - 30 + 5, w, 60, '#c5cdbf');
  rect(c, x - w / 2, y - 30, w, 60, color);
  text(c, s, x, y, 33, '#fffaf0', 'center', 'Sans', 600);
}
export function row(c, label, values, y, { x = 640, dx = 260, color = teal, digits = 3, hot = -1 } = {}) {
  text(c, label, 106, y, 36, ink);
  values.forEach((v, i) =>
    mono(
      c,
      typeof v === 'number' ? num(v, digits) : v,
      x + dx * i,
      y,
      43,
      i === hot ? brass : color,
      'center',
    ),
  );
}
