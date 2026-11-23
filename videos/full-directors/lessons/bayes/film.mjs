import {
  afterCards,
  base,
  bins,
  check,
  contourData,
  countOrders,
  counts,
  density,
  family,
  finalInterval,
  fixedCounts,
  forecastGroups,
  forecastMix,
  joint,
  largeInterval,
  lastCases,
  likelihood,
  mass,
  meanFromWeights,
  mixTails,
  nextFail,
  nextPass,
  observed,
  observedMeanWeight,
  passingRegion,
  percent,
  pooledForecast,
  predictionArea,
  previousTasks,
  priorDensity,
  priorMeanWeight,
  rateCutoff,
  rawProduct,
  sequenceEvidence,
  smallInterval,
  tailSweep,
  ten,
  trialGroups,
  validation,
  variance,
} from './evidence.mjs';
import {
  C,
  bench,
  card,
  cue,
  cutoff,
  dot,
  gauge,
  lerp,
  line,
  number,
  paper,
  path,
  plot,
  rect,
  strip,
  tailPlot,
  text,
  trace,
  valve,
} from './instrument.mjs';

const results = observed.map((task) => task.pass);
const betaName = (m) => 'Beta(' + m.a + ', ' + m.b + ')';
const title = 'Does Eight Out of Ten Earn More Traffic?';

function opening(c, k) {
  bench(c, 'Would you give this agent more traffic?');
  const passed = results.filter(Boolean).length;
  const fraction = passed / results.length;
  const count = passed + ' / ' + results.length;
  const observedRate = cue(k, 0, 'passed eighty percent', 0.63) === 1;
  const chart = cue(k, 1, 'On the chart', 0.8);
  if (chart === 0) {
    const stamp = cue(k, 0, 'Eight green checks', 1.45);
    const checks = Math.min(passed, Math.ceil((stamp / 0.65) * passed));
    const crosses = Math.max(0, Math.ceil(((stamp - 0.7) / 0.3) * (results.length - passed)));
    const visible = Math.min(results.length, checks + crosses);
    text(c, 'Test tasks', 108, 340, 50, C.cream, 'Serif');
    strip(c, 108, 393, results, visible, 160);
    if (visible === results.length) {
      number(c, count, 108, 730, 105);
      text(c, 'tasks passed', 108, 796, 48, C.muted);
      if (observedRate) number(c, '= ' + percent(fraction, 0), 554, 730, 105, C.green);
    }
    if (cue(k, 0, 'Would you open the valve', 0.4) === 1) valve(c, undefined, true);
    return;
  }
  strip(c, 108, 229, results, results.length, 67);
  number(c, count, 922, 284, 63);
  text(c, 'tasks passed', 922, 328, 27, C.muted);
  text(c, 'Observed pass fraction   ' + percent(fraction, 0), 107, 353, 34, C.green);
  const g = plot(
    c,
    104,
    381,
    1113,
    482,
    4,
    'Density of plausible pass rates',
    'Underlying pass rate on new tasks',
  );
  const sweep = cue(k, 3, 'Sweep from the gold line', 3.2);
  const { end, value, label } = tailSweep(ten, sweep);
  const curve = cue(k, 1, 'The blue curve', 0.85);
  if (curve === 1) {
    tailPlot(c, g, ten, end);
  } else {
    if (chart === 1) cutoff(c, g, cue(k, 1, 'seventy percent', 0) === 1);
    trace(c, g, (p) => density(ten, p), { hi: curve });
  }
  if (sweep > 0 && sweep < 1) line(c, g.X(end), g.t + 50, g.X(end), g.b, C.trace, 4);
  const scale = cue(k, 1, 'On the separate probability scale', 1.95);
  if (scale > 0) {
    gauge(c, {
      value,
      label,
      showMark: scale === 1,
      showMarkLabel: cue(k, 1, 'ninety-five percent', 0) === 1,
      verdict: sweep === 1 && cue(k, 3, 'Hold traffic') > 0 ? ten.release : undefined,
      keepVerdictAboveRail: true,
    });
  } else {
    valve(c, undefined, true);
  }
  const x = g.X(fraction);
  path(
    c,
    [
      [x, g.b - 1],
      [x - 10, g.b - 16],
      [x + 10, g.b - 16],
    ],
    C.good,
  );
}

function prior(c, k) {
  bench(c, 'How much probability fits between two blades?');
  const g = plot(c, 104, 254, 1165, 601, 2, 'Prior density   ·   Beta(2, 2)');
  const open = cue(k, 1, 'Slide the blades apart', 2.6),
    shut = cue(k, 2, 'Bring both edges in', 2.5);
  const halfWidth = 0.15 * open * (1 - shut),
    lo = 0.6 - halfWidth,
    hi = 0.6 + halfWidth;
  trace(c, g, priorDensity, { fill: '#d4dccc', color: null });
  trace(c, g, priorDensity, { lo, hi, fill: C.tail, color: null });
  trace(c, g, priorDensity);
  if (k.beat.beatIndex > 0) {
    for (const [rate, dir] of [
      [lo, -1],
      [hi, 1],
    ]) {
      const x = g.X(rate);
      path(
        c,
        [
          [x, g.t],
          [x + dir * 22, g.t - 10],
          [x + dir * 22, g.t + 22],
          [x, g.t + 45],
        ],
        C.brassInk,
      );
      line(c, x, g.t + 18, x, g.b, C.brassInk, 3);
    }
    bracket(c, g.X(lo), g.X(hi), 885, C.brass);
  }
  text(c, 'Starting assumption', 1344, 314, 31, C.muted);
  number(c, '6p(1 − p)', 1340, 402, 57, C.cream);
  text(c, 'Total area', 1344, 482, 30, C.muted);
  number(c, '1.00', 1340, 548, 50);
  if (k.beat.beatIndex > 0) {
    text(c, 'Area in the band', 1344, 658, 32, C.blue);
    number(c, percent(mass(base, lo, hi)), 1338, 761, 80, C.blue);
    number(c, lo.toFixed(3) + ' to ' + hi.toFixed(3), 1344, 816, 38, C.cream);
    if (shut === 1) text(c, 'Density at 0.60 is 1.44', 1344, 865, 31, C.cream);
  }
}
function bracket(c, l, r, y, col) {
  line(c, l, y, r, y, col, 4);
  line(c, l, y - 10, l, y + 10, col, 4);
  line(c, r, y - 10, r, y + 10, col, 4);
}
function likelihoodScene(c, k) {
  bench(c, 'Which rate could have produced this run?');
  const passes = Math.round(8 * cue(k, 0, 'Here come the first eight passes', 2.2));
  const fails =
    Number(cue(k, 2, 'Put in the first failure', 0.35) > 0.5) +
    Number(cue(k, 2, 'then the second', 0.35) > 0.5);
  strip(c, 110, 235, results, passes + fails, 67);
  const n = passes + fails,
    peak = n ? passes / n : 0;
  const max = likelihood(peak, passes, fails);
  const g = plot(c, 104, 392, 1102, 481, 1, 'Likelihood relative to its peak');
  trace(c, g, (p) => likelihood(p, passes, fails) / max, { color: C.brassInk, fill: '#ddcfae' });
  if (n) dot(c, g.X(peak), g.Y(1), 9, C.brassInk);
  text(c, 'One ordered sequence', 1280, 295, 34, C.cream, 'Serif');
  number(c, 'p', 1280, 367, 45, C.brass);
  number(c, passes, 1307, 337, 24, C.brass);
  number(c, '× (1 − p)', 1365, 367, 45, C.brass);
  number(c, fails, 1610, 337, 24, C.brass);
  number(c, 's = ' + passes + '     f = ' + fails, 1280, 423, 32, C.muted);
  [0.5, 0.8].forEach((p, i) => {
    const y = 534 + i * 117;
    text(c, 'At rate ' + p.toFixed(2), 1280, y, 30, C.muted);
    number(c, likelihood(p, passes, fails).toFixed(6), 1280, y + 59, 46, C.cream);
    if (fails === 2)
      dot(c, g.X(p), g.Y(likelihood(p, passes, fails) / max), 8, i ? C.good : C.trace);
  });
  if (fails === 2)
    text(
      c,
      'Ratio   ' + (likelihood(0.8, 8, 2) / likelihood(0.5, 8, 2)).toFixed(2) + ' ×',
      1280,
      760,
      38,
      C.brass,
    );
  if (cue(k, 3, 'forty-five places') > 0) {
    text(c, 'Any order', 1280, 803, 33, C.cream, 'Serif');
    const orders = (observed.length * (observed.length - 1)) / 2;
    for (const [i, p] of [0.5, 0.8].entries()) {
      const score = likelihood(p, 8, 2);
      number(
        c,
        orders + ' × ' + score.toFixed(6) + ' ≈ ' + (orders * score).toFixed(5),
        1280,
        841 + 37 * i,
        33,
        i ? C.green : C.muted,
      );
    }
  }
}
function update(c, k) {
  const beat = k.beat.beatIndex;
  bench(
    c,
    beat < 2
      ? 'How does the likelihood reshape the prior?'
      : beat < 4 ? 'What does one task change?' : 'Where does the posterior mean land?',
  );
  if (beat < 2) {
    const sweep = cue(k, 0, 'Slide the probe', 3.5);
    const at = beat === 0 ? Math.round(sweep * 1000) / 1000 : 0.7;
    const normalized = cue(k, 1, 'Divide every height', 0.6) === 1;
    const priorX = plot(c, 102, 325, 494, 414, 2, 'Prior density', 'Rate');
    const likX = plot(c, 713, 325, 494, 414, 0.008, 'Sequence likelihood', 'Rate');
    const prodX = plot(
      c,
      1324,
      325,
      494,
      414,
      normalized ? 4 : 0.008,
      normalized ? 'Posterior density' : 'Prior × likelihood',
      'Rate',
    );
    const product = (p) => (normalized ? rawProduct(p) / sequenceEvidence : rawProduct(p));
    for (const [g, fn, limit] of [
      [priorX, priorDensity, 1],
      [likX, (p) => likelihood(p, 8, 2), 1],
      [prodX, product, sweep],
    ]) {
      trace(c, g, fn, { hi: limit, fill: g === prodX ? C.tail : null });
      line(c, g.X(at), g.t, g.X(at), g.b, '#627465', 2, true);
      dot(c, g.X(at), g.Y(fn(at)), 8, C.brassInk);
      number(
        c,
        fn(at).toFixed(g === priorX || (normalized && g === prodX) ? 3 : 6),
        g.x + g.w - 12,
        276,
        34,
        C.cream,
        'right',
      );
    }
    text(c, '×', 654, 557, 58, C.brass, 'Serif', 'center');
    if (normalized) {
      number(c, '÷ Z', 1265, 529, 36, C.brass, 'center');
      line(c, 1231, 553, 1290, 553, C.brass, 4);
      path(
        c,
        [
          [1298, 553],
          [1282, 544],
          [1282, 562],
        ],
        C.brass,
      );
    } else {
      text(c, '=', 1265, 557, 56, C.brass, 'Serif', 'center');
    }
    number(c, 'p = ' + at.toFixed(3), 107, 276, 35, C.blue);
    if (beat === 1) {
      text(c, 'Sequence evidence   Z', 108, 805, 34, C.muted);
      number(c, sequenceEvidence.toFixed(6), 109, 876, 55);
      text(c, normalized ? 'Rescaled area' : 'Area under the product', 1043, 805, 34, C.muted);
      number(c, normalized ? '1.000000' : sequenceEvidence.toFixed(6), 1044, 876, 55, C.blue);
    }
    return;
  }
  const processed = Math.round(10 * cue(k, 2, 'Watch the cards go dim', 3.4));
  const m = afterCards(processed);
  strip(c, 112, 243, results, 10, 65, processed);
  text(c, processed + ' of 10 counted', 900, 293, 36, C.muted);
  const g = plot(c, 104, 350, 1087, 415, 5, 'Updated density', 'Pass rate');
  trace(c, g, priorDensity, { color: '#7a8777', dashed: true });
  trace(c, g, (p) => density(m, p), { fill: '#9ec3cc' });
  text(c, 'Prior + counted tasks', 1280, 427, 35, C.muted);
  number(c, '2 + ' + (m.a - 2), 1280, 525, 60, C.green);
  number(c, '2 + ' + (m.b - 2), 1585, 525, 60, C.red);
  text(c, 'Pass parameter', 1280, 580, 27, C.muted);
  text(c, 'Fail parameter', 1585, 580, 27, C.muted);
  number(c, betaName(m), 1276, 701, 56);
  if (beat >= 4) weightedMean(c, k, g, m);
}
function afterCue(k, beat, phrase) {
  if (k.beat.beatIndex !== beat) return k.beat.beatIndex > beat;
  return k.elapsed >= k.wordCue(phrase).end;
}
function weightedMean(c, k, g, posterior) {
  const showFraction = afterCue(k, 4, "That's ten over fourteen");
  const showObserved = cue(k, 4, 'Why is it lower', 0) === 1;
  const showPrior = afterCue(k, 4, 'The prior put a weight of four on one half');
  let observedWeight = 0;
  if (k.beat.beatIndex === 5) {
    const phrase = 'The ten observations put a weight of ten on eight tenths';
    const { start, end } = k.wordCue(phrase);
    observedWeight = Math.floor(observedMeanWeight.weight * cue(k, 5, phrase, end - start));
  }
  const settled = afterCue(k, 5, 'It lands at about seventy-one percent');
  if (showFraction) {
    text(c, 'Posterior mean', 1280, 792, 32, C.muted);
    const fraction = posterior.a + ' / ' + (posterior.a + posterior.b);
    number(c, settled ? fraction + ' ≈ ' + percent(posterior.mean) : fraction, 1280, 864, 45, C.blue);
  }
  if (!showObserved) return;

  const priorX = g.X(priorMeanWeight.rate);
  const observedX = g.X(observedMeanWeight.rate);
  const rulerY = g.y + g.h + 75;
  const tileSize = 19;
  const tileStep = 24;
  line(c, g.l, rulerY, g.r, rulerY, C.edge, 3);
  if (showPrior) line(c, priorX, rulerY, observedX, rulerY, C.muted, 3);
  for (const [anchor, label, weight, color] of [
    [priorX, 'Prior ' + percent(priorMeanWeight.rate, 0), priorMeanWeight.weight, C.muted],
    [observedX, 'Observed ' + percent(observedMeanWeight.rate, 0), observedWeight, C.green],
  ]) {
    if (anchor === priorX && !showPrior) continue;
    line(c, anchor, rulerY - 11, anchor, rulerY + 2, color, 4);
    text(c, label + (weight ? ' × ' + weight : ''), anchor, rulerY - 47, 35, color, 'Sans', 'center');
    const startX = anchor - ((weight - 1) * tileStep + tileSize) / 2;
    for (let i = 0; i < weight; i++)
      rect(c, startX + i * tileStep, rulerY - 34, tileSize, tileSize, color, 2);
  }
  if (showPrior) {
    const meanX = g.X(meanFromWeights(observedWeight));
    path(
      c,
      [[meanX, rulerY + 3], [meanX - 10, rulerY + 21], [meanX + 10, rulerY + 21]],
      C.blue,
    );
    text(c, 'Weighted mean', meanX, rulerY + 51, 31, C.blue, 'Sans', 'center');
  }
  if (settled) {
    const meanX = g.X(posterior.mean);
    const meanY = g.Y(density(posterior, posterior.mean));
    line(c, meanX, g.b, meanX, meanY, C.trace, 3, true);
    dot(c, meanX, meanY, 7, C.trace);
  }
}
function predictive(c, k) {
  const beat = k.beat.beatIndex;
  bench(
    c,
    beat < 3
      ? 'What would you predict for the next task?'
      : 'What is the chance that both tasks pass?',
  );
  if (beat < 2) {
    const sweep = cue(k, 1, 'Sweep across those contributions', 3.7);
    const g = plot(c, 104, 301, 780, 489, 4, 'Posterior density', 'Rate on a comparable task');
    const h = plot(
      c,
      1034,
      301,
      780,
      489,
      4,
      'Rate × posterior density',
      'Rate on a comparable task',
    );
    trace(c, g, (p) => density(ten, p), { fill: '#c5d9d3' });
    trace(c, h, (p) => p * density(ten, p), { lo: 0, hi: sweep, fill: C.tail, color: null });
    trace(c, h, (p) => p * density(ten, p));
    text(c, '× p', 959, 547, 41, C.brass, 'Mono', 'center');
    if (beat === 1) {
      line(c, h.X(sweep), h.t, h.X(sweep), h.b, C.brassInk, 3);
      text(c, sweep === 1 ? 'Next-task pass forecast' : 'Area collected', 1036, 875, 34, C.muted);
      number(c, percent(predictionArea(sweep)), 1035, 959, 66, C.blue);
    } else text(c, 'A rate of 0.80 assigns a single new task an 80% pass chance.', 108, 909, 35);
    return;
  }
  const use = cue(k, 2, 'Deliver that new result', 0.8) === 1;
  const second = beat === 2 ? use : cue(k, 3, 'Follow the two-pass path', 0.7) > 0;
  const jointVisible = cue(k, 3, "That's about fifty-two percent", 0.35) > 0;
  const y = 555,
    x1 = 335,
    x2 = 952,
    x3 = 1580;
  const values = [
    { x: x1, m: ten, name: 'Before task 11' },
    { x: x2, m: nextPass, name: 'Given a pass on 11' },
  ];
  values.slice(0, second ? 2 : 1).forEach(({ x, m, name }) => {
    text(c, name, x, 304, 40, C.cream, 'Serif', 'center');
    const g = plot(c, x - 225, 361, 450, 335, 4, betaName(m), 'Rate');
    trace(c, g, (p) => density(m, p), { fill: C.tail });
    number(c, m.a + '/' + (m.a + m.b), x, 796, 68, C.green, 'center');
    text(c, 'Chance of a pass', x, 854, 29, C.muted, 'Sans', 'center');
  });
  if (second) {
    line(c, x1 + 232, y, x2 - 232, y, C.green, 7);
    card(c, 616, y - 28, 57, 57, true);
  }
  if (beat === 2) {
    if (cue(k, 2, 'Suppose task eleven passes', 0.3) > 0 && !use) {
      text(c, 'Task 11', x2, 434, 37, C.muted, 'Sans', 'center');
      card(c, x2 - 51, 475, 102, 102, true);
      text(c, 'New result', x2, 655, 37, C.green, 'Sans', 'center');
    }
    if (cue(k, 2, 'Add one to the second parameter', 0.4) > 0) {
      const m = nextFail;
      text(c, 'If task 11 failed', x3, 304, 40, C.cream, 'Serif', 'center');
      const g = plot(c, x3 - 225, 361, 450, 335, 4, betaName(m), 'Rate');
      trace(c, g, (p) => density(m, p), { fill: '#d3b7a5', color: C.bad });
      number(c, m.a + '/' + (m.a + m.b), x3, 796, 68, C.red, 'center');
      text(c, 'Chance of a pass', x3, 854, 29, C.muted, 'Sans', 'center');
    }
  }
  if (jointVisible) {
    line(c, x2 + 233, y, x3 - 145, y, C.green, 7);
    card(c, 1271, y - 28, 57, 57, true);
    text(c, 'Two passes', x3, 497, 44, C.cream, 'Serif', 'center');
    number(c, percent(joint), x3, 612, 78, C.green, 'center');
    if (beat === 4) {
      text(c, 'Rate frozen at its mean', x3, 757, 30, C.muted, 'Sans', 'center');
      number(c, percent(ten.mean ** 2), x3, 817, 44, C.red, 'center');
      number(c, 'Gap = ' + variance.toFixed(4), x3, 884, 35, C.muted, 'center');
    }
  }
}
function countForecast(c, k) {
  const beat = k.beat.beatIndex;
  bench(c, 'How many of the next five tasks might pass?');
  const prefix = cue(k, 3, "A bar's height", 1.4);
  const phrases = ['Count the first row', 'slot two', 'Slot three', 'Slot four', 'Slot five'];
  const orders = phrases.filter((s) => cue(k, 4, s, 0.22) > 0.5).length;
  const five = cue(k, 5, 'all five tasks pass', 0.6) > 0.3;
  const fixed = cue(k, 6, 'fix the rate at its mean', 1.4);
  paper(c, 105, 253, 933, 597);
  text(c, 'Pass count in five new tasks', 143, 311, 38, C.ink, 'Sans', 'left', 600);
  const baseline = 746,
    h = 370,
    y = (v) => baseline - (h * v) / 0.4;
  for (const v of [0, 0.2, 0.4]) {
    line(c, 218, y(v), 998, y(v), C.grid);
    number(c, percent(v, 0), 191, y(v) + 8, 25, C.ink, 'right');
  }
  counts.forEach((row, i) => {
    const x = 241 + 125 * i,
      w = 74;
    const val =
      i === 4
        ? (row.probability * orders) / 5
        : i === 5
          ? row.probability * Number(five)
          : prefix > i / 4 ? row.probability : 0;
    rect(c, x, y(val), w, baseline - y(val), i === 4 ? '#cc9145' : C.tail);
    if (i === 4)
      for (let r = 1; r < orders; r++)
        line(c, x, y((row.probability * r) / 5), x + w, y((row.probability * r) / 5), C.cream, 3);
    if (fixed > 0) {
      c.save();
      c.globalAlpha = fixed;
      c.strokeStyle = C.bad;
      c.lineWidth = 4;
      const v = fixedCounts[i].probability;
      c.strokeRect(x - 4, y(v), w + 8, baseline - y(v));
      c.restore();
    }
    number(c, String(i), x + w / 2, baseline + 44, 32, C.ink, 'center');
  });
  text(c, 'Passes', 612, 833, 24, C.ink, 'Sans', 'center');
  text(
    c,
    beat < 6 ? 'Orders with four passes' : 'One shared, uncertain rate',
    1120,
    291,
    38,
    C.cream,
    'Serif',
  );
  if (beat < 6) {
    const preview = Math.max(1, orders);
    countOrders.slice(0, preview).forEach((row, i) => {
      strip(c, 1125, 345 + i * 89, row, 5, 53);
      if (i < orders)
        number(c, '+ ' + percent(counts[4].probability / 5), 1501, 387 + i * 89, 33, C.brass);
    });
    if (five) {
      strip(c, 1125, 815, [true, true, true, true, true], 5, 53);
      text(c, 'All five', 1504, 857, 31, C.green);
    }
  } else {
    text(c, 'All five pass', 1122, 407, 35, C.muted);
    number(c, percent(counts[5].probability), 1115, 513, 83, C.blue);
    if (fixed > 0) {
      text(c, 'Rate frozen at 10/14', 1122, 627, 33, C.muted);
      number(c, percent(fixedCounts[5].probability), 1116, 717, 68, C.red);
      text(c, 'Expected count in both models', 1122, 815, 32, C.muted);
      number(c, (5 * ten.mean).toFixed(2) + ' passes', 1118, 882, 46);
    }
  }
  if (orders === 5 && beat < 6)
    text(
      c,
      'Five equal pieces give four passes a ' + percent(counts[4].probability) + ' chance.',
      108,
      948,
      34,
    );
}
function uncertainty(c, k) {
  const beat = k.beat.beatIndex;
  if (beat >= 3) {
    countForecast(c, k);
    return;
  }
  bench(
    c,
    beat === 0 ? 'A forecast and a release threshold' : 'Where is the middle 90% of the rate?',
  );
  const g = plot(c, 104, 271, 1100, 591, 4, 'Posterior density   ·   Beta(10, 4)');
  if (beat === 0) {
    const q = cue(k, 0, 'Shade the area', 1.9);
    const { end, value, label } = tailSweep(ten, q);
    tailPlot(c, g, ten, end);
    if (q > 0 && q < 1) line(c, g.X(end), g.t + 50, g.X(end), g.b, C.trace, 4);
    gauge(c, {
      value,
      label,
      verdict: q === 1 && cue(k, 0, 'Keep traffic') > 0 ? ten.release : undefined,
      keepVerdictAboveRail: true,
    });
    text(c, 'Next-task forecast   ' + percent(ten.mean), 106, 232, 35, C.blue);
  } else {
    const q = cue(k, 1, 'Move the endpoints', 2.6);
    const lo = lerp(0, smallInterval[0], q),
      hi = lerp(1, smallInterval[1], q);
    trace(c, g, (p) => density(ten, p), { fill: '#cbb284' });
    trace(c, g, (p) => density(ten, p), { lo, hi, fill: C.tail, color: null });
    trace(c, g, (p) => density(ten, p));
    for (const x of [lo, hi]) line(c, g.X(x), g.t + 15, g.X(x), g.b, C.trace, 3, true);
    bracket(c, g.X(lo), g.X(hi), 896, C.blue);
    text(c, 'Probability inside', 1284, 391, 35, C.muted);
    number(c, percent(mass(ten, lo, hi)), 1279, 495, 85, C.blue);
    number(c, lo.toFixed(3) + ' to ' + hi.toFixed(3), 1282, 589, 42);
    if (q === 1) text(c, '5% in each outside tail', 1284, 669, 34, C.brass);
    if (beat === 2) {
      text(c, 'Rate variance', 1284, 746, 30, C.muted);
      number(c, variance.toFixed(4), 1284, 801, 42);
      text(c, 'Standard deviation   ' + Math.sqrt(variance).toFixed(3), 1284, 858, 32, C.muted);
    }
  }
}
function compareSamples(c, k) {
  bench(c, 'Eight in ten or eighty in a hundred?');
  const n =
    2 +
    Math.round(17 * cue(k, 1, 'Build the hundred-task curve', 6)) +
    Math.round(cue(k, 2, 'Finish the alternative evaluation', 0.7));
  const sample = trialGroups(n),
    m = sample.model;
  text(c, '10-task reference', 112, 266, 32, C.muted);
  number(c, '8 / 10', 110, 331, 49);
  text(c, 'Alternative evaluation', 610, 266, 32, C.blue);
  number(c, sample.passes + ' / ' + sample.total, 609, 331, 49, C.blue);
  const g = plot(c, 104, 396, 1104, 453, 11, 'Two densities on the same scale', 'Pass rate');
  tailPlot(c, g, m, 1, ten);
  // Keep the ten-task outline visible when the two curves coincide.
  trace(c, g, (p) => density(ten, p), { color: '#647269', width: 3, dashed: true });
  gauge(c, {
    value: m.tail,
    verdict: cue(k, 2, 'meets our evidence rule') > 0 ? m.release : undefined,
    keepVerdictAboveRail: true,
  });
  const interval = (x, values, color) => {
    text(c, 'Middle 90%   ' + values.map((p) => percent(p)).join(' to '), x, 375, 28, color);
  };
  interval(111, smallInterval, C.cream);
  if (n === 20) interval(615, largeInterval, C.blue);
}
function sensitivity(c, k) {
  const beat = k.beat.beatIndex;
  bench(c, 'How far can ten results move each prior?');
  const processed = Math.round(10 * cue(k, 2, 'Give each prior the same', 3));
  strip(c, 107, 219, results, 10, 47, processed);
  text(c, processed + ' of 10 results applied', 763, 259, 31, C.muted);
  [1, 2, 20].forEach((n, i) => {
    const m = afterCards(processed, { a: n, b: n });
    const x = 103 + i * 583;
    const g = plot(c, x, 359, 547, 374, 9, 'Start at Beta(' + n + ', ' + n + ')', 'Pass rate', 0.5);
    trace(c, g, (p) => density({ a: n, b: n }, p), { color: '#728474', dashed: true });
    trace(c, g, (p) => density(m, p), { fill: '#a9c6cb' });
    line(c, g.X(0.5), g.b - 16, g.X(0.5), g.b + 3, C.ink, 4);
    line(c, g.X(m.mean), g.b - 48, g.X(m.mean), g.b, C.trace, 5);
    text(c, 'Mean', x + 11, 788, 31, C.muted);
    number(c, percent(m.mean), x + 117, 790, 43, C.blue);
    if (processed === 10) {
      text(c, 'Area above 70%', x + 12, 865, 30, C.muted);
      number(c, percent(m.tail), x + 273, 868, 40, C.brass);
    } else if (i === 2 && cue(k, 1, 'nineteen earlier passes', 0.6) > 0)
      text(c, 'Uniform start + 19 passes + 19 failures', x - 1, 868, 27, C.brass);
  });
  if (beat === 3 && cue(k, 3, 'opposite decisions', 0.3) > 0)
    text(
      c,
      'If justified tails were 93% and 97%, the call would depend on the prior.',
      106,
      320,
      32,
      C.cream,
    );
}
function familyCurves(c, k) {
  const fitted = [
    cue(k, 0, 'easy-task evidence goes', 0.7),
    cue(k, 1, 'hard-task evidence goes', 0.7),
  ];
  for (const [i, f] of [family.easy, family.hard].entries()) {
    const m = fitted[i] > 0.5 ? f : base;
    const x = 103 + i * 893;
    const g = plot(
      c,
      x,
      316,
      820,
      477,
      13,
      (i ? 'Hard' : 'Easy') + ' tasks   ·   ' + f.passes + ' / ' + f.total + ' passed',
      'Within-family pass rate',
    );
    trace(c, g, priorDensity, { color: '#728474', dashed: true });
    trace(c, g, (p) => density(m, p), {
      fill: i ? '#dbb5a0' : '#a3c4cb',
      color: i ? C.bad : C.trace,
    });
    text(c, betaName(m), x, 865, 42, C.cream, 'Mono');
    text(c, 'Mean   ' + percent(m.a / (m.a + m.b)), x + 381, 865, 34, i ? C.red : C.blue);
  }
}
function population(c, k) {
  const beat = k.beat.beatIndex;
  bench(c, 'Which tasks will the agent get?');
  if (beat < 2) {
    familyCurves(c, k);
    return;
  }
  const rotation = cue(k, 3, 'Change traffic from mostly easy', 3.4),
    w = lerp(0.8, 0.2, rotation);
  const g = plot(c, 104, 313, 904, 552, 1, 'Plausible easy and hard rates', 'Easy-task rate');
  const xy = (p) => [g.X(p.x), g.Y(p.y)];
  const region = passingRegion(w);
  const contours = contourData.map((d) => d.points.map(xy));
  const drawContours = (colors) => contours.forEach((points, i) => path(c, points, colors[i]));
  drawContours(['#c6d6d1', '#afc7c5', '#82a9b1', '#578b9d', '#265f7c']);
  c.save();
  path(c, region.map(xy), '#d7e6c9');
  c.clip();
  drawContours(['#bdd4b4', '#9bbf92', '#78a776', '#4f8858', '#295d3d']);
  c.restore();
  const boundary = region.filter(
    (pt) => Math.abs(w * pt.x + (1 - w) * pt.y - rateCutoff) < 1e-7,
  ).sort((a, b) => a.x - b.x).map(xy);
  text(c, 'Hard-task rate', 114, 275, 30, C.muted);
  text(c, 'Green rate pairs clear the 70% cutoff', 106, 887, 27, C.cream);
  text(c, 'Traffic mix', 1092, 277, 41, C.cream, 'Serif');
  const bar = 677;
  rect(c, 1093, 330, bar, 39, C.red, 5);
  rect(c, 1093, 330, bar * w, 39, C.blue, 5);
  number(c, 'Easy ' + percent(w, 0), 1093, 418, 35, C.blue);
  number(c, 'Hard ' + percent(1 - w, 0), 1769, 418, 35, C.red, 'right');
  const projection = cue(k, 5, 'Put the probability caught by each band', 4.8);
  const built = Math.round(20 * projection);
  // Subtract the outer half-plane from the inner half-plane to leave the active stripe.
  const bandNumber = beat === 4 ? 10 : Math.min(19, built);
  if (cue(k, 4, 'sweep a band', 0.4) > 0 && built < 20) {
    const low = bandNumber / 20,
      high = (bandNumber + 1) / 20;
    c.save();
    const poly = passingRegion(w, low).map(xy);
    c.beginPath();
    poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.clip();
    const below = passingRegion(w, high).map(xy);
    c.beginPath();
    c.rect(g.l, g.t, g.r - g.l, g.b - g.t);
    if (below.length) {
      c.moveTo(...below[0]);
      below.slice(1).forEach((pt) => c.lineTo(...pt));
      c.closePath();
    }
    c.fillStyle = 'rgba(179,104,24,.43)';
    c.fill('evenodd');
    c.restore();
  }
  path(c, boundary, null, '#ffefd2', 10);
  path(c, boundary, null, '#71400e', 4);
  const showPoint = cue(k, 4, 'Take the white point', 0.3) > 0;
  if (showPoint) {
    dot(c, g.X(0.9), g.Y(0.4), 10, C.deep);
    dot(c, g.X(0.9), g.Y(0.4), 6, '#fff');
  }
  if (beat < 4) {
    text(c, 'Weighted mean rate', 1092, 564, 37, C.muted);
    number(c, percent(forecastMix(w)), 1087, 674, 87);
    text(c, 'Same tasks, different traffic weights', 1093, 773, 34, C.muted);
    if (rotation === 0)
      text(
        c,
        'At this mix, ' + percent(mixTails.benchmark) + ' clears the cutoff.',
        1093,
        854,
        32,
        C.brass,
      );
    return;
  }
  if (beat === 4) {
    if (showPoint) text(c, 'At the white point', 1094, 572, 35, C.muted);
    if (cue(k, 4, 'With one fifth easy traffic') > 0)
      number(c, '0.2 × 0.9 + 0.8 × 0.4', 1091, 664, 42);
    if (cue(k, 4, 'one half') > 0) number(c, '= 0.50', 1092, 755, 63, C.blue);
    return;
  }
  const h = plot(
    c,
    1083,
    471,
    735,
    365,
    0.25,
    'Probability in each 5-point band',
    'Deployment pass rate',
  );
  for (let i = 0; i < built; i++) {
    const y = h.Y(bins[i]);
    rect(c, h.X(i / 20) + 1, y, (h.r - h.l) / 20 - 2, h.b - y, i < 14 ? C.tail : C.brassInk);
  }
  if (built === 20) {
    line(c, h.X(rateCutoff), h.t + 48, h.X(rateCutoff), h.b, C.brassInk, 3, true);
    text(c, '70%', h.X(rateCutoff), h.t + 37, 24, C.brassInk, 'Sans', 'center');
    text(
      c,
      'Mean   ' + percent(forecastMix(0.2)) + '     Above cutoff   ' + percent(mixTails.deployment),
      1089,
      879,
      32,
      C.blue,
    );
    if (cue(k, 5, 'Hold traffic here') > 0)
      text(c, 'Hold traffic', 1769, 277, 36, C.cream, 'Serif', 'right');
  }
}
function groupedCalibration(c, k) {
  text(c, 'Four illustrative batches of 100 fresh tasks each', 108, 266, 36, C.cream);
  forecastGroups.forEach((group, i) => {
    const x = 105 + i * 888;
    paper(c, x, 334, 820, 491);
    text(c, 'Forecasts near ' + percent(group.center, 0), x + 40, 401, 43, C.ink, 'Serif');
    text(c, 'Batch', x + 40, 474, 29, C.ink);
    text(c, 'Saved forecast', x + 230, 474, 29, C.trace);
    text(c, 'Later passes', x + 520, 474, 29, C.good);
    group.batches.forEach((batch, j) => {
      const y = 541 + j * 62;
      number(c, i * 2 + j + 1, x + 42, y, 37, C.ink);
      number(c, percent(batch.forecast), x + 228, y, 39, C.trace);
      number(c, batch.passes + ' / ' + batch.tasks, x + 518, y, 39, C.good);
    });
    line(c, x + 40, 645, x + 777, 645, C.grid, 3);
    text(c, 'Group', x + 40, 720, 34, C.ink, 'Serif');
    number(c, percent(group.meanForecast, 0), x + 224, 725, 62, C.trace);
    number(c, percent(group.fraction, 0), x + 515, 725, 62, C.good);
    text(c, 'Mean forecast', x + 230, 782, 28, C.trace);
    text(c, group.passes + ' / ' + group.tasks + ' passed', x + 520, 782, 28, C.good);
  });
  if (cue(k, 1, 'Pool the groups') > 0) {
    text(c, 'All ' + pooledForecast.tasks + ' tasks together', 108, 876, 40, C.cream, 'Serif');
    text(c, 'Mean forecast  ' + percent(pooledForecast.meanForecast, 0), 690, 876, 38, C.blue);
    text(c, pooledForecast.passes + ' / ' + pooledForecast.tasks + ' passed  =  ' +
      percent(pooledForecast.fraction, 0), 1240, 876, 38, C.green);
  }
}
function calibration(c, k) {
  const beat = k.beat.beatIndex;
  const retryView = cue(k, 2, "Here's a different log", 0.3) > 0;
  if (!retryView && cue(k, 1, 'Across many batches') > 0) {
    bench(c, 'Do similar forecasts match their outcomes?');
    groupedCalibration(c, k);
    return;
  }
  bench(
    c,
    retryView
      ? 'How many prompts did these attempts sample?'
      : 'Does the forecast hold up on fresh tasks?',
  );
  if (!retryView) {
    const locked = cue(k, 0, 'Save the seventy-one point four percent', 0.3) > 0;
    const n = Math.round(100 * cue(k, 0, 'Now open those results', 3.5));
    const g = plot(
      c,
      104,
      320,
      1125,
      539,
      1,
      'Forecast and running pass fraction',
      'Fresh tasks opened',
      0.25,
      100,
    );
    if (locked) line(c, g.l, g.Y(ten.mean), g.r, g.Y(ten.mean), C.trace, 4, true);
    const points = validation
      .slice(0, n)
      .map((row) => [g.X(row.n / validation.length), g.Y(row.fraction)]);
    if (points.length) {
      path(c, points, null, C.good, 5);
      dot(c, ...points.at(-1), 8, C.good);
    }
    text(c, 'Saved before outcomes', 1294, 370, 32, C.muted);
    number(c, locked ? percent(ten.mean) : '···', 1290, 468, 72, C.blue);
    text(c, 'Fresh passes / tasks', 1294, 611, 32, C.muted);
    number(c, (n ? validation[n - 1].passes : 0) + ' / ' + n, 1290, 703, 63, C.green);
    if (n === 100)
      text(c, 'Observed   ' + percent(validation[n - 1].fraction), 1294, 785, 35, C.green);
    return;
  }
  const sort = cue(k, 2, 'Group the rows by prompt', 3.8);
  const filed = Math.floor(20 * sort);
  text(c, '20 logged attempts', 106, 272, 40, C.cream, 'Serif');
  text(c, 'Attempts grouped by prompt', 1084, 272, 40, C.cream, 'Serif');
  const names = ['Parse date', 'Sort list', 'Read CSV', 'Join rows'];
  const colors = ['#aacdd4', '#edb695', '#c5c799', '#b4bbd5'];
  for (let group = 0; group < 4; group++) {
    const y = 343 + group * 113;
    text(c, names[group], 1087, y + 46, 34, colors[group]);
    rect(c, 1310, y, 510, 64, C.deep, 7);
  }
  for (let row = 0; row < 20; row++) {
    const group = row % 4,
      run = Math.floor(row / 4);
    const x = 108 + (row % 3) * 301,
      y = 340 + Math.floor(row / 3) * 67;
    const counted = row < filed;
    rect(c, x, y, 265, 52, counted ? '#496661' : colors[group], 5);
    text(c, names[group], x + 12, y + 39, 26, counted ? C.muted : C.ink);
    number(c, run + 1, x + 249, y + 39, 26, counted ? C.muted : C.ink, 'right');
    if (counted) {
      const slotX = 1318 + run * 100,
        slotY = 351 + group * 113;
      rect(c, slotX, slotY, 94, 48, colors[group], 3);
      number(c, String(run + 1).padStart(2, '0'), slotX + 47, slotY + 35, 28, C.ink, 'center');
    }
  }
  if (sort === 1) {
    text(c, '4 distinct prompts', 109, 883, 57, C.brass, 'Serif');
    if (beat === 3)
      text(
        c,
        'Sample new prompts from the intended traffic. Group retries under each prompt.',
        109,
        961,
        34,
      );
  }
}
function practice(c, k) {
  const beat = k.beat.beatIndex;
  const failed = cue(k, 3, 'Suppose task twenty-one fails', 0.5) > 0.5;
  const passed = beat < 3 && cue(k, 1, 'Task twenty-one passes', 0.5) > 0.5;
  const updated = failed
    ? cue(k, 3, 'Add that failure', 0.6)
    : passed
      ? cue(k, 1, 'Add this pass', 0.6)
      : 0;
  const current = updated === 1 ? (failed ? lastCases.fail : lastCases.pass) : lastCases.sealed;
  let measurement = 1;
  if (updated === 1)
    measurement = failed
      ? cue(k, 3, 'Measure the area above', 2)
      : cue(k, 1, 'Measure the blue area again', 2);
  const end = lerp(rateCutoff, 1, measurement);
  const decision =
    beat === 2
      ? cue(k, 2, 'Increase traffic') > 0
      : beat === 4
        ? cue(k, 4, 'Hold traffic') > 0
        : false;
  bench(c, 'What changes on task twenty-one?');
  text(c, 'First 20 results', 107, 243, 32, C.muted);
  strip(c, 109, 272, previousTasks, 20, 39);
  const tagX = 1121;
  text(c, 'Task 21', tagX, 243, 32, C.cream);
  card(c, tagX, 261, 68, 64, failed ? false : passed ? true : null);
  text(
    c,
    failed ? 'Fail' : passed ? 'Pass' : 'Sealed',
    tagX + 83,
    305,
    34,
    failed ? C.red : passed ? C.green : C.muted,
  );
  const g = plot(
    c,
    104,
    400,
    1106,
    385,
    6,
    'Posterior density   ·   ' + betaName(current),
    'Pass rate in the intended traffic',
  );
  text(c, 'Prior   Beta(2, 2)', 110, 365, 27, C.muted);
  if (cue(k, 4, 'Keep the sampling plan', 0.35) > 0) {
    text(
      c,
      'Middle 90%   ' + finalInterval.map((p) => percent(p)).join(' to '),
      633,
      365,
      27,
      C.blue,
    );
  }
  tailPlot(c, g, current, end, lastCases.sealed);
  if (measurement < 1) {
    line(c, g.X(end), g.t + 26, g.X(end), g.b, C.brassInk, 3);
  }
  gauge(c, {
    value: measurement === 1 ? current.tail : null,
    label: measurement < 1 ? 'Measuring the updated tail'
      : (failed || passed) && updated < 1 ? 'Chance from first 20 tasks'
      : 'Chance above cutoff',
    verdict: decision ? current.release : undefined,
    zoom: true,
    keepVerdictAboveRail: true,
  });
  text(c, 'First twenty', 109, 825, 31, C.muted);
  number(c, percent(lastCases.sealed.tail), 108, 876, 46);
  if (beat === 2 || beat >= 3) {
    text(c, 'With a pass', 468, 825, 31, C.green);
    number(c, percent(lastCases.pass.tail), 467, 876, 46, C.green);
  }
  if (beat === 4) {
    text(c, 'With a failure', 837, 825, 31, C.red);
    number(c, percent(lastCases.fail.tail), 836, 876, 46, C.red);
  }
}
const scenes = [
  opening,
  prior,
  likelihoodScene,
  update,
  predictive,
  uncertainty,
  compareSamples,
  sensitivity,
  population,
  calibration,
  practice,
];
const captionStarts = {
  'c01-b02': ['to open the valve'],
  'c02-b01': ["we'll give middle rates"],
  'c02-b02': ['If we squeeze', 'how much probability will it keep'],
  'c03-b01': ['and pass criterion fixed'],
  'c04-b01': ['at that same rate'],
  'c04-b02': ['also called the evidence'],
  'c04-b04': ['when the next task arrives'],
  'c05-b03': ['eleven over fifteen'],
  'c05-b04': ['by the chance of a second pass'],
  'c05-b05': ['a pass on the first task'],
  'c06-b02': ['in each outside tail'],
  'c06-b03': ['from the posterior mean'],
  'c06-b08': ['even though the average count stays the same'],
  'c07-b02': ['with four passes in each group'],
  'c08-b04': ['instead gave ninety-three and ninety-seven percent'],
  'c09-b03': ['with a possible hard-task rate', 'from pairs that fall short'],
  'c09-b05': ['and forty percent of hard ones', 'that pair gives'],
  'c09-b06': ['and less than one percent'],
  'c09-b07': ['and representative tasks within each family', 'tells us very little about the hard traffic'],
  'c10-b02': ['and sixty-five percent pass', 'and fifty-five percent pass'],
  'c10-b04': ['sample distinct ones from the intended traffic', 'including the runs that went badly'],
  'c11-b01': ['with the same agent policy'],
  'c11-b03': ['from ninety-four point six', 'and what a failed task costs'],
  'c11-b05': ['was ninety-five point eight', 'so the next reviewer', 'to understand uncertainty in an estimate'],
};
const captionReplacements = {
  'c06-b05': { 'slot two': 'Move the failure to slot two' },
  'c06-b06': { 'all five tasks pass': 'Now let all five tasks pass' },
  'c06-b07': { 'fix the rate at its mean': 'Now fix the rate at its mean' },
  'c07-b03': { 'meets our evidence rule': 'The larger evaluation' },
  'c08-b04': { 'opposite decisions': 'Our rule would give opposite decisions' },
  'c09-b05': { 'one half': false, 'sweep a band': 'Now sweep a band' },
};
export default {
  title,
  check,
  draw(c, k) {
    for (const phrase of captionStarts[k.beat.id] ?? []) k.reveal(phrase, 0, { captionStart: phrase });
    const replacements = captionReplacements[k.beat.id];
    const clock = replacements
      ? {
          ...k,
          reveal(phrase, seconds) {
            return Object.hasOwn(replacements, phrase)
              ? k.reveal(phrase, seconds, { captionStart: replacements[phrase] })
              : k.reveal(phrase, seconds);
          },
        }
      : k;
    scenes[k.beat.chapterIndex](c, clock);
  },
};
