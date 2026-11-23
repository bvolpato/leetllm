import assert from 'node:assert/strict';

// The two binary splits come from the original film's opening review tickets.
const specimens = [
  { colour: 'blue', ink: '#245479', tint: '#e1e9df', x: 164, y: 197, turn: -0.022, pThree: 0.97, value: 3 },
  { colour: 'red', ink: '#a04436', tint: '#f3ded0', x: 1040, y: 197, turn: 0.019, pThree: 0.53, value: 8 },
];
const outcomes = [3, 8];
const percentages = specimen => [specimen.pThree, 1 - specimen.pThree].map(p => Math.round(100 * p));
const margin = specimen => Math.abs(2 * specimen.pThree - 1);
const chosen = [...specimens].sort((a, b) => margin(a) - margin(b))[0];
const W = 700;
const H = 400;
const numberCentre = [549, 211];
const navy = '#263847';
const graphite = '#434447';

const beats = [
  {
    id: 'the-worn-impression',
    say: 'The ink skipped on this red stamp. Can you make out what someone paid to send a letter?',
    hold: 1.15,
  },
  {
    id: 'two-prices',
    say: 'We’re teaching a model to read postage. These two scans need labels. On the blue stamp, the model gives three cents a ninety-seven percent chance.',
    hold: 0.65,
  },
  {
    id: 'one-look',
    say: 'On the red stamp, it gives three cents fifty-three percent. The rest goes to eight. There’s time for a person to inspect one original. Where would you put the magnifier?',
    hold: 2,
  },
  {
    id: 'under-glass',
    say: 'Watch where the glass settles. The two estimates on the red stamp are just six percentage points apart. Asking for a label where the model is least sure is called uncertainty sampling.',
    hold: 0.8,
  },
  {
    id: 'the-return-strokes',
    say: 'Follow the faint stroke on the left. It closes the top loop. There’s another closed loop underneath. What looked like a three is an eight.',
    hold: 0.85,
  },
  {
    id: 'the-catalogue-entry',
    say: 'Below the scan, the cataloguer writes down eight cents. Now we can pair that scan with a human label for training. The blue stamp still has only a prediction.',
    hold: 2.5,
  },
];

const clamp = t => Math.min(1, Math.max(0, t));
function ease(t) {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
}
const mix = (a, b, t) => a + (b - a) * t;
function label(ctx, text, x, y, size, family, colour, align = 'left', style = '') {
  ctx.font = (style ? style + ' ' : '') + size + 'px "Lesson ' + family + '"';
  ctx.fillStyle = colour;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}
function path(ctx, draw, colour, width = 1) {
  ctx.beginPath();
  draw(ctx);
  if (width === 0) {
    ctx.fillStyle = colour;
    ctx.fill();
  } else {
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}
function seg(ctx, x, y, X, Y, ink, width) {
  path(ctx, p => { p.moveTo(x, y); p.lineTo(X, Y); }, ink, width);
}
function polygon(ctx, points, fill) {
  path(ctx, p => {
    p.moveTo(...points[0]);
    for (const point of points.slice(1)) p.lineTo(...point);
    p.closePath();
  }, fill, 0);
}
function wash(ctx, x, y, w, h, colours) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  for (const [stop, c] of colours) g.addColorStop(stop, c);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// Fixed flecks keep the paper still under the magnifier.
function fibres(count, w, h, seed) {
  const rand = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
  return Array.from({ length: count }, () => [rand() * w, rand() * h, 0.5 + rand() * 2.8, rand() - 0.5]);
}
const folioFibres = fibres(1300, 1920, 1080, 44);
const stampFibres = fibres(650, W, H, 231);

function drawFibres(ctx, fibres, colour, thickness) {
  path(ctx, p => {
    for (const [x, y, dx, dy] of fibres) { p.moveTo(x, y); p.lineTo(x + dx, y + dy); }
  }, colour, thickness);
}

function folio(ctx) {
  wash(ctx, 0, 0, 1920, 1080, [[0, '#faf6ea'], [0.55, '#eee8d9'], [1, '#decfbf']]);
  drawFibres(ctx, folioFibres, '#69553e26', 1.25);
  ctx.fillStyle = '#384e65';
  ctx.fillRect(0, 0, 47, 1080);
  for (let x = 2; x < 45; x += 5) seg(ctx, x, 0, x, 1080, '#dde0d120', 1.1);
  for (let y = -5; y < 1080; y += 8) seg(ctx, 0, y, 47, y + 13, '#060e221b', 1);
  const fold = ctx.createLinearGradient(47, 0, 96, 0);
  fold.addColorStop(0, '#645e4866');
  fold.addColorStop(1, '#6f624d00');
  ctx.fillStyle = fold;
  ctx.fillRect(47, 0, 49, 1080);
  label(ctx, 'The postage archive', 148, 124, 64, 'Serif', navy);
  seg(ctx, 150, 151, 1760, 151, '#787160', 1.6);
}

function perforations(ctx) {
  // Each edge takes its cut from the same side of the outline.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = 10; x < W; x += 20) { ctx.lineTo(x - 5.8, 0); ctx.arc(x, 0, 5.8, Math.PI, 0, true); }
  ctx.lineTo(W, 0);
  for (let y = 10; y < H; y += 20) { ctx.lineTo(W, y - 5.8); ctx.arc(W, y, 5.8, -Math.PI / 2, Math.PI / 2, true); }
  ctx.lineTo(W, H);
  for (let x = W - 10; x > 0; x -= 20) { ctx.lineTo(x + 5.8, H); ctx.arc(x, H, 5.8, 0, Math.PI, true); }
  ctx.lineTo(0, H);
  for (let y = H - 10; y > 0; y -= 20) { ctx.lineTo(0, y + 5.8); ctx.arc(0, y, 5.8, Math.PI / 2, -Math.PI / 2, true); }
  ctx.closePath();
}

// An engraving cut in one ink. The wavering lines follow the water around the hull.
function harbour(ctx, s) {
  const ink = s.ink, light = s.tint;
  ctx.save();
  ctx.beginPath();
  ctx.rect(32, 84, 407, 247);
  ctx.clip();
  ctx.fillStyle = light;
  ctx.fillRect(32, 84, 407, 247);
  for (let i = 0; i < 16; i++) {
    const y = 91 + i * 6.7;
    path(ctx, p => { p.moveTo(24, y); p.bezierCurveTo(115, y + 5, 297, y - 4, 452, y + 3); }, ink + '58', 1.3);
  }
  polygon(ctx, [[22, 226], [91, 220], [149, 215], [187, 222], [239, 215], [303, 209], [337, 192], [362, 195], [385, 188], [455, 196], [455, 235], [20, 235]], ink);
  ctx.fillStyle = light;
  ctx.fillRect(24, 234, 445, 101);
  for (let j = 0; j < 14; j++) {
    const y = 237 + j * 7;
    for (let k = -1; k < 9; k++) {
      const x = k * 66 + ((j * 17) % 51);
      path(ctx, p => { p.moveTo(x, y); p.bezierCurveTo(x + 13, y - 3, x + 38, y + 4, x + 55, y - 1); }, ink, 1.2 + 0.1 * j);
    }
  }
  // The tower and lantern stay silhouetted above the headland.
  polygon(ctx, [[348, 199], [355, 130], [373, 130], [381, 202]], light);
  path(ctx, p => { p.moveTo(348, 199); p.lineTo(355, 130); p.lineTo(373, 130); p.lineTo(381, 202); }, ink, 3.2);
  polygon(ctx, [[351, 172], [376, 162], [377, 171], [350, 182]], ink);
  ctx.fillStyle = ink;
  ctx.fillRect(350, 128, 28, 4);
  ctx.fillRect(354, 112, 3, 15);
  ctx.fillRect(363, 112, 2, 15);
  ctx.fillRect(372, 112, 3, 15);
  polygon(ctx, [[349, 112], [364, 100], [379, 112]], ink);
  seg(ctx, 364, 102, 364, 94, ink, 2);
  for (let i = 0; i < 7; i++) seg(ctx, 344 + i * 6, 205, 357 + i * 6, 197, light, 1.3);

  // A two-sailed working boat gives the tiny printed scene a foreground.
  path(ctx, p => { p.moveTo(85, 265); p.quadraticCurveTo(158, 278, 258, 253); p.quadraticCurveTo(245, 282, 198, 287); p.lineTo(125, 288); p.closePath(); }, ink, 0);
  path(ctx, p => { p.moveTo(102, 274); p.quadraticCurveTo(177, 286, 242, 265); }, light, 2.4);
  path(ctx, p => { p.moveTo(171, 269); p.lineTo(157, 109); p.lineTo(155, 106); }, ink, 4.2);
  polygon(ctx, [[151, 122], [91, 245], [164, 254]], light);
  path(ctx, p => { p.moveTo(151, 122); p.lineTo(91, 245); p.quadraticCurveTo(129, 241, 164, 254); p.closePath(); }, ink, 2.7);
  polygon(ctx, [[164, 126], [174, 245], [251, 242]], light);
  path(ctx, p => { p.moveTo(164, 126); p.quadraticCurveTo(199, 197, 251, 242); p.quadraticCurveTo(213, 234, 174, 245); p.closePath(); }, ink, 2.8);
  for (let i = 1; i <= 8; i++) {
    const t = i / 9;
    seg(ctx, mix(151, 91, t), mix(122, 245, t), mix(151, 164, t), mix(122, 254, t), ink + '85', 1.2);
    seg(ctx, mix(164, 174, t), mix(126, 245, t), mix(164, 241, t), mix(126, 242, t), ink + '85', 1.2);
  }
  seg(ctx, 158, 113, 259, 256, ink, 1.8);
  seg(ctx, 155, 127, 79, 265, ink, 1.8);
  polygon(ctx, [[157, 111], [132, 110], [151, 119], [157, 118]], ink);
  for (const [x, y, r] of [[270, 129, 11], [286, 140, 7], [58, 169, 8]]) {
    path(ctx, p => { p.moveTo(x - r, y - 3); p.quadraticCurveTo(x - 3, y - 6, x, y + 2); p.quadraticCurveTo(x + 4, y - 4, x + r, y - 4); }, ink, 2);
  }
  ctx.restore();
}

function numeral(ctx, s) {
  ctx.save();
  ctx.translate(...numberCentre);
  ctx.lineCap = 'round';
  // These two bowls are shared. The left returns on the eight caught much less ink.
  path(ctx, p => {
    p.moveTo(-36, -56);
    p.bezierCurveTo(-12, -87, 41, -79, 39, -38);
    p.bezierCurveTo(38, -16, 15, -3, -3, 0);
    p.bezierCurveTo(24, 0, 47, 16, 44, 44);
    p.bezierCurveTo(40, 84, -11, 90, -37, 60);
  }, s.ink, 13);
  if (s.value === 8) {
    path(ctx, p => {
      p.moveTo(-36, -56);
      p.bezierCurveTo(-55, -27, -28, -5, -3, 0);
      p.bezierCurveTo(-33, 8, -55, 33, -37, 60);
    }, '#b9806b', 4.3);
    path(ctx, p => { p.moveTo(-42, -45); p.quadraticCurveTo(-48, -28, -33, -15); }, '#a96655', 2.2);
  }
  ctx.restore();
}

function stamp(ctx, s) {
  ctx.save();
  perforations(ctx);
  ctx.fillStyle = '#fff7e5';
  ctx.fill();
  ctx.clip();
  wash(ctx, 0, 0, W, H, [[0, '#fffaf0'], [0.6, '#fbf1da'], [1, '#e6d8bc']]);
  ctx.strokeStyle = s.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(21, 21, W - 42, H - 42);
  ctx.strokeRect(27, 27, W - 54, H - 54);
  ctx.fillStyle = s.ink;
  ctx.fillRect(32, 33, 636, 46);
  label(ctx, 'H A R B O U R    P O S T', 350, 68, 36, 'Serif', '#fff2d9', 'center');
  harbour(ctx, s);
  ctx.fillStyle = s.ink;
  ctx.fillRect(32, 337, 636, 29);
  // Wavy fine lines and rosettes are part of the stamp plate.
  for (let row = 0; row < 3; row++) {
    path(ctx, p => {
      for (let x = 38; x <= 663; x += 2) {
        const y = 351 + Math.sin(x * 0.075 + row * 2.1) * 8;
        if (x === 38) p.moveTo(x, y); else p.lineTo(x, y);
      }
    }, '#f8e8c6', 1.1);
  }
  ctx.fillStyle = s.tint;
  ctx.fillRect(444, 84, 224, 247);
  for (let i = 0; i < 14; i++) {
    path(ctx, p => p.ellipse(556, 205, 107 - i * 1.4, 118 - i * 1.7, 0, 0, Math.PI * 2), s.ink + '8a', 1);
  }
  ctx.fillStyle = '#fcf0d8';
  ctx.beginPath();
  ctx.ellipse(556, 205, 88, 95, 0, 0, Math.PI * 2);
  ctx.fill();
  numeral(ctx, s);
  label(ctx, 'C E N T S', 554, 319, 19, 'Serif', s.ink, 'center', 'bold');
  drawFibres(ctx, stampFibres, '#69512d24', 1.3);
  ctx.restore();
}

function pose(ctx, s, arrival = 1) {
  const fly = (1 - arrival) * (s === chosen ? 1 : 0);
  ctx.translate(s.x + W / 2 + fly * 40, s.y + H / 2 - fly * 98);
  ctx.rotate(s.turn - fly * 0.125);
  ctx.scale(1 + fly * 0.035, 1 + fly * 0.035);
  ctx.translate(-W / 2, -H / 2);
}
function specimenOnPage(ctx, s, arrival) {
  ctx.save();
  pose(ctx, s, arrival);
  const height = s === chosen ? 1 - arrival : 0;
  ctx.save();
  ctx.shadowColor = '#2f302e65';
  ctx.shadowBlur = 9 + height * 23;
  ctx.shadowOffsetX = 4 + height * 15;
  ctx.shadowOffsetY = 8 + height * 37;
  ctx.fillStyle = '#f6eddc';
  perforations(ctx);
  ctx.fill();
  ctx.restore();
  stamp(ctx, s);
  ctx.restore();
}

// From the price on the plate to that same spot on the desk.
function centreOnPage(s) {
  const dx = numberCentre[0] - W / 2, dy = numberCentre[1] - H / 2;
  return [
    s.x + W / 2 + Math.cos(s.turn) * dx - Math.sin(s.turn) * dy,
    s.y + H / 2 + Math.sin(s.turn) * dx + Math.cos(s.turn) * dy,
  ];
}
function lens(ctx, s, travel, dx, dy) {
  const [cx, cy] = centreOnPage(s);
  const x = mix(2160, cx + dx, travel), y = mix(cy - 115, cy + dy, travel);
  const radius = 160;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.53);
  ctx.shadowColor = '#25282267';
  ctx.shadowOffsetY = 19;
  ctx.shadowBlur = 21;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#3d4247';
  ctx.stroke();
  ctx.fillStyle = '#333941';
  ctx.beginPath();
  ctx.roundRect(radius - 1, -11, 79, 22, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(radius + 40, -21, 360, 42, [12, 20, 20, 12]);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#98a09d';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius - 6, 0, 2 * Math.PI);
  ctx.clip();
  ctx.translate(x, y);
  ctx.scale(1.57, 1.57);
  ctx.translate(-x, -y);
  folio(ctx);
  ctx.save();
  pose(ctx, s);
  stamp(ctx, s);
  ctx.restore();
  ctx.restore();

  const rim = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
  for (const [at, c] of [[0, '#646961'], [0.23, '#eff1dd'], [0.37, '#8d9898'], [0.53, '#2d343a'], [0.83, '#9b9d91'], [1, '#3b4141']]) rim.addColorStop(at, c);
  path(ctx, p => p.arc(x, y, radius, 0, 2 * Math.PI), '#38414a', 15);
  path(ctx, p => p.arc(x, y, radius, 0, 2 * Math.PI), rim, 10);
  path(ctx, p => p.arc(x, y, radius - 12, 3.45, 4.78), '#fffef1a0', 4);
}

function estimate(ctx, s, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const x = s.x + 4, w = W - 8, y = 738;
  const [a, b] = percentages(s);
  label(ctx, 'Model estimate', x, 650, 35, 'Sans', '#555859');
  label(ctx, '3¢', x, y - 24, 54, 'Serif', navy);
  label(ctx, a + '%', x + 83, y - 24, 52, 'Sans', navy);
  label(ctx, '8¢', x + w / 2 + 36, y - 24, 54, 'Serif', navy);
  label(ctx, b + '%', x + w / 2 + 119, y - 24, 52, 'Sans', navy);
  ctx.fillStyle = '#bcb5a7';
  ctx.fillRect(x, y - 9, w, 13);
  ctx.fillStyle = s.ink;
  ctx.fillRect(x, y - 9, w * s.pThree, 13);
  // The neutral tick is halfway between the two binary outcomes.
  seg(ctx, x + w / 2, y - 13, x + w / 2, y + 8, navy, 2);
  ctx.restore();
}

function tweezers(ctx, arrival, release) {
  if (release >= 1) return;
  const x = chosen.x + 0.83 * W + (1 - arrival) * 37 + release * 470;
  const y = chosen.y + 10 - (1 - arrival) * 129 - release * 223;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.43);
  const metal = ctx.createLinearGradient(0, -22, 0, 22);
  metal.addColorStop(0, '#a2a3a0');
  metal.addColorStop(0.43, '#e3e4d8');
  metal.addColorStop(1, '#6f7779');
  path(ctx, p => {
    p.moveTo(0, 3); p.quadraticCurveTo(52, -4 - release * 10, 112, -12);
    p.lineTo(440, -17); p.lineTo(440, 16); p.lineTo(116, 10);
    p.quadraticCurveTo(46, 13, 0, 8 + release * 3); p.closePath();
  }, metal, 0);
  for (let i = 0; i < 9; i++) seg(ctx, 120 + i * 7, -10, 118 + i * 7, 8, '#565b5e87', 2);
  ctx.restore();
}

function entryStroke(t) {
  // A continuous pencil stroke crosses itself once and closes both loops.
  const a = t * 2 * Math.PI;
  return [Math.sin(2 * a) * (15 + 3 * Math.cos(a)), Math.sin(a) * 28];
}
function register(ctx, s, written) {
  const x = s.x + 4, y = 848;
  label(ctx, 'Human label', x, y, 39, 'Sans', graphite);
  seg(ctx, x + 231, y + 3, x + 321, y + 3, '#706b64', 1.9);
  label(ctx, '¢', x + 345, y - 1, 38, 'Serif', graphite);
  if (written <= 0) return;
  const cx = x + 278, cy = y - 24;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.transform(1, -0.06, -0.15, 1, 0, 0);
  ctx.lineCap = 'round';
  path(ctx, p => {
    p.moveTo(...entryStroke(0));
    const steps = Math.ceil(written * 96);
    for (let j = 1; j <= steps; j++) p.lineTo(...entryStroke(written * j / steps));
  }, '#3a3b42', 4.8);
  ctx.restore();
}
function pencil(ctx, write, arrive, leave) {
  if (!arrive || leave >= 1) return;
  const [gx, gy] = entryStroke(write);
  ctx.save();
  ctx.translate(chosen.x + 282 + gx - gy * 0.15 + (1 - arrive + leave) * 635,
    824 + gy - gx * 0.06 + (1 - arrive + leave) * 246);
  ctx.rotate(0.3);
  polygon(ctx, [[0, 0], [61, -14], [490, -14], [490, 15], [61, 15]], '#b47c48');
  polygon(ctx, [[61, -14], [490, -14], [490, -3], [57, -3]], '#dfb17c');
  polygon(ctx, [[62, 6], [490, 6], [490, 15], [61, 15]], '#81563a');
  polygon(ctx, [[0, 0], [56, -13], [65, -4], [53, 3], [64, 14]], '#ebcea0');
  polygon(ctx, [[0, 0], [13, -3], [15, 3]], '#34383b');
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, seconds, elapsed, reveal } = clock;
  const arrival = ease(seconds / 1.25);
  const release = ease((seconds - 1.3) / 0.85);
  const closeUp = index === 4 ? ease(elapsed / 1.65) : index > 4 ? 1 : 0;
  const toPage = index === 5 ? ease(elapsed / 1.55) : 0;
  const wide = index === 5 ? ease(reveal('The blue stamp', 1.15)) : 0;
  const zoom = mix(mix(1 + 1.05 * closeUp, 1.55, toPage), 1, wide);
  ctx.save();
  ctx.translate((1 - zoom) * mix(1920, 1840, toPage), (1 - zoom) * mix(215, 890, toPage));
  ctx.scale(zoom, zoom);
  folio(ctx);
  for (const specimen of specimens) specimenOnPage(ctx, specimen, arrival);
  tweezers(ctx, arrival, release);
  for (const [i, specimen] of specimens.entries()) {
    const cueBeat = i + 1;
    const visible = index > cueBeat ? 1 : index < cueBeat ? 0 :
      reveal(i ? 'On the red stamp' : 'On the blue stamp', 0.45);
    estimate(ctx, specimen, visible);
  }
  let written = 0, inFrame = 0, gone = 0;
  if (index === 5) {
    inFrame = ease(elapsed / 0.7);
    written = ease(reveal('writes down', 0.92));
    gone = ease(reveal('Now we can', 0.8));
  }
  for (const specimen of specimens) register(ctx, specimen, specimen === chosen ? written : 0);
  const travel = index > 3 ? 1 : index === 3 ? ease(elapsed / 1.7) : 0;
  let dx = 0, dy = 0;
  if (index === 4) {
    const bottom = ease(reveal('another closed loop', 1.15));
    const centre = ease(reveal('What looked like', 1.2));
    dx = -14 * closeUp * (1 - centre);
    dy = mix(-20 * closeUp, 20, bottom) * (1 - centre);
  }
  if (travel) lens(ctx, chosen, travel, dx, dy);
  pencil(ctx, written, inFrame, gone);
  ctx.restore();
}

function check() {
  assert.deepEqual(specimens.map(percentages), [[97, 3], [53, 47]]);
  assert.deepEqual(specimens.map(s => Math.round(100 * margin(s))), [94, 6]);
  assert.equal(chosen.colour, 'red');
  const labels = new Map([[chosen, chosen.value]]);
  assert.deepEqual(outcomes, [3, 8]);
  assert.equal(labels.size, 1);
  assert.equal(labels.get(chosen), 8);
  assert.equal(labels.has(specimens[0]), false);
  assert.ok(chosen.pThree > 0.5 && chosen.value !== 3);
  return true;
}

export default { title: 'Which stamp needs a human label?', beats, draw, check };
