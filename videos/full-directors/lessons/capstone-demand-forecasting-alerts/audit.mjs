import {
  P,
  box,
  line,
  dot,
  text,
  num,
  label,
  sheet,
  paper,
  head,
  arrow,
  clockFace,
  scale,
  tick,
  cue,
  beat,
  f,
} from './art.mjs';
import {
  counts,
  origins,
  windows,
  practice,
  full,
  eligible,
  errorTolerance,
  overload,
  residual,
  score,
  charge,
  peakMinimum,
  peakRate,
  completeGrid,
  swapped,
  fitRuns,
} from './forecast.mjs';

export function feed(g, k) {
  const b = beat(k);
  if (b < 3) {
    const held = cue(k, 1, 'still pending');
    head(g, 'DAILY INTAKE   /   LABEL RECONCILIATION', 'The counter reads zero');
    box(g, 49, 169, 253, 177, P.ink);
    label(g, 'REQUEST FEED', 71, 199, P.light);
    box(g, 69, 217, 211, 94, '#102e32');
    num(g, '0000', 174, 287, 53, P.gold, 'center');
    arrow(g, 307, 256, 354, 256, P.dim, 2);
    sheet(g, 364, 170, 259, 175);
    clockFace(g, 409, 222, 24, 6);
    label(g, 'BATCH AUDIT', 449, 211);
    text(g, held ? 'Pending' : 'Checking', 450, 243, 21, held ? P.rust : P.dim, 'Serif');
    text(g, 'Final count', 382, 295, 17, P.dim);
    num(g, '—', 591, 298, 23, P.dim, 'right');
    if (held) {
      line(g, 638, 255, 686, 255, P.dim, 2);
      for (let x = 684; x < 704; x += 8) line(g, x, 238, x - 8, 271, P.rust, 3);
      box(g, 730, 188, 162, 127, '#d9e4d0', P.teal, 2);
      text(g, 'Next fit', 811, 239, 27, P.teal, 'Serif', 600, 'center');
      label(g, 'ROW EXCLUDED', 811, 282, P.teal, 12, 'center');
    }
    if (b === 2) {
      label(g, 'AFTER VERIFICATION', 49, 406);
      text(
        g,
        'Keep the event day and the time the label became available.',
        49,
        449,
        24,
        P.ink,
        'Serif',
      );
    }
  } else {
    head(
      g,
      'MODEL MONITOR   /   14 VERIFIED DAYS',
      b === 3 ? 'When would a review open?' : 'What should a refit learn from?',
    );
    label(g, 'ABSOLUTE ERROR ABOVE SIX PARCELS', 52, 173);
    windows.forEach((r, i) => {
      const x = 52 + i * 59,
        bad = Math.abs(residual(r)) > 6;
      box(g, x, 197, 52, 69, bad ? P.salmon : P.mint, bad ? P.rust : P.edge);
      label(g, 'FEB', x + 26, 218, bad ? P.rust : P.dim, 10, 'center');
      num(g, r.date, x + 26, 251, 20, bad ? P.rust : P.teal, 'center');
    });
    const breaches = full.n - full.inside;
    num(
      g,
      breaches + ' / ' + full.n + ' = ' + f((100 * breaches) / full.n, 1) + '%',
      53,
      326,
      31,
      P.rust,
    );
    text(g, 'Example review threshold  > 15%', 492, 326, 22, P.ink, 'Serif');
    if (b === 3) {
      if (cue(k, 3, 'Precision below sixty percent')) {
        num(g, 'Precision  ' + f(100 * full.precision, 1) + '%', 53, 389, 24, P.teal);
        text(g, 'Example review threshold  < 60%', 492, 389, 21, P.ink, 'Serif');
      }
      text(
        g,
        'Check window size, label delay, event mix and the original plans.',
        53,
        458,
        21,
        P.ink,
        'Serif',
      );
    } else {
      line(g, 56, 403, 875, 403, P.edge, 3);
      for (const [i, s] of [
        'Audit the feed',
        'Version the refit',
        'Score future labels',
      ].entries()) {
        dot(g, 58 + 303 * i, 403, 8, P.teal);
        text(g, s, 52 + 303 * i, 451, 22, P.teal, 'Serif');
      }
    }
  }
}
export function experiments(g, k) {
  const b = beat(k),
    active = cue(k, 3, 'add ten thousand to just January thirtieth'),
    shown = b < 3 ? cue(k, 2, 'Friday stays') : cue(k, 3, 'jumps to about');
  head(
    g,
    'BOUNDARY TEST   /   COPY OF RAW EVIDENCE',
    b === 4
      ? cue(k, 4, 'check the records themselves')
        ? 'Count the issue and horizon pairs'
        : 'Was the plan known at issue?'
      : active
        ? 'Move the edit inside the cutoff'
        : 'Change the counts outside the cutoff',
  );
  if (b === 4) {
    const dup = cue(k, 4, 'duplicate Friday row');
    const rows = dup ? swapped : windows;
    if (!cue(k, 4, 'check the records themselves')) {
      box(g, 48, 112, 877, 367, P.paper);
      const inputs = [
        ['1 FEB  /  SUN', 'Issue at 08:00'],
        ['2 FEB  /  MON', 'Announcement'],
        ['3 FEB  /  TUE', 'Target day'],
      ];
      inputs.forEach(([s, v], i) => {
        const x = 64 + 300 * i;
        label(g, s, x, 234);
        text(g, v, x, 279, 24, i === 1 ? P.rust : P.ink, 'Serif');
        dot(g, x + 8, 316, 8, i === 1 ? P.rust : P.teal);
      });
      line(g, 72, 316, 676, 316, P.dim, 1.5);
      text(g, 'Campaign flag at the Sunday issue: 0', 63, 402, 27, P.blue, 'Serif');
      return;
    }
    for (let j = 0; j < 2; j++) {
      label(g, 'ISSUE  ' + (1 + 7 * j) + ' FEB', 51, 180 + 106 * j);
      for (let i = 0; i < 7; i++) {
        const x = 202 + i * 100,
          y = 135 + j * 107,
          r = rows[j * 7 + i],
          bad = dup && j === 0 && (i === 3 || i === 4);
        box(g, x, y, 88, 75, bad ? P.salmon : P.white, P.edge);
        label(g, 'h' + r.h, x + 11, y + 24);
        text(g, 'Feb ' + r.date, x + 11, y + 55, 18, bad ? P.rust : P.ink, 'Serif');
      }
    }
    text(
      g,
      dup
        ? '14 rows.  Horizon 4 missing.  Horizon 5 duplicated.'
        : 'A Monday announcement falls after the Sunday issue.',
      52,
      400,
      24,
      dup ? P.rust : P.teal,
      'Serif',
    );
    label(
      g,
      completeGrid(rows) ? 'ALL ISSUE / HORIZON PAIRS PRESENT' : 'INCOMPLETE GRID',
      52,
      456,
      dup ? P.rust : P.teal,
      17,
    );
    return;
  }
  const cutoff = eligible(counts, origins[0]).length;
  const reset = b === 3 && !active;
  label(g, 'DEC 1', 53, 153);
  label(g, 'JAN 31', 51 + 10.7 * (cutoff - 1), 153, P.dim, 13, 'right');
  counts.forEach((r, i) => {
    const inside = i < cutoff,
      changed = !reset && (active ? r.day === '2026-01-30' : !inside);
    box(
      g,
      52 + 10.7 * i,
      173,
      8,
      changed ? 70 : 48,
      changed ? P.rust : inside ? P.teal : '#c2cbbd',
    );
  });
  const edge = 52 + 10.7 * cutoff - 2;
  line(g, edge, 150, edge, 249, P.ink, 2);
  label(g, 'Fit cutoff', edge + 12, 147);
  label(
    g,
    reset
      ? 'COPY RESTORED'
      : active
        ? 'JAN 30 FINAL  +10,000'
        : '15 UNAVAILABLE COUNTS   +10,000 EACH',
    51,
    274,
    reset ? P.dim : P.rust,
    15,
  );
  ['Original Friday', 'Repeat fit'].forEach((s, i) => label(g, s, 58 + i * 460, 335));
  num(g, f(fitRuns[0][4], 3), 56, 394, 47, P.blue);
  arrow(g, 362, 377, 459, 377, P.dim, 2);
  num(g, shown ? f(fitRuns[active ? 2 : 1][4], 3) : '?', 516, 394, 47, active ? P.rust : P.teal);
  if (b === 2 && cue(k, 2, 'All seven differences are zero')) {
    num(
      g,
      'Δ by horizon     ' + fitRuns[1].map((v, i) => f(v - fitRuns[0][i], 0)).join('     '),
      52,
      467,
      20,
      P.teal,
    );
  } else if (active && shown)
    text(
      g,
      'Same 62 dates. One eligible target changed from 143 to 10,143.',
      55,
      463,
      23,
      P.rust,
      'Serif',
    );
  else text(g, 'Same Sunday, same feature construction, same fit.', 53, 463, 22, P.dim, 'Serif');
}

function afterPhrase(k, beatNumber, phrase, breakCaption = false) {
  const b = beat(k);
  if (b !== beatNumber) return b > beatNumber;
  if (breakCaption) k.reveal(phrase, 0, { captionStart: phrase });
  return k.elapsed + 1e-9 >= k.wordCue(phrase).end;
}

const wedScale = { min: 130, max: 155 };

export function tallyAt(k) {
  const actual = practice[1].actual;
  const confirmed = afterPhrase(k, 3, 'One hundred forty-five requests', true);
  if (beat(k) !== 3 || confirmed) {
    return { running: false, count: confirmed ? actual : 0, confirmed };
  }

  const start = k.wordCue('Watch the scanner').start;
  const end = k.wordCue('At the last parcel it stops').end;
  const zoomStart = start + 0.35 * (end - start);
  const count =
    k.elapsed < zoomStart
      ? wedScale.min * Math.max(0, (k.elapsed - start) / (zoomStart - start))
      : wedScale.min +
        (actual - 1 - wedScale.min) * Math.min(1, (k.elapsed - zoomStart) / (end - zoomStart));

  // Keep the running tally below the final count until the audit result is spoken.
  return { running: k.elapsed >= start, count: Math.floor(count), confirmed };
}

function wedRail(g, state, showPeak) {
  const row = practice[1];
  const bandStart = row.forecast - errorTolerance;
  const bandEnd = row.forecast + errorTolerance;
  const x1 = 85,
    x2 = 875,
    y = 318;
  const { min, max } = wedScale;
  const position = (n) => x1 + ((n - min) * (x2 - x1)) / (max - min);
  box(g, position(bandStart), y - 12, position(bandEnd) - position(bandStart), 24, P.sky);
  scale(g, x1, x2, y, min, max, 5, { labels: false });
  label(g, 'PARCELS', x1, y - 32, P.dim, 15);
  const marks = [
    [row.forecast, row.forecast + ' issued', P.blue, 'right', -12],
    [row.cap, row.cap + ' crew limit', P.rust, 'center', 0],
    [bandEnd, bandEnd + ' band edge', P.blue, 'center', 0],
  ];
  if (showPeak) marks.push([peakMinimum, peakMinimum + ' peak cutoff', P.ochre, 'center', 0]);
  for (const [value, name, color, align, offset] of marks) {
    const x = position(value);
    tick(g, x, y, value === bandEnd ? 12 : 17, color);
    line(g, x, y - 17, x + offset, y - 26, color, 1.5);
    label(g, name, x + offset, y - 32, color, 17, align);
  }
  if ((state.running || state.confirmed) && state.count >= min) {
    const x = position(state.count);
    line(g, x, y + 6, x, y + 19, P.teal, 2);
    dot(g, x, y + 6, 5, P.teal);
    num(g, state.count + (state.confirmed ? ' final' : ' counted'), x, y + 43, 21, P.teal, 'center');
  } else {
    text(g, state.running ? state.count + ' counted' : 'Awaiting audit', x1, y + 43, 20, P.dim);
  }
  return position;
}

function parcelGap(g, position, from, to, description, color, progress = 1) {
  const left = position(from),
    end = position(to),
    right = left + (end - left) * progress,
    y = 385;
  line(g, left, y, right, y, color, 2);
  for (const x of [left, right]) line(g, x, y - 6, x, y + 6, color, 2);
  if (description && progress === 1)
    label(g, description, (left + end) / 2, y + 27, color, 17, 'center');
}

export function practiceScene(g, k) {
  const b = beat(k),
    state = tallyAt(k),
    old = score([practice[0], practice[2]]),
    all = score(practice),
    wednesday = practice[1];
  const peakRule = afterPhrase(k, 7, 'a hundred fifty actual requests');
  const peakResult = afterPhrase(k, 8, 'Zero units', true);
  let heading = 'Which days can enter the score?';
  if (b >= 3) heading = state.confirmed ? 'Wednesday clears audit' : 'Count Wednesday’s parcels';
  if (b >= 7) {
    heading = 'Which line starts the peak charge?';
    if (peakRule) heading = 'How many peak units does Wednesday add?';
    if (peakResult) heading = 'Wednesday’s audit decisions';
  }
  head(g, 'TRANSFER   /   THREE FIXED BOOKINGS', heading);
  const xs = [59, 230, 390, 549, 709];
  ['Day', 'Forecast', 'Crew', 'Final count', 'Absolute error'].forEach((s, j) =>
    label(g, s, xs[j], 132),
  );
  const revealErrors = afterPhrase(k, 2, 'Their errors are one parcel and zero', true),
    wedError = afterPhrase(k, 4, 'The forecast was seven parcels low', true);
  practice.forEach((r, i) => {
    const y = 144 + i * 42,
      wed = i === 1,
      audited = !wed || state.confirmed;
    box(g, 49, y, 862, 38, wed ? (audited ? P.mint : '#e7e2d0') : P.white, P.edge, 0.6);
    text(g, r.date, xs[0], y + 27, 19, P.ink, 'Serif', 600);
    num(g, r.forecast, xs[1], y + 27, 19, P.blue);
    num(g, r.cap, xs[2], y + 27, 19, P.rust);
    if (audited) num(g, r.actual, xs[3], y + 27, 19, P.teal);
    else text(g, 'In audit', xs[3], y + 27, 17, P.dim, 'Serif');
    num(
      g,
      audited && revealErrors && (!wed || wedError) ? Math.abs(residual(r)) : '…',
      xs[4],
      y + 27,
      19,
      P.ink,
    );
  });
  if (b < 3) {
    if (afterPhrase(k, 2, 'That’s half a parcel', true)) {
      label(g, 'MEAN ABSOLUTE ERROR', 52, 331);
      num(g, old.abs + ' / ' + old.n + ' = ' + old.mae, 50, 380, 34, P.blue);
      if (afterPhrase(k, 2, 'both days are within six')) {
        label(g, 'IN TOLERANCE', 539, 331);
        num(g, old.inside + ' / ' + old.n, 538, 380, 34, P.teal);
      }
      if (afterPhrase(k, 2, 'precision and recall are both one'))
        text(
          g,
          'One verified warning, one verified overload. Tuesday is both. Precision = recall = 1.',
          53,
          459,
          20,
          P.dim,
          'Serif',
        );
    } else
      text(
        g,
        'Which days supply the denominator for mean absolute error?',
        52,
        385,
        28,
        P.ink,
        'Serif',
      );
    return;
  }

  const position = wedRail(g, state, peakRule);
  const { forecast, cap, actual } = wednesday;
  if (b === 4) {
    const below = k.reveal('below capacity', 0.4, { captionStart: false });
    const exceeded = k.reveal('exceeded capacity', 0.4, { captionStart: false });
    const error = k.reveal('The forecast was', 0.4, { captionStart: false });
    const outside = k.reveal('outside tolerance', 0.35, { captionStart: false });
    const missed = afterPhrase(k, 4, 'Record a missed overload', true);
    if (outside) {
      const edge = forecast + errorTolerance;
      parcelGap(g, position, edge, actual, actual - edge + ' parcel beyond tolerance', P.blue, outside);
    } else if (error) {
      parcelGap(
        g,
        position,
        forecast,
        actual,
        wedError ? residual(wednesday) + ' parcels low' : '',
        P.blue,
        error,
      );
    } else if (exceeded) {
      const known = afterPhrase(k, 4, 'exceeded capacity by five');
      parcelGap(
        g,
        position,
        cap,
        actual,
        known ? actual - cap + ' over crew limit' : '',
        P.rust,
        exceeded,
      );
    } else if (below) {
      parcelGap(g, position, forecast, cap, cap - forecast + ' below crew limit', P.blue, below);
    }
    if (missed) label(g, 'Missed overload', 53, 461, P.rust, 20);
    if (afterPhrase(k, 4, 'the three absolute errors add to eight', true)) {
      const errors = practice.map((r) => Math.abs(residual(r)));
      num(g, errors.join(' + ') + ' = ' + all.abs + ' parcels', 493, 461, 23, P.ink);
    }
  } else if (b === 5 || b === 6) {
    const metrics =
      b === 5
        ? [
            [
              'MEAN ABSOLUTE ERROR',
              all.abs + ' ÷ ' + all.n + ' ≈ ' + f(all.mae, 2) + ' parcels',
              afterPhrase(k, 5, 'two and two thirds parcels', true),
            ],
            [
              'WITHIN TOLERANCE',
              all.inside + ' / ' + all.n,
              afterPhrase(k, 5, 'Two of the three days stayed within tolerance', true),
            ],
          ]
        : [
            [
              'PRECISION',
              all.caught + ' / ' + all.warned + ' = ' + all.precision,
              afterPhrase(k, 6, 'Precision stays at one', true),
            ],
            [
              'RECALL',
              old.caught + ' / ' + old.overloaded + ' → ' + all.caught + ' / ' + all.overloaded,
              afterPhrase(k, 6, 'Recall falls to one half', true),
            ],
          ];
    metrics.forEach(([name, value, show], i) => {
      const x = 53 + i * 440;
      label(g, name, x, 422, P.dim, 15);
      if (show) num(g, value, x, 463, 27, i ? P.teal : P.blue);
    });
  } else if (peakResult) {
    if (afterPhrase(k, 8, 'stopped short of the peak cutoff'))
      parcelGap(g, position, actual, peakMinimum, peakMinimum - actual + ' below peak cutoff', P.ochre);
    const decisions = [
      [53, charge(actual, forecast) + ' peak units', P.ochre, true],
      [295, 'Record missed overload', P.rust, afterPhrase(k, 8, 'Record the missed overload')],
      [
        579,
        'Investigate ' + residual(wednesday) + '-parcel error',
        P.blue,
        afterPhrase(k, 8, 'seven-parcel error to investigate'),
      ],
    ];
    decisions.forEach(([x, decision, color, show]) => {
      if (show) label(g, decision, x, 462, color, 21);
    });
  } else if (peakRule) {
    text(
      g,
      'Peak charge = ' + peakRate + ' × shortfall when actual ≥ ' + peakMinimum + '.',
      52,
      450,
      24,
      P.ink,
      'Serif',
    );
  }
}
