export const ink = '#193331',
  paper = '#f5eedb',
  muted = '#48645c',
  teal = '#006b60';
export const gold = '#f4ab38',
  rust = '#a63d27',
  sea = '#b9ded3',
  clay = '#f1c3a7';
export const pale = '#e6dfca',
  steel = '#899b91',
  white = '#fffaf0';

export const matrix = (rows, cols, fn) =>
  Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => fn(r, c)));
export const fmt = (v, d = 3) =>
  typeof v !== 'number'
    ? String(v)
    : Math.abs(v - 2 / 3) < 1e-8
      ? '2/3'
      : String(Number(v.toFixed(d))).replace('-', '−');
export const signed = (v) => (v > 0 ? '+' + fmt(v) : fmt(v));
export const total = (a) => a.flat().reduce((sum, v) => sum + v, 0);
export const index = (p, n) => Math.min(n - 1, Math.floor(p * n));
export const blend = (a, b, t) => a + (b - a) * t;
export const crop = (a, r, c, h = 3, w = h) => a.slice(r, r + h).map((row) => row.slice(c, c + w));
export function cue(t, b, phrase, sec = 0.65) {
  const i = t.beat.beatIndex;
  return i === b ? t.reveal(phrase, sec) : Number(i > b);
}

// Start a caption at the answer, and print the result when its clause has finished.
export function said(clock, beat, answer, following) {
  if (clock.beat.beatIndex !== beat) return clock.beat.beatIndex > beat;
  const started = clock.reveal(answer, 0);
  const finished = following ? clock.reveal(following, 0) : clock.elapsed >= clock.speechDuration;
  return Boolean(started && finished);
}

export function box(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}
export function outline(g, x, y, w, h, color = ink, lw = 2) {
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.strokeRect(x, y, w, h);
}
export function line(g, x1, y1, x2, y2, color = ink, lw = 2) {
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}
export function dot(g, x, y, r, color) {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fill();
}
export function arrow(g, x1, y1, x2, y2, color = teal, lw = 3) {
  line(g, x1, y1, x2, y2, color, lw);
  const a = Math.atan2(y2 - y1, x2 - x1);
  for (const d of [-0.52, 0.52])
    line(g, x2, y2, x2 - 12 * Math.cos(a + d), y2 - 12 * Math.sin(a + d), color, lw);
}
export function label(
  g,
  value,
  x,
  y,
  size = 22,
  color = ink,
  align = 'center',
  face = 'Sans',
  weight = 500,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(String(value), x, y);
}
export function mono(g, v, x, y, size = 24, color = ink, align = 'center') {
  label(g, v, x, y, size, color, align, 'Mono');
}
export function heading(g, v, x, y) {
  label(g, v, x, y, 24, ink, 'center', 'Serif', 600);
}
export function rule(g, v, { x = 600, y = 568, size = 23 } = {}) {
  if (y === 568) line(g, 70, 531, 1130, 531, steel, 1);
  label(g, v, x, y, size, ink, 'center', 'Sans', 500);
}
export function bracket(g, x, y, w, color = teal) {
  line(g, x, y, x + w, y, color, 3);
  line(g, x, y - 9, x, y + 2, color, 3);
  line(g, x + w, y - 9, x + w, y + 2, color, 3);
}
export function background(g, title) {
  box(g, 0, 0, 1200, 675, paper);
  box(g, 0, 0, 1200, 10, ink);
  for (let x = 20; x < 1200; x += 10) line(g, x, 11, x, x % 50 === 0 ? 22 : 15, steel, 1);
  label(g, title, 62, 70, 38, ink, 'left', 'Serif', 600);
  line(g, 58, 108, 1142, 108, ink, 1);
}
export function grid(g, a, x, y, s, opt = {}) {
  const {
    mode = 'map',
    show = () => true,
    print = (v) => fmt(v),
    mark,
    font = Math.min(27, s * 0.39),
    digits = true,
  } = opt;
  const cols = a[0].length;
  box(g, x - 3, y - 3, s * cols + 6, s * a.length + 6, ink);
  for (let r = 0; r < a.length; r++)
    for (let c = 0; c < cols; c++) {
      const v = a[r][c],
        visible = show(r, c),
        hot = mark?.(r, c);
      let fill = white,
        color = ink;
      if (mode === 'image' && typeof v === 'number') {
        const level = Math.round(41 + 190 * Math.min(1, Math.max(0, v)));
        fill = 'rgb(' + [level - 3, level + 2, level].join(',') + ')';
        color = level < 125 ? white : ink;
      } else if (visible && typeof v === 'number') {
        fill = v > 0 ? sea : v < 0 ? clay : pale;
        color = v < 0 ? rust : ink;
      }
      if (!visible) fill = '#e9e4d6';
      box(g, x + c * s + 1, y + r * s + 1, s - 2, s - 2, fill);
      if (digits && visible) mono(g, print(v, r, c), x + (c + 0.5) * s, y + (r + 0.51) * s, font, color);
      if (hot) outline(g, x + c * s + 3, y + r * s + 3, s - 6, s - 6, hot === true ? gold : hot, 4);
    }
}
export function windowOn(g, x, y, s, r, c, h = 3, w = h, color = gold) {
  const l = x + c * s,
    top = y + r * s;
  outline(g, l + 2, top + 2, w * s - 4, h * s - 4, color, 5);
  for (const [dx, dy] of [
    [0, 0],
    [w * s, 0],
    [0, h * s],
    [w * s, h * s],
  ]) {
    const sx = dx ? -1 : 1,
      sy = dy ? -1 : 1;
    line(g, l + dx, top + dy, l + dx + sx * 13, top + dy, ink, 3);
    line(g, l + dx, top + dy, l + dx, top + dy + sy * 13, ink, 3);
  }
}
function screw(g, x, y) {
  dot(g, x, y, 5, muted);
  line(g, x - 2.5, y + 2.5, x + 2.5, y - 2.5, paper, 1);
}
export function carrier(g, x, y, w, h) {
  box(g, x + 5, y + 6, w, h, '#c6c3af');
  const grad = g.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#d7dfd1');
  grad.addColorStop(0.45, '#8ca09a');
  grad.addColorStop(1, '#cbcec0');
  box(g, x, y, w, h, grad);
  outline(g, x, y, w, h, muted, 2);
  for (const dx of [9, w - 9]) for (const dy of [9, h - 9]) screw(g, x + dx, y + dy);
}
export function mounted(g, a, x, y, s, opt = {}) {
  carrier(g, x - 17, y - 17, s * a[0].length + 34, s * a.length + 34);
  grid(g, a, x, y, s, { mode: 'image', ...opt });
}
export function panelPhoto(g, x, y, w, h, mark = 'center') {
  carrier(g, x, y, w, h);
  const grad = g.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#3c5354');
  grad.addColorStop(0.48, '#8da09b');
  grad.addColorStop(0.52, '#728784');
  grad.addColorStop(1, '#506866');
  box(g, x + 19, y + 15, w - 38, h - 30, grad);
  for (let i = 0; i < 20; i++) {
    const yy = y + 20 + (i * (h - 39)) / 20;
    line(g, x + 24, yy, x + w - 25, yy, 'rgba(242,247,229,0.13)', 1);
  }
  const cx = mark === 'border' ? x + 28 : x + w * 0.53,
    cy = mark === 'border' ? y + 23 : y + h * 0.55;
  line(g, cx - 2, cy + 4, cx + 5, cy + 1, '#fffbe9', 2.5);
  line(g, cx + 5, cy + 1, cx + 10, cy - 6, '#fffbe9', 2.5);
  outline(g, cx - 12, cy - 13, 32, 28, gold, 2);
}
