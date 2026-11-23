import { C, names, wordings, ease, mix } from './counter.mjs';
import {
  baseline,
  id,
  dec,
  pct,
  mean,
  rates,
  population,
  scoreExample,
  scoreCut,
  served,
  band,
  channelRows,
  wilson,
  intervals,
  gapPass,
  tolerance,
} from './audit.mjs';

function countedCases(g, t) {
  const precision = t.b === 2,
    odds = t.at(1, 'For equalized odds'),
    opp = t.at(1, 'Restrict the denominator');
  const mode = precision
    ? 'Precision'
    : odds
      ? 'Equalized odds'
      : opp
        ? 'Equal opportunity'
        : 'Selection parity';
  const { type, serif, mono, rect, slip } = g;
  const empty = precision && t.at(2, 'If you serve nobody');
  if (empty) {
    const noReady = t.at(2, 'In a slice');
    g.head(
      'EMPTY DENOMINATOR   /   HYPOTHETICAL SLICE',
      noReady ? 'True positive rate' : 'Precision',
    );
    const label = noReady ? 'Ready cases in slice' : 'Selected cases';
    g.paper(76, 212, 1050, 267);
    mono(label.toUpperCase(), 107, 255, 18);
    serif('0', 103, 374, 86);
    type('cases in the denominator', 212, 352, 35);
    g.line(105, 401, 1081, 401);
    type((noReady ? 'True positive rate' : 'Precision') + ' is undefined.', 105, 447, 29, C.brick);
    return;
  }
  g.head('BASELINE   /   WHO GETS COUNTED?', precision ? mode : 'Test for ' + mode.toLowerCase());
  wordings.forEach((k, j) => {
    const y = 202 + j * 170;
    type(names[k], 58, y + 55, 23, C[k]);
    const stats = rates(k);
    const rows = precision
      ? baseline.filter((r) => served(r[k]))
      : opp && !odds
        ? baseline.filter((r) => r.ready)
        : baseline;
    rows.forEach((r, i) => {
      const x = 259 + 66 * i,
        inside = precision ? r.ready : served(r[k]);
      if (inside) slip(x, y + 8, 58, 49, k, id(r), 20);
      else {
        rect(x, y + 8, 58, 49, '#dadccb', 4);
        mono(id(r), x + 29, y + 41, 18, C.sub, 'center');
      }
      if (!precision && odds && i === 5) g.line(x + 62, y - 6, x + 62, y + 75, C.ink, 2);
    });
    const ratio = precision
      ? stats.tp + ' / ' + (stats.tp + stats.fp)
      : odds
        ? stats.tp + '/6   ' + stats.fp + '/4'
        : opp
          ? stats.tp + ' / 6'
          : stats.tp + stats.fp + ' / 10';
    if (!precision || t.at(2, j ? 'Three of three' : 'Five of six'))
      serif(ratio, 1140, y + 53, 35, C[k], 'right');
  });
  g.line(58, 501, 1141, 501);
  type(
    precision
      ? 'Colored slips = ready among those served'
      : odds
        ? 'Colored slips = served, counted separately among ready and unclear'
        : opp
          ? 'Colored slips = served among ready'
          : 'Colored slips = served among all arrivals',
    59,
    564,
    26,
  );
}

function lots(g, t) {
  const zero = t.at(6, 'closing the fast path'),
    fpr = zero ? 0 : 0.2;
  g.head('TWO POPULATIONS   /   100 ARRIVALS EACH', 'Which claims fill the fast path?');
  const { type, rect, serif, mono } = g;
  for (const [i, n] of [50, 20].entries()) {
    if (i === 1 && t.b < 4) continue;
    const group = population(n, fpr),
      x = 61 + i * 580;
    const show = i === 0 ? t.at(3, 'Forty out of fifty') : t.at(4, 'Half the selected claims');
    mono('GROUP ' + (i ? 'B' : 'A') + '    ' + n + ' READY', x, 184, 18);
    for (let k = 0; k < 100; k++) {
      const ready = k < n,
        selected = ready ? k < group.tp : k - n < group.fp;
      const px = x + (k % 10) * 23,
        py = 213 + Math.floor(k / 10) * 23;
      rect(px, py, 18, 18, ready ? '#649380' : '#ad7b52', ready ? 8 : 1);
      if (!show || !selected) rect(px + 3, py + 3, 12, 12, C.paper, ready ? 6 : 0);
    }
    if (!show) type('Awaiting routes', x + 258, 317, 25, C.sub);
    if (show) {
      const tx = x + 258;
      type(group.tp + ' ready', tx, 265, 27, C.green);
      type('+ ' + group.fp + ' unclear', tx, 319, 27, '#895735');
      g.line(tx, 343, tx + 202, 343, C.ink, 2);
      serif(group.selected + ' served', tx, 398, 37);
      serif(group.tp + ' / ' + group.selected + ' = ' + pct(group.precision), x, 505, 36);
    }
  }
  g.line(60, 538, 1142, 538);
  type(
    'Service rates    ·    Ready 80%    ·    Unclear ' + pct(fpr) + '    ·    Solid marks = served',
    61,
    590,
    24,
  );
  if (zero) type('The unfilled ready circles still go to review.', 60, 631, 21, C.sub);
}

function scoreMeans(g, t) {
  const { mono, type, serif, line, rect } = g;
  if (t.b >= 9) {
    g.head('SCORE THEOREM', 'Three conditions on scores');
    const conditions = [
      ['Ready cases', 'Mean score matches across groups'],
      ['Unclear cases', 'Mean score matches across groups'],
      ['Each group', 'Score agrees with observed readiness'],
    ];
    for (const [i, [a, b]] of conditions.entries()) {
      if (i === 1 && !t.at(9, 'then among unclear claims')) continue;
      if (i === 2 && !t.at(9, 'It also requires')) continue;
      const y = 207 + 75 * i;
      mono(a.toUpperCase(), 70, y, 18, C.sub);
      type(b, 366, y, 28);
      line(69, y + 23, 1110, y + 23);
    }
    if (t.at(9, 'Under those conditions')) {
      serif('Equal base rates or perfect predictions', 65, 495, 43);
      if (t.b === 10)
        type(
          'Blender cases    ·    Formal 6 / 10 ready    ·    Conversational 6 / 10 ready',
          69,
          567,
          26,
          C.green,
        );
    }
    return;
  }
  g.head('READY CLAIMS ONLY', 'Which ready scores earn service?');
  const x = (v) => 238 + v * 806,
    withCut = t.at(7, 'Put the cutoff'),
    result = t.at(8, 'The two averages');
  if (withCut) {
    rect(x(scoreCut), 195, x(1) - x(scoreCut), 250, C.greenPale);
    line(x(scoreCut), 186, x(scoreCut), 451, C.green, 3);
    mono('cutoff 0.75', x(scoreCut), 171, 17, C.green, 'center');
  }
  for (const [j, values] of scoreExample.entries()) {
    const y = 253 + j * 135;
    type('Group ' + (j ? 'B' : 'A'), 67, y + 10, 30);
    line(x(0), y, x(1), y, C.rule, 2);
    values.forEach((v, i) => {
      g.dot(x(v), y, 13, result && served(v, scoreCut) ? C.green : C.ink);
      mono(dec(v), x(v), y - 25, 21, C.ink, 'center');
    });
    if (t.at(7, 'Both rows average')) {
      const m = mean(values);
      line(x(m), y - 12, x(m), y + 12, C.brick, 3);
      mono('mean ' + dec(m), x(m), y + 46, 17, C.brick, 'center');
    }
    if (result)
      mono(
        values.filter((v) => served(v, scoreCut)).length + ' / 2',
        1119,
        y + 8,
        23,
        C.green,
        'center',
      );
  }
  if (result) type('Only the 0.80 score reaches automatic service.', 68, 558, 30);
}
export function criteria(g, t) {
  g.ground();
  if (t.b <= 2) countedCases(g, t);
  else if (t.b <= 6) lots(g, t);
  else scoreMeans(g, t);
}

function channelMatrix(g, t, support) {
  const { mono, type, serif, rect } = g;
  g.head(
    'WORDING  ×  CHANNEL',
    support ? 'How much evidence is in each cell?' : 'Split the same ready claims by channel',
  );
  wordings.forEach((k, j) => type(names[k], 433 + 427 * j, 190, 27, C[k], 'center'));
  for (const [i, ch] of ['Chat', 'Email'].entries()) {
    const rows = channelRows(ch),
      ready = rows.filter((r) => r.ready),
      unclear = rows.length - ready.length;
    const y = 222 + 170 * i;
    serif(ch, 55, y + 83, 39);
    for (const [j, k] of wordings.entries()) {
      const x = 242 + 427 * j;
      g.paper(x, y, 386, 141);
      if (support) {
        mono(ready.length + ' ready / 50 required', x + 22, y + 54, 20);
        mono(unclear + ' unclear / 30 required', x + 22, y + 99, 20);
      } else if (i === 0 || t.b === 5) {
        const n = ready.filter((r) => served(r[k])).length;
        for (const [h, r] of ready.entries()) {
          const px = x + 38 + h * 64;
          const color = served(r[k]) ? C[k] : C.faint;
          rect(px, y + 29, 50, 47, color, 3);
          mono(id(r), px + 25, y + 60, 18, served(r[k]) ? C.white : C.ink, 'center');
        }
        type(n + ' / ' + ready.length, x + 359, y + 66, 26, C.ink, 'right');
        type('Ready cases served', x + 32, y + 112, 20, C.sub);
      } else type('Ready cases', x + 24, y + 81, 25, C.sub);
    }
  }
  if (support) type('Each required cell needs independent cases.', 55, 616, 25, C.brick);
}

export function calibration(g, t) {
  g.ground();
  if (t.at(4, 'Now split')) return channelMatrix(g, t, false);
  g.head('PROBABILITY OF READINESS   /   SCORE BAND', 'Collect scores from 0.70 to below 0.90');
  const { type, mono, serif } = g;
  for (const [j, k] of wordings.entries()) {
    if (j && !t.at(2, 'Do the same')) continue;
    const data = band(k),
      y = 199 + j * 173;
    const expected = t.at(2, j ? 'The three probabilities add up' : 'Five times the mean');
    const observed = t.at(2, j ? 'All three claims were ready' : 'Four of the five were ready');
    type(names[k], 55, y + 55, 24, C[k]);
    data.rows.forEach((r, i) => {
      const x = 249 + 108 * i;
      g.paper(x, y, 92, 100);
      serif(dec(r[k]), x + 46, y + 68, 30, C.ink, 'center');
      if (observed) {
        mono(id(r), x + 46, y + 28, 17, C.sub, 'center');
        g.rect(x, y + 88, 92, 30, r.ready ? C.greenPale : C.yellow);
        type(r.ready ? 'Ready' : 'Unclear', x + 46, y + 110, 16, C.ink, 'center');
      }
    });
    const n = data.rows.length;
    if (t.at(1, 'Average those five scores'))
      type('Mean   ' + data.mean.toFixed(3), 812, y + 29, 27);
    if (expected) {
      const product = j ? '' : n + ' × ' + data.mean.toFixed(3) + ' = ';
      type(product + data.expected.toFixed(2) + ' expected', 812, y + 71, 23);
    }
    if (observed)
      type(
        data.ready + ' / ' + n + ' observed ready   ' + pct(data.ready / n),
        812,
        y + 113,
        23,
        C.green,
      );
  }
  if (t.b >= 3) type('Estimate reliability on held-out cases in each score band.', 55, 593, 27);
}

export function uncertainty(g, t) {
  g.ground();
  if (t.b === 4) return channelMatrix(g, t, true);
  const add = t.at(3, 'Add the pair') ? 1 : 0,
    { mono, type, serif, line, dot } = g;
  g.head('READY CLAIMS   /   95% WILSON INTERVALS', 'How far can one pair move the rates?');
  const x = (v) => 309 + v * 797;
  wordings.forEach((k, j) => {
    const stats = rates(k),
      n = stats.ready + add,
      numerator = stats.tp + add,
      r = numerator / n;
    const [lo, hi] = wilson(numerator, n),
      y = 247 + j * 153;
    type(names[k], 59, y - 14, 22, C[k]);
    serif(numerator + ' / ' + n, 58, y + 42, 44);
    line(x(0), y, x(1), y, C.rule, 2);
    line(x(lo), y, x(hi), y, C[k], 6);
    for (const val of [lo, hi]) {
      line(x(val), y - 10, x(val), y + 10, C[k], 3);
      mono(pct(val), x(val), y - 25, 17, C[k], 'center');
    }
    dot(x(r), y, 9, C.ink);
    mono(pct(r), x(r), y + 43, 21, C.ink, 'center');
  });
  g.rule(x(0), 503, x(1) - x(0), 0, 1, 0.25, pct);
  if (t.b >= 2)
    type(
      add
        ? 'Seventh pair added    ·    Both versions served'
        : 'Suppose a seventh ready pair gets service in both wordings.',
      59,
      603,
      26,
      C.sub,
    );
}

function boundary(g, t) {
  const upper = wilson(0, 6)[1],
    x = (v) => 306 + 790 * v;
  g.head('BOUNDARY CASE   /   ZERO SUCCESSES IN SIX TRIALS', 'How high could the rate still be?');
  ['Wald', 'Wilson'].forEach((method, i) => {
    const y = 243 + i * 137;
    g.type(method, 63, y + 12, 33);
    g.line(x(0), y, x(1), y, C.rule, 2);
    if (!i || t.at(1, 'Wilson still')) {
      const end = i ? upper : 0;
      g.line(x(0), y, x(end), y, C.formal, 6);
      g.dot(x(0), y, 7, C.formal);
      g.dot(x(end), y, 7, C.formal);
      g.mono(pct(end), x(end), y - 22, 21, C.formal, 'center');
    }
  });
  g.rule(x(0), 469, x(1) - x(0), 0, 1, 0.25, pct);
  if (t.at(1, 'With zero successes'))
    g.type('For 0 of 6 at 95%     ·     Wilson upper bound = 1.96² / (6 + 1.96²)', 60, 584, 24);
}
function clusters(g, t) {
  const clustered = t.at(2, 'If a customer'),
    taken = t.at(2, clustered ? 'In this draw' : 'resample whole pairs', 1.15);
  g.head(
    'SAMPLING WITH REPLACEMENT',
    clustered ? 'Lift the customer and all their claims' : 'Draw the two wordings as a pair',
  );
  function packet(label, x, y, ids) {
    g.paper(x, y, 443, 52 + ids.length * 36);
    g.mono(label, x + 16, y + 29, 17);
    ids.forEach((s, i) => {
      const by = y + 43 + 36 * i;
      g.mono(s, x + 19, by + 15, 17, C.ink);
      g.slip(x + 87, by - 7, 119, 30, 'formal', 'Formal', 15);
      g.slip(x + 211, by - 7, 212, 30, 'conversational', 'Conversational', 15);
    });
  }
  const a = clustered ? ['A1', 'A2'] : ['P4'],
    b = clustered ? ['B1'] : ['P5'];
  g.type('Original sample', 62, 182, 26);
  g.type('One possible resample', 670, 182, 26);
  packet(clustered ? 'Customer A' : 'One claim', 62, 215, a);
  packet(clustered ? 'Customer B' : 'One claim', 62, 381, b);
  if (taken > 0) {
    g.ctx.save();
    g.ctx.globalAlpha = taken;
    packet(clustered ? 'Customer A' : 'One claim', 670, 215, a);
    packet(clustered ? 'Customer A' : 'One claim', 670, 381, a);
    g.ctx.restore();
  }
  g.type('Each draw carries every observation in its sampling unit.', 61, 596, 25);
}
export function gapInterval(g, t) {
  g.ground();
  if (t.b === 1) return boundary(g, t);
  if (t.b === 2) return clusters(g, t);
  const second = t.b >= 4,
    limits = intervals[+second],
    pass = gapPass(limits);
  const draw = t.b >= 4 || t.at(3, 'The first runs');
  const decided = second ? t.at(5, 'This interval fails') : t.at(3, 'It fits entirely');
  const x = (v) => 120 + (v + 25) * 19;
  g.head('SIGNED TPR GAP   /   FORMAL MINUS CONVERSATIONAL', 'Does the entire interval fit?');
  g.rect(x(-tolerance), 208, x(tolerance) - x(-tolerance), 204, C.greenPale);
  g.type('Tolerance', x(0), 190, 22, C.green, 'center');
  for (const val of [-tolerance, 0, tolerance]) {
    g.line(x(val), 208, x(val), 421, val ? C.green : C.rule, val ? 3 : 1);
    g.mono((val > 0 ? '+' : '') + val + ' pp', x(val), 460, 20, C.ink, 'center');
  }
  if (draw) {
    const [a, b] = limits;
    g.line(x(a), 313, x(b), 313, C.ink, 7);
    limits.forEach((v) => {
      g.dot(x(v), 313, 10, C.ink);
      g.mono((v > 0 ? '+' : '') + v, x(v), 283, 26, C.ink, 'center');
    });
  }
  if (decided)
    g.serif(
      pass ? 'Inside the margin' : limits[1] - tolerance + ' points beyond the upper limit',
      59,
      559,
      42,
      pass ? C.green : C.brick,
    );
  g.mono('Illustrative interval', 60, 613, 17, C.sub);
}
