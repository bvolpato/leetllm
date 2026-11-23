import assert from 'node:assert/strict';
import { triangleFixture, unionRadius } from '../../../films/learning-theory/fixtures.mjs';
import { separatorForMask } from '../../../films/learning-theory/model.mjs';
import {
  choose,
  growthCeiling,
  noiseAssignment,
  noiseFit,
} from '../../../films/learning-theory/arithmetic.mjs';
import {
  P,
  axis,
  background,
  beat,
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
} from './drawing.mjs';

function signed(c, x, y, plus, r = 27) {
  dot(c, x, y + 3, r + 1, '#162c372a');
  dot(c, x, y, r, plus ? P.teal : P.red);
  line(c, x - r * 0.45, y, x + r * 0.45, y, P.cream, 4);
  if (plus) line(c, x, y - r * 0.45, x, y + r * 0.45, P.cream, 4);
}
const triangleLine = (mask) => separatorForMask(mask);
function triangle(c, cx, cy, mask, scale) {
  const { a, b, threshold } = triangleLine(mask);
  const d = a * a + b * b;
  const x = (a * threshold) / d,
    y = (b * threshold) / d;
  const span = 300 / Math.sqrt(d);
  c.save();
  c.translate(cx, cy);
  c.scale(scale, scale);
  c.beginPath();
  c.rect(-99, -87, 198, 170);
  c.clip();
  rect(c, -99, -87, 198, 170, '#fcf8ea');
  line(c, x + b * span, y - a * span, x - b * span, y + a * span, P.brass, 3.5);
  triangleFixture.forEach(([u, v], i) => signed(c, u, v, !!(mask & (1 << i)), 12.5));
  c.restore();
}
export function geometry(c, k) {
  background(c, 'paper');
  const b = beat(k);
  if (b <= 2) {
    heading(
      c,
      'Can a line realize every labeling?',
      'One fixed triangle    ·    one freely placed boundary per labeling',
      true,
    );
    const n = 1 + Math.floor(7 * cue(k, 1, 'eight ways', 4.1));
    for (let i = 0; i < n; i++)
      triangle(c, 334 + (i % 4) * 414, 378 + Math.floor(i / 4) * 285, i, 1.6);
    if (b === 2)
      label(
        c,
        '8 of 8 labelings  ·  this triangle is shattered',
        960,
        821,
        44,
        P.teal,
        'center',
        'Serif',
      );
  } else if (b <= 7) {
    heading(
      c,
      b <= 4
        ? 'Try the alternating square'
        : 'Does the obstruction survive a different arrangement?',
      b <= 4
        ? 'Find a line that separates the two signs.'
        : 'Four points in the plane    /    opposite labels on intersecting hulls',
      true,
    );
    const corners =
      b <= 4
        ? [
            [420, 346],
            [856, 346],
            [856, 783],
            [420, 783],
          ]
        : [
            [381, 774],
            [910, 774],
            [619, 308],
            [626, 591],
          ];
    const plus = b <= 4 ? [true, false, true, false] : [true, true, true, false];
    if (b <= 4) {
      const p = cue(k, 4, 'Join the two plus', 1.5),
        q = cue(k, 4, 'Now join', 1.5);
      line(c, 420, 346, lerp(420, 856, p), lerp(346, 783, p), P.teal, 9);
      line(c, 856, 346, lerp(856, 420, q), lerp(346, 783, q), P.red, 9);
      if (q === 1) pin(c, 638, 564.5, P.gold);
    } else {
      polygon(c, corners.slice(0, 3), '#c1d7ca');
      for (let j = 0; j < 3; j++) {
        const a = corners[j],
          z = corners[(j + 1) % 3];
        line(c, ...a, ...z, P.teal, 4);
      }
    }
    corners.forEach(([x, y], i) => signed(c, x, y, plus[i], 35));
    const lines =
      b === 3
        ? ['Both plus signs together.', 'Both minus signs together.', 'Where could a line go?']
        : b === 4
          ? ['The two segments cross.', 'A separator would put the', 'crossing on both sides.']
          : b === 5
            ? ['Three positive vertices', 'contain a negative point.', 'A halfspace is convex.']
            : [
                'Radon’s theorem',
                'Every four-point set has a split',
                'with intersecting convex hulls.',
              ];
    if (b !== 4 || cue(k, 4, 'The crossing point', 0.3))
      lines.forEach((v, i) =>
        label(
          c,
          v,
          1085,
          424 + i * 82,
          i ? 37 : 52,
          i ? P.ink : P.teal,
          'left',
          i ? 'Sans' : 'Serif',
        ),
      );
    if (b === 4 && end(k, 4)) label(c, '14 / 16 square labelings work', 1085, 757, 34, P.red);
    if (b >= 6 && cue(k, 6, 'so the VC dimension', 0.75))
      label(c, 'VC dimension = 3', 1085, 763, 58, P.ink, 'left', 'Serif');
  } else {
    heading(
      c,
      'The intercept changes the class',
      'Affine lines in the plane, lines through the origin, and right thresholds',
      true,
    );
    const centers = [370, 955, 1542];
    ['Movable line', 'Through the origin', 'Right threshold'].forEach((s, i) =>
      label(c, s, centers[i], 317, 42, P.ink, 'center', 'Serif'),
    );
    triangle(c, 370, 566, 3, 1.95);
    line(c, 741, 584, 1173, 584, P.seam, 3);
    line(c, 955, 393, 955, 739, P.seam, 3);
    line(c, 789, 702, 1121, 466, P.brass, 6);
    dot(c, 955, 584, 8, P.ink);
    signed(c, 835, 490, true);
    signed(c, 1039, 630, false);
    line(c, 1360, 625, 1735, 625, P.ink, 4);
    line(c, 1513, 460, 1513, 657, P.brass, 7);
    signed(c, 1434, 568, false);
    signed(c, 1642, 568, true);
    [3, 2, 1].forEach((d, i) =>
      label(c, 'VC dimension ' + d, centers[i], 799, 42, P.teal, 'center'),
    );
  }
}
const best = 0.25,
  eps = 0.04,
  tied = best + eps,
  other = tied + eps;
export function excess(c, k) {
  background(c, 'paper');
  const b = beat(k);
  heading(
    c,
    'How far apart can two tied routers be?',
    'Uniform estimation radius   ±4 percentage points',
    true,
  );
  const x = axis(
    c,
    405,
    1710,
    775,
    0.23,
    0.35,
    [0.23, 0.25, 0.27, 0.29, 0.31, 0.33, 0.35],
    (v) => percent(v),
    true,
  );
  const first = cue(k, 2, 'sample makes', 1.8),
    second = cue(k, 3, 'Follow its risk', 1.8);
  const xx = x(lerp(best, tied, first)),
    yy = x(lerp(tied, other, second));
  label(c, 'Best in pool', 110, 410, 38, P.ink);
  line(c, x(best), 410, xx, 410, P.teal, 12);
  pin(c, x(best), 410, P.blue);
  label(c, '25% population', x(best), 339, 39, P.teal, 'center');
  if (first) {
    pin(c, xx, 410, P.gold);
    if (first === 1) {
      label(c, '29% sample', x(tied), 348, 39, P.brass, 'center');
    }
  }
  if (cue(k, 2, 'two routers tie', 0.3)) {
    label(c, 'Chosen at tie', 110, 630, 38, P.ink);
    line(c, x(tied), 437, x(tied), 614, P.brass, 3);
    pin(c, x(tied), 630, P.gold);
    if (second) {
      line(c, x(tied), 630, yy, 630, P.teal, 12);
      pin(c, yy, 630, P.blue);
      if (second === 1) label(c, '33% population', x(other), 562, 39, P.teal, 'center');
    }
  }
  const result =
    b === 4
      ? 'Excess ≤ 2 × 4 points.    Absolute risk ≤ 25% + 8 points.'
      : b === 5
        ? 'Within η of the sample minimum:   excess ≤ 2ε + η'
        : b === 6
          ? 'Agnostic comparison:   best attainable risk + excess allowance'
          : '';
  if (result) label(c, result, 960, 713, 39, P.ink, 'center', 'Serif');
}
const observed = [0.16, 0.55, 0.86],
  ghost = [0.29, 0.43, 0.71];
function rail(c, y, pointsList, color, tag) {
  line(c, 402, y, 1690, y, P.seam, 3);
  label(c, tag, 105, y, 32, P.ink);
  pointsList.forEach((t) => dot(c, lerp(402, 1690, t), y, 15, color));
}
export function growth(c, k) {
  background(c, 'paper');
  const b = beat(k);
  if (b <= 4) {
    const n =
      b < 3
        ? 4
        : b === 4
          ? 8
          : cue(k, 3, 'Fifty give', 0.1)
            ? 50
            : cue(k, 3, 'Ten inputs', 0.1)
              ? 10
              : 4;
    const d = b === 4 ? 2 : 3;
    heading(
      c,
      'Count the label patterns a class can make',
      'Growth function    /    maximum over placements of the inputs',
      true,
    );
    if (b === 1) {
      const dup = cue(k, 1, 'repeated identical', 1.2);
      for (let i = 0; i < 3; i++) {
        const x = i === 2 ? lerp(820, 570, dup) : 320 + 250 * i;
        const y = i === 2 ? 495 - 105 * dup : 495;
        if (i === 2 && dup === 1) line(c, x, y + 44, x, y + 60, P.brass, 5);
        signed(c, x, y, i === 0 || i === 2, 43);
      }
      label(
        c,
        dup === 1 ? 'Two proposed labels at one input' : 'Distinct inputs',
        574,
        645,
        40,
        P.ink,
        'center',
      );
      label(
        c,
        dup === 1 ? 'A deterministic rule gives' : 'Up to the VC dimension,',
        1070,
        459,
        44,
        P.teal,
        'left',
        'Serif',
      );
      label(
        c,
        dup === 1 ? 'one prediction at this location.' : 'some placement admits all 2ⁿ labelings.',
        1070,
        545,
        38,
        P.ink,
      );
      return;
    }
    label(c, 'n = ' + n + ' inputs', 120, 320, 51, P.teal, 'left', 'Serif');
    label(c, 'VC dimension ' + d, 1730, 320, 39, P.ink, 'right');
    Array.from({ length: d + 1 }, (_, i) => {
      const x = 305 + i * 418;
      label(c, 'Choose ' + i, x, 463, 38, P.ink, 'center');
      label(
        c,
        Math.round(choose(n, i)).toLocaleString('en-US'),
        x,
        574,
        78,
        P.teal,
        'center',
        'Mono',
      );
      if (i < d) label(c, '+', x + 215, 563, 54, P.brass, 'center');
    });
    label(
      c,
      'At most ' + growthCeiling(n, d).toLocaleString('en-US') + ' patterns',
      120,
      765,
      63,
      P.ink,
      'left',
      'Serif',
    );
    label(c, 'All assignments:  2^' + n, 1738, 763, 42, P.ink, 'right');
    if (n === 4)
      label(c, 'For four points, planar halfspaces attain at most 14.', 120, 815, 38, P.teal);
  } else {
    heading(
      c,
      'What can two thresholds hide between observations?',
      'Right thresholds   /   minus to the left, plus to the right',
      true,
    );
    rail(c, 452, observed, P.teal, 'Observed');
    const newPoint = cue(k, 5, 'new point', 0.75);
    const toX = (t) => lerp(402, 1690, t);
    for (const t of [0.33, 0.51]) line(c, toX(t), 353, toX(t), 523, P.brass, 6);
    label(c, 'cut A', toX(0.33), 310, 34, P.brass, 'center');
    label(c, 'cut B', toX(0.51), 310, 34, P.brass, 'center');
    if (b === 5 && newPoint) {
      dot(c, toX(0.43), 452, 13, P.red);
      label(c, 'New input: A says +, B says −', 960, 661, 48, P.red, 'center', 'Serif');
    }
    if (b >= 6) {
      const added = Math.floor(3 * cue(k, 6, 'Add three independent', 1.5));
      rail(c, 598, ghost.slice(0, added), P.red, 'Ghost draw');
      const combined = [...observed, ...ghost].sort((a, b) => a - b);
      if (cue(k, 6, 'both batches at once', 0.3)) {
        rail(c, 714, observed, P.teal, 'Combined');
        ghost.slice(0, added).forEach((t) => dot(c, toX(t), 714, 15, P.red));
      }
      if (cue(k, 6, 'seven possible cuts', 0.6)) {
        [0, ...combined].forEach((v, i) => {
          const x = toX((v + (combined[i] ?? 1)) / 2);
          line(c, x, 747, x, 769, P.brass, 5);
        });
        label(c, '7 gaps', 1732, 714, 30, P.brass);
      }
    }
    if (b === 8)
      label(
        c,
        'For n ≥ d ≥ 1:   gap = O( √[(d ln(en/d) + ln(1/δ)) / n] )',
        960,
        812,
        41,
        P.ink,
        'center',
      );
    if (b === 9)
      label(
        c,
        'Agnostic: order 1/ε²     ·     Realizable, consistent: order 1/ε     (up to logs)',
        960,
        812,
        38,
        P.ink,
        'center',
      );
  }
}

const baseMask = 0b11110000,
  flippedMask = baseMask ^ (1 << 6);
const fits = Array.from({ length: 256 }, (_, mask) => noiseFit(mask));
const averages = [
  0,
  sum(fits.map((v) => v.constant)) / 256,
  sum(fits.map((v) => v.threshold)) / 256,
  1,
];
const scores = [0, 0.25, 0.5, 0.75, 1];
const ordered = [
  flippedMask,
  ...Array.from({ length: 256 }, (_, i) => i).filter((v) => v !== flippedMask),
];
function comparison(mask, gap) {
  const signs = noiseAssignment(mask);
  const predicted = signs.map((_, i) => (i < gap ? -1 : 1));
  const misses = signs.map((s, i) => s !== predicted[i]);
  return { signs, predicted, misses, score: (8 - 2 * sum(misses)) / 8 };
}
function coin(c, x, y, sign, r) {
  dot(c, x + 1, y + 7, r, '#181722');
  dot(c, x, y, r, '#aa864c');
  dot(c, x, y - 2, r - 4, '#ead4a0');
  dot(c, x, y - 2, r - 10, '#c9a86a');
  dot(c, x, y - 2, r - 14, '#eedbb1');
  label(c, sign === 1 ? '+' : '−', x, y - 2, r * 1.34, P.ink, 'center', 'Mono', 700);
}
function gapState(k) {
  const b = beat(k),
    flip = cue(k, 3, 'Flip only the seventh', 0.7) === 1;
  const mask = flip ? flippedMask : baseMask,
    bestGap = fits[mask].split;
  let pos = bestGap;
  if (b === 4) {
    const reset = cue(k, 4, 'Slide the cut', 1.4),
      sweep = cue(k, 4, 'Now sweep it', 7.2),
      last = cue(k, 4, 'Move to the last gap', 1);
    pos = bestGap * (1 - reset) + 7 * sweep + last;
  } else if (b === 5) {
    pos = lerp(8, bestGap, cue(k, 5, 'back between four and five', 1.5));
  }
  const gap = Math.ceil(pos - 0.5);
  return {
    pos,
    gap,
    shown: b > 2 || cue(k, 2, 'Put the cut', 0.8) === 1,
    ...comparison(mask, gap),
  };
}
export function noise(c, k) {
  background(c, 'plum');
  const b = beat(k);
  if (b <= 5) {
    heading(c, 'Can one cut follow the coins?', 'Eight tickets in increasing order of urgency');
    const s = gapState(k),
      cx = (i) => 422 + 170 * i;
    label(c, 'Coin', 106, 440, 37, P.dim);
    label(c, 'Rule', 106, 682, 37, P.dim);
    plate(c, 266, 321, 1526, 245, P.violet);
    for (let i = 0; i < 8; i++) {
      label(c, i + 1, cx(i), 365, 25, P.dim, 'center', 'Mono');
      coin(c, cx(i), 458, s.signs[i], 58);
    }
    if (s.shown) {
      const xx = cx(s.pos - 0.5);
      line(c, 270, 599, 1790, 599, P.seam, 11);
      rect(c, xx - 23, 581, 46, 36, P.gold, 6);
      polygon(
        c,
        [
          [xx, 552],
          [xx - 13, 577],
          [xx + 13, 577],
        ],
        P.gold,
      );
      line(c, xx, 617, xx, 750, P.gold, 5);
      s.predicted.forEach((v, i) => {
        label(c, v > 0 ? '+' : '−', cx(i), 681, 72, P.paper, 'center', 'Mono');
        if (s.misses[i]) mark(c, cx(i), 757, true, 21);
      });
      const m = sum(s.misses);
      if (b === 4 || b === 5 || end(k, 2))
        label(
          c,
          8 -
            m +
            (m === 7 ? ' match' : ' matches') +
            '   ·   ' +
            m +
            (m === 1 ? ' mismatch' : ' mismatches'),
          960,
          817,
          47,
          P.cream,
          'center',
          'Serif',
        );
      if (
        (b === 2 && cue(k, 2, "We've fitted", 0.1)) ||
        (b === 5 && cue(k, 5, 'A lookup table', 0.1))
      )
        label(
          c,
          '(' + (8 - m) + ' − ' + m + ') / 8 = ' + s.score,
          960,
          218,
          39,
          P.gold,
          'center',
          'Mono',
        );
    } else
      label(
        c,
        '−  before the cut          +  after the cut',
        960,
        701,
        49,
        P.gold,
        'center',
        'Serif',
      );
  } else if (b <= 7) {
    heading(
      c,
      'File one best score for each coin row',
      'Nine cuts per row    /    256 equally likely rows',
    );
    const n = 1 + Math.floor(255 * cue(k, 6, 'For every other row', 5.2));
    const revealPerfect = cue(k, 7, 'There is one for each gap', 0.4) === 1;
    const hist = scores.map(
      (score) => ordered.slice(0, n).filter((i) => fits[i].threshold === score).length,
    );
    const mask =
      b === 7 && revealPerfect
        ? 255 ^ (2 ** Math.round(8 * cue(k, 7, 'from all plus', 3.2)) - 1)
        : ordered[n - 1];
    const fit = fits[mask],
      row = comparison(mask, fit.split);
    row.signs.forEach((v, i) => {
      coin(c, 649 + 93 * i, 314, v, 34);
      if (row.misses[i]) mark(c, 649 + 93 * i, 377, true, 13);
    });
    const cut = 649 + 93 * (fit.split - 0.5);
    polygon(
      c,
      [
        [cut, 338],
        [cut - 11, 361],
        [cut + 11, 361],
      ],
      P.gold,
    );
    label(c, 'Best ' + row.score.toFixed(2), 1505, 314, 34, P.gold, 'left', 'Mono');
    label(c, 'Coin row', 285, 316, 36, P.dim);
    line(c, 270, 754, 1690, 754, P.dim, 3);
    scores.forEach((v, i) => {
      const x = 405 + i * 282,
        visible = i < 4 || revealPerfect;
      if (visible) {
        const h = hist[i] * 3;
        rect(c, x - 68, 754 - h, 136, h, i === 4 ? P.gold : P.blue, 3);
        label(c, hist[i], x, 717 - h, 37, P.cream, 'center', 'Mono');
      } else label(c, '?', x, 707, 50, P.gold, 'center', 'Serif');
      label(c, v.toFixed(2), x, 791, 32, P.dim, 'center', 'Mono');
    });
    label(c, 'Best correlation', 960, 827, 38, P.cream, 'center', 'Serif');
  } else if (b === 8) {
    heading(
      c,
      'How much noise can each rule fit?',
      'Average the best correlation over all 256 assignments.',
    );
    ['Always plus', 'Pick a constant', 'One right threshold', 'Lookup table'].forEach((name, i) => {
      const t = cue(
          k,
          8,
          ['An always plus', 'Choosing between', 'A right threshold', 'A lookup table'][i],
          1,
        ),
        y = 336 + i * 142;
      label(c, name, 135, y, 40, P.cream);
      line(c, 752, y, 1630, y, P.violet, 12);
      if (t) {
        line(c, 752, y, 752 + 878 * averages[i] * t, y, P.blue, 14);
        pin(c, 752 + 878 * averages[i] * t, y, P.gold);
        if (t === 1) label(c, averages[i].toFixed(3), 1762, y, 39, P.gold, 'right', 'Mono');
      }
    });
  } else {
    const loss = averages[2] / 2,
      confidence = 3 * unionRadius(1, 8);
    heading(c, 'From predictions to bounded losses', 'Binary labels and predictions in {−1, +1}');
    label(c, 'Loss = (1 − label × prediction) / 2', 960, 348, 58, P.paper, 'center', 'Serif');
    label(c, 'Same sign    →    0', 530, 481, 43, P.blue, 'center');
    label(c, 'Opposite sign    →    1', 1380, 481, 43, P.pink, 'center');
    if (b >= 10) {
      label(
        c,
        'Loss complexity   ' + averages[2].toFixed(3) + ' / 2  ≈  ' + loss.toFixed(3),
        960,
        645,
        48,
        P.gold,
        'center',
      );
      label(
        c,
        'Risk ≤ sample loss + 2 × loss complexity + 3 × Hoeffding radius',
        960,
        764,
        37,
        P.dim,
        'center',
      );
      if (cue(k, 10, 'confidence term alone', 1))
        label(
          c,
          'Confidence term ≈ ' + confidence.toFixed(2) + '   ·   loss is already bounded by 1',
          960,
          817,
          39,
          P.pink,
          'center',
        );
    }
  }
}
export function checkCapacity() {
  for (let mask = 0; mask < 8; mask++) {
    const { a, b, threshold } = triangleLine(mask);
    triangleFixture.forEach(([x, y], i) =>
      assert.equal(a * x + b * y >= threshold, !!(mask & (1 << i))),
    );
  }
  assert.equal(percent(other), '33%');
  assert.equal(percent(other - best), '8%');
  assert.deepEqual(
    [
      [4, 3],
      [10, 3],
      [50, 3],
      [8, 2],
    ].map(([n, d]) => growthCeiling(n, d)),
    [15, 176, 20876, 37],
  );
  assert.equal(new Set([...observed, ...ghost]).size + 1, 7);
  for (let mask = 0; mask < 256; mask++) {
    const row = Array.from({ length: 9 }, (_, i) => comparison(mask, i));
    assert.equal(Math.max(...row.map((v) => v.score)), fits[mask].threshold);
    assert.equal(row[fits[mask].split].score, fits[mask].threshold);
  }
  assert.equal(comparison(baseMask, 4).score, 1);
  assert.deepEqual(
    comparison(flippedMask, 7).misses.flatMap((v, i) => (v ? [i + 1] : [])),
    [5, 6],
  );
  assert.deepEqual(
    comparison(flippedMask, 4).misses.flatMap((v, i) => (v ? [i + 1] : [])),
    [7],
  );
  assert.deepEqual(
    scores.map((s) => fits.filter((v) => v.threshold === s).length),
    [14, 84, 100, 49, 9],
  );
  assert.deepEqual(averages, [0, 0.2734375, 0.4560546875, 1]);
}
