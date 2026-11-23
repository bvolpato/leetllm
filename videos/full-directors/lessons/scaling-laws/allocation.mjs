import { drawSquareSample, openingCloth, drawCloth } from './cloth.mjs';
import { loss, allocationOptimum } from '../../../films/scaling-laws/arithmetic.mjs';
import {
  title,
  label,
  reading,
  line,
  rect,
  dot,
  cloth,
  cord,
  chart,
  cue,
  mix,
  fixed,
  ink,
  dim,
  warp,
  weft,
  teal,
  gold,
  grid,
  paper,
} from './studio.mjs';

export function penalties(n, d, a = 2, b = 2) {
  return { n, d, p: a / Math.sqrt(n), q: b / Math.sqrt(d), l: loss(n, d, a, b) };
}
export const growthExample = { alpha: 0.2, beta: 0.4, compute: 27 };
export function growthExponents(alpha, beta) {
  return { weights: beta / (alpha + beta), tokens: alpha / (alpha + beta) };
}
export function twoTerms(c, k) {
  const fraction = cue(k, 3, 'Move some budget', 1.8),
    n = mix(5, 10, fraction),
    d = 100 / n;
  title(
    c,
    'What contributes to next-token loss?',
    'Compare predictions on the same held-out text with the same tokenizer.',
  );
  if (k.beat.beatIndex === 0) {
    label(c, 'The shuttle crossed the', 150, 430, 81, ink, 'left', 'Serif');
    label(c, 'loom', 1058, 430, 81, weft, 'left', 'Serif');
    label(c, 'Probability assigned to the observed token', 155, 557, 38, dim);
    [
      [0.25, '1.386'],
      [0.5, '0.693'],
    ].forEach(([v, s], i) => {
      const y = 625 + 123 * i;
      cord(c, 155, y, 1080 * v, warp, 39);
      label(c, v.toFixed(2), 770, y + 37, 45);
      label(c, '−ln p  =  ' + s + ' nats', 1050, y + 37, 46);
    });
    label(c, 'Average this surprise over all the observed tokens.', 156, 929, 36, teal);
    return;
  }
  label(c, 'L = 1 + 2 / √N + 2 / √D', 150, 298, 61, ink, 'left', 'Serif');
  [
    [n, 'Parameter units N', 'Parameter penalty', warp],
    [d, 'Token units D', 'Data penalty', weft],
  ].forEach(([value, xlabel, ylabel, col], j) => {
    const p = chart(c, {
      x: 192 + j * 890,
      w: 664,
      y: 420,
      h: 312,
      xlim: [2, 22],
      ylim: [0, 1.6],
      xt: [5, 10, 20],
      yt: [0, 0.5, 1, 1.5],
      xlabel,
      ylabel,
    });
    p.curve((a) => 2 / Math.sqrt(a), 2, 22, col);
    p.point(value, 2 / Math.sqrt(value), col, 14);
    label(
      c,
      fixed(value) + ' units   →   ' + (2 / Math.sqrt(value)).toFixed(3) + ' nats',
      193 + j * 890,
      920,
      40,
      col,
    );
  });
}
export function comparison(c, k) {
  const replay = k.beat.chapterId === 'c08',
    i = k.beat.beatIndex + 1;
  const b = replay && cue(k, 3, 'Change its coefficient') ? 4 : 2;
  const movement = replay ? 1 : cue(k, 2, 'Widen the rectangle', 1.5);
  const square = replay || movement > 0;
  const verdict = replay && (b === 2 || cue(k, 4, 'The tall plan wins'));
  const width = mix(5, 10, movement);
  const plans = [penalties(5, 20, 2, b), penalties(width, 100 / width, 2, b)];
  const turned = replay && i === 2 && cue(k, 2, 'Turn a copy');
  if (turned) plans.push(penalties(20, 5));
  title(
    c,
    'Equal work, different allocations',
    'Predicted loss  =  floor of 1  +  parameter penalty  +  data penalty',
  );
  const start = 585,
    scale = 588;
  [1, 1.5, 2, 2.5, 3].forEach((v) => {
    const x = start + (v - 1) * scale;
    line(c, x, 310, x, 852, grid, 2);
    label(c, v, x, 289, 33, dim, 'center');
  });
  for (const [j, row] of plans.entries()) {
    const y = turned ? 381 + j * 201 : 445 + j * 283;
    const unit = turned ? 7 : 10;
    if (j && !square) continue;
    if (j === 0)
      drawCloth(c, openingCloth(), {
        x: 154,
        y: y - (row.d * unit) / 2,
        width: row.n * unit,
        height: row.d * unit,
      });
    else if (j === 1 && movement === 1)
      drawSquareSample(c, { x: 154, y: y - (row.d * unit) / 2, width: 10 * unit });
    else cloth(c, 154, y - (row.d * unit) / 2, row.n, row.d, unit);
    label(c, fixed(row.n, 1) + ' × ' + fixed(row.d, 1), 305, y + 15, 39);
    const joint = start + scale * row.p,
      end = joint + scale * row.q;
    cord(c, start, y - 23, scale * row.p, warp, 46);
    cord(c, joint, y - 23, scale * row.q, weft, 46);
    label(c, row.p.toFixed(3), start + (scale * row.p) / 2, y + 77, 36, warp, 'center');
    label(c, row.q.toFixed(3), joint + (scale * row.q) / 2, y + 77, 36, weft, 'center');
    if (verdict) label(c, row.l.toFixed(3), end + 16, y + 12, 43, ink);
  }
  label(c, '2 / √N  ·  weights', 475, 935, 39, warp);
  label(c, b + ' / √D  ·  tokens', 977, 935, 39, weft);
}
export function exchange(c, k) {
  const i = k.beat.beatIndex + 1;
  if (i <= 4) {
    const t = cue(k, 1, 'widen it by one percent', 1.5);
    const base = penalties(10, 10),
      n = mix(10, 10.1, t),
      r = penalties(n, 100 / n);
    title(c, 'A small exchange at fixed area', 'N × D = 100   •   L = 1 + 2 / √N + 2 / √D');
    const p = chart(c, {
      x: 170,
      y: 336,
      w: 777,
      h: 459,
      xlim: [9.7, 10.34],
      ylim: [9.67, 10.32],
      xt: [9.8, 10, 10.2],
      yt: [9.8, 10, 10.2],
      xlabel: 'Parameter units N',
      ylabel: 'Token units D  ·  enlarged corner',
    });
    for (const level of [2.26, base.l, 2.27]) {
      p.curve((v) => (2 / (level - 1 - 2 / Math.sqrt(v))) ** 2, 9.7, 10.34, grid, 7);
    }
    p.curve((v) => 100 / v, 9.7, 10.34, teal);
    p.point(10, 10, ink, 9);
    p.point(n, 100 / n, weft, 13);
    line(c, 175, 960, 225, 960, teal, 5);
    label(c, 'Fixed work', 238, 970, 32, teal);
    label(c, 'Pale curves carry equal loss.', 444, 970, 32, dim);
    const side = 139;
    drawSquareSample(c, {
      x: 1034,
      y: 767,
      width: (side * n) / 10,
      height: (side * (100 / n)) / 10,
    });
    label(c, 'Baseline', 1297, 305, 31, dim, 'center');
    label(c, 'Current', 1620, 305, 31, dim, 'center');
    [
      ['Width', base.n, r.n, 2],
      ['Height', base.d, r.d, 4],
      ['2 / √N', base.p, r.p, 6],
      ['2 / √D', base.q, r.q, 6],
    ].forEach(([name, a, z, dec], j) => {
      const y = 405 + j * 98,
        col = j === 2 ? warp : j === 3 ? weft : ink;
      label(c, name, 1005, y, 36, col);
      label(c, a.toFixed(dec), 1297, y, 37, col, 'center', 'Mono');
      label(c, z.toFixed(dec), 1620, y, 37, col, 'center', 'Mono');
    });
    if (i >= 3) label(c, 'At the minimum   αP = βQ', 1215, 815, 35);
    if (i >= 3) label(c, 'P = A / N^α    Q = B / D^β', 1215, 760, 32, dim);
    if (i === 4) label(c, 'At 10 × 10   αP = βQ ≈ 0.3162', 1215, 857, 32, dim);
    if (cue(k, 4, 'sixteen millionths'))
      label(c, 'Finite step   ΔL ≈ +0.000016', 1215, 898, 36, teal);
    return;
  }
  if (i <= 6) {
    title(
      c,
      'Which side grows faster?',
      'Positive two-penalty fit  •  fixed counting convention C ≈ 6ND',
    );
    const practice = cue(k, 6, 'Now take a fit');
    const { alpha, beta } = practice ? growthExample : { alpha: 0.34, beta: 0.28 };
    const powers = growthExponents(alpha, beta);
    const rows = [
      ['Parameters', 'β / (α + β)', powers.weights, warp],
      ['Tokens', 'α / (α + β)', powers.tokens, weft],
    ];
    rows.forEach(([name, formula, v, col], j) => {
      const y = 350 + j * 221;
      label(c, name, 150, y + 51, 52);
      label(c, formula, 585, y + 51, 54, col, 'left', 'Serif');
      if (cue(k, 6, 'point three four')) {
        cord(c, 1000, y, 900 * v, col, 55);
        label(c, v.toFixed(3), 1658, y + 48, 43, col);
      }
    });
    label(c, 'Compute exponents sum to one.', 150, 867, 47);
    if (cue(k, 6, 'point three four'))
      label(c, 'α = ' + alpha + '    β = ' + beta, 1000, 867, 43, dim);
    if (practice && cue(k, 6, 'twenty-seven times the compute')) {
      const budget = growthExample.compute;
      const result = cue(k, 6, 'nine times as many weights')
        ? '   →   ' + fixed(budget ** powers.weights) + '× weights and ' +
          fixed(budget ** powers.tokens) + '× tokens'
        : '';
      label(c, budget + '× compute' + result, 150, 970, 41, teal);
    }
    return;
  }
  if (i <= 8) {
    const b = cue(k, 7, 'Raise the data coefficient') ? 8 : 2,
      ratio = (b / 2) ** 2,
      solved = b === 2 || cue(k, 8, 'Two hundred fifty');
    const a = allocationOptimum(1e6, 2, b, 0.5, 0.5);
    title(
      c,
      'One million units of work',
      'Equal exponents   α = β = ½    •    L = 1 + 2 / √N + B / √D',
    );
    const plotSample = (x, n, d, col) => {
      const u = 0.139;
      cloth(c, x, 845 - d * u, n / 50, d / 50, u * 50);
      label(c, fixed(n) + ' × ' + fixed(d), x, 910, 42, col);
    };
    plotSample(195, 1000, 1000, warp);
    label(c, 'B = 2', 195, 632, 37, warp);
    if (solved && b !== 2) {
      plotSample(658, a.n, a.d, weft);
      label(c, 'B = 8', 658, 250, 37, weft);
    }
    reading(c, 'Data coefficient B', String(b), 1040, 340, weft);
    if (b === 2 || cue(k, 7, 'That’s sixteen'))
      reading(c, 'Balanced ratio D / N', '(' + b + ' / 2)² = ' + ratio, 1040, 560, ink);
    return;
  }
  title(
    c,
    'Start with twenty tokens per weight',
    'A planning assumption for a dense model  •  D = 20N',
  );
  label(c, '6ND', 190, 465, 110, warp, 'left', 'Serif');
  label(c, '≈', 533, 458, 84, dim);
  label(c, '120 N²', 715, 465, 110, weft, 'left', 'Serif');
  if (i === 10) {
    const n = Math.sqrt(1e24 / 120);
    reading(c, 'Training FLOPs', '10²⁴', 190, 630);
    if (cue(k, 10, 'ninety-one billion'))
      reading(c, 'Parameters', fixed(n / 1e9, 1) + 'B', 695, 630, warp);
    if (cue(k, 10, 'one point eight three'))
      reading(c, 'Training tokens', fixed((n * 20) / 1e12) + 'T', 1260, 630, weft);
  }
}
export function growth(c, k) {
  const side = mix(10, 20, cue(k, 1, 'Double both sides', 1.3));
  title(
    c,
    'Four times the work',
    'For this symmetrical fit, each fixed-budget minimum is a square.',
  );
  cloth(c, 170, 810 - side * 23, side, side, 23);
  label(c, fixed(side) + ' × ' + fixed(side) + '  =  ' + fixed(side * side), 170, 900, 51);
  const p = chart(c, {
    x: 900,
    y: 350,
    w: 818,
    h: 447,
    xlim: [3, 40],
    ylim: [1.68, 2.74],
    xt: [10, 20, 30, 40],
    yt: [1.8, 2, 2.2, 2.4, 2.6],
    xlabel: 'Parameter units N',
    ylabel: 'Predicted loss at fixed work',
  });
  p.curve((v) => loss(v, 100 / v), 3, 40, dim, 4);
  p.point(10, loss(10, 10), gold);
  p.curve((v) => loss(v, (side * side) / v), 3, 40, warp);
  p.point(side, loss(side, side), gold, 14);
  if (k.beat.beatIndex === 2) {
    label(c, 'Each penalty falls from 0.632 to 0.447. The floor stays at 1.', 166, 996, 32, dim);
  }
  label(c, 'Minimum  ' + loss(side, side).toFixed(3) + ' nats', 901, 958, 39, teal);
}

const finalBudget = 900;
const finalDataCap = 40;
const finalMemoryCap = 20;
const finalFit = allocationOptimum(finalBudget, 3, 6, 0.5, 0.5);
const memoryTrimSeconds = 0.9;

function afterClause(k, beat, phrase, { breakCaption = false } = {}) {
  const i = k.beat.beatIndex + 1;
  if (i !== beat) return i > beat;
  if (breakCaption) k.reveal(phrase, 0, { captionStart: phrase });
  return k.elapsed + 1e-9 >= k.wordCue(phrase).end;
}

export function finalState(k) {
  const constrained = afterClause(k, 3, 'forty token units');
  const adjust = cue(k, 4, 'widen the cloth', 3.7);
  const memory = afterClause(k, 6, 'twenty parameter units');
  const answered = afterClause(k, 7, 'Eight hundred units', { breakCaption: true });
  const trim =
    answered && k.beat.beatIndex === 6
      ? Math.min(1, (k.elapsed - k.wordCue('Eight hundred units').end + 1e-9) / memoryTrimSeconds)
      : Number(answered);
  const widthAtDataCap = finalBudget / finalDataCap;
  const n =
    trim > 0 ? mix(widthAtDataCap, finalMemoryCap, trim) : mix(finalFit.n, widthAtDataCap, adjust);
  const d = trim > 0 ? finalDataCap : finalBudget / n;
  const neededRows = finalBudget / finalMemoryCap;
  return {
    constrained,
    adjust,
    memory,
    trim,
    n,
    d,
    work: n * d,
    excess: Math.max(0, d - finalDataCap),
    neededRows,
    missingRows: neededRows - finalDataCap,
  };
}
export function fresh(c, k) {
  const i = k.beat.beatIndex + 1,
    s = finalState(k);
  const fitPenalty = penalties(finalFit.n, finalBudget / finalFit.n, 3, 6).p.toFixed(3);
  title(
    c,
    'Cut a plan from ' + finalBudget + ' units',
    'L = 1 + 3 / √N + 6 / √D   •   One pass through the available data',
  );
  if (i < 3) {
    [finalFit.n / 2, finalFit.n, finalFit.n * 2].forEach((n, j) => {
      const d = finalBudget / n;
      const x = 175 + j * 580;
      cloth(c, x, 790 - d * 4, n, d, 11, 4);
      label(c, ['A', 'B', 'C'][j] + '   ' + fixed(n) + ' × ' + fixed(d), x, 862, 48);
      if (j === 1 && afterClause(k, 2, 'Plan B fits', { breakCaption: true })) {
        const value = afterClause(k, 2, 'point seven seven five') ? ' ≈ ' + fitPenalty : '';
        label(c, `3 / √${fixed(n)} = 6 / √${fixed(d)}${value}`, x, 937, 35, teal);
      }
    });
    if (i === 1) label(c, 'Which two penalties match?', 979, 360, 43, ink, 'center', 'Serif');
    return;
  }
  const x = 303,
    y = 286,
    sx = 28,
    sy = 8.4;
  const X = (n) => x + n * sx;
  const Y = (d) => y + d * sy;
  const edge = Y(finalDataCap);
  const memoryEdge = X(finalMemoryCap);
  const plotRight = X(31);
  const showRequired = afterClause(k, 7, 'forty-five token units', { breakCaption: true });
  const showMissing = afterClause(k, 7, 'five more usable units of data');
  if (s.constrained) {
    const usableRight = s.memory ? memoryEdge : plotRight;
    rect(c, x, y, usableRight - x, edge - y, '#d7e6da');
  }
  cloth(c, x, y, s.n, s.d, sx, sy);
  if (s.constrained) {
    if (s.excess > 0) rect(c, x, edge, s.n * sx, s.excess * sy, '#77291542');
    if (s.memory && X(s.n) > memoryEdge) {
      rect(c, memoryEdge, y, X(s.n) - memoryEdge, edge - y, '#77291562');
    }
    if (showRequired) {
      const requiredEdge = Y(s.neededRows);
      rect(c, x, edge, memoryEdge - x, requiredEdge - edge, '#f0d5c5');
      for (let row = finalDataCap + 1; row < s.neededRows; row++) {
        line(c, x, Y(row), memoryEdge, Y(row), '#b9442c50', 2);
      }
      c.save();
      c.setLineDash([9, 7]);
      line(c, x, requiredEdge, memoryEdge, requiredEdge, weft, 4);
      c.restore();
      label(c, fixed(s.neededRows) + ' rows needed', x - 23, requiredEdge + 13, 35, weft, 'right');
    }

    c.save();
    c.setLineDash([8, 7]);
    c.beginPath();
    for (let j = 0; j <= 100; j++) {
      const n = mix(finalFit.n, 31, j / 100);
      const d = finalBudget / n;
      if (j) c.lineTo(X(n), Y(d));
      else c.moveTo(X(n), Y(d));
    }
    c.strokeStyle = ink;
    c.lineWidth = 4;
    c.stroke();
    c.restore();
    label(c, `ND = ${finalBudget}`, plotRight, Y(finalBudget / 31) - 22, 32, ink, 'right');

    line(c, x - 12, edge, plotRight, edge, teal, 5);
    label(c, finalDataCap + ' token units', x - 23, edge + 11, 35, teal, 'right');
    if (s.memory) {
      line(c, memoryEdge, y - 12, memoryEdge, Y(finalBudget / finalFit.n), warp, 5);
      label(c, `Memory limit · N = ${finalMemoryCap}`, memoryEdge, y - 31, 34, warp, 'center');
    }
    if (showRequired) dot(c, memoryEdge, Y(s.neededRows), 10, weft);
    if (s.trim === 1) dot(c, memoryEdge, edge, 10, teal);
    if (s.trim === 0) dot(c, X(s.n), Y(s.d), 10, ink);
    if (!s.adjust && afterClause(k, 4, 'twenty more token units than we have')) {
      line(c, x - 12, edge + 6, x - 12, Y(s.d), weft, 3);
      label(c, fixed(s.excess) + ' extra rows', x - 23, (edge + Y(s.d)) / 2 + 12, 32, weft, 'right');
    }
  }

  const side = 1300;
  const widthAnswer = afterClause(k, 4, 'twenty-two and a half parameter units', { breakCaption: true });
  if ((s.trim === 0 && (!s.adjust || widthAnswer)) || s.trim === 1) {
    reading(
      c,
      s.trim === 0 ? 'Full-budget plan' : 'Largest plan that fits',
      fixed(s.n) + ' × ' + fixed(s.d),
      side,
      326,
    );
  }
  if (s.trim === 0 || s.trim === 1) {
    reading(c, 'Work in the cloth', fixed(s.work) + ' / ' + finalBudget, side, 502, teal);
  }
  if (i === 3 && !afterClause(k, 3, 'two point five four nine')) {
    reading(c, 'Each penalty', '≈ ' + fitPenalty, side, 678, warp);
  }
  if (
    (i <= 4 && !s.adjust && afterClause(k, 3, 'two point five four nine')) ||
    (i >= 5 && !s.memory && afterClause(k, 5, 'two point five eight one'))
  ) {
    reading(c, 'Fitted loss', loss(s.n, s.d, 3, 6).toFixed(3), side, 678, warp);
  }
  if (s.trim === 1) label(c, fixed(finalBudget - s.work) + ' units unspent', side, 745, 43, weft);
  if (showMissing) {
    label(
      c,
      `${fixed(s.neededRows)} − ${finalDataCap} = ${fixed(s.missingRows)} more rows`,
      side,
      813,
      39,
      weft,
    );
  }
}
