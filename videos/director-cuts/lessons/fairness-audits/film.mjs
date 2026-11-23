import assert from 'node:assert/strict';
import { THRESHOLD } from '../../../films/fairness-audits/fixtures.mjs';
import { route } from '../../../films/fairness-audits/arithmetic.mjs';
import { offsetRows } from '../../../films/fairness-audits/model.mjs';

// A punched record of the second audit run. Light passes through a stack
// only where every sheet has a hole in the same claim column.
const ready = offsetRows().filter((claim) => claim.ready);
const stock = {
  formal: { label: 'Formal', paper: '#ac452f', lip: '#733627', ink: '#fff0dd' },
  conversational: { label: 'Conversational', paper: '#345a82', lip: '#263d59', ink: '#f5f3e8' },
};
const punched = (claim, wording) => route(claim[wording]) === 'auto_serve';
const count = (wording) => ready.filter((claim) => punched(claim, wording)).length;
const shared = ready.filter(
  (claim) => punched(claim, 'formal') && punched(claim, 'conversational'),
);
const flips = ready.filter(
  (claim) => punched(claim, 'formal') !== punched(claim, 'conversational'),
);
const blender = ready.find((claim) => claim.id === 'p4');
const xOf = (i) => 650 + 201 * i;
const ink = '#1c3041';
const clamp = (x) => Math.min(1, Math.max(0, x));
function ease(x) {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
}

const beats = [
  {
    id: 'switch-on',
    say: 'Watch the blue strip slide over the light. Each strip records where a router sent the same six return claims. A hole means automatic service. A solid spot means a person has to review the claim.',
    hold: 0.7,
  },
  {
    id: 'blender',
    say: 'Take claim four. A blender broke on day twelve of a thirty-day replacement policy. Both versions of the request come with this receipt.',
    hold: 0.6,
  },
  {
    id: 'two-wordings',
    say: 'One version says, “Please replace it under the thirty-day policy.” The other asks, “Can you replace it?” A language model scores each request. At point seven or higher, the router sends the claim to automatic service. Both versions get through. We test each claim twice like this, keeping the facts and the router settings fixed.',
    hold: 0.8,
  },
  {
    id: 'count',
    say: 'Count the holes on each strip. Five of six ready claims get automatic service with formal wording. Five of six with conversational wording. If the same five claims got through, how many holes should line up?',
    hold: 1.8,
  },
  {
    id: 'register',
    say: 'Slide the blue strip up to the red one. Look through the stack. Four holes line up. What blocked the light at the ends?',
    hold: 1.3,
  },
  {
    id: 'lift',
    say: 'Separate the strips again. At claim one, conversational wording sends a ready claim to a person. At claim six, the reverse happens. Here, conversational wording gets the claim onto the fast path.',
    hold: 0.7,
  },
  {
    id: 'pair-check',
    say: 'One claim lost automatic service and another gained it. Those changes cancel in the totals. Our test requires both wordings of each claim to keep the same route. These two pairs fail.',
    hold: 3,
  },
];

function shape(ctx, pts, fill, stroke, width = 1) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}
function line(ctx, pts, color, width = 2) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function box(ctx, x, y, w, h, r, color) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}
function write(ctx, s, x, y, size, color = ink, font = 'Sans', weight = '400', align = 'left') {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + font + '"';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}
function linear(ctx, x, y, x2, y2, stops) {
  const g = ctx.createLinearGradient(x, y, x2, y2);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  return g;
}

// Faint flecks in the blue laminate remain stationary when the paper moves.
const flecks = Array.from({ length: 380 }, (_, i) => [
  (i * 761 + (i % 19) * 83) % 1920,
  (i * 269 + (i % 37) * 103) % 1080,
  (i % 7) + 2,
]);
function table(ctx, lamp, verdict) {
  ctx.fillStyle = linear(ctx, 0, 0, 1450, 1080, [
    [0, '#a4b3c5'],
    [0.5, '#7e93ad'],
    [1, '#677d9c'],
  ]);
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.beginPath();
  for (const [x, y, w] of flecks) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y - 1);
  }
  ctx.strokeStyle = '#d2d8df55';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  ctx.shadowBlur = 40;
  ctx.shadowColor = '#29344972';
  ctx.shadowOffsetY = 26;
  box(ctx, 65, 100, 1790, 830, 46, '#986d52');
  ctx.restore();
  box(ctx, 65, 89, 1790, 825, 44, '#ad774e');
  box(
    ctx,
    65,
    76,
    1790,
    818,
    44,
    linear(ctx, 80, 60, 400, 920, [
      [0, '#ffe0ad'],
      [0.55, '#edc999'],
      [1, '#d5a879'],
    ]),
  );
  box(ctx, 93, 107, 1734, 741, 25, '#927c66');
  box(ctx, 100, 114, 1720, 728, 20, '#a7aaa4');
  ctx.save();
  ctx.globalAlpha = lamp;
  box(
    ctx,
    100,
    114,
    1720,
    728,
    20,
    linear(ctx, 170, 120, 1390, 900, [
      [0, '#d9d9cc'],
      [0.5, '#f3efdb'],
      [1, '#d8d6cb'],
    ]),
  );
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(105, 119, 1710, 718, 18);
  ctx.clip();
  for (const y of [440, 680]) {
    ctx.save();
    ctx.translate(1110, y);
    ctx.scale(7.5, 1);
    const tube = ctx.createRadialGradient(0, 0, 14, 0, 0, 140);
    tube.addColorStop(0, '#ffffeeef');
    tube.addColorStop(0.58, '#fff8d7b2');
    tube.addColorStop(1, '#fff8d700');
    ctx.fillStyle = tube;
    ctx.fillRect(-140, -140, 280, 280);
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
  // The straight marks on the glass register the same case on both sheets.
  for (let i = 0; i < ready.length; i++) {
    const x = xOf(i);
    line(
      ctx,
      [
        [x, 290],
        [x, 756],
      ],
      '#7b81802e',
      2,
    );
    line(
      ctx,
      [
        [x - 9, 290],
        [x + 9, 290],
      ],
      '#7b818078',
      2,
    );
    write(ctx, ready[i].id.toUpperCase(), x, 267, 46, ink, 'Mono', '400', 'center');
  }
  write(ctx, 'Returns desk', 157, 205, 77, ink, 'Serif');
  write(ctx, 'Ready claims', 162, 268, 36, '#46585d');
  ctx.save();
  ctx.globalAlpha = 1 - verdict;
  ellipse(ctx, 1270, 179, 28, 28, '#73796e');
  ellipse(ctx, 1271, 181, 25, 25, '#ffffed');
  write(ctx, 'Automatic service', 1315, 195, 46, ink);
  ctx.restore();
  if (verdict > 0) {
    ctx.save();
    ctx.globalAlpha = verdict;
    ctx.translate(1472, 182);
    ctx.rotate(-0.035);
    write(ctx, flips.length + ' pairs fail', 0, 23, 66, '#833822', 'Serif', '400', 'center');
    line(
      ctx,
      [
        [-149, 39],
        [-5, 36],
        [143, 38],
      ],
      '#a85f46',
      4,
    );
    ctx.restore();
  }
}

function cardOutline(ctx, formal) {
  // The offset index tabs keep both wording labels visible in the stack.
  const upper = formal ? -91 : 4,
    lower = formal ? -4 : 91;
  const contour = [
    [154, upper + 13],
    [167, upper],
    [485, upper],
    [510, upper + 12],
    [524, upper + 12],
    [524, -94],
    [1738, -94],
    [1769, -65],
    [1769, 80],
    [1756, 94],
    [524, 94],
    [524, lower - 12],
    [508, lower - 12],
    [484, lower],
    [167, lower],
    [154, lower - 13],
  ];
  ctx.moveTo(...contour[0]);
  for (const [x, y] of contour.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
}
function apertures(ctx, key) {
  for (let i = 0; i < ready.length; i++) {
    if (!punched(ready[i], key)) continue;
    const x = xOf(i);
    ctx.moveTo(x + 61, 0);
    ctx.arc(x, 0, 61, 0, 2 * Math.PI);
    ctx.closePath();
  }
}
function paperLayer(ctx, key, color) {
  ctx.beginPath();
  cardOutline(ctx, key === 'formal');
  apertures(ctx, key);
  ctx.fillStyle = color;
  ctx.fill('evenodd');
}
function card(ctx, key, y, dx, angle, showCount, lift = 0) {
  const formal = key === 'formal',
    s = stock[key],
    labelY = formal ? -36 : 53;
  ctx.save();
  ctx.translate(960 + dx, y);
  ctx.rotate(angle);
  ctx.translate(-960, 0);
  ctx.save();
  ctx.translate(0, 5 + lift * 7);
  ctx.shadowColor = '#30332b55';
  ctx.shadowBlur = 7 + lift * 13;
  ctx.shadowOffsetX = 3 + lift * 4;
  ctx.shadowOffsetY = 3 + lift * 5;
  paperLayer(ctx, key, s.lip);
  ctx.restore();
  paperLayer(ctx, key, s.paper);
  ctx.save();
  ctx.beginPath();
  cardOutline(ctx, formal);
  apertures(ctx, key);
  ctx.clip('evenodd');
  // Long, irregular threads catch the light at the cut edges of the stock.
  for (let tone = 0; tone < 2; tone++) {
    ctx.beginPath();
    for (let i = tone; i < 420; i += 2) {
      const x = 150 + ((i * 571) % 1630),
        yy = -100 + ((i * 113) % 199);
      ctx.moveTo(x, yy);
      ctx.lineTo(x + 3 + (i % 8), yy - 1);
    }
    ctx.strokeStyle = tone ? '#fff3dc21' : '#16263525';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  line(
    ctx,
    [
      [526, -92],
      [1740, -92],
    ],
    '#fff1cd88',
    3,
  );
  line(
    ctx,
    [
      [526, 91],
      [1755, 91],
    ],
    '#20180e3a',
    2,
  );
  for (let i = 0; i < ready.length; i++) {
    const x = xOf(i);
    if (i > 0)
      line(
        ctx,
        [
          [x - 101, -91],
          [x - 101, -73],
        ],
        '#fff2dc88',
        2,
      );
    if (punched(ready[i], key)) {
      ctx.beginPath();
      ctx.arc(x, 0, 62, 0, Math.PI * 2);
      ctx.strokeStyle = '#382e344d';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, 0, 63, 0.25, 2.7);
      ctx.strokeStyle = '#fff5d89c';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      // An unpunched site keeps its stock color, hatch and direct route label.
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, 0, 62, 0, 2 * Math.PI);
      ctx.clip();
      for (let j = -133; j < 133; j += 13)
        line(
          ctx,
          [
            [x + j, -74],
            [x + j + 70, 74],
          ],
          '#18233245',
          4,
        );
      box(ctx, x - 67, -19, 134, 38, 0, s.paper);
      write(ctx, 'Review', x, 12, 35, s.ink, 'Sans', '600', 'center');
      ctx.restore();
      ctx.beginPath();
      ctx.arc(x, 0, 62, 0, 2 * Math.PI);
      ctx.setLineDash([5, 6]);
      ctx.strokeStyle = '#ffe7cb99';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.restore();
  write(ctx, s.label, 183, labelY + (showCount ? -13 : 6), formal ? 48 : 41, s.ink, 'Sans', '600');
  if (showCount)
    write(ctx, count(key) + ' of ' + ready.length, 185, labelY + 26, 36, s.ink, 'Mono');
  ctx.restore();
}

// An appliance drawing on the claim itself gives the shared facts a single home.
function drawBlender(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ellipse(ctx, 82, 150, 169, 15, '#45556d1c');
  ctx.beginPath();
  ctx.moveTo(142, 112);
  ctx.bezierCurveTo(242, 137, 199, 182, 269, 153);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.save();
  ctx.translate(273, 150);
  ctx.rotate(-0.48);
  box(ctx, -3, -11, 32, 23, 5, ink);
  line(
    ctx,
    [
      [26, -5],
      [47, -5],
    ],
    ink,
    4,
  );
  line(
    ctx,
    [
      [26, 5],
      [47, 5],
    ],
    ink,
    4,
  );
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(121, -120);
  ctx.bezierCurveTo(230, -132, 228, -36, 135, -8);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 28;
  ctx.stroke();
  ctx.strokeStyle = '#d6e3df';
  ctx.lineWidth = 17;
  ctx.stroke();
  shape(
    ctx,
    [
      [-58, -148],
      [154, -148],
      [131, -28],
      [103, 3],
      [-21, 3],
      [-44, -36],
    ],
    '#c1d8d5',
    ink,
    6,
  );
  shape(
    ctx,
    [
      [-55, -143],
      [-8, -139],
      [10, -11],
      [-18, -10],
      [-38, -40],
    ],
    '#e9f1e2',
  );
  line(
    ctx,
    [
      [115, -140],
      [97, -31],
      [85, -10],
    ],
    '#edf5e8',
    9,
  );
  for (let i = 0; i < 4; i++)
    line(
      ctx,
      [
        [2, -111 + i * 23],
        [i % 2 ? 19 : 28, -111 + i * 23],
      ],
      '#5e8181',
      3,
    );
  line(
    ctx,
    [
      [70, -142],
      [52, -107],
      [70, -91],
      [45, -66],
      [58, -48],
    ],
    ink,
    5,
  );
  line(
    ctx,
    [
      [70, -91],
      [91, -96],
      [96, -110],
    ],
    ink,
    3,
  );
  box(ctx, -64, -159, 226, 19, 7, ink);
  box(ctx, 14, -174, 70, 16, 6, '#526271');
  box(ctx, -24, 1, 132, 21, 3, ink);
  shape(
    ctx,
    [
      [-34, 21],
      [116, 21],
      [143, 45],
      [159, 130],
      [-73, 130],
      [-59, 48],
    ],
    '#df7f54',
    ink,
    6,
  );
  shape(
    ctx,
    [
      [115, 25],
      [138, 49],
      [153, 124],
      [125, 124],
      [109, 50],
    ],
    '#be5d44',
  );
  box(ctx, -72, 125, 232, 16, 4, ink);
  ellipse(ctx, 41, 78, 34, 34, '#32465a');
  ellipse(ctx, 41, 76, 26, 26, '#e8cda1');
  line(
    ctx,
    [
      [42, 75],
      [52, 55],
    ],
    ink,
    5,
  );
  for (let i = 0; i < 3; i++)
    line(
      ctx,
      [
        [-44, 72 + i * 9],
        [-11, 72 + i * 9],
      ],
      '#875041',
      3,
    );
  ctx.restore();
}
function claimSlip(ctx, amount, formalScore, casualScore, cutoff) {
  if (amount === 0) return;
  ctx.save();
  ctx.translate(96 + (1 - amount) * 1950, 114 - (1 - amount) * 145);
  ctx.scale(1.1, 1.1);
  ctx.rotate(-0.003 - 0.045 * (1 - amount));
  ctx.save();
  ctx.shadowColor = '#273b4c70';
  ctx.shadowOffsetY = 16;
  ctx.shadowBlur = 26;
  box(ctx, 0, 0, 1568, 652, 8, '#f5ead5');
  ctx.restore();
  box(ctx, 0, 0, 20, 652, 2, '#c59c67');
  for (let i = 0; i < 175; i++) {
    const x = 33 + ((i * 421) % 1501),
      y = 8 + ((i * 181) % 631);
    line(
      ctx,
      [
        [x, y],
        [x + 9, y - 1],
      ],
      '#98714a29',
      1.5,
    );
  }
  write(ctx, 'Replacement receipt', 62, 92, 53, ink, 'Serif');
  write(ctx, 'Claim P4', 1489, 92, 52, ink, 'Mono', '400', 'right');
  line(
    ctx,
    [
      [62, 118],
      [1504, 118],
    ],
    ink,
    3,
  );
  drawBlender(ctx, 222, 330);
  write(ctx, 'Broken blender', 66, 543, 48, ink, 'Serif');
  write(ctx, 'Day 12  /  30-day policy', 66, 597, 35, ink);
  line(
    ctx,
    [
      [552, 151],
      [552, 607],
    ],
    '#baaa8c',
    2,
  );
  write(ctx, 'Replacement requests', 598, 207, 42, ink);
  write(ctx, '“Please replace it under the', 598, 306, 54, stock.formal.lip, 'Serif');
  write(ctx, 'thirty-day policy.”', 618, 368, 54, stock.formal.lip, 'Serif');
  write(ctx, '“Can you replace it?”', 598, 483, 54, stock.conversational.lip, 'Serif');
  ctx.save();
  ctx.globalAlpha = formalScore;
  write(ctx, 'Score', 1485, 207, 42, ink, 'Sans', '400', 'right');
  write(ctx, blender.formal.toFixed(2), 1485, 365, 60, stock.formal.lip, 'Mono', '400', 'right');
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = casualScore;
  write(
    ctx,
    blender.conversational.toFixed(2),
    1485,
    481,
    60,
    stock.conversational.lip,
    'Mono',
    '400',
    'right',
  );
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = cutoff;
  line(
    ctx,
    [
      [598, 522],
      [1486, 522],
    ],
    '#baaa8c',
    2,
  );
  write(ctx, 'Automatic service from ' + THRESHOLD.toFixed(2), 598, 594, 43, ink);
  ctx.restore();
  ctx.restore();
}
function pencilLoop(ctx, x, y, p, reverse) {
  if (p <= 0) return;
  ctx.beginPath();
  for (let i = 0; i <= Math.ceil(100 * p); i++) {
    const t = Math.min(i / 100, p),
      a = (reverse ? -1.72 : 1.37) + t * 6.43;
    const px = x + Math.cos(a) * (91 + 3 * Math.sin(3 * a + 1));
    const py = y + Math.sin(a) * (211 + 2 * Math.cos(2 * a)) + Math.cos(a) * 6;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#322b38';
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#f2dec7';
  ctx.stroke();
}
function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const lamp = index === 0 ? 0.12 + 0.88 * ease((elapsed - 0.03) / 0.64) : 1;
  const verdict = index === 6 ? ease(reveal('These two pairs fail', 0.6)) : 0;
  table(ctx, lamp, verdict);
  let stack = 0;
  if (index === 4) stack = ease(reveal('Slide the blue strip', 1.7));
  if (index === 5) stack = 1 - ease(reveal('Separate the strips', 1.5));
  const swing = Math.sin(Math.PI * stack);
  const settle = index === 0 ? 1 - ease(elapsed / 1.54) : 0;
  const topY = 440;
  const blueY = 680 + (topY - 680) * stack + settle * 24;
  const counts = index >= 3;
  card(ctx, 'formal', topY, 0, 0, counts);
  card(
    ctx,
    'conversational',
    blueY,
    18 * swing + settle * 1170,
    0.018 * swing + settle * 0.045,
    counts,
    swing,
  );
  let slip = 0,
    formalScore = 0,
    casualScore = 0,
    cutoff = 0;
  if (index === 1) slip = ease(reveal('Take claim four', 0.95));
  if (index === 2) {
    slip = 1;
    formalScore = reveal('One version says');
    casualScore = reveal('The other asks');
    cutoff = reveal('At point seven');
  }
  if (index === 3) {
    slip = 1 - ease(reveal('Count the holes', 0.8));
    formalScore = casualScore = cutoff = 1;
  }
  if (slip > 0) claimSlip(ctx, slip, formalScore, casualScore, cutoff);
  if (index === 4 && stack > 0.99) {
    ctx.save();
    ctx.globalAlpha = ease(reveal('Four holes line up'));
    write(ctx, shared.length + ' shared holes', 1136, 698, 65, ink, 'Serif', '400', 'center');
    ctx.restore();
  }
  if (index >= 5) {
    for (const [i, claim] of ready.entries()) {
      if (!flips.includes(claim)) continue;
      const atFirst = claim.id === 'p1';
      const p = index === 6 ? 1 : ease(reveal(atFirst ? 'At claim one' : 'At claim six', 0.9));
      pencilLoop(ctx, xOf(i), (topY + blueY) / 2, p, !atFirst);
    }
  }
}
function check() {
  assert.equal(ready.length, 6);
  assert.equal(count('formal'), 5);
  assert.equal(count('conversational'), 5);
  assert.deepEqual(
    shared.map((c) => c.id),
    ['p2', 'p3', 'p4', 'p5'],
  );
  assert.deepEqual(
    flips.map((c) => [c.id, punched(c, 'formal'), punched(c, 'conversational')]),
    [
      ['p1', true, false],
      ['p6', false, true],
    ],
  );
  assert.deepEqual([blender.formal, blender.conversational, THRESHOLD], [0.77, 0.75, 0.7]);
}
export default { title: 'Five holes in each strip', beats, draw, check };
