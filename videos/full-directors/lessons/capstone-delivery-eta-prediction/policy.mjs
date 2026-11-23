import {
  C,
  rect,
  round,
  line,
  dot,
  ring,
  poly,
  txt,
  head,
  ground,
  tag,
  bar,
  box,
  cue,
  pct,
} from './art.mjs';
import {
  decisions,
  charges,
  expected,
  validation,
  frozen,
  canFit,
  fitMinute,
  labelMinute,
} from './evidence.mjs';

export function costPlot(g, k) {
  const i = k.beat.beatIndex,
    byRisk = cue(k, 2, 'at or above'),
    ageRule = !byRisk;
  const rows = decisions(0.4, ageRule),
    known = (ageRule && i >= 1) || (byRisk && i >= 3);
  ground(g);
  head(g, 'FOUR SUPPLIED SCORES   /   KNOWN OUTCOMES', 'Which shipment incurs the charge?');
  const x = (t) => 74 + t * 19.1,
    y = (v) => 407 - v * 242;
  rect(
    g,
    ageRule ? x(18) : x(0),
    y(1),
    ageRule ? x(24) - x(18) : x(24) - x(0),
    ageRule ? 242 : y(0.4) - y(1),
    C.pale,
  );
  line(g, x(0), y(0), x(24), y(0), C.ink, 2);
  line(g, x(0), y(0), x(0), y(1), C.ink, 2);
  for (const n of [0, 6, 12, 18, 24]) txt(g, n, x(n), 432, 16, C.muted, 'center', 'Mono');
  txt(g, 'Scan age (h)', x(12), 467, 20, C.muted, 'center');
  for (const p of [0, 0.4, 1]) txt(g, pct(p), x(0) - 10, y(p) + 5, 15, C.muted, 'right', 'Mono');
  txt(g, 'Late risk', 74, 147, 17, C.muted);
  if (ageRule) line(g, x(18), y(0), x(18), y(1), C.teal, 3);
  else line(g, x(0), y(0.4), x(24), y(0.4), C.teal, 3);
  rows.forEach((r, j) => {
    const px = x(r.age),
      py = y(r.risk),
      color = r.late ? C.rust : C.blue;
    if (r.late)
      poly(
        g,
        [
          [px, py - 8],
          [px + 8, py],
          [px, py + 8],
          [px - 8, py],
        ],
        color,
      );
    else {
      dot(g, px, py, 7, C.paper);
      ring(g, px, py, 7, color, 3);
    }
    if (known && r.penalty) ring(g, px, py, 13, color, 2);
    txt(
      g,
      'E-' + (301 + j) + (r.late ? (j === 0 ? ' · Exp.' : ' · Std.') : ''),
      px + 17,
      py - 3,
      16,
      color,
      'left',
      'Mono',
      600,
    );
    txt(g, r.age + ' h · ' + pct(r.risk), px + 17, py + 19, 15, C.ink);
  });
  line(g, 596, 139, 596, 455, C.line);
  txt(g, ageRule ? 'Warn at 18 h' : 'Warn at 40% risk', 627, 180, 29, C.teal, 'left', 'Serif');
  txt(g, 'Miss, expedited', 626, 234, 18);
  txt(g, '150', 906, 234, 21, C.rust, 'right', 'Mono');
  txt(g, 'Miss, standard', 626, 269, 18);
  txt(g, '60', 906, 269, 21, C.rust, 'right', 'Mono');
  txt(g, 'False warning', 626, 304, 18);
  txt(g, '8', 906, 304, 21, C.rust, 'right', 'Mono');
  line(g, 627, 327, 909, 327, C.line, 2);
  if (known) {
    const who = rows.findIndex((r) => r.penalty > 0);
    txt(
      g,
      'E-' + (301 + who) + (rows[who].late ? ' missed' : ' false warning'),
      626,
      374,
      21,
      C.rust,
    );
    txt(g, charges(0.4, ageRule) + ' units', 626, 431, 42, C.ink, 'left', 'Serif');
  } else
    txt(g, ageRule ? 'Which miss?' : 'Which false warning?', 626, 402, 24, C.ink, 'left', 'Serif');
}

export function threshold(g, k) {
  const i = k.beat.beatIndex;
  ground(g, true);
  if (i < 2) {
    head(g, 'STANDARD SERVICE   /   CALIBRATED RISK 20%', 'Two ways to pay for an error', true);
    const e = expected(0.2, 60),
      start = 65,
      w = 792;
    txt(g, '80% on time', start, 161, 22, C.mint);
    txt(g, '20% late', start + w * 0.8 + 15, 161, 22, C.coral);
    for (let j = 0; j < 10; j++) box(g, start + 79 * j, 209, 40);
    bar(g, start, 257, w * 0.8, C.mint, 6);
    bar(g, start + w * 0.8, 257, w * 0.2, C.coral, 6);
    txt(g, 'Warn', 65, 323, 24, C.cream, 'left', 'Serif');
    txt(g, '0.80 × 8', 252, 323, 25, C.light, 'left', 'Mono');
    if (cue(k, 0, 'six point four'))
      txt(g, e.warn.toFixed(1) + ' units', 675, 323, 26, C.mint, 'left', 'Mono');
    if (i === 1) {
      txt(g, 'Stay silent', 65, 390, 24, C.cream, 'left', 'Serif');
      txt(g, '0.20 × 60', 252, 390, 25, C.light, 'left', 'Mono');
      if (cue(k, 1, 'is twelve'))
        txt(g, e.silent + ' units', 675, 390, 26, C.coral, 'left', 'Mono');
      if (cue(k, 1, 'lower expected cost')) tag(g, 'Propose warning', 65, 437, C.ink, C.mint);
    }
  } else if (i === 5) {
    const e = expected(0.2, 60),
      labor = 3;
    head(
      g,
      'STANDARD SERVICE   /   CALIBRATED RISK 20%',
      'Staff time adds a cost to every warning',
      true,
    );
    txt(g, 'Per warning', 48, 176, 20, C.mint);
    txt(g, labor + ' units of staff time', 48, 226, 31, C.cream, 'left', 'Serif');
    txt(g, 'Warn', 48, 314, 24, C.cream);
    txt(g, '0.80 × 8 + ' + labor, 278, 314, 25, C.light, 'left', 'Mono');
    txt(g, 'Stay silent', 48, 382, 24, C.cream);
    txt(g, '0.20 × 60', 278, 382, 25, C.light, 'left', 'Mono');
    if (cue(k, 5, 'nine point four')) {
      txt(g, (e.warn + labor).toFixed(1) + ' units', 694, 314, 25, C.mint, 'left', 'Mono');
      txt(g, e.silent + ' units', 694, 382, 25, C.coral, 'left', 'Mono');
    }
  } else {
    const exp = expected(0.05, 150);
    head(g, 'CALIBRATED RISK   /   TWO ACTIONS', 'Where do the expected costs meet?', true);
    txt(g, 'Correct call costs 0  ·  Capacity available', 49, 151, 19, C.mint);
    txt(g, '(1 − p) × false-warning cost  =  p × missed-delay cost', 49, 208, 24, C.cream);
    if (cue(k, 2, 'Divide the false-warning cost'))
      txt(
        g,
        'Cutoff  =  false-warning cost ÷ (false-warning cost + missed-delay cost)',
        49,
        256,
        22,
        C.light,
      );
    if (i >= 3) {
      txt(g, 'Standard', 51, 326, 20, C.mint);
      txt(
        g,
        '8 / 68  ≈  ' + (100 * expected(0.2, 60).cutoff).toFixed(1) + '%',
        51,
        365,
        27,
        C.cream,
        'left',
        'Mono',
      );
      if (cue(k, 3, 'Missing an expedited')) {
        txt(g, 'Expedited', 501, 326, 20, C.coral);
        txt(
          g,
          '8 / 158  ≈  ' + (100 * exp.cutoff).toFixed(4) + '%',
          501,
          365,
          27,
          C.cream,
          'left',
          'Mono',
        );
      }
    }
    if (i >= 4) {
      const p = cue(k, 4, 'Five point one') ? 0.051 : 0.05;
      const x = (p) => 293 + (p - 0.049) * 185000;
      line(g, x(0.049), 439, x(0.052), 439, '#7e9693', 3);
      line(g, x(exp.cutoff), 414, x(exp.cutoff), 457, C.amber, 3);
      dot(g, x(p), 439, 8, C.mint);
      txt(
        g,
        (100 * p).toFixed(1) + '%   ' + (p >= exp.cutoff ? 'Warn' : 'Stay silent'),
        x(p),
        487,
        20,
        C.cream,
        'center',
      );
      txt(g, 'Full precision', 47, 444, 20, C.light);
    }
  }
}

export function selection(g, k) {
  const i = k.beat.beatIndex,
    threshold = cue(k, 2, 'At eighty percent')
      ? 0.8
      : cue(k, 1, 'sixty-five percent')
        ? 0.65
        : cue(k, 0, 'fifty-nine percent')
          ? 0.59
          : 0.4;
  const open = (i === 0 && threshold === 0.59) || (i === 1 && threshold === 0.65),
    rows = decisions(threshold);
  ground(g);
  head(g, 'FOUR FIXED SCORES   /   PENALTY UNITS', 'Move only the warning cutoff');
  const x = (v) => 294 + v * 430;
  const edge = x(threshold);
  rect(g, edge, 165, x(1) - edge, 224, C.pale);
  line(g, edge, 153, edge, 394, C.teal, 3);
  txt(g, 'Warn ≥ ' + pct(threshold), edge, 143, 17, C.teal, 'center', 'Mono');
  rows.forEach((r, j) => {
    const y = 200 + j * 55;
    txt(g, 'E-' + (301 + j), 45, y, 17, C.muted, 'left', 'Mono');
    txt(g, ['Expedited late', 'Standard late', 'On time', 'On time'][j], 116, y, 19, C.ink);
    bar(g, x(0), y - 7, x(1) - x(0), C.line, 2);
    dot(g, x(r.risk), y - 7, 7, r.late ? C.rust : C.blue);
    txt(g, pct(r.risk), x(r.risk), y - 19, 15, C.ink, 'center', 'Mono');
    if (!open) {
      txt(g, r.warn ? 'Warn' : 'Track', 754, y, 19, r.warn ? C.teal : C.muted);
      txt(g, r.penalty, 903, y, 21, r.penalty ? C.rust : C.muted, 'right', 'Mono');
    }
  });
  if (open) txt(g, 'Which shipment changes action?', 48, 456, 29, C.ink, 'left', 'Serif');
  else {
    txt(g, 'Total penalty', 48, 459, 24, C.muted);
    txt(g, charges(threshold) + ' units', 903, 463, 37, C.rust, 'right', 'Serif');
  }
}

export function fitting(g, k) {
  const i = k.beat.beatIndex,
    cohorts = cue(k, 1, 'Eight more shipments');
  ground(g);
  if (!cohorts) {
    head(g, 'S-079   /   SYNTHETIC SHIPMENT', 'Which side of the fit gets this label?');
    txt(g, 'Prediction   Mar 21, noon', 50, 183, 24, C.blue);
    const x = (m) => 225 + (m - fitMinute) * 58;
    line(g, 72, 290, 890, 290, C.line, 4);
    line(g, x(fitMinute), 234, x(fitMinute), 335, C.rust, 4);
    txt(g, 'Fit begins', x(fitMinute), 216, 24, C.rust, 'center');
    txt(g, 'Mar 22, 12:00', x(fitMinute), 376, 20, C.rust, 'center', 'Mono');
    if (cue(k, 0, 'eight minutes later')) {
      dot(g, x(labelMinute), 290, 10, C.teal);
      txt(g, 'Label recorded', x(labelMinute), 254, 23, C.teal, 'center');
      txt(g, '12:08', x(labelMinute), 376, 21, C.teal, 'center', 'Mono');
    }
    if (i === 1 && !canFit(fitMinute - 1440, labelMinute, fitMinute))
      tag(g, 'Exclude S-079', 49, 427, C.cream, C.rust);
  } else if (i < 3 || i === 5) {
    head(g, '136 SYNTHETIC SHIPMENTS   /   ONE SNAPSHOT EACH', 'A later cohort for each decision');
    const groups = [
      ['Train', 79, 'Fit Mar 22', C.blue],
      ['Gap', 4, '', C.line],
      ['Validate', 24, 'Freeze Apr 19', C.teal],
      ['Gap', 4, '', C.line],
      ['Test', 24, 'Evaluate May 21', C.rust],
    ];
    let x = 54;
    for (const [name, n, desc, c] of groups) {
      const w = n * 6.2;
      rect(g, x, 235, w - 2, 68, c);
      if (desc) {
        txt(g, name, x, 210, 24, c, 'left', 'Serif');
        txt(g, n, x + w / 2, 279, 28, C.cream, 'center', 'Mono');
        txt(g, desc, x, 339, 19, c);
      } else txt(g, '4', x + w / 2, 276, 15, C.ink, 'center', 'Mono');
      x += w;
    }
    txt(g, '9 excluded   ·   8 in gaps + 1 late label', 52, 405, 24, C.ink);
    txt(
      g,
      i === 5
        ? 'Repeat at later forecast origins. Report exclusions and follow-up.'
        : 'Require labels to be available at the fit, freeze and evaluation.',
      52,
      456,
      19,
      C.muted,
    );
  } else {
    if (i === 3 && !cue(k, 3, 'Price four thresholds')) {
      head(g, '79 TRAINING SHIPMENTS', 'Fit the late-risk and arrival models');
      for (const [j, name, target, op] of [
        [0, 'Late risk', 'Probability', 'Scale on training rows → logistic regression'],
        [1, 'Arrival', 'Hours remaining', 'Raw features → least squares'],
      ]) {
        const y = 204 + j * 118;
        txt(g, name, 52, y, 30, C.ink, 'left', 'Serif');
        txt(g, target, 52, y + 33, 19, C.teal);
        txt(g, op, 324, y + 10, 23, C.ink);
        line(g, 50, y + 57, 907, y + 57, C.line);
      }
    } else {
      head(g, '24 VALIDATION SHIPMENTS   /   MODELS FROZEN', 'Choose the policy before opening test labels');
      const show = cue(k, 3, 'lowest cost');
      validation.forEach(([t, c], j) => {
        const x = 83 + j * 218,
          h = c * 0.32;
        rect(g, x, 380 - h, 100, h, t === frozen && show ? C.teal : C.blue);
        txt(g, String(c), x + 50, 362 - h, 24, C.ink, 'center', 'Mono');
        txt(g, pct(t), x + 50, 419, 22, C.muted, 'center', 'Mono');
      });
      if (i === 4) tag(g, 'Locked at ' + pct(frozen) + '   ·   16 units', 48, 450);
      else txt(g, 'Total penalty by warning threshold', 51, 473, 19, C.muted);
    }
  }
}
