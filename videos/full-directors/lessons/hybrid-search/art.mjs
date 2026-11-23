import { code, rotationLimits } from './evidence.mjs';

export const paper = '#f4ecd5',
  pale = '#fff8e8',
  ink = '#173c43',
  muted = '#516c6a',
  grid = '#c6cbb9',
  teal = '#087d76',
  orange = '#b24426',
  gold = '#e3ad4f',
  blue = '#48638b',
  night = '#142f3a',
  white = '#f9f1d9',
  mint = '#82d3b1',
  peach = '#ffae85',
  steel = '#779999';
export const mix = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);
export function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function box(c, x, y, w, h, r, fill, edge = null, lw = 2) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = lw;
    c.stroke();
  }
}
export function line(c, points, color, width = 2, dash = []) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.setLineDash(dash);
  c.stroke();
  c.setLineDash([]);
}
export function poly(c, points, fill) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}
export function dot(c, x, y, r, fill, edge = null, width = 2) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
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
export function text(
  c,
  str,
  x,
  y,
  size = 24,
  color = ink,
  { family = 'Sans', weight = 400, align = 'left', max = undefined } = {},
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  if (max) c.fillText(String(str), x, y, max);
  else c.fillText(String(str), x, y);
}
export const label = (c, str, x, y, size = 16, color = muted, align = 'left') =>
  text(c, str, x, y, size, color, { family: 'Mono', align });
export const serif = (c, str, x, y, size = 45, color = ink, align = 'left') =>
  text(c, str, x, y, size, color, { family: 'Serif', align });
export function arrow(c, x, y, ex, ey, color, width = 4) {
  line(
    c,
    [
      [x, y],
      [ex, ey],
    ],
    color,
    width,
  );
  const a = Math.atan2(ey - y, ex - x);
  poly(
    c,
    [
      [ex, ey],
      [ex - 13 * Math.cos(a - 0.48), ey - 13 * Math.sin(a - 0.48)],
      [ex - 13 * Math.cos(a + 0.48), ey - 13 * Math.sin(a + 0.48)],
    ],
    color,
  );
}
export function field(c, dark = false) {
  const g = c.createLinearGradient(0, 0, 1200, 675);
  g.addColorStop(0, dark ? '#102d37' : '#eee5cc');
  g.addColorStop(1, dark ? '#23474c' : '#faf3de');
  rect(c, 0, 0, 1200, 675, g);
}
export function head(c, section, title, dark = false) {
  label(c, section.toUpperCase(), 60, 55, 16, dark ? mint : teal);
  serif(c, title, 58, 113, 50, dark ? white : ink);
}
export function plate(c, x, y, w, h, fill = pale) {
  box(c, x + 4, y + 7, w, h, 5, '#15313925');
  box(c, x, y, w, h, 5, fill);
}
export function rivets(c, x, y, w, h) {
  for (const dx of [12, w - 12])
    for (const dy of [12, h - 12]) {
      dot(c, x + dx, y + dy, 4, '#899b90');
      line(
        c,
        [
          [x + dx - 2, y + dy + 2],
          [x + dx + 2, y + dy - 2],
        ],
        ink,
        1,
      );
    }
}
export function key(c, x, y, s = 1, color = gold, hole = ink) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  poly(
    c,
    [
      [0, -12],
      [89, -12],
      [99, -1],
      [90, 8],
      [80, 8],
      [80, 19],
      [65, 19],
      [65, 9],
      [49, 9],
      [49, 19],
      [34, 19],
      [34, 10],
      [0, 10],
    ],
    color,
  );
  dot(c, -16, 0, 32, color);
  dot(c, -22, 0, 12, hole);
  c.restore();
}
export function fileIcon(c, id, x, y, s = 1, color = teal, ground = pale) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  if (id.includes('Key') || id === 'KROT-14') {
    key(c, -14, 0, 0.45, color, ground);
  } else if (id === 'Session') {
    box(c, -25, -19, 50, 37, 4, null, color, 3);
    line(
      c,
      [
        [-24, -10],
        [24, -10],
      ],
      color,
      3,
    );
    dot(c, -18, -15, 1.5, color);
    dot(c, -12, -15, 1.5, color);
    line(
      c,
      [
        [-8, 7],
        [0, -2],
        [9, 4],
      ],
      color,
      2,
    );
  } else if (id === 'Audit') {
    for (const y of [-10, 0, 10]) {
      dot(c, -17, y, 2, color);
      line(
        c,
        [
          [-10, y],
          [19, y],
        ],
        color,
        3,
      );
    }
  } else {
    line(
      c,
      [
        [-18, 15],
        [-18, -17],
        [5, -17],
        [17, -5],
        [17, 15],
        [-18, 15],
      ],
      color,
      3,
    );
    line(
      c,
      [
        [-9, 2],
        [8, 2],
      ],
      color,
      2,
    );
  }
  c.restore();
}
export function badge(c, str, x, y, color = teal, fill = pale) {
  c.font = '500 18px "Lesson Mono"';
  const w = c.measureText(str).width + 28;
  box(c, x, y - 18, w, 36, 4, fill, color, 1.5);
  label(c, str, x + 14, y, 18, color);
  return w;
}
export function policy(c, x, y, w, h, { marked = false, focus = false, small = false } = {}) {
  const spine = small ? 18 : 24;
  plate(c, x, y, w, h);
  rect(c, x, y, spine, h, teal);
  const tx = x + spine + 30;
  label(c, 'EU SUPPORT   /   CURRENT RULE', tx, y + 35, small ? 14 : 17, teal);
  line(
    c,
    [
      [tx, y + 60],
      [x + w - 30, y + 60],
    ],
    grid,
  );
  const band = small ? 115 : 138;
  if (marked) box(c, tx - 7, y + 74, small ? 177 : 232, small ? 48 : 58, 3, '#f2be62');
  text(c, code, tx, y + 101, small ? 37 : 49, ink, { family: 'Mono', weight: 600 });
  if (!small) key(c, x + w - 110, y + 100, 0.56, teal, pale);
  serif(c, 'Stale service-account keys', tx, y + band + 44, small ? 29 : 43);
  const bodyY = y + band + 85;
  const spacing = small ? 35 : 39;
  if (focus) rect(c, tx - 8, bodyY - 19, w - spine - 55, spacing * 2 + 41, '#dcead1');
  text(c, 'Automated rotation is allowed if both hold', tx, bodyY, small ? 22 : 28, ink, { weight: 600 });
  for (const [i, condition] of [
    `Key stale for at most ${rotationLimits.staleDays} days`,
    `Risk signal at most ${rotationLimits.signalHours} hours old`,
  ].entries()) {
    const cy = bodyY + (i + 1) * spacing;
    dot(c, tx + 5, cy, 3.5, teal);
    text(c, condition, tx + 22, cy, small ? 22 : 27);
  }
}
export function ranks(
  c,
  lanes,
  { x = 60, y = 235, col = 245, row = 75, depth = Infinity, k = 60, showVotes = false } = {},
) {
  for (const [l, ids] of lanes.entries()) {
    const cx = x + l * col,
      colr = l ? orange : teal;
    label(c, l ? 'VECTOR SEARCH' : 'WORD SEARCH', cx, y - 40, 17, colr);
    ids.forEach((id, i) => {
      const cy = y + i * row,
        active = i < depth;
      box(c, cx, cy, col - 17, row - 10, 4, active ? pale : '#e7e3d1', active ? colr : grid, 1.5);
      label(c, String(i + 1), cx + 12, cy + (row - 10) / 2, 20, active ? colr : muted);
      text(c, id, cx + 42, cy + (row - 10) / 2, 25, ink, { family: 'Serif' });
      if (showVotes)
        label(c, '1/' + (k + i + 1), cx + col - 28, cy + (row - 10) / 2, 16, colr, 'right');
    });
  }
}
export const cue = (clock, b, phrase, t = 0.6) =>
  clock.beat.beatIndex < b ? 0 : clock.beat.beatIndex > b ? 1 : clock.reveal(phrase, t);
export const done = (clock, b, phrase) => cue(clock, b, phrase, 0) === 1;
