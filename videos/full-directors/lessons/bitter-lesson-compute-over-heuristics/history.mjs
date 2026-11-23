import assert from 'node:assert/strict';
import {
  C,
  arrow,
  background,
  cap,
  chip,
  circle,
  cue,
  heading,
  lerp,
  line,
  mono,
  rect,
  text,
} from './studio.mjs';

function chessman(g, x, y, kind, white, u) {
  const fill = white ? C.paper : C.navy,
    edge = white ? C.navy : '#0b1f27';
  g.save();
  g.translate(x, y);
  g.scale(u, u);
  const polygon = (pts) => {
    g.beginPath();
    pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b)));
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    g.strokeStyle = edge;
    g.lineWidth = 1.7;
    g.stroke();
  };
  if (kind === 'R')
    polygon([
      [-14, -17],
      [-8, -17],
      [-8, -12],
      [-3, -12],
      [-3, -17],
      [3, -17],
      [3, -12],
      [8, -12],
      [8, -17],
      [14, -17],
      [13, -5],
      [8, -2],
      [7, 11],
      [13, 15],
      [13, 18],
      [-13, 18],
      [-13, 15],
      [-7, 11],
      [-8, -2],
      [-13, -5],
    ]);
  if (kind === 'K') {
    polygon([
      [-13, 17],
      [-12, 13],
      [-7, 10],
      [-9, -3],
      [-13, -9],
      [-9, -12],
      [0, -8],
      [9, -12],
      [13, -9],
      [9, -3],
      [7, 10],
      [12, 13],
      [13, 17],
    ]);
    line(
      g,
      [
        [0, -9],
        [0, -21],
      ],
      edge,
      5,
    );
    line(
      g,
      [
        [-5, -17],
        [5, -17],
      ],
      edge,
      5,
    );
    line(
      g,
      [
        [0, -9],
        [0, -20],
      ],
      fill,
      2.6,
    );
    line(
      g,
      [
        [-4, -17],
        [4, -17],
      ],
      fill,
      2.6,
    );
  }
  if (kind === 'P') {
    polygon([
      [-11, 17],
      [-11, 13],
      [-6, 10],
      [-4, -3],
      [4, -3],
      [6, 10],
      [11, 13],
      [11, 17],
    ]);
    circle(g, 0, -8, 8, edge);
    circle(g, 0, -8, 6.6, fill);
  }
  g.restore();
}
function rookBoard(g, x, y, s, whiteMove, blackMove) {
  const cell = s / 8;
  for (let j = 0; j < 8; j++)
    for (let i = 0; i < 8; i++)
      rect(
        g,
        x + i * cell,
        y + j * cell,
        cell + 0.2,
        cell + 0.2,
        (i + j) % 2 ? '#84a597' : '#e7dfbd',
      );
  const at = (f, r) => [x + (f + 0.5) * cell, y + (8 - r + 0.5) * cell];
  chessman(g, ...at(6, 1), 'K', true, cell / 51);
  chessman(g, ...at(6, 8), 'K', false, cell / 51);
  if (whiteMove < 1) chessman(g, ...at(3, 5), 'P', false, cell / 51);
  if (blackMove < 1) chessman(g, ...at(3, lerp(1, 5, whiteMove)), 'R', true, cell / 51);
  chessman(g, ...at(3, lerp(8, 5, blackMove)), 'R', false, cell / 51);
}
const pixels = Array.from({ length: 9 }, (_, j) =>
  Array.from({ length: 9 }, (_, i) => (i < 3 + Math.floor(j / 3) ? 0.18 : 0.84)),
);
function patch(g, x, y, cell) {
  pixels.forEach((row, j) =>
    row.forEach((v, i) => {
      const gray = Math.round(255 * v);
      rect(g, x + i * cell, y + j * cell, cell - 1, cell - 1, 'rgb(' + [gray, gray, gray] + ')');
    }),
  );
}
function gradients(g, x, y, cell) {
  pixels.forEach((row, j) =>
    row.forEach((v, i) => {
      const dx = (row[i + 1] ?? v) - v,
        dy = (pixels[j + 1]?.[i] ?? v) - v;
      const cx = x + i * cell + cell / 2,
        cy = y + j * cell + cell / 2;
      if (dx || dy) arrow(g, cx - 5 * dx, cy - 5 * dy, cx + 13 * dx, cy + 13 * dy, C.teal, 2.8);
      else circle(g, cx, cy, 1.8, '#9fb2a7');
    }),
  );
}
const weights = [
  [-1, 0, 1],
  [-1, 0, 1],
  [-1, 0, 1],
];
const patchX = 2,
  patchY = 0;
const response = weights.reduce(
  (sum, row, y) => sum + row.reduce((s, w, x) => s + w * pixels[patchY + y][patchX + x], 0),
  0,
);
function kernel(g, x, y, s) {
  weights.forEach((row, j) =>
    row.forEach((w, i) => {
      rect(g, x + i * s, y + j * s, s - 2, s - 2, w === 0 ? '#d0dacd' : w < 0 ? C.indigo : C.teal);
      mono(
        g,
        w,
        x + (i + 0.5) * s,
        y + (j + 0.64) * s,
        Math.max(13, s * 0.36),
        w ? C.white : C.ink,
        'center',
      );
    }),
  );
}
function wave(g, x, y, w, h) {
  const pts = Array.from({ length: 600 }, (_, j) => {
    const t = j / 599,
      env = Math.sin(Math.PI * t) ** 0.6 * (0.23 + 0.75 * Math.sin(2.8 * Math.PI * t) ** 2);
    return [x + w * t, y + (h * env * (Math.sin(127 * t) + 0.45 * Math.sin(302 * t))) / 1.45];
  });
  line(g, pts, C.blue, 2.6);
}
const board = [
  ['b', 2, 4],
  ['w', 2, 3],
  ['b', 3, 3],
  ['w', 3, 2],
  ['b', 4, 3],
  ['w', 4, 2],
  ['b', 4, 4],
  ['w', 1, 3],
];
function go(g, x, y, s, played = false) {
  rect(g, x - 17, y - 17, s + 34, s + 34, '#d5b781', 5);
  for (let i = 0; i < 7; i++) {
    const z = (s * i) / 6;
    line(
      g,
      [
        [x, y + z],
        [x + s, y + z],
      ],
      '#795e3d',
      1.5,
    );
    line(
      g,
      [
        [x + z, y],
        [x + z, y + s],
      ],
      '#795e3d',
      1.5,
    );
  }
  for (const [side, i, j] of board.concat(played ? [['b', 3, 4]] : [])) {
    const px = x + (i * s) / 6,
      py = y + (j * s) / 6;
    circle(g, px + 1.5, py + 2.5, s * 0.063, '#66563f');
    circle(g, px, py, s * 0.063, side === 'w' ? C.white : C.navy);
  }
}
export function history(g, k) {
  const i = k.beat.beatIndex;
  background(g, i === 3 || i === 4);
  if (i === 0) {
    heading(g, 'Chess  /  illustrative position', 'What is the pawn really worth?');
    const a = cue(k, 0, 'White takes a pawn', 1.2),
      b = cue(k, 0, 'Black’s rook', 1.2);
    rookBoard(g, 100, 171, 400, a, b);
    cap(g, 'Deep Blue  /  1997', 605, 213);
    text(g, 'Engineered evaluation', 602, 263, 37, C.ink, 'Serif');
    text(g, '+ deeper search', 602, 306, 35, C.teal, 'Serif');
    mono(g, 'd1', 608, 393, 23, C.ink);
    arrow(g, 661, 384, 738, 384, C.teal);
    mono(g, 'd5', 762, 393, 23, C.ink);
    if (a === 1) text(g, 'White takes the pawn.', 603, 445, 27, C.ink);
    if (b > 0) {
      arrow(g, 614, 472, 614, 506, C.rust);
      text(g, 'Black can recapture the rook.', 604, 553, 28, C.rust, 'Serif');
    }
  } else if (i === 1) {
    heading(g, 'Vision  /  local image structure', 'Who chooses the filter?');
    patch(g, 74, 236, 31);
    const learned = cue(k, 1, 'AlexNet learned', 0.7) > 0;
    arrow(g, 385, 373, 476, 373, C.teal, 4);
    if (learned) {
      rect(g, 74 + patchX * 31, 236 + patchY * 31, 93, 93, null, 1, C.orange);
      kernel(g, 535, 258, 76);
    } else gradients(g, 509, 236, 31);
    cap(g, 'Brightness patch', 74, 565);
    cap(g, learned ? 'Illustrative filter' : 'Local brightness changes', 509, 565);
    text(g, learned ? 'AlexNet' : 'SIFT', 855, 302, 44, C.ink, 'Serif');
    text(
      g,
      learned ? 'Size by design' : 'Descriptor by design',
      855,
      363,
      25,
      C.teal,
      'Sans',
      600,
      'left',
      305,
    );
    text(
      g,
      learned ? 'Weights from data' : 'Gradients from pixels',
      855,
      402,
      24,
      C.ink,
      'Sans',
      500,
      'left',
      305,
    );
    if (learned) mono(g, 'Response  +' + response.toFixed(2), 855, 464, 22, C.teal);
  } else if (i === 2) {
    heading(g, 'ImageNet  /  2012', 'How did seven networks make one prediction?');
    cap(g, 'Base network', 67, 230);
    text(g, '5–6 days', 64, 307, 49, C.ink, 'Serif');
    text(g, 'on two GPUs', 66, 350, 26, C.teal);
    const count = Math.floor(7 * cue(k, 2, 'combined predictions', 1.7));
    for (let j = 0; j < 7; j++) {
      const y = 175 + j * 55;
      chip(g, 'Net ' + (j + 1), 457, y, 147, C.navy, C.white);
      line(
        g,
        [
          [609, y + 19],
          [690, y + 19],
          [821, 358],
        ],
        j < count ? C.teal : '#b5c7bb',
        j < count ? 3 : 1.4,
      );
    }
    circle(g, 827, 358, 14, count === 7 ? C.teal : C.shade);
    text(g, 'Combined', 870, 352, 33, C.ink, 'Serif');
    text(g, 'prediction', 870, 392, 33, C.ink, 'Serif');
  } else if (i === 3) {
    heading(g, 'Speech  /  from recordings to words', 'What varies across a spoken word?', true);
    wave(g, 69, 305, 1062, 84);
    const phase =
      cue(k, 3, 'Later, deep networks', 0.6) > 0
        ? 2
        : cue(k, 3, 'Hidden Markov models', 0.6) > 0
          ? 1
          : 0;
    const names = [
      ['Sound categories', 'expert descriptions'],
      ['Sound-state sequence', 'fitted transition probabilities'],
      ['Learned features', 'trained on recordings'],
    ];
    if (phase === 1)
      for (let j = 0; j < 4; j++) {
        const x = 225 + j * 249;
        circle(g, x, 443, 16, C.mint);
        if (j < 3) arrow(g, x + 24, 443, x + 215, 443, C.mist);
      }
    else if (phase === 2)
      for (let j = 0; j < 16; j++)
        rect(g, 85 + j * 66, 402, 47, 17 + 34 * Math.abs(Math.sin(j)), j % 3 ? C.blue : C.mint, 3);
    text(g, names[phase][0], 68, 540, 36, C.white, 'Serif');
    text(g, names[phase][1], 68, 583, 26, C.mist);
  } else if (i === 4) {
    heading(g, 'Self-play  /  AlphaZero', 'Which branch deserves another look?', true);
    const policy = cue(k, 4, 'Playing against itself', 0.6) > 0;
    const value = cue(k, 4, 'A learned value', 0.7) > 0;
    go(g, 93, 229, 288);
    cap(g, 'Illustrative Go position', 70, 576, C.mist);
    const center = [506, 362];
    circle(g, ...center, 12, C.white);
    for (let j = 0; j < 3; j++) {
      const y = 229 + j * 132;
      line(g, [center, [657, y]], policy && j === 1 ? C.brass : C.grid, policy && j === 1 ? 7 : 3);
      circle(g, 657, y, 10, policy && j === 1 ? C.brass : C.mist);
    }
    if (policy) {
      go(g, 757, 265, 170, true);
      text(g, 'Policy guides exploration.', 715, 528, 28, C.brass, 'Serif');
    }
    if (value) text(g, 'Value estimates the position.', 715, 570, 27, C.mint, 'Serif');
  } else {
    heading(g, 'Sutton  /  The Bitter Lesson, 2019', 'What can the next computation change?');
    rookBoard(g, 78, 232, 226, 1, 1);
    patch(g, 486, 232, 25);
    go(g, 899, 251, 189, true);
    for (const [x, a, b] of [
      [74, 'Search', 'Consider a reply'],
      [481, 'Learning', 'Fit a feature'],
      [857, 'Self-play', 'Guide a search'],
    ]) {
      cap(g, a, x, 519);
      text(g, b, x, 564, 29, C.ink, 'Serif');
    }
  }
}
export function checkHistory() {
  assert.equal(
    weights.flat().reduce((a, b) => a + b, 0),
    0,
  );
  assert.equal(response.toFixed(2), '1.98');
  assert(pixels.some((row) => row.some((v, i) => i > 0 && v !== row[i - 1])));
  assert.equal(new Set(board.map(([, x, y]) => x + ',' + y)).size, board.length);
  assert(!board.some(([, x, y]) => x === 3 && y === 4));
}
