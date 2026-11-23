import assert from 'node:assert/strict';
import { fuse } from '../../../films/hybrid-search/model.mjs';

// These top-two returns are the supplied cookbook example in the original lesson.
const lanes = [
  { label: 'Word search', ink: '#f2ae3c', ids: ['Basics', 'Soup'] },
  { label: 'Vector search', ink: '#80d4cb', ids: ['Slow Bread', 'Basics'] },
];
const constant = 60;
const order = fuse(
  lanes.map((lane) => lane.ids),
  constant,
);
const books = [
  {
    id: 'Basics',
    cover: '#ae402f',
    print: '#fff0c6',
    motif: 'wheat',
    lines: ['Mix flour', 'and water.'],
  },
  {
    id: 'Slow Bread',
    cover: '#344776',
    print: '#f4d495',
    motif: 'moon',
    lines: ['Refrigerate the', 'dough overnight.'],
  },
  { id: 'Soup', cover: '#567059', print: '#f3e4bb', motif: 'onion' },
];
const context = (count) =>
  order.slice(0, count).map(({ id }) => books.find((book) => book.id === id));

const beats = [
  {
    id: 'after-mixing',
    say: 'There’s the dough. You asked for bread that rises overnight. This is the only passage your assistant can read. Where should that bowl go?',
    hold: 1.45,
  },
  {
    id: 'yellow-bookmarks',
    say: 'Come over to the cookbooks. A hybrid search ran that request two ways. Look where the yellow bookmarks land. For matching words, it’s Basics first and Soup second.',
    hold: 0.9,
  },
  {
    id: 'blue-bookmarks',
    say: 'Follow the blue bookmarks. The vector search compares the meaning of the request with each passage. Slow Bread comes first. Basics shows up here too.',
    hold: 1.1,
  },
  {
    id: 'two-bookmarks',
    say: 'Look at Basics. Two bookmarks in the same book. With reciprocal rank fusion, each one contributes a share. Here we add sixty to its rank and take the reciprocal. First place earns one over sixty-one. Second earns almost as much.',
    hold: 1.1,
  },
  {
    id: 'most-weight',
    say: 'Those two contributions put Basics first. Slow Bread takes second place with just the blue bookmark. Follow its passage back to the fridge.',
    hold: 0.6,
  },
  {
    id: 'one-passage',
    say: 'Basics has the only space on the door. Slow Bread made it to the counter. How much room would get its passage into the answer?',
    hold: 1.75,
  },
  {
    id: 'the-second-page',
    say: 'Keep the ranking as it is. Give the reader one more passage. Now read the blue page. Refrigerate the dough overnight.',
    hold: 1.5,
  },
  {
    id: 'until-morning',
    say: 'Now we know where the dough spends the night.',
    hold: 2.5,
  },
];

const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const ink = '#263649';
const paper = '#fff0cc';
function rect(c, x, y, w, h, fill) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}
function oval(c, x, y, rx, ry, fill, angle = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}
function panel(c, x, y, w, h, r, fill) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
}
function polygon(c, points, fill) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}
function stroke(c, points, color, width) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.stroke();
}
function lettering(c, str, x, y, size, color = ink, family = 'Sans', weight = 400, align = 'left') {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.fillStyle = color;
  c.fillText(str, x, y);
}
function wash(c, x, y, x2, y2, stops) {
  const g = c.createLinearGradient(x, y, x2, y2);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  return g;
}

function wheat(c, color) {
  for (const [x, tilt, scale] of [
    [-34, -0.32, 0.83],
    [0, 0, 1],
    [35, 0.35, 0.84],
  ]) {
    c.save();
    c.translate(x, 42);
    c.rotate(tilt);
    c.scale(scale, scale);
    stroke(
      c,
      [
        [0, 48],
        [0, -71],
      ],
      color,
      4,
    );
    for (let i = 0; i < 4; i++) {
      const y = -6 - i * 16;
      oval(c, -9, y, 6, 13, color, -0.66);
      oval(c, 9, y - 6, 6, 13, color, 0.66);
    }
    stroke(
      c,
      [
        [0, -72],
        [1, -93],
      ],
      color,
      2,
    );
    c.restore();
  }
}
function emblem(c, motif, x, y, size, color, ground) {
  c.save();
  c.translate(x, y);
  c.scale(size, size);
  if (motif === 'wheat') wheat(c, color);
  if (motif === 'moon') {
    oval(c, -20, -37, 33, 33, color);
    oval(c, -5, -51, 31, 31, ground);
    for (const [sx, sy] of [
      [37, -51],
      [57, -24],
      [-67, -54],
    ]) {
      polygon(
        c,
        [
          [sx, sy - 6],
          [sx + 2, sy - 2],
          [sx + 6, sy],
          [sx + 2, sy + 2],
          [sx, sy + 6],
          [sx - 2, sy + 2],
          [sx - 6, sy],
          [sx - 2, sy - 2],
        ],
        color,
      );
    }
    c.beginPath();
    c.moveTo(-75, 48);
    c.bezierCurveTo(-80, 4, 59, -22, 76, 31);
    c.bezierCurveTo(68, 63, -52, 79, -75, 48);
    c.fillStyle = color;
    c.fill();
    for (let i = 0; i < 4; i++) {
      const xx = -49 + i * 26,
        yy = 30 - 9 * Math.sin(i);
      stroke(
        c,
        [
          [xx, yy],
          [xx + 9, yy - 13],
          [xx + 17, yy - 17],
        ],
        ground,
        4,
      );
    }
  }
  if (motif === 'onion') {
    c.beginPath();
    c.moveTo(-5, -66);
    c.bezierCurveTo(12, -23, 57, -12, 55, 29);
    c.bezierCurveTo(50, 79, -54, 78, -57, 26);
    c.bezierCurveTo(-57, -9, -12, -23, -5, -66);
    c.fillStyle = color;
    c.fill();
    for (const dx of [-40, -21, 19, 39]) {
      c.beginPath();
      c.moveTo(-4, -33);
      c.bezierCurveTo(dx, -1, dx * 1.6, 40, dx * 0.45, 54);
      c.strokeStyle = ground;
      c.lineWidth = 3;
      c.stroke();
    }
  }
  c.restore();
}

function kitchen(c) {
  rect(c, -400, -100, 3850, 1210, '#cfd0bc');
  for (let row = -1; row < 6; row++) {
    for (let col = -2; col < 17; col++) {
      const x = col * 204,
        y = row * 150;
      const hue = ['#c5c9bc', '#cbcebf', '#c1c7be', '#c9cab9'][Math.abs(col * 3 + row * 7) % 4];
      panel(c, x + 2, y + 2, 200, 146, 6, hue);
      stroke(
        c,
        [
          [x + 8, y + 5],
          [x + 194, y + 5],
        ],
        '#dde0cf',
        3,
      );
    }
  }
  // The window stays above the bowl during the move from the fridge to the shelf.
  panel(c, 1230, -78, 625, 565, 10, '#65716e');
  rect(
    c,
    1252,
    -74,
    581,
    524,
    wash(c, 1260, 0, 1260, 451, [
      [0, '#233252'],
      [0.66, '#737494'],
      [1, '#c99a95'],
    ]),
  );
  oval(c, 1660, 98, 39, 39, '#f8d99d');
  oval(c, 1678, 84, 37, 37, '#414c69');
  const roofs = [
    [1253, 321],
    [1324, 321],
    [1324, 275],
    [1381, 251],
    [1431, 273],
    [1431, 349],
    [1480, 349],
    [1480, 293],
    [1528, 293],
    [1528, 262],
    [1559, 262],
    [1559, 323],
    [1644, 323],
    [1644, 268],
    [1693, 241],
    [1732, 264],
    [1732, 309],
    [1833, 309],
    [1833, 451],
    [1253, 451],
  ];
  polygon(c, roofs, '#45526c');
  for (const [x, y] of [
    [1340, 303],
    [1388, 295],
    [1500, 344],
    [1535, 302],
    [1670, 289],
    [1701, 310],
    [1783, 356],
  ])
    rect(c, x, y, 11, 19, '#d8b07b');
  rect(c, 1499, -20, 17, 472, '#82908a');
  rect(c, 1251, 202, 582, 17, '#84918b');
  rect(c, 1218, 451, 651, 18, '#e0d7bd');
  rect(c, 1218, 469, 651, 11, '#92998b');
  polygon(
    c,
    [
      [1230, 478],
      [1880, 478],
      [2010, 733],
      [1365, 733],
    ],
    'rgba(101,107,141,.10)',
  );
  rect(
    c,
    -400,
    764,
    3840,
    316,
    wash(c, 400, 764, 430, 1080, [
      [0, '#b7845a'],
      [0.17, '#c99264'],
      [0.6, '#b37b54'],
      [1, '#906248'],
    ]),
  );
  for (let j = 0; j < 20; j++) {
    const yy = 775 + ((j * j * 13) % 295),
      start = ((j * 211) % 700) - 450;
    c.beginPath();
    c.moveTo(start, yy);
    c.bezierCurveTo(start + 450, yy + 9, start + 1000, yy - 6, start + 1950, yy + 3);
    c.strokeStyle = j % 3 ? '#a67350' : '#ce9a70';
    c.lineWidth = (j % 3) + 1;
    c.stroke();
  }
  // A folded check tea towel anchors the bowl's starting position.
  c.save();
  c.transform(1, 0.04, -0.39, 0.63, 1343, 785);
  rect(c, 4, 9, 559, 173, '#8a684e');
  rect(c, 0, 0, 557, 166, '#eadab9');
  for (let s = 0; s < 557; s += 25) rect(c, s, 0, 8, 166, 'rgba(139,68,55,.43)');
  for (let s = 0; s < 166; s += 24) rect(c, 0, s, 557, 7, 'rgba(139,68,55,.43)');
  c.restore();
}

const bookX = [28, 440, 852];
function ribbon(c, x, y, lane, rank, amount, halves) {
  if (!amount) return;
  const length = 133 * ease(amount);
  c.save();
  c.beginPath();
  c.rect(x, y, 105, length);
  c.clip();
  c.translate(x, y + length - 133);
  polygon(
    c,
    [
      [0, 0],
      [101, 0],
      [101, 133],
      [50, 111],
      [0, 133],
    ],
    '#262e3555',
  );
  polygon(
    c,
    [
      [0, -3],
      [97, -3],
      [97, 125],
      [49, 104],
      [0, 125],
    ],
    lane.ink,
  );
  stroke(
    c,
    [
      [6, 3],
      [6, 109],
    ],
    '#ffffff66',
    2,
  );
  stroke(
    c,
    [
      [90, 3],
      [90, 109],
    ],
    '#2d40503d',
    2,
  );
  const rankText = halves > 0.5 ? '1/' + (constant + rank) : String(rank);
  lettering(
    c,
    rankText,
    49,
    73,
    halves > 0.5 ? 37 : 54,
    ink,
    halves > 0.5 ? 'Sans' : 'Serif',
    halves > 0.5 ? 600 : 400,
    'center',
  );
  c.restore();
}
function library(c, marks, fractions, combined) {
  const coversTop = 211,
    w = 349,
    h = 546;
  const bandX = [65, 550];
  for (const [i, lane] of lanes.entries()) {
    if (!marks[i]) continue;
    c.save();
    c.globalAlpha = ease(marks[i]);
    panel(c, bandX[i] - 23, 73, 437, 88, 7, '#f5eedb');
    polygon(
      c,
      [
        [bandX[i] + 2, 78],
        [bandX[i] + 41, 78],
        [bandX[i] + 41, 141],
        [bandX[i] + 22, 131],
        [bandX[i] + 2, 141],
      ],
      lane.ink,
    );
    lettering(c, lane.label, bandX[i] + 67, 134, 50, ink, 'Sans', 600);
    c.restore();
  }
  for (const [i, book] of books.entries()) {
    const x = bookX[i],
      y = coversTop;
    c.save();
    c.translate(x, y);
    polygon(
      c,
      [
        [9, 18],
        [w + 24, 12],
        [w + 32, h + 5],
        [7, h + 19],
      ],
      '#615c4c55',
    );
    panel(c, 0, 0, w + 8, h + 6, 6, book.cover);
    rect(c, 9, 4, w - 4, 11, '#e4d9bd');
    for (const d of [7, 11]) rect(c, 15, d, w - 18, 1, '#a89f8a');
    panel(c, 0, 14, w, h - 13, 4, book.cover);
    rect(c, 4, 16, 11, h - 18, '#ffffff1f');
    rect(c, 17, 18, 4, h - 22, '#202a3033');
    stroke(
      c,
      [
        [34, 33],
        [w - 17, 33],
        [w - 17, h - 18],
        [34, h - 18],
        [34, 33],
      ],
      '#fff5ce60',
      2,
    );
    for (let n = 0; n < 34; n++) {
      const py = 38 + ((n * 83) % (h - 71)),
        px = 42 + ((n * 79) % (w - 78));
      stroke(
        c,
        [
          [px, py],
          [px + 8, py - 1],
        ],
        '#f5e2bc1c',
        1.4,
      );
    }
    emblem(c, book.motif, 182, 258, 1.15, book.print, book.cover);
    lettering(
      c,
      book.id,
      181,
      416,
      book.id === 'Slow Bread' ? 55 : 75,
      book.print,
      'Serif',
      400,
      'center',
    );
    stroke(
      c,
      [
        [128, 450],
        [231, 450],
      ],
      book.print,
      2,
    );
    if (fractions > 0 && lanes.every((lane) => lane.ids.includes(book.id))) {
      c.save();
      c.globalAlpha = ease(fractions);
      lettering(c, '+', 166, 83, 39, book.print, 'Sans', 600, 'center');
      c.restore();
    }
    c.restore();
    for (const [j, lane] of lanes.entries()) {
      const rank = lane.ids.indexOf(book.id) + 1;
      if (rank)
        ribbon(
          c,
          x + 53 + j * 133,
          y + 9,
          lane,
          rank,
          clamp(marks[j] * 1.8 - (rank - 1) * 0.8),
          fractions,
        );
    }
  }
  rect(c, -42, 757, 1292, 35, '#6a4c36');
  rect(c, -42, 757, 1292, 9, '#d0ab73');
  if (combined > 0) {
    c.save();
    c.globalAlpha = ease(combined);
    books.forEach((book, i) => {
      const x = bookX[i] + 31,
        rank = order.findIndex((row) => row.id === book.id) + 1;
      panel(c, x, 790, 291, 74, 6, rank === 1 ? '#304440' : '#eaddc0');
      lettering(
        c,
        ['First', 'Second', 'Third'][rank - 1],
        x + 145,
        842,
        46,
        rank === 1 ? paper : ink,
        'Serif',
        400,
        'center',
      );
    });
    c.restore();
  }
}

function bowl(c, x, y, size, drop) {
  c.save();
  c.translate(x, y);
  c.scale(size, size);
  oval(c, 9, 0, 179, 15, '#41382c44');
  const blue = '#324e75',
    glaze = '#eee9ce';
  oval(c, 0, -166, 188, 51, '#a9ada1');
  oval(c, 0, -164, 170, 39, '#978c71');
  // The peel enters from the edge of the shot. Its tip releases the dough above the rim.
  if (drop < 0.94) {
    const retreat = ease((drop - 0.24) / 0.66);
    c.save();
    c.translate(-392 - 455 * retreat, -348 - 54 * retreat);
    c.rotate(0.03 + 0.19 * ease(drop / 0.3));
    c.beginPath();
    c.moveTo(-53, -16);
    c.lineTo(153, -17);
    c.bezierCurveTo(227, -18, 202, -42, 295, -41);
    c.bezierCurveTo(342, -42, 463, -30, 470, -16);
    c.bezierCurveTo(489, 4, 354, 19, 290, 21);
    c.bezierCurveTo(230, 23, 212, 14, 149, 10);
    c.lineTo(-53, 10);
    c.closePath();
    c.fillStyle = '#9b6848';
    c.fill();
    stroke(
      c,
      [
        [-50, -12],
        [144, -12],
        [208, -17],
        [268, -32],
        [353, -35],
      ],
      '#cf9b6a',
      4,
    );
    stroke(
      c,
      [
        [259, 10],
        [331, 12],
        [407, 3],
        [450, -6],
      ],
      '#e3bc89',
      3,
    );
    for (let i = 0; i < 28; i++) {
      const xx = 285 + ((i * 47) % 134),
        yy = -22 + ((i * 23) % 29);
      oval(c, xx, yy, 2 + (i % 3), 1.9, '#e6cba7');
    }
    c.restore();
  }
  // The dough falls behind the near lip and briefly flattens on landing.
  const settle = Math.sin(Math.PI * clamp((drop - 0.65) / 0.35));
  c.save();
  c.translate(-35 * (1 - ease(drop / 0.65)), -178 - 176 * (1 - ease((drop - 0.15) / 0.5)));
  c.scale(1 + 0.08 * settle, 1 - 0.1 * settle);
  c.beginPath();
  c.moveTo(-112, 25);
  c.bezierCurveTo(-142, -2, -88, -54, -53, -53);
  c.bezierCurveTo(-20, -87, 31, -72, 55, -57);
  c.bezierCurveTo(111, -53, 145, -8, 116, 23);
  c.bezierCurveTo(58, 60, -61, 58, -112, 25);
  c.fillStyle = wash(c, -45, -68, 25, 45, [
    [0, '#f6deab'],
    [0.52, '#e3bd82'],
    [1, '#bd8a55'],
  ]);
  c.fill();
  for (const [xx, yy] of [
    [-53, -34],
    [-20, -50],
    [36, -41],
    [-65, -9],
    [57, -20],
  ])
    stroke(
      c,
      [
        [xx, yy],
        [xx + 9, yy - 4],
        [xx + 16, yy - 3],
      ],
      '#ceaa79',
      2.5,
    );
  c.restore();
  c.beginPath();
  c.moveTo(-188, -164);
  c.bezierCurveTo(-188, -108, -145, -38, -66, -13);
  c.lineTo(-61, -1);
  c.quadraticCurveTo(0, 12, 61, -1);
  c.lineTo(66, -13);
  c.bezierCurveTo(146, -37, 182, -100, 188, -164);
  c.bezierCurveTo(115, -119, -116, -119, -188, -164);
  c.fillStyle = wash(c, -170, -73, 170, -58, [
    [0, '#a6afa9'],
    [0.25, glaze],
    [0.72, '#e3dfc7'],
    [1, '#b1b7ad'],
  ]);
  c.fill();
  c.beginPath();
  c.moveTo(-184, -154);
  c.bezierCurveTo(-102, -115, 107, -115, 184, -154);
  c.strokeStyle = blue;
  c.lineWidth = 10;
  c.stroke();
  for (let i = -2; i <= 2; i++) {
    c.save();
    c.translate(i * 53, -70 - 5 * i * i);
    c.rotate(i * 0.12);
    oval(c, 0, 0, 6, 6, blue);
    for (let j = 0; j < 5; j++) {
      c.save();
      c.rotate((j * 2 * Math.PI) / 5);
      oval(c, 0, -13, 4, 9, blue);
      c.restore();
    }
    c.restore();
  }
  oval(c, 0, -2, 58, 7, blue);
  c.restore();
}

const fridgeX = 1940,
  fridgeW = 970;
const clipX = 148,
  clipWidth = 746,
  firstY = 372,
  nextY = 605;
function clipping(c, book, x, y, scale = 1, angle = 0, unfold = 1) {
  const width = clipWidth,
    height = mix(120, 203, unfold);
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(scale, scale);
  const ground = book.id === 'Basics' ? '#fcf0ce' : '#dce9de';
  const print = book.id === 'Basics' ? '#873a2e' : '#2e4c6a';
  const edge = [
    [0, 0],
    [width, -4],
    [width - 3, height - 1],
  ];
  for (let i = width - 28; i > 0; i -= 21) edge.push([i, height + ((i * 7) % 9) - 3]);
  edge.push([0, height]);
  c.save();
  c.translate(5, 9);
  polygon(c, edge, '#49392339');
  c.restore();
  polygon(c, edge, ground);
  rect(c, 19, 14, 4, height - 34, print);
  c.save();
  c.globalAlpha = unfold;
  lettering(c, book.id, 45, 49, 34, print, 'Sans', 600);
  book.lines.forEach((line, i) => lettering(c, line, 43, 112 + 62 * i, 62, ink, 'Serif'));
  c.restore();
  if (unfold < 1) {
    c.save();
    c.globalAlpha = 1 - unfold;
    lettering(c, 'Slow Bread', 42, 92, 73, print, 'Serif');
    polygon(
      c,
      [
        [0, 0],
        [width, -4],
        [width - 5, 19],
        [0, 29],
      ],
      '#c3d7cf',
    );
    c.restore();
  }
  emblem(c, book.motif, width - 107, mix(66, 110, unfold), mix(0.59, 0.87, unfold), print, ground);
  c.restore();
}

function magnet(c, x, y, base) {
  oval(c, x + 5, y + 6, 22, 17, '#28312648');
  oval(c, x, y, 22, 18, base);
  oval(c, x - 4, y - 5, 9, 3, '#ffffff5e', -0.24);
}
function refrigerator(c, s) {
  const x = fridgeX,
    w = fridgeW;
  panel(c, x - 14, -43, w + 33, 1238, 88, '#58655f');
  panel(c, x, -35, w + 11, 1228, 73, '#d5cfac');
  panel(c, x + 25, 25, w - 48, 1000, 42, '#d4e5da');
  panel(
    c,
    x + 46,
    43,
    w - 90,
    961,
    36,
    wash(c, x + 42, 45, x + w - 50, 950, [
      [0, '#9cb6b5'],
      [0.2, '#d5e6df'],
      [0.65, '#b5cecc'],
      [1, '#849b9c'],
    ]),
  );
  // The bowl passes behind the door when it reaches the glass shelf.
  for (const yy of [345, 762, 934]) {
    polygon(
      c,
      [
        [x + 124, yy - 35],
        [x + w - 125, yy - 35],
        [x + w - 53, yy],
        [x + 50, yy],
      ],
      '#e1ede2',
    );
    rect(c, x + 50, yy, w - 102, 11, '#88aaab');
    rect(c, x + 51, yy, w - 104, 3, '#f5f5dd');
  }
  if (s.inside > 0.9) bowl(c, s.bowlX, s.bowlY, s.bowlScale, 1);
  c.save();
  c.translate(x + w, 0);
  c.transform(1 - s.open * 0.92, -s.open * 0.073, 0, 1, 0, 0);
  c.translate(-w, 0);
  panel(c, 0, -51, w, 1194, 67, '#5c695f');
  panel(
    c,
    5,
    -46,
    w - 16,
    1182,
    66,
    wash(c, 0, 80, w, 800, [
      [0, '#c58548'],
      [0.055, '#f5c479'],
      [0.23, '#f8cf88'],
      [0.8, '#e5af68'],
      [1, '#bd894f'],
    ]),
  );
  c.beginPath();
  c.moveTo(29, 940);
  c.lineTo(29, 66);
  c.quadraticCurveTo(29, 5, 92, 1);
  c.strokeStyle = '#ffe4a5';
  c.lineWidth = 7;
  c.stroke();
  rect(c, 16, 968, w - 30, 12, '#7c6c51');
  rect(c, 16, 980, w - 30, 5, '#e5ba7e');
  // The handle stays on the moving face of the door.
  for (const yy of [439, 655]) {
    panel(c, 49, yy, 63, 42, 16, '#6c6950');
    panel(c, 47, yy - 6, 61, 40, 15, '#bac4ac');
  }
  panel(
    c,
    44,
    445,
    47,
    222,
    19,
    wash(c, 44, 445, 89, 445, [
      [0, '#546761'],
      [0.35, '#f4ebc7'],
      [0.58, '#a9b8a8'],
      [1, '#64766b'],
    ]),
  );
  lettering(c, 'Search request', clipX, 89, 34, '#573f32', 'Sans', 600);
  lettering(c, 'Bread that rises', clipX - 3, 173, 80, '#382e32', 'Serif');
  lettering(c, 'overnight', clipX - 3, 254, 80, '#382e32', 'Serif');
  stroke(
    c,
    [
      [clipX, 279],
      [w - 73, 279],
    ],
    '#a87647',
    2.5,
  );
  const selected = context(s.attached ? 2 : 1);
  lettering(
    c,
    'Reader’s context   ·   ' +
      selected.length +
      (selected.length === 1 ? ' passage' : ' passages'),
    clipX,
    333,
    39,
    '#48382e',
    'Sans',
    600,
  );
  clipping(c, selected[0], clipX, firstY, 1, -0.012);
  magnet(c, clipX + clipWidth * 0.51, firstY + 4, '#a94735');
  if (s.attached) {
    clipping(c, selected[1], clipX, nextY, 1, 0.008);
    magnet(c, clipX + clipWidth * 0.53, nextY + 8, '#45667c');
  }
  c.restore();
}

function draw(c, clock) {
  // Each cue keeps its last value while the next beat runs.
  const { index, elapsed } = clock;
  const cue = (which, phrase, time = 0.8) =>
    index < which ? 0 : index > which ? 1 : clock.reveal(phrase, time);
  const visitShelf = ease(cue(1, 'Come over', 1.55));
  const follow = ease(cue(4, 'Follow its passage', 2.45));
  const leaveBook = ease(cue(4, 'Follow its passage', 2.15));
  const attach = ease(cue(6, 'Give the reader', 1.55));
  const doorIn = ease(cue(7, 'Now', 0.88));
  const tuck = ease(cue(7, 'where the dough', 1.65));
  const doorOut =
    index === 7 ? ease((elapsed - Math.max(3.7, clock.speechDuration + 0.48)) / 1.25) : 0;
  const s = {
    open: doorIn * (1 - doorOut),
    inside: tuck,
    bowlX: mix(1571, fridgeX + 391, tuck),
    bowlY: mix(810, 753, tuck) - 90 * Math.sin(Math.PI * tuck),
    bowlScale: mix(1, 0.88, tuck),
    attached: attach === 1,
  };
  const camera = mix(mix(1209, -145, visitShelf), 1209, follow);
  const close = ease(cue(3, 'Look at Basics', 1.5)) * (1 - follow);
  const zoom = 1 + 0.175 * close;
  c.save();
  c.translate(710 * (1 - zoom), 379 * (1 - zoom));
  c.scale(zoom, zoom);
  c.translate(-camera, 0);
  kitchen(c);
  library(
    c,
    [cue(1, 'Look where', 1.2), cue(2, 'Follow the blue bookmarks', 1.3)],
    cue(3, 'Here we add sixty', 0.5),
    cue(4, 'Those two contributions', 0.8),
  );
  refrigerator(c, s);
  if (s.inside <= 0.9)
    bowl(c, s.bowlX, s.bowlY, s.bowlScale, index === 0 ? clamp(elapsed / 1.87) : 1);

  // The second clipping waits on the worktop, outside the reader's context.
  if (leaveBook > 0 && attach < 1) {
    const second = context(2)[1];
    const deskX = 1510,
      deskY = 838;
    const x = mix(mix(bookX[1] + 92, deskX, leaveBook), fridgeX + clipX, attach);
    const y =
      mix(mix(386, deskY, leaveBook) - 232 * Math.sin(Math.PI * leaveBook), nextY, attach) -
      113 * Math.sin(Math.PI * attach);
    const size = mix(mix(0.09, 0.49, leaveBook), 1, attach);
    const angle = mix(-0.075, 0.008, attach) + 0.13 * Math.sin(Math.PI * leaveBook);
    clipping(c, second, x, y, size, angle, ease((attach - 0.36) / 0.64));
  }
  c.restore();
}

function check() {
  assert.deepEqual(
    order.map((row) => row.id),
    ['Basics', 'Slow Bread', 'Soup'],
  );
  assert.deepEqual(
    order.map((row) => row.score.toFixed(5)),
    ['0.03252', '0.01639', '0.01613'],
  );
  assert.equal(order[0].score, 1 / 61 + 1 / 62);
  assert.equal(lanes[1].ids[0], 'Slow Bread');
  assert.deepEqual(
    context(1).map((book) => book.lines.join(' ')),
    ['Mix flour and water.'],
  );
  assert.deepEqual(
    context(2).map((book) => book.lines.join(' ')),
    ['Mix flour and water.', 'Refrigerate the dough overnight.'],
  );
}

export default { title: 'Hybrid Search · The Overnight Recipe', beats, draw, check };
