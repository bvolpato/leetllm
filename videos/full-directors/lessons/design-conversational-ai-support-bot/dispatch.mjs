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
  usd,
} from './drawing.mjs';
import {
  original,
  confirmed,
  scheduleState,
  confirmedForty,
  race,
  storageOnSameInvoice,
  hash,
  runQueue,
  packet,
  reviewPacket,
  reviewReceipt,
  acknowledgmentMatches,
  repairAllowed,
} from './records.mjs';

function dial(g, x, y, t) {
  dot(g, x, y, 54, '#bb985c');
  dot(g, x, y, 49, C.cream);
  dot(g, x, y, 44, '#e4dec8');
  for (let i = 0; i < 12; i++) {
    const a = ((i - 3) * Math.PI) / 6;
    line(
      g,
      x + Math.cos(a) * 36,
      y + Math.sin(a) * 36,
      x + Math.cos(a) * 42,
      y + Math.sin(a) * 42,
      C.muted,
      i % 3 === 0 ? 2 : 1,
    );
  }
  const a = (t / 8 - 0.25) * 2 * Math.PI;
  line(g, x, y, x + 35 * Math.cos(a), y + 35 * Math.sin(a), C.red, 3);
  dot(g, x, y, 4, C.ink);
}
export function reads(g, c) {
  const n = beat(c),
    serial = n === 1,
    expired = n === 4;
  let t;
  if (serial)
    t =
      2 * ease(cue(c, 1, 'run the policy lookup', 1.35)) +
      3 * ease(cue(c, 1, 'Then run the invoice', 1.7)) +
      ease(cue(c, 1, 'merge takes one more tick', 1.15));
  else if (n === 2)
    t =
      1.7 * ease(cue(c, 2, 'Start both lookups', 1.8)) + 0.3 * ease(cue(c, 2, 'at tick two', 0.8));
  else if (n === 3)
    t =
      2 +
      ease(cue(c, 3, 'It arrives at tick three', 1.6)) +
      ease(cue(c, 3, 'Start the merge', 1.35));
  else
    t =
      2 * ease(cue(c, 4, 'Policy still comes back', 1.7)) +
      ease(cue(c, 4, 'reaches its deadline', 1.15));
  const s = scheduleState(t, serial, expired);
  board(g, '#293e49', '#182f3b');
  box(g, 55, 53, 1090, 521, '#81918a', 13);
  box(g, 61, 59, 1078, 509, '#263f47', 9);
  for (const xx of [78, 1120])
    for (const yy of [77, 550]) {
      dot(g, xx, yy, 5, '#bbaa87');
      line(g, xx - 3, yy + 2, xx + 3, yy - 2, C.muted, 1.5);
    }
  head(
    g,
    serial ? 'Sequential reads' : expired ? 'Invoice deadline' : 'Parallel reads',
    95,
    127,
    44,
    C.white,
  );
  dial(g, 1050, 130, t);
  mono(g, 'A10234   /   Alex   /   revision 4', 96, 173, 19, '#bbd4c7');
  paper(g, 91, 200, 1009, 249, C.cream);
  const xx = (v) => 284 + v * 123;
  const colors = [C.teal, C.blue, '#785782'];
  for (let i = 0; i <= 6; i++) {
    line(g, xx(i), 227, xx(i), 423, '#c9cbb7');
    mono(g, i, xx(i), 236, 15, C.muted, 'center');
  }
  s.stages.forEach(([start, end], i) => {
    const yy = 277 + i * 65;
    text(g, ['Policy', 'Invoice', 'Merge'][i], 113, yy + 8, 22);
    line(g, xx(0), yy, xx(6), yy, '#b7bdaa');
    if (end > start) {
      box(g, xx(start), yy - 6, xx(end) - xx(start), 12, colors[i], 3);
    }
    const isReading =
      t >= start &&
      (i === 0 ? t < 2 : i === 1 ? !s.invoice && !s.timeout : i === 2 && s.join && end - start < 1);
    if (isReading && (i !== 2 || s.join)) {
      // The nib keeps moving along its own small vertical stroke while the clock is held for a question.
      const px = xx(end),
        py = yy - 7 - Math.sin(c.elapsed * 8) * 2;
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + 5, py - 15);
      g.lineTo(px + 12, py - 10);
      g.closePath();
      g.fillStyle = colors[i];
      g.fill();
    }
    if (i === 1 && s.timeout) {
      line(g, xx(end) - 6, yy - 9, xx(end) + 6, yy + 9, C.red, 3);
      line(g, xx(end) + 6, yy - 9, xx(end) - 6, yy + 9, C.red, 3);
    }
  });
  const slot = (x, title, sub, good) => {
    box(g, x, 471, 313, 69, good ? C.mint : '#193039', 4);
    mono(g, title, x + 14, 497, 16, good ? C.teal : '#dae8dc');
    text(g, sub, x + 14, 525, 18, good ? C.ink : C.brass);
  };
  slot(92, 'POLICY RECEIPT', s.policy ? 'US-v3 · A10234 / R4' : 'Awaiting policy', s.policy);
  slot(
    423,
    'INVOICE RECEIPT',
    s.invoice
      ? 'Alex · A10234 / R4'
      : s.timeout
        ? 'Timeout · no receipt'
        : !serial || t >= 2
          ? 'Invoice read in progress'
          : 'Waiting to start',
    s.invoice,
  );
  const completed = s.stages[2][1] - s.stages[2][0] >= 1;
  if (completed && (serial ? cue(c, 1, '$') : cue(c, 3, 'We saved the two ticks')))
    stamp(g, serial ? '6 ticks elapsed' : '4 ticks elapsed', 778, 515, C.brass, 22);
  else if (s.timeout) text(g, 'Refer missing read', 774, 515, 23, C.cream);
  else if (s.join) text(g, 'Both reads match', 774, 515, 23, C.cream);
}

function printer(g, x, y, w, name) {
  box(g, x + 8, y + 17, w, 117, '#0b262b', 14);
  box(g, x, y, w, 110, '#567b77', 13);
  box(g, x + 6, y + 6, w - 12, 95, '#638982', 9);
  line(g, x + 12, y + 64, x + w - 12, y + 64, '#acc1af', 1);
  box(g, x + 32, y + 83, w - 64, 15, '#1f3e3f', 7);
  head(g, name, x + 23, y + 47, 28, C.white);
  dot(g, x + w - 29, y + 35, 6, C.brass);
}
function queueForm(g, x, y, q) {
  receipt(g, x, y, 392, 213, C.paper);
  label(g, 'BILLING   /   CREDIT QUEUE', x + 23, y + 37, C.muted);
  rule(g, x + 23, y + 53, 342);
  text(
    g,
    q.rows.length + ' pending ' + (q.rows.length === 1 ? 'entry' : 'entries'),
    x + 23,
    y + 99,
    27,
  );
  if (q.rows.length) {
    const row = q.rows[0];
    mono(g, row.payload.invoice + '   ' + usd(row.payload.amount), x + 24, y + 144, 24, C.teal);
    mono(g, row.key, x + 23, y + 182, 19);
  } else text(g, 'No request stored', x + 23, y + 152, 21, C.muted);
}

function raceProgress(c, phrase) {
  const { start, end } = c.wordCue(phrase);
  return c.reveal(phrase, end - start, { captionStart: phrase });
}

function drawRace(g, c) {
  const bothRead = raceProgress(c, 'Process A and process B each read it before either inserts') === 1;
  const firstWrite = raceProgress(c, 'A commits the GPU request and its outbox entry together');
  const secondWrite = raceProgress(c, 'B then tries the signed storage request');
  const checking = cue(c, 7, 'The database checks');
  const rejected = raceProgress(c, 'It rejects the second insert') === 1;
  const q = rejected ? race.second : firstWrite === 1 ? race.first : race.empty;
  const request = q.rows[0];
  const duplicate = q.result?.status === 'DUPLICATE INVOICE';

  head(g, 'Two tickets, one invoice', 65, 91, 46, C.white);
  mono(g, 'REPLAY FROM EMPTY QUEUE', 68, 133, 19, C.cream);

  for (const [i, proposal] of [confirmed, storageOnSameInvoice].entries()) {
    const y = 166 + i * 176;
    const railY = y + 54;
    const progress = i ? secondWrite : firstWrite;
    receipt(g, 69, y, 343, 153, i ? C.pink : C.cream);
    label(g, i ? 'PROCESS B' : 'PROCESS A', 94, y + 37, C.muted);
    head(g, (i ? 'Storage' : 'GPU') + ' · ' + usd(proposal.amount), 93, y + 76, 32);
    mono(g, 'Ticket ' + proposal.ticket, 95, y + 108, 20, C.ink);
    if (bothRead) text(g, 'Earlier read: empty', 95, y + 134, 20, C.muted);

    arrow(g, 419, railY, 687, railY, C.faint, 3);
    if (i ? progress > 0 && !duplicate : progress > 0 && progress < 1) {
      const x = lerp(477, 627, ease(progress));
      box(g, x - 53, railY - 20, 106, 40, i ? C.pink : C.cream, 5);
      mono(g, '#' + proposal.ticket, x, railY + 7, 19, C.ink, 'center');
    }
    if (!i && request) text(g, 'Committed', 544, railY + 48, 22, C.mint, 'Sans', 600, 'center');
    if (i && duplicate) {
      const stop = 686;
      line(g, stop - 9, railY - 9, stop + 9, railY + 9, C.pink, 4);
      line(g, stop + 9, railY - 9, stop - 9, railY + 9, C.pink, 4);
      text(g, 'Insert rejected', 552, railY + 48, 22, C.pink, 'Sans', 600, 'center');
    }
  }

  paper(g, 707, 154, 424, 365, C.paper);
  label(g, 'SHARED DATABASE', 735, 198, C.muted);
  rule(g, 733, 215, 371);
  text(g, 'One claim per account + invoice', 735, 253, 23);
  mono(g, confirmed.customer + ' / ' + confirmed.invoice, 735, 289, 30, C.ink);
  if (checking) {
    text(
      g,
      duplicate ? 'Invoice already claimed' : 'Checking invoice claim',
      735,
      323,
      21,
      duplicate ? C.red : C.muted,
    );
  }
  line(g, 734, 343, 1102, 343, C.rule);
  text(g, 'Pending request', 735, 392, 22);
  mono(
    g,
    request ? q.rows.length + ' × ' + usd(request.payload.amount) : 'Empty',
    1101,
    392,
    22,
    request ? C.teal : C.muted,
    'right',
  );
  text(g, 'Outbox', 735, 457, 22);
  mono(
    g,
    q.outbox.length ? q.outbox.length + ' billing job' : 'Empty',
    1101,
    457,
    22,
    q.outbox.length ? C.teal : C.muted,
    'right',
  );
}

export function ledger(g, c) {
  const n = beat(c);
  board(g);
  if (n >= 8) {
    const outside = cue(c, 9, 'Keys can be pruned'),
      reconciled = cue(c, 9, 'Reconcile an old');
    head(g, 'How long does the key identify this operation?', 63, 96, 40, C.white);
    receipt(g, 69, 178, 523, 304, C.cream);
    label(g, 'BILLING WORKER', 96, 220, C.muted);
    rule(g, 95, 241, 462);
    head(g, 'Before posting', 95, 313, 36);
    text(g, 'Check the remaining balance.', 96, 371, 24);
    text(g, 'Revalidate the current authority.', 96, 424, 23);
    receipt(g, 635, 178, 496, 304, outside ? C.pink : C.mint);
    label(g, 'REMOTE API   /   V1 EXAMPLE', 660, 220, C.muted);
    rule(g, 660, 241, 439);
    head(g, outside ? 'Key may be pruned' : 'Key retained', 659, 313, 34);
    text(g, outside ? 'After at least 24 hours' : 'Same key + same parameters', 660, 373, 23);
    text(g, outside ? 'Effect remains uncertain' : 'Retain first executed response', 660, 424, 23);
    if (reconciled) stamp(g, 'Reconcile before another operation', 347, 555, C.brass, 21);
    return;
  }
  if (n === 7 && cue(c, 7, 'Replay both tickets')) {
    drawRace(g, c);
    return;
  }
  const inserted = cue(c, 1, 'inserts one pending request');
  const retry = cue(c, 3, 'queue returns its stored acknowledgment');
  const conflict = n === 5 && cue(c, 5, 'returns a conflict');
  const invoiceClaim = n === 7 && cue(c, 7, 'The invoice already has');
  const mode = invoiceClaim
    ? 'reticket'
    : conflict
      ? 'conflict'
      : retry
        ? 'retry'
        : inserted
          ? 'insert'
          : 'empty';
  const q = runQueue(confirmed, mode);
  const delivered = cue(c, 3, 'Once that receipt reaches the app', 1.2);
  const separate = n >= 5;
  head(
    g,
    n === 5
      ? 'Queue test · same key, new consent'
      : n >= 6
        ? 'Queue test · second item on the invoice'
        : 'The missing acknowledgment',
    65,
    89,
    44,
    C.white,
  );
  printer(g, 714, 160, 386, 'Billing spool');
  queueForm(g, 712, 253, q);
  if (separate) mono(g, 'Stored item   ' + q.rows[0].payload.item, 720, 509, 20, C.cream);
  paper(g, 72, 165, 405, 301, C.cream, true);
  label(
    g,
    separate ? 'SUPPORT APP   /   FRESH REQUEST' : 'SUPPORT APP   /   ATTEMPT',
    117,
    209,
    C.muted,
  );
  rule(g, 114, 228, 326);
  const proposal = n >= 6 ? storageOnSameInvoice : n === 5 ? confirmedForty : confirmed;
  const showTerms = !separate || (n === 5 ? cue(c, 5, 'Alex signs') : cue(c, 6, 'Alex confirms'));
  if (showTerms) {
    mono(g, 'credit:' + proposal.ticket, 116, 271, 22, C.ink);
    text(g, usd(proposal.amount) + ' on ' + proposal.invoice, 116, 311, 26);
    if (separate) {
      mono(g, proposal.customer + ' signed · ' + proposal.item, 116, 352, 17, C.teal);
      const verdict = q.result?.status;
      if (verdict === 'CONFLICT') stamp(g, 'Payload conflict', 116, 414, C.red, 20);
      else if (verdict === 'DUPLICATE INVOICE')
        stamp(g, 'Invoice already claimed', 111, 414, C.red, 19);
      else text(g, 'Compare with stored row', 116, 412, 21, C.muted);
    } else if (delivered === 1) stamp(g, 'Receipt recovered', 116, 403, C.teal, 21);
    else if (cue(c, 1, 'reply disappears')) text(g, 'Receipt missing', 116, 402, 23, C.red);
    else text(g, 'Awaiting receipt', 116, 402, 23, C.muted);
  } else text(g, 'Preparing signed terms', 116, 315, 23, C.muted);
  line(g, 486, 318, 695, 318, C.faint, 2);
  if (n === 1) {
    const lost = cue(c, 1, 'reply disappears'),
      moving = ease(cue(c, 1, 'sends back an acknowledgment', 0.8));
    if (moving && !lost) receipt(g, 670 - 106 * moving, 297, 54, 42, C.mint);
    if (lost) {
      line(g, 579, 304, 601, 332, C.brass, 3);
      line(g, 601, 304, 579, 332, C.brass, 3);
    }
  }
  if (n >= 3 && n <= 4 && delivered > 0) {
    receipt(g, lerp(530, 92, ease(delivered)), 472, 373, 92, C.mint);
    mono(g, 'Retained reference', lerp(549, 111, ease(delivered)), 505, 16);
    mono(g, q.ref, lerp(549, 111, ease(delivered)), 541, 23, C.ink);
  }
  if (n === 4) text(g, 'Posted credit   $0.00', 717, 539, 23, C.cream);
}

function quotation(g, words, x, y, w, h) {
  paper(g, x, y, w, h, C.paper);
  label(g, 'UNSENT   /   CANDIDATE REPLY', x + 25, y + 41, C.muted);
  words.forEach((s, i) => head(g, s, x + 24, y + 110 + i * 48, 36));
}
export function replies(g, c) {
  board(g, '#614441', '#362d38');
  const n = beat(c);
  if (n <= 3) {
    head(g, 'Original $900 case · check the reply', 64, 97, 45, C.white);
    const words =
      n === 1
        ? ['“I’ve credited $900', 'back to your account!”']
        : n === 2
          ? ['“Your refund is', 'on the way.”']
          : ['“A billing specialist', 'needs to review it.”'];
    quotation(g, words, 68, 157, 601, 267);
    if (n === 3) {
      box(g, 85, 177, 548, 38, C.paper);
      label(g, 'APPLICATION   /   STATUS TEMPLATE', 94, 204, C.teal);
    }
    receipt(g, 715, 157, 410, 268, n === 2 ? C.mint : C.cream);
    label(g, n === 2 ? 'CITED PASSAGE   /   US-v3' : 'CASE RECORD   /   A10234', 741, 202, C.muted);
    if (n !== 2) {
      text(g, 'Pending credits', 741, 270, 23);
      mono(g, '0', 1092, 270, 31, C.ink, 'right');
      text(g, 'Posted credits', 741, 325, 23);
      mono(g, '0', 1092, 325, 31, C.ink, 'right');
    } else {
      head(g, 'Specialist review', 740, 284, 36);
      text(g, 'Required from $500', 741, 342, 24);
    }
    if (n === 1 && cue(c, 1, 'trigger two errors')) {
      stamp(g, 'Unsupported status', 91, 487, C.brass, 22);
      stamp(g, 'Missing citation', 477, 487, C.brass, 22);
    }
    if (n === 2 && cue(c, 2, 'It requires specialist review')) {
      stamp(g, 'Citation ID exists', 86, 486, C.brass, 21);
      stamp(g, 'Passage does not support refund', 501, 486, C.brass, 20);
    }
    if (n === 3)
      text(
        g,
        'Check the explanation for support and privacy before sending.',
        78,
        506,
        25,
        C.white,
      );
    return;
  }
  const cap = n === 4 ? 3 : 2;
  const used =
    n === 4
      ? cue(c, 4, 'revise once')
        ? 3
        : 2
      : cue(c, 5, 'fallback consumes')
        ? 2
        : cue(c, 5, 'first call times out')
          ? 1
          : 0;
  const can = repairAllowed(cap, used, n === 4 && used === 3 ? 1 : 0, true, true);
  head(g, 'Each draft spends an attempt', 66, 95, 47, C.white);
  paper(g, 70, 155, 1055, 348, C.paper, true);
  label(g, 'GENERATION ALLOWANCE', 119, 207, C.muted);
  for (let i = 0; i < cap; i++) {
    const x = 123 + i * 310,
      active = i < used;
    box(g, x, 253, 280, 164, active ? (i === 2 ? C.mint : C.pink) : '#e7e7d4', 5);
    mono(g, 'Attempt 0' + (i + 1), x + 18, 292, 19);
    const desc =
      n === 4 ? ['Used', 'Rejected draft', 'Guided repair'][i] : ['Timeout', 'Fallback draft'][i];
    head(g, active ? desc : 'Available', x + 18, 348, 28);
    text(g, active ? 'Consumed' : 'Open slot', x + 18, 392, 19);
  }
  const left = cap - used;
  mono(
    g,
    left + ' generation ' + (left === 1 ? 'attempt' : 'attempts') + ' left',
    121,
    466,
    21,
    C.ink,
  );
  if (n === 4 && used === 3)
    text(
      g,
      'Same evidence and permissions. Recheck support, disposition and privacy.',
      77,
      555,
      23,
      C.white,
    );
  else if (n === 4 && can)
    text(g, 'One revision available while time and spend remain.', 77, 555, 23, C.white);
  else if (n >= 5 && !left && cue(c, 5, 'The unused revision allowance')) {
    stamp(g, 'Reply checks failed', 708, 463, C.red, 18);
    text(g, 'Stop drafting. Abstain or seek review.', 77, 555, 25, C.cream);
  }
}

function packetRows(v) {
  return v.invoice
    ? [
        ['Ticket', v.ticket],
        ['Invoice', v.invoice + '  /  ' + v.customer],
        ['Request', usd(v.amount)],
        ['Policy', v.policy + '  /  R' + v.revision],
        ['Reason', v.reason],
      ]
    : [
        ['Ticket', v.ticket],
        ['Reason', 'Verify identity'],
      ];
}
export function handoff(g, c) {
  board(g);
  const n = beat(c);
  const privateRemoved = n === 3 && cue(c, 3, 'identity unverified');
  const out = privateRemoved ? packet({ ...original, authenticated: false }) : reviewPacket;
  const accepted =
    n === 2 && cue(c, 2, 'Now the app can say') && acknowledgmentMatches(out, reviewReceipt);
  head(
    g,
    n <= 2
      ? 'Delivery of a review packet'
      : n === 3
        ? 'The destination’s copy'
        : 'Resuming a review task',
    66,
    90,
    46,
    C.white,
  );
  if (n === 2) {
    const sentID = hash(out);
    const received = cue(c, 2, 'returns a receipt');
    const matched = received && acknowledgmentMatches(out, reviewReceipt);
    paper(g, 69, 150, 502, 349, C.cream, true);
    label(g, 'SENT   /   REVIEW PACKET', 111, 196, C.teal);
    rule(g, 109, 214, 417);
    head(g, 'Specialist handoff', 110, 270, 33);
    text(g, 'Destination', 111, 320, 21, C.muted);
    mono(g, 'specialist', 301, 320, 21, C.ink);
    text(g, 'Packet digest prefix', 111, 376, 21, C.muted);
    mono(g, sentID.slice(0, 16), 111, 416, 28, C.ink);
    mono(g, out.ticket + '  /  ' + out.invoice + '  /  R' + out.revision, 111, 468, 18);
    if (received) {
      receipt(g, 619, 150, 514, 349, C.mint);
      label(g, 'RETURNED   /   DELIVERY RECEIPT', 646, 196, C.teal);
      rule(g, 645, 214, 455);
      head(g, reviewReceipt.reference, 645, 270, 34);
      text(g, 'Destination', 646, 320, 21, C.muted);
      mono(g, reviewReceipt.queue, 828, 320, 21, C.ink);
      text(g, 'Echoed digest prefix', 646, 376, 21, C.muted);
      mono(g, reviewReceipt.packet.slice(0, 16), 646, 416, 28, C.ink);
      mono(g, 'Success  ' + reviewReceipt.success, 646, 468, 21, C.teal);
    }
    if (matched && cue(c, 2, 'The reference on this receipt'))
      text(g, 'Full packet digest matches', 83, 558, 24, C.cream);
    if (accepted) stamp(g, 'Review queued', 725, 555, C.brass, 23);
    return;
  }
  if (n <= 3) {
    const x = 69,
      y = 160;
    paper(g, x, y, 490, 350, C.cream, true);
    label(g, 'SERVER   /   RETAINED COPY', x + 43, y + 43, C.muted);
    rule(g, x + 40, y + 56, 409);
    packetRows(reviewPacket).forEach(([k, v], i) => {
      const yy = y + 100 + i * 47;
      text(g, k, x + 40, yy, 20, C.muted);
      text(g, v, x + 150, yy, 21);
    });
    const sent = cue(c, 1, 'Send the packet', 1.2);
    if (sent > 0) {
      const ex = lerp(585, 643, ease(sent));
      box(g, ex, 208, 466, 270, '#d5b47c', 5);
      g.beginPath();
      g.moveTo(ex, 208);
      g.lineTo(ex + 233, 353);
      g.lineTo(ex + 466, 208);
      g.strokeStyle = '#9a794f';
      g.lineWidth = 3;
      g.stroke();
      paper(g, ex + 22, 167, 421, 259, privateRemoved ? C.mint : C.paper);
      label(g, 'SPECIALIST QUEUE   /   OUTGOING', ex + 43, 204, C.muted);
      packetRows(out).forEach(([k, v], i) => {
        const yy = 246 + i * 37;
        mono(g, k, ex + 44, yy, 15);
        text(g, v, ex + 147, yy, 20);
      });
    }
    if (n === 1 && sent === 1)
      mono(g, 'Packet digest prefix   ' + hash(out).slice(0, 16), 646, 532, 18, C.cream);
    if (privateRemoved) mono(g, '2 fields sent', 673, 537, 22, C.white);
    return;
  }
  paper(g, 75, 160, 1028, 347, C.paper, true);
  label(g, 'SPECIALIST REVIEW   /   ' + reviewReceipt.reference, 122, 209, C.muted);
  rule(g, 119, 231, 934);
  head(g, n === 4 ? 'Approval for one action' : 'Locate the paused thread', 119, 295, 37);
  const rows =
    n === 4
      ? [
          ['Exact action', 'Alex · A10234 · $900.00'],
          ['Reviewer', 'Permission, expiry, unused approval'],
          ['Resume', 'Recheck owner, evidence, balance and policy'],
        ]
      : [
          ['Checkpoint', 'Ticket 48291 · R4'],
          ['Action service', 'Authorize the write against current state'],
          ['Submission timeout', 'Outcome unknown until reconciled'],
        ];
  rows.forEach(([k, v], i) => {
    const yy = 351 + i * 58;
    text(g, k, 121, yy, 22, C.teal);
    text(g, v, 411, yy, 22);
  });
  if (n === 4)
    mono(g, 'Review task states: waiting / accepted / resolved / expired', 82, 557, 19, C.cream);
}
