import {
  C,
  background,
  txt,
  math,
  sub,
  box,
  line,
  path,
  dot,
  jewel,
  glass,
  cue,
  clamp,
  mix,
  stripX,
} from './glass.mjs';
import {
  rows,
  ordered,
  validationRows,
  permutedRows,
  predict,
  policyCosts,
  fittedStump,
  bill,
  compareModels,
  importance,
  backgroundScore,
  missingRoute,
  fits,
  mean,
  truth,
  noise,
  biasSq,
  variance,
  decision,
  fresh,
  stump,
} from './model.mjs';

export function validation(g, k) {
  const b = k.beat.beatIndex,
    comparison = b === 3 || b === 4,
    perm = b >= 5;
  background(
    g,
    'Eight later requests',
    comparison
      ? 'Which model earned the smaller bill?'
      : perm
        ? 'Reverse just the ambiguity values'
        : 'What do the routing errors cost?',
  );
  if (comparison) {
    sub(g, 'Frozen validation labels    ·    $18 per extra review    ·    $120 per miss', 124, 268);
    compareModels().forEach(([name, cut, cost], i) => {
      const y = 365 + i * 94;
      txt(g, name, 130, y, 37, C.ink, 'left', 'Serif');
      math(g, cut.toFixed(2), 541, y, 31, C.dim);
      box(g, 783, y - 17, cost * 3.3, 34, i === 5 ? C.blue : C.faint);
      math(g, '$' + cost, 831 + cost * 3.3, y, 37, i === 5 ? C.blue : C.ink);
    });
    sub(g, 'Cutoff', 541, 310);
    txt(g, 'Verify the frozen choice on fresh requests.', 1810, 932, 31, C.ink, 'right');
    return;
  }
  const switched = !perm && cue(k, 1, 'Equality counts', 0.02) > 0;
  const permute = cue(k, 5, 'Reverse the ambiguity column', 3.2);
  const swaps = Math.floor(4 * permute);
  const cutoff = switched ? 0.2 : 0.5;
  const data = perm ? permutedRows(swaps) : validationRows;
  const entries = policyCosts(fittedStump, cutoff, data),
    counts = bill(entries);
  const costsVisible =
    perm ||
    (!switched
      ? cue(k, 1, 'Each miss costs', 0.15) > 0
      : cue(k, 2, 'At eighteen dollars', 0.15) > 0);
  const x = (i) => 457 + i * 184;
  txt(g, 'Validation policy', 119, 269, 34, C.dim);
  math(g, 'Queue when score ≥ ' + cutoff.toFixed(2), 1797, 269, 38, C.amber, 'right');
  const yRow = perm ? [350, 420, 486, 550, 614, 678, 747] : [354, 436, 0, 546, 644, 747];
  const headers = perm
    ? ['Request', 'Observed', 'Support', 'Ambiguity', 'Leaf score', 'Route', 'Error cost']
    : ['Request', 'Observed', '', 'Leaf score', 'Route', 'Error cost'];
  headers.forEach((label, i) => {
    if (label && (label !== 'Error cost' || costsVisible)) txt(g, label, 105, yRow[i], 31, C.dim);
  });
  entries.forEach((e, i) => {
    const xx = x(i);
    line(g, xx - 90, 329, xx - 90, 843, C.line, 1);
    txt(g, e.id, xx, yRow[0], 36, C.ink, 'center', 'Serif');
    jewel(g, xx, yRow[1], e.row[2], 20);
    if (perm) {
      math(g, e.row[1], xx, yRow[2], 29, C.dim, 'center');
      const justSwapped = swaps > 0 && Math.min(i, 7 - i) === swaps - 1 && permute < 1;
      if (justSwapped) box(g, xx - 60, yRow[3] - 25, 120, 50, C.slate, C.amber);
      math(g, e.row[0].toFixed(1), xx, yRow[3], 28, C.amber, 'center');
    }
    const off = perm ? 1 : 0;
    math(g, e.score.toFixed(2), xx, yRow[3 + off], 32, C.ink, 'center');
    txt(
      g,
      e.review ? 'Queue' : 'Auto',
      xx,
      yRow[4 + off],
      33,
      e.review ? C.amber : C.blue,
      'center',
    );
    if (costsVisible)
      math(g, '$' + e.cost, xx, yRow[5 + off], 31, e.cost ? C.rose : C.dim, 'center');
  });
  if (!costsVisible) {
    txt(
      g,
      switched
        ? 'Equality counts. Follow V3 and V8.'
        : 'Find the diamonds sent through automatically.',
      960,
      791,
      42,
      C.ink,
      'center',
      'Serif',
    );
    return;
  }
  const revealed = perm
    ? !permute || cue(k, 6, 'This one permutation', 0.05) > 0
    : switched
      ? cue(k, 2, 'F1 counts hits', 0.05) > 0
      : cue(k, 1, 'Now lower just', 0.05) > 0;
  math(g, 'Queued  ' + counts.queue + '/8', 116, 808, 39, C.amber);
  const twiceHits = 2 * (counts.queue - counts.extra);
  math(
    g,
    'F1   ' +
      twiceHits +
      '/' +
      (twiceHits + counts.extra + counts.miss) +
      ' = ' +
      counts.f1.toFixed(3),
    645,
    808,
    36,
    C.dim,
  );
  if (revealed) math(g, 'Bill  $' + counts.total, 1796, 808, 46, C.ink, 'right');
}

export function explanations(g, k) {
  const b = k.beat.beatIndex;
  background(
    g,
    b < 4 ? 'Feature importance' : 'Interventional background',
    b < 4 ? 'Which feature matters on later requests?' : 'Rebuild R3’s score',
  );
  if (b < 4) {
    const credit = cue(k, 2, 'Noise gets ninety-two percent', 0.9) === 1,
      shuffled = cue(k, 2, 'Shuffling noise barely changes', 0.5) === 1;
    txt(g, 'Candidate cuts', 115, 312, 35, C.dim);
    txt(g, 'Training split credit', 725, 312, 35, C.dim);
    txt(g, 'Held-out F1 drop', 1314, 312, 35, C.dim);
    sub(g, '40 training rows', 720, 372);
    sub(g, '2,000 later rows', 1313, 372);
    importance.forEach((f, i) => {
      const y = 503 + i * 225,
        left = 118,
        w = 386,
        n = i === 0 ? 39 : 1;
      txt(g, f.name, left, y, 40, C.ink, 'left', 'Serif');
      line(g, left, y + 70, left + w, y + 70, C.line, 5);
      for (let j = 1; j <= n; j++) {
        const xx = left + (w * j) / (n + 1);
        line(g, xx, y + 53, xx, y + 87, C.edge, 3);
      }
      if (credit) {
        box(g, 725, y + 45, 346 * f.mdi, 44, C.amber);
        math(g, f.mdi.toFixed(3), 725, y, 39, C.amber);
      }
      if (shuffled) {
        box(g, 1315, y + 45, (385 * f.drop) / 0.1, 44, C.blue);
        math(g, f.drop.toFixed(3), 1315, y, 39, C.blue);
      }
    });
    if (shuffled)
      txt(
        g,
        '15 shuffles of each column    ·    F1 shuffle SD  0.007 for each',
        960,
        429,
        34,
        C.dim,
        'center',
      );
    else {
      txt(g, 'Split credit = fraction of training rows', 725, 410, 31, C.dim);
      txt(g, 'at the node × impurity decrease', 725, 451, 31, C.dim);
    }
    return;
  }
  const fixed = cue(k, 4, "Now fix ambiguity at R3's value", 0.7) === 1;
  const supportFixed = cue(k, 5, 'Fixing policy support', 0.65) === 1;
  const xs = (i) => 400 + 190 * i,
    mask = [fixed, supportFixed],
    average = backgroundScore(mask),
    base = backgroundScore([false, false]);
  sub(g, 'Background row', 110, 346);
  sub(g, 'Ambiguity', 110, 451);
  sub(g, 'Support', 110, 536);
  sub(g, 'Leaf score', 110, 643);
  rows.forEach((r, i) => {
    const x = xs(i),
      a = fixed ? rows[2][0] : r[0],
      support = supportFixed ? rows[2][1] : r[1],
      p = predict(fittedStump, [a, support]);
    txt(g, 'R' + (i + 1), x, 346, 34, C.dim, 'center', 'Serif');
    math(g, a.toFixed(1), x, 451, 34, fixed ? C.amber : C.ink, 'center');
    math(g, support, x, 536, 29, supportFixed ? C.amber : C.dim, 'center');
    line(g, x - 57, 587, x + 57, 587, C.line, 3);
    math(g, p.toFixed(2), x, 643, 33, C.blue, 'center');
  });
  txt(g, 'Mean score', 120, 775, 41, C.dim, 'left', 'Serif');
  math(g, average.toFixed(2), 464, 775, 49, C.ink);
  if (fixed) {
    const withAmbiguity = backgroundScore([true, false]);
    const supportTerm = supportFixed ? ' + ' + (average - withAmbiguity).toFixed(2) : '';
    math(
      g,
      base.toFixed(2) + ' − ' + (base - withAmbiguity).toFixed(2) + supportTerm + ' = ' + average.toFixed(2),
      1788,
      775,
      41,
      C.amber,
      'right',
    );
    txt(
      g,
      supportFixed
        ? 'Baseline + ambiguity contribution + support contribution'
        : 'Baseline + ambiguity contribution',
      1780,
      843,
      26,
      C.dim,
      'right',
    );
  }
  if (b === 5) {
    jewel(g, 143, 843, 1, 22);
    txt(g, 'R3 needed review', 181, 843, 33, C.ink);
  }
}

export function contracts(g, k) {
  const b = k.beat.beatIndex;
  const filled = cue(k, 2, 'fill its empty cell with zero', 0.6) === 1;
  background(
    g,
    b < 4 ? 'Input representation' : 'Repeated training samples',
    b >= 4
      ? 'How far do the fits scatter?'
      : filled
        ? 'Where does each numeric value go?'
        : 'Where does an empty cell go?',
  );
  if (b < 4) {
    const values = [filled ? 0 : null, 0, 2],
      n = b >= 3 ? 3 : 2;
    txt(g, 'Support field', 114, 302, 33, C.dim);
    txt(g, 'Test on arrival', 851, 302, 33, C.dim);
    txt(g, 'Route', 1561, 302, 33, C.dim);
    values.slice(0, n).forEach((v, i) => {
      const y = 438 + i * 181,
        x = 448;
      txt(
        g,
        [filled ? 'Filled row' : 'Sparse row', 'Stored zero', 'Ordinary value'][i],
        119,
        y,
        35,
        C.ink,
        'left',
        'Serif',
      );
      box(g, x, y - 41, 195, 82, v === null ? C.dark : C.slate, v === null ? C.faint : C.blue, 3);
      txt(
        g,
        v === null ? 'empty' : String(v),
        x + 97,
        y,
        v === null ? 29 : 40,
        v === null ? C.dim : C.ink,
        'center',
        'Mono',
      );
      line(g, x + 195, y, 796, y, C.line, 4);
      txt(g, v === null ? 'Missing' : v + '  ' + (v <= 1 ? '≤' : '>') + '  1', 846, y, 37, C.ink);
      const route = missingRoute(v);
      line(g, 1120, y, 1479, y, route === 'Add review' ? C.amber : C.blue, 5);
      path(
        g,
        [
          [1464, y - 9],
          [1481, y],
          [1464, y + 9],
        ],
        C.ink,
      );
      txt(g, route, 1513, y, 37, route === 'Add review' ? C.amber : C.blue);
    });
    txt(
      g,
      filled
        ? 'After densification, the first row contains a numeric zero.'
        : 'Missing support goes to review. A value of 1 or less takes the usual checks.',
      120,
      233,
      34,
      C.dim,
    );
    return;
  }
  const x = (p) => 226 + 1434 * p,
    y = 543;
  line(g, x(0), y, x(1), y, C.faint, 4);
  for (let i = 0; i <= 10; i++) {
    line(g, x(i / 10), y - 12, x(i / 10), y + 12, C.dim, 2);
    if (i % 2 === 0) math(g, (i / 10).toFixed(1), x(i / 10), y + 67, 27, C.dim, 'center');
  }
  fits.forEach((v, i) => {
    dot(g, x(v), y, 19, C.blue);
    txt(g, 'Fit ' + (i + 1), x(v), y - 93, 37, C.blue, 'center', 'Serif');
  });
  sub(g, 'Predictions at one fixed input', 226, 306);
  const avg = mean(fits);
  line(g, x(truth), y - 45, x(truth), y + 25, C.amber, 5);
  line(g, x(truth), y - 43, x(avg), y - 43, C.amber, 4);
  txt(g, 'True mean  0.40', x(truth) - 15, 666, 34, C.amber, 'right');
  txt(g, 'Mean fit  0.50', x(avg) + 15, 666, 34, C.blue);
  if (b === 5) {
    const terms = [
      ['Squared bias', biasSq],
      ['Variance', variance],
      ['Noise variance', noise],
    ];
    terms.forEach(([label, value], i) => {
      const x = 515 + i * 320;
      math(g, label, x, 737, 33, C.dim, 'center');
      math(g, value.toFixed(2), x, 797, 43, C.ink, 'center');
      math(g, i === terms.length - 1 ? '=' : '+', x + 160, 797, 43, C.dim, 'center');
    });
    math(g, (biasSq + variance + noise).toFixed(2), 1475, 797, 43, C.ink, 'center');
  }
}

function afterPhrase(k, beat, phrase, duration = 0) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  k.reveal(phrase, 0, { captionStart: phrase });
  const elapsed = k.elapsed - k.wordCue(phrase).end;
  return duration ? clamp(elapsed / duration) : Number(elapsed >= -1e-9);
}

export function finalCase(g, k) {
  const cut = stump.cut;
  const initial = decision(40);
  const lowerPrice = decision(30);
  const replay = cue(k, 3, 'Replay that request', 0) === 1;
  const repriced = afterPhrase(k, 3, 'from forty dollars to thirty') === 1;
  const price = repriced ? 30 : 40;
  const { bills, winner, entry } = repriced ? lowerPrice : initial;
  const equalityKnown = afterPhrase(k, 0, 'The tree sends equality left') === 1;
  const scoreKnown = afterPhrase(k, 1, 'One fifth') === 1;
  const priced =
    afterPhrase(k, 1, 'Suppose we now price a missed review at forty dollars') === 1;
  const extraBillKnown = afterPhrase(k, 2, 'Four extra reviews cost seventy-two dollars') === 1;
  const missBillKnown = repriced
    ? afterPhrase(k, 4, 'Two misses cost sixty dollars') === 1
    : afterPhrase(k, 2, 'Two misses cost eighty') === 1;
  const firstChoice = afterPhrase(k, 2, 'The cheaper cutoff is one fifth') === 1;
  const cutoffMove = afterPhrase(k, 4, 'The half cutoff wins', 0.85);
  const chosen = replay ? cutoffMove === 1 : firstChoice;
  const routeKnown = replay
    ? afterPhrase(k, 4, "That's below a half, so it goes through automatically") === 1
    : afterPhrase(k, 2, 'Our fresh request meets it exactly, so it goes to review') === 1;
  const routed = chosen && routeKnown;
  const open = afterPhrase(k, 5, 'This one needed review') === 1;
  const charged = afterPhrase(k, 5, 'Record a thirty-dollar miss at the half cutoff') === 1;

  background(g, 'Fresh request', 'One request on the seam');
  const seam = stripX(cut),
    left = stripX(0.65),
    right = stripX(4.8);
  glass(g, left, 293, seam - left, 131, null);
  glass(g, seam, 293, right - seam, 131, null);
  if (equalityKnown) line(g, left, 424, seam, 424, C.blue, 5);
  line(g, seam, 277, seam, 446, C.amber, 5);
  ordered.forEach((q) => {
    const x = stripX(q.v);
    jewel(g, x, 342, q.label, 20);
    txt(g, q.id, x, 392, 28, C.ink, 'center');
  });
  txt(g, 'Ambiguity   ≤ ' + cut + ' goes left', left, 244, 35, C.dim);
  const freshX = stripX(fresh[0]);
  jewel(g, freshX, 462, open ? fresh[2] : null, 24);
  txt(g, 'New request   ' + fresh[0].toFixed(2), freshX + 46, 462, 32, C.ink);
  txt(
    g,
    scoreKnown ? 'Leaf score   ' + entry.score.toFixed(2) : 'Leaf score   ?',
    left,
    462,
    40,
    C.ink,
    'left',
    'Serif',
  );
  if (!priced) {
    const leaf = ordered.filter((q) => q.v <= cut);
    const reviews = leaf.filter((q) => q.label).length;
    sub(
      g,
      scoreKnown ? `${reviews} of ${leaf.length} needed review` : 'Count the diamonds in the left leaf.',
      left,
      535,
    );
    return;
  }
  line(g, left, 511, right, 511, C.line, 2);
  txt(g, 'Validation batch', left, 551, 36, C.ink, 'left', 'Serif');
  txt(
    g,
    'Capacity  ' + validationRows.length + '    ·    Extra review  $18    ·    Miss  $' + price,
    right,
    551,
    31,
    C.dim,
    'right',
  );
  bills.forEach((policy, i) => {
    const x = left + i * 865,
      y = 611;
    const mark = chosen && policy.threshold === winner.threshold;
    const totalKnown = i ? missBillKnown : extraBillKnown;
    const terms = i
      ? `${policy.misses} misses × $${price}`
      : `${policy.extra} extra reviews × $18`;
    line(g, x, y - 20, x, y + 70, mark ? C.amber : C.line, mark ? 8 : 3);
    txt(
      g,
      'Cutoff  ' + policy.threshold.toFixed(2) + '   ·   ' + policy.queued + ' queued',
      x + 31,
      y,
      36,
      mark ? C.amber : C.ink,
      'left',
      'Serif',
    );
    math(
      g,
      terms + ' = ' + (totalKnown ? '$' + policy.total : '?'),
      x + 31,
      y + 57,
      35,
      totalKnown ? C.ink : C.dim,
    );
  });

  const scoreX = (score) => left + (right - left) * score;
  const marker = scoreX(entry.score);
  const rulerY = 798;
  const scoreCut = mix(initial.winner.threshold, lowerPrice.winner.threshold, cutoffMove);
  const divider = scoreX(scoreCut);
  txt(g, 'Review score', left, 740, 33, C.dim);
  txt(g, 'New  ' + entry.score.toFixed(2), marker, 740, 36, C.ink, 'center');
  if (routed) {
    glass(g, left, rulerY - 12, divider - left, 24);
    glass(g, divider, rulerY - 12, right - divider, 24, true);
  } else {
    line(g, left, rulerY, right, rulerY, C.faint, 4);
  }
  math(g, '0', left, 824, 28, C.dim, 'center');
  math(g, '1', right, 824, 28, C.dim, 'center');
  bills.forEach(({ threshold }) => {
    const x = scoreX(threshold);
    const selected = chosen && threshold === winner.threshold;
    const color = selected ? C.amber : C.dim;
    line(g, x, rulerY + 12, x, rulerY + 17, color, 3);
    math(g, 'Cutoff ' + threshold.toFixed(2), x, 830, 27, color, 'center');
  });
  if (chosen || cutoffMove > 0) line(g, divider, rulerY - 35, divider, rulerY + 34, C.amber, 7);
  jewel(g, marker, rulerY, open ? fresh[2] : null, 22);

  if (routed) {
    const comparison = entry.review ? ' ≥ ' : ' < ';
    const route = entry.review ? 'Add review' : 'Usual checks';
    const color = entry.review ? C.amber : C.blue;
    math(
      g,
      `${entry.score.toFixed(2)}${comparison}${winner.threshold.toFixed(2)}   →   ${route}`,
      right - 58,
      747,
      34,
      color,
      'right',
    );
    if (open) {
      const outcome = charged ? `Needed review   ·   $${entry.cost} miss` : 'Needed review';
      txt(g, outcome, right, 699, 37, C.amber, 'right', 'Serif');
    }
  } else if (replay && cutoffMove === 0) {
    txt(g, 'Which cutoff costs less?', right, 740, 38, C.ink, 'right', 'Serif');
  }
}
