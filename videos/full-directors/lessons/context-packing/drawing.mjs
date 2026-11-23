export const C = {
  paper: '#f2eddd',
  white: '#fffaf0',
  ink: '#222f35',
  mute: '#566669',
  line: '#b6b4a6',
  green: '#216d64',
  mint: '#bbd9c7',
  ochre: '#e6b255',
  gold: '#986424',
  blue: '#45617c',
  pale: '#d7e0e5',
  red: '#ab443c',
  rose: '#f1c9b9',
  empty: '#deded3',
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);

export function box(g, x, y, w, h, fill, stroke = null, lw = 2) {
  if (fill) {
    g.fillStyle = fill;
    g.fillRect(x, y, w, h);
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = lw;
    g.strokeRect(x, y, w, h);
  }
}
export function line(g, x, y, x2, y2, color = C.line, width = 2, dash = []) {
  g.save();
  g.setLineDash(dash);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x2, y2);
  g.stroke();
  g.restore();
}
export function circle(g, x, y, r, fill, stroke = null, lw = 2) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = lw;
    g.stroke();
  }
}
export function txt(g, value, x, y, size = 36, opts = {}) {
  const { color = C.ink, face = 'Sans', align = 'left', weight = 400, max = 1800 } = opts;
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillText(String(value), x, y, max);
}
export const mono = (g, v, x, y, size = 29, opts = {}) =>
  txt(g, v, x, y, size, { face: 'Mono', ...opts });
export const serif = (g, v, x, y, size = 60, opts = {}) =>
  txt(g, v, x, y, size, { face: 'Serif', ...opts });
export function paper(g, x, y, w, h, fill = C.white) {
  box(g, x + 7, y + 9, w, h, '#c7c5b8');
  box(g, x, y, w, h, fill, C.ink, 2);
}
export function layout(g, section, title) {
  box(g, 0, 0, 1920, 1080, C.paper);
  box(g, 0, 0, 24, 1080, C.ink);
  mono(g, section, 90, 83, 30, { color: C.green, weight: 600 });
  serif(g, title, 86, 195, 78, { max: 1740 });
  line(g, 90, 234, 1830, 234, C.ink, 3);
}
export function foot(g, msg, sub = '') {
  if (sub) {
    mono(g, sub, 94, 855, 29, { color: C.mute, max: 1728 });
  }
  line(g, 90, 888, 1830, 888, C.line, 2);
  txt(g, msg, 90, 954, 43, { weight: 500, max: 1720 });
}
export function stamp(g, msg, x, y, w, color = C.green) {
  box(g, x, y, w, 63, null, color, 3);
  mono(g, msg, x + w / 2, y + 43, 29, { align: 'center', weight: 600, color, max: w - 24 });
}
export function alpha(g, a, paint) {
  if (a <= 0) return;
  g.save();
  g.globalAlpha *= a;
  paint();
  g.restore();
}
export function cue(clock, beat, phrase, duration = 0.65) {
  const n = clock.beat.beatIndex;
  return n < beat ? 0 : n > beat ? 1 : smooth(clock.reveal(phrase, duration));
}
export function endCue(clock, beat, duration = 0.45) {
  const n = clock.beat.beatIndex;
  return n < beat
    ? 0
    : n > beat
      ? 1
      : smooth(Math.min(1, Math.max(0, (clock.elapsed - clock.speechDuration) / duration)));
}

// Each piece represents a whole serialized packet. Its type and width travel together.
export function rail(g, parts, { x = 120, y = 618, unit = 50, capacity = 32, height = 100 } = {}) {
  box(g, x - 10, y - 11, capacity * unit + 20, height + 22, C.ink);
  box(g, x, y, capacity * unit, height, C.empty);
  for (let j = 0; j < capacity; j++) line(g, x + j * unit, y, x + j * unit, y + height, C.white, 2);
  for (const part of parts) {
    const { start, n, label, fill = C.mint, stripe = false } = part;
    const left = x + start * unit,
      w = n * unit;
    box(g, left + 1, y + 1, w - 2, height - 2, fill, C.ink, 2);
    for (let j = 0; j < n; j++)
      line(
        g,
        left + (j + 0.5) * unit,
        y + height - 12,
        left + (j + 0.5) * unit,
        y + height - 3,
        C.ink,
        2,
      );
    if (stripe) {
      g.save();
      g.beginPath();
      g.rect(left + 2, y + 2, w - 4, 14);
      g.clip();
      for (let i = -16; i < w + 16; i += 16) line(g, left + i, y + 17, left + i + 16, y, C.blue, 4);
      g.restore();
    }
    txt(g, label, left + w / 2, y + height * 0.62, 34, {
      align: 'center',
      weight: 600,
      max: w - 18,
    });
  }
}
export function rows(g, x, y, lines, width = 730, step = 92) {
  lines.forEach(([a, b], i) => {
    line(g, x, y + step * i + 15, x + width, y + step * i + 15, C.line, 2);
    txt(g, a, x, y + step * i, 34, { max: width * 0.56 });
    mono(g, b, x + width, y + step * i, 34, { align: 'right', weight: 600, max: width * 0.43 });
  });
}
