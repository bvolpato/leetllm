import assert from 'node:assert/strict';

// The latency fixture in films/conformal supplies the differences. Here the
// numbers are minutes after eight on a fictional harbour tram's timetable.
const trips = [
  [35, 32],
  [70, 82],
  [50, 55],
  [30, 32],
  [65, 57],
  [40, 43],
  [55, 49],
  [45, 41],
  [60, 67],
].map(([due, arrival]) => ({ due, arrival, error: arrival - due, size: Math.abs(arrival - due) }));

const target = 0.8;
const due = 40;
const sails = 45;
const arrived = 48;
const bySize = [...trips].sort((a, b) => a.size - b.size);
const rank = Math.ceil((trips.length + 1) * target);
const radius = bySize[rank - 1].size;
const lower = due - radius;
const upper = due + radius;

const beats = [
  {
    id: 'the-connection',
    say: "The board's just flipped. The tram is due at eight forty. The ferry sails five minutes later. Would you count on making that connection?",
    hold: 1.2,
  },
  {
    id: 'station-log',
    say: "Open the tram log. This one was due at eight thirty-five. Look when it came in. Eight thirty-two. It's one of nine example trips we kept out of training. We opened their records after fixing the predictor.",
    hold: 0.8,
  },
  {
    id: 'turn-the-flaps',
    say: 'Three minutes early. For a window that reaches equally far both ways, we only need the size of the miss. Turn the flaps. Three minutes early and three minutes late now read the same.',
    hold: 0.9,
  },
  {
    id: 'line-up',
    say: 'Line up the errors, smallest first. Where could the next one go? Count the gaps, including both ends. Ten places. Suppose the trips are exchangeable. We could shuffle them without changing how their errors are distributed together. Then each rank is equally likely for the new trip, breaking ties at random.',
    hold: 0.8,
  },
  {
    id: 'the-eighth',
    say: 'We want eighty percent coverage. Eight tenths of ten gives us rank eight. Round up if you get a fraction. Those first eight places take us up to this flap. It reads eight minutes.',
    hold: 0.9,
  },
  {
    id: 'set-the-window',
    say: 'Give the tram eight minutes on either side of eight forty. See where the ferry falls? With fresh groups of ten exchangeable trips, this split conformal rule covers the new arrival at least eighty percent of the time.',
    hold: 1.1,
  },
  {
    id: 'cast-off',
    say: "Keep an eye on the mooring line. It's eight forty-five. Away she goes. Look at the track.",
    hold: 1.1,
  },
  {
    id: 'on-the-edge',
    say: 'Here comes the tram. Eight forty-eight. Right on the edge counts as covered. The ferry left three minutes ago.',
    hold: 3.0,
  },
];

const clamp = (t) => Math.max(0, Math.min(1, t));
const ease = (t) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const clockText = (minutes) =>
  8 + Math.floor(minutes / 60) + ':' + String(Math.floor(minutes % 60)).padStart(2, '0');
const TAU = 2 * Math.PI;
const ink = '#202d32';
const dark = '#1d353b';
const cream = '#f9e8bc';
const brass = '#edbc65';
const ferryRed = '#963d37';
const tramBlue = '#145e65';

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function rounded(c, x, y, w, h, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
function poly(c, pts, color) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(...pts[0]);
  for (const p of pts.slice(1)) c.lineTo(...p);
  c.closePath();
  c.fill();
}
function stroke(c, pts, color, width) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(...pts[0]);
  for (const p of pts.slice(1)) c.lineTo(...p);
  c.stroke();
}
function disc(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}
function label(c, str, x, y, size, color, align = 'left', family = 'Sans', weight = 500) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(str, x, y);
}
function gradient(c, y1, y2, stops) {
  const g = c.createLinearGradient(0, y1, 0, y2);
  stops.forEach(([t, color]) => g.addColorStop(t, color));
  return g;
}

function harbour(c, seconds) {
  rect(
    c,
    0,
    0,
    1920,
    1080,
    gradient(c, 0, 650, [
      [0, '#d1a48c'],
      [0.58, '#efd0a5'],
      [1, '#f4d5a2'],
    ]),
  );
  disc(c, 1690, 421, 144, '#f7dfa6');
  poly(
    c,
    [
      [0, 492],
      [180, 453],
      [248, 458],
      [355, 421],
      [530, 452],
      [719, 404],
      [925, 454],
      [1130, 413],
      [1280, 429],
      [1465, 397],
      [1660, 420],
      [1835, 403],
      [1920, 411],
      [1920, 612],
      [0, 612],
    ],
    '#c3a89a',
  );
  poly(
    c,
    [
      [0, 523],
      [220, 488],
      [420, 502],
      [599, 465],
      [792, 498],
      [983, 476],
      [1120, 503],
      [1335, 463],
      [1440, 477],
      [1630, 454],
      [1805, 489],
      [1920, 469],
      [1920, 610],
      [0, 610],
    ],
    '#a8948c',
  );
  for (let i = 0; i < 23; i++) {
    const x = i * 89 - 15,
      h = 15 + ((i * 31) % 48);
    rect(c, x, 565 - h, 81, h, '#8d8580');
    poly(
      c,
      [
        [x - 5, 565 - h],
        [x + 39, 550 - h],
        [x + 86, 565 - h],
      ],
      '#8d8580',
    );
  }
  for (const x of [292, 720, 1035, 1780]) {
    stroke(
      c,
      [
        [x, 555],
        [x, 442],
        [x + 91, 412],
        [x + 9, 456],
      ],
      '#98877c',
      5,
    );
    stroke(
      c,
      [
        [x + 86, 416],
        [x + 86, 471],
      ],
      '#98877c',
      2,
    );
  }
  rect(
    c,
    0,
    560,
    1920,
    280,
    gradient(c, 560, 840, [
      [0, '#92ac9c'],
      [0.55, '#608c85'],
      [1, '#527b76'],
    ]),
  );
  for (let i = 0; i < 91; i++) {
    const x = ((i * 461) % 2010) - 50 + 5 * Math.sin(seconds * 0.38 + i);
    const y = 568 + ((i * 37) % 226);
    stroke(
      c,
      [
        [x, y],
        [x + 12 + ((i * 17) % 76), y],
      ],
      i % 3 ? '#a6b7a2' : '#68968e',
      (i % 2) + 1.5,
    );
  }
}

function vessel(c, departure, release, seconds) {
  const x = 1280 + 458 * departure,
    y = 669 - 57 * departure;
  const s = 1 - 0.32 * departure;
  c.save();
  c.translate(x, y + Math.sin(seconds * 0.85) * 1.25);
  c.scale(s, s);
  if (departure > 0) {
    for (let j = 0; j < 4; j++) {
      const tail = Math.min(245, departure * 600);
      stroke(
        c,
        [
          [-238 - tail, -1 + j * 6],
          [-230 - tail * 0.5, 4 + j * 4],
          [-217, 4 + j * 2],
        ],
        '#d4d7b8',
        3,
      );
    }
  }
  // Timber hull, planked saloon, wheelhouse, stack and an open upper deck.
  poly(
    c,
    [
      [-235, -35],
      [135, -35],
      [248, -51],
      [202, -7],
      [171, 2],
      [-171, 4],
      [-221, -7],
    ],
    '#314349',
  );
  poly(
    c,
    [
      [-234, -34],
      [132, -34],
      [247, -51],
      [233, -37],
      [135, -25],
      [-227, -24],
    ],
    ferryRed,
  );
  poly(
    c,
    [
      [-175, -8],
      [174, -9],
      [194, -5],
      [172, 1],
      [-163, 3],
    ],
    '#bb6b4d',
  );
  poly(
    c,
    [
      [-183, -38],
      [-171, -76],
      [151, -76],
      [186, -42],
    ],
    '#f6d6a1',
  );
  for (let i = 0; i < 13; i++) rounded(c, -157 + i * 24, -69, 15, 19, 3, '#41575a');
  rect(c, -182, -80, 348, 6, '#5b5550');
  poly(
    c,
    [
      [25, -80],
      [28, -108],
      [99, -108],
      [112, -80],
    ],
    '#f8dfa7',
  );
  for (let i = 0; i < 4; i++) rect(c, 34 + i * 18, -103, 12, 15, '#43575a');
  rect(c, 22, -113, 82, 6, '#5a5650');
  poly(
    c,
    [
      [-87, -80],
      [-96, -137],
      [-62, -137],
      [-54, -80],
    ],
    ferryRed,
  );
  poly(
    c,
    [
      [-94, -126],
      [-97, -140],
      [-63, -140],
      [-60, -126],
    ],
    '#3c4847',
  );
  for (let i = 0; i < 7; i++)
    stroke(
      c,
      [
        [-158 + i * 25, -97],
        [-158 + i * 25, -80],
      ],
      '#675b52',
      2,
    );
  stroke(
    c,
    [
      [-159, -98],
      [-6, -98],
    ],
    '#675b52',
    3,
  );
  stroke(
    c,
    [
      [135, -76],
      [135, -150],
    ],
    '#5d5951',
    3,
  );
  poly(
    c,
    [
      [135, -150],
      [106, -144 + Math.sin(seconds) * 2],
      [135, -138],
    ],
    ferryRed,
  );
  c.restore();
  if (release < 1) {
    const sternX = x - 216 * s,
      sternY = y - 30 * s;
    const endX = mix(985, sternX, release),
      endY = mix(669, sternY, release);
    c.beginPath();
    c.moveTo(sternX, sternY);
    c.quadraticCurveTo(
      (sternX + endX) / 2,
      (sternY + endY) / 2 + 13 + 17 * Math.sin(release * Math.PI),
      endX,
      endY,
    );
    c.strokeStyle = '#523e32';
    c.lineWidth = 5;
    c.stroke();
  }
}

function pier(c) {
  for (const x of [923, 1008, 1091]) {
    poly(
      c,
      [
        [x, 677],
        [x + 17, 676],
        [x + 22, 744],
        [x + 3, 746],
      ],
      '#4c5149',
    );
    rect(c, x + 2, 705, 16, 8, '#86735b');
  }
  poly(
    c,
    [
      [855, 674],
      [1124, 674],
      [1124, 689],
      [855, 691],
    ],
    '#74624e',
  );
  rect(c, 855, 673, 268, 5, '#c29d74');
  rounded(c, 976, 661, 18, 16, 4, '#67483b');
  rounded(c, 972, 660, 26, 6, 3, '#493d34');
  // Low foreground track leaves a clear sightline from tram to ship.
  poly(
    c,
    [
      [0, 814],
      [1920, 814],
      [1920, 1080],
      [0, 1080],
    ],
    '#5d554c',
  );
  rect(c, 0, 819, 1920, 9, '#cda883');
  rect(c, 0, 828, 1920, 11, '#303c3e');
  rect(c, 0, 847, 1920, 6, '#b1a28c');
  for (let x = -90; x < 2030; x += 95) {
    poly(
      c,
      [
        [x, 852],
        [x + 39, 852],
        [x - 13, 889],
        [x - 58, 889],
      ],
      '#3f4140',
    );
  }
  rect(c, 0, 874, 1920, 8, '#c4b495');
  rect(c, 0, 884, 1920, 10, '#303b3c');
  poly(
    c,
    [
      [0, 906],
      [1920, 906],
      [1920, 1080],
      [0, 1080],
    ],
    '#393d3e',
  );
  rect(c, 0, 906, 1920, 10, '#857662');
  for (let x = 0; x < 1970; x += 145)
    stroke(
      c,
      [
        [x, 918],
        [x - 31, 1080],
      ],
      '#464747',
      3,
    );
}

function tram(c, travel, doors) {
  if (travel <= 0) return;
  c.save();
  c.translate(mix(-713, 325, travel), 831);
  for (const x of [109, 158, 485, 536]) {
    disc(c, x, -7, 23, '#26383c');
    disc(c, x, -7, 12, '#7d8074');
  }
  rounded(c, 30, -49, 590, 37, 14, '#243d41');
  rounded(c, 0, -168, 661, 137, 19, tramBlue);
  rounded(c, 3, -160, 655, 74, 15, '#efcc93');
  rect(c, 1, -101, 659, 17, '#efcc93');
  for (let i = 0; i < 7; i++) {
    rounded(c, 20 + i * 62, -147, 50, 47, 6, '#354e50');
    poly(
      c,
      [
        [24 + i * 62, -143],
        [54 + i * 62, -143],
        [30 + i * 62, -105],
        [24 + i * 62, -105],
      ],
      '#486568',
    );
  }
  rounded(c, 556, -149, 83, 51, 9, '#30484d');
  rounded(c, 475, -145, 68, 110, 3, '#233d40');
  const panelW = 32 * (1 - 0.76 * doors);
  for (const x of [477, 540 - panelW]) {
    rect(c, x, -142, panelW, 101, '#c4a275');
    rect(c, x + 2, -137, Math.max(2, panelW - 4), 43, '#354e50');
  }
  rect(c, 2, -76, 654, 4, '#d6b77f');
  rect(c, 8, -55, 459, 2, '#39777a');
  rounded(c, -3, -173, 666, 13, 6, '#354548');
  disc(c, 648, -73, 9, '#ffe1a1');
  stroke(
    c,
    [
      [268, -176],
      [309, -217],
      [358, -189],
      [331, -174],
    ],
    '#334246',
    5,
  );
  stroke(
    c,
    [
      [286, -218],
      [332, -218],
    ],
    '#334246',
    5,
  );
  c.restore();
}

function clock(c, minute) {
  const x = 1618,
    y = 248,
    r = 117;
  rect(c, x - 6, 0, 12, y - r, '#4c504a');
  disc(c, x + 4, y + 6, r + 5, '#937f6a');
  disc(c, x, y, r + 6, '#384648');
  disc(c, x, y, r, '#b3996e');
  disc(c, x, y, r - 6, '#eee2bc');
  for (let i = 0; i < 60; i++) {
    const a = (i / 60 - 0.25) * TAU,
      a1 = i % 5 === 0 ? 91 : 102;
    stroke(
      c,
      [
        [x + a1 * Math.cos(a), y + a1 * Math.sin(a)],
        [x + 108 * Math.cos(a), y + 108 * Math.sin(a)],
      ],
      '#54615a',
      i % 5 === 0 ? 5 : 2,
    );
  }
  for (const [n, dx, dy] of [
    ['12', 0, -73],
    ['3', 75, 0],
    ['6', 0, 73],
    ['9', -75, 0],
  ]) {
    label(c, n, x + dx, y + dy, 24, ink, 'center', 'Sans', 600);
  }
  const hand = (val, ratio, len, w, color) => {
    const a = (val / ratio - 0.25) * TAU;
    stroke(
      c,
      [
        [x - 9 * Math.cos(a), y - 9 * Math.sin(a)],
        [x + len * Math.cos(a), y + len * Math.sin(a)],
      ],
      color,
      w,
    );
  };
  hand(8 + minute / 60, 12, 57, 9, ink);
  hand(minute, 60, 87, 6, ferryRed);
  disc(c, x, y, 8, brass);
  rounded(c, x - 84, y + 106, 168, 55, 6, '#364648');
  label(c, clockText(minute), x, y + 132, 37, cream, 'center', 'Mono');
}

function casing(c, x, y, w, h) {
  c.save();
  c.translate(x, y);
  for (const hanger of [w * 0.15, w * 0.85]) {
    rect(c, hanger - 7, -y, 14, y + 5, '#48534f');
    rect(c, hanger - 7, -y, 3, y, '#8b8269');
  }
  rounded(c, 7, 10, w, h, 16, '#8e806c');
  rounded(c, 0, 0, w, h, 16, '#374a49');
  rounded(c, 4, 4, w - 8, h - 8, 13, '#a2916d');
  rounded(
    c,
    8,
    8,
    w - 16,
    h - 16,
    11,
    gradient(c, 0, h, [
      [0, '#283f41'],
      [1, '#172c31'],
    ]),
  );
  for (const sx of [20, w - 20])
    for (const sy of [21, h - 21]) {
      disc(c, sx, sy, 5, '#93876c');
      stroke(
        c,
        [
          [sx - 2, sy + 1],
          [sx + 2, sy - 1],
        ],
        '#464d47',
        1.3,
      );
    }
  c.restore();
}

// The digits live on two leaves of a mechanical indicator. Each half gets
// clipped separately so an outgoing leaf cannot print through the new one.
function flap(
  c,
  x,
  y,
  w,
  h,
  oldValue,
  newValue,
  turn,
  color = cream,
  size = h * 0.72,
  selected = false,
) {
  const t = clamp(turn);
  const panel = (word, top, scale = 1) => {
    if (scale < 0.005) return;
    c.save();
    c.translate(x, y + h * 0.5);
    c.scale(1, scale);
    c.beginPath();
    c.rect(0, top ? -h / 2 : 0, w, h / 2);
    c.clip();
    rounded(
      c,
      0,
      -h / 2,
      w,
      h,
      6,
      selected ? (top ? '#5c5138' : '#51462f') : top ? '#303e40' : '#273638',
    );
    label(c, word, w / 2, 2, size, color, 'center', 'Mono', 500);
    c.restore();
  };
  rounded(c, x - 3, y - 3, w + 6, h + 6, 8, '#111e21');
  panel(newValue, true);
  panel(oldValue, false);
  if (t <= 0.5) panel(oldValue, true, Math.cos(t * Math.PI));
  else panel(newValue, false, -Math.cos(t * Math.PI));
  stroke(
    c,
    [
      [x + 2, y + h / 2],
      [x + w - 2, y + h / 2],
    ],
    '#1b2829',
    2.6,
  );
}

function sign(c, turn) {
  casing(c, 125, 88, 1194, 336);
  label(c, 'Tram due', 188, 186, 66, cream, 'left', 'Serif');
  label(c, 'Ferry sails', 188, 330, 66, cream, 'left', 'Serif');
  rect(c, 186, 256, 1074, 2, '#5e6860');
  rect(c, 112, 154, 13, 62, tramBlue);
  rect(c, 112, 302, 13, 62, ferryRed);
  flap(c, 824, 128, 425, 114, '', clockText(due), turn, cream, 90);
  flap(c, 824, 273, 425, 114, clockText(sails), clockText(sails), 1, '#f0bd94', 90);
}

function board(c) {
  casing(c, 117, 83, 1686, 528);
}

function entry(c, clock) {
  board(c);
  const shown = trips[0];
  label(c, 'Tram log', 183, 171, 62, cream, 'left', 'Serif');
  label(c, 'One held-out trip', 1719, 173, 41, '#c6c5a7', 'right');
  rect(c, 184, 222, 1548, 2, '#6d7568');
  label(c, 'Due', 402, 287, 44, '#d3d4b7');
  label(c, 'Arrived', 1045, 287, 44, '#d3d4b7');
  // The forecast is visible while the actual is still on the turning leaf.
  flap(c, 397, 335, 485, 148, clockText(shown.due), clockText(shown.due), 1, cream, 109);
  flap(
    c,
    1041,
    335,
    485,
    148,
    '',
    clockText(shown.arrival),
    clock.reveal('Look when', 0.45),
    cream,
    109,
  );
  stroke(
    c,
    [
      [914, 410],
      [994, 410],
      [972, 391],
    ],
    brass,
    5,
  );
  stroke(
    c,
    [
      [994, 410],
      [972, 429],
    ],
    brass,
    5,
  );
}

// An odd-even transposition sort moves only adjacent plaques. Each swapping
// pair travels on opposite arcs, preserving the identity of equal errors.
function passes() {
  const list = trips.slice(),
    result = [list.slice()];
  for (let pass = 0; pass < trips.length; pass++) {
    for (let i = pass % 2; i + 1 < list.length; i += 2) {
      if (list[i].size > list[i + 1].size) [list[i], list[i + 1]] = [list[i + 1], list[i]];
    }
    result.push(list.slice());
  }
  return result;
}
const sortPasses = passes();
const slotX = (i) => 203 + i * 171;
function errors(c, clock) {
  const { index } = clock;
  const flip = index === 2 ? clock.reveal('Turn the flaps', 1.5) : 1;
  const order = index === 2 ? 0 : index === 3 ? clock.reveal('Line up', 3.8) : 1;
  const scan = index === 4 ? ease(clock.reveal('gives us rank eight', 1.25)) : 0;
  board(c);
  label(c, flip >= 1 ? 'Size of miss' : 'Arrival minus forecast', 185, 168, 59, cream, 'left', 'Serif');
  label(c, 'minutes', 1712, 171, 44, '#d7c9a3', 'right');
  rect(c, 184, 222, 1548, 2, '#6d7568');
  const pass = Math.min(sortPasses.length - 2, Math.floor(order * (sortPasses.length - 1)));
  const local = ease(order * (sortPasses.length - 1) - pass);
  const focus = clock.index === 4 && scan >= 0.999;
  for (const [i, trip] of trips.entries()) {
    const a = sortPasses[pass].indexOf(trip),
      b = sortPasses[pass + 1].indexOf(trip);
    const x = slotX(mix(a, b, local)),
      y = 317 + Math.sign(a - b) * Math.sin(local * Math.PI) * 68;
    const signed = (trip.error < 0 ? '−' : '+') + trip.size;
    const t = clamp(flip * 1.4 - i * 0.047);
    const picked = focus && bySize[rank - 1] === trip;
    flap(c, x, y, 143, 107, signed, String(trip.size), t, picked ? brass : cream, 72, picked);
  }
  if (index === 2) {
    const x = slotX(0) + 71;
    label(c, '8:32 arrival', x, 473, 32, '#e8ca93', 'center');
  }
  if (index >= 3 && order >= 1) {
    const pegs = index === 3 ? clock.reveal('Where could', 2.4) : 1;
    const n = trips.length + 1;
    for (let i = 0; i < n; i++) {
      const appear = clamp(pegs * n - i);
      if (appear <= 0) continue;
      const gap = slotX(i) - 14;
      const filled = index === 4 && i < Math.ceil(rank * scan);
      const color = filled ? brass : '#9aa999';
      stroke(
        c,
        [
          [gap, 421],
          [gap, 452],
        ],
        color,
        3,
      );
      disc(c, gap, 467, 14 * appear, color);
      if (!filled) disc(c, gap, 467, 7 * appear, '#1a3034');
    }
    if (pegs > 0) label(c, 'Places for the next error', 185, 543, 42, '#d2d2b9');
  }
  if (index === 4) {
    if (focus) {
      const px = slotX(rank - 1) + 71;
      poly(
        c,
        [
          [px, 306],
          [px - 14, 284],
          [px + 14, 284],
        ],
        brass,
      );
    }
    if (clock.reveal('gives us rank eight', 0.35) > 0) {
      label(
        c,
        trips.length + 1 + ' × ' + target.toFixed(2) + ' = ' + rank,
        1720,
        545,
        46,
        brass,
        'right',
        'Mono',
      );
    }
  }
}

const gaugeX = (m) => 240 + (m - 28) * 40;
function windowSign(c, r, atStop) {
  casing(c, 125, 88, 1194, 336);
  label(c, 'Tram window', 180, 148, 52, cream, 'left', 'Serif');
  if (r >= radius - 0.001) label(c, '±' + radius + ' min', 1249, 148, 42, brass, 'right', 'Mono');
  label(c, 'Due ' + clockText(due), gaugeX(due), 220, 38, cream, 'center');
  const y = 268;
  stroke(
    c,
    [
      [gaugeX(28), y],
      [gaugeX(52), y],
    ],
    '#728379',
    4,
  );
  for (let m = 28; m <= 52; m++) {
    const x = gaugeX(m);
    stroke(
      c,
      [
        [x, y + 5],
        [x, y + (m % 5 === 0 ? 20 : 11)],
      ],
      '#b1b6a0',
      m % 5 === 0 ? 4 : 2,
    );
  }
  const left = gaugeX(due - r),
    right = gaugeX(due + r);
  stroke(
    c,
    [
      [left, y],
      [right, y],
    ],
    brass,
    13,
  );
  for (const x of [left, right])
    stroke(
      c,
      [
        [x, y - 11],
        [x, y + 12],
      ],
      brass,
      6,
    );
  disc(c, gaugeX(due), y, 9, cream);
  if (r >= radius - 0.001) {
    label(c, clockText(lower), left, 220, 45, brass, 'center', 'Mono');
    label(
      c,
      (atStop ? 'Arrived ' : '') + clockText(upper),
      right,
      220,
      43,
      atStop ? cream : brass,
      'center',
      'Mono',
    );
  }
  const f = gaugeX(sails);
  poly(
    c,
    [
      [f, y + 16],
      [f - 11, y + 37],
      [f + 11, y + 37],
    ],
    '#efac8a',
  );
  label(c, 'Ferry sails ' + clockText(sails), f, 344, 37, '#f3bc9b', 'center');
  if (atStop) {
    disc(c, right, y, 11, cream);
  }
}

function draw(c, clockState) {
  const { index, elapsed, seconds } = clockState;
  let minute = due,
    travelled = 0,
    gone = 0,
    doors = 0,
    release = 0;
  if (index === 6) {
    minute = mix(due, sails, ease(elapsed / 1.85));
    release = ease((elapsed - 0.9) / 0.95);
    gone = 0.29 * ease((elapsed - 1.85) / 2.7);
  } else if (index === 7) {
    const t = ease(elapsed / 2.1);
    minute = mix(sails, arrived, t);
    release = 1;
    travelled = t;
    gone = mix(0.29, 1, ease(elapsed / 5));
    doors = ease((elapsed - 2.1) / 0.8);
  }
  c.save();
  if (index >= 1 && index <= 4) {
    c.translate(-182, 0);
    c.scale(1.22, 1.22);
  }
  harbour(c, seconds);
  vessel(c, gone, release, seconds);
  pier(c);
  tram(c, travelled, doors);
  c.restore();
  if (index === 0 || index >= 5) {
    clock(c, minute);
    if (index === 0) sign(c, ease(elapsed / 0.64));
    else
      windowSign(c, index === 5 ? radius * ease(elapsed / 1.4) : radius, index === 7 && travelled === 1);
  } else if (index === 1) {
    entry(c, clockState);
  } else {
    errors(c, clockState);
  }
}

function check() {
  assert.deepEqual(
    bySize.map((t) => t.size),
    [2, 3, 3, 4, 5, 6, 7, 8, 12],
  );
  assert.deepEqual(sortPasses.at(-1), bySize);
  assert.equal(rank, 8);
  assert.equal(radius, 8);
  assert.deepEqual([clockText(lower), clockText(upper)], ['8:32', '8:48']);
  assert.equal(trips.filter((t) => t.size <= radius).length, 8);
  assert.equal(arrived, upper);
  assert.ok(lower <= arrived && arrived <= upper);
  assert.equal(arrived - sails, 3);
  // Enumerate every choice of the future trip, including both tied errors.
  const ten = [...trips.map((t) => t.size), Math.abs(arrived - due)];
  const covered = ten.filter((score, i) => {
    const known = ten.filter((_, j) => j !== i).sort((a, b) => a - b);
    return score <= known[rank - 1];
  });
  assert.ok(covered.length / ten.length >= target);
  return true;
}

export default { title: 'The 8:45 Ferry', beats, draw, check };
