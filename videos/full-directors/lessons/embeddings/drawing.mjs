export const C = {
  paper: '#f6f1e4',
  light: '#fffaf0',
  ink: '#192e33',
  muted: '#506463',
  grid: '#d9d6c7',
  faint: '#e9e5d7',
  blue: '#28578d',
  aqua: '#116e69',
  coral: '#a13f32',
  gold: '#92641a',
  yellow: '#edba57',
  pink: '#9a4471',
  sea: '#cee5db',
  rose: '#f6d7c7',
  sky: '#d9e2f0',
  steel: '#34565a',
};
export function text(
  c,
  s,
  x,
  y,
  size = 42,
  color = C.ink,
  family = 'Sans',
  align = 'left',
  weight = 400,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(String(s), x, y);
}
export function mono(c, s, x, y, size = 38, color = C.ink, align = 'left') {
  text(c, s, x, y, size, color, 'Mono', align);
}
export function serif(c, s, x, y, size = 52, color = C.ink, align = 'left') {
  text(c, s, x, y, size, color, 'Serif', align);
}
export function tag(c, s, x, y, color = C.muted, align = 'left') {
  text(c, s, x, y, 29, color, 'Sans', align, 600);
}
export function box(c, x, y, w, h, fill, radius = 0, stroke, width = 2) {
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
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
export function line(c, a, b, color = C.grid, width = 3, dash = []) {
  c.save();
  c.beginPath();
  c.setLineDash(dash);
  c.lineWidth = width;
  c.strokeStyle = color;
  c.moveTo(...a);
  c.lineTo(...b);
  c.stroke();
  c.restore();
}
export function path(c, points, fill, stroke, width = 3) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const p of points.slice(1)) c.lineTo(...p);
  c.closePath();
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
export function dot(c, p, r, fill, stroke, width = 3) {
  c.beginPath();
  c.arc(...p, r, 0, 2 * Math.PI);
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
export function arrow(c, a, b, color, width = 8, head = 23) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    length = Math.hypot(dx, dy);
  if (length < 2) return;
  const angle = Math.atan2(dy, dx),
    end = Math.min(length * 0.5, head);
  const behind = [b[0] - end * Math.cos(angle), b[1] - end * Math.sin(angle)];
  line(c, a, behind, color, width);
  path(
    c,
    [
      b,
      [behind[0] - end * 0.49 * Math.sin(angle), behind[1] + end * 0.49 * Math.cos(angle)],
      [behind[0] + end * 0.49 * Math.sin(angle), behind[1] - end * 0.49 * Math.cos(angle)],
    ],
    color,
  );
}
export const pos = (a, b, t) => a + (b - a) * t;
export function phase(k, n, phrase, seconds = 0.75) {
  const current = k.beat.beatIndex + 1;
  if (current < n) return 0;
  if (current > n) return 1;
  const t = k.reveal(phrase, seconds);
  return t * t * (3 - 2 * t);
}
export function spoken(k, beat, phrase) {
  const current = k.beat.beatIndex + 1;
  if (current !== beat) return current > beat;
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: false }) === 1;
}
export function ground(c, title) {
  c.fillStyle = C.paper;
  c.fillRect(0, 0, 1920, 1080);
  const shade = c.createLinearGradient(0, 0, 1920, 970);
  shade.addColorStop(0, '#fbf8ef');
  shade.addColorStop(1, '#ede6d5');
  c.fillStyle = shade;
  c.fillRect(0, 0, 1920, 1080);
  serif(c, title, 82, 117, 64);
  line(c, [84, 157], [1836, 157], C.muted, 2);
}
export function axis(c, origin, unit, xr, yr, step = 1) {
  const pt = ([x, y]) => [origin[0] + x * unit, origin[1] - y * unit];
  for (let x = Math.ceil(xr[0] / step) * step; x <= xr[1] + 1e-8; x += step)
    line(c, pt([x, yr[0]]), pt([x, yr[1]]), C.grid, 2);
  for (let y = Math.ceil(yr[0] / step) * step; y <= yr[1] + 1e-8; y += step)
    line(c, pt([xr[0], y]), pt([xr[1], y]), C.grid, 2);
  line(c, pt([xr[0], 0]), pt([xr[1], 0]), C.muted, 3);
  line(c, pt([0, yr[0]]), pt([0, yr[1]]), C.muted, 3);
  dot(c, origin, 5, C.ink);
  return pt;
}
export function dial(c, origin, rad) {
  dot(c, origin, rad + 10, C.light, C.grid, 3);
  for (let i = 0; i < 72; i++) {
    const a = (i * Math.PI) / 36,
      len = i % 6 === 0 ? 18 : 7;
    const p = (r) => [origin[0] + r * Math.cos(a), origin[1] + r * Math.sin(a)];
    line(c, p(rad - len), p(rad), i % 6 === 0 ? C.muted : C.grid, 2);
  }
  line(c, [origin[0] - rad, origin[1]], [origin[0] + rad, origin[1]], C.grid, 2);
  line(c, [origin[0], origin[1] - rad], [origin[0], origin[1] + rad], C.grid, 2);
}
export function ticketArt(c, i, x, y, s = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  if (i === 0) {
    c.rotate(-0.045);
    const edge = [
      [-165, -145],
      [165, -145],
      [165, 135],
    ];
    for (let j = 0; j < 15; j++) edge.push([154 - 22 * j, 146], [143 - 22 * j, 135]);
    path(c, edge, C.light, C.coral, 4);
    tag(c, 'RECEIPT', -130, -87, C.coral);
    line(c, [-132, -61], [131, -61], C.coral, 3);
    text(c, 'Charge', -131, -14, 34, C.ink);
    serif(c, '$12.00', -131, 62, 80, C.coral);
    for (let j = 0; j < 30; j++) box(c, -131 + j * 8, 82, 2 + (j % 3), 24, C.ink);
  } else {
    c.save();
    c.rotate(0.045);
    box(c, -112, -157, 206, 307, C.steel, 26, C.ink, 4);
    box(c, -100, -144, 182, 277, '#d5ede2', 20);
    box(c, -49, -139, 81, 11, C.ink, 5);
    box(c, -65, -64, 111, 52, null, 7, C.aqua, 6);
    box(c, 48, -48, 8, 20, C.aqua, 3);
    box(c, -58, -58, 9, 40, C.coral, 2);
    serif(c, '2%', -9, 69, 66, C.aqua, 'center');
    box(c, -27, 150, 36, 28, '#ddd7c3', 4, C.ink, 3);
    box(c, 151, -67, 102, 160, '#dedbcf', 9, C.muted, 3);
    dot(c, [202, -53], 3, C.muted);
    dot(c, [202, 79], 3, C.muted);
    box(c, 172, -26, 60, 88, C.light, 12, C.muted, 2);
    c.beginPath();
    c.moveTo(-9, 177);
    c.bezierCurveTo(-10, 222, 202, 231, 202, 91);
    c.lineTo(202, 57);
    c.lineWidth = 10;
    c.strokeStyle = C.ink;
    c.stroke();
    box(c, 175, 4, 55, 56, '#e5e4db', 6, C.ink, 3);
    path(
      c,
      [
        [-6, -47],
        [-21, -24],
        [-9, -24],
        [-14, -10],
        [11, -37],
        [0, -37],
      ],
      C.aqua,
    );
    c.restore();
  }
  c.restore();
}
export function book(c, i, x, y, w = 400, h = 160) {
  const tint = i ? C.sea : C.rose,
    ink = i ? C.aqua : C.coral;
  box(c, x + 7, y + 10, w, h, C.grid, 8);
  box(c, x, y, w, h, C.light, 6, ink, 3);
  box(c, x, y, w, h - 10, tint, 6, ink, 3);
  box(c, x + 15, y + 2, 9, h - 14, ink);
  const cy = y + (h - 10) / 2;
  if (i === 0) {
    path(
      c,
      [
        [x + 44, cy - 31],
        [x + 88, cy - 31],
        [x + 88, cy + 31],
        [x + 80, cy + 27],
        [x + 72, cy + 32],
        [x + 64, cy + 27],
        [x + 56, cy + 32],
        [x + 44, cy + 28],
      ],
      C.light,
      ink,
    );
    for (const dy of [-15, -4, 9]) line(c, [x + 52, cy + dy], [x + 80, cy + dy], ink, 2);
  } else {
    box(c, x + 44, cy - 33, 44, 66, null, 7, ink, 4);
    box(c, x + 57, cy - 24, 19, 4, ink);
    path(
      c,
      [
        [x + 69, cy - 12],
        [x + 57, cy + 4],
        [x + 66, cy + 4],
        [x + 62, cy + 18],
        [x + 76, cy - 2],
        [x + 68, cy - 2],
      ],
      ink,
    );
  }
  serif(c, i ? 'Phone guide' : 'Invoice guide', x + 108, cy + 14, Math.min(46, w * 0.1), ink);
}
export function horizontalScale(c, x, y, w, limit, step, markEvery = step) {
  line(c, [x, y], [x + w, y], C.muted, 3);
  for (let n = 0; n <= limit; n += step) {
    const xx = x + (w * n) / limit,
      major = n % markEvery === 0;
    line(c, [xx, y], [xx, y + (major ? 14 : 7)], C.muted, 2);
    if (major) mono(c, n, xx, y + 49, 28, C.muted, 'center');
  }
  return (value) => x + (w * value) / limit;
}
