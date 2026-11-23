import assert from 'node:assert/strict';
import { Path2D } from '@napi-rs/canvas';
import { buildCurrentSlate } from '../../../films/capstone-product-ranking-recommendation/model.mjs';

// The L17 portable-lamp exercise in the original film supplies these features and sellers.
const lamps = [
  { id: 'J1', shape: 'lantern', seller: 'B', match: 0.8, quality: 0.2 },
  { id: 'J2', shape: 'globe', seller: 'A', match: 0.7, quality: 0.9 },
  { id: 'J3', shape: 'mushroom', seller: 'A', match: 0.6, quality: 0.6 },
  { id: 'J5', shape: 'pleats', seller: 'A', match: 0.5, quality: 0.3 },
].map((lamp) => ({
  ...lamp,
  score: -0.1 * lamp.match + 1.2 * lamp.quality,
  stock: true,
  allowed: true,
}));
const sellerCap = 2;
const places = 3;
const proposed = buildCurrentSlate(lamps, places, sellerCap);
const reserve = lamps.find((lamp) => !proposed.includes(lamp));
const updated = lamps.map((lamp) => ({ ...lamp, stock: lamp.id !== 'J3' }));
const returned = buildCurrentSlate(updated, places, sellerCap);
const emptyIndex = proposed.findIndex((lamp) => !updated.find((now) => now.id === lamp.id).stock);

const beats = [
  {
    id: 'last-place',
    say: 'Watch the last spot in this search for portable lamps. The blue one gets it.',
    hold: 1.0,
  },
  {
    id: 'higher-score',
    say: 'The blue lamp scores point one six. Over on the shelf, the folded shade scores point three one. Why would the shop pass it over?',
    hold: 1.3,
  },
  {
    id: 'two-from-a-seller',
    say: 'The shop goes down the scores in order. It takes up to two lamps from each seller. The globe and the mushroom both come from seller A. So does the folded shade. The next lamp comes from B.',
    hold: 0.8,
  },
  {
    id: 'stock-recheck',
    say: 'Just before sending the list, the shop checks stock again. The mushroom has sold out. Look at the space it leaves. Which lamp would you put there now?',
    hold: 2.0,
  },
  {
    id: 'folded-shade',
    say: "Look back at the shelf. The globe keeps first place. Of the remaining lamps in stock, the folded shade scores highest. And now there's room for a second lamp from seller A.",
    hold: 0.8,
  },
  {
    id: 'returned-order',
    say: "From the shelf to second place, on the same score. Save this order with the search. It's the record of which lamps the shop returned.",
    hold: 2.5,
  },
];

const positions = [248, 726, 1197];
const shelf = 1687;
const floor = 665;
const ink = '#492c38';
const clamp = (t) => Math.max(0, Math.min(1, t));
const ease = (t) => {
  const a = clamp(t);
  return a * a * (3 - 2 * a);
};
const mix = (a, b, t) => a + (b - a) * t;

function ramp(c, x1, y1, x2, y2, stops) {
  const paint = c.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of stops) paint.addColorStop(at, color);
  return paint;
}
function glow(c, x, y, r, stops) {
  const paint = c.createRadialGradient(x, y, 0, x, y, r);
  for (const [at, color] of stops) paint.addColorStop(at, color);
  return paint;
}
function rect(c, x, y, w, h, fill) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}
function oval(c, x, y, rx, ry, fill) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}
const paths = new Map();
function path(d) {
  if (!paths.has(d)) paths.set(d, new Path2D(d));
  return paths.get(d);
}
function fill(c, d, paint) {
  c.fillStyle = paint;
  c.fill(path(d));
}
function stroke(c, d, paint, width) {
  c.strokeStyle = paint;
  c.lineWidth = width;
  c.stroke(path(d));
}
function type(c, text, x, y, font, color, align = 'left') {
  c.font = font;
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(text, x, y);
}

function opalGlobe(c) {
  // Opal glass on a fluted stone foot. The counterweight is visible under the glass.
  const stone = ramp(c, -66, 0, 66, 4, [
    [0, '#704d58'],
    [0.17, '#e5bcb0'],
    [0.53, '#c18f8c'],
    [0.93, '#966671'],
    [1, '#81545e'],
  ]);
  fill(c, 'M -69,-121 Q 0,-144 69,-121 L 69,-11 C 63,4 -62,6 -69,-11 Z', stone);
  for (let i = -6; i <= 6; i++) {
    const x = Math.sin(i / 4.4) * 65;
    const y = -11 + Math.sqrt(Math.max(0, 1 - (x / 69) ** 2)) * 10;
    rect(c, x, -117, 2.6, 117 + y, 'rgba(85,46,59,.28)');
    rect(c, x + 3, -117, 1.8, 117 + y, 'rgba(255,234,210,.38)');
  }
  oval(c, 0, -121, 69, 12, '#845b61');
  oval(c, 0, -124, 53, 8, '#b48779');
  const glass = c.createRadialGradient(-40, -270, 4, 5, -226, 124);
  for (const [t, color] of [
    [0, '#fffff5'],
    [0.5, '#fff8d2'],
    [0.79, '#f4e9c6'],
    [0.94, '#cfbeb1'],
    [1, '#a58e91'],
  ])
    glass.addColorStop(t, color);
  oval(c, 0, -231, 116, 115, glass);
  oval(c, -44, -282, 15, 7, 'rgba(255,255,252,.62)');
}

function mushroom(c, lit) {
  const shell = ramp(c, -57, 0, 59, 0, [
    [0, '#933b26'],
    [0.2, '#f57440'],
    [0.42, '#ff965f'],
    [0.67, '#e5693f'],
    [1, '#9f3f30'],
  ]);
  fill(
    c,
    'M -30,-159 C -26,-106 -32,-57 -69,-21 C -85,3 81,5 69,-21 C 34,-63 28,-111 29,-159 Z',
    shell,
  );
  oval(c, 0, -7, 67, 8, '#a24532');
  fill(
    c,
    'M -33,-121 C -12,-109 15,-109 33,-120 L 32,-104 Q -2,-90 -32,-105 Z',
    'rgba(100,33,30,.17)',
  );
  const inner = ramp(c, 0, -161, 0, -112, [
    [0, '#ad4f34'],
    [0.55, lit ? '#ffdd96' : '#b76c50'],
    [1, lit ? '#ffd27f' : '#b16b50'],
  ]);
  oval(c, 0, -154, 157, 25, inner);
  const cap =
    'M -158,-155 C -151,-208 -114,-285 -38,-300 C 47,-322 133,-262 159,-157 C 155,-138 63,-129 0,-129 C -72,-129 -148,-140 -158,-155 Z';
  const lacquer = c.createRadialGradient(-66, -259, 2, -14, -227, 175);
  for (const [t, color] of [
    [0, '#ffac77'],
    [0.38, '#fc8253'],
    [0.72, '#ec5c39'],
    [1, '#9f382e'],
  ])
    lacquer.addColorStop(t, color);
  fill(c, cap, lacquer);
  c.save();
  c.clip(path(cap));
  stroke(c, 'M -121,-204 Q -102,-250 -59,-266', 'rgba(255,203,159,.57)', 8);
  stroke(c, 'M 59,-294 Q 126,-241 128,-147', 'rgba(150,54,38,.17)', 13);
  if (!lit) rect(c, -165, -325, 330, 215, 'rgba(83,43,52,.32)');
  c.restore();
  stroke(c, 'M -157,-154 C -128,-124 122,-118 158,-156', '#8d392b', 4);
}

function blueLantern(c) {
  // An open carry handle makes the third silhouette readable even without color.
  c.lineCap = 'round';
  const handle = 'M -75,-153 L -75,-243 C -76,-345 77,-348 77,-243 L 77,-153';
  stroke(c, handle, '#293953', 29);
  stroke(
    c,
    handle,
    ramp(c, -90, 0, 90, 0, [
      [0, '#3d6296'],
      [0.25, '#7c9fc1'],
      [0.53, '#4c79a8'],
      [1, '#294361'],
    ]),
    20,
  );
  const enamel = ramp(c, -100, 0, 94, 0, [
    [0, '#344d6c'],
    [0.19, '#668cad'],
    [0.44, '#4a769b'],
    [0.79, '#355d82'],
    [1, '#273e61'],
  ]);
  fill(
    c,
    'M -86,-135 Q 0,-174 86,-135 L 78,-43 Q 1,-18 -78,-43 Z',
    ramp(c, -90, 0, 88, 0, [
      [0, '#cec7ac'],
      [0.21, '#fff5cb'],
      [0.55, '#fff6d7'],
      [1, '#cbbfa4'],
    ]),
  );
  for (let i = -7; i <= 7; i++) {
    const x = i * 10.1;
    c.beginPath();
    c.moveTo(x, -125);
    c.lineTo(x * 0.94, -49);
    c.strokeStyle = 'rgba(158,150,126,.28)';
    c.lineWidth = 2;
    c.stroke();
  }
  fill(
    c,
    'M -94,-146 Q -94,-163 0,-166 Q 93,-165 94,-146 L 94,-128 C 74,-106 -74,-110 -94,-128 Z',
    enamel,
  );
  oval(c, 0, -146, 94, 16, '#7c97af');
  oval(c, 0, -147, 67, 8, '#6585a2');
  fill(c, 'M -85,-51 Q 0,-32 85,-51 L 91,-18 C 91,5 -87,5 -91,-18 Z', enamel);
  stroke(c, 'M -89,-17 Q 0,7 89,-18', '#263f5b', 5);
}

function foldedShade(c) {
  const wood = ramp(c, -16, 0, 18, 0, [
    [0, '#714b38'],
    [0.3, '#c99261'],
    [0.6, '#cf9d68'],
    [1, '#79523b'],
  ]);
  fill(
    c,
    'M -79,-19 C -72,-33 -31,-38 -17,-52 L -13,-185 L 14,-185 L 17,-52 C 31,-38 71,-33 79,-19 L 79,-10 C 68,6 -69,6 -79,-10 Z',
    wood,
  );
  oval(c, 0, -10, 79, 10, '#986842');
  oval(c, -1, -15, 77, 9, '#bb895a');
  // Each fold has a bright and a shaded face. The fold pitch shrinks near the edges.
  const facets = 17;
  const point = (i, top) => {
    const angle = (Math.PI * i) / (2 * facets);
    const ridge = i % 2 === 0 ? 1 : 0.92;
    const radius = (top ? 59 : 147) * ridge;
    return [
      -Math.cos(angle) * radius,
      (top ? -310 : -141) + Math.sin(angle) * (top ? 7 : 22) + (top ? 0 : (1 - ridge) * -69),
    ];
  };
  for (let i = 0; i < 2 * facets; i++) {
    const a = point(i, true),
      b = point(i + 1, true);
    const d = point(i, false),
      e = point(i + 1, false);
    const bright = i % 2 === 0;
    const paper = ramp(c, 0, -310, 0, -117, [
      [0, bright ? '#fff7b5' : '#ead990'],
      [0.54, bright ? '#fff195' : '#d5b75e'],
      [1, bright ? '#fbe482' : '#b59c53'],
    ]);
    c.beginPath();
    c.moveTo(...a);
    c.lineTo(...b);
    c.lineTo(...e);
    c.lineTo(...d);
    c.closePath();
    c.fillStyle = paper;
    c.fill();
    c.lineWidth = 0.75;
    c.strokeStyle = paper;
    c.stroke();
  }
  oval(c, 0, -310, 58.5, 6.5, '#c9ac62');
  oval(c, 0, -311, 51, 4.7, '#8b7852');
}

function shadow(c, x, y, width, opacity) {
  c.save();
  c.translate(x, y);
  c.scale(1, 0.115);
  oval(
    c,
    0,
    0,
    width,
    width,
    glow(c, 0, 0, width, [
      [0, 'rgba(65,31,48,' + opacity + ')'],
      [0.44, 'rgba(86,43,55,' + opacity * 0.63 + ')'],
      [1, 'rgba(90,43,54,0)'],
    ]),
  );
  c.restore();
}

function room(c) {
  rect(
    c,
    -40,
    -60,
    2250,
    1230,
    ramp(c, 0, 0, 1230, 1120, [
      [0, '#fae9d6'],
      [0.51, '#ecd0bd'],
      [1, '#cd9c94'],
    ]),
  );
  // Daylight from a tall side window falls across the plaster and the display top.
  fill(c, 'M 832,-30 L 1080,-30 L 611,618 L 306,618 Z', 'rgba(255,248,224,.27)');
  fill(c, 'M 1111,-30 L 1357,-30 L 894,618 L 648,618 Z', 'rgba(255,246,220,.24)');
  rect(
    c,
    0,
    606,
    1465,
    127,
    ramp(c, 0, 606, 0, 733, [
      [0, '#e6bdaa'],
      [0.05, '#f3d7c1'],
      [1, '#fae2cf'],
    ]),
  );
  fill(c, 'M 325,607 L 614,607 L 693,733 L 358,733 Z', 'rgba(255,250,226,.37)');
  fill(c, 'M 649,607 L 897,607 L 1016,733 L 727,733 Z', 'rgba(255,246,223,.30)');
  rect(
    c,
    0,
    733,
    1465,
    258,
    ramp(c, 0, 733, 1440, 922, [
      [0, '#dec0ac'],
      [0.52, '#e8c9b6'],
      [1, '#caa293'],
    ]),
  );
  rect(c, 0, 733, 1465, 3, '#f7e3cc');
  rect(c, 0, 987, 1465, 15, '#b0877c');
  rect(c, 0, 1002, 1465, 78, '#9b766c');

  rect(
    c,
    1460,
    0,
    720,
    1080,
    ramp(c, 1460, 0, 1920, 15, [
      [0, '#a57177'],
      [0.03, '#c38d8e'],
      [0.17, '#cb9899'],
      [1, '#bb8588'],
    ]),
  );
  const alcove = 'M 1490,696 L 1490,381 C 1490,122 1886,122 1886,381 L 1886,696 Z';
  fill(
    c,
    alcove,
    ramp(c, 1490, 300, 1860, 654, [
      [0, '#684b5f'],
      [0.5, '#8e6679'],
      [1, '#a77d89'],
    ]),
  );
  stroke(c, alcove, '#b17e83', 5);
  fill(c, 'M 1490,668 L 1886,668 L 1910,710 L 1472,710 Z', '#ddaba6');
  rect(c, 1472, 710, 438, 20, '#ebc2b7');
  fill(c, 'M 1472,730 L 1910,730 L 1888,746 L 1492,746 Z', '#996b70');
  rect(c, 1460, 989, 460, 91, '#a9777b');
}

function label(c, lamp, x, y, emphasis, alpha = 1) {
  c.save();
  c.globalAlpha *= alpha;
  type(c, 'Score ' + lamp.score.toFixed(2), x, y, '46px "Lesson Sans"', ink);
  type(c, 'Seller ' + lamp.seller, x, y + 52, '600 43px "Lesson Sans"', ink);
  if (emphasis > 0) {
    c.globalAlpha *= emphasis;
    c.lineWidth = 5;
    c.strokeStyle = lamp.seller === 'A' ? '#963e38' : '#386283';
    c.beginPath();
    c.moveTo(x, y + 63);
    c.lineTo(x + 152 * emphasis, y + 63);
    c.stroke();
  }
  c.restore();
}

function light(c, x, y, scale, lit, lamp) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  if (lit > 0) {
    c.globalAlpha = lit;
    oval(
      c,
      0,
      -184,
      194,
      194,
      glow(c, 0, -184, 194, [
        [0, 'rgba(255,237,160,.48)'],
        [0.6, 'rgba(255,235,166,.19)'],
        [1, 'rgba(255,235,166,0)'],
      ]),
    );
    c.globalAlpha = 1;
  }
  switch (lamp.shape) {
    case 'globe':
      opalGlobe(c);
      break;
    case 'mushroom':
      mushroom(c, lit > 0.1);
      break;
    case 'lantern':
      blueLantern(c);
      break;
    case 'pleats':
      foldedShade(c);
      break;
  }
  c.restore();
}

function soldTag(c, x, y, progress) {
  if (!progress) return;
  c.save();
  c.translate(x, y);
  c.rotate(-0.14 + 0.28 * (1 - progress));
  c.scale(1, progress);
  stroke(c, 'M -105,12 Q -119,-47 -81,-73', '#663b37', 3);
  fill(c, 'M -128,0 L -103,-26 L 110,-26 L 110,32 L -103,32 Z', '#fff3dc');
  oval(c, -101, 3, 4.8, 4.8, '#70493f');
  type(c, 'Sold out', 4, 17, '600 42px "Lesson Sans"', '#873c35', 'center');
  c.restore();
}

function carry(c, x, y, release) {
  if (release >= 1) return;
  c.save();
  c.translate(x + release * 68, y - release * 400);
  c.rotate(-0.05 + release * 0.17);
  const skin = ramp(c, -45, -110, 106, -20, [
    [0, '#d59a71'],
    [0.47, '#be805e'],
    [1, '#975e4c'],
  ]);
  // The forefinger hooks behind the handle. The thumb closes over its front edge.
  fill(
    c,
    'M 65,-153 L 128,-105 C 106,-83 83,-74 72,-50 C 67,-36 56,-11 42,-3 C 29,5 17,-5 23,-17 L 39,-52 L 14,-32 L 4,-1 C 0,12 -13,13 -19,5 C -25,3 -31,-5 -29,-13 L -21,-57 C -18,-73 -7,-84 10,-95 L 43,-116 Z',
    skin,
  );
  stroke(c, 'M -17,3 Q -15,-25 -2,-46', '#a66d53', 2.7);
  fill(
    c,
    'M 59,-73 C 43,-67 24,-51 9,-39 L -14,-14 C -25,-1 -10,13 3,6 L 33,-13 Q 52,-22 61,-39 Z',
    '#c88a65',
  );
  fill(c, 'M -11,-10 L -4,-17 Q 3,-20 8,-13 L 4,-7 Q -6,3 -11,-3 Z', '#e3ae8d');
  fill(
    c,
    'M 30,-144 L 207,-450 L 380,-450 L 113,-82 Z',
    ramp(c, 31, -117, 125, -78, [
      [0, '#4f596a'],
      [0.43, '#657184'],
      [1, '#3e4b60'],
    ]),
  );
  stroke(c, 'M 35,-153 L 118,-91', '#88909a', 3);
  c.restore();
}

function draw(c, clock) {
  const { index, elapsed, reveal } = clock;
  const stock = index > 3 ? 1 : index === 3 ? ease(elapsed / 0.85) : 0;
  const remove = index > 3 ? 1 : index === 3 ? ease(reveal('Look at the space', 1.15)) : 0;
  const transfer = index > 4 ? 1 : index === 4 ? reveal('Look back at the shelf', 4.4) : 0;
  const onDisplay = transfer >= 0.5;
  const finish = index === 5 ? ease(reveal('Save this order', 2.0)) : 0;
  const arrive = index === 0 ? ease(elapsed / 1.75) : 1;
  const rule = index > 2 ? 1 : index === 2 ? ease(reveal('It takes up to two lamps', 0.65)) : 0;
  const upperPair = index === 2 ? reveal('The globe and the mushroom') : 0;
  const foldedMark = index === 2 ? reveal('So does the folded shade') : 0;
  const blueMark = index === 2 ? reveal('The next lamp') : 0;
  const emphasisAt = (i) => [upperPair, upperPair, blueMark][i];

  const dest = positions[returned.findIndex((lamp) => lamp.id === reserve.id)];
  const x = onDisplay ? dest : shelf;
  const y = onDisplay ? floor : 661;
  c.save();
  if (index === 1) {
    // A two-shot puts the competing scores next to their shades at reading size.
    c.scale(1.84, 1.84);
    c.translate(-877, -316);
  } else if (transfer > 0 && transfer < 1) {
    // Match cut on the folds at the same size and screen position in the two locations.
    const close = ease(onDisplay ? 2 * (1 - transfer) : 2 * transfer);
    const zoom = mix(1, onDisplay ? 2.65 * 0.9 : 2.65, close);
    c.translate(mix(x, 960, close) - x * zoom, mix(y, 860, close) - y * zoom);
    c.scale(zoom, zoom);
  } else {
    const zoom = 1 + 0.32 * finish;
    c.scale(zoom, zoom);
    c.translate(-6 * finish, -146 * finish);
  }
  room(c);
  if (index < 5) {
    type(c, index < 3 ? 'Proposed order' : 'Stock recheck', 92, 113, '600 36px "Lesson Sans"', ink);
    type(c, 'Portable lamps', 86, 220, '94px "Lesson Serif"', ink);
  }
  type(c, 'Reserve', shelf, 128, 'italic 63px "Lesson Serif"', '#4f3140', 'center');
  if (rule > 0) {
    c.save();
    c.globalAlpha = rule * (1 - finish);
    type(c, 'Up to ' + sellerCap + ' per seller', 1392, 111, '35px "Lesson Sans"', ink, 'right');
    c.restore();
  }

  const incoming = 1 - arrive;
  for (const [i, lamp] of proposed.entries()) {
    const x = positions[i],
      isRemoved = i === emptyIndex,
      isArriving = i === 2;
    if (index === 1 && !isArriving) continue;
    const lift = isArriving ? incoming * 135 : 0;
    const drop = isRemoved ? remove * 430 : 0;
    shadow(
      c,
      x + 42,
      floor - 2,
      183,
      0.38 * (isRemoved ? 1 - remove : 1) * (1 - (0.65 * lift) / 135),
    );
    if (!isRemoved || remove < 1) {
      c.save();
      if (isRemoved && remove > 0) {
        c.beginPath();
        c.rect(x - 200, 80, 400, floor - 76);
        c.clip();
      }
      light(
        c,
        x + (isArriving ? 115 * incoming : 0),
        floor - lift + drop,
        1,
        isRemoved ? 1 - stock : 1,
        lamp,
      );
      if (isRemoved) soldTag(c, x + 36, floor - 99 + drop, stock);
      c.restore();
    }
    type(c, String(i + 1), x - 172, 839, 'italic 97px "Lesson Serif"', '#805d56');
    const opacity = isRemoved ? 1 - remove : isArriving ? arrive : 1;
    label(c, lamp, x - 48, 790, emphasisAt(i), opacity);
  }

  shadow(c, x + 26, floor - 2, 160, 0.34);
  light(c, x, y, onDisplay ? 1 : 0.9, onDisplay ? 1 : 0.3, reserve);
  label(c, reserve, onDisplay ? dest - 48 : shelf - 109, 790, foldedMark);
  if (index === 0)
    carry(
      c,
      positions[2] + 115 * incoming,
      floor - 135 * incoming - 322,
      ease((elapsed - 1.8) / 0.85),
    );
  c.restore();
  if (index === 5) {
    type(c, 'Returned order  /  L17', 92, 113 - 30 * finish, '600 36px "Lesson Sans"', ink);
    type(c, 'Portable lamps', 86, 220 - 36 * finish, '94px "Lesson Serif"', ink);
  }
}

function check() {
  assert.deepEqual(
    lamps.map((lamp) => lamp.score.toFixed(2)),
    ['0.16', '1.01', '0.66', '0.31'],
  );
  assert.deepEqual(
    proposed.map((lamp) => lamp.id),
    ['J2', 'J3', 'J1'],
  );
  assert.equal(reserve.id, 'J5');
  assert(reserve.score > proposed[2].score);
  assert.equal(proposed.filter((lamp) => lamp.seller === reserve.seller).length, sellerCap);
  assert.equal(updated.filter((lamp) => !lamp.stock).length, 1);
  assert.equal(proposed[emptyIndex].id, 'J3');
  assert.deepEqual(
    returned.map((lamp) => lamp.id),
    ['J2', 'J5', 'J1'],
  );
  assert.equal(returned[1].score, reserve.score);
  assert(returned.every((lamp) => lamp.stock && lamp.allowed));
}

export default { title: 'The lamp that took second place', beats, draw, check };
