import assert from 'node:assert/strict';
import { facts, lanes, policy } from '../../../films/model-routing/fixtures.mjs';
import { compile, rank, violations } from '../../../films/model-routing/model.mjs';

const request = compile(facts);
const registry = ['F', 'D', 'E'].map(id => lanes.find(lane => lane.id === id));
const required = [
  { label: 'Private', fields: ['data'] },
  { label: 'Cited form', fields: ['schema', 'citations'] },
  { label: 'Review', fields: ['review'] },
];
const closed = (lane, key) => required[key].fields.every(f => !violations(lane, request).includes(f));
const afterC = lanes.find(lane => lane.id === 'C');
const eligible = rank(request, 'cost', registry).filter(lane =>
  afterC.latency + lane.latency < policy.deadline &&
  afterC.cost + policy.reservation <= policy.requestCap && policy.attempts >= 2
);
const chosen = eligible[0];
const price = lane => (lane.cost / 10000).toFixed(3) + '¢';

const beats = [
  {
    id: 'private-notes',
    say: 'Watch the pins lift all three tags. These are three backup routes that can handle private notes. The first model timed out before sending a word, and the access desk still needs an answer.',
    hold: 0.6,
  },
  {
    id: 'the-open-notch',
    say: 'Each tag records a test of the model with its adapter and workflow. F costs a third as much as D. Now look at the middle hole. The desk needs a structured form with a field for an evidence ID. Which tags will catch?',
    hold: 1.5,
  },
  {
    id: 'cited-form',
    say: 'Follow the pin on the left. It slips through the notch. F returns plain text. The desk would get a sentence where it needs an evidence field. D and E can both return the cited form.',
    hold: 0.9,
  },
  {
    id: 'review-handoff',
    say: 'There’s one more hole on the right. This request needs a human to review the answer. A pin here picks up each route with a way to hand the form to that person.',
    hold: 0.9,
  },
  {
    id: 'price',
    say: 'Now compare the two prices up here. Both backups have room for the input and fit the time and budget left on the request. Which has the lower estimated cost?',
    hold: 2.7,
  },
  {
    id: 'dispatch',
    say: 'The gateway sends the request to D. It costs a little less than E to try. F’s price never entered that comparison.',
    hold: 2.7,
  },
];

const ink = '#252c4e';
const mulberry = '#693335';
const tagWidth = 500;
const tagHeight = 340;
const topAtRest = 516;
const holes = [80, 250, 420];
const columnX = [125, 710, 1295];
const pinLine = topAtRest + 50;
const names = { F: 'Plain text', D: 'Local', E: 'Regional' };
const clip = x => Math.max(0, Math.min(1, x));
const ease = x => { x = clip(x); return x * x * (3 - 2 * x); };
const mix = (a, b, t) => a + (b - a) * t;

function rect(ctx, x, y, w, h, color, radius = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}
function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function oval(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
function type(ctx, text, x, baseline, size, color, family = 'Sans', weight = 500, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.fillText(text, x, baseline);
}
function gradient(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

function cabinet(ctx) {
  // Book cloth lines the inside of the open sorting file.
  rect(ctx, 0, 0, 1920, 1080, gradient(ctx, 20, 0, 1850, 1000, [
    [0, '#ffb596'], [0.43, '#ef997e'], [0.82, '#db806e'], [1, '#c27063'],
  ]));
  for (let i = 0; i < 1920; i += 7) line(ctx, i, 172, i, 862, '#682f3411');
  for (let i = 171; i < 862; i += 8) line(ctx, 0, i, 1920, i, '#ffedcf1c');
  rect(ctx, 0, 0, 1920, 150, gradient(ctx, 0, 0, 1740, 360, [[0, '#ffe9d1'], [1, '#f7d4b9']]));
  rect(ctx, 0, 150, 1920, 12, '#a95049');
  rect(ctx, 0, 162, 1920, 42, gradient(ctx, 0, 162, 0, 204, [[0, '#562b363b'], [1, '#562b3600']]));
  type(ctx, 'Access desk', 98, 100, 74, mulberry, 'Serif');
  type(ctx, 'Primary timeout  /  0 words', 548, 96, 38, '#693b36', 'Mono');
  // The request is filed here until the gateway chooses a lane.
  rect(ctx, 1300, 50, 504, 78, '#a76d5a', 4);
  rect(ctx, 1305, 54, 494, 64, '#bf8b75', 2);
  type(ctx, 'Request sent', 1552, 99, 35, '#603d39', 'Sans', 600, 'center');

  rect(ctx, 0, 855, 1920, 28, gradient(ctx, 0, 855, 0, 883, [[0, '#ffc09f'], [0.4, '#ffb89b'], [1, '#c97762']]));
  rect(ctx, 0, 883, 1920, 197, gradient(ctx, 0, 883, 1640, 1070, [[0, '#c77261'], [1, '#ae5d54']]));
  line(ctx, 0, 886, 1920, 886, '#814444', 4);
  for (let i = 0; i < 1920; i += 17) line(ctx, i, 891, i - 50, 1080, '#f5ac8e17', 3);
}

function silhouette(ctx, lane) {
  const w = tagWidth, h = tagHeight;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  for (const [i, x] of holes.entries()) {
    if (closed(lane, i)) continue;
    // The open throat is wider than the pin. The pin can leave the card here.
    const neck = 21, dy = Math.sqrt(30 * 30 - neck * neck);
    ctx.lineTo(x - neck, 0);
    ctx.lineTo(x - neck, 50 - dy);
    ctx.arc(x, 50, 30, Math.atan2(-dy, -neck), Math.atan2(-dy, neck), true);
    ctx.lineTo(x + neck, 0);
  }
  ctx.lineTo(w - 16, 0);
  ctx.quadraticCurveTo(w, 0, w, 16);
  ctx.lineTo(w, h - 23);
  ctx.lineTo(w - 23, h);
  ctx.lineTo(12, h);
  ctx.quadraticCurveTo(0, h, 0, h - 12);
  ctx.lineTo(0, 16);
  ctx.quadraticCurveTo(0, 0, 16, 0);
  ctx.closePath();
  holes.forEach((x, i) => {
    if (closed(lane, i)) {
      ctx.moveTo(x + 30, 50);
      ctx.arc(x, 50, 30, 0, Math.PI * 2);
      ctx.closePath();
    }
  });
}

function laneTag(ctx, lane, x, top, pivot, angle) {
  ctx.save();
  ctx.translate(x + pivot, top + 38);
  ctx.rotate(angle);
  ctx.translate(-pivot, -38);
  const lift = topAtRest - top;
  ctx.save();
  ctx.translate(5 + lift / 28, 7 + lift / 17);
  silhouette(ctx, lane);
  ctx.fillStyle = '#75443c3f';
  ctx.fill('evenodd');
  ctx.restore();

  ctx.save();
  ctx.translate(0, 4);
  silhouette(ctx, lane);
  ctx.fillStyle = '#a78673';
  ctx.fill('evenodd');
  ctx.restore();
  silhouette(ctx, lane);
  ctx.fillStyle = gradient(ctx, 0, 0, 390, 380, [[0, '#fff5d9'], [0.62, '#fff3d9'], [1, '#ecd8b8']]);
  ctx.fill('evenodd');
  ctx.save();
  ctx.clip('evenodd');
  for (const [i, cx] of holes.entries()) {
    ctx.beginPath();
    ctx.arc(cx, 50, 36, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = closed(lane, i) ? '#727690' : '#bc6a5e';
    ctx.stroke();
    if (!closed(lane, i)) {
      line(ctx, cx - 24, 0, cx - 24, 26, '#bc6a5e', 6);
      line(ctx, cx + 24, 0, cx + 24, 26, '#bc6a5e', 6);
    }
    type(ctx, required[i].label, cx, 122, 34, ink, 'Sans', 600, 'center');
  }
  line(ctx, 0, 148, tagWidth, 148, '#b6a38d', 2);
  line(ctx, 19, 154, 19, tagHeight - 15, '#b1a38d');
  type(ctx, lane.id, 40, 294, 151, ink, 'Serif', 600);
  type(ctx, names[lane.id], 174, 220, 52, ink, 'Sans', 600);
  type(ctx, price(lane), 174, 292, 57, ink, 'Mono');
  ctx.restore();
  ctx.restore();
}

function strap(ctx, x, y, shade) {
  // The small cross stitches and the turned-under hem move with the tape.
  rect(ctx, x - 17, 160, 38, y - 140, '#844e4342', 7);
  rect(ctx, x - 19, 158, 36, y - 140, shade, 8);
  line(ctx, x - 13, 160, x - 13, y + 8, '#e2d4ed91', 2);
  line(ctx, x + 11, 160, x + 11, y + 8, '#222e5866', 2);
  for (let row = y; row > 160; row -= 11) {
    line(ctx, x - 10, row, x + 9, row - 4, '#f4e8fb50', 2);
  }
}

function pin(ctx, x, y, engagement) {
  if (engagement <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(engagement, engagement);
  oval(ctx, 2, 4, 16, 16, '#4f3940');
  oval(ctx, 0, 0, 16, 16, '#fcf3d4');
  oval(ctx, 0, 0, 9, 9, '#3d4666');
  oval(ctx, -2, -3, 3, 3, '#e3e6f3');
  ctx.restore();
}

// A tape retracts behind the file before moving to the next set of holes.
// At the handoff the new pins engage before the old pins withdraw.
function pose(clock) {
  const { index, elapsed, speechDuration } = clock;
  const cue = (phrase, span) => ease(clock.reveal(phrase, span));
  let privateLift = 110, retractPrivate = 0, extendCited = 0, citedLift = 0;
  let extendReview = 0, retractCited = 0, reviewLift = 0, dispatch = 0;
  if (index === 0) privateLift *= ease((elapsed + 0.08) / 1.55);
  if (index === 1) {
    privateLift *= 1 - cue('F costs a third', 1.2);
    retractPrivate = cue('as much as D', 1.1);
    extendCited = cue('Now look at the middle hole', 1.25);
  }
  if (index >= 2) {
    privateLift = 0;
    retractPrivate = extendCited = 1;
    citedLift = 140 * (index === 2 ? ease((elapsed + 0.04) / 1.75) : 1);
  }
  if (index === 3) {
    extendReview = cue('one more hole', 1.3);
    retractCited = cue('This request', 1.0);
    reviewLift = 85 * cue('needs a human', 1.1);
  }
  if (index >= 4) {
    extendReview = retractCited = 1;
    reviewLift = 85;
    dispatch = index === 4 ? ease((elapsed - speechDuration - 0.95) / 1.35) : 1;
  }
  return { privateLift, retractPrivate, extendCited, citedLift, extendReview, retractCited, reviewLift, dispatch };
}

function requestSlip(ctx, amount, chosenX, chosenBottom) {
  const cx = mix(1552, chosenX, amount);
  const cy = mix(76, chosenBottom + 23, amount) - 85 * Math.sin(amount * Math.PI);
  const scale = 1 - 0.13 * amount;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.016 - 0.09 * Math.sin(Math.PI * amount) - 0.018 * amount);
  ctx.scale(scale, scale);
  rect(ctx, -250, -45 + 5, 502, 93, '#632e3447', 3);
  rect(ctx, -251, -46, 502, 92, '#ffe055', 3);
  rect(ctx, -251, -46, 14, 92, '#ad512e');
  type(ctx, request.request, -214, 14, 47, ink, 'Mono', 600);
  type(ctx, 'Access review', -68, 13, 40, ink, 'Serif');
  // A folded steel paper clip straddles the request and the selected tag.
  if (amount > 0.8) {
    ctx.globalAlpha = ease((amount - 0.8) / 0.2);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(189, -63);
    ctx.lineTo(189, -6);
    ctx.bezierCurveTo(189, 14, 215, 14, 215, -7);
    ctx.lineTo(215, -79);
    ctx.bezierCurveTo(215, -97, 196, -97, 196, -79);
    ctx.lineTo(196, -14);
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#35445d';
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#eae6d2';
    ctx.stroke();
  }
  ctx.restore();
}

function draw(ctx, clock) {
  const s = pose(clock);
  let detail = 0;
  if (clock.index === 1) detail = ease(clock.reveal('Now look at the middle hole', 1.8));
  if (clock.index === 2) detail = 1 - ease(clock.reveal('D and E', 1.55));
  ctx.save();
  // Move in close enough to see the pin clear F's cut and catch D's paper rim.
  ctx.scale(1 + 0.56 * detail, 1 + 0.56 * detail);
  ctx.translate(-65 * detail, -222 * detail);
  cabinet(ctx);
  const tops = registry.map(lane => topAtRest -
    (closed(lane, 0) ? s.privateLift : 0) -
    (closed(lane, 1) ? s.citedLift : 0) -
    (closed(lane, 1) && closed(lane, 2) ? s.reviewLift : 0));
  const pins = [];
  for (const [j, lane] of registry.entries()) {
    function addTape(key, y, engagement, tint) {
      if (y <= 162) return;
      const x = columnX[j] + holes[key];
      strap(ctx, x, y, tint);
      pins.push({ x, y, engagement });
    }
    const parked = 146;
    addTape(0, mix(pinLine - s.privateLift - 12, parked, s.retractPrivate),
      1 - ease(s.retractPrivate * 5), '#58678a');
    const citedY = mix(parked, pinLine - s.citedLift - 12, s.extendCited);
    addTape(1, mix(citedY, parked, s.retractCited),
      ease((s.extendCited - 0.82) / 0.18) * (1 - ease(s.retractCited * 5)), '#4d618c');
    if (closed(lane, 1)) {
      addTape(2, mix(parked, pinLine - s.citedLift - s.reviewLift - 12, s.extendReview),
        ease((s.extendReview - 0.82) / 0.18), '#4e638c');
    }
  }

  registry.forEach((lane, i) => {
    const lift = topAtRest - tops[i];
    oval(ctx, columnX[i] + 254, 856, 250 - lift / 3.8, 5 + lift / 39, lift > 10 ? '#874b4240' : '#683c4366');
    const pivot = s.privateLift > 0 ? holes[0] : holes[2];
    const tilt = 0.067 * s.privateLift / 110 -
      (closed(lane, 1) && closed(lane, 2) ? 0.068 * s.reviewLift / 85 : 0);
    laneTag(ctx, lane, columnX[i], tops[i], pivot, tilt);
  });
  for (const p of pins) pin(ctx, p.x, p.y, p.engagement);
  const choiceIndex = registry.indexOf(chosen);
  requestSlip(ctx, s.dispatch, columnX[choiceIndex] + tagWidth / 2, tops[choiceIndex] + tagHeight + 11);
  ctx.restore();
}

function check() {
  assert.deepEqual(violations(registry[0], request), ['schema', 'citations', 'review']);
  assert.deepEqual(registry.map(lane => required.map((_, i) => closed(lane, i))), [
    [true, false, false], [true, true, true], [true, true, true],
  ]);
  assert.deepEqual(eligible.map(lane => lane.id), ['D', 'E']);
  assert.equal(chosen.cost, registry[0].cost * 3);
  assert.deepEqual(registry.map(price), ['0.150¢', '0.450¢', '0.456¢']);
  assert.ok(eligible.every(lane => !violations(lane, request).length));
  assert.equal(chosen.id, 'D');
  return true;
}

export default { title: 'Which backup can carry the cited form?', beats, draw, check };
