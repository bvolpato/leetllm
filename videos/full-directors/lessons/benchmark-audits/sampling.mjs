import assert from 'node:assert/strict';
import {
  PROGRAMS,
  PAIRS,
  exposureCases,
  CASES,
} from '../../../films/benchmark-audits/fixtures.mjs';
import {
  subsetCoverage,
  wilsonInterval,
  exactPairedP,
  binomialChoose,
} from '../../../films/benchmark-audits/arithmetic.mjs';
import {
  C,
  base,
  line,
  fill,
  path,
  dot,
  sheet,
  letter,
  mono,
  powerFormula,
  serif,
  label,
  mark,
  medallion,
  arrow,
  mix,
  cue,
  note,
  reading,
  ticks,
} from './art.mjs';

const passes = (id) => PROGRAMS.find((p) => p.id === id).pass;
const pairs = PAIRS.map(({ a, b, pass }) => ({
  a,
  b,
  available: pass,
  returned: a,
  selected: passes(a),
}));
const available = pairs.filter((p) => p.available).length,
  selected = pairs.filter((p) => p.selected).length;
const rounds = (first, second) =>
  [
    [first, second],
    [second, first],
  ].map((order) => {
    const slot = +(order[1].facts > order[0].facts);
    return { order, slot, winner: order[slot] };
  });
const concise = { id: 'Concise', claim: 'Commander approval required.', facts: 1 };
const friendly = { id: 'Friendly', claim: 'Please get commander approval.', facts: 1 };
const omission = { id: 'Incomplete', claim: 'Coordinate with the team.', facts: 0 };
const outcomeGroups = [
  { a: true, b: true, title: 'Both pass', color: C.paper },
  { a: true, b: false, title: 'A pass → B miss', color: C.rose },
  { a: false, b: true, title: 'A miss → B pass', color: C.pale },
  { a: false, b: false, title: 'Both miss', color: C.paper },
].map((group) => ({ ...group, cases: CASES.filter((q) => q.A === group.a && q.B === group.b) }));
const renewalPair = CASES.find((q) => q.id === 'Q93');
const groupOf = (q) => outcomeGroups.findIndex((group) => group.cases.includes(q));
const allPassCount = 3;
const initialProposal = 0.8;
const proposedSE = (p) => Math.sqrt(p * (1 - p) / allPassCount);
const allPassDistance = (p) => Math.sqrt(allPassCount * (1 - p) / p);
const lowerAllPass = wilsonInterval(allPassCount, allPassCount).low;
const loseFractions = Array.from({ length: 10 }, (_, i) => [80 - i, 100 - i]);
export function checkSampling() {
  assert.equal(pairs.length, new Set(pairs.map((p) => p.a + ',' + p.b)).size);
  assert.ok(
    pairs.every(
      (p) =>
        p.a < p.b &&
        p.available === (passes(p.a) || passes(p.b)) &&
        p.selected === passes(p.returned),
    ),
  );
  assert.deepEqual([pairs.length, available, selected], [28, 13, 8]);
  assert.deepEqual(
    [
      pairs.find((p) => p.a === 1 && p.b === 2).selected,
      pairs.find((p) => p.a === 2 && p.b === 3).selected,
    ],
    [false, true],
  );
  assert.equal(
    (1 - loseFractions.reduce((s, [a, b]) => (s * a) / b, 1)).toFixed(4),
    subsetCoverage(100, 20, 10).toFixed(4),
  );
  assert.equal(subsetCoverage(8, 4, 2).toFixed(3), '0.786');
  assert.equal((subsetCoverage(4, 4, 2) + subsetCoverage(4, 0, 2)) / 2, 0.5);
  assert.deepEqual(
    rounds(concise, friendly).map((r) => r.winner.id),
    ['Concise', 'Friendly'],
  );
  assert.deepEqual(
    rounds(concise, omission).map((r) => r.winner.id),
    ['Concise', 'Concise'],
  );
  assert.deepEqual(
    exposureCases.filter((r) => r.used).map((r) => r.id),
    ['A', 'C'],
  );
  assert.equal((0.8 ** 3).toFixed(3), '0.512');
  assert.deepEqual(
    [
      [3, 3],
      [49, 50],
      [990, 1000],
    ].map(([k, n]) => wilsonInterval(k, n).low.toFixed(3)),
    ['0.438', '0.895', '0.982'],
  );
  assert.equal(proposedSE(initialProposal).toFixed(3), '0.231');
  assert.equal(allPassDistance(initialProposal).toFixed(2), '0.87');
  for (const proposal of [initialProposal, (initialProposal + lowerAllPass) / 2, lowerAllPass])
    assert.ok(Math.abs((1 - proposal) / proposedSE(proposal) - allPassDistance(proposal)) < 1e-12);
  assert.equal(allPassDistance(lowerAllPass).toFixed(2), '1.96');
  assert.deepEqual(outcomeGroups.map((group) => group.cases.length), [83, 7, 7, 3]);
  assert.deepEqual([renewalPair.id, renewalPair.A, renewalPair.B, groupOf(renewalPair)],
    ['Q93', false, true, 2]);
  assert.deepEqual(outcomeGroups[1].cases.map((q) => q.id),
    ['Q82', 'Q83', 'Q84', 'Q85', 'Q86', 'Q87', 'Q88']);
  for (const [a, b, p] of [
    [9, 1, '0.0215'],
    [3, 1, '0.6250'],
    [5, 0, '0.0625'],
    [10, 2, '0.0386'],
  ])
    assert.equal(exactPairedP(a, b).toFixed(4), p);
}
export function programs(c, k) {
  const b = k.beat.beatIndex;
  const question = b < 3
    ? 'How many pairs contain a passing program?'
    : b < 5 ? 'Which program reaches the user?' : 'How often does the selector return a pass?';
  base(c, 'Code evaluator  /  One problem', question);
  PROGRAMS.forEach(({ id, pass }, i) => {
    const x = 120 + i * 211;
    sheet(c, x, 286, 180, 84, pass ? C.pale : C.paper);
    mono(c, '#' + id, x + 21, 330, 38);
    mark(c, x + 135, 330, pass, 18);
  });
  if (b === 0) {
    serif(c, 'Draw two different indices.', 126, 544, 70);
    note(
      c,
      'Every unordered pair has the same chance.',
      128,
      685,
    );
    return;
  }
  const built = cue(k, 1, 'Each square', 2);
  const miss = cue(k, 2, 'six failing programs', 1);
  const hits = cue(k, 2, 'The other thirteen', 1.5);
  const selection = cue(k, 5, 'Only the rows', 1.2);
  const secondExample = cue(k, 4, 'Try two and three');
  const pair =
    b < 3 || b > 4
      ? null
      : pairs.find((p) => (secondExample ? p.a === 2 && p.b === 3 : p.a === 1 && p.b === 2));
  const sent =
    pair && (secondExample ? cue(k, 4, 'The user gets a pass') : cue(k, 4, 'Program one goes out'));
  const xcol = (n) => 164 + (n - 2) * 110,
    yrow = (n) => 498 + (n - 1) * 61;
  label(c, 'Larger index', 343, 411);
  for (let n = 2; n <= 8; n++) mono(c, n, xcol(n), 457, 28, C.fine, { align: 'center' });
  for (let n = 1; n <= 7; n++) mono(c, n, 90, yrow(n), 28, C.fine, { align: 'center' });
  const count = Math.floor(built * pairs.length);
  let missesSeen = 0,
    hitsSeen = 0;
  pairs.slice(0, count).forEach(({ a, b: other, available: ok, selected: sel }, i) => {
    const x = xcol(other),
      y = yrow(a),
      isPicked = pair?.a === a && pair?.b === other;
    const scored = ok
      ? ++hitsSeen <= Math.round(hits * available)
      : ++missesSeen <= Math.round(miss * (pairs.length - available));
    fill(c, x - 47, y - 24, 94, 48, scored ? (ok ? C.pale : C.shade) : C.paper);
    if (scored && ok) mark(c, x - (selection ? 14 : 0), y, true, 16);
    if (scored && !ok) line(c, x - 11, y, x + 11, y, C.fine, 3);
    if (i < Math.round(selection * pairs.length) && sel) dot(c, x + 19, y, 9, C.plum);
    if (isPicked) {
      c.strokeStyle = C.gold;
      c.lineWidth = 6;
      c.strokeRect(x - 48, y - 25, 96, 50);
    }
  });
  const tx = 1006;
  label(c, 'Row = smaller index', tx, 430);
  if (b === 1) {
    serif(c, count + ' pairs', tx, 550, 74);
    note(c, '(1, 2) and (2, 1) describe one draw.', tx, 674);
  } else if (b === 2) {
    mono(c, Math.round(miss * 15) + ' pairs miss', tx, 542, 49, C.fine);
    if (hits > 0) mono(c, Math.round(hits * available) + ' contain a pass', tx, 645, 49, C.pass);
    if (hits === 1) mono(c, 'Availability   13 / 28', tx, 782, 48);
  } else if (pair) {
    label(c, 'Draw (' + pair.a + ', ' + pair.b + ')', tx, 505);
    label(c, 'Sent to user', tx + 450, 505);
    fill(c, tx + 440, 547, 267, 135, C.shade);
    [pair.a, pair.b].forEach((id, j) => {
      const t = j === 0 ? Number(sent) : 0;
      const x = mix(tx, tx + 465, t),
        y = 566 + j * 120;
      sheet(c, x, y, 162, 97, passes(id) ? C.pale : C.rose);
      mono(c, '#' + id, x + 19, y + 49, 38);
      mark(c, x + 119, y + 49, passes(id), 19);
    });
    letter(c, 'Selection rule: return the lower index.', tx, 846, 39);
    if (sent === 1)
      mono(
        c,
        '#' + pair.returned + (pair.selected ? ' passes' : ' fails'),
        tx,
        919,
        45,
        pair.selected ? C.pass : C.fail,
      );
  } else {
    mark(c, tx + 19, 556, true, 21);
    letter(c, available + ' / 28 contain a pass', tx + 71, 556, 47);
    if (selection === 1) {
      dot(c, tx + 19, 674, 14, C.plum);
      letter(c, selected + ' / 28 return a pass', tx + 71, 674, 47, C.plum);
    }
    note(c, 'Selection rule: return the lower index.', tx, 810);
  }
}
export function estimator(c, k) {
  const b = k.beat.beatIndex;
  base(
    c,
    'Code evaluator  /  Sampling',
    b < 2
      ? 'How often is a pass available?'
      : b < 7
        ? 'What changes when an index leaves the pool?'
        : 'Which pairs belong to the same problem?',
  );
  if (b < 2) {
    [
      [1, 1],
      [1, 0],
      [0, 1],
      [0, 0],
    ].forEach(([a, z], i) => {
      const x = 115 + i * 431;
      sheet(c, x, 379, 386, 256);
      medallion(c, x + 114, 475, a, 42);
      medallion(c, x + 264, 475, z, 42);
      letter(c, a || z ? 'Contains a pass' : 'Both miss', x + 35, 581, 36);
    });
    if (b === 0) {
      mono(c, '3 of 4 equally likely outcomes', 119, 788, 52);
    } else {
      powerFormula(c, 'P(at least one) = 1 − (1 − p)', 'k', 119, 788, 52);
      note(c, 'Each of the k attempts is independent and has the same pass probability p.');
    }
    return;
  }
  if (b >= 7) {
    const mixed = cue(k, 8, 'Pool all eight') > 0;
    ['X', 'Y'].forEach((t, j) => {
      const x = 121 + j * 888;
      label(c, 'Problem ' + t, x, 335);
      for (let i = 0; i < 4; i++) medallion(c, x + 55 + i * 108, 451, j === 0, 36);
    });
    if (!mixed) {
      if (b === 8) mono(c, 'Per-problem average  =  (1 + 0) / 2  =  0.5', 122, 675, 48);
      return;
    }
    // Each lattice site pairs one X program with one Y program.
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        fill(c, 137 + i * 63, 571 + j * 63, 56, 56, C.rose);
        mono(c, '×', 165 + i * 63, 600 + j * 63, 28, C.fail, { align: 'center' });
      }
    reading(
      c,
      580,
      577,
      'Pairs from different problems',
      ['4 × 4 = 16 unusable pairs', 'A program for X cannot answer Y.'],
      1080,
    );
    if (b === 9)
      mono(c, 'Pooled: (6 + 16) / 28 ≈ ' + subsetCoverage(8, 4, 2).toFixed(3), 581, 823, 43);
    return;
  }
  const drawn =
    Math.round(cue(k, 4, 'then from seventy-nine')) +
    Math.round(8 * cue(k, 4, 'After nine misses', 1.6));
  const show = cue(k, 5, 'The result is about') > 0;
  const [bad, n] = loseFractions[drawn];
  label(c, 'One task   /   100 sampled programs', 115, 323);
  for (let i = 0; i < 100; i++) {
    const x = 126 + (i % 10) * 46,
      y = 385 + Math.floor(i / 10) * 43;
    if (i >= 100 - drawn) {
      line(c, x + 6, y + 16, x + 25, y + 16, C.line, 2);
      continue;
    }
    fill(c, x, y, 37, 34, i < 20 ? C.pass : C.steel);
  }
  if (b < 4) {
    reading(c, 725, 385, 'Plug-in estimate', ['20 / 100 passed'], 1030);
    powerFormula(c, '1 − (1 − 0.2)', '10', 725, 540, 44, '≈ ' + (1 - 0.8 ** 10).toFixed(4));
    if (b === 3)
      note(c, 'Run-to-run variation raises the average plug-in failure estimate.', 725, 721);
  } else {
    label(c, 'After ' + drawn + ' draws, all misses', 729, 390);
    mono(c, bad + ' / ' + n, 722, 497, 84);
    letter(c, 'chance the next index also misses', 729, 593, 40);
    mono(c, '1 − (80/100 × 79/99 × … × 71/91)', 727, 712, 41, C.cold);
    if (show) mono(c, '= ' + subsetCoverage(100, 20, 10).toFixed(4), 725, 811, 59, C.pass);
    if (b === 6)
      note(c, 'Fewer than k failures in the pool means every k-subset has a pass.', 119, 914);
  }
}
export function judge(c, k) {
  const b = k.beat.beatIndex,
    grounded = b >= 4;
  const r = rounds(concise, grounded ? omission : friendly);
  const swapped = grounded ? cue(k, 4, 'both orders', 1) : cue(k, 2, 'Swap them', 1);
  base(c, 'Controlled judgment  /  Blind comparison', 'Which named answer won both orders?');
  const pos = [120, 1000];
  ['Slot A', 'Slot B'].forEach((t, i) => label(c, t, pos[i], 328));
  r[0].order.forEach((a, i) => {
    const x = mix(pos[i], pos[1 - i], swapped),
      y = 461 + (i ? 1 : -1) * Math.sin(swapped * Math.PI) * 104;
    sheet(c, x, y, 798, 194, a.id === 'Incomplete' ? C.rose : i === 0 ? C.pale : C.paper);
    label(c, a.id, x + 25, y + 47);
    serif(c, a.claim, x + 25, y + 124, 43, C.ink, { max: 748 });
  });
  if (b >= 2) {
    const two = swapped === 1;
    const show = grounded || cue(k, 2, 'concise wins') > 0;
    if (show) mono(c, 'First order    ' + r[0].winner.id, 126, 809, 45);
    if (two) mono(c, 'Swapped    ' + r[1].winner.id, 1000, 809, 45);
    if (two)
      note(
        c,
        grounded
          ? 'Same answer won twice. Check its approval claim against the policy.'
          : 'Different names won. Mark this pair unresolved.',
      );
  } else note(c, 'Rubric: count required facts. Break a tie in favor of slot A.');
}
export function exposure(c, k) {
  const b = k.beat.beatIndex;
  base(c, 'Evaluation archive  /  Provenance', 'Which cases can still enter a fresh holdout?');
  const used = cue(k, 1, 'Move those exposed cases', 1.6),
    fresh = cue(k, 2, 'remaining cases', 1.6);
  label(c, 'Case creation   /   tuning snapshot March 31', 113, 316);
  label(c, 'Regression', 113, 894);
  label(c, 'Holdout candidates', 1007, 894);
  [
    [108, 809],
    [993, 824],
  ].forEach(([x, w]) => {
    fill(c, x, 738, w, 128, C.steel);
    line(c, x, 738, x + w, 738, C.cold, 7);
  });
  exposureCases.forEach((a, i) => {
    const t = a.used ? used : fresh,
      dest = a.used ? 134 + (i === 2 ? 380 : 0) : 1016 + (i === 3 ? 385 : 0);
    const x = mix(115 + i * 432, dest, t),
      y = mix(402, 749, t);
    sheet(c, x, y, 346, 108, a.used ? C.rose : C.paper);
    mono(c, a.id + '  ' + a.date, x + 18, y + 31, 34);
    letter(c, a.used ? 'Used in development' : 'No logged use', x + 18, y + 81, 29);
  });
  if (b === 2) note(c, 'Exclude private questions and keys from the application index.', 110, 962);
}
export function screening(c, k) {
  const b = k.beat.beatIndex;
  base(
    c,
    'Evaluation archive  /  Exposure screen',
    b < 2
      ? 'What did the result help choose?'
      : b === 2
        ? 'What will a literal overlap screen catch?'
        : b === 3
          ? 'What happens to a copied canary?'
          : 'Does a later date establish an untouched test?',
  );
  if (b < 2) {
    const rows = [
      ['Training text', 'A published solution', 'Model weights'],
      ['Development run', 'Holdout scores', 'Judge prompt'],
    ];
    rows.forEach(([a, z, end], i) => {
      const y = 417 + i * 215;
      label(c, a, 112, y);
      sheet(c, 531, y - 58, 600, 131);
      serif(c, z, 561, y + 5, 47);
      arrow(c, 1172, y + 5, 1334, y + 5);
      letter(c, end, 1381, y + 5, 45);
    });
    note(
      c,
      b
        ? 'Preserve cases used for decisions in regression. Draw fresh evidence.'
        : 'A score increase can reflect useful learning, a shortcut, or both.',
    );
  } else if (b === 2) {
    const inspect = k.reveal('inspect what overlaps', 0, { captionStart: false });
    const conclusion = k.reveal('paraphrases', 0, { captionStart: false });
    const source = 'commander approval before the new version goes live';
    const paraphrase = 'commander’s sign-off before shipping';
    sheet(c, 105, 280, 1711, 226, C.pale);
    label(c, 'Release policy  /  13-word source window', 132, 317);
    serif(c, 'release during a freeze requires', 132, 384, 54);
    sheet(c, 105, 532, 1711, 226);
    label(c, 'Reworded passage', 132, 569);
    serif(c, 'during the freeze.', 132, 703, 54);
    c.save();
    c.font = '400 54px "Lesson Serif"';
    if (inspect) {
      const start = 132 + c.measureText('Get the ').width;
      line(c, 132, 488, 132 + c.measureText(source).width, 488, C.gold, 9);
      line(c, start, 673, start + c.measureText(paraphrase).width, 673, C.gold, 9);
    }
    c.restore();
    serif(c, source, 132, 452, 54);
    serif(c, 'Get the ' + paraphrase, 132, 636, 54);
    if (conclusion) note(c, 'Both require approval. The 13-word sequence changes.', 112, 843);
  } else if (b === 3) {
    reading(c, 118, 356, 'Original benchmark item', [
      'Question + canary string',
      'Collector recognizes marker',
    ]);
    reading(c, 1034, 356, 'Copied item', ['Question only', 'Marker has disappeared']);
    arrow(c, 842, 524, 980, 524);
    note(c, 'BIG-bench asks collectors to exclude marked material. Record the actual handling.');
  } else {
    const labels = ['Checkpoint cutoff', 'Contest release', 'Evaluation'];
    line(c, 180, 574, 1728, 574, C.cold, 6);
    labels.forEach((t, i) => {
      const x = 290 + i * 660;
      dot(c, x, 574, 17, C.gold);
      letter(c, t, x, 487, 43, C.ink, { align: 'center' });
    });
    letter(c, 'Later post-training?', 662, 687, 39);
    letter(c, 'Solution retrieved?', 1299, 687, 39);
    note(c, 'Date the checkpoint, task window, benchmark release and tool access.');
  }
}
export function perfect(c, k) {
  base(c, 'Statistical bench  /  Independent draws', 'How surprising is a perfect sample?');
  const b = k.beat.beatIndex;
  const threeCases = b > 0 || k.reveal('three in a row', 0, { captionStart: false });
  const multiply = b === 0 && k.reveal('Multiply', 0, { captionStart: false });
  const showResult = b > 0 || k.reveal('point five one two', 0, { captionStart: false });
  const duration = b === 1
    ? k.wordCue('along the curve').end - k.wordCue('expand to thirty cases').start
    : 0;
  const n = 3 + Math.round(27 * cue(k, 1, 'expand to thirty cases', duration));
  const X = (i) => 184 + (i / 30) * 1120,
    Y = (p) => 776 - p * 410;
  ticks(c, 184, 1304, 776, 0, 30, 5, (v) => v);
  [0, 0.5, 1].forEach((v) => {
    line(c, 184, Y(v), 1304, Y(v));
    mono(c, v.toFixed(1), 160, Y(v), 28, C.fine, { align: 'right' });
  });
  const curve = Array.from({ length: 31 }, (_, i) => [X(i), Y(0.8 ** i)]);
  path(c, curve, null, C.cold, 7);
  label(c, 'Number of cases', 576, 886);
  label(c, 'P(all pass) at p = 0.8', 1394, 405);
  if (threeCases) mono(c, 'n = ' + n, 1395, 515, 48);
  if (showResult) {
    dot(c, X(n), Y(0.8 ** n), 17, C.gold);
    serif(c, (0.8 ** n * 100).toFixed(n < 10 ? 1 : 3) + '%', 1387, 635, 74);
  } else if (multiply) {
    mono(c, '0.8 × 0.8 × 0.8', 1387, 635, 41);
  }
  powerFormula(c, 'P(all pass) = 0.8', 'n', 1350, 738, 35);
  letter(c, 'Independent cases, same pass rate', 1350, 807, 32);
}
export function wilson(c, k) {
  const b = k.beat.beatIndex;
  base(
    c,
    'Statistical bench  /  Score interval',
    b < 5 ? 'Which proposed rates fit three passes?' : 'Which lower endpoint reaches 95 percent?',
  );
  if (b === 4) {
    const lo = lowerAllPass;
    label(c, 'All three cases pass', 117, 325);
    mono(c, 'L = n / (n + z²)', 115, 420, 52);
    mono(c, '3 / (3 + 1.96²) ≈ ' + lo.toFixed(3), 115, 507, 48, C.cold);
    line(c, 113, 579, 1805, 579);
    label(c, 'When some cases fail     •     f = passes / n', 117, 648);
    mono(c, 'f + z²/(2n) − z × √[f(1 − f)/n + z²/(4n²)]', 119, 738, 45);
    line(c, 116, 782, 1401, 782, C.ink, 3);
    mono(c, '1 + z²/n', 623, 838, 45);
    return;
  }
  if (b < 5) {
    const lo = lowerAllPass;
    const p = mix(initialProposal, lo, cue(k, 3, 'Slide the proposed rate down', 1.8));
    const score = allPassDistance(p);
    const x0 = 180,
      x1 = b === 0 ? 1320 : 1010,
      X = (v) => mix(x0, x1, v),
      Y = (v) => 788 - v * 121;
    ticks(c, x0, x1, 788, 0, 1, 0.2, (v) => Math.round(100 * v) + '%');
    if (b === 0) {
      line(c, X(1), 720, X(1), 785, C.fail, 8);
      dot(c, X(1), 730, 15, C.fail);
      reading(
        c,
        269,
        360,
        'Wald interval at 3/3',
        ['Observed variance = 0', 'Both endpoints land at 100%.'],
        940,
      );
    } else {
      label(c, 'Distance in standard errors', 176, 320);
      for (const z of [0, 1, 2, 3]) {
        line(c, x0, Y(z), x1, Y(z));
        mono(c, z, x0 - 16, Y(z), 28, C.fine, { align: 'right' });
      }
      const pts = [];
      for (let i = 22; i <= 100; i++) {
        const q = i / 100;
        pts.push([X(q), Y(allPassDistance(q))]);
      }
      path(c, pts, null, C.cold, 7);
      line(c, x0, Y(1.96), x1, Y(1.96), C.fail, 4);
      mono(c, '1.96', x1 + 15, Y(1.96), 32, C.fail);
      const workX = 1160;
      const pText = String(Number(p.toFixed(3)));
      const complement = String(Number((1 - p).toFixed(3)));
      const seText = proposedSE(p).toFixed(3);
      label(c, 'Observed: 3 passes / 3 cases = 1', workX, 320);
      mono(c, 'Proposed rate: ' + (p * 100).toFixed(1) + '%', workX, 405, 42);
      if (cue(k, 1, 'Use the proposed rate', 0)) {
        label(c, 'Standard error at this proposal', workX, 503);
        const comparison = p === initialProposal ? '=' : '≈';
        mono(c, 'SE ' + comparison + ' √(' + pText + ' × ' + complement + ' / ' + allPassCount + ')', workX, 568, 36);
        if (cue(k, 1, 'The standard error is', 0))
          mono(c, '≈ ' + seText, workX, 626, 42, C.cold);
      }
      if (cue(k, 1, 'Divide the gap', 0)) {
        label(c, 'Distance in standard errors', workX, 730);
        mono(c, 'd ≈ (1 − ' + pText + ') / ' + seText, workX, 795, 36);
        if (cue(k, 1, 'about point eight seven', 0)) {
          mono(c, '≈ ' + score.toFixed(2), workX, 858, 46, C.cold);
          dot(c, X(p), Y(score), 16, C.gold);
        }
      }
      if (b >= 3 && Math.abs(p - lo) < 1e-8) {
        line(c, X(lo), 764, x1, 764, C.pass, 12);
        label(c, 'Rates within the limit', X(lo) + 45, 715);
      }
    }
    note(c, 'Proposed pass rate', 144, 914);
    return;
  }
  const rows = [
      [49, 50],
      [990, 1000],
    ],
    reveals = [cue(k, 6, 'Forty-nine out of fifty', 0.7), cue(k, 6, 'The larger run reaches', 0.7)],
    x0 = 520,
    x1 = 1740;
  const X = (v) => mix(x0, x1, (v - 0.85) / 0.15);
  ticks(c, x0, x1, 787, 0.85, 1, 0.025, (v) => (v * 100).toFixed(1) + '%');
  line(c, X(0.95), 374, X(0.95), 784, C.fail, 5);
  label(c, '95% release floor', X(0.95) - 123, 326);
  rows.forEach(([k, n], i) => {
    const y = 472 + i * 183;
    const { low, high } = wilsonInterval(k, n);
    mono(c, k + ' / ' + n, 105, y, 48);
    const shown = reveals[i];
    if (shown > 0) {
      c.save();
      c.globalAlpha = shown;
      line(c, X(low), y, X(high), y, C.cold, 12);
      [low, high].forEach((v) => line(c, X(v), y - 19, X(v), y + 19, C.cold, 5));
      c.restore();
      if (shown === 1)
        mono(c, (low * 100).toFixed(1) + '%', X(low), y + 55, 32, C.cold, { align: 'center' });
    }
    dot(c, X(k / n), y, 15, C.ink);
  });
  if (b === 7)
    note(c, 'Two-sided 95% uses z = 1.96. A one-sided 95% lower bound uses about 1.645.');
}
export function tails(c, fix, brk, { x = 154, y = 738, w = 1040, h = 348, show = true } = {}) {
  const n = fix + brk,
    counts = Array.from({ length: n + 1 }, (_, i) => Math.round(binomialChoose(n, i)));
  const max = Math.max(...counts),
    dx = w / (n + 1);
  counts.forEach((v, i) => {
    const height = (v / max) * h,
      extreme = i <= Math.min(fix, brk) || i >= Math.max(fix, brk);
    fill(c, x + i * dx, y - height, dx * 0.8, height, show && extreme ? C.fail : C.steel);
    if (show && extreme)
      mono(c, v, x + (i + 0.4) * dx, y - height - 24, 27, C.fail, { align: 'center' });
    mono(c, i, x + (i + 0.4) * dx, y + 33, 27, C.fine, { align: 'center' });
  });
  line(c, x, y, x + w, y, C.ink, 2);
}
export function paired(c, k) {
  const b = k.beat.beatIndex;
  base(
    c,
    'Statistical bench  /  Matched outcomes',
    b < 3 || b >= 8
      ? 'Which cases changed direction?'
      : 'How often would a fair split be this uneven?',
  );
  if (b < 3 || b >= 8) {
    const groupX = (i) => 116 + i * 436;
    const totalled = cue(k, 0, 'Sort all hundred questions', 0);
    outcomeGroups.forEach((group, i) => {
      const x = groupX(i);
      sheet(c, x, 365, 399, 286, group.color);
      label(c, group.title, x + 20, 421);
      if (totalled) serif(c, group.cases.length, x + 23, 510, 81);
    });
    if (b < 3) {
      const file = cue(k, 0, 'That makes one fix', 0.9);
      const x = mix(778, groupX(groupOf(renewalPair)) + 14, file);
      const y = mix(693, 567, file);
      sheet(c, x, y, 371, 69);
      mono(c, renewalPair.id, x + 16, y + 35, 36);
      for (const [i, model] of ['A', 'B'].entries()) {
        const dx = 128 + i * 119;
        label(c, model, x + dx, y + 35);
        medallion(c, x + dx + 53, y + 35, renewalPair[model], 22);
      }
    }
    if (b >= 8) mono(c, 'Read the breaks: ' + outcomeGroups[1].cases.map((q) => q.id).join('  '), 115, 752, 43);
    else if (b >= 1)
      mono(c, '14 discordant pairs    •    7 fixes − 7 breaks = 0 net', 115, 752, 45);
    note(
      c,
      b >= 8
        ? 'Keep each repeat and the fixed rule for turning repeats into a case verdict.'
        : 'Pair answers on case ID. Keep the same fixed protocol for A and B.',
    );
    return;
  }
  const askFive = b === 5 && cue(k, 5, 'Try five fixes') > 0;
  const [f, z] = b <= 4 ? [9, 1] : b === 5 && !askFive ? [3, 1] : [5, 0];
  const shown = !askFive && (b >= 4 || cue(k, 3, 'zero or one fix') > 0);
  label(c, 'Height = number of fair-coin sequences', 143, 322);
  tails(c, f, z, { show: shown });
  label(c, 'Number of fixes under equal marginal rates', 226, 852);
  label(c, 'Observed disagreements', 1275, 372);
  mono(c, f + ' fixes', 1270, 467, 57);
  mono(c, z + (z === 1 ? ' break' : ' breaks'), 1270, 553, 57);
  if (!askFive && b >= 4) {
    const sequenceCount = Math.round(exactPairedP(f, z) * 2 ** (f + z));
    mono(c, sequenceCount + ' / ' + 2 ** (f + z), 1270, 682, 49, C.fail);
    mono(c, 'p ≈ ' + exactPairedP(f, z).toFixed(4), 1270, 775, 45);
  } else if (askFive) letter(c, 'Enough at 5%?', 1270, 699, 47);
}
