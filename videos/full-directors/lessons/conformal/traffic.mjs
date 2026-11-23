import {
  C,
  head,
  plate,
  text,
  rect,
  line,
  dot,
  ring,
  dash,
  bracket,
  pct,
  fmt,
  mix,
  ease,
  diamond,
} from './drawing.mjs';
import { calibration, normalized, fixedRadii, scaledRadii, testRows, mixture } from './model.mjs';
import { coverageRows } from './calibration.mjs';
export function mixPlot(c, n, showSum, subgroups, { compact = false } = {}) {
  const m = mixture(n),
    top = 175,
    h = compact ? 145 : 211,
    left = 60,
    w = 836;
  let x = left;
  m.groups.forEach(({ name, n, rate, hits }, i) => {
    const width = (w * n) / 1000,
      col = i ? C.gold : C.teal;
    rect(c, x, top, width - 2, h, C.grid);
    rect(c, x, top + h * (1 - rate), width - 2, h * rate, col);
    text(c, name + '  ' + pct(rate), x + width / 2, top - 22, 21, col, 'center', 'Serif');
    text(c, hits + ' / ' + n, x + width / 2, top + h * 0.78, 20, C.ink, 'center', 'Mono', 600);
    bracket(c, x + 2, x + width - 4, top + h + 16, C.dim, 2);
    text(
      c,
      pct(n / 1000) + ' of traffic',
      x + width / 2,
      top + h + 43,
      15,
      C.dim,
      'center',
      'Mono',
    );
    x += width;
  });
  dash(c, left, top + h * 0.2, left + w, top + h * 0.2, '#815f37', 2);
  text(c, '80%', 925, top + h * 0.2, 15, C.gold, 'center', 'Mono');
  if (showSum)
    text(
      c,
      subgroups
        ? 'Calibrate within predefined groups with enough data.'
        : '(' + m.groups.map((g) => g.hits).join(' + ') + ') / 1000  =  ' + pct(m.hits / 1000),
      55,
      compact ? 394 : 478,
      21,
      subgroups ? C.dim : C.text,
      'left',
      subgroups ? 'Sans' : 'Mono',
    );
}
export function groups(c, t) {
  head(c, 'TRAFFIC REPORT  /  1,000 REQUESTS', 'Count the area each group contributes');
  const half = t.on(3, 'Give the two groups'),
    answer = half ? t.on(4, 'The short group') : t.on(2, 'The total clears');
  mixPlot(c, half ? 500 : 750, answer, t.b === 5, { compact: true });
}
const ratioText = (s) => (s === 5 / 3 ? '5/3' : fmt(s));
export function scale(c, t) {
  if (t.b < 3) {
    const r = calibration[7],
      x = 203,
      w = 69;
    head(
      c,
      'NORMALIZED SCORE  /  CALIBRATION REQUEST ' + r.id,
      'Measure the error in units of its fitted scale',
    );
    text(c, 'absolute error', 48, 223, 19, C.gold);
    bracket(c, x, x + w * r.error, 223, C.gold, 12);
    text(c, r.error + ' ms', 850, 223, 22, C.gold, 'center', 'Mono');
    text(c, 'frozen scale', 48, 322, 19, C.teal);
    const units = t.on(2, 'The units cancel') || t.on(2, 'end') ? r.ratio : 1;
    for (let i = 0; i < units; i++) {
      bracket(c, x + i * w * r.scale + 2, x + (i + 1) * w * r.scale - 2, 322, C.teal, 9);
      text(c, r.scale + ' ms', x + (i + 0.5) * r.scale * w, 359, 18, C.teal, 'center', 'Mono');
    }
    if (units > 1)
      text(
        c,
        r.error + ' ms ÷ ' + r.scale + ' ms  =  ' + r.ratio,
        50,
        435,
        27,
        C.text,
        'left',
        'Mono',
      );
    return;
  }
  if (t.b === 3) {
    const sorted = t.on(3, 'Only then sort'),
      answered = t.on(3, 'This threshold');
    const rows = sorted ? [...calibration].sort((a, b) => a.ratio - b.ratio) : calibration;
    head(
      c,
      'NORMALIZED SCORE  /  NINE HELD-OUT ROWS',
      sorted ? 'Order the ratios from smallest to largest' : 'Divide each error by its own scale',
    );
    const divided = t.amount(3, 'Divide each held-out error', 1.7);
    const labs = ['Request', 'Error (ms)', 'Scale (ms)', 'Error / scale', sorted ? 'Rank' : ''];
    labs.forEach((label, k) => text(c, label, 43, 181 + k * 55, 16, C.dim));
    rows.forEach((r, i) => {
      const x = 230 + i * 81,
        highlight = answered && i === normalized.index;
      if (highlight) rect(c, x - 37, 150, 74, 282, C.gold, 5);
      const ink = highlight ? C.ink : C.text;
      [
        r.id,
        r.error,
        r.scale,
        i < Math.ceil(9 * divided) ? ratioText(r.ratio) : '·',
        sorted ? i + 1 : '',
      ].forEach((v, j) =>
        text(c, v, x, 181 + j * 55, 18, j === 3 && !highlight ? C.teal : ink, 'center', 'Mono'),
      );
    });
    if (answered)
      text(
        c,
        'q = ' + normalized.q + '   ·   unitless multiplier',
        46,
        127,
        22,
        C.gold,
        'left',
        'Mono',
      );
    return;
  }
  const radii = [...fixedRadii];
  if (t.on(4, 'The two middle radii')) radii[0] = scaledRadii[0];
  if (t.on(4, 'Leave T four')) {
    radii[1] = scaledRadii[1];
    radii[2] = scaledRadii[2];
  }
  const widening = ease(t.amount(6, 'Keep your eye', 0.85));
  radii[3] = mix(fixedRadii[3], scaledRadii[3], widening);
  const rows = testRows(radii);
  rows.forEach((r) => {
    r.lo = +r.lo.toFixed(1);
    r.hi = +r.hi.toFixed(1);
  });
  head(
    c,
    'TEST REQUESTS  /  MILLISECONDS',
    t.b === 4
      ? 'Apply the multiplier to each fitted scale'
      : 'How far does twice T4’s scale reach?',
  );
  coverageRows(c, rows, {
    scales: true,
    radii: radii.map((v) => +v.toFixed(1)),
    verdictY: 127,
    verdict: t.on(6, "That's a reason")
      ? rows.filter((r) => r.hit).length + '/4 covered   ·   q = 2'
      : t.b === 5
        ? 'T4   ·   forecast 44 ms     scale 6 ms     q = 2'
        : null,
  });
}
export function shift(c, t) {
  if (t.b === 1 && t.on(1, 'Now change')) {
    head(c, 'TRAFFIC MIX  /  SAME GROUP RATES', 'What changed when long requests became common?');
    mixPlot(c, t.on(1, 'Give long requests') ? 500 : 750, t.on(1, 'end'), false);
    return;
  }
  if (t.b === 1) {
    head(c, 'FROZEN LATENCY RULE', 'A tail observation can occur in the same population');
    coverageRows(c, testRows(fixedRadii), { verdict: 'Fixed radius 8 ms', verdictY: 127 });
    return;
  }
  const audit = t.b === 3;
  if (audit) {
    const step = t.on(3, 'New calibration data') ? 3 : t.on(3, 'Compare signed errors') ? 2 : 1;
    head(c, 'CALIBRATION AUDIT', 'What evidence would explain the misses?');
    text(c, 'Signed error (ms)', 50, 172, 18, C.dim);
    const zero = 293;
    line(c, zero, 191, zero, 284, C.dim, 1);
    for (const [i, diff] of calibration.map((r) => r.actual - r.forecast).entries()) {
      const y = 199 + i * 10,
        x = zero + diff * 12;
      line(c, zero, y, x, y, C.teal, 3);
      dot(c, x, y, 3, C.teal);
    }
    text(c, 'early', 94, 304, 15, C.dim);
    text(c, 'late', 411, 304, 15, C.dim);
    if (step >= 2) {
      text(c, 'Coverage by traffic type', 518, 172, 18, C.dim);
      const mix = mixture(500);
      for (const [i, g] of mix.groups.entries()) {
        text(c, g.name, 521, 220 + i * 63, 18, C.text);
        rect(c, 608, 211 + i * 63, 220, 19, C.grid);
        rect(c, 608, 211 + i * 63, 220 * g.rate, 19, i ? C.gold : C.teal);
        text(c, pct(g.rate), 842, 220 + i * 63, 17, C.dim, 'left', 'Mono');
      }
      text(c, '500 requests per group', 520, 322, 16, C.dim);
    }
    if (step === 3) {
      plate(c, 48, 338, 864, 81);
      text(c, 'Fresh calibration → following traffic', 75, 363, 22, C.teal, 'left', 'Serif');
      text(c, 'Check label collection, time dependence and model versions.', 75, 396, 17, C.dim);
    }
    return;
  }
  head(
    c,
    'CALIBRATION AUDIT',
    audit ? 'Match the evidence to the failure' : 'How did requests enter the labeled sample?',
  );
  const labels = ['Earlier queue', 'After deployment', 'Labels collected'];
  const info = [
    'Short and long requests',
    'A burst from a new tenant',
    'Slow completions can go unlabeled',
  ];
  labels.forEach((s, i) => {
    const y = 174 + i * 99;
    text(c, s, 49, y, 21, C.text, 'left', 'Serif');
    const sizes = i === 0 ? [0, 0, 1, 0, 0, 1, 0] : [1, 1, 1, 0, 1, 0, 1];
    sizes.forEach((big, j) => {
      const x = 291 + j * 42;
      if (i === 2 && big) {
        ring(c, x, y, 10, C.red);
        line(c, x - 7, y + 7, x + 7, y - 7, C.red, 2);
      } else
        rect(c, x - 11, y - 6 - (big ? 4 : 0), 22, 12 + (big ? 8 : 0), big ? C.gold : C.teal, 3);
    });
    text(c, info[i], 49, y + 34, 16, C.dim);
  });
  text(c, 'The observations reflect the collection process.', 50, 431, 21, C.gold, 'left', 'Serif');
}
