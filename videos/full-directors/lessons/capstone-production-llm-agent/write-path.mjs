import {
  C,
  arrow,
  badge,
  block,
  circle,
  foot,
  gradient,
  header,
  keyCradle,
  lerp,
  line,
  mono,
  paint,
  paper,
  plate,
  poly,
  serif,
  smooth,
  type,
} from './workshop.mjs';
import {
  attempts,
  clauses,
  expiryAt,
  lab,
  matchingFields,
  op,
  policyId,
  prefix,
  repair,
  review,
  saved,
} from './mechanism.mjs';

const fields = ['Target', 'Scope', 'Expiry'];
function impressions(c, values, x, y, w, top = false) {
  const cell = w / 3;
  values.forEach((value, i) => {
    const px = x + i * cell;
    paint(c, px + 3, y, cell - 6, 49, top ? '#c5e2d09c' : '#f0e5c1', 4, top ? C.teal : '#a89c7a');
    mono(c, value, px + cell / 2, y + 32, 21, {
      align: 'center',
      color: top ? C.deep : C.ink,
      max: cell - 13,
    });
  });
}

export function approval(c, at) {
  const staged = at(0, 'then stages the operation'),
    savedReview = at(1, 'The reviewer saves');
  const align = smooth(at(2, 'Lay the reviewed fields', 1.25)),
    matched = at(2, 'All three line up');
  header(c, 'Which operation did the reviewer approve?', 'Operator request');
  keyCradle(c, 38, 111, 235, 319);
  plate(c, 293, 111, 630, 319);
  mono(c, staged ? 'STORED OPERATION' : 'OPERATOR REQUEST', 319, 146, 15, { color: C.muted });
  if (!staged) {
    serif(c, 'Restore the production key', 321, 224, 32);
    mono(c, 'Ticket  ' + saved.ticket + '   /   Account  ' + saved.account, 321, 266, 19);
    badge(c, 'Operator requested', 321, 330, 233, 'pending');
  } else {
    const x = 320,
      w = 577,
      baseY = 285;
    type(c, 'Operation ' + prefix(op) + '…', 319, 179, 21, { weight: 600 });
    type(
      c,
      'Policy ' + prefix(lab.evidence.policy_hash) + '…  ·  cited draft for ' + saved.ticket,
      319,
      204,
      16,
      { color: C.muted },
    );
    fields.forEach((name, i) =>
      type(c, name, x + ((i + 0.5) * w) / 3, baseY - 10, 15, { align: 'center', color: C.muted }),
    );
    impressions(c, matchingFields(saved), x, baseY, w);
    if (savedReview) {
      const y = lerp(356, baseY, align);
      // The transparent review carries the reference values, read from the reviewed snapshot.
      c.save();
      c.beginPath();
      c.rect(x, y, w, 50);
      c.clip();
      if (align > 0) paint(c, x, y, w, 50, '#e5f1de', 3);
      impressions(
        c,
        [lab.packet.account_id, lab.packet.scope, lab.packet.expires_at],
        x,
        y,
        w,
        true,
      );
      c.restore();
      if (align === 0) type(c, 'Reviewed snapshot', x, 351, 13, { color: C.teal });
      if (align >= 1) {
        type(c, 'Reviewed snapshot aligned', x, 358, 16, { color: C.teal });
      }
      if (matched) badge(c, 'Packet SHA  ' + prefix(review) + '… matches', x, 376, 353, 'good', 17);
    } else {
      type(c, 'Awaiting saved review', 320, 382, 19, { color: C.muted });
    }
  }
  foot(
    c,
    savedReview
      ? 'Saved approval  ·  ' +
          lab.approval.reviewer +
          '    /    Full packet digest  ' +
          prefix(review) +
          '…'
      : 'An operator can stage the packet. A reviewer must authorize it.',
  );
}

function fingerprint(c, x, y, width, ink) {
  const pixel = width / 16;
  for (let i = 0; i < 256; i++) {
    const nibble = Number.parseInt(op[Math.floor(i / 4)], 16);
    if (nibble & (8 >> (i % 4))) {
      c.fillStyle = ink;
      c.fillRect(x + (i % 16) * pixel, y + Math.floor(i / 16) * pixel, pixel, pixel);
    }
  }
}
function effectStrip(c, x, y, w, kind) {
  const dark = kind === 'committed';
  paint(c, x + 2, y + 3, w, 50, '#7d8777', 4);
  paint(c, x, y, w, 49, dark ? C.pine : '#e6bc77', 4, dark ? C.teal : '#ae8551');
  fingerprint(c, x + 12, y + 8, 32, dark ? C.cream : C.ink);
  mono(c, prefix(op) + '…', x + 55, y + 31, 20, { color: dark ? C.paper : C.ink });
  mono(c, saved.account, x + w * 0.52, y + 31, 20, { color: dark ? C.paper : C.ink });
  mono(c, saved.scope, x + w * 0.74, y + 31, 18, { color: dark ? C.paper : C.ink });
}

export function transaction(c, at) {
  if (at(3, 'Across a network')) return remote(c, at);
  const inserted = at(0, 'inserts an effect'),
    failed = at(0, 'an error interrupts');
  const rolled = at(1, 'The pending row disappears'),
    retry = at(1, 'A retry rechecks');
  const again = at(1, 'inserts again'),
    commit = at(1, 'and commits one row'),
    third = at(2, 'Try the same operation');
  const found = at(2, 'The lookup finds');
  const rows = commit ? attempts[1].count : attempts[0].count;
  const buffered = !commit && ((inserted && !rolled) || again);
  const attempt = third ? 3 : retry ? 2 : 1;
  header(c, 'What survives a failed insert?', 'Attempt ' + attempt);
  plate(c, 39, 113, 881, 295);
  type(c, 'Executor connection', 61, 148, 18, { weight: 700 });
  mono(
    c,
    found
      ? 'Replay checked'
      : third
        ? 'Duplicate check'
        : commit
          ? 'Committed'
          : retry
            ? 'Retry transaction'
            : rolled
              ? 'Rolled back'
              : 'Open transaction',
    61,
    177,
    14,
    { color: C.muted },
  );
  type(c, 'Second connection', 61, 274, 18, { weight: 700 });
  mono(c, 'Committed effects', 61, 303, 14, { color: C.muted });
  paint(c, 300, 138, 589, 70, '#d0cbb6', 4, '#9eaa99');
  paint(c, 300, 257, 589, 70, '#c4d4c4', 4, '#91a893');
  if (buffered) {
    const insert = smooth(again ? at(1, 'inserts again', 0.65) : at(0, 'inserts an effect', 0.65));
    c.save();
    c.beginPath();
    c.rect(311, 145, 569, 55);
    c.clip();
    effectStrip(c, 311 - (1 - insert) * 568, 147, 568, 'pending');
    c.restore();
  } else if (third) {
    fingerprint(c, 323, 156, 32, C.deep);
    mono(c, 'Find operation  ' + prefix(op) + '…', 367, 181, 21, { color: C.deep });
  } else type(c, 'No pending row', 320, 181, 18, { color: C.muted });
  if (rows) effectStrip(c, 311, 266, 568, 'committed');
  else mono(c, '0 rows', 321, 301, 23, { color: C.muted });
  if (failed && !rolled) badge(c, 'Pre-commit error', 308, 215, 170, 'bad');
  if (rolled) badge(c, '1 · Rolled back', 308, 215, 165, 'pending');
  if (commit) badge(c, '2 · Committed', 482, 215, 171);
  if (found) {
    paint(c, 319, 264, 188, 53, '#ffffff00', 3, C.brass);
    badge(c, '3 · ID found', 662, 215, 185);
  }
  if (commit) mono(c, rows + ' row', 61, 327, 15, { color: C.teal });
  line(c, 62, 345, 887, 345, C.rule);
  type(c, 'Saved approval', 61, 377, 18, { weight: 700 });
  mono(c, lab.approval.reviewer + '   /   ' + prefix(review) + '…', 300, 377, 18, {
    color: C.teal,
  });
  foot(
    c,
    found
      ? 'Duplicate ignored    ·    3 attempts    ·    1 committed effect'
      : commit
        ? 'Commit makes the row visible to another connection.'
        : rolled
          ? 'The approval was committed in a separate transaction.'
          : 'Which row can another connection read?',
  );
}

function remote(c, at) {
  const restored = at(3, 'the destination can restore'),
    lost = at(3, 'the reply can get lost');
  const unknown = at(3, 'the outcome is unknown');
  header(c, 'What did the caller observe?', 'Remote service');
  plate(c, 39, 138, 294, 229);
  plate(c, 632, 138, 286, 229, { dark: true });
  mono(c, 'CALLER', 62, 177, 16, { color: C.muted });
  mono(c, 'DESTINATION', 657, 177, 16, { color: C.sea });
  serif(c, 'Receipt table', 62, 224, 32);
  mono(c, '0 receipts', 63, 271, 22);
  serif(c, 'Key restore', 656, 226, 31, { color: C.paper });
  type(c, restored ? 'Key restored' : 'Request received', 656, 271, 21, { color: C.cream });
  arrow(c, 336, 192, 626, 192, C.teal);
  type(c, 'Request', 477, 179, 17, { align: 'center' });
  if (lost) {
    line(c, 627, 274, 496, 274, C.red, 2);
    line(c, 491, 261, 481, 286, C.red, 4);
    line(c, 478, 261, 468, 286, C.red, 4);
    type(c, 'Reply lost', 531, 304, 17, { color: C.red });
  }
  if (unknown) badge(c, 'Outcome unknown', 62, 308, 231, 'pending');
  foot(
    c,
    unknown
      ? 'Use destination idempotency or reconcile against the destination’s records.'
      : 'The caller and destination commit independently.',
  );
}

export function expiry(c, at) {
  const travel = smooth(at(0, 'Advance the clock', 1.35));
  const later = at(2, 'At thirteen oh one'),
    edit = at(2, 'extend only the stored expiry');
  const current = later ? 1301 : 1298 + Math.floor(2 * travel);
  const event = expiryAt(current, Boolean(edit)),
    denied = at(1, 'returns expired', 0.6),
    mismatch = at(2, 'rejects the mismatch');
  header(c, 'Can the executor run it again?', 'Expiry check');
  plate(c, 39, 114, 882, 199, { dark: true });
  mono(c, 'EXECUTOR CLOCK', 64, 151, 16, { color: C.sea });
  mono(c, current, 67, 230, 48, { color: C.paper });
  const x = 220,
    span = 615;
  for (let i = 0; i < 4; i++) {
    const px = x + (i * span) / 3;
    line(c, px, 175, px, 209, i === 2 ? C.brass : '#87a59b', i === 2 ? 3 : 1);
    mono(c, 1298 + i, px, 233, 15, { color: i === 2 ? C.brass : C.chalk, align: 'center' });
  }
  line(c, x, 193, x + span, 193, '#83a598', 3);
  const px = x + ((current - 1298) * span) / 3;
  poly(
    c,
    [
      [px - 8, 170],
      [px + 8, 170],
      [px, 183],
    ],
    C.cream,
  );
  type(c, 'Reviewed expiry', x + (2 * span) / 3, 150, 18, { align: 'center', color: C.brass });
  mono(c, 'Stored expiry  ' + event.stored.expiresAt, 65, 282, 15, { color: C.paper });
  mono(c, 'Packet  ' + prefix(event.digest), 341, 282, 15, { color: C.paper });
  mono(c, 'Review  ' + prefix(review), 640, 282, 15, { color: C.paper });
  paper(c, 42, 336, 877, 88);
  type(c, 'Earlier commit', 62, 367, 18, { weight: 700 });
  mono(c, event.count + ' effect', 62, 395, 17, { color: C.teal });
  effectStrip(c, 303, 352, 591, 'committed');
  if (denied && !later) {
    const stop = 445;
    line(c, 41, 441, lerp(41, stop, denied), 441, C.copper, 3);
    type(c, `Clock check: ${current} ≥ ${event.stored.expiresAt} · Expired`, 41, 435, 20, {
      color: C.copper,
      weight: 700,
    });
    if (denied === 1)
      type(c, 'Duplicate lookup skipped', 493, 435, 20, { color: C.muted, weight: 600 });
  } else {
    const next = mismatch
      ? 'New attempt / ' + event.verdict.replace('BLOCK: ', 'Blocked · ')
      : edit
        ? 'Compare the edited packet with the saved review.'
        : 'Which check runs first at the boundary?';
    type(c, next, 41, 435, 20, { color: C.deep, weight: 600 });
  }
}

const readable = {
  'BLOCK: packet changed': 'Packet changed',
  'BLOCK: stale preconditions': 'Stale preconditions',
  'Local effect committed': 'Local effect committed',
  'Duplicate ignored': 'Duplicate ignored',
};
export function practice(c, at) {
  const fixedExpiry = at(1, 'Restore only the reviewed expiry'),
    verified = at(2, 'Restore verification');
  const tried =
    Number(at(1, 'The packet check fails')) +
    Number(at(2, 'The executor returns')) +
    Number(at(3, 'The retry commits')) +
    Number(at(3, 'The replay finds'));
  const current = repair.steps[verified ? 2 : fixedExpiry ? 1 : 0];
  if (at(3, 'Look back at the two requests')) return closeCase(c);
  header(c, 'Repair one input at a time', 'Fresh database');
  plate(c, 37, 108, 887, 118, { dark: true });
  const cols = [
    ['Current time', 2001],
    ['Reviewed expiry', repair.original.expiresAt],
    ['Stored expiry', current.storedExpiry],
    ['Verified now', String(current.currentVerified)],
  ];
  cols.forEach(([k, v], i) => {
    const x = 59 + i * 217;
    type(c, k, x, 145, 17, { color: C.sea });
    mono(c, v, x, 195, 30, { color: C.paper });
    if (i) line(c, x - 15, 130, x - 15, 205, '#527772');
  });
  paper(c, 40, 244, 879, 185);
  const xs = [61, 156, 291, 467, 806];
  ['Attempt', 'Expiry', 'Verified', 'Executor result', 'Effects'].forEach((h, i) =>
    type(c, h, xs[i], 273, 15, { color: C.muted }),
  );
  line(c, 60, 283, 894, 283, C.rule);
  repair.steps.slice(0, tried).forEach((s, i) => {
    const y = 307 + i * 33;
    if (i === tried - 1) paint(c, 55, y - 20, 849, 28, i < 2 ? '#f3dcc8' : C.leaf, 2);
    [i + 1, s.storedExpiry, String(s.currentVerified), readable[s.result], s.effects].forEach(
      (v, j) =>
        type(c, v, xs[j] + (j === 4 ? 14 : 0), y, j === 3 ? 19 : 18, {
          family: j === 3 ? 'Sans' : 'Mono',
        }),
    );
  });
  if (!tried) serif(c, 'Which check fails first?', 62, 348, 29);
  foot(
    c,
    tried === 4
      ? 'Policy inquiry → cited draft     /     Operator request → one local effect'
      : 'Same operation  ' + prefix(op) + '…    ·    ' + saved.account + '    ·    ' + saved.scope,
  );
}

function closeCase(c) {
  header(c, 'What authorized the one local effect?', saved.ticket);
  paper(c, 40, 116, 415, 218);
  mono(c, 'POLICY INQUIRY', 61, 149, 16, { color: C.muted });
  serif(c, 'Reply for review', 61, 194, 30);
  block(c, clauses[1], 61, 227, 372, 19, 23);
  mono(c, policyId, 61, 310, 16, { color: C.teal });
  plate(c, 477, 116, 443, 218, { dark: true });
  mono(c, 'OPERATOR REQUEST', 499, 149, 16, { color: C.sea });
  serif(c, 'Reviewed restore', 499, 193, 30, { color: C.paper });
  type(c, 'Approved by ' + lab.approval.reviewer, 499, 227, 18, { color: C.cream });
  effectStrip(c, 499, 253, 401, 'committed');
  const w = 220;
  repair.steps.forEach((s, i) => {
    const x = 40 + i * w;
    paint(c, x, 360, w - 6, 64, i < 2 ? '#ebd5bd' : C.leaf, 3);
    type(c, readable[s.result], x + 12, 385, 16, { max: w - 28 });
    mono(c, s.effects + (s.effects === 1 ? ' effect' : ' effects'), x + 12, 410, 16, {
      color: C.deep,
    });
  });
  foot(c, 'The planner proposes. The executor checks the saved review and current grant.');
}
