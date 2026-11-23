import assert from 'node:assert/strict';
import { reluBranchState } from '../../../films/gradients-backprop/arithmetic.mjs';

const title = 'Where the gradient loses contact';
const beats = [
  {
    id: 'daylight',
    say: 'Watch the brass pointer. The screw keeps going down. Why does the prediction stop at two seconds?',
    hold: 1.4,
  },
  {
    id: 'take-up',
    say: 'The queue accounts for those two seconds. The prompt has two blocks. Wind the weight up to two seconds per block. The screw catches the pointer and lifts it by four seconds. Six seconds in all.',
    hold: 1.1,
  },
  {
    id: 'square',
    say: 'The request actually took five seconds. Our prediction is one second high. Draw a square with that miss as its side. Its area is the loss we want to reduce.',
    hold: 0.9,
  },
  {
    id: 'contact',
    say: 'Give the screw a little turn, then bring it back. See how the pointer follows it? This stop acts like a ReLU. Above zero, every bit of lift passes through.',
    hold: 0.8,
  },
  {
    id: 'back-through-brass',
    say: 'Backprop works from the loss back to the weight. The slope of a squared error is twice the error. Here that gives two. The ReLU passes it through with a slope of one. Multiply by the two prompt blocks and the gradient at this weight is four.',
    hold: 1.1,
  },
  {
    id: 'release',
    say: 'Ease it down to five seconds. The square disappears. Now wind the screw past the stop. The model gives the prompt zero seconds. Only the two seconds from the queue remain. Three seconds short. Count the squares.',
    hold: 1,
  },
  {
    id: 'back-through-air',
    say: 'Work back from that miss. Twice minus three gives minus six at the prediction. Down here the ReLU has a slope of zero. Multiply the slopes along this path and the prompt weight gets a gradient of zero.',
    hold: 1.1,
  },
  {
    id: 'clearance',
    say: 'Try the same little turn again. The gap gets narrower. All nine squares are still there.',
    hold: 2.6,
  },
];

const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => clamp(x) ** 2 * (3 - 2 * clamp(x));
const lerp = (a, b, t) => a + (b - a) * t;
const atRest = -0.5;
const engaged = 2;
const testTurn = 0.25;
const restY = 668;
const pitch = 82;
const queueSeconds = reluBranchState(atRest).prediction;
const observedSeconds = 5;
const fit = (observedSeconds - queueSeconds) / 2;
const dialY = seconds => restY - (seconds - queueSeconds) * pitch;

function setting(clock) {
  const { index, elapsed, reveal } = clock;
  switch (index) {
    case 0: return lerp(0.84, atRest, smooth(elapsed / 2.5));
    case 1: return lerp(atRest, engaged, smooth(reveal('Wind the weight up', 3.6)));
    case 3: return engaged + testTurn * (smooth(reveal('Give the screw', 0.9)) - smooth(reveal('bring it back', 0.9)));
    case 5: return lerp(engaged, fit, smooth(reveal('down to five seconds', 1.2)))
      + (atRest - fit) * smooth(reveal('Now wind the screw', 3.4));
    case 7: return atRest + testTurn * smooth(reveal('Try the same little turn', 1.45));
    default: return index > 4 ? atRest : engaged;
  }
}

function metal(ctx, x1, y1, x2, y2, stops) {
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [pos, color] of stops) grad.addColorStop(pos, color);
  return grad;
}

function polygon(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function rule(ctx, x1, y1, x2, y2, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function type(ctx, text, x, y, size, color, face = 'Sans', align = 'left') {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.font = size + 'px "Lesson ' + face + '"';
  ctx.fillText(text, x, y);
}

function number(v, decimals = 2) {
  return String(Number(v.toFixed(decimals))).replace('-', '−');
}

function screwHead(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = metal(ctx, x - r, y - r, x + r, y + r, [
    [0, '#e4cba0'], [0.3, '#a08b63'], [0.7, '#5a5143'], [1, '#2c312e'],
  ]);
  ctx.fill();
  rule(ctx, x - r * 0.65, y + r * 0.32, x + r * 0.65, y - r * 0.32, '#30312c', r * 0.25);
}

// The guides and the two polished shoulders belong to the fixed casting.
function casting(ctx) {
  const wash = ctx.createRadialGradient(690, 460, 24, 960, 480, 1120);
  wash.addColorStop(0, '#374841');
  wash.addColorStop(0.68, '#223530');
  wash.addColorStop(1, '#10201f');
  rect(ctx, -480, -200, 2900, 1550, wash);

  const cavity = metal(ctx, 0, 279, 0, 906, [[0, '#132624'], [0.7, '#182f2c'], [1, '#122320']]);
  polygon(ctx, [[390, 900], [390, 290], [420, 245], [964, 245], [1004, 290], [1004, 900]], cavity);
  rule(ctx, 419, 246, 963, 246, '#0b1918', 5);
  rule(ctx, 1004, 291, 1004, 835, '#53645b', 2);

  for (const x of [482, 904]) {
    const chrome = metal(ctx, x - 15, 0, x + 15, 0, [
      [0, '#384c47'], [0.25, '#81948a'], [0.43, '#c6ccc0'], [0.51, '#8e9c91'], [1, '#293e39'],
    ]);
    rect(ctx, x - 15, 242, 30, restY - 238, chrome);
    rect(ctx, x - 15, 242, 30, 3, '#c6cdc0');
  }

  const castingFace = metal(ctx, 0, restY, 0, 890, [[0, '#576961'], [0.12, '#344c45'], [1, '#293d36']]);
  for (const x of [402, 863]) {
    polygon(ctx, [[x, restY], [x + 110, restY], [x + 110, restY + 44], [x + 84, restY + 72],
      [x + 84, 859], [x + 14, 859], [x + 14, restY + 61], [x, restY + 46]], castingFace);
    rect(ctx, x - 3, restY, 115, 13, '#9ba89c');
    rect(ctx, x - 3, restY, 115, 4, '#d2d7c6');
    screwHead(ctx, x + 49, restY + 44, 9);
  }

  polygon(ctx, [[348, 859], [373, 836], [1001, 836], [1029, 859], [1029, 913], [348, 913]], castingFace);
  rule(ctx, 351, 859, 1026, 859, '#789082', 3);
  rule(ctx, 348, 915, 1029, 915, '#12241f', 8);
  screwHead(ctx, 387, 882, 11);
  screwHead(ctx, 985, 882, 11);
}

function spindle(ctx, state) {
  const x = 682;
  const y = restY - state.h * pitch;
  const copper = metal(ctx, x - 39, 0, x + 39, 0, [
    [0, '#623f32'], [0.12, '#ae6b4b'], [0.38, '#f6ba8b'], [0.57, '#d39169'], [1, '#734830'],
  ]);
  rect(ctx, x - 36, y + 17, 72, 829 - y, copper);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 36, y + 23, 72, 811 - y);
  ctx.clip();
  for (let row = y + 25; row < 859; row += 16) {
    rule(ctx, x - 38, row + 11, x + 38, row - 5, '#8c573d', 5);
    rule(ctx, x - 38, row + 14, x + 38, row - 2, '#f3b287', 2);
  }
  ctx.restore();
  polygon(ctx, [[x - 77, y], [x + 77, y], [x + 77, y + 17], [x + 41, y + 34], [x - 41, y + 34],
    [x - 77, y + 17]], metal(ctx, x - 77, 0, x + 77, 0, [[0, '#a2674b'], [0.38, '#e9a879'], [1, '#985c44']]));
  rect(ctx, x - 77, y, 154, 5, '#ffd2a5');

  // The knurls move with screw travel and come to rest with the handwheel.
  const wheel = metal(ctx, x - 169, 0, x + 169, 0, [
    [0, '#594437'], [0.18, '#ba8560'], [0.44, '#dda67c'], [0.82, '#a56f51'], [1, '#513b31'],
  ]);
  ctx.fillStyle = wheel;
  ctx.beginPath();
  ctx.roundRect(x - 169, 831, 338, 55, 8);
  ctx.fill();
  for (let i = 0; i < 46; i++) {
    const angle = i * 2 * Math.PI / 46 + state.weight * 2.1;
    if (Math.cos(angle) > 0) {
      const gx = x + 164 * Math.sin(angle);
      rule(ctx, gx, 839, gx - 2.5 * Math.cos(angle), 877, '#785640', 3 * Math.cos(angle));
    }
  }
  rule(ctx, x - 161, 834, x + 161, 834, '#efbb90', 3);
}

function pointer(ctx, bottom) {
  const underArm = metal(ctx, 0, bottom, 0, bottom + 29, [[0, '#0b19187a'], [1, '#0b191800']]);
  rect(ctx, 428, bottom, 520, 29, underArm);
  const brass = metal(ctx, 0, bottom - 80, 0, bottom, [
    [0, '#fcdf9b'], [0.09, '#dbc185'], [0.4, '#ceae70'], [0.78, '#b99457'], [1, '#9e7948'],
  ]);
  polygon(ctx, [[418, bottom - 79], [953, bottom - 79], [985, bottom - 51],
    [1135, bottom - 51], [1222, bottom], [967, bottom - 11], [947, bottom], [418, bottom]], brass);
  rule(ctx, 419, bottom - 78, 951, bottom - 78, '#ffedb5', 4);
  rule(ctx, 420, bottom - 3, 946, bottom - 3, '#826840', 3);
  type(ctx, 'Prediction', 681, bottom - 23, 43, '#382e23', 'Serif', 'center');
  screwHead(ctx, 460, bottom - 40, 12);
  screwHead(ctx, 908, bottom - 40, 12);
}

function scale(ctx) {
  type(ctx, 'Seconds', 1225, 202, 37, '#dce1d4', 'Serif');
  for (let i = 0; i <= 28; i++) {
    const y = dialY(i / 4);
    const major = i % 4 === 0;
    const half = i % 2 === 0;
    rule(ctx, 1228, y, 1228 + (major ? 46 : half ? 27 : 13), y, major ? '#bec8b7' : '#77877c', major ? 3 : 2);
    if (major) type(ctx, String(i / 4), 1292, y + 12, 37, '#d7dfce', 'Mono');
  }
  rule(ctx, 1226, dialY(7), 1226, dialY(0), '#869586', 2);
}

function weightLabel(ctx, weight, visibility) {
  ctx.save();
  ctx.globalAlpha *= visibility;
  type(ctx, 'Prompt weight', 139, 719, 36, '#e4d2bd', 'Serif');
  type(ctx, number(weight), 139, 785, 62, '#f4bf96', 'Mono');
  type(ctx, 's per block', 142, 830, 31, '#dfceba');
  rule(ctx, 144, 855, 309, 855, '#ac8e70');
  rule(ctx, 309, 855, 335, 876, '#ac8e70');
  rule(ctx, 335, 876, 369, 876, '#ac8e70');
  ctx.restore();
}

function lossSquare(ctx, state, actualAlpha, sweep) {
  const pinX = 1402;
  const targetY = dialY(observedSeconds);
  const predictionY = dialY(state.prediction);
  const side = Math.abs(predictionY - targetY);
  const top = Math.min(predictionY, targetY);
  const dir = Math.sign(predictionY - targetY);
  ctx.save();
  ctx.globalAlpha *= actualAlpha;
  rule(ctx, 1227, targetY, 1274, targetY, '#a9ddc3', 6);
  rule(ctx, 1344, targetY, 1811, targetY, '#a0cbb5', 3);
  type(ctx, 'Actual 5 s', 1811, targetY - 15, 36, '#c2e5cc', 'Serif', 'right');
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= clamp(sweep * 5);
  const unfold = smooth((sweep - 0.55) / 0.45);
  const extent = side * unfold;
  const rounded = Math.abs(Number(state.loss.toFixed(2)) - state.loss) > 1e-8;
  ctx.save();
  ctx.globalAlpha *= unfold;
  type(ctx, 'Squared error', pinX, 178, 33, '#e5d0b8');
  type(ctx, (rounded ? '≈ ' : '') + number(state.loss) + ' s²', pinX, 247, 68, '#f6cca3', 'Serif');
  ctx.restore();
  if (side > 0.01 && sweep > 0) {
    rect(ctx, pinX, top, extent, side, '#bd8866');
    for (let d = pitch; d < side - 0.01; d += pitch) {
      if (d < extent) rule(ctx, pinX + d, top, pinX + d, top + side, '#593e31', 3);
      rule(ctx, pinX, targetY + dir * d, pinX + extent, targetY + dir * d, '#593e31', 3);
    }
    ctx.strokeStyle = '#f3c99f';
    ctx.lineWidth = 3;
    ctx.strokeRect(pinX, top, extent, side);
    if (sweep < 1) {
      const angle = smooth(sweep / 0.55) * Math.PI / 2;
      rule(ctx, pinX, targetY, pinX + side * Math.sin(angle), targetY + dir * side * Math.cos(angle), '#f5dbaf', 5);
    }
  }
  ctx.setLineDash([5, 7]);
  rule(ctx, 1344, predictionY, pinX, predictionY, '#e4c596', 2);
  ctx.restore();
}

function reversePass(ctx, clock, state) {
  const { index, reveal } = clock;
  let visibility, ink;
  if (index === 4) {
    visibility = reveal('Backprop works');
    ink = ['Here that gives two', 'slope of one', 'two prompt blocks', 'is four'].map(s => reveal(s));
  } else if (index === 5) {
    visibility = 1 - reveal('Ease it down', 0.36);
    ink = [1, 1, 1, 1];
  } else if (index === 6) {
    visibility = reveal('Work back');
    ink = ['gives minus six', 'slope of zero', 'Multiply the slopes', 'gradient of zero'].map(s => reveal(s));
  } else if (index === 7) {
    visibility = 1;
    ink = [1, 1, 1, 1];
  } else {
    return;
  }
  ctx.save();
  ctx.globalAlpha *= visibility;
  type(ctx, 'Loss gradient at the prompt weight', 190, 102, 36, '#e1e6d8', 'Serif');
  const values = [number(state.signal), number(state.gate), '2', number(state.promptGradient)];
  const x = [273, 486, 686, 907];
  const labels = ['loss slope', 'ReLU', 'blocks', 'gradient'];
  for (let i = 0; i < values.length; i++) {
    ctx.save();
    ctx.globalAlpha *= ink[i];
    if (i > 0) type(ctx, i === 3 ? '=' : '×', (x[i] + x[i - 1]) / 2, 175, 43, '#a3b1a4', 'Serif', 'center');
    type(ctx, values[i], x[i], 180, 65, i === 3 ? '#ffd3a7' : '#f3e8cf', 'Mono', 'center');
    type(ctx, labels[i], x[i], 221, 29, '#c0cebf', 'Sans', 'center');
    ctx.restore();
  }
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const state = reluBranchState(setting(clock));
  const pullback = index === 0 ? 0 : index === 1 ? smooth(elapsed / 2.25) : 1;
  const zoom = lerp(1.32, 1, pullback);
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(zoom, zoom);
  ctx.translate(-lerp(872, 960, pullback), -lerp(555, 540, pullback));
  casting(ctx);
  scale(ctx);
  weightLabel(ctx, state.weight, pullback);
  spindle(ctx, state);
  pointer(ctx, restY - state.z * pitch);
  const actualAlpha = index < 2 ? 0 : index === 2 ? reveal('actually took five seconds') : 1;
  const sweep = index < 2 ? 0 : index === 2 ? reveal('Draw a square', 1.8) : 1;
  lossSquare(ctx, state, actualAlpha, sweep);
  reversePass(ctx, clock, state);
  ctx.restore();
}

function check() {
  const high = reluBranchState(engaged);
  const low = reluBranchState(atRest);
  assert.deepEqual([high.h, high.prediction, high.loss, high.signal, high.promptGradient], [4, 6, 1, 2, 4]);
  assert.deepEqual([low.h, low.prediction, low.loss, low.signal], [-1, 2, 9, -6]);
  assert.ok(low.promptGradient === 0);
  assert.equal(reluBranchState(fit).loss, 0);
  for (const weight of [atRest, atRest + testTurn, engaged, engaged + testTurn]) {
    const state = reluBranchState(weight);
    const eps = 0.00001;
    const slope = (reluBranchState(weight + eps).loss - reluBranchState(weight - eps).loss) / (2 * eps);
    assert.ok(Math.abs(slope - state.promptGradient) < 1e-7);
    assert.equal((dialY(state.prediction) - dialY(observedSeconds)) ** 2 / pitch ** 2, state.loss);
  }
  const loose = reluBranchState(atRest + testTurn);
  assert.equal(loose.z, low.z);
  assert.ok(loose.h > low.h && loose.h < 0);
  assert.equal(reluBranchState(engaged + testTurn).prediction - high.prediction, testTurn * 2);
  return true;
}

export default { title, beats, draw, check };
