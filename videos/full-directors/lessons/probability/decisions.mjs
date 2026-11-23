import { C, fmt, mix, pct } from './press.mjs';
import {
  rates50,
  rates200,
  se,
  pairs,
  gapError,
  difference,
  newPass,
  oldPass,
  planning,
  original,
  tighter,
  better,
  strictDrop,
  audit,
  freshQueue,
  changedQueue,
  freshCapacity,
} from './examples.mjs';

export function samplingError(p) {
  p.head('Repeated evaluations of one system', 'How far can the measured pass rate move?');
  const large = p.cue(4, 'Quadrupling the number') > 0.5,
    rates = large ? rates200 : rates50,
    count = large ? 200 : 50;
  const x = 110,
    y = 424,
    w = 968;
  const at = (v) => x + (w * (v - 0.55)) / 0.45;
  p.text('True pass probability 80%    ·    ' + count + ' independent cases per test', 77, 172, 23);
  p.line(at(0.8), 215, at(0.8), y, C.gold, 3, [8, 6]);
  const dots = p.b === 0 ? Math.max(1, Math.round(60 * p.cue(0, 'Each dot marks', 1.8))) : 60;
  const heights = new Map();
  for (const value of rates.slice(0, dots)) {
    const key = Math.round(value * 200),
      stack = heights.get(key) || 0;
    p.dot(at(value), y - 12 - stack * 13, 5.5, C.blue);
    heights.set(key, stack + 1);
  }
  p.ruleScale(x, y, w, 0.55, 1, [0.6, 0.7, 0.8, 0.9, 1], (v) => pct(v));
  if (p.b >= 2) {
    const err = 2 * se(0.8, count),
      yy = 495;
    p.line(at(0.8 - err), yy, at(0.8 + err), yy, C.red, 4);
    for (const k of [-1, 1]) p.line(at(0.8 + k * err), yy - 8, at(0.8 + k * err), yy + 8, C.red, 3);
  }
  if (p.b === 0)
    p.text('One dot = one complete test of the same system', 77, 209, 21, p.quiet);
  else
    p.evidence(
      p.b === 1
        ? 'Var(count) = np(1 − p). Var(rate) = Var(count) / n² = p(1 − p) / n.'
        : 'SE = √[p(1 − p) / n] ≈ ' + se(0.8, count).toFixed(3) +
          '    ·    the bracket spans two standard errors on each side.',
    );
}

export function rateGap(p) {
  p.head('Two models on a test', 'Does a four-point lead settle which model is better?');
  if (p.b < 2) {
    p.text('Separate sets of 50 independent cases', 77, 165, 24);
    const x = 88,
      y = 274,
      w = 533;
    [
      ['New', newPass, C.red],
      ['Old', oldPass, C.blue],
    ].forEach(([label, v, col], i) => {
      p.text(label + '     ' + v + ' / 50', x, y - 45 + i * 108, 24, col);
      for (let j = 0; j < 50; j++)
        p.rect(x + (j * w) / 50, y - 10 + i * 108, 8, 27, j < v ? col : C.faint);
    });
    p.line(678, 182, 678, 497);
    p.text('New minus old', 733, 199, 24);
    p.serif('+4 points', 731, 278, 53);
    if (p.b === 1) {
      const left = 738,
        width = 358,
        zero = left + width * 0.4;
      const coord = (v) => zero + (v * width) / 0.5,
        err = 2 * gapError;
      p.line(left, 394, left + width, 394, p.quiet, 2);
      p.line(zero, 350, zero, 420, C.gold, 4);
      p.line(coord(difference - err), 394, coord(difference + err), 394, C.blue, 7);
      p.dot(coord(difference), 394, 8, C.red);
      p.mono('0', zero, 447, 20, p.quiet, 'center');
      p.text('Rough ±2 SE', left, 487, 20, p.quiet);
    }
    p.foot(
      p.b === 1
        ? 'Gap SE ≈ ' +
            (100 * gapError).toFixed(1) +
            ' percentage points. The rough two-SE interval includes zero.'
        : 'Would you ship on two extra passes?',
    );
  } else if (p.b < 4) {
    p.text('Same 50 cases     ·     top punch = new     ·     bottom punch = old', 75, 170, 23);
    const cancel = p.cue(2, 'Set aside the pairs', 0.8);
    pairs.forEach(([newMark, oldMark], i) => {
      const x = 76 + (i % 25) * 42,
        y = 230 + Math.floor(i / 25) * 110;
      const match = newMark === oldMark;
      const dull = match && cancel > 0.5;
      p.rect(x, y, 31, 77, dull ? '#e4decd' : C.paper);
      [newMark, oldMark].forEach((v, j) =>
        p.dot(
          x + 15,
          y + 22 + j * 32,
          8,
          v ? (dull ? '#aaa999' : C.teal) : p.bg,
          dull ? '#aaa999' : C.teal,
        ),
      );
    });
    p.text('Filled = pass     ·     Open = fail', 77, 464, 21, p.quiet);
    p.evidence(
      p.b === 3
        ? 'Three new-only wins and one old-only win give (3 − 1) / 50 = ' + pct(difference) + '.'
        : '39 both pass      3 new only      1 old only      7 both fail',
    );
  } else {
    const target = p.b === 4 ? 0.02 : 0.01,
      cases = planning(target);
    p.text('Approximate planning near an 80% pass rate', 75, 170, 24);
    const tiles = cases / 100;
    for (let i = 0; i < tiles; i++)
      p.rect(77 + (i % 32) * 20, 242 + Math.floor(i / 32) * 47, 15, 36, C.blue);
    p.text('Each mark = 100 independent cases per model', 77, 465, 21, p.quiet);
    p.text('Target 2 SE', 775, 242, 22, p.quiet);
    p.serif(pct(target) + ' of rate scale', 772, 287, 39);
    p.serif(fmt(cases), 770, 371, 61, C.blue);
    p.text('cases per model', 776, 426, 24);
    p.evidence('Half the margin takes four times the cases. Reliable detection also needs a power target.');
  }
}

function loadBand(p, at, cap, scale, y, origin = 77) {
  const limit = origin + cap * scale;
  p.line(origin, y + 74, origin + scale * (cap === 200 ? 610 : 1000), y + 74, p.rule, 2);
  const end = p.strip(
    origin,
    y,
    [
      [at.tp, C.red],
      [at.fp, C.blue],
    ],
    scale,
    63,
  );
  p.line(limit, y - 20, limit, y + 77, C.ink, 3);
  p.text(fmt(cap) + ' slots', limit, y - 41, 21, p.ink, 'center');
  return end;
}

export function policy(p, improved = false) {
  p.head(
    improved ? 'A different detector, same labeled batch' : 'Two thresholds, same labeled batch',
    improved ? 'How many more catches? How many reviews?' : 'Which queue fits the team’s 200 slots?',
  );
  const base = improved ? tighter : original,
    target = improved ? better : tighter;
  const red = improved ? p.cue(1, 'Bring back the fifteen', 1.2) : p.cue(1, 'Fifteen abusive signups', 1.2);
  const blue = improved ? 0 : p.cue(0, 'Follow the blue strip', 1.5);
  const tp = Math.round(mix(base.tp, target.tp, red)),
    fp = Math.round(mix(base.fp, target.fp, blue)),
    at = audit(tp, fp);
  p.text(
    improved ? 'Starting queue at the strict threshold' : 'Starting queue at the broad threshold',
    75,
    163,
    22,
    p.quiet,
  );
  p.line(77, 203, 77 + base.total * 1.61, 203, p.rule, 5);
  p.text(fmt(base.total) + ' original tickets', 77, 232, 19, p.quiet);
  if (improved) {
    p.text('New flag rates on this batch', 606, 162, 21, p.quiet);
    p.text('95% of 100 abusive  ·  1% of 9,900 clean', 606, 202, 23);
  }
  loadBand(p, at, 200, 1.61, 314);
  p.text(tp + ' abusive tickets', 76, 425, 23, C.red);
  p.text(fp + ' clean tickets', 356, 425, 23, C.blue);
  p.text('Abusive signups outside review', 727, 409, 21, p.quiet);
  for (let i = 0; i < 20; i++) {
    const missed = i >= 20 - at.missed,
      x = 735 + (i % 10) * 23,
      y = 442 + Math.floor(i / 10) * 22;
    p.dot(x, y, 6, missed ? C.red : p.bg, missed ? null : C.faint);
  }
  if (improved || p.b === 3 || p.b === 0) p.text(at.missed + ' outside review', 727, 505, 20, C.red);
  const changed = Math.abs(tp - base.tp);
  if (changed) {
    const serial = (i) => 'A' + String(i).padStart(3, '0');
    const last = strictDrop.first + changed - 1;
    const range = serial(strictDrop.first) + (changed > 1 ? '–' + serial(last) : '');
    p.text((improved ? 'One possible match: added ' : 'Removed from this queue: ') + range,
      467, 271, 20, C.red);
    const start = 77 + Math.min(base.tp, tp) * 1.61,
      end = start + changed * 1.61;
    p.line(start, 301, end, 301, C.red, 3);
    p.line(start, 297, start, 308, C.red, 2);
    p.line(end, 297, end, 308, C.red, 2);
  }
  p.serif(at.total + ' reviews', 73, 485, 39);
  if (!improved && p.b === 2) {
    p.text('Strict precision ≈ ' + pct(at.risk), 381, 485, 24);
    p.text('How many of the original 100?', 727, 505, 22, C.red);
    return;
  }
  const text = improved
    ? p.b === 2
      ? '15 more catches overall. The 194 tickets leave 6 slots free.'
      : p.b === 0 ? 'Use both flag rates to work out the new queue.' :
        changed ? changed + ' additional catches in this example. The clean count stays at 99.' :
        'This example keeps the 80 abusive signups that strict review caught.'
    : p.b === 3
      ? 'The strict queue fits. Of the 100 abusive signups, ' +
        at.missed +
        ' would pass without review.'
      : 'Shorten the queue and count what leaves it.';
  (improved && p.b > 0 ? p.evidence : p.foot)(text);
}

export function staff(p) {
  p.head('Staffing exercise   /   20,000 incoming signups', 'Will this queue fit 900 review slots?');
  const f = freshQueue,
    c = changedQueue,
    delta = c.fp - f.fp,
    cap = freshCapacity,
    spare = cap - f.total;
  if (p.b === 0 || p.b === 1) {
    p.text('Batch inputs', 75, 174, 24);
    const data = [
      ['Abuse prior', pct(f.prior)],
      ['Recall', pct(f.recall)],
      ['Clean flag rate', pct(f.falsePositiveRate)],
    ];
    data.forEach(([name, value], i) => {
      const x = 76 + i * 358;
      p.ticket(x, 211, 325, 124, C.paper);
      p.text(name, x + 20, 243, 23, p.quiet);
      p.serif(value, x + 19, 297, 43);
    });
    if (p.b === 0) {
      p.text('Expected reviews', 75, 415, 26);
      p.mono('?', 382, 415, 36);
      p.text('Expected misses', 633, 415, 26);
      p.mono('?', 938, 415, 36);
    } else {
      p.text('Abusive', 75, 391, 24, C.red);
      p.text('Clean', 636, 391, 24, C.blue);
      p.mono(
        fmt(f.abuse) + ' × ' + pct(f.recall) + ' = ' +
          (p.after(1, "That's four hundred eighty true flags") ? f.tp : '?'),
        75,
        453,
        29,
        C.red,
      );
      p.mono(
        fmt(f.clean) + ' × ' + pct(f.falsePositiveRate) + ' = ' +
          (p.after(1, "That's three hundred eighty-eight false flags") ? f.fp : '?'),
        636,
        453,
        29,
        C.blue,
      );
    }
    p.foot('Compute the contributions separately. Which signups will use a review slot?');
    return;
  }
  const totalKnown = p.after(2, "Together that's eight hundred sixty-eight expected reviews");
  const spareKnown = p.after(2, "There's room for thirty-two more");
  const missesKnown = p.after(
    2, 'That leaves one hundred twenty abusive signups outside review on average',
  );
  const riskKnown = p.after(2, 'gives a risk of about fifty-five percent');
  const x = 77,
    unit = 1,
    capX = x + cap * unit;
  const baseParts = [
    [f.tp, C.red],
    [f.fp, C.blue],
  ];
  const topEnd = p.strip(x, 198, baseParts, unit, 53);
  p.text(pct(f.falsePositiveRate) + ' clean flag rate', x, 169, 24);
  p.text(cap + ' slots', capX, 159, 24, p.ink, 'center');
  p.text(f.tp + ' abusive', x + 24, 224, 23, C.white);
  p.text(f.fp + ' clean', x + f.tp * unit + 24, 224, 23, C.white);
  p.text(totalKnown ? f.total + ' expected reviews' : 'How many expected reviews?', x, 281, 23);
  if (spareKnown) {
    p.rect(topEnd, 198, capX - topEnd, 53, '#e2d4ac');
    p.line(topEnd, 253, topEnd, 271, p.quiet, 2);
    p.line(topEnd, 271, capX, 271, p.quiet, 2);
    p.text(spare + ' spare', topEnd - 10, 271, 20, p.quiet, 'right');
  }
  if (p.b === 2) {
    p.line(capX, 182, capX, 275, p.ink, 3);
    p.serif(missesKnown ? f.missed : '?', x, 400, 52, C.red);
    p.text('Expected abusive signups missed', x, 461, 24, p.quiet);
    p.serif(riskKnown ? '≈ ' + pct(f.tp / f.total) : '?', 617, 400, 52, C.red);
    p.text(
      totalKnown ? f.tp + ' of ' + f.total + ' flagged signups' : 'Abuse among flagged signups',
      617, 461, 24, p.quiet,
    );
    p.foot('Compare the expected queue with the staffing line.');
    return;
  }

  const extraKnown = p.after(4, "That's ninety-seven more tickets for the reviewers");
  const fillSpare = p.after(4, 'Thirty-two fit in the empty slots', 0.7);
  const overflow = p.after(4, 'The other sixty-five cross the staffing line', 0.75);
  const fitted = Math.round(spare * fillSpare);
  const excess = Math.round((delta - spare) * overflow);
  const added = fitted + excess;
  const end = topEnd + added * unit;
  const y = 383,
    h = 66;
  const settled = overflow === 1;
  const scenario = settled
    ? pct(c.falsePositiveRate, 1) + ' clean flag rate'
    : added > 0
      ? 'Building the new queue'
      : 'Start with the 2% queue';
  p.text(scenario, x, 348, 24);
  if (extraKnown) {
    const rateChange = pct(c.falsePositiveRate - f.falsePositiveRate, 1);
    p.mono(fmt(f.clean) + ' × ' + rateChange + ' = ' + delta + ' more clean flags', 419, 348, 23, C.blue);
  }
  p.strip(x, y, baseParts, unit, h);
  p.rect(topEnd, y, capX - topEnd, h, '#e2d4ac');
  p.rect(topEnd, y, fitted * unit, h, C.sky);
  p.rect(capX, y, excess * unit, h, C.blue);
  if (excess) {
    p.ctx.save();
    p.ctx.beginPath();
    p.ctx.rect(capX, y, excess * unit, h);
    p.ctx.clip();
    for (let offset = -h; offset < excess * unit; offset += 12)
      p.line(capX + offset, y + h, capX + offset + h, y, C.sky, 2);
    p.ctx.restore();
  }
  p.line(capX, 182, capX, 468, p.ink, 3);
  p.text(f.tp + ' abusive', x + 24, y + h / 2, 23, C.white);
  p.text((f.fp + added) + ' clean', x + f.tp * unit + 24, y + h / 2, 23, C.white);
  if (fillSpare === 1)
    p.text(spare + ' fit', topEnd - 11, 476, 23, C.blue, 'right');
  if (settled) {
    p.line(capX, 468, end, 468, C.blue, 3);
    p.line(end, 460, end, 475, C.blue, 3);
    p.text(excess + ' over', end + 12, 495, 23, C.blue, 'right');
    p.serif(c.total + ' expected reviews', x, 495, 37);
  }
  if (p.cue(5, 'Actual arrivals', 0)) {
    p.foot('Actual arrivals vary. Budget for busy days as well as the expected workload.');
  } else if (excess > 0) {
    p.foot('Same expected catches. Only the clean flags increased.');
  } else {
    p.foot('Will the extra clean flags fit in the remaining slots?');
  }
}
