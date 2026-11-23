import {
  records,
  releaseRows,
  splitHash,
  splitName,
  splitSeed,
  fingerprint,
  normalize,
  releasedPartitions,
} from '../../../films/data-quality/fixtures.mjs';
import {
  leakageComparison,
  candidateRejectReason,
  fixtureNormalize,
  referenceSplit,
} from '../../../films/data-quality/model.mjs';
import { sha } from '../../../films/data-quality/arithmetic.mjs';
import {
  ink,
  paper,
  muted,
  teal,
  rust,
  blue,
  green,
  gold,
  mint,
  apricot,
  pale,
  shortHash,
  mix,
} from './printshop.mjs';

const before = leakageComparison(true),
  after = leakageComparison(false);
export function opening(d) {
  const { ground, cue, rect, line, dot, label, mono, title, center, chip, arrow, beat } = d;
  ground('', true);
  const close = cue(1, 'Fold case', 1.1),
    fold = cue(1, 'Fold case'),
    trim = cue(1, 'trim the spaces', 0.8);
  const withdraw = cue(3, 'Slide the training copy out', 1.2),
    rerun = cue(4, 'Standard');
  const scored = (beat === 2 && cue(2, 'Across all three')) || rerun;
  const result = withdraw === 1 ? after : before;
  mono('LOOKUP ROUTER', 40, 41, 15, mint);
  mono(withdraw === 1 ? 'c-52  /  c-51' : 'c-51   /   two turns', 630, 41, 18, paper);
  // The proof glass and its fixed stops give both impressions one reference edge.
  rect(34, 59, 892, 222, '#071e20');
  rect(40, 63, 880, 214, '#adc3b2');
  rect(52, 76, 856, 188, '#fff9e6');
  for (const x of [45, 915])
    for (const y of [69, 271]) {
      dot(x, y, 3, '#708d85');
      line(x - 2, y + 1, x + 2, y - 1, ink);
    }
  for (let i = 0; i < 42; i++) {
    const x = 100 + i * 18;
    line(x, 80, x, 80 + (i % 5 ? 4 : 9), '#aebca8');
  }

  // Two impressions use the same monospaced baseline after registration.
  const reg = (text, y, c, shift = 0) => {
    mono(text, 164 + shift, y, 32, c);
    line(130, y + 5, 145, y + 5, c, 2);
    line(138, y - 3, 138, y + 12, c, 2);
  };
  if (!withdraw) {
    mono('TRAINING   #101', 75, 107, 16, teal);
    mono('EVALUATION   #102', 601, 244, 16, rust);
    const a = fold ? normalize(records[0].text) : records[0].text;
    const b = fold ? normalize(records[1].text) : records[1].text.trim();
    reg(a, 147 + close * 26, teal);
    reg(b, 213 - close * 40, rust, 37 * (1 - trim));
    if (trim === 1) {
      line(165, 179, 565, 179, teal, 2);
      mono('same key', 665, 178, 17, teal);
    }
  } else {
    mono('TRAINING   #103', 74, 103, 16, teal);
    title(records[2].text, 94, 148, 33);
    line(75, 164, 885, 164, '#b9b9a5');
    mono('EVALUATION   #102', 74, 199, 16, rust);
    title(normalize(records[1].text), 94, 243, 33);
    if (withdraw < 1) {
      d.ctx.save();
      d.ctx.beginPath();
      d.ctx.rect(52, 75, 855, 86);
      d.ctx.clip();
      d.ticket(
        62 - withdraw * 900,
        75,
        850,
        84,
        'TRAINING    #101',
        records[0].text,
        '',
        mint,
        teal,
      );
      d.ctx.restore();
    }
  }
  const resolved = beat === 2 || rerun;
  mono(withdraw ? 'TRAINING LOOKUP' : 'TRAINING LABEL   #101', 42, 318, 15, mint);
  mono('PREDICTION   #102', 570, 318, 15, mint);
  chip(
    withdraw === 1 ? 'no matching entry' : withdraw ? 'checking…' : records[0].label,
    42,
    333,
    262,
    57,
    withdraw ? '#345252' : teal,
    paper,
    29,
  );
  if (resolved) arrow(330, 361, 537, 361, withdraw ? gold : mint, 4);
  chip(
    resolved ? result.answers[0].prediction : '?',
    568,
    333,
    345,
    57,
    resolved ? blue : '#355453',
    paper,
    32,
  );
  if (scored || beat === 3) {
    mono('PREDICTED / REVIEWED', 43, 418, 14, mint);
    result.answers.forEach((a, i) => {
      const x = 44 + i * 197;
      mono('#' + a.id, x, 450, 19, paper);
      if (scored) label(a.correct ? '✓' : '×', x + 65, 451, 25, a.correct ? mint : '#ffad8d');
      label((scored ? a.prediction : '?') + ' / ' + a.label, x, 481, 18, paper, { max: 181 });
    });
    label((scored ? result.correct : '?') + ' / ' + result.total + ' correct', 660, 455, 29, paper);
  } else if (beat === 1)
    label('Match → copy the training label       Miss → standard', 45, 454, 22, paper);
}

export function intake(d) {
  const { ground, cue, title, table, chip, beat } = d;
  ground('SUPPORT EXPORT   /   INTAKE');
  title('One message per row', 40, 108);
  const rows = records.slice(0, 4),
    checked = cue(2, 'missing value');
  table(
    [
      [50, 90, 'Ticket'],
      [140, 150, 'Thread'],
      [290, 388, 'Raw message'],
      [681, 141, 'Label'],
      [824, 100, 'Gate'],
    ],
    rows.map((r) => [
      r.id,
      r.conversation,
      '“' + r.text + '”',
      [r.label ?? 'missing', r.label ? ink : rust],
      checked ? [r.label ? 'pass' : 'hold', r.label ? green : rust] : '',
    ]),
    152,
    57,
  );
  if (beat === 2 && checked) chip('104   /   label required', 535, 408, 376, 53, rust);
  if (beat === 3) {
    chip('Missing labels    1 / 4', 42, 407, 345, 55, teal);
    d.label('Compare with the previous export.', 417, 441, 25);
  }
}

const typedIds = [9, '9', true, 10];
const shaped = typedIds.map((ticket_id, i) => ({
  ticket_id,
  conversation_id: 'c-9',
  text: 'Build stalled',
  label: 'escalate',
  ...(i === 3 ? { locale: 'en' } : {}),
}));
export function semantics(d) {
  const { ground, beat, cue, title, table, chip, rect, center, label, mono } = d;
  ground('INTAKE   /   LOCAL CHECK');
  if (beat < 3 || beat > 4) {
    title(beat < 3 ? 'Which IDs fit the contract?' : 'What did the gate check?', 40, 108);
    table(
      [
        [50, 145, 'ticket_id'],
        [198, 155, 'Type'],
        [353, 205, 'Extra field'],
        [558, 353, 'Schema decision'],
      ],
      shaped.map((r, i) => {
        const seen =
          beat > 2 ||
          [
            cue(1, 'positive integer'),
            cue(2, 'string nine'),
            cue(1, 'rejects true'),
            cue(2, 'extra locale'),
          ][i];
        const why = candidateRejectReason(r);
        return [
          JSON.stringify(r.ticket_id),
          ['int', 'str', 'bool', 'int'][i],
          r.locale ? 'locale = en' : '',
          seen ? [why || 'pass', why ? rust : green] : '?',
        ];
      }),
      155,
      53,
    );
    if (beat >= 5) {
      chip('Local decisions', 40, 408, 235, 56, teal);
      label(
        beat === 5 ? 'Failure policy → stop or quarantine' : 'Annotation record → still needed',
        309,
        445,
        28,
      );
    }
  } else {
    title('Same schema. A new annotation policy.', 40, 113);
    const changed = cue(3, 'only one of four');
    const a = ['standard', 'standard', 'standard', 'escalate'],
      b = ['standard', 'escalate', 'escalate', 'escalate'];
    for (const [i, values] of [a, changed ? b : null].entries()) {
      const y = 170 + i * 136;
      mono(i ? 'AFTER' : 'BEFORE', 42, y + 23, 16, teal);
      for (let j = 0; j < 4; j++) {
        const v = values?.[j];
        rect(160 + j * 180, y, 166, 63, v === 'escalate' ? apricot : v ? mint : '#d6d8cc');
        center(v || '?', 243 + j * 180, y + 40, 23);
      }
      if (values)
        label(
          values.filter((x) => x === 'standard').length + ' of 4 standard',
          161,
          y + 93,
          21,
          muted,
        );
    }
  }
}

export function normalization(d) {
  const { ground, beat, cue, strip, mono, title, arrow, chip } = d;
  ground('MATCHING   /   ORIGINAL AND COMPARISON COPY');
  const norm = cue(1, 'transformation'),
    hashed = cue(3, 'SHA-256');
  const list = beat === 3 ? [records[0], records[1], records[4]] : [records[0], records[1]];
  list.forEach((r, i) => {
    let y = 78 + i * 111;
    strip(37, y, 880, 92, paper, i === 1 ? rust : teal);
    mono('#' + r.id + '   ' + r.conversation + '   /   ' + r.label, 58, y + 24, 15, muted);
    title('“' + r.text + '”', 58, y + 63, 27, ink, 360);
    arrow(418, y + 52, 469, y + 52, teal);
    mono(norm ? normalize(r.text) : '?', 490, y + 57, 20, ink, 396);
    if (hashed) mono(shortHash(fingerprint(r.text)) + '…', 490, y + 82, 15, teal);
  });
  if (beat === 2) {
    title('ﬁle', 146, 402, 54);
    mono('U+FB01 + le', 135, 439, 16, muted);
    arrow(270, 383, 426, 383);
    title('file', 500, 402, 54);
    mono('f + i + le', 497, 439, 16, muted);
    mono('NFKC', 302, 368, 16);
  }
  if (beat === 3)
    chip('Exact lookup compares the full key and normalized string.', 40, 444, 877, 45, teal);
}

export function unicode(d) {
  const { ground, beat, cue, title, mono, label, chip, arrow, table } = d;
  ground('TYPE PROOF   /   UNICODE');
  if (beat < 3) {
    if (beat === 2) {
      title('Which spellings produce file2?', 42, 109);
      const examples = ['  ﬁle²  ', 'FILE2', 'file 2'];
      table(
        [
          [50, 410, 'Input'],
          [460, 445, 'Comparison key'],
        ],
        examples.map((s) => ['“' + s + '”', fixtureNormalize(s)]),
        171,
        73,
      );
      label('The internal space stays in the third key.', 43, 453, 26);
      return;
    }
    title('Compatibility forms', 42, 111);
    const samples = ['ﬁ', '²', 'Ａ', 'ß'];
    samples.forEach((s, i) => {
      const x = 43 + i * 222;
      d.strip(x, 155, 195, 214, paper, teal);
      d.center(s, x + 96, 233, 55);
      d.center(
        'U+' + s.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'),
        x + 96,
        182,
        15,
        muted,
      );
      d.center(i === 3 ? 'casefold' : 'NFKC', x + 96, 278, 16, muted);
      if (cue(1, i === 3 ? 'German sharp s' : 'Compatibility decomposition'))
        d.center(i === 3 ? fixtureNormalize(s) : s.normalize('NFKC'), x + 96, 342, 44, teal);
    });
    label('NFKC   →   full casefold   →   collapse whitespace', 46, 438, 26);
  } else if (beat < 5) {
    title('Which distinctions survive?', 43, 111);
    const words =
      beat === 3
        ? ['Straße', 'STRASSE', 'Prod', 'prod']
        : ['build passed', 'build not passed', 'Prod', 'prod'];
    table(
      [
        [48, 335, 'Original'],
        [382, 314, 'Normalized key'],
        [700, 214, 'Meaning to check'],
      ],
      words.map((s, i) => [
        s,
        fixtureNormalize(s),
        i < 2 ? (beat === 3 ? 'spelling' : 'negation') : 'resource name',
      ]),
      156,
      62,
    );
  } else {
    const word = fixtureNormalize('Straße'),
      bytes = [...Buffer.from(word)];
    title(word, 43, 133, 55);
    mono('UTF-8 BYTES', 46, 183, 16, teal);
    bytes.forEach((b, i) => chip(b.toString(16), 46 + 97 * i, 210, 81, 62, teal, paper, 28));
    mono('SHA-256   /   64 HEX DIGITS', 46, 334, 16, teal);
    if (cue(5, 'digest below')) mono(sha(word), 46, 387, 22, ink, 861);
    if (beat === 6) label('Record the recipe, Python version and Unicode version.', 46, 459, 24);
  }
}

export function duplicates(d) {
  const { ground, beat, cue, title, table, chip, ticket, arrow, mono } = d;
  ground('DUPLICATE REVIEW   /   NORMALIZED MESSAGE');
  if (beat <= 2) {
    title(normalize(records[5].text), 42, 119, 39);
    table(
      [
        [50, 170, 'Ticket'],
        [221, 216, 'Conversation'],
        [438, 229, 'Reviewed label'],
        [668, 240, 'Destination'],
      ],
      records
        .slice(5)
        .map((r) => [
          r.id,
          r.conversation,
          r.label,
          cue(1, 'whole group') ? ['review', rust] : '?',
        ]),
      170,
      65,
    );
    if (beat === 2)
      chip('Review record    {201, 202, 203}    /    c-71 and c-72', 42, 402, 868, 59, rust);
  } else {
    records
      .slice(0, 2)
      .forEach((r, i) =>
        ticket(
          42,
          90 + i * 135,
          520,
          112,
          '#' + r.id + '    ' + r.conversation,
          r.text.trim(),
          r.label,
          i ? apricot : mint,
        ),
      );
    if (cue(3, 'keeps 101')) {
      arrow(570, 148, 645, 148);
      chip('keep 101', 656, 117, 247, 60, green);
      arrow(570, 283, 645, 283, rust);
      chip('duplicate 102', 656, 252, 247, 60, rust);
    }
    mono('201, 202, 203   /   still in review', 42, 438, 21, muted);
  }
}

export function seededSplit(d) {
  const { ground, beat, cue, title, table, label, mono, ticket, chip, arrow } = d;
  ground('PARTITION   /   SEEDED POLICY');
  if (beat === 1) {
    title('Split unit', 42, 116);
    d.strip(45, 153, 872, 234, mint, teal);
    mono('CONVERSATION   c-51', 72, 194, 23, teal);
    [101, 102].forEach((id, i) =>
      ticket(
        76 + i * 399,
        215,
        370,
        131,
        'TURN    #' + id,
        records[i].text.trim(),
        'reviewed · escalate',
      ),
    );
    label('Both turns travel together.', 47, 451, 30);
  } else if (beat === 2) {
    mono(splitSeed + ' : conversation_id', 42, 117, 23);
    const show = cue(2, 'remainder');
    table(
      [
        [48, 137, 'Ticket'],
        [185, 192, 'Thread'],
        [377, 227, 'SHA prefix'],
        [605, 134, 'Bucket'],
        [739, 180, 'Split'],
      ],
      releaseRows.map((r) => {
        const h = splitHash(r.conversation);
        return [
          r.id,
          r.conversation,
          cue(2, 'first eight') ? h.prefix : '?',
          show ? h.bucket : '?',
          cue(2, 'land one each') ? splitName(h.bucket) : '?',
        ];
      }),
      176,
      72,
    );
    label('0–69  train           70–84  validation           85–99  test', 44, 453, 23);
  } else {
    title('One incident, two conversations', 42, 115);
    chip('Conversation K', 54, 171, 302, 61, teal);
    chip('Conversation L', 54, 266, 302, 61, teal);
    d.line(356, 202, 422, 202);
    d.line(356, 297, 422, 297);
    d.line(422, 202, 422, 297);
    arrow(422, 250, 517, 250);
    chip('Incident group', 530, 205, 345, 89, blue, paper, 31);
    label('For future incidents, add a time cutoff.', 48, 433, 28);
  }
}

export function grouping(d) {
  const { ground, beat, cue, title, table, chip, mono, label, arrow, line } = d;
  ground('PARTITION   /   ARTICLE POLICY');
  if (beat <= 4) {
    const byId = cue(3, 'ticket ID'),
      rows = [
        [301, 'build-001'],
        [315, 'build-001'],
        [303, 'build-005'],
        [304, 'build-006'],
      ].slice(0, beat === 1 ? 2 : 4);
    title(byId ? 'Hash the ticket ID' : 'Hash the conversation ID', 40, 112);
    table(
      [
        [49, 120, 'Ticket'],
        [170, 195, 'Conversation'],
        [366, 182, 'Hash input'],
        [549, 151, 'Prefix'],
        [700, 87, 'Bucket'],
        [787, 136, 'Split'],
      ],
      rows.map(([id, g]) => {
        const key = byId ? String(id) : g,
          h = referenceSplit(key);
        return [id, g, key, h.prefix, h.bucket, [h.split, byId && id === 315 ? rust : teal]];
      }),
      163,
      55,
    );
    if (beat === 4)
      label(
        'Bucket widths specify group assignment. Row counts depend on group sizes.',
        41,
        438,
        23,
        ink,
        { max: 872 },
      );
  } else {
    title('What could the router know at arrival?', 42, 109);
    line(71, 265, 885, 265, muted, 3);
    const items = [
      [128, 'Earlier turns', 'observed'],
      [468, 'Predict now', 'cutoff'],
      [802, 'Resolution', 'tomorrow'],
    ];
    items.forEach(([x, top, bottom], i) => {
      d.dot(x, 265, 10, i === 2 ? rust : teal);
      d.center(top, x, 224, 27);
      d.center(bottom, x, 309, 20, muted);
    });
    chip(
      beat === 5
        ? 'Fit preprocessing on train. Use features available at the cutoff.'
        : 'Assign or hold a crossing group under a declared policy.',
      46,
      414,
      860,
      53,
      teal,
    );
  }
}

export function checkTickets(assert) {
  assert.deepEqual([before.correct, after.correct], [2, 1]);
  assert.deepEqual(
    before.answers.map((r) => r.correct),
    [true, true, false],
  );
  assert.deepEqual(
    after.answers.map((r) => r.correct),
    [false, true, false],
  );
  assert.deepEqual(shaped.map(candidateRejectReason), [
    null,
    'invalid_ticket_id',
    'invalid_ticket_id',
    null,
  ]);
  assert.deepEqual(['  ﬁle²  ', 'FILE2', 'file 2'].map(fixtureNormalize), [
    'file2',
    'file2',
    'file 2',
  ]);
  assert.deepEqual(
    releaseRows.map((r) => releasedPartitions.get(r.conversation)),
    ['validation', 'train', 'test'],
  );
  assert.deepEqual(
    ['build-001', '301', '315'].map((k) => referenceSplit(k).split),
    ['train', 'train', 'validation'],
  );
}
