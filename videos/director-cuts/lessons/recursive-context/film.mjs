import assert from 'node:assert/strict';

const title = 'Recursive context: When does the moon go dark?';
const beats = [
  {
    id: 'blackout',
    say: 'Watch the moon. The rehearsal summary calls for a blackout. The stage lights have gone down, but the moon is still shining. When should it go dark?',
    hold: 1.0,
  },
  {
    id: 'find-moon',
    say: 'The lighting designer left a cue book. A recursive language model can keep the whole book outside its prompt. The parent model starts with our question and writes code to search the book for the word moon.',
    hold: 0.65,
  },
  {
    id: 'pass-the-line',
    say: 'Look at the two lines on page five. The parent sends a child model those lines, their page number, and one question. Which cue turns the moon off? The rest of the book stays here.',
    hold: 0.55,
  },
  {
    id: 'follow-eighteen',
    say: 'Cue eighteen. The child found a reference. We still need to know what happens at eighteen. The parent uses that answer to open the cue in the original book.',
    hold: 1.15,
  },
  {
    id: 'back-to-the-stage',
    say: 'There it is on page six. Wait until the red sail is offstage. Page five told us which light to watch. Page six gives us the moment to take it out. Let the boats cross.',
    hold: 1.7,
  },
  {
    id: 'the-wing',
    say: 'The white sail has disappeared. Its boat is clear and the moon is still lit. Watch the last little bit of red.',
    hold: 3.2,
  },
];

// Two passages in a fictional calling script carry the same dependency as the manual's condition and expiry.
const script = Object.freeze(
  [
    { page: 1, cue: 1, heading: 'Preset', lines: ['Hang the sky cloth.', 'Set the harbor flats.'] },
    {
      page: 2,
      cue: 4,
      heading: 'The harbor',
      lines: ['Open the traveler.', 'Bring up the harbor wash.'],
    },
    {
      page: 3,
      cue: 8,
      heading: 'The tide',
      lines: ['Bring the tide line in.', 'Stand by for the bell.'],
    },
    {
      page: 4,
      cue: 12,
      heading: 'Boat call',
      lines: ['Set the two boats.', 'Hold for the light change.'],
    },
    {
      page: 5,
      cue: 15,
      heading: 'Blackout',
      lines: ['Keep the moon lit.', 'Take it out on cue 18.'],
      margin: 'Deck crew standing by.',
    },
    {
      page: 6,
      cue: 18,
      heading: 'The crossing',
      lines: ['When the red sail is offstage,', 'fade the lamp out.'],
    },
    {
      page: 7,
      cue: 22,
      heading: 'Scene change',
      lines: ['Clear the water rows.', 'Fly the cloth out.'],
    },
    {
      page: 8,
      cue: 26,
      heading: 'Curtain',
      lines: ['Close the traveler.', 'Bring up the house lights.'],
    },
  ].map((page) => Object.freeze({ ...page, lines: Object.freeze(page.lines) })),
);

const revision = 3;
const pageRef = (page) => `p. ${page}  /  rev. ${revision}`;
const find = (word) =>
  script.filter((page) =>
    [page.heading, ...page.lines, page.margin ?? ''].join(' ').toLowerCase().includes(word),
  );
const readCue = (cue) => script.find((page) => page.cue === cue);

const [moonPage] = find('moon');
const childRequest = {
  question: 'Which cue turns the moon off?',
  source: pageRef(moonPage.page),
  passage: moonPage.lines.join('\n'),
};
// Replay a supplied child answer. The parent verifies its reference before following it.
const childReply = { cue: 18, source: childRequest.source };
const releasePage = readCue(childReply.cue);
const sailColor = releasePage.lines[0].match(/the (\w+) sail/)[1];

const clamp = (t) => Math.max(0, Math.min(1, t));
const ease = (t) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
const wing = 1640;
const sailLeft = -104;
const boatScale = { red: 1.07, white: 0.83 };

function sailOffstage(boats) {
  return boats[sailColor] + sailLeft * boatScale[sailColor] >= wing;
}

function check() {
  assert.equal(find('moon').length, 1);
  assert.equal(moonPage.page, 5);
  assert.equal(childRequest.source, pageRef(5));
  assert.equal(childRequest.passage.split('\n').length, 2);
  assert.ok(!childRequest.passage.includes(moonPage.margin));
  assert.equal(childReply.source, pageRef(moonPage.page));
  assert.equal(Number(childRequest.passage.match(/cue (\d+)/)[1]), childReply.cue);
  assert.equal(releasePage.page, 6);
  assert.equal(sailColor, 'red');
  assert.equal(sailOffstage({ white: 1900, red: wing }), false);
  const lastEdge = wing - sailLeft * boatScale.red;
  assert.equal(sailOffstage({ white: 1900, red: lastEdge - 1 }), false);
  assert.equal(sailOffstage({ white: 1900, red: lastEdge }), true);
  assert.ok(sailOffstage({ white: 1900, red: 1830 }));
}

function fill(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function gradient(ctx, x, y, u, v, stops) {
  const g = ctx.createLinearGradient(x, y, u, v);
  for (const [p, color] of stops) g.addColorStop(p, color);
  return g;
}
function path(ctx, color, trace, stroke, width = 1) {
  ctx.beginPath();
  trace(ctx);
  if (color) {
    ctx.fillStyle = color;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}
function polygon(ctx, points, color, stroke, width) {
  path(
    ctx,
    color,
    (p) => {
      p.moveTo(...points[0]);
      for (const pt of points.slice(1)) p.lineTo(...pt);
      p.closePath();
    },
    stroke,
    width,
  );
}
function line(ctx, x, y, u, v, color, width = 1) {
  path(
    ctx,
    null,
    (p) => {
      p.moveTo(x, y);
      p.lineTo(u, v);
    },
    color,
    width,
  );
}
function oval(ctx, x, y, rx, ry, color) {
  path(ctx, color, (p) => p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2));
}
function text(ctx, str, x, y, size, color, font = 'Sans', style = '') {
  ctx.font = `${style} ${size}px "Lesson ${font}"`.trim();
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function alpha(ctx, opacity, draw) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(opacity);
  draw();
  ctx.restore();
}

// The chamfered wooden case surrounds a working model theater. Its right leg masks both boats.
function seaRow(ctx, y, depth, color, rim, shift) {
  path(
    ctx,
    color,
    (p) => {
      p.moveTo(-125, y);
      for (let x = -125; x < 2040; x += 111) {
        const tip = y - 18 - 4 * Math.cos(x + shift);
        p.bezierCurveTo(x + 29, y + 12, x + 58, y - 7, x + 73, tip);
        p.bezierCurveTo(x + 69, y - 3, x + 93, y + 4, x + 111, y);
      }
      p.lineTo(2040, y + depth);
      p.lineTo(-125, y + depth);
      p.closePath();
    },
    rim,
    2,
  );
  for (let i = 0; i < 29; i++) {
    const x = (i * 193 + shift) % 1900;
    const v = y + 16 + ((i * 11) % 27);
    path(
      ctx,
      null,
      (p) => {
        p.moveTo(x, v);
        p.quadraticCurveTo(x + 13, v + 1, x + 31, v - 4);
      },
      rim,
      2,
    );
  }
}

function boat(ctx, x, y, color) {
  const red = color === 'red';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(boatScale[color], boatScale[color]);
  // The aft corner of the large sail is the final colored edge to clear the wing.
  const cloth = gradient(ctx, -100, -160, 74, -60, [
    [0, red ? '#d64830' : '#e3ccb1'],
    [0.5, red ? '#ff8157' : '#fff0cf'],
    [1, red ? '#bb392f' : '#cdbd9f'],
  ]);
  line(ctx, 11, -226, 11, -13, '#d2ab81', 7);
  polygon(
    ctx,
    [
      [10, -211],
      [sailLeft, -30],
      [8, -43],
    ],
    cloth,
  );
  polygon(
    ctx,
    [
      [20, -197],
      [25, -45],
      [100, -34],
    ],
    cloth,
  );
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    line(
      ctx,
      lerp(10, sailLeft, t),
      lerp(-211, -30, t),
      8,
      lerp(-211, -43, t),
      red ? '#a94c3fa8' : '#af9b86ab',
      2,
    );
  }
  line(ctx, -125, -17, 12, -221, '#e4c9a79e', 2);
  line(ctx, 11, -224, 115, -19, '#e4c9a79e', 2);
  polygon(
    ctx,
    [
      [-145, -25],
      [-63, -19],
      [44, -17],
      [141, -36],
      [113, 0],
      [70, 16],
      [-103, 13],
    ],
    red ? '#4c2936' : '#423440',
    '#cc9976',
    4,
  );
  line(ctx, -106, -6, 96, -7, red ? '#e87759' : '#c8beaa', 5);
  ctx.restore();
}

function moon(ctx, light) {
  const x = 1240,
    y = 326,
    r = 100;
  line(ctx, x, 68, x, y - r, '#a19daa70', 2);
  oval(ctx, x + 6, y + 6, r + 1, r + 1, '#1b2437');
  oval(ctx, x, y, r, r, '#3d4b62');
  alpha(ctx, light, () => {
    const glow = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 2.8);
    glow.addColorStop(0, '#ffdf9f52');
    glow.addColorStop(0.45, '#ffdb9120');
    glow.addColorStop(1, '#ffdb9100');
    fill(ctx, x - r * 2.8, y - r * 2.8, r * 5.6, r * 5.6, glow);
    oval(
      ctx,
      x,
      y,
      r,
      r,
      gradient(ctx, x - r, y - r, x + r, y + r, [
        [0, '#fff4ce'],
        [0.45, '#ffe3a2'],
        [1, '#e6b66d'],
      ]),
    );
    for (const [dx, dy, w, h] of [
      [-26, -32, 26, 17],
      [22, 15, 16, 22],
      [-14, 28, 13, 9],
      [47, -31, 11, 8],
      [-45, 48, 8, 6],
    ]) {
      oval(ctx, x + dx, y + dy, w, h, '#c7936030');
    }
  });
}

function forest(ctx) {
  const pts = [
    [-60, 655],
    [-60, 544],
  ];
  for (let i = 0; i <= 85; i++) {
    const x = i * 25;
    const y = 520 + 28 * Math.sin(i * 0.14) + 19 * Math.sin(i * 0.41);
    pts.push([x, y], [x + 8, y - 12 - ((i * 13) % 27)], [x + 16, y + 3]);
  }
  pts.push([2150, 654]);
  polygon(ctx, pts, '#35435b');
}
function drape(ctx, left) {
  ctx.save();
  if (left) {
    ctx.translate(1920, 0);
    ctx.scale(-1, 1);
  }
  path(ctx, '#48243c', (p) => {
    p.moveTo(1520, 78);
    p.lineTo(1900, 78);
    p.lineTo(1900, 900);
    p.lineTo(wing, 900);
    p.lineTo(wing, 447);
    p.bezierCurveTo(1640, 280, 1560, 172, 1520, 78);
    p.closePath();
  });
  for (let i = 0; i < 7; i++) {
    const x = wing + 11 + i * 30;
    path(
      ctx,
      null,
      (p) => {
        p.moveTo(x - 108 + i * 8, 84);
        p.bezierCurveTo(x + 3, 280, x + 9, 344, x, 480);
        p.lineTo(x, 884);
      },
      i % 2 ? '#8d4351' : '#682d46',
      12 + (i % 2) * 4,
    );
    line(ctx, x + 7, 475, x + 7, 880, '#b76a6552', 3);
  }
  ctx.restore();
}

function stage(ctx, state) {
  const { wash, light, boats, time } = state;
  ctx.save();
  fill(ctx, 16, 44, 1888, 922, '#38202f');
  fill(ctx, 46, 67, 1828, 864, '#925554');
  ctx.save();
  ctx.beginPath();
  ctx.rect(76, 91, 1768, 782);
  ctx.clip();
  fill(
    ctx,
    76,
    91,
    1768,
    782,
    gradient(ctx, 0, 100, 0, 758, [
      [0, '#192b4b'],
      [0.6, '#364665'],
      [1, '#726783'],
    ]),
  );
  alpha(ctx, wash, () =>
    fill(
      ctx,
      76,
      91,
      1768,
      782,
      gradient(ctx, 0, 100, 0, 791, [
        [0, '#98becb'],
        [0.62, '#eed4bc'],
        [1, '#cfaaa0'],
      ]),
    ),
  );
  // Dry brush marks across the painted cyclorama.
  for (let i = 0; i < 70; i++) {
    const x = (i * 317 + 23) % 1870,
      y = 130 + ((i * 73) % 414);
    line(ctx, x, y, x + 26 + ((i * 11) % 107), y - 2, '#a9a8b00f', 2 + (i % 3));
  }
  alpha(ctx, 1 - wash, () => {
    for (let i = 0; i < 30; i++) {
      const x = 230 + ((i * 281) % 1430),
        y = 147 + ((i * 79) % 322);
      oval(ctx, x, y, 1.5 + (i % 2), 1.5 + (i % 2), '#eaddc2ae');
    }
  });
  forest(ctx);
  alpha(ctx, wash * 0.33, () => {
    for (const x of [469, 1118]) {
      polygon(
        ctx,
        [
          [x, 90],
          [x + 76, 90],
          [x + 448, 755],
          [x - 270, 755],
        ],
        gradient(ctx, 0, 90, 0, 755, [
          [0, '#fff8d9'],
          [1, '#ffefd400'],
        ]),
      );
    }
  });
  moon(ctx, light);
  seaRow(ctx, 616, 288, '#456677', '#749093', 31);
  seaRow(ctx, 675, 221, '#34576c', '#708694', 67);
  const shimmer = (y, size, i) => {
    const x = 1240 + Math.sin(i * 1.8) * size * 0.33 + Math.sin(time * 0.9 + i) * 5;
    polygon(
      ctx,
      [
        [x - size, y],
        [x - 5, y - 3],
        [x + size, y],
        [x + size * 0.5, y + 3],
        [x - size * 0.8, y + 4],
      ],
      '#ffe2a3',
    );
  };
  alpha(ctx, light * 0.8, () => {
    for (let i = 0; i < 7; i++) shimmer(627 + i * 10, 23 + i * 6, i);
  });
  boat(ctx, boats.white, 714 + 2 * Math.sin(time * 0.8), 'white');
  seaRow(ctx, 724, 189, '#27475d', '#647b85', 19);
  alpha(ctx, light * 0.7, () => {
    for (let i = 0; i < 5; i++) shimmer(732 + i * 8, 52 + i * 5, 7 + i);
  });
  boat(ctx, boats.red, 783 + 2 * Math.sin(time * 0.75 + 1), 'red');
  seaRow(ctx, 796, 120, '#20394f', '#536a78', 8);
  alpha(ctx, light * 0.7, () => {
    for (let i = 0; i < 5; i++) shimmer(807 + i * 10, 67 + i * 4, 12 + i);
  });
  drape(ctx, false);
  drape(ctx, true);
  ctx.restore();
  // The front molding and the cut edges of the flats stay visible after the practical goes out.
  for (const [x, w] of [
    [27, 53],
    [1840, 53],
  ]) {
    fill(
      ctx,
      x,
      78,
      w,
      814,
      gradient(ctx, x, 0, x + w, 0, [
        [0, '#4b2f40'],
        [0.17, '#a56662'],
        [0.28, '#a76b62'],
        [0.37, '#69404d'],
        [1, '#533244'],
      ]),
    );
    line(ctx, x + 10, 86, x + 10, 880, '#d49c7b', 3);
  }
  fill(
    ctx,
    25,
    47,
    1870,
    51,
    gradient(ctx, 0, 47, 0, 98, [
      [0, '#c89375'],
      [0.16, '#995b56'],
      [0.68, '#7f444c'],
      [0.83, '#a9675a'],
      [1, '#492c3a'],
    ]),
  );
  fill(
    ctx,
    25,
    870,
    1870,
    79,
    gradient(ctx, 0, 870, 0, 949, [
      [0, '#c68e6d'],
      [0.1, '#825555'],
      [0.22, '#74464b'],
      [0.8, '#643a46'],
      [1, '#402838'],
    ]),
  );
  for (let i = 0; i < 9; i++) {
    const x = 120 + i * 210;
    line(ctx, x, 881, x - 22, 927, '#4d303c45', 2);
    line(ctx, x + 4, 883, x - 17, 925, '#d2977266', 1);
  }
  ctx.restore();
}

function book(ctx, page, focus, turn) {
  // Staggered edges preserve the thickness of the source when a single passage is copied.
  fill(ctx, 99, 276, 816, 580, '#17203768');
  fill(ctx, 85, 260, 819, 584, '#a05345');
  for (let i = 6; i >= 0; i--)
    fill(ctx, 91 + i * 2, 248 + i * 3, 796, 575, i % 2 ? '#c9b9a1' : '#f1e3c9');
  fill(
    ctx,
    91,
    248,
    796,
    575,
    gradient(ctx, 91, 0, 888, 0, [
      [0, '#cabcaa'],
      [0.05, '#e4d5bc'],
      [0.14, '#f5e9d4'],
      [0.8, '#f8eeda'],
      [1, '#eee0cb'],
    ]),
  );
  for (let i = 0; i < 6; i++) {
    const y = 288 + i * 96;
    oval(ctx, 121, y, 10, 8, '#5d5250');
    path(
      ctx,
      null,
      (p) => {
        p.moveTo(118, y + 4);
        p.bezierCurveTo(69, y + 15, 62, y - 17, 95, y - 19);
      },
      '#4e4650',
      8,
    );
    path(
      ctx,
      null,
      (p) => {
        p.moveTo(117, y + 2);
        p.bezierCurveTo(71, y + 12, 66, y - 17, 95, y - 18);
      },
      '#cabda6',
      2,
    );
  }
  text(ctx, 'External cue book', 169, 317, 38, '#665349', 'Serif', 'italic');
  text(ctx, pageRef(page.page), 529, 313, 35, '#604d4a', 'Mono');
  line(ctx, 168, 343, 842, 343, '#bfb29f', 2);
  text(ctx, page.heading, 170, 435, 69, '#352f36', 'Serif');
  text(ctx, `CUE ${page.cue}`, 171, 509, 31, '#92513e', 'Mono');
  const ink = '#312d35';
  for (let i = 0; i < page.lines.length; i++)
    text(ctx, page.lines[i], 170, 587 + i * 65, 49, ink, 'Serif');
  alpha(ctx, focus, () => {
    path(
      ctx,
      null,
      (p) => {
        p.moveTo(158, 542);
        p.bezierCurveTo(140, 543, 150, 566, 146, 577);
        p.quadraticCurveTo(140, 592, 135, 596);
        p.quadraticCurveTo(149, 601, 146, 629);
        p.quadraticCurveTo(142, 669, 158, 665);
      },
      '#ae553f',
      4,
    );
    const isRelease = page.page === releasePage.page;
    const row = isRelease ? 0 : 1;
    const before = isRelease ? 'When the ' : 'Take it out on ';
    ctx.font = '49px "Lesson Serif"';
    const y = 599 + 65 * row;
    const x = 170 + ctx.measureText(before).width;
    const end = 170 + ctx.measureText(page.lines[row].replace(/[.,]$/, '')).width;
    path(
      ctx,
      null,
      (p) => {
        p.moveTo(x, y);
        p.quadraticCurveTo((x + end) / 2, y - 5, end, y - 2);
      },
      '#ad513d',
      3.5,
    );
  });
  line(ctx, 171, 706, 842, 706, '#c3b5a3', 1.6);
  if (page.margin) text(ctx, page.margin, 171, 767, 34, '#7c7063', 'Serif', 'italic');
  if (turn > 0) {
    const w = 130 * Math.sin(Math.PI * turn);
    fill(
      ctx,
      887 - w,
      252,
      w,
      567,
      gradient(ctx, 887 - w, 0, 887, 0, [
        [0, '#d9cbb4b8'],
        [0.25, '#fff9e5'],
        [1, '#bdb19d'],
      ]),
    );
  }
}
function copy(ctx, t, fade) {
  if (t <= 0 || fade <= 0) return;
  ctx.save();
  ctx.globalAlpha *= fade * ease(t / 0.16);
  const slide = ease(t);
  const dx = lerp(170, 1045, slide),
    dy = lerp(587, 756, slide) - Math.sin(slide * Math.PI) * 98;
  const size = lerp(49, 48, slide);
  for (const [i, s] of childRequest.passage.split('\n').entries()) {
    text(ctx, s, dx, dy + 62 * i, size, '#fff1d3', 'Serif');
  }
  text(ctx, childRequest.source, dx, dy + 114, 35, '#f3c692', 'Mono');
  ctx.restore();
}

function stateAt(clock) {
  const { index, elapsed, seconds, reveal } = clock;
  const since = (n, phrase, duration) => (index < n ? 0 : index > n ? 1 : reveal(phrase, duration));
  const pull = ease(since(1, 'The lighting designer', 1.6));
  const push = ease(since(4, 'Page six gives us', 1.65));
  const scan = ease(since(1, 'writes code', 2.5));
  const open = ease(since(3, 'to open the cue', 1.45));
  const reply = ease(since(3, 'Cue eighteen', 0.52));
  const boat1 = ease(since(4, 'Let the boats cross', 2.65));
  const initialSail = ease(since(4, 'Let the boats cross', 1.6));
  const middleSail = ease(since(5, 'The white sail', 3.8));
  const lastSail = ease(since(5, 'Watch the last little bit of red', 2.75));
  const boats = {
    white: lerp(1035, 1960, boat1),
    red: 585 + 270 * initialSail + 565 * middleSail + 410 * lastSail,
  };
  // Tie the lamp fade to the last physical edge of the red sail at the wing.
  const spill = boats.red + sailLeft * boatScale.red - wing;
  const light = sailOffstage(boats) ? 1 - ease(spill / 66) : 1;
  const pagePosition = 1 + (moonPage.page - 1) * scan + (releasePage.page - moonPage.page) * open;
  const page = script[Math.round(pagePosition) - 1];
  return {
    time: seconds,
    wash: index === 0 ? 1 - ease((elapsed - 0.12) / 2.5) : 0,
    light,
    boats,
    desk: pull * (1 - push),
    scan,
    reply,
    open,
    page,
    turn: pagePosition % 1,
    copy: since(2, 'The parent sends', 1.35),
    task: ease(since(2, 'Look at the two lines', 0.62)),
    search: ease(since(1, 'writes code', 0.48)),
    query: ease(since(3, 'The parent uses', 0.46)),
  };
}

function draw(ctx, clock) {
  const s = stateAt(clock);
  fill(
    ctx,
    0,
    0,
    1920,
    1080,
    gradient(ctx, 0, 0, 1740, 1080, [
      [0, '#2d3949'],
      [0.52, '#494957'],
      [1, '#342f3b'],
    ]),
  );
  // Faint scribed lines in the worktop keep the camera move continuous.
  for (let i = 0; i < 18; i++) {
    const y = 12 + i * 71;
    line(ctx, 0, y, 1920, y - 46, '#e2c8b70b', 2);
  }
  const desk = s.desk;
  ctx.save();
  ctx.translate(-995 * (1 - desk), 0);
  text(ctx, 'Parent model', 99, 105, 34, '#f0d8c4');
  let action = 'When does the moon go dark?';
  if (s.search > 0.25) action = 'find("moon")';
  if (s.query > 0.25) action = `readCue(${childReply.cue})`;
  text(
    ctx,
    action,
    96,
    181,
    s.search > 0.25 ? 51 : 45,
    '#ffefd9',
    s.search > 0.25 ? 'Mono' : 'Serif',
  );
  book(
    ctx,
    s.page,
    s.page.page === moonPage.page || s.page.page === releasePage.page ? 1 : 0,
    s.turn,
  );
  ctx.restore();

  ctx.save();
  const zoom = lerp(1.045, 0.444, desk);
  ctx.translate(lerp(-43, 1002, desk), lerp(-8, 141, desk));
  ctx.scale(zoom, zoom);
  stage(ctx, s);
  ctx.restore();

  alpha(ctx, desk * s.task, () => {
    const childFade = 1 - s.open;
    alpha(ctx, childFade, () => {
      text(ctx, 'Child model', 1045, 638, 35, '#f0d8c4');
      line(ctx, 1045, 655, 1803, 655, '#ae97a1', 2);
      alpha(ctx, 1 - s.reply, () => {
        text(ctx, childRequest.question, 1045, 702, 37, '#f3e5d3');
        copy(ctx, s.copy, 1);
      });
      alpha(ctx, s.reply, () => {
        text(ctx, `Cue ${childReply.cue}`, 1043, 756, 75, '#ffe8ae', 'Serif');
        text(ctx, childReply.source, 1046, 817, 31, '#f3c692', 'Mono');
      });
    });
    alpha(ctx, s.open, () => {
      text(ctx, 'Parent’s answer', 1045, 638, 35, '#f0d8c4');
      line(ctx, 1045, 655, 1803, 655, '#ae97a1', 2);
      text(ctx, 'Keep the moon lit until', 1045, 729, 51, '#fff2df', 'Serif');
      text(ctx, 'the red sail is offstage.', 1045, 788, 51, '#fff2df', 'Serif');
      text(
        ctx,
        `pp. ${moonPage.page}–${releasePage.page}  /  rev. ${revision}`,
        1047,
        846,
        35,
        '#efc59b',
        'Mono',
      );
    });
  });
}

export default { title, beats, draw, check };
