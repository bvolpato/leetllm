import { verify } from 'node:crypto';
import {
  records,
  releasedArtifact,
  releasedDigest,
  changedDigest,
  changedArtifact,
  referenceRows,
  freshRows,
} from '../../../films/data-quality/fixtures.mjs';
import {
  referenceCandidate as candidate,
  referenceBytes,
  referenceDigest,
  releaseTrace,
  referenceSplit,
  prepareCandidate,
  candidateInvariants,
  pythonFixtureJSONL,
  fixtureNormalize,
} from '../../../films/data-quality/model.mjs';
import { sha, tally } from '../../../films/data-quality/arithmetic.mjs';
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
  splitNames,
  shortHash,
} from './printshop.mjs';

export function smallRelease(d) {
  const { ground, beat, cue, title, chip, mono, label, table } = d;
  ground('CANDIDATE   /   EIGHT-ROW TICKET SNAPSHOT');
  if (beat === 1) {
    const stage = cue(1, 'two agreeing copies')
      ? 3
      : cue(1, 'three share')
        ? 2
        : cue(1, 'One lacks')
          ? 1
          : 0;
    const state = releaseTrace(stage / 4);
    title('Which rows continue?', 42, 109);
    records.forEach((r, i) => {
      const x = 40 + (i % 4) * 223,
        y = 150 + Math.floor(i / 4) * 94,
        keep = state.retained.includes(r);
      d.strip(x, y, 204, 74, keep ? mint : apricot, keep ? teal : rust);
      mono('#' + r.id, x + 15, y + 28, 22);
      label(
        keep
          ? r.conversation
          : r.id === 104
            ? 'missing label'
            : r.id === 102
              ? 'duplicate'
              : 'conflict',
        x + 16,
        y + 58,
        18,
        keep ? teal : rust,
      );
    });
    title(
      state.retained.length + (stage === 3 ? ' in candidate' : ' still in process'),
      42,
      422,
      43,
    );
    mono(state.excluded.length + ' excluded', 560, 416, 26, rust);
  } else {
    const edited = cue(3, 'byte change');
    title(edited ? 'Edited candidate rows' : 'Candidate rows and assignments', 41, 106);
    table(
      [
        [47, 89, 'Ticket'],
        [137, 129, 'Thread'],
        [266, 382, 'Message'],
        [648, 123, 'Label'],
        [771, 145, 'Split'],
      ],
      (edited ? changedArtifact : releasedArtifact).rows.map((r) => [
        r.id,
        r.conversation,
        [r.text, edited && r.id === 103 ? rust : ink],
        r.label,
        r.split,
      ]),
      155,
      67,
    );
    if (beat === 2)
      chip('Train has one standard ticket. Validation has the escalation.', 43, 403, 870, 57, teal);
    else {
      mono('Recorded SHA-256 prefix', 44, 394, 17, muted);
      mono(shortHash(releasedDigest), 44, 440, 23, teal);
      if (edited) {
        d.arrow(311, 424, 464, 424);
        mono('Edited bytes   ? → !', 486, 394, 17, muted);
        mono(shortHash(changedDigest), 487, 440, 23, rust);
      }
      if (cue(3, 'a trusted release record'))
        label('Publisher identity requires a trusted release record.', 44, 483, 20, teal);
    }
  }
}

const reasons = {
  invalid_label: 'missing label',
  label_conflict: 'conflicting labels',
  cross_conversation_duplicate: 'cross-conversation',
  exact_duplicate: 'exact duplicate',
  invalid_ticket_id: 'invalid ID',
};
const rejectById = new Map(candidate.rejected.map((r) => [r.ticket_id, r.reason]));
export function builder(d) {
  const { ground, beat, cue, title, mono, label, chip, table } = d;
  ground('CANDIDATE   /   TWELVE-ROW REFERENCE BUILD');
  if (beat === 1) {
    title('Read IDs across the whole export', 42, 113);
    referenceRows.forEach((r, i) => {
      const x = 42 + (i % 6) * 148,
        y = 147 + Math.floor(i / 6) * 97;
      d.strip(x, y, 132, 77, paper, teal);
      mono(r.ticket_id, x + 18, y + 34, 25);
      mono(r.conversation_id, x + 18, y + 60, 15, muted);
    });
    label('12 distinct integer IDs', 42, 417, 31);
  } else if (beat <= 5) {
    const pair = cue(4, 'look at the build messages')
      ? [401, 402]
      : cue(3, 'Try the next pair')
        ? [411, 412]
        : cue(2, 'two matching messages')
          ? [409, 410]
          : [404];
    const answered =
      pair[0] === 409
        ? cue(3, 'Both go to review')
        : pair[0] === 411
          ? cue(4, 'Send both to review')
          : pair[0] === 401
            ? cue(5, 'Keep four oh one')
            : cue(2, 'label is missing');
    title(
      pair.length === 1 ? 'Inspect the missing field' : 'Compare the matching tickets',
      41,
      109,
    );
    pair.forEach((id, i) => {
      const r = referenceRows.find((x) => x.ticket_id === id),
        x = 42 + i * 449;
      d.ticket(
        x,
        137,
        421,
        151,
        '#' + id + '    /    ' + r.conversation_id,
        fixtureNormalize(r.text),
        'Label   ' + (r.label ?? 'missing'),
        i ? pale : paper,
      );
      if (answered)
        chip(
          rejectById.has(id) ? reasons[rejectById.get(id)] : 'keep representative',
          x,
          303,
          420,
          55,
          rejectById.has(id) ? rust : green,
        );
    });
    const groups = [[404], [409, 410], [411, 412], [402]];
    const logged = groups.flatMap((ids, i) =>
      [
        cue(2, 'label is missing'),
        cue(3, 'Both go to review'),
        cue(4, 'Send both to review'),
        cue(5, 'Keep four oh one'),
      ][i]
        ? ids
        : [],
    );
    mono('REJECTION LOG', 43, 408, 16, teal);
    label(logged.length ? logged.map((x) => '#' + x).join('    ') : 'No entries yet', 43, 449, 25);
    if (beat === 5 && cue(5, 'Six kept')) mono('6 kept + 6 rejected = 12', 43, 488, 19, teal);
  } else if (beat === 6) {
    title('Assign by conversation', 42, 104);
    table(
      [
        [47, 130, 'Ticket'],
        [178, 250, 'Conversation'],
        [429, 219, 'Hash bucket'],
        [648, 264, 'Split'],
      ],
      candidate.kept.map((r) => [
        r.ticket_id,
        r.conversation_id,
        referenceSplit(r.conversation_id).bucket,
        r.split,
      ]),
      143,
      47,
    );
    mono('train   3         validation   2         test   1', 43, 475, 20, teal);
  } else {
    title('Two files and an unsigned manifest', 42, 107);
    const rows = [
      ['dataset.jsonl', candidate.kept.length, shortHash(referenceDigest)],
      [
        'rejects.jsonl',
        candidate.rejected.length,
        shortHash(sha(pythonFixtureJSONL(candidate.rejected))),
      ],
    ];
    table(
      [
        [49, 325, 'File'],
        [377, 165, 'Rows'],
        [545, 362, 'SHA-256 prefix'],
      ],
      rows,
      170,
      76,
    );
    mono('UTF-8   /   sorted fields   /   one LF per row', 43, 364, 22);
    label('Manifest records source, versions, split rule, counts and open reviews.', 42, 430, 22);
  }
}

const originalLog = pythonFixtureJSONL(candidate.rejected),
  logDigest = sha(originalLog);
function loadState(mode) {
  const rows =
    mode === 'row'
      ? [...candidate.kept, { ...candidate.kept[0], ticket_id: 999, split: 'test' }]
      : candidate.kept;
  const rejects =
    mode === 'log'
      ? candidate.rejected.map((r) =>
          r.ticket_id === 404 ? { ...r, reason: 'label_conflict' } : r,
        )
      : candidate.rejected;
  const bytes = referenceBytes + (mode === 'byte' ? '\n' : '');
  return {
    mode,
    rows,
    rejects,
    dataset: sha(bytes),
    log: sha(pythonFixtureJSONL(rejects)),
    reasons: tally(rejects, 'reason'),
    checks: candidateInvariants(rows, rejects, { bytes }),
  };
}
const versions = Object.fromEntries(
  ['original', 'row', 'byte', 'log'].map((m) => [m, loadState(m)]),
);
// The production example uses its own signed fixture and a pinned public key.
const releaseRecord = {
  release: 'dev-tickets-v1',
  rejects_sha256: '04f37e5ff7b44aa0276c46e7561697c8fb343a4a72a56c7a6410cd9d0b46360a',
  rejected_rows: 6,
};
const publisherKey = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAPw83tVYr106SpCA01/Nhdy8AQ+F0IqGN4QClkxEzvFw=
-----END PUBLIC KEY-----`;
const signature = Buffer.from(
  'Zt4BUteWrJKyP6WCw5yhrmW6NJceikPcGk/x/g6uOuDA/W9xaL0oG69N6O4V3O5jWABGPBJQgKSZAYGBPpGACw==',
  'base64',
);
function verifyRecord(record) {
  return verify(null, Buffer.from(JSON.stringify(record)), publisherKey, signature);
}
const authentic = verifyRecord(releaseRecord);
function publisherComparison(d, disk) {
  const signed = d.cue(7, 'signed release record');
  const checked = d.cue(7, 'Compare the log');
  const compared = checked && authentic && d.cue(7, 'even though');
  const matches = disk.log === releaseRecord.rejects_sha256;
  d.ground('PRODUCTION EXAMPLE   /   PUBLISHER AUTHENTICATION');
  d.title('Which rejection log belongs to this release?', 42, 110);
  d.strip(42, 147, 401, 186, paper, signed ? blue : muted);
  d.mono(signed ? 'Signed release record' : 'Expected rejection-log digest', 61, 182, 18, blue);
  if (signed) {
    d.label(checked && authentic ? 'Expected log SHA-256' : 'Recorded log SHA-256', 61, 219, 19, muted);
    d.mono(shortHash(releaseRecord.rejects_sha256) + '…', 61, 269, 32);
    d.label(releaseRecord.rejected_rows + ' rejected rows', 61, 311, 21);
    const status = checked
      ? (authentic ? 'Signature verified with the trusted publisher key.' : 'Signature verification failed.')
      : 'Verify the signature with the trusted publisher key.';
    d.label(status, 44, 370, 21, checked && authentic ? green : ink);
  } else {
    d.title('Which source can we trust?', 61, 266, 27, ink, 360);
  }
  d.strip(513, 147, 401, 186, paper, rust);
  d.mono('Edited rejection log on disk', 532, 182, 18, rust);
  d.label('SHA-256 of the edited file', 532, 219, 19, muted);
  d.mono(shortHash(disk.log) + '…', 532, 269, 32);
  d.label(disk.rejects.length + ' rejected rows', 532, 311, 21);
  if (compared) {
    d.center(matches ? '=' : '≠', 478, 266, 41, matches ? green : rust);
    d.label(matches ? 'The log matches the signed record.' : 'Hold the load. The edited log differs from the signed record.',
      44, 423, 27, matches ? green : rust);
  }
  if (d.beat === 8)
    d.label('Label quality, privacy and benchmark overlap each need their own review.', 44, 477, 21, muted);
}
const family = {
  groups: 'Group and split',
  bytes: 'File digests',
  schema: 'Row schema',
  fingerprints: 'Text fingerprints',
  unique: 'Unique IDs and text',
  counts: 'Manifest counts',
};
export function verifier(d) {
  const { ground, beat, cue, title, mono, label } = d;
  if (beat >= 7) return publisherComparison(d, versions.log);
  ground('LOADER   /   RELEASE MANIFEST');
  const mode =
    beat === 3 && cue(3, 'put it in test')
      ? 'row'
      : beat === 4 && cue(4, 'append one newline')
        ? 'byte'
        : cue(5, 'label conflict')
          ? 'log'
          : 'original';
  const s = versions[mode];
  if (beat <= 4) {
    const names = {
      original: 'Load the six retained tickets',
      row: 'In memory: copy #401 into test as #999',
      byte: 'On disk: append one LF byte',
    };
    title(names[mode], 40, 105);
    Object.entries(s.checks).forEach(([key, ok], i) => {
      const x = 42 + (i % 2) * 448,
        y = 137 + Math.floor(i / 2) * 80;
      d.strip(x, y, 419, 63, paper, beat === 1 ? muted : ok ? green : rust);
      label(family[key], x + 17, y + 39, 22);
      mono(
        beat === 1 ? '?' : ok ? 'PASS' : 'FAIL',
        x + 313,
        y + 40,
        22,
        beat === 1 ? muted : ok ? green : rust,
      );
    });
    mono(
      mode === 'row'
        ? '#401 train  ↔  #999 test    /    7 rows in memory'
        : mode === 'byte'
          ? '6 rows in memory    /    dataset digest ' + shortHash(s.dataset)
          : '6 retained rows    /    6 rejection entries',
      43,
      437,
      20,
      ink,
      875,
    );
  } else {
    title('Ticket #404 in the rejection log', 42, 106);
    d.chip(s.rejects.length + ' rejected rows', 648, 68, 270, 52, ink, paper, 26);
    mono('Recorded', 378, 157, 22, teal);
    mono('On disk', 676, 157, 22, teal);
    d.line(42, 170, 918, 170, muted);

    const comparison = (name, y, recorded, observed, reveal, isDigest = false) => {
      const display = (value) => isDigest ? shortHash(value) + '…' : value;
      label(name, 46, y, 27);
      mono(display(recorded), 378, y, 25);
      if (reveal) {
        const equal = recorded === observed;
        const color = equal ? green : rust;
        d.center(equal ? '=' : '≠', 630, y, 32, color);
        mono(display(observed), 676, y, 25, color);
      } else mono('?', 676, y, 25, muted);
    };
    const reason404 = (log) => log.rejects.find((row) => row.ticket_id === 404).reason;
    const original = versions.original;
    comparison('Reason for #404', 216, reason404(original), reason404(s), true);
    d.line(42, 238, 918, 238, muted);
    comparison('Rejection-log digest', 282, original.log, s.log, cue(6, 'changes'), true);
    comparison('Dataset digest', 334, original.dataset, s.dataset, cue(6, 'matches'), true);
    d.line(42, 355, 918, 355, muted);
    comparison('Invalid label', 397, original.reasons.invalid_label, s.reasons.invalid_label ?? 0, cue(6, 'zero'));
    comparison('Label conflict', 449, original.reasons.label_conflict, s.reasons.label_conflict, cue(6, 'three'));
  }
}

const splitRows = (rows, name) => rows.filter((r) => r.split === name);
export function coverage(d) {
  const { ground, beat, cue, title, mono, label, rect, chip, center, arrow } = d;
  ground('COVERAGE AUDIT   /   SIX RETAINED TICKETS');
  if (beat === 4) {
    title('Expected counts under independent labels and splits', 42, 108, 31);
    const total = candidate.kept.length;
    const labels = ['standard', 'escalate'];
    const totals = labels.map((label) => candidate.kept.filter((r) => r.label === label).length);
    d.table(
      [
        [50, 233, 'Split'],
        [282, 183, 'Rows'],
        [466, 212, 'Expected standard'],
        [678, 232, 'Expected escalate'],
      ],
      splitNames.map((name) => {
        const n = splitRows(candidate.kept, name).length;
        return [name, n, ...totals.map((t) => (n * t) / total)];
      }),
      170,
      67,
    );
    label('Six rows produce small expected counts in every cell.', 43, 439, 25);
    return;
  }
  if (beat <= 2 || beat >= 5) {
    title(
      beat >= 5
        ? 'Collect reviewed groups before comparison'
        : 'Count the reviewed labels in each split',
      42,
      111,
    );
    ['standard', 'escalate'].forEach((l, j) => mono(l.toUpperCase(), 287 + j * 306, 157, 18, teal));
    splitNames.forEach((name, i) => {
      const y = 180 + i * 81;
      mono(name, 47, y + 40, 21);
      ['standard', 'escalate'].forEach((lab, j) => {
        const rows = splitRows(candidate.kept, name).filter((r) => r.label === lab),
          x = 250 + j * 310;
        const seen = cue(1, ['Train contains', 'Validation contains', 'Test contains'][i]);
        d.strip(
          x,
          y,
          286,
          63,
          seen && rows.length ? mint : paper,
          seen && !rows.length ? rust : teal,
        );
        mono(seen ? rows.length : '?', x + 16, y + 42, 31, seen && !rows.length ? rust : ink);
        if (seen)
          mono(rows.map((r) => '#' + r.ticket_id).join(' '), x + 62, y + 38, 16, muted, 205);
      });
    });
    if (beat >= 2)
      label(
        beat >= 5
          ? 'Keep groups intact. Record the new split before comparing models.'
          : 'Validation has no reviewed escalations.',
        44,
        471,
        23,
      );
  } else {
    title(
      beat === 3
        ? 'Transport the same three masses'
        : 'Check assumptions before a significance test',
      42,
      105,
    );
    mono('Sample A', 44, 204, 18);
    mono('Sample B', 44, 354, 18);
    const x = (n) => 212 + (n - 1) * 211;
    [1, 2, 3, 4].forEach((n) => {
      center(n, x(n), 153, 18, muted);
      d.line(x(n), 165, x(n), 376, '#c3cbbd');
    });
    [1, 2, 3].forEach((n) => {
      d.dot(x(n), 200, 12, teal);
      d.dot(x(n + 1), 351, 12, rust);
      arrow(x(n) + 10, 214, x(n + 1) - 9, 337, blue, 3);
    });
    label(
      beat === 3
        ? 'Wasserstein distance = 1 length unit'
        : 'Repeated turns and tied lengths affect inference.',
      43,
      445,
      27,
    );
  }
}

const v1 = [{ text: 'build missing', label: 'escalate' }],
  v2 = [...v1, { text: 'break-glass request broken', label: 'standard' }];
const roots = [v1, v2].map((r) => shortHash(sha(pythonFixtureJSONL(r))));
export function retention(d) {
  const { ground, beat, cue, title, mono, label, chip, ticket, arrow, rect } = d;
  ground('DATASET HISTORY   /   BYTE IDENTITY');
  if (beat <= 2) {
    title('A different input changes the digest', 41, 110);
    [v1, v2].forEach((v, i) => {
      if (i && !cue(1, 'Adding the second row')) return;
      const y = 143 + i * 139;
      d.strip(42, y, 870, 118, i ? mint : paper, teal);
      mono('v' + (i + 1) + '    ' + roots[i] + '…', 62, y + 33, 22, teal);
      label(v.map((r) => r.text).join('    +    '), 62, y + 84, 28);
    });
    if (beat === 2)
      mono('Controlled comparison   /   model settings, seeds, evaluation policy', 43, 462, 18);
  } else if (beat <= 5) {
    title(
      beat === 5 ? 'Can the old snapshot still be read?' : 'What does this reference resolve to?',
      41,
      109,
    );
    const overwritten = cue(3, 'overwrites'),
      expired = cue(5, 'VACUUM can remove');
    ticket(
      43,
      142,
      407,
      125,
      beat === 5 ? 'HISTORICAL QUERY' : 'MUTABLE FILENAME',
      beat === 5 ? 'Table snapshot v1' : 'dev_tickets.v1.jsonl',
      beat === 5 ? 'Needs log and referenced data' : 'Rebuilding writes the same path',
      pale,
      blue,
    );
    arrow(453, 205, 510, 205);
    ticket(
      523,
      142,
      390,
      125,
      'REFERENCED DATA',
      expired
        ? 'Missing old bytes'
        : beat === 5
          ? 'Retained old bytes'
          : overwritten
            ? 'Second payload'
            : 'First payload',
      expired ? 'Historical read unavailable' : roots[beat === 5 || !overwritten ? 0 : 1] + '…',
      expired ? apricot : mint,
      expired ? rust : teal,
    );
    mono('RETAINED RELEASE REFERENCES', 42, 328, 16, teal);
    roots.forEach((v, i) =>
      chip('v' + (i + 1) + '   ' + v + '…', 42 + i * 448, 350, 422, 57, teal),
    );
    if (beat === 4)
      label('Cache keys support reuse. Publish the cryptographic digest.', 44, 466, 24);
  } else {
    title('What can a consumer use this dataset for?', 42, 111);
    d.ticket(
      43,
      152,
      419,
      185,
      'MANIFEST',
      'Reproduce the bytes',
      'Source, transforms, digests, counts',
      mint,
      teal,
    );
    d.ticket(
      495,
      152,
      419,
      185,
      'DATASHEET',
      'Judge fitness for use',
      'Purpose, permissions, limits, upkeep',
      paper,
      blue,
    );
    mono('Pending   /   label coverage, privacy, license and benchmark overlap', 42, 427, 18);
  }
}

const additions = [
  {
    ticket_id: 705,
    conversation_id: 'build-005',
    text: 'Where is the rollback guide?',
    label: 'standard',
  },
  {
    ticket_id: 706,
    conversation_id: 'build-006',
    text: 'Update the runbook link',
    label: 'standard',
  },
];
const first = prepareCandidate(freshRows),
  expanded = prepareCandidate([...freshRows, ...additions]);
const validation = splitRows(expanded.kept, 'validation');
const correct = validation.filter((r) => r.label === 'standard'),
  positives = validation.filter((r) => r.label === 'escalate');
export function finalPractice(d) {
  const { ground, beat, cue, title, mono, label, chip, table, ticket, rect, arrow, center } = d;
  if (beat <= 2) {
    ground('PRACTICE   /   FOUR NEW TICKETS');
    title('Which two tickets survive?', 41, 110);
    const folded = cue(2, 'Fold case'),
      keep = cue(2, 'keep the lower ID');
    table(
      [
        [48, 86, 'Ticket'],
        [135, 195, 'Conversation'],
        [331, 303, 'Message'],
        [633, 130, 'Label'],
        [764, 154, 'Builder'],
      ],
      freshRows.map((r) => {
        const reject = first.rejected.find((x) => x.ticket_id === r.ticket_id),
          invalid = typeof r.ticket_id === 'boolean';
        const decided = invalid ? cue(2, 'Boolean ID fails') : keep;
        return [
          String(r.ticket_id),
          r.conversation_id,
          folded && !invalid ? fixtureNormalize(r.text) : r.text,
          r.label,
          decided ? [reject ? reasons[reject.reason] : 'keep', reject ? rust : green] : '?',
        ];
      }),
      166,
      59,
    );
    if (cue(2, 'Two kept'))
      label(
        first.kept.length + ' kept + ' + first.rejected.length + ' rejected = ' + freshRows.length,
        44,
        457,
        30,
      );
  } else if (beat <= 4) {
    ground('PRACTICE   /   GROUP ROUTING');
    const added = cue(4, 'Bucket seventy-two'),
      second = cue(4, 'Ninety-six'),
      routed = cue(4, 'Both go to train');
    title(added ? 'Next candidate' : 'First candidate', 43, 109);
    const rows = [
      ...first.kept,
      ...(added ? [additions[0]] : []),
      ...(second ? [additions[1]] : []),
    ];
    table(
      [
        [49, 109, 'Ticket'],
        [158, 205, 'Conversation'],
        [364, 144, 'Bucket'],
        [509, 210, 'Reviewed label'],
        [719, 195, 'Assignment'],
      ],
      rows.map((r) => {
        const h = referenceSplit(r.conversation_id);
        return [r.ticket_id, r.conversation_id, h.bucket, r.label, routed ? [h.split, teal] : '?'];
      }),
      157,
      56,
    );
    if (routed) {
      mono(
        splitNames
          .map(
            (n) =>
              n + '  ' + rows.filter((r) => referenceSplit(r.conversation_id).split === n).length,
          )
          .join('     '),
        43,
        443,
        22,
      );
    } else mono('0–69 train       70–84 validation       85–99 test', 43, 443, 22);
  } else {
    ground('', true);
    mono('VALIDATION   /   REVIEWED CONVERSATION', 42, 41, 16, mint);
    const spoken = (b, phrase) =>
      beat > b || (beat === b && d.clock.elapsed + 1e-9 >= d.clock.wordCue(phrase).end);
    const r = validation[0],
      source = additions.find((a) => a.ticket_id === r.ticket_id),
      scored = spoken(5, 'gets the validation ticket right'),
      counted = spoken(5, 'One correct out of one'),
      zero = spoken(6, 'zero reviewed escalations in validation'),
      undefinedRecall = spoken(6, 'recall is undefined');
    ticket(
      42,
      78,
      873,
      156,
      '#' +
        r.ticket_id +
        '    /    ' +
        r.conversation_id +
        '    /    bucket ' +
        referenceSplit(r.conversation_id).bucket,
      source.text,
      'Reviewed label     ' + r.label,
      paper,
      teal,
    );
    mono('ALWAYS-STANDARD ROUTER', 42, 283, 18, mint);
    chip(scored ? 'standard   ✓' : 'standard', 42, 307, 370, 63, scored ? green : blue, paper, 31);
    if (counted)
      mono(correct.length + ' / ' + validation.length + ' correct', 43, 420, 30, paper);
    if (scored) {
      d.line(380, 234, 380, 298, mint, 3);
      d.arrow(380, 298, 380, 307, mint, 3);
    }
    mono('REVIEWED ESCALATIONS', 508, 283, 18, mint);
    // The empty tray itself is the denominator. Never draw a success token into it.
    rect(509, 307, 402, 63, '#29484b');
    d.line(509, 370, 911, 370, gold, 3);
    positives.forEach((r, i) => d.chip('#' + r.ticket_id, 515 + i * 110, 312, 100, 52, rust));
    if (zero) mono(positives.length + ' eligible conversations', 508, 402, 24, gold);
    if (undefinedRecall) label('Escalation recall is undefined.', 508, 433, 24, paper);
    if (beat === 7)
      label('Collect reviewed escalation groups before comparing routers.', 42, 66, 22, mint);
  }
}

export function checkRelease(assert) {
  assert.deepEqual(
    [0, 0.25, 0.5, 0.75].map((p) => releaseTrace(p).retained.length),
    [8, 7, 4, 3],
  );
  assert.deepEqual(
    candidate.kept.map((r) => r.ticket_id),
    [401, 403, 405, 406, 407, 408],
  );
  assert.deepEqual(Object.fromEntries(rejectById), {
    402: 'exact_duplicate',
    404: 'invalid_label',
    409: 'label_conflict',
    410: 'label_conflict',
    411: 'cross_conversation_duplicate',
    412: 'cross_conversation_duplicate',
  });
  assert.deepEqual(Object.values(versions.original.checks), Array(6).fill(true));
  assert.deepEqual(
    Object.entries(versions.row.checks)
      .filter(([, v]) => !v)
      .map(([k]) => k),
    ['groups', 'unique', 'counts'],
  );
  assert.deepEqual(
    Object.entries(versions.byte.checks)
      .filter(([, v]) => !v)
      .map(([k]) => k),
    ['bytes'],
  );
  assert.equal(versions.log.dataset, referenceDigest);
  assert.notEqual(versions.log.log, logDigest);
  assert.ok(authentic);
  assert.equal(releaseRecord.rejects_sha256, versions.original.log);
  assert.equal(releaseRecord.rejected_rows, versions.log.rejects.length);
  assert.equal(verifyRecord({ ...releaseRecord, rejects_sha256: versions.log.log }), false);
  assert.deepEqual(
    [
      versions.log.reasons.invalid_label ?? 0,
      versions.log.reasons.label_conflict,
      versions.log.rejects.length,
    ],
    [0, 3, 6],
  );
  assert.deepEqual(
    splitNames.map((s) =>
      ['standard', 'escalate'].map(
        (l) => splitRows(candidate.kept, s).filter((r) => r.label === l).length,
      ),
    ),
    [
      [0, 3],
      [2, 0],
      [1, 0],
    ],
  );
  assert.deepEqual(roots, ['6045599184e8', '551369eeb269']);
  assert.deepEqual(
    first.kept.map((r) => r.ticket_id),
    [701, 703],
  );
  assert.deepEqual(
    expanded.kept.map((r) => referenceSplit(r.conversation_id).bucket),
    [65, 54, 72, 96],
  );
  assert.deepEqual(
    correct.map((r) => r.ticket_id),
    [705],
  );
  assert.equal(positives.length, 0);
  assert.equal(additions[0].text, 'Where is the rollback guide?');
}
