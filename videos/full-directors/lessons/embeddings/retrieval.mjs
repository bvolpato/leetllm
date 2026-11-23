import {
  C,
  arrow,
  axis,
  book,
  box,
  dial,
  dot,
  ground,
  line,
  mono,
  phase,
  spoken,
  pos,
  serif,
  tag,
  text,
  ticketArt,
} from './drawing.mjs';
import {
  baseGuides,
  centerPopulation,
  contextPath,
  cos,
  fmt,
  length,
  maskedMean,
  mix,
  names,
  plus,
  scale,
  searchState,
  unit,
  V,
  vec,
  winner,
} from './geometry.mjs';

export function translated(c, k) {
  const b = k.beat.beatIndex,
    shift = phase(k, 1, 'Add the same offset', 2);
  const center = phase(k, 2, 'Subtract the population mean', 2);
  ground(c, 'Keep the distance. Change the angle.');
  const all = Object.values(V).map((v) => plus(v, [3 * shift, 3 * shift]));
  const mean = centerPopulation(all).mean;
  const points = all.map((v) => plus(v, scale(mean, -center)));
  const pt = axis(c, [283, 800], 129, [-0.93, 4.55], [-0.85, 4.55]);
  points.forEach((v, i) => {
    const ink = [C.blue, C.aqua, C.muted, C.coral][i];
    if (i === 1 || i === 3) arrow(c, pt([0, 0]), pt(v), ink, 7, 18);
    dot(c, pt(v), i === 1 || i === 3 ? 9 : 5, ink);
  });
  line(c, pt(points[1]), pt(points[3]), C.gold, 6, [6, 5]);
  dot(c, [192, 944], 10, C.aqua);
  text(c, 'river', 220, 956, 34, C.aqua);
  dot(c, [388, 944], 10, C.coral);
  text(c, 'money', 416, 956, 34, C.coral);
  tag(c, 'River to money · tip distance', 1010, 274);
  mono(c, fmt(length(plus(points[1], scale(points[3], -1)))), 1010, 383, 80, C.gold);
  tag(c, 'Cosine from the origin', 1010, 482);
  mono(c, fmt(cos(points[1], points[3])), 1010, 592, 80);
  if (b < 2) {
    mono(c, 'Offset   ' + vec([3 * shift, 3 * shift]), 1010, 748, 43);
    if (b === 1) mono(c, 'Subtract fitted mean  ' + vec(mean), 1010, 832, 38, C.blue);
  } else {
    serif(c, 'Keep charging.', 1010, 744, 51, C.aqua);
    serif(c, 'Stop charging.', 1010, 815, 51, C.coral);
    text(c, 'Which action answers the ticket?', 1010, 905, 36);
  }
}
export function anisotropy(c, k) {
  ground(c, 'What happens to the shared direction?');
  const b = k.beat.beatIndex;
  const three = b >= 3;
  const shift = three ? phase(k, 4, 'Subtract that mean', 1.7) : phase(k, 3, 'Subtract the mean', 1.7);
  const raw = three
    ? [
        [10, 1],
        [10, 0],
        [10, -1],
      ]
    : [
        [10, 1],
        [10, -1],
      ];
  const mean = centerPopulation(raw).mean;
  const pts = raw.map((v) => plus(v, scale(mean, -shift)));
  const pt = axis(c, [185, 579], 89, [-0.75, 11], [-2.6, 2.8]);
  pts.forEach((v, i) => {
    const ink = i === 0 ? C.coral : i === pts.length - 1 ? C.aqua : C.blue;
    arrow(c, pt([0, 0]), pt(v), ink, 8, 24);
    dot(c, pt(v), length(v) === 0 ? 14 : 8, length(v) === 0 ? C.light : ink, ink, 4);
  });
  tag(c, 'Current coordinates', 1287, 276);
  pts.forEach((v, i) => {
    const color = i === 0 ? C.coral : i === pts.length - 1 ? C.aqua : C.blue;
    text(
      c,
      i === 0 ? 'Invoice' : i === pts.length - 1 ? 'Phone' : 'Middle',
      1205,
      369 + i * 85,
      38,
      color,
    );
    mono(c, vec(v), 1460, 369 + i * 85, 46, color);
  });
  tag(c, three ? 'Cosine with middle point' : 'Pair cosine', 1287, 655);
  const score = cos(pts[0], pts[1]);
  const explainZero = b === 3 && spoken(k, 4, 'has length zero');
  const showUndefined = spoken(k, 4, 'is undefined');
  mono(c, score === null && !showUndefined ? '?' : fmt(score, 4), 1287, 745, 65);
  if (explainZero) mono(c, 'Middle length = 0', 1287, 850, 41, C.blue);
  if (b < 2) mono(c, 'dot = 99     squared lengths = 101', 177, 930, 42);
  else if (b < 4) mono(c, 'Subtract fitted mean  ' + vec(mean), 178, b === 3 ? 854 : 931, 45, C.blue);
  else
    text(c, 'Fit a training mean, reuse it on held-out vectors, then compare rankings.', 104, 934, 43);
}
const inks = [C.coral, C.aqua];
function compass(c, state, allQueries, rad = 280) {
  const origin = [470, 548],
    s = allQueries ? rad * 0.57 : rad * 0.78;
  dial(c, origin, rad);
  const p = ([x, y]) => [origin[0] + s * x, origin[1] - s * y];
  state.guides.forEach((v, i) => {
    const end = p(v);
    arrow(c, origin, end, inks[i], 8, 20);
    dot(c, end, 13, inks[i], C.light, 3);
  });
  state.queries.slice(0, allQueries ? 2 : 1).forEach((v, i) => {
    const [x, y] = p(v);
    box(c, x - 23, y - 23, 46, 46, null, 2, inks[i], 5);
  });
  dot(c, origin, 8, C.ink);
  box(c, 158, 877, 34, 34, null, 2, C.ink, 4);
  text(c, 'ticket query', 213, 905, 35);
  dot(c, [465, 893], 12, C.ink);
  text(c, 'indexed guide', 496, 905, 35);
}
export function contract(c, k) {
  ground(c, 'Will the old query fit the new index?');
  const angle = Math.PI / 2,
    di = phase(k, 2, 'turns every guide', 1.65),
    qi = phase(k, 3, 'Turn the query', 1.65);
  const state = searchState(
    [
      [1, 0],
      [0, -1],
    ],
    qi * angle,
    di * angle,
  );
  compass(c, state, false);
  const b = k.beat.beatIndex,
    row = state.matrix[0];
  tag(c, 'Invoice query', 920, 264, C.coral);
  mono(c, vec(state.queries[0]), 920, 356, 61, C.coral);
  for (let i = 0; i < 2; i++) {
    const x = 916 + i * 461;
    book(c, i, x, 445, 422, 125);
    mono(c, vec(state.guides[i]), x + 35, 639, 47, inks[i]);
    if (b !== 1) mono(c, 'score ' + fmt(row[i]), x + 35, 728, 43);
  }
  if (b === 1) serif(c, 'Which guide lines up?', 920, 854, 63);
  else if (qi > 0 && qi < 1) serif(c, 'Turn the query with the index', 920, 854, 51);
  else if (b < 3)
    serif(c, 'Opens ' + names[winner(row)].toLowerCase() + ' guide', 920, 854, 63, inks[winner(row)]);
  else {
    text(c, 'Pin both encoder revisions and their input recipes.', 914, 839, 35);
    text(c, 'Rebuild the index and switch the paired query path.', 914, 906, 35);
  }
}
function afterPhrase(k, beat, phrase) {
  const current = k.beat.beatIndex + 1;
  if (current !== beat) return current > beat;
  k.reveal(phrase, 0, { captionStart: phrase });
  return k.elapsed + 1e-9 >= k.wordCue(phrase).end;
}
export function substitute(c, k) {
  ground(c, 'How does replacing one clue move the tip?');
  const b = k.beat.beatIndex;
  const shares = [0.5, 0.4, 0.1];
  const [origin, pivot, riverTip, oldTip] = contextPath([V.bank, V.river, V.water], shares);
  const [, , moneyTip, newTip] = contextPath([V.bank, V.money, V.water], shares);
  const waterStep = scale(V.water, shares[2]);
  const delta = plus(newTip, scale(oldTip, -1));
  const replace = phase(k, 3, 'money points mostly right', 0.9);
  const slideRight = phase(k, 3, 'Four tenths of their difference', 0.9);
  const slideDown = phase(k, 3, 'and takes point three six off the height', 0.9);
  const showDelta = afterPhrase(
    k,
    3,
    'Four tenths of their difference adds point three six across and takes point three six off the height',
  );
  const showNewTip = afterPhrase(k, 3, 'The new tip is at point six seven, point three eight');
  const pt = axis(c, [201, 826], 556, [-0.15, 1.15], [-0.08, 1.06], 0.25);

  arrow(c, pt(origin), pt(pivot), C.blue, 10);
  dot(c, pt(pivot), 8, C.blue);
  if (replace === 0) {
    arrow(c, pt(pivot), pt(riverTip), C.gold, 10);
  } else {
    if (b === 2) {
      line(c, pt(pivot), pt(riverTip), C.muted, 4, [10, 7]);
      line(c, pt(riverTip), pt(oldTip), C.muted, 4, [10, 7]);
      dot(c, pt(oldTip), 10, C.light, C.muted);
    }
    arrow(c, pt(pivot), pt(mix(pivot, moneyTip, replace)), C.gold, 10);
  }
  const waterStart = [
    pos(riverTip[0], moneyTip[0], slideRight),
    pos(riverTip[1], moneyTip[1], slideDown),
  ];
  arrow(c, pt(waterStart), pt(plus(waterStart, waterStep)), C.aqua, 9);
  if (replace === 0) dot(c, pt(oldTip), 12, C.gold);
  else if (showNewTip && slideDown === 1) dot(c, pt(newTip), 12, C.gold);
  if (b === 2 && showDelta && slideDown === 1) {
    const corner = [newTip[0], oldTip[1]];
    line(c, pt(oldTip), pt(corner), C.gold, 4, [9, 7]);
    line(c, pt(corner), pt(newTip), C.gold, 4, [9, 7]);
    const [acrossX, acrossY] = pt(mix(oldTip, corner, 0.5));
    const [downX, downY] = pt(mix(corner, newTip, 0.5));
    mono(c, '+' + fmt(delta[0]), acrossX, acrossY - 22, 37, C.gold, 'center');
    mono(c, fmt(delta[1]), downX + 23, downY + 12, 37, C.gold);
  }
  dot(c, pt(V.bank), 11, C.light, C.blue, 4);
  mono(c, 'Stored bank  ' + vec(V.bank), 140, 941, 35, C.blue);

  tag(c, 'Contribution', 970, 251);
  tag(c, 'Weighted step', 1465, 251);
  const clue = replace > 0 ? 'money' : 'river';
  const colors = [C.blue, C.gold, C.aqua];
  ['bank', clue, 'water'].forEach((word, i) => {
    const y = 323 + i * 82;
    mono(c, fmt(shares[i]) + ' × ' + word, 970, y, 45, colors[i]);
    if (i !== 1 || replace === 0 || replace === 1)
      mono(c, vec(scale(V[word], shares[i])), 1465, y, 43, colors[i]);
  });
  line(c, [970, 525], [1803, 525], C.grid);

  if (b === 0) {
    tag(c, 'River occurrence', 970, 605);
    mono(c, vec(oldTip), 970, 690, 56, C.gold);
  } else if (b === 1) {
    tag(c, 'Original clue', 970, 602);
    tag(c, 'Replacement clue', 1417, 602);
    mono(c, 'river ' + vec(V.river), 970, 670, 40);
    mono(c, 'money ' + vec(V.money), 1417, 670, 40);
    mono(c, 'River tip  ' + vec(oldTip), 970, 770, 43, C.gold);
    serif(c, 'Will the tip move up or down?', 970, 878, 50);
  } else if (b === 2) {
    mono(c, 'River tip  ' + vec(oldTip), 970, 608, 43, C.muted);
    if (showDelta) mono(c, 'Tip shift  ' + vec(delta), 970, 732, 43, C.gold);
    else if (slideRight > 0) text(c, 'Same water step, new starting point', 970, 732, 40, C.aqua);
    if (showNewTip) mono(c, 'Money tip  ' + vec(newTip), 970, 856, 53, C.gold);
  } else {
    const n = unit(newTip);
    const normalize = phase(k, 4, 'Normalize the new arrow', 0.85);
    arrow(c, pt(origin), pt(mix(newTip, n, normalize)), C.gold, 6, 21);
    if (afterPhrase(k, 4, 'Its length becomes one and its direction stays fixed'))
      mono(c, 'Unit occurrence  ' + vec(n), 970, 647, 41, C.gold);
    if (phase(k, 4, 'Now average', 0.75) > 0) {
      tag(c, 'Bank', 970, 745);
      tag(c, 'Occurrence', 1237, 745);
      tag(c, 'Water', 1556, 745);
      mono(c, vec(V.bank), 970, 808, 37);
      mono(c, vec(newTip), 1237, 808, 37);
      mono(c, vec(V.water), 1556, 808, 37);
      if (afterPhrase(k, 4, 'That pink tip summarizes three rows')) {
        const pooled = maskedMean([V.bank, newTip, V.water], [1, 1, 1]);
        arrow(c, pt(origin), pt(pooled), C.pink, 6, 19);
        dot(c, pt(pooled), 10, C.pink);
        mono(c, 'Mean of 3 rows ≈ ' + vec(pooled), 970, 922, 43, C.pink);
      }
    }
  }
}

function board(c, state, cells, routed) {
  tag(c, 'Dot product', 905, 350);
  names.forEach((name, i) => {
    const x = 1370 + i * 285;
    text(c, name + ' guide', x, 350, 36, inks[i], 'Sans', 'center', 600);
    mono(c, vec(state.guides[i]), x, 414, 35, inks[i], 'center');
  });
  for (let i = 0; i < 2; i++) {
    const y = 537 + i * 160,
      row = state.matrix[i],
      win = winner(row);
    serif(c, names[i] + ' ticket', 902, y, 43, inks[i]);
    mono(c, vec(state.queries[i]), 903, y + 57, 35);
    for (let j = 0; j < 2; j++) {
      const x = 1370 + j * 285;
      if (routed[i] && j === win) box(c, x - 87, y - 48, 174, 100, j ? C.sea : C.rose, 8, inks[j], 3);
      const visible = cells[i][j];
      mono(c, visible ? fmt(row[j]) : '?', x, y + 24, 63, visible ? C.ink : C.muted, 'center');
    }
    line(c, [903, y + 88], [1809, y + 88], C.grid);
  }
}
export function practice(c, k) {
  const b = k.beat.beatIndex;
  if (b === 6) {
    ground(c, 'Which token follows the prefix?');
    const seen = afterPhrase(k, 7, 'Phone is the token we score here');
    if (seen) ticketArt(c, 1, 414, 517, 1.23);
    else {
      box(c, 177, 414, 427, 251, C.light, 7, C.muted, 3);
      line(c, [178, 416], [390, 558], C.muted, 4);
      line(c, [603, 416], [390, 558], C.muted, 4);
      tag(c, 'Held-out text', 390, 623, C.muted, 'center');
    }
    serif(c, 'charge the', 848, 503, 85);
    box(c, 1320, 410, 324, 126, C.sea, 9, C.aqua, 3);
    serif(c, seen ? 'phone' : '?', 1482, 499, 71, C.aqua, 'center');
    mono(c, seen ? 'P(phone | charge the)' : 'P(? | charge the)', 846, 663, 48, C.blue);
    text(c, 'Score the actual next token in held-out text.', 846, 790, 41);
    return;
  }
  if (b === 5) {
    ground(c, 'Why did the invoice open the phone guide twice?');
    tag(c, 'First search', 104, 277);
    tag(c, 'Migration test', 1038, 277);
    serif(c, 'charge', 108, 407, 80, C.blue);
    serif(c, 'charge on the invoice', 1035, 407, 63, C.coral);
    text(c, 'Shared lookup · one query', 108, 506, 43);
    text(c, 'Old query · new index', 1035, 506, 43);
    book(c, 1, 109, 582, 507, 161);
    book(c, 1, 1036, 582, 507, 161);
    const covered = phase(k, 6, 'cover its last word', 0.85);
    if (covered > 0) {
      serif(c, 'charge the', 112, 904, 58);
      box(c, 441, 846, 208, 78, C.sea, 7, C.aqua);
      serif(c, '?', 545, 904, 51, C.aqua, 'center');
      mono(c, 'P(? | charge the)', 742, 901, 42, C.blue);
    }
    return;
  }
  ground(c, 'Which test ticket catches the index change?');
  const da = phase(k, 2, 'Rotate only the indexed guides', 1.8);
  const qa = phase(k, 5, 'Watch the ticket squares turn', 1.8);
  const state = searchState(baseGuides, (-qa * Math.PI) / 2, (-da * Math.PI) / 2);
  compass(c, state, true);
  const initial =
    b === 0 && afterPhrase(k, 1, 'Each ticket gives its own guide two and the other guide zero');
  const phoneScores = afterPhrase(k, 3, 'It scores minus two against invoice and zero against phone');
  const phoneRouted = afterPhrase(k, 3, 'The phone guide opens');
  const invoiceScore = afterPhrase(k, 4, 'Against invoice, one minus one gives zero');
  const phoneGuideScore = afterPhrase(k, 4, 'Against phone, one plus one gives two');
  const invoiceRouted = afterPhrase(k, 4, 'The invoice ticket opens the wrong guide');
  const repairedScores = afterPhrase(k, 5, 'The two diagonal scores return to two') && qa === 1;
  const repairedRoutes = afterPhrase(k, 5, 'Each ticket opens its own guide') && qa === 1;
  const showMixed = b === 2 || b === 3 || (b === 4 && qa === 0);
  const showAll = initial || repairedScores;
  const cells = [
    [showAll || (showMixed && invoiceScore), showAll || (showMixed && phoneGuideScore)],
    [showAll || (showMixed && phoneScores), showAll || (showMixed && phoneScores)],
  ];
  const routed = [
    initial || repairedRoutes || (showMixed && invoiceRouted),
    initial || repairedRoutes || (showMixed && phoneRouted),
  ];
  const version = (t) => (t === 0 ? 'A' : t === 1 ? 'B' : 'turning');
  tag(c, 'Query ' + version(qa) + '    /    Index ' + version(da), 904, 254);
  board(c, state, cells, routed);
  if (b === 1) serif(c, 'Pick your test: phone or invoice?', 903, 907, 48);
  else if (showMixed && phoneRouted) {
    const ticket = invoiceRouted ? 0 : 1;
    const selected = winner(state.matrix[ticket]);
    serif(c, names[ticket] + ' ticket', 905, 902, 47, inks[ticket]);
    tag(c, selected === ticket ? 'Expected guide' : 'Wrong guide', 905, 950, inks[ticket]);
    arrow(c, [1218, 887], [1292, 887], C.ink, 6, 19);
    book(c, selected, 1321, 828, 431, 124);
  } else if (repairedRoutes) text(c, 'Both tickets open their own guides.', 905, 909, 42, C.aqua);
}
