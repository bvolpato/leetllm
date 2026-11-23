import {
  C,
  colors,
  fixed,
  pct,
  cue,
  fill,
  stroke,
  circle,
  arrow,
  text,
  mono,
  serif,
  title,
  cell,
  rule,
  shareStrip,
  bar,
  sum,
} from './studio.mjs';
import {
  scores,
  archive,
  words,
  states,
  masks,
  means,
  finiteUnit,
  comparisonRow,
  tokenGrad,
  poolLoss,
  triplet,
  pairAt,
} from './examples.mjs';

export function order(g, k) {
  const swap = cue(k, 0, 'Swap compiler', 1),
    sums = cue(k, 1, 'Both produce'),
    ctx = cue(k, 2, 'encoder read'),
    diagnose = k.beat.beatIndex === 3;
  title(
    g,
    ctx ? 'Read the roles before pooling' : 'Who calls whom?',
    ctx ? 'Contextual token states' : 'One fixed vector per word',
  );
  for (let line = 0; line < 2; line++) {
    const y = 291 + line * 381;
    const seq = ['compiler', 'calls', 'linker'];
    seq.forEach((word, i) => {
      const sideways = Math.min(1, Math.max(0, (swap - 0.25) / 0.5));
      const clearance = Math.min(1, swap * 4, (1 - swap) * 4);
      const slide = line && i !== 1 ? sideways * (1 - i) * 2 : 0,
        x = 85 + (i + slide) * 325,
        curve = line && i !== 1 ? 196 * (1 - i) * clearance : 0;
      fill(g, x, y + curve, 306, 105, i === 1 ? C.pale : C.white);
      serif(g, word, x + 153, y + curve + 72, 53, C.ink, { align: 'center' });
      mono(
        g,
        ctx
          ? i === 1
            ? 'predicate'
            : (line ? i === 2 : i === 0)
              ? 'caller'
              : 'callee'
          : words[word].map((v) => fixed(v, 1)).join(' '),
        x + 153,
        y + curve + 163,
        31,
        ctx ? C.sea : C.soft,
        { align: 'center' },
      );
    });
    if (sums) {
      arrow(g, 1080, y + 46, 1218, y + 46, C.sea);
      const mean = [0, 1, 2].map((d) => sum(seq.map((s) => words[s][d])) / 3);
      mono(
        g,
        ctx
          ? line
            ? 'h(linker → compiler)'
            : 'h(compiler → linker)'
          : mean.map((x) => fixed(x, 3)).join('  '),
        1250,
        y + 65,
        36,
        C.ink,
        { max: 575 },
      );
    }
  }
  if (diagnose) {
    text(
      g,
      '[CLS] selects one contextual state. Compare its held-out ranking with a retrieval-trained encoder.',
      88,
      885,
      38,
      C.sea,
    );
    text(
      g,
      'Near-identical cosines? Inspect repeated vectors, padding masks and matrix axes.',
      88,
      983,
      37,
      C.rust,
    );
  }
}

export function pooling(g, k) {
  const b = k.beat.beatIndex,
    masked = cue(k, 0, 'Exclude the masked'),
    avg = cue(k, 0, 'divide by two'),
    norm = cue(k, 1, 'Normalize each mean');
  title(
    g,
    b < 2
      ? 'Which states enter the mean?'
      : b === 2
        ? 'One query per row'
        : 'Follow the loss back to a token',
    b < 2 ? 'Two token sequences with padding' : 'Paired columns A and B  /  temperature 0.20',
  );
  if (b < 2) {
    states.forEach((row, i) => {
      const x = 105 + i * 885;
      serif(g, 'Sequence ' + (i ? 'B' : 'A'), x, 320, 54);
      row.forEach((v, j) => {
        const y = 370 + j * 114,
          valid = masks[i][j];
        text(g, ['Token 1', 'Token 2', 'Padding'][j], x, y + 55, 38, C.soft);
        v.forEach((n, d) =>
          cell(g, x + 223 + d * 180, y, 168, 80, n, masked && !valid ? '#dbd5c5' : C.white),
        );
        if (masked && !valid) {
          stroke(
            g,
            [
              [x + 225, y + 42],
              [x + 570, y + 42],
            ],
            C.rust,
            5,
          );
          text(g, 'mask 0', x + 610, y + 55, 35, C.rust);
        }
      });
      if (avg) {
        const v = norm ? finiteUnit(means[i]) : means[i];
        rule(g, x, 741, 732);
        text(g, norm ? 'Unit vector' : 'Mean', x, 843, 40, C.sea);
        mono(g, '[' + v.map((z) => fixed(z, norm ? 3 : 1)).join(', ') + ']', x + 245, 847, 45);
      }
    });
    if (b === 1)
      text(
        g,
        'Cosine via dot product requires finite, nonzero vectors normalized to unit length.',
        100,
        964,
        36,
        C.soft,
      );
  } else if (b === 2) {
    const mat = (x, label, rows, col) => {
      serif(g, label, x, 366, 52);
      rows.forEach((r, i) =>
        r.forEach((v, j) =>
          cell(g, x + j * 157, 427 + i * 116, 146, 98, fixed(v, 2), i === j ? col : C.white),
        ),
      );
    };
    mat(115, 'Queries', means.map(finiteUnit), C.pale);
    text(g, '×', 480, 560, 83);
    mat(
      640,
      'Passages (T)',
      [
        [1, 0],
        [0, 1],
      ],
      C.pale,
    );
    text(g, '=', 1010, 560, 76);
    mat(1175, 'Cosine scores', means.map(finiteUnit), C.brass);
    if (cue(k, 2, 'average loss')) {
      mono(g, 'Mean row loss   ' + fixed(poolLoss(states), 6) + ' nats', 115, 864, 48, C.sea);
    }
  } else {
    const rows = [
      ['A · first token', tokenGrad(0)],
      ['A · padding', tokenGrad(2)],
    ];
    rows.forEach(([name, v], i) => {
      const y = 387 + i * 229;
      text(g, name, 100, y + 39, 47);
      v.forEach((n, d) => {
        const x = 610 + d * 560;
        cell(g, x, y - 30, 458, 125, fixed(n, 6), n === 0 ? '#dbd5c5' : n < 0 ? C.pale : C.pink);
      });
    });
    mono(g, '∂(mean row loss) / ∂(token state)', 100, 903, 42, C.soft);
  }
}
export function pool(g, k, isLoss) {
  const b = k.beat.beatIndex,
    enabled = isLoss
      ? cue(k, 3, 'Return to all three')
        ? [true, true, true]
        : cue(k, 1, 'omit the sleeper')
          ? [true, false, true]
          : cue(k, 1, 'Restore the sky')
            ? [true, true, true]
            : cue(k, 1, 'omit the sky')
              ? [true, true, false]
              : [true, true, true]
      : b < 2 || cue(k, 3, 'Now admit')
        ? [true, true, true]
        : [true, false, true];
  const row = comparisonRow(scores, 0.2, 0, enabled),
    full = comparisonRow(scores, 0.2),
    masses = isLoss || cue(k, 1, 'The highest score now'),
    ready = isLoss || b >= 2;
  title(
    g,
    isLoss ? 'What does a competitor cost?' : 'Who shares the denominator?',
    'Unit-vector cosines  /  temperature 0.20',
  );
  const xs = [640, 1070, 1500];
  archive.forEach((n, i) => {
    serif(g, n, xs[i], 320, 53, colors[i], { align: 'center' });
    mono(g, fixed(scores[i], 3), xs[i], 417, 44, C.ink, { align: 'center' });
  });
  text(g, 'Cosine score', 89, 416, 39);
  if (masses) {
    text(g, isLoss ? 'Working mass' : b < 2 ? 'Exp weight' : b === 2 ? 'Puppy + sky mass' : 'With sleeper · mass', 89, 525, 39);
    row.masses.forEach((v, i) => {
      mono(
        g,
        enabled[i] ? fixed(v, 4) : 'outside',
        xs[i],
        526,
        43,
        enabled[i] ? colors[i] : C.soft,
        { align: 'center' },
      );
    });
  }
  rule(g, 88, 575, 1730);
  if (isLoss) {
    const strip = (label, r, y) => {
      text(g, label, 88, y + 34, 36);
      shareStrip(g, 417, y, 855, 48, r.probs);
      mono(g, 'L = ' + fixed(r.loss, 4), 1353, y + 40, 43);
    };
    strip('All three', full, 640);
    strip('Working row', row, 748);
    if (b >= 3) {
      text(g, 'Score derivatives', 90, 925, 35);
      row.gradients.forEach((v, i) =>
        mono(g, (v > 0 ? '+' : '') + fixed(v, 3), xs[i], 927, 41, v < 0 ? C.sea : C.rust, {
          align: 'center',
        }),
      );
    } else
      mono(
        g,
        'Puppy    1 / ' + fixed(row.sum, 4) + ' = ' + pct(row.probs[0]) + '     L = −ln(share)',
        88,
        937,
        38,
        C.sea,
      );
  } else if (ready) {
    const base = comparisonRow(scores, 0.2, 0, [true, false, true]);
    text(g, 'Puppy + sky', 89, 670, 36);
    mono(g, '1 ÷ ' + fixed(base.sum, 4), 1319, 635, 38);
    if (cue(k, 2, 'its share is about')) {
      shareStrip(g, 425, 622, 835, 58, base.probs);
      mono(g, pct(base.probs[0]) + ' puppy', 1319, 689, 40, C.sea);
    }
    if (cue(k, 3, 'Now admit')) {
      text(g, 'With sleeper', 89, 798, 36);
      if (cue(k, 4, 'only fifty-seven')) {
        shareStrip(g, 425, 749, 835, 58, row.probs);
        mono(g, '1 ÷ ' + fixed(row.sum, 4), 1319, 762, 38);
        mono(g, pct(row.probs[0]) + ' puppy', 1319, 816, 40, C.sea);
      } else {
        stroke(
          g,
          [
            [425, 806],
            [1260, 806],
          ],
          C.line,
          3,
          [12, 13],
        );
        text(g, 'Predict the puppy’s share', 466, 790, 36, C.soft);
      }
      mono(g, 'With sleeper   ' + fixed(row.masses[0], 4) + ' ÷ (' +
        row.masses.map((v) => fixed(v, 4)).join(' + ') + ')', 89, 942, 42);
    }
  } else if (b === 1) {
    if (!cue(k, 1, 'Subtracting the same value')) {
      const peak = Math.max(...scores);
      const leader = scores.indexOf(peak);
      if (cue(k, 1, 'Start with the highest score')) {
        const x = xs[leader];
        stroke(g, [[x - 76, 438], [x + 76, 438]], colors[leader], 6);
      }
      if (cue(k, 1, 'Subtract it')) {
        let working = fixed(peak, 3) + ' − ' + fixed(peak, 3) + ' = 0';
        if (cue(k, 1, 'then exponentiate')) working += '   →   exp(0 / 0.20)';
        if (masses) working += ' = ' + fixed(row.masses[leader], 0);
        serif(g, archive[leader], 89, 673, 51, colors[leader]);
        mono(g, working, 390, 673, 49, colors[leader]);
      }
    }
    mono(g, 'mass = exp((score − peak) / 0.20)', 89, 773, 52, C.sea);
  }
}

export function numerics(g, k) {
  const b = k.beat.beatIndex,
    rev = b === 7 ? cue(k, 7, 'Reverse the scores') : cue(k, 2, 'Swap the scores'),
    huge = b === 4,
    first = rev ? [0.2, 0.9] : [0.9, 0.2],
    row = comparisonRow(huge ? [1e308, 1e308] : first, huge ? 1 : 0.05),
    t = huge ? 1 : 0.05;
  if (b === 3) {
    title(
      g,
      'Compute a row loss without overflow',
      'Only admitted candidates  /  one designated positive  /  positive temperature',
    );
    [
      ['Scale', 'logits = scores / τ'],
      ['Center', 'm = max(logits)'],
      ['Accumulate', 'S = Σ exp(logit − m)'],
      ['Recover loss', 'L = ln(S) + (m − positive logit)'],
    ].forEach(([s, v], i) => {
      const y = 349 + i * 152;
      serif(g, s, 96, y, 48);
      mono(g, v, 590, y, 44, i === 3 ? C.sea : C.ink);
      rule(g, 96, y + 42, 1690);
    });
    return;
  }
  if (b === 5) {
    title(g, 'Normalize a tiny vector', 'Scale first, then measure length');
    const scale = finiteUnit([1e-300, 1e-300]);
    [
      ['Input', '[1e-300, 1e-300]'],
      ['Divide by largest magnitude', '[1, 1]'],
      ['Divide by √2', '[' + scale.map((v) => fixed(v, 3)).join(', ') + ']'],
    ].forEach(([s, v], i) => {
      const y = 360 + i * 186;
      serif(g, s, 90, y, 48);
      mono(g, v, 1090, y, 52, C.sea);
      rule(g, 90, y + 47, 1690);
    });
    text(g, 'Requires a finite, nonzero vector.', 90, 970, 36, C.soft);
    return;
  }
  if (b === 6) {
    title(g, 'Train both directions?', 'One target per query row');
    ['Query A', 'Query B'].forEach((v, i) => {
      const y = 420 + i * 183;
      serif(g, v, 155, y, 62);
      arrow(g, 485, y - 17, 1090, y - 17, C.sea);
      serif(g, 'Passage ' + (i ? 'B' : 'A'), 1190, y, 62);
    });
    if (cue(k, 6, 'reverse direction')) {
      [0, 1].forEach((i) => arrow(g, 1090, 458 + i * 183, 485, 458 + i * 183, C.rust));
      text(g, 'Each passage needs its paired query label.', 155, 890, 44, C.rust);
    }
    return;
  }
  title(
    g,
    huge
      ? 'Two enormous tied logits'
      : b === 7
        ? 'Which score does descent raise?'
        : 'Work one candidate row',
    'Target A  /  temperature ' + fixed(t),
  );
  const fields = [
    ['Score', huge ? ['1e308', '1e308'] : first.map((x) => fixed(x, 2))],
    ['Logit', huge ? ['1e308', '1e308'] : row.logits.map((v) => fixed(v, 0))],
    ['Subtract peak', row.centered.map((v) => fixed(v, 0))],
    ['Exp mass', row.masses.map((v) => (v === 1 ? '1' : v.toExponential(2)))],
    ['Share', row.probs.map((v) => fixed(v, 7))],
  ];
  if (b === 7)
    fields.splice(
      2,
      2,
      ['Target', [1, 0]],
      [
        'Score derivative',
        row.gradients.map((v) =>
          Math.abs(v) > 0 && Math.abs(v) < 0.001 ? v.toExponential(3) : fixed(v, 4),
        ),
      ],
    );
  mono(g, 'A  /  target', 708, 292, 35, C.sea);
  mono(g, 'B', 1305, 292, 35, C.rust);
  fields.forEach(([s, vs], i) => {
    if (
      b === 0 &&
      (i === 4 ||
        (i === 3 && !cue(k, 0, 'Exponentiate them')) ||
        (i === 2 && !cue(k, 0, 'Subtract their maximum')) ||
        (i === 1 && !cue(k, 0, 'those logits')))
    )
      return;
    const y = 324 + i * 101;
    text(g, s, 95, y + 51, 39);
    vs.forEach((v, j) => cell(g, 580 + j * 567, y, 524, 78, v, j ? C.white : C.pale, C.ink, 42));
  });
  if (b > 0)
    mono(
      g,
      'Loss  ' + (huge ? 'ln 2 = ' + fixed(row.loss, 4) : fixed(row.loss, 7)) + ' nats',
      91,
      944,
      48,
      C.sea,
    );
}
export function margin(g, k) {
  const moved = cue(k, 1, 'Move the positive'),
    p = moved ? 0.5 : 0.2,
    n = moved ? 0.3 : 0.5,
    m = 0.1,
    x = (v) => 220 + 2200 * v;
  title(g, 'Measure a distance gap', 'Distance increases to the right  /  margin 0.10');
  for (let i = 0; i <= 7; i++) {
    const u = x(i / 10);
    stroke(
      g,
      [
        [u, 480],
        [u, 520],
      ],
      C.soft,
      3,
    );
    mono(g, fixed(i / 10, 1), u, 572, 34, C.soft, { align: 'center' });
  }
  stroke(
    g,
    [
      [x(0), 500],
      [x(0.7), 500],
    ],
    C.ink,
    5,
  );
  const marker = (v, name, y, col) => {
    stroke(
      g,
      [
        [x(v), y],
        [x(v), 500],
      ],
      col,
      4,
    );
    circle(g, x(v), 500, 13, col);
    serif(g, name + '  ' + fixed(v, 2), x(v), y + (y > 500 ? 54 : -18), 45, col, {
      align: 'center',
    });
  };
  marker(p, 'Positive', 373, C.sea);
  marker(n, 'Negative', 674, C.rust);
  stroke(
    g,
    [
      [x(p), 437],
      [x(p + m), 437],
      [x(p + m), 473],
    ],
    C.gold,
    6,
  );
  mono(g, '+ margin', x(p + m / 2), 411, 26, C.gold, { align: 'center' });
  const result = !moved || cue(k, 1, 'loss is point three');
  mono(g, 'max(0, ' + fixed(p) + ' − ' + fixed(n) + ' + 0.10)', 114, 912, 50);
  if (result) mono(g, '= ' + fixed(triplet(p, n, m)), 1320, 912, 64, C.sea);
  if (k.beat.beatIndex === 2 && cue(k, 2, 'squared Euclidean'))
    text(
      g,
      'Squared Euclidean would place these same points at distances 0.25 and 0.09.',
      115,
      999,
      33,
      C.soft,
    );
}
export function temperature(g, k) {
  const b = k.beat.beatIndex;
  if (b >= 3) {
    const gap = 0.72 - 0.2,
      ratio = Math.exp(gap / 0.05);
    title(g, 'Two negatives in the same row', 'Shared denominator  /  temperature 0.05');
    [
      ['Higher score', 0.72],
      ['Lower score', 0.2],
    ].forEach(([s, v], i) => {
      const y = 370 + i * 150;
      serif(g, s, 100, y + 52, 55);
      bar(g, 677, y, 850, 64, v, C.rust);
      mono(g, fixed(v), 1590, y + 52, 51);
    });
    mono(g, 'Pressure ratio = exp((0.72 − 0.20) / 0.05)', 100, 777, 47);
    if (b === 4)
      serif(
        g,
        '≈ ' + Math.round(ratio).toLocaleString('en-US') + ' times the pressure',
        100,
        923,
        68,
        C.rust,
      );
    return;
  }
  const last = cue(k, 2, 'At one hundredth')
    ? 3
    : cue(k, 1, 'Halve the temperature')
      ? 2
      : cue(k, 1, 'Lower the temperature')
        ? 1
        : 0;
  title(g, 'Does colder mean a stronger update?', 'A fixed two-caption gap  /  0.90 − 0.20 = 0.70');
  ['Temperature', 'Positive share', '|∂L/∂s positive|'].forEach((s, i) =>
    text(g, s, [90, 645, 1250][i], 326, 39, C.soft),
  );
  [1, 0.1, 0.05, 0.01].slice(0, last + 1).forEach((t, i) => {
    const y = 423 + i * 117,
      p = pairAt(t);
    mono(g, fixed(t), 90, y, 48);
    bar(g, 652, y - 41, 275, 43, p.prob, C.sea);
    mono(g, pct(p.prob, 3), 950, y, 36);
    mono(g, p.g < 0.0001 ? p.g.toExponential(3) : fixed(p.g, 5), 1250, y, 47, C.rust);
    rule(g, 90, y + 44, 1650);
  });
  mono(g, 'Positive share = 1 / (1 + exp(−gap / τ))', 90, 883, 35, C.soft);
  mono(
    g,
    '|gradient| = competitor share / τ     (one positive, one negative)',
    90,
    958,
    35,
    C.soft,
  );
}
