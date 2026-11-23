import { print } from './prints.mjs';

// The two glazed bays and the single brass pocket share a fixed camera.
const ink = '#1a3436';
const paper = '#fff3d0';
const brass = '#d9b775';
export const mounts = [398, 927, 1539].map((x) => ({ x, y: 598 }));
const pocket = { left: 1279, right: 1799, lip: 625 };

function fill(c, color, x, y, w, h) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function wash(c, x, y, toX, toY, stops) {
  const gradient = c.createLinearGradient(x, y, toX, toY);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  return gradient;
}
function path(c, color, points, width = 0) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const p of points.slice(1)) c.lineTo(...p);
  if (width) {
    c.lineWidth = width;
    c.strokeStyle = color;
    c.stroke();
  } else {
    c.closePath();
    c.fillStyle = color;
    c.fill();
  }
}
function disk(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
function type(c, text, x, y, size, color, family = 'Serif', weight = 400, align = 'center') {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillStyle = color;
  c.fillText(text, x, y);
}
function arch(c, x, spring, rx, ry, foot) {
  c.beginPath();
  c.moveTo(x - rx, foot);
  c.ellipse(x, spring, rx, ry, 0, Math.PI, 2 * Math.PI);
  c.lineTo(x + rx, foot);
  c.closePath();
}

function glass(c, x) {
  const spring = 420;
  c.save();
  arch(c, x, spring, 248, 149, 818);
  c.fillStyle = wash(c, x, 270, x + 140, 815, [
    [0, '#26484f'],
    [0.6, '#60908e'],
    [1, '#aac4ab'],
  ]);
  c.fill();
  c.strokeStyle = '#102e35';
  c.lineWidth = 12;
  c.stroke();
  c.clip();
  // The sash stays in place when the paper is lifted from the glass.
  for (let i = 1; i < 8; i++) {
    const a = (i * Math.PI) / 8;
    path(
      c,
      '#94af9e',
      [
        [x, spring],
        [x + Math.cos(a) * 249, spring - Math.sin(a) * 149],
      ],
      4,
    );
  }
  for (const offset of [-123, 0, 123]) fill(c, '#4c7978', x + offset, spring, 5, 399);
  fill(c, '#274f53', x - 252, spring - 2, 505, 7);
  for (const offset of [-150, -99]) {
    path(c, '#dbe4bf20', [
      [x + offset, 272],
      [x + offset + 30, 272],
      [x + offset - 142, 820],
      [x + offset - 172, 820],
    ]);
  }
  c.restore();
  arch(c, x, spring, 256, 158, 822);
  c.strokeStyle = '#698b79';
  c.lineWidth = 3;
  c.stroke();
}

function plate(c, x, y, label, width, color = ink) {
  fill(c, '#10282d', x - width / 2, y - 33, width, 54);
  fill(c, color, x - width / 2 + 2, y - 31, width - 4, 50);
  for (const side of [-1, 1]) {
    const screwX = x + side * (width / 2 - 18);
    disk(c, screwX, y - 6, 4.5, brass);
    path(
      c,
      '#65583b',
      [
        [screwX - 2, y - 4],
        [screwX + 2, y - 8],
      ],
      1.5,
    );
  }
  type(c, label, x, y + 5, 31, '#fff0c8', 'Sans', 600);
}

function facade(c, question, legend) {
  fill(
    c,
    wash(c, 0, 0, 1780, 1080, [
      [0, '#f4dfb2'],
      [0.62, '#dfc29a'],
      [1, '#c19375'],
    ]),
    0,
    0,
    1920,
    1080,
  );
  for (const y of [34, 178, 232, 445, 652, 850, 1015]) {
    fill(c, '#836f5c44', 0, y, 1920, 2);
    fill(c, '#fff2c030', 0, y + 2, 1920, 3);
  }
  for (const [x, y, h] of [
    [180, 35, 142],
    [1707, 35, 142],
    [713, 178, 55],
    [1265, 233, 212],
    [1838, 445, 207],
    [1203, 652, 197],
    [505, 850, 165],
    [1644, 850, 165],
  ]) {
    fill(c, '#9b856c44', x, y, 2, h);
  }
  // Carved letters and rule belong to the lintel above the notice windows.
  type(c, 'P U B L I C    L I B R A R Y', 960, 69, 27, '#655640', 'Sans', 600);
  for (const side of [-1, 1]) {
    const a = 960 + side * 215,
      b = 960 + side * 383;
    path(
      c,
      '#8d7754',
      [
        [a, 60],
        [b, 60],
      ],
      2,
    );
    disk(c, b, 60, 3.5, '#8d7754');
  }
  type(c, question, 960, 153, 73, ink);
  fill(c, '#9b8162', 0, 193, 1920, 5);
  fill(c, '#ffe5b4', 0, 198, 1920, 10);
  fill(c, '#9e836443', 0, 208, 1920, 11);
  fill(c, '#826951', 100, 245, 1126, 670);
  fill(c, '#183d43', 88, 234, 1130, 672);
  fill(c, '#466c69', 96, 242, 1114, 649);
  fill(c, '#21494c', 104, 250, 1098, 626);
  for (const point of mounts.slice(0, 2)) glass(c, point.x);
  // A single rail encloses both prompt positions.
  fill(c, '#13343a', 88, 816, 1130, 88);
  fill(c, brass, 101, 819, 1104, 4);
  plate(c, 653, 870, 'The assistant reads these two', 598);
  fill(c, '#102f34', 69, 904, 1168, 15);
  fill(c, '#b3ae8a', 71, 919, 1164, 9);
  path(c, '#a1896d', [
    [75, 930],
    [1232, 930],
    [1209, 946],
    [100, 946],
  ]);
  // A dark recess behind the third notice makes the file pocket distinct from a window.
  fill(c, '#9c7356', pocket.left - 8, 342, 536, 474);
  fill(c, '#534f42', pocket.left - 4, 337, 528, 474);
  fill(
    c,
    wash(c, 1280, 340, 1800, 810, [
      [0, '#373c35'],
      [0.65, '#645a43'],
      [1, '#887450'],
    ]),
    pocket.left,
    341,
    520,
    467,
  );
  // Position numbers belong to the mount. The source ID belongs to the paper.
  mounts.forEach(({ x }, i) => {
    const y = 363;
    disk(c, x, y + 2, 24, '#213b3c');
    disk(c, x, y, 23, '#ba9b61');
    disk(c, x, y, 19, '#e5c38b');
    type(c, String(i + 1), x, y + 9, 30, ink);
  });
  const lines = legend.split('\n');
  lines.forEach((line, i) => type(c, line, 1539, 872 + i * 39, 32, ink, 'Sans', 600));
}

function pocketFront(c) {
  const { left, right, lip } = pocket;
  fill(
    c,
    wash(c, left, lip, right, 813, [
      [0, '#8d744a'],
      [0.32, '#b09762'],
      [0.64, '#bba26c'],
      [1, '#806844'],
    ]),
    left - 6,
    lip,
    right - left + 12,
    814 - lip,
  );
  fill(c, '#463f32', left - 8, lip - 4, right - left + 16, 6);
  fill(c, '#d7bc84', left - 8, lip + 2, right - left + 16, 6);
  for (const x of [left + 16, right - 16]) {
    fill(c, '#d4b880', x, lip + 12, 2, 173);
    disk(c, x, 793, 4, '#534b37');
  }
  plate(c, (left + right) / 2, 727, 'Outside the prompt', 364, '#4f4b3b');
}

function notice(c, item) {
  const { x, y, id, lines, scoreText, scoreAlpha, checked } = item;
  c.save();
  c.translate(x, y);
  fill(c, '#182e3440', -211, -202, 438, 404);
  fill(c, '#b49e78', -220, -207, 440, 403);
  fill(c, paper, -219, -209, 438, 402);
  // Use the editor's printing plates at their original aspect ratio in all three positions.
  print(c, item.plate, -205, -171, 410, (410 * 219) / 460);
  type(c, id, -203, -182, 21, ink, 'Mono', 400, 'left');
  if (checked) {
    path(
      c,
      '#346454',
      [
        [166, -190],
        [171, -184],
        [184, -198],
      ],
      3,
    );
  }
  if (scoreAlpha > 0)
    path(
      c,
      '#bea67e',
      [
        [-200, 136],
        [200, 136],
      ],
      1.5,
    );
  type(c, lines[0], 0, 67, 45, ink);
  type(c, lines[1], 0, 118, 43, ink);
  if (item.underline > 0) {
    const length = c.measureText(lines[1]).width;
    path(
      c,
      '#ac7841',
      [
        [-length / 2, 128],
        [-length / 2 + item.underline * length, 128],
      ],
      3,
    );
  }
  if (scoreAlpha > 0) {
    c.globalAlpha *= scoreAlpha;
    type(c, 'Score  ' + scoreText, 0, 176, 29, ink, 'Mono');
  }
  c.restore();
}

export function paintWindows(c, { question, notices, legend }) {
  c.save();
  facade(c, question, legend);
  // The lip masks the bottom of every sheet while it is behind the pocket.
  c.save();
  c.beginPath();
  c.rect(0, 0, 1920, 816);
  c.clip();
  for (const item of notices) if (!item.inHand) notice(c, item);
  c.restore();
  pocketFront(c);
  for (const item of notices) if (item.inHand) notice(c, item);
  c.restore();
}
