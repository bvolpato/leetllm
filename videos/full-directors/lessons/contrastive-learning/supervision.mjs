import {
  C,
  colors,
  fixed,
  pct,
  cue,
  fill,
  circle,
  arrow,
  stroke,
  serif,
  text,
  mono,
  title,
  cell,
  rule,
  book,
  shareStrip,
  filmWindow,
  sum,
} from './studio.mjs';
import {
  alias,
  duplicateScores,
  multi,
  posMass,
  massLoss,
  meanLog,
  up,
  comparisonRow,
  miningCandidates,
  MINING_FIXTURE,
  batchMatrix,
  teacherTarget,
} from './examples.mjs';

export function relation(g, k) {
  const b = k.beat.beatIndex;
  title(
    g,
    [
      'What follows from the caption?',
      'Inside the Sentence-BERT classifier',
      'Train a supervised SimCSE row',
    ][b],
    [
      'Natural language inference',
      'Shared encoder weights  /  classifier input',
      'Query-specific supervision',
    ][b],
  );
  if (b === 0) {
    filmWindow(g, 'puppy', 85, 305, 760, 451, 0, true);
    serif(g, 'A puppy is running', 85, 849, 55);
    arrow(g, 897, 439, 1095, 439, C.sea);
    serif(g, 'An animal is running', 1140, 453, 54, C.sea);
    if (cue(k, 0, 'going the other way')) {
      arrow(g, 1095, 621, 897, 621, C.gold);
      text(g, 'Could be a horse.', 1140, 629, 46);
      text(g, 'The reverse is uncertain.', 1140, 708, 39, C.gold);
    }
  } else if (b === 1) {
    ['A puppy is running', 'An animal is running'].forEach((s, i) => {
      const y = 365 + i * 202;
      serif(g, s, 92, y + 12, 53);
      arrow(g, 674, y, 822, y, C.soft);
      cell(g, 870, y - 49, 396, 90, 'encoder θ', C.pale);
      arrow(g, 1298, y, 1454, y, C.soft);
      mono(g, i ? 'v' : 'u', 1520, y + 25, 72, C.sea);
    });
    mono(g, 'Classifier input   [u, v, |u − v|]', 92, 833, 59);
    text(g, 'Predict entailment, contradiction or neutral.', 92, 931, 39, C.soft);
  } else {
    serif(g, 'A puppy is running', 90, 340, 73);
    [
      ['Entailment', 'An animal is running.', 'Positive pair', C.sea],
      ['Contradiction', 'No animal is running.', 'Hard negative', C.rust],
    ].forEach(([a, s, l, c], i) => {
      const y = 490 + i * 201;
      rule(g, 90, y - 56, 1710);
      text(g, a, 91, y, 35, c);
      serif(g, s, 450, y + 7, 56);
      text(g, l, 1450, y, 35, c);
    });
    text(g, 'At search time, reuse the stored passage vectors.', 90, 963, 41, C.soft);
  }
}
export function dropout(g, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    title(g, 'Does the edit preserve the rule?', 'Proposed positive pair');
    const del = cue(k, 2, 'Delete the word');
    serif(g, 'The reader is not authorized.', 105, 417, 80);
    rule(g, 105, 485, 1640);
    serif(
      g,
      del ? 'The reader is authorized.' : 'The reader is not authorized.',
      105,
      667,
      80,
      del ? C.rust : C.ink,
    );
    if (del) {
      text(g, 'The two rules now give opposite decisions.', 105, 889, 47, C.rust);
    }
    return;
  }
  title(g, 'Two views of the same sentence', 'S17  /  “A dog is running”');
  const off = b === 0 && cue(k, 0, 'inference disables'),
    m = [
      [1, 0, 1, 1, 0, 1],
      [0, 1, 1, 0, 1, 1],
    ],
    drawMasks = b > 0 || cue(k, 0, 'different dropout masks');
  m.forEach((r, i) => {
    const y = 364 + i * 194;
    text(g, 'Pass ' + (i + 1), 90, y + 65, 47);
    r.forEach((v, j) => {
      const kept = off || !drawMasks || v;
      cell(
        g,
        395 + j * 218,
        y,
        192,
        106,
        kept ? 'h' + (j + 1) : '0',
        kept ? (i ? C.pale : C.brass) : '#d1cdbe',
        kept ? C.ink : C.soft,
      );
    });
  });
  if (b === 0)
    text(
      g,
      off ? 'Inference • keep every unit' : 'Training • two draws, one sentence identity',
      90,
      855,
      46,
      C.sea,
    );
  else {
    mono(g, 'BERT-base STS      unsupervised  76.3      supervised  81.6', 90, 851, 40);
    text(g, 'Revised SimCSE paper  /  mean Spearman × 100', 90, 934, 34, C.soft);
  }
}
export function batches(g, k) {
  const two = cue(k, 2, 'second batch'),
    three = cue(k, 0, 'Add pairs'),
    all = cue(k, 3, 'gather all five'),
    n = two ? 5 : three ? 3 : 1,
    active = batchMatrix(n, all);
  title(g, 'Which passages did each query see?', 'Query rows × passage columns');
  const x0 = 230,
    y0 = 315,
    s = 99;
  let count = 0;
  for (let i = 0; i < n; i++) {
    mono(g, 'q' + String.fromCharCode(65 + i), 126, y0 + 65 + i * s, 37);
    mono(g, 'p' + String.fromCharCode(65 + i), x0 + 46 + i * s, y0 - 26, 34, C.soft, {
      align: 'center',
    });
    for (let j = 0; j < n; j++) {
      const paired = i === j,
        comp = active[i][j];
      if (!paired && comp) count++;
      cell(
        g,
        x0 + j * s,
        y0 + i * s,
        s - 8,
        s - 8,
        paired ? '+' : comp ? '·' : '',
        paired ? C.sea : comp ? C.pink : '#e1ddcf',
        paired ? C.white : C.rust,
        46,
      );
    }
  }
  text(g, 'Texts encoded', 1050, 396, 43, C.soft);
  mono(g, 2 * n, 1050, 505, 99);
  text(g, 'Off-diagonal comparisons', 1050, 628, 43, C.soft);
  mono(g, count, 1050, 740, 99, C.rust);
  text(
    g,
    all
      ? 'One shared candidate pool'
      : two
        ? 'Two disjoint candidate pools'
        : n === 1
          ? 'Only the paired passage'
          : 'One batch of three pairs',
    1050,
    845,
    38,
    C.sea,
    { max: 795 },
  );
  if (k.beat.beatIndex >= 5)
    text(g, 'A scored cell still needs a relevance label.', 1050, 924, 34, C.soft, { max: 790 });
}
export function duplicates(g, k, manual = false) {
  const masked = manual ? cue(k, 2, 'Mask B') : cue(k, 3, 'Mask copy B'),
    showGrad = manual ? cue(k, 2, 'old label') : cue(k, 2, 'tries to lower'),
    r = alias(manual, masked),
    tau = manual ? 0.15 : 0.2;
  const stage = (beat, phrase, span = 0) =>
    k.beat.beatIndex > beat ? 1 : k.beat.beatIndex < beat ? 0 : k.reveal(phrase, span, { captionStart: false });
  const mass = !manual && stage(1, 'each put one unit');
  const exit = !manual && stage(3, 'drops out', 1.1);
  const repairedShare = !manual && stage(3, 'ninety-seven percent');
  const repairedGrad = !manual && stage(3, 'is zero');
  const old = alias(manual, false);
  const colorsByRole = [C.sea, C.rust, C.blue];
  const names = manual
    ? ['Wheel guide', 'Wheel guide', 'Route planner']
    : ['Rotation guide', 'Rotation guide', 'KMS key'];
  title(
    g,
    manual ? 'How do I change a flat tire?' : 'How do I rotate an API key?',
    manual
      ? 'Training row  /  verified mirror  /  temperature 0.15'
      : 'Two batch columns point to the same approved guide  /  temperature 0.20',
  );
  names.forEach((s, i) => {
    const x = 98 + i * 593;
    book(
      g,
      x,
      manual ? 285 : 270,
      512,
      manual ? 248 : 230,
      s,
      manual ? (i < 2 ? 'wheel' : 'route') : i === 2 ? 'lock' : 'key',
      i === 2 ? C.blue : C.sea,
    );
    text(
      g,
      ['A  /  labeled answer', 'B  /  verified copy', 'C  /  other task'][i],
      x,
      manual ? 613 : 562,
      35,
      i === 1 ? C.gold : C.soft,
    );
    mono(g, 'cos   ' + fixed((manual ? [0.65, 0.65, 0.05] : duplicateScores)[i]), x, manual ? 680 : 622, 39);
    if (manual) {
      mono(
        g,
        masked && i === 1 ? 'Outside pool' : pct(r.probs[i]) + ' share',
        x,
        755,
        42,
        masked && i === 1 ? C.rust : C.ink,
      );
      if (masked && i === 1) stroke(g, [[x, 560], [x + 511, 560]], C.rust, 5);
    } else if (mass) {
      const weight = old.masses[i];
      const included = i === 1 ? 1 - exit : 1;
      fill(g, x, 690, 260, 18, C.line);
      fill(g, x, 690, 260 * weight * included, 18, colorsByRole[i]);
      mono(g, i === 1 && exit ? 'Excluded' : fixed(weight, 3), x + 280, 713, 35);
      if (!masked || repairedShare) {
        mono(
          g,
          masked && i === 1 ? 'Outside pool' : pct(r.probs[i]) + ' share',
          x,
          773,
          39,
          colorsByRole[i],
        );
      }
    }
  });
  if (manual) shareStrip(g, 100, 805, 1678, 35, r.probs, colorsByRole);
  if (!manual) {
    if (mass) text(g, 'Denominator weights  /  A remains the only target', 100, 668, 29, C.soft);
    if (masked && !repairedGrad)
      text(g, 'B cosine stays fixed. Only its eligibility changes.', 100, 828, 36, C.soft);
    else if (showGrad)
      mono(g, 'B raw-score derivative   ' + (r.gradients[1] > 0 ? '+' : '') + fixed(r.gradients[1], 3),
        100, 828, 41, masked ? C.sea : C.rust);
    else if (mass)
      text(g, 'Gradient descent: raise or lower B?', 100, 828, 39, C.ink);
    if (k.beat.beatIndex === 4)
      mono(g, 'Row loss   ' + fixed(old.loss, 4) + ' → ' + fixed(r.loss, 4), 1130, 828, 41);
    return;
  }
  if (showGrad) {
    mono(
      g,
      'B derivative   ' + (r.gradients[1] > 0 ? '+' : '') + fixed(r.gradients[1], 3),
      100,
      939,
      47,
      masked ? C.sea : C.rust,
    );
    mono(g, 'Row loss   ' + fixed(r.loss, 4), 1130, 939, 47);
  } else text(g, 'Designated target   A', 100, 931, 39, C.sea);
}
export function objectives(g, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    title(g, 'Two tied copies, one label', 'Best case after all other competitors disappear');
    [
      ['Guide A', 'Target 1', C.sea],
      ['Copy B', 'Target 0', C.rust],
    ].forEach(([s, t, c], i) => {
      book(g, 110 + i * 865, 280, 720, 275, s, 'key', c);
      text(g, t, 110 + i * 865, 644, 43, c);
    });
    shareStrip(g, 110, 733, 1570, 60, [0.5, 0.5], colors);
    mono(g, 'A ≤ 50%     L ≥ ln 2', 110, 933, 51);
    return;
  }
  const useMean = cue(k, 4, 'Take each negative log'),
    useMass = cue(k, 3, 'Pool the positive'),
    force = b >= 6;
  title(
    g,
    force ? 'How hard will the rare guide be pulled up?' : 'Either guide, or both guides?',
    force
      ? 'Fixed probabilities  /  temperature 0.20'
      : 'Both guides have been verified for this query',
  );
  ['Rotation guide', 'Replacement guide', 'KMS guide'].forEach((s, i) => {
    const x = 95 + i * 590;
    book(g, x, 276, 500, 217, s, ['key', 'replace', 'lock'][i], i < 2 ? C.sea : C.blue);
    mono(g, 'P = ' + multi[i], x, 561, 39);
    text(g, i < 2 ? 'Verified answer' : 'Other task', x, 617, 33, i < 2 ? C.sea : C.soft);
  });
  rule(g, 93, 676, 1715);
  if (force) {
    const vals = [up(multi[1] / posMass, multi[1]), up(0.5, multi[1])];
    ['Pool positive mass', 'Mean over positives'].forEach((s, i) => {
      const y = 764 + i * 127;
      text(g, s, 95, y + 22, 39);
      if (i === 0 || b === 7) {
        const start = 715;
        stroke(
          g,
          [
            [start, y],
            [start + 660, y],
          ],
          C.line,
          4,
        );
        circle(g, start + (vals[i] / 2.5) * 660, y, 13, i ? C.sea : C.gold);
        mono(g, fixed(vals[i], i ? 4 : 8), 1460, y + 20, 39);
      }
    });
  } else {
    if (useMass)
      mono(g, '−ln(0.999 + 0.0005)    = ' + fixed(massLoss, 6) + ' nats', 95, 784, 44, C.gold);
    if (useMean)
      mono(
        g,
        '(−ln 0.999 − ln 0.0005) / 2    = ' + fixed(meanLog, 4) + ' nats',
        95,
        913,
        43,
        C.sea,
      );
    if (!useMass)
      serif(
        g,
        b === 2
          ? 'Which rule still charges for missing B?'
          : 'B receives five ten-thousandths of the row.',
        95,
        825,
        53,
      );
  }
}
export function mine(g, k) {
  const b = k.beat.beatIndex,
    query = 'How do I rotate an API key?',
    candidates = miningCandidates(query);
  if (b < 2) {
    title(
      g,
      'Mine competitors for API key rotation',
      'How do I rotate an API key?   /   Word overlap and supplied teacher scores',
    );
    const audited = cue(k, 0, 'Set it aside'),
      lex = cue(k, 1, 'Count the words'),
      sorted = cue(k, 1, 'teacher scores');
    ['Candidate text', 'Relevance audit', 'Overlap', 'Teacher'].forEach((s, i) =>
      text(g, s, [90, 1000, 1445, 1650][i], 317, 36, C.soft),
    );
    const q = new Set(query.toLowerCase().replace('?', '').split(' '));
    MINING_FIXTURE.forEach((r, i) => {
      const y = 408 + i * 122,
        ov = [...new Set(r.text.toLowerCase().replace('?', '').split(' '))].filter((t) =>
          q.has(t),
        ).length;
      rule(g, 90, y + 47, 1720);
      serif(g, r.text, 90, y, 40, C.ink, { max: 876 });
      text(
        g,
        audited ? (r.relevant ? 'Keep as answer' : 'Other task') : 'Under review',
        1000,
        y,
        34,
        r.relevant && audited ? C.sea : C.soft,
      );
      if (lex) mono(g, ov, 1494, y, 40);
      if (sorted && candidates.some((v) => v.id === r.id))
        mono(g, fixed(r.teacher), 1655, y, 42, C.rust);
    });
    if (sorted)
      text(
        g,
        'Mined order    1. Service signing key     2. KMS encryption key',
        92,
        965,
        39,
        C.rust,
      );
    return;
  }
  if (b === 2) {
    const added = cue(k, 2, 'point seven two'),
      sc = added ? [0.9, 0.2, 0.72] : [0.9, 0.2],
      r = comparisonRow(sc, 0.05);
    title(g, 'Admit the mined negative', 'New training row  /  cosine scores  /  temperature 0.05');
    sc.forEach((v, i) => {
      const x = 98 + i * 587;
      serif(g, ['Target', 'Easy competitor', 'Mined competitor'][i], x, 398, 50);
      mono(g, fixed(v), x, 523, 87, colors[i]);
    });
    shareStrip(g, 98, 624, 1690, 67, r.probs);
    mono(g, 'Positive loss   ' + fixed(r.loss, 7) + ' nats', 98, 885, 58);
    return;
  }
  title(g, 'Mine again with the next checkpoint', 'Keep evaluation groups outside the mining loop');
  const jobs = ['Encode corpus', 'Retrieve lookalikes', 'Audit relevance', 'Train next version'];
  jobs.forEach((s, i) => {
    const x = 110 + i * 446;
    circle(g, x + 55, 455, 45, i === 2 ? C.rust : C.sea);
    mono(g, i + 1, x + 55, 468, 36, C.white, { align: 'center' });
    serif(g, s, x, 598, 40, C.ink, { max: 395 });
    if (i < 3) arrow(g, x + 134, 455, x + 399, 455, C.soft, 5);
  });
  stroke(
    g,
    [
      [1498, 655],
      [1498, 739],
      [166, 739],
      [166, 584],
    ],
    C.gold,
    3,
  );
  text(
    g,
    'Hold out near-duplicate groups and measure teacher filter errors on independent labels.',
    98,
    935,
    37,
    C.soft,
  );
}
export function teacher(g, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    title(g, 'What did the student copy?', 'Margin = approved score − non-match score');
    const copied = cue(k, 0, 'student copy');
    [
      ['Teacher', 0.2, 0.8],
      ['Student', 0.2, 0.8],
    ]
      .slice(0, copied ? 2 : 1)
      .forEach(([s, a, n], i) => {
        const y = 397 + i * 188;
        serif(g, s, 90, y + 42, 57);
        cell(g, 550, y - 29, 273, 105, fixed(a), C.pale);
        text(g, '−', 882, y + 45, 57);
        cell(g, 1000, y - 29, 273, 105, fixed(n), C.pink);
        mono(g, '= ' + fixed(a - n), 1400, y + 48, 60, C.rust);
      });
    if (b === 1) mono(g, 'Squared margin error  =  (−0.6 − (−0.6))²  =  0', 90, 883, 48);
    return;
  }
  const ask = cue(k, 3, 'three point two');
  title(g, 'How far can a cosine margin reach?', 'Each raw student cosine lies between −1 and +1');
  const x = (v) => 145 + (v + 2) * 280;
  stroke(
    g,
    [
      [x(-2), 535],
      [x(2), 535],
    ],
    C.sea,
    15,
  );
  for (const v of [-2, -1, 0, 1, 2]) {
    circle(g, x(v), 535, 10, C.ink);
    mono(g, v, x(v), 615, 44, C.ink, { align: 'center' });
  }
  text(g, 'Student margin', x(-2), 454, 48, C.sea);
  if (ask) {
    stroke(
      g,
      [
        [x(2), 535],
        [x(teacherTarget), 535],
      ],
      C.rust,
      4,
      [12, 13],
    );
    circle(g, x(teacherTarget), 535, 16, C.rust);
    mono(g, fixed(teacherTarget, 1), x(teacherTarget), 614, 44, C.rust, { align: 'center' });
    text(g, 'Teacher', x(teacherTarget), 454, 44, C.rust, { align: 'center' });
    if (cue(k, 4, 'smallest possible squared error'))
      mono(g, 'Minimum squared error  =  (' + teacherTarget + ' − 2)²  =  ' +
        fixed((teacherTarget - 2) ** 2), 100, 880, 55);
    else text(g, 'How much of the requested margin can the student reach?', 100, 880, 49, C.gold);
  }
}
