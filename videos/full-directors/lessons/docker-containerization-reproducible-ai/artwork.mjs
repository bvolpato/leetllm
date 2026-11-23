export const C = {
  paper: '#f5eddd',
  pale: '#fff9e9',
  ink: '#162e36',
  iron: '#344e54',
  edge: '#76857e',
  blue: '#346b83',
  ice: '#c2dfdf',
  gold: '#e4aa61',
  amber: '#805020',
  mint: '#a8d4b3',
  green: '#255f50',
  red: '#aa493e',
  blush: '#f0c1a6',
  line: '#b6baaa',
};
export const lerp = (a, b, n) => a + (b - a) * n;
export function box(c, x, y, w, h, fill, r = 0, stroke = null, weight = 2) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = weight;
    c.stroke();
  }
}
export function path(c, points, fill, stroke = null, width = 2) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
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
export function circle(c, x, y, radius, fill, stroke = null, width = 2) {
  c.beginPath();
  c.arc(x, y, radius, 0, Math.PI * 2);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
export function label(c, x, y, value, size = 23, opts = {}) {
  const { color = C.ink, family = 'Sans', bold = false, align = 'left', max = 1120 } = opts;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.font = (bold ? '700 ' : '400 ') + size + 'px "Lesson ' + family + '"';
  c.fillText(String(value), x, y, max);
}
export const mono = (c, x, y, t, size = 22, opts = {}) =>
  label(c, x, y, t, size, { family: 'Mono', ...opts });
export const cap = (c, x, y, t, opts = {}) => label(c, x, y, t, 16, { bold: true, ...opts });
export function screw(c, x, y) {
  circle(c, x, y, 4.4, C.line, C.iron, 1);
  path(
    c,
    [
      [x - 2, y + 2],
      [x + 2, y - 2],
    ],
    null,
    C.iron,
    1.2,
  );
}
export function bench(c, title, sector) {
  c.scale(1.6, 1.6);
  const grad = c.createLinearGradient(0, 0, 900, 675);
  grad.addColorStop(0, '#fff9eb');
  grad.addColorStop(1, '#e5dfcc');
  box(c, 0, 0, 1200, 675, grad);
  for (let x = 25; x < 1200; x += 30) for (let y = 111; y < 592; y += 30) circle(c, x, y, 0.9, '#c9cabb');
  path(
    c,
    [
      [45, 98],
      [1155, 98],
    ],
    null,
    C.ink,
    1.5,
  );
  cap(c, 1155, 72, sector.toUpperCase(), { color: C.green, align: 'right' });
  label(c, 45, 72, title, 40, { family: 'Serif', max: 1110 });
}
// A perforated metal bed supports the two fixture strips at the optical reader.
export function readerBed(c, x, y, w, h) {
  const enamel = c.createLinearGradient(x, y, x + w, y + h);
  enamel.addColorStop(0, '#b9cacc');
  enamel.addColorStop(0.57, '#dce0d1');
  enamel.addColorStop(1, '#a4b3ac');
  box(c, x + 3, y + 7, w, h, '#b4b4a4', 17);
  box(c, x, y, w, h, enamel, 17, C.iron, 2);
  for (const sx of [x + 13, x + w - 13]) for (const sy of [y + 13, y + h - 13]) screw(c, sx, sy);
}
export function foot(c, text, tone = C.ink) {
  box(c, 45, 4, 1110, 40, tone, 5);
  mono(c, 67, 24, text, 23, { color: C.pale, max: 1064 });
}
export function plate(c, x, y, w, h, name, fill = C.ice, sub = '') {
  const bevel = Math.min(18, h * 0.24);
  path(
    c,
    [
      [x + 3, y + bevel + 5],
      [x + bevel + 3, y + 5],
      [x + w - 5, y + 5],
      [x + w + 3, y + 13],
      [x + w + 3, y + h + 5],
      [x + 3, y + h + 5],
    ],
    '#a2a99e',
  );
  path(
    c,
    [
      [x, y + bevel],
      [x + bevel, y],
      [x + w - 8, y],
      [x + w, y + 8],
      [x + w, y + h],
      [x, y + h],
    ],
    fill,
    C.ink,
    2.2,
  );
  path(
    c,
    [
      [x + 4, y + bevel],
      [x + bevel + 1, y + 3],
      [x + w - 10, y + 3],
    ],
    null,
    '#fff7da',
    1.4,
  );
  box(c, x + 1, y + h - 9, w - 2, 8, C.iron);
  for (let i = 0; i < Math.min(10, Math.floor(w / 26)); i++)
    box(c, x + 12 + i * 12, y + h - 8, 6, 7, C.gold);
  screw(c, x + w - 12, y + 13);
  label(c, x + 20, y + h * (sub ? 0.38 : 0.44), name, Math.min(26, h * 0.48), {
    bold: true,
    max: w - 48,
  });
  if (sub) mono(c, x + 20, y + h * 0.68, sub, Math.min(20, h * 0.26), { max: w - 42 });
}
export function well(c, x, y, w, h, title) {
  box(c, x, y, w, h, '#d8d7c7', 12, C.iron, 2);
  box(c, x + 8, y + 8, w - 16, h - 16, C.ink, 8);
  cap(c, x + 23, y + 30, title, { color: C.ice, max: w - 46 });
  screw(c, x + 10, y + 10);
  screw(c, x + w - 10, y + h - 10);
}
export function display(c, x, y, w, h, heading, lines) {
  well(c, x, y, w, h, heading);
  const top = y + 60,
    span = (h - 68) / Math.max(1, lines.length);
  lines.forEach((l, i) => {
    if (typeof l === 'string') l = { t: l };
    mono(c, x + 25, top + span * (i + 0.35), l.t, l.size ?? 25, {
      color: l.color ?? C.pale,
      max: w - 50,
    });
  });
}
export function wire(c, points, color = C.blue, progress = 1, thickness = 5) {
  path(c, points, null, C.line, thickness + 2);
  const lengths = points.slice(1).map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let remain = lengths.reduce((a, b) => a + b, 0) * progress;
  let end = points[0],
    active = [end];
  for (let i = 0; i < lengths.length && remain > 0; i++) {
    const f = Math.min(1, remain / lengths[i]);
    end = points[i].map((v, j) => lerp(v, points[i + 1][j], f));
    active.push(end);
    remain -= lengths[i];
  }
  path(c, active, null, color, thickness);
  circle(c, ...end, 5.5, color);
}
// The two ridged edges belong to the same input tape as its printed values.
export function tape(c, x, y, w, h, fill, heading, lines) {
  box(c, x + 3, y + 5, w, h, '#c4bda9', 3);
  box(c, x, y, w, h, fill, 3, C.iron, 1.6);
  for (let slot = x + 12; slot < x + w - 5; slot += 19) {
    box(c, slot, y + 5, 7, 3, C.iron, 1);
    box(c, slot, y + h - 9, 7, 3, C.iron, 1);
  }
  cap(c, x + 17, y + 26, heading, { max: w - 34 });
  const gap = (h - 41) / Math.max(lines.length, 1);
  lines.forEach((l, i) =>
    mono(c, x + 17, y + 45 + gap * (i + 0.23), l, Math.min(27, gap * 0.79), { max: w - 34 }),
  );
}
export function folder(c, x, y, w, h, title, items, fill = C.gold) {
  path(
    c,
    [
      [x, y + 17],
      [x, y],
      [x + w * 0.38, y],
      [x + w * 0.45, y + 15],
      [x + w, y + 15],
      [x + w, y + h],
      [x, y + h],
    ],
    fill,
    C.ink,
    2,
  );
  box(c, x + 1, y + 33, w - 2, h - 34, fill);
  path(
    c,
    [
      [x, y + 33],
      [x + w, y + 33],
    ],
    null,
    C.ink,
    1,
  );
  label(c, x + 20, y + 58, title, 25, { bold: true, max: w - 40 });
  items.forEach((v, i) => mono(c, x + 20, y + 98 + i * 34, v, 21, { max: w - 40 }));
}
export function dial(c, x, y, r, number, total, kind, needle = number) {
  circle(c, x + 3, y + 5, r, C.line);
  circle(c, x, y, r, C.iron, C.ink, 2);
  circle(c, x, y, r - 8, C.pale, C.ink, 2);
  const a = Math.PI * 0.78,
    span = Math.PI * 1.44;
  for (let i = 0; i <= total; i++) {
    const t = a + (span * i) / total;
    path(
      c,
      [
        [x + (r - 16) * Math.cos(t), y + (r - 16) * Math.sin(t)],
        [x + (r - 25) * Math.cos(t), y + (r - 25) * Math.sin(t)],
      ],
      null,
      C.iron,
      3,
    );
  }
  const limit = a + (span * 2) / 3;
  path(
    c,
    [
      [x + (r - 13) * Math.cos(limit), y + (r - 13) * Math.sin(limit)],
      [x + (r - 31) * Math.cos(limit), y + (r - 31) * Math.sin(limit)],
    ],
    null,
    C.red,
    5,
  );
  if (number !== null) {
    const t = a + (span * needle) / total;
    path(
      c,
      [
        [x, y],
        [x + (r - 30) * Math.cos(t), y + (r - 30) * Math.sin(t)],
      ],
      null,
      kind,
      5,
    );
  }
  circle(c, x, y, 6, C.ink);
  box(c, x - r * 0.52, y + r * 0.22, r * 1.04, r * 0.4, C.ink, 4);
  mono(c, x, y + r * 0.42, (number ?? '–') + ' / ' + total, Math.max(18, r * 0.28), {
    color: C.pale,
    align: 'center',
  });
}
