import {
  access,
  asOf,
  bm25Term,
  code,
  eligible,
  expansion,
  idf,
  postings,
  query,
  records,
  terms,
} from './evidence.mjs';
import {
  arrow,
  badge,
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
  muted,
  night,
  orange,
  pale,
  peach,
  plate,
  policy,
  poly,
  rect,
  rivets,
  serif,
  steel,
  teal,
  text,
  white,
} from './art.mjs';

export function opening(c, t) {
  field(c, true);
  const paste = done(t, 2, 'There it is'),
    matched = done(t, 2, 'Word search'),
    miss = done(t, 1, 'Luna calls');
  const typed = terms(query),
    lens = ease(cue(t, 0, 'Lay each word', 2.6));
  // A pull tab holds the search words directly against the policy folio.
  const y = 190;
  box(c, 95, y + 4, 1000, 360, 8, '#102630');
  policy(c, 100, y, 1000, 365, { marked: matched });
  // The two holes, folded corner and indexed edge identify the open policy folio.
  for (const yy of [y + 89, y + 271]) {
    dot(c, 112, yy, 9, '#163b3e');
    line(
      c,
      [
        [81, yy + 7],
        [74, yy + 3],
        [73, yy - 6],
        [80, yy - 11],
        [104, yy - 11],
        [111, yy - 3],
      ],
      '#a9b9a8',
      5,
    );
  }
  poly(
    c,
    [
      [1061, y],
      [1100, y],
      [1100, y + 39],
    ],
    '#233d40',
  );
  poly(
    c,
    [
      [1061, y],
      [1061, y + 39],
      [1100, y + 39],
    ],
    '#c7c5ac',
  );
  const kx = 910,
    ky = 420;
  c.save();
  c.translate(kx, ky);
  c.rotate(-0.43);
  const brass = c.createLinearGradient(0, -38, 0, 28);
  brass.addColorStop(0, '#eed18a');
  brass.addColorStop(0.5, '#d3a45c');
  brass.addColorStop(1, '#947445');
  key(c, 3, 5, 1.26, '#b6ad91', pale);
  key(c, 0, 0, 1.26, brass, pale);
  line(
    c,
    [
      [20, -7],
      [100, -7],
    ],
    '#f5dc9d',
    3,
  );
  c.restore();
  label(c, 'LUNA’S SEARCH', 107, 65, 16, mint);
  const q = paste ? code : query;
  box(c, 99, 86, 1002, 82, 8, '#f5e5be');
  dot(c, 140, 126, 12, null, teal, 4);
  line(
    c,
    [
      [149, 135],
      [160, 146],
    ],
    teal,
    4,
  );
  text(c, q, 188, 126, 42, ink, { family: 'Mono' });
  if (!paste) {
    const part = typed[Math.min(3, Math.floor(lens * 4))];
    c.font = '400 42px "Lesson Mono"';
    const start = 188 + c.measureText(query.slice(0, query.indexOf(part))).width,
      w = c.measureText(part).width;
    line(
      c,
      [
        [start, 154],
        [start + w, 154],
      ],
      orange,
      4,
    );
  } else if (matched) {
    line(
      c,
      [
        [188, 154],
        [367, 154],
      ],
      orange,
      4,
    );
  }
  if (miss && !paste)
    label(c, terms(query).flatMap(postings).length + ' shared search words', 115, 600, 22, peach);
  if (matched) {
    key(c, 132, 598, 0.35, gold, night);
    label(c, '1 matching identifier', 195, 599, 22, mint);
  }
}

export function universe(c, t) {
  field(c);
  head(c, 'Evidence boundary', 'The May 27 policy file');
  const b = t.beat.beatIndex;
  const old = done(t, 0, 'A separate'),
    admin = done(t, 0, 'Which records'),
    released = done(t, 1, 'Key Session and Audit');
  const meta = [
    'effective 01 Apr',
    'effective 03 Jan',
    'effective 10 Feb',
    'ended 31 Mar',
    'admin grant',
  ];
  const names = ['Key v2', 'Session', 'Audit', 'Key v1', 'Admin'];
  label(c, 'TRUSTED POLICY STORE', 67, 180);
  for (const [i, r] of records.entries()) {
    const y = 205 + i * 68,
      show = i < 3 ? released : i === 3 ? old : admin;
    box(c, 65, y, 570, 58, 4, i === 3 || i === 4 ? '#e8e4d3' : pale, '#bdc4af', 1);
    fileIcon(c, r.id, 99, y + 29, 0.7, ink);
    text(c, names[i], 139, y + (r.code ? 20 : 29), 25);
    if (r.code) label(c, r.code, 139, y + 44, 13, teal);
    label(c, meta[i], 280, y + 29, 16, muted);
    if (show) label(c, access(r), 615, y + 29, 16, i < 3 ? teal : orange, 'right');
  }
  const when = b === 2 && done(t, 2, 'Check permission again');
  plate(c, 702, 188, 420, 354);
  rivets(c, 702, 188, 420, 354);
  label(c, 'LUNA   /   EU SUPPORT', 735, 238, 18, teal);
  label(c, asOf, 735, 272, 19);
  line(
    c,
    [
      [735, 300],
      [1092, 300],
    ],
    grid,
  );
  for (const [i, lane] of ['Word search', 'Vector search'].entries()) {
    const y = 337 + i * 95;
    text(c, lane, 736, y, 24, i ? orange : teal);
    label(
      c,
      released ? eligible.map((r) => r.id).join(' · ') : 'Awaiting eligibility',
      736,
      y + 32,
      18,
      ink,
    );
  }
  if (when) {
    const revoked = done(t, 2, 'With the grant revoked');
    const allow = access(records[0], revoked ? 'revoked' : 'support:eu') === 'Current';
    label(c, 'Passage fetch', 706, 574, 17, muted);
    badge(
      c,
      allow ? 'current grant  →  release Key' : 'revoked grant  →  withhold Key',
      706,
      617,
      allow ? teal : orange,
    );
  }
}

export function index(c, t) {
  field(c);
  head(c, 'Inverted index', 'Where does the word point?');
  const other = done(t, 1, 'Switch to'),
    active = other ? terms(query) : ['krot-14'];
  const showing = other ? done(t, 1, 'so the lexical') : done(t, 0, 'An inverted index');
  const x = 72,
    y = 195;
  label(c, 'LOOK UP', x, y);
  active.forEach((token, i) => badge(c, token, x, y + 66 + i * 62, other ? orange : teal));
  const top = 209;
  plate(c, 345, 165, 775, 376);
  label(c, 'TERM', 386, top);
  label(c, 'POSTING LIST', 758, top);
  ['krot-14', 'idle', 'audit-log', 'rule'].forEach((v, i) => {
    const cy = top + 63 + i * 72,
      on = !other && i === 0;
    if (on) box(c, 371, cy - 26, 718, 53, 3, '#d7e6ce');
    label(c, v, 389, cy, 25, on ? teal : ink);
    arrow(c, 580, cy, 717, cy, on ? teal : grid, 2);
    const names = postings(v).join('  ·  ');
    serif(c, names, 758, cy, 31);
    if (i < 3)
      line(
        c,
        [
          [385, cy + 34],
          [1085, cy + 34],
        ],
        grid,
        1,
      );
  });
  if (!other) arrow(c, 210, 260, 337, 273, teal, 3);
  if (showing)
    label(
      c,
      other ? 'Returned IDs   [ ]' : 'Returned IDs   [ Key ]',
      350,
      589,
      24,
      other ? orange : teal,
    );
  if (done(t, 1, 'This analyzer'))
    label(c, 'lowercase   ·   preserve hyphens   ·   drop common words', 350, 632, 17, muted);
}

export function bm(c, t) {
  field(c);
  const b = t.beat.beatIndex;
  if (b < 2) {
    head(c, 'Lexical scoring  /  analysis', 'Keep the code together');
    const split = done(t, 0, 'Now split'),
      duration = done(t, 1, 'Fourteen can');
    label(c, 'QUERY ANALYZER', 64, 210);
    serif(c, code, 63, 276, 58);
    arrow(c, 300, 273, 410, 273, muted);
    (split ? ['krot', '14'] : terms(code)).forEach((s, i) =>
      badge(c, s, 442 + i * 109, 278, orange),
    );
    plate(c, 718, 172, 423, 345);
    label(c, 'FIXED INDEX', 750, 216);
    for (const [i, term] of ['krot-14', '14'].entries()) {
      const hot = i === 0 ? !split : duration;
      const y = 299 + i * 110;
      if (hot) box(c, 736, y - 40, 386, 82, 4, '#d7e6ce');
      label(c, term, 756, y - 8, 27, ink);
      label(c, i ? 'duration in “14 days”' : 'whole identifier', 756, y + 27, 17, muted);
    }
    if (split) label(c, 'krot   →   no posting', 65, 404, 22, orange);
    if (duration) label(c, '14   →   Key, by duration', 65, 457, 22, teal);
    return;
  }
  if (b === 2) {
    head(c, 'Lexical scoring  /  rarity', 'How common is this code?');
    records.slice(0, 3).forEach((r, i) => {
      const x = 64 + i * 245;
      plate(c, x, 236, 216, 208);
      fileIcon(c, r.id, x + 55, 293, 1.25, teal);
      serif(c, r.id, x + 21, 353, 35);
      label(c, i === 0 ? 'krot-14' : i === 1 ? 'idle' : 'audit-log', x + 21, 404, 18);
    });
    label(c, 'N = 3 passages', 844, 265, 21);
    label(c, 'n = 1 contains code', 844, 324, 20);
    label(c, 'IDF = ln(1 + (N − n + 0.5) / (n + 0.5))', 65, 524, 24, ink);
    if (done(t, 2, 'That is the weight'))
      text(c, '≈ ' + idf.toFixed(3), 843, 400, 49, teal, { family: 'Mono' });
    return;
  }
  if (b <= 4) {
    head(c, 'BM25  /  average-length passage', 'What one more mention adds');
    const f = done(t, 3, 'Four give')
      ? 4
      : done(t, 3, 'Two mentions')
        ? 2
        : done(t, 3, 'One mention')
          ? 1
          : 0;
    const x = 100,
      y = 531,
      sx = 80,
      sy = 140;
    for (let i = 0; i <= 2; i++) {
      line(
        c,
        [
          [x, y - i * sy],
          [695, y - i * sy],
        ],
        grid,
        1,
      );
      label(c, i, x - 14, y - i * sy, 16, muted, 'right');
    }
    label(c, 'TF factor', 70, 175);
    line(
      c,
      [
        [x, y],
        [700, y],
      ],
      ink,
      2,
    );
    const points = Array.from({ length: 147 }, (_, i) => [
      x + (sx * i) / 20,
      y - sy * bm25Term(i / 20),
    ]);
    line(c, points, teal, 4);
    [0, 1, 2, 4, 6].forEach((n) => label(c, n, x + n * sx, y + 26, 18, muted, 'center'));
    label(c, 'mentions', 615, 585);
    line(
      c,
      [
        [x, y - 2.2 * sy],
        [697, y - 2.2 * sy],
      ],
      orange,
      2,
      [5, 7],
    );
    label(c, 'limit 2.2', 600, y - 2.2 * sy - 19, 16, orange);
    const landed = f === 0 || done(t, 3, { 1: 'Use that first', 2: 'The gain', 4: 'Even four' }[f]);
    if (landed) dot(c, x + sx * f, y - sy * bm25Term(f), 10, orange, pale, 3);
    label(c, 'k₁ = 1.2   L / avg = 1', 760, 224, 20);
    text(c, '2.2 × f / (f + 1.2)', 760, 289, 28, ink, { family: 'Mono' });
    serif(c, 'f = ' + f, 759, 378, 47);
    if (landed) label(c, 'factor  ' + bm25Term(f).toFixed(3), 760, 455, 26, teal);
    return;
  }
  const long = done(t, 6, 'A passage twice'),
    noLen = done(t, 6, 'Set b to zero');
  const half = done(t, 5, 'A passage half');
  const ratio = long ? 2 : half ? 0.5 : 1,
    beta = noLen ? 0 : 0.75,
    factor = bm25Term(1, ratio, 1.2, beta);
  head(c, 'BM25  /  one code occurrence', 'Change the passage length');
  label(c, 'AVERAGE PASSAGE', 70, 220);
  rect(c, 69, 253, 270, 35, '#bcc5b4');
  label(c, 'THIS PASSAGE', 70, 346);
  rect(c, 69, 378, 270 * ratio, 53, teal);
  label(c, 'L / avg = ' + ratio, 69, 476, 24, ink);
  plate(c, 680, 183, 456, 354);
  label(c, 'k₁ = 1.2    f = 1    b = ' + beta, 710, 231, 18);
  text(c, 'f × (k₁ + 1)', 897, 295, 24, ink, { align: 'center' });
  line(
    c,
    [
      [722, 322],
      [1100, 322],
    ],
    ink,
  );
  text(c, 'f + k₁ × (1 − b + b × L/avg)', 908, 356, 23, ink, { align: 'center' });
  const lengthResult =
    noLen ||
    (long ? done(t, 6, 'The denominator grew') : !half || done(t, 5, 'Less text surrounds'));
  if (lengthResult) label(c, 'TF factor    ' + factor.toFixed(3), 710, 421, 22, teal);
  if (done(t, 6, 'Multiply the factor'))
    label(c, 'IDF × TF ≈ ' + (idf * factor).toFixed(3), 710, 477, 21, teal);
  if (b === 7) label(c, 'IDF population   ·   Luna’s three eligible passages', 69, 592, 21, muted);
}

export function sparse(c, t) {
  field(c, true);
  head(c, 'Learned sparse retrieval', 'A posting for “credential”', true);
  const doubled = done(t, 2, 'Change the first'),
    a = expansion(doubled ? 3 : -2),
    clip = done(t, 0, 'Clip minus'),
    logged = done(t, 1, 'Now each'),
    pool = done(t, 2, 'Adding both'),
    reveal = done(t, 3, 'The maximum');
  label(c, 'INPUT POSITION', 66, 200, 16, steel);
  label(c, 'LOGIT', 360, 200, 16, steel);
  label(c, 'AFTER ReLU', 577, 200, 16, steel);
  label(c, 'ln(1 + ReLU)', 851, 200, 16, steel);
  ['refresh', 'key'].forEach((s, i) => {
    const y = 280 + i * 105;
    box(c, 65, y - 31, 212, 62, 5, '#254952', steel, 1);
    text(c, s, 89, y, 30, white, { family: 'Mono' });
    label(c, a.logits[i], 386, y, 33, peach, 'center');
    if (clip) {
      arrow(c, 447, y, 530, y, steel);
      label(c, a.positive[i], 636, y, 33, mint, 'center');
    }
    if (logged) {
      arrow(c, 698, y, 803, y, steel);
      label(c, a.weights[i].toFixed(3), 921, y, 33, mint, 'center');
    }
  });
  line(
    c,
    [
      [65, 451],
      [1130, 451],
    ],
    steel,
  );
  if (pool) {
    const ready = !doubled || reveal;
    label(c, 'Sum pooling', 67, 507, 21, white);
    label(c, 'Max pooling', 645, 507, 21, white);
    label(c, ready ? 'weight ≈ ' + a.sum.toFixed(3) : 'weight   ?', 67, 560, 27, mint);
    label(c, ready ? 'weight ≈ ' + a.max.toFixed(3) : 'weight   ?', 645, 560, 27, mint);
  } else label(c, 'Vocabulary coordinate   /   credential', 67, 520, 24, mint);
}
