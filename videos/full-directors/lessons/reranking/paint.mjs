// Ink, paper and three spot colors tie the library prints to the worked examples.
export const C = {
  paper: '#f5ebd5',
  white: '#fff8e7',
  ink: '#203848',
  faint: '#d7c9af',
  muted: '#586b69',
  blue: '#315d85',
  teal: '#166855',
  gold: '#bc8028',
  red: '#a14236',
  lilac: '#756189',
  night: '#142e3d',
  sky: '#b9d7d7',
  mint: '#bcdac3',
  rose: '#e8c2ad',
  brass: '#d8ac5e',
};
export const mix = (a, b, t) => a + (b - a) * t;
export const clamp = (t) => Math.max(0, Math.min(1, t));
const ease = (t) => t * t * (3 - 2 * t);
export function cue(clock, beat, phrase, duration = 0) {
  const index = clock.beat.beatIndex + 1;
  return index === beat ? ease(clock.reveal(phrase, duration)) : Number(index > beat);
}
export class Plate {
  constructor(ctx, clock) {
    this.c = ctx;
    this.clock = clock;
    this.b = clock.beat.beatIndex + 1;
  }
  at(beat, phrase, duration = 0) {
    return cue(this.clock, beat, phrase, duration);
  }
  box(x, y, w, h, fill = C.white, stroke = null, lw = 3) {
    this.c.fillStyle = fill;
    this.c.fillRect(x, y, w, h);
    if (stroke) {
      this.c.strokeStyle = stroke;
      this.c.lineWidth = lw;
      this.c.strokeRect(x, y, w, h);
    }
  }
  line(x, y, X, Y, col = C.ink, width = 3) {
    this.path(
      [
        [x, y],
        [X, Y],
      ],
      col,
      width,
    );
  }
  path(points, col = C.ink, width = 3, fill = null) {
    const c = this.c;
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    if (fill) {
      c.closePath();
      c.fillStyle = fill;
      c.fill();
    }
    if (width) {
      c.strokeStyle = col;
      c.lineWidth = width;
      c.lineJoin = 'round';
      c.stroke();
    }
  }
  dot(x, y, r, col = C.ink, stroke = null, lw = 3) {
    const c = this.c;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = col;
    c.fill();
    if (stroke) {
      c.lineWidth = lw;
      c.strokeStyle = stroke;
      c.stroke();
    }
  }
  text(str, x, y, size = 42, color = C.ink, family = 'Sans', align = 'left', weight = 400) {
    const c = this.c;
    c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = 'alphabetic';
    c.fillText(String(str), x, y);
  }
  mono(s, x, y, size = 34, color = C.ink, align = 'left') {
    this.text(s, x, y, size, color, 'Mono', align);
  }
  title(s, x = 96, y = 188, size = 70) {
    this.text(s, x, y, size, C.ink, 'Serif');
  }
  words(s, x, y, maxWidth, size = 38, leading = size * 1.35, color = C.ink, family = 'Serif') {
    this.c.font = '400 ' + size + 'px "Lesson ' + family + '"';
    let row = '';
    for (const word of s.split(/\s+/)) {
      const next = row ? row + ' ' + word : word;
      if (row && this.c.measureText(next).width > maxWidth) {
        this.text(row, x, y, size, color, family);
        y += leading;
        row = word;
      } else row = next;
    }
    if (row) this.text(row, x, y, size, color, family);
    return y;
  }
  sheet(x, y, w, h, fill = C.white) {
    this.box(x + 8, y + 10, w, h, C.faint);
    this.box(x, y, w, h, fill);
    this.line(x + 5, y + h - 7, x + w - 5, y + h - 7, C.faint, 2);
  }
  base(section, folio) {
    this.box(0, 0, 1920, 1080, C.paper);
    this.mono(section.toUpperCase(), 95, 82, 26, C.muted);
    this.mono(folio, 1825, 82, 28, C.muted, 'right');
    this.line(96, 110, 1824, 110, C.faint, 2);
  }
  arrow(x, y, X, Y, color = C.teal, w = 5) {
    this.line(x, y, X, Y, color, w);
    const a = Math.atan2(Y - y, X - x);
    this.path(
      [
        [X - 18 * Math.cos(a - 0.5), Y - 18 * Math.sin(a - 0.5)],
        [X, Y],
        [X - 18 * Math.cos(a + 0.5), Y - 18 * Math.sin(a + 0.5)],
      ],
      color,
      w,
    );
  }
  clip(x, y, w, h, draw) {
    const c = this.c;
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    draw();
    c.restore();
  }
}
