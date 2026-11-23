export const P = {
  bg: '#142f32',
  deep: '#0d2528',
  ridge: '#355459',
  paper: '#f6efda',
  back: '#d6cdb6',
  ink: '#183537',
  soft: '#52625c',
  rule: '#b1b8a8',
  control: '#25747b',
  rewrite: '#644c87',
  brass: '#efbc63',
  gold: '#92621d',
  good: '#23684e',
  bad: '#9d422e',
  white: '#fff9e8',
};
export const integer = (n) => n.toLocaleString('en-US');
export const signed = (n, k = 2) => (n < 0 ? '−' : '+') + Math.abs(n).toFixed(k);
export const pct = (n, k = 0) => (100 * n).toFixed(k) + '%';
export const scale = (a, b, x, y) => (v) => x + ((v - a) * (y - x)) / (b - a);
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const beat = (k) => k.beat.beatIndex + 1;

// A reveal in a later beat stays reached when the host seeks out of order.
export function cue(k, n, phrase, seconds = 0, options) {
  if (beat(k) !== n) return Number(beat(k) > n);
  if (phrase === 'end') return Number(k.elapsed >= k.speechDuration);
  return k.reveal(phrase, seconds, options);
}

export function after(k, n, phrase) {
  if (beat(k) !== n) return beat(k) > n;
  const { start, end } = k.wordCue(phrase);
  return cue(k, n, phrase, end - start, { captionStart: false }) === 1;
}

export class Surface {
  constructor(ctx) {
    this.c = ctx;
  }
  box(x, y, w, h, fill, r = 0) {
    const c = this.c;
    c.fillStyle = fill;
    if (!r) {
      c.fillRect(x, y, w, h);
      return;
    }
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fill();
  }
  dot(x, y, r, color) {
    const c = this.c;
    c.beginPath();
    c.arc(x, y, r, 0, 2 * Math.PI);
    c.fillStyle = color;
    c.fill();
  }
  line(points, color = P.rule, w = 3, dash = []) {
    const c = this.c;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = w;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.setLineDash(dash);
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.restore();
  }
  poly(points, fill) {
    const c = this.c;
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }
  txt(
    v,
    x,
    y,
    size = 40,
    col = P.ink,
    { align = 'left', face = 'Sans', weight = 400, max = 1700 } = {},
  ) {
    const c = this.c;
    c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillStyle = col;
    c.fillText(String(v), x, y, max);
  }
  small(v, x, y, col = P.soft, max = 1600) {
    this.txt(v, x, y, 30, col, { face: 'Mono', max });
  }
  title(v, x = 138, y = 165, max = 1630) {
    this.txt(v, x, y, 68, P.ink, { face: 'Serif', max });
  }
  center(v, x, y, size = 42, col = P.ink, max = 1100) {
    this.txt(v, x, y, size, col, { align: 'center', max });
  }
  paper(x, y, w, h) {
    this.box(x + 8, y + 12, w, h, '#091f21', 10);
    this.box(x + 3, y + 6, w, h, P.back, 9);
    this.box(x, y, w, h, P.paper, 8);
  }
  page(kicker, title) {
    this.paper(75, 60, 1770, 872);
    this.small(kicker, 138, 100, P.control);
    this.title(title);
    this.line([
      [138, 224],
      [1780, 224],
    ]);
  }
  axis(X, vs, y, fmt = String, col = P.soft) {
    this.line(
      [
        [X(vs[0]), y],
        [X(vs.at(-1)), y],
      ],
      P.rule,
      3,
    );
    for (const v of vs) {
      this.line(
        [
          [X(v), y - 8],
          [X(v), y + 9],
        ],
        col,
        3,
      );
      this.center(fmt(v), X(v), y + 39, 28, col, 160);
    }
  }
  span(X, lo, hi, y, color = P.control, w = 10) {
    this.line(
      [
        [X(lo), y],
        [X(hi), y],
      ],
      color,
      w,
    );
    for (const v of [lo, hi])
      this.line(
        [
          [X(v), y - 17],
          [X(v), y + 17],
        ],
        color,
        5,
      );
  }
  bed() {
    const g = this.c.createLinearGradient(0, 0, 1920, 1080);
    g.addColorStop(0, P.ridge);
    g.addColorStop(0.65, P.bg);
    g.addColorStop(1, P.deep);
    this.box(0, 0, 1920, 1080, g);
    for (let i = 0; i < 5; i++)
      this.line(
        [
          [0, 975 + i * 9],
          [1920, 975 + i * 9],
        ],
        '#1c3739',
        1,
      );
  }
}
