// Coordinates are half the host canvas size.
export const C = {
  paper: '#f4ecd8',
  ivory: '#fff6dc',
  pale: '#d5d1bc',
  ink: '#182c32',
  navy: '#162a31',
  deep: '#0b2027',
  steel: '#516970',
  blue: '#77b8d1',
  teal: '#88ddbd',
  pine: '#206f60',
  brass: '#edba65',
  brassDark: '#89612b',
  red: '#ff9078',
  brick: '#ac4b36',
  dim: '#a5b8b6',
  track: '#395058',
};
export const mix = (a, b, t) => a + (b - a) * t;
export function rr(g, x, y, w, h, r, fill, outline) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
  if (outline) {
    g.lineWidth = 1;
    g.strokeStyle = outline;
    g.stroke();
  }
}
export function line(g, x, y, x2, y2, color, w = 2, dash = []) {
  g.save();
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x2, y2);
  g.strokeStyle = color;
  g.lineWidth = w;
  g.lineCap = 'round';
  g.setLineDash(dash);
  g.stroke();
  g.restore();
}
export function poly(g, pts, color) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fillStyle = color;
  g.fill();
}
export function dot(g, x, y, r, fill) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fillStyle = fill;
  g.fill();
}
export function txt(g, s, x, y, size = 18, color = C.ink, opt = {}) {
  const { font = 'Sans', w = 500, align = 'left', max = 900 } = opt;
  g.save();
  g.font = w + ' ' + size + 'px "Lesson ' + font + '"';
  g.textAlign = align;
  g.fillStyle = color;
  g.fillText(String(s), x, y, max);
  g.restore();
}
export const mono = (g, s, x, y, size = 17, color = C.ink, opts = {}) =>
  txt(g, s, x, y, size, color, { font: 'Mono', ...opts });
export const center = (g, s, x, y, size, color, opts = {}) =>
  txt(g, s, x, y, size, color, { align: 'center', ...opts });
export function screw(g, x, y, r = 3) {
  dot(g, x, y, r + 1, '#00000042');
  dot(g, x - 0.4, y - 0.6, r, '#a5a597');
  line(g, x - r * 0.6, y + r * 0.6, x + r * 0.6, y - r * 0.6, '#526260', 1);
}
export function gradient(g, x, y, x2, y2, ...colors) {
  const grad = g.createLinearGradient(x, y, x2, y2);
  colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
  return grad;
}
export function plate(g, x, y, w, h, light = false) {
  rr(g, x + 2, y + 5, w, h, 12, '#08191e34');
  rr(
    g,
    x,
    y,
    w,
    h,
    12,
    light
      ? gradient(g, x, y, x + w, y + h, '#eddeb9', '#d0bea0')
      : gradient(g, x, y, x + w, y + h, '#486168', '#1a343e', '#243b43'),
  );
  rr(g, x + 7, y + 7, w - 14, h - 14, 7, light ? C.paper : C.navy, light ? '#afab96' : '#627979');
  for (const dx of [14, w - 14]) for (const dy of [14, h - 14]) screw(g, x + dx, y + dy, 2.1);
}
export function heading(g, section, title, dark = false) {
  const bg = dark ? ['#152d35', '#0b2027'] : ['#faf2de', '#e6dfca'];
  g.fillStyle = gradient(g, 0, 0, 960, 540, ...bg);
  g.fillRect(0, 0, 960, 540);
  g.save();
  g.lineWidth = 0.8;
  g.strokeStyle = dark ? '#bbd5c70c' : '#6773660b';
  for (let x = 8; x < 960; x += 24) {
    g.beginPath();
    g.moveTo(x, 110);
    g.lineTo(x, 422);
    g.stroke();
  }
  for (let y = 110; y < 422; y += 24) {
    g.beginPath();
    g.moveTo(28, y);
    g.lineTo(932, y);
    g.stroke();
  }
  g.restore();
  rr(g, 35, 28, 26, 6, 3, dark ? C.brass : C.brick);
  mono(g, section.toUpperCase(), 72, 37, 13, dark ? C.dim : C.steel, { w: 600 });
  txt(g, title, 32, 88, 40, dark ? C.ivory : C.ink, { font: 'Serif', max: 898 });
  line(g, 36, 105, 924, 105, dark ? C.track : '#c4c0b0', 1);
}
export function footer(g, s, dark = false) {
  line(g, 37, 438, 923, 438, dark ? C.track : '#b6b5a6', 1);
  dot(g, 42, 462, 4, dark ? C.brass : C.pine);
  txt(g, s, 58, 469, 20, dark ? C.ivory : C.ink, { max: 865 });
}
export function tag(g, label, x, y, w, color = C.brass, fg = C.deep) {
  rr(g, x, y, w, 26, 5, color);
  center(g, label, x + w / 2, y + 19, 14, fg, { font: 'Mono', w: 600, max: w - 12 });
}
export function lamp(g, x, y, on, color = C.teal) {
  dot(g, x, y, 8, C.deep);
  dot(g, x, y, 5.4, on ? color : '#4b5c5e');
  if (on) dot(g, x - 1.3, y - 1.6, 1.5, C.ivory);
}
export function arrow(g, x, y, x2, y2, color, width = 2) {
  line(g, x, y, x2, y2, color, width);
  const a = Math.atan2(y2 - y, x2 - x);
  poly(
    g,
    [
      [x2, y2],
      [x2 - 10 * Math.cos(a - 0.44), y2 - 10 * Math.sin(a - 0.44)],
      [x2 - 10 * Math.cos(a + 0.44), y2 - 10 * Math.sin(a + 0.44)],
    ],
    color,
  );
}
export function packet(g, x, y, label, w = 92, color = C.brass) {
  rr(g, x - w / 2 + 2, y - 12, w, 30, 5, '#05171b30');
  rr(g, x - w / 2, y - 15, w, 30, 5, color);
  line(g, x - w / 2 + 7, y - 11, x - w / 2 + 7, y + 11, '#162c3250', 1.5);
  center(g, label, x + 2, y + 5, 14, C.deep, { font: 'Mono', w: 600, max: w - 18 });
}
export function screen(g, x, y, w, h) {
  rr(g, x, y, w, h, 7, '#0a1a20', '#5a6b68');
  rr(
    g,
    x + 4,
    y + 3,
    w - 8,
    h - 7,
    5,
    gradient(g, x, y, x + w, y + h, '#243f45', '#173136', '#193138'),
  );
}
export function terminal(
  g,
  x,
  y,
  w,
  h,
  { label, primary, minor = '', color = C.teal, kicker = 'AGENT' },
) {
  rr(g, x + w * 0.34, y + h - 2, w * 0.32, 16, 3, C.steel);
  rr(g, x + w * 0.16, y + h + 12, w * 0.68, 7, 3, '#334c51');
  plate(g, x, y, w, h, true);
  mono(g, kicker, x + 22, y + 28, 12, C.steel, { w: 700 });
  screen(g, x + 18, y + 40, w - 36, h - 59);
  mono(g, label, x + 29, y + 67, 13, C.dim, { max: w - 58 });
  txt(g, primary, x + 29, y + 105, 27, color, { font: 'Serif', max: w - 58 });
  mono(g, minor, x + 29, y + 132, 14, C.ivory, { max: w - 58 });
}
export function rack(
  g,
  x,
  y,
  w,
  h,
  { name = 'CONTROLLER', main = '', sub = '', color = C.teal, count = null },
) {
  plate(g, x, y, w, h);
  mono(g, name, x + 22, y + 34, 13, C.dim, { w: 600, max: w - 50 });
  for (let i = 0; i < 6; i++)
    line(g, x + w - 66 + i * 7, y + 21, x + w - 66 + i * 7, y + 31, '#849398', 2);
  for (let i = 0; i < 3; i++) {
    rr(g, x + 20, y + 50 + i * 25, w - 40, 18, 4, '#0d252d');
    lamp(g, x + 34, y + 59 + i * 25, i === 0 && !!main);
    line(g, x + 56, y + 60 + i * 25, x + w - 32, y + 60 + i * 25, C.track, 2);
  }
  if (main) {
    rr(g, x + 50, y + 49, w - 85, 20, 3, color);
    mono(g, main, x + 57, y + 64, 13, C.deep, { w: 600, max: w - 101 });
  }
  txt(g, sub, x + 22, y + h - 27, 17, C.ivory, { max: w - 44 });
  if (count !== null) mono(g, String(count) + ' QUEUED', x + 22, y + h - 54, 14, C.brass);
}
export function slip(g, x, y, w, h, head, rows, accent = C.pine) {
  rr(g, x + 3, y + 4, w, h, 3, '#07171d28');
  rr(g, x, y, w, h, 3, '#fbf0d4', '#c7bc9e');
  g.fillStyle = accent;
  g.fillRect(x, y, 5, h);
  mono(g, head.toUpperCase(), x + 17, y + 27, 13, accent, { w: 700, max: w - 35 });
  line(g, x + 17, y + 37, x + w - 17, y + 37, '#b6b19d', 1);
  rows.forEach((s, i) =>
    txt(g, s, x + 17, y + 65 + i * 25, i === 0 ? 21 : 16, C.ink, {
      font: i === 0 ? 'Serif' : 'Mono',
      max: w - 34,
    }),
  );
}
export function cueClock(clock) {
  const b = clock.beat.beatIndex + 1;
  function during(n, phrase) {
    if (b !== n) return Number(b > n);
    const { start, end } = clock.wordCue(phrase);
    return clock.reveal(phrase, end - start, { captionStart: phrase });
  }
  return {
    b,
    clock,
    cue(n, phrase, span = 0) {
      return b < n ? 0 : b > n ? 1 : clock.reveal(phrase, span);
    },
    during,
    settled(n, phrase) {
      return during(n, phrase) === 1;
    },
  };
}
