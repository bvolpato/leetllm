import assert from 'node:assert/strict';
import { acceptedTaskCost } from '../../../films/token-economics/arithmetic.mjs';
import { priceMicroDollars, standard } from '../../../films/token-economics/fixtures.mjs';

const beats = [
  {
    id: 'first-class',
    say: 'Two answers to the same refund question. Each stamp pays for one model call. The shorter answer gets the smaller stamp. Its width shows what that call cost.',
    hold: 1,
  },
  {
    id: 'the-denomination',
    say: 'Both calls read the same prompt. See the bird on each stamp? That much pays for the input. The rest pays for writing the answer. We cut ninety output tokens. At fifteen dollars per million in this example, that saves just over a tenth of a cent per call.',
    hold: 1.2,
  },
  {
    id: 'two-customers',
    say: 'Now try each reply on the same two refund cases. With the longer reply, customer A gets an answer they can use. So does B. Two calls close both cases.',
    hold: 1,
  },
  {
    id: 'undelivered',
    say: 'Follow the red stamps. A gets their refund question settled on the first try. Look at the mark on the next stamp. B still needs an answer. We paid the model for that first attempt.',
    hold: 1.2,
  },
  {
    id: 'one-more-call',
    say: 'Find the end of the blue strip. Where will the red one end if we try B again?',
    hold: 2.1,
  },
  {
    id: 'second-delivery',
    say: 'There goes the retry. This time the answer closes B. Count the customers on that red strip. Three stamps bought answers for just two people.',
    hold: 1.5,
  },
  {
    id: 'cost-to-close',
    say: 'Divide the price of each strip by the two cases it closed. In this run, the longer reply cost about six tenths of a cent per closed case. The shorter one cost closer to seven tenths. The extra stamp made the difference.',
    hold: 3.2,
  },
];

const longTokens = 220;
const shortTokens = 130;
const inputTokens = 2200;
const cacheReads = 1280;
const price = (outputs) => priceMicroDollars(inputTokens, cacheReads, outputs, standard);
const inputCost = price(0);
const longCost = price(longTokens);
const shortCost = price(shortTokens);
const cents = (micro) => (micro / 10000).toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + '¢';
const longCalls = [
  { task: 'A', accepted: true, costMicro: longCost },
  { task: 'B', accepted: true, costMicro: longCost },
];
const shortCalls = [
  { task: 'A', accepted: true, costMicro: shortCost },
  { task: 'B', accepted: false, costMicro: shortCost },
  { task: 'B', accepted: true, costMicro: shortCost },
];
const rows = [
  { label: 'Long reply', tokens: longTokens, calls: longCalls, y: 302, ink: '#244783' },
  { label: 'Short reply', tokens: shortTokens, calls: shortCalls, y: 629, ink: '#aa372b' },
];
const units = 0.083;
const stripX = 463;
const stampH = 186;
const pencil = '#383240';
const sheet = '#fff8e9';
const mix = (a, b, t) => a + (b - a) * t;
const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (n) => { const t = clamp(n); return t * t * (3 - 2 * t); };

function check() {
  assert.equal(inputCost, 2620);
  assert.deepEqual([longCost, shortCost, longCost - shortCost], [5920, 4570, 1350]);
  assert.equal(longTokens - shortTokens, 90);
  assert.equal((longTokens - shortTokens) * standard.output, longCost - shortCost);
  const long = acceptedTaskCost(longCalls);
  const short = acceptedTaskCost(shortCalls);
  assert.equal(acceptedTaskCost(shortCalls.slice(0, 2)).accepted, 1);
  assert.equal(long.accepted, 2);
  assert.equal(short.accepted, 2);
  assert.deepEqual([long.spend, short.spend], [11840, 13710]);
  assert.equal(cents(long.costPerAccepted), '0.592¢');
  assert.equal(cents(short.costPerAccepted), '0.6855¢');
  assert(2 * shortCost * units < long.spend * units && short.spend * units > long.spend * units);
  return true;
}

function label(c, value, x, y, size, color = pencil, face = 'Sans', weight = '400', align = 'left') {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(value, x, y);
}

function line(c, x1, y1, x2, y2, color, width = 2) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
}

function polygon(c, points, color) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

function shadow(c, opacity, blur, dy) {
  c.shadowColor = 'rgba(43,25,45,' + opacity + ')';
  c.shadowBlur = blur;
  c.shadowOffsetY = dy;
}

// Fixed paper fibers stay in registration as the camera moves.
const fibers = Array.from({ length: 1050 }, (_, i) => ({
  x: 70 + ((i * 137 + (i * i * 13) % 811) % 1778),
  y: 65 + ((i * 367 + (i * i * 7) % 673) % 889),
  length: 1 + (i % 5),
}));

function paper(c) {
  c.save();
  c.translate(961, 530);
  c.rotate(-0.017);
  shadow(c, 0.24, 27, 18);
  c.fillStyle = '#e0c8b7';
  c.fillRect(-888, -452, 1776, 904);
  c.restore();

  c.save();
  shadow(c, 0.27, 19, 9);
  c.fillStyle = sheet;
  c.fillRect(57, 53, 1806, 913);
  c.restore();
  const glaze = c.createLinearGradient(100, 50, 1880, 960);
  glaze.addColorStop(0, '#fff9ec');
  glaze.addColorStop(0.6, '#f8f0de');
  glaze.addColorStop(1, '#e9dec8');
  c.fillStyle = glaze;
  c.fillRect(57, 53, 1806, 913);
  c.save();
  c.beginPath();
  c.rect(58, 54, 1804, 911);
  c.clip();
  for (let i = -1; i < 34; i++) {
    const x = 58 + i * 61;
    const ink = i % 2 === 0 ? '#b86459' : '#6c83a6';
    polygon(c, [[x, 54], [x+34, 54], [x+20, 71], [x-14, 71]], ink);
    polygon(c, [[x, 948], [x+34, 948], [x+20, 966], [x-14, 966]], ink);
  }
  c.restore();
  c.strokeStyle = 'rgba(86,60,44,0.11)';
  c.lineWidth = 1.2;
  c.beginPath();
  for (const f of fibers) {
    c.moveTo(f.x, f.y);
    c.lineTo(f.x + f.length, f.y - 0.4);
  }
  c.stroke();

  label(c, 'Refund correspondence', 135, 184, 76, '#343a50', 'Serif', 'italic');
  line(c, 139, 209, 1774, 209, '#b8a995', 1.8);
  line(c, 139, 214, 1774, 214, '#d1c3ac', 1);
}

function requestEnvelope(c, leave) {
  if (leave === 1) return;
  c.save();
  c.translate(1000 + 1200 * leave, 381 - 102 * leave);
  c.rotate(0.072 + 0.15 * leave);
  shadow(c, 0.25, 21, 13);
  c.fillStyle = '#dfada3';
  c.fillRect(8, 30, 536, 300);
  shadow(c, 0, 0, 0);
  polygon(c, [[8,30],[275,195],[544,30]], '#edbfb2');
  line(c, 8, 330, 207, 163, '#c18e88');
  line(c, 544, 330, 341, 161, '#c18e88');
  c.rotate(-0.118);
  shadow(c, 0.19, 12, 7);
  c.fillStyle = '#fffdf4';
  c.fillRect(0, 0, 476, 216);
  shadow(c, 0, 0, 0);
  label(c, 'CUSTOMER MAIL', 30, 44, 23, '#786d69', 'Mono');
  label(c, 'Can I return', 30, 116, 56, pencil, 'Serif', 'italic');
  label(c, 'this order?', 30, 177, 56, pencil, 'Serif', 'italic');
  c.restore();
}

function perforations(c, w, h) {
  const nx = Math.round(w / 21), ny = Math.round(h / 21), r = 4.6;
  c.beginPath();
  c.moveTo(0, 0);
  for (let i=0; i<nx; i++) c.arc((i+.5)*w/nx, 0, r, Math.PI, 0, true);
  c.lineTo(w, 0);
  for (let i=0; i<ny; i++) c.arc(w, (i+.5)*h/ny, r, -Math.PI/2, Math.PI/2, true);
  c.lineTo(w, h);
  for (let i=nx-1; i>=0; i--) c.arc((i+.5)*w/nx, h, r, 0, Math.PI, true);
  c.lineTo(0, h);
  for (let i=ny-1; i>=0; i--) c.arc(0, (i+.5)*h/ny, r, Math.PI/2, -Math.PI/2, true);
  c.closePath();
}

// The bird is a two-color engraving. The wing, primary feathers and letter
// share the same printing plate on both denominations.
function postBird(c, ink) {
  const ivory = '#fff4da';
  c.fillStyle = ivory;
  c.strokeStyle = ink;
  c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(48, 97);
  c.bezierCurveTo(65, 89, 77, 84, 86, 78);
  c.bezierCurveTo(71, 66, 48, 41, 26, 23);
  c.bezierCurveTo(46, 28, 70, 38, 93, 48);
  c.bezierCurveTo(83, 36, 75, 28, 68, 16);
  c.bezierCurveTo(100, 29, 123, 49, 136, 68);
  c.bezierCurveTo(146, 67, 149, 60, 160, 60);
  c.bezierCurveTo(173, 58, 176, 63, 179, 68);
  c.lineTo(194, 71);
  c.lineTo(177, 77);
  c.bezierCurveTo(172, 91, 154, 99, 142, 100);
  c.bezierCurveTo(118, 110, 94, 106, 78, 105);
  c.lineTo(34, 132);
  c.lineTo(46, 111);
  c.lineTo(15, 119);
  c.closePath();
  c.fill();
  c.stroke();
  c.beginPath();
  for (let i=0; i<7; i++) {
    c.moveTo(34 + i*6.7, 28 + i*4);
    c.quadraticCurveTo(76+i*3, 72+i*1.5, 112+i*2.2, 80-i*1.7);
  }
  for (let i=0; i<5; i++) {
    c.moveTo(76+i*5.5, 23+i*4);
    c.quadraticCurveTo(108+i*2, 55, 135+i, 70+i*1.6);
  }
  c.moveTo(37, 121);
  c.quadraticCurveTo(68, 106, 90, 97);
  c.moveTo(99, 93);
  c.quadraticCurveTo(124, 104, 153, 89);
  c.moveTo(147, 78);
  c.quadraticCurveTo(154, 82, 166, 78);
  c.stroke();
  c.fillStyle = ink;
  c.beginPath();
  c.arc(169, 68, 3.1, 0, 2*Math.PI);
  c.fill();

  c.save();
  c.translate(150, 110);
  c.rotate(-0.2);
  line(c, 1, -9, 24, -33, ivory, 2);
  c.fillStyle = ivory;
  c.fillRect(-19, -10, 41, 26);
  c.strokeRect(-19, -10, 41, 26);
  line(c, -18, -9, 1, 5, ink, 1.8);
  line(c, 1, 5, 21, -9, ink, 1.8);
  c.restore();
}

function stampFace(c, cost, ink) {
  const w = cost * units;
  const split = inputCost * units;
  perforations(c, w, stampH);
  c.fillStyle = '#fffbec';
  c.fill();
  c.save();
  c.clip();
  c.strokeStyle = '#d0c2a7';
  c.lineWidth = 1.5;
  c.stroke();
  c.fillStyle = ink;
  c.fillRect(11, 10, w-22, stampH-20);
  c.fillStyle = '#fbedd7';
  c.fillRect(split, 15, w-split-16, stampH-30);
  c.save();
  c.beginPath();
  c.rect(16, 16, split-23, stampH-32);
  c.clip();
  c.strokeStyle = 'rgba(255,240,208,.36)';
  c.lineWidth = 1.1;
  c.beginPath();
  for (let j=-6; j<33; j++) {
    c.moveTo(10, j*6);
    c.bezierCurveTo(64, j*6-30, 145, j*6+38, split, j*6+1);
  }
  c.stroke();
  c.translate(20, 7);
  c.scale(0.93, 0.93);
  postBird(c, ink);
  c.restore();

  c.strokeStyle = '#fff1d5';
  c.lineWidth = 2;
  c.strokeRect(18, 17, split-26, stampH-34);
  const rx = split+9, rw = w-rx-23, cx = rx+rw/2;
  c.strokeStyle = ink;
  c.strokeRect(rx, 22, rw, stampH-44);
  c.save();
  c.beginPath();
  c.rect(rx+2, 24, rw-4, stampH-48);
  c.clip();
  c.strokeStyle = ink;
  c.lineWidth = 0.8;
  for (let j=-3; j<9; j++) {
    c.beginPath();
    c.ellipse(cx, 92, rw*0.78+j*6, 59+j*4.4, 0, 0, 2*Math.PI);
    c.stroke();
  }
  // The engraved envelope belongs to the output half of the plate.
  c.translate(cx, 78);
  c.rotate(-0.10);
  c.fillStyle='#fbedd7';
  c.fillRect(-44,-27,88,54);
  c.strokeStyle = ink;
  c.lineWidth = 3.3;
  c.strokeRect(-44,-27,88,54);
  line(c,-43,-26,0,5,ink,3);
  line(c,0,5,43,-26,ink,3);
  line(c,-42,25,-10,-1,ink,1.8);
  line(c,42,25,10,-1,ink,1.8);
  c.restore();

  // The denomination crosses the seam because it buys both pieces of work.
  c.fillStyle = '#fff3d9';
  c.fillRect(17, 126, w-34, 43);
  line(c, 18, 126, w-18, 126, ink, 2);
  const priceText = cents(cost);
  c.font = '600 49px "Lesson Serif"';
  const amountWidth = c.measureText(priceText).width;
  const denominationX = (w - amountWidth - 99) / 2;
  label(c, priceText, denominationX, 164, 49, ink, 'Serif', '600');
  label(c, 'PER CALL', denominationX + amountWidth+12, 158, 19, ink, 'Sans', '700');
  c.restore();
}

function placeStamp(c, x, y, cost, ink, arrival, first = false) {
  if (arrival <= 0 && !first) return;
  const open = ease(arrival);
  const away = 1-open;
  c.save();
  c.translate(x, y);
  if (first) {
    c.translate(255*away, -85*away);
    c.rotate(0.18*away);
    c.scale(1+0.08*away, 1+0.08*away);
  } else if (away > 0) {
    // Peel the next stamp open along the preceding stamp's perforations.
    // Its free edge passes the comparison mark before it settles flat.
    const angle = away*Math.PI/2;
    c.transform(Math.cos(angle), -0.15*Math.sin(angle), 0, 1, 0, 0);
  }
  shadow(c, 0.2 + 0.07*away, 2+18*away, 2+14*away);
  perforations(c, cost*units, stampH);
  c.fillStyle='#fff6de';
  c.fill();
  shadow(c, 0, 0, 0);
  stampFace(c, cost, ink);
  c.restore();
}

function cancellation(c, x, y, receipt, progress) {
  if (!progress) return;
  c.save();
  c.globalAlpha = clamp(progress*2.3);
  c.translate(x+19, y+stampH+21);
  c.rotate(receipt.accepted ? -0.038 : 0.032);
  const swell = 1 + 0.09 * (1-ease(progress));
  c.scale(swell, swell);
  const color = receipt.accepted ? '#35354a' : '#a42c25';
  c.strokeStyle = color;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(38, 4, 37, 0, Math.PI*2);
  c.stroke();
  c.lineWidth = 1;
  c.beginPath();
  c.arc(38, 4, 32, 0, Math.PI*2);
  c.stroke();
  label(c, receipt.task, 38, 20, 50, color, 'Serif', '600', 'center');
  label(c, receipt.accepted ? 'CLOSED' : 'OPEN', 88, 18, 38, color, 'Sans', '700');
  const length = receipt.accepted ? 162 : 116;
  line(c, 86, -19, 86+length, -19, color, 2);
  line(c, 86, 27, 86+length, 27, color, 2);
  c.restore();
}

function bracket(c, x, y, w, value) {
  line(c, x, y, x+w, y, '#726e73', 1.8);
  line(c, x, y, x, y+12, '#726e73', 1.8);
  line(c, x+w, y, x+w, y+12, '#726e73', 1.8);
  label(c, value, x+w/2, y-10, 27, pencil, 'Sans', '600', 'center');
}

function cue(clock, index, phrase, seconds) {
  if (clock.index < index) return 0;
  if (clock.index > index) return 1;
  return clock.reveal(phrase, seconds);
}

function draw(c, clock) {
  const spread = ease(cue(clock, 2, 'Now try', 1.45));
  const settling = ease(clamp(clock.seconds/1.8));
  c.fillStyle = '#afa5c3';
  c.fillRect(0, 0, 1920, 1080);
  c.save();
  const zoom = mix(1.34, 1, spread);
  c.scale(zoom, zoom);
  c.translate(-mix(57, 0, spread), -mix(96, 0, spread));
  const desk = c.createLinearGradient(0, 0, 1960, 1130);
  desk.addColorStop(0, '#d0c6d7');
  desk.addColorStop(0.55, '#aea1bc');
  desk.addColorStop(1, '#96859d');
  c.fillStyle = desk;
  c.fillRect(-200, -200, 2400, 1500);
  paper(c);

  const prices = ease(cue(clock, 1, 'Both calls', 0.55)) * (1-spread);
  const blueB = cue(clock, 2, 'So does B', 0.59);
  const redB = cue(clock, 3, 'Look at the mark', 0.62);
  const retry = cue(clock, 5, 'There goes the retry', 1.05);
  const arrivals = [[1, blueB], [settling, redB, retry]];
  const marks = [
    [cue(clock, 2, 'customer A', 0.36), ease(clamp((blueB-0.76)/0.24))],
    [cue(clock, 3, 'Follow the red stamps', 0.35), ease(clamp((redB-0.76)/0.24)), cue(clock, 5, 'This time', 0.37)],
  ];
  const reference = ease(cue(clock, 4, 'Find the end', 0.75));
  if (reference > 0) {
    const x = stripX + 2*longCost*units;
    c.save();
    c.globalAlpha = reference;
    c.strokeStyle = '#655c68';
    c.setLineDash([6,7]);
    line(c, x, rows[0].y+stampH+8, x, rows[1].y+stampH+19, '#655c68', 2.5);
    c.restore();
    c.save();
    c.globalAlpha = reference;
    polygon(c, [[x-6, rows[1].y+stampH+24], [x, rows[1].y+stampH+13], [x+6, rows[1].y+stampH+24]], pencil);
    c.restore();
  }

  rows.forEach((row, r) => {
    const cost = row.calls[0].costMicro;
    const w = cost*units;
    label(c, row.label, 137, row.y+92, 57, row.ink, 'Serif');
    label(c, row.tokens+' output tokens', 140, row.y+144, 29, pencil, 'Sans');
    row.calls.forEach((receipt,i) => {
      const x = stripX+i*w;
      placeStamp(c, x, row.y, cost, row.ink, arrivals[r][i], r===1 && i===0);
      cancellation(c, x, row.y, receipt, marks[r][i]);
    });
    if (prices > 0) {
      c.save();
      c.globalAlpha = prices;
      bracket(c, stripX+3, row.y-9, inputCost*units-6, 'Input');
      bracket(c, stripX+inputCost*units+3, row.y-9, (cost-inputCost)*units-6, 'Output');
      c.restore();
    }
    const total = ease(cue(clock, 6, 'Divide the price', 0.74));
    if (total > 0) {
      const result = acceptedTaskCost(row.calls);
      c.save();
      c.globalAlpha = total;
      const text = cents(result.spend)+' ÷ '+result.accepted+' = '+cents(result.costPerAccepted)+' per closed case';
      label(c, text, stripX, row.y-21, 57, row.ink, 'Serif', '600');
      c.restore();
    }
  });
  requestEnvelope(c, spread);
  c.restore();
}

export default { title: 'The price of one more reply', beats, draw, check };
