import {
  paper,
  white,
  ink,
  teal,
  red,
  gold,
  muted,
  line,
  mint,
  peach,
  blue,
  ochre,
  pale,
  rect,
  rule,
  dot,
  label,
  mono,
  big,
  heading,
  tape,
  arrow,
  cells,
  textRows,
  tag,
  meter,
  percent,
  total,
} from './art.mjs';
import {
  docs,
  words,
  ngrams,
  overlap,
  minima,
  matchingBands,
  claimSets,
  candidate,
  corpus,
  documentSample,
  DOCUMENT_DRAWS,
  share,
  codeLines,
  nestedLines,
  digest,
  examples,
  matrixBytes,
  codeTokens,
  englishCompression,
  BPE_RULES,
  bpeReplay,
  trainingLines,
} from './data.mjs';
const sets = docs.map((t) => ngrams(t, 2)),
  pair = overlap(sets[0], sets[1]);
const bands = matchingBands(minima[0], minima[1]);
function passage(g, row, y, scan) {
  const tokens = words(docs[row]);
  const x0 = 108;
  let next = x0;
  const runs = tokens.map((word) => {
    g.font = '400 28px "Lesson Sans"';
    const w = g.measureText(word).width;
    const x = next;
    next += w + 17;
    return { word, w, x };
  });
  tape(g, 55, y, 1090, 82, row ? blue : mint);
  mono(g, row ? 'B' : 'A', 73, y + 51, 24, teal);
  if (scan !== null) {
    const left = Math.floor(scan),
      frac = Math.min(1, Math.max(0, (scan - left - 0.58) / 0.42));
    const lx = runs[left].x + (runs[Math.min(7, left + 1)].x - runs[left].x) * frac;
    const end = (j) => runs[j + 1].x + runs[j + 1].w;
    const rx = end(left) + (end(Math.min(7, left + 1)) - end(left)) * frac;
    rect(g, lx - 5, y + 21, rx - lx + 10, 41, ink);
    runs.forEach(({ word, x }) => label(g, word, x, y + 51, 28));
    g.save();
    g.beginPath();
    g.rect(lx - 5, y + 21, rx - lx + 10, 41);
    g.clip();
    runs.forEach(({ word, x }) => label(g, word, x, y + 51, 28, white));
    g.restore();
  } else runs.forEach(({ word, x }) => label(g, word, x, y + 51, 28));
}
function bigrams(g, s) {
  if (s.beat <= 2 || (s.beat === 3 && !s.at(3, 'At scale we first'))) {
    heading(
      g,
      s.beat === 1 ? 'Exact hash  /  byte comparison' : 'Word bigrams  /  source comparison',
      s.beat === 1 ? 'Can an exact hash find this edit?' : 'Which adjacent pairs survive the edit?',
    );
    const scan = s.beat >= 2 ? 7 * s.at(2, 'Slide the window', 4.6) : null;
    passage(g, 0, 180, scan);
    passage(g, 1, 276, scan);
    if (s.beat === 1) {
      const normalized = docs.slice(0, 2).map((v) => words(v).join(' '));
      normalized.forEach((v, i) => {
        const y = 439 + i * 64;
        mono(g, 'SHA-256   ' + digest(v).slice(0, 18) + '…', 58, y, 26);
      });
      tag(g, 'Normalized bytes · digest prefixes shown', 58, 590);
      return;
    }
    const end = Math.floor(scan) + 1;
    for (let i = 0; i < end; i++) {
      const col = i % 4,
        row = Math.floor(i / 4),
        x = 57 + col * 274,
        y = 384 + row * 100;
      const a = sets[0][i],
        b = sets[1][i],
        same = a === b;
      rect(g, x, y, 259, 82, same ? white : ochre);
      mono(g, 'A  ' + a, x + 9, y + 30, 19, ink, 'left', 241);
      mono(g, 'B  ' + b, x + 9, y + 62, 19, same ? teal : red, 'left', 241);
    }
    if (s.beat === 3) mono(g, '6 shared / 10 distinct = 0.60', 58, 625, 32, teal);
    else if (s.at(2, 'Count the matching'))
      label(g, 'How many distinct pairs belong to both passages?', 58, 625, 30, teal, 'Serif');
    return;
  }
  heading(
    g,
    '32 minima  /  8 bands of 4',
    s.beat === 5
      ? 'Which document represents this component?'
      : 'Which four-row bands nominate the pair?',
  );
  if (s.beat === 5) {
    const kept = s.at(5, 'Keep A');
    const ns = [
      ['A', 'Policy · need'],
      ['B', 'Policy · require'],
      ['C', 'Audit logs'],
    ];
    ns.forEach(([id, caption], i) => {
      const x = 66 + i * 380;
      tape(g, x, 267, 311, 190, i === 1 ? pale : i === 2 ? blue : mint);
      big(g, id, x + 19, 347, 64);
      label(g, caption, x + 18, 399, 26);
      if (kept) tag(g, i === 1 ? 'Lineage → A' : 'Retained', x + 18, 443, i === 1 ? muted : teal);
    });
    rule(g, 378, 352, 445, 352, teal, 5);
    mono(g, '0.60 ≥ 0.50', 83, 558, 32);
    return;
  }
  const marked = s.at(4, 'They match all the way'),
    other = s.at(4, 'Band three also');
  const drawBands = s.at(3, 'Group four consecutive');
  for (let band = 0; band < 8; band++) {
    const x = 62 + band * 137,
      lit = (band === bands[0] && marked) || (band === bands[1] && other);
    rect(g, x, 219, 119, 116, lit ? mint : white);
    mono(g, String(band), x + 60, 256, 25, ink, 'center');
    for (let i = 0; i < 4; i++) {
      const eq = minima[0][4 * band + i][0] === minima[1][4 * band + i][0];
      dot(g, x + 20 + i * 26, 296, 8, drawBands ? (eq ? teal : red) : pale);
    }
  }
  if (drawBands)
    label(
      g,
      'Each dot compares one minimum: equal in green, different in red.',
      59,
      182,
      22,
      muted,
    );
  if (s.at(3, 'hash every bigram')) {
    tag(g, 'Band 1    /    salt', 60, 392);
    tag(g, 'Minimum hash in A', 352, 392);
    tag(g, 'Minimum hash in B', 750, 392);
    for (let i = 4; i < 8; i++) {
      const y = 430 + (i - 4) * 37;
      mono(g, String(i), 62, y, 23);
      mono(g, minima[0][i][0], 351, y, 23);
      mono(g, minima[1][i][0], 751, y, 23, marked ? teal : ink);
    }
  }
  const edge = s.at(4, 'Now draw the edge');
  mono(
    g,
    pair.shared.length + ' / ' + pair.union.length + ' = ' + pair.ratio.toFixed(2),
    60,
    621,
    32,
    teal,
  );
  if (edge) {
    rule(g, 645, 609, 855, 609, teal, 4);
    dot(g, 641, 609, 8, teal);
    dot(g, 856, 609, 8, teal);
    mono(g, 'A', 607, 619, 28);
    mono(g, 'B', 874, 619, 28);
    tag(g, '≥ 0.50', 975, 619);
  }
}
function chain(g, s) {
  if (s.beat <= 2) {
    heading(g, 'Ideal independent MinHash rows', 'What is the chance of at least one band match?');
    for (let i = 0; i < 8; i++) {
      const x = 63 + (i % 4) * 110,
        y = 254 + Math.floor(i / 4) * 95;
      rect(g, x, y, 96, 67, white);
      for (let j = 0; j < 4; j++) dot(g, x + 16 + j * 21, y + 33, 6, teal);
    }
    tag(g, '8 bands · 4 rows per band', 60, 215);
    mono(g, '1 − (1 − s⁴)⁸', 60, 508, 37);
    label(g, 's = exact shingle similarity', 60, 567, 23);
    const X = (v) => 592 + v * 526,
      Y = (v) => 520 - v * 286;
    rule(g, X(0), Y(0), X(1), Y(0));
    rule(g, X(0), Y(0), X(0), Y(1));
    const stop = s.beat === 1 ? 0 : Math.min(1, 0.25 + 0.75 * s.at(2, 'Follow the curve', 4));
    for (let i = 1; i <= Math.floor(100 * stop); i++)
      rule(
        g,
        X((i - 1) / 100),
        Y(candidate((i - 1) / 100, 4, 8)),
        X(i / 100),
        Y(candidate(i / 100, 4, 8)),
        teal,
        4,
      );
    for (const v of [0.25, 0.5, 0.75]) {
      mono(g, v.toFixed(2), X(v), 556, 18, ink, 'center');
      if (v <= stop) {
        dot(g, X(v), Y(candidate(v, 4, 8)), 7, gold);
        mono(
          g,
          (100 * candidate(v, 4, 8)).toFixed(1) + '%',
          X(v),
          Y(candidate(v, 4, 8)) - 16,
          21,
          teal,
          'center',
        );
      }
    }
    tag(g, 'Candidate probability', 591, 202);
    return;
  }
  heading(g, 'Verified edges  /  Jaccard ≥ 0.60', 'Which shingles stay with the representative?');
  const retained = s.at(5, 'Keep A and remove');
  claimSets.forEach((set, i) => {
    const x = 58 + i * 382;
    tape(g, x, 250, 319, 170, retained && i > 0 ? pale : [mint, ochre, blue][i]);
    big(g, 'ABC'[i], x + 18, 312, 49);
    for (let j = 1; j <= 6; j++) {
      rect(g, x + 18 + (j - 1) * 47, 339, 40, 41, set.includes(j) ? white : pale);
      if (set.includes(j)) mono(g, j, x + 38 + (j - 1) * 47, 369, 23, ink, 'center');
    }
    if (retained) tag(g, i === 0 ? 'Retained' : 'Removed', x + 16, 409, i === 0 ? teal : red);
    if (i !== 2 && s.at(3, 'Both neighboring pairs pass'))
      rule(g, x + 321, 311, x + 382, 311, teal, 5);
  });
  if (s.at(3, 'A shares four')) mono(g, 'A:B  4/6', 62, 208, 25);
  if (s.at(3, 'So does C')) mono(g, 'B:C  4/6', 464, 208, 25);
  if (s.at(4, 'A and C share')) mono(g, 'A:C  2/6', 845, 208, 25, red);
  if (retained) {
    big(g, 'Lost from the group', 60, 528, 39);
    cells(g, [5, 6], 494, 471, 159, 79, { colors: [peach, peach] });
  }
  if (s.beat === 6)
    label(g, 'k records in a bucket can require k(k − 1)/2 comparisons.', 60, 609, 25);
  if (s.beat >= 7)
    label(g, 'FineWeb  /  five-word shingles · 14 bands × 8 rows · direct band links', 60, 609, 24);
}
function inventory(g, s) {
  const filtered = s.at(1, 'Remove D'),
    dedup = s.at(3, 'Drop the mirror');
  const kept = corpus.filter((r) => (!filtered || r.id !== 'D') && (!dedup || r.id !== 'B'));
  heading(g, 'Frozen tokenizer  /  yield', 'How much of the surviving feed is a mirror?');
  let x = 62;
  for (const r of kept) {
    const w = r.tokens * 1.075;
    tape(g, x, 254, w - 3, 156, r.id === 'C' ? mint : r.id === 'B' ? ochre : white);
    big(g, r.id, x + 14, 329, 47);
    mono(g, r.tokens, x + 14, 372, 25);
    x += w;
  }
  big(g, total(kept) + ' tokens', 60, 494, 51);
  mono(g, kept.length + ' records', 501, 494, 31);
  if (s.beat >= 2 && !s.at(3, 'B occupies'))
    label(g, 'What fraction of these tokens belong to B?', 61, 574, 28, teal);
  if (s.at(3, 'B occupies'))
    label(g, 'Mirror B    240 / 800 = 30% of the filtered tokens', 61, 569, 27, teal);
  if (dedup) tag(g, 'B → A  /  saved mirror lineage', 800, 486);
  if (s.at(5, 'short one hundred forty'))
    tag(
      g,
      '700 presentations − ' +
        total(kept) +
        ' distinct tokens = ' +
        (700 - total(kept)) +
        ' still to supply',
      61,
      631,
      red,
    );
}
export function drawPolicy(s) {
  const equal = Boolean(s.at(5, 'cut both sources')),
    half = Boolean(s.at(6, 'Set the probability'));
  const p = half ? 0.5 : s.at(3, 'raise the chance') ? 0.9 : 0.5;
  return { p, equal, sample: documentSample(p, equal ? [100, 100] : [100, 900]) };
}
function draws(g, s) {
  const { p, equal, sample } = drawPolicy(s);
  heading(
    g,
    'Sampler  /  ten fixed draw values',
    equal ? 'Each draw now takes a 100-token block' : 'Draw a whole record at each marked value',
  );
  const show = s.at(2, 'Values below one half');
  if (!show) {
    tape(g, 117, 268, 263, 108, mint);
    mono(g, 'Code   100', 134, 339, 28);
    tape(g, 501, 268, 573, 108, blue);
    mono(g, 'Prose  900 tokens', 525, 339, 28);
  }
  tag(g, 'Code if draw < ' + p.toFixed(2), 60, 206);
  tag(g, 'One tile = 100 consumed tokens', 690, 206);
  for (let i = 0; i < 10; i++) {
    const x = 65 + 108 * i,
      c = sample.categories[i],
      n = equal || c === 0 ? 1 : 9;
    if (show) {
      for (let j = 0; j < n; j++) rect(g, x, 481 - j * 28, 78, 25, c === 0 ? teal : '#487b99');
    }
    rule(g, x - 3, 511, x + 80, 511, line);
    mono(g, DOCUMENT_DRAWS[i].uniform.toFixed(2), x + 39, 544, 23, ink, 'center');
  }
  if (show) {
    mono(g, 'Code  ' + sample.tokens[0], 61, 238, 30, teal);
    mono(g, 'Prose  ' + sample.tokens[1], 480, 238, 30);
    tag(
      g,
      percent(sample.tokens[0], sample.tokens[0] + sample.tokens[1]) + ' code tokens',
      915,
      235,
    );
  }
}
function exposure(g, s) {
  const mix = [0.5, 0.25, 0.17, 0.08];
  if (s.beat <= 4) {
    heading(
      g,
      'Whole documents  /  all tokens retained',
      'A draw probability changes the token mix',
    );
    const p = s.at(3, 'ninety percent') ? 0.9 : 0.8,
      ps = [p, 1 - p],
      lens = [100, 900],
      mass = ps.map((p, i) => Math.round(p * lens[i])),
      shares = share(ps, lens);
    ['Code', 'Prose'].forEach((v, i) => {
      const y = 270 + i * 130;
      big(g, v, 60, y, 38);
      mono(g, ps[i].toFixed(2) + ' × ' + lens[i] + ' = ' + mass[i], 286, y, 32);
      meter(g, 712, y - 23, 407, mass[i], 200, i ? gold : teal);
    });
    mono(
      g,
      'Code share = ' +
        mass[0] +
        ' / ' +
        (mass[0] + mass[1]) +
        ' = ' +
        (100 * shares[0]).toFixed(1) +
        '%',
      60,
      508,
      32,
      teal,
    );
    label(
      g,
      s.beat < 3
        ? 'Expected tokens per draw = source probability × retained mean length.'
        : s.beat === 3
          ? 'For a target mix, divide each desired share by its mean length. Normalize.'
          : 'After truncation and packing, measure consumed tokens and supervised targets.',
      60,
      599,
      23,
    );
    return;
  }
  if (s.beat === 5) {
    heading(g, 'Reported Llama 3 mixture', 'Where did the token presentations go?');
    ['General web', 'Math and reasoning', 'Code', 'Multilingual'].forEach((v, i) => {
      const y = 237 + 89 * i;
      tag(g, v, 59, y + 18);
      meter(g, 350, y, 654, mix[i], 0.5, [teal, gold, red, muted][i]);
      mono(g, Math.round(100 * mix[i]) + '%', 1050, y + 20, 27);
    });
    return;
  }
  heading(g, 'Different plan  /  code exposure', 'How often can 100B code tokens appear?');
  tape(g, 58, 207, 360, 118, mint);
  big(g, '100B inventory', 77, 281, 38);
  const count = s.at(6, 'seven hundred billion') ? 7 : 0;
  for (let i = 0; i < count; i++) {
    const x = 60 + i * 155;
    tape(g, x, 383, 145, 95, mint);
    mono(g, '100B', x + 72, 444, 29, ink, 'center');
  }
  if (count) {
    const passes = s.at(6, "That's seven") ? count : '?';
    big(g, '700B / 100B = ' + passes + ' token-weighted passes', 60, 589, 42);
  }
}
function contamination(g, s) {
  if (s.beat < 5) {
    heading(
      g,
      'Pinned benchmark  /  review queue',
      'What exactly matched the evaluation material?',
    );
    const rows = [
      ['README', 'Quoted marker', 'Trace lineage'],
      ['Prompt copy', 'Exact four-word span', 'Inspect passage'],
      ['Renamed code', 'Lexical code match', 'Inspect behavior'],
      ['Runbook', 'No implemented match', 'Audit remaining risk'],
    ];
    rows.forEach(([a, b, c], i) => {
      const y = 220 + i * 89;
      tape(g, 60, y, 1081, 72, i === 0 ? ochre : white);
      tag(g, a, 80, y + 46);
      if (s.beat >= 2 || i > 0) label(g, b, 322, y + 47, 24);
      if (s.beat >= 3) label(g, c, 793, y + 47, 24, teal);
    });
    return;
  }
  heading(
    g,
    'Lexical screen  /  indentation removed',
    'With a false flag, which final return can run?',
  );
  const run = s.at(6, 'On the left'),
    right = s.at(6, 'returns None');
  [codeLines, nestedLines].forEach((lines, i) => {
    const x = 58 + i * 553;
    tape(g, x, 216, 528, 287, i ? blue : mint);
    tag(g, i ? 'Nested return' : 'Dedented return', x + 17, 265);
    lines.forEach((v, j) => {
      mono(g, v, x + 16, 322 + j * 46, 26, j === 3 ? teal : ink);
    });
    mono(g, 'decide(False)', x + 12, 551, 25);
    if (i ? right : run) mono(g, i ? '→ None' : '→ 2', x + 303, 551, 30, teal);
  });
  if (s.beat >= 7)
    tag(g, 'Save the matched span, source ID, benchmark revision and policy decision.', 58, 624);
}
function privacy(g, s) {
  heading(
    g,
    'Privacy review  /  technical source',
    s.beat === 4 ? 'Why does this flagged word need context?' : 'What survived the email scrub?',
  );
  const masked = s.at(2, 'Replace the email'),
    flag = s.at(2, 'private-key marker');
  tape(g, 57, 207, 1085, 283, white);
  const email = masked ? '<EMAIL>' : 'alice@example.test';
  mono(g, 'contact: ' + email, 87, 294, 35, masked ? teal : ink);
  mono(g, '-----BEGIN PRIVATE KEY-----', 87, 379, 35, flag ? red : ink);
  mono(g, 'author: Dr. Rivera', 87, 448, 27, muted);
  if (flag) tag(g, 'Hold for secret review', 810, 377, red);
  if (masked) label(g, 'Special-token registry   /   no entry for <EMAIL>', 60, 552, 26, teal);
  if (s.beat === 4) {
    tape(g, 57, 188, 1085, 385, white);
    tag(g, 'Contextual content review', 77, 241);
    big(g, '“Attack”', 78, 327, 53);
    rule(g, 78, 352, 1111, 352, line);
    label(g, 'Clinical note', 78, 413, 26, teal);
    mono(g, 'A panic attack can feel sudden.', 338, 414, 25);
    label(g, 'Abusive message', 78, 497, 26, red);
    label(g, 'Review the message and its intended target.', 338, 497, 25);
  }
  if (s.beat >= 3)
    label(
      g,
      [
        '',
        '',
        'Stable pseudonyms can link records across the corpus.',
        'Review a flagged word in context, including clinical uses.',
        'Carry source terms and privacy decisions into generated variants.',
      ][s.beat - 1],
      60,
      614,
      25,
    );
}
function compression(g, s) {
  const code = codeTokens.map((token) => token.text).join('');
  const split = s.at(5, 'Count the pieces', 0.8);
  const counted = s.at(5, 'Five tokens cover');
  const quotient = s.at(5, 'three point two characters');
  const followSpace = s.at(6, 'Follow the last dot');
  const identified = s.at(6, 'It shares a token');
  heading(g, 'Measuring tokenizer compression', s.beat === 5
    ? 'How many tokens does the return line use?'
    : 'Which token contains the fourth space?');

  tape(g, 56, 193, 337, 329);
  tag(g, 'English text', 79, 238);
  label(g, 'Llama 3 report', 79, 272, 21, muted);
  rule(g, 79, 292, 368, 292, line);
  const englishCues = ['three point one seven', 'three point nine four'];
  englishCompression.forEach((value, i) => {
    const y = 352 + 68 * i;
    label(g, 'Llama ' + (i + 2), 79, y, 26);
    mono(g, s.at(5, englishCues[i]) ? value.toFixed(2) : '…', 365, y, 32, teal, 'right');
  });
  label(g, 'Characters per token', 79, 483, 22, muted);

  tape(g, 413, 193, 730, 329);
  tag(g, 'Python  /  record C', 438, 238);
  mono(g, 'cl100k_base', 1118, 238, 22, teal, 'right');
  rule(g, 438, 292, 438, 324, muted);
  mono(g, code, 444, 317, 32);
  const showSpaces = s.at(5, 'Each dot marks a space');
  if (showSpaces) {
    const origin = 446;
    g.font = '400 35px "Lesson Mono"';
    const charWidth = g.measureText('a').width;
    let x = origin;
    for (const [i, token] of codeTokens.entries()) {
      const width = charWidth * token.text.length;
      if (split > 0) {
        g.save();
        g.globalAlpha = split;
        rect(g, x - 3, 350, width + 6, 56, identified && i === 1 ? ochre : i % 2 ? blue : mint);
        g.restore();
      }
      mono(g, token.text.replaceAll(' ', '·'), x, 389, 35);
      if (i === 1 && followSpace) rule(g, x + 2, 397, x + charWidth - 2, 397, red, 4);
      x += width + 21 * split;
    }
    label(g, '· = one space', 1118, 433, 18, muted, 'Sans', 400, 'right');
  }
  if (quotient)
    mono(g, code.length + ' / ' + codeTokens.length + ' = ' + (code.length / codeTokens.length) +
      ' characters per token', 438, 483, 26, teal);
  else if (counted)
    mono(g, codeTokens.length + ' tokens', 438, 483, 26, teal);
  else if (split > 0)
    label(g, 'How many pieces?', 438, 483, 25, teal);

  if (s.beat === 5 && s.at(5, 'Before writing shards')) {
    tag(g, 'Freeze before writing shards', 58, 566);
    label(g, 'Tokenizer revision, normalization, merge ranks and special token IDs', 58, 610, 27);
  }
  if (identified)
    label(g, 'Token ' + codeTokens[1].id + ' contains the fourth space and return.', 58, 596, 29);
}
function vocabulary(g, s) {
  if (s.beat >= 5) {
    compression(g, s);
    return;
  }
  if (s.beat <= 2) {
    heading(
      g,
      'Dense vocabulary matrices  /  untied',
      'How much storage does a larger vocabulary add?',
    );
    const added = s.at(2, 'Add eight thousand rows');
    ['Input embeddings', 'Output projection'].forEach((v, i) => {
      const x = 65 + i * 550;
      tag(g, v, x, 216);
      rect(g, x, 241, 423, 157, blue);
      if (added) rect(g, x, 398, 423, 78, mint);
      for (let j = 0; j <= (added ? 6 : 4); j++)
        rule(g, x, 241 + j * 39, x + 423, 241 + j * 39, paper, 2);
      for (let j = 1; j < 8; j++) rule(g, x + j * 53, 241, x + j * 53, added ? 476 : 398, paper, 2);
      mono(g, added ? '24,000 × 256' : '16,000 × 256', x, 523, 25);
    });
    if (added)
      mono(
        g,
        '2 × 8,000 × 256 × 2 = ' +
          matrixBytes(8000, 256, 2).toLocaleString('en-US') +
          ' extra bytes',
        60,
        614,
        28,
        teal,
      );
    return;
  }
  heading(g, 'Segmentation rules', 'How does the tokenizer choose pieces?');
  const rows = [
    ['Byte BPE', '256 byte values → ranked adjacent merges'],
    ['WordPiece', 'Longest vocabulary piece that fits'],
    ['Unigram', 'Choose a likely segmentation under piece probabilities'],
  ];
  rows.forEach(([a, b], i) => {
    const y = 220 + i * 98;
    tape(g, 58, y, 1085, 81, [mint, blue, white][i]);
    tag(g, a, 78, y + 51);
    label(g, b, 310, y + 51, 25);
  });
  if (s.beat >= 4) tag(g, 'SentencePiece implements both BPE and Unigram.', 58, 561);
}
const sampleWords = ['rotate', 'keys', 'after', 'review'];
const baseSymbols = [...new Set(bpeReplay(trainingLines.join(' ').split(' '), []).flat())];
export function encodeRotate(rules) {
  const vocabulary = [...baseSymbols, ...rules.map(([a, b]) => a + b)];
  return bpeReplay(['rotate'], rules)[0].map((piece) => ({ piece, id: vocabulary.indexOf(piece) }));
}
function shardCompatibility(g, s) {
  heading(g, 'Shard compatibility  /  toy token IDs', 'Can we reuse the stored IDs for rotate?');
  const withoutLast = s.at(7, 'Now drop the last merge');
  const rows = [['Stored shard · pinned tokenizer', encodeRotate(BPE_RULES)]];
  if (s.at(7, 'only the documentation changed')) {
    rows.push([
      withoutLast ? 'New tokenizer · last merge removed' : 'New revision · documentation edit only',
      encodeRotate(withoutLast ? BPE_RULES.slice(0, -1) : BPE_RULES),
    ]);
  }
  rows.forEach(([name, tokens], row) => {
    const y = 215 + row * 172;
    tag(g, name, 61, y);
    tokens.forEach(({ piece, id }, i) => {
      const x = 60 + i * 211;
      tape(g, x, y + 18, 200, 96, withoutLast && row === 1 && i < 2 ? ochre : mint);
      mono(g, piece.replace('</w>', '¶'), x + 18, y + 64, 30);
      label(g, 'ID ' + id, x + 18, y + 95, 21, muted);
    });
  });
  tag(g, '¶ = end-of-word marker', 891, 296);
  if (s.at(7, 'Retokenize the affected text'))
    big(g, 'Retokenize rotate with the new tokenizer.', 60, 603, 39);
  else if (!withoutLast && s.at(7, 'their IDs still match'))
    big(g, 'Same encoding. Reuse these IDs.', 60, 603, 39);
}
export function mergeCount(s) {
  const cues = [
    [3, 'First join T'],
    [3, 'T joins A'],
    [3, 'R joins O'],
    [3, 'Now join A'],
    [3, 'can now join'],
    [4, 'Add R'],
    [4, 'then the end marker'],
    [4, 'last rule joins'],
  ];
  return cues.filter(([n, phrase]) => s.at(n, phrase)).length;
}
function bpe(g, s) {
  if (s.beat === 1) {
    heading(
      g,
      'Learned merge ranks  /  character toy',
      'Which adjacent pairs occur often enough to merge?',
    );
    trainingLines.forEach((line, i) => {
      tape(g, 60, 219 + i * 86, 1080, 74, i === 0 ? mint : white);
      mono(g, line, 82, 265 + i * 86, 27);
    });
    const count = (w) => w.flat().length,
      words = trainingLines.join(' ').split(' ');
    mono(g, 'Corpus  ' + count(bpeReplay(words, [])) + ' symbols', 60, 555, 30);
    if (s.at(1, 'repeating eight'))
      mono(g, '→  ' + count(bpeReplay(words, BPE_RULES)) + ' after 8 rules', 503, 555, 30, teal);
    return;
  }
  if (s.at(7, 'Pin the tokenizer revision')) {
    shardCompatibility(g, s);
    return;
  }
  heading(
    g,
    'Replay frozen ranks  /  four-word sample',
    'Watch the boundaries between pieces disappear',
  );
  const k = mergeCount(s),
    groups = bpeReplay(sampleWords, BPE_RULES.slice(0, k));
  groups.forEach((pieces, i) => {
    const y = 207 + i * 84;
    tag(g, sampleWords[i], 59, y + 40);
    let x = 218;
    for (const p of pieces) {
      const w = (p === '</w>' ? 2 : p.replace('</w>', '¶').length) * 28 + 29;
      tape(g, x, y, w - 3, 66, i === 2 ? mint : white);
      mono(g, p.replace('</w>', '¶'), x + w / 2 - 1, y + 43, 25, ink, 'center');
      x += w;
    }
  });
  const n = k < BPE_RULES.length || s.at(4, 'Sixteen remain') ? groups.flat().length : '?';
  mono(g, k + ' / 8 rules  ·  ' + n + ' symbols', 60, 592, 29);
  tag(g, '¶ = end-of-word marker', 756, 591);
  if (s.beat === 6 || s.beat === 7)
    label(
      g,
      s.beat === 6
        ? 'Tie-break: first pair encountered. Spaces were discarded before merging.'
        : 'Whitespace splitting discarded the original spacing.',
      60,
      641,
      21,
    );
}
export default [
  bigrams,
  chain,
  inventory,
  draws,
  exposure,
  contamination,
  privacy,
  vocabulary,
  bpe,
];
