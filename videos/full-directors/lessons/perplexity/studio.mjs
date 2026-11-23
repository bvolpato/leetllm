export const ink = '#253945',
  red = '#ab3b28',
  teal = '#17685e',
  gold = '#ae813e';
export const dim = '#526465',
  rule = '#ababa0',
  cream = '#fff7e4',
  blue = '#305c80';
export const mint = '#9dcbb9',
  ochre = '#e7bd74',
  light = '#e4eee5';
export const mix = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);
export const fix = (n, k = 3) => n.toFixed(k);
export const sum = (a) => a.reduce((v, n) => v + n, 0);
export const surprise = (p) => -Math.log(p);
export const loss = (ps) => sum(ps.map(surprise));
export const cat = { words: ['on', 'the', 'mat'], probs: [0.5, 0.1, 0.8] };
export const fresh = { pieces: ['The', ' cat', ' sat', ' down'], probs: [0.4, 0.25, 0.2, 0.5] };
export const rain = {
  line: 'Rain falls now',
  readings: [
    { name: 'Subword', pieces: ['Rain', ' falls', ' n', 'ow'], nats: 8.4 },
    { name: 'Character', pieces: [...'Rain falls now'], nats: 9 },
  ],
};
export const rate = (nats, bytes) => nats / (bytes * Math.LN2);
export const bytes = (str) => Buffer.byteLength(str, 'utf8');

export function cue(clock, beatIndex, phrase, seconds = 0.65) {
  if (clock.beat.beatIndex !== beatIndex) return Number(clock.beat.beatIndex > beatIndex);
  return ease(clock.reveal(phrase, seconds));
}

export function afterPhrase(clock, beatIndex, phrase, captionStart = phrase) {
  if (clock.beat.beatIndex !== beatIndex) return clock.beat.beatIndex > beatIndex;
  clock.reveal(phrase, 0, { captionStart });
  return clock.elapsed + 1e-9 >= clock.wordCue(phrase).end;
}

export function canvas(ctx) {
  function text(str, x, y, size = 42, color = ink, opts = {}) {
    const { family = 'Sans', weight = 400, align = 'left', max = Infinity } = opts;
    ctx.fillStyle = color;
    ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
    const width = ctx.measureText(String(str)).width;
    if (width > max)
      ctx.font = weight + ' ' + Math.floor((size * max) / width) + 'px "Lesson ' + family + '"';
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(str), x, y);
  }
  const serif = (str, x, y, size = 72, color = ink, opts = {}) =>
    text(str, x, y, size, color, { family: 'Serif', ...opts });
  const mono = (str, x, y, size = 38, color = ink, opts = {}) =>
    text(str, x, y, size, color, { family: 'Mono', ...opts });
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  function line(x, y, u, v, color = rule, width = 3) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(u, v);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  function poly(points, color) {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  function circle(x, y, r, fill, stroke, width = 3) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }
  function fade(t, fn) {
    if (t <= 0) return;
    ctx.save();
    ctx.globalAlpha *= t;
    fn();
    ctx.restore();
  }
  function stock(x, y, w, h, fill = cream) {
    rect(x + 6, y + 9, w, h, '#13242b24');
    rect(x, y, w, h, fill);
    line(x, y + h - 2, x + w, y + h - 2, '#9a886c55', 3);
  }
  function ground(dark = false) {
    const g = ctx.createLinearGradient(0, 0, 1680, 1080);
    g.addColorStop(0, dark ? '#233f47' : '#faf1da');
    g.addColorStop(1, dark ? '#172d33' : '#e9debf');
    rect(0, 0, 1920, 1080, g);
    // A fixed grain keeps the impression on the same stock as the type moves.
    for (let i = 0; i < 560; i++) {
      rect(
        (i * 337 + 17 * (i % 13)) % 1920,
        (i * 137 + 3 * i * i) % 1080,
        2 + (i % 7),
        1,
        dark ? '#f0e5bc0b' : '#684c2817',
      );
    }
  }
  function heading(str, dark = false) {
    serif(str, 100, 147, 76, dark ? cream : ink, { max: 1720 });
  }
  function bracket(x, y, w, label, color = teal) {
    line(x, y - 17, x, y, color, 4);
    line(x, y, x + w, y, color, 4);
    line(x + w, y, x + w, y - 17, color, 4);
    if (label) text(label, x + w / 2, y + 51, 36, color, { align: 'center', max: w + 100 });
  }
  function impression(str, x, y, size = 70, color = ink, opts = {}) {
    serif(str, x + 1.4, y + 1.7, size, '#77644730', opts);
    serif(str, x, y, size, color, opts);
  }
  return {
    ctx,
    text,
    serif,
    mono,
    rect,
    line,
    poly,
    circle,
    fade,
    stock,
    ground,
    heading,
    bracket,
    impression,
  };
}
export const center = { align: 'center' };

// Every cell in a row occupies the width of one byte of the ASCII specimen.
// A space gets a visible middle dot and keeps its original byte position.
export function typeRow(p, row, x, y, unit, options = {}) {
  const { dark = false, color = teal, height = 106, font = 60, showCuts = true } = options;
  let start = 0;
  for (const piece of row) {
    const w = piece.length * unit;
    p.rect(x + start * unit + 4, y, w - 8, height, dark ? '#385158' : '#fff9e9');
    if (showCuts) {
      p.rect(x + start * unit + 5, y + height - 8, w - 10, 6, color);
      p.rect(x + start * unit + 5, y + height - 19, 4, 16, color);
      p.rect(x + (start + piece.length) * unit - 9, y + height - 19, 4, 16, color);
    }
    [...piece].forEach((ch, i) =>
      p.mono(
        ch === ' ' ? '·' : ch,
        x + (start + i + 0.5) * unit,
        y + height * 0.69,
        font,
        dark ? cream : ink,
        center,
      ),
    );
    start += piece.length;
  }
}
