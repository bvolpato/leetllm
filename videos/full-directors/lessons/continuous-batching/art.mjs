// The hinged letter tiles and the ruled dispatch sheet share the same type and ink.
export const color = {
  paper: '#f3eadd',
  ink: '#162f31',
  muted: '#526b67',
  rule: '#b6bbab',
  board: '#233f40',
  metal: '#375450',
  white: '#fff5da',
  mint: '#a6e2bf',
  amber: '#f7bd69',
  gold: '#975916',
  teal: '#176857',
  rust: '#a04432',
};
export function text(g, value, x, y, size = 38, fill = color.ink, opts = {}) {
  g.font = `${opts.weight ?? 500} ${size}px "${opts.font ?? 'Lesson Sans'}"`;
  g.textAlign = opts.align ?? 'left';
  g.textBaseline = 'middle';
  g.fillStyle = fill;
  g.fillText(String(value), x, y);
}
export function box(g, x, y, w, h, fill, radius = 0, stroke = null) {
  g.beginPath();
  g.roundRect(x, y, w, h, radius);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = 3;
    g.stroke();
  }
}
export function line(g, x1, y1, x2, y2, fill = color.rule, width = 3) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.strokeStyle = fill;
  g.lineWidth = width;
  g.stroke();
}
export function dot(g, x, y, radius, fill) {
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
}
export function center(g, value, x, y, size = 40, fill = color.ink, opts = {}) {
  text(g, value, x, y, size, fill, { ...opts, align: 'center' });
}
export function label(g, value, x, y, fill = color.muted) {
  text(g, value, x, y, 27, fill, { font: 'Lesson Mono', weight: 600 });
}
export function base(g, section, title, dark = false) {
  const bg = dark ? color.ink : color.paper,
    fg = dark ? color.white : color.ink;
  box(g, 0, 0, 1920, 1080, bg);
  box(g, 74, 62, 38, 8, dark ? color.amber : color.teal, 4);
  label(g, section.toUpperCase(), 134, 67, dark ? color.mint : color.teal);
  text(g, title, 70, 160, 70, fg, { font: 'Lesson Serif', weight: 600 });
  line(g, 74, 225, 1846, 225, dark ? color.metal : color.rule);
}
export function note(g, value, accent = color.teal, dark = false) {
  line(g, 78, 902, 1842, 902, dark ? color.metal : color.rule);
  box(g, 78, 938, 8, 48, accent, 4);
  text(g, value, 113, 963, 40, dark ? color.white : color.ink);
}
export function plate(g, x, y, w, h) {
  box(g, x, y + 7, w, h, '#112524', 20);
  box(g, x, y, w, h, color.board, 20);
  for (const xx of [x + 13, x + w - 13])
    for (const yy of [y + 13, y + h - 13]) {
      dot(g, xx, yy, 4, '#74908a');
      line(g, xx - 2.4, yy + 1, xx + 2.4, yy - 1, '#314642', 1.5);
    }
}
export function flap(g, letter, x, y, w = 94, h = 94, ink = color.white) {
  box(g, x, y + 3, w, h, '#101f20', 7);
  box(g, x, y, w, h, '#294746', 7);
  box(g, x + 1, y + 1, w - 2, h * 0.5, '#365451', 6);
  if (letter)
    center(g, letter, x + w / 2, y + h * 0.54, h * 0.71, ink, { font: 'Lesson Mono', weight: 700 });
  line(g, x + 1, y + h * 0.5, x + w - 1, y + h * 0.5, '#162f30', 2);
}
export function cell(g, value, x, y, w, h, fill = color.board, ink = color.white) {
  box(g, x, y, w, h, fill, 7);
  if (value !== null)
    center(g, value, x + w / 2, y + h / 2 + 2, Math.min(h * 0.51, 43), ink, {
      font: 'Lesson Mono',
      weight: 600,
    });
}
// Every transition belongs to one spoken beat. Later beats inherit the settled value.
export function cue(k, beat, phrase, seconds = 0) {
  if (k.beat.beatIndex < beat) return 0;
  if (k.beat.beatIndex > beat) return 1;
  return k.reveal(phrase, seconds);
}
export function heading(g, left, right, y = 287, dark = false) {
  const c = dark ? color.mint : color.muted;
  label(g, left, 95, y, c);
  text(g, right, 1812, y, 29, c, { align: 'right', font: 'Lesson Mono' });
}
