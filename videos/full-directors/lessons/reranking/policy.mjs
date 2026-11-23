import { C, mix } from './paint.mjs';
import {
  names,
  rule,
  prefix,
  referenceRule,
  snapshot,
  sameRecord,
  policy,
  docRoom,
  docTokens,
  query,
  tokens,
  digest,
  learnedScores,
  releaseReceipt,
} from './evidence.mjs';
function stamp(p, x, y, label, ok, w = 350) {
  const color = ok ? C.teal : C.red;
  p.box(x, y, w, 84, ok ? C.mint : C.rose, color, 3);
  p.mono(label, x + w / 2, y + 56, 35, color, 'center');
}
export function access(p) {
  p.base('Policy archive', 'Source binding');
  if (p.b <= 2) {
    p.title('Reading permission precedes scoring');
    p.sheet(105, 282, 866, 614);
    p.mono('SERVICE ACCOUNT   /   DAY 10', 153, 357, 32, C.blue);
    p.text('AUTH-14', 151, 476, 79, C.ink, 'Serif');
    p.words(referenceRule.slice(14), 151, 559, 764, 45, 63);
    p.mono('Audit logging on', 153, 831, 31, C.teal);
    p.text('Permitted shortlist', 1037, 319, 49, C.ink, 'Serif');
    names.forEach((s, i) => {
      const y = 419 + i * 95;
      p.mono(i + 1, 1053, y, 36, C.blue);
      p.text(s, 1132, y, 44, i === 2 ? C.teal : C.ink);
    });
    if (p.at(2, 'An admin-only rule')) {
      p.line(1036, 758, 1790, 758, C.red, 4);
      p.mono('OUTSIDE THE SHORTLIST', 1037, 811, 28, C.red);
      p.words('Admin-only record · superseded revision', 1037, 869, 760, 36, 46);
    }
    return;
  }
  if (p.b <= 4) {
    const changed = p.b === 3 && p.at(3, 'Read the last line');
    const parentChanged = p.at(4, 'but change its parent');
    const returned = {
      ...snapshot,
      ...(parentChanged
        ? { parent: 'audit-export' }
        : changed
          ? { text: referenceRule.replace(' when audit logging is enabled', '') }
          : {}),
    };
    const rejected =
      !sameRecord(snapshot, returned) &&
      (p.b === 4 ? p.at(4, 'That mismatch') : p.at(3, 'Reject the changed'));
    p.title('Compare the complete record');
    for (const [i, record] of [snapshot, returned].entries()) {
      const x = 110 + i * 878;
      p.sheet(x, 280, 820, 565);
      p.mono(i ? 'SCORER RETURN' : 'TRUSTED SEARCH RECORD', x + 42, 352, 32, i ? C.blue : C.teal);
      p.mono(record.id, x + 42, 443, 38);
      p.mono(record.revision, x + 42, 504, 32, C.muted);
      p.text('Parent', x + 42, 579, 31, C.muted);
      p.mono(record.parent, x + 197, 579, 35, record.parent !== snapshot.parent ? C.red : C.ink);
      p.line(x + 39, 627, x + 781, 627, C.faint, 3);
      p.words(record.text, x + 42, 692, 731, 36, 48, record.text !== snapshot.text ? C.red : C.ink);
    }
    if (rejected) stamp(p, 1250, 887, 'REJECT RECORD', false, 552);
    return;
  }
  p.title('Recheck the grant at the handoff');
  const revoked = p.at(5, 'loses access');
  const stages = ['Retrieve', 'Score', 'Pack'];
  stages.forEach((s, i) => {
    const x = 130 + i * 595;
    p.text(s, x, 389, 64, C.ink, 'Serif');
    p.line(x, 426, x + 449, 426, C.faint, 5);
    if (i < 2) {
      p.sheet(x, 481, 440, 211);
      p.mono('AUTH-14', x + 36, 569, 50, C.teal);
      p.text('Current · permitted', x + 36, 635, 35);
    } else if (revoked) {
      stamp(p, x, 507, 'REVOKED', false, 440);
      p.text('Passage withheld', x, 660, 35, C.red);
    } else {
      p.box(x, 481, 440, 211, C.paper, C.faint, 3);
      p.text('Check current grant', x + 30, 605, 36, C.muted);
    }
    if (i < 2) p.arrow(x + 463, 582, x + 559, 582, C.muted);
  });
}
export function points(p) {
  p.base('Policy archive', 'Hand-written phrase scorer');
  if (p.b === 1) {
    p.title('What earns a point?');
    const features = [
      ['Endpoint phrase', '+2', 'Match the endpoint'],
      ['Requested remedy', '+3', 'the requested remedy'],
      ['Service accounts', '+1', 'and service accounts'],
      ['14-day window', '+2', 'Add two for'],
      ['Active auditing', '+2', 'and two for active'],
      ['Disclaimer', '−6', 'A troubleshooting disclaimer'],
    ];
    features.forEach(([s, n, phrase], i) => {
      const x = 115 + (i % 3) * 577,
        y = 318 + Math.floor(i / 3) * 283;
      p.sheet(x, y, 528, 224);
      p.text(s, x + 30, y + 70, 40, C.ink, 'Serif');
      if (p.at(1, phrase)) p.mono(n, x + 30, y + 175, 74, i === 5 ? C.red : C.teal);
    });
    return;
  }
  if (p.b < 4) {
    const s = policy(10, true),
      ordered = p.b === 3 ? s.order : [0, 1, 2, 3],
      pack = p.at(3, 'Only the governing rule');
    p.title(p.b === 2 ? 'Score the four passages' : 'Select from the sorted passages');
    p.mono('PASSAGE', 125, 308, 28, C.muted);
    p.mono('MATCHED TERMS', 758, 308, 28, C.muted);
    p.mono('SCORE', 1346, 308, 28, C.muted);
    ordered.forEach((id, i) => {
      const y = 394 + i * 113,
        ink = id === 2 ? C.teal : C.ink;
      p.text(names[id], 125, y, 49, ink, 'Serif');
      p.mono(
        s.terms[id].length ? s.terms[id].join(' + ').replace('+ -', '− ') : '0',
        758,
        y,
        40,
        C.muted,
      );
      const seen = [
        p.at(2, 'Troubleshooting gets'),
        p.at(2, 'Password reset gets'),
        p.at(2, 'The audit-export note'),
        p.at(2, 'despite referring'),
      ];
      p.mono(seen[id] ? s.points[id] : '·', 1394, y, 56, ink);
      p.line(124, y + 25, 1786, y + 25, C.faint, 2);
    });
    if (pack) {
      p.box(120, 852, 1645, 105, C.mint);
      p.mono('≥ 5', 155, 922, 42, C.teal);
      p.text('Slot 1   AUTH-14', 547, 922, 43, C.teal);
      p.text('Slot 2   empty', 1197, 922, 43, C.muted);
    }
    return;
  }
  p.title('A rule can be relevant to a refusal');
  p.text('Service account   ·   days 0–14 inclusive   ·   audit logging on', 108, 284, 42, C.teal);
  const rows = [[10, true]];
  if (p.at(4, 'Try day fifteen')) rows.push([15, true]);
  if (p.at(4, 'Then try day ten')) rows.push([10, false]);
  const xs = [126, 465, 792, 1115, 1459];
  ['Day', 'Logging', 'Points', 'In prompt', 'Allow use'].forEach((s, i) =>
    p.text(s, xs[i], 412, 34, C.muted),
  );
  rows.forEach(([d, a], i) => {
    const s = policy(d, a),
      y = 528 + i * 151,
      scoreKnown = i === 0 || p.at(4, 'The rule gets packed'),
      decided = i === 0 || p.at(4, 'Both requests are denied');
    [
      d,
      a ? 'On' : 'Off',
      scoreKnown ? s.points[2] : '?',
      scoreKnown ? (s.admitted.includes(2) ? 'Yes' : 'No') : '?',
      decided ? (s.permit ? 'Yes' : 'No') : '?',
    ].forEach((v, j) =>
      p.text(v, xs[j], y, 61, j === 4 && decided && !s.permit ? C.red : C.ink, 'Serif'),
    );
    p.line(124, y + 38, 1795, y + 38, C.faint, 3);
  });
}

const policyLines = [
  'Rule AUTH-14. Service accounts',
  'may use the legacy token',
  'endpoint within 14 days',
  'of deprecation if',
  'audit logging is active.',
];
const libraryLines = [
  'Building guide: reading rooms,',
  'maps, desks, study spaces.',
  'Services: borrowing, returns,',
  'printing and events.',
  'Sunday: the library is closed.',
];
function readerWindow(p, x, label, lines, count, found) {
  const y = 280,
    w = 813,
    dy = 68;
  p.box(x + 8, y + 8, w, 588, '#c3b299');
  p.box(x, y, w, 588, C.ink);
  p.box(x + 9, y + 9, w - 18, 570, C.white);
  p.box(x + 9, y + 9, w - 18, 85, label === 'Scorer' ? C.blue : C.teal);
  p.text(label, x + 43, y + 67, 47, C.white, 'Serif');
  const top = y + 127;
  const edge = top + dy * count;
  p.clip(x + 9, top - 12, w - 18, edge - top + 12, () => {
    lines.forEach((s, i) =>
      p.text(s, x + 40, top + 48 + i * dy, 46, i === 4 ? C.teal : C.ink, 'Serif'),
    );
  });
  p.box(x + 9, edge + 3, w - 18, y + 577 - edge, C.faint);
  p.line(x + 10, edge, x + w - 10, edge, label === 'Scorer' ? C.blue : C.teal, 9);
  for (const k of [24, w - 24]) p.dot(x + k, edge, 6, C.brass);
  if (found !== null)
    p.mono('“audit logging”   ' + found, x + 8, 953, 37, found === 'true' ? C.teal : C.red);
}
export function spans(p) {
  p.base('Reading windows', p.b === 1 ? 'Building guide' : 'AUTH-14  /  same page');
  p.title(p.b === 1 ? 'One page, two views' : 'Where does each reader stop?');
  const library = p.b === 1,
    lines = library ? libraryLines : policyLines;
  p.box(91, 265, 1737, 620, '#cfbfa6');
  p.box(921, 265, 85, 620, '#b1a58f');
  p.line(961, 271, 961, 876, '#837b68', 3);
  const cut = library ? p.at(1, 'Cut the scorer', 0.85) : p.at(2, 'Stop the scorer', 0.9);
  const reverse = p.at(4, 'Give the scorer the full rule', 0.9);
  const counts = [5 - cut + reverse, 5 - reverse];
  counts.forEach((n, i) => {
    const search =
      (reverse === 0 || reverse === 1) &&
      (i === 0 ? p.at(3, 'Look across the gutter') : p.at(3, 'Its window includes'));
    readerWindow(
      p,
      102 + i * 904,
      i ? 'Generator' : 'Scorer',
      lines,
      n,
      search ? String((n === 4 ? prefix : rule).includes('audit logging')) : null,
    );
  });
}
export function ledger(p) {
  p.base('Pair tokenizer', 'Lowercase · whitespace split');
  if (p.b < 3) {
    p.title('Reserve the query before cutting the page');
    p.words(query, 110, 306, 1650, 47);
    const special = p.at(1, 'Reserve three'),
      q = p.at(1, 'Keep the entire'),
      d = p.at(2, 'Background fills');
    // Logical budget, shown by role rather than model-template order.
    for (let i = 0; i < 24; i++) {
      const x = 111 + i * 70;
      const fill =
        i < 3 && special
          ? C.brass
          : i >= 3 && i < 14 && q
            ? C.blue
            : i >= 14 && d
              ? C.teal
              : C.faint;
      p.box(x, 417, 62, 116, fill);
      p.mono(i + 1, x + 31, 578, 27, C.muted, 'center');
    }
    p.text('24 positions', 110, 690, 53, C.ink, 'Serif');
    if (special) p.text('− 3 special', 475, 690, 49, C.gold);
    if (q) p.text('− 11 query', 835, 690, 49, C.blue);
    if (p.b === 2) p.text('= ' + docRoom + ' document', 1240, 690, 49, C.teal);
    if (d)
      p.words('Scored prefix: ' + docTokens.slice(0, docRoom).join(' '), 115, 810, 1610, 42, 54);
    return;
  }
  if (p.b === 5) {
    p.title('Where does the condition live?');
    p.sheet(131, 302, 1652, 570);
    p.mono('SCORED WINDOW', 186, 396, 33, C.blue);
    p.words('Service accounts may use the legacy token endpoint', 187, 503, 1480, 66, 84);
    p.line(187, 650, 1720, 650, C.gold, 6);
    p.mono('NEIGHBORING CONDITION', 188, 716, 31, C.muted);
    p.words('within 14 days of deprecation when audit logging is enabled.', 188, 802, 1475, 47);
    return;
  }
  const reverse = p.b === 6;
  p.title(reverse ? 'Check what survived packing' : 'Compare the scored and packed spans');
  const list = [docTokens.slice(0, docRoom), docTokens];
  if (reverse) list.reverse();
  list.forEach((arr, i) => {
    const x = 115 + i * 885,
      full = arr.length === docTokens.length,
      col = i ? C.teal : C.blue;
    p.sheet(x, 303, 815, 543);
    p.mono(i ? 'GENERATOR' : 'SCORER', x + 47, 377, 34, col);
    p.text('Document words 1–' + arr.length, x + 47, 474, 47, C.ink, 'Serif');
    p.words(
      full ? '… ' + docTokens.slice(-12).join(' ') : arr.join(' '),
      x + 47,
      555,
      710,
      38,
      50,
      C.ink,
    );
    p.line(x + 44, 737, x + 766, 737, C.faint, 3);
    p.mono(digest([...tokens(query), ...arr]).slice(0, 12) + '…', x + 47, 808, 37, col);
  });
  p.text(
    p.b === 4
      ? 'Record the source revision, exact text, span and tokenizer.'
      : 'Different normalized lists',
    119,
    952,
    43,
    reverse ? C.red : C.ink,
  );
}
export function learned(p) {
  p.base('Article replay', 'MiniLM-L6-v2');
  if (p.b <= 2) {
    p.title('Which rule answers the changed request?');
    const changed = p.at(1, 'Change the request'),
      known = p.b === 2 && p.at(2, 'Both numbers');
    const draw = (x, index, show) => {
      const vals = learnedScores[index];
      p.sheet(x, 297, 821, 573);
      p.mono(index ? 'DAY 15   /   AUDIT OFF' : 'DAY 10   /   AUDIT ON', x + 43, 373, 34, C.blue);
      const order = names.map((_, i) => i).sort((a, b) => vals[b] - vals[a]);
      if (show)
        order.forEach((id, i) => {
          const y = 485 + i * 90;
          p.text(names[id], x + 44, y, 43, id === 2 ? C.teal : C.ink, 'Serif');
          p.mono(vals[id].toFixed(2), x + 763, y, 39, id === 2 ? C.teal : C.ink, 'right');
        });
      else p.text('Which passage ranks first?', x + 45, 579, 43, C.muted, 'Serif');
    };
    draw(108, 0, p.at(1, 'and ranks first'));
    if (changed) draw(994, 1, known);
    if (known) {
      p.text('Rule permits this request.', 111, 954, 44, C.teal, 'Serif');
      p.text('Rule denies this request.', 999, 954, 44, C.red, 'Serif');
    }
    return;
  }
  p.title('A condition beyond the input limit');
  const same = p.at(3, 'Keep those identical inputs');
  for (let i = 0; i < 2; i++) {
    const y = 394 + i * 230;
    const tail = i && p.at(3, 'Append the audit requirement');
    p.text(
      tail ? 'Same filler, then an audit condition' : 'Permissive sentence × 80',
      104,
      y - 21,
      43,
      C.ink,
      'Serif',
    );
    for (let j = 0; j < 32; j++) p.box(109 + j * 36, y + 18, 33, 78, C.blue);
    p.box(1262, y + 18, 239, 78, C.faint);
    if (tail) p.box(1501, y + 18, 174, 78, C.rose);
    if (tail) p.mono('audit', 1588, y + 69, 31, C.red, 'center');
    if (same) p.mono('3.06', 1714, y + 77, 44, C.teal);
  }
  p.line(1261, 333, 1261, 783, C.red, 5);
  p.mono('512 positions', 1258, 859, 36, C.red, 'center');
  if (p.b === 4)
    p.text('Replay with the same weights, tokenizer and template.', 109, 959, 39, C.muted);
}
export function receipt(p) {
  p.base('Release receipt', 'policy-answerer-v3');
  if (p.b === 3) {
    p.title('Which field fails validation?');
    const variants = [
      ['Changed text', 'Source record'],
      ['Admin-only replacement · 999', 'Candidate identity'],
      ['Boolean score or budget', 'Numeric type'],
    ];
    const active = p.at(3, 'A Boolean score') ? 2 : p.at(3, 'Substituting an admin-only') ? 1 : 0;
    variants.forEach(([v, why], i) => {
      const y = 359 + i * 177;
      p.sheet(121, y, 1655, 138, i === active ? C.rose : C.white);
      p.text(v, 163, y + 87, 48, C.ink, 'Serif');
      if (i <= active) p.mono('REJECT  /  ' + why, 1722, y + 85, 36, C.red, 'right');
    });
    return;
  }
  if (p.b === 4) {
    p.title('Four checks on this labeled replay');
    const r = releaseReceipt();
    const pairs = [
      ['Current permitted input', r.input.length + ' of 3'],
      ['Target ID selected', names[r.selected[0]]],
      ['NDCG at two', r.oldGain + ' → ' + r.newGain],
      ['Latency budget', r.latency + ' / 30 ms'],
    ];
    pairs.forEach(([s, v], i) => {
      const y = 369 + i * 137;
      p.dot(141, y - 16, 14, C.teal);
      p.text(s, 202, y, 51, C.ink, 'Serif');
      p.mono(v, 1694, y, 47, C.teal, 'right');
      p.line(128, y + 41, 1775, y + 41, C.faint, 3);
    });
    return;
  }
  p.title(
    p.b === 5
      ? 'What can a live trace tell us?'
      : p.b === 6
        ? 'Follow the needed words'
        : 'One scoring invocation',
  );
  const record = releaseReceipt();
  const [source] = record.selectedSources;
  const rows = [
    ['Input', record.input.map((i) => names[i]).join('   /   '), 'This release receipt'],
    [
      'Reordered',
      record.result.map((i) => names[i] + ' ' + record.scores[i]).join('   /   '),
      'Then read their returned order',
    ],
    ['Selected chunk', source.id, 'Only the governing rule'],
    ['Parent and revision', source.parent + '   /   ' + source.revision, 'Its parent and revision'],
  ];
  rows.forEach(([label, value, phrase], i) => {
    const y = 337 + i * 108;
    p.mono(label, 124, y, 32, C.muted);
    if (p.at(1, phrase))
      p.text(value, 586, y, 42, i > 1 ? C.teal : C.ink, i < 2 ? 'Serif' : 'Sans');
    p.line(121, y + 32, 1796, y + 32, C.faint, 2);
  });
  if (p.at(1, 'Could the packer have cut off')) {
    p.box(121, 736, 1675, 113, C.sky);
    p.mono('PROMPT CHECK', 154, 805, 32, C.blue);
    const readSpan = p.at(2, 'Check the packer’s kept span');
    p.text(
      readSpan ? 'Read the packer’s kept span for the audit clause.' : 'Did the audit clause reach the assistant?',
      586, 808, 43, C.ink, 'Serif',
    );
  }
  if (p.b === 5)
    p.words(
      'Live traces can log selected IDs, versions and timings. Measuring ordering lift takes relevance labels.',
      126,
      915,
      1650,
      36,
      46,
    );
  if (p.b === 6) p.text('Trace access and storage also require protection.', 126, 916, 40, C.blue);
}
