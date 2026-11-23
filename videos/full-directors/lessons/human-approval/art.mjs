import { drawBoot } from '../../../director-cuts/lessons/human-approval/boots.mjs';
import { groups } from './examples.mjs';

export const C = {
  ink: '#242f35',
  mute: '#4e6267',
  line: '#b6b6a7',
  paper: '#fff9ed',
  cream: '#f2e8d6',
  ochre: '#966232',
  pale: '#f4d6aa',
  red: '#a4382e',
  blush: '#f0c4ae',
  teal: '#146458',
  mint: '#c6e1d2',
  blue: '#294c61',
  ice: '#d4e4e7',
  dark: '#233e47',
  white: '#fffbef',
};
export const mix = (a, b, t) => a + (b - a) * t;
export function cue(k, beat, phrase, duration = 0) {
  const n = k.beat.beatIndex;
  return n < beat ? 0 : n > beat ? 1 : k.reveal(phrase, duration);
}
export function throughCue(k, beat, phrase) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: phrase });
}
export function afterCue(k, beat, phrase) {
  return throughCue(k, beat, phrase) === 1;
}
export function text(
  c,
  s,
  x,
  y,
  size = 36,
  color = C.ink,
  face = 'Sans',
  weight = 400,
  align = 'left',
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.textBaseline = 'alphabetic';
  c.textAlign = align;
  c.fillStyle = color;
  c.fillText(String(s), x, y);
}
export function box(c, x, y, w, h, fill, r = 0, edge) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = 2;
    c.stroke();
  }
}
export function line(c, x, y, x2, y2, color = C.line, width = 3) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.stroke();
}
export function dot(c, x, y, r, color, edge) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  if (color) {
    c.fillStyle = color;
    c.fill();
  }
  if (edge) {
    c.lineWidth = 4;
    c.strokeStyle = edge;
    c.stroke();
  }
}
export function arrow(c, x, y, x2, y2, color = C.teal, width = 4) {
  line(c, x, y, x2, y2, color, width);
  const a = Math.atan2(y2 - y, x2 - x);
  line(c, x2, y2, x2 - 18 * Math.cos(a - 0.55), y2 - 18 * Math.sin(a - 0.55), color, width);
  line(c, x2, y2, x2 - 18 * Math.cos(a + 0.55), y2 - 18 * Math.sin(a + 0.55), color, width);
}
export function base(c, section, heading) {
  const g = c.createLinearGradient(0, 0, 1920, 1080);
  g.addColorStop(0, '#faf1dd');
  g.addColorStop(0.6, '#f0ebdf');
  g.addColorStop(1, '#e0e6dd');
  c.fillStyle = g;
  c.fillRect(0, 0, 1920, 1080);
  text(c, section, 88, 80, 30, C.teal, 'Sans', 700);
  text(c, heading, 84, 180, 76, C.ink, 'Serif');
  line(c, 88, 216, 1832, 216, C.line, 2);
}
export function caption(c, s, tone = C.ink) {
  line(c, 88, 864, 1832, 864, C.line, 2);
  text(c, s, 88, 934, 41, tone, 'Serif');
}
export function label(c, s, x, y, color = C.mute) {
  text(c, s, x, y, 30, color, 'Sans', 600);
}
export function boot(c, red, x, y, w) {
  drawBoot(c, red, x, y, w);
}
export function rack(
  c,
  x,
  y,
  w,
  h,
  row,
  { title = 'Live first results', color = C.dark, subset = 20 } = {},
) {
  box(c, x, y, w, h, color, 16);
  text(c, title, x + 30, y + 54, 39, C.white, 'Serif');
  text(c, 'rev ' + row.revision, x + w - 28, y + 54, 32, C.white, 'Mono', 400, 'right');
  const shelfTop = y + 80,
    shelfBottom = y + h - 86,
    nrows = Math.ceil(subset / 5),
    step = (shelfBottom - shelfTop) / nrows;
  const slot = (w - 60) / 5;
  for (let r = 0; r < nrows; r++) {
    const ground = shelfTop + (r + 1) * step - 4;
    box(c, x + 22, ground, w - 44, 9, '#bfa883', 2);
    for (let j = 0; j < 5; j++) {
      const i = r * 5 + j;
      if (i < subset)
        boot(
          c,
          i < groups(row),
          x + 30 + slot * (j + 0.5),
          ground,
          Math.min(slot * 0.95, step * 1.46),
        );
    }
  }
  text(c, groups(row) + ' of 20 groups', x + 30, y + h - 29, 35, C.white, 'Sans', 600);
  text(
    c,
    row.trafficPercent + '% live',
    x + w - 28,
    y + h - 29,
    34,
    '#f3c78c',
    'Sans',
    700,
    'right',
  );
}
// The perforations and folded corner distinguish a stored packet from a live shelf.
export function slip(c, x, y, w, h, heading, { tint = C.paper, accent = C.teal } = {}) {
  box(c, x + 6, y + 8, w, h, '#263b3b16', 7);
  box(c, x, y, w, h, tint, 7);
  box(c, x, y, 10, h, accent, 4);
  c.fillStyle = '#cbbda4';
  c.beginPath();
  c.moveTo(x + w - 33, y);
  c.lineTo(x + w, y + 32);
  c.lineTo(x + w - 33, y + 32);
  c.fill();
  label(c, heading, x + 35, y + 57, accent);
  c.save();
  c.setLineDash([7, 8]);
  line(c, x + 28, y + 85, x + w - 26, y + 85, '#b8b9a6', 2);
  c.restore();
}
export function rail(c, x, y, w, count, on, { active = C.red, off = '#d8d1c1' } = {}) {
  const gap = 5,
    width = (w - (count - 1) * gap) / count;
  for (let i = 0; i < count; i++)
    box(c, x + i * (width + gap), y, width, 35, i < on ? active : off, 3);
}
export function envelope(c, x, y, w = 105, fill = C.pale) {
  const h = w * 0.66;
  box(c, x, y, w, h, fill, 4, C.ochre);
  line(c, x + 2, y + 2, x + w / 2, y + h * 0.62, C.ochre, 3);
  line(c, x + w / 2, y + h * 0.62, x + w - 2, y + 2, C.ochre, 3);
}
export function stamp(c, s, x, y, color = C.teal, size = 31) {
  c.font = '700 ' + size + 'px "Lesson Sans"';
  const w = c.measureText(s).width + 38;
  box(c, x, y, w, 58, null, 6, color);
  text(c, s, x + 19, y + 40, size, color, 'Sans', 700);
}
export function field(c, name, value, x, y, w) {
  text(c, name, x, y, 30, C.mute);
  text(c, value, x + w, y, 33, C.ink, 'Sans', 600, 'right');
  line(c, x, y + 18, x + w, y + 18, C.line, 1);
}
