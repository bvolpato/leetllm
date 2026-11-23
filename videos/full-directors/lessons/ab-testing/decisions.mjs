import { P, beat, cue, scale, signed, integer, pct } from './workshop.mjs';
import { groundingPacket, gate, report, assign, version, meter } from './evidence.mjs';

const limit = 0.5;
function auditRule(s) {
  s.page('BLINDED AUDITS    /    2,000 ANSWERS PER ARM', 'Difference in grounding failure rates');
  const X = scale(-1, 1, 672, 1690);
  s.small('REWRITE MINUS CONTROL    /    PERCENTAGE POINTS', 166, 272);
  s.box(X(limit), 338, X(1) - X(limit), 407, '#ebdfc6');
  s.line(
    [
      [X(limit), 331],
      [X(limit), 751],
    ],
    P.gold,
    6,
  );
  s.center('Limit +0.50', X(limit), 307, 35, P.gold);
  s.axis(X, [-1, -0.5, 0, 0.5, 1], 755, (v) => (v === 0 ? '0' : signed(v, 2)));
  s.line(
    [
      [X(0), 349],
      [X(0), 746],
    ],
    P.rule,
    3,
    [8, 9],
  );
  return X;
}
function auditRow(s, X, y, name, packet, { dot = true, interval = true, verdict = true } = {}) {
  const p = packet,
    c = 100 * p.delta,
    lo = 100 * p.low,
    hi = 100 * p.upper,
    col = name === 'Original' ? P.control : P.rewrite;
  s.txt(name, 162, y - 48, 49, col, { face: 'Serif' });
  s.small('Control  22  /  Rewrite  ' + p.treatmentFailures, 162, y + 7, P.soft, 470);
  if (verdict)
    s.txt(p.passes ? 'Pass teaching gate' : 'Hold', 163, y + 67, 38, p.passes ? P.good : P.bad);
  if (!dot) return;
  if (interval === true || interval === 1) {
    s.span(X, lo, hi, y, col, 10);
    s.center(signed(lo), X(lo), y - 42, 32, col);
    const practice = name === 'Practice';
    s.txt(signed(hi), X(hi), y + (practice ? 49 : -42), 32, col, {
      align: practice ? 'right' : 'center',
    });
  }
  if (interval > 0 && interval < 1)
    s.line(
      [
        [X(c + (lo - c) * interval), y],
        [X(c + (hi - c) * interval), y],
      ],
      col,
      10,
    );
  s.dot(X(c), y, 15, col);
  s.center(signed(c), X(c), y + 49, 33, col);
}

export function guardrails(s, k) {
  const b = beat(k),
    v = gate();
  if (b <= 2) {
    s.page('COMPACT TEACHING REPORT', 'First requests and new human pages');
    ['Control', 'Rewrite', 'Change', 'Budget'].forEach((a, i) =>
      s.small(a.toUpperCase(), 710 + 272 * i, 354),
    );
    [
      [
        'p95 latency',
        report.control.p95 + ' ms',
        report.treatment.p95 + ' ms',
        '+' + v.ms + ' ms',
        '+150 ms',
      ],
      [
        'Page rate',
        pct(report.control.pages / 2000, 1),
        pct(report.treatment.pages / 2000, 1),
        signed(v.pages, 1) + ' pp',
        '+0.5 pp',
      ],
    ].forEach(([name, ...values], i) => {
      if (i && b < 2) return;
      const y = 505 + i * 166;
      s.txt(name, 163, y, 53, P.ink, { face: 'Serif' });
      values.forEach((a, j) => s.txt(a, 710 + 272 * j, y, 40, j === 2 ? P.control : P.ink));
      s.line([
        [165, y + 73],
        [1747, y + 73],
      ]);
    });
    s.small('Point-estimate screens    /    resolution lift +4 pp', 166, 836);
    return;
  }
  const X = auditRule(s),
    p = v.audit,
    tip = cue(k, 7, 'Look where that puts', 0.65),
    verdict = !!cue(k, 7, 'The data still');
  auditRow(s, X, 485, 'Original', p, { dot: !!cue(k, 4, 'One extra'), interval: tip, verdict });
  const note =
    b === 3
      ? '23 / 2,000 − 22 / 2,000'
      : b === 4
        ? '1.15% − 1.10%'
        : b === 5
          ? 'SE   √[0.0115 × 0.9885 / 2,000 + 0.011 × 0.989 / 2,000]'
          : b === 6
            ? 'Add the margin   1.96 × SE ≈ 0.65 pp'
            : b === 7
              ? 'The interval includes zero and crosses the harm limit.'
              : 'Two-sided 95% interval   /   one-sided 97.5% upper bound';
  if (b < 7 || tip === 1) s.txt(note, 164, 862, 37, P.ink, { max: 1570 });
}

export function practice(s, k) {
  const alerted = !!cue(k, 4, 'The launch code stops'),
    slow = !!cue(k, 2, 'Which additional') && !cue(k, 3, 'In a separate practice brief');
  const raised = !!cue(k, 3, 'The interval still') && !cue(k, 4, 'Finally');
  const v = gate({ alert: alerted, p95: slow ? 1490 : 1260, target: raised ? 5 : 2 });
  if (v.alert) {
    s.page('PRACTICE COPY    /    ALLOCATION ALERT', 'Trace enrollment before computing lift');
    ['Assigned IDs', 'Eligible IDs', 'Outcome join'].forEach((a, i) => {
      const x = 175 + i * 570;
      s.small('CHECK ' + (i + 1), x, 386);
      s.txt(a, x, 487, 53);
      if (i < 2)
        s.line(
          [
            [x + 380, 487],
            [x + 512, 487],
          ],
          P.rule,
          5,
        );
    });
    s.line([
      [167, 594],
      [1749, 594],
    ]);
    s.txt('Calculation stopped at traffic integrity', 166, 729, 59, P.bad, { face: 'Serif' });
    return;
  }
  s.page(
    'PRACTICE COPY    /    ORIGINAL GROUNDING HOLD RETAINED',
    'Read each rule on its own scale',
  );
  const L = scale(0, 8, 672, 1702),
    T = scale(1100, 1550, 672, 1702),
    m = meter();
  s.txt('Resolution lift', 161, 389, 48);
  s.small('percentage points', 163, 451);
  s.span(L, m.low, m.high, 411, P.control);
  s.dot(L(m.delta), 411, 15, P.ink);
  s.line(
    [
      [L(v.target), 341],
      [L(v.target), 459],
    ],
    P.gold,
    5,
  );
  s.center('Need +' + v.target, L(v.target), 310, 31, P.gold);
  s.center(signed(v.delta, 1), L(v.delta), 476, 34);
  s.center('+' + m.low.toFixed(1), L(m.low), 476, 30);
  s.line([
    [158, 545],
    [1746, 545],
  ]);
  s.txt('First request', 162, 646, 48);
  s.small('p95 milliseconds', 163, 709);
  s.line(
    [
      [T(1100), 662],
      [T(1550), 662],
    ],
    P.rule,
    5,
  );
  s.line(
    [
      [T(1330), 606],
      [T(1330), 705],
    ],
    P.gold,
    5,
  );
  s.center('Limit 1,330', T(1330), 577, 32, P.gold);
  for (const [i, time] of [report.control.p95, v.p95].entries()) {
    s.dot(T(time), 662, 13, i ? P.rewrite : P.control);
    s.center(String(time), T(time), 732, 32, i ? P.rewrite : P.control);
  }
  const speedVerdict = slow && !v.speed && cue(k, 3, 'A four-point gain'),
    liftVerdict = raised && !v.benefit && cue(k, 4, 'We have evidence');
  s.txt(
    speedVerdict
      ? 'Speed fails   ·   +' + v.ms + ' ms'
      : liftVerdict
        ? 'Observed +4 pp falls short of +5 pp'
        : '',
    166,
    838,
    46,
    P.bad,
  );
}

export function receipt(s, k) {
  const b = beat(k),
    r = assign('inc-014');
  s.page('FILED EXPERIMENT RECORD', version);
  if (b < 3) {
    s.small('EVENT STREAM', 164, 299);
    for (const [i, label] of ['First question', 'Follow-up'].entries()) {
      const y = 399 + i * 110;
      s.txt(label, 165, y, 43);
      s.small(r.id, 776, y);
      s.txt(r.arm, 1254, y, 41, P.control);
      s.line([
        [163, y + 52],
        [1746, y + 52],
      ]);
    }
    if (cue(k, 1, 'end')) {
      s.box(162, 642, 1592, 99, '#dce7d8', 5);
      s.txt('After minute 10', 204, 692, 40);
      s.txt('1 mature incident', 1000, 692, 45, P.good);
    }
    if (b === 2)
      s.small('Assignment rule   ·   metric query   ·   versions   ·   planned horizon', 164, 836);
  } else {
    const X = scale(-1, 1, 690, 1710),
      p = groundingPacket();
    s.small('ARCHIVED AUDIT   /   2,000 ANSWERS PER ARM', 161, 303);
    auditRow(s, X, 487, 'Original', p);
    s.line(
      [
        [X(0.5), 405],
        [X(0.5), 554],
      ],
      P.gold,
      4,
    );
    s.center('Limit +0.50', X(0.5), 365, 30, P.gold);
    s.line([
      [163, 606],
      [1741, 606],
    ]);
    s.txt('Reopen the failed answer and its source.', 165, 704, 50, P.ink, { face: 'Serif' });
    s.small('Inspect permission claims   /   verify blinded audit labels', 166, 837);
  }
}

export function finalPractice(s, k) {
  const b = beat(k);
  if (b >= 7) {
    s.page('PAYMENT INCIDENT    /    MINUTE 8', 'What would the raw query have done?');
    s.center('“The owner acknowledged the page. Can we roll it back?”', 960, 322, 48, P.ink, 1600);
    s.line(
      [
        [960, 384],
        [960, 457],
        [520, 457],
        [520, 517],
      ],
      P.rule,
      5,
      [10, 11],
    );
    s.line(
      [
        [960, 457],
        [1410, 457],
        [1410, 517],
      ],
      P.rewrite,
      6,
    );
    s.center('Original query', 520, 574, 49, P.soft);
    s.center('Rewrite', 1410, 574, 49, P.rewrite);
    s.center(cue(k, 8, 'To estimate') ? 'Outcome unobserved' : '?', 520, 684, 51, P.soft);
    s.center('Marked usable at 8 min', 1410, 658, 43);
    s.center('Unsupported claim', 1410, 726, 38, P.bad);
    if (cue(k, 8, 'In the next lesson'))
      s.center('Across incidents     760 / 2,000   →   840 / 2,000', 960, 840, 40);
    return;
  }
  const X = auditRule(s),
    practice = groundingPacket(18),
    practiceY = 649;
  auditRow(s, X, 440, 'Original', groundingPacket());
  const showDot = !!cue(k, 2, 'Use those two');
  const alignMargin = cue(k, 4, 'Compare it with', 0.85, {
    captionStart: 'Its upper tip lands',
  });
  const settled = alignMargin === 1,
    verdict = settled && !!cue(k, 4, 'Both point estimates'),
    estimate = 100 * practice.delta,
    upper = 100 * practice.upper,
    margin = upper - estimate,
    showMargin = b <= 4 && cue(k, 3, 'Starting at the dot');
  if (showMargin) {
    const rulerY = 566,
      parked = -1,
      left = parked + (estimate - parked) * alignMargin,
      right = left + margin,
      labelX = X((left + right) / 2);
    s.span(X, left, right, rulerY, P.rewrite, 6);
    s.box(labelX - 137, rulerY - 50, 274, 32, P.paper);
    s.center('Margin ' + margin.toFixed(2) + ' pp', labelX, rulerY - 35, 30, P.rewrite);
    if (settled) {
      for (const x of [X(left), X(right)])
        s.line([[x, rulerY + 17], [x, practiceY]], P.rewrite, 3, [6, 8]);
    }
  }
  auditRow(s, X, practiceY, 'Practice', practice, { dot: showDot, interval: settled, verdict });
  let note = 'Resolution, latency and page screens pass in both reports.';
  if (b === 2) note = 'Practice rates   ·   0.90% rewrite   −   1.10% control';
  if (b === 3 || b === 4)
    note = showMargin
      ? `Upper tip = ${signed(estimate)} + ${margin.toFixed(2)}${settled ? ' = ' + signed(upper) : ''} pp`
      : 'Upper tip = estimate + margin';
  if (b === 5)
    note = 'Original hold   ·   preplan a fresh confirmation or a valid sequential continuation.';
  if (b === 6)
    note = 'Check audit sampling, event completeness, and uncertainty in pages and latency.';
  s.txt(note, 165, 861, 37, P.ink, { max: 1630 });
}
