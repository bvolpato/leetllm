import {
  byId,
  control,
  dcg,
  eligible,
  latencies,
  measure,
  mmr,
  percentile,
  printers,
  reason,
  saveProposal,
} from './experiment.mjs';
import {
  barcode,
  paper,
  blue,
  box,
  caption,
  clamp,
  colors,
  cue,
  dotMark,
  ease,
  f,
  head,
  ink,
  lineColor,
  machine,
  mix,
  mono,
  muted,
  printerRow,
  red,
  slot,
  stamp,
  strip,
  stroke,
  sub,
  teal,
  type,
} from './studio.mjs';

export function opening(c, k) {
  const reject = cue(k, 2, 'Leave the slot open'),
    second = cue(k, 2, 'Inspect the next printer'),
    shipping = cue(k, 2, 'Set it aside');
  const accepted = [
    cue(k, 2, 'Now take P five', 0.65),
    cue(k, 2, 'also pass', 0.65),
    cue(k, 2, 'also pass', 0.8),
  ];
  head(c, 'Label printers');
  const p = second ? (accepted[0] > 0 ? byId.P5 : byId.P11) : byId.P8;
  const feed = second ? 1 : k.beat.beatIndex ? 1 : cue(k, 1, 'label coming out', 1.15);
  machine(c, p, 223, 251, 1.88, 0);
  const h = 82 + 88 * feed,
    xSlip = 143,
    top = 252;
  c.save();
  c.beginPath();
  c.rect(xSlip, top, 161, h);
  c.clip();
  strip(c, xSlip, top, 161, 177);
  mono(c, p.id + '  ' + f(p.match), xSlip + 10, top + 37, 24);
  sub(c, 'Retrieval match', xSlip + 10, top + 67);
  type(c, 'Policy    ' + (p.approved ? 'Approved' : 'Blocked'), xSlip + 10, top + 100, 16, {
    color: p.approved ? teal : red,
  });
  type(c, 'Stock    ' + (p.stock ? 'Available' : 'Sold out'), xSlip + 10, top + 128, 16, {
    color: p.stock ? teal : red,
  });
  barcode(c, xSlip + 10, top + 148, 119, 11);
  c.restore();
  const x = 476;
  sub(c, 'Candidates for ranking', x, 99);
  for (let i = 0; i < 3; i++) {
    const y = 126 + i * 82;
    slot(c, x, y, 413, 64);
    mono(c, String(i + 1), x + 23, y + 33, 23, muted);
    if (accepted[i] > 0) {
      c.save();
      c.globalAlpha = accepted[i];
      const row = eligible[i];
      machine(c, row, x + 104, y + 33, 0.44);
      mono(c, row.id + '   ' + f(row.match), x + 165, y + 34, 24);
      c.restore();
    }
  }
  if (second && !shipping) sub(c, 'Ship to this shopper?   Outside delivery region', 478, 405, red);
  if (reject) type(c, 'P8   /   ' + reason(byId.P8), 477, 443, 18, { color: red });
  if (shipping) type(c, 'P11   /   ' + reason(byId.P11), 477, 473, 18, { color: red });
}
export function shortlist(c, k) {
  const chosen = cue(k, 1, 'Take the first three matches'),
    cut = cue(k, 1, 'Enforce the rules now'),
    repair = k.beat.beatIndex > 0;
  head(c, 'A budget of three');
  const xs = [116, 298, 480, 662, 844];
  printers.forEach((p, i) => {
    machine(c, p, xs[i], 206, 0.91);
    mono(c, p.id + '  ' + f(p.match), xs[i], 272, 19, ink, 'center');
    if ((repair || cut) && reason(p))
      type(c, reason(p), xs[i], 304, 15, { color: red, align: 'center' });
    if ((chosen || repair) && (repair ? !reason(p) : i < 3 && (!cut || !reason(p))))
      stroke(c, xs[i] - 61, 325, xs[i] + 61, 325, teal, 5);
  });
  const rows = repair ? eligible : chosen ? (cut ? [byId.P5] : printers.slice(0, 3)) : [];
  sub(c, repair ? 'Filter, then take three' : 'Take three, then filter', 45, 362);
  for (let i = 0; i < 3; i++) {
    const x = 47 + i * 215;
    slot(c, x, 390, 185, 57);
    if (rows[i]) mono(c, rows[i].id, x + 92, 419, 24, ink, 'center');
  }
  mono(c, rows.length + ' / 3', 745, 419, 31, teal);
}
export function diversity(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    head(c, 'From catalog to display');
    const labels = ['Catalog', 'Retrieve', 'Score', 'Display'];
    const widths = [174, 150, 128, 108];
    const tall = [170, 120, 85, 67];
    labels.forEach((name, i) => {
      const x = 53 + i * 229;
      sub(c, name, x, 140);
      box(
        c,
        x,
        253 - tall[i] / 2,
        widths[i],
        tall[i],
        i === 0 ? '#d2ddd3' : i === 1 ? '#bdd4ca' : i === 2 ? '#b3c6d8' : '#c8d8c0',
        5,
      );
      if (i === 0) {
        for (let j = 0; j < 10; j++)
          dotMark(c, x + 26 + (j % 5) * 29, 230 + Math.floor(j / 5) * 41, 8, j < 5 ? blue : teal);
      } else
        for (let j = 0; j < 3; j++)
          machine(c, eligible[j], x + 23 + (j * (widths[i] - 43)) / 2, 264, 0.23);
      if (i < 3) stroke(c, x + widths[i] + 8, 253, x + 210, 253, muted, 2);
    });
    caption(
      c,
      b
        ? 'Retrieval budget and display cutoff can differ.'
        : 'Two searches share a ten-listing catalog.',
    );
    return;
  }
  head(c, 'Build a varied printer shelf');
  if (b >= 4) {
    secondPrinter(c, k);
    return;
  }
  const selected = cue(k, 4, 'so the first printer');
  sub(c, 'Selection value = 0.6 × relevance − 0.4 × maximum similarity', 45, 112);
  eligible.forEach((p, i) => {
    const y = 181 + i * 92,
      v = mmr(p, false);
    machine(c, p, 91, y + 8, 0.53);
    mono(c, p.id, 156, y, 20);
    mono(c, f(v.reward, 3), 256, y, 23);
    mono(c, '0.6 × ' + f(p.score), 256, y + 28, 15, muted);
    mono(c, '−  ' + f(v.penalty, 3) + '  =  ' + f(v.value, 3), 386, y, 22);
    if (selected && i === 0) stamp(c, 'First', 758, y);
  });
  caption(c, 'An empty shelf gives every printer zero redundancy.');
}
function spokenProgress(k, beatIndex, phrase, captionStart = false) {
  if (k.beat.beatIndex !== beatIndex) return Number(k.beat.beatIndex > beatIndex);
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart });
}
function secondPrinter(c, k) {
  const rows = [
    {
      printer: byId.P6,
      similarityPhrase: 'Its similarity is point nine',
      penaltyPhrase: 'P six loses point three six',
      resultPhrase: 'P six loses point three six and has point one four four left',
    },
    {
      printer: byId.P4,
      similarityPhrase: "P four's similarity is only point one",
      penaltyPhrase: 'P four loses only point zero four',
      resultPhrase: 'P four loses only point zero four and keeps point two three',
    },
  ].map((row) => ({ ...row, ...mmr(row.printer, true) }));
  const winPhrase = 'Give the second place to P four';
  const showWinner = spokenProgress(k, 5, winPhrase, winPhrase) === 1;
  const best = Math.max(...rows.map(({ value }) => value));
  const scoreX = (value) => 285 + 960 * value;
  const deductionColor = '#ddbc96';
  const deductionInk = '#884b27';

  type(c, '0.6 × relevance − 0.4 × similarity to P5', 46, 111, 22);
  for (let tick = 0; tick <= 6; tick++) {
    const value = tick / 10;
    const x = scoreX(value);
    stroke(c, x, 169, x, 383, lineColor, tick === 0 ? 2 : 1);
    mono(c, f(value, 1), x, 153, 16, muted, 'center');
  }

  for (const [i, row] of rows.entries()) {
    const { printer, reward, similarity, penalty, value } = row;
    const { similarityPhrase, penaltyPhrase, resultPhrase } = row;
    const progress = spokenProgress(k, 5, resultPhrase, resultPhrase);
    const y = 226 + i * 109;
    const before = scoreX(reward);
    const after = scoreX(reward - penalty * progress);
    const start = scoreX(0);

    machine(c, printer, 87, y + 5, 0.52);
    mono(c, printer.id, 146, y, 23);
    if (spokenProgress(k, 4, similarityPhrase) === 1)
      type(c, 'Similarity ' + f(similarity, 2), 47, y + 43, 19);

    box(c, start, y - 13, after - start, 26, teal, 3);
    if (progress > 0) {
      box(c, after, y - 13, before - after, 26, deductionColor);
      stroke(c, before, y - 17, before, y + 17, deductionInk, 2);
    }
    mono(c, f(reward, 3), before, y - 32, 23, ink, 'right');
    if (spokenProgress(k, 5, penaltyPhrase) === 1)
      mono(c, '−' + f(penalty, 3), before + 10, y - 32, 23, deductionInk);
    if (progress === 1) mono(c, f(value, 3) + ' left', after, y + 31, 23, teal, 'center');
    if (showWinner && value === best) stamp(c, 'Second', 185, y);
  }

  stroke(c, 46, 405, 909, 405, lineColor, 1);
  machine(c, byId.P5, 85, 448, 0.44);
  type(c, 'P5 already on the shelf', 131, 442, 19);
  if (k.beat.beatIndex === 6)
    type(c, 'The lab uses a seller cap.', 907, 442, 21, { align: 'right' });
  else if (cue(k, 5, 'Before we subtract the penalties') && !showWinner)
    type(c, 'Which printer goes second?', 907, 442, 21, { align: 'right' });
}
export function recheck(c, k) {
  const second = k.beat.beatIndex >= 2,
    sold = cue(k, 3, 'P five sells out'),
    decision = cue(k, 4, 'It rejects the whole proposal'),
    write = cue(k, 2, 'so it writes three rows');
  const catalogNow = eligible.map((p) => (sold && p.id === 'P5' ? { ...p, stock: false } : p)),
    written = saveProposal(eligible, catalogNow);
  head(c, second ? 'Replay the call' : 'Response construction');
  sub(c, 'REQ-501   /   Treatment   /   Limit of two per seller', 45, 108);
  type(c, 'Write only if every proposed printer still passes', 46, 140, 20);
  printerRow(c, eligible, {
    y: 238,
    caption: (p, i) => '#' + (i + 1) + '  ' + p.id + '   ' + f(p.score),
    detail: (p) => 'Seller ' + p.seller,
  });
  eligible.forEach((p, i) => {
    const x = 182 + i * 298;
    const unavailable = p.id === 'P5' && sold;
    type(c, unavailable ? 'In stock → Sold out' : 'In stock', x, 366, 21, {
      align: 'center',
      color: unavailable ? red : teal,
      weight: 600,
    });
  });
  stroke(c, 60, 389, 900, 389, lineColor);
  if (second) {
    type(
      c,
      decision
        ? 'Rejected   /   ' + written.length + ' new rows'
        : 'New response   /   Awaiting check',
      480,
      420,
      26,
      { align: 'center', color: decision ? red : ink },
    );
  } else
    type(
      c,
      write
        ? 'Saved   /   ' + written.map((p, i) => i + 1 + ' ' + p.id).join('     ')
        : 'Proposed   /   P5    P6    P4',
      480,
      420,
      25,
      { align: 'center' },
    );
}
export function order(c, k) {
  const travel = cue(k, 4, 'Move P five to the top', 1.65);
  const landed = travel === 1;
  const rows = landed ? eligible : control,
    m = measure(rows);
  head(c, 'The value of first place');
  const shelf = landed ? 'Treatment order (ideal)' : travel ? 'Reordering printers' : 'Control order';
  sub(c, shelf + '   /   Graded label printers', 46, 106);
  const xs = [182, 480, 778],
    horizontal = ease(clamp((travel - 0.22) / 0.56));
  control.forEach((p, i) => {
    const to = eligible.indexOf(p),
      x = mix(xs[i], xs[to], horizontal);
    const lift = i === 0 ? 156 * ease(clamp(Math.min(travel, 1 - travel) / 0.22)) : 0;
    machine(c, p, x, 242 + lift, 1.02);
    if (travel === 0 || landed) mono(c, p.id + '   grade ' + p.grade, x, 314, 18, ink, 'center');
  });
  if (travel === 0 || landed) {
    rows.forEach((p, i) => {
      const gains = k.beat.beatIndex >= 1;
      mono(c, 'Rank ' + (i + 1), xs[i], 135, 16, muted, 'center');
      if (gains)
        mono(c, f(m.gains[i], 3) + ' of ' + (2 ** p.grade - 1), xs[i], 353, 21, teal, 'center');
    });
  }
  const baseline = measure(control);
  if (cue(k, 2, 'That sum is')) mono(c, 'Control DCG  ' + f(baseline.observed, 3), 46, 454, 23);
  if (cue(k, 4, 'Divide each total')) mono(c, 'Ideal DCG  ' + f(m.ideal, 3), 488, 454, 23);
  const ratio = (value, relation) =>
    f(value.observed, 3) + ' / ' + f(value.ideal, 3) + relation + f(value.ndcg, 3);
  if (cue(k, 5, 'The treatment matches'))
    mono(c, 'Control NDCG  ' + ratio(baseline, ' ≈ '), 46, 491, 19, teal);
  if (cue(k, 5, 'This ratio'))
    mono(c, 'Treatment NDCG  ' + ratio(m, ' = '), 488, 491, 19, teal);
}
export function metric(c, k) {
  const b = k.beat.beatIndex;
  head(c, b < 3 ? 'One grade, two uses' : 'The first relevant result');
  if (b < 3) {
    const m = measure(control);
    ['Printer', 'Grade', 'Gain', 'Discount', 'Gain / discount'].forEach((a, i) =>
      sub(c, a, [60, 258, 394, 539, 705][i], 142),
    );
    control.forEach((p, i) => {
      const y = 197 + i * 66;
      stroke(c, 55, y + 27, 902, y + 27, lineColor, 1);
      mono(c, p.id, 62, y, 24, colors[p.id]);
      mono(c, p.grade, 270, y, 22);
      mono(c, 2 ** p.grade - 1, 409, y, 22);
      mono(c, f(Math.log2(i + 2), 3), 541, y, 22);
      mono(c, f(m.gains[i], 3), 730, y, 23);
    });
    if (b === 0) {
      mono(c, 'g = 2^grade − 1      discount = log₂(rank + 1)', 59, 410, 20);
      sub(
        c,
        'Ranks start at 1. Normalize against the ideal order from the fixed universe.',
        59,
        453,
      );
    } else {
      mono(
        c,
        'Grade ≥ 2   →   ' + m.found + ' / ' + m.total + ' relevant eligible printers',
        60,
        401,
        21,
        teal,
      );
      sub(
        c,
        b === 1
          ? 'P4 adds graded gain even though it falls below the binary relevance threshold.'
          : 'Empty relevant set: recall is undefined. Zero ideal gain: this helper returns NDCG 0.',
        60,
        452,
      );
    }
  } else {
    const rows = [
      { id: 'A', ok: false },
      { id: 'B', ok: false },
      { id: 'C', ok: true },
    ];
    rows.forEach((p, i) => {
      const x = 70 + i * 286;
      strip(c, x, 163, 242, 146);
      mono(c, 'Rank ' + (i + 1), x + 22, 198);
      type(c, p.ok ? 'Relevant' : 'Below threshold', x + 22, 261, 23, {
        color: p.ok ? teal : muted,
      });
    });
    mono(c, 'Reciprocal rank   1 / 3', 70, 386, 28, teal);
    sub(
      c,
      b === 3
        ? 'Average these values across queries. A query with no relevant result contributes zero.'
        : 'A click-based threshold measures behavior under the displayed order.',
      70,
      442,
    );
  }
}
export function missing(c, k) {
  const drop = cue(k, 1, 'retrieval drops P six'),
    restore = cue(k, 5, 'restore P six to retrieval'),
    demote = cue(k, 5, 'Lower just its ranking score');
  const repaired = cue(k, 6, "restore P six's ranking score");
  const rows = restore
    ? demote && !repaired
      ? [byId.P5, byId.P4, { ...byId.P6, score: 0.2 }]
      : eligible
    : drop
      ? [byId.P5, byId.P4]
      : eligible;
  const full = measure(rows),
    own = measure(rows, rows);
  head(c, 'Find the missing gain');
  sub(c, 'Fixed eligible reference', 40, 130);
  sub(c, 'Returned order', 40, 246);
  for (let i = 0; i < 3; i++) {
    const x = 300 + i * 203;
    [
      [eligible[i], 115],
      [rows[i], 231],
    ].forEach(([p, y]) => {
      slot(c, x, y, 170, 70);
      if (p) {
        mono(c, p.id + '   grade ' + p.grade, x + 85, y + 25, 17, ink, 'center');
        mono(
          c,
          y === 231 ? 'score ' + f(p.score) : 'ideal #' + (i + 1),
          x + 85,
          y + 49,
          15,
          muted,
          'center',
        );
      }
    });
  }
  if (restore && k.beat.beatIndex === 4) {
    caption(c, demote ? 'Which stage needs the repair?' : 'P6 is back in the candidate set.');
    return;
  }
  if (cue(k, 2, 'That is half recall'))
    mono(c, 'Recall   ' + full.found + ' / ' + full.total, 44, 357, 24, teal);
  if (cue(k, 3, 'The score is one') && !restore)
    mono(c, 'Survivor ideal   ' + f(own.ndcg, 3), 360, 357, 21);
  if (cue(k, 4, 'That fixed reference') && (!restore || cue(k, 6, 'To move P six')))
    mono(
      c,
      'Fixed ideal    ' +
        f(full.observed, 3) +
        ' / ' +
        f(full.ideal, 3) +
        '  =  ' +
        f(full.ndcg, 3),
      45,
      435,
      24,
      blue,
    );
}
export function gates(c, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    head(c, 'Two judged searches');
    const missing = cue(k, 2, 'remove P three'),
      fix = dcg([3, 1]) / dcg([3, 2, 1]),
      scores = [dcg([3, 1, 2]) / dcg([3, 2, 1]), measure(control).ndcg];
    ['Insulated bag', 'Label printer'].forEach((q, i) => {
      const x = 52 + i * 468;
      sub(c, q, x, 141);
      const a = scores[i],
        v = missing && i === 0 ? fix : 1;
      for (const [j, n] of [a, v].entries()) {
        const y = 205 + j * 90;
        mono(c, j ? 'Candidate' : 'Control', x, y, 16);
        box(c, x, y + 18, 340, 13, '#d9dfd4', 5);
        box(c, x, y + 18, 340 * n, 13, j ? teal : blue, 5);
        mono(c, f(n, 3), x + 355, y + 24, 17);
      }
      mono(
        c,
        i === 1 ? 'P5 → P6 → P4' : missing ? 'P1 → P2    (P3 absent)' : 'P1 → P3 → P2',
        x,
        351,
        17,
        muted,
      );
    });
    if (b === 2) {
      const mean = (fix + 1) / 2;
      const showMean = cue(k, 3, 'still above the control mean');
      mono(
        c,
        'Mean   (' + f(fix, 3) + ' + 1.000) / 2' +
          (showMean ? '  ≈  ' + f(mean, 3) + ' > ' + f((scores[0] + scores[1]) / 2, 3) : ''),
        47,
        390,
        23,
        teal,
      );
      if (cue(k, 3, 'Pin the cutoff'))
        sub(c, 'Insulated bag misses the per-query floor of 0.950.', 47, 444, red);
    } else
      caption(
        c,
        missing
          ? 'Without P3, bag recall is 1 / 2. Its survivor-only NDCG is still 1.000.'
          : 'Mean NDCG@3   ' + f((scores[0] + scores[1]) / 2, 3) + ' → 1.000',
      );
  } else {
    head(c, 'Scoring time');
    sub(c, 'Ten synthetic scoring times (ms), sorted by duration.', 47, 113);
    const selected = cue(k, 5, 'It passes');
    const xs = latencies.toSorted((a, b) => a - b),
      yBot = 391;
    xs.forEach((v, i) => {
      const x = 94 + 82 * i,
        h = v * 10;
      const active = selected && i === xs.length - 1;
      box(c, x - 22, yBot - h, 44, h, active ? teal : '#83a2a3', 4);
      mono(c, v, x, yBot - h + 19, 18, active ? paper : ink, 'center');
      mono(c, i + 1, x, 419, 14, muted, 'center');
    });
    stroke(c, 47, yBot - 200, 908, yBot - 200, red, 1.7, [4, 5]);
    sub(c, '20 ms limit', 49, 164, red);
    caption(
      c,
      selected
        ? 'Position 10   /   ' + percentile(xs, 0.95) + ' ms' +
          (cue(k, 5, 'To apply this check') ? ' passes the worksheet limit.' : '')
        : 'Nearest-rank p95   /   ceil(0.95 × 10)',
    );
  }
}
