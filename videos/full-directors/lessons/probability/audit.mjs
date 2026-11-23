import assert from 'node:assert/strict';
import { C, clamp, fmt, pct, mix } from './press.mjs';
import {
  n,
  population,
  prior,
  original as o,
  composition,
  sameRate,
  dual,
  recall,
  falseRate,
  copyID,
} from './examples.mjs';

const auditSlot = (i) => [104 + (i % 10) * 25.6, 210 + Math.floor(i / 10) * 25.6];
const queueSlot = (i) => [480 + Math.floor(i / 10) * 10.7, 257 + (i % 10) * 14];
export function checkTicketPositions() {
  const slots = Array.from({ length: o.total }, (_, i) => queueSlot(i).join(','));
  assert.equal(new Set(slots).size, o.total);
  assert.deepEqual(queueSlot(0), [480, 257]);
  assert(queueSlot(o.total - 1)[0] < 1144);
  assert.equal(
    new Set(Array.from({ length: population.abusive }, (_, i) => auditSlot(i).join(','))).size,
    population.abusive,
  );
}

export function opening(p) {
  p.head('Labeled signup batch', 'Would you trust this flag?');
  const feed = p.cue(2, 'Now feed in', 1.8),
    move = p.cue(1, 'Tear off', 1.6);
  const cleanCount = p.after(2, 'There are four hundred ninety-five of them');
  const wholeQueue = p.after(2, 'Lay the two strips end to end');
  const risk = p.after(2, 'About one flag in six caught abuse');
  const punch = p.after(0, 'The punch caught ninety-five');
  const scanned = p.b === 0
    ? Math.round(mix(1, population.abusive, clamp(p.clock.elapsed / 1.7)))
    : population.abusive;
  p.text(population.abusive + ' known abusive signups', 80, 153, 22);
  p.ticket(77, 181, 284, 296, C.paper);
  for (let i = 0; i < population.abusive; i++) {
    const [x, y] = auditSlot(i);
    const flagged = i < scanned && i < o.tp;
    p.dot(x, y, 8,
      flagged ? (move > 0 ? '#dfa697' : C.red) : C.paper,
      flagged ? null : i < scanned ? C.red : C.faint);
  }
  const showAuditKey = !move && scanned === population.abusive;
  p.text(showAuditKey ? 'Filled circle = flag   ·   Open red circle = miss' : 'Filled punch = flagged',
    81, 506, 20, p.quiet);
  if (move > 0) {
    const count = o.tp + Math.round(feed * o.fp);
    const end = queueSlot(count - 1)[0] + 12;
    p.ticket(464, 225, end - 464, 192, C.paper);
    for (let i = 0; i < o.tp; i++) {
      const [x, y] = auditSlot(i),
        [xx, yy] = queueSlot(i);
      p.dot(
        mix(x, xx, move),
        mix(y, yy, move) - Math.sin(Math.PI * move) * 32,
        mix(8, 3.9, move),
        C.red,
      );
    }
    for (let i = o.tp; i < count; i++) {
      const [x, y] = queueSlot(i);
      p.dot(x, y, 3.9, C.blue);
    }
    p.text(o.tp + ' abusive', 466, 193, 24, C.red);
    if (cleanCount) p.text(o.fp + ' clean', end, 193, 24, C.blue, 'right');
    let queueLabel = 'Who else received a flag?';
    if (feed > 0) queueLabel = 'Flagged signups';
    if (wholeQueue) queueLabel = fmt(o.total) + ' flags';
    if (risk) queueLabel = 'About 1 in ' + Math.round(o.total / o.tp) + ' flags caught abuse.';
    p.serif(queueLabel, 461, 470, 43);
  } else {
    p.text('Detector audit', 479, 219, 24, p.quiet);
    p.serif((punch ? o.tp : '?') + ' / ' + population.abusive, 475, 310, 87, C.red);
    p.text('flagged among known abuse', 480, 390, 27);
  }
  if (risk)
    p.foot(o.tp + ' of ' + o.total + ' flags caught abuse   ≈   ' + pct(o.risk, 1));
  else if (!showAuditKey)
    p.foot(
      move > 0
        ? 'Pick one ticket uniformly from the whole queue.'
        : 'The detector punches the signups it sends to review.',
    );
}

export function populationView(p) {
  p.head('Sampling frame', 'Who could the random pick reach?');
  const full = p.cue(0, 'Bring in the clean signups', 1.2);
  const packed = Math.min(1, full * 2);
  const amount = 1 + Math.round((n / 100 - 1) * Math.max(0, 2 * full - 1));
  if (packed < 1) {
    const width = mix(380, 45, packed),
      height = mix(265, 27, packed);
    p.ticket(62, 161, width, height, C.red);
    if (packed < 0.65) {
      for (let i = 0; i < population.abusive; i++) {
        p.dot(
          62 + width * (0.09 + (i % 10) * 0.091),
          161 + height * (0.09 + Math.floor(i / 10) * 0.091),
          Math.max(2, 7 * (1 - packed)),
          C.paper,
        );
      }
    }
  }
  for (let i = packed < 1 ? 1 : 0; i < amount; i++) {
    const x = 62 + (i % 10) * 53,
      y = 161 + Math.floor(i / 10) * 35;
    p.rect(x + 2, y + 3, 45, 27, C.faint);
    p.rect(x, y, 45, 27, i === 0 ? C.red : C.blue);
    p.line(x + 31, y + 2, x + 31, y + 25, C.stock, 1, [3, 3]);
  }
  p.text('Each bundle holds 100 signups.', 62, 520, 20, p.quiet);
  p.text('Signups on the table', 700, 183, 25);
  p.serif(fmt(amount * 100), 695, 258, 75);
  if (p.b >= 1) {
    p.text('Abuse event', 701, 343, 22, C.red);
    p.serif('100 / ' + fmt(n), 698, 400, 51, C.red);
  }
  if (p.cue(2, "That's the prior") > 0)
    p.text('Prior before a flag: ' + pct(prior), 701, 465, 25, C.red);
}

export function indicator(p) {
  p.head('One signup drawn uniformly', 'How far can one label fall from its mean?');
  const start = 120,
    w = 920,
    y = 350;
  p.ticket(65, 167, 202, 83, C.blue);
  p.text('Clean   Y = 0', 166, 208, 24, C.white, 'center');
  p.ticket(930, 167, 202, 83, C.red);
  p.text('Abuse   Y = 1', 1031, 208, 24, C.white, 'center');
  p.ruleScale(start, y, w, 0, 1, [0, 0.25, 0.5, 0.75, 1], (v) => v.toFixed(2));
  const meanX = start + w * prior;
  p.dot(start, y, 8, C.blue);
  p.dot(start + w, y, 8, C.red);
  if (p.b >= 1) {
    p.line(meanX, y - 40, meanX, y + 5, C.gold, 4);
    p.text('Mean ' + prior, meanX + 14, y - 48, 23);
  }
  if (p.b >= 2) {
    p.line(meanX, y + 100, start + w, y + 100, C.red, 3);
    p.dot(meanX, y + 100, 5, C.gold);
    p.dot(start + w, y + 100, 5, C.red);
    p.mono('Distance for a 1   ' + (1 - prior).toFixed(2), 590, y + 74, 24, C.red, 'center');
    p.text('Distance for a 0   ' + prior, 120, 497, 21, C.blue);
  }
  if (p.b === 3) {
    const y = 278,
      x = 494,
      weightOne = prior * (1 - prior) ** 2,
      weightZero = (1 - prior) * prior ** 2,
      total = weightOne + weightZero;
    p.text('Contributions to variance', x, y - 72, 22, p.quiet);
    p.strip(
      x,
      y - 38,
      [
        [weightOne, C.red],
        [weightZero, C.blue],
      ],
      390 / total,
      30,
    );
  }
  p.evidence(
    p.b >= 3
      ? 'Variance = 0.01 × 0.99² + 0.99 × 0.01² = ' + (prior * (1 - prior)).toFixed(4)
      : p.b >= 1
        ? 'E[Y] = 1 × 0.01 + 0 × 0.99 = 0.01'
        : 'A single ticket carries either a zero or a one.',
  );
}

export function feed(p) {
  p.head('Two sources feed one review roll', 'Which source sends more tickets?');
  const tp = Math.round(o.tp * p.cue(1, 'Follow the abusive flags', 1.35));
  const fp = Math.round(o.fp * p.cue(1, 'Now feed in the clean flags', 1.65));
  const sources = [
    [81, 100, recall, C.red, 'Abusive'],
    [641, 9900, falseRate, C.blue, 'Clean'],
  ];
  for (const [x, count, rate, color, label] of sources) {
    p.ticket(x, 177, 480, 138, C.paper);
    p.rect(x + 23, 199, 9, 94, color);
    p.text(label + ' source', x + 55, 211, 23, color);
    p.serif(fmt(count) + ' × ' + pct(rate), x + 51, 268, 44);
  }
  p.text('Selected tickets', 81, 367, 23);
  p.strip(
    82,
    405,
    [
      [tp, C.red],
      [fp, C.blue],
    ],
    1.72,
    68,
  );
  if (tp) p.mono(tp, 82, 497, 22, C.red);
  if (fp) p.mono(fp + ' clean', 82 + (tp + fp) * 1.72, 497, 22, C.blue, 'right');
  (p.b === 2 ? p.evidence : p.foot)(
    p.b === 2
      ? 'Review load = ' + o.tp + ' + ' + o.fp + ' = ' + o.total + ' tickets.'
      : 'The two percentages use different starting populations.',
  );
}

export function windowView(p) {
  p.head('A window on the same labeled batch', 'Which signups belong in the denominator?');
  const filtered = p.cue(0, 'Slide a window', 0.9);
  const reverse = p.cue(3, 'Turn the window the other way', 1.15);
  const x = 201,
    y = 220,
    w = 273,
    h = 122;
  // Both windows share the abusive flags. Close one side before opening the other.
  const passedWidth = 1 - filtered + clamp((reverse - 0.55) / 0.45);
  const cleanHeight = 1 - clamp(reverse / 0.45);
  const moving = reverse > 0 && reverse < 1;
  const flaggedDenominator = p.after(1, 'by all five hundred ninety selected signups');
  const abuseDenominator = p.after(3, 'inside one hundred abusive signups');
  const flaggedRisk = p.after(1, 'The result is about sixteen percent');
  const abuseRecall = p.after(3, 'That fraction is ninety-five percent');

  p.text('FLAGGED', x + w * 0.5, y - 26, 18, p.quiet, 'center');
  p.text('PASSED', x + w * 1.5, y - 26, 18, p.quiet, 'center');
  p.text('Abusive', 64, y + h * 0.5, 23, C.red);
  p.text('Clean', 64, y + h * 1.5, 23, C.blue);
  const cells = [
    [o.tp, C.red, 1],
    [o.missed, C.red, passedWidth],
    [o.fp, C.blue, cleanHeight],
    [o.passed, C.blue, passedWidth * cleanHeight],
  ];
  cells.forEach(([v, color, share], i) => {
    const xx = x + (i % 2) * w,
      yy = y + Math.floor(i / 2) * h;
    p.rect(xx + 3, yy + 3, w - 6, h - 6, i === 0 ? '#f4e1c8' : C.paper);
    p.serif(fmt(v), xx + w / 2, yy + h / 2, 48, color, 'center');
    if (share < 1) {
      p.ctx.save();
      p.ctx.globalAlpha = 1 - share;
      p.rect(xx + 3, yy + 3, w - 6, h - 6, '#dddaca');
      p.serif(fmt(v), xx + w / 2, yy + h / 2, 48, p.quiet, 'center');
      p.ctx.restore();
    }
  });
  p.ctx.strokeStyle = C.gold;
  p.ctx.lineWidth = 5;
  p.ctx.strokeRect(x, y, w * (1 + passedWidth), h * (1 + cleanHeight));

  const recallView = reverse === 1;
  const den = recallView ? population.abusive : o.total;
  const known = !moving && (recallView ? abuseDenominator : flaggedDenominator);
  const answered = !moving && (recallView ? abuseRecall : flaggedRisk);
  const world = recallView ? 'All abusive signups' : 'All flagged signups';
  const center = 958;
  p.text('Abusive and flagged', center, 200, 24, C.red, 'center');
  p.serif(o.tp, center, 256, 58, C.red, 'center');
  p.line(806, 301, 1110, 301, C.gold, 4);
  p.serif(known ? fmt(den) : '?', center, 350, 54, p.ink, 'center');
  p.text(
    moving || filtered < 1 ? 'Signups in the window' : world,
    center, 397, 24, p.quiet, 'center',
  );
  if (answered)
    p.serif(pct(o.tp / den, recallView ? 0 : 1), center, 480, 57, C.red, 'center');
  p.evidence(
    moving ? 'The same ' + o.tp + ' abusive flags stay in view as the window changes.'
      : recallView ? 'P(flag | abuse) counts flags among abusive signups.'
      : filtered === 1 ? 'P(abuse | flag) counts abuse among flagged signups.'
      : 'Start with the whole labeled batch.',
  );
}

export function bayes(p) {
  p.head('Two views of the same fraction', 'Build Bayes’ rule from the tickets.');
  const marginal = p.cue(0, 'Add flags');
  const joint = p.cue(1, 'Replace the joint term');
  p.text('Abusive and flagged', 75, 179, 24, C.red);
  p.serif(o.tp + ' / ' + fmt(n), 73, 241, 51);
  if (marginal > 0) {
    p.line(74, 288, 493, 288, p.ink, 3);
    p.serif(o.total + ' / ' + fmt(n), 73, 352, 51);
    p.text('Every flagged signup', 75, 414, 24, C.blue);
  }
  p.line(554, 165, 554, 490);
  p.text('Given a flag', 625, 179, 24);
  p.serif(
    p.cue(0, 'The common population') > 0 ? o.tp + ' / ' + o.total : 'P(abuse | flag)',
    623,
    264,
    56,
  );
  if (p.b === 1) {
    p.mono('0.01 × 0.95', 625, 348, 29, C.red);
    if (joint > 0) {
      p.line(625, 378, 1090, 378, p.ink, 2);
      p.mono('0.01 × 0.95 + 0.99 × 0.05', 625, 411, 25);
    }
    if (p.cue(1, 'These symbols preserve') > 0) p.mono('= ' + pct(o.risk, 1), 625, 477, 31, C.red);
  }
  p.evidence(
    joint > 0
      ? 'P(abuse | flag) = P(flag | abuse) × P(abuse) / P(flag)'
      : 'Divide the joint share by the share of the whole population that received a flag.',
  );
}

export function shift(p) {
  p.head('Fixed recall and false-positive rate', 'What happens when abuse becomes more common?');
  const t = p.cue(1, 'Change the prior', 1.6),
    at = composition(mix(prior, 0.1, t));
  p.text('Of 10,000 signups', 78, 181, 24);
  p.strip(
    80,
    212,
    [
      [at.abuse, C.red],
      [at.clean, C.blue],
    ],
    0.102,
    47,
  );
  p.mono(pct(at.abuse / n, 1) + ' abusive', 80, 292, 22, C.red);
  p.text('95% of abuse flagged     ·     5% of clean flagged', 1100, 292, 21, p.quiet, 'right');
  p.text('Review queue on a common count scale', 78, 361, 24);
  p.strip(
    80,
    392,
    [
      [at.tp, C.red],
      [at.fp, C.blue],
    ],
    0.72,
    65,
  );
  p.mono(fmt(Math.round(at.tp)) + ' abusive    ' + fmt(Math.round(at.fp)) + ' clean', 81, 488, 25);
  const updatedPrior = p.cue(2, 'Same behavior') > 0;
  (updatedPrior ? p.evidence : p.foot)(
    updatedPrior
      ? 'At a 10% prior, ' +
          fmt(at.tp) +
          ' of ' +
          fmt(at.total) +
          ' flags are abusive, about ' +
          pct(at.risk) +
          '.'
      : 'Increasing the prior changes both sources. Track the blue contribution too.',
  );
}

export function independent(p) {
  if (p.b < 2) {
    p.head('Equal selection rates', 'What survives a one-in-five cut?');
    const cut = p.cue(1, 'Tear one fifth', 1.1);
    for (const [i, total, color, label] of [
      [0, 100, C.red, 'Abusive'],
      [1, 9900, C.blue, 'Clean'],
    ]) {
      const y = 210 + 132 * i;
      p.text(label + '   ' + fmt(total), 72, y - 34, 24, color);
      for (let j = 0; j < 5; j++)
        p.ticket(76 + j * 119 + (j === 0 ? 0 : cut * 18), y, 112, 64, j === 0 ? color : '#d7d2c1');
      if (cut === 1) p.serif(fmt(total / 5) + ' selected', 730, y + 32, 39, color);
    }
    const joined = p.cue(1, 'join the selected pieces', 1);
    if (joined) {
      p.text('Selected mix', 77, 462, 20, p.quiet);
      p.strip(
        251,
        442,
        [
          [sameRate.tp, C.red],
          [sameRate.fp, C.blue],
        ],
        0.4 * joined,
        43,
      );
    } else p.text('Each stub is one fifth of its own source.', 77, 478, 23, p.quiet);
    if (p.cue(1, 'When knowing one event') > 0)
      p.mono(
        'Among flags: ' + sameRate.tp + ' / ' + fmt(sameRate.total) + ' = ' + pct(sameRate.risk),
        251, 513, 24,
      );
    else p.foot('Predict the fraction of abuse in the selected tickets.');
  } else {
    p.head('Two labels on one signup', 'Given abuse, what is the chance of clean?');
    const ruledOut = p.cue(2, 'makes clean impossible', 0) === 1;
    p.text('Possible labels on one signup', 71, 176, 25);
    p.ticket(74, 235, 490, 181, C.red);
    p.ticket(627, 235, 490, 181, C.blue);
    p.serif('Abusive', 318, 318, 54, C.white, 'center');
    p.serif('Clean', 872, 318, 54, C.white, 'center');
    p.text('Given abuse', 74, 474, 25, C.red);
    p.mono('P(clean | abuse) = ' + (ruledOut ? '0' : '?'), 628, 474, 28, C.blue);
    p.foot(ruledOut
      ? 'These labels are mutually exclusive. Knowing the first rules out the second.'
      : 'Before seeing its label, a signup has a 99% chance of being clean.');
  }
}

export function copied(p) {
  p.head('Two flags on a signup', 'Did the second check remove anyone?');
  if (p.b < 2) {
    const q = p.cue(1, 'Look at the serial numbers', 0.85);
    for (const [i, title] of [
      [0, 'Original flag'],
      [1, 'Copied field'],
    ]) {
      const x = 85 + i * 550;
      p.text(title, x, 180, 25);
      p.ticket(x, 215, 445, 180, i === 0 ? C.paper : '#e3ede7');
      p.rect(x + 25, 242, 13, 116, C.blue);
      p.text('Flagged signup', x + 60, 262, 22, C.blue);
      p.mono(i === 0 || q > 0 ? copyID : '?', x + 60, 329, 50);
    }
    if (q > 0) {
      p.line(530, 312, 633, 312, C.blue, 4, [8, 6]);
      p.text('Same signup', 600, 451, 30, C.blue, 'center');
    }
    p.foot(
      q === 1
        ? 'A copy selects the same ' + o.total + ' tickets. Risk stays ' + pct(o.risk, 1) + '.'
        : 'Keep tickets for which both fields are true.',
    );
  } else {
    p.text('Separate tests, independent within each class', 71, 170, 25);
    const cols = [80, 448, 813];
    ['Start', 'First test', 'Both tests'].forEach((v, i) => p.text(v, cols[i], 223, 19, p.quiet));
    [
      [100, o.tp, dual.tp, C.red],
      [9900, o.fp, dual.fp, C.blue],
    ].forEach(([start, one, two, color], i) => {
      const y = 302 + 112 * i;
      p.text(i === 0 ? 'Abuse × 95%' : 'Clean × 5%', 228, y - 23, 18, color);
      p.text(i === 0 ? '× 95%' : '× 5%', 615, y - 23, 18, color);
      p.serif(fmt(start), cols[0], y, 45, color);
      p.line(225, y, 398, y, color, 3);
      p.serif(fmt(one), cols[1], y, 45, color);
      p.line(567, y, 756, y, color, 3);
      p.serif(p.b === 3 ? fmt(two) : '?', cols[2], y, 45, color);
    });
    p.foot(
      p.cue(3, 'When detectors share') > 0
        ? 'Expected double flags give risk ' +
            pct(dual.risk, 1) +
            '. Shared rules require joint rates in each class.'
        : 'Multiply within each class. The last column contains expected counts.',
    );
  }
}
