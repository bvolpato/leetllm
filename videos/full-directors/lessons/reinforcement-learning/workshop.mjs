import { lessonFont } from '../../../lib/fonts.mjs';

export const C = {
  bg: '#10272d',
  dark: '#0a1c22',
  plate: '#204047',
  rim: '#537078',
  hair: '#395b62',
  cream: '#faf0d7',
  paper: '#f2e2bc',
  ink: '#193038',
  faint: '#aec0b9',
  brass: '#f2c273',
  metal: '#a57c45',
  copper: '#d8a16d',
  green: '#8adcc3',
  blue: '#99c9eb',
  red: '#f6a393',
  off: '#637d80',
};
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, t) => a + (b - a) * clamp(t);
export const fmt = (n, d = 2) => Number(n.toFixed(d)).toString().replace('-', '−');
export const sign = (n) => (n > 0 ? '+' + fmt(n) : fmt(n));
export const full = (n, d = 2) => n.toFixed(d).replace('-', '−');
export function cue(k, beat, words, seconds = 0.55) {
  const i = k.beat.beatIndex + 1;
  return i < beat ? 0 : i > beat ? 1 : k.reveal(words, seconds);
}
export class Bench {
  constructor(ctx) {
    this.c = ctx;
  }
  rect(x, y, w, h, color, r = 0, edge, width = 2) {
    const c = this.c;
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fillStyle = color;
    c.fill();
    if (edge) {
      c.strokeStyle = edge;
      c.lineWidth = width;
      c.stroke();
    }
  }
  dot(x, y, r, fill, edge, lw = 2) {
    const c = this.c;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
    if (edge) {
      c.lineWidth = lw;
      c.strokeStyle = edge;
      c.stroke();
    }
  }
  line(x, y, xx, yy, color, width = 3) {
    this.path(
      [
        [x, y],
        [xx, yy],
      ],
      color,
      width,
    );
  }
  path(points, color, width = 4) {
    const c = this.c;
    c.beginPath();
    c.moveTo(...points[0]);
    for (const pt of points.slice(1)) c.lineTo(...pt);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.lineWidth = width;
    c.strokeStyle = color;
    c.stroke();
  }
  txt(str, x, y, size, color = C.cream, align = 'left', face = 'Sans', weight = 500, maxWidth) {
    const c = this.c;
    c.font = lessonFont(size, face.toLowerCase(), weight);
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillStyle = color;
    if (maxWidth) c.fillText(String(str), x, y, maxWidth);
    else c.fillText(String(str), x, y);
  }
  mono(s, x, y, size = 32, color = C.brass, align = 'left', maxWidth) {
    this.txt(s, x, y, size, color, align, 'Mono', 500, maxWidth);
  }
  title(section, title, size = 70) {
    const c = this.c;
    const grad = c.createLinearGradient(0, 0, 1760, 1250);
    grad.addColorStop(0, '#1c3a40');
    grad.addColorStop(0.52, C.bg);
    grad.addColorStop(1, '#0d2026');
    c.fillStyle = grad;
    c.fillRect(0, 0, 1920, 1080);
    this.txt(section, 88, 66, 26, C.brass, 'left', 'Mono', 500);
    this.txt(title, 85, 145, size, C.cream, 'left', 'Serif', 500, 1750);
    this.line(88, 213, 1832, 213, C.hair, 2);
  }
  plate(x, y, w, h) {
    this.rect(x + 3, y + 8, w, h, '#081a20', 20);
    this.rect(x, y, w, h, C.plate, 20, C.rim);
    for (const a of [x + 18, x + w - 18])
      for (const b of [y + 17, y + h - 17]) {
        this.dot(a, b, 4, C.rim);
        this.line(a - 2, b + 1, a + 2, b - 1, C.dark, 1);
      }
  }
  tube(points) {
    this.path(points, '#091b20', 30);
    this.path(points, '#8d795a', 22);
    this.path(points, '#404e48', 14);
    this.path(points, '#858976', 3);
  }
  socket(x, y, accent = C.brass, r = 20) {
    this.dot(x, y + 3, r + 4, C.dark);
    this.dot(x, y, r + 1, accent);
    this.dot(x, y, r - 5, '#23383b');
    this.dot(x, y, r - 11, C.dark);
  }
  tick(x, y, color, size = 14) {
    this.path(
      [
        [x - size, y],
        [x - size * 0.22, y + size * 0.7],
        [x + size, y - size * 0.8],
      ],
      color,
      Math.max(3, size * 0.29),
    );
  }
  carrier(x, y, color = C.brass) {
    this.rect(x - 46, y - 19, 92, 38, C.dark, 19, color, 3);
    this.rect(x - 31, y - 16, 62, 32, color, 6);
    this.line(x - 17, y - 13, x - 17, y + 13, C.ink, 3);
    this.line(x + 17, y - 13, x + 17, y + 13, C.ink, 3);
  }
  ticket(
    x,
    y,
    w,
    h,
    { id = 'REQ-10234', label = 'ACCESS REQUEST', verified = false, foot = null } = {},
  ) {
    this.rect(x + 4, y + 9, w, h, '#0a1b1f', 10);
    this.rect(x, y, w, h, C.paper, 10);
    for (let i = 0; i < Math.floor((w - 44) / 17); i++)
      this.dot(x + 23 + 17 * i, y + h - 23, 2.2, '#ae9977');
    this.dot(x + 22, y + 23, 6, '#8d7d60');
    this.dot(x + 22, y + 23, 3, C.bg);
    this.txt(label, x + 40, y + 30, 23, '#52615a', 'left', 'Mono', 500, w - 62);
    this.txt(id, x + 25, y + h * 0.43, Math.min(52, w / 6.4), C.ink, 'left', 'Serif', 600, w - 50);
    this.line(x + 24, y + h * 0.59, x + w - 24, y + h * 0.59, '#baa98c', 2);
    this.txt(
      foot ?? (verified ? 'Proof verified' : 'Proof missing'),
      x + 25,
      y + h * 0.77,
      Math.min(35, w / 8),
      verified ? '#19614e' : '#85432c',
      'left',
      'Sans',
      600,
      w - 50,
    );
  }
  ruler(x, y, w, min, max, ticks) {
    const pos = (v) => x + (w * (v - min)) / (max - min);
    this.line(x, y, x + w, y, C.rim, 5);
    ticks.forEach((v) => {
      this.line(pos(v), y - 8, pos(v), y + 9, C.faint, 2);
      this.mono(fmt(v), pos(v), y + 36, 23, C.faint, 'center');
    });
    return pos;
  }
  note(str, x = 960, y = 937, color = C.faint, size = 34) {
    this.txt(str, x, y, size, color, 'center', 'Sans', 500, 1730);
  }
  arrow(x, y, xx, yy, color = C.green, width = 5) {
    this.line(x, y, xx, yy, color, width);
    const a = Math.atan2(yy - y, xx - x);
    for (const offs of [-0.51, 0.51])
      this.line(xx, yy, xx - 18 * Math.cos(a + offs), yy - 18 * Math.sin(a + offs), color, width);
  }
  window(x, y, w, h, value, color = C.cream) {
    this.rect(x, y, w, h, C.dark, 9, C.rim);
    this.mono(value, x + w / 2, y + h / 2 + 1, Math.min(58, h * 0.65), color, 'center', w - 18);
  }
  pill(x, y, w, h, word, fill = C.paper, ink = C.ink) {
    this.rect(x, y, w, h, fill, 9);
    this.txt(
      word,
      x + w / 2,
      y + h / 2,
      Math.min(34, h * 0.52),
      ink,
      'center',
      'Sans',
      600,
      w - 15,
    );
  }
}
