import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { alignmentMissingPair } from '../../../films/preference-alignment/construction.mjs';

const title = 'The arrow the reviewer never saw';
const beats = [
  {
    id: 'the-wrong-turn',
    say: "Which way to the aquarium? If you follow the station guide, you'll walk straight ahead. Take a look at the sign under the whale.",
    hold: 1.15,
  },
  {
    id: 'the-saved-vote',
    say: "Here's the only vote on file for this question. A reviewer saw two replies, left and right, and picked left. Could two guides fit that vote equally well and send people different ways?",
    hold: 1.05,
  },
  {
    id: 'the-first-model',
    say: 'Give the guide just three possible replies. Each flap stands for a one percent chance of giving that reply. Read down the first column. Four lefts, then one right. That pattern repeats across half the board.',
    hold: 0.65,
  },
  {
    id: 'what-the-vote-measures',
    say: "Forty percent left, ten percent right. That's four to one. Direct preference optimization, or DPO, scores the vote by comparing those odds with a fixed reference. Here the reference gives left and right equal chances. The more the odds favor left, the lower the loss.",
    hold: 0.6,
  },
  {
    id: 'the-other-model',
    say: 'Try a second model on the same question. Watch the boundary between blue and coral. When it stops, which way would this guide usually send you?',
    hold: 1.6,
  },
  {
    id: 'the-same-loss',
    say: "Straight ahead has ninety percent. Look at the two columns that remain. Eight lefts for two rights is still four to one. Both models get the same loss on the saved vote. A visitor's chance of hearing the correct direction has fallen from forty percent to eight.",
    hold: 1.25,
  },
  {
    id: 'the-next-comparison',
    say: 'To find what that vote missed, sample fresh replies. When straight ahead turns up, put it beside left for the next reviewer.',
    hold: 2.8,
  },
];

const ink = '#172e4b';
const cream = '#fbf6db';
const arrows = [
  { name: 'Left', color: '#a3d5e7', angle: Math.PI },
  { name: 'Right', color: '#f2c862', angle: 0 },
  { name: 'Straight ahead', color: '#ef9279', angle: -Math.PI / 2 },
];
const rows = 5;
const columns = 20;
const cellX = 797;
const cellY = 455;
const pitchX = 51.5;
const pitchY = 46;
const beta = 0.1;
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => clamp(x) ** 2 * (3 - 2 * clamp(x));
const mix = (a, b, t) => a + (b - a) * t;

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function round(c, x, y, w, h, r, color) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = color;
  c.fill();
}
function line(c, x, y, x2, y2, color, width) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function shape(c, points, color) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const p of points.slice(1)) c.lineTo(...p);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
function text(c, str, x, y, size, color, weight = 500, align = 'left', family = 'Sans') {
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(str, x, y);
}
function arrow(c, x, y, size, angle, color) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(size, size);
  shape(
    c,
    [
      [-0.5, -0.11],
      [0.12, -0.11],
      [-0.08, -0.31],
      [0.09, -0.47],
      [0.55, 0],
      [0.09, 0.47],
      [-0.08, 0.31],
      [0.12, 0.11],
      [-0.5, 0.11],
    ],
    color,
  );
  c.restore();
}
function strokePath(c, color, width) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function whale(c) {
  c.save();
  c.translate(65, 273);
  c.scale(0.94, 0.94);
  // A humpback swims to the left, its pleats and long pectoral fin visible in profile.
  const body = () => {
    c.beginPath();
    c.moveTo(26, 153);
    c.bezierCurveTo(52, 119, 153, 82, 239, 81);
    c.bezierCurveTo(320, 75, 382, 90, 421, 102);
    c.quadraticCurveTo(448, 109, 460, 89);
    c.quadraticCurveTo(474, 90, 469, 112);
    c.bezierCurveTo(502, 130, 551, 143, 591, 120);
    c.quadraticCurveTo(612, 111, 613, 86);
    c.bezierCurveTo(591, 83, 574, 57, 578, 31);
    c.quadraticCurveTo(605, 69, 625, 64);
    c.quadraticCurveTo(645, 34, 680, 36);
    c.quadraticCurveTo(662, 74, 632, 91);
    c.bezierCurveTo(629, 156, 579, 176, 522, 173);
    c.bezierCurveTo(421, 171, 391, 207, 281, 214);
    c.bezierCurveTo(159, 226, 56, 209, 26, 165);
    c.quadraticCurveTo(20, 158, 26, 153);
    c.closePath();
  };
  body();
  const dye = c.createLinearGradient(160, 83, 200, 219);
  dye.addColorStop(0, '#247e94');
  dye.addColorStop(0.59, '#175a78');
  dye.addColorStop(1, '#133f63');
  c.fillStyle = dye;
  c.fill();
  c.save();
  c.clip();
  c.beginPath();
  c.moveTo(24, 160);
  c.bezierCurveTo(132, 181, 175, 151, 229, 157);
  c.bezierCurveTo(284, 170, 352, 194, 413, 183);
  c.lineTo(402, 240);
  c.lineTo(14, 243);
  c.closePath();
  c.fillStyle = '#86b8bd';
  c.fill();
  for (let i = 0; i < 7; i++) {
    c.beginPath();
    c.moveTo(27 + i * 10, 163 + i * 1.1);
    c.quadraticCurveTo(78 + i * 25, 217 - i * 1.9, 171 + i * 38, 223 - i * 1.7);
    strokePath(c, '#437e91', 2.7);
  }
  c.beginPath();
  c.moveTo(30, 159);
  c.bezierCurveTo(117, 176, 162, 152, 205, 156);
  strokePath(c, '#224761', 3.2);
  c.restore();
  c.beginPath();
  c.moveTo(251, 161);
  c.bezierCurveTo(279, 164, 307, 182, 327, 205);
  c.quadraticCurveTo(361, 241, 395, 255);
  c.bezierCurveTo(345, 270, 287, 237, 252, 190);
  c.quadraticCurveTo(244, 179, 238, 175);
  c.fillStyle = '#235c7a';
  c.fill();
  c.beginPath();
  c.moveTo(249, 176);
  c.quadraticCurveTo(304, 239, 383, 254);
  strokePath(c, '#93bac0', 3.5);
  c.beginPath();
  c.arc(216, 150, 7, 0, Math.PI * 2);
  c.fillStyle = '#d6d4ad';
  c.fill();
  c.beginPath();
  c.arc(216, 150, 4.2, 0, Math.PI * 2);
  c.fillStyle = '#162f48';
  c.fill();
  c.restore();
}

function mosaic(c) {
  const x = 42,
    y = 210,
    w = 681,
    h = 554;
  rect(c, x - 5, y - 5, w + 10, h + 10, '#adc2bc');
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  const sea = c.createLinearGradient(x, y, x, y + h);
  sea.addColorStop(0, '#cee4da');
  sea.addColorStop(0.56, '#a1d2cf');
  sea.addColorStop(1, '#7bb3bc');
  rect(c, x, y, w, h, sea);
  // Curved bands of sea glass follow the surface of the water.
  for (let i = 0; i < 5; i++) {
    c.beginPath();
    c.moveTo(-15, 275 + i * 19);
    c.bezierCurveTo(160, 243 + i * 13, 346, 314 + i * 17, 484, 261 + i * 15);
    c.quadraticCurveTo(596, 222 + i * 13, 751, 244 + i * 11);
    strokePath(c, i % 2 ? '#c2dfce' : '#daeadb', i < 2 ? 7 : 4);
  }
  whale(c);
  for (const [fx, fy, s] of [
    [115, 535, 14],
    [155, 544, 17],
    [197, 532, 12],
    [176, 518, 10],
    [240, 546, 13],
    [472, 316, 11],
    [505, 304, 8],
    [527, 319, 12],
  ]) {
    c.fillStyle = '#377e91';
    c.beginPath();
    c.ellipse(fx, fy, s, s * 0.31, -0.1, 0, 2 * Math.PI);
    c.fill();
    shape(
      c,
      [
        [fx + s * 0.73, fy],
        [fx + s * 1.4, fy - s * 0.36],
        [fx + s * 1.4, fy + s * 0.22],
      ],
      '#377e91',
    );
  }
  rect(c, x, 600, w, h, '#1e5373');
  rect(c, x, 609, w, 5, '#80b8be');
  arrow(c, 141, 685, 102, Math.PI, cream);
  text(c, 'Aquarium', 227, 711, 86, cream, 700);
  const tile = 18;
  for (let row = 0; row * tile < h; row++) {
    for (let col = 0; col * tile < w; col++) {
      const xx = x + col * tile;
      const yy = y + row * tile;
      const variation = Math.sin(col * 83.7 + row * 18.3) * Math.cos(row * 37.4 - col * 9.2);
      rect(
        c,
        xx,
        yy,
        tile,
        tile,
        variation > 0
          ? 'rgba(244,255,242,' + variation * 0.2 + ')'
          : 'rgba(9,56,82,' + -variation * 0.12 + ')',
      );
      rect(c, xx + 2, yy + 2, tile - 4, 1.3, 'rgba(255,255,238,.22)');
    }
  }
  for (let xx = x; xx < x + w; xx += tile) line(c, xx, y, xx, y + h, 'rgba(227,230,209,.52)', 1.3);
  for (let yy = y; yy < y + h; yy += tile) line(c, x, yy, x + w, yy, 'rgba(223,231,210,.55)', 1.3);
  c.restore();
}

let stationPlate;
function station(c) {
  if (!stationPlate) {
    stationPlate = createCanvas(1920, 1080);
    const g = stationPlate.getContext('2d');
    const glaze = g.createLinearGradient(0, 0, 400, 1070);
    glaze.addColorStop(0, '#e1e9df');
    glaze.addColorStop(0.45, '#d5e3dc');
    glaze.addColorStop(1, '#a8c2c0');
    rect(g, 0, 0, 1920, 1080, glaze);
    for (let j = 0; j < 15; j++) {
      const yy = j * 77 - 27;
      line(g, 0, yy, 1920, yy, '#b4cac4', 3);
      line(g, 0, yy + 2, 1920, yy + 2, '#e9efe5', 2);
      for (let x = (j % 2) * 90; x < 1920; x += 180)
        line(g, x, yy + 2, x, yy + 75, 'rgba(109,151,149,.28)', 2);
    }
    mosaic(g);
    // Daylight from the concourse roof falls across the ceramic wall.
    g.save();
    for (let i = -1; i < 4; i++) {
      const x = 166 + i * 573;
      shape(
        g,
        [
          [x, 0],
          [x + 130, 0],
          [x - 218, 925],
          [x - 350, 925],
        ],
        'rgba(255,252,224,.13)',
      );
    }
    g.restore();
    rect(g, 0, 905, 1920, 14, '#749999');
    rect(g, 0, 919, 1920, 31, '#9db9b5');
    rect(g, 0, 951, 1920, 8, '#486e76');
    const floor = g.createLinearGradient(0, 960, 0, 1080);
    floor.addColorStop(0, '#859c9e');
    floor.addColorStop(1, '#a7b7b2');
    rect(g, 0, 959, 1920, 121, floor);
    for (let i = -1; i < 8; i++) line(g, 156 + i * 307, 960, 43 + i * 355, 1080, '#829a9c', 2);
    for (const x of [929, 1665]) {
      rect(g, x + 13, 0, 13, 197, 'rgba(52,75,80,.13)');
      rect(g, x, 0, 16, 198, '#455e6e');
      rect(g, x + 2, 0, 4, 198, '#90a4a9');
    }
    g.save();
    g.shadowColor = 'rgba(16,48,67,.27)';
    g.shadowBlur = 16;
    g.shadowOffsetX = 12;
    g.shadowOffsetY = 19;
    round(g, 747, 174, 1119, 697, 21, '#1e354e');
    g.restore();
    round(g, 750, 174, 1110, 685, 19, '#294a68');
    round(g, 762, 184, 1086, 661, 12, ink);
    text(g, 'Station guide', 798, 245, 35, '#aed5df', 600);
    text(g, 'Which way to the aquarium?', 794, 322, 66, '#faf5df', 600);
    line(g, 797, 354, 1827, 354, '#637f91', 2);
  }
  c.drawImage(stationPlate, 0, 0);
}

function face(c, x, y, w, h, kind) {
  const spec = arrows[kind];
  round(c, x, y, w, h, Math.min(8, w * 0.07), spec?.color || '#768e99');
  if (spec) arrow(c, x + w / 2, y + h / 2, Math.min(h, w) * 0.7, spec.angle, ink);
  rect(c, x, y + h / 2, w, h / 2 - 2, 'rgba(24,42,62,.105)');
  rect(c, x + 1, y + h / 2 - 1, w - 2, Math.max(1.3, h * 0.009), 'rgba(19,40,59,.62)');
}

// A falling leaf exposes the new top first and the new bottom last.
function flap(c, x, y, w, h, from, to, progress) {
  if (progress <= 0 || from === to) return face(c, x, y, w, h, from);
  if (progress >= 1) return face(c, x, y, w, h, to);
  const half = h / 2;
  face(c, x, y, w, h, from);
  c.save();
  c.beginPath();
  c.rect(x, y, w, half);
  c.clip();
  face(c, x, y, w, h, to);
  c.restore();
  c.save();
  c.translate(0, y + half);
  const scale = Math.cos(progress * Math.PI);
  c.scale(1, Math.max(0.001, Math.abs(scale)));
  const top = progress < 0.5;
  c.beginPath();
  c.rect(x, top ? -half : 0, w, half);
  c.clip();
  face(c, x, -half, w, h, top ? from : to);
  rect(c, x, -half, w, h, 'rgba(15,33,52,' + (1 - Math.abs(scale)) * 0.55 + ')');
  c.restore();
}

function largeReply(c, x, y, kind, label, flip = 1) {
  round(c, x - 6, y - 6, 258, 208, 10, '#102238');
  flap(c, x, y, 246, 196, -1, kind, flip);
  text(c, label, x + 123, y + 253, 43, cream, 600, 'center');
}

function savedVote(c, progress, choice) {
  text(c, 'Saved comparison', 798, 416, 40, '#c8dae0', 600);
  largeReply(c, 949, 467, 0, 'Left', progress);
  largeReply(c, 1424, 467, 1, 'Right', progress);
  if (choice > 0) {
    c.save();
    c.globalAlpha = choice;
    line(c, 949, 676, 1195, 676, '#a3d5e7', 5);
    text(c, 'Reviewer’s choice', 1072, 784, 39, '#aadced', 600, 'center');
    c.restore();
  }
}

function turnAt(col, sweep) {
  if (col < 2 || col >= 10) return 0;
  // Whole columns change together, so every settled state keeps the four-to-one ratio.
  return clamp(sweep * 9 - (9 - col));
}
function tileAt(col, row, sweep) {
  const initial = col >= 10 ? 2 : row === rows - 1 ? 1 : 0;
  const turn = turnAt(col, sweep);
  return { initial, turn, current: turn >= 0.5 ? 2 : initial };
}
function population(sweep) {
  const counts = [0, 0, 0];
  for (let col = 0; col < columns; col++)
    for (let row = 0; row < rows; row++) counts[tileAt(col, row, sweep).current]++;
  const odds = counts[0] / counts[1];
  const referenceOdds = 1;
  const loss = Math.log1p(Math.exp(-beta * Math.log(odds / referenceOdds)));
  return { counts, odds, loss };
}

function board(c, sweep, focusColumns, focusOpacity, showScore, showReference) {
  const { counts, odds, loss } = population(sweep);
  const name = sweep === 0 ? 'Model 1' : sweep === 1 ? 'Model 2' : 'Changing models';
  text(c, name, 798, 419, 39, cream, 700);
  text(
    c,
    showReference ? 'Reference odds  1 : 1      β = ' + beta : '1 flap = 1% chance',
    1824,
    416,
    31,
    '#c6d8dd',
    500,
    'right',
  );
  for (let col = 0; col < columns; col++) {
    for (let row = 0; row < rows; row++) {
      const { initial, turn } = tileAt(col, row, sweep);
      flap(c, cellX + col * pitchX, cellY + row * pitchY, pitchX - 3, pitchY - 3, initial, 2, turn);
    }
  }
  if (focusOpacity > 0) {
    c.save();
    c.globalAlpha = focusOpacity;
    c.lineWidth = 4;
    c.strokeStyle = '#fffbea';
    c.strokeRect(cellX - 4, cellY - 5, pitchX * focusColumns + 5, pitchY * rows + 7);
    c.restore();
  }
  const xs = [800, 1090, 1390];
  for (let i = 0; i < 3; i++) {
    arrow(c, xs[i] + 13, 736, 28, arrows[i].angle, arrows[i].color);
    text(c, arrows[i].name + ' ' + counts[i] + '%', xs[i] + 42, 749, 36, cream, 600);
  }
  if (showScore > 0) {
    c.save();
    c.globalAlpha = showScore;
    line(c, 797, 776, 1827, 776, '#637f91', 2);
    text(c, 'Left / right', 798, 816, 32, '#bfccd6');
    text(c, odds + ' : 1', 974, 817, 40, cream, 600);
    text(c, 'Loss on saved vote', 1220, 816, 32, '#bfccd6');
    text(c, loss.toFixed(3), 1826, 817, 40, cream, 600, 'right', 'Mono');
    c.restore();
  }
}

function nextPair(c, take) {
  const a = { col: 0, row: 2, end: 949, kind: 0 };
  const b = { col: 13, row: 3, end: 1424, kind: 2 };
  const travel = smooth(take);
  for (const tile of [a, b]) {
    const x = mix(cellX + tile.col * pitchX, tile.end, travel);
    const y = mix(cellY + tile.row * pitchY, 467, travel) - 55 * Math.sin(travel * Math.PI);
    const w = mix(pitchX - 3, 246, travel),
      h = mix(pitchY - 3, 196, travel);
    face(c, x, y, w, h, tile.kind);
  }
  c.save();
  c.globalAlpha = smooth((take - 0.68) / 0.32);
  text(c, 'Next comparison', 798, 416, 40, '#c8dae0', 600);
  text(c, 'Left', 1072, 720, 43, cream, 600, 'center');
  text(c, 'Straight ahead', 1547, 720, 43, cream, 600, 'center');
  c.restore();
}

function draw(c, clock) {
  const { index, elapsed, reveal } = clock;
  const take = index === 6 ? reveal('put it beside left', 1.7) : 0;
  const push = index < 2 ? 0 : index === 2 ? smooth(elapsed / 1.9) : 1 - smooth(take);
  c.save();
  c.translate(960, 540);
  const zoom = mix(1, 1.63, push);
  c.scale(zoom, zoom);
  c.translate(-mix(960, 1304, push), -mix(540, 579, push));
  station(c);
  if (index === 0) {
    text(c, 'One reply', 798, 416, 40, '#c8dae0', 600);
    largeReply(c, 1188, 467, 2, 'Straight ahead', clamp(0.12 + elapsed / 1.12));
  } else if (index === 1) {
    savedVote(c, clamp(elapsed / 0.65), reveal('and picked left', 0.35));
  } else {
    const sweep = index < 4 ? 0 : index === 4 ? smooth(reveal('a second model', 4.5)) : 1;
    const highlight =
      index === 2
        ? reveal('Read down the first column')
        : index === 5
          ? reveal('Look at the two columns')
          : 0;
    const showReference = index > 3 || (index === 3 && reveal('a fixed reference') > 0.5);
    const score = index < 3 ? 0 : index === 3 ? reveal('Direct preference optimization') : 1;
    if (take < 1) {
      c.save();
      c.globalAlpha = 1 - smooth(take);
      board(c, sweep, index === 5 ? 2 : 1, highlight, score, showReference);
      c.restore();
    }
    if (take > 0) nextPair(c, take);
  }
  c.restore();
}

function check() {
  const first = population(0);
  const second = population(1);
  assert.deepEqual(first.counts, [40, 10, 50]);
  assert.deepEqual(second.counts, [8, 2, 90]);
  for (let n = 0; n <= 8; n++) {
    const result = population(n === 8 ? 1 : n / 9);
    const source = alignmentMissingPair(n / 8);
    assert.deepEqual(
      result.counts,
      source.probabilities.map((p) => Math.round(100 * p)),
    );
    assert.equal(
      result.counts.reduce((a, b) => a + b, 0),
      100,
    );
    assert.equal(result.odds, 4);
    assert.ok(Math.abs(result.loss - source.loss) < 1e-12);
  }
  assert.equal(first.loss, second.loss);
  assert.equal(first.loss.toFixed(3), '0.626');
  assert.equal(tileAt(0, 2, 1).current, 0);
  assert.equal(tileAt(13, 3, 1).current, 2);
}

export default { title, beats, draw, check };
