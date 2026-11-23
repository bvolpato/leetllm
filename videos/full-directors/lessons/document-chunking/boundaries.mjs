import {
  RUNBOOK,
  LONG_SECTION,
  whole,
  body,
  page,
  candidates,
  reversed,
  requiredPhrasesPresent,
  condition,
  archive,
  header,
  table,
  children,
  balanced,
  indexRun,
  fixedWindows,
  measure,
  choices,
  locator,
} from './evidence.mjs';
import {
  ink,
  muted,
  teal,
  sea,
  blue,
  pale,
  rust,
  blush,
  gold,
  paper,
  white,
  rect,
  line,
  disc,
  poly,
  text,
  serif,
  mono,
  gradient,
  desk,
  slip,
  heading,
  stamp,
  bracket,
  wordCells,
  progress,
  after,
} from './press.mjs';

export function copier(c, k) {
  const lift = progress(k, 1, 'Lift the top edge', 1.9);
  const travel = progress(k, 2, 'Copy from the condition', 1.65);
  rect(c, 0, 0, 1920, 1080, '#dfaa57');
  c.save();
  c.translate(0, -1080 * travel);
  const top = 508 - 300 * lift;
  rect(c, 0, 0, 1920, 1080, gradient(c, 0, 1080, '#f8c26b', '#d49140'));
  rect(c, 64, 81, 1283, 909, '#a47039', 42);
  rect(c, 57, 64, 1283, 912, '#ffe2a0', 42);
  rect(c, 83, 89, 1230, 858, ink, 34);
  rect(c, 104, 109, 1188, 814, '#4e6a75', 26);
  rect(c, 158, 142, 1080, 742, '#334b50');
  slip(c, 149, 133, 1082, 743);
  const passages = [
    body.slice(0, 2).join(' '),
    body.slice(2, 5).join(' '),
    body.slice(5, 7).join(' '),
    body.slice(7).join(' '),
  ];
  // The opaque mask covers every glyph outside the active scan, even during the move.
  c.save();
  c.beginPath();
  c.rect(149, top, 1082, 738 - top);
  c.clip();
  passages.forEach((s, i) =>
    serif(c, s, 236, [310, 435, 607, 714][i], i === 0 ? 90 : 82, ink, 915),
  );
  c.restore();
  rect(c, 149, 133, 1082, top - 133, gradient(c, 133, top - 133, '#79969a', '#a0b6b4'));
  rect(c, 149, 738, 1082, 138, '#a0b6b4');
  for (const y of [top, 738]) {
    line(c, 150, y, 1230, y, teal, 3);
    for (const [x, dx] of [
      [170, 45],
      [1208, -45],
    ]) {
      line(c, x, y, x + dx, y, teal, 10);
      line(c, x, y, x, y + (y === 738 ? -23 : 23), teal, 10);
    }
  }
  poly(
    c,
    [
      [105, top - 17],
      [131, top - 17],
      [149, top],
      [131, top + 17],
      [105, top + 17],
    ],
    gold,
  );
  mono(c, 'RUNBOOK  v3    /    p. 7', 205, 838, 32, ink);
  const beat = k.beat.beatIndex;
  const running = beat > 1 || (beat === 1 && k.reveal('starts the clock', 0, { captionStart: false }) === 1);
  const cx = 1600,
    cy = 488,
    r = 194;
  rect(c, cx - 26, cy - r - 54, 52, 60, ink, 10);
  rect(c, cx - 52, cy - r - 66, 104, 30, muted, 10);
  disc(c, cx, cy + 9, r + 13, '#a5703f');
  disc(c, cx, cy, r + 11, ink);
  disc(c, cx, cy, r - 2, paper);
  for (let i = 0; i < 60; i++) {
    const a = (i * Math.PI) / 30 - Math.PI / 2;
    line(
      c,
      cx + (r - 19) * Math.cos(a),
      cy + (r - 19) * Math.sin(a),
      cx + (r - (i % 5 === 0 ? 39 : 26)) * Math.cos(a),
      cy + (r - (i % 5 === 0 ? 39 : 26)) * Math.sin(a),
      i === 15 ? rust : muted,
      i % 5 === 0 ? 5 : 2,
    );
  }
  text(c, '0', cx, cy - r + 77, 35, ink, 'Mono', 'center');
  text(c, '15', cx + r - 66, cy + 12, 34, rust, 'Mono', 'center');
  const elapsed = beat === 1 ? k.reveal('starts the clock', 5, { captionStart: false }) : 1;
  const angle = -Math.PI / 2 + (running ? 0.48 * elapsed : 0);
  line(c, cx, cy, cx + 105 * Math.cos(angle), cy + 105 * Math.sin(angle), running ? teal : ink, 8);
  disc(c, cx, cy, 11, ink);
  text(c, running ? 'Clock started' : 'Clock stopped', cx, 769, 49, ink, 'Serif', 'center');
  text(
    c,
    running ? 'Rollback failure' : 'Start event?',
    cx,
    827,
    32,
    running ? teal : ink,
    'Mono',
    'center',
  );
  for (let i = 0; i < 6; i++) rect(c, 1474, 927 + 9 * i, 245, 4, '#ab783b', 2);
  if (travel > 0) {
    c.translate(0, 1080);
    rect(c, 0, 0, 1920, 1080, gradient(c, 0, 1080, '#d49140', '#f2bc6a'));
    mono(c, 'RETRIEVED PASSAGE', 202, 137, 34, ink);
    rect(c, 170, 187, 1580, 791, '#edc88b', 70);
    rect(c, 168, 173, 1580, 785, ink, 68);
    rect(c, 190, 213, 1536, 717, gradient(c, 213, 717, '#425464', '#758992'), 51);
    rect(c, 259, 203, 1403, 61, '#152938', 22);
    for (const x of [356, 850, 1345]) {
      rect(c, x, 209, 181, 44, '#60717a', 11);
      for (let j = 0; j < 15; j++) rect(c, x + 10 + j * 11, 210, 4, 42, '#3e5663', 2);
    }
    const feed = progress(k, 2, 'That one hit', 1.3);
    c.save();
    c.beginPath();
    c.rect(230, 254, 1452, 667);
    c.clip();
    const y = 254 - 578 * (1 - feed);
    slip(c, 305, y, 1300, 596);
    passages.forEach((s, i) => serif(c, s, 403, y + 109 + i * 100, 81, ink, 1100));
    line(c, 405, y + 451, 1511, y + 451, muted, 2);
    mono(c, locator, 407, y + 534, 39, teal);
    c.restore();
  }
  c.restore();
}

export function inspectCut(c, k) {
  const b = k.beat.beatIndex,
    neg = b >= 3;
  const passage = neg ? reversed : candidates[Math.min(b, 2)].text;
  const label = neg ? 'Edited instruction' : b === 2 ? 'Complete sentence' : 'Candidate passage';
  desk(c);
  heading(c, 'Proofreading  /  ' + locator, 'What does the hit authorize?');
  slip(c, 102, 260, 1715, 475);
  mono(c, label.toUpperCase(), 164, 333, 27);
  const lines = passage.startsWith('15')
    ? [body.slice(5).join(' '), 'Routine deploy notes archive within 14 days.']
    : b === 0
      ? [passage]
      : [
          neg ? 'Rollback failure: do not page on-call' : 'Rollback failure: page on-call',
          'within 15 minutes with deploy ID.',
        ];
  lines.forEach((s, i) => serif(c, s, 166, 462 + i * 93, 76, ink, 1560));
  if (neg) {
    c.font = '500 76px "Lesson Serif"';
    const x = 166 + c.measureText('Rollback failure: ').width;
    line(c, x, 481, x + c.measureText('do not').width, 481, rust, 5);
    mono(c, 'Source action    page on-call', 168, 673, 29, blue);
  }
  const reveal = b < 3 || (b === 4 && after(k, 4, 'An engineer'));
  const terms = ['rollback failure', '15 minutes', 'deploy ID'];
  terms.forEach((t, i) => {
    const found = passage.toLowerCase().includes(t.toLowerCase());
    const x = 104 + i * 573;
    rect(c, x, 800, 548, 119, reveal ? (found ? sea : blush) : paper, 3);
    mono(
      c,
      reveal ? (found ? 'FOUND' : 'ABSENT') : 'CHECK',
      x + 26,
      842,
      24,
      reveal ? (found ? teal : rust) : muted,
    );
    serif(c, t, x + 24, 898, 45);
  });
  if (b === 4 && reveal && requiredPhrasesPresent(passage))
    text(c, 'Three matches. The inserted words reverse the action.', 106, 1000, 37, rust);
}

export function windows(c, k) {
  const b = k.beat.beatIndex,
    move = progress(k, 1, 'slide it forward', 1.5);
  const span = fixedWindows(RUNBOOK, 6, 2),
    step = 1670 / 10,
    x = 124,
    left = x + 4 * step * move;
  desk(c);
  heading(c, 'Page 7  /  whitespace words', 'A six-word reading window');
  slip(c, 92, 310, 1736, 277);
  wordCells(c, page.slice(0, 10), x, 385, 1670, {
    start: 0,
    end: 0,
    base: paper,
    size: 42,
    indices: true,
  });
  c.strokeStyle = teal;
  c.lineWidth = 7;
  c.strokeRect(left, 363, step * 6 - 4, 98);
  for (const side of [left, left + step * 6 - 4]) rect(c, side - 7, 346, 15, 128, teal, 4);
  mono(c, 'First ten words on the page', 124, 556, 25);
  const which = move >= 1 ? 1 : 0;
  if (move === 0 || move >= 1) {
    mono(c, 'RETURNED TEXT', 125, 695, 27, teal);
    serif(c, span[which].text, 120, 802, 71, ink, 1660);
  }
  if (b >= 2) {
    bracket(c, x + step * 4, x + step * 6, 331, blue, '2 shared words', true);
    text(
      c,
      '6 words per window   −   2 shared words   =   4 words per step',
      125,
      927,
      42,
      ink,
      'Sans',
    );
  }
  if (b === 3) mono(c, 'Start offsets from zero    0    4    8    12', 126, 1002, 32, teal);
}

function intervalMap(c, overlap, { goldPhrase = true } = {}) {
  const run = indexRun(overlap),
    x = 124,
    w = 1668,
    step = w / page.length,
    y = 364;
  page.forEach((v, i) => {
    const hot = goldPhrase && i >= 5 && i < 10;
    rect(c, x + i * step, y - 57, step - 2, 67, hot ? gold : paper, 2);
    text(c, v, x + (i + 0.5) * step, y - 14, 31, ink, 'Serif', 'center', step - 7);
  });
  run.hits.forEach((h, i) => {
    const yy = y + 61 + i * 55;
    rect(c, x + h.start * step, yy, (h.end - h.start) * step - 3, 37, pale, 4);
    for (let j = h.start; j < h.end; j++) {
      if (goldPhrase && j >= 5 && j < 10) rect(c, x + j * step, yy + 4, step - 3, 29, gold, 2);
      if (j !== h.start) line(c, x + j * step, yy + 4, x + j * step, yy + 31, '#738f9c', 1);
    }
    text(c, i + 1, x - 28, yy + 29, 22, muted, 'Mono', 'center');
  });
  return run;
}
function afterWords(k, beat, phrase) {
  if (k.beat.beatIndex !== beat) return k.beat.beatIndex > beat;
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: false }) === 1;
}

export function overlap(c, k) {
  const b = k.beat.beatIndex,
    o = [0, 2, 4, 4][b];
  desk(c);
  heading(c, 'Seven words per hit  /  ' + o + ' words repeated', 'What does overlap buy?');
  const run = intervalMap(c, o);
  mono(c, 'Gold phrase    15 minutes with deploy ID', 122, 744, 32, ink);
  const totalsKnown = b === 0
    ? afterWords(k, 0, 'all seventeen words once')
    : b === 1
      ? afterWords(k, 1, 'twenty-one word occurrences')
      : afterWords(k, 2, 'thirty-three word occurrences');
  const hitsKnown = b === 0
    ? afterWords(k, 0, 'contains that whole gold phrase')
    : b === 1
      ? afterWords(k, 1, 'contains the whole deadline and ID')
      : afterWords(k, 2, 'is still one');
  const wholeRuleKnown = afterWords(k, 2, 'Even the widest hit covers only seven');
  const quantities = [
    [totalsKnown ? run.occurrences : '·', 'indexed word occurrences'],
    [hitsKnown ? run.facts : '·', 'hits with deadline and ID'],
    [wholeRuleKnown ? run.rules : '·', 'hits with complete rule'],
  ];
  quantities.forEach(([n, label], i) => {
    const x = 122 + i * 571;
    line(c, x, 760, x + 490, 760, muted, 2);
    serif(c, String(n), x, 826, 73, i === 1 ? teal : ink);
    text(c, label, x, 872, 34, muted);
  });
  if (afterWords(k, 2, 'It stretches across ten words'))
    bracket(c, 124, 124 + (1668 / 17) * 10, 287, teal, '10-word paging rule', true);
}

export function structure(c, k) {
  const b = k.beat.beatIndex;
  desk(c);
  heading(
    c,
    'Document structure  /  page 7',
    b === 0 ? 'Which heading goes with the action?' : 'What does “14 days” describe?',
  );
  if (b === 0) {
    const sections = [
      [condition, 'Page on-call within 15 minutes with deploy ID.'],
      [archive, 'Archive within 14 days after release.'],
    ];
    sections.forEach(([h, rule], i) => {
      const y = 293 + i * 319;
      slip(c, 145, y, 1625, 260);
      rect(c, 145, y, 18, 260, i ? blue : teal);
      mono(c, '§ ' + (i + 1), 203, y + 60, 32);
      serif(c, h, 330, y + 90, 65);
      text(c, rule, 330, y + 186, 49);
      if (i === 0 && after(k, 0, 'Attach the section title'))
        line(c, 330, y + 113, 330 + 430, y + 113, teal, 5);
    });
    return;
  }
  const x = 132,
    w = 1656,
    cols = [x + 35, x + 684, x + 1070];
  const headerAt = progress(k, 1, 'Repeat the header', 1.1);
  function row(y, values, isHeader = false) {
    rect(c, x, y, w, isHeader ? 77 : 135, isHeader ? ink : paper);
    values.forEach((val, i) =>
      text(
        c,
        val,
        cols[i],
        y + (isHeader ? 51 : 84),
        isHeader ? 31 : 51,
        isHeader ? white : ink,
        isHeader ? 'Sans' : 'Serif',
        'left',
        [580, 343, 528][i],
      ),
    );
  }
  row(280, header, true);
  row(357, table[0]);
  mono(c, 'SEPARATE ROW GROUP', x, 607, 28, muted);
  if (headerAt > 0) {
    row(633 + 13 * headerAt, header, true);
  }
  row(723, table[1]);
  if (b === 2) {
    line(c, cols[1], 812, cols[1] + 180, 812, teal, 5);
    mono(c, 'v3   /   page 7   /   Runbook windows   /   row 2, column 2', x, 951, 33, teal);
  }
}

export function tails(c, k) {
  const b = k.beat.beatIndex;
  desk(c);
  if (b >= 4) {
    heading(
      c,
      'Tail handling  /  17 source words',
      b === 4 ? 'Stop when a hit reaches the end' : 'Long documents and short pages',
    );
    if (b === 4) {
      const hits = fixedWindows(RUNBOOK, 7, 2);
      const x = 140,
        step = 1618 / 17;
      wordCells(c, page, x, 323, 1618, { end: 0, size: 29 });
      hits.forEach((h, i) => {
        const y = 476 + i * 105;
        rect(c, x + h.start * step, y, (h.end - h.start) * step - 5, 52, sea, 3);
        text(
          c,
          h.text,
          x + ((h.start + h.end) / 2) * step,
          y + 37,
          32,
          ink,
          'Serif',
          'center',
          (h.end - h.start) * step - 20,
        );
      });
      line(c, x + 17 * step, 440, x + 17 * step, 813, rust, 4);
      mono(c, 'Source ends here', 1293, 875, 33, rust);
    } else {
      mono(c, 'LONG DOCUMENT  /  20% OVERLAP', 127, 341, 30, teal);
      serif(c, '1 ÷ (1 − 0.20) = 1.25×', 121, 475, 106);
      text(c, 'Approximate window count relative to zero overlap', 129, 548, 40);
      mono(c, '17-WORD PAGE  /  EXACT COUNTS', 128, 694, 30, teal);
      [0, 2, 4].forEach((o, i) => {
        const x = 132 + i * 565;
        serif(c, String(indexRun(o).occurrences), x, 828, 91);
        text(c, 'occurrences  ·  overlap ' + o, x, 906, 34);
      });
    }
    return;
  }
  heading(c, 'Training copy  /  15 body words', 'Repair the short tail');
  const merged = afterWords(k, 1, 'Merge the last word into its neighbor');
  const balancedKnown = afterWords(k, 1, 'Five, five and five fit');
  const moveCuts = b === 1 && merged && !balancedKnown && after(k, 1, 'Move both boundaries');
  const rows = !merged ? children([7, 7, 1]) : balancedKnown ? balanced : children([7, 8]);
  const floor = b === 3 ? 6 : 4,
    dx = 1700 / 15;
  const words = LONG_SECTION.split(' ');
  wordCells(c, words, 107, 316, 1700, { end: 0, indices: true, size: 34 });
  if (moveCuts) {
    const { start } = k.wordCue('Move both boundaries');
    const { end } = k.wordCue('Five, five and five fit');
    const progress = Math.min(1, Math.max(0, (k.elapsed - start) / (end - start)));
    const eased = progress * progress * (3 - 2 * progress);
    const cuts = [7 - 2 * eased, 15 - 5 * eased];
    for (const cut of cuts) {
      const x = 107 + dx * cut;
      line(c, x, 441, x, 487, teal, 5);
      poly(c, [[x, 429], [x - 11, 444], [x + 11, 444]], teal);
    }
    text(c, 'Move the cuts. Keep the source words in place.', 109, 552, 39, teal);
    return;
  }
  let start = 0;
  rows.forEach((r, i) => {
    bracket(
      c,
      109 + dx * start,
      104 + dx * (start + r.length),
      461,
      r.length > 7 ? rust : teal,
      String(r.length) + (r.length === 1 ? ' word' : ' words'),
    );
    start += r.length;
    const y = 584 + i * 101;
    rect(c, 107, y, 1710, 86, i === 0 && b === 2 ? sea : paper, 2);
    mono(c, '[' + r.start + ', ' + r.end + ')', 135, y + 54, 31);
    serif(c, r.text, 415, y + 58, 42, ink, 1080);
    text(
      c,
      r.length > 7 ? 'Over cap' : r.length < floor ? 'Short' : 'Fits',
      1750,
      y + 55,
      32,
      r.length > 7 || r.length < floor ? rust : teal,
      'Sans',
      'right',
    );
  });
  const note =
    b === 3
      ? '3 × 6 = 18 words needed. The section has 15.'
      : b === 2
        ? 'First child ends at “minutes”. The required ID is in the next child.'
        : 'Hard maximum   7 words     /     Preferred minimum   ' + floor + ' words';
  text(c, note, 109, 542, 39, b === 2 ? teal : ink);
}

export function tokenLimit(c, k) {
  const b = k.beat.beatIndex;
  desk(c);
  if (b < 2) {
    heading(c, 'Training copy  /  embedding input', 'Which measurement sets the limit?');
    slip(c, 105, 281, 1706, 254);
    serif(c, LONG_SECTION, 157, 389, 61, ink, 1603);
    mono(
      c,
      LONG_SECTION.split(' ').length + ' words    /    ' + LONG_SECTION.length + ' characters',
      161,
      478,
      32,
    );
    mono(c, 'all-MiniLM-L6-v2', 118, 655, 33, teal);
    serif(c, '384', 117, 825, 122);
    text(c, 'output coordinates', 116, 904, 42);
    if (b === 1) {
      serif(c, '256', 975, 825, 122);
      text(c, 'wordpieces in the default input limit', 974, 904, 42);
    }
  } else if (b < 4) {
    heading(c, 'Illustrative tokenizer readings', 'Will the encoder read the whole input?');
    const repair = after(k, 3, 'It counts eleven body tokens'),
      m = measure(repair ? 11 : 12);
    const result = repair ? after(k, 3, 'Check the evidence') : after(k, 3, 'That puts');
    const items = [
      [m.bodyTokens, 'body', blue],
      [m.heading, 'heading', teal],
      [m.special, 'special', rust],
    ];
    items.forEach(([n, s, col], i) => {
      const x = 130 + i * 572;
      serif(c, String(n), x, 460, 114, col);
      text(c, s + ' tokens', x, 530, 43);
    });
    if (b === 2 || !after(k, 3, 'That puts')) {
      mono(c, 'INPUT LIMIT   16 TOKENS', 130, 725, 34);
      serif(c, 'Will all three parts fit?', 124, 880, 79);
      return;
    }
    let pos = 0;
    const x = 140,
      step = 1640 / 17;
    for (const [n, , col] of items)
      for (let j = 0; j < n; j++, pos++) rect(c, x + pos * step, 654, step - 5, 89, col, 4);
    line(c, x + m.limit * step - 3, 620, x + m.limit * step - 3, 783, ink, 5);
    text(c, 'Limit ' + m.limit, x + m.limit * step, 831, 35, ink, 'Sans', 'right');
    if (result)
      stamp(c, 140, 933, m.total + ' tokens  /  ' + (m.fits ? 'fits' : 'one over'), m.fits);
  } else if (b < 7) {
    heading(c, 'Source coordinates', 'What can the citation point to?');
    slip(c, 105, 271, 1705, 546);
    const labels = [
      'training-runbook-v1.pdf',
      '## Rollback failure',
      'Page on-call within 15 minutes',
      'with deploy ID. Include the',
      'service name and rollback attempt.',
    ];
    labels.forEach((s, i) => {
      const y = 357 + i * 93;
      if (i === 2) rect(c, 155, y - 58, 1140, 78, sea);
      (i < 2 ? mono : serif)(c, s, 174, y, i < 2 ? 37 : 54, i < 2 ? blue : ink);
    });
    mono(c, 'Body characters', 1390, 514, 27);
    balanced.forEach((r, i) => mono(c, '[' + r.start + ', ' + r.end + ')', 1390, 549 + i * 93, 30));
    text(
      c,
      b === 4
        ? 'Embed the source and heading with the child. Quote the original body.'
        : b === 5
          ? 'Offsets refer to v1 normalized characters. Keep the map to the raw page.'
          : '“##” opens a section. PDF citations need page coordinates.',
      110,
      933,
      43,
      ink,
      'Sans',
      'left',
      1700,
    );
  } else {
    heading(c, 'Oversized sections', 'Try a smaller separator');
    const rows = [
      ['Paragraph', '¶   ¶', 'Two line breaks'],
      ['Line', '↵', 'One line break'],
      ['Word', 'a   b', 'Space'],
      ['Character', 'a b', 'Last resort'],
    ];
    rows.forEach(([a, t, d], i) => {
      const x = 120 + 90 * i,
        y = 302 + 143 * i;
      slip(c, x, y, 1520 - i * 90, 110);
      mono(c, String(i + 1), x + 32, y + 67, 28, teal);
      serif(c, a, x + 132, y + 75, 52);
      text(c, t, x + 572, y + 71, 44, blue);
      text(c, d, x + 814, y + 70, 37);
    });
    text(
      c,
      'Measure tokens after splitting. Read the rule together with its exception.',
      120,
      986,
      39,
    );
  }
}

export function compare(c, k) {
  const b = k.beat.beatIndex;
  desk(c);
  heading(
    c,
    'Release question  /  single-hit limit of 10 words',
    'Who gets paged, when, and with which ID?',
  );
  choices.forEach((row, i) => {
    const y = 276 + i * 219;
    slip(c, 118, y, 1684, 186);
    mono(c, row.wordCount + ' WORDS', 156, y + 55, 25, muted);
    serif(c, row.text, 156, y + 126, 51, ink, 1410);
    const show =
      b >= 2 ||
      (b === 1 &&
        after(
          k,
          1,
          ['omits the deadline', 'adds an unrelated archive rule', 'meets the cutoff'][i],
        ));
    if (show) {
      rect(c, 1603, y, 199, 186, row.releasable ? sea : blush);
      text(
        c,
        row.releasable ? 'Keep' : row.withinCap ? 'Missing' : 'Over cap',
        1703,
        y + 104,
        34,
        row.releasable ? teal : rust,
        'Sans',
        'center',
      );
    }
  });
  if (b === 2) mono(c, 'Selected source    ' + locator, 128, 991, 34, teal);
}
