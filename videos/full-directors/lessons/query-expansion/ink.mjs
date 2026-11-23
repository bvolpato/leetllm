import { firstFrameAt, fps } from '../../../director-cuts/lesson-runtime/timeline.mjs';

export const C = {
  paper: '#ede8d8',
  white: '#fffced',
  ink: '#182f31',
  soft: '#506865',
  edge: '#b5c4b8',
  jade: '#006657',
  mint: '#c2e1cb',
  blue: '#214e73',
  sky: '#cee0e8',
  rust: '#9f3b20',
  amber: '#f4c48d',
  shade: '#d7d7c7',
  graphite: '#273f40',
  dark: '#10292b',
  light: '#e7efda',
};
export const mix = (a, b, p) => a + (b - a) * p;
export function toolsFor(c, clock) {
  const beat = clock.beat.beatIndex + 1;
  const at = (n, phrase, span = 0) => (beat > n ? 1 : beat < n ? 0 : clock.reveal(phrase, span));
  function after(n, phrase, span = 0, captionStart = false) {
    if (beat !== n) return Number(beat > n);
    const { end } = clock.wordCue(phrase);
    if (captionStart) clock.reveal(phrase, 0, { captionStart });
    if (clock.elapsed < firstFrameAt(end) / fps) return 0;
    if (clock.elapsed >= firstFrameAt(end + span) / fps) return 1;
    return (clock.elapsed - end) / span;
  }
  function rect(x, y, w, h, color, r = 0) {
    if (w <= 0 || h <= 0) return;
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fill();
  }
  function line(x, y, u, v, color = C.edge, w = 1) {
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(u, v);
    c.lineWidth = w;
    c.strokeStyle = color;
    c.stroke();
  }
  function circle(x, y, r, color) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
  }
  function text(
    s,
    x,
    y,
    size = 22,
    color = C.ink,
    face = 'Sans',
    width = 875,
    align = 'left',
    weight = 400,
  ) {
    c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = 'alphabetic';
    c.fillText(String(s), x, y, width);
  }
  const mono = (s, x, y, size = 15, color = C.soft, w = 875, align = 'left') =>
    text(s, x, y, size, color, 'Mono', w, align);
  const serif = (s, x, y, size = 34, color = C.ink, w = 875) =>
    text(s, x, y, size, color, 'Serif', w);
  function base(kicker, title) {
    rect(0, 0, 960, 540, C.paper);
    mono(kicker, 38, 32, 14, C.jade);
    serif(title, 36, 84, 45, C.ink, 888);
    line(38, 104, 922, 104, C.ink, 1.5);
  }
  function slip(x, y, w, h, color = C.white) {
    rect(x + 3, y + 4, w, h, C.shade, 3);
    rect(x, y, w, h, color, 3);
    line(x + 12, y + 5, x + 12, y + h - 5, C.edge, 1);
  }
  function film(x, y, w, h, fill = C.dark) {
    rect(x + 3, y + 4, w, h, C.shade, 8);
    rect(x, y, w, h, fill, 8);
    for (let i = x + 11; i < x + w - 13; i += 23) {
      rect(i, y + 5, 10, 4, C.paper, 1);
      rect(i, y + h - 9, 10, 4, C.paper, 1);
    }
  }
  function band(message, color = C.dark, ink = C.white) {
    rect(38, 445, 884, 45, color, 4);
    text(message, 56, 475, 23, ink, 'Sans', 847);
  }
  function tag(s, x, y, w, tone = C.mint, color = C.jade) {
    rect(x, y, w, 26, tone, 3);
    mono(s, x + 9, y + 19, 14, color, w - 18);
  }
  function arrow(x, y, u, v, color = C.soft) {
    line(x, y, u, v, color, 2.5);
    const a = Math.atan2(v - y, u - x);
    line(u, v, u - 10 * Math.cos(a - 0.48), v - 10 * Math.sin(a - 0.48), color, 2.5);
    line(u, v, u - 10 * Math.cos(a + 0.48), v - 10 * Math.sin(a + 0.48), color, 2.5);
  }
  function words(s, x, y, matches, limit, size = 20) {
    const tokens = s.split(' ');
    let px = x,
      py = y;
    for (const word of tokens) {
      c.font = size + 'px "Lesson Sans"';
      const w = c.measureText(word).width;
      if (px + w > x + limit) {
        px = x;
        py += size + 8;
      }
      const hit = matches.includes(word.toLowerCase().replace(/[^a-z0-9-]/g, ''));
      if (hit) rect(px - 2, py - size, w + 4, size + 6, C.mint, 2);
      text(word, px, py, size, hit ? C.jade : C.ink);
      px += w + c.measureText(' ').width;
    }
  }
  return {
    c,
    beat,
    at,
    after,
    rect,
    line,
    circle,
    text,
    mono,
    serif,
    base,
    slip,
    film,
    band,
    tag,
    arrow,
    words,
  };
}
