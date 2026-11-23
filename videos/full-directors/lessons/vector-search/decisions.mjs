import {
  P,
  text,
  line,
  rect,
  title,
  footer,
  chip,
  pair,
  caption,
  heading,
  row,
  lerp,
  arrow,
  cue,
  on,
  done,
} from './plates.mjs';
import {
  QUERY,
  pt,
  d2,
  nearD,
  exact,
  ids,
  filing,
  trial,
  overlap,
  foundFive,
  exactFive,
  records,
  metricQuery,
  unit,
  metric,
  emptyIndependent,
  emptyShared,
  arrivals,
  regions,
} from './examples.mjs';
import { field } from './neighborhood.mjs';

function selectRegion(c, k) {
  const wide = on(k, 1, 'Now the second EU'),
    n = wide ? 5 : 3,
    eligible = regions.slice(0, n).filter((id) => id.startsWith('EU'));
  title(
    c,
    'Will the EU runbooks fill two slots?',
    'Filtered search   /   trusted retrieval service',
  );
  caption(c, 'Candidate window', 49, 151);
  rect(c, 45, 186, n * 126 + 9, 100, P.lagoon, P.sea);
  regions.forEach((id, i) => {
    const active = i < n,
      x = 55 + i * 126;
    rect(c, x, 204, 115, 62, active ? P.white : P.paper, P.grid);
    text(c, id, x + 57, 235, 21, active ? P.ink : P.dim, 'center', 'Mono');
  });
  line(c, 695, 125, 695, 400, P.rust, 2, [6, 4]);
  heading(c, 'Application', 730, 151);
  eligible.forEach((id, i) => {
    rect(c, 733, 194 + i * 83, 172, 62, P.sea);
    text(c, id, 819, 225 + i * 83, 23, P.paper, 'center', 'Mono');
  });
  caption(c, eligible.length + ' of 2 eligible hits', 729, 388);
  footer(c, 'An access rule belongs inside the trusted service, before any passage leaves.');
}
function emptyWindow(c, k, b) {
  const a = on(k, 3, 'If the whole window'),
    shared = on(k, 3, 'Same average');
  title(
    c,
    'How often does a hundred-record window come up empty?',
    'Filter selectivity   /   two models with the same mean',
  );
  heading(c, '100 candidates × 0.5% = 0.5 expected matches', 40, 137);
  const labels = ['Independent matches', 'One shared region'],
    vals = [emptyIndependent, emptyShared],
    show = [a, shared];
  labels.forEach((label, i) => {
    let y = 224 + i * 109;
    text(c, label, 47, y, 21);
    rect(c, 343, y - 12, 411, 24, P.grid);
    if (show[i]) {
      rect(c, 343, y - 12, 411 * vals[i], 24, i ? P.berry : P.sea);
      text(c, (100 * vals[i]).toFixed(1) + '%', 795, y, 24, i ? P.berry : P.sea, 'left', 'Mono');
    }
    text(
      c,
      i ? 'P(empty) = 1 − 0.005' : 'P(empty) = (1 − 0.005)¹⁰⁰',
      343,
      y + 36,
      17,
      P.dim,
      'left',
      'Mono',
    );
  });
  footer(
    c,
    b === 2
      ? 'For independent draws, every candidate must fail for the whole window to be empty.'
      : 'A shared region can make the entire window pass or fail together.',
  );
}
function residency(c, k) {
  title(c, 'Where do the bytes live?', 'When the corpus outgrows RAM');
  const s = on(k, 4, 'An SSD-backed graph'),
    shards = on(k, 4, 'Or split');
  heading(c, 'RAM', 48, 153);
  heading(c, 'SSD', 342, 153);
  heading(c, 'Machines', 672, 153);
  for (let i = 0; i < 24; i++)
    rect(c, 49 + (i % 6) * 34, 194 + Math.floor(i / 6) * 24, 28, 17, P.sea);
  text(c, 'IVF + product codes', 48, 332, 18);
  if (s) {
    rect(c, 339, 189, 206, 104, P.pale, P.dim);
    for (let i = 0; i < 4; i++) {
      rect(c, 355 + i * 43, 209, 31, 55, P.blue);
      for (let pin = 0; pin < 4; pin++) rect(c, 359 + i * 43 + pin * 6, 265, 3, 8, P.rust);
    }
    text(c, 'Disk-backed graph', 340, 332, 18);
  }
  if (shards) {
    for (let i = 0; i < 3; i++) {
      rect(c, 669 + i * 69, 195, 55, 98, P.white, P.ink);
      for (let j = 0; j < 3; j++) {
        line(c, 678 + i * 69, 211 + j * 20, 710 + i * 69, 211 + j * 20, P.dim, 2);
      }
    }
    text(c, 'Disjoint shards', 672, 332, 18);
  }
  footer(c, 'Storage reads add latency. Sharding makes a full answer depend on several replies.');
}
function shards(c, k, b) {
  const missing = on(k, 5, 'only forty-five'),
    timing = b >= 7;
  if (timing) {
    title(c, 'When is a full answer ready?', 'Distributed search   /   wait for required shards');
    const start = 131,
      step = 42;
    arrivals.forEach((a, i) => {
      const y = 136 + i * 27;
      text(c, 'S' + (i + 1), 52, y, 14, P.dim, 'left', 'Mono');
      rect(c, start, y - 5, a * step, 10, i === 9 ? P.berry : P.sea);
    });
    const slow = start + Math.max(...arrivals) * step;
    line(c, slow, 117, slow, 397, P.berry, 1.2, [4, 4]);
    rect(c, slow, 390, step * 1.3, 12, P.rust);
    text(c, 'remaining merge', slow + 69, 398, 15, P.rust);
    if (b === 8) {
      heading(c, 'Ten independent replies', 655, 176);
      text(c, '0.99¹⁰', 656, 242, 37, P.ink, 'left', 'Serif');
      if (on(k, 8, 'Shared queues'))
        text(c, '≈ ' + (100 * 0.99 ** 10).toFixed(1) + '%', 655, 312, 32, P.sea, 'left', 'Mono');
    }
    footer(
      c,
      b === 7
        ? 'Illustrative arrival times. Some merge work can finish while shards are running.'
        : 'The product assumes independent threshold events. Measure shared delays at load.',
    );
    return;
  }
  title(
    c,
    'Which candidates can the broker guarantee?',
    'Distributed top five   /   exact local rankings and a common tie rule',
  );
  const n = missing ? 9 : 10;
  for (let i = 0; i < 10; i++) {
    const x = 50 + (i % 5) * 118,
      y = 163 + Math.floor(i / 5) * 110;
    caption(c, 'Shard ' + (i + 1), x, y);
    for (let j = 0; j < 5; j++)
      rect(c, x + j * 15, y + 23, 12, 39, i < n ? P.sea : P.paper, i < n ? P.sea : P.grid);
  }
  heading(c, 'At the broker', 675, 157);
  text(c, n * 5, 671, 241, 66, missing ? P.berry : P.sea, 'left', 'Serif');
  text(c, 'candidates', 675, 304, 21);
  footer(
    c,
    missing
      ? 'Nine replies give a partial result. An omitted shard may own a global winner.'
      : 'A locally sixth record already has five predecessors. It cannot enter the global five.',
  );
}
function traversal(c, k, b) {
  const x = [160, 423, 700],
    y = [267, 189, 283],
    visible = on(k, 9, 'to reach B');
  title(
    c,
    'Can the graph cross a filtered passage?',
    'Trusted traversal   /   return only eligible IDs',
  );
  line(c, x[0], y[0], x[1], y[1], P.sea, 4);
  line(c, x[1], y[1], x[2], y[2], visible ? P.sea : P.grid, 4);
  ['A', 'M', 'B'].forEach((id, i) => {
    chip(c, id, x[i], y[i], i === 1 ? P.dim : P.sea, 24);
    text(
      c,
      i === 1 ? 'ineligible bridge' : 'eligible passage',
      x[i],
      y[i] + 56,
      18,
      P.ink,
      'center',
    );
  });
  if (visible) text(c, 'Returned     A   B', 415, 388, 20, P.sea, 'center', 'Mono');
  footer(
    c,
    b === 10
      ? 'For a small eligible set, compare with an exact scan under the same filter.'
      : 'The service can visit M to reach B while withholding M from the returned records.',
  );
}
export function distributed(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 1) return selectRegion(c, k);
  if (b <= 3) return emptyWindow(c, k, b);
  if (b === 4) return residency(c, k);
  if (b <= 8) return shards(c, k, b);
  return traversal(c, k, b);
}
export function migration(c, k) {
  const b = k.beat.beatIndex + 1,
    norm = b >= 2,
    moved = cue(k, 2, 'Normalize both records', 1.5),
    zoom = cue(k, 2, 'Magnify those directions', 1.25);
  const deleted = on(k, 4, 'Ask for two'),
    rawKnown = on(k, 1, 'Now suppose'),
    reveal = on(k, 3, 'That changes the winner');
  title(
    c,
    deleted
      ? 'Which IDs survive the delete?'
      : norm
        ? 'Which direction matches the query?'
        : 'Which vector is nearest in raw coordinates?',
    deleted
      ? 'Metric migration   /   one record remains'
      : 'Metric migration   /   two nonzero records',
  );
  const ox = 74,
    oy = 366,
    scale = lerp(42, 214, zoom);
  const project = (p) => {
    const v = unit(p);
    return [ox + scale * lerp(p.x, v.x, moved), oy - scale * lerp(p.y, v.y, moved)];
  };
  line(c, ox, oy, 555, oy, P.dim);
  line(c, ox, oy, ox, 121, P.dim);
  if (zoom) {
    c.beginPath();
    c.arc(ox, oy, scale, -Math.PI / 2, 0);
    c.strokeStyle = P.grid;
    c.lineWidth = 1.4;
    c.stroke();
  }
  [...records, metricQuery].forEach((p, i) => {
    if (deleted && i === 0) return;
    const e = project(p),
      co = [P.berry, P.sea, '#ab7109'][i];
    arrow(c, [ox, oy], e, co, 2.8);
    const dy = [21, -16, norm ? -16 : 32][i],
      dx = i === 2 ? 21 : 0;
    text(c, i === 2 ? 'query' : String(p.id), e[0] + dx, e[1] + dy, 16, co, 'center', 'Mono', 600);
  });
  heading(c, norm ? 'Unit-vector inner product' : 'Raw squared L2', 569, 146);
  if (!norm || reveal) {
    const ordered = norm || rawKnown ? metric(norm, deleted) : records;
    ordered.forEach((r, i) =>
      row(
        c,
        568,
        209 + i * 66,
        'Record ' + r.id,
        norm || rawKnown ? r.score.toFixed(norm ? 3 : 2) : '?',
        332,
        i === 0 ? P.sea : P.ink,
      ),
    );
    if (deleted) row(c, 568, 275, 'Empty second slot', '−1', 332);
  } else {
    row(c, 568, 217, 'Normalize database', 'x / length(x)', 350);
    row(c, 568, 287, 'Normalize query', 'q / length(q)', 350);
  }
  if (reveal && !deleted) caption(c, 'Higher similarity ranks first', 569, 383);
  footer(
    c,
    deleted
      ? 'Check all replicas and old serving paths against this revised exact reference.'
      : reveal
        ? 'Normalize training data, records and queries. Retrain IVF centers and refile the records.'
        : norm
          ? 'Both records and the query keep their direction as they move to unit length.'
          : 'Query (1, 0.1)       Record 101 (10, 0)       Record 202 (1, 1)',
  );
}
function practice(c, k) {
  const resolved = on(k, 2, 'The time clears'),
    hits = overlap(exactFive, foundFive);
  title(
    c,
    'Would you accept this held-out run?',
    'Practice   /   recall ≥ 90% and response ≤ 20 ms',
  );
  ['Exact five', 'Returned five'].forEach((s, j) => {
    const y = 206 + j * 103;
    heading(c, s, 41, y);
    (j ? foundFive : exactFive).forEach((id, i) => {
      rect(
        c,
        242 + i * 131,
        y - 32,
        104,
        63,
        resolved
          ? exactFive.includes(id) && foundFive.includes(id)
            ? P.lagoon
            : P.blush
          : P.white,
        P.grid,
      );
      text(c, id, 294 + i * 131, y, 26, P.ink, 'center', 'Mono');
    });
  });
  caption(c, 'Measured response   12 ms', 45, 402);
  footer(
    c,
    resolved
      ? hits + ' / 5 = 80%. Hold this run. Its time clears the limit, but recall falls short.'
      : 'Match the IDs, count the overlap, and apply both limits.',
  );
}
function nearDTrial(c, k) {
  const moved = cue(k, 3, 'Move the query', 1.6),
    q = { x: lerp(QUERY.x, nearD.x, moved), y: lerp(QUERY.y, nearD.y, moved) };
  const read = on(k, 3, 'An exact audit'),
    audit = done(k, 3),
    answer = on(k, 5, 'B scores');
  title(
    c,
    'Would a second list change this pair?',
    'Rollback corpus   /   all six passages eligible',
  );
  field(c, {
    q,
    scale: 41,
    center: { x: 5.3, y: 4.9 },
    division: 1,
    centers: true,
    marked: answer ? trial(1).runs[1].ids : [],
  });
  if (moved < 1) {
    pair(c, filing(1).answer, 575, 208, 'Previous border result');
    caption(c, moved ? 'Moving the query toward D' : 'One list opened at the border', 574, 335);
    footer(c, 'Keep the six passage coordinates and both list centers fixed.');
    return;
  }
  heading(c, 'Right list', 574, 139);
  ids(read ? exact(filing(1, nearD).read, 3, nearD) : filing(1, nearD).read).forEach((id, i) =>
    row(c, 574, 183 + i * 48, 'Passage ' + id, read ? d2(pt(id), nearD) : '?', 333),
  );
  row(
    c,
    574,
    350,
    audit ? 'Closest on left   A' : 'Closest on left',
    audit ? d2(pt('A'), nearD) : '?',
    333,
    P.sea,
  );
  footer(
    c,
    answer
      ? 'Keep D and B. Even A, the best left-hand candidate, is farther than B.'
      : 'Compare the second-best right-hand distance with the best possible left-hand distance.',
  );
}
function compare(c) {
  title(
    c,
    'Which trial meets both release limits?',
    'Two-query comparison   /   supplied workload p95',
  );
  const xs = [70, 259, 437, 624, 831];
  ['Lists', 'Border', 'Near D', 'Mean recall', 'p95'].forEach((v, i) =>
    text(c, v, xs[i], 151, 18, P.dim, 'center'),
  );
  [1, 2].forEach((n, j) => {
    const t = trial(n),
      y = 230 + j * 96;
    line(c, 38, y + 38, 921, y + 38, P.grid);
    [n, ...t.runs.map((r) => r.recall * 2 + ' / 2'), '?', t.p95 + ' ms'].forEach(
      (v, i) => text(c, v, xs[i], y, 26, P.ink, 'center', 'Mono'),
    );
  });
  footer(c, 'Required mean recall ≥ 90%     ·     Required workload p95 ≤ 20 ms');
}
export function finish(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2) return practice(c, k);
  if (b <= 5) return nearDTrial(c, k);
  if (b === 6) return compare(c);
  const opening = cue(k, 7, 'Open the adjoining list', 1.15),
    read = on(k, 7, 'B replaces C'),
    replaced = on(k, 7, 'Near D the pair'),
    t = trial(replaced ? 2 : 1),
    sample = t.runs[0],
    f = filing(opening === 1 ? 2 : 1);
  title(
    c,
    'What did the extra probe buy?',
    'Release replay   /   same border request and workload',
  );
  field(c, {
    x: 32,
    y: 117,
    w: 456,
    h: 270,
    scale: 113,
    division: 1,
    rightCover: 1 - opening,
    rim: sample.ids[1],
    marked: replaced ? ['B'] : [],
  });
  text(c, opening === 1 ? 'Both lists open' : 'Left list open', 43, 139, 15, P.ink, 'left', 'Mono');
  caption(
    c,
    (read && !replaced ? 'Previous pair   ' : 'Border result   ') + sample.ids.join('  '),
    43,
    413,
  );
  text(
    c,
    'B   ' + (read ? 'd² ' + d2(pt('B')) : 'unscored'),
    465,
    414,
    15,
    read ? P.sea : P.dim,
    'right',
    'Mono',
  );
  heading(c, (replaced ? 'Two-list' : 'One-list') + ' trial on both queries', 523, 140);
  row(c, 523, 187, 'Border matches', sample.recall * 2 + ' / 2', 384);
  row(c, 523, 232, 'Near D   ·   D and B', t.runs[1].recall * 2 + ' / 2', 384);
  row(c, 523, 277, 'Mean recall   ≥ 90%', t.mean * 100 + '%', 384, t.pass ? P.sea : P.berry);
  caption(c, 'Workload p95', 523, 325);
  const x = 524,
    y = 366,
    ms = 16;
  rect(c, x, y - 6, 22 * ms, 12, P.grid);
  rect(c, x, y - 6, t.p95 * ms, 12, P.sea);
  line(c, x + 20 * ms, y - 25, x + 20 * ms, y + 20, P.rust, 2);
  text(c, '20 ms', x + 20 * ms, 405, 15, P.rust, 'center', 'Mono');
  text(c, t.p95 + ' ms', x + t.p95 * ms, 339, 17, P.sea, 'center', 'Mono');
  footer(
    c,
    replaced
      ? 'Two lists recover B at the border. Workload p95 leaves ' +
          (20 - t.p95) +
          ' ms under budget.'
      : f.opened.length +
          ' list' +
          (f.opened.length === 1 ? '' : 's') +
          ' open   ·   prior one-list trial recovered three of four exact IDs.',
  );
}
