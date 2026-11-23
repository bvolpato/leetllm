import { C, mix } from './art.mjs';
import {
  ARTICLE_RECORD as record,
  retentionText,
  exactIdentity,
  scaledCosine,
  prelookup,
  recordGate,
} from './cases.mjs';

function sentReply(f, x, y) {
  f.rect(x, y, 1060, 135, C.pale, 8);
  f.tag('Reply sent', x + 24, y + 42, C.navy);
  f.text(record.response, x + 24, y + 98, 37, C.navy, { max: 1012 });
}

export function opening(f) {
  const { b, on, cue, base, text, tag, title, line, calendar, book, rect, mono, mark } = f;
  base('Public API-key policy · fictional example');
  const live = b === 4,
    retain = b === 2 || b === 3;
  const shift = cue(0, 'Slide the saved reply', 1.1);
  calendar(94, 175 + 90 * (1 - shift), 1.14);
  tag('Saved question', 100, 919);
  text(record.source_query, 100, 970, 33);
  const x = 762;
  tag('Customer asks', x, 233);
  title(
    live ? 'What is the incident’s' : retain ? 'How long do revoked keys' : 'Can I restore',
    x,
    357,
    1040,
  );
  title(
    live ? 'current status?' : retain ? 'stay in audit logs?' : 'a revoked API key?',
    x,
    449,
    1040,
  );
  if (!live && !retain) line(x + 170, 379, x + 368, 379, C.gold, 8);
  if (retain) line(x, 379, x + 281, 379, C.navy, 8);
  if (live) line(x, 470, x + 440, 470, C.gold, 8);
  if (!retain && !live) {
    if (on(1, 'fetch the current restoration policy')) {
      book(x, 580, 0.87, 'Restoration policy');
    } else {
      line(x, 690, 1580, 690, C.grid, 3, [12, 14]);
      tag('Reply', x, 653);
      text(
        b === 0 ? 'Send the saved answer?' : 'The customer needs a restoration rule.',
        x,
        770,
        41,
      );
    }
  } else if (retain) {
    const hashed = on(2, 'Different text');
    if (hashed) {
      tag('Exact lookup · SHA-256 prefixes', x, 568);
      mono(
        exactIdentity(record.source_query).slice(0, 10) +
          '   ≠   ' +
          exactIdentity(retentionText).slice(0, 10),
        x,
        629,
        36,
      );
    }
    if (on(2, 'finds the saved one')) {
      line(x, 678, 1585, 678, C.blue, 4);
      text('Semantic candidate   ·   audit-log duration', x, 735, 39, C.navy);
    }
    if (on(3, 'Send the saved reply')) {
      const dy = 32 * (1 - cue(3, 'Send the saved reply', 0.7));
      sentReply(f, x, 785 + dy);
    }
  } else if (on(4, 'reads the live record')) {
    tag('Live incident record', x, 634);
    rect(x, 665, 770, 88, C.pale, 6);
    text('Read current status', x + 27, 724, 44, C.navy);
  } else text('Which source has the current status?', x, 660, 42);
}

export function contract(f) {
  const { b, on, base, title, tag, text, calendar, line, mono, arrow } = f;
  base('Response cache');
  title(b < 2 ? 'What does this answer depend on?' : 'A release gives the answer an address');
  calendar(110, 301, 0.98);
  if (b === 0 && !on(0, 'Now imagine')) {
    sentReply(f, 740, 418);
    return;
  }
  if (b < 2) {
    const routes = [
      ['“What about mine?”', 'Earlier conversation'],
      ['“What is its status now?”', 'Live incident record'],
      ['“Revoke this key.”', 'Authorized write'],
    ];
    routes.slice(0, b === 0 ? 1 : 3).forEach(([q, r], i) => {
      const y = 365 + i * 169;
      text(q, 740, y, 51, C.ink, { face: 'Serif' });
      line(741, y + 24, 1740, y + 24, C.grid);
      if (i > 0 || on(0, 'earlier conversation')) text(r, 742, y + 85, 38, C.rust);
    });
  } else {
    tag('Release identity', 735, 311);
    text('Model   +   prompt   +   policy   +   runtime', 735, 383, 42);
    arrow(758, 438, 758, 533, C.navy);
    tag('Stored response scope', 735, 611);
    ['Release & corpus', 'Tenant & access scope', 'Language & response format'].forEach((s, i) =>
      mono(s, 740, 682 + i * 73, 43),
    );
    text('Include other answer dependencies or route separately.', 740, 956, 34);
  }
}

export function bytes(f) {
  const { b, on, base, title, tag, text, mono, line, mark } = f;
  base('Exact response identity');
  title(
    b === 0
      ? 'Hash the question in its scope'
      : b === 1
        ? 'Read the bytes the caller sent'
        : 'Who supplies these fields?',
  );
  if (b === 2) {
    const pairs = [
      ['Caller text', 'Unchanged UTF-8 bytes'],
      ['Trusted middleware', 'Tenant, route, current access'],
      ['Request validator', 'Required fields and Boolean flags'],
    ];
    pairs.forEach(([l, r], i) => {
      const y = 365 + i * 171;
      tag(l, 145, y);
      line(145, y + 29, 1745, y + 29);
      text(r, 630, y, 51);
    });
    return;
  }
  tag('Input to scoped SHA-256', 110, 309);
  tag('Key prefix · hex', 1300, 309);
  const rows =
    b === 0
      ? [
          ['Stored', record.source_query, record.scope],
          ['Repeat', record.source_query, record.scope],
          ['Paraphrase', retentionText, record.scope],
          ['Release 8', record.source_query, { ...record.scope, release_id: 'R8-film-alias' }],
        ]
      : ['UserID', 'userid', 'User  ID', 'User ID'].map((v, i) => [
          i < 2 ? 'Identifier' : 'Literal',
          v,
          record.scope,
        ]);
  rows.forEach(([label, value, scope], i) => {
    const y = 407 + i * 130;
    line(110, y + 32, 1780, y + 32);
    tag(label, 110, y);
    mono(JSON.stringify(value), 367, y, b ? 52 : 32, C.ink, 888);
    const visible = b === 0 ? i < 2 || on(0, 'A paraphrase') : true;
    if (visible) mono(exactIdentity(value, scope).slice(0, 14), 1300, y, 39, C.navy);
  });
  if (b === 0 && on(0, 'wrong tenant'))
    mark(110, 960, false, 'Wrong tenant stops before hashing', 760);
}

export function authorization(f) {
  const { b, on, base, title, tag, text, line, rect, arrow, mark, key } = f;
  base('Current resource access');
  title('One document, two checks');
  tag('Stored scope', 120, 310);
  rect(120, 350, 690, 115, C.pale, 8);
  text('Tenant A  ·  policy reader', 145, 425, 47, C.navy);
  tag('Today’s caller', 1080, 310);
  rect(1080, 350, 710, 115, C.pale, 8);
  text('Tenant A  ·  policy reader', 1105, 425, 47, C.navy);
  line(815, 408, 1075, 408, C.blue, 4);
  tag('Current document permission', 120, 601);
  const denied = b === 2 && on(2, 'flag turn false');
  const pending = on(0, 'Today') && !denied;
  key(200, 711, 1.3, denied ? C.rust : pending ? C.muted : C.green);
  text(
    denied ? 'false' : pending ? 'Check again' : 'true yesterday',
    400,
    728,
    64,
    denied ? C.rust : C.ink,
  );
  arrow(950, 704, 1150, 704, C.muted);
  text(
    denied
      ? prelookup(false, 'public policy')
      : pending
        ? 'Verify access & versions'
        : 'Allowed at that time',
    1210,
    724,
    49,
    denied ? C.rust : C.green,
    { max: 580 },
  );
  if (denied) {
    mark(120, 860, false, 'Lookup stopped', 448);
    mark(635, 860, false, 'Generation stopped', 448);
  } else if (b === 2)
    text('Missing  /  "true"  /  1     →     invalid input', 136, 865, 39, C.rust);
}

const qVectors = [
  [0.99, 0.04],
  [0.94, 0.1],
];
function vectorAxes(f, x, y, len, input, color) {
  const { line, arrow, dot } = f,
    norm = Math.hypot(...input);
  line(x, y - len * 0.23, x, y + 45, C.grid, 3);
  arrow(x - 30, y, x + len + 36, y, C.navy, 5);
  for (const v of [0.25, 0.5, 0.75, 1]) line(x + v * len, y - 8, x + v * len, y + 8, C.muted, 2);
  arrow(x, y, x + (input[0] / norm) * len, y - (input[1] / norm) * len, color, 8);
  dot(x, y, 10, C.ink);
}
export function geometry(f) {
  const { b, cue, base, title, tag, text, mono, line } = f;
  base('Toy encoder · unit directions');
  title(
    b === 2 ? 'One candidate, two metric conventions' : 'How close are the question directions?',
  );
  const t = cue(1, 'rotate toward', 1.25);
  const ang = mix(Math.atan2(0.04, 0.99), Math.atan2(0.1, 0.94), t);
  const v = [Math.cos(ang), Math.sin(ang)],
    sim = scaledCosine([1, 0], v);
  vectorAxes(f, 145, 693, 951, v, t === 1 ? C.rust : C.blue);
  text('Stored question   (1, 0)', 465, 761, 39, C.navy);
  text(
    t === 1 ? 'Restore a key?' : t === 0 ? 'How long in the audit log?' : 'Rotating direction',
    440,
    438,
    48,
    t === 1 ? C.rust : C.navy,
  );
  line(952, 470, 145 + v[0] * 951, 693 - v[1] * 951 - 17, C.grid, 2, [6, 9]);
  tag('Cosine similarity', 1240, 420);
  mono(sim.toFixed(4), 1240, 520, 76);
  if (b === 2) {
    tag('Distance = 1 − similarity', 1240, 666);
    mono((1 - sim).toFixed(4), 1240, 768, 76, C.rust);
  } else text('Dot product of unit vectors', 1200, 661, 34, C.muted);
}
export function numeric(f) {
  const { b, on, base, title, tag, text, mono, middle, line } = f;
  base('Toy vectors · cosine similarity');
  title(b < 2 ? 'A horizontal unit vector selects x' : 'Keep the direction at extreme scales');
  if (b < 2) {
    qVectors.forEach((v, i) => {
      const x = 125 + i * 890,
        color = i ? C.rust : C.navy;
      tag(i ? 'Restore a key?' : 'Audit-log duration', x, 311, color);
      vectorAxes(f, x + 25, 512, 580, v, color);
      mono('(' + v.join(', ') + ')', x, 606, 42, color);
      mono(v[0] + ' / ' + Math.hypot(...v).toFixed(5), x, 708, 49);
      if (i === 0 ? on(1, 'Try the same division') : on(1, 'These two directions'))
        text('≈ ' + scaledCosine([1, 0], v).toFixed(4), x, 860, 74, color, { face: 'Serif' });
    });
  } else {
    const scaled = on(2, 'Divide each vector'),
      finished = on(2, 'giving a cosine') && f.done(2);
    const columns = [
      ['[10³⁰⁸, 10³⁰⁸]', '[1, 1]', '½'],
      ['[10³⁰⁸, −10³⁰⁸]', '[1, −1]', '−½'],
    ];
    columns.forEach(([v, s], i) => {
      let x = 135 + 900 * i;
      tag('Vector ' + (i + 1), x, 320);
      mono(v, x, 423, 54);
      if (scaled) {
        f.arrow(x + 60, 474, x + 60, 549, C.muted);
        mono(s, x, 646, 78, C.green);
      }
    });
    if (finished) mono('Unit dot product     ½ − ½ = 0', 135, 794, 55, C.navy);
    if (b === 3)
      text('Require equal nonempty dimensions, finite numbers and nonzero lengths.', 135, 923, 37);
  }
}

export function retrieval(f) {
  const { b, on, cue, base, title, tag, text, mono, rect, line, arrow } = f;
  base('Filtered vector index');
  title(b === 2 ? 'Convert the cutoff to index units' : 'Which records can this caller search?');
  if (b === 2) {
    tag('Minimum similarity', 155, 372);
    mono('0.995', 155, 500, 105);
    arrow(625, 465, 990, 465, C.navy, 7);
    tag('Maximum cosine distance', 1060, 372);
    mono('1 − 0.995', 1060, 500, 73);
    if (f.done(2)) mono('= 0.005', 1060, 634, 98, C.green);
    text('Cosine distance = 1 − similarity', 155, 832, 51, C.ink, { face: 'Serif' });
    return;
  }
  const records = [
    ['A', 'public', 'R7'],
    ['B', 'internal', 'R7'],
    ['C', 'public', 'R8'],
    ['D', 'public', 'R7'],
  ];
  const filter = cue(0, 'Only A and D', 1.1);
  records.forEach(([id, tenant, release], i) => {
    const x = 155 + i * 430,
      pass = tenant === 'public' && release === 'R7';
    const y = 380 + (!pass ? filter * 155 : 0);
    rect(x, y, 305, 208, pass && filter ? C.pale : C.light, 8);
    tag('Record ' + id, x + 24, y + 54);
    text(tenant, x + 24, y + 119, 48);
    mono(release, x + 24, y + 170, 40);
    if (filter === 1)
      text(pass ? 'Search' : 'Excluded', x + 14, y + 263, 35, pass ? C.green : C.rust);
  });
  if (b || on(0, 'recheck current access'))
    text(
      'Filter tenant, permissions and release in the query. Recheck the returned record.',
      155,
      918,
      39,
    );
}

export function gateOrder(f) {
  const { b, on, after, base, title, tag, text, mono, line, mark } = f;
  base('Request trace');
  title(
    b < 2
      ? 'Find the first stop'
      : b < 4
        ? 'One second changes the first failure'
        : 'A structurally valid proposal',
  );
  if (b < 2) {
    const entries = [
      ['A', 'Revoked', 'Unknown', prelookup(false, 'unknown')],
      ['B', 'Current', 'Live incident', prelookup(true, 'live incident')],
    ];
    entries.forEach(([id, perm, route, out], i) => {
      const y = 423 + 204 * i;
      tag('Request ' + id, 115, y);
      text(perm, 415, y, 46);
      text(route, 770, y, 46);
      if (i ? on(0, 'Bypass answer lookup') : on(0, 'Deny that caller'))
        mark(1320, y - 1, false, out, 398);
      line(115, y + 63, 1770, y + 63);
    });
    tag('Permission', 415, 298);
    tag('Trusted route', 770, 298);
    tag('Outcome', 1320, 298);
    if (b === 1) text('Semantic scores recorded     0', 115, 851, 53, C.navy);
  } else if (b < 4) {
    const expiry = 4600;
    const score = NaN;
    const invalidInputs = on(2, 'Both test inputs supply an invalid score');
    const expired = after(2, 'stops at expiry');
    const stopped = after(2, 'before admission or score');
    const fresh = after(3, 'Its record is fresh');
    const approved = after(3, 'its approval matches');
    const invalid = after(3, 'rejects it');
    const columns = [115, 495, 917, 1339];
    const earlier = expiry - 1;
    if (invalidInputs) tag('Both inputs carry NaN', columns[0], 292, C.muted);
    const checks = ['Request clock', 'Expiry check', 'Approval check', 'Score check'];
    for (const [i, label] of checks.entries())
      tag(label, columns[i], 411);

    mono(expiry.toLocaleString('en-US') + ' s', columns[0], 540, 52);
    if (expired) mark(columns[1], 534, false, recordGate(expiry, score), 314);
    if (stopped) {
      text('Not reached', columns[2] + 18, 538, 34, C.muted);
      text('Not reached', columns[3] + 18, 538, 34, C.muted);
    }
    line(columns[0], 603, 1780, 603);

    mono(earlier.toLocaleString('en-US') + ' s', columns[0], 740, 52);
    if (fresh) mark(columns[1], 734, true, 'Fresh', 314);
    if (approved) mark(columns[2], 734, true, 'Approved', 314);
    if (invalid) mark(columns[3], 734, false, recordGate(earlier, score), 375);
    line(columns[0], 803, 1780, 803);
    if (expired)
      text(
        'Fresh while request clock < ' + expiry.toLocaleString('en-US') + ' s',
        columns[0],
        906,
        45,
        C.ink,
        { face: 'Serif' },
      );
  } else {
    f.calendar(115, 320, 0.88);
    tag('Public-policy request', 710, 370);
    text('“Can I restore a revoked key?”', 710, 472, 61, C.ink, { face: 'Serif', max: 1070 });
    mono(scaledCosine([1, 0], [0.94, 0.1]).toFixed(4) + ' ≥ 0.990', 710, 627, 62);
    if (on(4, 'proposes the retention answer'))
      text('Shadow proposal   ·   30 days', 710, 745, 45, C.navy);
    if (on(4, 'missing restoration rule'))
      text('Review   ·   restoration rule missing', 710, 850, 43, C.rust);
  }
}
export function indexVersion(f) {
  const { b, on, cue, base, title, tag, text, mono, line, dot, rect, calendar } = f;
  base('Retrieval manifest');
  title('The encoder owns the coordinates');
  const reset = on(1, 'return to the first encoder'),
    move = reset ? 0 : cue(1, 'Switch to a different encoder', 1.3);
  const changedSearch = on(1, 'change only the search policy');
  tag('Illustrative coordinates', 140, 308);
  line(165, 771, 901, 771, C.muted, 4);
  line(165, 771, 165, 360, C.muted, 4);
  [
    [0.24, 0.18, 0.7, 0.85],
    [0.5, 0.38, 0.24, 0.55],
    [0.72, 0.65, 0.51, 0.34],
  ].forEach(([x, y, nx, ny], i) => {
    const px = 165 + mix(x, nx, move) * 690,
      py = 770 - mix(y, ny, move) * 384;
    if (i === (changedSearch ? 2 : 1) && (move === 0 || move === 1)) {
      f.ctx.beginPath();
      f.ctx.arc(px, py, 24, 0, 2 * Math.PI);
      f.ctx.strokeStyle = C.green;
      f.ctx.lineWidth = 4;
      f.ctx.stroke();
    }
    dot(px, py, 12, i === 0 ? C.gold : C.blue);
    if (move === 0 || move === 1)
      mono(i === 0 ? 'query' : i === 1 ? 'P1' : 'P2', px + 24, py + 8, 27);
  });
  mono(move === 1 ? 'Encoder E2' : move === 0 ? 'Encoder E1' : 'Re-embedding', 154, 853, 42);
  if (move === 0 || move === 1)
    text('Approximate search returned ' + (changedSearch ? 'P2' : 'P1'), 140, 917, 35, C.green);
  tag('Approved response', 1090, 312);
  calendar(1100, 390, 0.88);
  if (b === 0) text('Pin encoder, index, search settings and traffic.', 105, 981, 34, C.muted);
}
