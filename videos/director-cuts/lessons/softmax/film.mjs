import assert from 'node:assert/strict';
import { Path2D } from '@napi-rs/canvas';

const beats = [
  {
    id: 'spin',
    say: 'Flick the paper arrow. When it stops, read the word on the piece where it lands.',
    hold: 1.1,
  },
  {
    id: 'read',
    say: 'The dog ran. On this wheel, a spin can stop anywhere with equal chance. Look how much of the turn belongs to ran.',
    hold: 0.55,
  },
  {
    id: 'weights',
    say: 'Where did those pieces come from? Our little model gives each word a score, called a logit. Softmax raises e to each score to get a weight. Even ate, with a score of zero, gets a weight of one.',
    hold: 0.9,
  },
  {
    id: 'share',
    say: 'Follow the purple piece. Take the weight for slept and divide by the total weight of all three words. That gives slept about eleven percent of the circle.',
    hold: 1.1,
  },
  {
    id: 'hold-the-arrow',
    say: 'Leave the arrow where it landed. Suppose we raise just one score. If slept goes from one to two, which word will the arrow point to?',
    hold: 1.7,
  },
  {
    id: 'crossing',
    say: 'Watch that purple edge. It just slipped past the tip. Read the page again.',
    hold: 1,
  },
  {
    id: 'same-spin',
    say: 'The dog slept. Ran and ate kept their weights, but now each weight is divided by a larger total. Ran still has the biggest piece. The same spin now gives us slept.',
    hold: 3,
  },
];

const words = ['ran', 'slept', 'ate'];
const ink = '#27273a';
const paper = '#fff0cf';
const inks = ['#e8804e', '#a99bdf', '#e8c454'];
const deep = ['#994621', '#594396', '#795519'];
const tau = 2 * Math.PI;
const drawFraction = 0.8;
// The pointer lies horizontally at the held draw. Boundaries advance clockwise.
const origin = (1 - drawFraction) * tau;
function distribution(raise) {
  const scores = [3, 1 + raise, 0];
  const weights = scores.map(Math.exp);
  const total = weights.reduce((a, b) => a + b, 0);
  const shares = weights.map((weight) => weight / total);
  return { scores, weights, total, shares };
}
function choice(shares, position) {
  let edge = 0;
  for (let i = 0; i < shares.length; i++) {
    edge += shares[i];
    if (position < edge) return i;
  }
  return shares.length - 1;
}
const clamp = (x) => Math.max(0, Math.min(1, x));
function ease(x) {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
}
function cue(clock, beat, phrase, duration) {
  if (clock.beat.id === beat) return ease(clock.reveal(phrase, duration));
  return Number(clock.index > beats.findIndex((b) => b.id === beat));
}

const plates = new Map();
function plate(c, d, color, stroke, width = 3) {
  if (!plates.has(d)) plates.set(d, new Path2D(d));
  const path = plates.get(d);
  if (color) {
    c.fillStyle = color;
    c.fill(path);
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.stroke(path);
  }
}
function oval(c, x, y, rx, ry, color, angle = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, 0, tau);
  c.fill();
}
function type(c, value, x, y, size, color = ink, options = {}) {
  c.save();
  c.fillStyle = color;
  c.font =
    (options.style || 'normal') + ' ' + size + 'px "Lesson ' + (options.face || 'Serif') + '"';
  c.textAlign = options.align || 'left';
  c.textBaseline = 'alphabetic';
  c.fillText(String(value), x, y);
  c.restore();
}

// Uneven deckle, nested leaves and a cloth hinge give the spread a physical edge.
const cover =
  'M38 73 Q461 30 925 71 Q1391 26 1883 65 L1890 976 Q1420 947 931 993 Q503 948 35 981 Z';
const leaf = 'M57 60 Q457 30 927 76 Q1400 31 1861 53 L1865 930 Q1397 907 930 955 Q448 910 54 942 Z';
function book(c) {
  c.fillStyle = '#bd6d61';
  c.fillRect(0, 0, 1920, 1080);
  c.strokeStyle = '#af635b';
  c.lineWidth = 2;
  c.beginPath();
  for (let y = 0; y < 1080; y += 12) {
    c.moveTo(0, y);
    c.lineTo(1920, y + 45);
  }
  c.stroke();
  c.save();
  c.translate(4, 19);
  plate(c, cover, '#9c594e');
  c.restore();
  plate(c, cover, '#504259');
  for (const [offset, color] of [
    [19, '#d7bb96'],
    [13, '#ecd2aa'],
    [7, '#e0c49b'],
    [0, paper],
  ]) {
    c.save();
    c.translate(0, offset);
    plate(c, leaf, color);
    c.restore();
  }
  const shadow = c.createLinearGradient(857, 0, 1003, 0);
  for (const [stop, value] of [
    [0, '#b19b7000'],
    [0.43, '#ab84582d'],
    [0.48, '#a680526d'],
    [0.51, '#fff9df94'],
    [1, '#dabd8700'],
  ]) {
    shadow.addColorStop(stop, value);
  }
  plate(c, 'M854 68 Q925 81 1004 68 L1004 947 Q928 961 854 946 Z', shadow);
}

// Fixed cut-paper landscape. Both drawings use the same tree, hill, and flower.
const sky =
  'M-12 232 C4 136 96 79 161 70 C257 19 336 52 420 35 C502 16 595 58 635 112 C694 154 714 214 722 249 Q378 283 -12 260 Z';
function meadow(c, sleep) {
  plate(c, sky, '#b9d5c5');
  oval(c, 529, 112, 53, 53, '#f4bf70');
  plate(
    c,
    'M-14 241 Q112 179 215 215 Q362 252 471 203 Q579 145 717 226 L727 257 Q422 281 -17 262 Z',
    '#80aaa1',
  );
  plate(
    c,
    'M-28 249 Q98 192 246 240 Q366 264 463 231 Q603 184 743 241 Q673 289 554 289 Q418 305 236 292 Q73 289 -28 249 Z',
    '#73937c',
  );
  plate(
    c,
    'M55 246 Q66 181 52 132 L43 105 L51 101 Q65 122 74 154 Q77 121 92 102 L98 105 Q83 141 84 171 L79 235 Z',
    '#544f48',
  );
  plate(
    c,
    'M43 153 Q10 145 22 125 Q-4 105 20 86 Q8 60 35 56 Q42 29 68 41 Q94 21 108 46 Q138 49 130 78 Q147 100 125 115 Q119 139 99 135 Q78 162 58 143 Z',
    '#476d66',
  );
  plate(
    c,
    'M27 91 Q45 63 66 62 M57 119 Q81 84 108 80 M69 74 L82 58 M37 125 L48 110',
    null,
    '#819c83',
    4,
  );
  for (const [x, y] of [
    [101, 264],
    [174, 243],
    [227, 276],
    [390, 281],
    [538, 261],
    [643, 244],
    [685, 256],
    [54, 257],
  ]) {
    c.save();
    c.translate(x, y);
    plate(c, 'M0 0 l-5 -10 M3 1 l5 -7 M-11 2 l-3 -4', null, '#465e54', 2.5);
    c.restore();
  }
  c.save();
  c.translate(712, 251);
  plate(
    c,
    'M-1 2 Q3 -13 -1 -41 M0 -13 Q-16 -21 -16 -29 Q-2 -27 1 -19 M0 -9 Q14 -24 20 -23 Q18 -13 0 -9',
    '#456858',
    '#456858',
    2,
  );
  for (let i = 0; i < 6; i++) {
    const a = (i * tau) / 6;
    oval(c, -1 + Math.cos(a) * 9, -42 + Math.sin(a) * 9, 9, 5, '#e47d52', a);
  }
  oval(c, -1, -42, 5, 5, '#624539');
  c.restore();
  oval(c, sleep ? 443 : 388, 252, sleep ? 151 : 107, sleep ? 11 : 7, '#567763');
}

const fur = '#fff3d8';
const shadowFur = '#d5bfa5';
// The rear pair of legs prints first so the two near legs have a clean silhouette.
function runningDog(c) {
  plate(
    c,
    'M110 97 Q106 138 76 158 L15 177 Q3 181 9 187 Q15 192 36 187 L95 178 Q118 170 142 140 L188 110 Z',
    shadowFur,
    ink,
    3.8,
  );
  plate(
    c,
    'M276 114 Q283 142 324 169 L374 180 Q391 189 399 181 Q404 175 391 168 L342 154 Q326 133 320 103 Z',
    shadowFur,
    ink,
    3.8,
  );
  plate(
    c,
    'M107 94 C68 90 39 58 15 49 Q2 43 4 51 Q14 75 49 101 Q71 120 108 122 Q92 151 68 173 L15 203 Q5 210 11 216 Q20 220 34 213 L91 187 Q116 175 139 148 Q157 126 186 126 Q224 132 261 131 Q278 153 303 160 Q321 164 344 153 L391 119 Q408 115 410 108 Q410 99 393 101 L330 130 Q318 132 304 117 Q338 109 355 85 L377 80 Q395 85 419 76 L448 60 Q457 54 454 45 L418 45 Q406 33 393 33 Q371 27 351 41 L319 61 Q293 78 257 72 Q217 69 179 69 Q135 65 107 94 Z',
    fur,
    ink,
    4.7,
  );
  plate(c, 'M6 49 Q23 51 45 71 Q54 83 58 93 Q24 78 6 55 Z', ink);
  plate(
    c,
    'M103 101 Q122 72 155 72 Q187 70 203 73 Q201 91 181 101 Q164 107 145 126 Q126 135 115 127 Q104 122 103 101 Z',
    ink,
  );
  plate(c, 'M281 76 Q306 73 327 59 Q336 56 343 54 L356 83 Q345 98 335 104 Q312 101 301 95 Z', ink);
  plate(c, 'M344 49 Q350 42 356 40 L372 84 L361 88 Z', '#d49731', ink, 2);
  plate(
    c,
    'M378 38 Q381 55 368 67 Q351 85 323 77 Q306 71 291 73 Q300 59 320 53 Q344 47 360 38 Q368 34 378 38 Z',
    ink,
  );
  plate(c, 'M310 69 Q338 66 355 52 M326 72 L343 66', null, '#62565b', 2.8);
  plate(c, 'M447 44 Q455 42 458 45 Q462 52 450 59 Q444 54 447 44 Z', ink);
  oval(c, 400, 43, 4.4, 5.6, ink);
  plate(
    c,
    'M423 67 Q436 68 443 61 M153 115 Q164 109 169 103 M158 118 l11 -7 M273 114 l12 9 M277 111 l10 7',
    null,
    ink,
    2,
  );
}
function sleepingDog(c) {
  plate(
    c,
    'M67 147 C66 106 98 61 151 52 C202 42 254 58 282 87 C307 89 329 104 346 118 L367 145 Q383 150 403 149 Q417 150 416 161 Q414 177 382 183 L333 191 Q284 213 215 211 Q124 216 84 185 Q66 173 67 147 Z',
    fur,
    ink,
    4.5,
  );
  plate(
    c,
    'M70 148 C65 113 98 69 138 57 Q156 53 175 52 Q191 72 175 89 Q157 110 135 113 Q102 118 95 144 Q87 155 70 148 Z',
    ink,
  );
  plate(c, 'M253 88 Q277 87 301 106 L287 155 Q270 161 249 147 Q232 119 253 88 Z', ink);
  plate(
    c,
    'M283 94 Q289 95 298 101 Q277 123 283 156 L273 162 Q259 125 283 94 Z',
    '#d49731',
    ink,
    2,
  );
  plate(
    c,
    'M314 104 Q332 115 333 130 Q326 160 301 174 Q282 181 279 171 Q279 159 285 141 Q294 109 314 104 Z',
    ink,
  );
  plate(c, 'M308 129 Q301 151 292 160 M311 137 L304 152', null, '#62565b', 2.8);
  plate(
    c,
    'M383 183 Q393 175 408 171 Q429 171 442 179 Q447 187 432 190 L375 193 Q359 195 351 191',
    fur,
    ink,
    3.8,
  );
  plate(c, 'M405 150 Q415 148 418 154 Q419 160 408 165 Q402 158 405 150 Z', ink);
  plate(
    c,
    'M345 136 Q352 144 361 138 M384 173 Q394 174 400 170 M426 180 l4 5 M419 181 l3 6',
    null,
    ink,
    3.3,
  );
  plate(
    c,
    'M110 139 C89 151 88 168 111 183 Q150 205 209 190 Q245 178 267 156 Q276 150 279 155 Q278 175 254 194 Q215 221 152 215 Q89 213 71 180 Q59 158 70 139',
    fur,
    ink,
    4.3,
  );
  plate(c, 'M215 187 Q245 179 268 156 Q275 152 278 155 Q276 173 255 193 Q239 198 223 196 Z', ink);
  plate(
    c,
    'M101 170 Q117 184 137 186 M106 165 l14 11 M145 61 l-14 6 M151 65 l-12 6',
    null,
    '#7f7268',
    2.4,
  );
}

function picturePage(c, clock, state, ledger) {
  const settled = clock.index > 0 || clock.elapsed >= 2.65;
  const entering = clock.index > 0 ? 1 : ease((clock.elapsed - 2.65) / 0.55);
  const selected = choice(state.shares, drawFraction);
  c.save();
  c.translate(0, 72 * (1 - ledger));
  type(c, 'The dog', 132, 236, 93);
  type(c, settled ? words[selected] + '.' : '…', 497, 236, 93, deep[selected], { style: 'italic' });
  c.translate(129, 281);
  meadow(c, selected === 1);
  const fold =
    clock.beat.id === 'crossing'
      ? Math.min(1, Math.abs(state.shares[0] - drawFraction) / 0.022)
      : 1;
  c.save();
  c.translate(414 - 128 * (1 - entering), 237);
  c.scale(1.17 * (0.02 + 0.98 * ease(fold)), 1.17);
  c.translate(-225, -202);
  c.globalAlpha = entering;
  if (selected === 0) runningDog(c);
  else sleepingDog(c);
  c.restore();
  c.restore();
}
function wedge(c, r, start, end) {
  c.beginPath();
  c.moveTo(0, 0);
  c.arc(0, 0, r, start, end);
  c.closePath();
}
// Keep the print pattern fixed in page space while the seam travels through it.
function printSector(c, i, start, end, r) {
  c.save();
  wedge(c, r, start, end);
  c.fillStyle = inks[i];
  c.fill();
  c.clip();
  c.strokeStyle = ['#f8b582', '#c7bceb', '#f2d787'][i];
  c.lineWidth = 3.5;
  c.beginPath();
  for (let row = -4; row <= 4; row++) {
    for (let col = -4; col <= 4; col++) {
      const x = col * 83 + (row % 2) * 32,
        y = row * 67 + Math.sin(col * 4 + row) * 8;
      if (i === 0) {
        c.moveTo(x - 11, y + 2);
        c.lineTo(x + 8, y - 3);
        c.moveTo(x + 1, y + 7);
        c.lineTo(x + 11, y + 4);
      } else if (i === 1) {
        c.moveTo(x - 5, y);
        c.lineTo(x + 5, y);
        c.moveTo(x, y - 6);
        c.lineTo(x, y + 6);
      } else {
        c.moveTo(x - 4, y + 3);
        c.quadraticCurveTo(x - 3, y - 5, x + 5, y - 5);
      }
    }
  }
  c.stroke();
  c.restore();
}
function wheel(c, clock, state, showShare, favoriteShare) {
  const r = 337;
  c.save();
  c.translate(1387, 459);
  oval(c, 4, 10, r + 9, r + 11, '#c7ae8f');
  oval(c, 1, 3, r + 8, r + 8, '#dec9a5');
  oval(c, 0, 0, r + 5, r + 5, ink);
  let start = origin;
  const sectors = state.shares.map((share, i) => {
    const end = start + tau * share;
    const sector = { start, end, mid: (start + end) / 2 };
    printSector(c, i, start, end, r);
    start = end;
    return sector;
  });
  for (const { start } of sectors) {
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(r * Math.cos(start), r * Math.sin(start));
    c.strokeStyle = ink;
    c.lineWidth = 3.4;
    c.stroke();
  }
  // Print the short name lengthwise in the narrow yellow piece.
  sectors.forEach(({ mid }, i) => {
    const radius = [223, 257, 260][i];
    c.save();
    c.translate(radius * Math.cos(mid), radius * Math.sin(mid));
    if (i === 2) c.rotate(mid % tau);
    type(c, words[i], 0, i === 2 ? 13 : 20, i === 2 ? 43 : 58, ink, {
      align: 'center',
      style: 'italic',
    });
    if (i === 0 && favoriteShare > 0) {
      c.globalAlpha = favoriteShare;
      type(c, Math.round(state.shares[0] * 100) + '%', 0, 59, 36, ink, {
        align: 'center',
        face: 'Mono',
      });
    }
    c.restore();
  });
  // The visible tip reaches the color, leaving room for the word at the rim.
  const spin = clock.index === 0 ? clamp(clock.elapsed / 2.65) : 1;
  const angle = -((1 - spin) ** 2) * tau * 1.42;
  c.save();
  c.rotate(angle);
  const arrow =
    'M-87 -12 Q-104 0 -87 12 L-37 19 L-29 12 L152 12 L146 28 L230 0 L147 -28 L152 -11 L-29 -11 L-38 -18 Z';
  c.save();
  c.translate(1, 7);
  plate(c, arrow, '#44364144');
  c.restore();
  plate(c, arrow, '#333344', ink, 2.5);
  plate(c, 'M-74 0 L-41 5 M28 0 L166 0', null, '#f8e2bd', 2.6);
  c.restore();
  oval(c, 0, 0, 20, 20, '#efcf93');
  oval(c, 0, 0, 11, 11, ink);
  oval(c, -2, -2, 3, 3, paper);
  c.restore();

  if (showShare > 0) {
    c.save();
    c.globalAlpha = showShare;
    type(c, 'slept', 1048, 864, 47, deep[1], { style: 'italic' });
    const weight = state.weights[1].toFixed(1),
      total = state.total.toFixed(1);
    type(c, weight, 1302, 839, 37, ink, { face: 'Mono', align: 'center' });
    c.fillStyle = ink;
    c.fillRect(1243, 849, 118, 2.5);
    type(c, total, 1302, 892, 37, ink, { face: 'Mono', align: 'center' });
    type(c, '≈', 1392, 870, 49);
    type(c, Math.round(100 * state.shares[1]) + '%', 1477, 872, 70, deep[1]);
    c.restore();
  }
}
function ledgerPage(c, state, ledger, showWeight, proposed) {
  if (ledger <= 0) return;
  c.save();
  c.globalAlpha = ledger;
  const centers = [450, 615, 774];
  c.fillStyle = '#bdac91';
  c.fillRect(139, 711, 710, 2);
  words.forEach((word, i) =>
    type(c, word, centers[i], 692, 46, deep[i], { style: 'italic', align: 'center' }),
  );
  type(c, 'score', 139, 766, 41);
  if (proposed > 0) {
    c.save();
    c.globalAlpha *= proposed;
    plate(c, 'M573 778 Q609 770 655 775 L653 782 Q613 778 574 786 Z', '#a799ca');
    c.restore();
  }
  state.scores.forEach((score, i) =>
    type(c, Number(score.toFixed(1)), centers[i], 766, 43, ink, { face: 'Mono', align: 'center' }),
  );
  if (showWeight > 0) {
    c.globalAlpha *= showWeight;
    type(c, 'weight ≈', 139, 837, 39);
    state.weights.forEach((weight, i) =>
      type(c, weight.toFixed(1), centers[i], 837, 40, ink, { face: 'Mono', align: 'center' }),
    );
  }
  c.restore();
}
function draw(c, clock) {
  const amount = cue(clock, 'crossing', 'Watch that purple edge', 2.6);
  const state = distribution(amount);
  const closeBookMath = cue(clock, 'same-spin', 'Ran still has', 0.85);
  const ledger = cue(clock, 'weights', 'Our little model', 0.8) * (1 - closeBookMath);
  const weight = cue(clock, 'weights', 'raises e', 0.55);
  const share = cue(clock, 'share', 'divide by the total', 0.7) * (1 - closeBookMath);
  const favoriteShare =
    cue(clock, 'read', 'Look how much', 0.5) *
      (1 - cue(clock, 'weights', 'Our little model', 0.8)) +
    closeBookMath;
  const underline = cue(clock, 'hold-the-arrow', 'If slept goes', 0.4);
  book(c);
  picturePage(c, clock, state, ledger);
  wheel(c, clock, state, share, favoriteShare);
  ledgerPage(c, state, ledger, weight, underline);
}

function check() {
  const first = distribution(0),
    last = distribution(1);
  assert.deepEqual(first.scores, [3, 1, 0]);
  assert.deepEqual(last.scores, [3, 2, 0]);
  assert.deepEqual(
    first.shares.map((p) => +(100 * p).toFixed(1)),
    [84.4, 11.4, 4.2],
  );
  assert.deepEqual(
    last.shares.map((p) => +(100 * p).toFixed(1)),
    [70.5, 25.9, 3.5],
  );
  assert.equal(words[choice(first.shares, drawFraction)], 'ran');
  assert.equal(words[choice(last.shares, drawFraction)], 'slept');
  assert.equal(first.weights[0], last.weights[0]);
  assert.equal(first.weights[2], last.weights[2]);
  assert(last.total > first.total && last.shares[2] < first.shares[2]);
  assert.equal(Math.round(100 * last.shares[1]), 26);
  let previous = first.shares[0];
  for (let step = 0; step <= 100; step++) {
    const { shares } = distribution(step / 100);
    assert(Math.abs(shares.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    assert(shares[0] <= previous && shares[0] > shares[1]);
    previous = shares[0];
  }
  assert(Math.abs(Math.sin(origin + tau * drawFraction)) < 1e-12);
}
export default { title: 'The Word Under the Arrow', beats, draw, check };
