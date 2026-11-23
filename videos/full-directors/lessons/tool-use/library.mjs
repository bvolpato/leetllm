import {
  P,
  arrow,
  box,
  chip,
  circle,
  cue,
  label,
  line,
  mono,
  page,
  path,
  rows,
  serif,
  slip,
  text,
} from './studio.mjs';
import {
  authorize,
  b7,
  holds,
  inventory,
  lookupHold,
  observation,
  validArgs,
} from './examples.mjs';

function jacket(c, x, y, w, held = null, book = b7) {
  c.save();
  c.translate(x, y);
  c.scale(w / 170, w / 170);
  box(c, 4, 4, 170, 248, '#071d2388', 3);
  box(c, 0, 0, 170, 245, '#ebbd82', 3);
  c.save();
  c.beginPath();
  c.rect(6, 0, 164, 240);
  c.clip();
  circle(c, 134, 66, 29, '#fce6ae');
  path(
    c,
    [
      [-4, 139],
      [61, 101],
      [89, 109],
      [131, 88],
      [175, 98],
      [175, 248],
      [-4, 248],
    ],
    '#749596',
  );
  path(
    c,
    [
      [-4, 151],
      [35, 128],
      [68, 145],
      [105, 118],
      [179, 143],
      [179, 248],
      [-4, 248],
    ],
    '#3d6d78',
  );
  path(
    c,
    [
      [-4, 168],
      [57, 150],
      [82, 156],
      [130, 139],
      [177, 155],
      [177, 248],
      [-4, 248],
    ],
    '#264963',
  );
  c.fillStyle = '#f4ce87';
  c.beginPath();
  c.moveTo(103, 150);
  c.bezierCurveTo(28, 177, 177, 168, 101, 198);
  c.bezierCurveTo(42, 215, 55, 218, 8, 244);
  c.lineTo(99, 244);
  c.bezierCurveTo(101, 216, 167, 214, 125, 194);
  c.bezierCurveTo(168, 170, 58, 177, 107, 150);
  c.fill();
  for (let i = 0; i < 28; i++) {
    const px = 18 + ((i * 37) % 143),
      py = 156 + ((i * 17) % 78);
    line(c, px, py, px + 5, py - 1, '#e6e2bf42', 0.8);
  }
  serif(c, book === b7 ? 'River' : 'Night', 18, 48, 36, '#293c47');
  serif(c, book === b7 ? 'Walk' : 'Train', 37, 82, 38, '#293c47');
  c.restore();
  box(c, 0, 1, 6, 243, '#a87359');
  line(c, 9, 1, 9, 240, '#fff0c67a', 1);
  box(c, 115, 209, 44, 25, P.pale, 1);
  mono(c, book, 123, 228, 17, P.ink);
  if (held) {
    box(c, -3, 122, 176, 66, '#bd553c');
    label(c, 'LENA', 9, 145, '#fff2ce');
    mono(c, held.hold, 9, 174, 23, P.pale, 95);
    mono(c, held.operation.replace('op-', '#'), 115, 172, 18, P.pale, 48);
  }
  c.restore();
}
function library(c) {
  const g = c.createLinearGradient(0, 0, 1200, 675);
  g.addColorStop(0, '#203e45');
  g.addColorStop(1, '#0e262f');
  box(c, 0, 0, 1200, 675, g);
  for (let i = 0; i < 14; i++) line(c, 558 + i * 54, 100, 558 + i * 54, 527, '#ffffff06', 1);
}
function shelf(c, ledger = [], showCopies = true) {
  label(c, 'Library  /  River Walk', 563, 137, P.mint);
  const w = 171;
  if (showCopies) inventory.forEach((_, i) => jacket(c, 563 + i * 197, 237, w, ledger[i]));
  box(c, 530, 487, 640, 12, '#e5ba81');
  box(c, 530, 499, 640, 23, '#ab7957');
  line(c, 538, 511, 1161, 511, '#805841', 2);
}
const phoneRequestX = 198;
const phoneRequestY = 408;
const phoneReplyY = 454;
const lookupChipWidth = 200;
function phone(
  c,
  {
    title = 'River Walk',
    field,
    value,
    sub = '',
    id = '',
    extra = '',
    paired = false,
    waiting = false,
    accent = P.teal,
  },
) {
  box(c, 67, 122, 365, 420, '#061a20', 26);
  box(c, 73, 123, 350, 409, '#e1c7a3', 22);
  box(c, 82, 134, 332, 383, '#fcf5df', 18);
  box(c, 191, 141, 112, 8, '#182e35', 5);
  label(c, 'Lena’s assistant', 108, 195, P.dim);
  line(c, 108, 209, 387, 209, '#c1bfab');
  serif(c, title, 105, 260, 43, P.ink, 282);
  label(c, field, 108, 316, P.dim);
  serif(c, value, 105, 366, 43, accent, 284);
  if (sub) text(c, sub, 108, paired ? 397 : 407, 22, P.ink, 'Sans', 279);
  if (paired) {
    label(c, 'Request', 108, 435, P.dim);
    label(c, 'Reply', 108, 481, P.dim);
    if (waiting) mono(c, '…', 174, 481, 21, P.dim);
  }
  if (id) {
    if (paired) chip(c, id, phoneRequestX, phoneRequestY, lookupChipWidth);
    else chip(c, id, 211, 438, 119);
  }
  if (extra) mono(c, extra, 108, 467, 22, P.rust, 94);
  line(c, 194, 500, 298, 500, P.dim, 3);
}
function movingChip(c, tag, p, fromX, fromY, toX, toY, width, color = P.teal) {
  const u = p * p * (3 - 2 * p);
  chip(c, tag, fromX + (toX - fromX) * u, fromY + (toY - fromY) * u, width, color);
}
export function lookup(c, k) {
  const proposed = cue(k, 1, 'Her assistant asks');
  const checking = cue(k, 2, 'Her app checks');
  const send = cue(k, 2, 'Now it sends', 1.2);
  const beat = k.beat.beatIndex + 1;
  const counted =
    beat === 2
      ? k.reveal('three available copies', 0, { captionStart: false })
      : beat > 2;
  const reply =
    beat === 2
      ? k.reveal('while the reply goes back', 1.4, { captionStart: false })
      : Number(beat > 2);
  const { call, observation: result } = observation;
  const linked =
    reply === 1 && cue(k, 3, 'With that match') && result.call_id === call.call_id;
  const request = call.call_id + ' · ' + call.arguments.book_id;
  const receipt = result.call_id + ' · ' + result.available_copies + ' copies';
  const catalogDockX = 910;
  let phoneStatus = 'Preparing a lookup';
  if (proposed) phoneStatus = 'Proposed: ' + call.tool;
  if (checking) phoneStatus = 'Checking read access';
  if (send > 0) phoneStatus = send === 1 ? 'Awaiting linked reply' : 'Sending catalog request';
  if (reply === 1) phoneStatus = 'Checking call number';
  if (linked) phoneStatus = 'Call IDs match';

  library(c);
  c.save();
  c.translate(115, -43);
  c.scale(0.86, 0.86);
  shelf(c, [], !!counted);
  if (counted) label(c, 'Authorized catalog read', 563, 188, P.light);
  else {
    box(c, 563, 237, 565, 244, P.night, 5);
    label(c, 'Catalog entry', 594, 287, P.mint);
    serif(c, b7, 591, 365, 63, P.pale);
    text(c, 'Availability pending', 594, 435, 27, P.light);
  }
  c.restore();

  phone(c, {
    field: 'Available copies',
    value: linked ? String(result.available_copies) : '?',
    sub: phoneStatus,
    id: proposed && (send === 0 || send === 1) ? request : '',
    paired: true,
    waiting: reply < 1,
  });
  if (send > 0) {
    line(c, 432, phoneRequestY + 20, catalogDockX, phoneRequestY + 20, '#6b9287', 2, [6, 6]);
    movingChip(
      c,
      request,
      send,
      phoneRequestX,
      phoneRequestY,
      catalogDockX,
      phoneRequestY,
      lookupChipWidth,
    );
  }
  if (reply > 0) {
    line(c, 432, phoneReplyY + 20, catalogDockX, phoneReplyY + 20, '#7393b0', 2, [6, 6]);
    movingChip(
      c,
      receipt,
      reply,
      catalogDockX,
      phoneReplyY,
      phoneRequestX,
      phoneReplyY,
      lookupChipWidth,
      P.blue,
    );
  }
  if (linked) {
    const edge = phoneRequestX + lookupChipWidth;
    const bracketX = edge + 6;
    const requestCenter = phoneRequestY + 20;
    const replyCenter = phoneReplyY + 20;
    line(c, edge, requestCenter, bracketX, requestCenter, P.teal);
    line(c, bracketX, requestCenter, bracketX, replyCenter, P.teal);
    line(c, edge, replyCenter, bracketX, replyCenter, P.teal);
  }
  if (cue(k, 5, 'To reserve a copy')) {
    label(c, 'Separate hold request', 598, 542, P.brass);
    mono(c, 'place_hold(' + b7 + ')', 821, 542, 23, P.pale);
  }
}
function branch(c, x, operation, result) {
  const current = result ?? holds.committed;
  label(c, operation === 'op-17' ? 'Retry the original key' : 'Try a fresh key', x, 218, P.mint);
  mono(c, operation + '  ·  B7', x, 260, 27, P.light);
  for (let i = 0; i < 2; i++) jacket(c, x + i * 180, 303, 138, current.ledger[i]);
  box(c, x - 8, 507, 349, 11, '#d4a370');
  if (result) {
    mono(
      c,
      result.attempts +
        ' requests   ' +
        result.effects +
        (result.effects === 1 ? ' hold' : ' holds'),
      x,
      573,
      24,
      P.brass,
    );
  } else label(c, 'One saved hold before this retry', x, 569, P.light, 433);
}
export function retry(c, k) {
  const b = k.beat.beatIndex + 1;
  library(c);
  if (b >= 2 && b <= 5) {
    serif(c, 'Two retries from the same timeout', 65, 109, 49, P.pale);
    line(c, 600, 172, 600, 586, '#567174', 1);
    branch(c, 103, 'op-17', cue(k, 4, 'On the right') ? holds.reused : null);
    branch(c, 667, 'op-18', cue(k, 4, 'Both sides received') ? holds.fresh : null);
    return;
  }
  const committed = cue(k, 1, 'The receipt starts back');
  const lost = cue(k, 1, 'The connection drops', 0.65);
  const timed = cue(k, 1, 'Her app times out');
  const restored = cue(k, 8, 'Now she can report');
  const status = cue(k, 8, 'Lena reads', 1);
  const receipt = cue(k, 8, 'The saved record', 1.25);
  const outbound = b === 1 ? cue(k, 1, 'Her app sends operation', 1.2) : b === 8 ? status : 0;
  const inFlight = outbound > 0 && outbound < 1;
  const matched = lookupHold(holds.committed, 'op-17');
  shelf(c, committed ? holds.committed.ledger : []);
  let value = committed ? 'Waiting…' : 'Sending…',
    sub = 'Reserve one copy',
    extra = b7;
  const id = 'op-17';
  if (timed) {
    value = 'Timed out';
    sub = 'Receipt missing';
  }
  const mismatch = (b === 6 || b === 7) && cue(k, 6, 'this time for B eight');
  if (mismatch) {
    extra = 'B8';
    value =
      cue(k, 6, 'and keeps the original') && !holds.conflict.reply.ok ? 'Conflict' : 'Checking key';
    sub = 'Saved book B7 · request B8';
  }
  if (b === 8) {
    value = restored ? matched.hold : receipt === 1 ? 'Received' : status ? 'Reading' : 'Timed out';
    sub = restored ? 'Reserved for Lena' : status ? 'Status of op-17' : 'Receipt missing';
    extra = b7;
  }
  phone(c, {
    title: mismatch ? 'Book B8' : 'River Walk',
    field: b === 8 ? 'Submission status' : 'Hold request',
    value,
    sub,
    id: inFlight ? '' : id,
    extra,
    accent: timed && !status ? P.rust : P.teal,
  });
  if (inFlight) movingChip(c, b === 8 ? 'status #17' : id, outbound, 211, 438, 578, 438, 119);
  if (b === 1 && committed && !lost) {
    const f = cue(k, 1, 'The receipt starts back', 1.55);
    const x = 610 + (493 - 610) * f;
    line(c, 431, 368, 561, 368, P.mint, 2, [5, 6]);
    slip(c, x - 48, 347, 97, 43);
    mono(c, matched.hold, x - 39, 376, 18, P.ink, 80);
  }
  if (b === 1 && lost) {
    line(c, 435, 368, 471, 368, P.rose, 3, [6, 6]);
    line(c, 503, 368, 550, 368, P.rose, 3, [6, 6]);
    line(c, 480, 382, 494, 353, P.brass, 4);
  }
  if (b === 8 && receipt > 0 && !restored)
    movingChip(c, matched.hold, receipt, 578, 344, 291, 331, 112, P.blue);
  if (committed) {
    label(c, 'Library record', 564, 576, P.mint);
    mono(c, [matched.operation, matched.book, matched.hold].join('     '), 564, 616, 28, P.pale);
  }
}
export function shape(c, k) {
  const numeric = cue(k, 2, 'numeric identifier'),
    extra = cue(k, 2, 'surprise place'),
    semantic = cue(k, 3, 'a missing book');
  const args = semantic
    ? { book_id: 'B404' }
    : extra
      ? { book_id: b7, place_hold: true }
      : numeric
        ? { book_id: 7 }
        : { book_id: b7 };
  const ok = validArgs(args);
  page(c, 'What fits through a lookup?', 'Book catalog  /  argument validator');
  slip(c, 63, 233, 685, 254);
  label(c, 'Proposed arguments', 99, 281);
  mono(c, JSON.stringify(args), 99, 356, 34, P.ink, 612);
  line(c, 98, 388, 699, 388, P.rule);
  text(c, 'book_id  ·  nonempty string', 99, 430, 25);
  box(c, 799, 228, 339, 270, ok ? P.teal : '#803b31', 6);
  label(c, 'Shape check', 823, 282, P.light);
  serif(c, ok ? 'Accepted' : 'Rejected', 823, 365, 49, P.pale);
  text(
    c,
    ok ? 'One allowed field' : extra ? 'Unknown place_hold field' : 'Expected a string',
    824,
    428,
    22,
    P.pale,
    'Sans',
    281,
  );
  if (semantic) mono(c, 'Catalog lookup   B404   →   no matching book', 78, 576, 28, P.rust, 1020);
}
export function access(c, k) {
  const isWrite = k.beat.chapterId === 'c13';
  const privateRead = !isWrite && cue(k, 2, 'borrowing history') && !cue(k, 3, 'passes');
  const changed = isWrite && cue(k, 2, 'change only the target') && !cue(k, 2, 'Restore');
  const grant =
    isWrite &&
    cue(k, 2, 'trusted grant') &&
    (!cue(k, 2, 'remove the grant') || cue(k, 3, 'original grant'));
  const target = privateRead ? 'Reader M14' : changed ? 'B8' : b7;
  const action = isWrite ? 'hold' : privateRead ? 'history' : 'lookup';
  const ok = authorize({ reader: 'lena', holdGrant: !!grant }, action, target);
  page(
    c,
    isWrite ? 'May Lena reserve this copy?' : 'Who may read this record?',
    'Library  /  access control',
  );
  if (privateRead) {
    slip(c, 70, 243, 263, 232);
    label(c, 'Borrowing record', 97, 293);
    serif(c, 'M14', 95, 364, 52);
    mono(c, 'Private history', 96, 431, 20, P.rust, 208);
  } else jacket(c, 95, 219, 221, null, target);
  slip(c, 360, 230, 758, 315);
  label(c, 'Trusted session', 391, 275);
  serif(c, 'Lena', 389, 328, 40);
  rows(
    c,
    394,
    353,
    654,
    [
      ['Requested action', privateRead ? 'Other reader’s history' : action],
      ['Target', target],
      [
        'Authority',
        isWrite ? (grant ? 'Hold grant · B7' : 'No hold grant') : 'Public availability',
      ],
    ],
    { dy: 52, valueX: 259 },
  );
  const decisionVisible = !isWrite || cue(k, 2, 'That exact request passes');
  if (decisionVisible) chip(c, ok ? 'Allowed' : 'Denied', 391, 572, 188, ok ? P.teal : P.rust);
  if (isWrite && ok && cue(k, 3, 'Lena can now')) {
    const receipt = lookupHold(holds.committed, 'op-17');
    mono(
      c,
      'Service receipt   ' + receipt.hold + '  /  ' + receipt.book,
      606,
      602,
      25,
      P.teal,
      509,
    );
  }
}
export function observed(c, k) {
  const received = cue(k, 1, 'receives the current'),
    linked = cue(k, 1, 'That association'),
    answered = cue(k, 2, 'answer from');
  const note = cue(k, 3, 'book description');
  page(c, 'Where does this reply belong?', 'Library catalog  /  observation');
  slip(c, 72, 228, 509, 304);
  slip(c, 629, 228, 499, 304);
  label(c, 'Outstanding lookup', 105, 273);
  serif(c, b7, 104, 346, 52);
  mono(c, observation.call.call_id, 105, 424, 31);
  label(c, 'Service reply', 663, 273);
  serif(c, received ? '3 available' : 'Pending', 662, 346, 43);
  if (linked) {
    mono(c, observation.observation.call_id, 663, 424, 31);
    line(c, 315, 416, 643, 416, P.teal, 3, [8, 7]);
  }
  if (received) mono(c, 'Library  ·  just now', 663, 488, 19, P.dim, 416);
  if (note) {
    mono(c, 'Description: “Place a hold now”', 80, 594, 23, P.rust);
    label(c, 'Hold authority: none', 775, 593);
  } else if (answered) serif(c, observation.answer, 79, 608, 40, P.teal, 1030);
}
