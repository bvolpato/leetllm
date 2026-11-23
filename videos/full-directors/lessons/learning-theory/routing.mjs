import assert from 'node:assert/strict';
import {
  fixedSampleLosses,
  repeatedErrors,
  unionRadius,
} from '../../../films/learning-theory/fixtures.mjs';
import {
  P,
  axis,
  background,
  beat,
  clamp,
  cue,
  dot,
  end,
  heading,
  label,
  lerp,
  line,
  mark,
  percent,
  pin,
  plate,
  polygon,
  rect,
  sum,
  ticket,
} from './drawing.mjs';

const candidates = [
  { name: 'P2', miss: [2, 7, 12, 16, 24, 29, 38] },
  { name: 'P7', miss: fixedSampleLosses.flatMap((v, i) => (v ? [i + 1] : [])) },
  { name: 'P9', miss: [3, 7, 15, 21, 33, 40] },
];
const charge = 3;
const sampleOrder = [
  charge,
  ...Array.from({ length: 40 }, (_, i) => i + 1).filter((i) => i !== charge),
];
const types = Array.from({ length: 100 }, (_, i) => i % 5 === 0);
export const gate = 0.2;
export function bounds(errors, n, m) {
  const observed = errors / n,
    radius = unionRadius(m, n),
    upper = Math.min(1, observed + radius);
  return { errors, n, m, observed, radius, upper, passes: upper < gate };
}
export function ruler(
  c,
  {
    s,
    extend = 0,
    completed = false,
    min = 0,
    max = 0.5,
    ticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5],
    y = 635,
  },
) {
  const x = axis(c, 210, 1710, y + 120, min, max, ticks, (v) => percent(v));
  const gx = x(gate);
  line(c, gx, y - 114, gx, y + 115, P.pink, 4);
  label(c, '20% gate', gx, y - 147, 35, P.pink, 'center');
  const here = x(s.observed),
    tip = x(lerp(s.observed, s.upper, extend));
  rect(c, here, y - 7, Math.max(0, tip - here), 14, P.blue);
  if (tip > here + 3) line(c, tip, y - 27, tip, y + 25, P.blue, 8);
  pin(c, here, y, P.gold, 16);
  label(
    c,
    percent(s.observed, s.observed === 0.13 || s.observed === 0.1 ? 0 : 2) + ' observed',
    here,
    y + 63,
    36,
    P.gold,
    'center',
  );
  if (completed)
    label(
      c,
      percent(s.upper, s.n === 40 ? 1 : 2),
      tip + (Math.abs(tip - gx) < 95 ? 18 : 0),
      y - 49,
      48,
      P.cream,
      Math.abs(tip - gx) < 95 ? 'left' : 'center',
      'Mono',
      600,
    );
}
function chute(c, x, y, name, bad = false) {
  polygon(
    c,
    [
      [x, y],
      [x + 385, y],
      [x + 351, y + 130],
      [x + 35, y + 130],
    ],
    '#061923',
  );
  polygon(
    c,
    [
      [x + 18, y + 20],
      [x + 367, y + 20],
      [x + 338, y + 110],
      [x + 48, y + 110],
    ],
    P.seam,
  );
  rect(c, x - 7, y + 102, 400, 96, P.metal, 12);
  label(c, name, x + 193, y + 150, 42, P.cream, 'center');
  if (bad) {
    dot(c, x + 363, y + 80, 26, P.deep);
    mark(c, x + 363, y + 80, true, 20);
  }
}
export function opening(c, k) {
  background(c);
  const route = cue(k, 1, 'P seven sends', 1.5);
  const pull = cue(k, 1, 'Pull back', 1.4),
    compare = cue(k, 1, 'score three prompts', 2.6);
  const chosen = cue(k, 2, 'Look at the run count', 0.3) === 1;
  const pool = cue(k, 2, 'Thirty six correct', 0.3) === 1;
  heading(
    c,
    pull < 0.5 ? 'Where should ticket 03 go?' : 'Which prompt misroutes the fewest tickets?',
    pull < 0.5
      ? 'Incoming support request'
      : 'Development batch   /   the same forty tickets in every row',
  );
  c.save();
  c.translate(lerp(0, 92, pull), lerp(0, -5, pull));
  const scale = lerp(1, 0.59, pull);
  c.scale(scale, scale);
  line(c, 750, 403, 480, 600, P.seam, 13);
  line(c, 862, 403, 1280, 600, P.seam, 13);
  chute(c, 260, 560, 'Billing');
  chute(c, 1090, 560, 'Password resets', route === 1);
  const x = lerp(656, 1120, route);
  const y = lerp(242, 442, route);
  if (route < 1) {
    ticket(c, x, y, 430, 175, '', '', '03');
    label(c, 'One subscription', x + 245, y + 37, 39, P.ink, 'center', 'Serif', 600);
    const firstCharge = cue(k, 1, 'One subscription', 0) === 1;
    if (firstCharge) {
      label(c, 'May 8', x + 92, y + 88, 38, P.ink);
      label(c, '$18', x + 390, y + 88, 38, P.ink, 'right', 'Mono');
    }
    const secondCharge = cue(k, 1, 'Two charges', 0.7);
    if (secondCharge > 0) {
      c.save();
      c.beginPath();
      c.rect(x + 73, y + 112, 340, 51);
      c.clip();
      const rowY = y + 140 + 47 * (1 - secondCharge);
      label(c, 'May 8', x + 92, rowY, 38, P.ink);
      label(c, '$18', x + 390, rowY, 38, P.ink, 'right', 'Mono');
      c.restore();
    }
  } else {
    ticket(c, x, y, 430, 175, 'Charged twice', 'One subscription', '03');
  }
  c.restore();
  if (pull <= 0) return;
  c.save();
  c.globalAlpha = pull;
  label(
    c,
    pool ? '1,000 prompts scored' : '3 prompts in view',
    1735,
    324,
    48,
    P.gold,
    'right',
    'Serif',
  );
  if (chosen) label(c, 'Lowest error   P7', 1735, 390, 35, P.dim, 'right');
  const seen = new Set(sampleOrder.slice(0, 1 + Math.floor(39 * compare)));
  candidates.forEach((row, r) => {
    const y = 500 + 116 * r;
    rect(c, 108, y, 1700, 91, chosen && row.name === 'P7' ? '#3b5050' : P.metal, 9);
    label(
      c,
      row.name,
      170,
      y + 45,
      40,
      chosen && row.name === 'P7' ? P.gold : P.cream,
      'center',
      'Mono',
      700,
    );
    for (let j = 1; j <= 40; j++) {
      const x = 272 + (j - 1) * 32 + Math.floor((j - 1) / 10) * 23;
      if (seen.has(j)) mark(c, x, y + 45, row.miss.includes(j), 16);
      else dot(c, x, y + 45, 3, P.seam);
    }
    label(
      c,
      row.miss.filter((i) => seen.has(i)).length + ' / ' + seen.size,
      1750,
      y + 45,
      33,
      P.cream,
      'right',
      'Mono',
    );
  });
  if (beat(k) === 3)
    label(
      c,
      'Release requires an upper bound below 20% on future tickets.',
      960,
      453,
      42,
      P.gold,
      'center',
      'Serif',
    );
  c.restore();
}

function sampleGap(c, k) {
  const firstMisses = sum(fixedSampleLosses);
  const realQueue = k.reveal('On a real queue', 0.975) === 1;
  const hardDraw = !realQueue && k.reveal('A particularly hard sample', 0) === 1;
  const misses = hardDraw ? 12 : firstMisses;
  const sample = misses / fixedSampleLosses.length;
  const populationRisk = sum(types) / types.length;
  const gapPoints = Math.round(100 * (populationRisk - sample));
  const answer = hardDraw
    ? k.reveal('A particularly hard sample', 3.8)
    : k.reveal('Those ten percentage points', 1.588);
  const trace = clamp((answer - 0.7) / 0.3);

  heading(
    c,
    realQueue ? 'What can we measure on the real queue?' : 'Which way does the gap go?',
    'Generalization gap = population risk − sample risk',
    true,
  );
  const x = axis(c, 225, 1695, 628, 0, 0.4, [0, 0.1, 0.2, 0.3, 0.4], (v) => percent(v), true);
  const from = x(sample);
  const to = x(populationRisk);
  label(
    c,
    realQueue ? 'Population risk is unknown' : 'Same toy queue  ·  20 miss types in 100',
    960, 282, 47, P.ink, 'center', 'Serif',
  );
  if (!realQueue) {
    line(c, to, 411, to, 617, P.brass, 5);
    label(c, percent(populationRisk) + ' population risk', to, 378, 44, P.ink, 'center');
    pin(c, to, 522, P.gold, 15);
  }

  label(c, hardDraw ? 'Example of a harder draw' : 'Original draw', from, 748, 50, P.teal, 'center', 'Serif');
  label(c, misses + ' / 40 = ' + percent(sample) + ' sample risk', from, 818, 43, P.ink, 'center');
  line(c, from, 522, from, 620, P.teal, 5);
  pin(c, from, 522, P.teal, 15);
  if (realQueue || trace <= 0) return;

  const tip = lerp(from, to, trace);
  const direction = Math.sign(to - from);
  const head = Math.min(23, Math.abs(tip - from));
  line(c, from, 522, tip - direction * head / 2, 522, P.teal, 10);
  polygon(c, [[tip, 522], [tip - direction * head, 522 - head / 1.5],
    [tip - direction * head, 522 + head / 1.5]], P.teal);
  if (answer === 1) {
    const signed = (gapPoints > 0 ? '+' : '−') + Math.abs(gapPoints);
    label(c, signed + ' points', (from + to) / 2, 453, 56, P.teal, 'center', 'Serif', 600);
  }
}

export function population(c, k) {
  background(c, 'paper');
  if (beat(k) === 3) {
    sampleGap(c, k);
    return;
  }
  heading(c, 'What does four out of forty measure?', 'P7   /   zero-one routing loss', true);
  const num = Math.floor(40 * cue(k, 1, 'Read P seven', 3.5));
  label(c, 'The scored tickets', 330, 303, 45, P.ink, 'center', 'Serif');
  for (let i = 0; i < 40; i++) {
    const x = 112 + (i % 10) * 60,
      y = 390 + Math.floor(i / 10) * 70;
    rect(c, x, y, 48, 54, '#fff9e9', 5);
    if (i < num)
      label(
        c,
        fixedSampleLosses[i],
        x + 24,
        y + 29,
        31,
        fixedSampleLosses[i] ? P.red : P.teal,
        'center',
        'Mono',
        700,
      );
  }
  if (num > 0)
    label(
      c,
      sum(fixedSampleLosses.slice(0, num)) + ' misses / ' + num + ' tickets',
      385,
      730,
      38,
      P.ink,
      'center',
    );
  if (cue(k, 1, "That's the empirical", 0.2))
    label(
      c,
      percent(sum(fixedSampleLosses) / 40) + ' empirical risk',
      385,
      798,
      45,
      P.teal,
      'center',
      'Serif',
    );
  if (beat(k) < 2) return;
  const n = Math.floor(100 * cue(k, 2, 'a hundred equally likely', 2));
  label(c, 'A toy queue', 1274, 303, 45, P.ink, 'center', 'Serif');
  types
    .slice(0, n)
    .forEach((v, i) => mark(c, 985 + (i % 20) * 34, 425 + Math.floor(i / 20) * 49, v, 14, true));
  if (n === 100) label(c, sum(types) + ' miss types / 100 types', 1307, 730, 38, P.ink, 'center');
  if (end(k, 2))
    label(
      c,
      percent(sum(types) / 100) + ' population risk',
      1307,
      798,
      45,
      P.red,
      'center',
      'Serif',
    );
}

export function concentration(c, k) {
  background(c);
  const b = beat(k),
    s = bounds(4, 40, 1);
  heading(
    c,
    'One prompt fixed before the draw',
    'Independent tickets from one queue    ·    loss between 0 and 1',
  );
  if (b < 3) {
    label(c, 'P7 fixed', 125, 332, 42, P.gold, 'left', 'Serif');
    const seen = Math.floor(40 * cue(k, 1, 'forty examples', 3.4));
    fixedSampleLosses.forEach((v, i) => {
      const x = 450 + i * 32;
      if (i < seen) mark(c, x, 336, v, 14);
      else dot(c, x, 336, 3, P.seam);
    });
    const span = cue(k, 2, 'Adding that', 1.6);
    const x = axis(c, 220, 1700, 730, 0, 0.6, [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], (v) => percent(v));
    if (seen === 40) {
      const lo = Math.max(0, s.observed - s.radius * span),
        hi = s.observed + s.radius * span;
      rect(c, x(lo), 597, x(hi) - x(lo), 12, P.blue);
      pin(c, x(s.observed), 603, P.gold);
      if (span === 1) {
        line(c, x(hi), 575, x(hi), 630, P.blue, 7);
        label(c, percent(hi, 1), x(hi), 532, 48, P.cream, 'center', 'Mono');
      }
      label(c, '4 / 40', x(0.1), 664, 34, P.gold, 'center');
    }
    if (b === 2) {
      label(c, 'Two-sided radius   √[ ln(2 / 0.05) / (2 × 40) ]', 957, 416, 43, P.dim, 'center');
      if (cue(k, 2, 'If we had specified', 0.2))
        label(c, 'Upper tail alone would use ln(1 / δ).', 960, 468, 32, P.dim, 'center');
    }
  } else {
    const x = axis(c, 412, 1684, 788, 0, 0.8, [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], (v) =>
      percent(v),
    );
    line(c, x(0.2), 255, x(0.2), 782, P.good, 4);
    label(c, 'Toy risk 20%', x(0.2), 221, 34, P.good, 'center');
    const visible = 1 + Math.floor(11 * cue(k, 3, 'Each batch', 4.8));
    repeatedErrors.slice(0, visible).forEach((e, i) => {
      const y = 282 + i * 44,
        h = bounds(e, 40, 1),
        color = Math.abs(h.observed - 0.2) > h.radius ? P.pink : P.blue;
      label(c, 'Batch ' + (i + 1) + '   ' + e + '/40', 112, y, 26, P.dim);
      line(c, x(Math.max(0, h.observed - h.radius)), y, x(h.upper), y, color, 7);
      pin(c, x(h.observed), y, P.gold, 7);
    });
  }
}

const destinations = ['A', 'B'];
const pairs = destinations.flatMap((a) => destinations.map((b) => [a, b]));
const wrong = (row, stamp) => row.filter((v) => v !== stamp).length;
const pick = (row) => (wrong(row, 'B') < wrong(row, 'A') ? 'B' : 'A');
function pairScene(c, k) {
  const switchB = cue(k, 8, 'Switch its stamp', 0.8) === 1;
  const n = beat(k),
    firstX = 168,
    spacing = 420;
  if (n === 9) {
    const locked = pick(pairs[3]);
    heading(
      c,
      'Lock the stamp from the BB pair',
      'The setting stays at B while a fresh address can be A or B.',
    );
    plate(c, 132, 321, 640, 444);
    label(c, 'Pair that chose ' + locked, 452, 386, 45, P.gold, 'center', 'Serif');
    pairs[3].forEach((v, i) => {
      ticket(c, 180 + 274 * i, 462, 247, 158, 'To ' + v, 'Sent to ' + locked);
      mark(c, 302 + i * 274, 678, v !== locked, 20);
    });
    label(c, 'Fresh ticket', 961, 359, 47, P.paper, 'left', 'Serif');
    const shown = [cue(k, 9, 'A fresh ticket for B', 0.6), cue(k, 9, 'A fresh ticket for A', 0.6)];
    ['B', 'A'].forEach((v, i) => {
      if (shown[i] !== 1) return;
      const x = 945 + 415 * i;
      ticket(c, x, 465, 360, 155, 'To ' + v, 'Sent to ' + locked);
      mark(c, x + 177, 680, v !== locked, 26);
      label(c, 'Chance ½', x + 177, 749, 34, P.dim, 'center');
    });
    if (cue(k, 9, 'Selecting the lowest', 0.1))
      label(
        c,
        'Perfect on BB. One miss in two possible fresh destinations.',
        960,
        810,
        43,
        P.cream,
        'center',
        'Serif',
      );
    return;
  }
  heading(
    c,
    'Let the tickets choose the stamp',
    'Two independent draws    ·    A and B are equally likely',
  );
  pairs.forEach((row, i) => {
    const x = firstX + spacing * i,
      selected = switchB ? pick(row) : 'A';
    plate(c, x - 44, 326, 368, 304);
    label(c, 'Send all to ' + selected, x + 140, 383, 35, P.gold, 'center');
    row.forEach((v, j) => {
      const xx = x + j * 149;
      rect(c, xx, 441, 135, 139, P.paper, 4);
      label(c, v, xx + 68, 500, 57, P.ink, 'center', 'Serif');
      mark(c, xx + 69, 551, v !== selected, 21, true);
    });
    label(c, wrong(row, selected) + ' / 2 misses', x + 140, 692, 34, P.cream, 'center', 'Mono');
  });
  if (end(k, 8)) label(c, 'Same-pair score   2 / 8 = 25%', 145, 798, 42, P.gold);
}
export function search(c, k) {
  background(c);
  const b = beat(k);
  if (b >= 7 && b <= 9) {
    pairScene(c, k);
    return;
  }
  if (b >= 10) {
    heading(c, 'A failure changes the next prompt', 'Adaptive search');
    ticket(c, 160, 354, 430, 190, 'Charged twice', 'Missed by P7', '03');
    const edit = cue(k, 10, 'writes a new prompt', 1);
    if (edit) {
      line(c, 590, 450, 775, 450, P.gold, 5);
      plate(c, 775, 342, 480, 212);
      label(c, 'Revised prompt', 1015, 427, 46, P.cream, 'center', 'Serif');
      label(c, 'Uses ticket 03', 1015, 498, 34, P.pink, 'center');
    }
    if (b === 11) {
      line(c, 1256, 453, 1410, 453, P.blue, 5);
      ticket(c, 1420, 361, 390, 184, 'Fresh draw', 'Score once');
      label(
        c,
        'Freeze the revision before drawing the evaluation tickets.',
        960,
        747,
        46,
        P.good,
        'center',
        'Serif',
      );
    } else
      label(
        c,
        'Which choices could the engineer have made?',
        950,
        747,
        46,
        P.gold,
        'center',
        'Serif',
      );
    return;
  }
  const m = b < 2 ? 1 : b < 4 ? 10 : 1000,
    s = bounds(4, 40, m);
  heading(
    c,
    'How much search did this batch pay for?',
    'P7   /   four misses on forty independent tickets',
  );
  plate(c, 124, 255, 1669, 155);
  label(
    c,
    m === 1 ? '1 fixed prompt' : m.toLocaleString('en-US') + ' prespecified prompts',
    194,
    334,
    44,
    P.cream,
    'left',
    'Serif',
  );
  label(
    c,
    'Failure allowance per prompt   ' + (0.05 / m).toString(),
    1720,
    334,
    34,
    P.gold,
    'right',
    'Mono',
  );
  const ext =
    m === 1
      ? cue(k, 1, 'four failures', 1.3)
      : m === 10
        ? cue(k, 3, 'The upper endpoint', 1.25)
        : cue(k, 5, 'as the endpoint', 1.3);
  ruler(c, { s, extend: ext, completed: ext === 1, y: 635 });
  if (b >= 5)
    label(
      c,
      'Upper bound = 4/40 + √[ ln(2 × 1,000 / 0.05) / (2 × 40) ]',
      960,
      448,
      39,
      P.dim,
      'center',
    );
}

export function checkRouting() {
  assert.deepEqual(
    candidates.map((r) => r.miss.length),
    [7, 4, 6],
  );
  assert.deepEqual(candidates[1].miss, [3, 12, 24, 38]);
  assert.equal(new Set(sampleOrder).size, 40);
  assert.equal(sampleOrder[0], charge);
  assert.equal(sum(types), 20);
  assert.equal(sum(fixedSampleLosses), 4);
  assert.deepEqual(
    [1, 10, 1000].map((m) => percent(bounds(4, 40, m).upper, 1)),
    ['31.5%', '37.4%', '46.4%'],
  );
  assert.equal(repeatedErrors.filter((e) => Math.abs(e / 40 - 0.2) > unionRadius(1, 40)).length, 1);
  assert.deepEqual(pairs.map(pick), ['A', 'A', 'A', 'B']);
  assert.deepEqual(
    pairs.map((row) => wrong(row, pick(row))),
    [0, 1, 1, 0],
  );
  assert.equal(sum(pairs.map((row) => wrong(row, 'A'))) / 8, 0.5);
  assert.equal(wrong(destinations, pick(pairs[3])) / 2, 0.5);
}
