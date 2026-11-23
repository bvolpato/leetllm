import { lessonFont } from '../../../lib/fonts.mjs';

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (t) => Math.max(0, Math.min(1, t));
export const smooth = (t) => t * t * (3 - 2 * t);
export function at(clock, beat, phrase, seconds = 0.65) {
  const index = clock.beat.beatIndex;
  if (index !== beat) return Number(index > beat);
  return smooth(clock.reveal(phrase, seconds));
}

export function pen(c, night = false) {
  const palette = night
    ? {
        bg: '#162e35',
        ink: '#fff5dc',
        sub: '#bfd0c6',
        line: '#526c70',
        faint: '#263f46',
        sheet: '#203a41',
        sea: '#75d7c4',
        blue: '#9ab6ff',
        gold: '#ffd274',
        red: '#ff9a78',
        white: '#172e35',
      }
    : {
        bg: '#f6f0df',
        ink: '#203630',
        sub: '#52665c',
        line: '#a9b3a3',
        faint: '#e7e5d4',
        sheet: '#fffbeb',
        sea: '#147062',
        blue: '#415f9c',
        gold: '#ad6316',
        red: '#b7442f',
        white: '#fff9e7',
      };
  const { ink, line: rule } = palette;
  function type(value, x, y, size, color = ink, font = 'sans', align = 'left', weight = 400) {
    c.fillStyle = color;
    c.font = lessonFont(size, font, weight);
    c.textBaseline = 'alphabetic';
    c.textAlign = align;
    c.fillText(String(value), x, y);
  }
  function box(x, y, w, h, fill, edge, width = 1) {
    if (fill) {
      c.fillStyle = fill;
      c.fillRect(x, y, w, h);
    }
    if (edge) {
      c.lineWidth = width;
      c.strokeStyle = edge;
      c.strokeRect(x, y, w, h);
    }
  }
  function path(points, color = ink, width = 2, fill = null, close = false) {
    c.beginPath();
    c.moveTo(...points[0]);
    for (const point of points.slice(1)) c.lineTo(...point);
    if (close) c.closePath();
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (color) {
      c.strokeStyle = color;
      c.lineWidth = width;
      c.stroke();
    }
  }
  function line(x, y, X, Y, color = rule, width = 1) {
    path(
      [
        [x, y],
        [X, Y],
      ],
      color,
      width,
    );
  }
  function dot(x, y, r, fill, edge, width = 1) {
    c.beginPath();
    c.arc(x, y, r, 0, 2 * Math.PI);
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (edge) {
      c.lineWidth = width;
      c.strokeStyle = edge;
      c.stroke();
    }
  }
  function arrow(x, y, X, Y, color, width = 3, head = 10) {
    const d = Math.hypot(X - x, Y - y);
    if (d < 1) return;
    const ux = (X - x) / d,
      uy = (Y - y) / d,
      n = Math.min(head, d);
    line(x, y, X - ux * n * 0.7, Y - uy * n * 0.7, color, width);
    path(
      [
        [X, Y],
        [X - ux * n - uy * n * 0.48, Y - uy * n + ux * n * 0.48],
        [X - ux * n + uy * n * 0.48, Y - uy * n - ux * n * 0.48],
      ],
      null,
      0,
      color,
      true,
    );
  }
  const mono = (v, x, y, size = 21, color = ink, align = 'left') =>
    type(v, x, y, size, color, 'mono', align);
  const serif = (v, x, y, size = 38, color = ink, align = 'left') =>
    type(v, x, y, size, color, 'serif', align);
  function label(v, x, y, color = palette.sub, align = 'left') {
    type(v, x, y, 16, color, 'sans', align, 600);
  }
  function header(section, title) {
    box(0, 0, 1200, 675, palette.bg);
    label(section.toUpperCase(), 52, 44);
    serif(title, 50, 108, 46);
    line(52, 132, 1148, 132, rule, 1);
  }
  return { c, ...palette, type, mono, serif, box, path, line, dot, arrow, label, header, rule };
}
