import { C, pct, avg, sum, mix } from './press.mjs';
import {
  original as o,
  tiny,
  tinyRecall,
  storedAbusiveMass,
  storedCleanMass,
  logMass,
  relativeMass,
  prior,
  checkedPosterior,
  factors,
  likelihood,
  labels,
  scores,
  observed,
  batchLabels,
  poisson,
} from './examples.mjs';

export function posteriorFunction(p) {
  p.head('Numerical contract', 'Can the function return a risk?');
  if (p.b < 4) {
    const invalid = p.b === 0 && p.cue(0, 'A prior of one') > 0;
    const empty = p.b >= 2;
    const entries = [
      ['Prior', invalid ? 1.4 : prior],
      ['Recall', empty ? 0 : 0.95],
      ['Clean flag rate', empty ? 0 : 0.05],
    ];
    entries.forEach(([name, v], i) => {
      const x = 70 + i * 360;
      p.ticket(x, 183, 330, 129, C.paper);
      p.text(name, x + 22, 212, 22, p.quiet);
      p.mono(v.toFixed(2), x + 21, 265, 40, invalid && i === 0 ? C.red : p.ink);
    });
    if (invalid) {
      p.serif('1.40 falls outside [0, 1]', 70, 396, 43, C.red);
      p.foot('Reject an invalid input before multiplying.');
    } else if (empty) {
      const hasTotal = p.cue(3, 'the denominator is zero', 0);
      const hasFraction = p.cue(3, 'zero divided by zero', 0);
      p.text('Abusive contribution', 73, 360, 22, C.red);
      p.text('Clean contribution', 617, 360, 22, C.blue);
      p.mono('0.01 × 0 = ' + (p.cue(3, 'contribute zero', 0) ? '0' : '?'), 73, 413, 34, C.red);
      p.mono('0.99 × 0 = ' + (p.cue(3, 'also contribute zero', 0) ? '0' : '?'), 617, 413, 34, C.blue);
      if (hasTotal)
        p.mono(hasFraction ? 'P(abuse | flag) = 0 / (0 + 0)' : 'All flag mass = 0 + 0 = 0', 74, 487, 29);
      if (p.cue(3, 'Report the empty event', 0))
        p.foot('Conditioning on this empty event is undefined.');
      else if (!hasTotal) p.foot('Who could be in the review queue?');
    } else {
      p.text('Abusive mass', 72, 365, 20, C.red);
      p.text('All flag mass', 456, 365, 20, C.blue);
      p.mono(p.b === 0 ? 'prior × recall' : (o.tp / 10000).toFixed(4), 72, 418, 34, C.red);
      p.mono(p.b === 0 ? 'both sources' : (o.total / 10000).toFixed(4), 455, 418, 34, C.blue);
      (p.b === 0 ? p.foot : p.evidence)(
        p.b === 0
          ? 'Check that each probability is finite and lies between zero and one.'
          : 'The ratio of the two masses recovers ' +
              pct(checkedPosterior(prior, 0.95, 0.05), 1) +
              ' risk.',
      );
    }
  } else if (p.b <= 5) {
    p.text('Binary64 number line near zero', 74, 176, 24);
    p.mono('u = smallest positive representable number', 74, 218, 23);
    p.text('Prior = u     ·     Recall = ½     ·     Clean flag rate = u', 74, 258, 22, p.quiet);
    const a = 172,
      w = 830,
      y = 375;
    p.line(a, y, a + w, y, p.quiet, 3);
    [0, 1].forEach((v) => {
      p.line(a + v * w, y - 19, a + v * w, y + 20, p.ink, 3);
      p.mono(v === 0 ? '0' : 'u', a + v * w, y + 48, 23, p.ink, 'center');
    });
    if (p.cue(4, 'The abusive flag mass', 0)) {
      const midpoint = a + w * tinyRecall;
      p.line(midpoint, y - 15, midpoint, y + 15, C.red, 4);
      p.text('Exact abusive mass = u × ½', midpoint, y - 46, 24, C.red, 'center');
      p.mono('u/2', midpoint, y + 48, 23, C.red, 'center');
    }
    if (p.cue(5, 'The clean mass', 0)) {
      const x = a + w * (storedAbusiveMass / tiny);
      p.dot(x, y, 10, C.red);
      p.text('Stored abusive mass', x, y - 46, 24, C.red, 'center');
      p.text('At equal distances, round to the even number of units.', 74, 491, 23);
    }
    if (p.cue(5, 'Direct division', 0)) {
      const x = a + w * (storedCleanMass / tiny);
      p.dot(x, y, 10, C.blue);
      p.text('Stored clean mass', x, y - 46, 24, C.blue, 'center');
    }
    if (p.cue(5, 'Both sources', 0)) {
      const risk = storedAbusiveMass / (storedAbusiveMass + storedCleanMass);
      p.evidence('Direct division gives ' + storedAbusiveMass + ' / (0 + u) = ' + risk + '. Both exact masses are positive.');
    }
  } else {
    p.text('Log of population share + log of flag rate', 76, 173, 25);
    const norm = p.cue(7, 'Subtract the larger log mass', 0.9);
    for (const [i, color] of [C.red, C.blue].entries()) {
      const y = 256 + i * 112;
      p.text(i === 0 ? 'Abusive' : 'Clean', 76, y, 25, color);
      p.mono(logMass[i].toFixed(3), 255, y, 33, color);
      if (norm > 0) {
        p.text('→', 488, y, 38, p.quiet);
        p.ctx.save();
        p.ctx.globalAlpha = norm;
        p.rect(555, y - 19, 360 * relativeMass[i], 38, color);
        p.mono(relativeMass[i].toFixed(2), 944, y, 29, color);
        p.ctx.restore();
      }
    }
    if (norm === 1)
      p.text('Relative mass after subtracting the maximum and exponentiating', 555, 465, 18, p.quiet);
    p.evidence(
      p.cue(7, 'A tiny event') > 0
        ? 'Risk = 0.5 / (0.5 + 1) ≈ ' + pct(checkedPosterior(tiny, tinyRecall, tiny), 1) + '.'
        : 'Keep both contributions in log space until they share a usable scale.',
    );
  }
}

export function candidate(p) {
  p.head('Likelihood of three reviewed labels', 'Which rate best explains these punches?');
  if (p.b === 3) {
    const candidates = [0.2, 0.8],
      weights = candidates.map((v) => 0.5 * likelihood(v)),
      total = sum(weights);
    p.text('Two candidate rates with equal prior weight', 77, 178, 27);
    ['Candidate', 'Prior', 'Likelihood', 'Posterior'].forEach((v, i) =>
      p.text(v, [78, 359, 587, 890][i], 246, 22, p.quiet),
    );
    candidates.forEach((v, i) => {
      const y = 317 + i * 94;
      [pct(v), '½', likelihood(v).toFixed(3), pct(weights[i] / total)].forEach((s, j) => {
        p.mono(
          j === 3 && p.cue(3, 'then normalize') === 0 ? '?' : s,
          [78, 359, 587, 890][j],
          y,
          38,
          j === 3 ? C.teal : p.ink,
        );
      });
    });
    p.evidence('Posterior weights are proportional to prior weight × likelihood.');
    return;
  }
  const start = 0.2,
    next = 0.8,
    peak = avg(labels);
  const v =
    p.b < 2
      ? mix(start, next, p.cue(1, 'Move the candidate', 1.6))
      : mix(next, peak, p.cue(2, 'Follow the point', 1.2));
  const unordered = p.b === 4;
  const left = 638,
    top = 188,
    w = 445,
    h = 256,
    base = top + h;
  const mult = unordered ? 3 : 1,
    max = unordered ? 0.48 : 0.16;
  const numeric = p.cue(1, 'At a candidate rate', 1.5) === 1;
  p.text(unordered ? 'Orders with two abuses' : 'Observed order', 65, 173, 24);
  if (unordered) {
    ['A   C   A', 'A   A   C', 'C   A   A'].forEach((v, i) => {
      p.ticket(70, 217 + i * 79, 365, 61, C.paper);
      p.mono(v, 254, 248 + i * 79, 30, C.red, 'center');
    });
    p.text('A = abuse     C = clean', 72, 503, 21, p.quiet);
  } else {
    const f = factors(v);
    labels.forEach((label, i) => {
      const x = 67 + i * 169;
      p.ticket(x, 224, 151, 115, label ? C.red : C.blue);
      const symbol = label ? 'p' : '1 − p';
      const assigned = p.cue(0, label ? 'Each abuse contributes' : 'The clean label contributes', 0);
      p.text(label ? 'Abuse' : 'Clean', x + 75, assigned ? 258 : 281, 29, C.white, 'center');
      if (assigned)
        p.mono(numeric ? f[i].toFixed(2) : symbol, x + 75, 307, 31, C.white, 'center');
    });
    if (p.cue(0, 'Multiply the three', 0)) p.mono('p × (1 − p) × p', 68, 386, 29);
    if (p.cue(0, 'Try a candidate rate', 0))
      p.text(numeric ? 'Candidate p = ' + v.toFixed(3) : 'Candidate abuse rate = p', 68, 467, 26);
  }
  p.text(unordered ? 'Probability of the count' : 'Probability of this order', left, 164, 23);
  p.line(left, top, left, base, p.quiet);
  for (const t of unordered ? [0, 0.15, 0.3, 0.45] : [0, 0.05, 0.1, 0.15]) {
    const y = base - (h * t) / max;
    p.line(left - 6, y, left, y, p.quiet);
    p.mono(t.toFixed(2), left - 11, y, 16, p.quiet, 'right');
  }
  p.ruleScale(left, base, w, 0, 1, [0, 0.5, 1], (n) => String(n));
  p.text('Candidate rate p', left + w / 2, 505, 20, p.quiet, 'center');
  if (!numeric) return;
  const until = p.b < 2 ? v : 1;
  const ymax = (val) => base - (h * mult * likelihood(val)) / max;
  for (let j = 1; j <= 90; j++) {
    const a = ((j - 1) * until) / 90,
      z = (j * until) / 90;
    p.line(left + w * a, ymax(a), left + w * z, ymax(z), C.teal, 4);
  }
  if (unordered) {
    for (let j = 1; j <= 90; j++) {
      const a = (j - 1) / 90,
        z = j / 90;
      p.line(
        left + w * a,
        base - (h * likelihood(a)) / max,
        left + w * z,
        base - (h * likelihood(z)) / max,
        p.quiet,
        2,
      );
    }
    p.line(72, 461, 108, 461, p.quiet, 2);
    p.text('One order', 118, 461, 18, p.quiet);
    p.line(252, 461, 288, 461, C.teal, 4);
    p.text('Any of three', 298, 461, 18, C.teal);
  }
  p.dot(left + w * v, ymax(v), 9, C.gold);
  if (p.b === 1 && v > start) {
    const x = left + w * start;
    p.dot(x, ymax(start), 8, C.paper, C.teal);
    p.mono(likelihood(start).toFixed(3), x + 14, ymax(start) + 18, 25);
    if (v === next)
      p.mono(likelihood(next).toFixed(3), left + w * next + 14, ymax(next) + 18, 25);
  }
  p.evidence(
    unordered
      ? 'Three orders make the count three times as likely. The peak stays at p = 2/3.'
      : 'At p = ' +
          v.toFixed(3) +
          ', the likelihood of these labels in this order is ' +
          likelihood(v).toFixed(4) +
          '.',
  );
}

export function calibration(p) {
  const compare = p.cue(1, 'Mark that on', 0.8);
  const allSignups = p.cue(2, 'Now give every signup', 0);
  if (allSignups) {
    p.head('Original batch of 10,000 signups', 'Which signup should the reviewer take first?');
    p.text('Batch prevalence = 100 abusive / 10,000 signups = 1%', 74, 186, 25);
    ['Signup A', 'Signup B'].forEach((id, i) => {
      const x = 75 + i * 548;
      p.ticket(x, 237, 495, 187, C.paper);
      p.text(id, x + 26, 275, 24);
      p.serif(pct(prior), x + 24, 358, 66, C.teal);
    });
    if (p.cue(3, 'scores tie', 0)) p.evidence('The scores tie. Both match the batch prevalence and give the same priority.');
    return;
  }
  p.head('Six similarly scored signups', 'Would you quote this score as a risk?');
  const opened = Math.floor(scores.length * p.cue(0, 'Uncover the six labels', 1.2));
  scores.forEach((v, i) => {
    const x = 74 + 177 * i,
      y = 195,
      w = 158;
    p.ticket(x, y, w, 118, C.paper);
    p.mono(v.toFixed(2), x + w / 2, y + 34, 32, p.ink, 'center');
    p.line(x + 8, y + 63, x + w - 8, y + 63, p.rule, 1.5, [4, 4]);
    p.text(
      i < opened ? (observed[i] ? 'Abuse' : 'Clean') : 'Sealed',
      x + w / 2,
      y + 90,
      21,
      i < opened ? (observed[i] ? C.red : C.blue) : p.quiet,
      'center',
    );
  });
  const x = 110,
    w = 970,
    y = 429;
  p.ruleScale(x, y, w, 0, 1, [0, 0.25, 0.5, 0.75, 1], (v) => pct(v));
  const scoreX = x + avg(scores) * w,
    seenX = x + avg(observed) * w;
  p.line(scoreX, y - 30, scoreX, y + 3, C.teal, 4);
  p.text('Mean score', scoreX, y - 52, 21, C.teal, 'center');
  if (compare > 0) {
    p.line(seenX, y - 30, seenX, y + 3, C.red, 4);
    p.line(seenX, y, scoreX, y, C.gold, 5);
    p.text('Observed', seenX, y - 52, 21, C.red, 'center');
  }
  p.evidence(
    p.cue(1, 'Checking observed') > 0
      ? 'Three of six were abusive. The gap in this small bucket is ' +
          Math.round(100 * (avg(scores) - avg(observed))) +
          ' percentage points.'
      : 'Compare the mean score with the fraction of opened tickets labeled abusive.',
  );
}

export function distributions(p) {
  p.head('Choose a distribution', 'What values can the measurement take?');
  if (p.b < 2) {
    p.text('One batch of ten independent signups at p = 0.01', 72, 173, 24);
    batchLabels.forEach((l, i) => {
      const x = 72 + 107 * i;
      p.ticket(x, 222, 91, 81, l ? C.red : C.blue);
      p.mono(l, x + 45, 264, 33, C.white, 'center');
    });
    p.text('Observed count = ' + sum(batchLabels), 74, 353, 26);
    const q = p.cue(1, 'Slide those ten pieces', 1);
    if (p.b === 1) {
      for (let i = 0; i < 10; i++) p.rect(74 + i * mix(106, 42, q), 406, 41, 38, C.red);
      p.text('Each piece = 0.01 expected abuse cases', 74, 484, 21, p.quiet);
    }
    (q === 1 ? p.evidence : p.foot)(
      q === 1
        ? 'Binomial mean = np = 0.1     ·     variance = np(1 − p) = 0.099'
        : 'One Bernoulli outcome is 0 or 1. A binomial count in this batch ranges from 0 to 10.',
    );
  } else if (p.b === 2 || p.cue(3, 'For a continuous measurement') === 0) {
    p.text('Poisson count in one minute    ·    λ = 2 alerts', 75, 168, 26);
    p.text('Probability', 67, 205, 18, p.quiet);
    const base = 445;
    for (const tick of [0.1, 0.2]) {
      const yy = base - tick * 785;
      p.mono(tick.toFixed(1), 85, yy, 17, p.quiet, 'right');
      p.line(92, yy, 1043, yy, p.rule, 1, [4, 6]);
    }
    for (let k = 0; k < 9; k++) {
      const x = 118 + k * 111,
        pr = poisson(k, 2);
      p.line(x, base, x, base - pr * 785, k === 0 ? C.gold : C.blue, 6);
      p.dot(x, base - pr * 785, 7, k === 0 ? C.gold : C.blue);
      p.mono(k, x, base + 25, 22, p.ink, 'center');
    }
    p.line(88, base, 1050, base, p.quiet);
    p.text('Alerts per minute', 547, 506, 21, p.quiet, 'center');
    p.foot(
      p.b === 3
        ? 'P(0 alerts) = exp(−2) ≈ ' + pct(poisson(0, 2), 1) + '.'
        : 'Independent arrivals at a steady rate give mean and variance 2. Counts can extend past 8.',
    );
  } else {
    const mid = 600,
      y = 450,
      sx = 115,
      sy = 234;
    p.text('Normal model for a continuous timing error', 77, 172, 26);
    for (let j = -200; j < 200; j++) {
      const a = j / 50,
        b = (j + 1) / 50;
      const h = (z) => Math.exp((-z * z) / 2) * sy;
      if (a >= -0.5 && a < 1) p.rect(mid + sx * a, y - h(a), sx / 50 + 1, h(a), '#aac4bb');
      p.line(mid + sx * a, y - h(a), mid + sx * b, y - h(b), C.teal, 3);
    }
    p.ruleScale(mid - 4 * sx, y, 8 * sx, -4, 4, [-3, 0, 3], (v) => (v === 0 ? '0' : v + 'σ'));
    for (const [endpoint, label] of [[-0.5, '−0.5σ'], [1, '+1σ']]) {
      const x = mid + sx * endpoint;
      p.line(x, y, x, y + 17, C.teal, 3);
      p.mono(label, x, y + 41, 23, C.teal, 'center');
    }
    p.text('Shaded area = probability within these bounds', 77, 530, 23, p.quiet);
  }
}
