import { C, mix } from './art.mjs';
import { replay, highRestore, wilsonLower } from './cases.mjs';

function movingCut(f, chapter) {
  if (chapter === 12) {
    if (f.b >= 3) return 0.995;
    return (
      0.995 +
      0.00455 * f.cue(2, 'Slide the cutoff', 2.8) +
      0.00045 * f.cue(2, 'Restoration is the last one out', 1.7)
    );
  }
  if (chapter === 10)
    return (
      0.99 + 0.005 * f.cue(2, 'Move the line', 1.4) + 0.004 * f.cue(3, 'Move the line again', 1.3)
    );
  return 0.99 + 0.005 * f.cue(2, 'Return to point', 1) + 0.004 * f.cue(3, 'At point', 1.1);
}
export function scores(f, chapter) {
  const { b, on, cue, base, title, tag, text, mono, line, dot, rect, book } = f;
  const challenge = chapter === 12,
    narrow = challenge && on(3, 'retention-only route'),
    disabled = challenge && on(4, 'Switch off semantic reuse');
  const cut = movingCut(f, chapter),
    shift = challenge ? cue(0, 'Change just the restoration vector', 1.65) : 0;
  const r = replay(cut, shift, narrow, disabled),
    ax = 680,
    end = 1528;
  let digits = challenge ? 5 : 4;
  // Keep a rounded tie from making a skipped score look eligible.
  while (
    r.rows.some(
      (row) => row.eligible && !row.proposed && row.score.toFixed(digits) === cut.toFixed(digits),
    )
  ) {
    digits++;
  }
  const pos = (s) => ax + ((s - 0.99) / 0.01) * (end - ax);
  base('Shadow review · labeled question / answer pairs');
  title(
    challenge
      ? disabled
        ? 'Reuse disabled for this group'
        : narrow
          ? 'A narrower question class'
          : b < 2
            ? 'The restoration question moves'
            : b === 3
              ? 'Return the cutoff to 0.995'
              : 'Sweep the same score axis'
      : 'Which questions clear the minimum?',
  );
  tag('Reviewed pair', 103, 290);
  tag('Cosine similarity', ax, 268);
  tag('Shadow decision', 1574, 290);
  for (const v of [0.99, 0.992, 0.994, 0.996, 0.998, 1]) {
    const x = pos(v);
    line(x, 374, x, 783, C.grid, 2, [4, 12]);
    f.middle(v.toFixed(3), x, 848, 28, C.muted);
  }
  if (!disabled) rect(pos(cut), 368, Math.max(0, end - pos(cut)), 425, '#e1e9d7', 0);
  const cutter = pos(cut);
  r.rows.slice(0, 5).forEach((row, i) => {
    const y = 408 + i * 85;
    const color = row.correct ? C.navy : C.rust;
    text(row.name, 105, y + 14, 43, color, { max: 355 });
    mono(
      row.eligible ? row.score.toFixed(digits) : 'bypass',
      488,
      y + 10,
      30,
      row.eligible ? C.ink : C.rust,
      170,
    );
    line(ax, y, end, y, '#acb9ad', 2);
    text(
      row.eligible ? (row.proposed ? 'Propose' : 'Skip') : 'Read fresh',
      1574,
      y + 12,
      37,
      row.eligible ? (row.proposed ? color : C.muted) : C.green,
    );
    if (!row.eligible) return;
    const x = pos(row.score);
    if (row.proposed) {
      dot(x, y, 15, color);
      dot(x, y, 5, C.white);
    } else {
      line(x - 9, y - 9, x + 9, y + 9, C.muted, 4);
      line(x + 9, y - 9, x - 9, y + 9, C.muted, 4);
    }
  });
  if (!disabled) {
    line(cutter, 358, cutter, 789, C.gold, 4);
    f.poly(
      [
        [cutter - 12, 347],
        [cutter + 12, 347],
        [cutter, 367],
      ],
      C.gold,
    );
    mono(
      '≥ ' + cut.toFixed(digits),
      Math.max(ax, Math.min(cutter - 60, end - 166)),
      325,
      32,
      C.gold,
    );
  }
  if (narrow) {
    text(
      disabled ? '0 questions reach semantic search' : '4 duration questions reach search',
      100,
      951,
      39,
      C.green,
    );
    book(1410, 866, 0.62, 'Current policy');
  } else if (challenge && !f.done(2)) {
    text('Restoration vector', 104, 941, 34, C.muted);
    mono(
      shift === 1 ? '(0.9999, 0.01, 0)' : shift === 0 ? '(0.94, 0.10, 0)' : 'Changing direction',
      446,
      941,
      36,
      C.rust,
    );
  } else if (challenge) {
    text('Remaining proposals', 106, 948, 35, C.muted);
    mono(r.proposals.length, 612, 949, 57);
  } else if (b > 0) {
    text('Correct / proposed', 106, 949, 34, C.muted);
    mono(r.good.length + ' / ' + r.proposals.length, 530, 952, 42);
    text('Found / acceptable', 1020, 949, 34, C.muted);
    mono(r.good.length + ' / 4', 1510, 952, 42);
  }
}
export function denominator(f) {
  const { base, title, tag, text, middle, mono, line, dot } = f,
    r = replay(movingCut(f, 11));
  base('Seven shadow requests');
  title('Trace the denominator back to its requests');
  mono('Minimum similarity  ' + r.threshold.toFixed(4), 103, 265, 33, C.gold);
  const sets = [
    r.rows,
    r.rows.filter((x) => x.eligible),
    r.rows.filter((x) => x.proposed),
    r.rows.filter((x) => x.proposed && x.correct),
  ];
  const labels = ['Arrive', 'Eligible for search', 'Proposed', 'Acceptable proposals'];
  const x = (i) => 651 + i * 157,
    y = (j) => 354 + j * 133;
  r.rows.forEach((row, i) => {
    const count = sets.filter((s) => s.some((a) => a.id === row.id)).length;
    line(x(i), y(0), x(i), y(count - 1), row.correct ? C.blue : row.eligible ? C.rust : C.muted, 5);
    for (let j = 0; j < count; j++) {
      dot(x(i), y(j), 31, row.correct ? C.navy : row.eligible ? C.rust : C.muted);
      middle(row.id, x(i), y(j) + 9, 25, C.white);
    }
    if (i > 3)
      middle(i === 4 ? 'Restore' : i === 5 ? 'Live' : 'Write', x(i), y(0) - 65, 25, C.muted);
  });
  sets.forEach((s, i) => {
    text(labels[i], 105, y(i) + 14, 40);
    mono(s.length, 1760, y(i) + 15, 48);
  });
  const total = r.proposals.length,
    good = r.good.length;
  tag('All traffic', 107, 899);
  mono(total + ' / ' + r.total, 108, 965, 47);
  tag('Eligible', 565, 899);
  mono(total + ' / ' + r.eligible, 565, 965, 47);
  tag('Precision', 1015, 899);
  mono(good + ' / ' + total, 1015, 965, 47);
  tag('Labeled recall', 1470, 899);
  mono(good + ' / 4', 1470, 965, 47);
}
function confidenceLine(f, n, y) {
  const lower = wilsonLower(n, n),
    left = 174,
    right = 1700,
    x = mix(left, right, lower);
  f.line(left, y, right, y, C.grid, 6);
  for (let j = 0; j <= 4; j++) {
    let xx = mix(left, right, j / 4);
    f.line(xx, y - 8, xx, y + 12, C.muted, 3);
    f.middle(25 * j + '%', xx, y + 59, 30, C.muted);
  }
  f.line(x, y, right, y, C.blue, 14);
  f.dot(x, y, 15, C.navy);
  f.dot(right, y, 12, C.navy);
  f.text((100 * lower).toFixed(2) + '%', Math.min(x - 24, 1512), y - 40, 47, C.navy, {
    face: 'Mono',
  });
}
export function confidence(f) {
  const { b, on, base, title, tag, text, mono, rect } = f;
  const n = on(1, 'several thousand independently reviewed') ? 5714 : 4;
  base('Observed hit precision');
  title('How much precision do the reviews support?');
  tag('Accepted / independently reviewed', 122, 351);
  mono(n.toLocaleString('en-US') + ' / ' + n.toLocaleString('en-US'), 120, 471, 82);
  text('Two-sided 95% Wilson interval', 120, 617, 44);
  confidenceLine(f, n, 751);
  if (b === 2) {
    rect(115, 891, 1660, 76, C.pale, 6);
    text(
      'Evidence applies to the evaluated encoder, index, cutoff, corpus and traffic.',
      141,
      943,
      39,
      C.navy,
    );
  }
}
export function heldout(f) {
  const { b, on, base, title, tag, text, mono, rect, line } = f;
  base('Frozen cutoff · held-out cases');
  if (b < 2) {
    title('Follow one independent evaluation window');
    const stats = [
      ['Eligible exact misses', '10,000'],
      ['Proposed', '5,714'],
      ['Accepted by review', '5,714'],
    ];
    stats.forEach(([l, v], i) => {
      let x = 120 + i * 585;
      tag(l, x, 357);
      mono(v, x, 462, 76);
      if (i < 2) f.arrow(x + 400, 424, x + 514, 424, C.muted);
    });
    if (b === 1) {
      tag('All proposals accepted · z = 1.96', 125, 612);
      mono('n / (n + z²)', 125, 705, 54);
      confidenceLine(f, 5714, 829);
    } else
      text('Each proposal pairs this request with one saved answer.', 124, 687, 45, C.ink, {
        face: 'Serif',
      });
    return;
  }
  title(
    b === 4 ? 'Which pairs count as evidence?' : 'Copy four reviews. Count the independent IDs.',
  );
  const copied = on(2, 'Copy all four rows');
  if (b === 4) {
    const list = [
      'Held-out topics, tenants and time windows',
      'Hard negatives, including restoration',
      'Fresh outputs checked against policy evidence',
    ];
    list.forEach((v, i) => {
      const y = 365 + 144 * i;
      f.dot(139, y - 13, 10, C.green);
      text(v, 183, y, 48);
      line(125, y + 42, 1725, y + 42);
    });
    mono('0 proposals  →  precision undefined', 125, 873, 49);
    return;
  }
  for (let i = 0; i < 4; i++) {
    const x = 135 + i * 425;
    rect(x, 343, 344, 103, C.pale, 8);
    mono('case ' + (i + 1), x + 30, 410, 49);
    if (copied) {
      line(x + 42, 451, x + 42, 503, C.grid, 3, [4, 8]);
      rect(x, 515, 344, 92, C.light, 8);
      mono('case ' + (i + 1), x + 30, 576, 44, C.muted);
    }
  }
  tag('All independent cases succeeded', 135, 736);
  mono(
    '4 / (4 + 1.96²)' + (copied ? ' = ' + (wilsonLower(4, 4) * 100).toFixed(2) + '%' : ''),
    132,
    841,
    62,
  );
  if (copied) text('4 distinct case IDs', 136, 936, 42, C.green);
}
