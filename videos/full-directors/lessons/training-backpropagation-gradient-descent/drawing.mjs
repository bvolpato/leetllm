// The recorder uses a fixed blue prediction and a copper server contact.
export const C = {
  paper: '#f6f0df',
  ink: '#192e33',
  muted: '#4e6868',
  rule: '#bac6b7',
  light: '#e5e5d2',
  blue: '#145f9e',
  sky: '#96d9fe',
  hot: '#a24327',
  amber: '#ffb478',
  green: '#226a53',
  mint: '#92e0ad',
  dark: '#102f35',
  night: '#0b252a',
  wire: '#52716e',
  white: '#f9f5de',
};
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const mix = (a, b, t) => a + (b - a) * clamp(t);
export const f = (x, n = 3) => Number(x.toFixed(n)).toString().replace('-', '−');
export function cue(k, beat, phrase, seconds = 0.65) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  return k.reveal(phrase, seconds);
}
export function box(c, x, y, w, h, fill, stroke, r = 0) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.lineWidth = 1.3;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
export function line(c, x, y, u, v, color = C.rule, width = 1.5, dash = []) {
  c.save();
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
  c.restore();
}
export function dot(c, x, y, r, color, stroke) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fillStyle = color;
  c.fill();
  if (stroke) {
    c.lineWidth = 1.5;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
export function arrow(c, x, y, u, v, color = C.hot, width = 2.8) {
  if (Math.hypot(u - x, v - y) < 1) return;
  line(c, x, y, u, v, color, width);
  const t = Math.atan2(v - y, u - x);
  c.save();
  c.translate(u, v);
  c.rotate(t);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-9, -4.5);
  c.lineTo(-9, 4.5);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.restore();
}
export function txt(
  c,
  s,
  x,
  y,
  size = 20,
  color = C.ink,
  align = 'left',
  family = 'Sans',
  weight = 500,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(String(s), x, y);
}
export const mono = (c, s, x, y, size = 21, color = C.ink, align = 'left') =>
  txt(c, s, x, y, size, color, align, 'Mono');
export function head(c, s, sub) {
  txt(c, s, 49, 56, 36, C.ink, 'left', 'Serif', 500);
  if (sub) txt(c, sub, 51, 103, 19, C.muted);
}
export function ground(c) {
  c.scale(2, 2);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  box(c, 0, 0, 960, 540, C.paper);
}
export function graph(c, points, color, width = 3) {
  if (!points.length) return;
  c.beginPath();
  c.moveTo(...points[0]);
  for (const p of points.slice(1)) c.lineTo(...p);
  c.lineWidth = width;
  c.strokeStyle = color;
  c.stroke();
}
export function dim(c, x, u, y, msg, color = C.hot) {
  line(c, x, y, u, y, color, 2);
  line(c, x, y - 6, x, y + 6, color, 2);
  line(c, u, y - 6, u, y + 6, color, 2);
  mono(c, msg, (x + u) / 2, y + 23, 19, color, 'center');
}
export function signal(c, x, y, u, v, t, color) {
  line(c, x, y, u, v, C.rule, 2);
  if (t > 0) {
    line(c, x, y, mix(x, u, t), mix(y, v, t), color, 3.5);
    dot(c, mix(x, u, t), mix(y, v, t), 5, color);
  }
}
export function recorder(
  c,
  {
    previous,
    predicted,
    target,
    scan,
    arrived = true,
    token = true,
    miss = false,
    title = 'Token delivery',
    prompt = 'Ready, set,',
    revealPrediction = true,
  },
) {
  box(c, 48, 130, 864, 318, '#b8bfb2', C.muted, 16);
  box(c, 55, 137, 850, 304, '#d8dbcb', null, 12);
  for (const x of [69, 891])
    for (const y of [151, 428]) {
      dot(c, x, y, 4.6, '#a3ad9f', C.muted);
      line(c, x - 2, y + 2, x + 2, y - 2, C.muted, 1.2);
    }
  box(c, 83, 155, 794, 99, C.night, C.muted, 7);
  txt(c, title, 103, 176, 15, '#b3ccc2');
  mono(c, prompt, 111, 215, 30, C.white);
  const start = 111 + prompt.length * 18.1 + 11;
  if (arrived && token) mono(c, 'go', start, 215, 30, C.amber);
  box(c, start + (arrived && token ? 42 : 0), 200, 3, 30, C.mint);
  mono(c, f(scan, 2) + ' ms', 850, 211, 31, C.mint, 'right');
  const pos = (v) => 111 + v * 90;
  box(c, 83, 271, 794, 145, C.paper, C.rule, 4);
  for (let i = 0; i <= 32; i++) {
    const x = pos(i / 4);
    line(
      c,
      x,
      335,
      x,
      335 + (i % 4 === 0 ? 14 : i % 2 === 0 ? 9 : 5),
      C.muted,
      i % 4 === 0 ? 1.8 : 1,
    );
    if (i % 4 === 0) mono(c, String(i / 4), x, 365, 14, C.muted, 'center');
  }
  line(c, pos(0), 335, pos(8), 335, C.muted, 1.6);
  if (previous !== undefined) {
    line(c, pos(previous), 316, pos(previous), 342, C.muted, 2, [3, 3]);
    txt(c, 'old ' + f(previous), pos(previous), 394, 15, C.muted, 'center');
  }
  if (revealPrediction) {
    line(c, pos(predicted), 307, pos(predicted), 334, C.blue, 3);
    dot(c, pos(predicted), 334, 4.8, C.blue);
    mono(c, 'model ' + f(predicted), pos(predicted), 294, 18, C.blue, 'center');
  }
  const scanX = pos(scan);
  line(c, pos(0), 328, scanX, 328, '#7da994', 2);
  if (arrived) {
    line(c, pos(target), 305, pos(target), 335, C.hot, 3);
    dot(c, pos(target), 334, 5, C.hot);
    mono(c, 'server ' + f(target), pos(target), 294, 18, C.hot, 'center');
  } else dot(c, scanX, 328, 5, C.green);
  if (miss) dim(c, pos(predicted), pos(target), 380, f(target - predicted) + ' ms short', C.hot);
}
export function steps(c, labels, active, y = 163) {
  const gap = 830 / Math.max(1, labels.length - 1);
  labels.forEach((s, i) => {
    const x = 65 + i * gap;
    if (i < labels.length - 1) line(c, x, y, x + gap, y, i < active ? C.green : C.rule, 3);
    dot(c, x, y, i === active ? 8 : 5, i <= active ? C.green : C.rule);
    txt(c, s, x, y + 26, 16, i === active ? C.ink : C.muted, 'center');
  });
}
