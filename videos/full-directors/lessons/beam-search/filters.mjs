import { ink, muted, brass, colors, paper, sum, pct, fmt, lerp } from './studio.mjs';
import {
  exactFirstThree,
  printedFirstThree,
  boundaryRow,
  base,
  POLICY_TOKENS as words,
  peaked,
  flat,
  retained,
  survivors,
  filterOrder,
  tailRisk,
  orderGuide,
  orderAnswer,
  freshNames,
  fresh,
  nucleus,
  backupOnly,
  sample,
} from './examples.mjs';
const bed = [116, 0, 1688, 108];
function namesLine(s, row, y, names = words) {
  row.forEach((v, i) => {
    const x = 116 + i * (1688 / row.length);
    s.rect(x, y - 21, 10, 41, colors[i]);
    s.label(names[i], x + 25, y, 36);
    s.mono(fmt(v, 4), x + 392, y, 39, ink, 'right');
  });
}
function ruler(s, row, y, names = words, opts = {}) {
  s.strip(row, names, bed[0], y, bed[2], bed[3], opts);
}
function retainedAt(row, k, t) {
  const cut = survivors(row, k);
  return cut.map((v, i) => lerp(v, k.probabilities[i], t));
}
export function rank(s) {
  const b = s.b;
  if (b >= 5) {
    s.head('A tail event over many positions', 'Has the sequence drawn a tail token yet?');
    const n =
      b === 7 ? 500 : b === 6 ? 100 : Math.max(1, Math.round(100 * s.ramp(5, 'Each new position', 3)));
    const hit = tailRisk(n);
    s.word(n + (n === 1 ? ' position' : ' positions'), 110, 398, 76);
    ruler(s, [hit, 1 - hit], 580, ['at least one hit', 'no hit'], { colors: [brass, '#bfc6b9'] });
    s.mono(pct(hit) + ' hit', 116, 817, 57);
    s.mono('.998^' + n + ' = ' + pct(1 - hit) + ' still clear', 1800, 817, 45, ink, 'right');
    return;
  }
  const row = b >= 3 ? flat : peaked,
    k = retained(row, 'k', 2);
  const cut = (b === 1 && s.on(1, 'Keep the two highest')) || b === 2 || b === 4;
  const t = b >= 3 ? s.ramp(4, 'After dividing', 1) : s.ramp(2, 'stretch their part', 1);
  s.head('Top-k   /   k = 2', 'Keep two pieces of type');
  namesLine(s, row, 363);
  ruler(s, cut ? retainedAt(row, k, t) : row, 525);
  if (cut) s.mono('Original mass kept   ' + fmt(k.mass), 116, 770, 51);
  if (t === 1)
    s.label(
      'Draw shares    ' +
        k.probabilities
          .slice(0, 2)
          .map((v) => pct(v))
          .join('   /   '),
      116,
      894,
      41,
    );
}
export function cumulative(s) {
  const b = s.b,
    row = b < 3 ? peaked : flat;
  const n = b === 1 ? (s.on(1, 'Add revoke') ? 2 : 1) : b === 2 ? 2 : b === 3 ? 3 : 4;
  const mass = sum(row.slice(0, n)),
    norm = b === 2 && s.on(2, 'Divide both shares');
  s.head('Nucleus   /   p = .90', 'The crossing word stays whole');
  namesLine(s, row, 359);
  ruler(
    s,
    norm ? retained(row, 'p', 0.9).probabilities : row,
    539,
    words,
    norm ? {} : { pin: 0.9, pinText: 'threshold  .90' },
  );
  if (!norm) {
    const right = 116 + 1688 * mass;
    s.line(116, 729, right, 729, ink, 7);
    s.line(right, 712, right, 741, ink, 5);
    s.mono('Through ' + words[n - 1] + '   ' + fmt(mass), 116, 851, 48);
  } else s.mono('Draw from create and revoke    ÷ ' + fmt(mass), 116, 850, 44);
}
export function relative(s) {
  const limit = s.on(3, 'eventually they all pass');
  const row = limit ? [0.25, 0.25, 0.25, 0.25] : s.b === 3 ? flat : peaked,
    cut = 0.1 * row[0],
    keep = retained(row, 'min-p', 0.1);
  s.head(
    limit ? 'Min-p   /   high-temperature limit' : 'Min-p   /   base = .10',
    'Set the line from the tallest column',
  );
  const baseline = 809,
    h = 688;
  row.forEach((v, i) => {
    const x = 216 + i * 416;
    s.rect(x, baseline - v * h, 210, v * h, keep.indices.includes(i) ? colors[i] : '#c2bdad');
    s.mono(fmt(v), x + 105, Math.min(baseline - v * h - 45, baseline - cut * h - 38), 44, ink, 'center');
    s.word(words[i], x + 105, 879, 53, ink, 'center');
  });
  const y = baseline - cut * h;
  s.line(113, y, 1801, y, ink, 4, [16, 8]);
  s.mono('Relative cutoff   .10 × ' + fmt(row[0]) + ' = ' + fmt(cut, 4), 114, 309, 42);
}
export function ties(s) {
  const { b, on } = s;
  if (b >= 5) {
    const actual = exactFirstThree,
      printed = printedFirstThree;
    s.head('Precision at p = .99', 'Which three-word sum reaches the line?');
    [
      ['Full precision', actual, false],
      ['Printed inputs', printed, true],
    ].forEach(([name, value, rounded], i) => {
      const y = 427 + i * 249;
      s.label(name, 109, y, 44);
      s.mono(fmt(value, 7), 770, y, 64);
      s.word(value < 0.99 ? 'needs quota' : 'reaches .990', 1323, y, 51);
      s.mono(
        (rounded ? peaked : base.probabilities)
          .slice(0, 3)
          .map((v) => fmt(v, rounded ? 3 : 7))
          .join(' + '),
        109,
        y + 89,
        35,
      );
    });
    return;
  }
  const row = boundaryRow;
  const name =
    b === 1
      ? on(1, 'Top-p point')
        ? 'Top-p .75'
        : 'Top-k 2'
      : b === 2
        ? 'Min-p .50'
        : on(3, 'At min-p one')
          ? 'Min-p 1'
          : 'Top-p 1';
  const kind = name.includes('Min') ? 'min-p' : name.includes('Top-k') ? 'k' : 'p';
  const n = name.endsWith('2') ? 2 : name.endsWith('1') ? 1 : name.endsWith('50') ? 0.5 : 0.75;
  let k = retained(row, kind, n);
  s.head('Boundary rules', 'Which tokens does this rule keep?');
  namesLine(s, row, 364);
  ruler(s, row, 535);
  const extent = sum(k.indices.map((i) => row[i]));
  s.line(116, 711, 116 + 1688 * extent, 711, ink, 7);
  s.line(116 + 1688 * extent, 698, 116 + 1688 * extent, 724, ink, 5);
  s.label(name, 116, 774, 48);
  s.word(k.indices.map((i) => words[i]).join('   +   '), 617, 773, 56);
  s.label(
    b === 4
      ? 'Record tie handling, zero-mass behavior and the minimum number kept.'
      : 'Positive mass only    ·    stable input order breaks rank ties',
    116,
    931,
    36,
  );
}
export function compose(s) {
  const row = filterOrder,
    names = ['A', 'B', 'C'],
    k = retained(row, 'k', 2),
    p = retained(row, 'p', 0.7);
  const afterK = s.on(1, 'removes C'),
    t = s.ramp(2, 'Renormalizing', 1.2);
  const onlyA = s.on(3, 'A alone'),
    reverse = s.on(3, 'Reverse the order');
  const keepBoth = s.on(3, 'Top-p first needs'),
    bothRanked = s.on(3, 'Top-k two then keeps both');
  const second = retained(k.probabilities, 'p', 0.7);
  s.head('Processor order', 'Use the row that reaches this filter');
  const x = 115,
    w = 1687,
    h = 93;
  const mass = onlyA ? second.probabilities : afterK ? retainedAt(row, k, t) : row;
  s.label(
    onlyA ? 'Top-k 2  →  top-p .70' : afterK ? 'Top-k 2   /   original mass kept .85' : 'Input to top-k 2',
    x,
    330,
    38,
  );
  s.strip(mass, names, x, 451, w, h, t > 0 && !onlyA ? { pin: 0.7, pinText: '.70' } : {});
  const first = mass
    .map((v, i) => (v > 0 ? names[i] + ' ' + fmt(v) : ''))
    .filter(Boolean)
    .join('      ');
  s.mono(first, x, 613, 42);
  if (reverse) {
    const final = bothRanked
      ? retained(p.probabilities, 'k', 2).probabilities
      : keepBoth
        ? p.probabilities
        : row;
    s.label(
      bothRanked ? 'Top-p .70  →  top-k 2' : keepBoth ? 'After top-p .70' : 'Original input to top-p .70',
      x,
      720,
      38,
    );
    s.strip(final, names, x, 816, w, h, keepBoth ? {} : { pin: 0.7, pinText: '.70' });
    s.mono(
      final
        .map((v, i) => (v > 0 ? names[i] + ' ' + fmt(v) : ''))
        .filter(Boolean)
        .join('      '),
      x,
      978,
      36,
    );
  } else if (t === 1 && !onlyA) s.mono('A = .60 ÷ .85    threshold = .70', x, 823, 52);
}
export function practice(s) {
  const { b, on } = s,
    u = 0.65;
  if (b === 1 || (b >= 6 && on(6, 'Now read this finished answer'))) {
    s.head(
      'Guide check',
      b === 1 ? 'What belongs in the first field?' : 'Where does this answer first depart from the guide?',
    );
    s.guide(orderGuide, 393);
    if (b === 1) {
      s.label('Permitted first field', 115, 605, 43);
      s.row(orderGuide, 552, 557, 1195, 102);
      return;
    }
    const t = s.ramp(7, 'Move remove after rotate', 1.25),
      fixed = t === 1;
    s.label('Finished answer', 112, 678, 38);
    orderAnswer.forEach((w, i) => {
      const j = i === 1 ? 1 + t : i === 2 ? 2 - t : 0;
      const arc = (i === 1 ? 1 : i === 2 ? -1 : 0) * Math.sin(Math.PI * t) * 80;
      s.tile(555 + j * 405, 631 + arc, 345, 96, w, colors[orderGuide.indexOf(w)], 52);
    });
    if (b === 7 && t === 0) {
      s.line(1132, 458, 1132, 617, '#a15036', 6, [15, 10]);
      s.label('First mismatch   ·   step 2', 110, 850, 46);
    }
    if (fixed) s.label('All three steps match the guide.', 110, 850, 48);
    return;
  }
  const picked = s.on(5, 'Rotate'),
    correct = s.on(6, 'Backup'),
    cut = s.on(3, 'After rotate');
  const t = s.ramp(3, 'Divide by that retained mass', 1);
  const row = correct ? backupOnly : cut ? retainedAt(fresh, nucleus, t) : fresh;
  s.head(
    'Guide    backup → rotate → remove',
    b <= 3 ? 'Which words reach three quarters of the mass?' : 'Who owns the pin at .65?',
  );
  s.label('Original row', 116, 304, 28);
  namesLine(s, fresh, 362, freshNames);
  const opts =
    b >= 4 ? { pin: u, pinText: 'draw  .65' } : !cut ? { pin: 0.75, pinText: 'threshold  .75' } : {};
  ruler(s, row, 540, freshNames, opts);
  if (correct || picked) {
    const v = sample(row, u);
    s.label('Sampled first word', 115, 840, 41);
    s.tile(710, 780, 485, 117, freshNames[v], colors[v], 64);
  } else if (b === 4) s.slot(710, 780, 485, 117, '?');
  else if (cut) s.mono('Retained mass    .46 + .32 = ' + fmt(nucleus.mass), 114, 834, 50);
}
