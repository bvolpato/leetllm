import {
  label,
  mid,
  num,
  title,
  rect,
  oval,
  line,
  sheet,
  rows,
  ground,
  cue,
  beat,
  ease,
  mix,
  signed,
  ink,
  mute,
  teal,
  rust,
  plum,
  paper,
  gray,
  ruler,
  arrow,
} from './drawing.mjs';
import { mouse, board, flag, purple, orange } from './apparatus.mjs';
import {
  ledger,
  positive,
  result,
  summary,
  practice,
  histogram,
  firstSample,
  reportedInterval,
  endpointRanks,
  independentInterval,
  earlyCovariance,
  anti,
  pairDifferences,
  meanDifference,
  cov,
  ind,
  paired,
  rates,
  policy,
  transitionMeans,
  restore,
  worksheet,
  RS_Q18,
} from './study.mjs';

export function covariance(c, k) {
  ground(c, 'plot');
  const b = beat(k);
  title(
    c,
    b === 3 ? 'What do the five differences average?' : 'How does pairing change uncertainty?',
  );
  const xx = (v) => 240 + 650 * v,
    yy = (v) => 740 - 375 * v;
  label(c, 'Candidate score', 140, 275, 37, mute);
  line(c, xx(0), yy(0), xx(1), yy(0), ink, 3);
  line(c, xx(0), yy(1), xx(0), yy(0), ink, 3);
  for (const v of [0, 0.25, 0.5, 0.75, 1]) {
    num(c, v, xx(v), yy(0) + 44, 29, mute, 'center');
    if (v) num(c, v, xx(0) - 31, yy(v), 29, mute, 'right');
  }
  mid(c, 'Baseline score', 545, 858, 37, mute);
  const extent = cue(k, 1, 'five invented baseline', 1.35);
  const left = cue(k, 3, 'leftmost pair');
  const right = cue(k, 3, 'rightmost pair');
  const all = cue(k, 3, 'Across all five pairs');
  if (b === 3) {
    c.save();
    c.setLineDash([12, 10]);
    line(c, xx(0), yy(0), xx(1), yy(1), mute, 3);
    c.restore();
    label(c, 'Equal scores', xx(0.77), yy(1) - 26, 29, mute);
  }
  anti.slice(0, Math.round(extent * anti.length)).forEach(([x, y], i) => {
    const focused = all || (i === 0 && left) || (i === anti.length - 1 && right);
    const diff = pairDifferences[i];
    const color = diff < 0 ? rust : teal;
    if (b < 3) line(c, xx(x), yy(0), xx(x), yy(y), '#b5c2b7', 2);
    if (focused) {
      line(c, xx(x), yy(x), xx(x), yy(y), color, 4);
      c.beginPath();
      c.arc(xx(x), yy(y), 25, 0, Math.PI * 2);
      c.lineWidth = 4;
      c.strokeStyle = color;
      c.stroke();
    }
    oval(c, xx(x), yy(y), 16, 16, teal);
    const showValue =
      all ||
      (i === 0 && cue(k, 3, 'gains a full point')) ||
      (i === anti.length - 1 && cue(k, 3, 'loses a full point'));
    if (showValue) {
      const last = i === anti.length - 1;
      num(
        c,
        signed(diff, Number.isInteger(diff) ? 0 : 1),
        xx(x) + (last ? -33 : 33),
        yy(y) - 33,
        37,
        color,
        last ? 'right' : 'left',
      );
    }
  });
  sheet(c, 987, 260, 825, 612);
  label(c, 'Variance of the mean difference', 1031, 324, 46, ink, 'Serif');
  label(c, 'Independent, identically distributed pairs', 1034, 385, 33, mute);
  num(c, '(v₁ + v₂ − 2 cov) / n', 1034, 455, 42);
  if (b > 0)
    rows(
      c,
      1038,
      558,
      722,
      [
        ['Covariance', cue(k, 1, 'Their sample covariance') ? signed(cov, 5) : '—'],
        ['Independent', cue(k, 2, 'independent estimate') ? ind.toFixed(4) : '—'],
        ['Paired', cue(k, 2, 'paired variance doubles') ? paired.toFixed(3) : '—'],
      ],
      cue(k, 2, 'paired variance doubles') ? 2 : b >= 2 ? 1 : 0,
      93,
    );
  else {
    label(c, 'Independent samples', 1035, 578, 40, mute);
    num(c, '(v₁ + v₂) / n', 1036, 666, 44);
  }
  if (cue(k, 3, 'zero, even though'))
    label(c, 'Mean difference = ' + meanDifference, 1036, 936, 48, teal, 'Serif');
}
export function freeze(c, k) {
  ground(c, 'desk');
  const b = beat(k);
  title(c, b ? 'Greedy evaluation' : 'Which seeds are reserved?');
  if (!b) {
    sheet(c, 155, 294, 1580, 520);
    rows(
      c,
      213,
      430,
      1452,
      [
        ['Pilot debugging', '900, 901, 902'],
        ['Worked sample', '0 through 23 · already observed'],
        ['Fresh confirmation', 'reserve before observing results'],
      ],
      0,
      134,
    );
    return;
  }
  sheet(c, 125, 300, 670, 504);
  label(c, 'Frozen Q table', 175, 390, 63, ink, 'Serif');
  for (let j = 0; j < 6; j++) {
    const x = 177 + j * 89;
    num(c, j, x + 36, 513, 31, mute, 'center');
    rect(c, x, 555, 74, 78, '#d4dfd5');
    mid(c, policy[j] ? '→' : '←', x + 37, 593, 47, ink);
  }
  label(c, 'Example · seed 18', 175, 718, 38, mute);
  arrow(c, 810, 545, 989, 545, teal, 7);
  label(c, 'Slip tape   /   10,018', 1032, 392, 51, teal, 'Serif');
  num(c, '200 greedy trips', 1029, 517, 54);
  label(c, 'Score each arrival on square 6.', 1030, 627, 39);
  if (b === 2) {
    line(c, 1033, 713, 1730, 713, gray, 2);
    label(c, 'Tune on these → reserve fresh seeds.', 1034, 767, 35, rust);
  }
}
export function ablations(c, k) {
  ground(c, 'desk');
  const b = beat(k);
  title(c, 'What changed in this comparison?');
  sheet(c, 120, 234, 1680, 662);
  const r = [
    ['Control   /   Φ = 0', 'compare every entry with sparse'],
    ['Primary   /   distance Φ', 'change the training reward'],
    ['Sensitivity   /   separate indices', 'resample the retained scores'],
    ['Exploratory   /   reverse Φ', 'change the sign and retrain'],
  ];
  const n =
    b === 0
      ? cue(k, 0, 'distance-potential row')
        ? 2
        : 1
      : cue(k, 1, 'reversed-potential row')
        ? 4
        : 3;
  rows(c, 187, 360, 1533, r.slice(0, n), n - 1, 133);
  if (b === 2)
    label(c, 'The plan keeps the primary comparison fixed.', 160, 952, 43, teal, 'Serif');
}
export function attempts(c, k) {
  ground(c, 'desk');
  title(c, 'The first attempt stays in the ledger');
  sheet(c, 117, 243, 1681, 638);
  const rerun = cue(k, 1, 'permitted rerun'),
    fail = cue(k, 0, 'record a mechanical failure'),
    running = cue(k, 0, 'to running');
  label(c, 'Illustrative run log', 164, 319, 49, ink, 'Serif');
  const xs = [180, 430, 785, 1260];
  ['Seed', 'Attempt', 'Status', 'Artifact'].forEach((s, i) => label(c, s, xs[i], 421, 36, mute));
  const record = (y, vals, col) => {
    line(c, 164, y - 55, 1734, y - 55, gray, 2);
    vals.forEach((s, i) =>
      label(c, s, xs[i], y, 42, i === 2 ? col : ink, 'Sans', 500, 'left', i === 2 ? 450 : 414),
    );
  };
  record(
    538,
    [
      '06',
      'A',
      fail ? 'Write failed' : running ? 'Running' : 'Planned',
      fail ? 'error retained' : '—',
    ],
    fail ? rust : teal,
  );
  if (rerun) {
    record(677, ['06', 'B → A', 'Complete', 'replacement rows'], teal);
    record(804, ['11', 'A', 'Complete', 'regression kept'], teal);
  }
}
export function deltaPlot(c, k) {
  ground(c, 'plot');
  title(c, 'Extra goals in 30 trips');
  const p = cue(k, 0, 'Read one column', 2.8),
    n = Math.round(24 * p);
  const x = (v) => 161 + v * 67.8,
    y = (v) => 651 - v * 17.2;
  for (const tick of [-10, 0, 10, 20]) {
    line(c, 129, y(tick), 1764, y(tick), tick ? '#bcc0b1' : ink, tick ? 2 : 4);
    num(c, signed(tick), 109, y(tick), 32, mute, 'right');
  }
  for (const r of ledger.slice(0, n)) {
    const xx = x(r.seed),
      v = r.gain,
      yy = y(v);
    rect(c, xx - 13, Math.min(y(0), yy), 26, Math.abs(y(0) - yy), v < 0 ? rust : teal);
    num(c, r.seed, xx, 912, 27, mute, 'center');
    if (v < 0 && cue(k, 0, 'Five pairs')) num(c, signed(v), xx, yy + 29, 28, rust, 'center');
  }
  label(c, 'Seed', 1778, 912, 32, mute);
  label(c, 'Shaped minus sparse', 130, 231, 40, mute);
  if (cue(k, 0, 'The mean across')) {
    const g = result.gain / 24;
    line(c, 132, y(g), 1763, y(g), plum, 3);
    label(c, 'Mean  +' + g.toFixed(2) + ' goals', 1347, 232, 38, plum);
  }
}
function seedStub(c, x, y, r, w = 326, h = 159) {
  sheet(c, x, y, w, h, r.gain < 0 ? '#f5ddd1' : '#dfede0');
  label(c, 'Seed ' + r.seed, x + 23, y + 38, 34, mute, 'Mono');
  num(c, signed(r.gain) + ' / 30', x + 23, y + h * 0.66, 46, r.gain < 0 ? rust : teal);
}
export function drawPairs(c, k) {
  ground(c, 'desk');
  title(c, 'Draw four whole pairs');
  const sx = (i) => 135 + 425 * i,
    ids = [0, 6, 14, 23];
  const sampleCues = ['Take seed six twice', 'six twice', 'then seed fourteen', 'then seed zero'];
  ids.forEach((id, i) => seedStub(c, sx(i), 255, ledger[id]));
  label(c, 'Available again after each draw', 138, 207, 33, mute);
  for (const [i, r] of practice.entries()) {
    const t = ease(cue(k, 0, sampleCues[i], 0.68));
    line(c, sx(i), 746, sx(i) + 326, 746, gray, 4);
    if (t) seedStub(c, mix(sx(ids.indexOf(r.seed)), sx(i), t), mix(255, 578, t), r);
  }
  const answered = cue(k, 2, "That's about four");
  if (beat(k) >= 1) {
    num(c, '100 × (−9 − 9 + 20 + 3) / (4 × 30)', 130, 863, 48);
    num(c, answered ? '+4.2 points' : '= ?', 1592, 863, 50, teal, 'center');
  }
  if (beat(k) >= 3)
    label(c, 'Full study draw    24 seed pairs with replacement', 134, 954, 35, mute);
}
function afterPhrase(k, b, phrase) {
  return cue(k, b, phrase, 0) > 0 && (beat(k) > b || k.elapsed >= k.wordCue(phrase).end);
}
function bootstrapNeighbors(c, k) {
  title(c, 'Find both endpoints in the sorted list');
  label(c, 'Zero-based indices   /   net goals ÷ early trips per arm', 132, 214, 40, mute);
  let progress = 1;
  let showValues = true;
  let showEndpoints = true;
  if (beat(k) === 3) {
    const scan = k.wordCue('two neighbors for each endpoint');
    progress = ease((k.elapsed - scan.start) / (scan.end - scan.start));
    showValues = k.elapsed >= k.wordCue('have the same value').end;
    showEndpoints = k.elapsed >= k.wordCue('leaves each endpoint where it is').end;
  }
  const left = 655;
  const right = 1165;
  const trips = result.episodesPerArm;
  endpointRanks.forEach(({ probability, position, indices, neighbors, endpoint }, i) => {
    const y = 314 + i * 291;
    label(c, `${probability * 100}th percentile`, 132, y + 55, 49, ink, 'Serif');
    for (const [j, x] of [left, right].entries()) {
      rect(c, x - 154, y, 308, 139, paper, gray, 2);
      num(c, `Index ${indices[j]}`, x, y + 38, 35, mute, 'center');
      if (showValues) {
        const goals = Math.round(neighbors[j] * trips);
        num(c, `${signed(goals)} / ${trips}`, x, y + 95, 43, teal, 'center');
      }
      line(c, x, y + 139, x, y + 182, gray, 3);
    }
    line(c, left, y + 182, right, y + 182, ink, 4);
    for (const x of [left, right]) line(c, x, y + 169, x, y + 197, ink, 4);
    const rankX = mix(left, right, progress * (position - indices[0]));
    if (progress > 0) oval(c, rankX, y + 182, 11, 11, rust);
    if (progress === 1) num(c, `Rank ${position.toFixed(2)}`, rankX, y + 228, 35, rust, 'center');
    if (showEndpoints) {
      label(c, 'Endpoint', 1433, y + 38, 36, mute);
      const points = 100 * endpoint;
      const rounded = points.toFixed(1);
      const approx = points === Number(rounded) ? '' : '≈ ';
      num(c, approx + signed(points, 1) + ' pp', 1433, y + 99, 50, teal);
    }
  });
}
export function bootstrap(c, k) {
  ground(c, 'plot');
  const b = beat(k);
  const backToStudy = afterPhrase(k, 3, 'Back in the actual run');
  const practiceNow = b === 2 || (b === 3 && !backToStudy);
  if (practiceNow) {
    title(c, 'A rank between two neighbors');
    const x = 324,
      w = 1228,
      y = 580;
    line(c, x, y, x + w, y, ink, 6);
    for (let j = 0; j <= 4; j++) {
      line(c, x + (w * j) / 4, y - 24, x + (w * j) / 4, y + 24, ink, 5);
    }
    num(c, '+4 points', x, y + 104, 48, ink, 'center');
    num(c, '+12 points', x + w, y + 104, 48, ink, 'center');
    const marker = ease(cue(k, 2, 'one quarter', 0.65));
    const answer = afterPhrase(k, 3, 'you get six points');
    const gap = b === 3 && k.elapsed >= k.wordCue('gap is two').end;
    if (marker) {
      const markerX = x + (w * marker) / 4;
      arrow(c, markerX, 391, markerX, y - 30, teal, 7);
      mid(
        c,
        answer ? '+6 points' : '¼ of the gap',
        markerX,
        327,
        52,
        teal,
      );
    }
    if (answer) num(c, '4 + 0.25 × (12 − 4) = 6', 340, 846, 55);
    else if (gap) num(c, '0.25 × (12 − 4) = 2', 340, 846, 55);
    return;
  }
  if (backToStudy && !cue(k, 4, 'A different draw')) {
    bootstrapNeighbors(c, k);
    return;
  }
  const firstDraw = b === 0 && !cue(k, 0, 'Repeat that draw');
  title(c, firstDraw ? 'One mean from 24 draws' : 'Ten thousand resampled means');
  if (firstDraw) {
    label(c, 'Seed IDs   /   first recorded draw', 143, 294, 41, mute);
    firstSample.forEach((r, i) => {
      const xx = 144 + (i % 12) * 135,
        yy = 399 + Math.floor(i / 12) * 103;
      rect(c, xx, yy, 117, 83, r.gain < 0 ? '#f3d9cf' : '#d7e3d9');
      num(c, r.seed, xx + 58, yy + 40, 42, ink, 'center');
    });
    if (cue(k, 0, 'Average those selected'))
      num(c, '113 net goals / 720   =   +15.7 points', 143, 776, 51, teal);
    return;
  }
  const x0 = 156,
    w = 1552,
    y = 759,
    step = w / histogram.length,
    peak = Math.max(...histogram.map((q) => q.n));
  histogram.forEach(({ n }, i) =>
    rect(c, x0 + i * step, y - (360 * n) / peak, step - 2, (360 * n) / peak, '#4d8885'),
  );
  line(c, x0, y, x0 + w, y, ink, 3);
  const at = (n) => x0 + (n + 12) * step;
  for (const tick of [0, 10, 20, 30]) num(c, tick, at(tick), 813, 34, mute, 'center');
  label(c, 'Mean gain in percentage points', 139, 910, 36, mute);
  if (cue(k, 1, 'For a percentile')) {
    endpointRanks.forEach(({ probability, gaps, position }, i) => {
      num(c, `${probability} × ${gaps} = ${position.toFixed(2)}`, 1049, 883 + 58 * i, 31);
    });
    label(c, 'Rank', 909, 883, 31, mute);
  }
  label(c, '10,000 draws    /    NumPy seed 20260731', 145, 255, 40, mute);
  if (cue(k, 1, 'fifth and ninety-fifth'))
    reportedInterval.forEach((v, i) => {
      const xx = at(v * 100);
      line(c, xx, 356, xx, y + 10, rust, 4);
      num(c, (i ? '95%' : '5%') + '   ' + signed(v * 100, 1), xx, 307, 36, rust, 'center');
    });
}
export function lowerLimit(c, k) {
  ground(c, 'plot');
  const b = beat(k);
  const [lo, hi] = reportedInterval.map((v) => 100 * v);
  const [independentLow, independentHigh] = independentInterval.map((v) => 100 * v);
  const independent = afterPhrase(k, 2, 'Resampling the arms separately');
  const answered = afterPhrase(k, 2, 'about fifteen percent wider');
  const scale = { x: 200, w: 1450, min: -5, max: 27 };
  const at = (v) => scale.x + ((v - scale.min) * scale.w) / (scale.max - scale.min);
  title(c, 'How large a gain does the interval allow?');
  label(c, 'Early success   /   24 paired seeds', 143, 270, 45, mute);
  ruler(c, {
    ...scale,
    y: 497,
    ticks: [-5, 0, 5, 10, 15, 20, 25],
    mean: result.points,
    low: lo,
    high: hi,
    guide: 10,
  });
  if (!independent)
    label(c, 'Mean   ' + signed(result.points, 1), 156, 750, 52, ink, 'Serif');
  if (b === 1) label(c, 'Lower limit   ' + signed(lo, 1) + '   <   +10', 790, 752, 50, rust);
  if (b !== 2) return;
  if (cue(k, 2, 'Keeping only the gains') && !independent)
    label(
      c,
      'Gain-only subset   ' + signed(summary(positive).points, 1) + ' points',
      790,
      748,
      43,
      rust,
    );
  if (!independent) return;

  label(c, 'Paired', 145, 442, 40, teal);
  num(c, (hi - lo).toFixed(2) + ' pp wide', 145, 486, 38, teal);
  label(c, 'Independent arms', 145, 672, 40, plum);
  const track = 698;
  line(c, scale.x, track, scale.x + scale.w, track, gray, 2);
  const compare = k.wordCue('made the interval');
  const progress = ease((k.elapsed - compare.start) / (compare.end - compare.start));
  for (const endpoint of [lo, hi]) {
    const x = at(endpoint);
    c.save();
    c.setLineDash([9, 8]);
    line(c, x, 583, x, mix(583, track, progress), mute, 2);
    c.restore();
  }

  if (answered) {
    line(c, at(independentLow), track, at(independentHigh), track, plum, 12);
    for (const endpoint of [independentLow, independentHigh]) {
      const x = at(endpoint);
      line(c, x, track - 19, x, track + 17, plum, 5);
      num(c, signed(endpoint, 1), x, track + 59, 38, plum, 'center');
    }
    num(c, (independentHigh - independentLow).toFixed(2) + ' pp wide', 145, 726, 38, plum);
  } else {
    label(c, 'Wider or narrower?', 145, 724, 34, mute);
  }
  label(
    c,
    'Same observed scores  ·  ' +
      (earlyCovariance > 0 ? 'positive' : earlyCovariance < 0 ? 'negative' : 'zero') +
      ' sample covariance',
    145,
    821,
    33,
    mute,
  );
}
export function tied(c, k) {
  ground(c, 'blue');
  title(c, 'Seed 18   /   Frozen policies');
  const open = cue(k, 1, 'Open the scores');
  num(c, 'Difference   0 points', 151, 295, 58);
  const x = 445,
    w = 1090;
  for (const [i, arm] of [purple, orange].entries()) {
    const yy = 466 + i * 193;
    label(c, i ? 'Shaped' : 'Sparse', 150, yy + 37, 53, arm.ink, 'Serif');
    rect(c, x, yy, w, 76, paper, gray, 2);
    if (open) rect(c, x, yy, (w * rates[i]) / 100, 76, arm.ink);
    line(c, x + w / 2, yy - 13, x + w / 2, yy + 88, ink, 3);
    num(c, open ? rates[i] * 2 + ' / 200' : '? / 200', 1804, yy + 38, 43, ink, 'right');
  }
  num(c, '100 goals', x + w / 2, 815, 35, mute, 'center');
  if (open) label(c, 'Both reached the flag in 45.5% of trips.', 151, 919, 41, teal);
}
export function frozenPolicy(c, k) {
  ground(c);
  title(c, 'The move that keeps both mice at the wall');
  const slip = cue(k, 0, 'unless a slip reverses', 0.9),
    x = 287,
    pitch = 211;
  for (let j = 0; j < policy.length; j++) {
    num(c, policy[j] ? '→' : '←', x + j * pitch, 293, 70, j ? teal : rust, 'center');
  }
  board(c, 585, x, pitch, 6);
  flag(c, x + 6 * pitch + 60, 585, 0, orange);
  mouse(c, x + ease(slip) * pitch, 585, 1.29, slip > 0 ? 1 : -1, 7 * slip, 0, purple);
  label(c, 'Seed 18   /   greedy action at each square', 134, 731, 42, mute);
  if (beat(k)) num(c, '91 / 200 goals in each arm     ·     0 point difference', 137, 863, 47);
  else {
    const q = RS_Q18[0];
    num(
      c,
      'Sparse Q(0, left) = ' + q[0].toFixed(4) + '     Q(0, right) = ' + q[1].toFixed(4),
      139,
      866,
      41,
    );
  }
}
export function workBudget(c, k) {
  ground(c, 'work');
  title(c, 'Eighty trips can take different amounts of work');
  const x = 504,
    w = 1135,
    y = 368;
  const steps = cue(k, 0, 'The retained rows');
  for (const [i, arm] of [purple, orange].entries()) {
    const yy = y + i * 200;
    label(c, i ? 'Shaped' : 'Sparse', 143, yy + 35, 51, arm.ink, 'Serif');
    rect(c, x, yy, w, 70, '#d6d0bd');
    rect(c, x, yy, w * (steps ? transitionMeans[i] / 960 : 1), 70, arm.ink);
    num(
      c,
      steps ? transitionMeans[i].toFixed(i ? 1 : 2) : '80 trips',
      x + w * (steps ? transitionMeans[i] / 960 : 1),
      yy - 45,
      48,
      arm.ink,
      'center',
    );
  }
  label(
    c,
    steps
      ? 'Mean training transitions per seed   /   scale 0 to 960'
      : 'Training trips per arm   /   scale 0 to 80',
    295,
    750,
    44,
    mute,
  );
  if (beat(k)) label(c, 'Wall-clock time needs a timed run.', 503, 868, 47, ink, 'Serif');
}
export function rebuild(c, k) {
  ground(c, 'desk');
  title(c, 'Rebuild the figure from its seed rows');
  const m = restore(k),
    members = new Set(m.selected.map((r) => r.seed));
  const x = 129,
    y = 277,
    w = 145,
    h = 125;
  label(c, 'Change in goals   /   30 trips per learner', 128, 209, 36, mute);
  for (const r of ledger) {
    const xx = x + (r.seed % 6) * (w + 16),
      yy = y + Math.floor(r.seed / 6) * (h + 18),
      entered = members.has(r.seed);
    rect(c, xx + 4, yy + 6, w, h, '#33424523');
    rect(
      c,
      xx,
      yy,
      w,
      h,
      entered ? (r.gain < 0 ? '#eed3c6' : '#eaf1dc') : '#bfc5b4',
      entered ? '#929f8d' : '#8d978b',
      2,
    );
    num(c, 'seed ' + r.seed, xx + 12, yy + 31, 25, entered ? mute : '#515f55');
    if (entered)
      num(c, signed(r.gain), xx + w / 2, yy + 82, 49, r.gain < 0 ? rust : teal, 'center');
    else line(c, xx + 31, yy + 85, xx + w - 31, yy + 85, '#8f968c', 3);
  }
  folioResult(c, m, k);
}
function folioResult(c, m, k) {
  const x = 1159;
  sheet(c, x, 269, 625, 571);
  label(
    c,
    m.selected.length === positive.length ? 'Submitted figure' : 'Rebuilt figure',
    x + 40,
    346,
    55,
    ink,
    'Serif',
  );
  num(c, m.selected.length + ' / 24 pairs', x + 42, 456, 47);
  line(c, x + 41, 531, x + 579, 531, gray, 2);
  label(c, 'Net goals / early trips per arm', x + 40, 563, 30, mute);
  num(c, signed(m.gain) + ' / ' + m.episodesPerArm, x + 42, 610, 50);
  const out = m.answer
    ? signed(m.points, 1) + ' points'
    : m.selected.length === 19
      ? signed(m.points, 1) + ' points'
      : '? points';
  num(c, out, x + 41, 738, 59, m.selected.length === 19 ? rust : teal);
  if (beat(k) >= 2 && cue(k, 2, 'paired interval'))
    label(
      c,
      '90% interval   ' + reportedInterval.map((v) => signed(v * 100, 1)).join(' to ') + ' points',
      129,
      920,
      42,
      teal,
    );
  if (beat(k) === 3) {
    label(c, 'Retain reference + separate rerun', 1159, 919, 37, ink);
  }
}
export function finalPractice(c, k) {
  ground(c, 'plot');
  const b = beat(k),
    changed = !!cue(k, 4, 'minus three points'),
    m = worksheet(changed);
  title(c, 'A fresh report', 129, 105, 75);
  label(c, 'Differences in percentage points', 132, 205, 37, mute);
  const early = cue(k, 0, 'early ruler'),
    final = cue(k, 0, 'magnified final ruler');
  label(c, 'Early goal rate', 126, 298, 51, ink, 'Serif');
  ruler(c, {
    x: 137,
    y: 429,
    w: 976,
    min: -5,
    max: 25,
    ticks: [-5, 0, 5, 10, 15, 20, 25],
    guide: 10,
    ...(early ? m.early : {}),
    unit: '',
  });
  label(
    c,
    early ? 'Mean +13     /     mean ≥ 10, lower limit > 0' : 'Mean ≥ 10, lower limit > 0',
    136,
    571,
    34,
    mute,
  );
  label(c, 'Final goal rate', 127, 687, 51, ink, 'Serif');
  ruler(c, {
    x: 137,
    y: 810,
    w: 976,
    min: -4,
    max: 4,
    ticks: [-4, -2, 0, 2, 4],
    band: [-2, 2],
    ...(final ? m.final : {}),
    unit: '',
  });
  label(c, final ? 'Mean +0.5     /     allowed band ±2' : 'Allowed band ±2', 137, 956, 34, mute);
  sheet(c, 1195, 246, 604, 681);
  label(
    c,
    b < 2 ? 'Draft inference' : b === 4 ? 'Revised interval' : 'Report decision',
    1234,
    324,
    54,
    ink,
    'Serif',
  );
  if (b >= 1) {
    label(c, 'Absolute final success', 1238, 433, 37, mute);
    m.rates.forEach((n, i) => {
      const x = 1238 + 276 * i;
      num(c, n.toFixed(1) + '%', x, 509, 49);
      label(c, i ? 'Shaped' : 'Sparse', x, 563, 31, mute);
    });
    if (b === 1) {
      label(c, 'At least 10 points?', 1239, 653, 42, rust);
      label(c, 'Competent policies?', 1239, 744, 42, rust);
    }
    if (b === 2 || b === 3) {
      label(c, 'Early rule passes', 1239, 639, 41, teal);
      if (cue(k, 2, 'The final rule passes'))
        label(c, 'Final guardrail passes', 1239, 717, 41, teal);
      if (cue(k, 2, 'Four points')) label(c, 'Lower gain still fits.', 1239, 834, 37, mute);
    }
    if (b === 4) label(c, 'Do both rules still pass?', 1239, 703, 40, ink);
    if (b >= 5) {
      label(c, 'Early rule passes', 1239, 642, 41, teal);
      label(
        c,
        m.rules.finite ? 'Final guardrail passes' : 'Final guardrail fails',
        1239,
        723,
        41,
        m.rules.finite ? teal : rust,
      );
      label(c, 'Withhold combined support.', 1239, 834, 37, rust);
    }
  } else {
    label(c, 'Mean and 90% interval', 1237, 469, 39);
    label(c, 'Read both scales.', 1238, 604, 39, mute);
  }
}
