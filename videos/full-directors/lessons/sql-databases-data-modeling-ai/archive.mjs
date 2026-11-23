import {
  ground,
  title,
  book,
  stitch,
  ticket,
  strip,
  heading,
  stamp,
  rect,
  line,
  dot,
  arrow,
  txt,
  finger,
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
import { coat } from './coat.mjs';
import {
  age,
  oldWindow,
  julyWindow,
  chunks,
  documents,
  locale,
  printedCode,
  passages,
  literalHits,
  literalSubstringPattern,
  scoreAccepted,
  date,
  active,
  asOf,
} from './counter-model.mjs';
export function hungCoat(c, x, y, scale) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  coat(c, { x: 0, wool: ['#183334', '#30605a', '#70867a'] });
  c.restore();
}
const dateWord = (t) => new Date(t).toISOString().slice(5, 10).replace('-', '/');
export function opening(c, k) {
  ground(c, 'wood');
  title(c, 'HARBOR  /  RETURNS', 'Can this coat go back?');
  const left = 215,
    per = 48,
    point = left + age * per;
  line(c, 116, 268, 1800, 268, '#392e22', 17);
  line(c, 116, 261, 1800, 261, '#caa66e', 9);
  hungCoat(c, point, 222, 0.47);
  ticket(c, 140, 335, 445, 208);
  txt(c, 'HARBOR   /   RECEIPT', 190, 390, 28, teal, mono);
  txt(c, 'One wool coat', 190, 455, 48, ink, serif);
  txt(c, 'Purchased July 25', 190, 510, 33, ink);
  txt(c, 'Aug 12', point + 195, 430, 47, chalk, serif);
  txt(c, 'At the counter', point + 195, 478, 29, mint);
  const counted = cue(k, 0, 'Eighteen', 0);
  rect(c, 138, 682, 1638, 98, '#ddc597');
  rect(c, 138, 685, 1638, 3, '#8f6845');
  for (let d = 0; d <= 31; d++) {
    const x = left + d * per;
    line(c, x, 686, x, d % 5 === 0 ? 724 : 705, '#473f30', 2);
  }
  [
    [0, 'July 25'],
    [14, 'Aug 8'],
    [18, 'Aug 12'],
    [30, 'Aug 24'],
  ].forEach(([v, s]) => txt(c, s, left + v * per, 760, 30, ink, mono, 'center'));
  line(c, point, 653, point, 683, gold, 6);
  if (counted) txt(c, 'Day ' + age, point, 641, 45, chalk, serif, 'center');
  const back = cue(k, 0, 'Trace the tape', 1.7),
    fourteen = cue(k, 1, 'Put a finger', 1.5),
    thirty = cue(k, 1, 'thirty days', 1.6);
  const pos = mix(mix(mix(age, 0, back), julyWindow, fourteen), oldWindow, thirty);
  const reopened = cue(k, 1, 'reopens the saved', 0.65, 'He reopens'),
    cleared = cue(k, 1, 'screen clears');
  if (k.beat.beatIndex > 0 && (!cleared || reopened)) {
    line(c, left, 833, left + julyWindow * per, 833, mint, 8);
    dot(c, left + julyWindow * per, 833, 9, mint);
    txt(
      c,
      (reopened ? 'Saved rule' : 'Open rule') + '   ·   14 days   ·   Aug 8',
      146,
      596,
      32,
      mint,
    );
  }
  if (thirty) {
    line(c, left, 913, left + oldWindow * per, 913, gold, 8);
    dot(c, left + oldWindow * per, 913, 9, gold);
    txt(c, 'Other edition   ·   30 days   ·   Aug 24', 146, 651, 32, gold);
  }
  finger(c, left + pos * per, 772, 0.63);
}
export function durability(c, k) {
  const b = k.beat.beatIndex,
    acme = b === 2;
  ground(c);
  title(c, acme ? 'ACME  /  FILE REOPEN LAB' : 'HARBOR  /  SQLITE', 'What survives a restart?');
  book(c, 1045, 310, 730, 516, acme ? 'Acme policy file' : 'support.sqlite', 'PERSISTENT VOLUME');
  const commit = cue(k, 0, 'Commit saves'),
    recover = cue(k, 1, 'read the row back', 1.1);
  const close = acme ? cue(k, 2, 'close the connection') : 0,
    again = acme ? cue(k, 2, 'Reopen the same file', 1) : 0;
  const disk = acme ? ['c7a', 'c7b'] : ['c7a'];
  if (commit)
    disk.forEach((id, i) =>
      strip(
        c,
        1087,
        515 + i * 85,
        644,
        id,
        acme ? (i ? 'Email instructions' : 'Key rotation') : 'd7   ·   14 days',
        '#ddd6b6',
      ),
    );
  txt(c, 'chunks', 1094, 766, 30, teal, mono);
  rect(c, 115, 337, 649, 422, '#8d9683');
  rect(c, 130, 351, 619, 390, '#193331');
  rect(c, 391, 759, 90, 51, '#929984');
  rect(c, 287, 808, 307, 17, '#91957e');
  heading(
    c,
    acme ? 'Bob’s search' : b === 0 ? 'Bob’s support app' : 'New connection',
    169,
    420,
    540,
  );
  const display =
    b === 0 || (b === 1 && recover > 0.95) || (acme && (!close || again > 0.95)) || b === 3;
  if (display) {
    txt(c, acme ? 'c7a    c7b' : 'c7a    →    d7', 171, 535, 50, chalk, mono);
    txt(c, acme ? 'Two saved IDs' : chunks[1].text, 171, 620, 33, chalk, serif, 'left', 540);
  }
  if (b === 0) arrow(c, 804, 550, mix(820, 1015, commit), 550, gold);
  else if (recover) arrow(c, 1012, 551, mix(998, 799, recover), 551, gold);
  if (b === 1 && recover) txt(c, 'Same file on durable storage', 1047, 911, 38, mint, serif);
}
function relationship(c, which, acme = false) {
  const chain = acme
    ? [
        ['Grant', 'agent:u3', 'chunk  c7a'],
        ['Paragraph', 'c7a', 'document  d7'],
        ['Document', 'd7', 'workspace  w01'],
        ['Workspace', 'w01', 'Acme Cloud'],
      ]
    : [
        ['Paragraph', 'c7a', 'document  d7'],
        ['Document', 'd7', 'workspace  w01'],
        ['Workspace', 'w01', 'Harbor'],
      ];
  const w = acme ? 357 : 475,
    step = acme ? 440 : 595;
  chain.forEach(([head, id, field], i) => {
    const x = 105 + i * step;
    ticket(c, x, 359, w, 248);
    txt(c, head, x + 46, 420, 35, faint, serif);
    txt(c, id, x + 46, 498, 54, ink, mono, 'left', w - 80);
    txt(c, field, x + 46, 565, 30, teal, mono, 'left', w - 65);
    if (i < chain.length - 1 && which > i) {
      const f = Math.min(1, which - i);
      arrow(c, x + w + 4, 477, x + w + 5 + (step - w - 20) * f, 477, gold, 5);
    }
  });
}
export function relations(c, k) {
  const b = k.beat.beatIndex;
  ground(c);
  title(c, 'HARBOR  /  FOREIGN KEYS', 'Follow the ID sewn into the paragraph');
  relationship(c, 2 * cue(k, 0, 'Follow the matching fields', 1.4));
  if (b === 0 && cue(k, 0, 'separate permission row'))
    strip(c, 112, 731, 616, 'c7a', 'Bob may read', '#c3d4b8');
  if (b >= 1) {
    const missing = cue(k, 2, 'missing document');
    ticket(c, 115, 713, 820, 132);
    txt(
      c,
      missing ? 'new chunk   →   missing doc' : 'second row   ·   ID c7a',
      175,
      800,
      39,
      ink,
      mono,
    );
    if (missing || cue(k, 1, 'rejects the duplicate'))
      stamp(c, missing ? 'PARENT MISSING' : 'DUPLICATE ID', 1040, 753, coral, 420);
    if (b === 2) heading(c, 'PRAGMA foreign_keys = ON', 119, 872, 800);
  }
}
export function schema(c, k) {
  const b = k.beat.beatIndex;
  ground(c, 'wood');
  title(c, 'ACME  /  SQLITE LAB', 'Which inserts get a place in the file?');
  if (b < 2) {
    relationship(c, 3 * cue(k, 0, 'Follow one grant', 1.5), true);
    if (b === 1) {
      strip(c, 116, 716, 733, 'c7a', 'agent:u3');
      if (cue(k, 1, 'that pair twice fails')) stamp(c, 'DUPLICATE PAIR', 909, 730, coral, 410);
    } else heading(c, 'documents: source key, title, valid_from, valid_to', 114, 769);
  } else if (b < 5) {
    const answers = cue(k, 2, 'Only the copy', 0) && (b > 2 || k.elapsed >= k.speechDuration);
    ledger(
      c,
      127,
      296,
      [275, 310, 615, 406],
      ['Chunk ID', 'Parent', 'Stored words', 'Insert'],
      [
        ['NULL', 'd7', 'New paragraph', answers ? 'ID required' : ''],
        ['fresh ID', 'missing', 'New paragraph', answers ? 'Parent missing' : ''],
        ['fresh ID', 'd7-old', 'Same words as c7a', answers ? 'Accepted' : ''],
      ],
      { caption: 'Three independent writes', rowH: 93 },
    );
    heading(
      c,
      b === 4
        ? 'document_id  NOT NULL  REFERENCES documents(id)'
        : 'UNIQUE (document_id, chunk_text)',
      132,
      874,
    );
  } else {
    const zero = cue(k, 6, 'For a missing score', 0),
      missing = cue(k, 6, 'Add a separate requirement', 0),
      required = cue(k, 6, 'Only the missing score', 0);
    ledger(
      c,
      128,
      288,
      [350, 530, 670],
      ['Score', 'score > 0', 'Insert'],
      [0, null, 2].map((v, i) => [
        String(v ?? 'NULL'),
        (i === 1 ? missing : zero) ? ['false', 'unknown', 'true'][i] : '',
        (i === 1 ? missing : zero) ? (scoreAccepted(v, !!required) ? 'Accepted' : 'Rejected') : '',
      ]),
      {
        caption: 'score INTEGER ' + (required ? 'NOT NULL  ' : '') + 'CHECK (score > 0)',
        rowH: 93,
        highlights: required ? ['', '#e9c2aa', ''] : [],
      },
    );
    if (b === 7) heading(c, 'A valid link still needs a matching grant.', 133, 870);
  }
}
export function select(c, k) {
  const b = k.beat.beatIndex;
  ground(c, 'slate');
  title(c, 'HARBOR  /  PREPARED STATEMENT', 'What fits in the parameter slot?');
  if (!b) {
    heading(c, 'SELECT id, title FROM documents WHERE workspace_id = ?', 118, 306);
    const t = cue(k, 0, 'Bind the store identity', 1.2);
    ticket(c, mix(175, 1344, t), 340, 289, 78);
    txt(c, 'w01', mix(175, 1344, t) + 57, 393, 40, ink, mono);
    const tested = cue(k, 0, 'test each document', 1.8, 'Now test each document');
    ledger(
      c,
      119,
      457,
      [305, 460, 405, 483],
      ['ID', 'Title', 'Workspace', 'Result'],
      documents.map((d, i) => [
        d.id,
        d.title,
        locale(d.workspace),
        tested > i / 4 ? (d.workspace === 'w01' ? 'Keep' : 'Skip') : '',
      ]),
      { rowH: 84 },
    );
  } else {
    const percent = cue(k, 1, 'percent sign', 0.65, 'Now search for the percent sign'),
      under = cue(k, 2, 'field name', 0.65, 'Now try the field name'),
      raw = under ? 'document_id' : percent ? '10%' : "children's coats";
    const bind = under
      ? cue(k, 2, 'Bind the new pattern', 1.1)
      : percent
        ? cue(k, 2, 'Bind the escaped pattern', 1.1)
        : cue(k, 1, 'bound value', 1.1);
    book(c, 120, 335, 590, 376, 'Search input', 'SEARCH BOX');
    txt(c, raw, 169, 606, 47, ink, mono, 'left', 490);
    book(c, 807, 263, 986, 555, 'Prepared statement', 'SQLITE   /   ONE PARAMETER');
    txt(c, "chunk_text LIKE ? ESCAPE '!'", 864, 520, 44, ink, mono, 'left', 875);
    const slotX = 864;
    txt(c, 'Value bound to ?', slotX, 603, 30, faint, mono);
    c.strokeStyle = faint;
    c.lineWidth = 3;
    c.strokeRect(slotX, 627, 846, 101);
    if (bind) {
      const y = mix(847, 632, bind);
      ticket(c, slotX + 6, y, 834, 91, '#c9ddbd');
      txt(c, literalSubstringPattern(raw), slotX + 55, y + 62, 45, teal, mono, 'left', 755);
    }
    if (!percent && cue(k, 1, 'contain that phrase', 0))
      heading(c, '0 matching paragraphs', 127, 914);
  }
}
export function pattern(c, k) {
  ground(c, 'slate');
  title(c, 'ACME  /  LITERAL SUBSTRING', 'Match punctuation and ignore ASCII letter case');
  const doub = cue(k, 1, 'Double the exclamation'),
    esc = cue(k, 1, 'Mark the underscore'),
    outer = cue(k, 1, 'wildcard at each end', 0.65, 'Put a wildcard'),
    clear = cue(k, 3, 'Clear the search box');
  const pat = outer
    ? literalSubstringPattern(printedCode)
    : esc
      ? 'policy!_10!%!!'
      : doub
        ? 'policy_10%!!'
        : printedCode;
  ticket(c, 115, 262, 705, 119);
  txt(c, clear ? '' : printedCode, 176, 343, 59, ink, mono);
  arrow(c, 855, 323, 990, 323, gold);
  heading(
    c,
    clear ? 'Helper returns []' : outer ? 'Bound pattern' : 'Preparing the pattern',
    1034,
    285,
    600,
  );
  txt(c, clear ? '(blank)' : pat, 1034, 355, 47, chalk, mono, 'left', 760);
  const hits = literalHits(clear ? '' : printedCode),
    seen = [
      cue(k, 2, 'In the second', 0),
      cue(k, 2, 'In the last passage', 0),
      cue(k, 2, 'The outer wildcards', 0),
    ];
  ledger(
    c,
    119,
    448,
    [1080, 568],
    ['Stored passage', 'Literal match'],
    passages.map((s, i) => [s, !clear && seen[i] ? (hits[i] ? 'Match' : 'Skip') : '']),
    {
      rowH: 100,
      font: 40,
      highlights: passages.map((_, i) =>
        !clear && seen[i] ? (hits[i] ? '#c8ddbb' : '#e8c4b0') : '',
      ),
    },
  );
  if (clear) heading(c, 'Trimmed search is empty   →   []', 130, 930);
}
export function join(c, k) {
  ground(c);
  title(c, 'HARBOR  /  CITATION', 'Which document belongs on the ticket?');
  const move = cue(k, 1, 'Move its title', 1),
    second = cue(k, 1, 'receipt paragraph', 1.1);
  const compare = cue(k, 0, 'Compare the paragraph', 1);
  const x = mix(142, 435, move),
    y = mix(442, 350, move);
  for (const [i, d] of [documents[1], documents[2]].entries()) {
    const yy = 316 + i * 235;
    ticket(c, 1110, yy, 644, 175, i === 0 && move ? '#c9ddbd' : paper);
    txt(c, 'documents.id   ' + d.id, 1163, yy + 58, 30, teal, mono);
    txt(c, d.title, 1161, yy + 125, 50, ink, serif);
  }
  ticket(c, x, y, 544, 175);
  txt(c, 'Paragraph  ' + (second ? 'c7b' : 'c7a'), x + 49, y + 61, 39, ink, serif);
  txt(c, 'document_id   d7', x + 48, y + 135, 37, teal, mono);
  if (compare) {
    stitch(c, x + 544, y + 104, 1095, move ? 404 : 644, move ? mint : coral);
    txt(
      c,
      move ? 'd7 = d7' : 'd7 ≠ d9',
      939,
      move ? 290 : 766,
      32,
      move ? mint : coral,
      mono,
      'center',
    );
  }
  if (move)
    strip(
      c,
      336,
      857,
      1183,
      second ? 'c7b / d7' : 'c7a / d7',
      second ? 'Bring the receipt   ·   Return Policy' : '14 days   ·   Return Policy',
    );
}
function clockFace(c, x, y, h, color) {
  dot(c, x, y, 127, paper);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    line(
      c,
      x + 105 * Math.sin(a),
      y - 105 * Math.cos(a),
      x + 116 * Math.sin(a),
      y - 116 * Math.cos(a),
      faint,
      3,
    );
  }
  const a = (h * Math.PI) / 6;
  line(c, x, y, x + 69 * Math.sin(a), y - 69 * Math.cos(a), color, 9);
  line(c, x, y, x, y - 90, ink, 5);
  dot(c, x, y, 8, ink);
}
export function nullTime(c, k) {
  const b = k.beat.beatIndex;
  ground(c, 'slate');
  title(
    c,
    'POLICY TIME  /  AUGUST 12',
    b < 2 ? 'What does an empty end date tell us?' : 'Can two clock readings identify one instant?',
  );
  if (b < 2) {
    const exact = cue(k, 0, 'Use IS NULL'),
      start = cue(k, 1, 'start less than or equal');
    ledger(
      c,
      116,
      312,
      [345, 360, 215, 360, 395],
      ['Edition', 'Start', 'End', exact ? 'end IS NULL' : 'end = NULL', 'In force?'],
      [
        ['July', 'Jul 1, 2026', 'NULL', exact ? 'true' : 'unknown', start ? 'Yes' : ''],
        ['Future', 'Jan 1, 2027', 'NULL', exact ? 'true' : 'unknown', start ? 'Too early' : ''],
      ],
      { rowH: 106, font: 38 },
    );
    heading(c, '(end IS NULL OR t < end)', 129, 748);
    if (start) heading(c, 'AND start <= t', 128, 820, 1200, gold);
  } else {
    clockFace(c, 566, 563, 10, teal);
    clockFace(c, 1339, 563, 12, rust);
    txt(c, '10:00 UTC', 566, 794, 52, chalk, mono, 'center');
    txt(c, '12:00 +02:00', 1339, 794, 52, chalk, mono, 'center');
    if (cue(k, 2, 'offsets') || b === 3)
      txt(c, 'Same instant', 954, 581, 49, gold, serif, 'center');
    heading(c, 'SQLite: fixed UTC text', 180, 855, 730);
    heading(c, 'PostgreSQL: timestamptz', 1125, 855, 680);
  }
}
const mid = date('2026-07-01'),
  from = date('2026-01-01'),
  end = date('2026-09-01');
function excludedEnd(c, x, y, color) {
  dot(c, x, y, 13, color);
  dot(c, x, y, 7, '#1f3835');
}
function interval(c, x, y, w, a, z, fn, color) {
  const lo = fn(a),
    hi = z ? fn(z) : x + w;
  line(c, lo, y, hi - 9, y, color, 12);
  dot(c, lo, y, 12, color);
  if (z) excludedEnd(c, hi, y, color);
  else arrow(c, hi - 28, y, hi, y, color, 6);
}
export function validity(c, k) {
  ground(c);
  title(c, 'HARBOR  /  RETURN POLICY', 'Which edition covers the marked date?');
  const fn = (t) => mix(540, 1740, (t - from) / (end - from)),
    go = cue(k, 0, 'Place the request time', 1.4),
    aug = cue(k, 1, 'this August request', 1.4);
  const t = mix(mix(date('2026-06-01'), mid, go), date('2026-08-12'), aug),
    x = fn(t);
  for (const [i, d] of documents.slice(0, 2).entries()) {
    const y = 473 + 190 * i;
    txt(c, [oldWindow, julyWindow][i] + ' days', 118, y + 12, 63, chalk, serif);
    txt(c, d.id, 124, y + 63, 32, mint, mono);
    interval(c, 540, y, 1200, date(d.from), d.to && date(d.to), fn, i ? mint : gold);
  }
  stitch(c, x, 344, x, 730, chalk);
  txt(c, new Date(t).toISOString().slice(0, 10), x, 314, 36, chalk, mono, 'center');
  txt(c, 'Jul 1', fn(mid), 788, 34, chalk, mono, 'center');
  if (cue(k, 1, 'Include the start')) {
    const instant = new Date(t).toISOString().replace('.000Z', 'Z');
    const d = documents.slice(0, 2).find((r) => active(r, instant));
    strip(c, 123, 837, 765, d.id, '14 days   ·   in force', '#c8ddbb');
    dot(c, 980, 867, 12, mint);
    txt(c, 'Start included', 1013, 880, 32, chalk, mono);
    excludedEnd(c, 1395, 867, gold);
    txt(c, 'End excluded', 1428, 880, 32, chalk, mono);
  }
}
export function overlap(c, k) {
  const b = k.beat.beatIndex;
  ground(c);
  title(
    c,
    'HARBOR  /  PUBLICATION',
    b < 2 ? 'A new start date can still overlap' : 'Replace the open edition in one transaction',
  );
  const low = date('2026-06-01'),
    hi = date('2026-09-01'),
    x = 490,
    w = 1265,
    fn = (t) => mix(x, x + w, (Math.max(low, t) - low) / (hi - low));
  const proposal = cue(k, 0, 'June fifteenth'),
    test = cue(k, 1, 'June twentieth', 0.65, 'Look at June twentieth'),
    later = cue(k, 1, 'July tenth', 0.65, 'Move to July tenth'),
    commit = cue(k, 3, 'At commit', 0);
  const rows =
    b < 2
      ? [
          ['January', low, mid, gold],
          ['July', mid, null, mint],
          ...(proposal ? [['Proposal', date('2026-06-15'), date('2026-07-15'), coral]] : []),
        ]
      : [
          ['July', mid, commit ? date(asOf) : null, gold],
          ...(commit ? [['August', date(asOf), null, mint]] : []),
        ];
  rows.forEach(([name, a, z, col], i) => {
    const y = 431 + 137 * i;
    txt(c, name, 120, y + 15, 47, chalk, serif);
    interval(c, x, y, w, a, z, fn, col);
  });
  if (b === 1 && test) {
    const t = mix(date('2026-06-20'), date('2026-07-10'), later),
      xx = fn(t);
    stitch(c, xx, 325, xx, 787, chalk);
    txt(c, dateWord(t), xx, 308, 38, chalk, mono, 'center');
  }
  if (b < 2) {
    heading(c, 'Proposal: Jun 15 – Jul 15   ·   July edition starts Jul 1', 124, 895);
  } else {
    const writerSlot = cue(k, 2, 'take SQLite’s writer slot', 0, false),
      checked = cue(k, 2, 'checks the open edition', 0, false),
      closed = cue(k, 2, 'where the replacement starts', 0, false),
      document = cue(k, 2, 'new document', 0, false),
      paragraphs = cue(k, 2, 'paragraphs', 0, false),
      grants = cue(k, 2, 'grants', 0, false);
    heading(c, 'Committed view', 125, 320);
    if (commit) {
      heading(c, 'COMMIT   ·   Aug 12, noon UTC', 125, 775, 1670, gold);
    } else if (writerSlot) {
      heading(
        c,
        checked ? 'Writer slot held   →   open edition checked' : 'BEGIN IMMEDIATE   →   writer slot held',
        125,
        775,
      );
      const staged = [
        closed && 'close July',
        document && 'add August',
        paragraphs && 'insert paragraphs',
        grants && 'insert grants',
      ].filter(Boolean);
      if (staged.length) {
        heading(c, 'Staged in writer: ' + staged.join('  /  '), 125, 879, 1670, gold);
      }
    }
  }
}
