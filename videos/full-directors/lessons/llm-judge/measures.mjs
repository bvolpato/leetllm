import {
  C,
  box,
  line,
  dot,
  txt,
  cap,
  wrap,
  sheet,
  rule,
  heading,
  cue,
  beat,
  smooth,
  label,
  checkMark,
} from './studio.mjs';
import {
  counts,
  human,
  judge,
  humanByLabel,
  judgeByLabel,
  labels,
  cross,
  agreement,
  binary,
  records,
  extra,
  practice,
  reportFor,
  isResolved,
  matchesHuman,
  upperAfterZero,
  belowOnePercent,
} from './specimens.mjs';

const code = {
  compact: 'C',
  stepwise: 'S',
  tie: 'T',
  unresolved: 'split',
  review: 'review',
  'parse failure': 'parse',
};
const pad = (n) => String(n).padStart(2, '0');
const percent = (x) => (100 * x).toLocaleString('en-US', { maximumFractionDigits: 1 }) + '%';

function afterAgreementPhrase(k, targetBeat, phrase, captionStart = false) {
  const b = beat(k);
  if (b !== targetBeat) return b > targetBeat;
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart }) === 1;
}

function agreementRuler(g, k) {
  const { expected, observed, total } = agreement;
  const baseline = afterAgreementPhrase(k, 5, 'twenty-three over sixty-four');
  const observedSpoken = afterAgreementPhrase(k, 5, 'forty-eight over sixty-four');
  const spans = afterAgreementPhrase(k, 5, 'the forty-one still possible');
  const kappa = afterAgreementPhrase(k, 5, 'point six zero nine eight');
  const sweep = beat(k) > 5
    ? 1
    : observedSpoken
      ? smooth((k.elapsed - k.wordCue('forty-eight over sixty-four').end) / 0.5)
      : 0;

  const left = 882;
  const right = 1762;
  const y = 632;
  const x = (n) => left + (right - left) * n / total;
  const expectedX = x(expected);
  const observedX = x(observed);
  cap(g, 'AGREEMENT ON A COMMON SCALE', left, 553);
  box(g, left, y - 8, right - left, 16, C.metal, 6);
  if (baseline) box(g, left, y - 8, expectedX - left, 16, C.blue);
  if (sweep > 0) box(g, expectedX, y - 8, (observedX - expectedX) * sweep, 16, C.mint);

  const ticks = [
    [0, '0', C.dim, 'left', y + 43],
    [total, total + ' / ' + total, C.dim, 'right', y + 43],
  ];
  if (baseline)
    ticks.push([expected, expected + ' / ' + total + ' expected', C.blue, 'center', y - 30]);
  if (sweep === 1)
    ticks.push([observed, observed + ' / ' + total + ' observed', C.mint, 'center', y - 30]);
  for (const [value, name, color, align, textY] of ticks) {
    line(g, x(value), y - 15, x(value), y + 14, color, 4);
    txt(g, name, x(value), textY, 35, color, 'Sans', align, 600);
  }
  if (spans) {
    const gain = observed - expected;
    const possible = total - expected;
    for (const [end, rowY, name, color] of [
      [observedX, 701, gain + ' gained', C.mint],
      [right, 782, possible + ' possible above expected', C.gold],
    ]) {
      line(g, expectedX, rowY, end, rowY, color, 3);
      line(g, expectedX, rowY - 8, expectedX, rowY + 8, color, 3);
      line(g, end, rowY - 8, end, rowY + 8, color, 3);
      txt(g, name, (expectedX + end) / 2, rowY + 37, 36, color, 'Sans', 'center');
    }
    if (kappa) {
      txt(
        g,
        'κ = ' + gain + ' / ' + possible + ' ≈ ' + (gain / possible).toFixed(4),
        left,
        890,
        59,
        C.white,
        'Serif',
      );
    }
  }
}

export function paired(g, k) {
  const b = beat(k);
  const { pairedMatches, expected, total } = agreement;
  const observedCount = afterAgreementPhrase(k, 2, 'Six labels match', 'Six labels match');
  const observedRate = afterAgreementPhrase(k, 2, 'seventy-five percent');
  heading(
    g,
    'Agreement  /  eight handwritten pairs',
    b < 4 ? 'Read across the same case' : 'What changes when we set case numbers aside?',
  );
  if (b <= 3) {
    rule(g, 'CASE', 126, 321, 207);
    rule(g, 'HUMAN', 380, 321, 327);
    rule(g, 'JUDGE', 814, 321, 335);
    human.forEach((h, i) => {
      const y = 405 + i * 70,
        ok = h === judge[i];
      if (observedCount && !ok) box(g, 104, y - 47, 1064, 64, '#654646', 4);
      cap(g, pad(i + 1), 139, y, C.dim, 32);
      txt(g, h, 380, y, 43, C.white, 'Serif');
      txt(g, judge[i], 814, y, 43, C.white, 'Serif');
      if (observedCount) txt(g, ok ? '=' : '≠', 729, y, 43, ok ? C.mint : C.coral, 'Mono', 'center');
    });
    if (!observedCount) wrap(g, 'How many match, including ties?', 1258, 469, 527, 53, C.gold, 71);
    else {
      cap(g, 'OBSERVED AGREEMENT', 1234, 364, C.dim);
      txt(g, pairedMatches + ' / ' + human.length, 1230, 508, 93, C.mint, 'Serif');
      if (observedRate) txt(g, percent(pairedMatches / human.length), 1233, 607, 62, C.white, 'Serif');
      if (b === 2 && afterAgreementPhrase(k, 2, 'about thirty-six percent expected agreement')) {
        cap(g, 'EXPECTED FROM MARGINS', 1234, 738);
        txt(g, '≈ ' + Math.round(100 * expected / total) + '%', 1234, 812, 45, C.blue);
      }
      if (b === 3) cap(g, 'Reopen 06 and 07.', 1235, 768, C.coral);
    }
    return;
  }
  const cell = 64;
  const x0 = 224;
  const y0 = 375;
  const colors = [C.pulp, C.gold, C.blue];
  const classes = [
    afterAgreementPhrase(k, 4, 'Twelve squares match'),
    afterAgreementPhrase(k, 5, 'Stepwise adds nine more'),
    afterAgreementPhrase(k, 5, 'tie adds two'),
  ];
  const compactRows = afterAgreementPhrase(k, 4, 'Three human compact labels');
  const compactColumns = afterAgreementPhrase(k, 4, 'four judge compact labels');
  function axisColor(value, compactSpoken) {
    const group = labels.indexOf(value);
    return classes[group] || (group === 0 && compactSpoken) ? colors[group] : C.dim;
  }
  cap(g, 'JUDGE LABELS', x0, y0 - 69);
  cap(g, 'HUMAN', 92, y0 - 22);
  judgeByLabel.forEach((v, i) =>
    txt(
      g, code[v], x0 + (i + 0.45) * cell, y0 - 18, 31,
      axisColor(v, compactColumns), 'Mono', 'center',
    ),
  );
  humanByLabel.forEach((v, i) =>
    txt(
      g, code[v], x0 - 45, y0 + (i + 0.67) * cell, 31,
      axisColor(v, compactRows), 'Mono', 'center',
    ),
  );
  cross.forEach(({ row, col, match, h }) => {
    const group = labels.indexOf(h);
    const active = match && classes[group];
    box(
      g,
      x0 + col * cell,
      y0 + row * cell,
      cell - 6,
      cell - 6,
      active ? colors[group] : C.metal,
      5,
    );
    if (active) checkMark(g, x0 + (col + 0.45) * cell, y0 + (row + 0.45) * cell, C.ink, 11);
  });
  rule(g, 'MATCHING LABELS      HUMAN × JUDGE', 882, 306, 880);
  const combinations = afterAgreementPhrase(k, 4, 'sixty-four equally weighted combinations');
  const hc = counts(human),
    jc = counts(judge);
  labels.forEach((v, i) => {
    const y = 388 + i * 57;
    txt(g, code[v] + '  ' + v, 882, y, 41, classes[i] ? colors[i] : C.dim, 'Serif');
    if (!combinations) return;
    txt(
      g,
      hc[i] + ' × ' + jc[i] + (classes[i] ? ' = ' + hc[i] * jc[i] : ''),
      1315,
      y,
      39,
      classes[i] ? colors[i] : C.dim,
      'Mono',
    );
  });
  if (combinations) agreementRuler(g, k);
}
export function prevalence(g, k) {
  const all = cue(k, 4, 'both raters accept every answer');
  const items = binary(all),
    bad = items.filter((r) => !r.human),
    agree = items.filter((r) => r.human === r.judge).length;
  heading(g, 'Binary worksheet  /  100 cases', 'Which defects did this judge catch?');
  cap(g, 'HUMAN KEY', 136, 323);
  items.forEach((r, i) => {
    const x = 140 + Math.floor(i % 10) * 55,
      y = 365 + Math.floor(i / 10) * 54;
    box(g, x, y, 44, 42, r.human ? C.pulp : C.coral, 5);
    if (!r.human) {
      line(g, x + 11, y + 10, x + 33, y + 32, C.ink, 4);
      line(g, x + 33, y + 10, x + 11, y + 32, C.ink, 4);
    }
  });
  cap(g, 100 - bad.length + ' acceptable    ' + bad.length + ' bad', 136, 959, C.dim);
  cap(g, 'JUDGE APPROVES EVERY CASE', 816, 345, C.gold);
  const revealed = cue(k, 1, 'It agrees on ninety cases');
  txt(g, revealed ? agree + ' / 100 agree' : 'How many agree?', 814, 458, 71, C.white, 'Serif');
  if (revealed)
    txt(
      g,
      bad.length ? '0 / ' + bad.length + ' defects caught' : 'No known-bad cases',
      815,
      557,
      52,
      bad.length ? C.coral : C.dim,
      'Serif',
    );
  if (beat(k) === 2) {
    cap(g, 'False accept rate    ' + bad.length + ' / ' + bad.length, 820, 726, C.coral, 32);
    cap(g, 'False reject rate    0 / ' + agree, 820, 800, C.mint, 32);
  }
  if (cue(k, 3, 'expected agreement')) {
    txt(
      g,
      'Expected   ' + (agree / 100).toFixed(2) + ' × 1.00 = ' + (agree / 100).toFixed(2),
      815,
      730,
      47,
      C.dim,
    );
    txt(
      g,
      all ? 'κ undefined    (1 − 1 = 0)' : 'κ = (0.90 − 0.90) / 0.10 = 0',
      815,
      857,
      48,
      C.gold,
      'Serif',
    );
  }
}
function printRate(g, name, num, den, x, y, col, visible = true) {
  cap(g, name, x, y);
  if (!visible) return;
  txt(
    g,
    den ? num + ' / ' + den + '   ' + percent(num / den) : 'Unavailable',
    x,
    y + 92,
    64,
    col,
    'Serif',
  );
}
export function coverage(g, k) {
  const b = beat(k),
    added = cue(k, 4, 'one malformed extra attempt'),
    items = added ? [...records, extra] : records;
  const rep = reportFor(items);
  heading(g, 'Attempt register  /  DEP-27 pairs', 'Who stays in each denominator?');
  const known = cue(k, 1, 'the rest resolve'),
    compared = cue(k, 2, 'six agree');
  const x0 = 215,
    dx = 143;
  cap(g, 'CASE', 95, 368);
  cap(g, 'Judge', 95, 490);
  cap(g, 'Human', 95, 602);
  items.forEach((r, i) => {
    const x = x0 + dx * i;
    sheet(g, x, 316, dx - 10, 342, r === extra ? C.coral : C.milk);
    cap(g, pad(i + 1), x + 54, 372, C.ink, 29);
    const classified =
      i < 8
        ? known
        : i === 8
          ? cue(k, 1, 'conflicting order swaps')
          : i === 9
            ? cue(k, 1, 'asks for human review')
            : added;
    txt(
      g,
      classified ? code[r.outcome] : '·',
      x + 80,
      488,
      i < 8 ? 44 : 25,
      C.ink,
      'Mono',
      'center',
    );
    txt(g, compared && r.human ? code[r.human] : '·', x + 80, 601, 44, C.ink, 'Mono', 'center');
  });
  cap(g, 'C compact     S stepwise     T stable tie', 210, 718);
  if (cue(k, 2, 'Eight of ten'))
    printRate(g, 'COVERAGE', rep.resolved, rep.attempted, 218, 842, C.blue);
  if (compared)
    printRate(g, 'AGREEMENT ON COMPARABLE PAIRS', rep.matches, rep.comparable, 958, 842, C.mint);
}
export function practiceState(k) {
  const added = Boolean(cue(k, 2, 'One extra parse failure'));
  const items = added ? [...practice, extra] : practice;
  const showCoverage = added
    ? cue(k, 3, 'Agreement on the same fourteen')
    : cue(k, 2, 'and conditional agreement');
  const showAgreement = added
    ? beat(k) === 3 && k.elapsed >= k.speechDuration
    : cue(k, 2, 'Each column here represents');
  return {
    items,
    rep: reportFor(items),
    added,
    showCoverage: Boolean(showCoverage),
    showAgreement: Boolean(showAgreement),
  };
}
export function practiceReport(g, k) {
  const { items, rep, added, showCoverage, showAgreement } = practiceState(k);
  heading(
    g,
    'Practice sample  /  restore advice',
    added ? 'Which denominator changes?' : 'Which pairs reach each row?',
  );
  const x0 = 488,
    dx = 59;
  const rows = [
    ['Attempted', rep.attempted, C.pulp, () => true],
    ['Resolved', rep.resolved, C.blue, isResolved],
    ['Match human', rep.matches, C.mint, matchesHuman],
  ];
  rows.forEach(([name, n, col, includes], i) => {
    const y = 385 + 112 * i;
    txt(g, name, 118, y + 37, 42, C.white, 'Serif');
    items.forEach((item, j) => {
      const x = x0 + j * dx;
      if (includes(item)) box(g, x, y, 44, 44, item === extra ? C.coral : col, 5);
      else line(g, x + 8, y + 22, x + 36, y + 22, C.line, 4);
    });
    txt(g, n, 1818, y + 37, 36, col, 'Mono', 'right');
  });
  if (cue(k, 2, 'All fourteen have human labels'))
    cap(g, rep.comparable + ' with human labels', 119, 569, C.dim, 24);
  if (added) cap(g, 'parse', x0 + practice.length * dx - 11, 340, C.coral, 25);
  printRate(g, 'COVERAGE', rep.resolved, rep.attempted, 180, 793, C.blue, showCoverage);
  printRate(
    g, 'AGREEMENT ON COMPARABLE PAIRS', rep.matches, rep.comparable, 965, 793, C.mint, showAgreement,
  );
}
export function boundState(k) {
  const b = beat(k);
  if (b <= 3) return 50;
  if (b === 4) return 50 + Math.round(225 * cue(k, 4, 'Follow the curve', 3));
  if (b === 5) return cue(k, 5, 'two hundred ninety-nine') ? belowOnePercent : 275;
  return cue(k, 6, 'One fewer case') ? belowOnePercent - 1 : belowOnePercent;
}
export function bounds(g, k) {
  const b = beat(k);
  if (b >= 7) {
    heading(
      g,
      'Validation design',
      b === 7
        ? 'How many independent cases are in six passes?'
        : 'How many calls will the validation use?',
    );
    if (b === 7) {
      for (let i = 0; i < 6; i++) {
        const x = 190 + i * 260;
        sheet(g, x, 371, 229, 374, i === 0 ? C.gold : C.pulp);
        cap(g, 'PASS ' + (i + 1), x + 53, 432, C.ink, 23);
        for (let j = 0; j < 50; j++)
          dot(g, x + 58 + (j % 5) * 30, 475 + Math.floor(j / 5) * 24, 6, C.ink);
      }
      if (cue(k, 7, 'That gives three hundred calls'))
        txt(g, '300 calls   /   the same 50 known-bad cases', 164, 883, 61, C.gold, 'Serif');
    } else {
      const factors = [
        [200, 'distinct cases'],
        [2, 'orders'],
        [3, 'repeats'],
      ];
      factors.forEach(([n, label], i) => {
        const x = 137 + i * 548;
        sheet(g, x, 351, 461, 306, i === 0 ? C.gold : C.milk);
        txt(g, n, x + 71, 524, 113, C.ink, 'Serif');
        cap(g, label, x + 70, 602, C.ink, 29);
        if (i < 2) txt(g, '×', x + 478, 528, 61, C.dim);
      });
      if (cue(k, 8, 'twelve hundred judge calls'))
        txt(g, '1,200 judge calls', 149, 808, 72, C.blue, 'Serif');
      if (b === 9)
        cap(g, 'Production misses also depend on how often bad answers arrive.', 151, 928);
    }
    return;
  }
  if (b <= 2) {
    heading(
      g,
      'Fixed sample  /  independent known-bad cases',
      'Fifty rejections. How large could the error rate be?',
    );
    for (let i = 0; i < 50; i++) {
      const x = 166 + (i % 10) * 72,
        y = 399 + Math.floor(i / 10) * 79;
      box(g, x, y, 55, 58, C.pulp, 8);
      line(g, x + 13, y + 29, x + 42, y + 29, C.ink, 5);
    }
    cap(g, '50 known-bad cases    0 false accepts', 165, 867, C.mint);
    cap(g, 'SAME PROBABILITY p IN EACH CASE', 1004, 379, C.dim, 26);
    wrap(
      g,
      b === 1 ? 'How often might one still get through?' : 'Chance of rejecting all fifty',
      1000,
      515,
      747,
      56,
      C.white,
      75,
    );
    if (cue(k, 2, 'all fifty have to be rejected')) {
      txt(g, '(1 − p)', 1004, 759, 80, C.gold, 'Serif');
      const width = g.measureText('(1 − p)').width;
      txt(g, '50', 1008 + width, 710, 39, C.gold, 'Serif');
    }
    if (cue(k, 2, 'five percent event'))
      txt(g, 'Set this probability to 0.05.', 1004, 849, 44, C.white);
    return;
  }
  const n = boundState(k),
    upper = upperAfterZero(n);
  heading(g, 'One-sided 95% upper bound', 'How much error can zero false accepts hide?');
  cap(
    g,
    'Fixed independent known-bad cases  /  common p  /  zero false accepts',
    106,
    298,
    C.dim,
    28,
  );
  const x = (n) => 197 + (n - 50) * 3.49,
    y = (p) => 801 - p * 6620;
  for (let rate of [0, 0.01, 0.03, 0.06]) {
    line(
      g,
      182,
      y(rate),
      1110,
      y(rate),
      rate === 0.01 && b >= 4 ? C.gold : C.line,
      rate === 0.01 && b >= 4 ? 4 : 2,
    );
    txt(g, Math.round(100 * rate) + '%', 161, y(rate) + 12, 30, C.dim, 'Mono', 'right');
  }
  [50, 100, 200, 300].forEach((v) => txt(g, v, x(v), 855, 30, C.dim, 'Mono', 'center'));
  cap(g, 'Independent cases', 430, 918);
  g.beginPath();
  for (let j = 50; j <= n; j++) {
    if (j === 50) g.moveTo(x(j), y(upperAfterZero(j)));
    else g.lineTo(x(j), y(upperAfterZero(j)));
  }
  g.strokeStyle = C.mint;
  g.lineWidth = 6;
  g.stroke();
  dot(g, x(n), y(upper), 13, C.mint);
  cap(g, 'UPPER LIMIT', 1213, 419);
  txt(g, '1 − 0.05', 1207, 536, 63, C.white, 'Serif');
  const baseWidth = g.measureText('1 − 0.05').width;
  txt(g, '1/N', 1212 + baseWidth, 498, 34, C.white, 'Serif');
  txt(g, n + ' cases', 1212, 649, 48, C.dim);
  txt(
    g,
    (100 * upper).toFixed(n === 50 ? 2 : n === 298 ? 4 : 3) + '%',
    1206,
    769,
    92,
    C.mint,
    'Serif',
  );
  if (b >= 4) cap(g, 'Target < 1%', 1214, 875, C.gold, 34);
}
