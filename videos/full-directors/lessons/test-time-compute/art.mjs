import { tables, seats, extras } from '../../../films/test-time-compute/fixtures.mjs';

export const C = {
  bg: '#152c33',
  panel: '#203b42',
  line: '#456068',
  soft: '#aac2bf',
  white: '#fcf4de',
  mint: '#8edbc0',
  gold: '#f4bf72',
  red: '#f19780',
  blue: '#8ac5dc',
  ink: '#243c3e',
  wood: '#d8b783',
};
export const limit = (value, max = 1) => Math.max(0, Math.min(max, value));

export function box(g, x, y, w, h, fill, radius = 0) {
  g.beginPath();
  g.roundRect(x, y, w, h, radius);
  g.fillStyle = fill;
  g.fill();
}
export function line(g, x, y, xx, yy, color = C.line, width = 2) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(xx, yy);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}
export function dot(g, x, y, r, fill) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fillStyle = fill;
  g.fill();
}
export function type(
  g,
  value,
  x,
  y,
  size = 32,
  color = C.white,
  family = 'Sans',
  align = 'left',
  weight = 400,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  g.fillStyle = color;
  g.textAlign = align;
  g.fillText(String(value), x, y);
}
export function title(g, topic, question) {
  type(g, topic.toUpperCase(), 68, 70, 21, C.gold, 'Mono');
  type(g, question, 65, 147, 58, C.white, 'Serif');
  line(g, 68, 181, 1532, 181);
}
export function label(g, value, x, y, color = C.soft) {
  type(g, value, x, y, 25, color);
}
export function mono(g, value, x, y, size = 40, color = C.white, align = 'left') {
  type(g, value, x, y, size, color, 'Mono', align);
}
export function footer(g, value) {
  line(g, 68, 745, 1532, 745);
  type(g, value, 68, 797, 32, C.white, 'Serif');
}
export function arrow(g, x, y, xx, yy, color = C.gold) {
  line(g, x, y, xx, yy, color, 4);
  const a = Math.atan2(yy - y, xx - x);
  for (const d of [-0.5, 0.5])
    line(g, xx, yy, xx - 14 * Math.cos(a + d), yy - 14 * Math.sin(a + d), color, 4);
}

// A persistent floor plan makes the same forty-four physical places countable in every replay.
const centers = [
  [218, 243],
  [641, 243],
  [218, 484],
  [641, 484],
];
const atTables = centers.map(([cx, cy]) =>
  Array.from({ length: seats }, (_, j) => {
    const a = ((j + 0.5) * 2 * Math.PI) / seats;
    return { x: cx + 97 * Math.cos(a), y: cy + 97 * Math.sin(a), a: a - Math.PI / 2 };
  }),
);
const alongWall = Array.from({ length: extras }, (_, i) => ({ x: 51 + i * 69, y: 67, a: Math.PI }));
export const roomPlaces = [...atTables.flat(), ...alongWall];
export const tableCount = tables * seats;
export const roomCount = roomPlaces.length;

function chair(g, { x, y, a }, lit) {
  g.save();
  g.translate(x, y);
  g.rotate(a);
  box(g, -17, -12, 38, 37, '#664e4266', 7);
  for (const dx of [-14, 11]) box(g, dx, -17, 4, 40, '#6d4c3c', 2);
  box(g, -18, -15, 36, 31, '#883e32', 7);
  box(g, -16, -16, 32, 28, lit ? '#ffce86' : '#dd8057', 7);
  line(g, -16, 14, 16, 14, '#713d30', 6);
  line(g, -15, 12, 15, 12, '#e3976b', 3);
  g.restore();
}
export function room(g, x, y, w, { counted = 0, wall = 0 } = {}) {
  g.save();
  g.translate(x, y);
  g.scale(w / 860, w / 860);
  box(g, 0, 0, 860, 615, C.wood, 8);
  for (let row = 0; row < 12; row++) {
    const yy = 36 + row * 50;
    for (let col = 0; col < 10; col++) {
      const xx = col * 103 - (row % 2) * 48;
      const left = Math.max(0, xx),
        right = Math.min(860, xx + 102);
      if (right > left)
        box(
          g,
          left,
          yy,
          right - left,
          Math.min(49, 615 - yy),
          ['#e7c99c', '#dfbf91', '#e9cda4'][(row + col * 5) % 3],
        );
    }
  }
  box(g, 0, 0, 860, 32, '#865d49');
  box(g, 0, 26, 860, 7, '#b58761');
  for (let i = 0; i < alongWall.length; i++) chair(g, alongWall[i], i < wall);
  centers.forEach(([cx, cy], i) => {
    atTables[i].forEach((place) => chair(g, place, i < counted));
    dot(g, cx + 3, cy + 6, 77, '#7f725d');
    dot(g, cx, cy, 77, '#305d64');
    dot(g, cx, cy - 2, 72, '#507d81');
    for (let j = 0; j < seats; j++) {
      const a = ((j + 0.5) * 2 * Math.PI) / seats,
        px = cx + 55 * Math.cos(a),
        py = cy + 55 * Math.sin(a);
      dot(g, px, py, 10, '#f7f0d8');
      dot(g, px, py, 7, '#bed3c4');
      dot(g, px, py, 5.8, '#fff6e2');
    }
    if (i < counted) {
      dot(g, cx, cy, 26, '#fbf0cc');
      type(g, seats, cx, cy + 12, 38, C.ink, 'Serif', 'center');
    } else {
      dot(g, cx - 3, cy, 9, '#eab970');
      dot(g, cx + 5, cy - 6, 6, '#f8daa0');
    }
  });
  if (wall > 0) {
    const end = alongWall[wall - 1].x;
    line(g, alongWall[0].x, 100, end, 100, '#895332', 3);
    for (const i of [0, wall - 1]) line(g, alongWall[i].x, 93, alongWall[i].x, 101, '#895332', 3);
  }
  g.restore();
}
export function background(g) {
  box(g, 0, 0, 1600, 900, C.bg);
}
