import {
  P,
  mix,
  neat,
  cue,
  type,
  line,
  rect,
  dot,
  arrow,
  background,
  heading,
  bracket,
  ruler,
  screw,
  plate,
  segment,
  readout,
} from './instruments.mjs';
import {
  customer,
  customerRail,
  visibleMessages,
  privacyEventBand,
  releaseEvent,
  audit,
  passages,
  wheel,
} from './examples.mjs';
import booth from '../../../director-cuts/lessons/differential-privacy/film.mjs';

const start = 285,
  unit = 695,
  at = (v) => start + unit * v;
function saddle(c, y, sum) {
  rect(c, at(0) - 14, y + 113, unit * 2 + 28, 16, '#647970', null, 6);
  ruler(c, at(0), y + 132, unit, 2);
  line(c, at(sum), y + 103, at(sum), y + 140, P.ink, 4);
}
function endMark(c, y, sum) {
  type(c, neat(sum), at(sum), y - 30, 42, P.ink, 'center', 'Mono', 600);
}
function pieces(c, y, values, offset = 0) {
  segment(c, at(0), y, unit * customer.bao, 104, P.jade, P.teal, '0.25', 'Bao');
  let left = customer.bao;
  for (const [i, v] of values.entries()) {
    segment(
      c,
      at(left),
      y - offset,
      unit * v,
      104,
      i ? P.sky : '#b0d7ee',
      P.blue,
      neat(v),
      'Alice  ·  ticket ' + (i + 1),
    );
    left += v;
  }
}
export function opening(c, k) {
  background(c);
  const first = cue(k, 1, 'Slide Alice’s first', 0.72),
    second = cue(k, 1, 'then her second', 0.72);
  const copy = cue(k, 2, 'Keep the upper sum still'),
    lift = cue(k, 3, 'Lift out both', 1.05);
  const settled = lift === 1,
    question = cue(k, 2, 'If Alice leaves') && !lift;
  type(c, 'Training sum', 150, 132, 75, P.ink, 'left', 'Serif');
  type(
    c,
    cue(k, 2, 'The team promises') ? 'Proposed customer limit   1' : 'Limit per ticket   1',
    1725,
    135,
    37,
    P.muted,
    'right',
  );
  plate(c, 108, 228, 1704, copy ? 668 : 549);
  const y = copy ? 332 : 492;
  const count = Number(first === 1) + Number(second === 1);
  const sum = customer.bao + customer.aliceTickets.slice(0, count).reduce((a, b) => a + b, 0);
  saddle(c, y, sum);
  pieces(c, y, []);
  customer.aliceTickets.forEach((v, i) => {
    const t = i ? second : first;
    segment(
      c,
      at(customer.bao + i * v),
      y - 195 * (1 - t),
      unit * v,
      104,
      P.sky,
      P.blue,
      neat(v),
      'Alice  ·  ticket ' + (i + 1),
    );
  });
  if ((first === 0 || first === 1) && (second === 0 || second === 1)) endMark(c, y, sum);
  if (copy) {
    const y2 = 646;
    saddle(c, y2, settled ? customer.bao : customer.bao + customer.aliceRaw);
    pieces(c, y2, []);
    c.save();
    c.globalAlpha = 1 - lift;
    for (const [i, v] of customer.aliceTickets.entries())
      segment(
        c,
        at(customer.bao + i * v),
        y2 - 86 * lift,
        unit * v,
        104,
        P.sky,
        P.blue,
        neat(v),
        'Alice  ·  ticket ' + (i + 1),
      );
    c.restore();
    if (lift === 0 || settled) endMark(c, y2, settled ? customer.bao : sum);
    if (question)
      type(
        c,
        'If Alice leaves, how far does this endpoint move?',
        960,
        955,
        45,
        P.ink,
        'center',
        'Serif',
      );
    if (settled && cue(k, 3, 'Calibrating noise'))
      bracket(
        c,
        at(customer.bao),
        at(customer.bao + customer.aliceRaw),
        914,
        'Customer change   ' + neat(customer.aliceRaw),
        P.plum,
      );
  }
}

export function adjacency(c, k) {
  background(c);
  const b = k.beat.beatIndex;
  const rules = [
    ['one message', 'Remove just the last message', 1],
    ['one ticket', 'remove the last ticket', 4],
    ['one customer', 'remove Alice', 12],
  ];
  const [name, phrase, count] = rules[b],
    removal = cue(k, b + 1, phrase, 0.55),
    removed = removal === 1 ? count : 0;
  heading(
    c,
    'Alice’s support history',
    'Three tickets hold twelve messages. Bao’s ticket belongs to a different customer.',
  );
  const xs = [375, 741, 1107, 1495],
    tw = 305,
    originalY = 307,
    copyY = 605,
    ticketHeight = 195;
  for (const row of [0, 1]) {
    const y = row ? copyY : originalY;
    type(c, row ? 'Copy' : 'Original', 110, y + 110, 42, P.ink, 'left', 'Serif');
    for (let t = 0; t < 4; t++) {
      const x = xs[t],
        alice = t < 3,
        col = alice ? P.blue : P.teal;
      const visible = visibleMessages(t, row ? removed : 0);
      if (visible.some(Boolean)) {
        rect(c, x, y, tw, ticketHeight, alice ? '#e2ebea' : '#ddebdc', col, 12, 3);
        rect(c, x, y, tw, 49, alice ? P.sky : P.jade, null, 10);
        type(c, (alice ? 'Alice' : 'Bao') + '  /  T' + (t + 1), x + 19, y + 25, 28, col);
      } else rect(c, x, y, tw, ticketHeight, null, P.line, 12, 2);
      visible.forEach((v, i) => {
        const xx = x + 24 + (i % 2) * 137,
          yy = y + 66 + Math.floor(i / 2) * 58;
        if (!v) return;
        rect(c, xx, yy, 119, 44, P.light, col, 8);
        line(c, xx + 16, yy + 16, xx + 101, yy + 16, col, 3);
        line(c, xx + 16, yy + 28, xx + 74, yy + 28, col, 3);
      });
    }
  }
  if (b === 1 && removal > 0) {
    const x = xs[2],
      center = x + tw / 2,
      bottom = originalY + ticketHeight;
    rect(c, x, originalY, tw, ticketHeight, null, P.plum, 12, 6);
    line(c, center, bottom, center, mix(bottom, copyY, removal), P.plum, 6);
    if (removed) {
      c.save();
      c.setLineDash([20, 12]);
      rect(c, x, copyY, tw, ticketHeight, null, P.plum, 12, 6);
      c.restore();
    }
  }
  type(
    c,
    removed ? 'Remove ' + name : 'Two identical copies',
    110,
    914,
    46,
    P.ink,
    'left',
    'Serif',
  );
  type(
    c,
    'Alice’s remaining messages   ' + neat(12 - removed) + ' / 12',
    1800,
    915,
    37,
    P.blue,
    'right',
  );
}

export function aggregate(c, k) {
  background(c);
  const joined = cue(k, 1, 'Join Alice’s tickets'),
    clipped = !!cue(k, 2, 'Clip Alice’s combined contribution'),
    divided = !!cue(k, 3, 'Read the endpoints'),
    s = customerRail(clipped, divided);
  heading(
    c,
    divided ? 'Both sums divided by two' : 'One contribution per customer',
    divided
      ? 'Same public divisor on both datasets  ·  before noise'
      : 'Sum before noise  ·  customer limit C = 1',
  );
  for (const [i, y] of [339, 656].entries()) {
    const total = i ? s.other : s.full;
    type(c, i ? 'Without Alice' : 'With Alice', start, y - 64, 35, P.muted);
    saddle(c, y, total);
    if (!i && !joined) pieces(c, y, customer.aliceTickets);
    else {
      segment(c, at(0), y, s.bao * unit, 104, P.jade, P.teal, neat(s.bao), 'Bao');
      if (!i) segment(c, at(s.bao), y, s.alice * unit, 104, P.sky, P.blue, neat(s.alice), 'Alice');
    }
    type(c, neat(total), at(total) + 24, y + 52, 44, P.ink, 'left', 'Mono');
  }
  if (k.beat.beatIndex === 0)
    type(c, 'After one customer clip, how far apart?', 960, 951, 43, P.ink, 'center', 'Serif');
  else if (cue(k, 2, 'Even a customer') && (!divided || cue(k, 3, 'These are values')))
    bracket(c, at(s.other), at(s.full), 902, 'Gap   ' + neat(s.delta));
}

export function event(c, k) {
  background(c, true);
  const { epsilon, slack, withoutAlice: q, withAlice: p, scale } = releaseEvent;
  const showQ = cue(k, 1, 'Suppose the event happens'),
    upper = cue(k, 2, 'raise epsilon to one half', 0.95),
    lower = cue(k, 2, 'Swap the datasets'),
    widen = cue(k, 4, 'Add one ten-thousandth', 2.4);
  const e = epsilon * upper,
    d = slack * widen,
    pure = privacyEventBand(e, 0, q),
    band = privacyEventBand(e, d, q);
  const x = (probability) => 150 + 81 * scale * probability;
  const y = 650;
  const denominator = scale.toLocaleString('en-US');
  type(c, 'Event: released total ≥ 2', 110, 130, 74, P.light, 'left', 'Serif');
  type(c, 'Expected occurrences per ' + denominator + ' releases', 110, 228, 36, P.sky);
  line(c, x(0), y, x(20 / scale), y, '#849c96', 5);
  for (let i = 0; i <= 20; i++) {
    const xx = x(i / scale);
    line(c, xx, y - 8, xx, y + 18, P.light, 2);
    if (i % 2 === 0) type(c, String(i), xx, y + 59, 32, P.light, 'center', 'Mono');
  }
  if (lower) {
    rect(c, x(pure.lower), y - 47, x(pure.upper) - x(pure.lower), 33, P.jade);
    if (widen) {
      rect(c, x(band.lower), y - 47, x(pure.lower) - x(band.lower), 33, P.gold);
      rect(c, x(pure.upper), y - 47, x(band.upper) - x(pure.upper), 33, P.gold);
    }
    line(c, x(band.lower), y - 60, x(band.lower), y - 6, P.light, 4);
    type(c, 'q ≤ exp(ε) p + δ', 150, 321, 44, P.light, 'left', 'Mono');
    type(c, 'p ≥ (q − δ) / exp(ε)', 150, 387, 44, P.jade, 'left', 'Mono');
    type(
      c,
      'Lower edge ≈ ' + (scale * band.lower).toFixed(2),
      x(band.lower),
      752,
      38,
      P.jade,
      'center',
    );
  }
  if (upper) {
    type(c, 'p ≤ exp(ε) q + δ', 1770, 321, 44, P.light, 'right', 'Mono');
    line(c, x(band.upper), y - 60, x(band.upper), y - 6, P.light, 4);
    if (upper === 1) {
      type(
        c,
        'Upper edge ≈ ' + (scale * band.upper).toFixed(2),
        x(band.upper),
        752,
        38,
        P.jade,
        'center',
      );
    }
  }
  if (showQ) {
    const label = 'Without Alice  ·  q = ' + q * scale + '/' + denominator;
    line(c, x(q), 504, x(q), y - 7, P.sky, 4);
    type(c, label, x(q), 470, 36, P.sky, 'center');
  }
  if (cue(k, 3, 'seventeen in ten thousand')) {
    const label = 'With Alice  ·  p = ' + p * scale + '/' + denominator;
    line(c, x(p), 504, x(p), y - 43, P.rose, 3);
    dot(c, x(p), y - 31, 12, P.rose, P.dark, 3);
    type(c, label, x(p), 470, 36, P.rose, 'center');
  }
  type(
    c,
    'ε = ' + e.toFixed(2),
    150,
    837,
    43,
    P.light,
    'left',
    'Mono',
  );
  const deltaLabel = widen > 0 && widen < 1 ? 'Adding δ' : 'δ = ' + neat(d, 4);
  type(c, deltaLabel, 404, 837, 43, P.gold, 'left', 'Mono');
  const misses = widen === 0 && cue(k, 4, 'the proposal misses');
  const fits = widen === 1 && cue(k, 4, 'point fits') && p >= band.lower && p <= band.upper;
  if (misses || fits) {
    type(
      c,
      (fits ? 'Inside' : 'Outside') + ' this interval',
      1770,
      837,
      44,
      fits ? P.jade : P.rose,
      'right',
      'Serif',
    );
  }
}
export function audits(c, k) {
  background(c);
  const b = k.beat.beatIndex + 1;
  if (b <= 3) {
    if (b === 3 && cue(k, 3, 'An extraction audit')) {
      heading(c, 'Did the text reappear?', 'A separate audit on known synthetic training passages');
      const known = cue(k, 3, 'Either audit measures');
      type(c, 'Reference passage', 156, 349, 36, P.muted);
      type(c, 'Observed output', 843, 349, 36, P.muted);
      passages.forEach(({ reference, output }, i) => {
        const y = 486 + i * 207;
        type(c, reference, 154, y, 44, P.ink, 'left', 'Serif');
        type(c, output, 843, y, 44, P.ink, 'left', 'Serif');
        line(c, 153, y + 72, 1754, y + 72, P.line, 2);
        if (known)
          type(
            c,
            reference === output ? 'Exact match' : 'Incomplete',
            1754,
            y,
            33,
            reference === output ? P.teal : P.plum,
            'right',
          );
      });
      return;
    }
    heading(
      c,
      'Two synthetic audit documents',
      'Lower loss means the model finds the phrase easier to predict.',
    );
    const ref = cue(k, 2, 'Compare a reference model'),
      known = cue(k, 2, 'Open the known labels');
    for (const [i, r] of audit.entries()) {
      const x = 140 + i * 831,
        y = 292;
      plate(c, x, y, 762, 473);
      type(c, r.name, x + 66, y + 86, 49, P.ink, 'left', 'Serif');
      for (const [j, score] of [r.target, r.reference].entries()) {
        if (j && !ref) continue;
        const yy = y + 193 + j * 91;
        type(c, j ? 'Reference loss' : 'Target loss', x + 60, yy, 31, P.muted);
        rect(c, x + 319, yy - 15, score * 234, 31, j ? P.blue : P.teal, null, 5);
        type(c, score.toFixed(2), x + 335 + score * 234, yy, 29, P.ink, 'left', 'Mono');
      }
      if (known)
        type(
          c,
          r.member ? 'In training' : 'Outside training',
          x + 68,
          y + 397,
          39,
          r.member ? P.blue : P.plum,
        );
    }
    type(
      c,
      b === 3
        ? 'Calling both members gives one false positive.'
        : known
          ? 'The known labels differ.'
          : 'Which document was in training?',
      960,
      879,
      42,
      P.ink,
      'center',
      'Serif',
    );
    return;
  }
  const cx = 593,
    cy = 537,
    r = 332,
    whole = cue(k, 4, 'The last slot releases'),
    cost = cue(k, 5, 'On that outcome');
  for (let i = 0; i < wheel.length; i++) {
    const a = ((i - 5) * Math.PI) / 10,
      z = a + Math.PI / 10,
      all = wheel[i] === 'all' && whole;
    c.beginPath();
    c.moveTo(cx, cy);
    c.arc(cx, cy, r, a, z);
    c.closePath();
    c.fillStyle = all ? P.plum : i % 2 ? '#c4d8cb' : '#d8e4d9';
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = P.paper;
    c.stroke();
    const px = cx + Math.cos((a + z) / 2) * 279,
      py = cy + Math.sin((a + z) / 2) * 279;
    type(c, all ? 'D' : i === 19 ? '?' : '0', px, py, 29, all ? P.light : P.teal, 'center', 'Mono');
  }
  dot(c, cx, cy, 134, P.light, P.line, 3);
  type(c, 'One draw', cx, cy - 18, 37, P.ink, 'center', 'Serif');
  type(c, '20 equal slots', cx, cy + 36, 27, P.muted, 'center');
  readout(c, 1060, 292, '19 slots return a constant', '0', P.teal);
  if (whole) readout(c, 1060, 493, '1 slot releases the dataset', 'Every record', P.plum);
  if (cost) type(c, 'ε = 0     δ = 1/20 = 0.05', 1060, 769, 40, P.ink, 'left', 'Mono');
}

export function mechanisms(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 5) {
    booth.draw(c, { ...k, index: b + 1 });
    return;
  }
  background(c);
  heading(c, 'Calibrating a numeric release', 'Neighboring answers differ by (1, 1).');
  const x = 250,
    y = 807,
    n = 385;
  for (let j = 0; j < 2; j++) {
    line(c, x + j * n, y + 35, x + j * n, y - n - 65, P.line, 2);
    line(c, x - 45, y - j * n, x + n + 45, y - j * n, P.line, 2);
  }
  dot(c, x, y, 9, P.ink);
  dot(c, x + n, y - n, 9, P.ink);
  type(c, '(0, 0)', x - 24, y + 48, 31, P.muted, 'center', 'Mono');
  type(c, '(1, 1)', x + n, y - n - 47, 31, P.muted, 'center', 'Mono');
  if (cue(k, 6, 'Along the axes')) {
    arrow(c, [x, y], [x + n, y], P.blue, 9);
    arrow(c, [x + n, y], [x + n, y - n], P.blue, 9);
    type(c, '1', x + n / 2, y + 40, 36, P.blue, 'center');
    type(c, '1', x + n + 42, y - n / 2, 36, P.blue, 'center');
  }
  if (cue(k, 6, 'Directly across')) arrow(c, [x, y], [x + n, y - n], P.plum, 10);
  if (cue(k, 6, 'Along the axes'))
    readout(c, 882, 315, 'Axis distances  ·  L1', '1 + 1 = 2', P.blue);
  if (cue(k, 6, 'Directly across'))
    readout(c, 882, 511, 'Straight-line distance  ·  L2', '√(1² + 1²) = √2', P.plum);
  if (b === 7) {
    type(c, 'Laplace scale = Δ₁ / ε', 882, 730, 42, P.blue);
    type(c, 'Global bounds:  Δ₁ ≤ √d · Δ₂', 882, 817, 42, P.ink);
  } else if (b >= 8) {
    type(c, 'Gaussian SD  >  (Δ₂ / ε) √[2 ln(1.25 / δ)]', 815, 740, 40, P.ink);
    type(c, 'Classical sufficient rule for 0 < ε < 1 and 0 < δ < 1', 815, 821, 34, P.muted);
    if (b === 9)
      type(c, 'Analytic calibration uses Gaussian tail probabilities.', 815, 893, 32, P.muted);
  }
}
