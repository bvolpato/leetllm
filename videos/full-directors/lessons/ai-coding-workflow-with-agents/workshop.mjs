// The truing stand and chain adapt the approved short's workshop artwork.
const fullTurn = Math.PI * 2;
function rect(c, x, y, w, h, fill, radius = 0) {
  c.fillStyle = fill;
  if (!radius) { c.fillRect(x, y, w, h); return; }
  c.beginPath(); c.roundRect(x, y, w, h, radius); c.fill();
}

function ellipse(c, x, y, rx, ry, fill, stroke, weight = 1) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, fullTurn);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = weight; c.stroke(); }
}

function line(c, coords, color, width = 2) {
  c.beginPath(); c.moveTo(coords[0], coords[1]);
  for (let i = 2; i < coords.length; i += 2) c.lineTo(coords[i], coords[i + 1]);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = color; c.lineWidth = width; c.stroke();
}

function shape(c, points, fill) {
  c.beginPath(); c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.closePath(); c.fillStyle = fill; c.fill();
}

function gradient(c, x1, y1, x2, y2, stops) {
  const g = c.createLinearGradient(x1, y1, x2, y2);
  for (const [i, col] of stops.entries()) g.addColorStop(i / (stops.length - 1), col);
  return g;
}

function text(c, value, x, y, size, color, face = 'Sans', weight = 500, align = 'left', maxWidth) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; if (maxWidth) c.fillText(value, x, y, maxWidth);
  else c.fillText(value, x, y);
}

function workshop(c) {
  rect(c, -90, -90, 2100, 1040, gradient(c, 0, 0, 980, 940, ['#c2ddee', '#e4eef0', '#a6c3d1']));
  // Window light across the glazed shop tiles.
  for (let y = -118; y < 900; y += 157) {
    rect(c, -90, y, 2100, 3, '#9bb8c8');
    rect(c, -90, y + 3, 2100, 2, '#e0edf0');
    const stagger = Math.round((y + 118) / 157) % 2 * 160;
    for (let x = -180 + stagger; x < 2020; x += 320) {
      rect(c, x, y + 5, 3, 152, '#abc6d2');
    }
  }
  c.save(); c.globalAlpha = 0.33;
  for (let i = 0; i < 3; i++) {
    const x = i * 254 - 217;
    shape(c, [x, -80, x + 229, -80, x + 695, 810, x + 466, 810], '#fff9e2');
  }
  c.restore();
  rect(c, -90, 810, 2100, 270, gradient(c, 0, 810, 0, 1080, ['#d4a27b', '#e2b993', '#cca17d']));
  rect(c, -90, 810, 2100, 7, '#bd8f71');
  for (let i = 0; i < 36; i++) {
    const x = i * 93 % 1760, y = 830 + i * 19 % 253;
    line(c, [x, y, x + 65, y + 1, x + 116, y - 1], 'rgba(117,71,44,0.12)', 1.6);
  }
}

function truingStand(c, turn) {
  const cx = 290, cy = 414, rx = 363, ry = 368;
  const rotation = 0.97 + fullTurn * turn;
  const base = [143, 847, 211, 758, 371, 750, 453, 844, 422, 868, 133, 875];
  ellipse(c, 300, 869, 262, 23, 'rgba(61,54,54,0.15)');
  shape(c, base, '#1b4058');
  shape(c, [148, 845, 209, 758, 370, 750, 449, 843], '#367cb0');
  shape(c, [207, 800, 205, 420, 226, 398, 252, 419, 250, 797], '#346d95');
  // The silver braking surface catches the window on the left.
  const metal = gradient(c, -100, 70, 640, 703, ['#44515d', '#f4f5ec', '#839993', '#e6ece7', '#545e63']);
  ellipse(c, cx + 8, cy + 2, rx, ry, null, '#3e4b56', 19);
  ellipse(c, cx, cy, rx, ry, null, '#283948', 17);
  ellipse(c, cx, cy, rx - 2, ry - 2, null, metal, 12);
  ellipse(c, cx, cy, rx - 9, ry - 9, null, '#4b5c64', 3);
  for (const offset of [0, 0.12, 0.17]) {
    c.beginPath();
    c.ellipse(cx, cy, rx - 4, ry - 4, 0, rotation + 2.4 + offset, rotation + 2.4 + offset + (offset ? 0.025 : 0.09));
    c.strokeStyle = '#d85025'; c.lineWidth = 8; c.stroke();
  }
  const rim = (angle, inset = 13) => [cx + (rx - inset) * Math.cos(angle), cy + (ry - inset) * Math.sin(angle)];
  for (let i = 0; i < 32; i++) {
    const theta = rotation + fullTurn * i / 32;
    const rear = i % 2 === 0;
    const phi = theta + (i % 4 < 2 ? -1.12 : 1.12);
    const p = rim(theta);
    const hubX = cx + (rear ? 12 : -8) + 28 * Math.cos(phi), hubY = cy + 28 * Math.sin(phi);
    line(c, [hubX, hubY, ...p], rear ? '#899ca8' : '#506673', rear ? 2.3 : 3.3);
    line(c, [...rim(theta, 12), ...rim(theta, 21)], '#48525e', 5);
  }
  const valve = rotation - 0.97;
  line(c, [...rim(valve, 12), ...rim(valve, 43)], '#59636a', 8);
  line(c, [...rim(valve, 33), ...rim(valve, 44)], '#de5726', 10);
  ellipse(c, cx, cy, 38, 38, metal, '#586b76', 3);
  ellipse(c, cx, cy, 25, 25, '#434e5a', '#a4bac3', 7);
  // The near arm holds the axle; the feeler sits beside the rim.
  shape(c, [244, 818, 257, 472, 263, 413, 282, 390, 285, 413, 300, 416, 307, 388, 324, 405, 305, 808], '#144d80');
  shape(c, [261, 794, 275, 483, 285, 433, 308, 432, 293, 798], '#4887bc');
  shape(c, [260, 804, 318, 799, 341, 825, 230, 833], '#31638a');
  line(c, [301, 728, 334, 728, 352, 766, 393, 766], '#364c5b', 11);
  line(c, [375, 765, 406, 765], '#28383e', 16);
}

function chain(c) {
  // An open bicycle chain laid in a loose bend on the bench.
  const points = Array.from({ length: 26 }, (_, i) => {
    const t = i / 25;
    return [75 + 543 * t, 944 - 33 * Math.sin(t * 2.1 * Math.PI) + 10 * t];
  });
  for (const [i, p] of points.slice(0, -1).entries()) {
    const q = points[i + 1];
    line(c, [p[0], p[1] + 4, q[0], q[1] + 4], 'rgba(74,57,47,0.24)', 17);
    line(c, [...p, ...q], i % 2 ? '#5f6868' : '#263b48', 17);
    line(c, [...p, ...q], i % 2 ? '#d6d7c9' : '#8d9da0', 10);
    ellipse(c, p[0], p[1], 3.6, 3.6, '#314450');
  }
}


export { rect, ellipse, line, shape, gradient, text, workshop, truingStand, chain };
