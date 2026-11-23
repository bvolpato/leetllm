export const C = {
  bg: '#101f2b',
  panel: '#203846',
  deep: '#102634',
  ink: '#fbf4db',
  muted: '#b9c8cb',
  line: '#56717b',
  gold: '#ffd17a',
  green: '#8be1be',
  coral: '#ff9f91',
  blue: '#9ecbff',
  paper: '#eee4c5',
  print: '#243443',
  archive: '#e0a4b0',
};

export function mix(a, b, amount) {
  return a + (b - a) * amount;
}
export function ease(t) {
  return t * t * (3 - 2 * t);
}
export function cue(clock, beat, phrase, span = 0) {
  if (clock.beat.beatIndex !== beat) return Number(clock.beat.beatIndex > beat);
  return clock.reveal(phrase, span);
}

export class Bench {
  constructor(ctx) {
    this.ctx = ctx;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
  box(x, y, w, h, fill, edge, radius = 4, width = 1.5) {
    const c = this.ctx;
    c.beginPath();
    c.roundRect(x, y, w, h, radius);
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (edge) {
      c.strokeStyle = edge;
      c.lineWidth = width;
      c.stroke();
    }
  }
  stroke(points, color = C.line, width = 2, dashed = false) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(...points[0]);
    for (const xy of points.slice(1)) c.lineTo(...xy);
    c.strokeStyle = color;
    c.lineWidth = width;
    c.setLineDash(dashed ? [6, 6] : []);
    c.stroke();
    c.setLineDash([]);
  }
  poly(points, fill, edge) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(...points[0]);
    for (const xy of points.slice(1)) c.lineTo(...xy);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    if (edge) {
      c.strokeStyle = edge;
      c.lineWidth = 1.6;
      c.stroke();
    }
  }
  dot(x, y, r, fill, edge) {
    const c = this.ctx;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
    if (edge) {
      c.strokeStyle = edge;
      c.lineWidth = 1.5;
      c.stroke();
    }
  }
  text(str, x, y, size = 20, color = C.ink, opts = {}) {
    const c = this.ctx;
    c.font = (opts.weight || 400) + ' ' + size + 'px "Lesson ' + (opts.font || 'Sans') + '"';
    c.textAlign = opts.align || 'left';
    c.textBaseline = 'middle';
    c.fillStyle = color;
    c.fillText(String(str), x, y);
  }
  mono(str, x, y, size = 17, color = C.ink, align = 'left') {
    this.text(str, x, y, size, color, { font: 'Mono', align });
  }
  base(scope, heading) {
    const c = this.ctx;
    c.fillStyle = C.bg;
    c.fillRect(0, 0, 960, 540);
    const g = c.createLinearGradient(0, 83, 960, 435);
    g.addColorStop(0, '#1c3442');
    g.addColorStop(0.58, '#192f3f');
    g.addColorStop(1, '#172c36');
    this.box(16, 99, 928, 331, g, '#47626c', 10);
    c.save();
    c.globalAlpha = 0.22;
    for (let x = 32; x < 940; x += 20)
      for (let y = 114; y < 425; y += 20) this.dot(x, y, 0.7, '#8dabb7');
    c.restore();
    for (const x of [25, 935])
      for (const y of [108, 421]) {
        this.dot(x, y, 2.4, C.line);
        this.stroke(
          [
            [x - 1, y + 1],
            [x + 1, y - 1],
          ],
          C.deep,
          1,
        );
      }
    this.mono(scope, 29, 24, 13, C.blue);
    this.text(heading, 28, 64, 34, C.ink, { font: 'Serif' });
  }
  footer(str, color = C.gold) {
    this.stroke(
      [
        [28, 452],
        [41, 452],
      ],
      color,
      3,
    );
    this.text(str, 51, 452, 20, color);
  }
  arrow(x1, y, x2, color = C.line) {
    this.stroke(
      [
        [x1, y],
        [x2, y],
      ],
      color,
      2.5,
    );
    const d = Math.sign(x2 - x1);
    this.stroke(
      [
        [x2 - 8 * d, y - 5],
        [x2, y],
        [x2 - 8 * d, y + 5],
      ],
      color,
      2.5,
    );
  }
  // A file has an exposed cell for its byte. A blank cell represents empty contents.
  file(x, y, w, h, title, value, subtitle = '', tone = C.paper) {
    this.poly(
      [
        [x, y],
        [x + w - 18, y],
        [x + w, y + 18],
        [x + w, y + h],
        [x, y + h],
      ],
      tone,
      C.print,
    );
    this.stroke(
      [
        [x + w - 18, y + 1],
        [x + w - 18, y + 18],
        [x + w - 1, y + 18],
      ],
      C.print,
      1.4,
    );
    this.mono(title, x + 12, y + 23, 15, C.print);
    this.stroke(
      [
        [x + 12, y + 39],
        [x + w - 12, y + 39],
      ],
      '#a79f8f',
      1,
    );
    this.text(value, x + w / 2, y + h * 0.61, value.length > 3 ? 25 : 45, C.print, {
      font: 'Mono',
      align: 'center',
    });
    if (subtitle) this.mono(subtitle, x + w / 2, y + h - 15, 13, C.print, 'center');
  }
  byte(x, y, value = 'x') {
    this.box(x - 16, y - 16, 32, 32, C.gold, C.print, 4, 2);
    this.mono(value, x, y - 1, 24, C.print, 'center');
  }
  folder(x, y, w, name, tone = C.blue) {
    const h = 44;
    this.poly(
      [
        [x, y],
        [x + 9, y - 8],
        [x + w * 0.4, y - 8],
        [x + w * 0.46, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ],
      tone,
      C.print,
    );
    this.stroke(
      [
        [x + 3, y + 6],
        [x + w - 3, y + 6],
      ],
      C.print,
      1,
    );
    this.mono(name, x + w / 2, y + 26, 18, C.print, 'center');
  }
  track(x1, x2, y) {
    this.stroke(
      [
        [x1, y - 3],
        [x2, y - 3],
      ],
      C.line,
      2,
    );
    this.stroke(
      [
        [x1, y + 3],
        [x2, y + 3],
      ],
      C.line,
      2,
    );
    for (let x = x1 + 6; x < x2; x += 19)
      this.stroke(
        [
          [x, y - 5],
          [x, y + 5],
        ],
        C.line,
        1,
      );
  }
  worker(x, y, color = C.blue) {
    this.box(x - 26, y - 22, 52, 34, color, C.print, 6, 2);
    this.box(x - 17, y - 16, 34, 16, C.deep, null, 3);
    this.mono('>_', x, y - 9, 13, C.ink, 'center');
    for (const dx of [-16, 16]) this.dot(x + dx, y + 13, 5, C.muted, C.print);
  }
}
