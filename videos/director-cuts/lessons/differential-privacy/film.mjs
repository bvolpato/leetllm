import assert from 'node:assert/strict';

const title = 'One chip from behind the curtain';

// Each row is a fresh pouch for a single response. Each chip is equally likely.
const pouches = [
  { truth: 'YES', chips: ['YES', 'YES', 'NO', 'YES'] },
  { truth: 'NO', chips: ['NO', 'YES', 'NO', 'NO'] },
];

const matches = (pouch, report) => pouch.chips.filter((word) => word === report).length;
const probability = (pouch, report) => matches(pouch, report) / pouch.chips.length;
const reports = ['YES', 'NO'];
const factor = Math.max(
  ...reports.map((word) => {
    const chances = pouches.map((pouch) => probability(pouch, word));
    return Math.max(...chances) / Math.min(...chances);
  }),
);
const epsilon = Math.log(factor);

function check() {
  assert.deepEqual(
    pouches.map((pouch) => reports.map((word) => probability(pouch, word))),
    [
      [0.75, 0.25],
      [0.25, 0.75],
    ],
  );
  // Check the pure local DP inequality for both inputs and every output event.
  for (const event of [[], ['YES'], ['NO'], reports]) {
    const [a, b] = pouches.map((pouch) =>
      event.reduce((p, word) => p + probability(pouch, word), 0),
    );
    assert.ok(a <= factor * b && b <= factor * a);
  }
  assert.equal(factor, 3);
  assert.equal(epsilon.toFixed(2), '1.10');
}

const beats = [
  {
    id: 'the-return',
    say: 'Did you use the library after dark? A reader slips one chip out of the survey booth. How much does that yes tell the librarian?',
    hold: 1.1,
  },
  {
    id: 'inside-the-booth',
    say: 'Take a look inside. Each reader gets a fresh pair of pouches and picks the one marked with their real answer.',
    hold: 0.7,
  },
  {
    id: 'empty-the-pouches',
    say: 'Let’s tip them out so you can see what goes in. In the booth you mix the four chips in your pouch and draw one by touch. Each feels the same. Each has the same chance.',
    hold: 0.7,
  },
  {
    id: 'find-the-word',
    say: 'Look for the word that landed in the tray. How many ways could a reader who visited after dark send that yes? Now look in the other pouch.',
    hold: 1.7,
  },
  {
    id: 'one-against-three',
    say: 'Three chances in four from the yes pouch. One in four from the no pouch. That same report is three times as likely if the reader visited after dark.',
    hold: 1,
  },
  {
    id: 'other-report',
    say: 'What if a no came out instead? Watch where the three matches go. The advantage switches sides, and the factor stays at three.',
    hold: 1,
  },
  {
    id: 'the-bound',
    say: 'Those are all the possible reports. Switching the real answer can make any report at most three times as likely. For this one draw, that gives us local differential privacy with epsilon equal to the natural log of three.',
    hold: 1.7,
  },
  {
    id: 'back-at-the-desk',
    say: 'Back at the desk, there’s the yes we started with. The librarian can count it. Which pouch it came from stays behind the curtain.',
    hold: 2.5,
  },
];

const clamp = (t) => Math.max(0, Math.min(1, t));
function ease(t) {
  t = clamp(t);
  return t * t * (3 - 2 * t);
}
const mix = (a, b, t) => a + (b - a) * t;
const tau = Math.PI * 2;
const dye = { YES: '#193f53', NO: '#903a46' };

function type(ctx, value, x, y, size, color, font = 'Sans', weight = 600) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + font + '"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function wash(ctx, x0, y0, x1, y1, colors) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [offset, color] of colors) g.addColorStop(offset, color);
  return g;
}

function oval(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, tau);
  ctx.fillStyle = fill;
  ctx.fill();
}

function shadow(ctx, x, y, rx, ry, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  fade.addColorStop(0, 'rgba(46,28,49,' + opacity + ')');
  fade.addColorStop(0.72, 'rgba(46,28,49,' + opacity * 0.45 + ')');
  fade.addColorStop(1, 'rgba(46,28,49,0)');
  oval(ctx, 0, 0, 1, 1, fade);
  ctx.restore();
}

// Stable flecks of aggregate in the linoleum. Group by pigment for a single fill.
let seed = 1029;
function next() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 4294967296;
}
const flecks = Array.from({ length: 3 }, () =>
  Array.from({ length: 540 }, () => [next() * 1940, next() * 1100, 1 + next() * 5, next() * 4 - 2]),
);

function counter(ctx) {
  ctx.fillStyle = wash(ctx, 300, 0, 1400, 1080, [
    [0, '#e8e1eb'],
    [0.4, '#e9e1e1'],
    [0.78, '#dfd6dc'],
    [1, '#cdbfce'],
  ]);
  ctx.fillRect(-5, -5, 1930, 1090);
  flecks.forEach((group, i) => {
    ctx.beginPath();
    for (const [x, y, w, slant] of group) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + slant);
      ctx.lineTo(x + w * 0.6, y + slant + 1.8);
      ctx.closePath();
    }
    ctx.fillStyle = ['#ffffff91', '#ac98ae59', '#ab8f8d50'][i];
    ctx.fill();
  });
}

// A book stamped into the enamel and repeated as a block print on the cloth.
function book(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.quadraticCurveTo(-7, 1, -18, 1);
  ctx.lineTo(-18, -11);
  ctx.quadraticCurveTo(-8, -11, 0, -5);
  ctx.quadraticCurveTo(8, -11, 18, -11);
  ctx.lineTo(18, 1);
  ctx.quadraticCurveTo(8, 1, 0, 8);
  ctx.lineTo(0, -5);
  ctx.stroke();
  ctx.restore();
}

function dishOutline(ctx, scale) {
  ctx.beginPath();
  ctx.moveTo(-292 * scale, -30 * scale);
  ctx.bezierCurveTo(
    -302 * scale,
    -150 * scale,
    -193 * scale,
    -215 * scale,
    -43 * scale,
    -220 * scale,
  );
  ctx.bezierCurveTo(119 * scale, -227 * scale, 276 * scale, -201 * scale, 301 * scale, -74 * scale);
  ctx.bezierCurveTo(325 * scale, 53 * scale, 233 * scale, 186 * scale, 111 * scale, 216 * scale);
  ctx.bezierCurveTo(-37 * scale, 250 * scale, -180 * scale, 205 * scale, -213 * scale, 125 * scale);
  ctx.bezierCurveTo(-245 * scale, 53 * scale, -277 * scale, 65 * scale, -292 * scale, -30 * scale);
  ctx.closePath();
}

const trayX = 1545;
const trayY = 515;

function tray(ctx) {
  ctx.save();
  ctx.translate(trayX, trayY);
  shadow(ctx, 18, 57, 350, 233, 0.34);
  ctx.translate(0, 9);
  dishOutline(ctx, 1);
  ctx.fillStyle = '#353860';
  ctx.fill();
  ctx.translate(0, -9);
  dishOutline(ctx, 1);
  ctx.fillStyle = wash(ctx, -180, -220, 166, 212, [
    [0, '#f9f4fa'],
    [0.16, '#b3b7eb'],
    [0.56, '#8d90c4'],
    [0.85, '#c3c5e9'],
    [1, '#eee6f4'],
  ]);
  ctx.fill();
  dishOutline(ctx, 0.964);
  ctx.fillStyle = wash(ctx, -100, -170, 88, 200, [
    [0, '#626998'],
    [0.17, '#434d87'],
    [0.63, '#6573ac'],
    [0.89, '#8690bf'],
    [1, '#b6b7d6'],
  ]);
  ctx.fill();
  dishOutline(ctx, 0.938);
  ctx.strokeStyle = '#d6cef14a';
  ctx.lineWidth = 2;
  ctx.stroke();
  type(ctx, 'Library survey', 0, -130, 46, '#fff4eb', 'Serif', 500);
  book(ctx, 8, 152, 1.15, '#ede6ffb0');
  ctx.restore();
}

function chip(ctx, x, y, radius, word, angle, light = 0, tilt = 1, lift = 0, faceUp = true) {
  ctx.save();
  shadow(ctx, x + 4, y + 10, radius * (1.18 + lift / 300), radius * 0.96, 0.26);
  ctx.translate(x, y - lift);
  ctx.rotate(angle);
  ctx.scale(tilt, 1);
  const r = radius;
  oval(ctx, 0, r * 0.075, r, r * 0.96, '#a47a54');
  oval(
    ctx,
    0,
    0,
    r,
    r * 0.96,
    wash(ctx, -r, -r, r, r, [
      [0, '#fff2cd'],
      [0.55, '#f7ddb0'],
      [1, '#d8b186'],
    ]),
  );
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = '#b7804d35';
  ctx.lineWidth = r * 0.012;
  ctx.beginPath();
  for (let i = -5; i < 6; i++) {
    const ly = i * r * 0.2;
    ctx.moveTo(-r, ly);
    ctx.bezierCurveTo(-r * 0.4, ly - r * 0.28, r * 0.46, ly + r * 0.31, r, ly - r * 0.03);
  }
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.88, r * 0.84, 0, 0, tau);
  ctx.strokeStyle = '#9a724689';
  ctx.lineWidth = Math.max(2, r * 0.022);
  ctx.stroke();
  if (faceUp) {
    type(ctx, word, 0, r * 0.045, r * 0.73, dye[word], 'Sans', 800);
  } else {
    book(ctx, 0, 0, r / 38, '#aa8862');
  }
  if (light > 0) {
    ctx.strokeStyle = 'rgba(255,251,222,' + light + ')';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, r + 5, r * 0.96 + 5, 0, 0, tau);
    ctx.stroke();
  }
  ctx.restore();
}

function bagOutline(ctx) {
  ctx.beginPath();
  ctx.moveTo(-208, -75);
  ctx.bezierCurveTo(-191, -145, -48, -132, 33, -115);
  ctx.bezierCurveTo(109, -106, 147, -71, 181, -73);
  ctx.lineTo(225, -99);
  ctx.quadraticCurveTo(235, -40, 214, -6);
  ctx.quadraticCurveTo(229, 50, 219, 81);
  ctx.lineTo(170, 63);
  ctx.bezierCurveTo(112, 74, 82, 116, -16, 126);
  ctx.bezierCurveTo(-160, 139, -223, 104, -219, 54);
  ctx.quadraticCurveTo(-232, -10, -208, -75);
  ctx.closePath();
}

function pouch(ctx, pouch, x, y, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  shadow(ctx, 5, 36, 256, 127, 0.32);
  bagOutline(ctx);
  ctx.fillStyle = wash(ctx, -111, -137, 87, 146, [
    [0, '#a0aaca'],
    [0.18, '#7387ad'],
    [0.5, '#586c96'],
    [0.79, '#526689'],
    [1, '#304668'],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#455577';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.save();
  ctx.clip();
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    for (let u = -300; u < 310; u += 5) {
      if (i === 0) {
        ctx.moveTo(u, -155);
        ctx.lineTo(u + 48, 148);
      } else {
        ctx.moveTo(-242, u);
        ctx.lineTo(242, u - 16);
      }
    }
    ctx.strokeStyle = i === 0 ? '#ede5ef25' : '#273c5e24';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++)
      book(ctx, -188 + col * 86 + (row % 2) * 36, -104 + row * 70, 0.65, '#d6dfec65');
  }
  // The drawstring gathers the cotton into a narrow neck.
  for (const [top, bottom] of [
    [-98, -41],
    [-64, -23],
    [99, 42],
    [76, 18],
  ]) {
    ctx.beginPath();
    ctx.moveTo(-6, top);
    ctx.bezierCurveTo(77, top * 0.9, 110, bottom, 166, bottom);
    ctx.quadraticCurveTo(88, bottom * 0.56, -6, top);
    ctx.fillStyle = '#25384b28';
    ctx.fill();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(164, -66);
  ctx.bezierCurveTo(157, -17, 168, 37, 172, 63);
  ctx.bezierCurveTo(183, 68, 205, 105, 259, 101);
  ctx.bezierCurveTo(283, 98, 281, 71, 256, 80);
  ctx.bezierCurveTo(222, 98, 189, 86, 171, 56);
  ctx.strokeStyle = '#435571';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.strokeStyle = '#d9ccba';
  ctx.lineWidth = 5.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(215, -88);
  ctx.quadraticCurveTo(198, -11, 215, 75);
  ctx.strokeStyle = '#33435d';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.save();
  ctx.translate(-36, 2);
  ctx.fillStyle = '#f2e7cf';
  ctx.fillRect(-117, -48, 234, 96);
  ctx.strokeStyle = '#9b8e7c';
  ctx.setLineDash([7, 6]);
  ctx.lineWidth = 1.8;
  ctx.strokeRect(-112, -43, 224, 86);
  type(ctx, 'True ' + pouch.truth, 0, 3, 45, '#283950', 'Serif', 600);
  ctx.restore();
  ctx.restore();
}

// The curtain edge is the boundary of the librarian’s view.
function curtain(ctx, open, seconds) {
  const end = mix(1242, 43, open);
  const left = -110;
  const w = end - left;
  ctx.fillStyle = wash(ctx, end - 1, 0, end + 42, 3, [
    [0, '#412e4852'],
    [1, '#412e4800'],
  ]);
  ctx.fillRect(end - 1, -10, 43, 1110);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left, -20);
  ctx.lineTo(end, -20);
  for (let i = 0; i <= 40; i++) {
    const y = i * 28;
    const d = Math.sin(y / 235 + seconds * 0.37) * (1.5 + open * (1 - open) * 18);
    ctx.lineTo(end + d, y);
  }
  ctx.lineTo(left, 1120);
  ctx.closePath();
  ctx.clip();
  const folds = 8;
  const fw = w / folds;
  for (let i = 0; i < folds; i++) {
    const x = left + i * fw;
    ctx.fillStyle = wash(ctx, x, 0, x + fw, 0, [
      [0, '#803349'],
      [0.18, '#a74b62'],
      [0.47, '#c86a79'],
      [0.58, '#cd7481'],
      [0.85, '#a34c61'],
      [1, '#7e314a'],
    ]);
    ctx.fillRect(x - 0.6, -10, fw + 1.3, 1130);
  }
  ctx.beginPath();
  for (let y = -20; y < 1130; y += 7) {
    ctx.moveTo(left, y);
    ctx.lineTo(end + 8, y + 11);
  }
  ctx.strokeStyle = '#f1c3c221';
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.beginPath();
  for (let x = left; x < end + 8; x += 9) {
    ctx.moveTo(x, -20);
    ctx.lineTo(x + 2, 1120);
  }
  ctx.strokeStyle = '#64253c22';
  ctx.lineWidth = 1;
  ctx.stroke();
  // The after-hours library emblem is woven across the pleats.
  if (open < 0.98) {
    ctx.save();
    ctx.translate(left + w * 0.78, 512);
    ctx.scale((1 - open) * 0.9, 1);
    ctx.globalAlpha = 0.86 * (1 - open);
    ctx.fillStyle = '#efd1b4';
    ctx.beginPath();
    ctx.moveTo(-31, -104);
    ctx.bezierCurveTo(-70, -44, -18, 8, 42, -34);
    ctx.bezierCurveTo(8, -21, -34, -50, -31, -104);
    ctx.fill();
    for (const [x, y, r] of [
      [31, -94, 6],
      [63, -71, 9],
      [-60, -25, 5],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + 0.44 * r, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - 0.44 * r, y);
      ctx.closePath();
      ctx.fill();
    }
    book(ctx, 0, 59, 4.4, '#efcdb6');
    ctx.restore();
  }
  // Two rows of stitching identify the hem throughout the pull.
  for (const offset of [14, 23]) {
    ctx.beginPath();
    ctx.moveTo(end - offset, 0);
    ctx.lineTo(end - offset, 1120);
    ctx.strokeStyle = '#e9b4b291';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 5]);
    ctx.stroke();
  }
  ctx.restore();
}

const tileXs = [638, 797, 955, 1113];
const tileOffsets = [14, -25, 15, -9];
const yRows = [338, 651];
const tileAngles = [-0.18, 0.08, -0.06, 0.16];

function contents(ctx, row, spill, emphasis, report, countOpacity) {
  const bag = pouches[row],
    y = yRows[row],
    sign = row === 0 ? 1 : -1;
  for (const [i, word] of bag.chips.entries()) {
    const p = ease((spill - i * 0.085) / 0.745);
    if (p <= 0) continue;
    const x = mix(445, tileXs[i], p),
      ty = mix(y + 2, y + tileOffsets[i] * sign, p);
    const selected = word === report;
    ctx.save();
    ctx.globalAlpha *= p;
    const turn = selected ? 0 : emphasis * Math.PI;
    const tilt = (1 - 0.55 * Math.sin(p * Math.PI)) * Math.max(0.08, Math.abs(Math.cos(turn)));
    const lift = 18 * Math.sin(p * Math.PI) + 16 * Math.sin(turn);
    chip(
      ctx,
      x,
      ty - (selected ? emphasis * 9 : 0),
      63,
      word,
      mix(-sign * (0.8 + i * 0.25), tileAngles[i] * sign, p),
      selected ? emphasis : 0,
      tilt,
      lift,
      turn <= Math.PI / 2,
    );
    ctx.restore();
  }
  const wiggle = Math.sin(2 * tau * spill) * Math.sin(Math.PI * spill);
  pouch(ctx, bag, 284, y, sign * (-0.065 + wiggle * 0.08));
  if (countOpacity > 0) {
    ctx.save();
    ctx.globalAlpha *= countOpacity;
    type(
      ctx,
      matches(bag, report) + ' in ' + bag.chips.length,
      880,
      y - 117,
      52,
      '#55475b',
      'Serif',
      600,
    );
    ctx.restore();
  }
}

function draw(ctx, clock) {
  const { index, elapsed, reveal, seconds } = clock;
  let open = 1;
  if (index === 0) open = 0;
  if (index === 1) open = ease(clamp(elapsed / 1.65));
  if (index === 7) open = 1 - ease(reveal('Back at the desk', 1.6));
  const zoom = mix(1.38, 1, open);
  ctx.save();
  ctx.translate(1920, 500);
  ctx.scale(zoom, zoom);
  ctx.translate(-1920, -500);
  counter(ctx);
  const spill = index < 2 ? 0 : index === 2 ? clamp(elapsed / 2.25) : 1;
  const swap = index < 5 ? 0 : index === 5 ? ease(reveal('What if a no', 1.1)) : 1;
  const report = swap < 0.5 ? 'YES' : 'NO';
  let top = index >= 3 ? 1 : 0,
    bottom = top;
  if (index === 3) {
    top = ease(reveal('Look for the word', 1.1));
    bottom = ease(reveal('Now look', 0.9));
  }
  let count = index >= 4 ? 1 : 0;
  if (index === 4) count = ease(clamp(elapsed / 0.7));
  const swapDip = 1 - Math.sin(swap * Math.PI);
  const originalAgain = index === 7 && open === 0 ? ease(reveal('the yes we started with', 0.9)) : 0;
  const arrivalWord = originalAgain > 0.5 ? 'YES' : report;
  if (open > 0) {
    contents(ctx, 0, spill, top * swapDip, report, count * swapDip);
    contents(ctx, 1, spill, bottom * swapDip, report, count * swapDip);
  }
  tray(ctx);
  // The second possible report replaces the first in a match cut on the dish.
  const arrival = index === 0 ? ease(clamp(elapsed / 1.65)) : 1;
  const bounce = Math.abs(Math.sin(2 * Math.PI * arrival)) * (1 - arrival);
  ctx.save();
  ctx.globalAlpha *= swapDip * (1 - Math.sin(originalAgain * Math.PI));
  chip(
    ctx,
    mix(1160, trayX, arrival),
    trayY + 14,
    101,
    arrivalWord,
    mix(-2.65, -0.09, arrival) + (arrivalWord === 'NO' ? 0.18 : 0),
    0,
    1 - bounce * 0.65,
    35 * bounce,
  );
  ctx.restore();
  if (index >= 4 && index < 7) {
    const ratioOpacity = index === 4 ? ease(reveal('That same report', 0.9)) : 1;
    ctx.save();
    ctx.globalAlpha *= ratioOpacity;
    type(ctx, factor + '× as likely', trayX, 802, 60, '#43354b', 'Serif', 600);
    ctx.restore();
    if (index === 6) {
      ctx.save();
      ctx.globalAlpha *= ease(reveal('local differential privacy', 0.8));
      type(
        ctx,
        'ε = ln ' + factor + ' ≈ ' + epsilon.toFixed(2) + '     δ = 0',
        trayX,
        860,
        43,
        '#50455d',
        'Sans',
        500,
      );
      ctx.restore();
    }
  }
  curtain(ctx, open, seconds);
  ctx.restore();
}

export default { title, beats, draw, check };
