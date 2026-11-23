import {
  C,
  stage,
  text,
  mono,
  serif,
  rect,
  line,
  dot,
  poly,
  paper,
  header,
  table,
  stamp,
  tag,
  fixed,
  screw,
  withAlpha,
} from './art.mjs';
import {
  LIKELIHOOD_FIXTURE,
  distinctIds,
  scores,
  cutInputs,
  cutGap,
  product,
  keptLength,
  lengths,
  pairs,
  countPairs,
  stablePairLoss,
} from './examples.mjs';

function clockFace(g, seconds) {
  rect(g, 48, 43, 360, 254, '#171c33', 18);
  rect(g, 62, 56, 332, 228, '#47485f', 12);
  for (const x of [76, 381]) for (const y of [69, 270]) screw(g, x, y);
  mono(g, 'MIGRATION  /  TIME LEFT', 89, 95, 17, C.cream);
  rect(g, 83, 114, 291, 115, '#202337', 8);
  const digits = [
    ...String(Math.floor(seconds / 60)).padStart(2, '0'),
    ...String(seconds % 60).padStart(2, '0'),
  ];
  digits.forEach((d, i) => {
    const x = 93 + i * 66 + (i >= 2 ? 9 : 0);
    rect(g, x, 124, 56, 92, '#30344c', 5);
    mono(g, d, x + 28, 197, 68, C.accent, { align: 'center' });
    line(g, x, 169, x + 56, 169, '#191b32', 2);
  });
  dot(g, 221, 153, 3, C.accent);
  dot(g, 221, 186, 3, C.accent);
  mono(g, 'MIN', 144, 255, 17, C.gray);
  mono(g, 'SEC', 288, 255, 17, C.gray);
}
function reply(g, x, y, w, code, body, p = 1) {
  withAlpha(g, p, () => {
    paper(g, x, y, w, 64);
    poly(
      g,
      [
        [x + 26, y + 61],
        [x + 27, y + 80],
        [x + 57, y + 61],
      ],
      C.page,
    );
    mono(g, code, x + 16, y + 38, 21, C.teal);
    serif(g, body, x + 62, y + 40, 25, C.ink, { width: w - 75 });
  });
}
export function opening(g, { clock, cue }) {
  stage(g);
  clockFace(g, Math.max(0, 600 - Math.floor(clock.seconds)));
  text(g, '“May I have admin access?”', 448, 86, 29, C.light);
  reply(g, 447, 118, 458, 'A', 'Request the ticket and wait.', cue(1, 'Answer A', 0.38));
  reply(g, 447, 224, 458, 'B', 'Admin access is enabled.', cue(1, 'Answer B', 0.38));
  paper(g, 55, 331, 851, 127);
  mono(g, 'ACCESS REVIEW   /   P7-42', 77, 363, 16, C.teal);
  serif(g, 'Approval required before grant', 77, 416, 30, C.ink, { width: 445 });
  mono(g, 'Reviewer approval', 545, 370, 18, C.muted);
  line(g, 544, 420, 872, 420, C.muted, 1.5);
  if (cue(2, 'Record A over B')) stamp(g, 'VOTE   A > B', 710, 290, 171, C.aqua);
}
export function likelihood(g, { cue }) {
  stage(g, true);
  header(g, 'TOY TOKENIZER   /   SAME REQUEST', 'How likely is each complete reply?');
  const seen = [
      cue(1, 'The first piece'),
      cue(1, 'The next depends'),
      cue(1, 'Multiply all three'),
    ],
    done = cue(2, 'B has twice'),
    review = cue(2, 'Our approval rule');
  LIKELIHOOD_FIXTURE.answers.forEach((a, i) => {
    const y = 159 + i * 141;
    mono(g, a.id, 48, y + 48, 32, C.teal);
    a.probabilities.forEach((p, k) => {
      const x = 96 + 202 * k;
      paper(g, x, y, 192, 94);
      serif(g, a.pieces[k], x + 12, y + 33, 23, C.ink, { width: 167 });
      if (seen[k]) {
        mono(g, (k === 0 ? '' : '× ') + fixed(p), x + 12, y + 75, 24, C.teal);
        if (!review) {
          const unitWidth = 168;
          rect(g, x + 12, y + 81, unitWidth, 7, C.faint);
          rect(g, x + 12, y + 81, unitWidth * p, 7, C.teal);
        }
      }
    });
    mono(g, done ? '= ' + fixed(product(a.probabilities)) : '= ?', 731, y + 60, 32, C.ink);
  });
  if (review) {
    tag(g, 'WRITER    B', 113, 438, { width: 230, color: C.lilac });
    tag(g, 'P-7 REVIEW    A', 492, 438, { width: 310, color: C.aqua });
  }
}
export function ballots(g, { cue }) {
  stage(g);
  header(g, 'INDEPENDENT REVIEW   /   A WAITS · B GRANTS', 'Two people, one pair of replies', true);
  [
    ['01', 'Approval comes first.', 'A', cue(1, 'The first marks A')],
    ['02', 'The migration is urgent.', 'B', cue(1, 'The second marks B')],
  ].forEach(([id, why, v, on], i) => {
    const x = 51 + i * 438;
    paper(g, x, 153, 413, 192);
    mono(g, 'REVIEWER ' + id, x + 20, 187, 17, C.muted);
    text(g, why, x + 20, 232, 24, C.ink);
    ['A', 'B'].forEach((k, j) => {
      const xx = x + 30 + j * 158;
      g.strokeStyle = C.muted;
      g.lineWidth = 2;
      g.strokeRect(xx, 269, 28, 28);
      mono(g, k, xx + 42, 292, 26);
      if (on && v === k) {
        line(g, xx + 2, 281, xx + 12, 293, C.teal, 4);
        line(g, xx + 12, 293, xx + 34, 262, C.teal, 4);
      }
    });
  });
  if (cue(1, 'One vote for each')) mono(g, 'BALLOTS     A × 1     B × 1', 59, 400, 22, C.light);
  if (cue(2, 'strict training label')) stamp(g, 'RUBRIC   A > B', 568, 368, 267, C.aqua);
  if (cue(2, 'one vote out of two')) mono(g, 'Vote target for A = 1/2', 59, 452, 22, C.accent);
}
export function scorer(g, { beat, cue }) {
  stage(g);
  header(g, 'GENERATION → EVALUATION', 'A completed reply goes through one scorer', true);
  const showB = cue(2, 'Use the same scorer'),
    aDone = cue(2, 'one point eight'),
    bDone = cue(2, 'zero point seven');
  const y = showB ? 294 : 172;
  const count = 1 + Math.floor(2 * cue(1, 'It produces an answer', 2.2));
  LIKELIHOOD_FIXTURE.answers.forEach((answer, i) => {
    if (i && !showB) return;
    const yy = 172 + 122 * i,
      pieces = answer.pieces.slice(0, i || beat > 1 ? 3 : count);
    paper(g, 51, yy, 350, 78, i ? C.lilac : C.cream);
    mono(g, answer.id, 66, yy + 44, 24, C.teal);
    serif(g, pieces.slice(0, 2).join(' '), 104, yy + 32, 24, C.ink, { width: 284 });
    if (pieces.length === 3) serif(g, pieces[2], 104, yy + 62, 24, C.ink, { width: 283 });
  });
  if (count === 3) {
    line(g, 403, y + 34, 466, y + 34, C.aqua, 4);
    poly(
      g,
      [
        [466, y + 26],
        [481, y + 34],
        [466, y + 42],
      ],
      C.aqua,
    );
  }
  rect(g, 484, 154, 186, 235, '#161b34', 20);
  for (const x of [497, 657]) for (const yy of [168, 375]) screw(g, x, yy);
  mono(g, 'SHARED', 576, 215, 22, C.gray, { align: 'center' });
  serif(g, 'Scorer', 576, 260, 39, C.cream, { align: 'center' });
  mono(g, 'prompt + reply', 577, 310, 17, C.aqua, { align: 'center' });
  [
    [aDone, scores[0]],
    [bDone, scores[1]],
  ].forEach(([d, v], i) => {
    if (i && !showB) return;
    mono(g, (i ? 'B' : 'A') + '  ' + (d ? fixed(v, 1) : '…'), 713, 219 + i * 122, 37, C.light);
  });
}
export function inputs(g, { beat, cue }) {
  stage(g, true);
  header(g, 'SCORER INPUT   /   ONE TEMPLATE', 'Inspect the prefix and the answer tokens');
  const useIds = beat >= 2;
  const covered = beat === 2 && cue(2, 'Cover the last token') && !cue(2, 'Uncover the last token');
  ['A', 'B'].forEach((name, i) => {
    const y = 167 + 114 * i;
    mono(g, name, 50, y + 51, 30, C.teal);
    const row = useIds
      ? distinctIds[i]
      : ['P-7', 'Request', 'History + tools', i ? 'Grant now' : 'Wait'];
    row.forEach((v, k) => {
      const x = 101 + 200 * k;
      if (covered && k === 3) {
        rect(g, x, y, 177, 83, C.faint, 4);
        mono(g, 'excluded', x + 88, y + 49, 19, C.muted, { align: 'center' });
        return;
      }
      paper(g, x, y, 177, 83, k === 3 ? (i ? C.coral : C.aqua) : C.page);
      text(g, v, x + 88, y + 51, 25, C.ink, { align: 'center', width: 157 });
    });
  });
  if (beat === 1) mono(g, 'Same system rules, request, tools and history', 101, 422, 22, C.teal);
  else if (beat === 2)
    mono(
      g,
      covered
        ? 'Both masks [1,1,1]   ·   same score'
        : 'Both masks [1,1,1,1]   ·   fourth IDs differ',
      102,
      422,
      21,
      C.teal,
    );
  else {
    mono(g, 'Generating checkpoint   /   decoding settings   /   cohort', 89, 406, 19, C.teal);
    mono(g, 'Strict win: A > B       Ties and abstentions filed separately', 89, 446, 18, C.muted);
  }
}
export function exactInputs(g, { beat, cue }) {
  stage(g, true);
  if (beat <= 2) {
    header(g, 'PREFERENCE PAIR   /   TRL 1.17.1', 'Where does the conversation branch?');
    paper(g, 52, 155, 433, 225);
    mono(g, 'COMMON PREFIX', 73, 188, 17, C.teal);
    serif(g, 'System  /  Approval first', 73, 239, 25);
    serif(g, 'User  /  Admin for migration?', 73, 299, 25, C.ink, { width: 386 });
    line(g, 485, 258, 530, 258, C.muted);
    line(g, 530, 210, 530, 320, C.muted);
    for (const [i, v] of ['Chosen  ·  ask and wait', 'Rejected  ·  grant now'].entries()) {
      line(g, 530, 210 + 110 * i, 573, 210 + 110 * i, C.muted);
      paper(g, 573, 177 + 110 * i, 332, 70, i ? C.coral : C.aqua);
      text(g, v, 595, 221 + 110 * i, 23, C.ink, { width: 293 });
    }
    mono(
      g,
      beat === 1
        ? 'Explicit row: prompt + two completions'
        : 'Messages → chat template       Strings → concatenate',
      55,
      434,
      21,
      C.teal,
    );
  } else if (beat === 3) {
    header(g, 'AFTER TRUNCATION   /   STRICT LABEL A > B', 'Can you find a difference after the cutoff?');
    const scan = cue(3, 'Read down each column', 1.2);
    const masks = cue(3, 'compare the masks');
    const matched = cue(3, 'Every entry matches');
    const scored = cue(3, 'Their margin is zero');
    const revealGap = cue(3, 'A strict win');
    const revealLoss = cue(3, 'Changing a shared weight');
    const gradient = cue(3, 'To check your own pair');
    for (const [label, x] of [['Raw reply', 52], ['Final token IDs', 215], ['Attention mask', 549], ['Score', 806]])
      mono(g, label, x, 164, 18, C.muted);
    cutInputs.forEach(({ ids, mask, score }, i) => {
      const y = 188 + i * 80;
      text(g, i ? 'B · grant' : 'A · wait', 52, y + 37, 25);
      ids.forEach((id, k) => {
        const x = 214 + 104 * k;
        const active = scan > 0 && !masks && k === Math.min(2, Math.floor(scan * 3));
        paper(g, x, y, 90, 53, matched || active ? C.aqua : C.page);
        mono(g, id, x + 45, y + 36, 25, C.ink, { align: 'center' });
      });
      paper(g, 546, y, 191, 53, masks ? C.aqua : C.page);
      mono(g, '[' + mask.join(', ') + ']', 642, y + 36, 22, C.ink, { align: 'center' });
      mono(g, scored ? fixed(score, 1) : '?', 808, y + 37, 29, C.teal);
    });
    if (revealGap) mono(g, 'Δ = ' + cutInputs.map((r) => fixed(r.score, 1)).join(' − ') + ' = ' + cutGap, 53, 394, 25);
    if (revealLoss) mono(g, 'Loss = ln 2 ≈ ' + fixed(stablePairLoss(cutGap), 3), 526, 394, 25);
    if (gradient) text(g, 'Both scores change equally. The pair-loss gradient is zero.', 54, 456, 24, C.teal);
  } else if (beat === 4 && !cue(4, 'The checked trainer instead filters')) {
    header(g, 'RAW TEXT   /   TRUNCATION', 'What would cutting this suffix erase?');
    paper(g, 56, 164, 846, 77);
    serif(g, 'A   “I will wait for review.”', 75, 213, 26);
    paper(g, 56, 276, 846, 77);
    serif(g, 'B   “I will wait for review.', 75, 325, 26);
    const cut = cue(4, 'Cutting that suffix');
    if (!cut) {
      rect(g, 422, 286, 458, 52, C.coral);
      serif(g, 'Admin access is enabled now.”', 434, 323, 25);
    } else mono(g, '[suffix removed]', 446, 323, 22, C.muted);
    text(
      g,
      cut
        ? 'The scored text no longer contains the false grant.'
        : 'The last sentence contradicts the promise to wait.',
      58,
      431,
      23,
      C.teal,
    );
  } else {
    header(
      g,
      'TRL 1.17.1   /   FULL TEMPLATED LENGTH',
      'Which complete pairs fit in 1,024 tokens?',
    );
    const ready = cue(5, 'The boundary-length pair survives');
    table(g, {
      columns: [
        ['Pair', 0],
        ['Chosen', 0.36],
        ['Rejected', 0.55],
        ['Decision', 0.76],
      ],
      rows: lengths.map(([a, b], i) => [
        ['Boundary', 'Long rejection', 'Long winner'][i],
        a,
        b,
        ready ? (keptLength([a, b]) ? 'Keep' : 'Drop pair') : '?',
      ]),
    });
    mono(g, 'Keep if both lengths ≤ 1,024.    None disables this filter.', 53, 441, 19, C.teal);
  }
}
export function splitGroup(g, { beat, cue }) {
  stage(g);
  header(g, 'PROMPT P   /   FOUR COMPLETIONS', 'Who shares a prompt across the split?', true);
  const pts = [
      [135, 208],
      [337, 208],
      [135, 373],
      [337, 373],
    ],
    keys = 'ABCD';
  const split = cue(2, 'Put three comparisons'),
    grouped = cue(3, 'keep the whole prompt group');
  const n = beat > 1 ? 6 : Math.min(6, Math.floor(1 + cue(1, 'give six comparisons', 1) * 5));
  pairs
    .slice(0, n)
    .forEach((pair, i) =>
      line(
        g,
        ...pts[keys.indexOf(pair[0])],
        ...pts[keys.indexOf(pair[1])],
        !grouped && split && ['AC', 'AD', 'CD'].includes(pair) ? C.coral : C.aqua,
        3,
      ),
    );
  pts.forEach(([x, y], i) => {
    dot(g, x, y, 25, C.lilac);
    mono(g, keys[i], x, y + 9, 26, C.ink, { align: 'center' });
  });
  // Both subsets include A. Keep the six edge identities through regrouping.
  const train = ['AB', 'BC', 'BD'],
    test = ['AC', 'AD', 'CD'];
  const rows = grouped
    ? [
        ['TRAIN · P', pairs.join('   ')],
        ['EVALUATION · Q', 'EF   EG   FG'],
      ]
    : split
      ? [
          ['TRAIN · P', train.join('   ')],
          ['EVALUATION · P', test.join('   ')],
        ]
      : [['PROMPT P', pairs.slice(0, n).join('   ')]];
  rows.forEach(([k, v], i) => {
    const y = 172 + 133 * i;
    paper(g, 457, y, 450, 106);
    mono(g, k, 478, y + 33, 16, C.teal);
    mono(g, v, 478, y + 76, 23, C.ink, { width: 406 });
  });
  if (beat === 1 && n === 6) mono(g, 'K answers give K × (K − 1) / 2 pairs', 55, 459, 21, C.aqua);
  if (grouped) mono(g, 'Unseen-prompt evaluation  ·  check near duplicates', 55, 459, 19, C.aqua);
}
export function weighting(g, { beat, cue }) {
  stage(g, true);
  if (beat <= 2) {
    header(g, 'PAIR EXPANSION', 'How much loss weight does one prompt get?');
    const n = countPairs(9),
      equal = cue(1, 'Average within each prompt');
    mono(g, 'P  /  9 answers', 57, 165, 20, C.teal);
    mono(g, 'Q  /  2 answers', 609, 165, 20, C.teal);
    for (let i = 0; i < n; i++)
      rect(g, 56 + (i % 9) * 47, 188 + Math.floor(i / 9) * 28, 39, 21, '#4c6f84', 3);
    rect(g, 609, 188, 39, 21, '#a26662', 3);
    mono(g, '36 pairs', 57, 332, 21);
    mono(g, '1 pair', 609, 332, 21);
    const f = equal ? 0.5 : n / (n + 1);
    rect(g, 56, 372, 848, 37, C.coral);
    rect(g, 56, 372, 848 * f, 37, C.aqua);
    mono(
      g,
      equal
        ? 'P = 1/2     Q = 1/2     ·     average prompt means'
        : 'P = 36/37     Q = 1/37     ·     average pair losses',
      55,
      451,
      20,
    );
  } else if (beat <= 4) {
    header(g, 'PLACKETT–LUCE   /   SUPPLIED STRENGTHS', 'Draw A first, then B from what remains');
    const second = cue(3, 'Then B'),
      full = cue(4, 'one third');
    [3, 2, 1].forEach((n, i) => {
      const x = 77 + i * 267;
      paper(g, x, 163, 216, 152, i === 0 && second ? C.faint : C.page);
      mono(g, 'ABC'[i], x + 20, 202, 30);
      for (let j = 0; j < n; j++)
        dot(g, x + 38 + j * 55, 248, 16, i === 0 && second ? C.edge : C.teal);
      if (!i && second) mono(g, 'drawn first', x + 18, 293, 17, C.muted);
    });
    mono(g, 'P(A first) = 3/6', 58, 374, 25);
    if (second) mono(g, 'P(B next | A) = 2/3', 469, 374, 25);
    if (full) mono(g, 'P(A, B, C) = 3/6 × 2/3 × 1 = 1/3', 58, 444, 27, C.teal);
  } else {
    header(g, 'REPEATED VOTES   /   IDENTITIES FIXED', 'Which probability fits these five votes?');
    ['A', 'A', 'A', 'B', 'B'].forEach((v, i) => {
      paper(g, 57 + i * 174, 172, 147, 99, v === 'A' ? C.aqua : C.lilac);
      serif(g, v, 128 + i * 174, 239, 42, C.ink, { align: 'center' });
    });
    if (cue(5, 'The fraction q')) mono(g, 'q(A) = 3/5 = 0.60', 60, 345, 30, C.teal);
    if (cue(5, 'loss is smallest'))
      text(g, 'Soft-target BCE is smallest at p(A) = 0.60.', 60, 412, 25);
    if (beat === 6) text(g, 'An explicit tie has its own annotation.', 60, 458, 22, C.muted);
  }
}
