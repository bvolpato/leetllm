// All positions are in a 1280 × 720 composition. The host supplies a 1920 × 1080 canvas.
const midnight = {
  bg: '#10262e',
  far: '#09191f',
  ink: '#fff5d9',
  muted: '#adc1be',
  line: '#48636a',
  bed: '#213d45',
  cyan: '#74d9ea',
  gold: '#f4bd62',
  green: '#8de2ae',
  red: '#ff9c8e',
  violet: '#baaef1',
  reverse: '#10262e',
};
const paper = {
  bg: '#f4eddc',
  far: '#e8dfcd',
  ink: '#1b3438',
  muted: '#49666a',
  line: '#abbbb2',
  bed: '#e2e3d4',
  cyan: '#156b88',
  gold: '#92500e',
  green: '#10644b',
  red: '#a33e37',
  violet: '#73558e',
  reverse: '#fff8e5',
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (t) => Math.max(0, Math.min(1, t));
export function art(g, clock, light) {
  const c = light ? paper : midnight;
  g.scale(1.5, 1.5);
  const bg = g.createLinearGradient(0, 0, 950, 840);
  bg.addColorStop(0, c.bg);
  bg.addColorStop(1, c.far);
  g.fillStyle = bg;
  g.fillRect(0, 0, 1280, 720);
  function box(x, y, w, h, fill, stroke, r = 0) {
    if (w <= 0 || h <= 0) return;
    g.beginPath();
    g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
    if (fill) {
      g.fillStyle = fill;
      g.fill();
    }
    if (stroke) {
      g.lineWidth = 1.6;
      g.strokeStyle = stroke;
      g.stroke();
    }
  }
  function path(points, color, width = 3, closed = false, fill = false) {
    if (!points.length) return;
    g.beginPath();
    g.moveTo(...points[0]);
    for (const v of points.slice(1)) g.lineTo(...v);
    if (closed) g.closePath();
    if (fill) {
      g.fillStyle = color;
      g.fill();
    } else {
      g.strokeStyle = color;
      g.lineWidth = width;
      g.lineJoin = 'round';
      g.lineCap = 'round';
      g.stroke();
    }
  }
  function line(x, y, X, Y, color = c.line, w = 2) {
    path(
      [
        [x, y],
        [X, Y],
      ],
      color,
      w,
    );
  }
  function dot(x, y, r, color) {
    g.fillStyle = color;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  function text(s, x, y, sz = 26, col = c.ink, opts = {}) {
    const { align = 'left', face = 'Sans', weight = 500, max } = opts;
    g.font = weight + ' ' + sz + 'px "Lesson ' + face + '"';
    g.fillStyle = col;
    g.textAlign = align;
    g.textBaseline = 'alphabetic';
    g.fillText(String(s), x, y, max ?? 10000);
  }
  function mono(s, x, y, sz = 24, col = c.ink, align = 'left') {
    text(s, x, y, sz, col, { face: 'Mono', align });
  }
  function title(kicker, name) {
    text(kicker.toUpperCase(), 64, 59, 18, c.muted, { weight: 700 });
    text(name, 62, 134, 54, c.ink, { face: 'Serif', weight: 400, max: 1156 });
  }
  function fade(alpha, fn) {
    if (alpha <= 0) return;
    g.save();
    g.globalAlpha *= clamp(alpha);
    fn();
    g.restore();
  }
  function arrow(x, y, X, Y, col = c.cyan, w = 3) {
    line(x, y, X, Y, col, w);
    const a = Math.atan2(Y - y, X - x);
    path(
      [
        [X - 14 * Math.cos(a - 0.45), Y - 14 * Math.sin(a - 0.45)],
        [X, Y],
        [X - 14 * Math.cos(a + 0.45), Y - 14 * Math.sin(a + 0.45)],
      ],
      col,
      w,
    );
  }
  function tile(x, y, w, h, value, fill = c.bed, col = c.ink, sz = 28) {
    box(x, y + 3, w, h, c.far, null, 5);
    box(x, y, w, h, fill, c.line, 5);
    mono(value, x + w / 2, y + h / 2 + sz * 0.33, sz, col, 'center');
  }
  function key(x, y, s = 1, col = c.gold) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    const pts = [
      [-34, -28],
      [-14, -43],
      [13, -43],
      [35, -22],
      [35, 0],
      [20, 15],
      [8, 15],
      [8, 59],
      [-2, 69],
      [-16, 69],
      [-16, 49],
      [-28, 49],
      [-28, 35],
      [-16, 35],
      [-16, 15],
      [-34, 0],
    ];
    path(pts, c.far, 2, true, true);
    g.translate(-2, -3);
    path(pts, col, 1, true, true);
    path(
      [
        [-25, -23],
        [-11, -33],
        [10, -33],
        [24, -19],
      ],
      light ? '#e7bc73' : '#ffe7b7',
      3,
    );
    dot(0, -17, 11, c.bg);
    g.restore();
  }
  function axis(x, y, w, min, max, values, format = (v) => String(v)) {
    line(x, y, x + w, y, c.line, 3);
    const pos = (v) => x + ((v - min) * w) / (max - min);
    for (const v of values) {
      line(pos(v), y - 7, pos(v), y + 10, c.line, 2);
      mono(format(v), pos(v), y + 40, 20, c.muted, 'center');
    }
    return pos;
  }
  const beat = clock.beat.beatIndex + 1;
  function cue(n, phrase, duration = 0.8, options) {
    if (beat < n) return 0;
    if (beat > n) return 1;
    const t = clock.reveal(phrase, duration, options);
    return t * t * (3 - 2 * t);
  }
  function afterCue(n, phrase, captionStart = phrase) {
    if (beat !== n) return beat > n;
    const { start, end } = clock.wordCue(phrase);
    return clock.reveal(phrase, end - start, { captionStart }) === 1;
  }
  return {
    c,
    g,
    beat,
    cue,
    afterCue,
    box,
    path,
    line,
    dot,
    text,
    mono,
    title,
    fade,
    arrow,
    tile,
    key,
    axis,
    progress: clock.progress,
  };
}

export function travel(a, points, t, color, r = 8) {
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let distance = clamp(t) * lengths.reduce((s, n) => s + n, 0);
  for (let i = 0; i < lengths.length; i++) {
    const part = Math.min(distance, lengths[i]) / lengths[i];
    const [x, y] = points[i],
      [u, v] = points[i + 1];
    const X = lerp(x, u, part),
      Y = lerp(y, v, part);
    a.line(x, y, X, Y, color, 6);
    if (distance <= lengths[i] || i === lengths.length - 1) {
      a.dot(X, Y, r, color);
      return [X, Y];
    }
    distance -= lengths[i];
  }
}
