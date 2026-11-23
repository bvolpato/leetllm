import { drawBlender } from './blender.mjs';

export const C = {
  ink: '#203539',
  sub: '#50635f',
  rule: '#a9b7a9',
  paper: '#f6f0dc',
  cream: '#fff9e6',
  formal: '#a6412d',
  conversational: '#285672',
  green: '#226950',
  greenPale: '#cee1c4',
  yellow: '#f2ce79',
  dark: '#163f42',
  white: '#fcf9e9',
  brick: '#963f33',
  faint: '#dedecb',
};
export const wordings = ['formal', 'conversational'];
export const names = { formal: 'Formal', conversational: 'Conversational' };
export const mix = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);
export function timing(clock) {
  const b = clock.beat.beatIndex + 1;
  return {
    b,
    clock,
    at(n, phrase, duration = 0) {
      if (b !== n) return Number(b > n);
      return clock.reveal(phrase, duration);
    },
    after(n, phrase) {
      if (b !== n) return b > n;
      const { start, end } = clock.wordCue(phrase);
      return clock.reveal(phrase, end - start, { captionStart: phrase }) === 1;
    },
    end(n) {
      return b === n ? clock.elapsed >= clock.speechDuration : b > n;
    },
  };
}
export function paint(ctx) {
  ctx.scale(1.6, 1.6);
  function rect(x, y, w, h, color, r = 0) {
    ctx.fillStyle = color;
    if (!r) return ctx.fillRect(x, y, w, h);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
  function line(x, y, x2, y2, color = C.rule, w = 1) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = w;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  function dot(x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function type(
    str,
    x,
    y,
    size = 22,
    color = C.ink,
    align = 'left',
    face = 'Sans',
    weight = 400,
    max = Infinity,
  ) {
    ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = color;
    if (ctx.measureText(str).width > max)
      ctx.font =
        weight +
        ' ' +
        Math.floor((size * max) / ctx.measureText(str).width) +
        'px "Lesson ' +
        face +
        '"';
    ctx.fillText(String(str), x, y);
  }
  const serif = (str, x, y, size = 46, color = C.ink, align = 'left', max = Infinity) =>
    type(str, x, y, size, color, align, 'Serif', 400, max);
  const mono = (str, x, y, size = 20, color = C.sub, align = 'left') =>
    type(str, x, y, size, color, align, 'Mono', 500);
  function ground(dark = false) {
    const stops = dark ? ['#194a4b', '#133b3e'] : ['#fbf6e5', '#e7e7d4'];
    const grad = ctx.createLinearGradient(0, 0, 1200, 675);
    grad.addColorStop(0, stops[0]);
    grad.addColorStop(1, stops[1]);
    rect(0, 0, 1200, 675, grad);
    for (let i = 0; i < 340; i++)
      rect((i * 541) % 1200, (i * 239) % 675, 1.4, 0.9, dark ? '#e6efd920' : '#65441b17');
  }
  function head(kicker, title, dark = false) {
    mono(kicker, 55, 53, 16, dark ? C.yellow : C.sub);
    serif(title, 54, 118, 48, dark ? C.white : C.ink, 'left', 1100);
  }
  function paper(x, y, w, h, fill = C.cream) {
    rect(x + 4, y + 6, w, h, '#183a3c26', 3);
    rect(x, y, w, h, fill, 3);
  }
  function slip(x, y, w, h, key, label, size = 22) {
    const color = C[key];
    ctx.beginPath();
    ctx.moveTo(x + 8, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + 8, y + h);
    ctx.lineTo(x, y + h - 8);
    ctx.lineTo(x, y + 8);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    type(label, x + w / 2, y + h / 2 + size * 0.34, size, C.white, 'center', 'Sans', 600, w - 14);
  }
  function blender(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    drawBlender(ctx, 0, 0);
    ctx.restore();
  }
  function receipt(x, y, w = 208) {
    paper(x, y, w, 137);
    mono('SALES RECEIPT', x + 16, y + 28, 15);
    line(x + 16, y + 41, x + w - 16, y + 41);
    type('Blender', x + 16, y + 71, 23);
    type('Day 12 of 30', x + 16, y + 111, 23, C.ink, 'left', 'Mono');
    for (let i = 0; i < 24; i++) {
      const bx = x + ((i + 0.5) * w) / 24;
      line(bx, y + 131, bx + w / 48, y + 136, '#c9c5ae', 2);
    }
  }
  function rule(x, y, w, a, b, step, label, ink = C.sub) {
    line(x, y, x + w, y, ink, 2);
    for (let i = 0; i <= Math.round((b - a) / step); i++) {
      const val = a + step * i,
        px = x + (w * (val - a)) / (b - a);
      line(px, y, px, y + 8, ink, 1);
      mono(label(val), px, y + 31, 16, ink, 'center');
    }
  }
  return {
    ctx,
    rect,
    line,
    dot,
    type,
    serif,
    mono,
    ground,
    head,
    paper,
    slip,
    blender,
    receipt,
    rule,
  };
}
