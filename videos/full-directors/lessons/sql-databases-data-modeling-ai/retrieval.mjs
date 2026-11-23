import {
  ground,
  title,
  book,
  ticket,
  heading,
  stamp,
  line,
  stitch,
  dot,
  arrow,
  txt,
  ledger,
  cue,
  mix,
  ink,
  chalk,
  teal,
  rust,
  gold,
  coral,
  mint,
  faint,
  serif,
  mono,
} from './atelier.mjs';
import {
  scanGrants,
  corpus,
  locale,
  validityDates,
  chunks,
  orderedGrants,
  before,
  candidates,
  exact,
  scanResults,
  graphWalk,
  recall,
  turnVector,
  cosine,
  savedHit,
  replayHit,
  terms,
  labels,
  hit,
  joinedRows,
  asOf,
  age,
  deadlineDays,
  freshRequest,
} from './counter-model.mjs';
import { hungCoat } from './archive.mjs';
import { septemberGrants } from '../../../films/sql-databases-data-modeling-ai/model.mjs';
export function indexPath(c, k) {
  const b = k.beat.beatIndex;
  ground(c, 'wood');
  title(c, 'HARBOR  /  READER INDEX', 'Where does the search begin for Bob?');
  const build = cue(k, 0, 'index ordered by reader', 3.1),
    seek = cue(k, 0, 'seek the start', 0, 'Now seek the start'),
    eligible = cue(k, 2, 'You can read both IDs', 0);
  const entries = Math.ceil(build * orderedGrants.length);
  const left = 124,
    middle = 680,
    right = 1250;
  const rowY = (i) => 393 + 64 * i;
  function grantRow(grant, x, i, fill, note = '') {
    const y = rowY(i);
    ticket(c, x, y, 496, 55, fill);
    txt(c, grant.reader, x + 45, y + 38, 31, ink, serif);
    txt(c, grant.id, x + 174, y + 38, 29, teal, mono);
    if (note) txt(c, note, x + 477, y + 38, 25, rust, serif, 'right', 152);
  }
  heading(c, 'Permission table', left, 325, 495);
  heading(c, 'Index (reader, chunk)', middle, 325, 500);
  const activeGrant = build > 0 && build < 1 ? orderedGrants[entries - 1] : undefined;
  scanGrants.forEach((g, i) => grantRow(g, left, i, g === activeGrant ? '#f4d396' : '#efdfbc'));
  orderedGrants.slice(0, entries).forEach((g, i) => {
    const fill = g === activeGrant ? '#f4d396' : seek && g.reader === 'Bob' ? '#c6dec2' : '#d9cfb8';
    let note = '';
    if (g.reader === 'Bob' && g.id === 'c7-old' && cue(k, 2, 'Another belongs', 0))
      note = 'Ended Jul 1';
    if (g.reader === 'Bob' && g.id === 'c99' && cue(k, 2, 'The same two', 0)) note = 'Birch';
    grantRow(g, middle, i, note ? '#e8c4b0' : fill, note);
  });
  if (seek) {
    const bob = orderedGrants.filter((g) => g.reader === 'Bob');
    const top = rowY(orderedGrants.indexOf(bob[0]));
    const bottom = rowY(orderedGrants.indexOf(bob.at(-1))) + 55;
    line(c, middle + 506, top, middle + 506, bottom, mint, 5);
    heading(c, bob.length + ' candidate grants', middle, 861, 503);
  }
  if (eligible) {
    heading(c, 'After store and date checks', right, 325, 552);
    before.forEach((id, i) => {
      const y = 401 + i * 200,
        paragraph = chunks.find((r) => r.id === id);
      ticket(c, right, y, 546, 174, '#c6dec2');
      txt(c, id, right + 46, y + 55, 35, teal, mono);
      const lines = paragraph.text.match(/.{1,23}(?:\s|$)/gu);
      lines.forEach((line, n) => txt(c, line.trim(), right + 47, y + 108 + n * 42, 34, ink, serif));
    });
  }
  if (b === 4) heading(c, 'Benchmark the plan on representative data.', left, 272, 1650);
}
export function plans(c, k) {
  const b = k.beat.beatIndex;
  ground(c, 'slate');
  title(
    c,
    'QUERY PLANS  /  SQLITE & POSTGRESQL',
    b < 4 ? 'What does SQLite read, and what does it sort?' : 'What happens when a plan executes?',
  );
  if (b < 2) {
    const s = cue(k, 0, 'His entry already'),
      d = cue(k, 0, 'Its document ID'),
      sort = cue(k, 1, 'temporary B-tree');
    const entries = [
      ['SEARCH p USING COVERING INDEX', 'principal = Bob', 'c7a'],
      ['SEARCH c USING INDEX', 'chunk = c7a', 'd7'],
      ['SEARCH d USING INDEX', 'document = d7', 'Return Policy'],
      ['USE TEMP B-TREE', 'ORDER BY', 'ordered rows'],
    ];
    ledger(
      c,
      118,
      293,
      [756, 488, 425],
      ['SQLite operation', 'Operand', 'One path'],
      entries.map(([op, v, r], i) => [op, v, [s, d, d, sort][i] ? r : '']),
      { rowH: 101, font: 36 },
    );
  } else if (b < 4) {
    ledger(
      c,
      123,
      331,
      [495, 555, 610],
      ['SCAN', 'SEARCH by reader', 'After time and workspace'],
      [['7 grant rows', '4 Bob candidates', 'c7a   c7b']],
      { caption: 'Logical selectivity', rowH: 115, font: 40 },
    );
    txt(c, 're', 178, 815, 74, chalk, mono);
    txt(c, 'turn', 269, 815, 74, gold, mono);
    line(c, 270, 837, 450, 837, gold, 4);
    heading(c, 'An interior substring is a separate lookup.', 551, 798, 1180);
  } else {
    const execute = cue(k, 4, 'EXPLAIN ANALYZE runs'),
      mail = cue(k, 5, 'and it arrives'),
      rollback = cue(k, 5, 'Now roll back');
    book(c, 122, 333, 810, 452, 'Document title', 'TRANSACTION   ·   UPDATE');
    txt(c, execute && !rollback ? 'Coat Returns' : 'Return Policy', 176, 606, 55, ink, serif);
    txt(
      c,
      rollback ? 'ROLLBACK' : execute ? 'EXPLAIN ANALYZE' : 'EXPLAIN',
      176,
      712,
      34,
      teal,
      mono,
    );
    ticket(c, 1085, 409, 675, 284);
    txt(c, 'Recipient inbox', 1140, 489, 48, ink, serif);
    txt(c, mail ? '1 email received' : 'Empty', 1140, 610, 50, mail ? rust : faint, serif);
    heading(
      c,
      b === 6
        ? 'Compare identical results, page reads and execution times.'
        : 'The database transaction covers the title change.',
      129,
      850,
    );
  }
}
const fmt = (x) => x.toFixed(3).replace('-', '−');
function axes(c, x, y, scale, extent = 3.5) {
  const span = scale * extent;
  for (let i = -Math.floor(extent); i <= Math.floor(extent); i++) {
    line(c, x + i * scale, y - span, x + i * scale, y + span, '#c1d6d21a', 2);
    line(c, x - span, y + i * scale, x + span, y + i * scale, '#c1d6d21a', 2);
  }
  arrow(c, x - span, y, x + span + 12, y, '#c1d6d2', 3);
  arrow(c, x, y + span, x, y - span - 12, '#c1d6d2', 3);
  dot(c, x, y, 5, chalk);
}
function circle(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.strokeStyle = color;
  c.lineWidth = 3;
  c.stroke();
}
function rankSheet(c, k) {
  const checked = {
    workspace: cue(k, 4, 'The next is retired', 0),
    retired: cue(k, 4, 'The staff rule', 0),
    reader: cue(k, 4, 'The request needs two', 0),
    allowed: k.beat.beatIndex > 4 || (k.beat.beatIndex === 4 && k.elapsed >= k.speechDuration),
  };
  const reasons = {
    workspace: 'Birch',
    retired: 'Retired',
    reader: 'No Bob grant',
    allowed: 'Eligible',
  };
  const sources = joinedRows(true);
  const rows = candidates.map((r) => [
    r.chunk + ' · ' + locale(sources.find((row) => row.id === r.chunk).source.workspace),
    fmt(r.score),
    !checked[r.reason] ? '' : r.allowed && !exact.includes(r) ? 'Limit reached' : reasons[r.reason],
  ]);
  ledger(c, 996, 276, [341, 170, 286], ['Chunk · store', 'Cosine', 'Request test'], rows, {
    rowH: 72,
    font: 33,
  });
}
export function meaning(c, k) {
  const b = k.beat.beatIndex;
  ground(c, 'slate');
  title(
    c,
    'HARBOR  /  HAND-CHOSEN EMBEDDINGS',
    b < 4
      ? 'Which direction best matches the question?'
      : b < 6
        ? 'Can Bob quote the nearest paragraph?'
        : 'Which evidence produced this hit?',
  );
  const q = [1, 0],
    birch = candidates[0],
    length = Math.hypot(...birch.vector);
  if (b < 6) {
    const norm = cue(k, 2, 'tip moves onto the unit circle', 1.5),
      proj = cue(k, 2, 'drop the tip', 1, 'Now drop the tip'),
      all = cue(k, 3, 'Place the other tips', 1.4);
    const unitScale = mix(85, 208, norm),
      v = birch.vector.map((n) => mix(n, n / length, norm)),
      cx = 496,
      cy = 610;
    axes(c, cx, cy, unitScale, norm === 1 ? 1.45 : Math.min(3.5, 303 / unitScale));
    circle(c, cx, cy, unitScale, '#c8d0b0');
    const xx = cx + unitScale * v[0],
      yy = cy - unitScale * v[1];
    arrow(c, cx, cy, cx + unitScale * q[0], cy, gold, 7);
    if (b >= 1) {
      arrow(c, cx, cy, xx, yy, mint, 7);
      dot(c, xx, yy, 8, mint);
      txt(c, 'c99', xx + 13, yy - 13, 31, mint, mono);
    }
    if (proj) stitch(c, xx, yy, xx, mix(yy, cy, proj), gold);
    if (all)
      candidates.slice(1).forEach((r, i) => {
        if (all > i / 5) {
          const n = Math.hypot(...r.vector);
          dot(c, cx + (unitScale * r.vector[0]) / n, cy - (unitScale * r.vector[1]) / n, 9, chalk);
        }
      });
    if (b < 3) {
      book(
        c,
        989,
        316,
        793,
        454,
        b === 0 ? 'The coat question' : 'Birch · c99',
        b === 0 ? 'EXACT PHRASE SEARCH' : 'VECTOR   (3, 1)',
      );
      if (b === 0) {
        txt(c, '“Can I take this coat back?”', 1039, 574, 45, ink, serif, 'left', 693);
        txt(c, '0 literal matches', 1041, 682, 37, teal, mono);
      } else {
        txt(c, norm ? '(3, 1) / √10' : 'Three right, one up', 1040, 563, 48, ink, serif);
        if (proj)
          txt(
            c,
            'Horizontal projection   ' + fmt(birch.score),
            1040,
            680,
            33,
            teal,
            mono,
            'left',
            694,
          );
      }
    } else rankSheet(c, k);
    if (b === 5) heading(c, 'A short approximate scan can exhaust its candidates.', 128, 931);
  } else {
    const win = exact[0];
    editionTrace(c, win.chunk, win.id, 'd7-next');
    heading(c, 'Replay also needs dataset, model, policy time, corpus and settings.', 127, 894);
  }
}
function editionTrace(c, id, emb, doc) {
  [
    [emb, 'Embedding'],
    [id, 'Paragraph'],
    [doc, 'Source edition'],
  ].forEach(([value, name], i) => {
    const x = 120 + i * 586;
    ticket(c, x, 403, 473, 232);
    txt(c, name, x + 47, 478, 39, faint, serif);
    txt(c, value, x + 48, 574, 52, teal, mono, 'left', 391);
    if (i < 2) arrow(c, x + 483, 522, x + 566, 522, gold, 6);
  });
}
export function vectorTurn(c, k) {
  const b = k.beat.beatIndex;
  ground(c, 'slate');
  title(
    c,
    'HARBOR  /  PGVECTOR',
    b < 5
      ? 'Turn the query. Keep the paragraph still.'
      : 'Can two returned rows miss a nearer match?',
  );
  if (b < 5) {
    const row = candidates.find((r) => r.chunk === 'c7e'),
      t = cue(k, 0, 'Turn the query upward', 1.8);
    const q = turnVector(t),
      sim = cosine(q, row.vector),
      cx = 509,
      cy = 633,
      sz = 86;
    axes(c, cx, cy, sz, 3.25);
    arrow(c, cx, cy, cx + sz * row.vector[0], cy - sz * row.vector[1], mint, 8);
    txt(
      c,
      'c7e  (−1, 3)',
      cx + sz * row.vector[0] - 14,
      cy - 3 * sz - 27,
      34,
      mint,
      mono,
      'center',
    );
    const qx = cx + sz * q[0],
      qy = cy - sz * q[1];
    arrow(c, cx, cy, qx, qy, gold, 8);
    txt(c, 'q', qx + 22, qy + 5, 40, gold, serif);
    book(
      c,
      982,
      307,
      813,
      490,
      b >= 3 ? 'Encoder contract' : 'Cosine similarity',
      b >= 3 ? 'E1-c7e  ·  c7e  ·  Aug 12' : 'HAND-CHOSEN   ·   TWO DIMENSIONS',
    );
    if (b < 3) {
      txt(
        c,
        b === 0
          ? 'q = ' + (t === 1 ? '(0, 2)' : t === 0 ? '(1, 0)' : 'turning')
          : '(0 × −1 + 2 × 3) / (2√10)',
        1034,
        548,
        42,
        ink,
        mono,
        'left',
        703,
      );
      if (b === 2 || (b === 1 && k.elapsed >= k.speechDuration))
        txt(c, 'Similarity     ' + fmt(sim), 1034, 645, 37, teal, mono);
      if (cue(k, 2, 'Smaller distances', 0))
        txt(c, 'Distance       ' + fmt(1 - sim), 1034, 718, 37, rust, mono);
    } else {
      txt(c, 'query encoder ↔ document encoder', 1036, 550, 36, ink, serif, 'left', 707);
      txt(c, 'Comparable space · equal dimension', 1036, 632, 34, teal, serif, 'left', 704);
      txt(c, 'Nonzero vectors  /  pinned model', 1036, 708, 28, faint, mono, 'left', 704);
    }
  } else {
    const inspect = cue(k, 5, 'Inspect these first three', 1.4),
      verdict = cue(k, 7, 'Iterative scans', 0),
      extended = cue(k, 7, 'Continue the scan', 1.6);
    const n = Math.floor(3 * inspect) + Math.floor(2 * extended),
      found = scanResults(n),
      data = corpus(true);
    const xs = [270, 610, 950, 1290, 1630],
      ys = [430, 350, 444, 355, 431];
    txt(c, 'One possible HNSW visit order', 119, 263, 34, mint, mono);
    txt(c, 'Bob  /  Harbor  /  Aug 12, noon', 1797, 263, 30, gold, mono, 'right');
    for (let i = 1; i < graphWalk.length; i++)
      line(c, xs[i - 1], ys[i - 1], xs[i], ys[i], i < n ? gold : '#657c81', 4);
    graphWalk.forEach((r, i) => {
      const seen = i < n;
      const col = !seen ? '#819393' : !verdict ? chalk : r.allowed ? mint : coral;
      dot(c, xs[i], ys[i], 42, col);
      txt(c, String(i + 1), xs[i], ys[i] + 14, 36, ink, mono, 'center');
      if (seen) {
        const source = data.documents.find(
          (d) => d.id === data.chunks.find((ch) => ch.id === r.chunk).document,
        );
        const readers = data.permissions
          .filter(([id]) => id === r.chunk)
          .map(([, reader]) => reader);
        ticket(c, xs[i] - 148, 521, 296, 187, '#e6d9ba');
        txt(c, r.chunk, xs[i], 565, 34, ink, mono, 'center');
        txt(
          c,
          locale(source.workspace) + '  ·  ' + readers.join(', '),
          xs[i],
          615,
          28,
          ink,
          serif,
          'center',
          260,
        );
        txt(c, validityDates(source), xs[i], 669, 25, teal, mono, 'center', 264);
      }
    });
    heading(c, 'Exact two', 130, 798, 430);
    txt(c, exact.map((r) => r.chunk).join('   '), 130, 882, 46, chalk, mono);
    heading(c, 'Returned', 698, 798, 630);
    const outcome = !verdict
      ? 'Pending'
      : found.length
        ? found.map((r) => r.chunk).join('   ')
        : 'No allowed rows';
    txt(c, outcome, 698, 882, 46, chalk, serif);
    if (b === 8 && k.elapsed >= k.speechDuration) {
      heading(c, 'Recall @ 2', 1428, 798, 378);
      txt(c, recall(found) * 2 + ' / 2', 1428, 882, 46, gold, mono);
    }
  }
}
export function history(c, k) {
  const b = k.beat.beatIndex;
  ground(c, 'slate');
  title(
    c,
    'EVALUATION ARCHIVE  /  RUN R1',
    b < 4
      ? 'Can the saved score still be reproduced?'
      : b < 7
        ? 'What did run R1 actually rank?'
        : 'Which labels score the same result?',
  );
  if (b < 4) {
    const overwritten = cue(k, 1, 'overwrite the stored vector', 0, 'What if we overwrite'),
      kept = cue(k, 1, 'Keep the original row', 0),
      versioned = cue(k, 2, 'new embedding ID', 0),
      changed = overwritten && !kept;
    const { stored, score, newer } = replayHit(changed, versioned);
    const link = changed ? cue(k, 1, 'Follow the old result', 1.1) : 0;
    const computed = !changed || (cue(k, 1, 'zero', 0) && cue(k, 1, 'If the old coordinates', 0));
    const missing = changed && cue(k, 1, 'missing', 0) && cue(k, 1, 'The saved score tells us', 0);
    book(c, 117, 311, 799, 490, 'Rank 1   ·   ' + savedHit.chunk, 'R1   /   QUERY  (' + savedHit.query.join(', ') + ')');
    txt(c, 'embedding_id    ' + savedHit.embedding, 170, 558, 36, ink, mono);
    txt(c, 'Saved score      ' + savedHit.score.toFixed(2), 170, 639, 36, teal, mono);
    if (missing) stamp(c, 'OLD VECTOR MISSING', 173, 703, rust, 541);
    const cx = 1322,
      cy = 613,
      s = 145;
    axes(c, cx, cy, s, 1.25);
    arrow(c, cx, cy, cx + s * savedHit.query[0], cy - s * savedHit.query[1], gold, 11);
    arrow(c, cx, cy, cx + s * stored[0], cy - s * stored[1], mint, 6);
    txt(c, 'Query (' + savedHit.query.join(', ') + ')', cx + s + 34, cy + 43, 30, gold, mono);
    heading(c, savedHit.embedding + '  (' + stored.join(', ') + ')', 1085, 321, 580);
    if (link) arrow(c, 940, 548, mix(945, 1081, link), 548, mint, 5);
    if (link === 1 && cue(k, 1, 'The lookup still works', 0) && cue(k, 1, 'but the arrows', 0))
      txt(c, 'ID found', 945, 600, 27, mint, mono);
    txt(c, 'Recomputed   ' + (computed ? score.toFixed(2) : '?'), 1052, 855, 41, chalk, mono);
    if (newer) heading(c, 'emb-18   (' + newer.join(', ') + ')   coat-v2', 120, 914);
  } else if (b < 7) {
    ledger(
      c,
      118,
      293,
      [204, 247, 310, 329, 289, 320],
      ['Run', 'Rank', 'Embedding', 'Chunk', 'Model', 'Cosine'],
      [
        ['R1', '1', 'emb-17', 'c7c', 'coat-v1', '1.00'],
        ['R1', '2', 'emb-12', 'c7d', 'coat-v1', cosine([1, 0], [3, 4]).toFixed(2)],
      ],
      { caption: 'Snapshot at R1   ·   dataset v1', rowH: 95, font: 35 },
    );
    txt(c, 'Created later:  emb-18    /    c7c    /    coat-v2', 126, 760, 38, gold, mono);
    heading(
      c,
      b === 6
        ? 'Save query, preprocessing, settings, policy time and corpus snapshot.'
        : 'One position per rank. One place per embedding per query.',
      127,
      893,
      1690,
    );
  } else {
    const result = savedHit.chunk,
      baseline = cue(k, 7, 'so it earned a hit', 0) && cue(k, 7, 'In a second dataset', 0),
      secondLabels = cue(k, 7, 'only the tags paragraph', 0),
      shown = b > 8 || (b === 8 && k.elapsed >= k.wordCue('zero').end);
    cue(k, 8, 'Bob’s first result', 0);
    labels.forEach((l, i) => {
      const x = 120 + 882 * i;
      book(c, x, 327, 776, 439, i ? 'Dataset v2' : 'Dataset v1', 'ONE QUERY   /   HIT AT ONE');
      txt(c, 'Retrieved', x + 49, 561, 32, faint, mono);
      txt(c, result + '   ' + terms[result], x + 260, 561, 36, ink, serif);
      txt(c, 'Relevant', x + 49, 632, 32, faint, mono);
      if (i === 0 || secondLabels) txt(c, l[0] + '   ' + terms[l[0]], x + 260, 632, 36, ink, serif);
      if (i === 0 ? baseline : shown)
        stamp(c, 'HIT @ 1  =  ' + hit(result, l), x + 53, 685, i ? rust : teal, 370);
    });
  }
}
export function closing(c, k) {
  ground(c, 'wood');
  title(c, 'HARBOR  /  AUG 12 AT NOON', 'Which citation goes on the return slip?');
  const joined = joinedRows(true),
    rows = ['c7a', 'c7c'].map((id) => joined.find((r) => r.id === id));
  const choose = cue(k, 1, 'The current Harbor paragraph'),
    calculate = cue(k, 1, 'At day eighteen', 0),
    outside = cue(k, 1, 'four days outside the window', 0);
  rows.forEach((r, i) => {
    const x = 117 + i * 558;
    book(c, x, 303, 502, 402, 'Return Policy', i ? 'AUGUST  /  d7-next' : 'JULY  /  d7');
    txt(c, 'Return items within', x + 48, 536, 37, ink, serif);
    txt(c, 'fourteen days.', x + 48, 588, 37, ink, serif);
    txt(c, r.id + '  →  ' + r.document, x + 48, 658, 34, teal, mono, 'left', 413);
    txt(
      c,
      (i ? 'From noon' : 'Ends at noon') + '   ·   Bob',
      x + 48,
      748,
      32,
      i ? mint : gold,
      mono,
      'left',
      438,
    );
  });
  const winner = rows.find(
      (r) => r.source.from <= asOf && (r.source.to === null || asOf < r.source.to),
    ),
    limit = deadlineDays.get(winner.text);
  line(c, 1232, 254, 1812, 254, gold, 8);
  hungCoat(c, 1520, 193, 0.78);
  ticket(c, 1280, 354, 487, 410);
  txt(c, 'HARBOR  /  BOB', 1331, 419, 29, teal, mono);
  txt(c, 'Return slip', 1330, 499, 55, ink, serif);
  stitch(c, 1325, 620, 1726, 620, faint);
  if (choose) {
    const x = mix(713, 1302, choose),
      y = mix(539, 535, choose);
    ticket(c, x, y, 436, 172, '#c9ddbd');
    txt(c, limit + ' days', x + 51, y + 69, 52, teal, serif);
    txt(c, winner.id + ' / ' + winner.document, x + 50, y + 133, 32, ink, mono, 'left', 356);
  }
  const origin = 153,
    unit = 47,
    endpoint = origin + age * unit;
  line(c, origin, 817, endpoint, 817, '#c0ad90', 5);
  for (let d = 0; d <= age; d++)
    line(c, origin + d * unit, 805, origin + d * unit, 821, '#d9c5a3', 2);
  txt(c, 'Purchase', origin, 854, 31, chalk, serif);
  txt(c, 'Return · day ' + age, endpoint, 854, 31, chalk, serif, 'center');
  if (choose) {
    line(c, origin, 797, origin + limit * unit, 797, mint, 8);
    dot(c, origin + limit * unit, 797, 9, mint);
    txt(c, limit + ' days', origin + limit * unit, 775, 35, mint, serif, 'center');
  }
  if (outside) line(c, origin + limit * unit, 797, endpoint, 797, gold, 8);
  if (calculate) {
    txt(
      c,
      age + ' − ' + limit + ' = ' + (outside ? age - limit + ' days late' : '?'),
      1204,
      849,
      54,
      chalk,
      serif,
      'left',
      591,
    );
  }
}
export function september(c, k) {
  const b = k.beat.beatIndex;
  ground(c);
  title(c, 'HARBOR  /  NEW PRACTICE FILE', 'What can Bob write on September first?');
  const travel = cue(k, 0, 'Move the request', 1.8),
    grant = cue(k, 2, 'Add Bob’s grant'),
    entered = cue(k, 2, 'on the slip', 0);
  const at = travel === 1 ? '2026-09-01' : '2026-08-31',
    result = freshRequest(at, grant > 0);
  const first = travel === 1,
    fieldDeadline = first && !entered ? undefined : result.deadline;
  heading(c, 'Effective intervals', 114, 280, 670);
  const t0 = 600,
    t1 = 845,
    end = 1110,
    probe = mix(t0, t1, travel);
  txt(c, 'Aug 31', t0, 359, 28, chalk, mono, 'center');
  txt(c, 'Sep 1', t1, 359, 28, chalk, mono, 'center');
  txt(c, 'Sep 2', end, 359, 28, chalk, mono, 'center');
  result.rows.forEach((r, i) => {
    const y = 427 + i * 91,
      old = r.id === 'old',
      start = r.start === '2026-09-01' ? t1 : 517;
    const rule = deadlineDays.has(r.text) ? deadlineDays.get(r.text) + ' days' : 'Receipt';
    txt(c, r.id, 116, y + 10, 34, chalk, mono);
    txt(c, rule, 220, y + 10, 33, chalk, serif);
    txt(c, r.workspace, 370, y + 8, 27, mint);
    const col = old && first ? '#9baaa5' : i === 3 ? coral : mint;
    line(c, start, y, old ? t1 - 12 : end, y, col, 8);
    if (old) {
      dot(c, t1, y, 12, col);
      dot(c, t1, y, 7, '#203e37');
    } else {
      arrow(c, end - 20, y, end, y, col, 5);
      if (start === t1) dot(c, t1, y, 10, col);
    }
  });
  stitch(c, probe, 380, probe, 752, gold);
  if (first) txt(c, 'old ends here', t1 - 22, 779, 25, gold, mono, 'right');
  book(c, 1219, 272, 577, 529, 'Return slip', 'BOB   /   ' + (first ? 'SEP 1' : 'AUG 31'));
  txt(c, 'Deadline', 1267, 503, 29, faint, mono);
  if (fieldDeadline) {
    txt(c, deadlineDays.get(fieldDeadline.text) + ' days', 1265, 573, 57, teal, serif);
    txt(
      c,
      fieldDeadline.id + ' / ' + fieldDeadline.document,
      1552,
      567,
      24,
      ink,
      mono,
      'left',
      201,
    );
  } else line(c, 1266, 581, 1738, 581, '#a49b81', 2);
  txt(c, 'Receipt', 1267, 663, 29, faint, mono);
  if (first && cue(k, 1, 'ask for the receipt', 0.65, 'He can ask for the receipt'))
    txt(c, 'Bring receipt   ·   c81', 1265, 739, 37, teal, serif, 'left', 487);
  else line(c, 1266, 744, 1738, 744, '#a49b81', 2);
  // Adding one permission keeps the four existing grant rows in place.
  const grants = septemberGrants(grant > 0);
  heading(c, 'Permission rows', 117, 785, 700);
  grants.forEach(([id, reader], i) => {
    const x = 117 + 339 * i;
    ticket(c, x, 809, 310, 77, i === 4 ? '#ead19e' : '#d4d9c4');
    txt(c, id, x + 49, 859, 31, teal, mono);
    txt(c, reader, x + 174, 859, 33, ink, serif);
  });
}
