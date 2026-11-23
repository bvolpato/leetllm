import assert from 'node:assert/strict';

const title = 'Who picked the east entrance?';

const beats = [
  {
    id: 'shutter',
    say: "There goes the heron. We came to see that painting this afternoon. Read what's on the shutter. What could we still see here today?",
    hold: 1.5,
  },
  {
    id: 'fallback',
    say: "Two assistants get that whole notice. The first follows a rule we wrote for gallery closures. It looks up today's hours at the History Museum across town.",
    hold: 0.9,
  },
  {
    id: 'second-line',
    say: 'Leave that search there. The other assistant gives the same notice to a model. Follow the little arrow. Which hours would you ask about?',
    hold: 2.8,
  },
  {
    id: 'east',
    say: "The east entrance. In this run the model picks the next lookup. It asks when that entrance closes today. The application checks the request and sends it to the museum's hours service.",
    hold: 0.9,
  },
  {
    id: 'rule-edit',
    say: "Let's change the rule on the left. If the notice names an entrance to an open gallery, check that entrance's hours first. Give the workflow the same notice again.",
    hold: 1.3,
  },
  {
    id: 'same-question',
    say: "You'd see the same lookup in both logs now. On the left, you chose it when you wrote the rule. On the right, the model chose it when it read the notice.",
    hold: 3.0,
  },
];

const notice = {
  mainGallery: 'closed',
  otherGalleries: { status: 'open', entrance: 'East entrance' },
};
const hours = (place) => ({ tool: 'opening_hours', place, day: 'today' });

function workflow(report, entranceFirst) {
  const wing = report.otherGalleries;
  if (entranceFirst && wing.status === 'open' && wing.entrance) return hours(wing.entrance);
  if (report.mainGallery === 'closed') return hours('History Museum');
  return hours('Art Museum');
}

// This is the model's illustrative choice in the lesson's two-reader example.
const modelTurn = { observation: notice, proposal: hours('East entrance') };
const first = workflow(notice, false);
const revised = workflow(notice, true);
const labelFor = (request) => request.place + ' hours';

function check() {
  assert.strictEqual(modelTurn.observation, notice);
  assert.deepEqual(first, hours('History Museum'));
  assert.equal(modelTurn.proposal.place, notice.otherGalleries.entrance);
  assert.deepEqual(revised, modelTurn.proposal);
  const noOpenWing = { ...notice, otherGalleries: { status: 'closed', entrance: 'East entrance' } };
  assert.deepEqual(workflow(noOpenWing, true), first);
}

const ink = '#26264b';
const chalk = '#fff5d9';
const ochre = '#ffcd71';
const clamp = (v) => Math.max(0, Math.min(1, v));
function ease(t) {
  const v = clamp(t);
  return v * v * (3 - 2 * v);
}
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function poly(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
function line(ctx, x, y, ex, ey, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}
function oval(ctx, x, y, rx, ry, color, tilt = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, tilt, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}
function type(ctx, words, x, y, size, color, family = 'Sans', weight = 400) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(words, x, y);
}
function gradient(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

function bluePainting(ctx) {
  rect(ctx, 405, 391, 585, 291, '#a96f53');
  rect(ctx, 395, 380, 585, 291, '#f4c99b');
  rect(ctx, 400, 385, 575, 281, '#739cb5');
  oval(ctx, 821, 463, 51, 51, '#f8ab85');
  // The painted heron holds the eye until the bottom rail covers its wings.
  ctx.save();
  ctx.translate(400, 385);
  ctx.beginPath();
  ctx.moveTo(0, 213);
  ctx.bezierCurveTo(97, 185, 155, 255, 288, 212);
  ctx.bezierCurveTo(443, 165, 503, 205, 575, 168);
  ctx.lineTo(575, 281);
  ctx.lineTo(0, 281);
  ctx.closePath();
  ctx.fillStyle = '#345aa3';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(110, 175);
  ctx.bezierCurveTo(153, 175, 196, 146, 216, 134);
  ctx.bezierCurveTo(189, 93, 149, 83, 127, 37);
  ctx.bezierCurveTo(160, 67, 181, 60, 207, 75);
  ctx.bezierCurveTo(236, 87, 264, 107, 283, 136);
  ctx.bezierCurveTo(313, 140, 304, 103, 333, 99);
  ctx.bezierCurveTo(348, 96, 354, 106, 362, 108);
  ctx.lineTo(412, 116);
  ctx.lineTo(352, 117);
  ctx.bezierCurveTo(329, 119, 344, 161, 298, 174);
  ctx.bezierCurveTo(265, 184, 220, 169, 203, 174);
  ctx.lineTo(117, 198);
  ctx.lineTo(184, 169);
  ctx.closePath();
  ctx.fillStyle = '#1d346b';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(251, 161);
  ctx.bezierCurveTo(198, 149, 192, 123, 156, 116);
  ctx.bezierCurveTo(106, 105, 72, 87, 48, 62);
  ctx.bezierCurveTo(92, 84, 146, 68, 188, 87);
  ctx.bezierCurveTo(222, 98, 243, 121, 278, 147);
  ctx.closePath();
  ctx.fillStyle = '#ebe3c5';
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    line(ctx, 87 + i * 20, 80 + i * 3, 132 + i * 20, 101 + i * 7, '#9aacc0', 2);
  }
  oval(ctx, 346, 105, 2.5, 2.5, '#f1c177');
  ctx.restore();
  rect(ctx, 1007, 585, 39, 18, '#e0c4a5');
}

function eastGallery(ctx) {
  // The recessed opening stays lit after the main shutter comes down.
  rect(ctx, 1268, 350, 470, 408, '#653d45');
  poly(
    ctx,
    [
      [1268, 350],
      [1738, 350],
      [1693, 406],
      [1302, 406],
    ],
    '#b66b54',
  );
  rect(ctx, 1302, 406, 391, 270, '#ffce8d');
  poly(
    ctx,
    [
      [1302, 676],
      [1693, 676],
      [1738, 758],
      [1268, 758],
    ],
    '#efab72',
  );
  poly(
    ctx,
    [
      [1693, 406],
      [1738, 350],
      [1738, 758],
      [1693, 676],
    ],
    '#c0765c',
  );
  poly(
    ctx,
    [
      [1302, 406],
      [1693, 406],
      [1693, 452],
      [1302, 581],
    ],
    '#e7a46a',
  );
  // A freestanding pierced sculpture, its pedestal and cast shadow.
  poly(
    ctx,
    [
      [1402, 689],
      [1544, 689],
      [1638, 709],
      [1495, 709],
    ],
    '#c58265',
  );
  rect(ctx, 1418, 643, 136, 45, '#fff0c7');
  poly(
    ctx,
    [
      [1554, 643],
      [1580, 632],
      [1580, 678],
      [1554, 688],
    ],
    '#c99c73',
  );
  poly(
    ctx,
    [
      [1418, 643],
      [1443, 632],
      [1580, 632],
      [1554, 643],
    ],
    '#ffe1ad',
  );
  ctx.save();
  ctx.translate(1487, 554);
  ctx.rotate(-0.29);
  for (const [shift, color] of [
    [14, '#792f30'],
    [0, '#ca4633'],
  ]) {
    ctx.beginPath();
    ctx.ellipse(shift, 0, 71, 111, 0, 0, 2 * Math.PI);
    ctx.ellipse(shift + 11, -10, 32, 63, 0, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill('evenodd');
  }
  ctx.restore();
  poly(
    ctx,
    [
      [1268, 350],
      [1294, 350],
      [1294, 713],
      [1268, 758],
    ],
    '#573843',
  );
  line(ctx, 1727, 366, 1727, 736, '#eeb989', 5);
}

function shutter(ctx, amount, ruleRead, modelRead, edited) {
  const x = 123,
    y = 350,
    w = 1052,
    h = 408;
  const bottom = y + h * amount;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  rect(ctx, x, y, w, h, '#e0a980');
  poly(
    ctx,
    [
      [x, y],
      [x + w, y],
      [x + w, 420],
      [x + 92, 526],
      [x + 92, 687],
      [x, 758],
    ],
    '#c28169',
  );
  poly(
    ctx,
    [
      [x, 758],
      [215, 687],
      [1150, 687],
      [1175, 758],
    ],
    '#d59c7b',
  );
  bluePainting(ctx);
  rect(ctx, x, bottom + 6, w, 12, 'rgba(48,28,52,0.22)');
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, bottom - y);
  ctx.clip();
  const face = gradient(ctx, 0, y, 0, y + h, [
    [0, '#353555'],
    [0.27, '#453e64'],
    [1, '#50456e'],
  ]);
  rect(ctx, x, y, w, h, face);
  ctx.translate(0, bottom - (y + h));
  for (let slat = 0; slat <= h; slat += 25) {
    rect(ctx, x, y + slat, w, 2, '#373550');
    rect(ctx, x, y + slat + 3, w, 1, '#6a5d80');
  }
  type(ctx, 'Main gallery closed.', 188, 486, 79, chalk, 'Serif', 400);
  type(ctx, 'Other galleries open', 192, 599, 52, ochre);
  type(ctx, 'through the east entrance.', 192, 663, 52, ochre);
  line(ctx, 935, 642, 1025, 642, ochre, 6);
  poly(
    ctx,
    [
      [1029, 642],
      [1004, 626],
      [1004, 658],
    ],
    ochre,
  );
  const modelX = 192 + ctx.measureText('through the ').width;
  const targetWidth = ctx.measureText('east entrance').width;
  if (modelRead) line(ctx, modelX, 680, modelX + targetWidth * modelRead, 680, ochre, 6);
  if (ruleRead) {
    ctx.font = '79px "Lesson Serif"';
    const start = 188 + ctx.measureText('Main gallery ').width;
    const w = ctx.measureText('closed').width;
    const x = start + (modelX - start) * edited;
    const y = 502 + 191 * edited;
    const length = w + (targetWidth - w) * edited;
    line(ctx, x, y, x + length * ruleRead, y, '#9bdaff', 7);
  }
  rect(ctx, x, y + h - 12, w, 12, '#2c2c47');
  ctx.restore();
  ctx.restore();
}

// A shallow sawtooth roof, coral precast bays, and a sunken sculpture room.
function museum(ctx, amount, ruleRead, modelRead, edited) {
  const sky = gradient(ctx, 0, -210, 0, 530, [
    [0, '#80b3cb'],
    [1, '#dce2ce'],
  ]);
  rect(ctx, -280, -300, 2475, 1500, sky);
  rect(ctx, -180, 774, 2350, 520, '#efc59e');
  for (const x of [-830, -150, 530, 1210, 1890, 2570]) {
    line(ctx, 960 + (x - 960) * 0.46, 776, x, 1140, '#d3a686', 2);
  }
  for (const y of [830, 905, 1029]) line(ctx, -160, y, 2080, y, '#dbb28e', 2);

  for (const x of [-210, 202, 614, 1026, 1438, 1850]) {
    poly(
      ctx,
      [
        [x, 230],
        [x + 347, 111],
        [x + 347, 233],
      ],
      '#efd0af',
    );
    poly(
      ctx,
      [
        [x + 347, 111],
        [x + 394, 138],
        [x + 394, 234],
        [x + 347, 233],
      ],
      '#b2776c',
    );
    poly(
      ctx,
      [
        [x + 66, 218],
        [x + 323, 132],
        [x + 323, 216],
      ],
      '#adc3c3',
    );
    line(ctx, x + 200, 175, x + 200, 215, '#dec2a8', 6);
    line(ctx, x + 275, 150, x + 275, 215, '#dec2a8', 6);
    line(ctx, x + 4, 229, x + 347, 111, '#fff0cc', 4);
  }
  rect(
    ctx,
    -160,
    225,
    2320,
    551,
    gradient(ctx, 0, 225, 1920, 776, [
      [0, '#edaa88'],
      [0.63, '#e69e80'],
      [1, '#da8f76'],
    ]),
  );
  rect(ctx, -160, 222, 2320, 9, '#fbd4ad');
  rect(ctx, -160, 231, 2320, 7, '#c48470');
  for (const x of [-42, 400, 842, 1284, 1726]) line(ctx, x, 239, x, 775, '#cf8e76', 1.5);
  for (const y of [519, 710]) line(ctx, -160, y, 2080, y, '#d18f76', 2);
  type(ctx, 'Art Museum', 122, 321, 80, '#422d3f', 'Serif');
  type(ctx, 'East entrance', 1266, 316, 51, '#422d3f');
  eastGallery(ctx);
  shutter(ctx, amount, ruleRead, modelRead, edited);

  for (const [x, w] of [
    [119, 1061],
    [1264, 478],
  ]) {
    rect(ctx, x, 340, w, 10, '#a46054');
    rect(ctx, x, 339, w, 3, '#ffd1a2');
    poly(
      ctx,
      [
        [x + w, 350],
        [x + w + 14, 350],
        [x + w + 14, 758],
        [x + w, 773],
      ],
      '#d19379',
    );
  }
  rect(ctx, -180, 758, 2310, 16, '#f6c29a');
  rect(ctx, -180, 774, 2310, 6, '#b97c69');
  poly(
    ctx,
    [
      [-180, 780],
      [2075, 780],
      [2120, 799],
      [-180, 799],
    ],
    '#dfab8a',
  );
  rect(ctx, -180, 799, 2310, 5, '#c28d77');
  visitor(ctx);

  // Porous patches stay in the stone between the openings.
  for (let i = 0; i < 145; i++) {
    const x = ((i * 829 + 13) % 1951) - 16;
    const y = 244 + ((i * 73) % 505);
    if (y > 336 && ((x > 112 && x < 1188) || (x > 1260 && x < 1759))) continue;
    rect(ctx, x, y, 2 + (i % 5), 1, 'rgba(104,56,54,.15)');
  }
}

// A visitor stands at the jamb, giving both rooms the same human scale.
function visitor(ctx) {
  ctx.save();
  ctx.translate(1217, 785);
  poly(
    ctx,
    [
      [-19, -4],
      [23, -5],
      [100, 7],
      [41, 7],
    ],
    '#bd8a79',
  );
  poly(
    ctx,
    [
      [-18, -76],
      [1, -76],
      [-1, -9],
      [-17, -7],
    ],
    '#38425a',
  );
  poly(
    ctx,
    [
      [-2, -75],
      [13, -79],
      [21, -10],
      [9, -8],
    ],
    '#272e49',
  );
  poly(
    ctx,
    [
      [-18, -10],
      [-2, -11],
      [4, -4],
      [-20, -3],
    ],
    '#f2d7a9',
  );
  poly(
    ctx,
    [
      [9, -10],
      [23, -9],
      [31, -4],
      [8, -3],
    ],
    '#f2d7a9',
  );
  poly(
    ctx,
    [
      [-14, -139],
      [3, -146],
      [17, -131],
      [14, -107],
      [22, -68],
      [-24, -65],
      [-21, -103],
    ],
    '#386367',
  );
  poly(
    ctx,
    [
      [-8, -138],
      [7, -141],
      [20, -114],
      [27, -107],
      [24, -101],
      [9, -105],
    ],
    '#598386',
  );
  poly(
    ctx,
    [
      [-7, -153],
      [6, -157],
      [6, -141],
      [-3, -136],
      [-10, -143],
    ],
    '#a96852',
  );
  oval(ctx, -3, -161, 13, 17, '#a96852', -0.15);
  poly(
    ctx,
    [
      [9, -167],
      [15, -161],
      [8, -159],
    ],
    '#a96852',
  );
  oval(ctx, -8, -167, 14, 11, '#393144', -0.24);
  oval(ctx, -18, -157, 8, 8, '#393144');
  line(ctx, -10, -139, 12, -91, '#eac79d', 3);
  poly(
    ctx,
    [
      [3, -94],
      [23, -97],
      [29, -76],
      [8, -71],
    ],
    '#e7ba84',
  );
  ctx.restore();
}

function magnifier(ctx, x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.stroke();
  line(ctx, x + 10, y + 10, x + 25, y + 25, color, 5);
}

function query(ctx, x, source, text, reveal, color, traceColor) {
  rect(ctx, x, 778, 35, 7, traceColor);
  type(ctx, source, x + 52, 797, 43, color, 'Sans', 600);
  line(ctx, x, 820, x + 741, 820, '#b6a397', 2);
  magnifier(ctx, x + 16, 881, color);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 66, 833, 694 * reveal, 93);
  ctx.clip();
  type(ctx, text, x + 66, 901, 53, ink, 'Sans');
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed, speechDuration, beat } = clock;
  const openLog = index === 0 ? 0 : index === 1 ? ease(elapsed / 1.15) : 1;
  const closed = index === 0 ? 0.04 + 0.96 * ease(elapsed / 4) : 1;
  const ruleRead = index === 0 ? 0 : index === 1 ? ease(clock.reveal('a rule we wrote', 0.65)) : 1;
  const modelRead =
    index < 2 ? 0 : index === 2 ? ease(clock.reveal('Follow the little arrow', 0.85)) : 1;
  const edited = index < 4 ? 0 : index === 4 ? ease(clock.reveal('If the notice', 1.1)) : 1;
  ctx.save();
  ctx.translate(960, 530 + 74 - openLog * 201);
  const scale = 1.065 - 0.065 * openLog;
  ctx.scale(scale, scale);
  ctx.translate(-960, -530);
  museum(ctx, closed, ruleRead, modelRead, edited);
  ctx.restore();

  if (openLog === 0) return;
  ctx.save();
  ctx.translate(0, (1 - openLog) * 416);
  rect(ctx, 0, 724, 1920, 360, '#faf0de');
  rect(ctx, 0, 724, 1920, 4, '#b69077');
  line(ctx, 963, 761, 963, 934, '#cebbab', 2);
  const right =
    index < 2
      ? 0
      : index === 2
        ? ease((elapsed - speechDuration - Math.max(0, beat.hold - 1)) / 0.7)
        : 1;
  const rerun = index < 4 ? 0 : index === 4 ? ease(clock.reveal('Give the workflow', 1.15)) : 1;
  const left = rerun > 0 ? rerun : ruleRead * (1 - edited);
  const leftQuery = rerun > 0 ? revised : first;
  query(
    ctx,
    122,
    edited > 0.5 ? 'Workflow · entrance rule' : 'Workflow · closure rule',
    labelFor(leftQuery),
    left,
    '#274766',
    '#4988ae',
  );
  query(
    ctx,
    1045,
    'Agent · model choice',
    labelFor(modelTurn.proposal),
    right,
    '#674329',
    '#b77b2c',
  );
  ctx.restore();
}

export default { title, beats, draw, check };
