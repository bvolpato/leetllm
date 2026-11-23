import assert from 'node:assert/strict';
import { FEATURES, LABELS, LR } from '../../../films/training-loop/fixtures.mjs';
import { oneTrainingStep } from '../../../films/training-loop/model.mjs';
import { scoreTicket } from '../../../films/training-loop/route-ruler.mjs';

const step = oneTrainingStep();
const outage = FEATURES[0];
const queues = ['Standard', 'Escalation'];

function forward(weights, features) {
  const { logits, gap } = scoreTicket(weights, features);
  return { scores: logits, destination: gap > 0 ? 1 : 0 };
}

const firstPass = forward(step.weights, outage);
const backwardPass = forward(step.weights, outage);
const nextPass = forward(step.updated, outage);
const destinations = [506, 1414];

const beats = [
  {
    id: 'misfiled',
    say: 'Where did that checkout outage land? Standard. Look at the stamp on the ticket. A person labeled it for escalation.',
    hold: 1.0,
  },
  {
    id: 'tie',
    say: 'The router reads just two numbers from this ticket. Urgency is one and severity is one. All four weights start at zero. Both queues score zero, and this router sends a tie to Standard.',
    hold: 0.7,
  },
  {
    id: 'batch',
    say: 'Pair the outage with a routine ticket labeled Standard. The model gives each correct queue half the probability. At half apiece, the mean cross entropy for this batch is about point six nine.',
    hold: 0.65,
  },
  {
    id: 'backward',
    say: 'Watch the urgency column for Escalation. We start with a clear gradient buffer and run backward. See the minus half? Increasing that weight a little would lower the batch loss. Read the weight underneath. Still zero.',
    hold: 0.9,
  },
  {
    id: 'retry',
    say: 'Give it the outage again. The same two zeros send it straight back to Standard.',
    hold: 0.75,
  },
  {
    id: 'step',
    say: 'Watch the weight as the optimizer takes one step. We chose a learning rate of point two. With plain stochastic gradient descent, it subtracts point two times the stored gradient. Subtracting a negative tenth brings the weight up to a tenth.',
    hold: 0.85,
  },
  {
    id: 'rescore',
    say: 'Send the same outage through again. Each of its two ones picks up a tenth for Escalation. Together they score point two. Look where the ticket landed this time.',
    hold: 3.1,
  },
];

const clamp = (v) => Math.min(1, Math.max(0, v));
function ease(t) {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
}
const mix = (a, b, t) => a + (b - a) * t;
const number = (v) => (v === 0 ? '0' : (v < 0 ? '−' : '+') + Math.abs(v).toFixed(1));

function text(
  ctx,
  value,
  x,
  y,
  size,
  { family = 'Sans', color = '#272139', weight = 400, align = 'left', italic = false } = {},
) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px "Lesson ${family}"`;
  ctx.fillText(value, x, y);
}

function rect(ctx, x, y, w, h, color, radius = 0) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = color;
  ctx.fill();
}
function polygon(ctx, points, color) {
  ctx.beginPath();
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
function stroke(ctx, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}
function gradient(ctx, x, y, endX, endY, stops) {
  const g = ctx.createLinearGradient(x, y, endX, endY);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

function wall(ctx) {
  rect(
    ctx,
    -600,
    -950,
    3200,
    2300,
    gradient(ctx, 80, -520, 1680, 1100, [
      [0, '#fbebe3'],
      [0.53, '#f2dad4'],
      [1, '#cbbec9'],
    ]),
  );
  // Light from a high window breaks across the bare wall.
  polygon(
    ctx,
    [
      [1100, -950],
      [1580, -950],
      [330, 1350],
      [-200, 1350],
    ],
    '#fff7e62a',
  );
  polygon(
    ctx,
    [
      [1690, -950],
      [1935, -950],
      [685, 1350],
      [390, 1350],
    ],
    '#fff7e62a',
  );
  for (let y = -810; y < 1200; y += 318) {
    rect(ctx, -100, y, 2200, 2, '#63506519');
    rect(ctx, -100, y + 2, 2200, 2, '#fff7eb70');
  }
}

const fabrics = [
  { back: '#39388d', body: '#534fa8', dark: '#353274', light: '#8883c6', print: '#29265e' },
  { back: '#ac3b36', body: '#cc5141', dark: '#8c322e', light: '#eb8c73', print: '#7d2524' },
];
const halfPocket = 378;
function weave(ctx, x, y, w, h) {
  ctx.beginPath();
  for (let j = y; j <= y + h; j += 6) {
    ctx.moveTo(x, j);
    ctx.lineTo(x + w, j + 1);
  }
  stroke(ctx, '#fff3d812', 1.7);
  ctx.beginPath();
  for (let i = x; i <= x + w; i += 7) {
    ctx.moveTo(i, y);
    ctx.lineTo(i + 1, y + h);
  }
  stroke(ctx, '#170e3b11', 1.3);
}
function stitch(ctx, color) {
  ctx.save();
  ctx.setLineDash([8, 6]);
  stroke(ctx, color, 2.4);
  ctx.restore();
}
function pocketBack(ctx, center, ink) {
  ctx.save();
  ctx.translate(center, 0);
  const x = -halfPocket;
  ctx.save();
  ctx.shadowColor = '#47304754';
  ctx.shadowBlur = 21;
  ctx.shadowOffsetX = 12;
  ctx.shadowOffsetY = 19;
  rect(ctx, x, 263, 2 * halfPocket, 552, ink.back, 22);
  ctx.restore();
  ctx.save();
  ctx.clip();
  weave(ctx, x, 263, 2 * halfPocket, 552);
  ctx.restore();
  for (const side of [-1, 1]) {
    const sx = side * 327;
    rect(ctx, sx - 32, 207, 64, 115, ink.dark, 9);
    rect(ctx, sx - 27, 207, 54, 104, ink.body, 7);
    ctx.beginPath();
    ctx.roundRect(sx - 22, 213, 44, 91, 5);
    stitch(ctx, '#fff2dc88');
    ellipse(ctx, sx, 233, 14, 13, '#323449');
    ellipse(ctx, sx, 231, 10, 9, '#a09ca2');
    ellipse(ctx, sx, 231, 5, 5, '#5b5463');
  }
  rect(
    ctx,
    x + 19,
    285,
    2 * halfPocket - 38,
    492,
    gradient(ctx, 0, 285, 0, 700, [
      [0, ink.light],
      [0.055, ink.back],
      [0.7, ink.dark],
    ]),
    11,
  );
  ctx.restore();
}

function facePath(ctx) {
  const e = halfPocket;
  ctx.beginPath();
  ctx.moveTo(-e, 476);
  ctx.bezierCurveTo(-256, 495, -170, 518, 0, 520);
  ctx.bezierCurveTo(150, 523, 270, 494, e, 476);
  ctx.lineTo(e - 7, 799);
  ctx.quadraticCurveTo(e - 8, 822, e - 37, 827);
  ctx.quadraticCurveTo(0, 855, -e + 34, 826);
  ctx.quadraticCurveTo(-e + 7, 821, -e + 7, 800);
  ctx.closePath();
}
function pocketFront(ctx, center, ink, name, score, flip) {
  ctx.save();
  ctx.translate(center, 0);
  facePath(ctx);
  ctx.fillStyle = gradient(ctx, -halfPocket, 600, halfPocket, 735, [
    [0, ink.dark],
    [0.075, ink.body],
    [0.32, ink.light],
    [0.53, ink.body],
    [0.91, ink.body],
    [1, ink.dark],
  ]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  weave(ctx, -halfPocket, 476, halfPocket * 2, 380);
  ctx.beginPath();
  ctx.moveTo(-395, 478);
  ctx.bezierCurveTo(-45, 563, 69, 552, 394, 478);
  stroke(ctx, ink.dark, 25);
  stroke(ctx, ink.body, 18);
  stitch(ctx, '#fff3dcaa');
  ctx.beginPath();
  ctx.moveTo(-359, 485);
  ctx.lineTo(-347, 797);
  ctx.quadraticCurveTo(0, 837, 347, 798);
  ctx.lineTo(359, 485);
  stitch(ctx, '#ffefdc9c');
  ctx.restore();

  // A screen-printed destination and a separate flip tag for the latest forward pass.
  text(ctx, name, 0, 644, 85, { family: 'Serif', color: '#fff5de', align: 'center' });
  ctx.save();
  ctx.translate(0, 733);
  rect(ctx, -176, -45, 352, 91, ink.dark, 7);
  ctx.scale(1, Math.max(0.07, Math.abs(Math.cos(Math.PI * flip))));
  rect(ctx, -170, -44, 340, 82, '#f9edcf', 5);
  text(ctx, 'score', -133, 13, 36, { family: 'Mono', color: ink.print });
  text(ctx, number(score), 130, 16, 57, { family: 'Mono', color: ink.print, align: 'right' });
  ctx.restore();
  ctx.restore();
}

function ticket(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.save();
  ctx.shadowColor = '#27152b61';
  ctx.shadowBlur = 13;
  ctx.shadowOffsetX = 7;
  ctx.shadowOffsetY = 13;
  const paper = gradient(ctx, -290, -48, 245, 294, [
    [0, '#fffaf0'],
    [0.7, '#fff2cf'],
    [1, '#e6cca6'],
  ]);
  polygon(
    ctx,
    [
      [-295, 0],
      [268, 0],
      [295, 29],
      [295, 350],
      [-295, 350],
    ],
    paper,
  );
  ctx.restore();
  polygon(
    ctx,
    [
      [268, 0],
      [295, 29],
      [266, 30],
    ],
    '#dfcaaa',
  );
  ctx.save();
  ctx.beginPath();
  ctx.rect(-295, 0, 20, 350);
  ctx.clip();
  for (let yy = -20; yy < 400; yy += 35) {
    polygon(
      ctx,
      [
        [-300, yy],
        [-259, yy - 24],
        [-259, yy - 8],
        [-300, yy + 16],
      ],
      '#cc513c',
    );
  }
  ctx.restore();

  ctx.save();
  ctx.translate(111, 38);
  ctx.rotate(-0.045);
  ctx.strokeStyle = '#ac342a';
  ctx.lineWidth = 3.2;
  ctx.strokeRect(-117, -23, 234, 44);
  text(ctx, 'ESCALATE', 0, 12, 38, { family: 'Mono', color: '#ab352e', align: 'center' });
  ctx.restore();
  text(ctx, 'Ticket A', -245, 51, 37, { family: 'Mono' });
  text(ctx, 'Checkout is down', -248, 135, 62, { family: 'Serif' });
  rect(ctx, -246, 157, 483, 2, '#c6ac91');
  text(ctx, `Urgency ${outage[0]}   Severity ${outage[1]}`, -246, 208, 35, { family: 'Sans' });
  ctx.restore();
}

const phosphor = '#252443';
const subtle = '#56506b';
const accent = '#9d362f';
const mono = (size, ctx, s, x, y, opts = {}) =>
  text(ctx, s, x, y, size, { family: 'Mono', color: phosphor, ...opts });

function batchScreen(ctx, clock) {
  const right = { align: 'right' };
  mono(34, ctx, 'Training batch', 464, -541);
  ctx.fillStyle = subtle;
  for (const [x, label] of [
    [899, 'Urgency'],
    [1111, 'Severity'],
    [1434, 'Label'],
  ]) {
    mono(26, ctx, label, x, -462, { ...right, color: subtle });
  }
  for (const [i, label] of ['Outage', 'Routine'].entries()) {
    ctx.save();
    if (i === 1 && clock.index === 2) ctx.globalAlpha = clock.reveal('routine ticket');
    const y = -393 + i * 64;
    mono(40, ctx, label, 464, y);
    mono(40, ctx, number(FEATURES[i][0]), 899, y, right);
    mono(40, ctx, number(FEATURES[i][1]), 1111, y, right);
    mono(36, ctx, queues[LABELS[i]], 1434, y, right);
    ctx.restore();
  }
  rect(ctx, 464, -300, 970, 2, '#776b8a88');
  const show = clock.index === 2 ? clock.reveal('mean cross entropy', 0.45) : 0;
  ctx.save();
  const probability = step.probabilities[0][LABELS[0]];
  ctx.globalAlpha = clock.index === 2 ? clock.reveal('half the probability') * (1 - show) : 0;
  mono(36, ctx, 'P(correct queue)', 464, -235);
  mono(46, ctx, probability.toFixed(2), 1434, -231, right);
  ctx.globalAlpha = show;
  mono(36, ctx, 'Mean cross entropy', 464, -235);
  mono(40, ctx, '−ln(' + probability.toFixed(2) + ') = ' + step.loss.toFixed(3), 1434, -231, right);
  ctx.restore();
}

function weightsScreen(ctx, clock) {
  const backwardDone =
    clock.index > 3 || (clock.index === 3 && clock.reveal('run backward', 0.24) > 0.5);
  const takingStep = clock.index > 5 || (clock.index === 5 && clock.reveal('one step', 0.24) > 0.5);
  const inspectWeight =
    clock.index > 3 || (clock.index === 3 && clock.reveal('Read the weight', 0.35) > 0.5);
  const op = takingStep
    ? 'optimizer.step()'
    : backwardDone
      ? 'loss.backward()'
      : 'optimizer.zero_grad(set_to_none=True)';
  mono(op.length > 30 ? 32 : 42, ctx, op, 464, -535);
  const left = 464,
    urgency = 1078,
    severity = 1434;
  mono(34, ctx, 'Escalation', left, -446, { color: accent });
  mono(30, ctx, 'Urgency', urgency, -447, { align: 'right', color: subtle });
  mono(30, ctx, 'Severity', severity, -447, { align: 'right', color: subtle });
  rect(ctx, left, -422, 970, 2, '#776b8a88');
  const values = takingStep ? step.updated : step.weights;
  for (const [i, label] of ['W.grad', 'Weight'].entries()) {
    const y = -349 + i * 81;
    mono(42, ctx, label, left, y);
    for (const [j, x] of [urgency, severity].entries()) {
      const v = i === 0 ? (backwardDone ? number(step.gradient[1][j]) : '·') : number(values[1][j]);
      const follow =
        j === 0 && ((i === 0 && backwardDone && !inspectWeight) || (i === 1 && inspectWeight));
      if (follow) rect(ctx, x - 152, y - 48, 168, 63, '#ffcd9f', 4);
      mono(49, ctx, v, x, y, { align: 'right', color: follow ? accent : phosphor });
    }
  }
  if (takingStep) {
    const showEquation = clock.index === 5 ? clock.reveal('it subtracts') : 1;
    mono(28, ctx, 'SGD   lr = ' + LR, left, -203, { color: subtle });
    ctx.save();
    ctx.globalAlpha = showEquation;
    mono(
      30,
      ctx,
      '0 − ' + LR + ' × (' + number(step.gradient[1][0]) + ') = ' + number(values[1][0]),
      severity,
      -203,
      { color: accent, align: 'right' },
    );
    ctx.restore();
  }
}

function terminal(ctx, clock) {
  // The wall terminal and the pouches occupy one continuous piece of scenery.
  ctx.save();
  ctx.shadowColor = '#32263b57';
  ctx.shadowBlur = 27;
  ctx.shadowOffsetX = 16;
  ctx.shadowOffsetY = 24;
  rect(ctx, 290, -720, 1340, 685, '#9c91a6', 59);
  ctx.restore();
  rect(
    ctx,
    282,
    -730,
    1340,
    682,
    gradient(ctx, 282, -720, 1480, -40, [
      [0, '#e6dae6'],
      [0.4, '#cfc2d5'],
      [1, '#b6aabb'],
    ]),
    58,
  );
  rect(ctx, 370, -648, 1166, 508, '#8b8299', 27);
  rect(ctx, 378, -639, 1150, 492, '#665c79', 24);
  rect(
    ctx,
    389,
    -628,
    1128,
    469,
    gradient(ctx, 400, -630, 1200, -140, [
      [0, '#b7b2cc'],
      [0.26, '#d9d3e0'],
      [0.86, '#d9d3df'],
      [1, '#c6bfd2'],
    ]),
    19,
  );
  for (let y = -620; y < -164; y += 5) rect(ctx, 402, y, 1098, 0.7, '#463c5710');
  if (clock.index < 3) batchScreen(ctx, clock);
  else weightsScreen(ctx, clock);
  for (let i = 0; i < 15; i++) rect(ctx, 1350 + i * 9, -108, 4, 23, '#8a7e92', 2);
  ellipse(ctx, 402, -95, 7, 7, '#643d57');
  ellipse(ctx, 402, -96, 4, 4, '#ed9375');
}

function draw(ctx, clock) {
  const { index, elapsed } = clock;
  let close = 0;
  switch (clock.beat.id) {
    case 'batch':
    case 'step':
      close = ease(elapsed / 1.25);
      break;
    case 'backward':
      close = 1;
      break;
    case 'retry':
    case 'rescore':
      close = 1 - ease(elapsed / 1.23);
      break;
  }
  let readTicket = 0;
  if (index === 0) readTicket = ease(clock.reveal('Look at the stamp', 0.9));
  if (index === 1) readTicket = 1 - ease(clock.reveal('All four weights', 1.05));
  const zoom = mix(1 + readTicket * 0.9, 1.43, close);
  ctx.fillStyle = '#eddad7';
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.save();
  ctx.translate(960, mix(8 - readTicket * 226, 1059, close));
  ctx.scale(zoom, zoom);
  ctx.translate(-960 + readTicket * (960 - destinations[0]), 0);
  wall(ctx);
  terminal(ctx, clock);
  for (const [i, x] of destinations.entries()) pocketBack(ctx, x, fabrics[i]);

  let x = destinations[firstPass.destination],
    y = 276,
    angle = -0.037;
  let flip = 0;
  if (index === 0) {
    const t = ease(elapsed / 1.15);
    x = mix(858, x, t);
    y = mix(30, y, t) - 52 * Math.sin(Math.PI * t);
    angle = mix(0.13, angle, t);
  }
  if (clock.beat.id === 'retry') {
    const lift = ease((elapsed - 0.48) / 0.65);
    const land = ease((elapsed - 1.54) / 0.55);
    y -= 212 * (lift - land);
    x += 88 * (lift - land);
    angle += 0.07 * (lift - land);
    flip = ease((elapsed - 1.39) / 0.41);
  }
  if (clock.beat.id === 'rescore') {
    const lift = ease((elapsed - 0.72) / 0.78);
    const cross = ease((elapsed - 1.53) / 1.45);
    const land = ease((elapsed - 3.03) / 0.72);
    x = mix(x, destinations[nextPass.destination], cross);
    y += -218 * lift + 218 * land - 45 * Math.sin(Math.PI * cross);
    angle = mix(angle, 0.032, cross) + 0.072 * Math.sin(Math.PI * cross);
    flip = ease((elapsed - 1.51) / 0.44);
  }
  ticket(ctx, x, y, angle);
  const pass = clock.beat.id === 'retry' ? backwardPass : nextPass;
  const scores = flip >= 0.5 ? pass.scores : firstPass.scores;
  for (const [i, cx] of destinations.entries())
    pocketFront(ctx, cx, fabrics[i], queues[i], scores[i], flip);
  ctx.restore();
}

function check() {
  assert.deepEqual(step.weights, [
    [0, 0],
    [0, 0],
  ]);
  assert.deepEqual(step.gradient, [
    [0.5, 0.5],
    [-0.5, -0.5],
  ]);
  assert.deepEqual(step.updated, [
    [-0.1, -0.1],
    [0.1, 0.1],
  ]);
  assert.ok(Math.abs(step.loss - Math.log(2)) < 1e-12);
  assert.deepEqual(firstPass, { scores: [0, 0], destination: 0 });
  assert.deepEqual(backwardPass, firstPass);
  assert.deepEqual(nextPass, { scores: [-0.2, 0.2], destination: 1 });
  assert.equal(forward(step.updated, FEATURES[1]).destination, LABELS[1]);
}

export default { title: 'Which call reroutes the outage?', beats, draw, check };
