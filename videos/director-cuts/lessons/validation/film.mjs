// Values from the eight requests in videos/films/validation/fixtures.mjs.
import assert from 'node:assert/strict';

const requests = [
  [1.4, 0, 1], [-0.2, 1, 0], [0.8, 0, 1], [0.1, 1, 0],
  [1.1, 0, 1], [-0.5, 1, 0], [0.3, 0, 0], [0.6, 1, 1],
].map(([ambiguity, support, audit], i) => ({
  id: 'r' + i,
  opening: { ambiguity, support },
  audit,
}));

function route({ ambiguity, support }) {
  const margin = ambiguity - 0.9 * support;
  return { margin, call: Number(margin > 0) };
}

const rings = requests.map(request => request.audit);
const traced = rings.slice();
const routed = requests.map(request => route(request.opening).call);
const strikes = calls => calls.filter((call, i) => call === rings[i]).length;
const errors = routed.flatMap((call, i) => call === rings[i] ? [] : [i]);
const last = requests.length - 1;
const lastMargin = route(requests[last].opening).margin;
const number = value => value.toFixed(1).replace('-', '−');

const beats = [
  {
    id: 'trace',
    say: 'There goes the first red dot, up to review. The next one lands on routine. Keep going across the eight access requests. How many blue rings does the pencil hit?',
    hold: 1.5,
  },
  {
    id: 'lift',
    say: 'Eight out of eight. Watch what comes away with the prediction sheet. The rings underneath belong to the auditor. The router traced those later decisions. That’s target leakage.',
    hold: 0.65,
  },
  {
    id: 'blind',
    say: 'Slide the cover over the audit. Now replay the moment each request opened. The router had the wording of the request and the policy evidence that came with it.',
    hold: 0.5,
  },
  {
    id: 'route',
    say: 'Start with the ambiguity score for the wording. Subtract nine tenths of the policy support. Send a request for review if the result is above zero. Watch the calls go down on a clean sheet.',
    hold: 0.6,
  },
  {
    id: 'last-call',
    say: 'One request left. Its ambiguity is six tenths and its policy support is one. Six tenths minus nine tenths. Which row gets the dot?',
    hold: 2,
  },
  {
    id: 'register',
    say: 'Routine. The result is below zero. Fix the predictions in place. Now pull the cover away. Look at the two dots on the right.',
    hold: 1.7,
  },
  {
    id: 'two-misses',
    say: 'The first calls for a review the audit says was unnecessary. The next misses a request that needed review. Six of the eight calls match. That’s what the router could do on these requests with the information it had at opening.',
    hold: 3,
  },
];

const palette = {
  enamel: '#254346', ivory: '#eef0dc', dim: '#b7c9bd',
  ink: '#263d3f', blue: '#214c70', red: '#ad371f', brass: '#bd9761',
};
const clamp = p => Math.max(0, Math.min(1, p));
const ease = p => { const t = clamp(p); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const column = i => 469 + i * 174;
const lane = value => value ? 453 : 644;
const glass = { x: 103, y: 267, w: 1714, h: 483 };
const rightEdge = glass.x + glass.w;

function gradient(ctx, x, y, u, v, stops) {
  const fill = ctx.createLinearGradient(x, y, u, v);
  for (const [at, color] of stops) fill.addColorStop(at, color);
  return fill;
}
function box(ctx, x, y, w, h, r, fill, stroke, width = 2) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = width; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function line(ctx, x, y, u, v, stroke, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(u, v);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}
function circle(ctx, x, y, r, fill, stroke, width = 1) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function type(ctx, value, x, y, size, color, family = 'Sans', align = 'left', weight = 400) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
function plateScrew(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  circle(ctx, 0, 2, 13, '#12292a');
  circle(ctx, 0, 0, 11, gradient(ctx, -7, -9, 7, 9, [[0, '#ddd0ad'], [0.48, '#b4a682'], [1, '#6b6e5c']]));
  ctx.rotate(angle);
  line(ctx, -7, 0, 7, 0, '#44524c', 3.5);
  line(ctx, -7, 2, 7, 2, '#e2d4ad', 1);
  ctx.restore();
}

// The bench, the stamped audit rings and the removable prediction film share register pins.
function bench(ctx) {
  ctx.fillStyle = gradient(ctx, 0, 0, 1920, 1080, [[0, '#293230'], [0.6, '#142323'], [1, '#0c1b1d']]);
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.save();
  ctx.shadowColor = '#081617';
  ctx.shadowBlur = 31;
  ctx.shadowOffsetY = 17;
  box(ctx, 46, 80, 1828, 824, 47, '#102628');
  ctx.restore();
  box(ctx, 46, 69, 1828, 825, 46, gradient(ctx, 160, 70, 1640, 900, [
    [0, '#557174'], [0.035, '#39595b'], [0.48, palette.enamel], [1, '#203d40'],
  ]), '#69827d', 3);
  box(ctx, 58, 81, 1804, 800, 38, null, '#75908a50');
  for (const [x, y, a] of [[85, 114, -0.7], [1833, 114, 0.37], [85, 849, 0.56], [1833, 849, -0.4]]) {
    plateScrew(ctx, x, y, a);
  }
  type(ctx, 'Eight access requests', 132, 201, 72, palette.ivory, 'Serif');
  circle(ctx, 1011, 177, 23, '#e7ebd8');
  circle(ctx, 1011, 177, 15, null, palette.blue, 6);
  type(ctx, 'Later audit', 1047, 191, 44, palette.ivory);
  circle(ctx, 1382, 176, 15, '#e57e58');
  type(ctx, 'Router’s call', 1414, 191, 44, palette.ivory);
  box(ctx, glass.x - 13, glass.y - 13, glass.w + 26, glass.h + 26, 24, '#132a2d', '#79908a', 3);
  box(ctx, glass.x - 4, glass.y - 4, glass.w + 8, glass.h + 8, 19, '#697a70');
}
function auditPaper(ctx) {
  const {x, y, w, h} = glass;
  ctx.fillStyle = gradient(ctx, x, y, x + w * 0.9, y + h, [
    [0, '#cddad1'], [0.15, '#eff3df'], [0.62, '#edf0db'], [1, '#ced7c8'],
  ]);
  ctx.fillRect(x, y, w, h);
  for (let i = 0; i < 170; i++) {
    const px = x + (i * 683) % w, py = y + (i * 349) % h;
    line(ctx, px, py, px + 2 + (i % 7), py + 0.8, '#3c514213', 1.2);
  }
  rings.forEach((value, i) => {
    circle(ctx, column(i), lane(value), 37, null, palette.blue, 9);
    circle(ctx, column(i), lane(value), 44, null, '#53748a68', 1.5);
  });
}
function cover(ctx, amount) {
  if (amount <= 0) return;
  const edge = rightEdge - (glass.w + 20) * amount;
  ctx.fillStyle = gradient(ctx, edge - 12, 0, edge + 2, 0, [[0, '#1e321800'], [1, '#33412e60']]);
  ctx.fillRect(edge - 12, glass.y, 14, glass.h);
  ctx.fillStyle = gradient(ctx, edge, glass.y, edge + 1300, glass.y + glass.h, [
    [0, '#c5a46e'], [0.05, '#ddc38b'], [0.5, '#e8d1a0'], [1, '#ccb286'],
  ]);
  ctx.fillRect(edge, glass.y, glass.w + 20, glass.h);
  for (let y = glass.y + 3; y < glass.y + glass.h; y += 6) {
    line(ctx, edge + 3, y, rightEdge, y + 0.6, '#795f4010', 1);
  }
  line(ctx, edge + 1, glass.y, edge + 1, glass.y + glass.h, '#68583f', 3);
}
function guides(ctx, selected) {
  const x0 = column(0) - 87;
  line(ctx, 134, 358, rightEdge - 32, 358, '#30444859', 2);
  line(ctx, 134, 548, rightEdge - 32, 548, '#40504438', 2);
  type(ctx, 'Review', 149, lane(1) + 18, 57, palette.ink, 'Serif');
  type(ctx, 'Routine', 149, lane(0) + 18, 57, palette.ink, 'Serif');
  for (const [i, row] of requests.entries()) {
    const x = column(i);
    line(ctx, x0 + i * 174, 379, x0 + i * 174, glass.y + glass.h - 21, '#3d534326', 1.5);
    if (i === last && selected > 0) {
      ctx.save();
      ctx.globalAlpha = selected;
      box(ctx, x - 62, 286, 124, 60, 4, palette.ink);
      ctx.restore();
    }
    type(ctx, row.id, x, 332, 48, i === last && selected > 0.5 ? palette.ivory : palette.ink, 'Mono', 'center');
    for (const value of [0, 1]) {
      const y = lane(value);
      line(ctx, x - 8, y, x + 8, y, '#53675d88', 2);
      line(ctx, x, y - 8, x, y + 8, '#53675d88', 2);
    }
  }
}
function waxDot(ctx, x, y, scale) {
  if (scale < 0.001) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(-0.3);
  ctx.beginPath();
  ctx.moveTo(-19, -4);
  ctx.bezierCurveTo(-18, -22, 1, -24, 13, -17);
  ctx.bezierCurveTo(27, -8, 20, 11, 12, 17);
  ctx.bezierCurveTo(-4, 25, -22, 17, -19, -4);
  ctx.fillStyle = palette.red;
  ctx.fill();
  for (let n = 0; n < 8; n++) {
    const dy = -13 + n * 3.8;
    line(ctx, -9 + n % 4, dy, -3 + (n * 7 % 14), dy - 1.2, '#e49d648f', 1.2);
  }
  ctx.restore();
}

// A unit of travel includes the move to the next request and the time spent marking it.
function strokeAt(calls, position) {
  const index = Math.min(last, Math.floor(position));
  const p = clamp(position - index);
  const previous = index - 1;
  const travel = ease(p / 0.66);
  return {
    x: mix(previous < 0 ? column(0) - 94 : column(previous), column(index), travel),
    y: mix(previous < 0 ? lane(1) - 95 : lane(calls[previous]), lane(calls[index]), travel)
      - 28 * Math.sin(Math.PI * travel),
    pressure: ease((p - 0.66) / 0.31),
  };
}
function acetate(ctx, calls, position, offset = 0) {
  ctx.save();
  ctx.translate(offset, -Math.min(24, Math.abs(offset) * 0.065));
  box(ctx, glass.x + 10, glass.y + 8, glass.w - 20, glass.h - 18, 10,
    gradient(ctx, 460, 720, 1300, 250, [[0, '#88b5b50b'], [0.51, '#ffffff05'], [0.55, '#fcfff422'], [0.67, '#ffffff08'], [1, '#89a9ac10']]),
    '#829c959c', 2);
  for (const [i, call] of calls.entries()) {
    waxDot(ctx, column(i), lane(call), ease((position - i - 0.66) / 0.31));
  }
  ctx.restore();
}

function pencil(ctx, x, y, lift) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.72);
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(58, -18);
    ctx.lineTo(327, -18);
    ctx.quadraticCurveTo(341, 0, 327, 18);
    ctx.lineTo(58, 18);
    ctx.closePath();
  };
  ctx.save();
  ctx.translate(10 + lift * 9, 10 + lift * 9);
  shape(); ctx.fillStyle = '#283e3625'; ctx.fill(); ctx.restore();
  shape();
  ctx.fillStyle = gradient(ctx, 0, -18, 0, 18, [[0, '#875a31'], [0.18, '#efcf87'], [0.49, '#ddaf66'], [0.9, '#b88444'], [1, '#79562f']]);
  ctx.fill();
  ctx.save(); ctx.clip();
  for (let u = 52; u < 130; u += 8) line(ctx, u, 19, u + 9, -19, '#805b3a6b', 2);
  line(ctx, 132, -12, 330, -12, '#f6db9b', 2.5);
  ctx.fillStyle = '#a83a25';
  ctx.fillRect(310, -19, 27, 38);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(43, -14); ctx.lineTo(41, 13); ctx.closePath();
  ctx.fillStyle = palette.red; ctx.fill();
  line(ctx, 8, -1, 39, -10, '#e57e58', 2.3);
  ctx.restore();
  ctx.restore();
}

function cue(clock, index, phrase, seconds) {
  if (clock.index < index) return 0;
  if (clock.index > index) return 1;
  return clock.reveal(phrase, seconds);
}
function scene(clock) {
  const at = (i, phrase, seconds) => cue(clock, i, phrase, seconds);
  const trace = ease(at(0, 'There goes', 0.85)) + ease(at(0, 'The next one', 0.88))
    + 6 * at(0, 'Keep going', 3.05);
  const lift = ease(at(1, 'Watch what comes away', 1.65));
  const coverIn = ease(at(2, 'Slide the cover', 1.65));
  const coverOut = ease(at(5, 'Now pull the cover', 1.85));
  const baseCalls = 7 * at(3, 'Watch the calls', 3.3);
  const lastCall = ease(at(5, 'Routine', 0.8));
  return {
    trace, lift, cover: coverIn * (1 - coverOut), coverIn, coverOut,
    tracedPencilExit: ease(at(0, 'How many', 0.85)),
    scoreEarly: ease(at(1, 'Eight out of eight', 0.3)) * (1 - lift),
    clean: ease(at(2, 'Now replay', 0.85)), count: baseCalls + lastCall,
    drawFirst: at(3, 'Watch the calls', 0.5),
    select: ease(at(4, 'One request left', 0.4)) * (1 - coverOut),
    lock: ease(at(5, 'Fix the predictions', 0.7)),
    showMargin: ease(at(5, 'The result', 0.4)),
    firstError: ease(at(6, 'The first', 0.35)),
    secondError: ease(at(6, 'The next', 0.35)),
    scoreLate: ease(at(6, 'Six of the eight', 0.4)),
  };
}

function clinch(ctx, amount) {
  // Two eccentric cams clamp the prediction film before the audit is uncovered.
  for (const x of [146, 1773]) {
    ctx.save();
    ctx.translate(x, 260);
    ctx.rotate(mix(Math.PI, 0.2, amount) * (x < 200 ? -1 : 1));
    box(ctx, -13, -11, 26, 46, 12, gradient(ctx, -9, -8, 12, 28, [[0, '#e0c591'], [0.55, '#b09160'], [1, '#77613f']]), '#5c5744', 2);
    circle(ctx, 0, 0, 6, '#5f6759');
    ctx.restore();
  }
}
function errorIndicator(ctx, i, alpha) {
  if (alpha <= 0) return;
  const x = column(i) + 59;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x - 9, lane(1));
  ctx.lineTo(x, lane(1));
  ctx.lineTo(x, lane(0));
  ctx.lineTo(x - 9, lane(0));
  ctx.strokeStyle = '#a3442c';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function footer(ctx, clock, s) {
  const y = 846;
  if (clock.index < 3) {
    const label = s.coverIn > 0.97 ? 'Audit covered' : 'Audit sheet';
    type(ctx, label, 143, y, 48, palette.ivory, 'Serif');
    if (s.scoreEarly > 0) {
      ctx.save(); ctx.globalAlpha = s.scoreEarly;
      type(ctx, strikes(traced) + ' of 8 match', 1761, y, 57, palette.ivory, 'Serif', 'right');
      ctx.restore();
    }
  } else if (clock.index === 3) {
    type(ctx, 'Ambiguity − 0.9 × policy support', 143, y, 54, palette.ivory, 'Serif');
    type(ctx, 'Review above 0', 1761, y, 49, palette.ivory, 'Serif', 'right');
  } else if (clock.index === 5 && s.lock < 1) {
    type(ctx, 'Audit covered', 143, y, 48, palette.ivory, 'Serif');
  } else {
    type(ctx, 'Predictions fixed', 143, y, 48, palette.ivory, 'Serif');
    if (s.scoreLate > 0) {
      ctx.save(); ctx.globalAlpha = s.scoreLate;
      type(ctx, strikes(routed) + ' of 8 match', 1761, y, 60, palette.ivory, 'Serif', 'right');
      ctx.restore();
    }
  }
}
function loupe(ctx, clock, s) {
  // A straight cut follows the pencil to r7. The optic samples the same sheet coordinates.
  const cx = 1344, cy = 482, radius = 424, scale = 1.82;
  const centerX = 1630, centerY = 508;
  ctx.fillStyle = gradient(ctx, 0, 0, 1880, 1080, [[0, '#345657'], [0.7, '#193335'], [1, '#14292c']]);
  ctx.fillRect(0, 0, 1920, 1080);
  type(ctx, 'Request ' + requests[last].id, 106, 217, 87, palette.ivory, 'Serif');
  line(ctx, 110, 264, 791, 264, '#819995', 2);
  const reading = (label, value, y, alpha) => {
    ctx.save();
    ctx.globalAlpha = ease(alpha);
    type(ctx, label, 111, y, 49, palette.dim);
    type(ctx, value, 783, y + 2, 62, palette.ivory, 'Mono', 'right');
    ctx.restore();
  };
  reading('Ambiguity', number(requests[last].opening.ambiguity), 390, cue(clock, 4, 'Its ambiguity', 0.4));
  reading('Policy support', String(requests[last].opening.support), 510, cue(clock, 4, 'its policy support', 0.4));
  const equation = number(requests[last].opening.ambiguity) + ' − 0.9 × ' + requests[last].opening.support;
  ctx.save();
  ctx.globalAlpha = ease(cue(clock, 4, 'Six tenths minus', 0.4));
  type(ctx, equation, 110, 712, 55, palette.ivory, 'Mono');
  const resultX = 110 + ctx.measureText(equation + ' ').width;
  if (s.showMargin > 0) {
    ctx.save(); ctx.globalAlpha = s.showMargin;
    type(ctx, '= ' + number(lastMargin), resultX, 712, 55, '#f7ce99', 'Mono');
    ctx.restore();
  }
  type(ctx, 'Review above 0', 113, 795, 48, palette.dim, 'Serif');
  ctx.restore();

  circle(ctx, cx + 9, cy + 15, radius + 24, '#0b212378');
  circle(ctx, cx, cy, radius + 23, gradient(ctx, cx - radius, cy - radius, cx + radius, cy + radius,
    [[0, '#d5bf96'], [0.21, '#736d59'], [0.48, '#e0cfaa'], [0.81, '#7a715a'], [1, '#b9a581']]));
  circle(ctx, cx, cy, radius + 13, '#273e40', '#d0c5a6', 2);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, 2 * Math.PI); ctx.clip();
  ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-centerX, -centerY);
  ctx.fillStyle = palette.enamel; ctx.fillRect(1300, 200, 650, 600);
  ctx.save();
  ctx.beginPath(); ctx.roundRect(glass.x, glass.y, glass.w, glass.h, 15); ctx.clip();
  auditPaper(ctx);
  cover(ctx, 1);
  guides(ctx, 1);
  acetate(ctx, routed, s.count);
  for (const value of [0, 1]) {
    type(ctx, value ? 'Review' : 'Routine', column(last), lane(value) + 51, 28, palette.ink, 'Serif', 'center');
  }
  ctx.restore();
  const hover = ease(cue(clock, 4, 'One request left', 0.95));
  const down = ease(cue(clock, 5, 'Routine', 0.58));
  const x = mix(column(last - 1), column(last), hover);
  const middle = (lane(0) + lane(1)) / 2 + 23;
  const y = mix(mix(lane(1), middle, hover), lane(0), down);
  pencil(ctx, x, y, 1 - down);
  ctx.restore();
  const rim = ctx.createRadialGradient(cx, cy, radius * 0.78, cx, cy, radius);
  rim.addColorStop(0, '#182c2c00'); rim.addColorStop(1, '#182c2c38');
  circle(ctx, cx, cy, radius, rim);
}

function draw(ctx, clock) {
  const s = scene(clock);
  if (clock.index === 4 || (clock.index === 5 && clock.reveal('Fix the predictions', 0.1) === 0)) {
    loupe(ctx, clock, s);
    return;
  }
  bench(ctx);
  ctx.save();
  ctx.beginPath(); ctx.roundRect(glass.x, glass.y, glass.w, glass.h, 15); ctx.clip();
  auditPaper(ctx);
  cover(ctx, s.cover);
  guides(ctx, s.select);
  if (s.lift < 1) acetate(ctx, traced, s.trace, -1800 * s.lift);
  if (s.clean > 0) acetate(ctx, routed, s.count, -1800 * (1 - s.clean));
  errorIndicator(ctx, errors[0], s.firstError);
  errorIndicator(ctx, errors[1], s.secondError);
  ctx.restore();
  clinch(ctx, s.lock);
  footer(ctx, clock, s);
  if (clock.index === 0 && s.tracedPencilExit < 1) {
    const pos = strokeAt(traced, s.trace);
    pencil(ctx, pos.x + 330 * s.tracedPencilExit, pos.y - 600 * s.tracedPencilExit, 1 - pos.pressure);
  } else if (clock.index >= 3 && clock.index <= 5 && s.drawFirst > 0 && s.lock < 1) {
    const pos = strokeAt(routed, s.count);
    pencil(ctx, pos.x - (1 - s.drawFirst) * 440 + s.lock * 390, pos.y - (1 - s.drawFirst) * 560 - s.lock * 770, 1 - pos.pressure);
  }
}

function check() {
  assert.deepEqual(routed, [1, 0, 1, 0, 1, 0, 1, 0]);
  assert.deepEqual(errors.map(i => requests[i].id), ['r6', 'r7']);
  assert.equal(strikes(traced), 8);
  assert.equal(strikes(routed), 6);
  assert.ok(Math.abs(lastMargin + 0.3) < 1e-9);
  assert.equal(route({ ambiguity: 0.9, support: 1 }).call, 0);
  for (const call of [0, 1]) {
    const calls = Array(8).fill(call);
    const tip = strokeAt(calls, calls.length);
    assert.equal(tip.x, column(last));
    assert.equal(tip.y, lane(call));
  }
  return true;
}

export default { title: 'What gave the router a perfect score?', beats, draw, check };
