export const C = {
  paper: '#f4ecd8',
  white: '#fff9eb',
  ink: '#17363b',
  secondary: '#36595a',
  rule: '#a8b7a8',
  navy: '#142f35',
  face: '#20454a',
  light: '#bfd4c9',
  grid: '#36585a',
  mint: '#95e2c5',
  gold: '#edbc59',
  teal: '#117766',
  red: '#9d392c',
  coral: '#ffa48a',
};
export const mix = (a, b, t) => a + (b - a) * t;
export function cue(clock, beat, words, seconds = 0) {
  const current = clock.beat.beatIndex + 1;
  return current === beat ? clock.reveal(words, seconds) : Number(current > beat);
}
export function label(c, value, x, y, size = 34, options = {}) {
  const { color = C.ink, face = 'Sans', weight = 400, align = 'left', width } = options;
  c.save();
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  if (width) c.fillText(String(value), x, y, width);
  else c.fillText(String(value), x, y);
  c.restore();
}
export const mono = (c, v, x, y, size = 31, color = C.ink, align = 'left', width) =>
  label(c, v, x, y, size, { color, face: 'Mono', align, width });
export const serif = (c, v, x, y, size = 60, color = C.ink, align = 'left', width) =>
  label(c, v, x, y, size, { color, face: 'Serif', align, width });
export function rect(c, x, y, w, h, fill, stroke, sw = 2, r = 0) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = sw;
    c.stroke();
  }
}
export function path(c, points, color, width = 4, dash = []) {
  c.save();
  c.lineWidth = width;
  c.strokeStyle = color;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.setLineDash(dash);
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
  c.restore();
}
export function disc(c, x, y, r, fill, stroke, sw = 2) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = sw;
    c.stroke();
  }
}
export function arrow(c, x, y, x2, y2, col, width = 4) {
  path(
    c,
    [
      [x, y],
      [x2, y2],
    ],
    col,
    width,
  );
  const a = Math.atan2(y2 - y, x2 - x);
  path(
    c,
    [
      [x2 - 15 * Math.cos(a - 0.52), y2 - 15 * Math.sin(a - 0.52)],
      [x2, y2],
      [x2 - 15 * Math.cos(a + 0.52), y2 - 15 * Math.sin(a + 0.52)],
    ],
    col,
    width,
  );
}
export function paper(c, x, y, w, h, fill = C.white) {
  rect(c, x + 7, y + 9, w, h, '#10292c35');
  rect(c, x, y, w, h, fill);
  for (let yy = y + 23; yy < y + h - 10; yy += 31) {
    disc(c, x + 13, yy, 4.1, C.rule);
    disc(c, x + w - 13, yy, 4.1, C.rule);
  }
}
export function title(c, kicker, name, dark = false) {
  const col = dark ? C.white : C.ink,
    accent = dark ? C.mint : C.teal;
  mono(c, kicker, 92, 66, 26, accent);
  serif(c, name, 90, 150, 65, col, 'left', 1420);
}
export function stage(c, dark) {
  rect(c, 0, 0, 1600, 900, dark ? C.navy : C.paper);
}
export function socket(c, x, y, on, color = C.mint) {
  disc(c, x, y, 19, C.navy, on ? color : C.rule, 4);
  disc(c, x, y, 7, on ? color : C.grid);
}
export function band(c, x, y, text, good = true, max = 660) {
  c.save();
  c.font = '600 30px "Lesson Sans"';
  const w = Math.min(max, c.measureText(text).width + 52);
  rect(c, x, y - 30, w, 60, good ? C.teal : C.red);
  label(c, text, x + 24, y, 30, { color: C.white, weight: 600, width: w - 48 });
  c.restore();
}
// The canary is the emblem printed beside a deployment observation.
export function bird(c, x, y, k = 1) {
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  function shape(p, fill) {
    c.beginPath();
    p();
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }
  shape(() => {
    c.moveTo(-58, 5);
    c.bezierCurveTo(-64, -26, -36, -42, -18, -26);
    c.bezierCurveTo(4, -18, 18, 5, 61, 15);
    c.lineTo(96, 37);
    c.lineTo(51, 29);
    c.bezierCurveTo(22, 38, -25, 48, -48, 18);
  }, C.gold);
  shape(() => {
    c.moveTo(-17, -8);
    c.bezierCurveTo(9, -8, 23, 12, 55, 19);
    c.bezierCurveTo(26, 25, -8, 18, -17, -8);
  }, '#b07530');
  shape(() => {
    c.moveTo(-59, -12);
    c.lineTo(-78, -6);
    c.lineTo(-57, 0);
  }, '#ba7548');
  disc(c, -44, -16, 4, C.ink);
  path(
    c,
    [
      [-13, 33],
      [-16, 46],
      [-26, 47],
    ],
    C.ink,
    2.5,
  );
  path(
    c,
    [
      [4, 34],
      [2, 46],
      [-6, 47],
    ],
    C.ink,
    2.5,
  );
  c.restore();
}
export function ruled(c, x, y, w, h, step = 40, color = '#b7c8b9') {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  for (let i = 0; i <= w; i += step)
    path(
      c,
      [
        [x + i, y],
        [x + i, y + h],
      ],
      color,
      1,
    );
  for (let j = 0; j <= h; j += step)
    path(
      c,
      [
        [x, y + j],
        [x + w, y + j],
      ],
      color,
      1,
    );
  c.restore();
}
// An effect is one verified backend transition. Keep unknown effects off the trace.
export function traffic(
  c,
  x,
  y,
  w,
  h,
  effects,
  { showResult = true, caption = 'Traffic changes', dark = false } = {},
) {
  const col = dark ? C.mint : C.teal,
    ink = dark ? C.white : C.ink;
  ruled(c, x, y, w, h, 34, dark ? C.grid : '#bdcabb');
  const mid = y + h * 0.63,
    high = y + h * 0.27,
    end = x + w - 18;
  label(c, caption, x, y - 26, 27, { color: ink });
  if (!showResult) return;
  if (effects !== null) {
    const pts = [[x + 15, mid]];
    if (effects === 1) pts.push([x + w * 0.7, mid], [x + w * 0.7, high]);
    pts.push([end, effects ? high : mid]);
    path(c, pts, col, 7);
    disc(c, ...pts.at(-1), 9, col);
  } else {
    path(
      c,
      [
        [x + 15, mid],
        [x + w * 0.42, mid],
      ],
      C.rule,
      5,
    );
    path(
      c,
      [
        [x + w * 0.42, mid],
        [end, mid],
      ],
      C.rule,
      3,
      [5, 12],
    );
  }
  mono(c, effects === null ? '?' : effects, end, y - 26, 34, ink, 'right');
}
export function lines(
  c,
  x,
  y,
  items,
  { gap = 68, size = 37, color = C.ink, face = 'Sans', width } = {},
) {
  items.forEach((s, i) => label(c, s, x, y + i * gap, size, { color, face, width }));
}
