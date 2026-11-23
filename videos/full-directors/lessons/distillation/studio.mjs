export const C = {
  paper: '#f7efd9',
  light: '#fff9e9',
  edge: '#d9ccb0',
  root: '#35312c',
  muted: '#655f55',
  green: '#276351',
  blue: '#28527a',
  pink: '#a74750',
  gold: '#aa752d',
  brass: '#d7ae5b',
  teal: '#89cabb',
  night: '#18363b',
  white: '#fff3d6',
  faint: '#b9ccc4',
};
export function rect(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}
export function line(g, x, y, xx, yy, color = C.edge, w = 3) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(xx, yy);
  g.lineWidth = w;
  g.strokeStyle = color;
  g.stroke();
}
export function dot(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fillStyle = color;
  g.fill();
}
export function text(
  g,
  s,
  x,
  y,
  n = 42,
  fill = C.root,
  align = 'left',
  face = 'Sans',
  weight = 400,
) {
  g.fillStyle = fill;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.font = weight + ' ' + n + 'px "Lesson ' + face + '", "Lesson Symbols", "Lesson Math"';
  g.fillText(String(s), x, y);
}
export function serif(g, s, x, y, n = 64, fill = C.root, align = 'left') {
  text(g, s, x, y, n, fill, align, 'Serif');
}
export function num(g, s, x, y, n = 36, fill = C.root, align = 'left') {
  text(g, s, x, y, n, fill, align, 'Mono');
}
export function paper(g, dark = false) {
  rect(g, 0, 0, 1920, 1080, dark ? C.night : C.paper);
  const grad = g.createLinearGradient(0, 0, 100, 0);
  grad.addColorStop(0, dark ? '#0c292e' : '#cebfa2');
  grad.addColorStop(1, dark ? C.night : C.paper);
  rect(g, 0, 0, 100, 1080, grad);
  for (let i = 0; i < 250; i++) {
    const x = (i * 641 + i * i * 7) % 1920,
      y = (i * 859 + 23 * i * i) % 1080;
    rect(g, x, y, 2 + (i % 9), 1, dark ? '#284447' : '#e5dac0');
  }
}
export function heading(g, eyebrow, title, dark = false) {
  text(g, eyebrow, 120, 102, 32, dark ? C.teal : C.green);
  serif(g, title, 116, 206, 76, dark ? C.white : C.root);
}
export const clamp = (x) => Math.min(1, Math.max(0, x));
export const mix = (a, b, t) => a + t * (b - a);
export const beat = (k) => k.beat.beatIndex + 1;
// A cue belongs to a single spoken beat and persists through subsequent beats.
export function at(k, b, words, seconds = 0) {
  return beat(k) === b ? k.reveal(words, seconds) : Number(beat(k) > b);
}
export const percent = (x, d = 0) => (100 * x).toFixed(d) + '%';
export const signed = (x, d = 3) => (x < 0 ? '−' : '+') + Math.abs(x).toFixed(d);
export function key(g, x, y, scale = 1) {
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  const metal = g.createLinearGradient(0, -95, 0, 90);
  metal.addColorStop(0, '#f6dda0');
  metal.addColorStop(0.43, '#d3a650');
  metal.addColorStop(0.55, '#e7c883');
  metal.addColorStop(1, '#a77c36');
  const shape = () => {
    g.beginPath();
    g.moveTo(96, -27);
    g.lineTo(397, -27);
    g.lineTo(424, -1);
    for (const [px, py] of [
      [397, 28],
      [375, 28],
      [375, 57],
      [343, 57],
      [343, 30],
      [320, 30],
      [320, 49],
      [287, 49],
      [287, 21],
      [97, 21],
    ])
      g.lineTo(px, py);
    g.closePath();
    g.fill();
    g.beginPath();
    g.arc(22, 0, 92, 0, Math.PI * 2);
    g.arc(22, 0, 39, 0, Math.PI * 2, true);
    g.fill('evenodd');
  };
  g.save();
  g.translate(3, 8);
  g.fillStyle = '#8f6e34';
  shape();
  g.restore();
  g.fillStyle = metal;
  shape();
  line(g, 116, -13, 381, -13, '#f7e6b2', 5);
  line(g, 116, -4, 364, -4, '#a87c38', 3);
  g.restore();
}
export function dimension(g, x1, x2, y, label, ink = C.muted) {
  line(g, x1, y, x2, y, ink, 2);
  line(g, x1, y - 8, x1, y + 8, ink, 3);
  line(g, x2, y - 8, x2, y + 8, ink, 3);
  if (label) text(g, label, (x1 + x2) / 2, y - 15, 30, ink, 'center');
}
export function pathLine(g, points, ink, w = 4) {
  if (points.length < 2) return;
  g.beginPath();
  g.moveTo(...points[0]);
  for (const p of points.slice(1)) g.lineTo(...p);
  g.strokeStyle = ink;
  g.lineWidth = w;
  g.stroke();
}
