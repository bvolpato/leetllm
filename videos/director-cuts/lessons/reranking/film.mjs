import assert from 'node:assert/strict';
import { libraryText, sundayQuestion } from '../../../films/reranking/library-shelf.mjs';
import { scores, passageIds } from '../../../films/reranking/fixtures.mjs';
import { rerank } from '../../../films/reranking/model.mjs';

const title = 'Reranking at the Sunday window';
const beats = [
  {
    id: 'raise-the-blind',
    say: 'Would you make the trip to the library on Sunday? Search found three notices. The assistant gets to read the two in the blue window.',
    hold: 1.4,
  },
  {
    id: 'take-two',
    say: 'Give the reranker just those first two notices for a moment. This reranker is a cross-encoder. It reads the question and one passage together, then gives that pair a relevance score.',
    hold: 0.6,
  },
  {
    id: 'two-readings',
    say: "Read the story time notice with our question. That's about Saturday. Now try the holiday notice. It mentions hours, and in this example it gets the higher score.",
    hold: 0.6,
  },
  {
    id: 'trade-places',
    say: "Put the higher score first. Look through the blue window again. Can you tell whether it's worth going on Sunday? Which notice would you want the scorer to read next?",
    hold: 2.4,
  },
  {
    id: 'third-reading',
    say: 'Try the one with the clock. Give the scorer a third passage and keep the assistant at two. Read our question with this notice. A sentence that answers no can be a very good match.',
    hold: 1.1,
  },
  {
    id: 'follow-the-clock',
    say: "Keep your eye on that clock face. Let's put all three notices in score order. Now the assistant can read the hours. Search found this sentence the first time around. Reranking brought it into the window.",
    hold: 0.8,
  },
  {
    id: 'sunday',
    say: 'Sunday. The library is closed.',
    hold: 3,
  },
];

const searchOrder = [0, 1, 2];
const slots = 2;
function pass(depth) {
  const candidates = searchOrder.slice(0, depth);
  const ranked = rerank(candidates);
  return {
    candidates,
    displayed: [...ranked, ...searchOrder.slice(depth)],
    packed: ranked.slice(0, slots),
  };
}
const two = pass(2);
const three = pass(3);
const copy = [
  ['Saturday story time', 'starts at ten.'],
  ['Holiday hours', 'vary by branch.'],
  ['Sunday:', 'the library is closed.'],
];
function check() {
  assert.deepEqual(
    copy.map((lines) => lines.join(' ')),
    libraryText,
  );
  assert.deepEqual(
    scores.map((n) => n.toFixed(2)),
    ['0.05', '0.40', '2.30'],
  );
  assert.deepEqual(
    two.packed.map((i) => passageIds[i]),
    ['holiday-v3', 'events-v2'],
  );
  assert.deepEqual(
    three.packed.map((i) => passageIds[i]),
    ['hours-v7', 'holiday-v3'],
  );
  assert(!two.candidates.includes(2));
  assert(three.candidates.includes(2));
  for (const result of [two, three]) {
    assert.deepEqual(result.displayed.slice(0, slots), result.packed);
    assert.deepEqual([...result.displayed].sort(), searchOrder);
  }
}

const navy = '#19365a';
const blue = '#235692';
const parchment = '#fff0d4';
const bay = [399, 960, 1567];
const paperY = 601;
const clamp = (t) => Math.max(0, Math.min(1, t));
const smooth = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;
function cue(clock, index, phrase, duration) {
  if (clock.index !== index) return Number(clock.index > index);
  return smooth(clock.reveal(phrase, duration));
}
function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function shape(ctx, color, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
function ink(ctx, color, width, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function disc(ctx, color, x, y, r) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function type(ctx, value, x, y, size, color, family = 'Sans', weight = 400) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
function fan(ctx, x, color) {
  for (let i = -4; i <= 4; i++) {
    const a = (i * Math.PI) / 10;
    ink(ctx, color, 4, [
      [x, 83],
      [x + 68 * Math.sin(a), 83 - 54 * Math.cos(a)],
    ]);
  }
  ink(ctx, color, 4, [
    [x - 72, 84],
    [x + 72, 84],
  ]);
}
function facade(ctx) {
  rect(ctx, '#e9c6a0', -150, -30, 2120, 1140);
  for (let row = 0; row < 13; row++) {
    const y = 94 + row * 86;
    ink(ctx, '#d8b08c', 2, [
      [-150, y],
      [1920, y + 1],
    ]);
    for (let x = row % 2 ? 109 : -65; x < 1920; x += 290) {
      ink(ctx, '#deba98', 2, [
        [x, y],
        [x, y + 85],
      ]);
    }
  }
  rect(ctx, '#a75e45', -150, 0, 2070, 14);
  rect(ctx, '#f5dab6', -150, 14, 2070, 96);
  rect(ctx, '#bc8668', -150, 110, 2070, 7);
  rect(ctx, '#f9dfb9', -150, 117, 2070, 9);
  rect(ctx, '#d5aa85', -150, 126, 2070, 11);
  for (const x of [260, 1660]) fan(ctx, x, '#b7795b');
  for (const [a, b] of [
    [335, 657],
    [1263, 1585],
  ]) {
    ink(ctx, '#b7795b', 3, [
      [a, 59],
      [b, 59],
    ]);
    ink(ctx, '#b7795b', 2, [
      [a + 28, 72],
      [b - 28, 72],
    ]);
  }
  type(ctx, 'P U B L I C    L I B R A R Y', 960, 81, 51, navy, 'Serif');

  // One continuous blue surround makes the two assistant places a physical aperture.
  rect(ctx, '#b98f71', 87, 302, 1193, 649);
  rect(ctx, navy, 76, 282, 1198, 653);
  rect(ctx, blue, 87, 293, 1176, 626);
  rect(ctx, '#557da5', 104, 310, 1142, 526);
  rect(ctx, '#aa745d', 1307, 319, 522, 599);
  rect(ctx, '#bd896f', 1314, 324, 507, 581);

  for (const [i, x] of bay.entries()) {
    const light = i < 2 ? '#a3c0c9' : '#d4aa8d';
    const rim = i < 2 ? '#355879' : '#aa795f';
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(x - 252, 831);
    ctx.lineTo(x - 252, 485);
    ctx.bezierCurveTo(x - 252, 258, x + 252, 258, x + 252, 485);
    ctx.lineTo(x + 252, 831);
    ctx.closePath();
    ctx.fill();
    for (let n = -2; n <= 2; n++) {
      const a = n * 0.46;
      ink(ctx, rim, 7, [
        [x, 480],
        [x + 236 * Math.sin(a), 480 - 162 * Math.cos(a)],
      ]);
    }
  }
  rect(ctx, '#183e6c', 76, 831, 1198, 84);
  rect(ctx, '#adc7cf', 94, 832, 1162, 4);
  rect(ctx, '#416b98', 94, 902, 1162, 4);
  type(ctx, 'Assistant reads these two', 675, 885, 44, '#fff2d7', 'Sans', 600);
  type(ctx, 'Outside the prompt', bay[2], 883, 38, '#4f332e', 'Serif');
  shape(ctx, '#c49777', [
    [50, 930],
    [1281, 930],
    [1258, 967],
    [87, 967],
  ]);
  rect(ctx, '#f9dfbf', 53, 917, 1242, 14);
  rect(ctx, '#e3bb96', 69, 931, 1211, 12);
  rect(ctx, '#d4ab88', 0, 992, 1920, 88);
  for (let x = -80; x < 1920; x += 145) {
    ink(ctx, '#ba9578', 2, [
      [x, 992],
      [x - 17, 1080],
    ]);
  }
  rect(ctx, '#efcba5', 0, 988, 1920, 7);
}

function blind(ctx, t) {
  // The striped canvas lifts at the cut. Its hem stays above the two blue bays.
  const left = 64,
    width = 1220;
  const hem = mix(774, 323, smooth(clamp(t / 1.6)));
  const pitch = width / 15;
  for (let i = 0; i < 15; i++) {
    const x = left + i * pitch,
      color = i % 2 ? '#e1d9be' : '#416e9b';
    rect(ctx, color, x, 273, pitch + 0.65, hem - 273);
    ctx.beginPath();
    ctx.moveTo(x, hem - 2);
    ctx.lineTo(x + pitch, hem - 2);
    ctx.quadraticCurveTo(x + pitch * 0.52, hem + 22, x, hem - 2);
    ctx.fillStyle = i % 2 ? '#cfc8ac' : '#315d88';
    ctx.fill();
  }
  rect(ctx, '#233e62', 53, 265, 1242, 9);
  rect(ctx, '#8298a9', 52, 259, 1244, 7);
}

function star(ctx, x, y, size, color) {
  shape(ctx, color, [
    [x, y - size],
    [x + size * 0.25, y - size * 0.26],
    [x + size, y],
    [x + size * 0.25, y + size * 0.25],
    [x, y + size],
    [x - size * 0.25, y + size * 0.25],
    [x - size, y],
    [x - size * 0.25, y - size * 0.26],
  ]);
}
function foxPrint(ctx) {
  const field = '#243e65',
    orange = '#e67d43',
    white = '#ffe5b7';
  rect(ctx, field, -230, -212, 460, 219);
  disc(ctx, '#f4c56f', -143, -148, 35);
  disc(ctx, field, -125, -161, 34);
  for (const [x, y, s] of [
    [-185, -64, 7],
    [90, -168, 9],
    [164, -109, 12],
    [191, -170, 5],
    [-73, -181, 6],
  ]) {
    star(ctx, x, y, s, white);
  }
  // Cut-paper fox, folded tail, then the open book in its lap.
  ctx.beginPath();
  ctx.moveTo(-86, -18);
  ctx.bezierCurveTo(-174, -6, -159, -65, -114, -91);
  ctx.bezierCurveTo(-98, -100, -95, -114, -95, -128);
  ctx.bezierCurveTo(-54, -94, -66, -49, -41, -36);
  ctx.fillStyle = orange;
  ctx.fill();
  shape(ctx, white, [
    [-114, -91],
    [-95, -128],
    [-87, -103],
    [-87, -90],
    [-96, -98],
    [-99, -88],
    [-102, -94],
  ]);
  shape(ctx, orange, [
    [-74, -36],
    [-43, -109],
    [48, -111],
    [79, -25],
  ]);
  shape(ctx, orange, [
    [-53, -152],
    [-65, -201],
    [-24, -176],
    [16, -174],
    [57, -203],
    [51, -151],
    [23, -118],
    [0, -108],
    [-31, -119],
  ]);
  shape(ctx, '#a74e39', [
    [-57, -190],
    [-36, -176],
    [-51, -170],
  ]);
  shape(ctx, '#a74e39', [
    [34, -175],
    [51, -191],
    [47, -167],
  ]);
  shape(ctx, white, [
    [-52, -152],
    [-26, -149],
    [0, -128],
    [26, -150],
    [52, -153],
    [32, -124],
    [0, -107],
    [-32, -126],
  ]);
  ink(ctx, field, 4, [
    [-39, -148],
    [-31, -144],
    [-23, -146],
  ]);
  ink(ctx, field, 4, [
    [24, -147],
    [31, -144],
    [40, -149],
  ]);
  shape(ctx, field, [
    [-7, -126],
    [7, -126],
    [0, -119],
  ]);
  shape(ctx, '#d6ab61', [
    [-101, -74],
    [-12, -57],
    [1, -49],
    [15, -55],
    [101, -70],
    [97, -16],
    [1, 0],
    [-94, -18],
  ]);
  shape(ctx, white, [
    [-97, -87],
    [-20, -77],
    [1, -63],
    [23, -75],
    [97, -83],
    [91, -28],
    [22, -17],
    [1, -10],
    [-25, -20],
    [-90, -29],
  ]);
  ink(ctx, '#a96e50', 3, [
    [1, -63],
    [1, -14],
  ]);
  for (let n = 0; n < 3; n++) {
    ink(ctx, '#bf9172', 2, [
      [-81, -71 + n * 10],
      [-20, -61 + n * 10],
    ]);
    ink(ctx, '#bf9172', 2, [
      [20, -61 + n * 10],
      [82, -69 + n * 10],
    ]);
  }
}
function holidayPrint(ctx) {
  const field = '#b7a6c4',
    plum = '#563b63',
    pale = '#ffe8c5';
  rect(ctx, field, -230, -212, 460, 219);
  disc(ctx, '#f1c58b', 105, -151, 39);
  const house = (x, base, w, h) => {
    rect(ctx, plum, x, base - h, w, h);
    shape(ctx, plum, [
      [x - 10, base - h],
      [x + w * 0.5, base - h - 48],
      [x + w + 10, base - h],
    ]);
    shape(ctx, pale, [
      [x - 14, base - h],
      [x + w * 0.5, base - h - 55],
      [x + w + 15, base - h],
      [x + w + 2, base - h - 2],
      [x + w * 0.5, base - h - 39],
      [x + 1, base - h + 3],
    ]);
    for (let j = 1; j <= 3; j++) {
      rect(ctx, '#e7bd98', x + (j * w) / 4 - 6, base - h + 16, 13, 18);
    }
  };
  shape(ctx, '#987e9c', [
    [-230, -47],
    [-154, -77],
    [-62, -33],
    [52, -91],
    [183, -69],
    [230, -45],
    [230, 6],
    [-230, 6],
  ]);
  house(-130, 6, 97, 63);
  house(13, 6, 120, 82);
  // Printed spruce branches hang across the little branch libraries.
  for (const [x, y, len] of [
    [-225, -174, 100],
    [-190, -180, 56],
    [215, -200, 83],
    [-202, -209, 106],
  ]) {
    const dir = x < 0 ? 1 : -1;
    ink(ctx, plum, 5, [
      [x, y],
      [x + dir * len, y + 30],
    ]);
    for (let j = 0; j < 7; j++) {
      const px = x + dir * ((len * j) / 7),
        py = y + (30 * j) / 7;
      ink(ctx, plum, 3, [
        [px + dir * 12, py - 12],
        [px, py],
        [px + dir * 1, py + 17],
      ]);
    }
  }
  star(ctx, -42, -137, 10, pale);
  star(ctx, -7, -182, 6, pale);
}
function hoursPrint(ctx) {
  const field = '#dc764e',
    burgundy = '#813c3e',
    pale = '#ffe5ad';
  rect(ctx, field, -230, -212, 460, 219);
  // A municipal clock tower with linocut rays and stepped masonry.
  for (let j = 0; j < 19; j++) {
    const a = Math.PI * (1 + j / 18);
    ink(ctx, '#edac70', 4, [
      [93 * Math.cos(a), -72 + 93 * Math.sin(a)],
      [285 * Math.cos(a), -72 + 285 * Math.sin(a)],
    ]);
  }
  shape(ctx, burgundy, [
    [-134, 7],
    [-134, -15],
    [-112, -15],
    [-112, -29],
    [-92, -29],
    [-92, -107],
    [-78, -107],
    [-78, -138],
    [-55, -161],
    [-20, -174],
    [0, -194],
    [20, -174],
    [55, -161],
    [78, -138],
    [78, -107],
    [92, -107],
    [92, -29],
    [112, -29],
    [112, -15],
    [134, -15],
    [134, 7],
  ]);
  for (const x of [-76, -65, 65, 76]) rect(ctx, '#ca8067', x, -100, 3, 96);
  disc(ctx, '#e8a974', 0, -98, 66);
  disc(ctx, pale, 0, -99, 57);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const r = i % 3 === 0 ? 39 : 45;
    ink(ctx, burgundy, i % 3 === 0 ? 4.5 : 2.5, [
      [r * Math.sin(a), -99 - r * Math.cos(a)],
      [50 * Math.sin(a), -99 - 50 * Math.cos(a)],
    ]);
  }
  ink(ctx, burgundy, 6, [
    [-23, -116],
    [0, -99],
    [28, -122],
  ]);
  disc(ctx, burgundy, 0, -99, 6);
  rect(ctx, '#e0a47c', -46, -23, 92, 4);
  rect(ctx, '#e0a47c', -54, -13, 108, 3);
}

const prints = [foxPrint, holidayPrint, hoursPrint];
const papers = ['#fff0cf', '#f6e6dc', '#ffe4b7'];
function poster(ctx, id, x, y, tilt, score) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  rect(ctx, 'rgba(49,37,47,.20)', -239, -211, 492, 441);
  rect(ctx, '#d2b797', -244, -218, 489, 442);
  rect(ctx, papers[id], -245, -222, 489, 441);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-230, -212, 460, 219);
  ctx.clip();
  prints[id](ctx);
  ctx.restore();
  type(ctx, copy[id][0], 0, 69, 50, navy, 'Serif');
  type(ctx, copy[id][1], 0, 123, 50, navy, 'Serif');
  ink(ctx, '#bca891', 1.5, [
    [-211, 143],
    [211, 143],
  ]);
  if (score > 0) {
    ctx.save();
    ctx.globalAlpha *= score;
    ctx.translate(0, (1 - score) * 8);
    type(ctx, `Score  ${scores[id].toFixed(2)}`, 0, 193, 38, navy, 'Mono');
    ctx.restore();
  }
  // The mounting corners keep the notices tangible as they trade places.
  for (const dir of [-1, 1]) {
    shape(ctx, '#f8e7cd', [
      [dir * 245, -222],
      [dir * 214, -222],
      [dir * 245, -193],
    ]);
    ink(ctx, '#bca98c', 1.5, [
      [dir * 213, -222],
      [dir * 245, -192],
    ]);
  }
  ctx.restore();
}

function question(ctx, x, y, rightmostCenter, pointer, opacity) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  const center = Math.min(x, rightmostCenter);
  const tip = x - center;
  ctx.translate(center, y);
  const w = 744,
    h = 86;
  const outline = [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [tip + 17, h / 2],
    [tip, h / 2 + 21 * pointer],
    [tip - 17, h / 2],
    [-w / 2, h / 2],
  ];
  ctx.save();
  ctx.translate(4, 6);
  shape(ctx, '#b78a6c', outline);
  ctx.restore();
  shape(ctx, parchment, outline);
  type(ctx, sundayQuestion, 0, 18, 49, navy, 'Serif');
  ctx.restore();
}

function draw(ctx, clock) {
  const firstPair = cue(clock, 1, 'the question and one passage', 1.0);
  const nextPair = cue(clock, 2, 'Now try the holiday notice', 0.9);
  const releaseTwo = cue(clock, 3, 'Put the higher score first', 0.9);
  const lastPair = cue(clock, 4, 'Try the one with the clock', 1.25);
  const releaseThree = cue(clock, 5, 'Keep your eye', 0.9);
  const a = cue(clock, 3, 'Put the higher score first', 2.2);
  const b = cue(clock, 5, "Let's put all three notices", 2.7);
  const scoreAlpha = [
    cue(clock, 2, "That's about Saturday", 0.45),
    cue(clock, 2, 'It mentions hours', 0.45),
    cue(clock, 4, 'Read our question with this notice', 0.55),
  ];
  const close = cue(clock, 6, 'Sunday', 2.3);
  const inspectTwo = cue(clock, 1, 'Give the reranker', 1.85) - cue(clock, 3, 'Which notice', 1.5);
  const zoom = 1 + 0.42 * inspectTwo + 0.5 * close;
  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.translate(40 * inspectTwo - 21 * close, -146 * inspectTwo - 237 * close);
  facade(ctx);
  const papersToHang = searchOrder.map((id) => {
    const midSlot = two.displayed.indexOf(id);
    const finalSlot = three.displayed.indexOf(id);
    const x = mix(mix(bay[id], bay[midSlot], a), bay[finalSlot], b);
    const arcA = Math.sin(a * Math.PI) * (id < 2 ? (id === 1 ? -1 : 0.14) : 0);
    const arcB = Math.sin(b * Math.PI) * (id === 2 ? -1 : 0.14);
    const lift = arcA + arcB;
    return { id, x, y: paperY + lift * 51, tilt: lift * 0.038, lift };
  });
  // The winning notice passes in front. Its paper covers the lettering behind it.
  papersToHang.sort((left, right) => right.lift - left.lift);
  for (const p of papersToHang) poster(ctx, p.id, p.x, p.y, p.tilt, scoreAlpha[p.id]);
  blind(ctx, clock.seconds);
  const neutral = mix(bay[1], (bay[0] + bay[1]) / 2, inspectTwo);
  let queryX = mix(neutral, bay[0], firstPair);
  queryX = mix(queryX, bay[1], nextPair);
  queryX = mix(queryX, neutral, releaseTwo);
  queryX = mix(queryX, bay[2], lastPair);
  queryX = mix(queryX, bay[1], releaseThree);
  question(
    ctx,
    queryX,
    197 + 18 * inspectTwo,
    mix(1519, 903, inspectTwo),
    firstPair * (1 - releaseTwo) + lastPair * (1 - releaseThree),
    1 - close,
  );
  ctx.restore();
}

export default { title, beats, draw, check };
