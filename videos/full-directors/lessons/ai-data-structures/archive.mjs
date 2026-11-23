export const C = {
  ink: '#173531',
  field: '#163d3b',
  deep: '#102d2c',
  mid: '#395e57',
  rail: '#74938a',
  paper: '#f4e9cc',
  pale: '#d1ddc8',
  gold: '#f2bd69',
  mint: '#96dfb7',
  coral: '#f0a18b',
  black: '#102521',
  cream: '#fff6e3',
};
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const ease = (x) => clamp(x) ** 2 * (3 - 2 * clamp(x));
export const mix = (a, b, t) => a + (b - a) * t;
export const beat = (clock) => clock.beat.beatIndex + 1;
export function cue(clock, n, words, duration = 0.65, captionStart) {
  if (beat(clock) !== n) return Number(beat(clock) > n);
  return ease(clock.reveal(words, duration, { captionStart }));
}
export function afterSpeech(clock, n) {
  return beat(clock) === n
    ? clamp((clock.elapsed - clock.speechDuration) * 4)
    : Number(beat(clock) > n);
}
export const idText = (ids) => ids.map((i) => 'M' + i).join('   ');
export function text(
  g,
  s,
  x,
  y,
  size = 22,
  color = C.cream,
  family = 'Sans',
  align = 'left',
  maxWidth,
) {
  g.font = size + 'px "Lesson ' + family + '"';
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillStyle = color;
  if (maxWidth !== undefined) g.fillText(String(s), x, y, maxWidth);
  else g.fillText(String(s), x, y);
}
export function rect(g, x, y, w, h, fill, r = 0, stroke) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.lineWidth = 1.5;
    g.strokeStyle = stroke;
    g.stroke();
  }
}
export function dot(g, x, y, r, color) {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}
export function line(g, x, y, xx, yy, color = C.rail, w = 2) {
  g.strokeStyle = color;
  g.lineWidth = w;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(xx, yy);
  g.stroke();
}
export function arrow(g, x, y, xx, yy, color = C.gold, w = 3) {
  line(g, x, y, xx, yy, color, w);
  const a = Math.atan2(yy - y, xx - x);
  for (const d of [-0.53, 0.53])
    line(g, xx, yy, xx - 13 * Math.cos(a + d), yy - 13 * Math.sin(a + d), color, w);
}
export function screw(g, x, y) {
  dot(g, x, y + 1, 4, C.black);
  dot(g, x, y, 3.5, '#a8a58b');
  line(g, x - 1.7, y + 1.7, x + 1.7, y - 1.7, C.ink, 1);
}
export function background(g, title) {
  const wash = g.createLinearGradient(0, 0, 1160, 675);
  wash.addColorStop(0, '#284e46');
  wash.addColorStop(0.6, C.field);
  wash.addColorStop(1, '#102d31');
  g.fillStyle = wash;
  g.fillRect(0, 0, 1200, 675);
  for (let x = 0; x < 1200; x += 32)
    for (let y = 138; y < 625; y += 32) dot(g, x + 10, y, 0.85, '#a5bcab24');
  rect(g, 0, 0, 1200, 103, C.deep);
  rect(g, 42, 28, 6, 46, C.gold, 2);
  text(g, title, 68, 70, 40, C.cream, 'Serif', 'left', 1082);
  line(g, 0, 103, 1200, 103, '#7e9883', 1.5);
}
export function label(g, s, x, y, align = 'left') {
  text(g, s, x, y, 19, C.pale, 'Mono', align);
}
export function foot(g, s, baseline = 586, ruleY = null) {
  if (ruleY !== null) line(g, 48, ruleY, 1152, ruleY, C.rail, 1);
  text(g, s, 52, baseline, 28, C.cream, 'Serif', 'left', 1096);
}
export function plate(g, x, y, w, h, light = false) {
  rect(g, x + 1, y + 5, w, h, '#081f2099', 9);
  const a = g.createLinearGradient(x, y, x, y + h);
  a.addColorStop(0, light ? '#f7edcf' : '#42695f');
  a.addColorStop(1, light ? '#d9c9a6' : '#294b45');
  rect(g, x, y, w, h, a, 9, light ? '#a29477' : '#739388');
  for (const dx of [9, w - 9]) for (const dy of [9, h - 9]) screw(g, x + dx, y + dy);
}
export function token(g, x, y, s, w = 89, h = 51, color = C.paper) {
  rect(g, x + 1, y + 3, w, h, '#102b29', 4);
  rect(g, x, y, w, h, color, 4);
  rect(g, x + 6, y + 6, 3, h - 12, '#7a816d', 1);
  text(g, s, x + w / 2 + 2, y + h / 2 + 8, Math.min(25, h * 0.56), C.ink, 'Mono', 'center', w - 17);
}
export function slots(
  g,
  x,
  y,
  values,
  { w = 88, h = 52, gap = 10, color = C.paper, indices = false } = {},
) {
  values.forEach((v, i) => {
    const xx = x + i * (w + gap);
    rect(g, xx, y, w, h, C.deep, 5, C.rail);
    if (v !== null && v !== undefined)
      token(
        g,
        xx + 2,
        y + 2,
        String(v),
        w - 4,
        h - 4,
        typeof color === 'function' ? color(v, i) : color,
      );
    if (indices) text(g, i, xx + w / 2, y + h + 24, 16, C.pale, 'Mono', 'center');
  });
}
export function note(g, row, x, y, w, options = {}) {
  const { active = false, h = 77, words = [], highlight = false } = options;
  const paper = active ? C.cream : '#e2d7b9';
  rect(g, x + 2, y + 3, w, h, '#0c2626', 4);
  rect(g, x, y, w, h, paper, 4);
  const tab = active ? C.gold : '#a8bdab';
  rect(g, x, y, 68, h, tab, 4);
  for (let yy = 7; yy < h - 5; yy += 10) line(g, x + 68, y + yy, x + 68, y + yy + 4, '#688177', 1);
  text(g, 'M' + row.id, x + 34, y + h / 2 + 7, 22, C.ink, 'Mono', 'center');
  const lines = row.text.match(/[^.!?]+[.!?]?/g).map((t) => t.trim());
  const size = Math.min(22, ((w - 96) / Math.max(...lines.map((s) => s.length))) * 1.88);
  lines.forEach((str, i) => {
    let xx = x + 83;
    const yy = y + h / 2 + size * 0.33 + (i - (lines.length - 1) / 2) * (size + 3);
    g.font = size + 'px "Lesson Serif"';
    g.textAlign = 'left';
    for (const part of str.split(/(\bcharged\b|\btwice\b|\bsign\b)/gi)) {
      const width = g.measureText(part).width;
      if (highlight && words.includes(part.toLowerCase()))
        rect(g, xx - 1, yy - size * 0.84, width + 2, size * 1.1, '#efc17e', 2);
      text(g, part, xx, yy, size, C.ink, 'Serif');
      xx += width;
    }
  });
}
export function receipt(g, x, y, w, heading, ids, capacity = 2) {
  const h = 72 + capacity * 53;
  rect(g, x + 2, y + 4, w, h, '#0c2525', 4);
  rect(g, x, y, w, h, C.paper, 4);
  for (let xx = x + 8; xx < x + w - 5; xx += 16) dot(g, xx, y + 3, 2.4, C.field);
  text(g, heading, x + 18, y + 39, 23, C.ink, 'Serif', 'left', w - 36);
  for (let i = 0; i < capacity; i++) {
    const yy = y + 58 + i * 53;
    line(g, x + 19, yy + 38, x + w - 19, yy + 38, '#a5a58e', 1);
    text(g, String(i + 1).padStart(2, '0'), x + 20, yy + 24, 15, '#69796b', 'Mono');
    if (ids[i] !== undefined)
      text(
        g,
        typeof ids[i] === 'number' ? 'M' + ids[i] : ids[i],
        x + 62,
        yy + 25,
        26,
        C.ink,
        'Mono',
        'left',
        w - 83,
      );
  }
}
export function strip(g, x, y, word, ids, { w = 550, active = -1 } = {}) {
  plate(g, x, y, w, 71);
  text(g, word, x + 21, y + 44, 25, C.cream, 'Serif', 'left', w * 0.32);
  const pitch = w * 0.147;
  for (let i = 0; i < 4; i++) {
    const xx = x + w * 0.43 + i * pitch;
    dot(g, xx, y + 28, 13, C.deep);
    if (ids.includes(i)) {
      dot(g, xx, y + 28, 10, C.gold);
      dot(g, xx - 2, y + 25, 4, '#fff0bd');
    }
    if (active === i) {
      g.strokeStyle = C.mint;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(xx, y + 28, 19, 0, 7);
      g.stroke();
    }
    text(g, 'M' + i, xx, y + 59, 15, C.pale, 'Mono', 'center');
  }
}
export function node(g, x, y, value, { r = 33, fill = C.paper } = {}) {
  dot(g, x, y + 4, r + 1, C.black);
  dot(g, x, y, r, fill);
  dot(g, x, y, r - 4, C.deep);
  dot(g, x, y, r - 6, fill);
  text(g, value, x, y + 8, Math.min(26, r * 0.83), C.ink, 'Mono', 'center', r * 1.65);
}
