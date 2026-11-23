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
  bg,
  cell,
  rule,
  book,
  disk,
  end,
  bar,
  sum,
  dot,
  filmWindow,
} from './studio.mjs';
import {
  NESTED_Q,
  widthTwo,
  mtebTasks,
  englishTable,
  fixedCosts,
  nestedLoss,
  finiteUnit,
  maxTable,
  tokenMaxSim,
  vectors,
  indexDocs,
  rerank,
  budgets,
  ranks,
  rel,
  shortlistMetrics,
  tireOrder,
  tireRelevant,
  scores,
  archive,
  caption,
  subjects,
  ANGLES,
  vector,
} from './examples.mjs';

export function architectures(g, k) {
  const cross = cue(k, 0, 'With a cross-encoder'),
    late = cue(k, 2, 'Late interaction'),
    mode = late ? 2 : cross ? 1 : 0;
  title(
    g,
    [
      'File a vector before the query arrives',
      'Read the two texts together',
      'Keep the document tokens',
    ][mode],
    ['Bi-encoder', 'Cross-encoder', 'Late interaction'][mode],
  );
  const doc = ['Rotate', 'API', 'key'],
    query = ['API', 'key'];
  const tokens = (xs, x, y, w, col) =>
    xs.forEach((s, i) => cell(g, x + i * (w + 12), y, w, 86, s, col, C.ink, 36));
  text(g, 'Query', 94, 360, 39, C.soft);
  tokens(query, 385, 292, 166, C.pale);
  text(g, 'Passage', 94, 639, 39, C.soft);
  tokens(doc, 385, 571, 166, C.brass);
  if (mode === 1) {
    if (cue(k, 1, 'attend to a word')) {
      for (const [from, to] of [
        [0, 1],
        [1, 2],
      ]) {
        const x = 468 + from * 178,
          u = 468 + to * 178;
        stroke(
          g,
          [
            [x, 381],
            [u, 564],
          ],
          C.sea,
          5,
          [9, 8],
        );
      }
      text(g, 'Joint self-attention', 93, 498, 31, C.sea, { max: 325 });
    }
    stroke(
      g,
      [
        [749, 334],
        [938, 334],
        [1020, 453],
      ],
      C.sea,
      5,
    );
    stroke(
      g,
      [
        [918, 615],
        [954, 615],
        [1020, 480],
      ],
      C.gold,
      5,
    );
    cell(g, 1010, 405, 483, 134, 'joint encoder', C.white, C.ink, 42);
    arrow(g, 1515, 474, 1650, 474, C.soft);
    text(g, 'score', 1680, 489, 43);
    text(g, 'One joint pass per query–passage pair.', 94, 895, 49, C.sea);
  } else {
    for (let j = 0; j < 2; j++) {
      const y = j ? 613 : 334;
      arrow(g, 930, y, 1050, y, C.soft);
      text(g, j ? 'stored' : 'encode', 1081, y + 12, 34, C.soft);
      const count = late ? (j ? 3 : 2) : 1;
      for (let i = 0; i < count; i++) {
        const x = 1330 + i * 142;
        fill(g, x, y - 61, 101, 122, j ? C.brass : C.pale);
        [0.7, 0.35, 0.56, 0.85].forEach((v, d) =>
          fill(g, x + 12, y - 44 + 24 * d, (31 + 38 * v) * (1 - i * 0.07), 10, j ? C.gold : C.sea),
        );
      }
    }
    text(
      g,
      late
        ? 'At lookup, match each query position to its best passage position.'
        : 'At lookup, compare the query vector with each stored document vector.',
      94,
      895,
      43,
      C.sea,
    );
  }
}
export function maxsim(g, k) {
  const b = k.beat.beatIndex,
    swapped = cue(k, 1, 'Swap the last two'),
    r = maxTable(swapped),
    m = tokenMaxSim(r);
  if (b < 2) {
    title(g, 'Which document token wins each row?', 'MaxSim  /  contextual token dot products');
    ['Doc 1', 'Doc 2', 'Doc 3'].forEach((s, j) => text(g, s, 557 + j * 293, 326, 39, C.soft));
    r.forEach((row, i) => {
      const y = 386 + i * 170;
      serif(g, i ? 'key' : 'API', 96, y + 95, 70);
      row.forEach((v, j) => {
        const win = m.winners[i] === j && (!i || cue(k, 0, 'row for key'));
        cell(
          g,
          495 + j * 293,
          y,
          258,
          128,
          fixed(v),
          win ? C.sea : C.white,
          win ? C.white : C.ink,
          53,
        );
        if (win) circle(g, 519 + j * 293, y + 20, 7, C.brass);
      });
    });
    if (b === 1) {
      mono(
        g,
        fixed(m.values[0]) + ' + ' + fixed(m.values[1]) + ' = ' + fixed(m.sum),
        98,
        861,
        63,
        C.sea,
      );
      if (swapped) text(g, 'Both winners now occupy document position 2.', 98, 953, 40, C.soft);
    }
    return;
  }
  title(
    g,
    b === 2 ? 'What must the index store?' : 'Reconstruct a token vector',
    b === 2 ? 'Equal bytes per coordinate  /  raw payload' : 'ColBERTv2  /  approximate scoring',
  );
  if (b === 2) {
    for (let i = 0; i < 100; i++) {
      const x = 98 + (i % 20) * 41,
        y = 346 + Math.floor(i / 20) * 49;
      fill(g, x, y, 30, 37, C.sea);
    }
    serif(g, '100 token vectors', 98, 703, 54);
    mono(g, '100 × 128 = 12,800 coordinates', 98, 780, 38);
    fill(g, 1130, 349, 132, 231, C.brass);
    serif(g, '1 pooled vector', 1130, 703, 54);
    mono(g, '1 × 768 = 768', 1130, 780, 38);
    mono(g, 'Raw coordinate ratio    ' + fixed(12800 / 768, 1) + '×', 98, 956, 45);
  } else {
    const x = 210,
      y = 700;
    stroke(
      g,
      [
        [x, y],
        [x + 560, y],
        [x + 560, y - 395],
      ],
      C.line,
      3,
    );
    arrow(g, x, y, x + 370, y - 210, C.blue, 9);
    arrow(g, x + 370, y - 210, x + 456, y - 298, C.rust, 8);
    circle(g, x + 456, y - 298, 11, C.sea);
    [
      ['Centroid ID', 'Look up a shared vector.', C.blue],
      ['Quantized residual', 'Decode 1 or 2 bits per coordinate.', C.rust],
      ['Approximate token', 'Add the two vectors before scoring.', C.sea],
    ].forEach(([a, b, c], i) => {
      const y = 353 + i * 180;
      serif(g, a, 940, y, 54, c);
      text(g, b, 940, y + 69, 38);
    });
  }
}
export function formatting(g, k) {
  const b = k.beat.beatIndex,
    instr = cue(k, 1, 'Original INSTRUCTOR'),
    names = ['E5-base-v2', 'BGE v1.5', 'INSTRUCTOR'],
    mode = b === 0 ? 0 : instr ? 2 : 1;
  if (b < 2) {
    title(g, names[mode], 'Input at the encoder boundary');
    const fmts = [
      ['query:', 'passage:'],
      ['Represent this sentence for searching relevant passages:', ''],
      ['[query instruction, text]', '[passage instruction, text]'],
    ][mode];
    [
      'How do I rotate an API key?',
      'Create a replacement key. Revoke the old key after migration.',
    ].forEach((t, i) => {
      const y = 332 + i * 258;
      fill(g, 92, y, 1717, 211, C.white);
      fill(g, 92, y, 13, 211, i ? C.gold : C.sea);
      text(g, i ? 'Passage' : 'Query', 134, y + 60, 37, C.soft);
      mono(g, fmts[i] || (mode === 1 ? 'Plain passage' : ''), 398, y + 60, 36, i ? C.gold : C.sea);
      serif(g, t, 134, y + 155, 51, C.ink, { max: 1600 });
    });
    text(
      g,
      mode === 0
        ? 'Masked mean pooling → normalize → compare'
        : mode === 1
          ? 'Instructed short-query setting • plain queries can also be evaluated'
          : 'Pass the instruction and text as a pair.',
      94,
      953,
      38,
      C.soft,
    );
    return;
  }
  title(
    g,
    'Which side of the index changed?',
    'Pin the checkpoint, tokenizer, pooling, normalization, prefixes, corpus and score function',
  );
  const q = cue(k, 2, 'query-only change');
  serif(g, q ? 'New query format' : 'New passage format', 92, 415, 65);
  arrow(g, 736, 392, 1037, 392, C.sea);
  serif(g, q ? 'Stored passage vectors' : 'Fresh passage vectors', 1087, 415, 56);
  rule(g, 94, 560, 1698);
  text(g, 'Compare rankings on the same held-out queries.', 94, 744, 53, C.sea);
}
export function projection(g, k) {
  bg(g, true);
  const project = cue(k, 0, 'Project all three', 1.5),
    norm = cue(k, 1, 'Normalize the three', 1);
  title(
    g,
    'Keep only coordinate one',
    'Query and positive coincide  /  distractor starts below',
    true,
  );
  const cx = 470,
    cy = 591,
    r = 314;
  disk(g, cx, cy, r);
  const projected = vectors.map(([x, y]) => [
    x + (finiteUnit([x])[0] - x) * norm,
    y * (1 - project),
  ]);
  const [vx, vy] = projected[0],
    ex = cx + r * vx,
    top = cy - r * vy,
    bot = cy - r * projected[2][1];
  if (project > 0) {
    for (const sign of [-1, 1])
      stroke(
        g,
        [
          [cx + 0.6 * r, cy + sign * 0.8 * r],
          [cx + 0.6 * r, cy],
        ],
        '#829b9a',
        3,
        [6, 8],
      );
  }
  for (const [y, hue, w] of [
    [top, C.cyan, 17],
    [top, C.mint, 8],
    [bot, C.coral, 4],
  ])
    arrow(g, cx, cy, ex, y, hue, w, 18 + w);
  circle(g, ex, top, 15, null, C.cyan, 4);
  circle(g, ex, top, 9, null, C.mint, 4);
  circle(g, ex, bot, 4, C.coral);
  circle(g, cx, cy, 8, C.brass);
  const x = 981;
  ['Query', 'Positive', 'Distractor'].forEach((s, i) => {
    const y = 362 + i * 114;
    serif(g, s, x, y, 47, [C.cyan, C.mint, C.coral][i]);
    const coordinates = project === 1 ? [vx] : projected[i];
    mono(g, '[' + coordinates.map((value) => fixed(value)).join(', ') + ']', 1321, y, 43, C.light);
  });
  rule(g, x, 653, 777, '#678188');
  if (!project) {
    mono(
      g,
      'Full cosine   +' +
        fixed(dot(vectors[0], vectors[1])) +
        ' / ' +
        fixed(dot(vectors[0], vectors[2])),
      x,
      746,
      40,
      C.light,
    );
  } else if (project === 1 && !norm) {
    mono(g, 'First coordinates   0.60 × 3', x, 746, 40, C.brass);
    text(g, 'Which candidate wins after normalization?', x, 837, 35, C.light);
  } else if (norm === 1) {
    mono(
      g,
      'Prefix cosine   +' +
        fixed(dot(projected[0], projected[1])) +
        ' / +' +
        fixed(dot(projected[0], projected[2])),
      x,
      746,
      40,
      C.brass,
    );
    text(g, 'One position, two tied candidates.', x, 837, 40, C.light);
  } else
    text(
      g,
      norm ? 'Normalize the nonzero prefixes' : 'Project onto coordinate one',
      x,
      746,
      39,
      C.brass,
    );
  if (k.beat.beatIndex >= 2) {
    mono(g, '[0, 1] → [0]   norm 0', x, 917, 37, C.coral);
    text(g, 'A zero prefix has no unit direction.', x, 980, 33, C.light);
  }
}
export function nested(g, k) {
  const b = k.beat.beatIndex,
    w = [2, 4, 6],
    ls = w.map(nestedLoss),
    weighted = cue(k, 4, 'twice the weight'),
    weights = weighted ? [2, 1, 1] : [1, 1, 1];
  if (b === 1 || b === 2) {
    const { queries, passages, cosines, temperature, losses } = widthTwo;
    const scored = cue(k, 1, 'Take the dot products');
    title(g, 'What loss does width two contribute?', 'Two query–passage pairs   /   temperature ' + fixed(temperature));
    text(g, 'Raw prefix', 296, 313, 39, C.soft);
    text(g, 'Length', 713, 313, 39, C.soft);
    [...queries, ...passages].forEach((v, i) => {
      const y = 405 + i * 105;
      serif(g, ['Query A', 'Query B', 'Passage A', 'Passage B'][i], 90, y, 43);
      mono(g, '[' + v.map((n) => fixed(n, 2)).join(', ') + ']', 295, y, 39);
      mono(g, fixed(Math.hypot(...v), 3), 709, y, 39, C.sea);
    });
    text(g, 'Cosine after unit normalization', 993, 313, 39, C.sea);
    ['Passage A', 'Passage B'].forEach((s, j) =>
      text(g, s, 1344 + 266 * j, 409, 35, C.soft, { align: 'center' }));
    cosines.forEach((row, i) => {
      const y = 445 + i * 125;
      serif(g, 'Query ' + (i ? 'B' : 'A'), 992, y + 64, 41);
      row.forEach((v, j) =>
        cell(g, 1220 + j * 266, y, 248, 103, scored ? fixed(v, 3) : '·',
          i === j ? C.pale : C.white, C.ink, 49));
    });
    text(g, 'Diagonal targets   /   A with A, B with B', 992, 738, 33, C.sea);
    rule(g, 91, 802, 1720);
    if (b === 1) {
      text(g, scored ? 'The target changes columns. Will the two row losses differ?' :
        'Divide each prefix by its own length.', 91, 919, 47, C.ink);
    } else {
      const row = cosines[0];
      mono(g, 'Row A   ln(1 + exp((' + fixed(row[1], 3) + ' − ' + fixed(row[0], 3) +
        ') / ' + fixed(temperature) + '))', 91, 898, 46);
      if (cue(k, 2, 'Each row costs')) {
        mono(g, 'Row A = Row B ≈ ' + fixed(losses[0], 4) + ' nats', 91, 988, 45, C.sea);
      }
    }
    return;
  }
  if (b < 5) {
    title(
      g,
      'Train three widths of one representation',
      'Slice both sides at the same width, then normalize each vector before scoring',
    );
    text(g, 'Width', 94, 319, 35, C.soft);
    text(g, 'Raw coordinates of query A', 403, 319, 35, C.soft);
    text(g, 'Mean row loss', 1420, 319, 35, C.soft);
    w.forEach((d, i) => {
      const y = 371 + i * 150;
      mono(g, d, 124, y + 58, 55);
      NESTED_Q[0].forEach((v, j) =>
        cell(
          g,
          404 + j * 153,
          y,
          143,
          91,
          j < d ? fixed(v, 1) : '·',
          j < d ? C.pale : '#e3ddcf',
          j < d ? C.ink : C.soft,
          36,
        ),
      );
      const seen = b >= 3 && (i === 0 || cue(k, 3, i === 1 ? 'width four gives' : 'width six gives'));
      if (seen) mono(g, fixed(ls[i], 4), 1440, y + 63, 51, C.sea);
    });
    if (cue(k, 3, 'Equal weighting gives'))
      mono(
        g,
        'Weighted mean   (' +
          weights.join(' : ') +
          ')    ' +
          fixed(sum(ls.map((v, i) => v * weights[i])) / sum(weights), 4) +
          ' nats',
        95,
        946,
        48,
      );
  } else {
    title(
      g,
      'Ten million vectors in storage',
      'Float32  /  four bytes per coordinate  /  decimal GB',
    );
    [64, 768].forEach((d, i) => {
      const y = 384 + i * 220;
      serif(g, 'Width ' + d, 92, y + 54, 58);
      bar(g, 570, y, 824, 80, d / 768, i ? C.blue : C.sea);
      mono(g, fixed((1e7 * d * 4) / 1e9) + ' GB', 1450, y + 60, 52);
    });
    text(
      g,
      b === 5
        ? 'Short prefixes admit the candidates. Full width rescores only those candidates.'
        : 'Budget for IDs, graph links, metadata and retained full vectors as well.',
      93,
      924,
      41,
      C.soft,
    );
  }
}
export function lookup(g, k) {
  const b = k.beat.beatIndex;
  title(
    g,
    b === 0 ? 'File each caption once' : 'Which captions came through?',
    b === 0
      ? 'Stored unit vectors  /  query encoded once'
      : 'Example shortlist for “a dog is running”',
  );
  subjects.forEach((s, i) => {
    const x = 92 + i * 592;
    filmWindow(g, s, x, 322, 552, 288, 0, true);
    serif(g, caption[i], x, 694, 51);
    if (b === 0) {
      mono(
        g,
        '[' +
          vector(ANGLES[i])
            .map((v) => fixed(v))
            .join(', ') +
          ']',
        x,
        786,
        42,
      );
      mono(g, 'cos ' + fixed(scores[i], 3), x, 866, 37, C.sea);
    } else {
      const keep = i !== 0;
      fill(g, x, 749, 551, 8, keep ? C.sea : C.rust);
      text(g, keep ? 'Admitted' : 'Outside shortlist', x, 825, 43, keep ? C.sea : C.rust);
    }
  });
  if (b === 2)
    text(
      g,
      'Measure held-out coverage, ordering, latency, storage and performance by slice.',
      94,
      970,
      37,
      C.soft,
    );
}
export function shortlist(g, k) {
  const b = k.beat.beatIndex;
  if (b < 4) {
    const one = cue(k, 2, 'just the first passage'),
      admit = one ? 1 : 3,
      reveal = one ? cue(k, 3, 'Only KMS') : cue(k, 1, 'returns API rotation');
    title(
      g,
      'How do I rotate an API key?',
      'First stage admits the candidates  /  supplied pair scores reorder them',
    );
    text(g, 'Bi-encoder ranking', 95, 305, 42, C.sea);
    text(g, 'Reranker returns', 1080, 305, 42, C.sea);
    indexDocs.forEach(([s, v], i) => {
      const y = 414 + i * 130;
      text(g, i + 1 + '.', 96, y, 39, C.soft);
      serif(g, s, 170, y, 51, i < admit ? C.ink : C.soft);
      mono(g, fixed(v), 735, y, 42);
      if (i + 1 === admit) {
        stroke(
          g,
          [
            [95, y + 48],
            [862, y + 48],
          ],
          C.gold,
          6,
        );
        text(g, 'K = ' + admit, 872, y + 60, 32, C.gold);
      }
    });
    if (reveal)
      rerank(admit).forEach(([s, , v], i) => {
        const y = 418 + i * 156;
        serif(g, i + 1 + '.  ' + s, 1080, y, 50);
        mono(g, fixed(v), 1690, y, 42, C.sea);
      });
    else text(g, 'Which passages can return?', 1080, 459, 42, C.soft);
    if (one && reveal) text(g, 'Both API guides are below the cutoff.', 1065, 795, 36, C.rust);
    return;
  }
  const other = b >= 5 && cue(k, 5, 'another budget'),
    deadline = other ? fixedCosts.deadline : 200,
    pair = other ? fixedCosts.pair : 15,
    query = other ? fixedCosts.query : 10,
    over = other ? fixedCosts.lookup + fixedCosts.overhead : 40,
    count = other ? budgets(deadline, query + over, pair) : 10;
  title(g, 'A sequential reranking budget', 'One pair at a time  /  deadline ' + deadline + ' ms');
  const x = 101,
    y = 490,
    w = 1690,
    unit = w / deadline;
  let off = 0;
  const seg = (ms, c) => {
    fill(g, x + off * unit, y, ms * unit - 1, 115, c);
    off += ms;
  };
  const counted = other ? cue(k, 6, 'eleven fit') : cue(k, 4, 'Scoring ten pairs');
  seg(query, C.blue);
  if (other) seg(over, C.gold);
  if (counted) {
    for (let i = 0; i < count; i++) seg(pair, C.sea);
    if (!other) seg(over, C.gold);
  }
  stroke(
    g,
    [
      [x + w, y - 57],
      [x + w, y + 148],
    ],
    C.rust,
    6,
  );
  mono(g, deadline + ' ms', x + w, y - 88, 38, C.rust, { align: 'right' });
  text(
    g,
    other
      ? query + ' ms query  +  ' + fixedCosts.lookup + ' ms lookup  +  ' + fixedCosts.overhead + ' ms overhead'
      : '10 ms query  +  40 ms for lookup and overhead',
    100,
    342,
    42,
  );
  mono(
    g,
    counted
      ? count + ' pairs × ' + pair + ' ms   =   ' + count * pair + ' ms'
      : 'Time per pair    ' + pair + ' ms',
    102,
    747,
    54,
    C.sea,
  );
  text(
    g,
    other
      ? counted
        ? count + ' pairs take ' + off + ' ms in total. Pair ' + (count + 1) + ' would finish at ' + (off + pair) + ' ms.'
        : 'K = floor((' + deadline + ' − ' + query + ' − ' + fixedCosts.lookup + ' − ' + fixedCosts.overhead + ') / ' + pair + ')'
      : 'Two million sequential pairs at 15 ms each take 8.33 hours.',
    102,
    902,
    42,
    C.soft,
  );
}
export function evaluation(g, k) {
  const b = k.beat.beatIndex;
  if (b <= 1) {
    const subset = cue(k, 1, 'Table one');
    title(
      g,
      'What did the original MTEB cover?',
      'Original MTEB paper  /  33 models, 58 datasets, 8 categories',
    );
    mtebTasks.forEach(([name, v], i) => {
      const x = 93 + i * 218,
        h = v * 25;
      fill(g, x, 793 - h, 154, h, i === 0 ? C.sea : i === 4 ? C.gold : '#92aba8');
      mono(g, v, x + 77, 758 - h, 40, C.ink, { align: 'center' });
      text(g, name, x + 77, 856, 33, C.ink, { align: 'center' });
      if (subset && name === 'Bitext') {
        rule(g, x, 883, 154, C.rust);
        text(g, 'Outside Table 1', x + 77, 919, 26, C.rust, { align: 'center' });
      }
    });
    text(g, subset
      ? 'Table 1 average   /   English subsets of ' + sum(englishTable.map(([, n]) => n)) +
        ' datasets in ' + englishTable.length + ' categories'
      : 'STS compares similarity ranks with human relatedness ratings.', 93, 991, 40, subset ? C.sea : C.soft);
  } else if (b === 2) {
    title(g, 'Record the benchmark edition', 'Original MTEB and the expanded MMTEB collection');
    [
      ['Original MTEB', '58 datasets', '8 task categories'],
      ['MMTEB · 2025', '500+ tasks', '250+ languages'],
    ].forEach(([name, qty, scope], i) => {
      const x = 95 + i * 875;
      serif(g, name, x, 384, 62);
      mono(g, qty, x, 553, 67, C.sea);
      text(g, scope, x, 655, 48, C.soft);
    });
    text(g, 'A joint cross-encoder service needs a test on its own candidate lists.', 95, 906, 43);
  } else if (b === 3) {
    title(g, 'Inspect the text that reaches the encoder', 'Held-out passage boundary');
    serif(g, 'Rotate the API key.', 100, 401, 70);
    serif(
      g,
      'Deploy the replacement before revoking the old key.',
      100,
      591,
      60,
      cue(k, 3, 'truncated') ? C.soft : C.ink,
    );
    if (cue(k, 3, 'truncated')) {
      stroke(
        g,
        [
          [95, 473],
          [1780, 473],
        ],
        C.rust,
        6,
      );
      text(g, 'Input ends here', 1332, 445, 39, C.rust);
      text(g, 'The ordering instruction lies outside the token window.', 100, 859, 47, C.rust);
    }
  } else {
    title(
      g,
      'A retrieval evaluation needs judgments',
      'Two tools and the evidence used to score their output',
    );
    [
      ['Sentence-Transformers', 'Encode a query and passages'],
      ['FAISS', 'Search the stored vectors'],
      ['Held-out judgments', 'Check whether the results answer the query'],
    ].forEach(([s, t], i) => {
      const y = 372 + i * 191;
      serif(g, s, 92, y, 54);
      text(g, t, 790, y, 44, i === 2 ? C.sea : C.ink);
      rule(g, 93, y + 58, 1717);
    });
  }
}
export function metrics(g, k) {
  const b = k.beat.beatIndex,
    stage = cue(k, 3, 'Adding its other') ? 2 : cue(k, 3, 'Moving the first') ? 1 : 0,
    rs = ranks(stage),
    ms = rs.map((a, i) => shortlistMetrics(a, rel[i], 2));
  title(g, 'Count answers inside the first two', 'Fixed corpus, cutoff and relevance judgments');
  const xs = [93, 272, 901, 1430, 1670];
  ['Query', 'Top two', 'Judged answers', 'Recall', 'RR'].forEach((v, i) =>
    text(g, v, xs[i], 331, 38, C.soft),
  );
  rs.forEach((row, i) => {
    const y = 391 + i * 141;
    mono(g, 'Q' + (i + 1), xs[0], y + 60, 42);
    row.forEach((v, j) =>
      cell(g, xs[1] + j * 292, y, 276, 83, v, rel[i].includes(v) ? C.pale : C.white, C.ink, 31),
    );
    text(g, rel[i].join(', '), xs[2], y + 55, 35);
    if (b >= 2) {
      mono(g, fixed(ms[i].recall), xs[3], y + 59, 40);
      mono(g, fixed(ms[i].rr), xs[4], y + 59, 40, C.sea);
    }
  });
  rule(g, 94, 825, 1715);
  if (b >= 2) mono(g, 'Means', 930, 922, 42);
  if (b >= 2)
    [sum(ms.map((m) => m.recall)) / 3, sum(ms.map((m) => m.rr)) / 3].forEach((v, i) =>
      mono(g, fixed(v), xs[3 + i], 922, 43, C.sea),
    );
  else
    text(
      g,
      b === 0
        ? 'Recall counts all judged answers. Reciprocal rank uses the first relevant position.'
        : 'MRR averages the reciprocal ranks across queries.',
      94,
      938,
      38,
      C.soft,
    );
}
export function lift(g, k) {
  const short = cue(k, 5, 'short index moves'),
    verdict = cue(k, 6, 'Hold the short index'),
    measure = cue(k, 6, 'Reciprocal rank doubled'),
    recall = cue(k, 6, 'Recall is one half');
  title(
    g,
    'Where can I safely lift this car?',
    'Held-out manual search  /  relevant pages: Jack points and Lift diagram',
  );
  const kinds = { 'Tire sizes': 'wheel', 'Jack points': 'jack', 'Lift diagram': 'diagram' };
  for (let i = 0; i < (short ? 2 : 1); i++) {
    const y = 300 + i * 304,
      r = tireOrder(i === 1),
      m = shortlistMetrics(r, tireRelevant, 2);
    serif(g, i ? 'Short index' : 'Control', 87, y + 59, 49);
    r.forEach((s, j) => {
      const x = 420 + j * 460;
      book(g, x, y, 385, 195, s, kinds[s], tireRelevant.includes(s) ? C.sea : C.soft);
    });
    if (measure) {
      mono(g, 'RR  ' + fixed(m.rr), 90, y + 125, 33, C.sea);
      if (recall) mono(g, 'Recall  ' + fixed(m.recall), 90, y + 176, 32);
    }
  }
  stroke(
    g,
    [
      [1302, 267],
      [1302, short ? 821 : 517],
    ],
    C.gold,
    6,
    [16, 9],
  );
  text(g, 'Cut after rank 2', 1289, short ? 866 : 567, 31, C.gold, { align: 'right' });
  if (short)
    text(
      g,
      verdict
        ? 'Hold the short index    •    Recall 0.50 falls below 0.75'
        : 'Required recall   0.75',
      93,
      969,
      verdict ? 52 : 46,
      verdict ? C.rust : C.soft,
    );
}
