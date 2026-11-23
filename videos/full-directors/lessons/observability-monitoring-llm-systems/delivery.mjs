import {
  P,
  rect,
  plate,
  line,
  dot,
  txt,
  mono,
  strip,
  screen,
  ledger,
  heading,
  readout,
  beat,
  cue,
  ease,
  clamp,
  mix,
} from './studio.mjs';
import {
  EVENTS,
  pair,
  receipts,
  joinReviews,
  summarize,
  unsafeServeBounds,
  boundsRows,
  reconcileIngress,
} from './examples.mjs';

function pager(g, request, jitter) {
  g.save();
  g.translate(1305 + jitter * 5, 137);
  g.rotate(-0.055 + jitter * 0.009);
  line(g, 135, -22, 237, -111, '#324653', 10);
  plate(g, -187, -68, 369, 148, '#bf5940', 26);
  rect(g, -186, -73, 367, 145, P.orange, 26);
  mono(g, 'ON CALL', -155, -38, 19, '#57382b');
  rect(g, -153, -26, 297, 74, '#455852', 7);
  rect(g, -147, -20, 285, 62, '#d8ddbd', 4);
  mono(g, request ? 'PAGE   #' + request.id : 'STANDBY', -4, 24, 32, '#2c4141', 'center');
  dot(g, 139, -47, 7, request ? '#fff497' : '#ac6952');
  for (let k = 0; k < 6; k++) rect(g, -147 + k * 10, 54, 4, 9, '#a65038', 2);
  g.restore();
}
function approval(g, x, y, ink = P.ink) {
  strip(g, x - 111, y - 38, 222, 76, 'Approved.', P.white, ink, 34);
}
export function opening(g, c) {
  const b = beat(c);
  if (b >= 4 && cue(c, 4, 'Count the unsupported', 0.6) > 0) {
    return windowReview(g, c);
  }
  txt(g, 'Can I deploy?', 67, 100, 72, P.ink, 'Serif');
  mono(g, 'RELEASE RECORD  /  POLICY v17', 70, 162, 22, P.dim);
  line(g, 70, 220, 452, 220, P.dim, 2);
  txt(g, 'Sign-off', 74, 253, 24, P.dim);
  if (cue(c, 1, 'The sign-off line', 0.25) > 0) txt(g, 'Unsigned', 480, 226, 39, P.red, 'Serif');
  const travel = cue(c, 2, 'Freeze the replay', 0) || cue(c, 2, 'Follow both drafts', 2.2);
  const page = cue(c, 3, 'Ring', 0) && pair.find((r) => r.served && r.unsafe);
  const printed = cue(c, 1, 'Out of each model', 1);
  const ring = b === 3 ? (1 - cue(c, 3, 'Ring', 0.9)) * Math.sin(c.elapsed * 26) : 0;
  pager(g, page, ring);
  mono(g, 'MODEL DRAFT', 75, 322, 22, P.dim);
  mono(g, 'SERVING GATE', 678, 322, 22, P.dim);
  mono(g, 'ENGINEER’S SCREEN', 1064, 322, 22, P.dim);
  pair.forEach((r, j) => {
    const y = 428 + j * 258;
    mono(g, '#' + r.id + '   HTTP 200', 74, y - 53, 25, P.teal);
    rect(g, 65, y + 12, 910, 13, '#96a5a0', 5);
    rect(g, 65, y + 26, 912, 6, '#698183', 2);
    for (let k = 0; k < 17; k++) dot(g, 88 + k * 53, y + 19, 5, '#536b71');
    screen(g, 1010, y - 65, 502, 173, 'Reply to #' + r.id);
    const lift = r.served ? clamp(travel / 0.3) : 0;
    rect(g, 755, y - 79 - 60 * lift, 22, 105, '#355961', 4);
    for (let k = 0; k < 5; k++) rect(g, 755, y - 75 + k * 19 - 60 * lift, 22, 7, P.gold, 1);
    const start = 163 + 52 * ease(printed);
    const x = mix(start, r.served ? 1260 : 636, ease(travel));
    const screenOffset = r.served ? 31 * clamp((x - 890) / 140) : 0;
    approval(g, x, y + screenOffset, page === r ? P.red : P.ink);
    if (travel === 1 && !r.served) txt(g, 'Withheld', 1260, y + 48, 45, P.paper, 'Serif', 'center');
  });
  if (b === 2 && cue(c, 2, 'This team pages', 0)) {
    mono(g, 'Page if an approval reaches', 548, 91, 29, P.ink);
    mono(g, 'an engineer without sign-off.', 548, 132, 29, P.ink);
  }
}
function windowReview(g, c) {
  const count = beat(c) === 5 && c.reveal('Two of six', 0, { captionStart: false });
  const link = beat(c) === 5 && c.reveal('link to request', 0, { captionStart: false });
  const exemplar = pair.find((r) => r.served && r.unsafe);
  heading(g, '09:12  /  Reviewed requests', 'Deploy assistant    •    policy v17');
  ledger(
    g,
    ['Request', 'HTTP', 'Gate route', 'Independent review'],
    EVENTS.map((r) => [
      ['#' + r.id, link && r === exemplar ? P.red : P.ink],
      '200 OK',
      r.route,
      [
        r.unsafe ? 'Unsupported approval' : r.served ? 'Supported answer' : 'Withheld',
        r.unsafe ? P.red : P.teal,
      ],
    ]),
    { step: 66 },
  );
  const unsafeDeliveries = EVENTS.filter((r) => r.served && r.unsafe).length;
  const reviewedTotal = `${unsafeDeliveries} / ${EVENTS.length} reviewed`;
  readout(g, 70, 696, 'Unsupported deliveries', count ? reviewedTotal : 'Count the replies', {
    w: 750,
  });
  if (link) mono(g, 'Open exemplar   →   #' + exemplar.id, 1050, 775, 29, P.red);
}
function ingressLedger(g, c) {
  const { rows, received, missing } = reconcileIngress(cue(c, 4, 'eight requests entered', 0) > 0);
  const follow = cue(c, 5, 'Read down from R eight', 1.25);
  const countFocus = cue(c, 5, 'The collector slot is empty', 0.45);
  const ochre = '#87551b';
  heading(g, 'Ingress reconciliation', 'Same time window    •    unique request IDs');
  mono(g, 'Ingress', 75, 254);
  mono(g, 'Collector', 75, 455);
  rows.forEach(({ id, hasFinal }, i) => {
    const x = 75 + i * 184;
    strip(g, x, 280, 157, 85, id);
    if (hasFinal) {
      strip(g, x, 480, 157, 85, 'Final', P.mint);
      return;
    }
    g.save();
    g.lineWidth = 3;
    g.strokeStyle = ochre;
    g.setLineDash([10, 9]);
    g.beginPath();
    g.roundRect(x, 480, 157, 85, 5);
    g.stroke();
    g.restore();
    if (follow > 0) {
      const mid = x + 78.5;
      const y = mix(374, 465, ease(follow));
      line(g, mid, 374, mid, y, ochre, 4);
      dot(g, mid, y, 6, ochre);
    }
  });
  if (countFocus > 0) {
    g.save();
    g.globalAlpha = countFocus;
    g.strokeStyle = ochre;
    g.lineWidth = 3;
    g.beginPath();
    g.roundRect(62, 643, 336, 144, 8);
    g.stroke();
    g.restore();
  }
  readout(g, 75, 657, 'Missing final events', `${rows.length} − ${received} = ${missing}`, { w: 310 });
  if (cue(c, 5, 'unknown', 0)) {
    readout(g, 463, 657, 'R8 latency and cost', 'Unknown', { w: 310 });
  }
  if (cue(c, 5, 'Look for a delivery record', 0)) {
    readout(g, 842, 657, 'R8 reply delivered?', 'Unknown', { w: 310 });
    txt(g, 'Need delivery record', 842, 811, 27, P.dim);
  }
  if (cue(c, 5, 'independent review', 0)) {
    readout(g, 1218, 657, 'R8 safety verdict', 'Unknown', { w: 305 });
    txt(g, 'Need reviewed reply', 1218, 811, 27, P.dim);
  }
}
export function eventContract(g, c) {
  const b = beat(c);
  if (b >= 4) return ingressLedger(g, c);
  const leaked = cue(c, 1, 'It says', 0.3) > 0;
  heading(
    g,
    b === 3 ? 'Validate at ingestion' : 'A route and its actual reply',
    'Final event    /    route, delivery, review',
  );
  if (b === 3) {
    ledger(
      g,
      ['Supplied field', 'Contract', 'Ingest'],
      [
        ['route = magic', 'Known route', ['Reject', P.red]],
        ['request_id = ""', 'Nonempty identity', ['Reject', P.red]],
        ['served = "true"', 'Boolean', ['Reject', P.red]],
        ['unsafe = true, served = false', 'Unsafe requires delivery', ['Reject', P.red]],
      ],
      { step: 97, widths: [610, 560, 290] },
    );
    return;
  }
  plate(g, 75, 225, 670, 310);
  mono(g, 'GATE DECISION', 110, 283, 25, P.dim);
  txt(g, 'abstain', 110, 408, 83, P.blue, 'Serif');
  screen(g, 825, 225, 690, 310, 'Actual operator reply');
  if (leaked) txt(g, 'Deployment approved.', 1170, 410, 52, P.paper, 'Serif', 'center');
  readout(g, 75, 625, 'Substantive delivery', leaked ? 'true' : 'Awaiting payload', { w: 450 });
  readout(g, 582, 625, 'Review on this event', 'Pending · verdict absent', { w: 530 });
  if (cue(c, 2, 'After a reviewer', 0.5) > 0)
    readout(g, 1165, 625, 'Separate reviewed safe case', 'unsafe = false', { w: 350, col: P.teal });
}
export function joined(g, c) {
  const a = cue(c, 1, 'Separate supplied reviews', 2);
  const d = cue(c, 2, 'remaining receipts', 1.4);
  const count = Math.floor(4 * a) + Math.floor(2 * d);
  const replay = cue(c, 2, 'Replaying a receipt', 0.4);
  const replayedReceipt = receipts[4];
  const supplied = receipts.slice(0, count);
  const rows = joinReviews(EVENTS, replay > 0 ? [...supplied, replayedReceipt] : supplied);
  const ledgerTop = 185;
  const rowHeight = 70;
  heading(
    g,
    'Six request identities',
    'Final serving events    /    review receipts arrive later',
  );
  ledger(
    g,
    ['ID', 'Gate', 'Delivery', 'Independent verdict'],
    rows.map((r) => [
      '#' + r.id,
      r.route,
      r.served ? 'Answer' : 'Withheld',
      [
        r.unsafe === null
          ? 'Awaiting review'
          : r.unsafe
            ? 'Unsupported approval'
            : 'No unsafe delivery',
        r.unsafe === true ? P.red : r.unsafe === null ? P.dim : P.teal,
      ],
    ]),
    { y: ledgerTop, step: rowHeight, widths: [245, 260, 325, 630] },
  );
  mono(g, count + ' reviews    /    ' + rows.length + ' requests', 80, 765, 33);
  if (count === receipts.length) {
    const rowIndex = rows.findIndex((row) => row.id === replayedReceipt.id);
    const rowTop = ledgerTop + (rowIndex + 1) * rowHeight;
    if (replay === 0) mono(g, 'Next receipt', 1278, 147, 30, P.dim, 'right');
    if (replay === 1) {
      g.save();
      g.strokeStyle = P.blue;
      g.lineWidth = 4;
      g.strokeRect(76, rowTop + 3, 1448, rowHeight - 6);
      g.restore();
    }
    const ticketY = mix(111, rowTop + 7, ease(replay));
    strip(g, 1302, ticketY, 213, 50, 'Replay #' + replayedReceipt.id, P.sky, P.ink, 32);
  }
}
export function asof(g, c) {
  const b = beat(c);
  if (b >= 4) {
    const visible = [
      cue(c, 5, 'Among reviewed requests', 0) > 0,
      cue(c, 5, 'Among reviewed answers', 0) > 0,
      b === 5 && c.elapsed >= c.speechDuration,
    ];
    heading(g, 'Three populations in one cohort', '10 ingress requests    /    evaluator A');
    const sets = [
      ['All requests', 10],
      ['Reviewed', 8],
      ['Reviewed answers', 5],
    ];
    sets.forEach(([s, n], i) => {
      const y = 250 + 111 * i;
      txt(g, s, 76, y + 25, 31);
      for (let j = 0; j < n; j++)
        rect(g, 455 + j * 88, y, 72, 46, j === 0 ? P.red : i === 0 ? '#abbcb5' : P.teal, 6);
    });
    const labels = ['Review coverage', 'Reviewed unsafe rate', 'Unsafe among reviewed answers'];
    ['8 / 10', '1 / 8', '1 / 5'].forEach((v, i) =>
      readout(g, 75 + i * 500, 648, labels[i], visible[i] ? v : '?', { w: 443 }),
    );
    return;
  }
  const updated = cue(c, 3, 'Its verdict goes', 0.5) > 0,
    replayed = cue(c, 3, 'Replaying the same', 0.5) > 0;
  heading(g, 'When did we know?', 'Frozen cohort    /    evaluator A    /    request #205');
  line(g, 170, 345, 1440, 345, P.dim, 5);
  [
    [170, 'Request ends', '10 s'],
    [678, 'Snapshot cutoff', '30 s'],
    [1440, 'Review available', '60 s'],
  ].forEach(([x, s, t]) => {
    dot(g, x, 345, 13, P.teal);
    mono(g, t, x, 305, 31, P.ink, 'center');
    txt(g, s, x, 403, 28, P.dim, 'Sans', 'center');
  });
  ledger(
    g,
    ['Snapshot', 'Request', 'Unsafe verdict'],
    [
      ['At 30 s', '#205', 'Pending · omitted'],
      [
        updated ? 'At 60 s' : 'Later',
        '#205',
        [updated ? 'true' : 'Awaiting receipt', updated ? P.red : P.dim],
      ],
    ],
    { y: 500, step: 67, widths: [400, 380, 680] },
  );
  if (replayed)
    mono(g, 'Replay receipt  →  update #205    /    6 distinct request IDs', 83, 795, 30, P.teal);
}
export function denominators(g, c) {
  const b = beat(c),
    partial = cue(c, 5, 'remove only the reviews', 0.7) > 0;
  const rows = joinReviews(
    EVENTS,
    receipts.filter((_, i) => !partial || ![1, 2, 3].includes(i)),
  );
  const summary = summarize(rows),
    bound = unsafeServeBounds(rows);
  const mask = b >= 2 && !partial;
  heading(
    g,
    'Which receipts count?',
    partial
      ? 'Reviews removed from 202, 203 and 204'
      : 'Complete window    /    one final serving event per ID',
  );
  rows.forEach((r, i) => {
    const x = 65 + i * 248;
    plate(g, x, 225, 232, 325, P.white, 6);
    mono(g, '#' + r.id, x + 18, 274, 34);
    line(g, x + 15, 297, x + 215, 297);
    txt(g, r.served ? 'Answer' : 'Withheld', x + 17, 354, 37);
    txt(
      g,
      r.unsafe === null ? 'Pending' : r.unsafe ? 'Unsafe' : 'Clear',
      x + 17,
      424,
      39,
      r.unsafe ? P.red : r.unsafe === null ? P.dim : P.teal,
      'Serif',
    );
    if (!mask || r.served)
      rect(g, x + 16, 485, 196, 19, r.unsafe ? P.red : r.unsafe === null ? P.line : P.teal, 5);
  });
  readout(g, 68, 630, 'Unsafe / reviewed', summary.unsafe + ' / ' + summary.reviewed, { w: 390 });
  if (mask)
    readout(
      g,
      545,
      630,
      'Unsafe / reviewed answers',
      cue(c, 3, 'Requests two oh five', 0) > 0 ? summary.unsafe + ' / ' + summary.served : '?',
      { w: 480 },
    );
  if (partial) {
    readout(g, 540, 630, 'Review coverage', summary.reviewed + ' / 6', { w: 405 });
    if (b === 6)
      readout(g, 1035, 630, 'Unsafe in full window', bound.lowerCount + ' of 6', { w: 445 });
  }
  if (b === 4) readout(g, 1060, 630, 'Defective drafts → escapes', '4 → 2', { w: 405 });
}
export function bounds(g, c) {
  const missing = cue(c, 5, 'take away the final event', 0.5) > 0;
  const rows = boundsRows(missing),
    bound = unsafeServeBounds(rows, 7);
  const show = missing
    ? cue(c, 6, 'Request seven can', 0) > 0
    : cue(c, 3, 'The last two columns', 0) > 0;
  heading(g, 'Seven arrivals. How many unsafe replies?', 'Bound the whole ingress cohort');
  const deliveryShown = cue(c, 2, 'Two answers went out', 0.4) > 0;
  for (let i = 0; i < 7; i++) {
    const r = rows[i],
      x = 62 + i * 214,
      known = i < 3 || deliveryShown;
    plate(g, x, 230, 193, 320, r ? P.white : '#d3d8cf', 8);
    mono(g, 'R' + (i + 1), x + 18, 284, 34);
    line(g, x + 13, 310, x + 178, 310);
    txt(
      g,
      !known ? '…' : !r ? 'No event' : r.served ? 'Answer' : 'Withheld',
      x + 15,
      372,
      29,
      P.ink,
    );
    txt(
      g,
      !r ? 'Unknown' : r.unsafe === true ? 'Unsafe' : r.unsafe === false ? 'Clear' : 'Pending',
      x + 15,
      443,
      30,
      r?.unsafe === true ? P.red : P.dim,
    );
    if (show) {
      const contribution = !r
        ? '0 or 1'
        : r.unsafe === true
          ? '1'
          : r.unsafe === null && r.served
            ? '0 or 1'
            : '0';
      mono(g, contribution, x + 96, 517, 29, contribution === '0' ? P.dim : P.red, 'center');
    }
  }
  readout(
    g,
    70,
    645,
    'Minimum unsafe',
    cue(c, 3, 'Look at the two', 0) > 0 ? bound.lowerCount + ' / 7' : '?',
    { w: 425 },
  );
  readout(g, 590, 645, 'Maximum unsafe', show ? bound.upperCount + ' / 7' : '?', { w: 425 });
  if (missing) readout(g, 1105, 645, 'Final events received', '6 / 7', { w: 425 });
}
