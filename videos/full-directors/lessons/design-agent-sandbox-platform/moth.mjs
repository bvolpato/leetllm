const wingInks = {
  30: ['#202745', '#26497c', '#3278bd', '#5aaae5', '#94d9f1'],
  99: ['#30233b', '#813d46', '#c55a3b', '#f3944e', '#ffd491'],
  76: ['#34233e', '#783454', '#bd427b', '#ee7fab', '#ffc7db'],
};

// The pixel atlas is the moth from the course's approved director cut.
const clamp = value => Math.max(0, Math.min(1, value));
function inside(x, y, pts) {
  let hit = false;
  for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    if ((ay > y) !== (by > y) && x < ax + (y - ay) * (bx - ax) / (by - ay)) hit = !hit;
  }
  return hit;
}

function distanceToLine(x, y, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const p = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy));
  return Math.hypot(x - ax - p * dx, y - ay - p * dy);
}

// Draw the atlas once as runs of palette indices. Both jobs use this same sprite.
const forewing = [[2,24],[10,16],[24,11],[43,7],[57,1],[55,10],[50,18],[42,26],[31,31],[17,32],[6,30]];
const hindwing = [[3,28],[19,25],[33,25],[45,21],[44,31],[40,37],[33,41],[25,43],[22,51],[19,55],[19,47],[17,41],[12,41],[7,38],[4,33]];
const foreVeins = [[5,27,48,9],[7,27,47,17],[9,29,36,24]];
const hindVeins = [[5,29,39,31],[6,30,25,39],[7,31,18,39]];
const fixedColors = ['#312a41', '#51405a', '#8a697f', '#f6e3bc', '#fff6de'];
function marking(x, y) {
  for (const [cx, cy, rx, ry] of [[34,17,4.8,3.8],[26,34,4.6,3.6]]) {
    const ring = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (ring < 0.15) return 9;
    if (ring < 0.46) return 5;
    if (ring < 0.8) return 8;
    if (ring < 1.25) return 1;
  }
  return null;
}
function mothPixel(px, y) {
  const x = Math.abs(px);
  if (x < 1.2 && y >= 16 && y < 40) return y % 4 === 0 ? 8 : 6;
  if (x < 2.5 && y >= 17 && y < 24) return y < 19 ? 8 : 7;
  if (x < 2 && y >= 23 && y < 35) return 5;
  if (y >= 5 && y < 17) {
    const stem = (17 - y) * 0.74 + 0.7;
    if (Math.abs(x - stem) < 0.75 || (y % 3 === 0 && x >= stem && x < stem + 3.3)) return 6;
  }
  const front = inside(x, y, forewing);
  const back = inside(x, y, hindwing);
  if (!front && !back) return -1;
  const shape = front ? forewing : hindwing;
  if (!inside(x + 1.15, y + 1, shape) || !inside(x - 1, y - 0.7, shape)) return 0;
  const spot = marking(x, y);
  if (spot !== null) return spot;
  const veins = front ? foreVeins : hindVeins;
  if (veins.some(v => distanceToLine(x, y, ...v) < 0.65)) return 1;
  const stripe = front ? x + 1.6 * y : x + 0.72 * y;
  if (front && stripe > 67 && stripe < 71) return (x + y) % 4 ? 8 : 4;
  if (!front && stripe > 56 && stripe < 60) return 4;
  if (front && stripe >= 71) return (x + 2 * y) % 9 < 2 ? 8 : 1;
  if (x < 8 || (!front && y > 38)) return 1;
  if (front && y < 17 - x / 9) return 4;
  return (Math.floor(x / 5) + Math.floor(y / 4)) % 5 === 0 ? 2 : 3;
}

const runs = [];
for (let y = 0; y < 56; y++) {
  let start = -57, color = -1;
  for (let x = -57; x <= 58; x++) {
    const next = mothPixel(x, y);
    if (next !== color) {
      if (color >= 0) runs.push([start, y, x - start, color]);
      start = x;
      color = next;
    }
  }
}

export function moth(ctx, cx, cy, width, value) {
  const scale = width / 114;
  const colors = [...wingInks[value], ...fixedColors];
  const left = x => Math.round(cx + x * scale);
  const top = y => Math.round(cy + (y - 28) * scale);
  for (const [x,y,n,color] of runs) {
    ctx.fillStyle = colors[color];
    ctx.fillRect(left(x), top(y), left(x + n) - left(x), top(y + 1) - top(y));
  }
}

