// The telephone shell and receiver use the artwork from the approved six-line short.
import { desk, cord, handset, housing, lamp } from './telephone.mjs';

export const C = {
  paper: '#f3ebd7',
  page: '#fff8e8',
  ink: '#183c3c',
  muted: '#576a61',
  teal: '#236c65',
  rust: '#a33d2b',
  gold: '#875c15',
  rule: '#a7b1a0',
  mint: '#b3d9c7',
  rose: '#f1c5b3',
  blue: '#356078',
  dark: '#183e40',
};
export const mix = (a, b, q) => a + (b - a) * q;
export const beat = (k) => k.beat.beatIndex + 1;
export function cue(k, b, phrase, span = 0) {
  return beat(k) > b ? 1 : beat(k) < b ? 0 : k.reveal(phrase, span);
}
export function studio(ctx) {
  function box(x, y, w, h, color, r = 0) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function line(x, y, u, v, color = C.rule, width = 3) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(u, v);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  function dot(x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function txt(s, x, y, size = 44, color = C.ink, opts = {}) {
    ctx.save();
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = 'middle';
    const font = (n) => (opts.w || 500) + ' ' + n + 'px "Lesson ' + (opts.face || 'Sans') + '"';
    ctx.font = font(size);
    const width = ctx.measureText(String(s)).width;
    if (opts.max && width > opts.max) ctx.font = font(Math.floor((size * opts.max) / width));
    ctx.fillStyle = color;
    ctx.fillText(String(s), x, y);
    ctx.restore();
  }
  const mid = (s, x, y, size, color, opt = {}) =>
    txt(s, x, y, size, color, { ...opt, align: 'center' });
  const num = (s, x, y, size = 40, color = C.ink, opt = {}) =>
    txt(s, x, y, size, color, { ...opt, face: 'Mono' });
  const title = (s, x = 105, y = 119) => txt(s, x, y, 76, C.ink, { face: 'Serif', max: 1710 });
  function surface(kind = 'paper') {
    if (kind === 'desk') {
      desk(ctx);
      return;
    }
    const g = ctx.createLinearGradient(0, 0, 1600, 1080);
    g.addColorStop(0, kind === 'lab' ? '#dfebe2' : '#fff9e8');
    g.addColorStop(1, kind === 'lab' ? '#b5cec6' : '#e4d7b8');
    box(0, 0, 1920, 1080, g);
  }
  function paper(x, y, w, h) {
    box(x + 8, y + 10, w, h, '#324c4624', 9);
    box(x, y, w, h, C.page, 9);
  }
  function cap(s, x, y, size = 27, color = C.muted) {
    txt(s.toUpperCase(), x, y, size, color, { w: 700 });
  }
  function stamp(s, x, y, color = C.rust, max = 690) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.022);
    ctx.font = '700 44px "Lesson Sans"';
    const w = Math.min(ctx.measureText(s).width + 58, max);
    box(0, 0, w, 76, color, 7);
    mid(s, w / 2, 39, 43, C.page, { max: w - 32, w: 700 });
    ctx.restore();
  }
  function lock(x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.arc(46, 42, 29, Math.PI, 0);
    ctx.lineTo(75, 64);
    ctx.stroke();
    line(17, 40, 17, 64, C.ink, 13);
    box(0, 54, 92, 77, C.gold, 10);
    dot(46, 82, 9, C.page);
    line(46, 87, 46, 104, C.page, 7);
    ctx.restore();
  }
  function phone(x, y, s, caption, lit, sub, shake = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    cord(ctx);
    housing(ctx);
    handset(ctx, shake);
    box(652, 183, 915, 96, C.dark, 18);
    mid(caption, 1110, 232, 62, C.page, { max: 845 });
    lamp(ctx, 1108, 425, Number(lit));
    mid(sub, 1108, 589, 66, C.ink, { max: 825, face: 'Serif' });
    for (let j = 0; j < 4; j++) line(821, 690 + j * 15, 1395, 690 + j * 15, '#999e8b', 6);
    ctx.restore();
  }
  function book(x, y, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    box(5, 10, 320, 215, '#687b68', 6);
    box(0, 0, 320, 209, C.page, 6);
    box(0, 0, 23, 209, C.teal, 3);
    line(40, 33, 289, 33, C.rule, 3);
    txt('Key rotation', 42, 88, 45, C.ink, { face: 'Serif' });
    txt('guide', 42, 141, 43, C.ink, { face: 'Serif' });
    box(244, 0, 32, 42, C.rust);
    ctx.restore();
  }
  function lampAt(x, y, lit, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    lamp(ctx, 0, 0, Number(lit));
    ctx.restore();
  }
  function grid(x, y, width, headers, rows, widths, { step = 83, size = 42, accent = -1 } = {}) {
    const xs = widths.map((_, i) => x + width * widths.slice(0, i).reduce((a, b) => a + b, 0));
    headers.forEach((v, i) =>
      txt(v, xs[i] + 12, y, 30, C.muted, { w: 700, max: width * widths[i] - 20 }),
    );
    line(x, y + 34, x + width, y + 34, C.ink, 3);
    rows.forEach((r, j) => {
      const yy = y + step * (j + 1);
      if (j === accent) box(x, yy - step * 0.43, width, step * 0.85, '#d3e4d1', 6);
      r.forEach((v, i) => {
        const [value, color] = Array.isArray(v) ? v : [v, C.ink];
        txt(value, xs[i] + 12, yy, size, color, {
          max: width * widths[i] - 24,
          face: i === 0 ? 'Sans' : 'Sans',
        });
      });
      line(x, yy + step * 0.47, x + width, yy + step * 0.47, C.rule, 1.5);
    });
  }
  return {
    ctx,
    box,
    line,
    dot,
    txt,
    mid,
    num,
    title,
    surface,
    paper,
    cap,
    stamp,
    lock,
    phone,
    book,
    lampAt,
    grid,
  };
}
export function vec(row, d = 3) {
  return '[' + row.map((v) => Number(v.toFixed(d))).join(', ') + ']';
}
