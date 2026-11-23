import { lessonFont } from '../../../lib/fonts.mjs';
// The ticket strips keep their ink colors and registration marks through each operation.
export const ink = '#163b3e',
  paper = '#fff6dc',
  light = '#ede4c9',
  muted = '#506765';
export const teal = '#006e69',
  rust = '#ae472e',
  blue = '#2d5787',
  green = '#23734b',
  gold = '#edb154';
export const mint = '#bde3d0',
  apricot = '#f9cfad',
  pale = '#d2e3eb';
export const splitNames = ['train', 'validation', 'test'];
export const shortHash = (s) => s.slice(0, 12);
export const mix = (a, b, t) => a + (b - a) * t;
export function painter(ctx, clock) {
  ctx.scale(2, 2);
  const beat = clock.beat.beatIndex + 1;
  const cue = (b, words, duration = 0) =>
    beat > b ? 1 : beat < b ? 0 : clock.reveal(words, duration);
  const rect = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  const line = (x, y, X, Y, c = ink, w = 1) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(X, Y);
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.stroke();
  };
  const dot = (x, y, r, c) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  };
  const label = (str, x, y, size = 20, color = ink, opts = {}) => {
    const { face = 'Sans', weight = 500, align = 'left', max = 920 } = opts;
    ctx.font = lessonFont(size, face.toLowerCase(), weight);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(str), x, y, max);
  };
  const mono = (str, x, y, size = 18, c = ink, max = 920) =>
    label(str, x, y, size, c, { face: 'Mono', max });
  const title = (str, x, y, size = 34, c = ink, max = 880) =>
    label(str, x, y, size, c, { face: 'Serif', max });
  const center = (str, x, y, size = 20, c = ink, max = 920) =>
    label(str, x, y, size, c, { align: 'center', max });
  const ground = (name, dark = false) => {
    const g = ctx.createLinearGradient(0, 0, 960, 540);
    g.addColorStop(0, dark ? '#15383c' : '#e5e5d4');
    g.addColorStop(1, dark ? '#09262c' : '#f5eedc');
    rect(0, 0, 960, 540, g);
    if (name) {
      mono(name, 40, 39, 15, dark ? mint : teal);
      line(40, 54, 920, 54, dark ? '#557571' : '#acb5a4');
    }
  };
  const strip = (x, y, w, h, color = paper, edge = ink) => {
    rect(x + 2, y + 4, w, h, '#173b3b29');
    rect(x, y, w, h, color);
    rect(x, y, 7, h, edge);
    line(x + 8, y + 1, x + w - 1, y + 1, '#ffffff68');
    line(x + w - 18, y + 2, x + w - 18, y + h - 2, '#83918847');
    line(x + 7, y + h - 1, x + w - 1, y + h - 1, '#61756c45');
    for (let i = 11; i < h - 3; i += 17) dot(x + w - 10, y + i, 2.5, '#9b9e8d');
  };
  const ticket = (x, y, w, h, id, body, meta, color = paper, edge = ink) => {
    strip(x, y, w, h, color, edge);
    mono(id, x + 20, y + 26, 16, edge, w - 46);
    title(body, x + 20, y + h * 0.62, Math.min(30, h * 0.3), ink, w - 47);
    if (meta) label(meta, x + 20, y + h - 12, 16, muted, { max: w - 45 });
  };
  const chip = (str, x, y, w, h, c = teal, fg = paper, size = 20) => {
    rect(x, y, w, h, c);
    center(str, x + w / 2, y + h * 0.5 + size * 0.34, size, fg, w - 12);
  };
  const arrow = (x, y, X, Y, c = teal, w = 3) => {
    line(x, y, X, Y, c, w);
    const a = Math.atan2(Y - y, X - x);
    line(X, Y, X - 11 * Math.cos(a - 0.55), Y - 11 * Math.sin(a - 0.55), c, w);
    line(X, Y, X - 11 * Math.cos(a + 0.55), Y - 11 * Math.sin(a + 0.55), c, w);
  };
  const table = (columns, rows, top = 130, gap = 52) => {
    columns.forEach(([x, w, name]) => mono(name, x, top - 18, 15, teal, w - 12));
    line(40, top - 6, 920, top - 6, ink, 2);
    rows.forEach((row, i) => {
      const y = top + i * gap;
      if (i % 2 === 0) rect(40, y, 880, gap - 1, '#ffffff59');
      columns.forEach(([x, w], k) => {
        const item = row[k] ?? '';
        const [value, color] = Array.isArray(item) ? item : [item, ink];
        label(value, x, y + gap * 0.62, Math.min(23, gap * 0.52), color, { max: w - 12 });
      });
    });
  };
  return {
    ctx,
    clock,
    beat,
    cue,
    rect,
    line,
    dot,
    label,
    mono,
    title,
    center,
    ground,
    strip,
    ticket,
    chip,
    arrow,
    table,
  };
}
