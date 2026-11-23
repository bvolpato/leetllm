import { firstFrameAt, fps } from '../../../director-cuts/lesson-runtime/timeline.mjs';

export const C = {
  stock: '#f3eddd',
  paper: '#fff9e9',
  ink: '#192e35',
  faint: '#c8c4b2',
  quiet: '#51666a',
  red: '#aa4434',
  blue: '#37758a',
  gold: '#cc922c',
  white: '#fffaf0',
  rose: '#ebae9a',
  sky: '#a4d4df',
  teal: '#316c61',
};
export const pct = (x, digits = 0) => (100 * x).toFixed(digits) + '%';
export const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
export const mix = (a, b, t) => a + (b - a) * t;
export const clamp = (t) => Math.max(0, Math.min(1, t));
export const sum = (a) => a.reduce((total, v) => total + v, 0);
export const avg = (a) => sum(a) / a.length;
export const smooth = (t) => t * t * (3 - 2 * t);

export function painter(ctx, clock) {
  const b = clock.beat.beatIndex;
  const dark = [13, 14, 15].includes(clock.beat.chapterIndex);
  const bg = dark ? '#172d34' : C.stock;
  const ink = dark ? C.white : C.ink;
  const quiet = dark ? '#b7ccd0' : C.quiet;
  const rule = dark ? '#577079' : C.faint;
  function rect(x, y, w, h, color) {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  function line(x1, y1, x2, y2, color = rule, width = 2, dash = []) {
    ctx.save();
    ctx.setLineDash(dash);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }
  function dot(x, y, r, color, stroke) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  function text(value, x, y, size = 26, color = ink, align = 'left', family = 'Sans', weight = 400) {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
    ctx.fillText(String(value), x, y);
  }
  const mono = (v, x, y, size = 26, color = ink, align = 'left') =>
    text(v, x, y, size, color, align, 'Mono');
  const serif = (v, x, y, size = 42, color = ink, align = 'left') =>
    text(v, x, y, size, color, align, 'Serif');
  const head = (kicker, title) => {
    rect(0, 0, 1200, 675, bg);
    line(56, 48, 1144, 48, rule, 1.5);
    rect(56, 35, 15, 4, dark ? C.sky : C.red);
    text(kicker, 81, 35, 16, quiet, 'left', 'Sans', 600);
    serif(title, 55, 102, 43);
  };
  function foot(value) {
    line(58, 538, 1142, 538, rule);
    text(value, 62, 571, 25, ink);
  }
  function evidence(value) {
    text(value, 62, 530, 25, ink);
  }
  // Perforations let a marked portion keep its visual identity as it moves between populations.
  function ticket(x, y, w, h, color = C.paper) {
    if (w <= 0) return;
    rect(x + 2, y + 4, w, h, dark ? '#0d222a' : '#cbc7b7');
    rect(x, y, w, h, color);
    for (const edge of [x, x + w]) dot(edge, y + h * 0.5, Math.min(7, w / 5), bg);
  }
  function strip(x, y, parts, unit, height = 63) {
    let pos = x;
    for (const [value, color] of parts) {
      const w = value * unit;
      rect(pos, y, w, height, color);
      for (let k = 10; k < w - 4; k += 16) {
        rect(pos + k, y + 5, 5, 3, '#e8e7d5');
        rect(pos + k, y + height - 8, 5, 3, '#e8e7d5');
      }
      pos += w;
    }
    return pos;
  }
  function ruleScale(x, y, w, min, max, ticks, format = String) {
    line(x, y, x + w, y, quiet, 2);
    for (const v of ticks) {
      const xx = x + (w * (v - min)) / (max - min);
      line(xx, y, xx, y + 9, quiet, 2);
      mono(format(v), xx, y + 28, 17, quiet, 'center');
    }
  }
  // A cue is queried only while its own beat plays. Later beats retain its settled state.
  const cue = (beat, phrase, span = 0.65) =>
    b < beat ? 0 : b > beat ? 1 : smooth(clock.reveal(phrase, span));
  function after(beat, phrase, span = 0) {
    if (b !== beat) return Number(b > beat);
    // Start the caption with the result clause and keep the picture gated through its last word.
    clock.reveal(phrase, 0, { captionStart: phrase });
    const first = firstFrameAt(clock.wordCue(phrase).end);
    const elapsed = Math.round(clock.elapsed * fps) - first;
    return span ? smooth(clamp(elapsed / (span * fps))) : Number(elapsed >= 0);
  }
  const end = (beat) => b > beat || (b === beat && clock.elapsed >= clock.speechDuration);
  return {
    ctx,
    b,
    clock,
    bg,
    ink,
    quiet,
    rule,
    rect,
    line,
    dot,
    text,
    mono,
    serif,
    head,
    foot,
    evidence,
    ticket,
    strip,
    ruleScale,
    cue,
    after,
    end,
  };
}
