export const C = {
  ink: '#f7f0d9',
  dim: '#b0c0bd',
  faint: '#70898b',
  line: '#426169',
  dark: '#101d26',
  slate: '#243943',
  blue: '#83ddd5',
  amber: '#ffc56d',
  rose: '#f5a799',
  blueGlass: '#285e63',
  goldGlass: '#77532c',
  edge: '#ad9771',
};
export const mix = (a, b, p) => a + (b - a) * p;
export const clamp = (v) => Math.max(0, Math.min(1, v));
export function cue(clock, beat, phrase, duration = 0.6) {
  if (clock.beat.beatIndex !== beat) return Number(clock.beat.beatIndex > beat);
  return clock.reveal(phrase, duration);
}
export function txt(
  g,
  s,
  x,
  y,
  size = 38,
  color = C.ink,
  align = 'left',
  face = 'Sans',
  weight = 400,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(String(s), x, y);
}
export function line(g, x, y, x2, y2, color = C.line, w = 3) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x2, y2);
  g.strokeStyle = color;
  g.lineWidth = w;
  g.stroke();
}
export function box(g, x, y, w, h, color, stroke = null, edge = 2) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = edge;
    g.strokeRect(x, y, w, h);
  }
}
export function path(g, pts, fill, stroke = null, width = 2, closed = true) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (closed) g.closePath();
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = width;
    g.stroke();
  }
}
export function dot(g, x, y, r, color, stroke = null, w = 2) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = w;
    g.stroke();
  }
}
export function jewel(g, x, y, actual, r = 23) {
  if (actual === null) {
    const points = Array.from({ length: 6 }, (_, i) => [
      x + r * Math.cos((i * Math.PI) / 3),
      y + r * Math.sin((i * Math.PI) / 3),
    ]);
    path(g, points, '#e8e0cb', '#493e32', 3);
    dot(g, x, y, r * 0.32, '#706f6b');
    return;
  }
  if (actual) {
    const a = [x, y - r * 1.17],
      b = [x + r, y],
      c = [x, y + r * 1.17],
      d = [x - r, y],
      m = [x - r * 0.13, y - r * 0.06];
    path(g, [a, b, c, d], '#e5a34d', '#2b241b', 4);
    path(g, [a, m, d], '#fff0b2');
    path(g, [a, b, m], '#ffce77');
    path(g, [m, b, c], '#b97132');
    return;
  }
  const grad = g.createRadialGradient(x - r * 0.28, y - r * 0.43, r * 0.1, x, y, r);
  grad.addColorStop(0, '#d7fff1');
  grad.addColorStop(0.4, '#85d9cc');
  grad.addColorStop(1, '#398d90');
  dot(g, x, y, r, grad, '#192f34', 3);
  g.beginPath();
  g.arc(x, y, r * 0.74, 3.6, 4.85);
  g.strokeStyle = '#d6ffef';
  g.lineWidth = 2;
  g.stroke();
}
export function background(g, name, title) {
  const grad = g.createLinearGradient(0, 0, 1510, 1080);
  grad.addColorStop(0, '#293a40');
  grad.addColorStop(0.55, '#152730');
  grad.addColorStop(1, '#111d27');
  box(g, 0, 0, 1920, 1080, grad);
  txt(g, name, 96, 76, 26, C.blue, 'left', 'Mono');
  txt(g, title, 92, 167, 67, C.ink, 'left', 'Serif');
}
export function legend(g, x = 120, y = 905) {
  txt(g, 'Observed outcome', x, y, 30, C.dim);
  jewel(g, x + 300, y, 0, 16);
  txt(g, 'Routine', x + 330, y, 31);
  jewel(g, x + 525, y, 1, 16);
  txt(g, 'Needed review', x + 555, y, 31);
}
export function glass(g, x, y, w, h, warm = false) {
  const grad = g.createLinearGradient(x, y, x + w * 0.75, y + h);
  const colors =
    warm === null
      ? ['#39474f', '#51626a', '#33454c']
      : warm
        ? ['#79522f', '#a47841', '#614827']
        : ['#26565d', '#3b797b', '#244a55'];
  colors.forEach((c, i) => grad.addColorStop(i * 0.5, c));
  box(g, x, y, w, h, grad);
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  for (let k = -h; k < w + h; k += 167)
    path(
      g,
      [
        [x + k, y],
        [x + k + 19, y],
        [x + k - h * 0.42 + 5, y + h],
        [x + k - h * 0.42, y + h],
      ],
      'rgba(255,248,210,.043)',
    );
  g.restore();
}
export const stripX = (v) => 122 + ((v - 0.65) / 4.15) * 1676;
export function strip(
  g,
  requests,
  regions,
  {
    top = 358,
    h = 300,
    showRoutes = true,
    focus = [],
    showValues = true,
    axis = 'Ambiguity',
    cuts = true,
  } = {},
) {
  const lo = 0.65,
    hi = 4.8,
    x0 = stripX(lo),
    x1 = stripX(hi);
  const bounds = [lo, ...regions.slice(0, -1).map((p) => p.end), hi];
  box(g, x0 - 9, top - 9, x1 - x0 + 18, h + 18, '#151d21', C.edge, 3);
  regions.forEach((pane, i) => {
    const x = stripX(bounds[i]),
      w = stripX(bounds[i + 1]) - x;
    glass(g, x, top, w, h, pane.label ? null : pane.review);
    if (showRoutes)
      txt(
        g,
        pane.label ?? (pane.review ? 'Add review' : 'Usual checks'),
        x + w / 2,
        top + 52,
        w < 315 ? 29 : 38,
        C.ink,
        'center',
        'Serif',
      );
    if (i && cuts) {
      line(g, x, top - 7, x, top + h + 8, '#302f29', 10);
      line(g, x - 3, top - 7, x - 3, top + h + 7, '#e0c39c', 3);
      txt(g, Number(bounds[i].toFixed(2)), x, top - 42, 30, C.amber, 'center', 'Mono');
    }
  });
  requests.forEach((q) => {
    const x = stripX(q.v),
      y = top + h * 0.56 + (q.dy ?? 0);
    if (focus.includes(q.id)) {
      g.beginPath();
      g.arc(x, y, 45, 0, 2 * Math.PI);
      g.strokeStyle = C.ink;
      g.lineWidth = 3;
      g.stroke();
    }
    jewel(g, x, y, q.label, 28);
    txt(g, q.id, x, y + 62, 31, C.ink, 'center', 'Sans', 600);
    if (showValues) txt(g, q.v.toFixed(1), x, y + 102, 26, C.ink, 'center', 'Mono');
  });
  for (let i = 3; i <= 19; i++) {
    let x = stripX(i / 4);
    line(g, x, top + h + 12, x, top + h + (i % 4 === 0 ? 34 : 23), C.edge, 2);
  }
  txt(g, axis + '  →', x1, top + h + 62, 29, C.dim, 'right');
}
export const neat = (v, n = 2) => Number(v.toFixed(n)).toString().replace('-', '−');
export const signed = (v, n = 2) => (v > 0 ? '+' + neat(v, n) : neat(v, n));
export function sub(g, s, x, y, align = 'left') {
  txt(g, s, x, y, 30, C.dim, align);
}
export function math(g, s, x, y, size = 44, color = C.ink, align = 'left') {
  txt(g, s, x, y, size, color, align, 'Mono');
}
