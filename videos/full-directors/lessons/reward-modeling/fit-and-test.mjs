import {
  C,
  stage,
  text,
  mono,
  serif,
  header,
  paper,
  rect,
  line,
  dot,
  table,
  share,
  lerp,
  fixed,
} from './art.mjs';
import {
  scores,
  fits,
  features,
  training,
  reviewText,
  grantText,
  extra,
  scorePair,
  testWins,
  CONTROLLED_PAIRS,
  candidateForecast,
  centered,
  perVote,
  brier,
  tally,
  reversalLengths,
  lengthCases,
  staticAccuracy,
  freshAccuracy,
} from './examples.mjs';
function replyPair(g, x, y, name, body, w = 401) {
  paper(g, x, y, w, 63);
  mono(g, name, x + 13, y + 39, 20, C.teal);
  serif(g, body, x + 49, y + 39, 23, C.ink, { width: w - 62 });
}
export function fitHead(g, { beat, cue }) {
  stage(g);
  if (beat === 1) {
    header(g, 'TWO HAND-BUILT FEATURES', 'What can this little scorer see?', true);
    replyPair(g, 58, 174, 'A', reviewText, 414);
    replyPair(g, 490, 174, 'D', grantText, 406);
    const f = [features(reviewText, true), features(grantText, false)];
    for (let i = 0; i < 2; i++) {
      const x = 60 + 432 * i;
      mono(g, 'COMPLIANCE   ' + f[i][0], x, 301, 23, C.aqua);
      mono(g, 'LENGTH       ' + f[i][1], x, 357, 23, C.accent);
    }
    mono(g, 'length = (word count − 3) / 2', 58, 443, 23, C.light);
  } else if (beat <= 5) {
    header(
      g,
      'FIT FROM ZERO   /   SAME TWO REVIEWER CHOICES',
      'Change the length of one winning reply',
      true,
    );
    const shortened = cue(2, 'Shorten the second winner'),
      steps = beat < 4 ? 0 : Math.floor(300 * cue(4, 'Run three hundred gradient steps', 2.3));
    const x0 = 47,
      dx = 444;
    for (const i of [0, 1]) {
      const k = i && shortened ? 1 : 0,
        x = x0 + dx * i,
        rows = training[k],
        w = fits[k].trajectory[steps];
      paper(g, x, 146, 423, 262);
      mono(g, i ? 'COPY' : 'ORIGINAL', x + 16, 174, 17, C.teal);
      text(g, 'Winner − other', x + 16, 210, 22);
      rows.forEach(([a, b], j) => {
        const y = 253 + j * 55;
        mono(g, 'Pair ' + (j + 1), x + 16, y, 20);
        mono(g, 'rule +' + (a[0] - b[0]), x + 115, y, 20, C.teal);
        const dif = a[1] - b[1];
        mono(g, 'length ' + (dif > 0 ? '+' : '') + dif, x + 249, y, 20, dif < 0 ? C.red : C.ink);
      });
      line(g, x + 16, 329, x + 406, 329, C.edge);
      mono(g, 'Weights  [' + fixed(w[0]) + ', ' + fixed(w[1]) + ']', x + 16, 376, 23);
    }
    if (beat === 2) {
      serif(
        g,
        shortened
          ? 'Second winner now reads “I’ll await approval.”'
          : 'Second winner: “I’ll await approval. Access will stay blocked.”',
        53,
        456,
        24,
        C.cream,
        { width: 851 },
      );
    } else if (beat === 3)
      mono(g, 'Zero-weight length pulls:    ↑ ↑            ↑ ↓', 53, 456, 22, C.aqua);
    else
      mono(
        g,
        'Step ' + steps + ' / 300      η = 0.1      L2 coefficient = 0.02',
        53,
        456,
        21,
        C.aqua,
      );
  } else if (beat <= 9) {
    header(
      g,
      'HELD-OUT MIGRATION   /   APPROVAL PENDING',
      'Which head picks the longer violation?',
      true,
    );
    replyPair(g, 52, 145, 'A', reviewText, 400);
    replyPair(g, 52, 238, 'D', grantText, 400);
    const p = cue(6, 'Unfold D', 0.85),
      full = p === 1;
    if (p > 0) {
      const w = 409 * p;
      paper(g, 448, 238, w, 63, '#ffdeb0');
      g.save();
      g.beginPath();
      g.rect(448, 238, w, 63);
      g.clip();
      serif(g, extra, 465, 279, 24, C.ink, { width: 378 });
      g.restore();
    }
    mono(g, 'A   [1, 0]', 501, 188, 24, C.aqua);
    mono(g, 'D   [0, ' + (full ? '2' : p ? '…' : '0') + ']', 57, 338, 22, C.accent);
    const known = [cue(8, 'picks D'), cue(8, 'picks A')];
    for (const i of [0, 1]) {
      const x = 53 + i * 448,
        [a, d] = scorePair(fits[i].weights, CONTROLLED_PAIRS[0]);
      mono(g, i ? 'ONE SHORTER WINNER' : 'BOTH WINNERS LONGER', x, 378, 17, C.gray);
      mono(
        g,
        'Weights  [' + fits[i].weights.map((v) => fixed(v)).join(', ') + ']',
        x,
        411,
        19,
        C.cream,
      );
      mono(
        g,
        known[i]
          ? 'A ' + fixed(a) + '   D ' + fixed(d) + '   → ' + (a > d ? 'A' : 'D')
          : 'A ?      D ?',
        x,
        458,
        24,
        known[i] ? C.aqua : C.light,
      );
    }
  } else {
    header(g, 'THREE CONTROLLED PAIRS', 'Keep approval fixed and vary the lengths', true);
    const ready = cue(10, 'The left head gets'),
      names = ['Longer violation', 'Even longer violation', 'Equal lengths'];
    table(g, {
      columns: [
        ['Held-out pair', 0],
        ['A · D length', 0.34],
        ['Long winners', 0.58],
        ['Mixed winners', 0.8],
      ],
      rows: CONTROLLED_PAIRS.map((p, i) => [
        names[i],
        p.map((v) => v[1]).join('  ·  '),
        ...fits.map((f) => (ready ? (testWins(f.weights)[i] ? 'A wins' : 'D wins') : '?')),
      ]),
      headingColor: C.gray,
      ink: C.light,
      lineHeight: 66,
    });
    if (ready) mono(g, 'Compliant A wins', 52, 437, 23, C.aqua);
    if (ready)
      mono(
        g,
        testWins(fits[0].weights).filter(Boolean).length +
          '/3             ' +
          testWins(fits[1].weights).filter(Boolean).length +
          '/3',
        554,
        437,
        23,
        C.aqua,
      );
  }
}
export function origin(g, { beat, cue }) {
  stage(g, true);
  header(g, 'SAME REWARD AXIS   /   A AND B', 'Move the origin, then change the scale');
  const add = cue(1, 'Add ten', 1.45),
    back = cue(2, 'Slide back', 1.15),
    scale = cue(3, 'Triple both scores', 1.35);
  const pair = scores.map((v) => v * (1 + 2 * scale) + 10 * add * (1 - back)),
    s = candidateForecast(pair);
  const X = (v) => 67 + v * 69;
  line(g, X(0), 279, X(12), 279, C.ink, 3);
  for (let i = 0; i <= 12; i++) {
    line(g, X(i), 275, X(i), 290, C.muted, 1);
    if (!(i % 2)) mono(g, i, X(i), 316, 17, C.muted, { align: 'center' });
  }
  const [a, b] = pair;
  line(g, X(b), 205, X(a), 205, C.teal, 3);
  [a, b].forEach((v) => line(g, X(v), 197, X(v), 214, C.teal, 3));
  mono(g, 'score gap', Math.min(855, (X(a) + X(b)) / 2), 176, 18, C.teal, { align: 'center' });
  pair.forEach((v, i) => {
    const y = i ? 352 : 245;
    dot(g, X(v), 279, 8, i ? C.red : C.teal);
    mono(g, (i ? 'B ' : 'A ') + fixed(v, 2), X(v), y, 19, i ? C.red : C.teal, { align: 'center' });
  });
  if (beat >= 2)
    mono(
      g,
      'Δ = ' +
        fixed(s.gap) +
        '       p(A) = ' +
        fixed(s.p, 4) +
        '       loss = ' +
        fixed(s.loss, 4),
      56,
      429,
      23,
    );
  else mono(g, 'A and B both move +10', 56, 429, 24);
}
export function center(g, { beat, cue }) {
  stage(g, true);
  if (beat <= 4) {
    header(
      g,
      'PAIR CENTERING   /   γ × MEAN((rA + rB)²)',
      'The midpoint can stay still as scores separate',
    );
    const far = cue(2, 'plus one hundred', 1.4),
      v = lerp(1, 100, far),
      mid = (v - v) / 2;
    const X = (n) => 480 + 3.8 * n;
    line(g, 69, 272, 893, 272, C.muted, 3);
    dot(g, X(mid), 272, 9, C.ink);
    [v, -v].forEach((q, i) => {
      const col = i ? C.red : C.teal,
        yy = i ? 338 : 209;
      line(g, X(q), 272, X(q), yy + (i ? -29 : 10), col, 2);
      dot(g, X(q), 272, 7, col);
      mono(g, (i ? 'B ' : 'A ') + fixed(q, 1), X(q), yy, 22, col, { align: 'center' });
    });
    mono(g, 'midpoint 0', 480, 311, 19, C.muted, { align: 'center' });
    mono(
      g,
      'Margin ' + fixed(2 * v, 1) + '       Pair penalty ' + centered(v, -v, 0.01) + '  (γ = 0.01)',
      59,
      411,
      23,
    );
    if (beat === 3) text(g, 'TRL 1.17.1 disables centering by default.', 58, 462, 21, C.teal);
    if (beat === 4)
      text(
        g,
        'Separate scorers: [1, 2] and [101, 102] give the same pair margin.',
        58,
        462,
        21,
        C.teal,
      );
  } else {
    header(
      g,
      'IDEAL OBJECTIVE   /   FIXED REFERENCE POLICY',
      'What changes when every reward triples?',
    );
    paper(g, 54, 157, 851, 200);
    mono(g, '3 E[r] − β KL', 80, 230, 37);
    if (cue(5, 'Factor three')) mono(g, '= 3 × ( E[r] − (β / 3) KL )', 80, 312, 32, C.teal);
    if (cue(5, 'same policy'))
      text(
        g,
        'Same maximizer with original rewards and a third of the KL coefficient.',
        57,
        414,
        23,
        C.ink,
        { width: 846 },
      );
    if (beat === 6)
      mono(
        g,
        'PPO also depends on clipping, normalization, data and budget.',
        57,
        461,
        18,
        C.muted,
      );
  }
}
export function calibration(g, { beat, cue, clock }) {
  stage(g);
  header(
    g,
    'BRIER SCORE   /   A AND B FIXED BEFORE VOTING',
    'Which forecast fits these four votes?',
    true,
  );
  function after(n, phrase) {
    if (beat !== n) return beat > n;
    const { start, end } = clock.wordCue(phrase);
    return clock.reveal(phrase, end - start, { captionStart: phrase }) === 1;
  }
  const voted = after(1, 'Three choose A and one chooses B');
  const targetB = beat > 3 || (beat === 3 && clock.reveal(
    'target for A is zero', 0, { captionStart: 'The target for A is zero' },
  ));
  const confidentMiss = after(3, 'point nine eight zero one');
  const smallerMiss = after(3, 'The point seven five forecast pays a smaller penalty there');
  const votesForA = after(4, 'where the target is one');
  const computing = cue(5, 'For each forecast');
  const answered = after(5, 'The lower score goes to point seven five');
  cue(5, 'and check how the forecasts match each group');
  const cols = [242, 342, 442, 542];
  const forecasts = [0.75, 0.99];
  const side = 66, railX = 659, railWidth = 226, railMax = 0.25;
  tally.forEach((y, i) => {
    paper(g, cols[i] - 34, 139, 68, 43, voted ? (y ? C.aqua : C.accent) : C.page);
    mono(g, voted ? (y ? 'A' : 'B') : '·', cols[i], 168, 23, C.ink, { align: 'center' });
  });
  mono(g, 'Brier score', railX, 150, 22, C.light);
  mono(g, computing ? 'Mean of four squares' : 'Lower is better', railX, 177, 16, C.gray);
  for (const [i, unit] of ['0', '0.125', '0.25'].entries()) {
    const x = railX + (i * railWidth) / 2;
    mono(g, unit, x, 211, 15, C.gray, { align: 'center' });
    line(g, x, 215, x, 221, C.gray, 1);
  }
  const emphasizeMiss = cue(5, 'The one confident miss', 0.35);
  forecasts.forEach((p, j) => {
    const Y = 203 + j * 103;
    mono(g, 'p(A) ' + fixed(p), 48, Y + 37, 24, C.light);
    if (voted) mono(g, '3 / 4 correct', 48, Y + 66, 16, C.gray);
    const errors = perVote(p);
    errors.forEach((e, i) => {
      const x = cols[i] - side / 2;
      const miss = !tally[i];
      g.strokeStyle = miss && targetB ? C.accent : '#8c8eaa';
      g.lineWidth = 1.8;
      g.strokeRect(x, Y, side, side);
      const show = miss ? (j ? confidentMiss : smallerMiss) : votesForA;
      if (show) {
        const length = side * Math.sqrt(e);
        const color = miss ? C.accent : C.aqua;
        rect(g, x, Y + side - length, length, length, color);
        mono(g, fixed(e, 4), cols[i], Y + 90, 18, C.light, { align: 'center' });
      }
    });

    const barY = Y + 26;
    rect(g, railX, barY, railWidth, 20, '#191c3b', 2);
    if (!answered) {
      mono(g, '?', railX, Y + 79, 28, C.gray);
      return;
    }
    let edge = railX;
    errors.forEach((error, i) => {
      const width = (error / tally.length / railMax) * railWidth;
      rect(g, edge, barY, width, 20, tally[i] ? C.aqua : C.accent);
      if (!tally[i] && emphasizeMiss)
        line(g, edge, barY - 6, edge + width * emphasizeMiss, barY - 6, C.accent, 2.5);
      edge += width;
    });
    line(g, edge, barY + 20, edge, Y + 54, C.light, 1.5);
    mono(g, fixed(brier(p), 4), railX, Y + 79, 29, j === 0 ? C.aqua : C.light);
    if (j === 0) mono(g, 'lower', railX + 122, Y + 76, 18, C.aqua);
  });
  if (targetB)
    mono(g, 'Each area is (forecast − vote target)²', 51, 418, 19, C.light);
}
export function correction(g, { beat, cue }) {
  stage(g, true);
  if (beat <= 4) {
    header(
      g,
      'LENGTH-ONLY SCORE   /   POSITIVE TRAINING GAP',
      'Can a training margin erase a length shortcut?',
    );
    mono(g, 'z = (b − α) × length gap     α = 1     gap = 1', 57, 160, 22, C.teal);
    const n = cue(3, 'then six')
      ? 3
      : cue(3, 'Raise the weight to three')
        ? 2
        : cue(3, 'At length weight zero')
          ? 1
          : 0;
    const last = lengthCases.at(-1);
    if (beat === 4) {
      rect(g, 44, 313, 870, 41, '#f6dca1', 4);
      const focusX = cue(4, 'What scores') ? 609 : cue(4, 'The training loss') ? 420 : 49;
      line(g, focusX, 349, focusX + 91, 349, C.teal, 3);
    }
    table(g, {
      y: 196,
      columns: [
        ['Weight b', 0],
        ['Logit z', 0.21],
        ['Train loss', 0.43],
        ['Reversed test pair', 0.65],
      ],
      rows: lengthCases.map((v, i) => [
        v.b,
        i < n ? v.logit : '…',
        i < n ? fixed(v.loss, 3) : '…',
        i < n ? (v.test[0] === v.test[1] ? 'Tie' : 'Longer error wins') : '…',
      ]),
      lineHeight: 48,
    });
    if (n) {
      const useWeight = cue(4, 'What scores');
      // Each span ends with the score word in the measured course take.
      const scoreWord = [cue(4, 'zero', 0.575), cue(4, 'twelve', 0.625)];
      reversalLengths.forEach((length, i) => {
        const x = 49 + i * 440;
        const color = i ? C.red : C.teal;
        paper(g, x, 371, 416, 95);
        if (scoreWord[i] > 0) line(g, x + 2, 375, x + 2, 462, color, 4);
        text(g, i ? 'Longer error' : 'Short correct reply', x + 13, 398, 23);
        mono(g, 'Scaled length ' + length, x + 14, 425, 17, C.muted);
        const product = (useWeight ? last.b : 'b') + ' × ' + length;
        const result = useWeight ? ' = ' + (scoreWord[i] === 1 ? last.test[i] : '?') : '';
        mono(g, 'Score  ' + product + result, x + 14, 453, 23, color);
      });
    }
  } else {
    header(g, 'CONTROLLED COMPARISONS', 'Cross answer quality with presentation');
    const labels = [
      ['Brief and useful', 'Detailed and necessary'],
      ['Brief error', 'Verbose error'],
    ];
    labels.forEach((row, i) =>
      row.forEach((v, j) => {
        const x = 53 + j * 438,
          y = 161 + i * 117;
        paper(g, x, y, 414, 95, i ? C.coral : C.aqua);
        serif(g, v, x + 20, y + 56, 30);
      }),
    );
    mono(
      g,
      beat === 5
        ? 'Repeat with agreement and formatting; keep quality identifiable.'
        : 'List formatting in one study: ~8% in preference data → ~50% in outputs',
      52,
      454,
      19,
      C.muted,
      { width: 853 },
    );
  }
}
export function fresh(g, { beat, cue }) {
  stage(g);
  if (beat === 1) {
    header(
      g,
      'RANKING ACCURACY   /   ILLUSTRATIVE',
      'What changes when the writer supplies new pairs?',
      true,
    );
    for (const [i, v] of [staticAccuracy, freshAccuracy].entries()) {
      const y = 181 + i * 140;
      mono(g, i ? 'FRESH POLICY OUTPUTS' : 'STORED PAIRS', 57, y, 19, C.gray);
      const visible = cue(1, i ? 'sixty-four' : 'ninety-two');
      rect(g, 58, y + 21, 704, 36, '#161c33', 4);
      if (visible) {
        rect(g, 58, y + 21, 704 * v, 36, i ? C.accent : C.aqua, 4);
        mono(g, share(v), 783, y + 52, 33, C.light);
      }
    }
  } else {
    header(
      g,
      'SCHEMATIC   /   TWO LEARNED SCORERS',
      'Track the same policy updates on both scorers',
      true,
    );
    const p = 0.48 * cue(2, 'Early on', 1.2) + 0.52 * cue(2, 'Then the proxy', 2);
    const X = (t) => 81 + 625 * t,
      Y = (v) => 412 - 232 * v;
    line(g, 80, 164, 80, 413, C.gray, 2);
    line(g, 80, 413, 723, 413, C.gray, 2);
    const proxy = (t) => 0.12 + 0.84 * t,
      gold = (t) => 0.13 + 0.96 * t - 1.3 * Math.max(0, t - 0.52);
    for (const [f, col, label] of [
      [proxy, C.accent, 'Proxy'],
      [gold, C.aqua, 'Larger gold model'],
    ]) {
      g.beginPath();
      for (let k = 0; k <= 75; k++) {
        const t = (p * k) / 75;
        if (k) g.lineTo(X(t), Y(f(t)));
        else g.moveTo(X(t), Y(f(t)));
      }
      g.strokeStyle = col;
      g.lineWidth = 4;
      g.stroke();
      dot(g, X(p), Y(f(p)), 6, col);
      mono(g, label, 730, label === 'Proxy' ? 198 : 335, 18, col, { width: 220 });
    }
    mono(g, 'reward', 80, 152, 16, C.gray);
    mono(g, 'policy optimization →', 81, 455, 21, C.gray);
    if (cue(2, 'Human review'))
      text(g, 'Check fresh answers with people and task tests.', 490, 465, 20, C.light, {
        width: 418,
      });
  }
}
