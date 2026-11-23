import { firstFrameAt, fps } from '../../../director-cuts/lesson-runtime/timeline.mjs';
import {
  ground,
  title,
  book,
  sheet,
  ticket,
  strip,
  heading,
  stamp,
  line,
  dot,
  stitch,
  arrow,
  txt,
  ledger,
  cue,
  mix,
  ink,
  paper,
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
  active,
  chunks,
  documents,
  permissions,
  locale,
  validityDates,
  joinedRows,
  terms,
  sourceCounts,
  before,
  after,
  rlsVisible,
  snapshots,
  exportReads,
  exportSubjects,
  addedSubjects,
  ledger as published,
  first,
  replay,
  amended,
  changedHash,
} from './counter-model.mjs';
const pea = '#c8ddbb',
  rose = '#e8c4b0';
export function permits(c, k) {
  ground(c);
  title(c, 'HARBOR  /  BOB  /  AUG 12', 'Which paragraphs may Bob carry away?');
  const byReader = cue(k, 1, "Check Bob's grant"),
    byStore = cue(k, 1, 'Next require Harbor'),
    byTime = cue(k, 1, 'check the active version', 0.65, 'Finally check'),
    decided = k.beat.beatIndex > 1 || (k.beat.beatIndex === 1 && k.elapsed >= k.speechDuration),
    take = cue(k, 2, 'two admitted paragraphs', 1.4, 'Move the two admitted paragraphs');
  const rows = joinedRows().map((r) => {
    const has = permissions.some(([id, name]) => id === r.id && name === 'Bob');
    const why = !decided
      ? ''
      : !has
        ? 'Staff only'
        : r.source.workspace !== 'w01'
          ? 'Other store'
          : !active(r.source)
            ? 'Retired'
            : 'Admit';
    return [
      r.id,
      { 'c7-old': '30 days', c7a: '14 days', c7b: 'Receipt', c9a: 'Over $200', c99: '7 days' }[
        r.id
      ],
      permissions
        .filter(([id]) => id === r.id)
        .map(([, name]) => name)
        .join(', '),
      locale(r.source.workspace),
      validityDates(r.source),
      why,
    ];
  });
  ledger(
    c,
    114,
    270,
    [212, 264, 287, 227, 365, 329],
    ['Chunk', 'Return rule', 'Readers', 'Store', 'Start / end', 'Decision'],
    rows,
    {
      rowH: 71,
      font: 33,
      highlights: rows.map((r) => (r[5] ? (r[5] === 'Admit' ? pea : rose) : '')),
    },
  );
  if (byReader && !decided) {
    const [x, w] = byTime ? [1104, 365] : byStore ? [877, 227] : [590, 287];
    line(c, x + 22, 332, x + w - 20, 332, teal, 4);
  }
  if (take)
    before.forEach((id, i) =>
      strip(c, 122 + i * 830, mix(898, 811, take), 782, id, terms[id] + '   ·   d7'),
    );
}
export function roles(c, k) {
  ground(c, 'slate');
  title(c, 'POSTGRESQL  /  ROW SECURITY', 'Who is running the query?');
  const roles = [
    ['ordinary', 'Application role'],
    ['owner', 'Table owner'],
    ['owner', 'Owner with FORCE'],
    ['superuser', 'Superuser / BYPASSRLS'],
  ];
  const b = k.beat.beatIndex;
  const testedRoles = [
    cue(k, 0, 'A policy must derive', 0),
    cue(k, 2, 'FORCE ROW LEVEL SECURITY', 0),
    cue(k, 2, 'while superuser', 0),
    cue(k, 2, 'Table owners normally', 0),
  ];
  ticket(c, 119, 340, 540, 432);
  txt(c, 'STAFF GUIDE', 176, 411, 31, teal, mono);
  txt(c, 'c9a', 173, 533, 95, ink, mono);
  txt(c, 'No policy permits', 170, 635, 40, ink, serif);
  txt(c, 'this row for Bob.', 170, 690, 40, ink, serif);
  const outcomes = roles.map(([role, name], i) => {
    const visible = rlsVisible({ role, force: i === 2 });
    return { name, tested: testedRoles[i], visible };
  });
  ledger(
    c,
    760,
    300,
    [535, 497],
    ['Database role', 'Row returned'],
    outcomes.map((r) => [
      r.name,
      r.tested ? (r.visible ? 'c9a  ·  bypass' : 'No rows  ·  default deny') : '',
    ]),
    {
      rowH: 100,
      font: 37,
      highlights: outcomes.map((r) => (r.tested ? (r.visible ? rose : pea) : '')),
    },
  );
  heading(
    c,
    b === 1
      ? 'Session identifies Bob   ·   Server verifies Harbor'
      : b === 3
        ? 'Exercise c9a with the server’s application role.'
        : 'Fixed row   ·   SELECT privilege assumed',
    125,
    893,
  );
}
export function counts(c, k) {
  const b = k.beat.beatIndex;
  ground(c, 'wood');
  title(c, 'HARBOR  /  CORPUS AUDIT', 'How many paragraphs does a source contain?');
  const empty = b >= 2,
    counts = sourceCounts(false, { includeEmpty: true }),
    groups = ['d7', 'd9', ...(empty ? ['d-empty'] : [])];
  for (const [i, id] of groups.entries()) {
    const g = counts.find((r) => r.id === id),
      x = 119 + i * 570;
    book(c, x, 321, 500, 424, g.title, g.id);
    const kids = chunks.filter((r) => r.document === id);
    kids.forEach((r, j) => strip(c, x + 48, 513 + 77 * j, 404, r.id, terms[r.id], '#d6d7b6'));
    if (!kids.length) {
      stitch(c, x + 53, 548, x + 447, 548, faint);
      txt(c, 'NULL child', x + 55, 613, 36, faint, mono);
    }
    const show = !kids.length
      ? cue(k, 3, 'The null field', 0)
      : id === 'd7'
        ? cue(k, 1, 'and its staff guide', 0)
        : cue(k, 1, 'An ingestion audit', 0);
    if (show) txt(c, String(g.count), x + 440, 711, 58, teal, serif, 'right');
  }
  if (b === 3 && k.elapsed >= k.speechDuration)
    heading(c, 'Empty draft     COUNT(chunk.id) = 0       COUNT(*) = 1', 127, 854);
  else if (empty) heading(c, 'LEFT JOIN keeps the draft. Count its child IDs.', 127, 854);
}
export function groups(c, k) {
  const b = k.beat.beatIndex;
  ground(c, 'wood');
  title(
    c,
    b < 2 ? 'HARBOR  /  AUG 12, 2026  /  GROUP BY' : 'HARBOR  /  GROUP BY',
    b < 2 ? 'Which source reaches two paragraphs?' : 'Where does the child filter belong?',
  );
  if (b < 2) {
    const expired = cue(k, 0, 'its paragraph drops out'),
      countedJuly = cue(k, 1, 'The staff guide', 0),
      countedStaff = cue(k, 1, 'HAVING tests', 0),
      cut = k.beat.beatIndex === 1 && k.elapsed >= k.speechDuration;
    const parents = documents.filter((d) => d.workspace === 'w01' && (!expired || active(d)));
    const rows = parents.map((d) => {
      const ids = chunks.filter((ch) => ch.document === d.id).map((ch) => ch.id);
      const counted = (d.id === 'd7' && countedJuly) || (d.id === 'd9' && countedStaff);
      return [d.id, d.title, validityDates(d), ids.join('   '), counted ? String(ids.length) : ''];
    });
    ledger(
      c,
      119,
      320,
      [234, 414, 409, 400, 224],
      ['ID', 'Source', 'Start / end', 'Paragraph IDs', 'Count'],
      rows,
      {
        rowH: 98,
        font: 37,
        highlights: cut ? rows.map((r) => (Number(r[4]) >= 2 ? pea : rose)) : [],
      },
    );
    if (cut)
      strip(
        c,
        377,
        825,
        1160,
        rows.find((r) => Number(r[4]) >= 2)[0],
        'HAVING COUNT(chunk.id) >= 2',
      );
    else if (expired) heading(c, 'WHERE removed d7-old and its paragraph c7-old.', 128, 831);
  } else {
    const where = cue(k, 3, 'Moving the child condition');
    ledger(
      c,
      122,
      319,
      [505, 380, 375, 412],
      ['LEFT JOIN', 'Parent', 'Child ID', 'COUNT(id)'],
      [
        ['active in ON', 'Draft Guide', 'NULL', '0'],
        [
          'active in WHERE',
          where ? '' : 'Draft Guide',
          where ? '' : 'NULL',
          where ? 'No group' : '',
        ],
      ],
      { caption: 'Draft Guide   ·   no matching children', rowH: 100, font: 38 },
    );
    if (where) heading(c, 'WHERE active = 1 removes the placeholder before grouping.', 132, 853);
    else heading(c, 'ON child.parent = doc.id AND child.active = 1', 132, 853);
  }
}
export function deletion(c, k) {
  const b = k.beat.beatIndex;
  ground(c);
  if (b === 3) {
    title(c, 'ACME  /  ARCHIVED EDITIONS', 'Which edition was in force on the audit date?');
    const july = cue(k, 3, 'Move the request to July first', 1.0);
    [
      ['d7-old', '90 days', 'Ends July 1'],
      ['d7', '7 days', 'Starts July 1'],
    ].forEach(([id, limit, interval], i) => {
      const x = 147 + i * 847;
      book(c, x, 312, 745, 431, 'API Key Policy', id);
      txt(c, limit, x + 52, 576, 64, ink, serif);
      txt(c, interval, x + 51, 678, 34, teal, mono);
      if (i === Number(july === 1))
        stamp(
          c,
          july === 1 ? 'JUL 01  ·  IN FORCE' : 'JUN 30  ·  IN FORCE',
          x + 49,
          805,
          mint,
          480,
        );
    });
    return;
  }
  title(
    c,
    'ACME  /  FOREIGN KEY REHEARSAL',
    b === 2 ? 'Where does the database transaction end?' : 'What still points to the API policy?',
  );
  const g = cue(k, 1, 'Remove the grants'),
    ch = cue(k, 1, 'then the chunks'),
    doc = cue(k, 1, 'then the document'),
    rollback = cue(k, 1, 'Roll back');
  const layers = [
    ['Grant', '4 permissions', 4, g],
    ['Paragraph', 'c7a   c7b', 2, ch],
    ['Document', 'd7', 1, doc],
  ];
  c.save();
  if (b === 2) {
    c.translate(42, 126);
    c.scale(0.67, 0.67);
  }
  layers.forEach(([name, ids, count, remove], i) => {
    const x = 144 + i * 588,
      remaining = remove && !rollback ? 0 : count;
    heading(c, name, x, 355, 480);
    line(c, x, 732, x + 447, 732, '#8a775c', 7);
    for (let j = 0; j < remaining; j++) {
      const y = 556 - j * 42;
      ticket(c, x + 5 * j, y, 411, 145);
      if (j === remaining - 1) txt(c, ids, x + 47 + 5 * j, y + 91, 40, ink, mono, 'left', 323);
    }
    txt(c, String(remaining), x + 17, 820, 63, chalk, serif);
    if (i < 2 && remaining) arrow(c, x + 438, 635, x + 560, 635, gold);
  });
  c.restore();
  if (b === 2) {
    stitch(c, 1240, 300, 1240, 822, gold);
    heading(c, 'Local SQLite file', 138, 310);
    heading(c, 'Outside the file', 1295, 358, 420);
    ['Vector entry', 'Object copy', 'Cached result'].forEach((v, i) => {
      ticket(c, 1294, 414 + i * 105, 460, 76);
      txt(c, v, 1343, 464 + i * 105, 34, ink, serif);
    });
  }
  let message = 'Foreign keys enabled   ·   No cascading delete';
  if (b === 0 && cue(k, 0, 'rejects the deletion'))
    message = cue(k, 0, 'Four permission rows')
      ? 'DELETE chunks   ·   blocked by permissions'
      : 'DELETE d7   ·   blocked by c7a and c7b';
  if (b === 1)
    message = rollback
      ? 'ROLLBACK restores the whole edition.'
      : 'One transaction   ·   remove dependents first';
  if (b === 2) message = 'Removing a remote copy needs its own operation and confirmation.';

  heading(c, message, 140, b === 2 ? 854 : 917);
}
export function catches(c, k) {
  ground(c, 'slate');
  title(
    c,
    'PYTHON sqlite3  /  LEGACY TRANSACTION MODE',
    'Which first insert survives the duplicate?',
  );
  const a = cue(k, 0, 'Put one K'),
    bad = cue(k, 0, 'same K again', 0.65, 'Try to insert the same K again'),
    exit = cue(k, 2, 'block finishes normally'),
    rolled = cue(k, 2, 'rolls back the open'),
    count = cue(k, 2, 'Count the saved rows', 0),
    leftResult = cue(k, 2, 'One on the left', 0) && cue(k, 2, 'Zero on the right', 0),
    rightResult = leftResult && (k.beat.beatIndex > 2 || k.elapsed >= k.speechDuration);
  ['Handler inside the block', 'Handler outside the block'].forEach((name, i) => {
    const x = 122 + i * 887;
    book(c, x, 298, 773, 480, name, 'UNIQUE (id)   ·   independent table');
    const present = i ? a * (1 - rolled) : a;
    if (present > 0.01) {
      c.save();
      c.globalAlpha = present;
      ticket(c, x + 83, 532, 197, 123, '#c9daba');
      txt(c, 'K', x + 185, 619, 60, teal, mono, 'center');
      c.restore();
    }
    if (bad && !count) {
      ticket(c, x + 316, 532, 198, 123, '#e6c3b1');
      txt(c, 'K', x + 411, 619, 60, rust, mono, 'center');
      line(c, x + 336, 633, x + 478, 550, rust, 5);
    }
    if (i ? rolled : exit) stamp(c, i ? 'ROLLBACK' : 'COMMIT', x + 58, 692, i ? rust : teal, 302);
    if (i ? rightResult : leftResult)
      txt(c, (i ? 0 : 1) + ' saved', x + 523, 723, 37, ink, serif, 'left', 210);
  });
  heading(
    c,
    k.beat.beatIndex === 4
      ? 'The first write opens the transaction. The caller closes the connection.'
      : 'Both duplicate statements fail. Follow the exception to the block boundary.',
    127,
    912,
    1670,
  );
}
function editionBook(c, x, label, edition, ids, accent = teal) {
  book(c, x, 319, 507, 502, label, edition);
  ids.forEach((id, i) => {
    const y = 524 + i * 80;
    ticket(c, x + 46, y, 413, 66, '#d8d9bb');
    txt(c, id, x + 91, y + 44, 31, accent, mono);
    txt(
      c,
      terms[id] === 'Deadline' ? '14 days' : terms[id],
      x + 223,
      y + 44,
      33,
      ink,
      serif,
      'left',
      225,
    );
  });
}
export function publish(c, k) {
  const b = k.beat.beatIndex;
  ground(c, 'wood');
  title(c, 'HARBOR  /  SQLITE WAL', 'Two readers open the same policy file');
  const stage = cue(k, 0, 'stages the replacement'),
    rejected = b === 1 && k.elapsed >= k.wordCue('rejects that statement').end,
    rolled = b > 1 || (b === 1 && k.elapsed >= k.wordCue('roll back the transaction').end),
    retry = cue(k, 2, 'Retry with the correct'),
    pack = cue(k, 2, 'Assemble the deadline', 1.7),
    committed = cue(k, 2, 'Commit the edition'),
    newRead = cue(k, 2, 'begins a fresh read', 0.35);
  editionBook(c, 105, 'First reader', 'JULY  /  OPEN BEFORE COMMIT', before);
  const staged = (!rolled && stage) || retry;
  const ids = staged ? (retry ? after.slice(0, Math.ceil(3 * pack)) : []) : before;
  editionBook(
    c,
    704,
    'Writer',
    committed
      ? 'COMMITTED   ·   d7-next'
      : staged
        ? 'PRIVATE   ·   d7-next'
        : 'OPEN EDITION   ·   d7',
    ids,
  );
  if (pack === 1) txt(c, 'Bob granted on all three', 753, 796, 26, teal, mono, 'left', 415);
  if (staged && !ids.length) {
    txt(c, 'Staged document', 756, 572, 37, ink, serif);
    txt(c, 'July end → Aug 12', 756, 643, 31, teal, mono);
    if (rejected) {
      txt(c, 'chunk → missing', 756, 695, 28, rust, mono);
      stamp(c, 'FK REJECTED', 756, 721, rust, 325);
    }
  } else if (rolled && !retry) {
    txt(c, 'July end → open', 756, 735, 31, teal, mono);
  }
  if (newRead >= 1) editionBook(c, 1303, 'Second reader', 'AUGUST  /  READ AFTER COMMIT', after);
  else {
    stitch(c, 1320, 785, 1798, 785, '#c2ad8a');
    txt(c, 'Second reader', 1555, 549, 46, chalk, serif, 'center');
    txt(c, 'Read has yet to begin', 1555, 626, 30, gold, mono, 'center');
  }
  heading(
    c,
    b === 4
      ? 'BEGIN IMMEDIATE reserves the writer slot before the check.'
      : committed
        ? 'July: 2 paragraphs        Local commit        August: 3 paragraphs'
        : rolled && !retry
          ? 'Rollback restores the old end date.'
          : 'July read transaction remains open',
    107,
    b === 4 ? 854 : 927,
    1700,
  );
}
export function connections(c, k) {
  const b = k.beat.beatIndex;
  ground(c, 'slate');
  title(
    c,
    'ACME  /  TWO SQLITE CONNECTIONS',
    b < 4 ? 'What can the second connection read?' : 'Which publisher gets the writer slot?',
  );
  if (b < 4) {
    const closed = cue(k, 0, 'closes the old edition', 0.65, 'The writer closes'),
      second = cue(k, 2, 'seven-day edition', 0) && cue(k, 2, 'The writer can now', 0),
      staged = cue(k, 2, 'five days', 0) && cue(k, 2, 'The other connection', 0),
      rollback = cue(k, 3, 'rollback', 0.65, 'End the rehearsal with a rollback');
    for (const [i, name] of ['Writer’s query', 'Second connection'].entries()) {
      const x = 129 + i * 884;
      book(c, x, 340, 771, 407, name, 'API KEY POLICY   ·   AUG 12');
      const str = i
        ? second
          ? '7 days'
          : '?'
        : rollback || !closed
          ? '7 days'
          : staged
            ? '5 days'
            : 'No rows';
      txt(c, str, x + 69, 627, 85, i ? teal : ink, serif);
      txt(
        c,
        i
          ? 'Committed edition'
          : rollback
            ? 'Rehearsal rolled back'
            : staged
              ? 'Replacement staged'
              : closed
                ? 'No active row in this transaction'
                : 'Original edition',
        x + 59,
        711,
        29,
        faint,
        mono,
        'left',
        663,
      );
    }
  } else {
    const busy = cue(k, 4, 'SQLite reports busy');
    heading(c, 'SQLite writer slot', 129, 345);
    ticket(c, 125, 405, 744, 200);
    txt(c, 'Publisher 1', 181, 487, 46, ink, serif);
    txt(c, 'BEGIN IMMEDIATE', 181, 552, 38, teal, mono);
    arrow(c, 921, 497, 1082, 497, gold);
    ticket(c, 1136, 405, 620, 200);
    txt(c, 'Publisher 2', 1192, 487, 46, ink, serif);
    txt(c, busy ? 'BUSY  ·  timeout 0' : 'Requests slot', 1192, 552, 37, rust, mono, 'left', 520);
    heading(
      c,
      b === 5
        ? 'Retry the complete publication. Deliver remote work through a separate workflow.'
        : 'Writer 1 checks the open edition while holding this slot.',
      131,
      850,
      1640,
    );
  }
}
export function exportsScene(c, k) {
  ground(c, 'slate');
  title(c, 'POSTGRESQL  /  READ-ONLY CORPUS EXPORT  /  AUG 12', 'Will the details fit the count?');

  function afterPhrase(beat, phrase) {
    const currentBeat = k.beat.beatIndex;
    if (currentBeat !== beat) return currentBeat > beat;
    return Math.round(k.elapsed * fps) >= firstFrameAt(k.wordCue(phrase).end);
  }

  const committed = afterPhrase(1, 'The publisher commits the new edition');
  const tags = cue(k, 1, 'Find the line for clothing tags', 0);
  const replay = cue(k, 2, 'Replay the same publication', 0);
  const thirdReadCommitted = cue(k, 3, 'the third count takes', 0.9);
  const mode = replay && !thirdReadCommitted ? 1 : 0;
  // Start a caption at the spoken answer. The picture waits for the whole clause.
  if (k.beat.beatIndex === 1) k.reveal('Four rows go beside a count of three', 0);

  const routes = [
    [
      cue(k, 0, 'Start its count', 0.9),
      cue(k, 1, 'run the detail query', 0.9, 'Now run the detail query'),
      thirdReadCommitted,
    ],
    [
      cue(k, 2, 'first query fixed', 0.9),
      cue(k, 2, 'detail query back', 0.9, 'Send the detail query back'),
      cue(k, 3, 'A third count', 0.9),
    ],
  ];
  const settled = [
    [
      afterPhrase(0, 'Keep that number on the page'),
      afterPhrase(1, 'Four rows go beside a count of three'),
      afterPhrase(3, 'so it counts four'),
    ],
    [
      afterPhrase(2, 'first query fixed the snapshot at the count'),
      afterPhrase(2, 'the ones that were there when it was taken'),
      afterPhrase(3, 'sees three'),
    ],
  ];
  const reads = [exportReads(false), exportReads(true)];
  const statement = routes[mode].findLastIndex((progress) => progress > 0);
  const source = statement < 0 ? -1 : snapshots.indexOf(reads[mode][statement]);
  const timing = ['Before', 'After'];
  const colors = [gold, mint];
  const snapshotX = [119, 1000];
  const snapshotWidth = 800;
  const snapshotY = 247;
  const snapshotHeight = 206;
  const snapshotBottom = snapshotY + snapshotHeight;
  const [added] = addedSubjects;
  for (const [i, rows] of snapshots.entries()) {
    const x = snapshotX[i];
    if (i === 1 && !committed) {
      heading(c, 'Awaiting publication', x + 48, snapshotY + 57, 670);
      stitch(c, x + 48, snapshotY + 80, x + snapshotWidth - 48, snapshotY + 80, faint);
      continue;
    }
    sheet(c, x, snapshotY, snapshotWidth, snapshotHeight);
    line(c, x, snapshotY, x + snapshotWidth, snapshotY, colors[i], source === i ? 12 : 4);
    txt(c, timing[i] + ' commit', x + 48, snapshotY + 57, 49, ink, serif);
    if (i === 1 && !settled[0][1])
      txt(c, tags ? 'New row shown' : 'Rows hidden', x + 754, snapshotY + 54, 30, faint, mono, 'right');
    line(c, x + 48, snapshotY + 78, x + snapshotWidth - 48, snapshotY + 78, faint, 2);
    exportSubjects.forEach((subject, slot) => {
      const id = rows.find((row) => terms[row] === subject);
      const column = Math.floor(slot / 2);
      const labelX = x + 48 + column * 362;
      const y = snapshotY + 124 + (slot % 2) * 52;
      if (i === 0 && subject === terms[added] && tags) {
        txt(c, 'No clothing-tags row', labelX, y, 32, faint, serif);
      } else if (id && (i === 0 || settled[0][1] || (id === added && tags))) {
        txt(c, id, labelX, y, 34, teal, mono);
        txt(c, subject, labelX + 105, y, 36, ink, serif);
      }
    });
  }

  const statementX = [533, 1080, 1635];
  const commitX = 795;
  const axisY = 563;
  arrow(c, 382, axisY, 1790, axisY, '#80958f', 3);
  if (committed) {
    dot(c, commitX, axisY, 8, chalk);
    txt(c, 'Publisher commits', commitX, 607, 28, chalk, mono, 'center');
  }
  ['First count', 'Fetch IDs', 'Count again'].forEach((label, i) => {
    const active = i === statement;
    const color = active ? colors[source] : chalk;
    dot(c, statementX[i], axisY, active ? 10 : 6, color);
    txt(c, label, statementX[i], 609, 35, color, serif, 'center');
  });
  if (source >= 0) {
    const x = statementX[statement];
    const targetX = snapshotX[source] + snapshotWidth / 2;
    const travel = routes[mode][statement];
    arrow(
      c,
      x,
      axisY - 7,
      mix(x, targetX, travel),
      mix(axisY - 7, snapshotBottom + 9, travel),
      colors[source],
      5,
    );
  }

  ['Read Committed', 'Repeatable Read'].forEach((name, i) => {
    const y = 655 + i * 111;
    txt(c, name, 119, y + 53, 38, i === mode ? chalk : '#a6b7b4', serif, 'left', 250);
    for (const [j, rows] of reads[i].entries()) {
      if (!routes[i][j]) continue;
      const snapshot = snapshots.indexOf(rows);
      const x = statementX[j] - 145;
      const resolved = settled[i][j];
      ticket(c, x, y, 290, 80, resolved ? (snapshot === 0 ? '#edd3a3' : pea) : paper);
      if (resolved) {
        txt(c, rows.length + (j === 1 ? ' IDs' : ''), x + 48, y + 53, 43, ink, serif);
        txt(c, timing[snapshot], x + 264, y + 51, 29, teal, mono, 'right');
      } else {
        txt(c, 'Reading…', x + 48, y + 51, 32, faint, mono);
      }
    }
  });
}
export function retries(c, k) {
  const b = k.beat.beatIndex;
  ground(c);
  title(c, 'HARBOR  /  DURABLE REQUEST LOG', 'Can the worker reuse the publication key?');
  const saved = cue(k, 0, 'durable marker', 0.65, 'That durable marker'),
    compare = cue(k, 1, 'Compare the arriving'),
    changed = cue(k, 2, 'fingerprint changes'),
    result = cue(k, 1, 'Identical input reuses'),
    reject = cue(k, 2, 'Reject that reuse');
  book(c, 117, 307, 797, 452, 'Committed receipt', 'publish-1');
  txt(
    c,
    'SHA-256  ' + (saved ? first.fingerprint.slice(0, 12) + '…' : ''),
    169,
    556,
    35,
    ink,
    mono,
  );
  txt(c, saved ? 'Document    d7-next' : 'Document    …', 169, 642, 36, teal, mono);
  ticket(c, 1038, 389, 723, 262);
  txt(c, 'Arriving request', 1097, 457, 43, ink, serif);
  txt(c, 'publish-1', 1097, 531, 39, ink, mono);
  if (compare)
    txt(
      c,
      (changed ? changedHash : first.fingerprint).slice(0, 12) + '…',
      1097,
      602,
      37,
      changed ? rust : teal,
      mono,
    );
  if (compare)
    txt(
      c,
      changed ? 'Text: original swing tag' : 'Text: tags attached',
      1044,
      712,
      33,
      chalk,
      serif,
    );
  if (reject || (result && !changed))
    stamp(
      c,
      reject ? amended.status.toUpperCase() : replay.status.toUpperCase(),
      1057,
      750,
      reject ? coral : mint,
      655,
    );
  heading(
    c,
    b === 3
      ? 'New revision: fresh key, predecessor, start, document ID and chunk IDs.'
      : saved
        ? published.data.documents.length +
          ' documents   ·   ' +
          published.data.chunks.length +
          ' chunks   ·   ' +
          published.requests.size +
          ' request marker'
        : 'Marker and publication commit together.',
    124,
    855,
    1680,
  );
}
export function outbox(c, k) {
  const b = k.beat.beatIndex;
  const uncertain = cue(k, 4, 'If the destination', 0);
  ground(c, 'wood');
  title(
    c,
    'ACME  /  RETRY AFTER A LOST REPLY',
    b < 2
      ? 'What does the local marker prove?'
      : uncertain
        ? 'Did the destination start a job?'
        : 'Where was the job number recorded?',
  );
  if (b < 2) {
    const same = cue(k, 0, 'same key and the same input', 0.65, 'Try the same key'),
      editing = cue(k, 1, 'Change just the paragraph text', 0),
      skipped = cue(k, 0, 'skips the write', 0) && (b > 0 || k.elapsed >= k.speechDuration),
      rejected = cue(k, 1, 'rejects the request', 0) && cue(k, 1, 'The original paragraph', 0);
    book(c, 127, 335, 831, 437, 'Key Rotation FAQ', 'REQ-30   ·   local transaction');
    strip(c, 174, 542, 726, 'c30', 'Temporary keys expire after 30 days.');
    txt(c, 'd30   /   w01', 177, 721, 32, teal, mono);
    heading(c, 'Retry with req-30', 1060, 435, 720);
    txt(
      c,
      editing ? 'Text changed' : same ? 'Same seven fields' : 'Compare seven fields',
      1060,
      541,
      51,
      chalk,
      serif,
    );
    if (rejected || (skipped && !editing))
      stamp(c, rejected ? 'REJECT REUSE' : 'SKIP WRITE', 1064, 640, rejected ? coral : mint, 426);
  } else {
    const job = cue(k, 2, 'saves its number', 0),
      repeated = cue(k, 3, 'same key again', 0.65, 'Send the same key again'),
      ack = cue(k, 3, 'worker records that number'),
      reconcile = uncertain && cue(k, 4, 'check its actual state', 0);
    for (const [i, name] of ['Local worker', 'Embedding service'].entries()) {
      const x = 128 + i * 882;
      book(
        c,
        x,
        335,
        760,
        437,
        name,
        uncertain ? 'SEPARATE REQUEST   embed-c30-B' : 'REQUEST   embed-c30',
      );
      txt(c, uncertain && i ? 'Remote outcome' : 'Job number', x + 51, 569, 35, faint, mono);
      if (uncertain && i) txt(c, 'Unverified', x + 52, 682, 69, rust, serif);
      else if (!uncertain && (i ? job : ack)) txt(c, '42', x + 52, 693, 88, teal, serif);
      else stitch(c, x + 57, 673, x + 356, 673, faint);
    }
    if (uncertain)
      heading(
        c,
        reconcile
          ? 'Check the destination for this request before sending it again.'
          : 'Lost reply   ·   Destination offers no deduplication guarantee.',
        131,
        854,
        1630,
      );
    else if (repeated)
      heading(c, 'Same key   →   retained service receipt   →   same job', 133, 899);
    else if (cue(k, 2, 'reply gets lost'))
      heading(c, 'The reply is lost between the two records.', 133, 899);
  }
}
