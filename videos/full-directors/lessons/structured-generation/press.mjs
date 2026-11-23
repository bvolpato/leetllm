// The feed carries a verbatim string. Each sprocket row stays outside the printable area.
export const ink = '#172f38',
  board = '#192f38',
  white = '#fbf4df',
  fog = '#b7cdca',
  mint = '#86e5c1',
  gold = '#f9cc77',
  rose = '#ffaaa1',
  teal = '#075b58',
  rust = '#9c392d',
  rule = '#547071',
  pale = '#e2ede4';

export function painter(c, clock) {
  const beat = clock.beat.beatIndex + 1;
  const at = (n, phrase, span = 0) => (beat === n ? clock.reveal(phrase, span) : Number(beat > n));
  const after = (n, phrase, span = 0) => {
    if (beat !== n) return Number(beat > n);
    const { start, end } = clock.wordCue(phrase);
    const cue = clock.reveal(phrase, end - start + span, { captionStart: phrase });
    if (cue === 1 || span === 0) return Number(cue === 1);
    return Math.max(0, (clock.elapsed - end) / span);
  };
  function rect(x, y, w, h, fill) {
    c.fillStyle = fill;
    c.fillRect(x, y, w, h);
  }
  function line(x, y, u, v, color = rule, width = 1.5) {
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(u, v);
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
  }
  function dot(x, y, r, color) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
  }
  function text(s, x, y, size = 24, color = white, face = 'Sans', max = 870, align = 'left') {
    const value = String(s);
    c.font = size + 'px "Lesson ' + face + '"';
    const actual = c.measureText(value).width;
    if (actual > max) c.font = (size * max) / actual + 'px "Lesson ' + face + '"';
    c.textBaseline = 'middle';
    c.textAlign = align;
    c.fillStyle = color;
    c.fillText(value, x, y);
  }
  function ribbon(x, y, w, h, color = white) {
    rect(x + 3, y + 5, w, h, '#11252c');
    rect(x, y, w, h, color);
    for (const edge of [x + 9, x + w - 9]) {
      for (let cy = y + 11; cy < y + h - 4; cy += 18) dot(edge, cy, 2.6, board);
    }
    line(x + 20, y + 3, x + 20, y + h - 3, '#b4c0b6', 0.8);
    line(x + w - 20, y + 3, x + w - 20, y + h - 3, '#b4c0b6', 0.8);
  }
  function slip(x, y, w, h, label, rows, color = white) {
    ribbon(x, y, w, h, color);
    text(label, x + 32, y + 22, 16, teal, 'Sans', w - 64);
    const entries = rows.filter((s) => s !== undefined && s !== null);
    const pitch = Math.min(44, (h - 37) / Math.max(entries.length, 1));
    entries.forEach((s, i) => text(s, x + 32, y + 36 + pitch * (i + 0.5), 27, ink, 'Mono', w - 64));
  }
  function note(s, color = gold) {
    if (!s) return;
    line(43, 435, 917, 435, rule);
    rect(44, 449, 5, 32, color);
    text(s, 63, 465, 25, color, 'Sans', 849);
  }
  function arrow(x, y, u, v, color = mint) {
    const a = Math.atan2(v - y, u - x);
    line(x, y, u, v, color, 2.8);
    line(u, v, u - 11 * Math.cos(a - 0.47), v - 11 * Math.sin(a - 0.47), color, 2.8);
    line(u, v, u - 11 * Math.cos(a + 0.47), v - 11 * Math.sin(a + 0.47), color, 2.8);
  }
  function feed(y, label, value, { w = 873, color = white, x = 43 } = {}) {
    slip(x, y, w, 80, label, [value], color);
  }
  function head(title) {
    rect(0, 0, 960, 540, board);
    const shading = c.createLinearGradient(0, 0, 960, 540);
    shading.addColorStop(0, '#263f47');
    shading.addColorStop(1, '#132b34');
    rect(0, 0, 960, 540, shading);
    text(title, 43, 54, 38, white, 'Serif', 872);
    line(43, 91, 917, 91, rule);
  }
  return { c, beat, at, after, rect, line, dot, text, ribbon, slip, note, arrow, feed, head };
}
export function inset(c, x, y, scale, draw) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  draw();
  c.restore();
}
