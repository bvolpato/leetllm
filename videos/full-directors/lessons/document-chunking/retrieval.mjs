import {
  locator,
  searchWords,
  searchResults,
  queries,
  pagingContext,
  lookup,
  originalParent,
  updatedParent,
  topics,
  vectors,
  boundary,
  late,
  wordRange,
} from './evidence.mjs';
import {
  ink,
  muted,
  teal,
  sea,
  blue,
  pale,
  rust,
  paper,
  night,
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
  wordCells,
  bracket,
  arrow,
  progress,
  after,
} from './press.mjs';

function afterSpoken(k, beat, phrase, captionStart = false) {
  if (k.beat.beatIndex !== beat) return k.beat.beatIndex > beat;
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart }) === 1;
}

function packHalves(c, k) {
  const b = k.beat.beatIndex;
  const original = pagingContext(10);
  const retry = pagingContext(9);
  const clamp = (value) => Math.max(0, Math.min(value, 1));
  const stopMove = b === 5 ? clamp((k.elapsed - k.wordCue('nine').end) / 0.7) : Number(b > 5);
  const replay = stopMove > 0;
  const pack = replay ? retry : original;
  const first = replay
    ? afterSpoken(k, 5, 'uses five spaces')
    : afterSpoken(k, 3, 'Put the deadline in first', 'Put the deadline in first');
  const both =
    !replay &&
    afterSpoken(k, 3, 'Add the five words from the start of the sentence', 'Add the five words');
  const placed = both ? pack.selected : pack.selected.slice(0, Number(first));
  const used = placed.reduce((total, hit) => total + hit.length, 0);
  const reorder = replay ? 0 : progress(k, 4, 'Put the selected hits in source order', 1.6);
  const asking = replay && after(k, 5, 'Can the second five-word hit fit');
  const counted = replay && afterSpoken(k, 6, 'Only four remain', 'Only four remain');
  const skipped =
    replay && afterSpoken(k, 6, 'The second hit stays out', 'The second hit stays out');
  const verdict = !pack.complete && afterSpoken(k, 6, 'Mark the evidence check as failed this time');
  const x = 124;
  const y = 572;
  const step = 166;
  const height = 98;
  const fills = [pale, sea];
  const stop = x + (original.budget + (retry.budget - original.budget) * stopMove) * step;

  heading(c, 'Runbook v3  /  page 7', 'Which words reach the model?');
  mono(c, 'SEARCH HITS', x, 288, 29);
  pack.ranked.forEach((hit, i) => {
    const left = x + i * (step * pack.ranked[0].length);
    const width = hit.length * step - 10;
    slip(c, left, 311, width, 139, fills[i]);
    mono(c, 'Rank ' + (i + 1) + '  ·  ' + hit.length + ' words', left + 27, 360, 34, ink);
    if (skipped && !pack.selected.includes(hit))
      text(c, 'Skipped', left + width - 27, 360, 39, rust, 'Sans', 'right');
    serif(c, hit.text, left + 27, 415, 46, ink, width - 54);
  });

  let title = replay ? 'Replay in rank order' : 'Pack in rank order';
  if (reorder === 1 || skipped) title = 'Text sent to the model';
  else if (reorder > 0) title = 'Reordering to match the page';
  text(c, title, x, 528, 39, ink);
  const movingStop = stopMove > 0 && stopMove < 1;
  if (!movingStop)
    text(c, 'Limit ' + pack.budget, stop - 14, 528, 35, ink, 'Mono', 'right');
  for (let i = 0; i < original.budget; i++) {
    const outside = stopMove === 1 && i >= pack.budget;
    rect(c, x + i * step, y, step - 3, height, outside ? '#c2b596' : paper, 2);
  }
  line(c, stop - 2, y - 17, stop - 2, y + height + 17, ink, 7);

  let rankOffset = 0;
  placed.forEach((hit, i) => {
    const sourceOffset = pack.returned
      .slice(0, pack.returned.indexOf(hit))
      .reduce((total, preceding) => total + preceding.length, 0);
    // Lower the first hit so the second can slide past it without crossing the text.
    const across = i === 0 ? clamp(reorder * 4 - 2) : clamp(reorder * 4 - 1);
    const down = i === 0 ? Math.min(clamp(reorder * 4), clamp(4 - reorder * 4)) : 0;
    const left = x + step * (rankOffset + (sourceOffset - rankOffset) * across);
    wordCells(c, hit.text.split(' '), left, y + down * 125, hit.length * step, {
      fill: fills[i],
      height,
      size: 43,
    });
    rankOffset += hit.length;
  });
  if (counted) {
    const firstEmpty = x + used * step;
    bracket(c, firstEmpty, stop - 2, y + height + 44, ink, '');
    text(
      c,
      pack.budget - used + ' spaces left',
      (firstEmpty + stop) / 2,
      y + height + 97,
      43,
      ink,
      'Sans',
      'center',
    );
  }
  if (verdict) {
    text(c, 'Right page. The rollback condition is missing.', x, 914, 48, rust);
  } else if (asking && !counted) {
    text(c, 'Can Rank 2 fit?', x, 914, 48, ink);
  } else if (!replay && used > 0) {
    text(c, used + ' of ' + pack.budget + ' words packed', x, 914, 48, ink);
  }
}
export function retrieval(c, k) {
  desk(c);
  const b = k.beat.beatIndex;
  if (b < 2) {
    heading(c, 'Lexical retrieval  /  distinct terms', 'What matches the query?');
    serif(c, searchWords, 122, 345, 69, teal);
    searchResults.forEach((r, i) => {
      const y = 413 + i * 137;
      slip(c, 124, y, 1660, 111);
      serif(c, r.text, 155, y + 73, 45, ink, 1430);
      const show = i === 0 ? after(k, 0, 'all four words') : b >= 1;
      if (show) text(c, r.hits.length + ' / 4', 1721, y + 73, 39, blue, 'Mono', 'right');
    });
    return;
  }
  if (b === 2) {
    heading(c, 'Labeled questions', 'A hit has two checks to pass');
    const pos = [127, 847, 1213];
    ['Query words', 'Winning record', 'Required text'].forEach((s, i) =>
      mono(c, s.toUpperCase(), pos[i], 351, 28),
    );
    queries.forEach((r, i) => {
      const y = 420 + i * 173;
      line(c, 124, y - 26, 1780, y - 26, muted, 2);
      text(c, r.query, pos[0], y + 61, 43, ink, 'Serif', 'left', 665);
      text(c, r.name, pos[1], y + 61, 43, r.sourceOK ? teal : rust);
      text(c, r.required, pos[2], y + 61, 43, r.textOK ? teal : rust);
    });
    text(
      c,
      'Test exceptions, split tables, and questions the runbook cannot answer.',
      125,
      993,
      39,
    );
    return;
  }
  if (b <= 6) {
    packHalves(c, k);
    return;
  }
  heading(c, 'Generator tokenizer  /  equal allowance', 'Compare at 120 tokens of evidence');
  const small = b === 8 && after(k, 8, 'four of the shorter hits') ? 4 : 2;
  [
    [60, 2],
    [30, small],
  ].forEach(([size, count], i) => {
    const x = 145,
      y = 393 + i * 327,
      w = 1614;
    mono(c, 'Passages of ' + size + ' tokens', x, y - 37, 33);
    rect(c, x, y, w, 132, '#c4c7b6', 5);
    for (let j = 0; j < count; j++) {
      const span = (w * size) / 120;
      rect(c, x + j * span, y, span - 5, 132, i ? teal : blue, 4);
      text(
        c,
        size + ' tokens',
        x + (j + 0.5) * span,
        y + 82,
        38,
        white,
        'Sans',
        'center',
        span - 25,
      );
    }
    text(c, count * size + ' / 120', x + w, y + 195, 41, ink, 'Mono', 'right');
  });
}

function ticket(c, x, y, label, passage, link) {
  slip(c, x, y, 626, 180);
  for (const edge of [x, x + 626]) disc(c, edge, y + 91, 13, night);
  mono(c, label, x + 34, y + 54, 25);
  serif(c, passage, x + 31, y + 111, 46, ink, 559);
  mono(c, 'Parent ' + link.id + '   ·   v' + link.version, x + 34, y + 155, 27, teal);
}
function folder(c, x, y, w, h, open) {
  poly(
    c,
    [
      [x, y + 42],
      [x, y],
      [x + w * 0.39, y],
      [x + w * 0.44, y + 42],
      [x + w, y + 42],
      [x + w, y + h],
      [x, y + h],
    ],
    '#c18e4e',
  );
  if (open) {
    slip(c, x + 24, y + 64, w - 48, h - 100);
    rect(c, x + 5, y + h - 35, w - 10, 35, '#c89955', 5);
  } else {
    rect(c, x + 5, y + 50, w - 10, h - 50, '#e0b570', 4);
    for (let j = 0; j < 3; j++)
      line(c, x + 45, y + h - 65 - j * 15, x + w - 50, y + h - 65 - j * 15, '#bb945b', 2);
  }
}
export function expand(c, k) {
  const b = k.beat.beatIndex;
  desk(c, true);
  heading(c, 'Parent lookup   /   runbook v3', 'What comes back with a child hit?', true);
  ticket(c, 112, 335, 'CHILD MATCH', 'within 15 minutes', originalParent);
  if (b === 2) ticket(c, 112, 593, 'SECOND MATCH', 'with deploy ID', originalParent);
  const open = after(k, 1, 'The pointer resolves');
  [429, ...(b === 2 ? [682] : [])].forEach((y) => {
    line(c, 748, y, 846, y, '#93b3b1', 4);
    line(c, 846, y, 846, 512, '#93b3b1', 4);
  });
  arrow(c, 846, 512, 976, 512, '#93b3b1', 5);
  folder(c, 1003, 289, 779, 516, open);
  mono(c, originalParent.id + ' · v' + originalParent.version, 1032, 322, 27, ink, 261);
  if (open) {
    mono(c, 'PERMITTED SECTION', 1051, 434, 29, teal);
    const words = originalParent.text.split(' ');
    [wordRange(words, 0, 2), wordRange(words, 2, 5), wordRange(words, 5, 10)].forEach((s, i) =>
      serif(c, s, 1051, 522 + 74 * i, 55, ink, 676),
    );
    mono(c, locator, 1053, 743, 23);
  } else serif(c, 'Parent section', 1081, 568, 68);
  if (b === 2) text(c, '2 matching children   →   1 copy of the section', 102, 957, 48, white);
}
export function checked(c, k) {
  const b = k.beat.beatIndex;
  let opts = {};
  if (b === 1) {
    if (after(k, 1, 'Restore access and lower')) opts = { budget: 10 };
    else if (after(k, 1, 'Try the denied caller')) opts = { allowed: false };
    else if (after(k, 1, 'Point the deadline ticket')) {
      opts = { versions: [originalParent.version, updatedParent.version] };
    }
  }
  if (b === 2) opts = { budget: 10 };
  const p = lookup(opts);
  desk(c, true);
  heading(
    c,
    'Parent lookup  /  runbook v' + updatedParent.version,
    'Can these links deliver the rule?',
    true,
  );
  const childWords = updatedParent.text.split(' ');
  ticket(c, 112, 309, 'FIRST HIT', wordRange(childWords, 5, 10), p.hits[0]);
  ticket(c, 112, 586, 'SECOND HIT', wordRange(childWords, 10, 14), p.hits[1]);
  [397, 670].forEach((y) => {
    line(c, 750, y, 814, y, '#a0b8b3', 4);
    line(c, 814, y, 814, 531, '#a0b8b3', 4);
  });
  arrow(c, 814, 531, 909, 531, '#a0b8b3', 5);
  folder(c, 935, 291, 877, 534, p.copies === 1);
  mono(c, updatedParent.id + '  ·  v' + updatedParent.version, 975, 331, 27, ink);
  mono(
    c,
    'Access: ' + (p.allowed ? 'permitted' : 'denied') + '    Allowance: ' + p.budget + ' words',
    988,
    427,
    27,
    ink,
    765,
  );
  if (p.copies) {
    const words = p.returned.split(' ');
    [wordRange(words, 0, 5), wordRange(words, 5, 10), wordRange(words, 10, 14)].forEach((s, i) =>
      serif(c, s, 982, 523 + 74 * i, 51, ink, 762),
    );
    stamp(c, 982, 765, '1 copy  ·  ' + p.words + ' words');
  } else {
    stamp(c, 988, 573, p.decision, false);
    text(
      c,
      p.decision === 'Over budget' ? p.words + ' words required' : '0 parents supplied',
      986,
      674,
      42,
      ink,
    );
  }
  mono(c, 'Two child links    /    one distinct parent ID', 115, 955, 35, '#c6ded4');
}

const vectorColors = ['#e9bc65', '#8ed4c0', '#a7c9ff', '#f5c5a7'];
function axes(c) {
  const x = 1134,
    y = 783,
    unit = 120;
  for (let i = 1; i <= 3; i++) {
    line(c, x + i * unit, y, x + i * unit, y - 3.5 * unit, '#314c56', 2);
    line(c, x, y - i * unit, x + 3.7 * unit, y - i * unit, '#314c56', 2);
  }
  arrow(c, x - 30, y, x + unit * 4.0, y, '#8aa4a4', 3);
  arrow(c, x, y + 29, x, y - unit * 3.85, '#8aa4a4', 3);
  mono(c, 'Rollback terms', x + 126, y + 77, 29, '#d5e6df');
  mono(c, 'Handoff terms', x - 20, y - unit * 3.9 - 12, 29, '#d5e6df');
  return { x, y, unit };
}
export function semantic(c, k) {
  const b = k.beat.beatIndex;
  desk(c, true);
  heading(
    c,
    'Semantic boundary   /   two illustrative term lists',
    'Where does the paragraph turn?',
    true,
  );
  const zero = b === 5;
  let shown = b === 0 ? 1 : b === 1 && !after(k, 1, 'The third hits') ? 2 : 3;
  if (zero) shown = 4;
  const secondPair = b === 3 || (b === 4 && after(k, 4, 'Zero puts'));
  const current = zero ? [2, 3] : b < 2 ? [shown - 1] : secondPair ? [1, 2] : [0, 1];
  const gap = (b === 4 && secondPair) || zero;
  topics.slice(0, shown).forEach((s, i) => {
    const yy = 323 + i * 130;
    mono(c, 'S' + (i + 1), 105, yy, 28, vectorColors[i]);
    text(c, s, 192, yy, 38, white, 'Serif', 'left', 793);
    mono(c, '[' + vectors[i].join(', ') + ']', 193, yy + 43, 29, vectorColors[i]);
    if (i === 2 && gap) line(c, 113, yy - 63, 974, yy - 63, vectorColors[i], 5);
  });
  const a = axes(c);
  current.forEach((i) => {
    const [vx, vy] = vectors[i];
    if (vx || vy)
      arrow(c, a.x, a.y, a.x + vx * a.unit, a.y - vy * a.unit, vectorColors[i], i === 0 ? 16 : 9);
    else {
      disc(c, a.x, a.y, 18, vectorColors[3]);
      disc(c, a.x, a.y, 10, night);
    }
    mono(
      c,
      'S' + (i + 1),
      a.x + vx * a.unit + (vx ? 0 : 25),
      a.y - vy * a.unit + (vx ? -32 : i === 3 ? 42 : 2),
      25,
      vectorColors[i],
    );
  });
  if (b === 0 || b === 1) {
    mono(c, 'Rollback   rollback · deploy · minutes · id', 108, 888, 32, vectorColors[0]);
    mono(c, 'Handoff    commander · handoff · channel', 108, 960, 32, vectorColors[2]);
    return;
  }
  const result = boundary(vectors[current[0]], vectors[current[1]], 0.5);
  const pair = current.map((i) => 'S' + (i + 1)).join(' · ');
  const quotient = result.dot + ' ÷ (' + result.lengths.join(' × ') + ')';
  let reading;
  if (b === 2 || b === 3) {
    reading =
      k.elapsed >= k.speechDuration
        ? 'cosine = ' + quotient + ' = ' + result.value
        : 'cosine = dot product ÷ product of lengths';
  } else if (zero) {
    reading = after(k, 5, 'Send this boundary')
      ? quotient + ' → undefined   /   ' + result.action
      : quotient;
  } else {
    reading = result.value + (result.value < 0.5 ? ' < ' : ' ≥ ') + '0.5   /   ' + result.action;
  }
  text(c, pair + '      ' + reading, 109, 953, 46, vectorColors[current[1]]);
}

function ownerPaper(c, publicOnly = false) {
  slip(c, 110, 291, 1690, 238);
  if (!publicOnly) {
    mono(c, 'EARLIER IN THE SOURCE', 150, 344, 25);
    serif(c, 'Owner is Maya.', 150, 451, 65);
  } else {
    rect(c, 111, 292, 657, 235, '#798c8d');
    mono(c, 'RESTRICTED SECTION', 156, 392, 26, white);
    text(c, 'Outside this pass', 153, 466, 42, white);
  }
  if (!publicOnly) serif(c, '…', 706, 451, 45, muted);
  line(c, 774, 329, 774, 491, '#a7afa2', 3);
  mono(c, 'SELECTED SPAN', 828, 344, 25, teal);
  serif(c, 'page the service owner', 826, 451, 70, ink, 917);
}
function stateBars(c, values, { showMean = false, pooled = 0 } = {}) {
  mono(c, 'ILLUSTRATIVE MAYA COORDINATE', 112, 584, 25, blue);
  const xs = [229, 524, 819, 1114];
  values.forEach((v, i) => {
    const x = xs[i],
      y = 851,
      token = late.tokens[late.selected[i]].text;
    const h = v * 215;
    rect(c, x - 79, y - h, 158, h, i < pooled ? teal : blue, 4);
    text(c, v.toFixed(2), x, y - h - 25, 36, ink, 'Mono', 'center');
    text(c, token, x, y + 61, 41, ink, 'Serif', 'center');
  });
  if (showMean) {
    arrow(c, 1247, 775, 1371, 775, teal, 7);
    serif(c, late.pooledFeature.toFixed(2), 1411, 807, 101, teal);
    mono(c, '4-state mean', 1417, 877, 29);
  }
}
export function lateOwner(c, k) {
  const b = k.beat.beatIndex;
  desk(c);
  heading(c, 'Late chunking  /  returned words and their vector', 'Who is the service owner?');
  ownerPaper(c);
  if (b === 0) {
    rect(c, 777, 566, 1023, 223, pale, 4);
    mono(c, 'ENCODE THIS SPAN ALONE', 830, 630, 29, blue);
    serif(c, 'page the service owner', 826, 734, 66, ink, 912);
    text(c, 'The name is outside the encoder input.', 116, 969, 43);
  } else {
    const pooled = b === 2 ? 4 : Math.floor(4 * progress(k, 1, 'Pool the vectors', 1.4));
    stateBars(c, late.poolValues, {
      showMean: b === 2 && after(k, 2, 'Look at the four returned'),
      pooled,
    });
    text(
      c,
      b === 2
        ? 'Returned evidence still needs the permitted sentence naming Maya.'
        : 'One pass sees the longer source before the child states are averaged.',
      111,
      994,
      38,
      ink,
    );
  }
}
export function scope(c, k) {
  const b = k.beat.beatIndex;
  desk(c);
  heading(
    c,
    'Encoder inputs  /  context scope',
    b >= 3 ? 'Which words shaped the public vector?' : 'Which states enter the average?',
  );
  if (b === 2) {
    const rows = [
      ['Late chunking', 'Shared token states', '1 pooled vector per child'],
      ['Late interaction', 'Token-level scoring', 'Multiple vectors per passage'],
    ];
    rows.forEach(([s, a, z], i) => {
      const y = 312 + i * 268;
      slip(c, 113, y, 1692, 221);
      mono(c, s.toUpperCase(), 156, y + 65, 32, teal);
      text(c, a, 154, y + 154, 54, ink, 'Serif');
      arrow(c, 752, y + 130, 922, y + 130, teal, 5);
      text(c, z, 967, y + 154, 51, ink, 'Serif', 'left', 779);
    });
    text(
      c,
      'Long sources can use overlapping encoder windows within the attention limit.',
      116,
      954,
      40,
    );
    return;
  }
  const separated = b >= 4 || (b === 3 && after(k, 3, 'Separate the encoder inputs'));
  ownerPaper(c, separated);
  if (b === 0) {
    const context = 'Owner is Maya. … page the service owner';
    mono(c, 'CONTENT TOKEN    /    CHARACTER OFFSETS INTO THIS STRING', 114, 635, 27, teal);
    const offset = context.indexOf('page');
    const selected = [...context.slice(offset).matchAll(/\S+/g)];
    selected.forEach((m, i) => {
      const x = 118 + i * 427;
      slip(c, x, 694, 388, 176);
      serif(c, m[0], x + 29, 773, 56);
      const start = offset + m.index;
      mono(c, '[' + start + ', ' + (start + m[0].length) + ')', x + 30, 837, 32, teal);
    });
    text(
      c,
      'Pool these four contextual states. Handle special tokens as the model requires.',
      113,
      986,
      37,
    );
  } else if (b === 1) {
    mono(c, 'INDEPENDENT ENCODER PASSES', 114, 666, 28, blue);
    slip(c, 113, 721, 731, 137, pale);
    slip(c, 895, 721, 906, 137, sea);
    serif(c, 'Owner is Maya.', 146, 814, 57);
    serif(c, 'page the service owner', 930, 814, 57);
    text(
      c,
      'Averaging after two separate passes cannot give the child a shared encoding.',
      113,
      986,
      38,
    );
  } else {
    const x = separated ? 828 : 155,
      w = separated ? 924 : 1597;
    bracket(
      c,
      x,
      x + w,
      590,
      separated ? teal : rust,
      separated ? 'Public encoder input' : 'One encoder pass crosses both scopes',
    );
    slip(c, 265, 714, 1380, 196);
    mono(
      c,
      separated ? 'RE-ENCODED PUBLIC CHILD' : 'RETURNED PUBLIC CHILD',
      308,
      775,
      30,
      separated ? teal : rust,
    );
    serif(c, 'page the service owner', 309, 869, 68);
    text(
      c,
      separated
        ? 'Only public words can shape this pass. The owner remains unnamed.'
        : 'A text filter cannot undo the restricted context already used by the encoder.',
      112,
      999,
      38,
    );
  }
}
