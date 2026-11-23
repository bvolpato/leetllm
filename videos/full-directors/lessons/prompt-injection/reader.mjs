import { C, cue } from './printshop.mjs';
import {
  APPROVAL,
  PROPOSAL,
  byteProbe,
  cleanFields,
  evidence,
  extraFields,
  extractSuite,
  formatMenu,
  menu,
  metricReport,
  parser,
  parserPairs,
  releaseRecord,
} from './records.mjs';
import { escapeWrapperText } from '../../../films/prompt-injection/model.mjs';

function slider(g, y, value, color, name) {
  g.label(name, 71, y - 43, 280, color);
  const x = 76,
    w = 410;
  g.line(x, y, x + w, y, C.line, 5);
  for (let n = 0; n <= 100; n += 5) {
    const xx = x + (w * n) / 100;
    g.line(xx, y - 6, xx, y + (n % 25 === 0 ? 12 : 5), C.muted, 1);
    if (n % 25 === 0)
      g.text(n, xx, y + 31, 14, C.muted, { face: 'Mono', align: 'center' });
  }
  g.line(x, y, x + (w * value) / 100, y, color, 8);
  const pos = x + (w * value) / 100;
  g.rect(pos - 5, y - 17, 10, 34, color, undefined, 4);
  g.text(value + '%', 572, y - 32, 37, color, { face: 'Mono', align: 'right', max: 110 });
}
export function trafficFrame(k, opening) {
  const e = (b, w, d) => cue(k, b, w, d);
  const fresh = !opening && e(3, 'Start a fresh run');
  const lookup = opening
    ? e(3, 'The service checks', 0.75)
    : fresh
      ? e(3, 'Casey has approved', 0.75)
      : e(1, 'then looks up the approval', 0.75);
  const missing = opening
    ? e(3, 'The lookup is empty')
    : !fresh && e(2, 'The approval is missing');
  const allowed = fresh && e(3, 'The service permits dispatch');
  const denied = opening
    ? e(3, 'It denies the change')
    : !fresh && e(2, 'service records a denial');
  const dispatch = !opening && e(4, 'Dispatch the write', 0.75);
  const arrival = !opening && e(4, 'The service has received', 0.65);
  const committed = !opening && e(4, 'allocation takes effect');
  const returning = !opening && e(5, 'the caller receives the receipt', 0.9);
  const state = releaseRecord(
    fresh && lookup === 1 ? APPROVAL : null,
    Boolean(missing || allowed),
    arrival === 1,
    committed,
    returning === 1,
  );
  return { lookup, missing, denied, dispatch, arrival, returning, state };
}

function releaseRoute(g, frame, entry, callerLabel) {
  const { lookup, denied, dispatch, arrival, returning, state } = frame;
  const caller = 140,
    gate = 480,
    service = 820,
    y = 407;
  const movingRequest = gate + (service - gate) * (0.56 * dispatch + 0.44 * arrival);
  const requestX = dispatch
    ? movingRequest
    : caller + (gate - caller) * lookup - 68 * (1 - entry);
  g.line(caller, y, service, y, C.line, 3);
  if (lookup || dispatch) g.line(caller, y, requestX, y, C.orange, 4);
  for (const [x, label] of [
    [caller, callerLabel],
    [gate, lookup ? 'Approval lookup' : 'Service check'],
    [service, 'Release endpoint'],
  ]) {
    g.dot(x, y, 8, C.navy);
    g.text(label, x, 444, 22, C.ink, { align: 'center', weight: 600 });
  }
  g.rect(requestX - 36, y - 16, 72, 32, C.orange, undefined, 5);
  g.text(PROPOSAL.traffic + '%', requestX, y + 7, 21, C.white, {
    align: 'center',
    face: 'Mono',
  });
  if (denied) g.line(gate + 45, y - 15, gate + 45, y + 15, C.orange, 4);
  if (denied || (state.permits && !dispatch))
    g.text(
      denied ? 'Release denied' : 'Dispatch permitted',
      gate,
      470,
      19,
      denied ? C.orange : C.teal,
      { align: 'center' },
    );
  if (dispatch) {
    const status = state.committed
      ? 'Committed · ' + Number(state.committed) + ' write'
      : arrival === 1
        ? 'Request received'
        : 'In transit';
    g.text(status, service, 470, 19, C.teal, { align: 'center' });
  }
  if (returning) {
    const returnX = service - (service - caller) * returning;
    g.line(service, 371, service, y - 16, C.teal, 2);
    g.arrow(service, 371, returnX, 371, C.teal, 2);
    g.rect(returnX - 48, 356, 96, 30, C.teal, undefined, 5);
    g.text('Receipt', returnX, 377, 19, C.white, { align: 'center', weight: 600 });
  }
}

export function traffic(g, k, opening) {
  const e = (b, w, d) => cue(k, b, w, d);
  const frame = trafficFrame(k, opening);
  const { lookup, missing, state } = frame;
  const entry = opening && k.beat.beatIndex === 0 ? Math.min(1, k.elapsed / 0.75) : 1;
  g.rect(33, 37, 572, 323, '#e6e7d9', C.line, 13);
  for (const x of [47, 590])
    for (const y of [51, 346]) {
      g.dot(x, y, 4, C.line);
      g.line(x - 2, y, x + 2, y, C.muted);
    }
  g.text(PROPOSAL.candidate, 66, 118, 77, C.ink, { face: 'Serif' });
  g.label('Release service  /  live traffic', 233, 98, 342);
  slider(g, 177, PROPOSAL.traffic, C.orange, 'Assistant proposal');
  slider(g, 271, state.traffic, C.teal, 'Observed traffic');
  g.mono('Production   /   revision ' + state.revision, 72, 332, 19);
  if (opening) {
    g.ticket(638, 42, 277, 155, C.sheet);
    g.label('User request', 672, 70, 210);
    g.text('Summarize the tests.', 672, 105, 23, C.ink, { face: 'Serif', max: 225 });
    if (e(1, 'Follow the proposal')) {
      g.label('Evaluation report', 672, 130, 210);
      if (e(1, 'report says')) g.text('C17 passed its tests.', 672, 157, 18, C.ink, { max: 222 });
      if (e(1, 'author recommends'))
        g.text('Recommends release', 672, 183, 18, C.orange, { max: 222 });
    }
    g.tray(
      638,
      215,
      277,
      104,
      lookup ? 'Approval record' : 'Service decision',
      missing ? 'No matching grant' : lookup ? 'Looking up…' : '',
      missing ? C.orange : C.muted,
    );
    if (e(3, 'The reader gets the summary')) {
      g.label('Reply to reader', 647, 346);
      g.text('C17 passed its tests.', 647, 376, 25, C.teal, { face: 'Serif', max: 274 });
    }
  } else {
    g.ticket(633, 42, 290, 204, state.receipt ? C.mint : C.sheet);
    g.label(state.receipt ? 'Returned receipt' : 'Release proposal', 668, 74, 241);
    g.mono(state.receipt?.operation || PROPOSAL.operationId, 668, 109, 16, C.ink, 230);
    g.ruleRows(
      668,
      148,
      234,
      [
        ['Candidate', state.receipt?.candidate ?? PROPOSAL.candidate],
        ['Traffic', (state.receipt?.traffic ?? PROPOSAL.traffic) + '%'],
        ['Revision', state.receipt?.revision ?? PROPOSAL.revision],
      ],
      37,
    );
    g.tray(
      633,
      253,
      290,
      96,
      'Trusted approval',
      state.grant
        ? 'Casey · ' + state.grant.traffic + '% · r' + state.grant.revision
        : missing
          ? 'No matching grant'
          : lookup
            ? 'Looking up…'
            : '',
      missing ? C.orange : C.teal,
    );
  }
  const callerLabel = !opening && e(1, 'authenticated release worker') ? 'Release worker' : 'Caller';
  releaseRoute(g, frame, entry, callerLabel);
}

function ingress(g, k) {
  const e = (b, w, d) => cue(k, b, w, d);
  g.title('One author. Two entry routes.');
  const rows = [
    ['Pasted by a colleague', 'User message', 'Direct', e(1, 'a colleague pastes', 0.65)],
    ['Fetched by the assistant', 'Tool result', 'Indirect', e(1, 'the assistant fetches', 0.65)],
  ];
  rows.forEach(([source, port, kind, p], i) => {
    const y = 148 + i * 151;
    g.label(source, 54, y - 10);
    g.line(67, y + 45, 541, y + 45, C.line, 3);
    g.dot(67, y + 45, 6, C.orange);
    if (p) {
      const x = 73 + 163 * p;
      g.ticket(x, y + 15, 252, 57, C.peach);
      g.text('Recommended for release', x + 27, y + 51, 18, C.orange, { face: 'Serif', max: 216 });
    }
    g.tray(545, y - 10, 171, 104, port, p === 1 ? kind : '');
    if (p === 1) {
      g.arrow(723, y + 41, 766, y + 41);
      g.mono('C17 release', 778, y + 48, 18);
    }
  });
  if (e(3, 'application')) {
    g.label('Requested effect', 773, 121, 165);
  }
  if (e(5, 'signed-in session')) {
    g.stamp(58, 439, 'Session permits a summary', true, 395);
    g.mono('Report author ≠ session principal', 479, 467, 17);
  }
}
export function readerPaths(k) {
  return {
    notes: 1 - cue(k, 1, 'Remove the notes', 0.65),
    send: true,
    write: !cue(k, 3, 'leave every tool'),
  };
}
function sinks(g, k) {
  const e = (b, w) => cue(k, b, w);
  const { notes, send, write } = readerPaths(k);
  g.title('Which paths can the reader use?');
  g.sheet(47, 122, 243, 105, 'External report', ['C17 passed.']);
  g.line(291, 171, 372, 212, C.teal, 4);
  g.sheet(47, 297, 243, 105, 'Private store', ['Notes field']);
  if (notes) g.line(291, 345, 291 + 81 * notes, 345 - 53 * notes, C.orange, 4);
  else g.mono('Notes access removed', 52, 442, 17, C.orange, 244);
  g.rect(373, 173, 199, 148, C.navy, undefined, 16);
  g.label(write ? 'Model context' : 'Isolated process', 391, 202, 163, C.mint);
  g.text('Reader', 390, 267, 44, C.white, { face: 'Serif' });
  g.tray(688, 98, 223, 118, 'Disclosure endpoint', 'Recipient');
  g.tray(688, 302, 223, 118, 'State-change endpoint', 'Release');
  if (send) {
    g.label('Can send', 579, 154, 99);
    g.arrow(573, 208, 677, 164, C.navy);
    if (notes) {
      g.ctx.save();
      g.ctx.globalAlpha = notes;
      g.arrow(573, 208, 677, 164, C.orange);
      g.ctx.restore();
    }
  }
  if (write) {
    g.label('Can write', 579, 374, 100);
    g.arrow(573, 290, 677, 349, e(2, 'A write') ? C.orange : C.navy);
  } else {
    g.mono('No write tool', 371, 363, 20, C.orange);
  }
  if (e(4, 'the host also limits')) {
    g.label('Runtime limits', 380, 418);
    g.text('Files  /  network', 380, 450, 23);
  }
}
function menuSpread(g) {
  g.rect(40, 58, 387, 411, '#185652', undefined, 3);
  g.line(56, 72, 411, 72, C.mint);
  g.line(56, 455, 411, 455, C.mint);
  g.text('Harbor Room', 72, 141, 49, C.white, { face: 'Serif', max: 325 });
  g.label('Lunch menu  /  retrieved', 74, 175, 316, C.mint);
  g.text('Soups', 73, 231, 33, C.white, { face: 'Serif' });
  menu.items.forEach((v, i) => {
    g.text(v, 74, 269 + i * 39, 22, C.white, { face: 'Serif' });
    g.mono('8', 374, 269 + i * 39, 18, C.mint);
  });
  g.rect(65, 342, 337, 88, C.peach);
  g.label('Memo from restaurant', 81, 371, 296, C.orange);
  g.text(menu.memo, 81, 404, 21, C.ink, { face: 'Serif', max: 305 });
}
function menuCheck(g, k) {
  menuSpread(g);
  const e = (b, w, d) => cue(k, b, w, d);
  const considered = e(2, 'proposes the restaurant'),
    checked = e(3, 'checks its allowlist'),
    done = e(3, 'application prints');
  const result = formatMenu('capitals');
  g.label('Diner’s request', 473, 70);
  g.text('List soups as printed.', 473, 111, 33, C.ink, { face: 'Serif', max: 437 });
  g.label('Signed-in session', 473, 158);
  g.mono('Read only  /  ' + menu.scope, 473, 187, 18, C.teal);
  g.line(468, 211, 917, 211);
  g.label('Application format allowlist', 473, 245);
  g.mono(result.allowed.join(', '), 473, 279, 21, C.teal);
  if (considered) g.text('Proposed format   CAPITALS', 473, 319, 18, C.orange);
  if (checked)
    g.stamp(
      473,
      339,
      result.accepted ? 'Format accepted' : 'Format rejected',
      result.accepted,
      285,
    );
  if (done) g.sheet(469, 397, 447, 110, 'Plain-text reply', result.reply);
}
function escaping(g, k) {
  const e = (b, w, d) => cue(k, b, w, d);
  const sample = '<Peas>',
    escaped = e(1, 'escaped characters');
  g.title('What changes when the host escapes a name?');
  g.sheet(47, 126, 295, 149, 'Menu text', [sample]);
  g.arrow(350, 200, 427, 200);
  g.ticket(443, 126, 464, 149, C.mint);
  g.label('Inside the wrapper', 480, 160);
  g.mono(escaped ? escapeWrapperText(sample) : sample, 480, 221, 33);
  g.line(49, 312, 906, 312);
  g.label('Same external memo', 59, 353);
  g.text(menu.memo, 59, 402, 31, C.orange, { face: 'Serif', max: 481 });
  g.tray(594, 325, 313, 125, 'Session permission', 'Read only');
  if (e(2, 'random attribute'))
    g.mono('Opening attribute varies · closing tag fixed', 62, 461, 16, C.muted);
}
function context(g, k) {
  const e = (b, w, d) => cue(k, b, w, d),
    proposed = e(2, 'Out comes a proposal', 0.7);
  g.title('What leaves the model?');
  g.sheet(47, 111, 365, 114, 'Developer message', ['Summarize the evaluation.']);
  g.sheet(47, 259, 365, 155, 'Report C17 · external', [
    'Tests passed.',
    'Recommended for release.',
  ]);
  g.line(416, 172, 486, 236, C.line, 3);
  g.line(416, 335, 486, 253, C.line, 3);
  g.dot(490, 244, 14, C.navy);
  g.label('Model', 467, 285, 65);
  g.arrow(506, 244, 542 + 45 * proposed, 244, C.navy);
  if (proposed)
    g.sheet(601, 136, 313, 197, 'Generated proposal', [
      'C17   /   production',
      'Traffic   25%',
      'Revision   3',
    ]);
  g.tray(601, 359, 313, 108, 'Release service', '0% observed');
}

function reader(g, k) {
  const e = (b, w, d) => cue(k, b, w, d),
    extracting = e(5, 'extractor looks'),
    long = e(5, 'try the seven'),
    result = e(6, 'returns no suite');
  const suite = extractSuite('eval suite ' + (long ? 'R6543217' : 'R42'));
  g.title(
    extracting ? 'How much of this ID belongs together?' : 'What leaves the isolated reader?',
  );
  g.rect(46, 113, 399, 327, C.navy, undefined, 9);
  g.label('Reader  /  raw report', 69, 150, 350, C.mint);
  g.text(extracting ? 'Eval suite' : 'External report', 69, 211, 32, C.white, { face: 'Serif' });
  g.mono(
    extracting ? (long ? 'R6543217' : 'R42') : 'C17 passed suite R42.',
    69,
    267,
    extracting ? 43 : 22,
    C.white,
  );
  if (long) g.line(69 + 7 * 25.8, 276, 69 + 8 * 25.8, 276, C.gold, 4);
  g.mono('Tools: 0', 69, 340, 18, C.mint);
  g.mono('Release credentials: 0', 69, 374, 18, C.mint);
  g.line(489, 116, 489, 433, C.teal, 3, [5, 5]);
  g.label('Application code', 530, 148);
  if (e(3, 'a paragraph'))
    g.text(extracting ? 'Extracted suite' : 'Bounded handoff', 530, 210, 29, C.ink, {
      face: 'Serif',
    });
  const seen = extracting ? (long ? result : e(5, 'It finds')) : e(3, 'A suite ID');
  g.tray(531, 235, 368, 112, 'Suite field', seen ? suite || 'No suite ID' : '');
  if (extracting) g.mono('Whole ID: R + 1 to 6 digits', 533, 374, 16, C.muted);
  if (e(5, 'caller supplies')) {
    g.label('Source from caller', 535, 396);
    g.mono('upload-8', 535, 431, 27, C.teal);
  }
}
function typed(g, k) {
  if (cue(k, 4, 'Open a different report')) {
    const summarized = cue(k, 4, 'Keep the measured accuracy');
    const assessed = cue(k, 4, 'Mark release eligibility unresolved');
    g.title('What can this report support?');
    g.label('Current source', 59, 117);
    g.label('Checked summary', 550, 117);
    g.line(479, 137, 479, 440, C.teal, 4, [8, 8]);
    g.ticket(57, 153, 366, 230);
    g.label(metricReport.source, 90, 189);
    g.ruleRows(90, 242, 300, [
      ['Accuracy', metricReport.accuracy],
      ['Gate result', metricReport.gate ?? 'Unrecorded'],
    ], 63);
    if (summarized) {
      g.ticket(541, 153, 365, 230, C.mint);
      g.label('Summary for the reader', 574, 189);
      g.ruleRows(574, 242, 299, [
        ['Accuracy', metricReport.accuracy],
        ...(assessed ? [['Eligibility', metricReport.gate ?? 'Unresolved']] : []),
      ], 63);
      g.mono('Source: ' + metricReport.source, 548, 421, 17, C.teal, 358);
    }
    g.mono('Release writes    0', 590, 475, 18);
    return;
  }
  const e = (b, w, d) => cue(k, b, w, d),
    clean = e(3, 'fresh copy'),
    denied = e(2, 'This copy stops') && !clean,
    crossed = e(3, 'this copy crosses', 0.68);
  const record = clean ? cleanFields : extraFields,
    decision = evidence(record);
  g.title('Which fields cross the boundary?');
  g.label('Reader output', 59, 117);
  g.label('Checked evidence', 583, 117);
  g.line(479, 137, 479, 440, C.teal, 4, [8, 8]);
  if (!clean) {
    g.label('Required keys', 551, 204);
    g.mono('candidate, suite, gate', 551, 244, 20);
    g.text('All three, no extras.', 551, 288, 22, C.muted, { face: 'Serif' });
  }
  const x = 61 + crossed * 487;
  g.ticket(x, 153, 326, 232, clean ? C.mint : C.sheet);
  g.label('Reader record', x + 31, 186, 278);
  Object.entries(record).forEach(([key, val], i) => {
    g.mono(key, x + 31, 225 + i * 31, 17);
    g.mono(val, x + 165, 225 + i * 31, 17, i >= 3 ? C.orange : C.ink);
  });
  if (denied && !decision.accepted) g.stamp(60, 405, 'Whole record rejected', false, 326);
  if (crossed === 1 && e(3, 'attaches the source'))
    g.mono('Source  ' + decision.record.source_id, 548, 421, 17, C.teal, 360);
  g.mono('Release writes    0', 590, 475, 18);
}
function sourceMatch(g, k) {
  const e = (b, w, d) => cue(k, b, w, d),
    mismatch = e(1, 'source says failed'),
    stale = e(2, 'earlier artifact'),
    unresolved = e(3, 'support is unresolved');
  g.title(
    unresolved
      ? 'What can the answer claim?'
      : stale
        ? 'Which revision was checked?'
        : 'Do the fields match their source?',
  );
  const left = unresolved ? 'Unresolved' : stale ? 'r2' : 'passed',
    right = unresolved
      ? 'Not recorded'
      : stale
        ? 'r3'
        : mismatch
          ? 'failed'
          : 'Awaiting comparison';
  const rows = (v) =>
    unresolved
      ? [
          ['Candidate', metricReport.candidate],
          ['Accuracy', metricReport.accuracy],
          ['Release eligibility', v],
        ]
      : [
          ['Candidate', 'C17'],
          ['Suite', 'R42'],
          [stale ? 'Revision' : 'Gate', v],
        ];
  for (const [i, v] of [left, right].entries()) {
    const x = 47 + i * 450;
    g.ticket(x, 131, 410, 243);
    g.label(['Reader copy', 'Expected source'][i], x + 33, 172);
    g.ruleRows(x + 33, 223, 348, rows(v));
  }
  const rejected = mismatch && !evidence(cleanFields, { ...cleanFields, gate: 'failed' }).accepted;
  if (rejected)
    g.stamp(
      52,
      410,
      unresolved
        ? 'Return accuracy with its source'
        : stale
          ? 'Earlier revision'
          : 'Source mismatch',
      unresolved,
      399,
    );
  if (e(2, 'omits a condition') && !stale)
    g.mono('Approval required ≠ release permitted', 493, 437, 16);
}
function selectAction(g, k) {
  const e = (b, w, d) => cue(k, b, w, d);
  const committed = e(1, 'selects one action'),
    menuIn = e(1, 'Once the menu arrives'),
    compare = e(2, 'chooses again');
  g.title('When does the application choose the action?');
  g.line(69, 243, 880, 243, C.line, 5);
  for (const [x, v] of [
    [97, 'Request'],
    [354, 'Selection'],
    [634, 'Retrieved menu'],
    [872, 'Reply'],
  ]) {
    g.dot(x, 243, 9, C.teal);
    g.text(v, x, 281, 17, C.muted, { align: 'center' });
  }
  if (committed) g.sheet(225, 108, 258, 102, 'Fixed action', ['List soups']);
  if (menuIn) g.sheet(536, 312, 264, 117, 'Permitted argument', menu.items);
  if (compare) {
    g.line(635, 229, 635, 135, C.orange, 2);
    g.arrow(635, 135, 497, 135, C.orange);
    g.label('Reselection risk', 646, 140, 260, C.orange);
  }
  if (e(2, 'Bind the recipient'))
    g.mono('Reply bound to diner · names only · printed case', 50, 480, 19, C.teal);
}
function decoded(g, k) {
  const e = (b, w, d) => cue(k, b, w, d),
    bytes = e(2, 'Try four hundred'),
    complete = e(3, 'A structured');
  if (complete) {
    g.title('Which responses reach the permission check?');
    ['Complete · matching schema', 'Refusal', 'Incomplete'].forEach((v, i) => {
      const y = 153 + i * 108;
      g.text(v, 64, y, 27, C.ink, { face: 'Serif' });
      g.arrow(451, y - 9, 557, y - 9, i ? C.orange : C.teal);
      g.stamp(588, y - 32, i ? 'No dispatch' : 'Permission lookup', i ? false : true, 290);
    });
    return;
  }
  if (bytes) {
    g.title('One character can occupy two bytes.');
    g.text('é', 75, 338, 180, C.teal, { face: 'Serif' });
    g.mono('× ' + byteProbe.length, 75, 397, 31);
    g.ticket(331, 149, 559, 219);
    g.ruleRows(
      370,
      218,
      469,
      [
        ['Characters', byteProbe.length],
        ['UTF-8 bytes', e(2, 'eight hundred bytes') ? Buffer.byteLength(byteProbe) : '?'],
      ],
      85,
    );
    g.label('Raw-text probe  /  before JSON parsing', 341, 429);
    return;
  }
  const dup = e(1, 'Duplicate JSON keys'),
    extra = e(1, 'Extra fields'),
    bool = e(1, 'Boolean suite');
  const pairs = bool
    ? [...parserPairs.slice(0, 2), ['eval_suite', true]]
    : extra
      ? [...parserPairs, ['other', 'field']]
      : dup
        ? [...parserPairs, ['action', 'request_promotion']]
        : parserPairs;
  const outcome = parser(pairs);
  g.title('Inspect the decoded key pairs.');
  g.ticket(52, 123, 473, 321);
  pairs.forEach(([key, val], i) => {
    g.mono(key, 87, 184 + i * 60, 19);
    g.mono(String(val), 257, 184 + i * 60, 18, C.ink, 244);
  });
  g.tray(572, 163, 333, 125, 'Parser', outcome.accepted ? 'Valid fields' : outcome.reason);
  g.mono('Limit  512 characters', 578, 350, 20);
  g.text('Permission still needs a lookup.', 578, 395, 20, C.muted, { max: 330 });
}
export const readerScenes = [
  (g, k) => traffic(g, k, true),
  ingress,
  sinks,
  menuCheck,
  escaping,
  context,
  reader,
  typed,
  sourceMatch,
  selectAction,
  decoded,
];
