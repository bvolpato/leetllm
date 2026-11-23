import assert from 'node:assert/strict';
import { candidates, digest, whole, revisedContext, locator } from './evidence.mjs';
import {
  ink,
  muted,
  teal,
  sea,
  blue,
  pale,
  rust,
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
  desk,
  slip,
  heading,
  stamp,
  arrow,
  bracket,
  progress,
  after,
} from './press.mjs';

const study = { chunk: [50, 500], context: [500, 10000], comparison: 5000 };
function ruler(c, x, y, w, [lo, hi], color, mark = false) {
  const pos = (n) => x + ((n - lo) * w) / (hi - lo);
  rect(c, x, y, w, 51, color, 4);
  for (let i = 0; i <= 20; i++)
    line(c, x + (i * w) / 20, y + 50, x + (i * w) / 20, y + (i % 5 === 0 ? 20 : 33), paper, 3);
  text(c, lo.toLocaleString('en-US'), x, y + 104, 39, ink, 'Mono');
  text(c, hi.toLocaleString('en-US'), x + w, y + 104, 39, ink, 'Mono', 'right');
  if (mark) {
    const at = pos(study.comparison);
    poly(
      c,
      [
        [at - 13, y - 17],
        [at + 13, y - 17],
        [at, y - 1],
      ],
      rust,
    );
    line(c, at, y + 1, at, y + 62, rust, 5);
    text(c, '≈ 5,000', at, y - 32, 42, rust, 'Mono', 'center');
  }
}
export function evaluation(c, k) {
  const b = k.beat.beatIndex;
  desk(c);
  if (b < 2) {
    heading(
      c,
      'Natural Questions  /  Wikipedia  /  Bennani & Moslonka',
      'Two different token budgets',
    );
    mono(c, 'INDIVIDUAL CHUNK', 133, 339, 30, blue);
    ruler(c, 133, 385, 1649, study.chunk, blue);
    mono(c, 'TOTAL RETRIEVED CONTEXT', 133, 666, 30, teal);
    ruler(c, 133, 715, 1649, study.context, teal, b === 1);
    text(
      c,
      b === 0
        ? 'SPLADE ranks the hits. Ministral-8B reads the ones that fit.'
        : 'Sentence and semantic splits were comparable up to about 5,000 context tokens here.',
      132,
      962,
      41,
      ink,
      'Sans',
      'left',
      1650,
    );
    return;
  }
  heading(c, 'Scoring a response', 'What does the score measure?');
  slip(c, 116, 294, 1686, 260);
  mono(c, 'REFERENCE ANSWER', 157, 365, 28);
  serif(c, 'Maya', 153, 482, 91);
  line(c, 900, 342, 900, 504, '#bdc1ae', 3);
  mono(c, 'MODEL RESPONSE', 975, 365, 28);
  serif(c, 'MAYA.', 973, 482, 91);
  const normalized = (s) => s.toLowerCase().replace(/[.]/g, '');
  if (b === 2) {
    mono(c, 'CASE AND PUNCTUATION NORMALIZED', 124, 695, 30, teal);
    serif(c, normalized('Maya') + '   =   ' + normalized('MAYA.'), 118, 848, 107, teal);
    text(c, 'Exact match', 123, 951, 46);
  } else {
    const rows = [
      ['Exact match', 'Same normalized text'],
      ['Semantic similarity', 'Requires a scoring model'],
      ['Abstention', 'Did the system answer?'],
    ];
    rows.forEach(([q, a], i) => {
      const y = 659 + i * 115;
      serif(c, q, 131, y, 50);
      text(c, a, 851, y, 43, teal);
      line(c, 130, y + 28, 1750, y + 28, '#9baea2', 2);
    });
    mono(
      c,
      'Check citations and uncertainty across questions in the target corpus.',
      130,
      1001,
      29,
    );
  }
}

export function manifest(c, k) {
  const b = k.beat.beatIndex;
  desk(c);
  if (b < 2) {
    heading(c, 'Index manifest   /   incident runbook', 'Which passage did review admit?');
    const items = [
      { s: whole, decision: 'Ready', yes: true },
      { s: candidates[1].text.split(' Routine')[0], decision: 'Review', yes: false },
    ];
    items.forEach((r, i) => {
      const x = 110 + 872 * i;
      slip(c, x, 305, 828, 515);
      mono(
        c,
        'v3   /   p. 7   /   ' + (i ? 'deadline fragment' : 'rollback section'),
        x + 38,
        376,
        25,
      );
      line(c, x + 39, 414, x + 786, 414, muted, 2);
      const lines = i ? [r.s] : [r.s.split(' within')[0], 'within ' + r.s.split(' within ')[1]];
      lines.forEach((s, j) => serif(c, s, x + 39, 507 + j * 71, 49, ink, 746));
      if (b === 1 || after(k, 0, 'Look at the review decision'))
        stamp(c, x + 44, 732, r.decision, r.yes);
      if (b === 1 || after(k, 0, 'The manifest admits'))
        mono(c, r.yes ? 'Added to index' : 'Held for review', x + 43, 792, 26, r.yes ? teal : rust);
    });
    text(c, 'A prior evidence review supplies each decision in the manifest.', 117, 959, 45);
    return;
  }
  if (b < 4) {
    heading(c, 'Chunk bytes   /   SHA-256', 'Will an equal-length edit change the hash?');
    const edited = b === 3 || after(k, 2, 'Hash the entire edited chunk');
    const rows = [
      [digest.original, digest.originalHash],
      ...(edited ? [[digest.edited, digest.editedHash]] : []),
    ];
    rows.forEach(([s, hash], i) => {
      const y = 309 + i * 293;
      slip(c, 113, y, 1692, 229);
      serif(c, s, 152, y + 86, 56, ink, 1600);
      const source = i ? 'Edited test copy' : 'Version 3';
      mono(
        c,
        source + '   /   ' + Buffer.byteLength(s) + ' bytes   /   SHA-256',
        155,
        y + 151,
        24,
        muted,
      );
      mono(c, hash, 155, y + 197, 27, i ? rust : blue);
    });
    text(
      c,
      'Keep document checksum, immutable version, source span and splitter settings.',
      114,
      998,
      40,
    );
    return;
  }
  heading(c, 'Ingestion into the index', 'Which source can be returned?');
  const routes = [
    ['Heading and body', 'Fits complete encoder input', 'Index with source span', true],
    ['Oversized section', 'Split and retokenize', 'Check evidence', true],
    ['Quarantined source', 'Excluded from retrieval', 'Hold outside index', false],
  ];
  routes.slice(0, b === 4 ? 2 : 3).forEach(([subject, test, result, ok], i) => {
    const y = 322 + i * 190;
    slip(c, 115, y, 1690, 146);
    rect(c, 115, y, 16, 146, ok ? teal : rust);
    serif(c, subject, 159, y + 89, 49, ink, 537);
    text(c, test, 741, y + 88, 39, muted, 'Sans', 'left', 475);
    arrow(c, 1230, y + 72, 1313, y + 72, ok ? teal : rust, 5);
    text(c, result, 1343, y + 88, 38, ok ? teal : rust, 'Sans', 'left', 423);
  });
  text(
    c,
    b === 4
      ? 'Each table row group also carries its header and locator.'
      : 'Recheck current access when a child expands to a parent.',
    118,
    972,
    43,
  );
}

// Both strips use the source positions. Their glyphs coincide exactly when the copies meet.
const pageX = 138,
  pageWidth = 1644;
function strip(c, words, start, end, y, fill, col, opts = {}) {
  const step = pageWidth / words.length,
    x = pageX + start * step;
  rect(c, x, y, (end - start) * step - 2, 93, fill, 2);
  for (let i = start; i < end; i++) {
    if (i > start)
      line(c, pageX + i * step - 1, y + 10, pageX + i * step - 1, y + 82, col + '42', 2);
    text(c, words[i], pageX + (i + 0.5) * step, y + 60, 41, col, 'Serif', 'center', step - 12);
  }
  if (opts.outline) {
    c.strokeStyle = opts.outline;
    c.lineWidth = 4;
    c.strokeRect(x + 2, y + 2, (end - start) * step - 6, 89);
  }
}
function dimPlate(c, x, y, w, h) {
  rect(c, x + 8, y + 12, w, h, '#0a1725', 12);
  rect(c, x, y, w, h, '#385160', 12);
  for (const xx of [x + 21, x + w - 20])
    for (const yy of [y + 21, y + h - 20]) {
      disc(c, xx, yy, 7, '#94a4a2');
      line(c, xx - 3, yy + 3, xx + 3, yy - 3, ink, 2);
    }
}
export function finalState(k) {
  const b = k.beat.beatIndex;
  const resumeHits = b === 4 && !after(k, 4, 'Follow the first hit');
  if (b <= 2 || resumeHits) {
    const smaller = resumeHits || after(k, 2, 'Now lower the allowance');
    return {
      mode: 'hits',
      pack: revisedContext(smaller ? 12 : 18),
      smaller,
      state: smaller
        ? 'smaller'
        : b === 0
          ? 'rank'
          : after(k, 2, 'The page leaves')
            ? 'explain'
            : 'predict',
    };
  }
  if (b === 3) {
    return {
      mode: 'overlay',
      pack: revisedContext(18),
      align: progress(k, 3, 'Lay the two hits', 2.3),
    };
  }
  const shrink = progress(k, 5, 'Slide the stop back', 1.1);
  const grow = progress(k, 6, 'Add one word of capacity', 1.1);
  const last = b >= 5 && shrink > 0;
  const stop = 12 - shrink + grow;
  const cap = Math.floor(stop);
  const small = cap === 11;
  const pack = revisedContext(cap, { parent: true });
  const answered = last
    ? small
      ? after(k, 6, 'Abstain')
      : after(k, 6, 'Now answer')
    : after(k, 4, 'The condition is back');
  return {
    mode: 'parent',
    pack,
    cap,
    stop,
    moving: stop !== cap,
    ask: !answered,
    final: last,
  };
}
export function transfer(c, k) {
  const s = finalState(k),
    p = s.pack,
    words = p.words,
    step = pageWidth / words.length;
  desk(c, true);
  heading(
    c,
    'Practice  /  incident runbook v5  /  p. 7',
    s.mode === 'overlay'
      ? 'Which source words did both hits charge?'
      : s.mode === 'parent'
        ? 'Can the whole parent pass the stop?'
        : 'What can the engineer cite?',
    true,
  );
  if (s.mode === 'hits') {
    const sourceY = 333;
    mono(
      c,
      'SOURCE ORDER    /    ' + p.budget + '-WORD REQUEST',
      pageX,
      sourceY - 20,
      27,
      '#b8d4cc',
    );
    strip(c, words, 0, words.length, sourceY, paper, ink);
    const ordered = s.state === 'rank' || s.smaller ? p.ranked : p.returned;
    ordered.forEach((h, j) => {
      const i = p.ranked.indexOf(h);
      const y = 515 + j * 168,
        skipped = s.smaller && !p.selected.includes(h);
      mono(
        c,
        'Rank ' + (i + 1) + '    ' + h.length + ' words' + (skipped ? '   ·   skipped' : ''),
        pageX + h.start * step,
        y - 20,
        26,
        skipped ? '#ffb69c' : '#b9dcd4',
      );
      strip(c, words, h.start, h.end, y, skipped ? '#a3a9a4' : i ? pale : sea, ink);
    });
    const line1 = s.smaller
      ? p.used +
        ' of ' +
        p.budget +
        ' words used. ' +
        (p.budget - p.used) +
        ' remain for a ' +
        p.ranked[1].length +
        '-word hit.'
      : s.state === 'predict'
        ? 'When do you page? Which details belong in the page?'
        : s.state === 'explain'
          ? 'After a rollback failure, page on-call within 20 minutes. Include the deploy ID and identify the service.'
          : p.budget + ' words available for evidence';
    text(c, line1, pageX, 965, 43, white, 'Sans', 'left', 1660);
    return;
  }
  if (s.mode === 'overlay') {
    const targetY = 581;
    mono(
      c,
      'REPLAY    /    ' + p.budget + '-WORD REQUEST    /    BOTH HITS ADMITTED',
      pageX,
      397,
      28,
      '#c6dbd4',
    );
    slip(c, pageX - 23, 420, pageWidth + 46, 345);
    strip(c, words, 0, words.length, targetY, paper, ink);
    p.selected.forEach((h, i) => {
      const y = targetY + (i ? 154 : -141) * (1 - s.align);
      if (s.align < 1)
        strip(c, words, h.start, h.end, y, i ? pale : sea, ink, { outline: i ? blue : teal });
      else {
        // One row of original glyphs remains. Stacked ink bands record the two source masks.
        rect(
          c,
          pageX + h.start * step,
          targetY + (i ? 79 : 3),
          h.length * step - 2,
          12,
          i ? blue : teal,
        );
      }
    });
    if (s.align === 1) {
      const a = Math.max(...p.selected.map((h) => h.start)),
        z = Math.min(...p.selected.map((h) => h.end));
      rect(c, pageX + a * step, targetY + 17, (z - a) * step - 2, 60, '#f8d489');
      strip(c, words, a, z, targetY + 1, '#f8d489', ink);
      rect(c, pageX + a * step, targetY + 3, (z - a) * step - 2, 12, teal);
      rect(c, pageX + a * step, targetY + 79, (z - a) * step - 2, 12, blue);
      const counted = after(k, 3, 'That request paid');
      bracket(
        c,
        pageX + a * step,
        pageX + z * step,
        715,
        ink,
        counted ? p.repeated + ' shared words' : '',
      );
    }
    if (s.align === 1 && after(k, 3, 'It charged those six'))
      text(
        c,
        p.used + ' charged word occurrences   /   ' + (p.used - p.repeated) + ' distinct positions',
        pageX,
        951,
        46,
        white,
      );
    return;
  }
  const y = 499;
  dimPlate(c, 85, 306, 1750, 434);
  mono(c, 'WHOLE PERMITTED PARENT    /    ' + words.length + ' WORDS', pageX, 408, 30, '#d2e7d9');
  strip(c, words, 0, words.length, y, paper, ink);
  const stop = pageX + s.stop * step - 2;
  rect(c, stop - 6, y - 48, 12, 199, gold, 3);
  poly(
    c,
    [
      [stop - 20, y - 51],
      [stop + 20, y - 51],
      [stop, y - 31],
    ],
    gold,
  );
  if (!s.moving) text(c, s.cap + ' words of capacity', stop - 11, 683, 39, white, 'Mono', 'right');
  if (s.moving) return;
  if (s.ask)
    serif(c, s.final ? 'Answer or abstain?' : 'Does one whole section fit?', pageX, 915, 80, white);
  else if (p.complete) {
    serif(c, s.final ? 'Answer and cite' : 'One complete parent', pageX, 891, 84, '#b5e5cb');
    mono(
      c,
      'incident-runbook-v5.pdf   ·   page 7   ·   ' + p.used + ' words supplied',
      pageX,
      973,
      34,
      '#d5e8df',
    );
  } else {
    serif(c, 'Abstain', pageX, 891, 84, '#ffc3a7');
    mono(
      c,
      '0 words supplied   /   the complete parent costs ' + words.length,
      pageX,
      973,
      34,
      '#ead6c5',
    );
  }
}
export function checkFinalStates() {
  const mock = (beatIndex, passed = []) => ({
    beat: { beatIndex },
    reveal: (q) => Number(passed.includes(q)),
  });
  const s = finalState(mock(5, ['Slide the stop back']));
  assert.equal(s.cap, 11);
  assert.ok(s.ask);
  assert.equal(s.pack.used, 0);
  assert.ok(finalState(mock(6)).ask);
  const denied = finalState(mock(6, ['Abstain']));
  assert.ok(!denied.ask && !denied.pack.complete);
  const grant = finalState(
    mock(6, ['Abstain', 'Add one word of capacity', 'Now answer']),
  );
  assert.ok(grant.pack.complete && !grant.ask);
  assert.equal(grant.cap, 12);
  assert.equal(grant.pack.used, 12);
  const charge = ({ pack }) => [pack.budget, pack.selected.length, pack.used, pack.repeated];
  const reduced = finalState(mock(2, ['Now lower the allowance']));
  const replay = finalState(mock(3));
  const resumed = finalState(mock(4));
  const expanded = finalState(mock(4, ['Follow the first hit', 'The condition is back']));
  assert.deepEqual(
    [reduced.mode, replay.mode, resumed.mode, expanded.mode],
    ['hits', 'overlay', 'hits', 'parent'],
  );
  assert.deepEqual(
    [charge(reduced), charge(replay), charge(resumed), charge(expanded)],
    [
      [12, 1, 9, 0],
      [18, 2, 18, 6],
      [12, 1, 9, 0],
      [12, 1, 12, 0],
    ],
  );
  assert.equal(expanded.pack.returned[0].text, expanded.pack.words.join(' '));
  assert.ok(
    study.chunk[1] < study.comparison &&
      study.context[0] < study.comparison &&
      study.comparison < study.context[1],
  );
}
