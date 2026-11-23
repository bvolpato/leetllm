import { createCanvas } from '@napi-rs/canvas';

export const C = {
  paper: '#f2ebdb',
  sheet: '#fffaf0',
  ink: '#202c35',
  muted: '#535e61',
  rule: '#b0aa9d',
  blue: '#365c87',
  gold: '#996619',
  red: '#a53b47',
  green: '#176c58',
  plum: '#674264',
};
export const dyes = { checklist: C.blue, FAQ: C.gold, key: C.red, plan: C.plum };
export const names = {
  checklist: 'Incident checklist',
  FAQ: 'Operations FAQ',
  key: 'Key runbook',
  plan: 'Acquisition plan',
};
export const short = { checklist: 'Checklist', FAQ: 'FAQ', key: 'Key', plan: 'Plan' };

let ground;
export function background(c) {
  if (!ground) {
    ground = createCanvas(1920, 1080);
    const g = ground.getContext('2d'),
      wash = g.createLinearGradient(0, 0, 1920, 1080);
    wash.addColorStop(0, '#faf5e9');
    wash.addColorStop(1, '#e4d9c6');
    g.fillStyle = wash;
    g.fillRect(0, 0, 1920, 1080);
    let seed = 500;
    for (let i = 0; i < 22000; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      g.fillStyle = i % 2 ? '#5353450c' : '#ffffff65';
      g.fillRect(seed % 1920, Math.floor(seed / 1920) % 1080, 2, 1);
    }
  }
  c.drawImage(ground, 0, 0);
}
export function text(c, s, x, y, size = 37, color = C.ink, opts = {}) {
  const { face = 'Sans', weight = 400, align = 'left', max = 1750 } = opts;
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(String(s), x, y, max);
}
export function heading(c, s) {
  text(c, s, 92, 125, 76, C.ink, { face: 'Serif', max: 1736 });
}
export function sub(c, s) {
  text(c, s, 96, 195, 35, C.muted);
}
export function result(c, s, good = null) {
  const col = good === null ? C.blue : good ? C.green : C.red;
  line(c, 96, 876, 1824, 876, C.rule, 2);
  rect(c, 96, 900, 9, 48, col);
  text(c, s, 130, 940, 42, col, { weight: 600, max: 1680 });
}
export function section(c, s, x, y, w = 740) {
  text(c, s, x, y, 30, C.muted, { weight: 600, max: w });
  line(c, x, y + 17, x + w, y + 17, C.rule, 2);
}
export function rect(c, x, y, w, h, fill, stroke = null, r = 0) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 2;
    c.stroke();
  }
}
export function line(c, x, y, u, v, color = C.ink, thick = 3) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.strokeStyle = color;
  c.lineWidth = thick;
  c.stroke();
}
export function dot(c, x, y, r, fill) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}
export function curve(c, x, y, u, v, col, width = 6, dashed = false) {
  c.save();
  if (dashed) c.setLineDash([12, 12]);
  c.beginPath();
  c.moveTo(x, y);
  const m = (x + u) / 2;
  c.bezierCurveTo(m, y, m, v, u, v);
  c.strokeStyle = col;
  c.lineWidth = width;
  c.stroke();
  c.restore();
}
export function thread(c, x, y, u, v, col, t) {
  curve(c, x, y, u, v, col, 5);
  if (t > 0 && t < 1) {
    const m = (x + u) / 2,
      k = 1 - t;
    dot(
      c,
      k ** 3 * x + 3 * k * t * m + t ** 3 * u,
      k * k * (1 + 2 * t) * y + t * t * (3 - 2 * t) * v,
      11,
      col,
    );
  }
}
export function sheet(c, x, y, w, h, tint = C.sheet) {
  rect(c, x + 7, y + 10, w, h, '#332c2519', null, 4);
  rect(c, x, y, w, h, tint, '#c4bba8', 4);
}
export function source(c, id, detail, x, y, w = 490, h = 110) {
  sheet(c, x, y, w, h);
  rect(c, x, y, 14, h, dyes[id] ?? C.blue);
  text(c, names[id] ?? id, x + 34, y + 48, 37, C.ink, { weight: 600, max: w - 50 });
  text(c, detail, x + 34, y + 88, 29, C.muted, { max: w - 50 });
}
export function seal(c, s, x, y, col = C.green) {
  c.font = '600 29px "Lesson Sans"';
  const w = c.measureText(s).width + 40;
  rect(c, x, y, w, 51, col, null, 4);
  text(c, s, x + 20, y + 36, 29, '#fff9eb', { weight: 600 });
}
export function pair(c, label, value, x, y, w, col = C.ink) {
  text(c, label, x, y, 28, C.muted, { max: w });
  text(c, value, x, y + 55, 42, col, { weight: 600, max: w });
}
export function rows(c, entries, x, y, w, space = 95) {
  entries.forEach(([label, value, col], i) => {
    const yy = y + space * i;
    line(c, x, yy + 20, x + w, yy + 20, C.rule, 1);
    text(c, label, x, yy, 36, C.ink, { max: w * 0.48 });
    text(c, value, x + w, yy, 34, col ?? C.blue, { weight: 600, align: 'right', max: w * 0.49 });
  });
}
export function passColor(value) {
  return value ? C.green : C.red;
}
export function cue(clock, beat, words, seconds = 0.6) {
  const current = clock.beat.beatIndex;
  return current < beat ? 0 : current > beat ? 1 : clock.reveal(words, seconds);
}
export function at(clock, beat, words) {
  return cue(clock, beat, words, 0) === 1;
}
export function fade(c, p, fn) {
  if (p <= 0) return;
  c.save();
  c.globalAlpha *= p;
  fn();
  c.restore();
}
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
