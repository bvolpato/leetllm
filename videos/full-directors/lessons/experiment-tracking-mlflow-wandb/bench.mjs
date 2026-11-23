export const C = {
  paper: '#f6efdf',
  light: '#fff9ed',
  ink: '#1d3441',
  mid: '#49636b',
  line: '#a2b1a9',
  deck: '#e2e8da',
  deep: '#163944',
  panel: '#234b54',
  metal: '#aac4ba',
  mint: '#a8e1c5',
  green: '#21654f',
  amber: '#ffc568',
  brass: '#996019',
  red: '#a33d33',
  pink: '#f6ad96',
  blue: '#275e89',
  ice: '#bfdbed',
};
export const clamp = (v) => Math.min(1, Math.max(0, v));
export const smooth = (v) => v * v * (3 - 2 * v);
export const mix = (a, b, t) => a + (b - a) * t;
export function cue(k, b, phrase, seconds = 0) {
  const index = k.beat.beatIndex + 1;
  if (index !== b) return index > b ? 1 : 0;
  return k.reveal(phrase, seconds);
}
export function ended(k, b) {
  return k.beat.beatIndex + 1 > b || (k.beat.beatIndex + 1 === b && k.elapsed >= k.speechDuration);
}
export function box(c, x, y, w, h, fill, r = 6, stroke = null, lw = 1.5) {
  if (w <= 0 || h <= 0) return;
  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = lw;
    c.stroke();
  }
}
export function line(c, x1, y1, x2, y2, color = C.line, w = 2) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
}
export function dot(c, x, y, r, fill, stroke = null, lw = 2) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
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
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = lw;
    c.stroke();
  }
}
export function txt(c, value, x, y, size = 20, ink = C.ink, opts = {}) {
  c.font = (opts.bold ? '700 ' : '400 ') + size + 'px "Lesson ' + (opts.face || 'Sans') + '"';
  c.textAlign = opts.align || 'left';
  c.textBaseline = 'middle';
  c.fillStyle = ink;
  const s = String(value);
  if (opts.max && c.measureText(s).width > opts.max) {
    const fitted = Math.floor((size * opts.max) / c.measureText(s).width);
    c.font = (opts.bold ? '700 ' : '400 ') + fitted + 'px "Lesson ' + (opts.face || 'Sans') + '"';
  }
  c.fillText(s, x, y);
}
export function mono(c, value, x, y, size = 17, ink = C.mid, opts = {}) {
  txt(c, value, x, y, size, ink, { face: 'Mono', ...opts });
}
export function serif(c, value, x, y, size = 34, ink = C.ink, opts = {}) {
  txt(c, value, x, y, size, ink, { face: 'Serif', ...opts });
}
export function center(c, value, x, y, size = 20, ink = C.ink, opts = {}) {
  txt(c, value, x, y, size, ink, { ...opts, align: 'center' });
}
export function stage(c, dark = false) {
  const g = c.createLinearGradient(0, 0, 960, 540);
  g.addColorStop(0, dark ? '#173640' : '#f8f3e8');
  g.addColorStop(1, dark ? '#102a35' : '#d4dfd4');
  c.fillStyle = g;
  c.fillRect(0, 0, 960, 540);
  c.lineJoin = 'round';
  c.lineCap = 'round';
}
export function heading(c, kicker, title, dark = false) {
  mono(c, kicker, 42, 35, 15, dark ? C.mint : C.green);
  serif(c, title, 40, 81, 38, dark ? C.light : C.ink, { max: 876 });
}
export function screw(c, x, y) {
  dot(c, x, y, 5.2, '#819491', '#3b555d', 1);
  line(c, x - 2.5, y + 1.8, x + 2.5, y - 1.8, '#324e54', 1.5);
}
export function chassis(c, x, y, w, h, fill = C.panel) {
  box(c, x + 2, y + 7, w, h, '#81928a', 13);
  box(c, x, y, w, h, fill, 13, '#263f46', 2);
  for (const a of [x + 12, x + w - 12]) for (const b of [y + 12, y + h - 12]) screw(c, a, b);
}
export function plate(c, x, y, w, h, fill = C.light) {
  box(c, x + 2, y + 4, w, h, '#b2b8aa', 5);
  box(c, x, y, w, h, fill, 5, C.line, 1.2);
}
export function chip(c, x, y, w, h, name, fill = C.ice, sub = '') {
  const notch = Math.min(12, h / 5);
  const points = [
    [x, y + notch],
    [x + notch, y],
    [x + w - 6, y],
    [x + w, y + 6],
    [x + w, y + h - 4],
    [x + w - 4, y + h],
    [x, y + h],
  ];
  poly(c, points, fill, C.ink, 1.8);
  for (let k = 0; k < 5; k++)
    box(c, x + w * (0.2 + k * 0.14), y + h - 5, Math.min(10, w * 0.07), 5, '#b18a4c', 0);
  center(c, name, x + w / 2, y + h * (sub ? 0.38 : 0.47), Math.min(25, h * 0.43), C.ink, {
    bold: true,
    max: w - 12,
  });
  if (sub) center(c, sub, x + w / 2, y + h * 0.7, 15, C.mid, { face: 'Mono', max: w - 12 });
}
export function slot(c, x, y, w, h) {
  box(c, x, y, w, h, '#77938d', 5);
  box(c, x + 3, y + 4, w - 6, h - 8, '#294750', 4);
  for (let a = 0; a < 5; a++)
    box(c, x + w * (0.2 + a * 0.14), y + h - 9, Math.min(10, w * 0.07), 4, '#cba15c', 0);
}
export function arrow(c, x, y, xx, yy, color = C.brass, width = 3) {
  const a = Math.atan2(yy - y, xx - x);
  line(c, x, y, xx, yy, color, width);
  for (const offset of [-0.52, 0.52])
    line(c, xx, yy, xx - 11 * Math.cos(a + offset), yy - 11 * Math.sin(a + offset), color, width);
}
export function windowText(c, x, y, w, h, words, ink = C.mint, size = 24) {
  box(c, x, y, w, h, '#102e38', 6, '#77998f', 1.5);
  center(c, words, x + w / 2, y + h / 2, size, ink, { face: 'Mono', max: w - 16 });
}
export function file(c, x, y, w, h, title, lines = [], fill = C.light) {
  const fold = Math.min(22, w * 0.16);
  poly(
    c,
    [
      [x, y],
      [x + w - fold, y],
      [x + w, y + fold],
      [x + w, y + h],
      [x, y + h],
    ],
    fill,
    C.mid,
    1.5,
  );
  poly(
    c,
    [
      [x + w - fold, y],
      [x + w, y + fold],
      [x + w - fold, y + fold],
    ],
    C.deck,
    C.mid,
    1,
  );
  txt(c, title, x + 13, y + 26, 20, C.ink, { bold: true, max: w - 40 });
  line(c, x + 13, y + 45, x + w - 14, y + 45, C.line, 1);
  lines.forEach((v, i) => mono(c, v, x + 13, y + 67 + 26 * i, 16, C.mid, { max: w - 25 }));
}
export function dial(c, x, y, r, value, name, range = 1) {
  const begin = 0.78 * Math.PI,
    arc = 1.44 * Math.PI;
  dot(c, x, y, r, C.light, C.mid, 2);
  for (let i = 0; i <= 10; i++) {
    const a = begin + (arc * i) / 10;
    line(
      c,
      x + (r - 7) * Math.cos(a),
      y + (r - 7) * Math.sin(a),
      x + (r - 3) * Math.cos(a),
      y + (r - 3) * Math.sin(a),
      C.mid,
      1.5,
    );
  }
  const a = begin + (arc * value) / range;
  line(c, x, y, x + (r - 11) * Math.cos(a), y + (r - 11) * Math.sin(a), C.brass, 4);
  dot(c, x, y, 4, C.ink);
  center(c, value.toFixed(1), x, y + r * 0.5, r * 0.4, C.ink, { face: 'Mono', bold: true });
  center(c, name, x, y + r + 19, 16, C.mid);
}
export function book(c, x, y, w, h, open) {
  box(c, x + 4, y + 8, w, h, '#9a997c', 6);
  box(c, x, y, w, h, '#805030', 5);
  box(c, x + 4, y + 4, w - 8, h - 9, '#fee9ac', 4);
  if (open > 0) {
    const mid = x + w * 0.43;
    line(c, mid, y + 6, mid, y + h - 9, '#a98655', 3);
    serif(c, 'Rollback', x + 13, y + 38, 24, C.ink, { max: w * 0.38 });
    mono(c, 'RUNBOOK', x + 14, y + 73, 13, C.brass);
    txt(c, 'Select prior release', mid + 10, y + 38, 15, C.ink, { max: w * 0.54 - 12 });
    txt(c, 'Check its health', mid + 10, y + 73, 15, C.ink, { max: w * 0.54 - 12 });
  }
  if (open < 1) {
    c.save();
    c.translate(x, y);
    c.scale(Math.cos((open * Math.PI) / 2), 1);
    c.translate(-x, -y);
    box(c, x + 1, y, w - 3, h - 8, '#dbac59', 4);
    box(c, x + 7, y, 12, h - 8, '#8b6241', 1);
    serif(c, 'Rollback runbook', x + 31, y + h * 0.47, 25, C.ink, { max: w - 43 });
    c.restore();
  }
}
