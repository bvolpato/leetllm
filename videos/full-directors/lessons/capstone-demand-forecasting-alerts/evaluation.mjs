import {
  P,
  box,
  line,
  dot,
  text,
  num,
  label,
  title,
  sheet,
  paper,
  head,
  stamp,
  arrow,
  scale,
  lensBand,
  tick,
  cue,
  beat,
  f,
} from './art.mjs';
import {
  fri,
  wed,
  windows,
  counts,
  origins,
  full,
  seasonal,
  readyBy,
  residual,
  overload,
  warn,
  inside,
  charge,
  score,
  receipt,
  fingerprint,
  completeGrid,
} from './forecast.mjs';

export function ledger(g, k) {
  const added = cue(k, 2, 'hundred seventy-six requests'),
    changed = cue(k, 3, 'copied the final count over');
  const protectedHash = cue(k, 4, 'original row’s fingerprint'),
    check = cue(k, 4, 'compare the edited row');
  head(g, 'LEDGER   /   FC-A   •   STANDARD', 'Friday keeps its issue time');
  sheet(g, 52, 125, 854, 231);
  box(g, 52, 125, 854, 40, P.ink);
  label(
    g,
    'OLS-V1     /     SUN 1 FEB 08:00 UTC     →     FRI 6 FEB     /     HORIZON 5',
    74,
    151,
    P.white,
    15,
  );
  ['Record', 'Issued point', 'Final count', 'Actual − point'].forEach((s, i) =>
    label(g, s, [72, 356, 545, 722][i], 202),
  );
  const row = (y, name, v, observed, ink) => {
    text(g, name, 72, y, 21, ink, 'Serif');
    num(g, f(v, 3), 358, y, 21, ink);
    num(g, observed ? fri.actual : 'Pending', 546, y, 19, observed ? P.teal : P.dim);
    num(g, observed ? f(fri.actual - v, 3) : '—', 725, y, 20, ink);
  };
  row(250, 'Issued entry', fri.forecast, added, P.blue);
  line(g, 72, 268, 884, 268);
  if (changed) row(317, 'Edited copy', fri.actual, true, P.rust);
  if (protectedHash) {
    label(g, 'PROTECTED ISSUE RECORD', 53, 399, P.teal);
    num(g, fingerprint(fri.forecast).slice(0, 14) + '…', 53, 438, 22, P.teal);
    if (check) {
      label(g, 'EDITED ROW  /  SHA-256 PREFIX', 509, 399, P.rust);
      num(g, fingerprint(fri.actual).slice(0, 14) + '…', 509, 438, 22, P.rust);
      text(
        g,
        'Example row digests. The lab hashes the entire issued file.',
        53,
        483,
        18,
        P.dim,
        'Serif',
      );
    }
  } else if (changed)
    text(g, 'Zero error. Can the reviewer trust this copy?', 54, 431, 26, P.rust, 'Serif');
  else
    text(g, 'The observation joins on center, tier and target day.', 54, 431, 23, P.dim, 'Serif');
}
function errorsGrid(g, rows, mark, top = 150) {
  for (let i = 0; i < windows.length; i++) {
    const r = windows[i],
      known = rows.includes(r),
      out = known && mark && !inside(r);
    const x = 49 + (i % 7) * 124,
      y = top + Math.floor(i / 7) * 96;
    box(g, x, y, 113, 83, out ? P.salmon : known ? P.white : '#e3e4d7', out ? '#bd785b' : P.edge);
    label(
      g,
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7] + ' ' + r.date,
      x + 8,
      y + 21,
    );
    text(
      g,
      known ? f(Math.abs(residual(r)), 2) : 'Pending',
      x + 8,
      y + 52,
      known ? 22 : 17,
      known ? (out ? P.rust : P.blue) : P.dim,
      known ? 'Mono' : 'Serif',
    );
    if (known && mark) box(g, x, y + 76, 113, 7, out ? P.rust : P.teal);
  }
}
export function mature(g, k) {
  const all = cue(k, 3, 'February sixteenth'),
    mark = cue(k, 4, 'Mark each miss');
  const b = beat(k),
    rows = all ? windows : readyBy(origins[1]),
    m = score(rows);
  head(
    g,
    all
      ? 'AS OF 16 FEBRUARY   /   BOTH WINDOWS VERIFIED'
      : 'AS OF 8 FEBRUARY 08:00 UTC   /   BOTH WINDOWS ISSUED',
    'Absolute error by target day',
  );
  errorsGrid(g, rows, mark);
  label(g, 'MATURE', 49, 381);
  num(g, m.n, 49, 422, 32, P.teal);
  label(g, 'PENDING', 222, 381);
  num(g, 14 - m.n, 222, 422, 32, P.dim);
  if (cue(k, 1, 'divide by five')) {
    label(g, 'MEAN ABSOLUTE ERROR', 416, 381);
    num(g, f(m.abs, 2) + ' ÷ ' + m.n + ' ≈ ' + f(m.mae, 2), 416, 423, 27, P.blue);
  }
  if (all)
    text(
      g,
      b === 5
        ? 'Horizon 2 pairs 3 and 10 February. Two cases give little evidence about a typical week.'
        : mark
          ? 'Red marks an absolute error above six parcels.'
          : 'Same dates, seasonal baseline: ' + f(seasonal.mae, 3) + ' parcels.',
      49,
      472,
      18,
      P.dim,
      'Serif',
    );
  else if (b === 2)
    text(
      g,
      'With zero verified dates, mean absolute error, peak sum and tolerance fraction are undefined.',
      49,
      472,
      18,
      P.dim,
      'Serif',
    );
}
export function peak(g, k) {
  const b = beat(k);
  if (b >= 6) {
    head(g, 'FORECAST DIAGNOSTICS   /   FRIDAY 6 FEBRUARY', 'What does a six-parcel band promise?');
    const pos = (n) => 80 + ((n - 146) * (891 - 80)) / 36;
    lensBand(g, pos, 281, fri.forecast, 40);
    scale(g, 80, 891, 281, 146, 182, 6);
    tick(g, pos(fri.forecast), 281, 33, P.blue);
    tick(g, pos(fri.actual), 281, 25, P.teal);
    label(g, 'Issued ' + f(fri.forecast, 2), pos(fri.forecast), 216, P.blue, 16, 'center');
    label(g, 'Final ' + fri.actual, pos(fri.actual), 228, P.teal, 16, 'center');
    num(
      g,
      f(fri.forecast - 6, 2) + ' to ' + f(fri.forecast + 6, 2),
      pos(fri.forecast),
      358,
      20,
      P.blue,
      'center',
    );
    text(g, 'Chosen tolerance', pos(fri.forecast), 391, 22, P.blue, 'Serif', 500, 'center');
    text(
      g,
      b === 7
        ? 'A campaign-conditioned interval assumes the campaign runs.'
        : 'To assign a probability, check coverage and width on later, untouched windows.',
      48,
      471,
      21,
      P.ink,
      'Serif',
    );
    return;
  }
  const stress = cue(k, 4, 'six parcels lower'),
    more = cue(k, 3, 'Tuesday’s surge'),
    last = cue(k, 3, 'second Friday also qualifies');
  const paid = cue(k, 2, 'Multiply each gap'),
    total = cue(k, 3, 'Sum the three rows');
  head(
    g,
    'AUDITED COUNTS   /   SELECTIVE SHORTFALL CHARGE',
    stress ? 'Lower one issued point in a replay' : 'Price the shortfall on peak days',
  );
  label(
    g,
    'Applies when actual ≥ 150 parcels      •      Units = 3 × max(actual − forecast, 0)',
    48,
    138,
    P.teal,
    17,
  );
  const xs = [52, 216, 326, 523, 721];
  ['Peak date', 'Actual', 'Baseline → units', 'Candidate → units', ''].forEach((s, i) =>
    label(g, s, xs[i], 190),
  );
  const filtered = windows.filter((r) => r.actual >= 150);
  filtered.slice(0, last ? 3 : more ? 2 : 1).forEach((r, i) => {
    const y = 211 + i * 53,
      c = r.forecast - (stress && i === 0 ? 6 : 0);
    box(g, 48, y, 861, 44, stress && i === 0 ? P.sky : P.white);
    text(g, 'Feb ' + r.date, xs[0] + 4, y + 30, 20);
    num(g, r.actual, xs[1], y + 30, 20);
    num(
      g,
      r.baseline + (paid ? ' → ' + f(charge(r.actual, r.baseline), 0) : ''),
      xs[2],
      y + 30,
      19,
    );
    num(g, f(c, 3) + (paid ? ' → ' + f(charge(r.actual, c), 3) : ''), xs[3], y + 30, 19, P.blue);
  });
  if (total) {
    const rows = windows.map((r) => (r === fri && stress ? { ...r, forecast: r.forecast - 6 } : r)),
      m = score(rows);
    line(g, 48, 381, 905, 381);
    label(g, 'PEAK SUM', 53, 414);
    num(g, seasonal.peak + ' units', 321, 416, 22);
    num(g, f(m.peak, 3) + ' units', 525, 416, 23, P.blue);
    if (stress)
      text(
        g,
        'One lower forecast adds 18 units. Across 14 days, MAE rises by 6/14 to ' +
          f(m.mae, 3) +
          '.',
        49,
        466,
        19,
        P.rust,
        'Serif',
      );
  } else if (paid)
    text(
      g,
      'Friday’s 33-parcel baseline shortfall costs 99 fictional units.',
      52,
      425,
      23,
      P.dim,
      'Serif',
    );
}
function routeDay(g, x, y, r, side) {
  const hit = warn(r) && overload(r);
  box(g, x, y, 346, 43, hit ? P.mint : P.salmon);
  label(
    g,
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][r.h - 1] + ' ' + r.date,
    x + 11,
    y + 27,
    hit ? P.teal : P.rust,
    16,
  );
  text(
    g,
    side === 'forecast' ? f(r.forecast, 2) + ' > ' + r.cap : r.actual + ' > ' + r.cap,
    x + 331,
    y + 29,
    19,
    hit ? P.teal : P.rust,
    'Mono',
    500,
    'right',
  );
}
export function signals(g, k) {
  const b = beat(k);
  if (b <= 3) {
    head(
      g,
      'WARNING REGISTER   /   ORIGINAL STAFFING CAPACITY',
      'Two comparisons for the same day',
    );
    const gotFri = cue(k, 1, 'On Friday the sixth'),
      gotTue = cue(k, 3, 'Tuesday the tenth'),
      secondFri = cue(k, 3, 'next Friday');
    const rows = [
      wed,
      ...(gotFri ? [fri] : []),
      ...(gotTue ? [windows[8]] : []),
      ...(secondFri ? [windows[11]] : []),
    ];
    ['Date', 'Forecast vs crew', 'Actual vs crew', 'Verified warning'].forEach((s, i) =>
      label(g, s, [54, 203, 465, 704][i], 158),
    );
    rows.forEach((r, i) => {
      const y = 179 + i * 57,
        w = warn(r),
        o = overload(r);
      box(g, 48, y, 865, 47, i % 2 ? P.paper : P.white);
      text(g, 'Feb ' + r.date, 55, y + 31, 20, P.ink, 'Serif');
      num(g, f(r.forecast, 2) + (w ? ' > ' : ' ≤ ') + r.cap, 203, y + 31, 18, w ? P.blue : P.dim);
      num(g, r.actual + (o ? ' > ' : ' ≤ ') + r.cap, 465, y + 31, 18, o ? P.teal : P.dim);
      const known = i > 0 || cue(k, 1, 'false warning');
      if (known)
        text(
          g,
          w && o ? 'Caught' : w ? 'False warning' : 'Missed overload',
          704,
          y + 31,
          18,
          w && o ? P.teal : P.rust,
          'Sans',
          700,
        );
    });
    if (b === 2)
      text(
        g,
        '6 February: a useful warning and a 12.72-parcel forecast miss.',
        50,
        446,
        22,
        P.blue,
        'Serif',
      );
    if (cue(k, 3, 'other ten days'))
      text(
        g,
        'Ten further days had neither a warning nor an overload.',
        50,
        453,
        22,
        P.dim,
        'Serif',
      );
  } else {
    head(g, 'VERIFIED DATES   /   WARNING REGISTER', 'Which dates enter the denominator?');
    label(g, 'PRECISION   /   DAYS WITH A WARNING', 58, 166, P.blue, 15);
    label(g, 'RECALL   /   DAYS WITH AN OVERLOAD', 527, 166, P.teal, 15);
    windows.filter(warn).forEach((r, i) => routeDay(g, 57, 193 + 57 * i, r, 'forecast'));
    const recall = cue(k, 4, 'For recall');
    if (recall)
      windows.filter(overload).forEach((r, i) => routeDay(g, 527, 193 + 57 * i, r, 'actual'));
    if (cue(k, 4, 'Two really exceeded'))
      num(g, full.caught + ' / ' + full.warned + ' caught', 59, 415, 30, P.blue);
    if (cue(k, 4, 'both Fridays and missed Tuesday'))
      num(g, full.caught + ' / ' + full.overloaded + ' caught', 527, 415, 30, P.teal);
    if (b === 5)
      text(
        g,
        'An empty denominator makes that fraction undefined. The ten quiet dates enter neither.',
        59,
        475,
        18,
        P.dim,
        'Serif',
      );
  }
}
export function acceptance(g, k) {
  const resolved = cue(k, 2, 'With fourteen days'),
    decision = cue(k, 2, 'Hold the candidate');
  const minimum = Math.ceil(0.85 * full.n),
    accepted = windows.filter((r) => inside(r));
  const missed = windows.filter((r) => !inside(r));
  head(
    g,
    'ACCEPTANCE RULE   /   FIXED BEFORE EVALUATION',
    'How many dates fit inside the tolerance?',
  );
  label(g, 'WITHIN SIX PARCELS   /   TARGET DATES IN FEBRUARY', 50, 145, P.teal);
  const slots = 14,
    first = 51,
    step = 61;
  for (let i = 0; i < slots; i++) {
    const x = first + step * i,
      r = accepted[i];
    box(g, x, 169, 53, 86, r ? P.mint : P.paper, r ? P.teal : P.edge, 1.2);
    if (r) {
      dot(g, x + 26, 181, 3, P.teal);
      label(g, 'FEB', x + 26, 205, P.dim, 11, 'center');
      num(g, r.date, x + 26, 237, 25, P.teal, 'center');
    }
  }
  if (resolved) {
    const x = first + step * (minimum - 1) + 26;
    arrow(g, x, 301, x, 260, P.rust, 2);
    text(g, '12th place', x + 10, 303, 17, P.rust, 'Serif');
  }
  label(g, 'OUTSIDE SIX', 52, 301, P.rust);
  missed.forEach((r, i) => {
    const x = 52 + i * 103;
    box(g, x, 317, 91, 42, P.salmon);
    text(g, 'Feb ' + r.date, x + 45, 344, 18, P.rust, 'Serif', 600, 'center');
  });
  label(g, 'REQUIRED', 536, 350);
  num(g, '≥ 85%', 641, 352, 26);
  if (cue(k, 1, 'Eleven qualify')) num(g, full.inside + ' / ' + full.n, 52, 419, 37, P.blue);
  if (decision) {
    stamp(g, 'Hold candidate', 56, 480, P.rust);
    text(
      g,
      f((100 * full.inside) / full.n, 1) +
        '% within tolerance. Test a changed rule on later dates.',
      304,
      476,
      20,
      P.rust,
      'Serif',
    );
  } else text(g, 'Mean absolute error and peak penalty both fell.', 344, 416, 21, P.dim, 'Serif');
}
export function gates(g, k) {
  const b = beat(k),
    perfect = cue(k, 3, 'exact final counts');
  if (b === 2) {
    head(g, 'SEPARATE BOUNDARY EXAMPLE   /   TWO GATES', 'What happens exactly at the cutoff?');
    const tie = cue(k, 2, 'equal mean absolute error');
    const cases = [
      ['Tolerance', '17 / 20 = 85%', 'At least 85%', 'Pass'],
      ['Mean absolute error', '5.0 vs 5.0 parcels', 'Strictly lower', 'Fail'],
    ];
    cases.slice(0, tie ? 2 : 1).forEach(([name, value, rule, result], i) => {
      const y = 161 + i * 107;
      sheet(g, 49, y, 855, 85);
      label(g, name, 65, y + 25, P.dim, 14);
      num(g, value, 65, y + 66, 27, i ? P.blue : P.teal);
      text(g, rule, 459, y + 53, 21, P.ink, 'Serif');
      stamp(g, result, 786, y + 54, i ? P.rust : P.teal, 20);
    });
    if (cue(k, 2, 'Precision and recall'))
      text(g, 'Precision and recall each require at least 60%.', 50, 441, 23, P.ink, 'Serif');
    return;
  }
  if (b <= 3) {
    const current = perfect ? score(windows.map((r) => ({ ...r, forecast: r.actual }))) : full;
    const check = receipt(current, completeGrid(windows), 'seasonal-v0');
    head(
      g,
      'LOCAL COMPARISON   /   SYNTHETIC DEMAND',
      perfect
        ? 'Replay with every forecast equal to its final count'
        : 'Read the acceptance receipt',
    );
    const pct = (x) => f(100 * x, 1) + '%';
    const lines = [
      ['Issue grid', '2 origins × 7 mature rows'],
      ['Previous model', 'seasonal-v0'],
      ['Mean absolute error', f(current.mae, 3) + ' < ' + f(seasonal.mae, 3)],
      ['Peak cost', f(current.peak, 3) + ' < ' + seasonal.peak],
      ['Within ±6', pct(current.inside / current.n) + '  /  min 85%'],
      ['Precision', pct(current.precision) + '  /  min 60%'],
      ['Recall', pct(current.recall) + '  /  min 60%'],
    ];
    lines.forEach(([name, value], i) => {
      const y = 136 + 45 * i;
      box(g, 49, y, 552, 38, check.gates[i] ? P.white : P.salmon);
      text(g, name, 61, y + 26, 16, P.ink, 'Serif', 600);
      num(g, value, 215, y + 26, 15);
      label(
        g,
        check.gates[i] ? 'PASS' : 'FAIL',
        583,
        y + 26,
        check.gates[i] ? P.teal : P.rust,
        13,
        'right',
      );
    });
    sheet(g, 633, 147, 271, 266);
    label(g, 'COMPARISON', 651, 182);
    title(g, check.comparison ? 'Pass' : 'Fail', 650, 231, 35, check.comparison ? P.teal : P.rust);
    if (b < 3 || cue(k, 3, 'decision still says hold')) {
      line(g, 650, 253, 885, 253);
      label(g, 'RELEASE DECISION', 651, 281);
      num(g, check.decision, 651, 317, 26);
      text(g, 'Live ready: ' + check.liveReady, 651, 362, 20, P.rust);
    }
  } else {
    head(
      g,
      'PLANNER PILOT   /   REPRESENTATIVE REAL DEMAND',
      b === 5
        ? 'Rehearse a return to the previous fit'
        : 'Keep the original shift beside the intervention',
    );
    if (b === 4) {
      const stages = [
        ['Issued schedule', 'Friday crew', '150 places'],
        ['Warning', 'Issued point', f(fri.forecast, 2)],
        ['Planner action', 'Example decision', 'Add a shift'],
      ];
      stages.forEach(([name, tag, value], i) => {
        const x = 50 + i * 302;
        sheet(g, x, 185, 252, 186);
        box(g, x, 185, 252, 38, [P.ink, P.blue, P.teal][i]);
        label(g, name, x + 12, 211, P.white, 16);
        text(g, tag, x + 14, 272, 18, P.dim, 'Serif');
        text(g, value, x + 14, 324, 27, P.ink, 'Serif', 600);
        if (i < 2) arrow(g, x + 256, 285, x + 293, 285, P.dim, 2);
      });
      text(
        g,
        'Compare real seasons. Run alongside the incumbent and record what the planner did.',
        52,
        456,
        20,
        P.dim,
        'Serif',
      );
    } else {
      ['Seasonal-v0', 'Input snapshot', 'Feature contract'].forEach((s, i) => {
        const x = 67 + i * 281;
        box(g, x, 201, 232, 24, '#bd9f65');
        box(g, x - 5, 216, 250, 117, '#dfc48c', P.ochre, 1.5);
        text(g, s, x + 120, 281, 23, P.ink, 'Serif', 600, 'center');
        line(g, x + 120, 334, x + 120, 364, P.teal, 2);
      });
      box(g, 63, 364, 812, 54, P.teal);
      text(
        g,
        'Restore the previous model and replay its required inputs',
        469,
        399,
        22,
        P.white,
        'Serif',
        500,
        'center',
      );
    }
  }
}
