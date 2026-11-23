import assert from 'node:assert/strict';
import { queueAdmission } from '../../../films/ai-lab-system-design-interview/model.mjs';

const rate = 125_000;
const limit = 0.25;
const curlTokens = 10_000;
const curlMs = (1000 * curlTokens) / rate;

function arrival(id, a, b) {
  const decision = queueAdmission(a + b, rate, limit);
  return {
    id, a, b,
    curls: (a + b) / curlTokens,
    waitMs: 1000 * decision.estimatedWait,
    admitted: decision.admitted,
    response: decision.admitted ? 'Admit' : '503',
  };
}

const first = arrival('R-104', 10_000, 10_000);
const second = arrival('R-105', 10_000, 40_000);

const beats = [
  {
    id: 'next-turn',
    say: "A has the GPU. B gets the next turn. In this design interview, you've got one worker. Where on its schedule could you put our request?",
    hold: 0.9,
  },
  {
    id: 'one-curl',
    say: "Each curl is ten thousand tokens of work left when we arrive. Assume the worker processes a hundred and twenty-five thousand tokens a second. That's eighty milliseconds for each curl of the pen.",
    hold: 0.7,
  },
  {
    id: 'a-turn-that-fits',
    say: "Our turn comes at a hundred and sixty milliseconds. The gateway allows two hundred and fifty milliseconds just for waiting. There's room. It can let this request join the queue.",
    hold: 1.1,
  },
  {
    id: 'change-b',
    say: "Try another arrival. Same caller, still under quota. Same two jobs ahead. Watch what happens if B has forty thousand tokens left this time.",
    hold: 1.1,
  },
  {
    id: 'find-the-start',
    say: "Put your finger where our request could start. Now find the queue limit. The gateway has to decide while A still has the worker.",
    hold: 1.4,
  },
  {
    id: 'return-to-caller',
    say: "Four hundred milliseconds of waiting, before the worker even touches our prompt. The gateway turns the request away. A and B keep their places.",
    hold: 0.9,
  },
  {
    id: 'which-limit',
    say: "Five oh three means shared overload at this gateway. Four twenty-nine is for a caller who's used up their quota. Look up this request ID and you can see which limit it hit.",
    hold: 2.5,
  },
];

const ink = '#253047';
const blue = '#1749b5';
const violet = '#733b95';
const coral = '#b63f26';
const startX = 220;
const baseY = 530;
const step = 254;
const toX = ms => startX + (ms / curlMs) * step;
const clamp = n => Math.min(1, Math.max(0, n));
const smooth = n => clamp(n) ** 2 * (3 - 2 * clamp(n));

function path(ctx, data, fill, stroke, width = 2) {
  ctx.beginPath();
  for (const [op, ...v] of data) ctx[op](...v);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function shape(ctx, points, fill) {
  path(ctx, points.map(([x, y], i) => [i ? 'lineTo' : 'moveTo', x, y]), fill);
}

function line(ctx, x, y, ex, ey, color, width) {
  path(ctx, [['moveTo', x, y], ['lineTo', ex, ey]], null, color, width);
}

function roundBox(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function words(ctx, value, x, y, size, color = ink, options = {}) {
  const { align = 'left', family = 'Sans', weight = 500, italic = false } = options;
  ctx.save();
  ctx.translate(x, y);
  if (italic) ctx.transform(1, 0, -0.085, 1, 0, 0);
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(value, 0, 0);
  ctx.restore();
}

function faded(ctx, opacity, draw) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(opacity);
  draw();
  ctx.restore();
}

function wall(ctx) {
  const light = ctx.createLinearGradient(0, 0, 1910, 810);
  light.addColorStop(0, '#ffc883');
  light.addColorStop(0.54, '#dc8b59');
  light.addColorStop(1, '#bd6756');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);
  for (let i = -1; i < 5; i++) {
    const x = i * 570;
    shape(ctx, [[x, 0], [x + 230, 0], [x - 130, 1080], [x - 360, 1080]], '#fff1b821');
  }
}

function restingMarker(ctx, x, y, length, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.028);
  roundBox(ctx, 2, 13, length, 21, 10, '#27324b35');
  roundBox(ctx, 0, 0, length, 24, 9, '#e6dfcf');
  roundBox(ctx, 8, 3, length - 24, 4, 2, '#fffdf5');
  roundBox(ctx, 0, -1, 46, 27, 6, color);
  roundBox(ctx, length - 13, 2, 13, 20, 4, color);
  for (let i = 0; i < 4; i++) line(ctx, 8 + 8 * i, 4, 8 + 8 * i, 18, '#ffffff38', 2);
  ctx.restore();
}

function board(ctx) {
  roundBox(ctx, 74, 82, 1809, 897, 19, '#673d3540');
  roundBox(ctx, 65, 68, 1809, 899, 19, '#98594370');
  roundBox(ctx, 55, 51, 1810, 899, 16, '#586077');
  roundBox(ctx, 58, 49, 1805, 893, 14, '#b4b9bf');
  roundBox(ctx, 64, 54, 1793, 879, 11, '#e3e6e7');
  const enamel = ctx.createLinearGradient(60, 65, 1750, 940);
  enamel.addColorStop(0, '#fffbeb');
  enamel.addColorStop(0.5, '#fbf7e9');
  enamel.addColorStop(1, '#e7e5e0');
  roundBox(ctx, 75, 68, 1771, 850, 6, enamel);
  ctx.save();
  ctx.beginPath();
  ctx.rect(75, 68, 1771, 850);
  ctx.clip();
  for (let i = 0; i < 3; i++) {
    const x = 1160 + i * 210;
    shape(ctx, [[x, 68], [x + 157, 68], [x + 28, 488], [x - 117, 453]], '#ffffff31');
  }
  for (let i = 0; i < 18; i++) {
    const y = 760 + i * 4.5;
    path(ctx, [['moveTo', 1300 + Math.sin(i) * 30, y], ['quadraticCurveTo', 1460, y - 79, 1640 - i * 4, y - 41]], null, '#a3a1c00a', 3);
  }
  ctx.restore();
  shape(ctx, [[230, 929], [1642, 929], [1672, 959], [206, 959]], '#b2b8c0');
  shape(ctx, [[206, 959], [1672, 959], [1665, 970], [213, 970]], '#636a78');
  line(ctx, 216, 957, 1660, 957, '#f3eddc', 4);
  restingMarker(ctx, 359, 919, 205, blue);
  restingMarker(ctx, 582, 919, 178, violet);
  ctx.save();
  ctx.translate(1440, 919);
  ctx.rotate(-0.017);
  roundBox(ctx, 4, -23, 140, 39, 12, '#545464');
  roundBox(ctx, 0, -29, 140, 35, 12, '#777688');
  for (let i = 0; i < 18; i++) line(ctx, 10 + i * 7, -20, 15 + i * 7, -3, '#ddd0bd2a', 3);
  ctx.restore();
}

// A broad dry-erase pen draws one continuous curl per unit of work.
const arcs = [
  [[0, 0], [.20, -.04], [.77, -.72], [.65, -.98]],
  [[.65, -.98], [.47, -1.35], [.25, -.67], [.40, -.28]],
  [[.40, -.28], [.52, .08], [.80, .04], [1, 0]],
];

function curlPoint(amount) {
  const p = Math.min(2.99999999, 3 * clamp(amount));
  const part = Math.floor(p);
  const t = p - part, u = 1 - t;
  return [0, 1].map(axis => {
    const [a, b, c, d] = arcs[part].map(point => point[axis]);
    return u ** 3 * a + 3 * u * u * t * b + 3 * u * t * t * c + t ** 3 * d;
  });
}

function workCurl(ctx, index, amount, color) {
  const x = startX + index * step;
  const height = 147 + Math.sin(2 * index) * 6;
  const steps = Math.ceil(60 * clamp(amount));
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  let end = [x, baseY];
  for (let j = 1; j <= steps; j++) {
    const [u, v] = curlPoint(amount * j / steps);
    end = [x + u * step, baseY + v * height];
    ctx.lineTo(...end);
  }
  if (steps) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 15;
    ctx.stroke();
    ctx.save();
    ctx.translate(0, -3.1);
    ctx.strokeStyle = '#fff8ef48';
    ctx.lineWidth = 1.7;
    ctx.stroke();
    ctx.restore();
  }
  return end;
}

function bracket(ctx, left, right, caption, color) {
  const y = baseY + 48;
  path(ctx, [['moveTo', left + 6, y - 9], ['lineTo', left + 6, y], ['quadraticCurveTo', (left + right) / 2, y + 4, right - 7, y], ['lineTo', right - 7, y - 10]], null, color, 3);
  words(ctx, caption, (left + right) / 2, y + 54, 39, color, { align: 'center', weight: 600 });
}

// The sleeve runs off the edge of the shot. The pen's nib is the local origin.
function writingHand(ctx, x, y, color, withdraw = 0) {
  if (withdraw >= 1) return;
  ctx.save();
  ctx.translate(x + withdraw * 380, y + withdraw * 760);
  ctx.rotate(0.36 + withdraw * 0.16);
  const skin = '#c9825b', shadow = '#a6654c', outline = '#754b44';
  shape(ctx, [[23, 23], [188, 42], [286, 123], [418, 375], [280, 390], [155, 146]], '#534a5e1b');
  // Palm behind the barrel, with a folded little finger.
  path(ctx, [
    ['moveTo', 108, 41], ['bezierCurveTo', 107, 13, 126, -8, 153, -3],
    ['bezierCurveTo', 172, -16, 205, -8, 222, 5], ['bezierCurveTo', 247, 11, 261, 23, 275, 46],
    ['bezierCurveTo', 295, 74, 299, 103, 330, 125], ['lineTo', 259, 220],
    ['bezierCurveTo', 227, 192, 204, 179, 174, 165], ['bezierCurveTo', 143, 153, 117, 133, 101, 111],
    ['bezierCurveTo', 88, 95, 88, 77, 104, 68], ['closePath'],
  ], skin, outline, 2.5);
  path(ctx, [['moveTo', 106, 87], ['quadraticCurveTo', 137, 126, 172, 129], ['moveTo', 117, 72], ['quadraticCurveTo', 154, 109, 184, 110]], null, shadow, 5);
  const barrel = ctx.createLinearGradient(0, -24, 0, 12);
  barrel.addColorStop(0, '#f1dfb9');
  barrel.addColorStop(.34, '#fffdf0');
  barrel.addColorStop(1, '#bdb4ac');
  shape(ctx, [[0, 0], [7, -6], [26, -8], [24, 4], [7, 5]], color);
  shape(ctx, [[15, -8], [41, -18], [49, 10], [19, 6]], '#353d50');
  path(ctx, [['moveTo', 37, -17], ['lineTo', 315, -28], ['quadraticCurveTo', 326, -26, 327, -17], ['lineTo', 328, -2], ['lineTo', 42, 11], ['closePath']], barrel, '#746d6f', 2);
  shape(ctx, [[279, -26], [321, -29], [329, -23], [330, -3], [281, 0]], color);
  line(ctx, 55, 4, 88, 3, color, 6);
  // The index finger and thumb pinch the pen just behind the tip.
  path(ctx, [['moveTo', 213, 8], ['bezierCurveTo', 186, -6, 159, -22, 141, -24], ['bezierCurveTo', 123, -26, 99, -20, 81, -12], ['bezierCurveTo', 65, -7, 67, 7, 83, 11], ['bezierCurveTo', 100, 16, 126, 6, 138, 8], ['bezierCurveTo', 160, 18, 171, 37, 191, 44]], skin, outline, 2.6);
  path(ctx, [['moveTo', 203, 78], ['bezierCurveTo', 175, 76, 158, 61, 141, 56], ['bezierCurveTo', 122, 53, 98, 55, 85, 44], ['bezierCurveTo', 72, 32, 73, 15, 83, 9], ['bezierCurveTo', 98, 0, 112, 9, 125, 17], ['bezierCurveTo', 138, 23, 155, 20, 166, 22], ['bezierCurveTo', 184, 25, 201, 33, 213, 42]], '#d9936f', outline, 2.7);
  path(ctx, [['moveTo', 83, 14], ['quadraticCurveTo', 100, 6, 107, 18], ['quadraticCurveTo', 110, 31, 98, 32], ['quadraticCurveTo', 83, 29, 83, 14]], '#e9ae8d', '#b67b62', 1.7);
  path(ctx, [['moveTo', 141, 32], ['quadraticCurveTo', 141, 40, 134, 45], ['moveTo', 154, -13], ['lineTo', 151, -5]], null, shadow, 2.6);
  shape(ctx, [[237, 194], [306, 110], [344, 125], [272, 228]], '#cf5745');
  path(ctx, [['moveTo', 254, 218], ['lineTo', 323, 121], ['bezierCurveTo', 419, 163, 527, 229, 645, 296], ['lineTo', 1000, 520], ['lineTo', 1000, 710], ['lineTo', 550, 691], ['closePath']], '#ce503d');
  for (let i = 0; i < 12; i++) line(ctx, 250 + i * 5.5, 199 - i * 7.1, 263 + i * 5.5, 214 - i * 7.1, '#a23c34', 3.2);
  path(ctx, [['moveTo', 318, 147], ['quadraticCurveTo', 466, 240, 650, 340]], null, '#e77656', 6);
  ctx.restore();
}

function deadline(ctx, amount) {
  const x = toX(limit * 1000);
  faded(ctx, amount, () => {
    words(ctx, 'Queue limit', x + 19, 279, 37, coral, { italic: true });
    words(ctx, limit * 1000 + ' ms', x + 16, 336, 55, coral, { weight: 600 });
    path(ctx, [['moveTo', x + 1, 287], ['quadraticCurveTo', x - 2, 422, x + 1, 529], ['lineTo', x - 1, 560]], null, coral, 5.5);
  });
}

function startMark(ctx, test, amount, admittedInk = 0) {
  const x = toX(test.waitMs);
  faded(ctx, amount, () => {
    path(ctx, [['moveTo', x, baseY + 7], ['lineTo', x + 2, baseY + 100], ['quadraticCurveTo', x + 2, baseY + 112, x + 15, baseY + 112], ['lineTo', x + 28, baseY + 112]], null, violet, 4);
    shape(ctx, [[x, baseY + 3], [x - 9, baseY + 22], [x + 9, baseY + 22]], violet);
    words(ctx, test.waitMs + ' ms', x + 37, baseY + 126, 47, violet, { weight: 600 });
    words(ctx, 'earliest start', x + 37, baseY + 169, 37, violet);
    ctx.beginPath();
    ctx.arc(x, baseY, 9, 0, 2 * Math.PI);
    ctx.fillStyle = '#faf4e4';
    ctx.fill();
    ctx.strokeStyle = violet;
    ctx.lineWidth = 4;
    ctx.stroke();
    faded(ctx, admittedInk, () => {
      ctx.fillStyle = violet;
      ctx.fill();
    });
  });
}

// Stroke order also drives the hand that writes the client's response.
const digits503 = [
  [[.69, .02], [.13, .02], [.08, .49], [.31, .42], [.54, .44], [.69, .54], [.72, .71], [.66, .86], [.49, .98], [.27, 1], [.07, .92]],
  [[1.33, .01], [1.17, .03], [1.05, .15], [.98, .37], [.95, .70], [1.00, .90], [1.14, .98], [1.32, .97], [1.46, .86], [1.54, .62], [1.56, .32], [1.52, .12], [1.42, .03], [1.32, .01]],
  [[1.90, .08], [2.10, .01], [2.34, .03], [2.46, .13], [2.46, .28], [2.36, .39], [2.12, .48], [2.32, .46], [2.46, .54], [2.49, .68], [2.42, .86], [2.25, .98], [2.02, .99], [1.83, .91]],
];

function writeCode(ctx, progress) {
  let tip = [0, 0];
  for (const [i, points] of digits503.entries()) {
    const span = clamp(progress * digits503.length - i) * (points.length - 1);
    if (span <= 0) continue;
    ctx.beginPath();
    for (let j = 0; j <= Math.ceil(span); j++) {
      const index = Math.min(j, span);
      const [a, b] = [points[Math.floor(index)], points[Math.ceil(index)]];
      const f = index % 1;
      tip = [480 + 91 * (a[0] + (b[0] - a[0]) * f), 747 + 86 * (a[1] + (b[1] - a[1]) * f)];
      if (j) ctx.lineTo(...tip);
      else ctx.moveTo(...tip);
    }
    ctx.lineWidth = 10.8;
    ctx.strokeStyle = coral;
    ctx.stroke();
  }
  return tip;
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const later = index >= 3;
  const reset = index === 3 ? smooth(elapsed / .65) : Number(later);
  const extending = index === 3 ? smooth(reveal('Watch what happens', 3.8)) : Number(index > 3);
  const bCurls = 1 + (second.b / curlTokens - 1) * extending;
  const firstStroke = index === 0 ? .1 + .9 * smooth(elapsed / 2.1) : 1;
  const readRate = index === 1 ? reveal('Assume the worker') : Number(index > 1);
  const showNow = index === 1 ? reveal('when we arrive') : Number(index > 1);
  const curlTime = index === 1 ? reveal("That's eighty", .5) : Number(index > 1);
  const limitDraw = index === 2 ? reveal('The gateway allows') : Number(index > 2);
  const firstStart = (index === 1 ? reveal("That's eighty") : Number(index > 1)) * (1 - reset);
  const secondStart = index === 4 ? reveal('Put your finger', 1.2) : Number(index > 4);
  const code = index === 5 ? smooth(reveal('before the worker', 1.8)) : Number(index > 5);
  const lookup = index === 6 ? smooth(reveal('Look up this request ID', .7)) : 0;
  const accept = (index === 2 ? reveal("There's room") : Number(index > 2)) * (1 - reset);

  wall(ctx);
  ctx.save();
  const close = index === 0 ? 1 - smooth(elapsed / 2.6) : 0;
  ctx.translate(700, 475);
  ctx.scale(1 + .10 * close, 1 + .10 * close);
  ctx.translate(-700, -475);
  ctx.translate(960, 540);
  ctx.rotate(-.013);
  ctx.translate(-960, -540);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  board(ctx);

  words(ctx, 'One GPU worker', 168, 190, 79, ink, { family: 'Serif', italic: true });
  faded(ctx, readRate, () => words(ctx, rate.toLocaleString('en-US') + ' tokens/s', 174, 250, 39, ink, { family: 'Mono' }));
  path(ctx, [['moveTo', 1365, 179], ['lineTo', 1379, 194], ['quadraticCurveTo', 1390, 164, 1412, 141]], null, blue, 8);
  words(ctx, 'Quota available', 1427, 185, 43, ink, { italic: true });
  ctx.save();
  ctx.setLineDash([2, 15]);
  line(ctx, startX - 11, baseY + 1, 1702, baseY + 1, '#a1a7b5', 3);
  ctx.restore();
  deadline(ctx, limitDraw);
  faded(ctx, showNow, () => {
    line(ctx, startX, baseY - 12, startX, baseY + 14, ink, 3);
    words(ctx, 'Now', startX - 16, baseY + 11, 34, ink, { align: 'right' });
  });

  workCurl(ctx, 0, 1, ink);
  let tip = workCurl(ctx, 1, firstStroke, blue);
  for (let i = 1; i < Math.ceil(bCurls); i++) {
    tip = workCurl(ctx, 1 + i, clamp(bCurls - i), blue);
  }
  const sized = index === 1 ? reveal('ten thousand tokens') : Number(index > 1);
  const longer = extending > .002 && extending < .997;
  bracket(ctx, startX, startX + step, sized > .5 ? 'A · 10k' : 'A', ink);
  const bLabel = sized <= .5 || longer ? 'B' : 'B · ' + (extending > .99 ? second.b : first.b) / 1000 + 'k';
  bracket(ctx, startX + step, startX + (1 + bCurls) * step, bLabel, blue);
  faded(ctx, sized, () => {
    words(ctx, '1 curl = 10,000 tokens', startX, 334, 40, ink, { italic: true });
    faded(ctx, curlTime, () => words(ctx, '= ' + curlMs + ' ms', startX + 425, 334, 40, ink, { italic: true }));
  });
  startMark(ctx, first, firstStart, accept);
  startMark(ctx, second, secondStart);

  faded(ctx, accept, () => {
    words(ctx, first.id, 178, 819, 48, ink, { family: 'Mono' });
    path(ctx, [['moveTo', 372, 799], ['lineTo', 432, 799], ['moveTo', 417, 786], ['lineTo', 433, 799], ['lineTo', 417, 812]], null, ink, 4);
    words(ctx, 'Admit', 478, 824, 66, violet, { family: 'Serif', italic: true });
  });

  const receipt = index === 5 ? reveal('Four hundred', .45) : Number(index > 5);
  faded(ctx, receipt, () => {
    words(ctx, second.id, 178, 819, 48, ink, { family: 'Mono' });
    path(ctx, [['moveTo', 372, 799], ['lineTo', 432, 799], ['moveTo', 417, 786], ['lineTo', 433, 799], ['lineTo', 417, 812]], null, ink, 4);
  });
  let codeTip;
  if (code > 0) codeTip = writeCode(ctx, code);
  faded(ctx, smooth((code - .87) / .13), () => words(ctx, 'Shared overload', 756, 816, 56, coral, { family: 'Serif', italic: true }));
  faded(ctx, lookup, () => {
    words(ctx, 'Gateway log', 178, 747, 36, ink, { italic: true });
    words(ctx, 'wait ' + second.waitMs + ' ms  /  limit ' + limit * 1000 + ' ms', 757, 872, 38, ink, { family: 'Mono' });
  });

  if (index === 0) writingHand(ctx, ...tip, blue, smooth((elapsed - 2.25) / .85));
  if (index === 3 && extending > 0) {
    const enter = 1 - smooth(extending / .045);
    const leave = smooth(reveal('left this time', 1.05));
    writingHand(ctx, ...tip, blue, Math.max(enter, leave));
  }
  if (index === 5 && codeTip) {
    const enter = 1 - smooth(code / .12);
    const leave = smooth(reveal('The gateway turns', 1));
    writingHand(ctx, ...codeTip, coral, Math.max(enter, leave));
  }
  ctx.restore();
}

function check() {
  assert.equal(curlMs, 80);
  assert.equal(first.curls, 2);
  assert.equal(second.curls, 5);
  assert.equal(first.waitMs, 160);
  assert.equal(second.waitMs, 400);
  assert.equal(first.response, 'Admit');
  assert.equal(second.response, '503');
  assert.ok(toX(first.waitMs) < toX(limit * 1000));
  assert.ok(toX(second.waitMs) > toX(limit * 1000));
  assert.equal(toX(second.waitMs), startX + second.curls * step);
  assert.equal(queueAdmission(rate * limit, rate, limit).admitted, true);
  assert.equal(queueAdmission(rate * limit + 1, rate, limit).admitted, false);
}

export default { title: 'Where can the next request start?', beats, draw, check };
