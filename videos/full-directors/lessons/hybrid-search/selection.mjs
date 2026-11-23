import {
  agrees,
  finish,
  join,
  minmax,
  mmr,
  ms,
  result,
  stress,
  votes,
  weighted,
} from './evidence.mjs';
import {
  arrow,
  box,
  cue,
  done,
  dot,
  ease,
  field,
  fileIcon,
  gold,
  grid,
  head,
  ink,
  key,
  label,
  line,
  mint,
  mix,
  muted,
  night,
  orange,
  pale,
  paper,
  peach,
  plate,
  ranks,
  rect,
  serif,
  steel,
  teal,
  text,
  white,
} from './art.mjs';

function share(c, x, y, v, lane, alpha = 1) {
  if (!v) return;
  c.save();
  c.globalAlpha = alpha;
  const col = lane ? orange : teal,
    den = Math.round(1 / v);
  box(c, x, y - 22, 104, 44, 4, lane ? '#f2d5bb' : '#cfdfc7', col, 1.5);
  label(c, '1/' + den, x + 52, y, 22, col, 'center');
  c.restore();
}
function matrix(c, lex, dense, y) {
  label(c, 'PASSAGE', 62, y - 66);
  label(c, 'WORD RANK', 292, y - 66);
  label(c, 'VECTOR RANK', 491, y - 66);
  label(c, 'RANK CONTRIBUTIONS', 730, y - 66);
  agrees[0].forEach((id, i) => {
    const cy = y + i * 87,
      rs = agrees.map((l) => l.indexOf(id) + 1),
      vs = votes(agrees, 60, id);
    line(
      c,
      [
        [62, cy + 41],
        [1114, cy + 41],
      ],
      grid,
      1,
    );
    fileIcon(c, id, 79, cy, 0.6, teal, paper);
    serif(c, id, 115, cy, 32);
    [lex, dense].forEach((amt, k) => {
      const x = k ? 500 : 300;
      label(c, rs[k] ? '#' + rs[k] : '—', x, cy, 27, k ? orange : teal);
      if (amt > 0 && vs[k]) share(c, 734 + 123 * k, cy - 16 * (1 - ease(amt)), vs[k], k, amt);
    });
  });
}

export function fusion(c, t) {
  field(c);
  head(c, 'Reciprocal rank fusion', 'Put each vote on its passage');
  label(c, 'Query   “stale service-account key rotation within 14 days”', 62, 171, 20);
  const l = cue(t, 1, 'Lay down the lexical votes', 0.9),
    d = cue(t, 2, 'Add the dense votes', 0.9);
  matrix(c, l, d, 298);
  if (t.beat.beatIndex >= 1)
    label(c, 'One vote per ID per lane   ·   1 / (60 + rank)', 63, 522, 21, teal);
  if (done(t, 2, 'Compare the sums')) {
    const rows = result(agrees, 60);
    label(
      c,
      rows.map((r, i) => i + 1 + '  ' + r.id + '  ' + r.score.toFixed(5)).join('       '),
      63,
      585,
      23,
      ink,
    );
  }
}
export function shortlist(c, t) {
  field(c);
  const k = 60;
  const order = result(stress, k);
  const sessionFirst = done(t, 2, 'Its two second-place votes');
  const sessionScore = ease(cue(t, 2, 'Its two second-place votes', 0.9));
  const sessionTotal = done(t, 2, 'Audit and Key each');
  const tiedScores = ease(cue(t, 2, 'Audit wins the tie', 0.55));
  const auditSent = done(t, 2, 'The two slots are full');
  let sendThree = false;
  let keyTransfer = 0;
  if (t.beat.beatIndex === 3) {
    const budgetPhrase = 'Change the number of candidates passed forward from two to three';
    const budget = t.wordCue(budgetPhrase);
    sendThree = cue(t, 3, budgetPhrase, budget.end - budget.start) === 1;
    const transferPhrase = 'Now the reranker receives Key';
    const transfer = t.wordCue(transferPhrase);
    keyTransfer = ease(cue(t, 3, transferPhrase, transfer.end - transfer.start));
  }
  const rowY = (i) => 263 + i * 91;
  const slotX = 914;
  const slotWidth = 224;
  const scoreX = 538;
  const scoreWidth = 148;
  head(c, 'Reciprocal rank fusion  /  k = ' + k, 'Which passages reach the reranker?');
  label(c, 'PASSAGE', 63, 190, 18);
  label(c, 'WORD VOTE', 275, 190, 18, teal);
  label(c, 'VECTOR VOTE', 395, 190, 18, orange);
  label(c, 'FUSED SCORE', scoreX, 190, 18);
  label(c, 'RANK', 744, 190, 18, muted, 'right');

  const ids = ['Key', 'Session', 'Audit'];
  ids.forEach((id, i) => {
    const y = rowY(i);
    const rank = order.findIndex((row) => row.id === id);
    const parts = votes(stress, k, id);
    const progress = rank === 0 ? sessionScore : tiedScores;
    line(c, [[62, y + 40], [744, y + 40]], grid, 1);
    fileIcon(c, id, 82, y, 0.65, teal, paper);
    serif(c, id, 118, y, 33);
    if (id === 'Key') label(c, 'Required rule', 118, y + 27, 17);
    parts.forEach((vote, lane) => {
      const x = 271 + lane * 121;
      if (vote) {
        const rank = stress[lane].indexOf(id) + 1;
        label(c, '#' + rank, x + 52, y - 25, 17, lane ? orange : teal, 'center');
        share(c, x, y + 7, vote, lane);
      } else {
        label(c, 'No vote', x + 52, y + 7, 17, muted, 'center');
      }
    });
    rect(c, scoreX, y - 19, scoreWidth, 13, '#e0deca');
    let x = scoreX;
    parts.forEach((vote, lane) => {
      const width = (vote / order[0].score) * scoreWidth * progress;
      if (width > 0) rect(c, x, y - 19, width, 13, lane ? orange : teal);
      x += width;
    });
    if (rank === 0 ? sessionTotal : progress === 1)
      label(c, '≈ ' + order[rank].score.toFixed(5), scoreX, y + 15, 23, ink);
    if (rank === 0 ? sessionFirst : auditSent)
      label(c, '#' + (rank + 1), 744, y + 15, 21, ink, 'right');
  });

  if (t.beat.beatIndex === 0) return;

  label(c, 'ID TIE-BREAK   Audit < Key < Session', 63, 532, 19);
  label(c, 'RERANKER INPUT', slotX, 190, 18);
  const cutoff = (rowY(1) + rowY(2)) / 2;
  if (!sendThree) line(c, [[slotX, cutoff], [slotX + slotWidth, cutoff]], orange, 2, [7, 6]);
  const sent = [sessionFirst, auditSent, keyTransfer === 1];
  order.forEach(({ id }, i) => {
    const y = rowY(i);
    if (i === 2 && sendThree && !sent[i]) {
      const right = slotX + slotWidth;
      line(c, [[slotX, y - 32], [right, y - 32], [right, y + 32], [slotX, y + 32]], teal, 2);
    } else {
      box(c, slotX, y - 32, slotWidth, 64, 5, sent[i] ? '#d2e4cd' : pale, sent[i] ? teal : grid);
    }
    label(c, i + 1, slotX + slotWidth - 17, y, 20, muted, 'right');
    if (sent[i]) serif(c, id, slotX + 22, y, 31);
    else if (i === 2 && !sendThree)
      label(c, 'Outside cutoff', slotX + 22, y, 18, muted);
  });
  label(c, 'Fused budget  ' + (sendThree ? 3 : 2), slotX, 532, 22, teal);

  if (keyTransfer > 0 && keyTransfer < 1) {
    const y = mix(rowY(0), rowY(2), Math.min(1, keyTransfer * 2));
    const x = mix(765, slotX + 9, Math.max(0, keyTransfer * 2 - 1));
    box(c, x, y - 25, 121, 50, 5, '#d2e4cd', teal);
    serif(c, order[2].id, x + 13, y, 31);
  }
}

export function weights(c, t) {
  field(c);
  const b = t.beat.beatIndex;
  if (b <= 1) {
    head(c, 'Weighted score fusion', 'What does a weight of 0.7 buy?');
    const parts = weighted(0.8, 0.2, 0.7);
    [
      ['Dense', 0.8, 0.7, orange],
      ['Lexical', 0.2, 0.3, teal],
    ].forEach(([id, s, w, col], i) => {
      const y = 245 + i * 123;
      serif(c, id, 62, y, 36);
      rect(c, 235, y - 20, 390, 40, '#d9dcc7');
      rect(c, 235, y - 20, 390 * s, 40, col);
      label(c, s.toFixed(1) + ' × ' + w.toFixed(1), 666, y, 26, ink);
      if (i ? b > 0 || t.elapsed >= t.speechDuration : done(t, 0, 'The lexical contribution'))
        label(c, '= ' + parts[i].toFixed(2), 903, y, 32, col);
    });
    if (done(t, 1, 'That’s a ranking score')) {
      rect(c, 234, 490, 390 * parts[0], 50, orange);
      rect(c, 234 + 390 * parts[0], 490, 390 * parts[1], 50, teal);
      label(c, 'Total', 63, 515, 22);
      serif(c, parts.reduce((a, b) => a + b, 0).toFixed(2), 664, 515, 50);
      label(c, 'ranking score', 864, 515, 22, muted);
    }
    return;
  }
  if (b <= 4) {
    const hi = done(t, 2, 'Five now gets') ? 100 : 10,
      constant = done(t, 3, 'If all scores');
    const lo = constant ? 5 : 0,
      max = constant ? 5 : hi,
      value = 5,
      v = minmax(value, lo, max);
    head(
      c,
      'Min–max scaling',
      constant ? 'When every score is five' : 'The same five on a longer ruler',
    );
    label(c, 'RAW SCORE', 65, 213);
    serif(c, '5', 64, 280, 62);
    label(c, 'observed minimum  ' + lo, 291, 263, 23);
    label(c, 'observed maximum  ' + max, 719, 263, 23);
    const x = 100,
      y = 439,
      w = 1000;
    line(
      c,
      [
        [x, y],
        [x + w, y],
      ],
      ink,
      3,
    );
    for (let i = 0; i <= 20; i++)
      line(
        c,
        [
          [x + (w * i) / 20, y],
          [x + (w * i) / 20, y + (i % 5 ? 8 : 17)],
        ],
        muted,
        2,
      );
    label(c, '0', x, y + 39, 20, muted, 'center');
    label(c, '1', x + w, y + 39, 20, muted, 'center');
    const assigned = constant
      ? done(t, 3, 'under our chosen policy')
      : hi === 100
        ? done(t, 2, 'Searching deeper')
        : done(t, 2, 'Keep five fixed');
    if (assigned) {
      dot(c, x + v * w, y, 11, orange, pale, 3);
      label(c, v.toFixed(2), x + v * w, y - 41, 26, orange, 'center');
    }
    label(
      c,
      constant
        ? assigned
          ? 'Zero range   ·   chosen policy assigns zero to this lane'
          : 'Zero range   ·   the scaling formula divides by zero'
        : 'Normalized = (score − minimum) / (maximum − minimum)',
      65,
      555,
      21,
      ink,
    );
    if (b === 4) label(c, 'Probability calibration needs labeled outcomes.', 65, 605, 20, teal);
    return;
  }
  head(c, 'Score fusion  /  evaluation', 'The missing third score');
  const ids = ['Key', 'Session', 'Audit'];
  ids.forEach((id, i) => {
    const y = 242 + i * 88;
    label(c, i === 2 ? '—' : '#' + (i + 1), 70, y, 23);
    serif(c, id, 151, y, 33);
    label(c, i === 2 ? 'unknown' : 'observed', 372, y, 22, i === 2 ? orange : teal);
  });
  line(
    c,
    [
      [60, 364],
      [576, 364],
    ],
    orange,
    2,
    [8, 7],
  );
  if (b === 5) {
    label(c, 'Returned at depth 2', 66, 520, 20);
    text(c, 'Rescore the union', 719, 283, 38, teal, { family: 'Serif' });
    text(c, 'or test the missing-score rule.', 719, 348, 25);
  } else {
    plate(c, 662, 191, 476, 334);
    label(c, 'DEVELOPMENT', 697, 240, 18, teal);
    text(c, 'Fit weights and scaling', 697, 290, 28);
    line(
      c,
      [
        [697, 334],
        [1104, 334],
      ],
      grid,
    );
    label(c, 'HELD-OUT QUERY FAMILIES', 697, 380, 18, teal);
    text(c, 'Frozen weights vs. RRF', 697, 438, 28);
  }
}

export function diversity(c, t) {
  field(c);
  head(c, 'Maximal marginal relevance', 'What earns the second slot?');
  const b = t.beat.beatIndex,
    choice = done(t, 3, 'Read the passage'),
    rejected = done(t, 4, 'A near-copy');
  label(c, 'ALREADY SELECTED', 65, 197);
  box(c, 65, 227, 370, 100, 6, teal);
  fileIcon(c, 'Key', 118, 278, 1.1, pale, teal);
  serif(c, 'Key rule', 169, 278, 36, pale);
  label(c, 'NEXT SLOT', 65, 382);
  box(
    c,
    65,
    410,
    370,
    101,
    6,
    choice && !rejected ? '#cee3cf' : null,
    choice && !rejected ? teal : muted,
    2,
  );
  if (choice)
    text(c, rejected ? 'Leave empty' : 'Session', 91, 460, 32, rejected ? muted : ink, {
      family: 'Serif',
    });
  else label(c, '?', 95, 459, 31, muted);
  if (b < 2) {
    serif(c, 'Relevance', 520, 248, 40, teal);
    text(c, 'similarity to the query', 521, 297, 24);
    serif(c, 'Redundancy', 520, 383, 40, orange);
    text(c, 'highest similarity to a selected passage', 521, 434, 24);
    label(c, 'λ × relevance − (1 − λ) × redundancy', 65, 565, 22);
    if (done(t, 1, 'With an empty selection'))
      label(
        c,
        'Empty selection: redundancy = 0. At λ = 0, break the tie by ID.',
        65,
        614,
        18,
        teal,
      );
    return;
  }
  if (choice) {
    plate(c, 492, 187, 645, 340);
    label(c, 'PASSAGE UNDER REVIEW', 530, 235, 17, muted);
    serif(c, 'Session rule', 530, 300, 40);
    text(c, 'Idle browser sessions expire after', 530, 363, 27);
    text(c, '30 days of inactivity.', 530, 404, 27);
    line(
      c,
      [
        [529, 443],
        [1097, 443],
      ],
      grid,
    );
    label(c, 'When is automated key rotation allowed?', 530, 485, 20, orange);
    if (rejected)
      label(
        c,
        b === 5
          ? 'Multiple required policies? Check each source and condition.'
          : 'Check provenance before treating a copy as the governing rule.',
        65,
        589,
        19,
        teal,
      );
    return;
  }
  label(c, 'λ = 0.5     query similarity − redundancy, each at half weight', 487, 190, 16, muted);
  mmr.forEach((row, i) => {
    const y = 256 + i * 142;
    serif(c, row.id, 494, y, 31);
    label(c, '0.5 × ' + row.r.toFixed(2) + ' − 0.5 × ' + row.d.toFixed(2), 495, y + 49, 20);
    if (done(t, 3, i ? 'Session takes' : 'Session keeps')) {
      const x = 956;
      line(
        c,
        [
          [x, y - 25],
          [x, y + 42],
        ],
        muted,
        2,
      );
      rect(
        c,
        Math.min(x, x + row.score * 440),
        y - 9,
        Math.abs(row.score) * 440,
        20,
        i ? teal : orange,
      );
      label(c, row.score.toFixed(3), 954, y + 66, 19, i ? teal : orange, 'center');
    }
  });
}

export function trace(c, t) {
  const b = t.beat.beatIndex;
  field(c, true);
  if (b < 2) {
    head(c, 'Request trace', 'Count the passages at each boundary', true);
    const stages = [
      ['Lane depth', '≤ 2 per lane'],
      ['Fused budget', '≤ 3 IDs'],
      ['Reranker input', '≤ 3 passages'],
      ['Final context', '1 passage'],
    ];
    stages.forEach(([id, num], i) => {
      const x = 65 + i * 275;
      label(c, id, x, 244, 18, mint);
      const n = [2, 3, 3, 1][i];
      for (let j = 0; j < n; j++) {
        box(c, x + j * 12, 297 - j * 12, 137, 80, 5, '#294d52', steel, 1);
        line(
          c,
          [
            [x + 13 + j * 12, 320 - j * 12],
            [x + 84 + j * 12, 320 - j * 12],
          ],
          mint,
          2,
        );
      }
      label(c, num, x, 427, 20, white);
    });
    if (b === 1) {
      const fail = done(t, 1, 'A timeout');
      line(
        c,
        [
          [64, 486],
          [1127, 486],
        ],
        steel,
      );
      label(
        c,
        fail
          ? 'Lexical timed out   ·   returned set unknown   ·   degraded request'
          : 'Lexical complete   ·   0 hits   ·   normal request',
        65,
        551,
        22,
        fail ? peach : mint,
      );
    }
    return;
  }
  if (b < 4) {
    head(c, 'Request trace  /  milliseconds', 'Two searches share one deadline', true);
    const ends = done(t, 3, 'Each stage'),
      auth = done(t, 2, 'Both lanes'),
      lex = done(t, 2, 'Dense takes'),
      dense = done(t, 2, 'At that point');
    const x = 273,
      unit = 13.6,
      y = 216;
    const bands = [
      ['Authorization', 0, ms.auth, auth],
      ['Word search', ms.auth, ms.auth + ms.lex, lex],
      ['Vector search', ms.auth, join, dense],
      ['Fusion', join, finish, ends],
    ];
    line(
      c,
      [
        [x + ms.budget * unit, y - 25],
        [x + ms.budget * unit, y + 292],
      ],
      peach,
      3,
      [6, 6],
    );
    label(c, '50 ms deadline', x + ms.budget * unit, y - 49, 18, peach, 'center');
    bands.forEach(([stage, start, end, draw], i) => {
      const yy = y + i * 75;
      label(c, stage, 64, yy + 17, 21, white);
      line(
        c,
        [
          [x, yy + 19],
          [x + 60 * unit, yy + 19],
        ],
        '#3b5960',
        1,
      );
      if (draw) {
        box(c, x + start * unit, yy, unit * (end - start), 37, 3, i === 3 ? peach : mint);
        label(c, end - start + ' ms', x + ((start + end) * unit) / 2, yy + 19, 16, night, 'center');
      }
    });
    for (const v of [0, 10, 22, 50, ends ? 58 : 60])
      label(c, v, x + v * unit, y + 325, 16, steel, 'center');
    if (dense && !ends) label(c, 'Fusion needs 8 ms', 65, 591, 23, peach);
    if (ends) label(c, '10 + max(12, 40) + 8 = 58 ms', 64, 595, 25, gold);
    return;
  }
  if (b === 4) {
    head(c, 'Access-controlled trace', 'What makes a request replayable?', true);
    [
      ['Search identity', 'Lane and index versions', 'Effective date · grant revision'],
      ['Evidence', 'Permitted IDs and ranks', 'Lane, fused and context limits'],
      ['Timing', 'Per-stage elapsed time', 'Wall-clock deadline · outcome'],
    ].forEach(([title, a, d], i) => {
      const yy = 222 + i * 120;
      label(c, title, 65, yy, 21, mint);
      text(c, a, 414, yy, 27, white);
      text(c, d, 414, yy + 39, 22, steel);
      line(
        c,
        [
          [65, yy + 69],
          [1124, yy + 69],
        ],
        '#49666a',
        1,
      );
    });
    label(c, 'Fetch or cache reuse   →   recheck current access', 66, 608, 20, peach);
    return;
  }
  head(c, 'Retrieval evaluation', 'One hit can leave a condition missing', true);
  const req = ['Governing rule', 'Required exception'];
  req.forEach((s, i) => {
    const y = 243 + i * 98;
    box(c, 66, y, 604, 79, 5, '#25454b', steel, 1);
    text(c, s, 90, y + 40, 32, white, { family: 'Serif' });
    label(c, i ? 'missing' : 'retrieved', 642, y + 40, 20, i ? peach : mint, 'right');
  });
  label(c, 'Hit', 750, 269, 25, white);
  label(c, '1', 1060, 269, 28, mint);
  label(c, 'Recall', 750, 372, 25, white);
  label(c, '1 / 2', 1060, 372, 28, peach, 'right');
  label(c, 'Example with two required sources   ·   fixed corpus and grants', 66, 499, 20, steel);
  label(c, 'Evaluate the answer against the retained sources.', 66, 565, 21, mint);
}
