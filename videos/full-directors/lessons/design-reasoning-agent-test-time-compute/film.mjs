import {
  advice,
  canSend,
  cells,
  checkExamples,
  completed,
  countOutcomes,
  coverage,
  current,
  draftC,
  draftF,
  eligibleRoute,
  evals,
  finalLedger,
  flawSet,
  frontier,
  history,
  hopChecks,
  inspectSteps,
  kv,
  kvSize,
  leases,
  mainLedger,
  maxObservationAge,
  nextVisitOutcome,
  pins,
  plateau,
  queueState,
  rate,
  responseFields,
  routes,
  solverSet,
  steps,
  validFields,
  visits,
} from './examples.mjs';

const ink = '#172e31',
  dark = '#122d31',
  paper = '#f2eee1',
  cream = '#fff9e7',
  faint = '#dad7c8',
  teal = '#00685e',
  aqua = '#8fe0c3',
  gold = '#ffcf77',
  copper = '#a34a30',
  coral = '#ffab8d',
  slate = '#50615f',
  pale = '#b6cbc0',
  blue = '#a6c5ed',
  plum = '#644a72';
const num = (x) => x.toLocaleString('en-US');
const fixed = (x) => x.toFixed(2);
const lerp = (a, b, t) => a + (b - a) * t;
function box(g, x, y, w, h, color, r = 0, edge = '', lineWidth = 1) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = color;
  g.fill();
  if (edge) {
    g.strokeStyle = edge;
    g.lineWidth = lineWidth;
    g.stroke();
  }
}
function txt(g, s, x, y, size = 22, color = ink, font = 'Sans', align = 'left', weight = 400) {
  g.fillStyle = color;
  g.font = weight + ' ' + size + 'px "Lesson ' + font + '"';
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(String(s), x, y);
}
function ln(g, x, y, X, Y, col, width = 2, dash = []) {
  g.save();
  g.strokeStyle = col;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.setLineDash(dash);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(X, Y);
  g.stroke();
  g.restore();
}
function dot(g, x, y, r, fill, edge = '', w = 2) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  if (edge) {
    g.strokeStyle = edge;
    g.lineWidth = w;
    g.stroke();
  }
}
function fade(g, value, draw) {
  if (value <= 0) return;
  g.save();
  g.globalAlpha *= value;
  draw();
  g.restore();
}
function screw(g, x, y) {
  dot(g, x, y, 4, '#b2b4a7', '#596e66', 1);
  ln(g, x - 2, y + 1, x + 2, y - 1, '#596e66', 1);
}
function face(g, x, y, w, h) {
  box(g, x + 2, y + 5, w, h, '#c2c1b2', 16);
  box(g, x, y, w, h, dark, 16, '#455d5b', 3);
  for (const dx of [12, w - 12]) for (const dy of [12, h - 12]) screw(g, x + dx, y + dy);
}
function heading(g, unit, title) {
  txt(g, unit, 48, 38, 18, teal, 'Mono');
  txt(g, title, 46, 89, 44, ink, 'Serif');
  ln(g, 48, 124, 1152, 124, '#acb7ac', 1.5);
}
function result(g, text, color = ink) {
  ln(g, 49, 573, 1151, 573, '#adb8ad');
  txt(g, text, 49, 605, 29, color, 'Serif');
}
function mark(g, x, y, success, color = success ? aqua : coral) {
  if (success) {
    ln(g, x - 7, y, x - 2, y + 6, color, 3);
    ln(g, x - 2, y + 6, x + 9, y - 8, color, 3);
  } else {
    ln(g, x - 6, y - 6, x + 6, y + 6, color, 3);
    ln(g, x - 6, y + 6, x + 6, y - 6, color, 3);
  }
}
function cue(clock, beat, phrase, span = 0.55) {
  const b = clock.beat.beatIndex;
  if (b !== beat) return b > beat ? 1 : 0;
  return clock.reveal(phrase, span);
}
function on(clock, beat, phrase) {
  return cue(clock, beat, phrase, 0) > 0;
}
function after(clock, beat, phrase) {
  const b = clock.beat.beatIndex;
  return b === beat ? clock.elapsed >= clock.wordCue(phrase).end : b > beat;
}

// A single stamped observation is carried through the trace, policy replay and deadline.
function trace(g, c, policyChapter) {
  const b = c.beat.beatIndex;
  if (policyChapter && b === 4) {
    responseField(g, c);
    return;
  }
  if (policyChapter && b === 3 && on(c, 3, 'The tool now returns')) {
    wrongRevision(g, c);
    return;
  }
  const boundary = policyChapter && on(c, 0, 'Put the final reading');
  const now = !policyChapter
    ? 110
    : on(c, 2, 'Advance one more second')
      ? 131
      : on(c, 2, 'Advance the clock')
        ? 130
        : 110;
  const record = { ...current, ms: boundary ? 300 : current.ms };
  const reading = advice(record, now);
  const overlay = policyChapter ? 1 : cue(c, 2, 'Lay the policy bands', 0.9);
  const located = policyChapter || after(c, 1, 'Revision seven, at second one hundred');
  const measured = policyChapter || after(c, 1, 'two hundred forty milliseconds');
  const aged = policyChapter || after(c, 1, 'the reading is ten seconds old');
  const freshnessKnown = policyChapter || after(c, 1, 'up to thirty seconds old');
  const answer = policyChapter
    ? (b === 0 && !boundary) ||
      (b >= 1 && b <= 2 && now <= 130) ||
      (b === 3 && on(c, 3, 'and request a fresh measurement'))
    : after(c, 3, 'Hold the canary at ten percent');
  heading(
    g,
    'checkout-42   /   canary telemetry',
    policyChapter ? 'Does this receipt still qualify?' : 'What does the latest dot tell the owner?',
  );
  face(g, 48, 154, 739, 388);
  const x0 = 126,
    x1 = 709,
    yt = 217,
    yb = 449;
  const xx = (t) => lerp(x0, x1, (t - 80) / 20),
    yy = (v) => lerp(yb, yt, (v - 100) / 250);
  txt(g, 'Canary p95 latency', 76, 185, 22, cream, 'Serif');
  txt(g, 'milliseconds', 753, 186, 15, pale, 'Mono', 'right');
  fade(g, overlay, () => {
    for (const [lo, hi, col] of [
      [100, 200, '#214b42'],
      [200, 300, '#584c32'],
      [300, 350, '#583d39'],
    ])
      box(g, x0, yy(hi), x1 - x0, yy(lo) - yy(hi), col);
  });
  for (const v of [100, 150, 200, 250, 300, 350]) {
    ln(g, x0, yy(v), x1, yy(v), '#64756c', 1, [2, 6]);
    txt(g, v, x0 - 12, yy(v), 15, pale, 'Mono', 'right');
  }
  for (const t of [80, 85, 90, 95, 100]) {
    ln(g, xx(t), yt, xx(t), yb, '#536760', 1, [2, 6]);
    txt(g, t + ' s', xx(t), yb + 22, 15, pale, 'Mono', 'center');
  }
  // All intermediate samples illustrate the lead-up. Only the signed endpoint enters policy.
  const samples = [
    133,
    136,
    132,
    142,
    137,
    143,
    141,
    139,
    138,
    143,
    140,
    148,
    152,
    170,
    177,
    199,
    205,
    223,
    218,
    230,
    record.ms,
  ];
  const leadIn = Math.min(0.9, 0.68 + c.elapsed * 0.13);
  const sweep = policyChapter ? 1 : lerp(leadIn, 1, cue(c, 0, 'Follow the latency trace', 1.1));
  g.save();
  g.beginPath();
  g.rect(x0 - 3, yt - 10, (x1 - x0 + 9) * sweep, yb - yt + 20);
  g.clip();
  for (let i = 1; i < samples.length; i++)
    ln(g, xx(79 + i), yy(samples[i - 1]), xx(80 + i), yy(samples[i]), aqua, 4);
  g.restore();
  const ex = xx(100),
    ey = yy(record.ms);
  if (sweep === 1) dot(g, ex, ey, 7, gold, dark);
  if (located) {
    const tagY = ey - 33;
    box(g, ex - 232, tagY - 14, 230, 29, '#263c3a', 4);
    const stamp = 'Rev ' + record.revision + '  ·  ' + record.time + ' s';
    txt(g, stamp, ex - 116, tagY, 22, cream, 'Mono', 'center');
  }
  txt(g, '10% traffic  ·  smoke passed', 77, 509, 18, aqua, 'Mono');
  txt(g, 'parser-v2 enabled', 753, 509, 17, pale, 'Mono', 'right');
  txt(g, 'Decision at ' + now + ' s', 820, 179, 22, slate, 'Mono');
  if (located) {
    if (measured) txt(g, record.ms + ' ms', 818, 254, 59, ink, 'Serif');
    if (aged)
      txt(
        g,
        'Observed ' + (now - record.time) + ' s ago',
        822,
        309,
        24,
        now - record.time > maxObservationAge ? copper : slate,
      );
  } else {
    txt(g, 'Which revision?', 818, 248, 33, ink, 'Serif');
    txt(g, 'Which second?', 818, 300, 33, ink, 'Serif');
  }
  for (const [i, label] of ['Continue', 'Hold', 'Roll back'].entries()) {
    const y = 378 + i * 53,
      sel = answer && label === reading;
    dot(g, 832, y, 10, sel ? teal : paper, sel ? teal : '#718079');
    if (sel) dot(g, 832, y, 4, cream);
    txt(g, label, 858, y, 25, sel ? teal : ink, 'Sans', 'left', sel ? 700 : 400);
    fade(g, overlay, () =>
      txt(g, ['< 200', '200 to <300', '≥ 300'][i], 1148, y, 19, slate, 'Mono', 'right'),
    );
  }
  if (now > 130) {
    result(
      g,
      answer
        ? 'Withhold the advisory. Refresh the metrics receipt.'
        : 'The reading is still 300 ms. Its age is now 31 seconds.',
      answer ? copper : ink,
    );
  } else if (answer) {
    result(
      g,
      reading +
        ' at revision 7   ·   ' +
        (policyChapter && boundary ? 'canary-v3 includes the boundary' : 'canary stays at 10%'),
      teal,
    );
  } else if (overlay > 0)
    result(g, 'canary-v3   ·   latency bands apply to eligible evidence with passing smoke');
  else
    result(
      g,
      freshnessKnown
        ? 'Freshness window   ·   0 to ' + maxObservationAge + ' seconds, inclusive'
        : 'Metrics receipt   ·   read the endpoint before choosing an action',
    );
}
function wrongRevision(g, c) {
  const receipt = { ...current, time: 131, revision: 6, ms: 300 };
  const verdict = on(c, 3, 'That still cannot');
  heading(
    g,
    'checkout-42   /   replacement metrics receipt',
    'Does this fresh reading cover the requested revision?',
  );
  face(g, 51, 171, 1098, 345);
  txt(g, 'Release owner asks about', 88, 231, 23, pale);
  txt(g, 'Revision 7', 88, 316, 49, cream, 'Serif');
  ln(g, 532, 212, 532, 476, '#719081', 2);
  txt(g, 'Metrics tool returned', 602, 231, 23, pale);
  txt(g, 'Revision ' + receipt.revision, 602, 316, 49, gold, 'Serif');
  txt(g, 'Observed 131 s   ·   now 131 s', 603, 392, 22, cream, 'Mono');
  txt(g, '10%   ·   passed   ·   300 ms', 603, 444, 21, pale, 'Mono');
  result(
    g,
    verdict
      ? advice(receipt, 131) + ' the advice. Fetch checkout-42 revision 7.'
      : 'The receipt is current. Compare the two revisions.',
    verdict ? copper : ink,
  );
}
function responseField(g, c) {
  const fields = responseFields(on(c, 4, 'Correcting the field name'));
  const fixedName = validFields(fields);
  const [field, answer] = fields[1];
  heading(g, 'checkout-42   /   advisory adapter', 'What did the parser establish?');
  face(g, 50, 170, 675, 342);
  txt(g, 'Model response', 83, 222, 27, cream, 'Serif');
  txt(g, '<response>', 92, 275, 21, pale, 'Mono');
  txt(g, '<verification_summary>', 110, 313, 19, cream, 'Mono');
  txt(g, 'Check requested.', 134, 344, 19, cream, 'Mono');
  txt(g, '</verification_summary>', 110, 375, 19, cream, 'Mono');
  txt(
    g,
    '<' + field + '>' + answer + '</' + field + '>',
    110,
    416,
    23,
    fixedName ? aqua : coral,
    'Mono',
  );
  txt(g, '</response>', 92, 465, 21, pale, 'Mono');
  txt(g, 'Required field', 764, 229, 22, slate);
  txt(g, 'final_answer', 764, 277, 31, ink, 'Mono');
  txt(
    g,
    fixedName ? 'Field matches' : 'Field mismatch',
    764,
    351,
    29,
    fixedName ? teal : copper,
    'Serif',
  );
  txt(g, 'Tool evidence pending', 764, 420, 26, slate);
  result(g, 'The controller keeps authenticated tool records alongside the parsed draft.');
}

function sampling(g, c) {
  const b = c.beat.beatIndex;
  if (b >= 2) {
    routeBoard(g, c);
    return;
  }
  heading(
    g,
    'Candidate generation   /   independent draws',
    'How often does the set contain a sound repair?',
  );
  face(g, 50, 160, 1100, 375);
  const n = b === 0 ? 0 : Math.min(5, Math.floor(5 * cue(c, 1, 'Each miss leaves', 2.0) + 0.001));
  const showSuccess = n === 5 && after(c, 1, 'About eighty-three percent');
  txt(g, 'Each attempt succeeds with probability 0.30', 83, 203, 23, cream);
  const x = 117,
    w = 954,
    y = 309;
  box(g, x, y, w, 76, '#294548', 5);
  const miss = 1 - coverage(n);
  box(g, x, y, w * miss, 76, '#dba981', 4);
  if (showSuccess) box(g, x + w * miss, y, w * coverage(n), 76, aqua, 4);
  for (let i = 0; i <= n; i++) {
    const px = x + w * (1 - coverage(i));
    ln(g, px, y - 6, px, y + 83, ink, 1);
    txt(g, String(i), px, y - 25, 17, pale, 'Mono', 'center');
  }
  const missLabel =
    n === 0
      ? 'All possible sets'
      : n === 1
        ? 'First attempt misses'
        : 'First ' + n + ' attempts miss';
  txt(g, missLabel, x, 435, 23, cream, 'Serif');
  txt(g, (100 * miss).toFixed(1) + '%', x, 481, 33, gold, 'Mono');
  if (showSuccess)
    txt(
      g,
      (100 * coverage(n)).toFixed(1) + '% contain a success',
      x + w,
      465,
      32,
      aqua,
      'Serif',
      'right',
    );
  result(
    g,
    showSuccess
      ? 'P(at least one sound plan) = 1 − P(all five miss)'
      : b === 0
        ? 'Five independent attempts'
        : 'Each independent miss keeps 70% of the remaining probability.',
  );
}
function routeBoard(g, c) {
  const exposed = on(c, 3, 'Its link to the legacy adapter is blocked');
  const sent = on(c, 4, 'Only the feature flag');
  const voting = on(c, 4, 'Three votes for A');
  heading(
    g,
    'Parser repair   /   route compatibility',
    'Which complete route reaches the database?',
  );
  face(g, 49, 157, 1102, 389);
  routes.forEach((r, i) => {
    const y = 267 + i * 164,
      checks = hopChecks(r);
    txt(g, r.id, 88, y, 47, cream, 'Serif');
    txt(g, 'score ' + fixed(r.score), 83, y + 45, 17, pale, 'Mono');
    const xs = [264, 623, 992];
    r.hops.forEach((name, j) => {
      txt(g, name, xs[j], y - 41, 23, cream, 'Serif', 'center');
    });
    checks.forEach((ok, j) => {
      const x = xs[j] + 22,
        end = xs[j + 1] - 22;
      if (exposed && !ok) {
        ln(g, x, y, x + 95, y, coral, 7);
        ln(g, x + 95, y, x + 128, y - 31, coral, 7);
        ln(g, x + 152, y, end, y, coral, 7);
        txt(g, 'blocked', 0.5 * (x + end), y + 37, 19, coral, 'Mono', 'center');
      } else {
        ln(g, x, y, end, y, exposed ? aqua : '#9faaa1', 6, exposed ? [] : [8, 7]);
        if (exposed) txt(g, 'allowed', (x + end) / 2, y + 37, 18, aqua, 'Mono', 'center');
      }
    });
    xs.forEach((x) => {
      dot(g, x, y, 17, '#b8b9a4', '#566f65', 3);
      dot(g, x, y, 8, '#1f3332');
    });
    if (sent && r === eligibleRoute) {
      dot(g, 1088, y, 19, aqua);
      mark(g, 1088, y, true, dark);
    }
  });
  result(
    g,
    voting
      ? 'Vote  A · A · A · B · B     /     The majority still selects the blocked link.'
      : sent
        ? 'Return B. Both hops pass the compatibility check.'
        : exposed
          ? 'Only routes with two allowed hops enter the ranking.'
          : 'Dashed links are proposed hops. The scores come from a learned selector.',
  );
}
function tree(g, c) {
  const b = c.beat.beatIndex;
  if (b >= 3) {
    visitBoard(g, c);
    return;
  }
  const pinsChecked = on(c, 1, 'Expand each pin');
  const expanded = on(c, 1, 'Version two can add'),
    verified = on(c, 2, 'Its point three nine');
  heading(
    g,
    'Package resolver   /   beam width 2',
    expanded ? 'Which repairs are eligible for ranking?' : 'Which pins can lead to a repair?',
  );
  txt(g, 'Parser pin', 80, 167, 21, slate, 'Mono');
  txt(g, 'Next change', 569, 167, 21, slate, 'Mono');
  txt(g, 'Constraint', 957, 167, 21, slate, 'Mono');
  const positions = [263, 357, 452],
    leafYs = [[219, 299], [], [417, 497]];
  pins.forEach((p, i) => {
    const y = positions[i],
      ok = frontier.includes(p);
    ln(g, 83, 363, 152, y, pinsChecked ? (ok ? teal : '#aa9788') : slate, 3);
    dot(g, 154, y, 8, pinsChecked ? (ok ? teal : copper) : slate);
    txt(g, p.name, 183, y, 26, ink, 'Serif');
    txt(g, fixed(p.score), 344, y, 22, plum, 'Mono');
    if (!ok) {
      txt(
        g,
        pinsChecked ? p.fail : 'Needs newer runtime',
        470,
        y,
        22,
        pinsChecked ? copper : slate,
      );
      return;
    }
    if (expanded)
      p.leaves.forEach((leaf, j) => {
        const ly = leafYs[i][j];
        ln(g, 423, y, 523, ly, '#638d80', 3);
        dot(g, 535, ly, 8, verified && leaf.fail ? copper : teal);
        txt(g, leaf.name, 560, ly, 25, ink, 'Serif');
        txt(g, fixed(leaf.score), 818, ly, 23, plum, 'Mono');
        if (verified) txt(g, leaf.fail || 'Complete', 944, ly, 21, leaf.fail ? copper : teal);
      });
  });
  dot(g, 83, 363, 13, ink);
  if (verified) {
    result(
      g,
      'Saved repairs   ·   ' +
        completed.map((x) => x.name + ' ' + fixed(x.score)).join('     /     '),
      teal,
    );
  } else
    result(
      g,
      expanded
        ? 'Minimum proxy score 0.35   ·   every required constraint must also pass.'
        : 'Depth 1   ·   no completed repair in the archive.',
    );
}
function visitBoard(g, c) {
  const selected = after(c, 4, 'Visit A');
  const known = after(c, 4, 'B adds point three');
  const sampled = after(c, 4, 'A now returns one');
  const updated = after(c, 4, 'increment the parent to seventeen');
  const prior = visits(false);
  const rows = updated ? visits(true) : prior;
  heading(g, 'Adaptive tree search   /   PUCT', 'Which feasible branch gets the next visit?');
  txt(g, 'Score = mean + prior × √parent visits / (1 + child visits)', 52, 174, 25, ink, 'Mono');
  txt(g, 'Exploration constant 1    ·    Parent visits ' + rows[0].parent, 53, 218, 21, slate);
  if (selected) {
    const visitLabel = updated ? 'A’s result recorded' : sampled ? 'Recording A’s result' : 'Visit A';
    txt(g, visitLabel, 1110, 218, 22, teal, 'Sans', 'right');
  }
  rows.forEach((r, i) => {
    const y = 291 + i * 121,
      x = 487,
      w = 505;
    txt(g, r.id, 58, y, 43, ink, 'Serif');
    txt(g, 'prior ' + fixed(r.p) + '   visits ' + r.n, 121, y - 13, 20, slate, 'Mono');
    txt(g, 'mean ' + fixed(r.q), 121, y + 23, 22, teal, 'Mono');
    box(g, x, y - 25, w * 1.1, 59, faint, 4);
    box(g, x, y - 25, w * r.q, 59, '#8ec5b4', 4);
    if (known) {
      const bonusX = x + w * r.q;
      box(g, bonusX, y - 25, w * r.bonus, 59, '#ebbb76', 4);
      txt(g, '+' + fixed(r.bonus), bonusX + (w * r.bonus) / 2, y + 4, 23, ink, 'Mono', 'center');
      txt(g, fixed(r.total), 1110, y + 4, 27, ink, 'Mono', 'right');
    }
  });
  if (sampled) {
    const [a] = prior;
    const mean = '(' + fixed(a.q) + ' × ' + a.n + ' + ' + nextVisitOutcome + ') / ' + (a.n + 1);
    txt(g, 'A returns ' + nextVisitOutcome, 58, 517, 25, teal, 'Serif');
    txt(
      g,
      'New mean = ' + mean + (updated ? ' = ' + fixed(rows[0].q) : ''),
      317,
      517,
      23,
      ink,
      'Mono',
    );
  }
  result(
    g,
    updated
      ? 'A’s mean rises and its exploration bonus shrinks.'
      : sampled
        ? 'Add the new outcome to A’s running mean.'
        : selected
          ? 'A gets the next visit.'
          : 'Both means are 0.50. Compare the bonus for exploring each branch.',
  );
}

function processCheck(g, c) {
  const b = c.beat.beatIndex;
  if (b === 5) {
    training(g, c);
    return;
  }
  if (b >= 3) {
    audit(g, c);
    return;
  }
  const count = on(c, 0, 'Request the API step') ? 3 : on(c, 0, 'Pin the parser') ? 2 : 1;
  const seen = on(c, 1, 'The stepwise controller'),
    fourth = on(c, 1, 'requests call four');
  heading(
    g,
    'Parser v2   /   generator trace',
    b === 2 ? 'Can the checker interpret its inputs?' : 'Who pays for the fourth call?',
  );
  if (b === 2) {
    const badScore = on(c, 2, 'A missing or nonfinite score');
    face(g, 51, 174, 1098, 342);
    txt(g, 'Verifier input', 96, 228, 26, cream, 'Serif');
    const rows = [
      ['exact_ok', '"false"', 'text', 'Boolean required'],
      ['score', 'NaN', 'nonfinite', 'Finite number required'],
    ];
    rows.slice(0, badScore ? 2 : 1).forEach(([a, v, t, r], i) => {
      const y = 319 + i * 100;
      txt(g, a, 98, y, 24, pale, 'Mono');
      txt(g, v, 341, y, 33, gold, 'Mono');
      txt(g, t, 577, y, 24, cream);
      txt(g, r, 795, y, 23, coral);
    });
    result(g, 'Reject malformed verifier output before a score enters the ranking.', copper);
    return;
  }
  const xs = [332, 557, 782, 1007];
  for (const [i, s] of steps.entries()) txt(g, s.name, xs[i], 193, 22, ink, 'Serif', 'center');
  for (const [r, name] of ['Outcome only', 'Stepwise'].entries()) {
    const y = 292 + r * 149,
      generated = r === 0 && fourth ? steps.length : Math.min(count, inspectSteps(steps));
    txt(g, name, 50, y, 25, ink, 'Serif');
    ln(g, 287, y, 1052, y, '#a5aba0', 4);
    xs.forEach((x, i) => {
      const done = i < generated;
      dot(g, x, y, 28, done ? ink : paper, done ? ink : '#8e9e94', 3);
      if (done && r === 1 && i === 2 && seen) mark(g, x, y, false, coral);
      else txt(g, i + 1, x, y + 1, 23, done ? cream : slate, 'Mono', 'center');
      if (i < generated && r === 1 && (i < 2 || seen))
        txt(
          g,
          i === 2 ? 'Removed' : 'Pass',
          x,
          y + 55,
          20,
          i === 2 ? copper : teal,
          'Mono',
          'center',
        );
      if (i === 3 && r === 1 && seen)
        txt(g, 'Unrequested', x, y + 55, 19, copper, 'Mono', 'center');
    });
    txt(g, generated + (generated === 1 ? ' call' : ' calls'), 49, y + 45, 19, slate, 'Mono');
  }
  result(
    g,
    seen
      ? 'The exact check fails on step 3. The fourth socket stays empty.'
      : 'Each filled socket is one generator call.',
  );
}
function audit(g, c) {
  const b = c.beat.beatIndex;
  heading(
    g,
    b === 3
      ? 'Evaluator audit   /   submitted solution'
      : 'Evaluator audit   /   separate case sets',
    b === 3 ? 'Can you trust this solution?' : 'Which denominator belongs to each rate?',
  );
  if (b === 3) {
    face(g, 50, 165, 1100, 376);
    txt(g, 'Solve for every root', 89, 214, 24, pale);
    txt(g, 'x(x − 1) = 0', 90, 285, 53, cream, 'Serif');
    if (on(c, 3, 'divides by x')) {
      ln(g, 100, 348, 166, 348, gold, 3);
      txt(g, '÷ x', 183, 348, 26, gold, 'Mono');
      txt(g, 'x − 1 = 0', 285, 346, 42, cream, 'Serif');
      txt(g, 'Requires x ≠ 0', 647, 348, 27, coral);
    }
    if (on(c, 3, 'both correct roots'))
      txt(g, 'Submitted roots     0, 1', 92, 460, 32, aqua, 'Serif');
    result(g, 'Inspect the step that divides both sides.');
    return;
  }
  const visible = on(c, 4, 'Six accepts');
  const solver = on(c, 4, 'A solver that answers');
  for (const [i, values] of [flawSet, solverSet].entries()) {
    if (i === 1 && !solver) continue;
    const y = 220 + i * 177,
      show = i === 1 ? on(c, 4, 'on a different set') : on(c, 4, 'A solver');
    txt(
      g,
      i ? 'Solver on ordinary problems' : 'Grader on flawed solutions',
      52,
      y,
      27,
      ink,
      'Serif',
    );
    const col = i ? teal : copper;
    values.forEach((v, j) => box(g, 53 + j * 70, y + 39, 55, 38, v ? col : faint, 5));
    txt(g, i ? '9 correct / 10 problems' : '6 accepted / 8 flawed', 52, y + 112, 22, slate, 'Mono');
    if (show && visible) txt(g, rate(values) + '%', 1115, y + 52, 47, col, 'Serif', 'right');
  }
  result(g, 'Audit false acceptance separately from solver accuracy.');
}

function training(g, c) {
  heading(
    g,
    'Training rewards   /   four repairs for the same failing test',
    'What does a group-relative update favor?',
  );
  const tested = on(c, 5, 'Two fail and earn zero');
  const averaged = on(c, 5, 'A group-relative update');
  const rewards = [1, 0, 1, 0],
    mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
  rewards.forEach((r, i) => {
    const x = 188 + i * 274;
    txt(g, 'Repair ' + (i + 1), x, 214, 23, ink, 'Serif', 'center');
    box(g, x - 61, 265, 122, 156, '#d2d5c9', 6);
    if (tested) {
      if (r) box(g, x - 61, 421 - r * 156, 122, r * 156, teal, 4);
      else ln(g, x - 61, 421, x + 61, 421, copper, 3);
      txt(g, r ? 'Pass   +1' : 'Fail    0', x, 466, 23, r ? teal : copper, 'Mono', 'center');
    }
  });
  if (averaged) {
    const y = 421 - 156 * mean;
    ln(g, 77, y, 1117, y, ink, 2, [5, 7]);
    txt(g, 'Group mean = ' + mean, 78, 523, 25, ink, 'Mono');
  }
  result(
    g,
    averaged
      ? 'Passing repairs score above the group mean. New requests still need checked evidence.'
      : 'One test gives each complete repair a training reward.',
  );
}
function latencies(g, c) {
  heading(
    g,
    'Held-out request   /   measured from arrival',
    'How long did the owner wait for advice?',
  );
  const events = [
    { id: 'Status event', t: 0.1, shown: on(c, 2, 'acknowledges it'), y: 245 },
    { id: 'First model token', t: 0.8, shown: on(c, 2, 'first model token arrives'), y: 345 },
    { id: 'Checked advisory', t: 3, shown: on(c, 2, 'checked advisory goes out'), y: 445 },
  ];
  const x = (t) => 333 + t * 250;
  for (let t = 0; t <= 3; t++) {
    ln(g, x(t), 204, x(t), 490, '#b3baad', 1, [3, 6]);
    txt(g, t + ' s', x(t), 516, 18, slate, 'Mono', 'center');
  }
  for (const { id, t, shown, y } of events) {
    txt(g, id, 53, y, 24, ink, 'Serif');
    if (shown) {
      ln(g, x(0), y, x(t), y, teal, 8);
      dot(g, x(t), y, 9, teal);
      txt(g, t.toFixed(1) + ' s', x(t), y - 35, 20, teal, 'Mono', 'center');
    }
  }
  result(g, 'Arrival is time zero for all three measurements.');
}

function rack(g, row, y, practice = false, highlight = []) {
  const all = cells(row, practice),
    x = 72,
    w = 1056,
    step = w / all.length;
  box(g, x - 13, y - 17, w + 26, 98, ink, 10, '#849285', 2);
  for (let i = 0; i < all.length; i++) {
    const { id, status } = all[i],
      dx = x + i * step;
    const col =
      status === 'spent' ? gold : status === 'free' ? '#294344' : id === 'B' ? blue : aqua;
    box(g, dx + 1, y, step - 2, 61, col, 3, '#122d31', 1);
    if (status === 'held' || status === 'spent') {
      ln(g, dx + step * 0.3, y + 11, dx + step * 0.7, y + 11, '#ffffff88', 2);
      ln(g, dx + step * 0.3, y + 51, dx + step * 0.7, y + 51, '#00000042', 2);
      if (status === 'spent') ln(g, dx + step * 0.48, y + 21, dx + step * 0.48, y + 41, ink, 2);
    } else dot(g, dx + step / 2, y + 29, 2.5, '#839b89');
    if (highlight.includes(i)) ln(g, dx + 2, y + 69, dx + step - 2, y + 69, gold, 3);
  }
  for (const [label, start, count] of groups(all)) {
    if (count * step > 75)
      txt(g, label, x + (start + count / 2) * step, y + 107, 18, slate, 'Mono', 'center');
  }
}
function groups(all) {
  const output = [];
  all.forEach(({ id, status }, i) => {
    const label = (id + ' ' + status).trim(),
      last = output.at(-1);
    if (last && last[0] === label) last[2]++;
    else output.push([label, i, 1]);
  });
  return output;
}
function balances(g, row, y, showFree = true) {
  const totals = [
    ['Spent', num(row.spent)],
    ['Reserved', num(row.reserved)],
    ['Free', showFree ? num(row.free) : '?'],
  ];
  totals.forEach(([label, value], i) => {
    const x = 55 + i * 371;
    ln(g, x, y - 31, x + 327, y - 31, '#9aa89e', 2);
    txt(g, label, x, y + 2, 17, slate, 'Mono');
    txt(g, value, x, y + 50, 47, ink, 'Serif');
  });
}
function budget(g, c) {
  const stage = on(c, 2, 'Its reservation uses') ? 2 : on(c, 1, 'and release the six') ? 1 : 0;
  const row = mainLedger[stage],
    b = c.beat.beatIndex;
  heading(g, 'Request allowance   /   4,000 generated tokens', 'Where can C reserve 1,500 tokens?');
  const x = 72,
    step = 1056 / 40,
    required = 15 * step;
  const start = x + step * (stage === 0 ? 25 : 24);
  txt(
    g,
    stage === 2 ? 'C admitted · 1,500' : stage === 1 ? 'C asks for 1,500' : 'C needs 15 sockets',
    start + required / 2,
    180,
    20,
    stage === 2 ? teal : ink,
    'Mono',
    'center',
  );
  ln(g, start, 220, start, 201, teal, 3);
  ln(g, start, 201, start + required, 201, teal, 3);
  ln(g, start + required, 201, start + required, 220, teal, 3);
  if (stage < 2 && on(c, 1, 'Keep those nine sockets')) {
    txt(g, 'A receipt   ·   900 used', 65, 180, 21, copper, 'Mono');
  }
  const released = stage > 0 ? [24, 25, 26, 27, 28, 29] : [];
  rack(g, row, 254, false, released);
  const showFree = stage !== 1 || on(c, 2, 'Admit C for fifteen hundred');
  balances(g, row, 435, showFree);
  if (b === 4 && on(c, 4, 'B times out'))
    result(g, 'B timed out   ·   usage unknown   ·   keep its 1,500-token reservation.', copper);
  else if (b === 3 && on(c, 3, 'Match the call ID'))
    result(g, 'Duplicate receipt   ·   A used 900   ·   already charged to this call ID.');
  else if (stage === 2)
    result(g, 'C holds 1,500. The six gold marks identify capacity released by A.', teal);
  else if (stage === 1)
    result(g, 'A spent 900. The six marked sockets have returned to the free pool.');
  else result(g, 'One socket = 100 tokens   ·   B holds 1,500   ·   A holds 1,500.');
}

function memory(g, c) {
  const b = c.beat.beatIndex;
  if (b >= 3) {
    pageOwners(g, c);
    return;
  }
  const shared = on(c, 2, 'and eight tails'),
    mode = kvSize(shared);
  heading(
    g,
    'Serving memory   /   uniform full attention',
    b === 0
      ? 'What must the engine retain for one token?'
      : 'How many token slots need physical storage?',
  );
  if (b === 0) {
    const factors = [
      ['K and V', 2],
      ['Layers', kv.layers],
      ['KV heads', kv.heads],
      ['Head width', kv.width],
      ['Bytes', kv.bytes],
    ];
    factors.forEach(([label, v], i) => {
      const x = 133 + i * 235;
      txt(g, label, x, 222, 22, slate, 'Sans', 'center');
      box(g, x - 64, 266, 128, 111, ink, 9);
      txt(g, v, x, 322, 49, cream, 'Mono', 'center');
      if (i < 4) txt(g, '×', x + 118, 322, 31, slate, 'Serif', 'center');
    });
    if (on(c, 0, 'for one live token'))
      txt(
        g,
        num(kv.bytesPerToken) + ' bytes  =  ' + kv.bytesPerToken / 1024 + ' KiB per token',
        600,
        465,
        36,
        teal,
        'Serif',
        'center',
      );
    result(g, 'Assumes the same KV dimensions at every layer.');
    return;
  }
  const x = 121,
    y = 182,
    w = 116,
    h = 34;
  for (let i = 0; i < 8; i++) {
    const yy = y + i * 44;
    txt(g, i + 1, 79, yy + h / 2, 16, slate, 'Mono', 'center');
    for (let j = 0; j < 4; j++) {
      const tail = j === 3;
      if (shared && !tail && i > 0) continue;
      const cx = x + j * (w + 5);
      box(g, cx, yy, w, h, tail ? '#cda474' : '#6da595', 3, ink, 1);
      for (let n = 1; n < 8; n++)
        ln(g, cx + (w * n) / 8, yy + 4, cx + (w * n) / 8, yy + h - 4, '#ffffff5a', 1);
    }
    if (shared && i > 0) {
      ln(g, x + 2 * w + 60, yy + h / 2, x + 3 * (w + 5) - 3, yy + h / 2, '#799889', 2);
    }
  }
  if (shared) ln(g, x + 2 * w + 60, y + h, x + 2 * w + 60, y + 7 * 44 + h / 2, '#799889', 2);
  txt(g, 'Each block', 697, 206, 22, slate, 'Mono');
  txt(g, '4,096 tokens', 696, 254, 36, ink, 'Serif');
  txt(g, shared ? '1 stem + 8 tails' : '8 stems + 8 tails', 696, 337, 30, ink, 'Serif');
  txt(g, num(mode.slots) + ' live slots', 697, 392, 25, teal, 'Mono');
  txt(g, mode.gib + ' GiB', 693, 469, 53, ink, 'Serif');
  result(g, 'Logical cache size   ·   320 KiB per slot   ·   before allocator overhead');
}
function pageOwners(g, c) {
  const step = on(c, 4, 'Now reclaim the page')
    ? 3
    : on(c, 3, 'The reader finishes')
      ? 2
      : on(c, 3, 'Two branches prune')
        ? 1
        : 0;
  const lease = leases[step];
  heading(g, 'Paged KV storage   /   one physical page', 'When can another request use this page?');
  const targets = [
    ['Branch A', 223],
    ['Branch B', 300],
    ['Branch C', 377],
    ['Branch D', 454],
  ];
  for (const [i, [name, y]] of targets.entries()) {
    const live = i >= 4 - lease.refs;
    txt(g, name, 89, y, 25, live ? ink : slate, 'Serif');
    ln(g, 240, y, live ? 473 : 319, y, live ? teal : '#b9bcb0', 4);
    if (live) ln(g, 473, y, 536, 337, teal, 4);
    dot(g, 242, y, 7, live ? teal : faint);
  }
  face(g, 540, 248, 248, 175);
  txt(
    g,
    lease.reclaim ? 'FREE' : 'KV page',
    664,
    317,
    40,
    lease.reclaim ? aqua : cream,
    'Serif',
    'center',
  );
  txt(g, lease.refs + ' references', 664, 378, 19, pale, 'Mono', 'center');
  ln(g, 790, 337, lease.readers ? 908 : 833, 337, lease.readers ? teal : '#c4c3b4', 4);
  txt(
    g,
    lease.readers ? 'Active reader' : 'Reader idle',
    935,
    337,
    24,
    lease.readers ? teal : slate,
    'Serif',
  );
  result(
    g,
    lease.reclaim
      ? '0 references + 0 readers   ·   safe to reclaim.'
      : 'Reclaim only after both the last reference and the last reader leave.',
  );
}

function stopping(g, c) {
  const b = c.beat.beatIndex;
  if (b >= 2) {
    deadline(g, c);
    return;
  }
  const reveal = on(c, 0, 'On this repair');
  heading(
    g,
    'Controller exits   /   repair search',
    reveal
      ? 'Does the recent window improve the earlier best?'
      : 'What could another call establish?',
  );
  if (!reveal) {
    const options = [
      ['Threshold + fresh evidence', 'Apply policy'],
      ['High impact + missing evidence', 'Tool or authorized review'],
      ['Testable repair alternatives', 'Search and verify'],
    ];
    const n = on(c, 0, 'A repair with') ? 3 : on(c, 0, 'A missing observation') ? 2 : 1;
    options.slice(0, n).forEach(([problem, route], i) => {
      const y = 232 + i * 112;
      txt(g, problem, 90, y, 29, ink, 'Serif');
      ln(g, 574, y, 701, y, teal, 4);
      dot(g, 704, y, 8, teal);
      txt(g, route, 751, y, 26, teal);
    });
    result(g, 'Choose the next call from the evidence the task still needs.');
    return;
  }
  face(g, 50, 162, 1100, 373);
  const x = (i) => 218 + 250 * i,
    y = (v) => 451 - (v - 0.68) * 5600;
  const observed = on(c, 0, 'point six nine')
    ? 4
    : on(c, 0, 'point seven one')
      ? 3
      : on(c, 0, 'The last three')
        ? 2
        : 1;
  for (const v of [0.69, 0.7, 0.71, 0.72]) {
    ln(g, 160, y(v), 1050, y(v), '#516b64', 1, [3, 5]);
    txt(g, fixed(v), 130, y(v), 17, pale, 'Mono', 'right');
  }
  if (observed > 1) box(g, x(1) - 60, 185, x(3) - x(1) + 120, 310, '#93c4ad14', 9, '#739285', 1);
  for (let i = 0; i < observed; i++) {
    if (i > 0) ln(g, x(i - 1), y(history[i - 1]), x(i), y(history[i]), pale, 3);
    dot(g, x(i), y(history[i]), 9, i === 0 ? gold : aqua);
    txt(
      g,
      fixed(history[i]),
      x(i),
      y(history[i]) - 30,
      22,
      i === 0 ? gold : aqua,
      'Mono',
      'center',
    );
    txt(g, i === 0 ? 'Earlier best' : 'Visit ' + (i + 1), x(i), 487, 17, pale, 'Mono', 'center');
  }
  result(
    g,
    b > 0 && plateau(history)
      ? 'Stop   ·   recent maximum 0.71 ≤ earlier best 0.72.'
      : 'Under this heuristic, continue only if the recent maximum beats the earlier best.',
  );
}
function clockDial(g, now) {
  const cx = 203,
    cy = 317,
    r = 118;
  dot(g, cx, cy, r + 8, '#c2c1b1', '#8d9789', 2);
  dot(g, cx, cy, r, dark);
  const angle = (t) => -Math.PI * 0.5 + ((t - 125) * Math.PI) / 5;
  for (let i = 0; i < 10; i++) {
    const a = angle(i + 125);
    ln(
      g,
      cx + Math.cos(a) * (r - 21),
      cy + Math.sin(a) * (r - 21),
      cx + Math.cos(a) * (r - 8),
      cy + Math.sin(a) * (r - 8),
      i === 5 ? coral : pale,
      i === 5 ? 5 : 2,
    );
  }
  const a = angle(now);
  ln(g, cx, cy, cx + Math.cos(a) * (r - 22), cy + Math.sin(a) * (r - 22), gold, 6);
  dot(g, cx, cy, 10, gold);
  txt(g, now.toFixed(1) + ' s', cx, 478, 32, ink, 'Mono', 'center');
}
function deadline(g, c) {
  const b = c.beat.beatIndex;
  // A clock tick and the incomplete revision check use the same elapsed time.
  const now = after(c, 3, 'Time is up')
    ? 130
    : 126 + 3.9 * cue(c, 2, 'Watch the deadline approach', 3.8);
  const release = after(c, 4, 'Return C');
  const move = release ? Math.min(1, (c.elapsed - c.wordCue('Return C').end) / 0.65) : 0;
  const {
    time: t,
    stopped,
    underReview: fraction,
    returned,
  } = queueState(now, release);
  heading(g, 'Release queue   /   deadline at 130 s', 'Which advisory can the owner receive?');
  clockDial(g, t);
  txt(
    g,
    stopped ? 'Clock stopped' : 'Request clock',
    203,
    175,
    21,
    stopped ? copper : slate,
    'Mono',
    'center',
  );
  for (const [i, d] of [draftC, draftF].entries()) {
    const y = 225 + i * 180;
    txt(g, d.id, 383, y, 42, ink, 'Serif');
    txt(g, '“' + d.text + '”   ·   proxy ' + fixed(d.score), 460, y, 24, ink, 'Mono');
    const labels = ['Nonempty text', 'Smoke + p95', 'Revision & age'];
    for (const [j, s] of labels.entries()) {
      const x = 393 + j * 238,
        done = j < d.checks;
      box(g, x, y + 41, 218, 16, faint, 5);
      box(g, x, y + 41, 218 * (done ? 1 : fraction), 16, done ? teal : '#b28445', 4);
      txt(g, s, x, y + 82, 18, slate);
    }
    if (i === 0)
      txt(
        g,
        returned && move === 1 && canSend(d, 130) ? 'Returned' : 'Checked',
        1141,
        y,
        23,
        teal,
        'Serif',
        'right',
      );
    else {
      const held = after(c, 3, 'F has only two of its three checks');
      const status = held ? d.checks + ' / 3 checks   ·   frozen' : stopped ? 'Frozen in review' : 'In review';
      txt(g, status, 1141, y, 23, copper, 'Serif', 'right');
    }
  }
  const railY = 505;
  ln(g, 48, railY, 1149, railY, '#a9b6ac', 2);
  txt(g, 'Owner', 1143, railY - 15, 21, slate, 'Mono', 'right');
  if (returned) {
    const cursor = 83 + (1017 - 83) * move;
    ln(g, 51, railY, cursor, railY, teal, 4);
    box(g, cursor - 24, railY - 11, 48, 22, teal, 4);
    txt(g, draftC.id, cursor, railY + 5, 19, pale, 'Mono', 'center');
  }
  txt(g, (returned ? 'Return C   ·   ' : 'C’s receipt   ·   ') +
    'checkout-42 rev 7  ·  observed 100 s  ·  smoke passed  ·  240 ms at 10% traffic',
    50, 534, 23, returned ? teal : ink);
}
function evaluation(g, c) {
  const b = c.beat.beatIndex;
  if (b === 2) {
    latencies(g, c);
    return;
  }
  if (b >= 3) {
    practice(g, c);
    return;
  }
  heading(
    g,
    'Held-out incidents   /   illustrative paired outcomes',
    'Where did the extra search help?',
  );
  txt(g, 'Frozen incident', 56, 178, 21, slate, 'Mono');
  txt(g, 'Single path', 521, 178, 24, ink, 'Serif');
  txt(g, 'Best of three', 844, 178, 24, ink, 'Serif');
  const known = on(c, 1, 'On stale evidence');
  const colors = { Correct: teal, Unsafe: copper, Abstain: plum };
  evals.forEach((row, i) => {
    const y = 240 + i * 78;
    if (known && row.search === 'Unsafe') box(g, 48, y - 30, 1104, 60, '#f1d6c3', 5);
    ln(g, 50, y + 37, 1149, y + 37, '#c5cbbf', 1);
    txt(g, row.incident, 57, y, 26, ink, 'Serif');
    for (const [k, x] of [
      ['single', 525],
      ['search', 848],
    ]) {
      const v = row[k];
      dot(g, x, y, 9, colors[v]);
      txt(g, v, x + 24, y, 23, colors[v]);
    }
  });
  result(
    g,
    known
      ? 'Correct advice    ' +
          countOutcomes('single', 'Correct') +
          '/4 and ' +
          countOutcomes('search', 'Correct') +
          '/4     ·     Unsafe    0 and 1     ·     Abstained    2 and 1'
      : 'Same evidence and policy per incident   ·   matched generator + verifier cost',
  );
}
function practice(g, c) {
  const replay = c.beat.beatIndex >= 5;
  const stage = after(c, 4, 'Admit D for fifteen hundred')
    ? 2
    : after(c, 4, 'to seventeen hundred')
      ? 1
      : 0;
  const row = finalLedger[stage];
  const stopped = after(c, 4, 'second one hundred thirty');
  const now = current.time + maxObservationAge;
  heading(
    g,
    'Final dispatch   /   6,000 generated tokens',
    stopped ? 'Can C go back at second ' + now + '?' : 'Can D reserve another 1,500 tokens?',
  );
  if (!stopped) {
    txt(g, 'C completed   ·   Hold   ·   900 spent', 57, 175, 24, teal, 'Serif');
    txt(
      g,
      stage === 2 ? 'D reserved   ·   1,500' : 'Pending D   ·   1,500',
      1144,
      175,
      23,
      ink,
      'Mono',
      'right',
    );
    rack(g, row, 249, true);
    const remainingKnown = after(c, 4, 'Two hundred tokens remain free');
    balances(g, row, 436, stage !== 2 || remainingKnown);
    result(
      g,
      remainingKnown
        ? 'D holds ' + num(row.held.D) + '. ' + num(row.free) + ' tokens remain free.'
        : stage === 2
          ? 'D now holds ' + num(row.held.D) + ' tokens.'
          : stage === 1
            ? 'A settled for 1,400. Its unused 600 are available to D.'
            : on(c, 3, 'A now reports')
              ? 'Receipt   ·   A used 1,400 of 2,000. Apply it before dispatching D.'
              : 'One socket = 100 tokens   ·   C spent 900   ·   B and A each hold 2,000.',
    );
    return;
  }
  const earlierTime = current.time - 1;
  const moving = cue(c, 5, 'to second ninety-nine', 1.1);
  const record = { ...current, time: moving === 1 ? earlierTime : current.time };
  const age = now - record.time;
  const x = (age) => 435 + (age - maxObservationAge) * 112;
  const y = 366;
  const verdict = replay
    ? after(c, 6, 'ask for a fresh latency measurement')
    : after(c, 4, 'Return C');
  const totalKnown = after(c, 4, 'B and D still hold thirty-five hundred tokens');
  const timeKnown = after(c, 4, 'reading from second one hundred');
  const awaitingUsage = after(c, 6, 'ledger stays open for those receipts');
  const eligible = canSend({ ...draftC, record }, now);
  face(g, 49, 163, 795, 365);
  txt(g, 'C    “Hold”    /    completed', 79, 206, 24, cream, 'Mono');
  txt(
    g,
    'Rev ' + record.revision + '   ·   ' + record.share + '% traffic   ·   smoke passed   ·   ' + record.ms + ' ms',
    79,
    252,
    20,
    pale,
    'Mono',
  );
  const first = maxObservationAge - 2;
  const last = maxObservationAge + 3;
  const edge = x(maxObservationAge);
  box(g, x(first), y - 26, edge - x(first), 52, '#385f50', 3);
  txt(g, 'Observation age at ' + now + ' s', 79, 305, 24, cream, 'Serif');
  ln(g, x(first), y, x(last), y, '#adc6b4', 2);
  ln(g, edge, y - 33, edge, y + 27, aqua, 3);
  for (let tick = first; tick <= last; tick++) {
    ln(g, x(tick), y - 8, x(tick), y + 8, pale, 2);
    txt(g, tick + ' s', x(tick), y + 56, 22, tick === maxObservationAge ? aqua : pale, 'Mono', 'center');
  }
  const previousAge = now - current.time;
  const earlierAge = now - earlierTime;
  const observationX = lerp(x(previousAge), x(earlierAge), moving);
  if (observationX >= edge + 24) {
    dot(g, x(previousAge), y, 10, '#385f50', gold, 2);
    ln(g, edge + 11, y, observationX, y, gold, 2, [3, 5]);
  }
  dot(g, observationX, y, 13, gold, dark, 2);
  const moved = moving === 1 && after(c, 5, 'to second ninety-nine');
  if (timeKnown && (moving === 0 || moved))
    txt(g, now + ' − ' + record.time + ' = ' + age + ' s', 79, 478, 28, gold, 'Mono');
  if (verdict)
    txt(
      g,
      eligible ? 'Return C’s advisory' : 'Abstain. Request a fresh reading.',
      813,
      478,
      25,
      eligible ? aqua : coral,
      'Serif',
      'right',
    );
  txt(
    g,
    awaitingUsage ? 'Awaiting usage receipts' : 'Open reservations',
    868,
    205,
    23,
    slate,
    'Serif',
  );
  for (const [i, id] of ['B', 'D'].entries()) {
    const yy = 270 + i * 70;
    txt(g, id, 868, yy, 26, ink, 'Serif');
    txt(g, num(row.held[id]), 1141, yy, 28, ink, 'Mono', 'right');
  }
  ln(g, 869, 379, 1143, 379, '#9aab9e');
  if (totalKnown) txt(g, num(row.reserved) + ' held', 868, 416, 28, teal, 'Mono');
  txt(g, num(row.free) + ' free', 868, 473, 23, slate, 'Mono');
  result(
    g,
    'Freshness window   ·   0 ≤ age ≤ ' + maxObservationAge + ' s   ·   dispatch closed at the deadline.',
  );
}

const painters = [
  (g, c) => trace(g, c, false),
  (g, c) => trace(g, c, true),
  sampling,
  tree,
  processCheck,
  budget,
  memory,
  stopping,
  evaluation,
];
function draw(g, c) {
  g.fillStyle = paper;
  g.fillRect(0, 0, 1920, 1080);
  g.save();
  g.scale(1.6, 1.6);
  painters[c.beat.chapterIndex](g, c);
  g.restore();
}

export default { title: 'Spend Reasoning Where Verification Can Help', draw, check: checkExamples };
