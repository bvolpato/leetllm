// The recorder has two physical registers: black ink for observed bytes and
// vermilion pencil for proposals. Teal marks records the host has selected.
export const C = {
  paper: '#f5eedc',
  white: '#fffaf0',
  edge: '#d4c9ad',
  ink: '#182f33',
  dim: '#546966',
  teal: '#087869',
  pale: '#b8dfc9',
  brick: '#a53f2e',
  blush: '#f3cfb9',
  gold: '#a66a19',
  amber: '#f1c471',
  blue: '#265776',
  ice: '#cae0e8',
  steel: '#324e51',
  dark: '#172d31',
  night: '#112629',
  mist: '#adc3bc',
  violet: '#65577a',
  lilac: '#e1dce9',
};
export const fmt = (n) => n.toLocaleString('en-US');
export const smooth = (x) => x * x * (3 - 2 * x);
export function atelier(ctx, clock, night = false) {
  const bg = night ? C.night : C.paper,
    ink = night ? C.white : C.ink,
    dim = night ? C.mist : C.dim;
  const b = clock.beat.beatIndex + 1;
  const move = (beat, phrase, seconds = 0.8) =>
    b < beat ? 0 : b > beat ? 1 : clock.reveal(phrase, seconds);
  const at = (beat, phrase) => move(beat, phrase, 0) === 1;
  function after(beat, phrase, captionStart) {
    if (b !== beat) return b > beat;
    const { start, end } = clock.wordCue(phrase);
    return clock.reveal(phrase, end - start, { captionStart }) === 1;
  }
  function box(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  function rule(x, y, X, Y, color = dim, width = 2) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(X, Y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  function dot(x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function text(value, x, y, size = 42, color = ink, opt = {}) {
    ctx.save();
    ctx.font = (opt.bold ? '700 ' : '400 ') + size + 'px "Lesson ' + (opt.font || 'Sans') + '"';
    ctx.textAlign = opt.align || 'left';
    ctx.fillStyle = color;
    ctx.fillText(String(value), x, y, opt.width || 1800);
    ctx.restore();
  }
  const mono = (v, x, y, size = 32, col = ink, w = 1700) =>
    text(v, x, y, size, col, { font: 'Mono', width: w });
  const label = (v, x, y, col = dim, size = 26) => mono(v, x, y, size, col);
  const title = (v, x = 104, y = 155, size = 71, col = ink) =>
    text(v, x, y, size, col, { font: 'Serif', width: 1712 });
  function sheet(x, y, w, h, fill = C.white) {
    box(x + 7, y + 9, w, h, night ? '#091e20' : '#d5cdbb');
    box(x, y, w, h, fill);
    for (let xx = x + 24; xx < x + w - 15; xx += 44)
      box(xx, y + 12, 12, 7, night ? '#7a8c83' : C.edge);
  }
  function housing(x, y, w, h) {
    box(x + 8, y + 10, w, h, '#b9b39f');
    box(x, y, w, h, C.steel);
    box(x + 12, y + 12, w - 24, h - 24, C.dark);
    for (const xx of [x + 24, x + w - 24])
      for (const yy of [y + 24, y + h - 24]) {
        dot(xx, yy, 6, '#81918b');
        rule(xx - 3, yy + 2, xx + 3, yy - 2, C.dark, 1.5);
      }
  }
  function strip(x, y, w, name, value, source, tint = C.white) {
    sheet(x, y, w, 164, tint);
    label(name, x + 30, y + 60, C.dim, 25);
    text(value, x + 30, y + 127, 49, C.ink, { font: 'Serif', width: w - 58 });
    if (source)
      text(source, x + w - 26, y + 58, 24, C.dim, {
        font: 'Mono',
        align: 'right',
        width: w * 0.47,
      });
  }
  function tick(x, y, good, color = good ? C.teal : C.brick, r = 21) {
    dot(x, y, r, color);
    if (good) {
      rule(x - r * 0.48, y, x - r * 0.13, y + r * 0.35, C.white, 4);
      rule(x - r * 0.13, y + r * 0.35, x + r * 0.51, y - r * 0.37, C.white, 4);
    } else {
      rule(x - r * 0.35, y - r * 0.35, x + r * 0.35, y + r * 0.35, C.white, 4);
      rule(x - r * 0.35, y + r * 0.35, x + r * 0.35, y - r * 0.35, C.white, 4);
    }
  }
  function badge(v, x, y, w, color = C.teal) {
    box(x, y, w, 59, color);
    text(v, x + w / 2, y + 40, 30, C.white, { bold: true, align: 'center', width: w - 20 });
  }
  function bar(x, y, w, h, items, total, colors) {
    box(x, y, w, h, night ? C.steel : C.edge);
    let pos = x;
    items.forEach((item, i) => {
      const span = (w * item) / total;
      if (span > 0) box(pos, y, Math.max(1, span - 2), h, colors[i]);
      pos += span;
    });
  }
  function stepRow(x, y, w, name, value, color = ink) {
    rule(x, y + 15, x + w, y + 15, night ? C.steel : C.edge, 2);
    text(name, x, y, 33, dim, { width: w * 0.51 });
    text(value, x + w, y, 36, color, { font: 'Mono', align: 'right', width: w * 0.48 });
  }
  function route(x, y, X, Y, col = C.teal, width = 6) {
    const mid = (x + X) / 2;
    rule(x, y, mid, y, col, width);
    rule(mid, y, mid, Y, col, width);
    rule(mid, Y, X, Y, col, width);
    dot(x, y, 9, col);
    dot(X, Y, 9, col);
  }
  box(0, 0, 1920, 1080, bg);
  return {
    ctx,
    clock,
    b,
    at,
    after,
    move,
    bg,
    ink,
    dim,
    box,
    rule,
    dot,
    text,
    mono,
    label,
    title,
    sheet,
    housing,
    strip,
    tick,
    badge,
    bar,
    stepRow,
    route,
  };
}
