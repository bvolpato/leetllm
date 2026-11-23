// All dimensions in the teaching artwork use a 1280 by 720 drawing surface.
export const C = {
  ink: '#173f43',
  teal: '#267568',
  moss: '#487655',
  sea: '#a5c7b5',
  mist: '#dce5cf',
  cream: '#fff8e2',
  paper: '#f1e8cd',
  edge: '#c5b997',
  gold: '#edb957',
  brass: '#bd883c',
  rust: '#ab453a',
  rose: '#f3c1a6',
  navy: '#173247',
  slate: '#456071',
  ice: '#dce8e9',
  white: '#fffdf3',
  faint: '#79908a',
  dark: '#112e32',
};
export const smooth = (t) => t * t * (3 - 2 * t);
export function cue(k, beat, words, span = 0) {
  const b = k.beat.beatIndex + 1;
  return b < beat ? 0 : b > beat ? 1 : k.reveal(words, span);
}
export function box(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}
export function round(g, x, y, w, h, r, color, stroke, sw = 2) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (color) {
    g.fillStyle = color;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = sw;
    g.stroke();
  }
}
export function poly(g, pts, color, stroke, sw = 2) {
  g.beginPath();
  g.moveTo(...pts[0]);
  for (const p of pts.slice(1)) g.lineTo(...p);
  g.closePath();
  if (color) {
    g.fillStyle = color;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = sw;
    g.stroke();
  }
}
export function line(g, x, y, xx, yy, color = C.edge, sw = 2) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(xx, yy);
  g.strokeStyle = color;
  g.lineWidth = sw;
  g.stroke();
}
export function dot(g, x, y, r, color, stroke) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  if (color) {
    g.fillStyle = color;
    g.fill();
  }
  if (stroke) {
    g.lineWidth = 2;
    g.strokeStyle = stroke;
    g.stroke();
  }
}
export function word(
  g,
  s,
  x,
  y,
  size = 25,
  color = C.ink,
  face = 'Sans',
  weight = 400,
  align = 'left',
  maxWidth,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  if (maxWidth && g.measureText(s).width > maxWidth)
    g.font =
      weight +
      ' ' +
      Math.floor((size * maxWidth) / g.measureText(s).width) +
      'px "Lesson ' +
      face +
      '"';
  g.fillText(String(s), x, y);
}
export function wrap(
  g,
  s,
  x,
  y,
  w,
  size = 25,
  color = C.ink,
  face = 'Serif',
  leading = size * 1.27,
) {
  g.font = '400 ' + size + 'px "Lesson ' + face + '"';
  let row = '';
  for (const term of s.split(' ')) {
    const next = row ? row + ' ' + term : term;
    if (row && g.measureText(next).width > w) {
      word(g, row, x, y, size, color, face);
      y += leading;
      row = term;
    } else row = next;
  }
  word(g, row, x, y, size, color, face);
  return y;
}
export function small(g, s, x, y, color = C.teal) {
  word(g, s, x, y, 18, color, 'Mono', 600);
}
export function title(g, eyebrow, s, x = 66, y = 76, dark = false) {
  small(g, eyebrow, x, y - 31, dark ? C.gold : C.teal);
  word(g, s, x, y + 29, 44, dark ? C.cream : C.ink, 'Serif');
}
export function base(g, type = 'paper') {
  const [a, b] =
    type === 'night'
      ? [C.navy, C.dark]
      : type === 'wood'
        ? ['#568783', '#335e5a']
        : ['#f5efd9', '#e9ddbf'];
  const fill = g.createLinearGradient(0, 0, 1280, 720);
  fill.addColorStop(0, a);
  fill.addColorStop(1, b);
  box(g, 0, 0, 1280, 720, fill);
  if (type === 'wood') {
    for (let j = 38; j < 720; j += 87) {
      line(g, 0, j, 1280, j - 13, '#244e513d', 2);
      for (let i = 0; i < 8; i++)
        line(g, (i * 191 + j) % 1290, j + 13, ((i * 191 + j) % 1290) + 69, j + 13, '#cae8cd21', 1);
    }
  }
}
export function leaf(g, x, y, w, h, fill = C.cream) {
  round(g, x + 5, y + 8, w, h, 3, '#18323226');
  round(g, x + 1, y + 4, w, h, 3, C.edge);
  round(g, x, y, w, h, 3, fill);
  line(g, x + 13, y + 13, x + w - 13, y + 13, '#bfae832e', 1);
}
export function pin(g, x, y) {
  dot(g, x + 1, y + 2, 7, '#223a3d55');
  dot(g, x, y, 7, C.brass);
  dot(g, x - 1, y - 1, 4, C.gold);
}
export function mark(g, x, y, ok, r = 19) {
  dot(g, x, y, r, ok ? C.teal : C.rust);
  g.lineCap = 'round';
  if (ok) {
    line(g, x - r * 0.5, y, x - r * 0.13, y + r * 0.36, C.white, 3);
    line(g, x - r * 0.13, y + r * 0.36, x + r * 0.5, y - r * 0.43, C.white, 3);
  } else {
    line(g, x - r * 0.38, y - r * 0.38, x + r * 0.38, y + r * 0.38, C.white, 3);
    line(g, x - r * 0.38, y + r * 0.38, x + r * 0.38, y - r * 0.38, C.white, 3);
  }
}
export function plate(g, s, x, y, w, fill = C.ink) {
  round(g, x, y, w, 44, 4, fill);
  word(g, s, x + w / 2, y + 30, 21, C.cream, 'Sans', 600, 'center', w - 24);
}
export function cord(g, x, y, xx, yy, color = C.teal, sw = 5) {
  g.beginPath();
  g.moveTo(x, y);
  const mid = (x + xx) / 2;
  g.bezierCurveTo(mid, y, mid, yy, xx, yy);
  g.strokeStyle = color;
  g.lineWidth = sw;
  g.stroke();
  dot(g, x, y, 5, color);
  dot(g, xx, yy, 5, color);
}
export function envelope(g, x, y, w, fill = C.gold) {
  const h = w * 0.65;
  round(g, x, y, w, h, 3, fill, C.brass);
  poly(
    g,
    [
      [x, y + h],
      [x + w / 2, y + h * 0.38],
      [x + w, y + h],
    ],
    '#f5cc81',
    C.brass,
  );
  poly(
    g,
    [
      [x, y],
      [x + w, y],
      [x + w / 2, y + h * 0.66],
    ],
    '#ffe8aa',
    C.brass,
  );
}
export function book(g, x, y, w, h, angle = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  round(g, -w / 2, -h / 2, w, h, 5, '#a96b34');
  round(g, -w / 2 + 2, -h / 2 - 5, w - 5, h, 4, C.cream);
  round(g, -w / 2 - 3, -h / 2 - 11, w, h - 1, 5, C.gold, C.brass);
  box(g, -w / 2 + 6, -h / 2 - 10, 8, h - 2, '#c48b3f');
  for (const d of [-0.19, -0.1]) line(g, -w * 0.25, d * h, w * 0.27, d * h, '#85612f', 2);
  dot(g, w * 0.02, h * 0.1, w * 0.1, null, '#976c35');
  g.restore();
}
export function openFolio(g) {
  base(g, 'wood');
  round(g, 41, 36, 1198, 630, 12, C.ink);
  for (const offset of [6, 3, 0]) {
    const col = offset ? C.edge : C.cream;
    poly(
      g,
      [
        [54, 48 + offset],
        [539, 46 + offset],
        [641, 62 + offset],
        [641, 650 + offset],
        [535, 637 + offset],
        [54, 639 + offset],
      ],
      col,
    );
    poly(
      g,
      [
        [641, 62 + offset],
        [733, 46 + offset],
        [1226, 48 + offset],
        [1226, 639 + offset],
        [736, 637 + offset],
        [641, 650 + offset],
      ],
      col,
    );
  }
  const fold = g.createLinearGradient(604, 0, 674, 0);
  fold.addColorStop(0, '#b79f6800');
  fold.addColorStop(0.53, '#92794c48');
  fold.addColorStop(1, '#b79f6800');
  box(g, 604, 63, 70, 573, fold);
}
export function score(g, x, y, label, value, ok) {
  small(g, label, x, y);
  word(g, value, x, y + 53, 48, ok === undefined ? C.ink : ok ? C.teal : C.rust, 'Serif', 600);
}
