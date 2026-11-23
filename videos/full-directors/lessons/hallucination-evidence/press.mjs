import { firstFrameAt, fps } from '../../../director-cuts/lesson-runtime/timeline.mjs';

// The camera frames the composing desk in 1440 x 810 design units.
export const P = {
  ink: '#182f3c',
  deep: '#102b37',
  steel: '#54727b',
  dim: '#46616b',
  rule: '#b3b6a6',
  paper: '#fff5dc',
  sheet: '#f1e4c8',
  white: '#fffae9',
  teal: '#11675f',
  mint: '#87d8bd',
  red: '#963c3a',
  rose: '#ffaca1',
  gold: '#f2c16c',
  ochre: '#805615',
};
export function paint(ctx, clock) {
  ctx.scale(4 / 3, 4 / 3);
  const b = clock.beat.beatIndex + 1;
  function cue(beat, phrase, span = 0.55) {
    if (b !== beat) return b > beat ? 1 : 0;
    return clock.reveal(phrase, span);
  }
  function after(beat, phrase, span = 0) {
    if (b !== beat) return b > beat ? 1 : 0;
    clock.reveal(phrase, 0, { captionStart: phrase });
    const elapsed = clock.elapsed - firstFrameAt(clock.wordCue(phrase).end) / fps;
    if (span === 0) return Number(elapsed >= 0);
    return Math.max(0, Math.min(1, elapsed / span));
  }
  function rect(x, y, w, h, color, r = 0) {
    ctx.fillStyle = color;
    if (!r) {
      ctx.fillRect(x, y, w, h);
      return;
    }
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
  function dot(x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function path(points, color) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    points.slice(1).forEach((pt) => ctx.lineTo(...pt));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  function line(x, y, xx, yy, color = P.rule, width = 2, dashed = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(xx, yy);
    ctx.stroke();
    ctx.restore();
  }
  function txt(str, x, y, size = 32, color = P.ink, face = 'Sans', opts = {}) {
    ctx.fillStyle = color;
    ctx.textAlign = opts.align ?? 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = (opts.bold ? 700 : 400) + ' ' + size + 'px "Lesson ' + face + '"';
    ctx.fillText(String(str), x, y, opts.w ?? 2000);
  }
  function label(str, x, y, color = P.dim, size = 19) {
    txt(str, x, y, size, color, 'Mono');
  }
  function headline(str, x = 70, y = 135) {
    txt(str, x, y, 55, P.ink, 'Serif', { w: 1300 });
  }
  function alpha(a, fn) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    fn();
    ctx.restore();
  }
  function field(name, value, x, y, w, opts = {}) {
    label(name, x, y, opts.dark ? P.mint : P.dim);
    line(x, y + 81, x + w, y + 81, opts.dark ? P.steel : P.rule, 2, !value);
    if (value)
      txt(
        value,
        x,
        y + 62,
        opts.size ?? 43,
        opts.color ?? (opts.dark ? P.white : P.ink),
        opts.face ?? 'Serif',
        { w },
      );
  }
  function paper(x, y, w, h, fill = P.paper) {
    rect(x + 5, y + 8, w, h, '#172c3633', 4);
    rect(x + 2, y + 4, w, h, '#a59d86', 3);
    rect(x, y, w, h, fill, 3);
  }
  function punchStrip(x, y, w, h, fill = P.paper) {
    paper(x, y, w, h, fill);
    line(x + 38, y + 3, x + 38, y + h - 3, '#b3a98b', 1, true);
    for (let py = y + 21; py < y + h - 12; py += 43) dot(x + 17, py, 6, P.deep);
  }
  function stage(kicker, mode = 'paper') {
    const dark = mode === 'dark';
    const gradient = ctx.createLinearGradient(0, 0, 1440, 810);
    gradient.addColorStop(0, dark ? '#193f49' : '#f7edd6');
    gradient.addColorStop(1, dark ? '#102734' : '#ded2b5');
    rect(0, 0, 1440, 810, gradient);
    for (let y = 6; y < 810; y += 9) line(0, y, 1440, y, dark ? '#ffffff03' : '#52615106', 1);
    if (kicker) {
      line(72, 60, 120, 60, dark ? P.mint : P.teal, 5);
      label(kicker, 142, 67, dark ? P.mint : P.dim, 20);
    }
  }
  function result(text, x, y, positive = true, opts = {}) {
    const bg = positive ? P.teal : P.red;
    rect(x, y - 40, opts.w ?? 310, 58, bg, 3);
    txt(text, x + 17, y, 31, P.white, 'Sans', { bold: true, w: (opts.w ?? 310) - 34 });
  }
  function cursor(x, y, color = P.teal) {
    path(
      [
        [x - 12, y - 21],
        [x + 12, y - 21],
        [x, y],
      ],
      color,
    );
    line(x, y - 68, x, y - 20, color, 4);
  }
  function printHead(x, y, w) {
    rect(x, y, w, 27, P.ink, 8);
    rect(x + 16, y + 7, w - 32, 6, P.steel, 3);
    [x + 10, x + w - 10].forEach((z) => dot(z, y + 15, 3, P.gold));
  }
  return {
    ctx,
    b,
    cue,
    after,
    on: (beat, phrase) => cue(beat, phrase, 0) === 1,
    rect,
    dot,
    path,
    line,
    txt,
    label,
    headline,
    alpha,
    field,
    paper,
    punchStrip,
    stage,
    result,
    cursor,
    printHead,
  };
}
export const lerp = (a, b, t) => a + (b - a) * t;
export function stepText(d, text, x, y, width, opts = {}) {
  const words = text.split(' ');
  let row = '',
    base = y;
  const size = opts.size ?? 29,
    color = opts.color ?? P.ink,
    face = opts.face ?? 'Sans';
  d.ctx.font = '400 ' + size + 'px "Lesson ' + face + '"';
  for (const word of words) {
    const next = row ? row + ' ' + word : word;
    if (row && d.ctx.measureText(next).width > width) {
      d.txt(row, x, base, size, color, face);
      base += opts.leading ?? size * 1.38;
      row = word;
    } else row = next;
  }
  if (row) d.txt(row, x, base, size, color, face);
  return base;
}
