import {
  C,
  beat,
  cue,
  ease,
  lerp,
  box,
  line,
  dot,
  text,
  mono,
  head,
  paper,
  rule,
  stamp,
  board,
  label,
  arrow,
  receipt,
  portrait,
  signature,
  usd,
  circleInk,
} from './drawing.mjs';
import {
  first,
  revision,
  cold,
  budget,
  latency,
  mayaExpected,
  compareRows,
  tuple,
  replays,
  replayPrefixes,
  original,
  maya31,
  maya30,
  mayaUnsigned,
  limits,
  decide,
  runQueue,
  postedAmount,
  reviewReceipt,
} from './records.mjs';

const dollars = (v) => '$' + v.toFixed(6);
function tape(g, x, title, bill, visible, result, reserve) {
  receipt(g, x, 131, 325, 386, C.paper);
  rule(g, x + 20, 151, 285);
  head(g, title, x + 20, 198, 31);
  line(g, x + 21, 217, x + 302, 217, C.rule);
  const rows = [
    ['Total input', 'input'],
    ['Cached', 'cached'],
    ['Fresh', 'fresh'],
    ['Output', 'out'],
  ];
  rows.forEach(([k, f], i) => {
    const yy = 257 + i * 39;
    text(g, k, x + 20, yy, 20, C.muted);
    if (visible) mono(g, bill[f], x + 299, yy, 22, C.ink, 'right');
  });
  line(g, x + 20, 391, x + 300, 391, C.rule);
  if (result) {
    text(g, 'Bill', x + 20, 432, 22);
    mono(g, dollars(bill.total), x + 300, 432, 24, C.teal, 'right');
  }
  if (reserve) {
    text(g, 'Reserve', x + 20, 476, 19);
    mono(g, dollars(bill.reserve), x + 299, 476, 20, C.ink, 'right');
  }
}
export function costs(g, c) {
  board(g, '#5e403b', '#382e32');
  const n = beat(c);
  head(g, n >= 8 ? 'A timeout leaves a reservation' : 'Price the two drafts', 66, 91, 46, C.white);
  if (n <= 7) {
    const hasFirst = cue(c, 3, 'Start with two thousand'),
      hasSecond = cue(c, 4, 'Its input grows'),
      priced1 = cue(c, 3, 'The first draft costs'),
      priced2 = cue(c, 5, 'The revision costs less');
    const reserveVisible = cue(c, 6, 'Each reservation fits');
    tape(g, 68, 'First draft', first, hasFirst, priced1, reserveVisible);
    tape(g, 420, 'Revision', revision, hasSecond, priced2, reserveVisible);
    label(g, 'RATES   /   USD PER MILLION', 789, 163, C.brass);
    [
      ['Fresh input', '$2.50'],
      ['Cached read', '$0.25'],
      ['Output', '$15.00'],
    ].forEach(([k, v], i) => {
      const yy = 220 + i * 47;
      text(g, k, 791, yy, 22, C.cream);
      mono(g, v, 1121, yy, 21, C.white, 'right');
    });
    line(g, 787, 344, 1125, 344, C.faint);
    if (n <= 4) {
      mono(g, '2 attempts   /   2¢', 790, 388, 21, C.cream);
      mono(g, '300 output tokens / call', 790, 431, 17, C.cream);
      mono(g, '1¢ / call · 2500 ms', 790, 474, 19, C.cream);
    }
    if (n >= 5 && cue(c, 5, '$')) {
      label(g, 'TICKET CHARGE', 790, 384);
      mono(g, dollars(first.total + revision.total), 790, 432, 30, C.white);
    }
    if (cue(c, 6, 'That leaves'))
      mono(g, 'Time left  ' + (budget.deadline - budget.normalMs) + ' ms', 790, 485, 22, C.cream);
    if (n === 2)
      text(
        g,
        'USD = (fresh × 2.50 + cached × 0.25 + output × 15) / 1,000,000',
        80,
        565,
        24,
        C.cream,
      );
    if (n === 3 || n === 4) {
      const b = n === 3 ? first : revision;
      mono(
        g,
        b.input + ' total − ' + b.cached + ' cached = ' + b.fresh + ' fresh',
        82,
        565,
        22,
        C.white,
      );
    }
    if (n === 6 && cue(c, 6, 'Add a hundred eighty'))
      mono(
        g,
        latency.reads +
          ' + 2 × (' +
          latency.primary +
          ' + ' +
          latency.check +
          ')' +
          (cue(c, 6, 'That leaves') ? ' = ' + budget.normalMs + ' ms' : ''),
        84,
        565,
        23,
        C.white,
      );
    if (n === 7)
      text(
        g,
        '50 revisions × 30 days × ' +
          dollars(revision.total) +
          (cue(c, 7, '$') ? ' = $' + (50 * 30 * revision.total).toFixed(2) : ''),
        82,
        565,
        24,
        C.cream,
      );
    return;
  }
  const returned = cue(c, 8, 'same two thousand'),
    known = cue(c, 8, 'now cost');
  receipt(g, 71, 142, 362, 357, C.pink);
  label(g, 'PRIMARY   /   TIMEOUT', 95, 188, C.muted);
  head(g, 'Usage unknown', 95, 255, 33);
  text(g, 'Reservation held', 96, 327, 23);
  mono(g, dollars(first.reserve), 95, 391, 35, C.ink);
  tape(g, 464, 'Cold fallback', cold, returned, known, false);
  const x = 837;
  label(g, 'REQUEST CAP', x, 178);
  head(g, '$0.02', x, 251, 50, C.white);
  if (cue(c, 9, 'Add the reads')) {
    const counted = first.reserve + cold.total;
    box(g, x, 296, 275, 21, '#976f60', 5);
    box(g, x, 296, (275 * first.reserve) / budget.cap, 21, C.brass);
    box(
      g,
      x + (275 * first.reserve) / budget.cap,
      296,
      (275 * cold.total) / budget.cap,
      21,
      C.mint,
    );
    mono(g, dollars(counted), x, 365, 28, C.white);
    text(g, 'Held + known', x, 402, 20, C.cream);
  }
  if (cue(c, 9, 'Two hundred seventy milliseconds'))
    mono(g, budget.deadline - budget.coldMs + ' ms left', x, 450, 24, C.cream);
  if (cue(c, 9, 'Both attempts')) text(g, '2 attempts consumed', x, 490, 20, C.white);
  if (n === 8) {
    if (cue(c, 8, 'nine hundred forty milliseconds'))
      mono(g, 'Timeout  ' + latency.primary + ' ms', 80, 563, 22, C.cream);
    if (cue(c, 8, 'eleven hundred milliseconds'))
      mono(g, 'Fallback  ' + latency.fallback + ' ms', 470, 563, 22, C.cream);
  }
  if (n === 9) {
    const terms = [latency.reads, latency.primary, latency.fallback, latency.check];
    const positions = [81, 237, 419, 612];
    terms.forEach((v, i) => {
      mono(g, ['Reads', 'Timeout', 'Fallback', 'Check'][i], positions[i], 546, 20, C.cream);
      mono(g, (i ? '+ ' : '') + v, positions[i], 583, 24, C.white);
    });
    if (cue(c, 9, 'The total is'))
      mono(g, '= ' + budget.coldMs + ' ms of ' + budget.deadline + ' ms', 728, 583, 25, C.brass);
  }
  if (n === 10)
    text(
      g,
      'Separate costs: tools, storage, embeddings and specialist time.',
      78,
      558,
      23,
      C.cream,
    );
}

const badges = {
  'HANDOFF': 'Review',
  'ABSTAIN': 'Abstain',
  'POLICY REPLY': 'Reply',
  'CONFIRM': 'Confirm',
  'QUEUED': 'Queued',
};
export const labeledCases = [
  { id: 'A', sent: true, needed: true },
  { id: 'B', sent: true, needed: true },
  { id: 'C', sent: true, needed: false },
  { id: 'D', sent: false, needed: true },
  { id: 'E', sent: false, needed: true },
];
function queueColumn(g, x, y, title, entries, fill) {
  receipt(g, x, y, 456, 224, fill);
  label(g, title, x + 21, y + 39, C.muted);
  rule(g, x + 20, y + 56, 415);
  if (!entries.length) text(g, 'Empty queue', x + 22, y + 120, 27, C.muted);
  entries.forEach((e, i) => {
    const yy = y + 104 + i * 65;
    mono(g, e.payload.invoice, x + 24, yy, 23, C.ink);
    text(g, usd(e.payload.amount), x + 430, yy, 25, C.ink, 'Sans', 600, 'right');
    mono(g, e.key + '   /   ' + e.payload.status, x + 24, yy + 25, 16, C.muted);
  });
}
export function evaluation(g, c) {
  board(g);
  const n = beat(c);
  if (n <= 5) {
    const extra = cue(c, 2, 'Add a ten-dollar row'),
      restore = cue(c, 3, 'restore the clean queue'),
      missing = cue(c, 3, 'remove Alex’s expected entry');
    const duplicate = cue(c, 4, 'copy that exact row');
    const mode =
      n >= 4
        ? duplicate
          ? 'duplicate'
          : 'normal'
        : missing
          ? 'missing'
          : extra && !restore
            ? 'extra'
            : 'normal';
    const count =
      n === 1 ? Math.min(12, Math.floor(cue(c, 1, 'Replay the twelve tickets', 3.5) * 12)) : 12;
    const test = n === 1 ? replayPrefixes[count] : replays[mode];
    head(g, 'Twelve conversations, one expected write', 61, 86, 43, C.white);
    mono(g, test.labelsPass + ' / 12 outcomes match', 75, 139, 20, C.cream);
    const labelColors = {
      'HANDOFF': C.pink,
      ABSTAIN: '#d6d8c8',
      'POLICY REPLY': C.cream,
      CONFIRM: '#e8c980',
      QUEUED: C.mint,
    };
    test.rows.forEach((r, i) => {
      const x = 74 + i * 88;
      box(g, x, 163, 80, 67, labelColors[r.outcome], 4);
      mono(g, r.id, x + 40, 187, 15, C.muted, 'center');
      text(g, badges[r.outcome], x + 40, 214, 16, C.ink, 'Sans', 600, 'center');
    });
    queueColumn(g, 77, 270, 'INDEPENDENT EXPECTATION', test.expected, C.cream);
    queueColumn(g, 664, 270, 'ACTUAL BILLING QUEUE', test.actual, C.paper);
    if (n === 1 && test.ready && cue(c, 1, 'Billing and the test agree'))
      stamp(g, 'Exact match', 452, 551, C.brass, 22);
    if (n === 3 && test.unexpected.length > 0 && !test.ready && cue(c, 3, 'Keep it in view'))
      stamp(g, 'Hold release · unexpected row', 347, 548, C.brass, 23);
    if (n === 3 && test.missing.length > 0 && !test.ready && cue(c, 3, 'Hold this run'))
      stamp(g, 'Hold release · missing row', 366, 548, C.brass, 23);
    if (n >= 4 && cue(c, 4, 'Pair the expected row')) {
      arrow(g, 545, 369, 650, 369, C.brass);
      if (n === 5 && !test.ready && cue(c, 5, 'Hold release'))
        stamp(g, 'Hold release · ' + test.unexpected.length + ' extra copy', 377, 550, C.brass, 23);
    }
    return;
  }
  if (n === 7) {
    head(g, 'Who needed a specialist?', 66, 90, 47, C.white);
    paper(g, 71, 147, 1057, 340, C.paper);
    const sent = labeledCases.filter((r) => r.sent),
      need = labeledCases.filter((r) => r.needed),
      both = sent.filter((r) => r.needed);
    const x = (i) => 480 + 120 * i;
    labeledCases.forEach((r, i) => mono(g, r.id, x(i), 205, 25, C.muted, 'center'));
    [
      ['Sent to review', 'sent'],
      ['Needed review', 'needed'],
    ].forEach(([s, key], j) => {
      const yy = 276 + j * 83;
      text(g, s, 111, yy + 9, 25);
      labeledCases.forEach((r, i) => {
        dot(g, x(i), yy, 17, r[key] ? C.teal : '#d9ddcd');
        if (r[key]) text(g, '✓', x(i), yy + 8, 20, C.white, 'Sans', 600, 'center');
      });
    });
    if (cue(c, 7, 'That is escalation precision'))
      mono(g, 'Precision   ' + both.length + ' / ' + sent.length, 109, 453, 25, C.teal);
    if (cue(c, 7, 'That is recall'))
      mono(g, 'Recall   ' + both.length + ' / ' + need.length, 679, 453, 25, C.teal);
    return;
  }
  head(g, n === 6 ? 'After the chat closes' : 'Measure the whole wait', 66, 91, 46, C.white);
  const milestones =
    n === 6
      ? ['Chat closes', 'Customer returns', 'Case reopens']
      : ['Queue wait', 'First useful reply', 'Specialist resolves'];
  const descriptions =
    n === 6
      ? ['Outcome unknown', 'Repeat contact', 'Verify task outcome']
      : ['Include retries', 'After acknowledgment', 'Include human delay'];
  paper(g, 73, 160, 1050, 340, C.cream);
  label(
    g,
    n === 6
      ? 'OBSERVATION WINDOW   /   EXAMPLE: 48 HOURS'
      : 'SERVICE TRACE   /   SPECIFIED ARRIVAL LOAD',
    106,
    211,
    C.muted,
  );
  line(g, 156, 317, 1016, 317, C.rule, 4);
  milestones.forEach((s, i) => {
    const x = 135 + i * 358;
    dot(g, x + 38, 317, 12, i === 2 ? C.red : C.teal);
    text(g, s, x, 278, 22);
    text(g, descriptions[i], x, 379, 20, C.teal);
  });
  text(
    g,
    n === 6
      ? 'Survey satisfaction with its response rate.'
      : 'Count unfinished cases, fan-out and tokens by case type.',
    111,
    458,
    22,
  );
}

function mayaCase(g, state, signed, verdict) {
  paper(g, 70, 103, 550, 416, C.paper, true);
  label(g, 'BILLING   /   ' + state.invoice, 114, 152, C.muted);
  head(g, 'Credit request', 111, 223, 48);
  portrait(g, 143, 282, 'Maya');
  text(g, 'Maya   /   GPU usage', 192, 291, 25);
  mono(g, 'Type  ' + tuple(state).requestType, 192, 321, 17);
  rule(g, 112, 341, 462);
  head(g, usd(state.amount), 112, 401, 51);
  line(g, 113, 464, 424, 464, C.rule, 1.4);
  if (signed) signature(g, 'Maya', 126, 452, typeof signed === 'number' ? signed : 1);
  mono(g, state.policy + '  /  R' + state.revision, 440, 457, 16);
  if (verdict) text(g, verdict, 114, 496, 20, C.teal, 'Sans', 600);
}
function calendar(g, day) {
  const x = 677,
    y = 119,
    w = 443,
    h = 351;
  box(g, x + 4, y + 7, w, h, '#142d32', 10);
  box(g, x, y, w, h, C.cream, 8);
  box(g, x, y, w, 62, C.red, 5);
  for (const xx of [x + 54, x + w - 54]) {
    dot(g, xx, y + 16, 7, '#6e3c33');
    box(g, xx - 3, y - 8, 6, 24, C.brass, 3);
  }
  text(g, 'Days since invoice', x + 24, y + 42, 25, C.white, 'Serif');
  for (let d = 1; d <= 31; d++) {
    const col = (d - 1) % 7,
      row = Math.floor((d - 1) / 7);
    const xx = x + 41 + col * 59,
      yy = y + 99 + row * 49;
    if (d <= limits.days) box(g, xx - 24, yy - 24, 49, 38, '#d5e3cb', 3);
    if (d === day) circleInk(g, xx, yy - 5, 25, 20);
    mono(g, d, xx, yy + 2, 19, C.ink, 'center');
  }
  text(g, 'Eligible age: through day 30', x + 19, y + h + 49, 24, C.white);
}
function customerReceipt(g, x, y, s, ref) {
  receipt(g, x, y, 432, 251, C.mint);
  label(g, 'BILLING   /   REQUEST RECEIPT', x + 28, y + 42, C.teal);
  rule(g, x + 26, y + 59, 378);
  head(g, 'Credit request pending', x + 26, y + 117, 31);
  text(g, s.invoice + '     ' + usd(s.amount), x + 27, y + 164, 24);
  mono(g, ref, x + 28, y + 212, 25, C.ink);
}
function retainedComparison(g, rows, showVerdict, customerQuestion) {
  head(g, 'What did billing keep?', 69, 84, 43, C.white);
  paper(g, 68, 111, 1064, 376, C.paper);
  const left = 386,
    right = 751;
  label(g, 'QUEUE RECORD', 94, 150, C.muted);
  label(g, 'EXPECTED', left, 150, C.teal);
  label(g, 'RETAINED', right, 150, C.teal);
  rule(g, 93, 162, 1013);
  const fields = [
    ['Key', (r) => r.key],
    ['Customer / invoice', (r) => r.payload.customer + '  /  ' + r.payload.invoice],
    ['Item', (r) => r.payload.item],
    ['Request type', (r) => r.payload.requestType],
    ['Signed amount', (r) => usd(r.payload.amount)],
    ['Policy / revision', (r) => r.payload.policy + '  /  R' + r.payload.revision],
    ['Status', (r) => r.payload.status],
    ['Policy SHA-256', (r) => r.payload.evidence.slice(0, 32)],
    ['', (r) => r.payload.evidence.slice(32)],
  ];
  fields.forEach(([name, value], i) => {
    const y = 195 + i * 29;
    text(g, name, 95, y, 21, C.muted);
    for (const [row, x] of [
      [mayaExpected[0], left],
      [rows[0], right],
    ]) {
      if (row) mono(g, value(row), x, y, i >= 7 ? 17 : 20, C.ink);
    }
  });
  mono(g, 'Rows', 96, 466, 19, C.muted);
  mono(g, mayaExpected.length, left, 466, 21, C.teal);
  mono(g, rows.length, right, 466, 21, C.teal);
  if (showVerdict) {
    const matched = compareRows(mayaExpected, rows).equal;
    stamp(g, matched ? 'Exact row match' : 'Rows differ', 82, 523, C.brass, 23);
  }
  if (customerQuestion) head(g, '“Is the money back?”', 636, 523, 34, C.white);
}

export function practice(g, c) {
  board(g, '#254e53', '#163138');
  const n = beat(c);
  const at30 = cue(c, 2, 'invoice age to thirty days'),
    state = n === 3 ? mayaUnsigned : at30 ? maya30 : maya31;
  if (n <= 3) {
    const signed = Boolean(state.confirmed);
    const decision = decide(state).outcome;
    const verdict =
      n === 2 && decision === 'HANDOFF' && cue(c, 2, 'Send it for review')
        ? 'Specialist review'
        : n === 2 && decision === 'QUEUE ELIGIBLE' && cue(c, 2, 'Now it is eligible')
          ? 'Eligible for queue'
          : '';
    mayaCase(g, state, signed, verdict);
    calendar(g, state.age);
    if (n === 3) mono(g, 'Signature cleared on replay', 88, 575, 21, C.brass);
    else mono(g, 'Specialist review from $' + limits.review / 100, 87, 575, 22, C.cream);
    return;
  }
  const q = runQueue(
    maya30,
    n === 4 && !cue(c, 4, 'Billing acknowledges') ? 'empty' : n === 4 ? 'insert' : 'retry',
  );
  const pendingReply = 'Your credit request is pending';
  const showReceipt = n === 6 && c.elapsed + 1e-9 >= c.wordCue(pendingReply).end;
  if ((n === 5 && cue(c, 5, 'Compare the full retained record')) || (n === 6 && !showReceipt)) {
    retainedComparison(g, q.rows, cue(c, 5, 'They match'), cue(c, 5, 'Maya asks'));
    return;
  }
  if (n <= 5) {
    const signed = cue(c, 4, 'She signs', 1.3);
    mayaCase(
      g,
      maya30,
      signed,
      n === 4 && !signed
        ? 'Awaiting confirmation'
        : signed === 1
          ? 'Signed for ' + usd(maya30.amount)
          : '',
    );
    receipt(g, 674, 128, 449, 327, C.cream);
    label(g, 'BILLING QUEUE', 699, 173, C.muted);
    rule(g, 699, 191, 394);
    text(
      g,
      q.rows.length + ' pending ' + (q.rows.length === 1 ? 'entry' : 'entries'),
      699,
      253,
      31,
    );
    if (q.rows.length) {
      mono(g, q.ref, 699, 319, 25, C.ink);
      mono(g, usd(q.rows[0].payload.amount), 699, 371, 25, C.teal);
    }
    return;
  }
  if (n === 6) {
    head(g, 'Maya’s request reference', 63, 91, 46, C.white);
    portrait(g, 941, 221, 'Maya');
    text(g, 'Maya', 982, 232, 29, C.white);
    const transfer = ease(cue(c, 6, 'Give Maya the reference', 1.55));
    const x = lerp(80, 694, transfer);
    line(g, 144, 407, 1079, 407, C.faint, 2);
    customerReceipt(g, x, 261, maya30, q.ref);
    if (cue(c, 6, 'His identifies the specialist review')) {
      receipt(g, 80, 261, 462, 251, C.pink);
      label(g, 'SPECIALIST QUEUE   /   ALEX', 106, 303, C.muted);
      rule(g, 105, 320, 409);
      head(g, 'Review queued', 106, 378, 37);
      text(g, 'A10234     $900.00', 107, 425, 22);
      mono(g, reviewReceipt.reference, 107, 472, 25, C.ink);
    }
    return;
  }
  // The credit receipt remains beside the actual posting field for the final hold.
  paper(g, 67, 68, 617, 490, C.paper, true);
  label(g, 'OWNED INVOICE   /   M240', 110, 119, C.muted);
  head(g, 'Maya’s invoice', 107, 198, 57);
  rule(g, 108, 227, 529);
  text(g, 'GPU usage · verified duplicate', 109, 285, 26);
  mono(g, usd(maya30.total), 111, 344, 34, C.ink);
  line(g, 108, 378, 635, 378, C.rule);
  text(g, 'Posted credit', 110, 431, 26);
  if (cue(c, 7, 'Zero dollars')) mono(g, usd(postedAmount(maya30)), 634, 501, 52, C.teal, 'right');
  customerReceipt(g, 720, 132, maya30, q.ref);
  if (cue(c, 7, 'Alex’s invoice also has zero')) {
    receipt(g, 722, 421, 432, 108, C.cream);
    mono(g, 'Alex  /  ' + original.invoice, 743, 461, 18);
    text(g, 'Posted credit', 742, 500, 21);
    mono(g, usd(postedAmount(original)), 1126, 500, 24, C.ink, 'right');
  }
}
