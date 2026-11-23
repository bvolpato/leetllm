import {
  C,
  base,
  boot,
  caption,
  cue,
  afterCue,
  throughCue,
  arrow,
  box,
  dot,
  label,
  line,
  text,
  rack,
  slip,
  mix,
} from './art.mjs';
import {
  original,
  fresh,
  first,
  drift,
  staleWrite,
  steadyWrite,
  landed,
  receipt,
  groups,
  practice,
  histories,
} from './examples.mjs';

export function storefront(c, k) {
  const swap = cue(k, 0, 'red hiker', 1.1);
  const eased = swap * swap * (3 - 2 * swap);
  const wall = cue(k, 1, 'twenty equal traffic groups');
  const requested = cue(k, 1, 'five groups');
  const answer = cue(k, 2, 'Zero groups switch');
  base(c, 'Boot shop   /   Search results', 'Who sees the red hiker?');
  const x = 88,
    y = 266,
    w = 837,
    h = 535;
  box(c, x, y, w, h, '#ead0ac', 14);
  label(c, 'SHADOW COPY   /   RERANKER 17', x + 34, y + 58, C.ochre);
  text(c, 'Trail boots', x + 34, y + 124, 56, C.ink, 'Serif');
  const ground = 656;
  box(c, 120, ground + 2, 774, 16, '#987856', 4);
  const leap = 52 * Math.sin(Math.PI * eased);
  boot(c, false, mix(331, 675, eased), ground, 326);
  boot(c, true, mix(675, 331, eased), ground - leap, 326);
  label(c, 'First result', 211, 716);
  label(c, 'Second result', 558, 716);
  if (!wall) {
    box(c, 963, y, w + 32, h, C.ice, 14);
    label(c, 'SHOPPER’S SCREEN   /   LIVE', 1000, y + 58, C.blue);
    text(c, 'Trail boots', 1000, y + 124, 56, C.ink, 'Serif');
    box(c, 996, ground + 2, 798, 16, '#7b8885', 4);
    boot(c, false, 1215, ground, 326);
    boot(c, true, 1560, ground, 326);
    label(c, 'First result', 1095, 716);
    label(c, 'Second result', 1442, 716);
  } else rack(c, 963, y, 869, h, first);
  if (requested) {
    const ground = y + 80 + (h - 166) / 4;
    box(c, 984, y + 77, 828, ground - y - 70, null, 7, '#e7b26f');
    text(c, 'Proposed canary   ·   five groups', 122, 778, 35, C.ochre, 'Sans', 600);
  }
  if (requested)
    caption(
      c,
      answer
        ? 'Permission saved. The router still serves the tan boot to all twenty groups.'
        : 'Vega’s request     0% → 25%     ·     5 of 20 groups     ·     requires revision 3',
      answer ? C.teal : C.ink,
    );
  else
    caption(
      c,
      wall
        ? 'One place on the wall represents one equal traffic group.'
        : 'The same search runs against two rankings.',
    );
}

export function guarded(c, k) {
  const changed = afterCue(k, 0, 'moves the right router to revision four');
  const approved = cue(k, 1, 'Casey approves');
  const test = afterCue(k, 1, 'The router tests the revision inside the write');
  const leftMatch = afterCue(k, 2, 'On the left one row changes');
  const leftDone = afterCue(k, 2, 'Five groups get the red hiker and the revision advances to four');
  const rightDone = afterCue(k, 2, 'On the right zero rows change');
  const replace = afterCue(k, 3, 'Build a fresh packet starting from ten percent at revision four');
  const evaluation = afterCue(k, 3, 'attach the new evaluation');
  base(
    c,
    'Traffic router   /   Conditional update',
    replace ? 'What can Casey review now?' : 'Can the same approval move both shelves?',
  );
  const packet = replace ? fresh : original;
  box(c, 88, 252, 1744, 91, replace ? C.mint : C.paper, 8);
  label(
    c,
    (replace ? 'Fresh request' : approved ? 'Casey approved' : 'Casey is reading') +
      '   ·   ' +
      packet.operationId,
    118,
    310,
  );
  text(
    c,
    packet.fromTraffic +
      '% → ' +
      packet.trafficPercent +
      '%    |    requires rev ' +
      packet.revision,
    1780,
    312,
    43,
    C.ink,
    'Mono',
    400,
    'right',
  );
  for (const [x, title, atWrite, outcome, checked, applied] of [
    [88, 'Undisturbed store', first, steadyWrite, leftMatch, leftDone],
    [988, 'Intervening rollout', changed ? drift.row : first, staleWrite, rightDone, rightDone],
  ]) {
    rack(c, x, 478, 844, 350, applied ? outcome.row : atWrite, { title });
    if (!test) continue;
    const matched = atWrite.revision === original.revision;
    const color = checked ? (matched ? C.teal : C.red) : C.ink;
    const fill = checked ? (matched ? C.mint : C.blush) : C.ice;
    const relation = checked ? (matched ? '=' : '≠') : '?';
    box(c, x, 365, 844, 91, fill, 8);
    label(c, original.operationId + '   /   REVISION AT WRITE', x + 25, 399, color);
    text(
      c,
      'rev ' + atWrite.revision + '  ' + relation + '  rev ' + original.revision,
      x + 25,
      439,
      37,
      color,
      'Mono',
    );
    if (checked) {
      const rowCount = outcome.rows + (outcome.rows === 1 ? ' row changed' : ' rows changed');
      text(
        c,
        applied ? rowCount : 'Guard matched',
        x + 818,
        439,
        36,
        color,
        'Sans',
        700,
        'right',
      );
    }
  }
  if (evaluation)
    caption(
      c,
      'New baseline and evidence     ' +
        fresh.evidence.join('   /   ') +
        '     ·     waiting for review',
      C.teal,
    );
  else if (replace) caption(c, 'The new request starts from the live revision and traffic share.');
  else if (rightDone)
    caption(
      c,
      `Both stores reached revision ${drift.row.revision}. Casey’s write moved only the shelf on the left.`,
    );
  else if (leftDone)
    caption(
      c,
      `The left router matched revision ${original.revision} and advanced to revision ${steadyWrite.row.revision}.`,
    );
  else if (test)
    caption(c, 'Each router compares its live revision with the same approved requirement.');
  else if (approved) caption(c, 'Casey approved the same packet in both histories.');
  else
    caption(c, 'Reranker 17 is the artifact. The deployment revision counts changes to the route.');
}

export function reconcile(c, k) {
  const claimed = cue(k, 0, 'worker claims');
  const send = cue(k, 0, 'sends its stable key', 0.8);
  const applied = afterCue(k, 0, 'change takes effect');
  const saved = afterCue(k, 0, 'router saves a receipt under that key');
  const reply = throughCue(k, 0, 'but the reply is lost');
  const lost = reply === 1;
  const timeout = afterCue(k, 0, 'timer runs out');
  const unknown = afterCue(k, 1, 'Unknown');
  const lookup = cue(k, 1, 'Query the destination', 0.8);
  const returns = throughCue(
    k,
    1,
    'Its receipt names operation eighteen, twenty-five percent and revision five',
  );
  const found = returns === 1;
  const filed = afterCue(k, 1, 'marks the operation executed');
  const row = applied ? landed : drift.row;
  base(c, 'Operation ledger   /   Fresh approval', 'Where did the reply go?');
  rack(c, 88, 269, 844, 340, row, { title: 'Traffic router' });
  box(c, 88, 632, 844, 120, saved ? C.mint : C.paper, 8);
  label(c, 'ROUTER RECEIPT', 118, 674, saved ? C.teal : C.mute);
  const receiptDetails =
    receipt.operationId + '   ·   ' + receipt.trafficPercent + '%   ·   rev ' + receipt.revision;
  text(
    c,
    found ? receiptDetails : saved ? 'Stored under ' + receipt.operationId : 'No receipt yet',
    118,
    728,
    40,
    C.ink,
    saved ? 'Mono' : 'Serif',
  );
  slip(c, 988, 269, 844, 483, 'WORKER   /   ' + fresh.operationId);
  text(
    c,
    filed
      ? 'Executed'
      : unknown
        ? 'Unknown'
        : timeout
          ? 'Which outcome?'
          : claimed
            ? 'Executing'
            : 'Authorized',
    1025,
    445,
    62,
    filed ? C.teal : unknown ? C.red : C.ink,
    'Serif',
  );
  const workerNote = filed
    ? 'Verified by original key'
    : timeout
      ? 'Original reply timed out'
      : send === 1
        ? 'Write request sent'
        : send
          ? 'Sending write request'
          : 'Fresh packet   ·   revision ' + fresh.revision;
  text(c, workerNote, 1025, 511, 36, C.mute);
  line(c, 1025, 546, 1792, 546);
  label(c, 'WORKER’S EVIDENCE', 1025, 609, filed ? C.teal : C.mute);
  const workerEvidence = filed
    ? receiptDetails
    : found
      ? 'Receipt received'
      : lookup
        ? 'Looking up ' + fresh.operationId
        : 'No receipt yet';
  text(c, workerEvidence, 1025, 678, 40, C.ink, filed ? 'Mono' : 'Serif');

  const routerX = 510;
  const workerX = 1410;
  const trackY = 808;
  const midpoint = (routerX + workerX) / 2;
  line(c, routerX, 752, routerX, trackY);
  line(c, workerX, 752, workerX, trackY);
  line(c, routerX, trackY, workerX, trackY);
  dot(c, routerX, trackY, 6, C.mute);
  dot(c, workerX, trackY, 6, C.mute);
  if (filed) {
    arrow(c, routerX, trackY, workerX - 16, trackY, C.teal);
  } else if (returns) {
    operationChip(c, mix(routerX, workerX, returns), trackY, 'Receipt', C.teal, C.mint);
  } else if (lookup) {
    operationChip(c, mix(workerX, routerX, lookup), trackY, 'Read ' + fresh.operationId, C.blue, C.ice);
  } else if (lost) {
    line(c, midpoint - 17, trackY - 19, midpoint + 17, trackY + 19, C.red, 6);
    line(c, midpoint + 17, trackY - 19, midpoint - 17, trackY + 19, C.red, 6);
  } else if (saved) {
    operationChip(c, mix(routerX, midpoint, reply), trackY, 'Reply', C.ochre, C.pale);
  } else if (send && !applied) {
    operationChip(c, mix(workerX, routerX, send), trackY, 'Write ' + fresh.operationId, C.blue, C.ice);
  }
  if (filed) {
    caption(
      c,
      `Receipt lookup   ·   ${receipt.effectCount} target effect   ·   ${groups(row)} red hikers before and after the read`,
    );
  } else if (lookup) {
    caption(c, 'The worker reads the receipt by key. The router applies no new change.');
  } else if (unknown) {
    caption(c, 'The router has a receipt. The worker still has to find it.');
  } else if (timeout) {
    caption(c, 'What can the worker establish from its timeout alone?');
  } else if (lost) {
    caption(c, 'The reply disappeared. The receipt stayed at the router.');
  } else if (applied) {
    caption(c, 'The destination has applied the change. The worker is still waiting.');
  } else {
    caption(c, `Approved target   ${fresh.trafficPercent}%   ·   execution key   ${fresh.operationId}`);
  }
}

function operationChip(c, x, y, name, color, fill) {
  box(c, x - 145, y - 25, 290, 50, fill, 8, color);
  text(c, name, x, y + 13, 34, color, 'Sans', 700, 'center');
}

export function exercise(c, k) {
  const other = afterCue(k, 0, 'maintenance operation sets fifteen percent first');
  const zero = afterCue(k, 1, 'Zero rows change on the left');
  const sent = cue(k, 1, 'worker sends its request');
  const lost = afterCue(k, 1, 'loses the reply');
  const read = afterCue(
    k,
    1,
    'A later read shows three red hikers at revision fifty-nine in each history',
  );
  const lookup = cue(k, 2, 'Look up operation');
  const found = afterCue(
    k,
    2,
    'The router returns its receipt for fifteen percent at revision fifty-nine',
  );
  const { operationId, fromTraffic, trafficPercent, revision } = practice;
  base(c, 'Transfer exercise   /   Two possible histories', 'Whose change put the hiker first?');
  label(
    c,
    `APPROVED   /   ${operationId}     ·     ${fromTraffic}% → ${trafficPercent}%     ·     requires revision ${revision}`,
    88,
    284,
  );
  rack(c, 88, 319, 844, 387, other ? histories.maintenance : histories.start, {
    title: 'A   /   Maintenance first',
  });
  // B is the worker's last observation, so a send alone cannot update this shelf.
  rack(c, 988, 319, 844, 387, read ? histories.applied : histories.start, {
    title: 'B   /   Last observed route',
  });
  box(c, 88, 729, 844, 109, zero ? C.blush : C.paper, 8);
  box(c, 988, 729, 844, 109, found ? C.mint : C.paper, 8);
  label(c, 'A   /   GUARDED WRITE', 113, 767, zero ? C.red : C.mute);
  label(c, 'B   /   WORKER’S EVIDENCE', 1013, 767, found ? C.teal : C.mute);
  const rowCount = histories.stopped.rows;
  const proof = histories.receipt;
  const leftEvidence = zero
    ? operationId + '   ·   ' + rowCount + ' rows changed'
    : other
      ? 'Waiting to test revision'
      : 'Before dispatch';
  const rightEvidence = found
    ? `Receipt   ${proof.operationId}   ·   ${proof.trafficPercent}%   ·   rev ${proof.revision}`
    : lookup
      ? 'Looking up ' + operationId
      : lost
        ? 'Reply lost   ·   outcome unknown'
        : sent
          ? 'Request sent'
          : 'Before dispatch';
  text(c, leftEvidence, 113, 817, 37, zero ? C.red : C.ink);
  text(c, rightEvidence, 1013, 817, 37, found ? C.teal : C.ink);
  caption(
    c,
    found
      ? 'Same final traffic. Only B has a destination receipt for the approved operation.'
      : lookup
        ? 'Find the receipt for the key that B sent.'
        : read
          ? `Both stores serve ${histories.applied.trafficPercent}%. Which worker needs a receipt lookup?`
          : zero
            ? 'The left attempt closed as stale. Follow the worker on the right.'
            : other
              ? 'The approved packet still has the same digest. What does its revision guard say?'
              : 'One red hiker represents 5% of traffic.',
  );
}
