export const C = {
  night: '#131d29',
  deep: '#0d1721',
  teal: '#203a40',
  line: '#516978',
  ink: '#fff3d9',
  dim: '#bad0d3',
  faint: '#789299',
  paper: '#f6e8c7',
  pink: '#ff90a4',
  blue: '#8fbcea',
  gold: '#ffd47c',
  mint: '#81dbc2',
  dark: '#172735',
};
export const mix = (a, b, q) => a + (b - a) * q;
export const pc = (p, digits = 0) => (100 * p).toFixed(digits) + '%';
export const lerpScale = (a, b, low, high) => (p) => mix(a, b, (p - low) / (high - low));

export function cue(s, beat, words, seconds = 0.55, options) {
  if (s.beat.beatIndex !== beat) return Number(s.beat.beatIndex > beat);
  return s.reveal(words, seconds, options);
}

export function txt(g, str, x, y, px = 36, color = C.ink, align = 'left', face = 'Sans') {
  g.fillStyle = color;
  g.font = '400 ' + px + 'px "Lesson ' + face + '"';
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(String(str), x, y);
}

export function path(g, points, color, width = 3, fill = false) {
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (fill) {
    g.closePath();
    g.fillStyle = color;
    g.fill();
  } else {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  }
}

export function box(g, x, y, w, h, color, r = 0, outline) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = color;
  g.fill();
  if (outline) {
    g.lineWidth = 2;
    g.strokeStyle = outline;
    g.stroke();
  }
}
export function dot(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fillStyle = color;
  g.fill();
}
export function line(g, x, y, x2, y2, color = C.line, w = 3) {
  path(
    g,
    [
      [x, y],
      [x2, y2],
    ],
    color,
    w,
  );
}

export function scene(g, section, title) {
  const light = g.createRadialGradient(570, 350, 100, 850, 480, 1270);
  light.addColorStop(0, '#253e47');
  light.addColorStop(0.62, C.night);
  light.addColorStop(1, C.deep);
  box(g, 0, 0, 1920, 1080, light);
  txt(g, section, 106, 71, 27, C.gold, 'left', 'Mono');
  txt(g, title, 102, 155, 66, C.ink, 'left', 'Serif');
}

export function ruler(g, X, ticks, y, format = (p) => pc(p)) {
  line(g, X(ticks[0]), y, X(ticks.at(-1)), y, C.faint);
  for (const p of ticks) {
    line(g, X(p), y - 8, X(p), y + 10, C.faint);
    txt(g, format(p), X(p), y + 41, 26, C.dim, 'center', 'Mono');
  }
}

export function interval(g, X, y, v, rate, color = C.mint, q = 1) {
  if (!q) return;
  // Wipe a finished interval across the scale. Caps appear only at their true coordinates.
  const left = X(v.low),
    right = X(v.high),
    edge = mix(left, right, q);
  line(g, left, y, edge, y, color, 9);
  line(g, left, y - 17, left, y + 17, color, 4);
  if (q === 1) line(g, right, y - 17, right, y + 17, color, 4);
  if (X(rate) <= edge + 0.1) {
    dot(g, X(rate), y, 14, C.dark);
    dot(g, X(rate), y, 10, C.gold);
  }
}
export function bracket(g, x1, x2, y, h, color = C.gold) {
  path(
    g,
    [
      [x1, y - h],
      [x1, y],
      [x2, y],
      [x2, y - h],
    ],
    color,
    4,
  );
}

// Closed mail has a triangular flap. An opened case carries either one bar or a specialist cross.
export function envelope(g, x, y, w, h, kind, id = '') {
  const sealed = kind === null;
  const c = sealed ? C.teal : kind ? C.pink : C.blue;
  box(g, x + 2, y + 4, w, h, '#10202a', Math.min(6, h / 8));
  box(g, x, y, w, h, c, Math.min(6, h / 8), sealed ? C.faint : undefined);
  if (sealed) {
    path(
      g,
      [
        [x + 2, y + 3],
        [x + w / 2, y + h * 0.61],
        [x + w - 2, y + 3],
      ],
      C.faint,
      Math.max(1, h / 24),
    );
  } else {
    const cx = id ? x + 0.19 * w : x + w / 2,
      cy = y + h / 2,
      r = Math.min(w * 0.18, h * 0.21);
    line(g, cx - r, cy, cx + r, cy, C.dark, Math.max(2, r * 0.4));
    if (kind) line(g, cx, cy - r, cx, cy + r, C.dark, Math.max(2, r * 0.4));
    if (id) txt(g, id, x + w * 0.61, cy, Math.min(h * 0.38, w * 0.145), C.dark, 'center', 'Mono');
  }
}

export function matrix(g, rows, x, y, cols, dx, dy, w, h) {
  rows.forEach((kind, i) =>
    envelope(g, x + (i % cols) * dx, y + Math.floor(i / cols) * dy, w, h, kind),
  );
}
export function stamp(g, word, x, y, w, color) {
  box(g, x, y, w, 75, C.deep, 7, color);
  txt(g, word, x + w / 2, y + 37, 37, color, 'center', 'Mono');
}
export function summary(g, label, value, x, y, color = C.gold) {
  txt(g, label, x, y, 31, C.dim);
  txt(g, value, x, y + 73, 64, color, 'left', 'Serif');
}
