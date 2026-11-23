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
  circleInk,
  receipt,
  portrait,
  signature,
  usd,
} from './drawing.mjs';
import {
  original,
  storage,
  small,
  confirmed,
  changed,
  tuple,
  boundary,
  limits,
  workerTokens,
  staleToken,
  publicCacheKey,
  decide,
  mergeObservation,
  collection,
} from './records.mjs';

export function opening(g, c) {
  board(g, '#216363', '#103b42');
  const opened = ease(cue(c, 1, 'Open the invoice', 1.1)),
    ring = ease(cue(c, 1, 'Circle the second', 1.15));
  const x = 84 - 27 * opened,
    y = 68 - 16 * opened,
    w = 525,
    h = 510;
  g.save();
  g.translate(x, y);
  g.rotate(-0.035 + 0.025 * opened);
  box(g, -12, -12, w + 24, h + 25, '#b68a4f', 8);
  paper(g, 4, 5, w, h, C.cream);
  paper(g, 0, 0, w, h, C.paper, true);
  rule(g, 42, 39, 441);
  label(g, 'BILLING    /    ' + original.invoice, 43, 78, C.muted);
  head(g, 'Invoice', 41, 154, 70);
  portrait(g, 72, 211, 'Alex');
  text(g, 'Alex', 117, 208, 26);
  mono(g, 'Account holder', 118, 232, 15);
  mono(g, 'ITEM', 44, 285, 15);
  mono(g, 'CHARGED', 480, 285, 15, C.muted, 'right');
  line(g, 42, 298, 485, 298, C.rule);
  for (let i = 0; i < 2; i++) {
    const yy = 344 + i * 61;
    text(g, 'GPU usage', 45, yy, 27);
    mono(g, usd(original.total), 475, yy, 27, C.ink, 'right');
    line(g, 43, yy + 18, 482, yy + 18, C.rule);
  }
  circleInk(g, 405, 395, 89, 26, ring);
  if (cue(c, 1, 'Billing confirms')) stamp(g, 'Verified duplicate', 47, 473, C.teal, 21);
  if (opened < 1) {
    // Lift the protective leaf from the bound edge of the invoice.
    const cover = w * (1 - opened);
    g.save();
    g.beginPath();
    g.rect(0, 0, cover, h);
    g.clip();
    box(g, 0, 0, w, h, '#d2b07d');
    box(g, 0, 0, 23, h, '#987e57');
    line(g, 32, 0, 32, h, '#e6d0a4', 3);
    paper(g, 74, 103, 347, 193, C.cream);
    rule(g, 97, 128, 298);
    label(g, 'ACCOUNTS   /   ALEX', 98, 169, C.muted);
    head(g, 'GPU invoice', 96, 225, 43);
    mono(g, original.invoice, 99, 269, 21);
    if (opened > 0) box(g, Math.max(0, cover - 12), 0, 12, h, '#b3986a');
    g.restore();
  }
  g.restore();
  const policy = beat(c) > 1;
  if (!policy) {
    receipt(g, 659, 166, 452, 232, C.cream);
    label(g, 'ALEX    /    CASE ' + original.ticket, 690, 210, C.muted);
    head(g, '“Can you credit', 689, 280, 43);
    head(g, 'the second one?”', 689, 336, 43);
    if (opened > 0) text(g, 'Authenticated account', 689, 382, 18, C.teal);
    return;
  }
  paper(g, 628, 61, 519, 479, C.mint);
  rule(g, 659, 94, 456);
  label(g, 'PUBLISHED   /   ' + original.policy, 659, 130, C.teal);
  head(g, 'Duplicate charges', 658, 183, 38);
  text(g, 'Credit window', 660, 235, 23);
  const left = 674,
    right = 1094,
    ageY = 283;
  box(g, left, ageY - 6, right - left, 12, '#afc7b5', 6);
  for (const d of [0, 10, 20, 30]) {
    const xx = lerp(left, right, d / 30);
    line(g, xx, ageY - 9, xx, ageY + 10, C.muted);
    mono(g, '' + d, xx, ageY + 33, 16, C.ink, 'center');
  }
  if (cue(c, 2, 'thirty-day window')) {
    const xx = lerp(left, right, original.age / limits.days);
    dot(g, xx, ageY, 8, C.teal);
    mono(g, 'Day ' + original.age, xx, ageY - 19, 17, C.teal, 'center');
  }
  const fly = ease(cue(c, 2, 'carry the amount', 1.2)),
    showScale = fly > 0;
  if (showScale) {
    text(g, 'Specialist review', 660, 365, 23);
    const yy = 437,
      scaleX = (amount) => lerp(left, right, amount / 100000);
    box(g, left, yy - 4, right - left, 8, '#a0b8a7');
    box(g, scaleX(limits.review), yy - 4, right - scaleX(limits.review), 8, '#bc8070');
    line(g, scaleX(limits.review), yy - 16, scaleX(limits.review), yy + 16, C.red, 2);
    mono(g, '$0', left, 474, 17);
    mono(g, '$500 and above', scaleX(limits.review), 474, 17, C.red, 'center');
    const dest = scaleX(original.amount);
    const xx = lerp(486, dest, fly),
      by = lerp(445, 419, fly);
    box(g, xx - 44, by - 37, 88, 37, C.ink, 3);
    text(g, '$900', xx, by - 10, 22, C.white, 'Mono', 500, 'center');
    if (fly === 1) {
      line(g, dest, by, dest, yy, C.ink, 2);
      dot(g, dest, yy, 5, C.ink);
    }
  }
  if (cue(c, 3, 'Send it for specialist review') && decide(original).outcome === 'HANDOFF')
    stamp(g, 'Route to specialist review', 655, 524, C.red, 22);
}

function terminal(g, x, y, w, name, detail) {
  box(g, x, y, w, 115, '#77958f', 12);
  box(g, x + 5, y + 5, w - 10, 105, '#223f46', 8);
  dot(g, x + 17, y + 20, 3, C.brass);
  text(g, name, x + 29, y + 49, 26, C.white, 'Serif');
  mono(g, detail, x + 29, y + 84, 17, '#b7d8cd');
}
export function channels(g, c) {
  board(g, '#243e50', '#152a38');
  const n = beat(c);
  if (n <= 2) {
    head(g, 'One turn in flight', 67, 95, 47, C.white);
    terminal(g, 62, 218, 240, 'Alex’s client', 'Ticket 48291');
    terminal(g, 885, 218, 249, 'Supervisor', 'Tenant scoped');
    const routes = [
      ['HTTP turn', 0.14, cue(c, 1, 'HTTP request', 1.3)],
      ['SSE progress', 0.5, cue(c, 1, 'server-sent events', 1.3)],
      ['WebSocket', 0.86, cue(c, 1, 'WebSocket', 1.3)],
    ];
    routes.forEach(([s, f, v], i) => {
      if (!v && i > 0) return;
      const yy = 200 + f * 240;
      mono(g, s, 592, yy - 17, 19, C.cream, 'center');
      const reverse = i === 1;
      arrow(g, reverse ? 859 : 331, yy, reverse ? 331 : 859, yy, C.faint, 2);
      if (i === 2) arrow(g, 859, yy + 8, 331, yy + 8, C.faint, 2);
      dot(g, lerp(reverse ? 859 : 331, reverse ? 331 : 859, v), yy, 6, C.brass);
    });
    if (n === 2) {
      receipt(g, 272, 440, 665, 100);
      mono(g, 'Webhook deliveries', 300, 476, 17);
      mono(g, '#17   #17', 300, 512, 23, C.ink);
      if (cue(c, 2, 'Rate-limit')) {
        stamp(g, '1 accepted update', 640, 508, C.teal, 21);
      }
    }
    return;
  }
  if (n <= 4) {
    head(g, n === 3 ? 'A lease changes hands' : 'Inside the transaction', 65, 92, 46, C.white);
    const newer = cue(c, 3, 'database records eight'),
      returned = cue(c, 3, 'Seven comes back'),
      rejected = cue(c, 3, 'Reject seven');
    paper(g, 90, 174, 410, 338, C.cream);
    label(g, 'WORKER TOKENS', 121, 219, C.muted);
    for (const [i, num] of workerTokens.entries()) {
      if (i === 1 && !newer) continue;
      const yy = 272 + i * 98;
      box(g, 125, yy, 117, 64, i === 1 ? C.mint : C.pink, 17);
      dot(g, 143, yy + 32, 5, C.muted);
      mono(g, '0' + num, 181, yy + 44, 30, C.ink, 'center');
      text(g, i === 0 ? 'First lease' : 'Replacement', 259, yy + 41, 23);
    }
    arrow(g, 510, 341, 653, 341, C.brass, 3);
    terminal(g, 675, 176, 430, 'Protected database', 'Retained fencing token');
    const retained = workerTokens[newer ? 1 : 0];
    const incoming = workerTokens[0];
    mono(g, '0' + retained, 689, 381, 67, C.white);
    if (returned) mono(g, 'Incoming  0' + incoming, 810, 368, 22, C.cream);
    if (rejected && staleToken(incoming, retained))
      stamp(g, '0' + incoming + ' < 0' + retained + '   ·   reject', 708, 456, C.brass, 23);
    if (n === 4) {
      box(g, 85, 530, 1025, 55, C.pine, 5);
      text(g, 'Lock row', 113, 565, 20, C.white);
      arrow(g, 226, 557, 368, 557, C.brass);
      text(g, 'Commit update', 391, 565, 20, C.white);
      arrow(g, 543, 557, 689, 557, C.brass);
      text(g, 'Wait for customer', 715, 565, 20, C.white);
    }
    return;
  }
  head(
    g,
    n === 5 ? 'Who can change the case?' : 'What does a second worker buy?',
    64,
    94,
    43,
    C.white,
  );
  const rows = [
    ['Policy reader', 'US  /  active version', 'Published passage'],
    ['Invoice reader', 'Alex  /  A10234', 'Owned invoice'],
  ];
  rows.forEach(([name, scope, out], i) => {
    const yy = 161 + i * 170;
    receipt(g, 69, yy, 488, 133, i ? C.cream : C.mint);
    head(g, name, 97, yy + 46, 30);
    mono(g, scope, 98, yy + 77, 18);
    text(g, out, 98, yy + 109, 19);
    arrow(g, 565, yy + 69, 692, yy + 69, C.brass, 2);
  });
  paper(g, 704, 173, 426, 298, C.paper, true);
  head(g, 'Case supervisor', 750, 231, 34);
  ['Source and success', 'Customer and invoice', 'Current revision'].forEach((s, i) =>
    text(g, s, 751, 279 + i * 40, 23),
  );
  stamp(g, 'Sole case writer', 751, 438, C.teal, 20);
  if (n === 6)
    text(g, 'Compare elapsed time, tokens and queue wait per ticket.', 93, 551, 24, C.cream);
}

function caseCard(g, x, y, s, labelText, fill, showAmount = true) {
  paper(g, x, y, 466, 338, fill, true);
  label(g, labelText, x + 43, y + 43, C.muted);
  rule(g, x + 43, y + 58, 386);
  head(g, s.invoice, x + 42, y + 132, 52);
  mono(g, 'REV ' + s.revision, x + 418, y + 122, 22, C.teal, 'right');
  text(
    g,
    s.customer + '   /   ' + (s.item === 'gpu-usage' ? 'GPU usage' : 'Storage'),
    x + 43,
    y + 184,
    24,
  );
  if (showAmount) mono(g, usd(s.amount), x + 43, y + 254, 38, C.ink);
}
export function state(g, c) {
  board(g);
  const n = beat(c);
  if (n <= 3) {
    const switched = cue(c, 2, 'moves to revision five'),
      fresh = cue(c, 3, 'both copies say revision five');
    const current = switched ? storage : original,
      read = fresh ? storage : original;
    head(g, 'The revision on the return slip', 66, 90, 46, C.white);
    const merged =
      fresh &&
      cue(c, 3, 'The supervisor can accept') &&
      mergeObservation(current, { ...read, success: true });
    caseCard(g, 68, 155, current, 'SUPERVISOR   /   CURRENT CASE', C.paper, !switched || merged);
    if (switched && !merged) text(g, 'Awaiting current read', 110, 406, 24, C.muted);
    caseCard(g, 658, 155, read, 'WORKER   /   INVOICE READ', C.cream);
    if (switched) {
      mono(g, 'Confirmation cleared', 112, 466, 16, C.red);
    }
    const result = fresh
      ? cue(c, 3, 'The supervisor can accept')
      : cue(c, 2, 'Discard the old result');
    if (result) {
      const ok = mergeObservation(current, { ...read, success: true });
      stamp(
        g,
        ok ? 'Accepted into revision 5' : 'Stale receipt discarded',
        700,
        465,
        ok ? C.teal : C.red,
        20,
      );
    }
    if (n === 1) mono(g, '90000 integer cents', 111, 462, 18);
    return;
  }
  head(
    g,
    n === 7 ? 'Validate the requested amount' : 'Replay the original GPU case',
    63,
    94,
    44,
    C.white,
  );
  if (n === 7) {
    paper(g, 72, 159, 1059, 375);
    [
      ['$0.00', 'Zero'],
      ['−$1.00', 'Negative'],
      ['$0.001', 'Fractional cent'],
      ['NaN', 'Nonfinite'],
    ].forEach(([value, reason], i) => {
      const yy = 220 + i * 79;
      mono(g, value, 112, yy, 29, C.ink);
      text(g, reason, 405, yy, 24);
      stamp(g, 'Reject', 872, yy, C.red, 18);
      if (i < 3) line(g, 111, yy + 22, 1085, yy + 22, C.rule);
    });
    return;
  }
  mono(
    g,
    'REPLAY  /  A10234 · R4         Live storage case: A10236 · R5 · $20.00',
    67,
    132,
    19,
    C.cream,
  );
  receipt(g, 70, 164, 440, 245, C.pink);
  label(g, 'DIALOGUE SUMMARY', 102, 212, C.muted);
  head(g, '“Ninety dollars.”', 101, 288, 39);
  text(g, 'Wording and context', 103, 362, 21, C.muted);
  caseCard(g, 651, 152, original, 'BILLING   /   VALIDATED REQUEST', C.paper);
  if (cue(c, 5, 'Use nine hundred dollars'))
    stamp(g, 'Use ' + usd(original.amount), 693, 466, C.teal, 20);
  if (n === 6) {
    text(g, 'Session buffer', 82, 477, 23, C.white);
    text(g, 'Durable, tenant-scoped record', 653, 544, 23, C.white);
  }
}

export function contract(g, c) {
  const n = beat(c);
  board(g, '#634441', '#392f37');
  if (n >= 5) {
    head(g, 'The public reply index', 64, 95, 47, C.white);
    const updated = cue(c, 5, 'Change the policy version');
    const cached = publicCacheKey('US', 'v3', 'public');
    const requested = publicCacheKey('US', updated ? 'v4' : 'v3', 'public');
    paper(g, 68, 160, 641, 359, C.cream, true);
    label(g, 'CACHED PUBLIC ANSWER', 113, 211, C.muted);
    head(g, 'Duplicate-charge policy', 110, 276, 39);
    rule(g, 109, 305, 539);
    mono(g, cached, 111, 366, 27, C.ink);
    stamp(g, 'Policy text only', 113, 445, C.teal, 20);
    receipt(g, 743, 177, 384, 199, C.mint);
    label(g, 'PUBLIC READ KEY', 770, 220, C.muted);
    mono(g, requested, 769, 272, 23, C.ink);
    text(
      g,
      requested === cached ? 'Matching key' : 'Miss · version changed',
      771,
      333,
      23,
      requested === cached ? C.teal : C.red,
    );
    text(g, 'Alex’s private write', 744, 448, 26, C.white);
    text(g, 'Bypass public cache', 744, 487, 22, C.brass);
    if (n === 6)
      text(g, 'Check text at both ends. Verify ownership at dispatch.', 87, 571, 24, C.white);
    return;
  }
  head(g, 'The contract travels with the case', 66, 88, 44, C.white);
  const p = ease(cue(c, 3, 'Move the same contract', 1.4));
  const x = lerp(83, 447, p);
  for (const [i, s] of ['Primary lane', 'Fallback lane'].entries()) {
    const xx = 73 + i * 365;
    box(g, xx, 150, 352, 395, '#352f34', 8);
    box(g, xx + 7, 157, 338, 66, '#7b5f58', 5);
    text(g, s, xx + 24, 200, 26, C.white, 'Serif');
    box(g, xx + 9, 227, 334, 14, '#1b252a', 6);
  }
  receipt(g, x, 252, 331, 276, C.cream);
  label(g, 'CASE ' + original.ticket + '  /  PRIVATE', x + 23, 288, C.muted);
  rule(g, x + 22, 307, 286);
  [
    'US-v3  ·  gateway v1',
    'Cited support answer',
    'Specialist review',
    'Ceiling  $0.005 / call',
  ].forEach((s, i) => text(g, s, x + 23, 349 + i * 43, 21, i === 3 ? C.teal : C.ink));
  const xx = 855;
  if (n === 1) {
    text(g, 'Published text', xx, 265, 24, C.cream);
    text(g, 'Executable rule', xx, 309, 24, C.cream);
    mono(g, 'One release', xx, 376, 19, C.brass);
  }
  if (n === 2) {
    head(g, 'Publisher', xx, 265, 35, C.white);
    text(g, 'Version + digest', xx, 318, 23, C.cream);
    mono(g, 'Review authority', xx, 376, 19, C.brass);
  }
  if (n === 3) {
    head(g, 'Gateway', xx, 265, 35, C.white);
    ['Processor', 'Output shape', 'Actual usage'].forEach((s, i) =>
      text(g, s, xx, 324 + i * 41, 23, C.cream),
    );
  }
  if (n === 4) {
    head(g, 'Case trace', xx, 265, 35, C.white);
    ['Read evidence', 'Review reason', 'Poll deadline'].forEach((s, i) =>
      text(g, s, xx, 324 + i * 41, 23, C.cream),
    );
  }
}

export function evidence(g, c) {
  board(g, '#234b40', '#173432');
  const edited = beat(c) === 2 && cue(c, 2, 'Edit the window'),
    region = cue(c, 3, 'account is Canadian') ? 'CA' : 'US';
  const docs = collection(region, edited),
    passes = docs.filter((d) => !d.errors.length);
  const resolved =
    beat(c) === 1
      ? cue(c, 1, '$')
      : beat(c) === 2
        ? edited
          ? cue(c, 2, 'Send the discrepancy')
          : true
        : cue(c, 3, 'Preserve the missing');
  head(g, 'Policy file', 68, 88, 51, C.white);
  mono(g, region + ' account  /  duplicate charge', 1119, 80, 21, C.cream, 'right');
  const x = 67,
    y = 135;
  paper(g, x, y, 1060, 364, C.paper, true);
  const cols = [112, 361, 531, 678, 822, 983];
  ['Record', 'Publisher', 'Region', 'Topic', 'Version', 'Digest'].forEach((s, i) =>
    mono(g, s, cols[i], y + 48, 18, C.muted),
  );
  rule(g, 108, y + 65, 976);
  const checks = ['publication', 'region', 'topic', 'version', 'digest'];
  docs.forEach((d, i) => {
    const yy = y + 116 + i * 63;
    if (i === 0) box(g, 105, yy - 32, 987, 46, d.errors.length ? '#f4e2d1' : '#e3ecda');
    text(g, d.id, cols[0], yy, 25, C.ink, 'Serif');
    const vals = [
      d.publisher ? 'Published' : 'Private',
      d.region,
      'Credit',
      d.kind === 'published' ? d.id : 'Unlisted',
      d.errors.includes('digest') ? 'Changed' : 'Match',
    ];
    vals.forEach((s, j) =>
      text(g, s, cols[j + 1], yy, 20, d.errors.includes(checks[j]) ? C.red : C.teal),
    );
    line(g, 107, yy + 23, 1090, yy + 23, C.rule);
  });
  if (beat(c) === 2) {
    const row = docs[0];
    mono(g, 'Registered  30 days  ' + row.digest.slice(0, 9), 72, 550, 18, C.cream);
    mono(
      g,
      'Retrieved   ' + (edited ? '60' : '30') + ' days  ' + row.computed.slice(0, 9),
      72,
      582,
      18,
      C.cream,
    );
  }
  if (resolved) {
    const wording = passes.length
      ? 'Admit ' + passes[0].id
      : region === 'CA'
        ? 'Missing Canadian policy'
        : 'No policy admitted';
    stamp(g, wording, 694, 562, C.brass, 25);
  }
}

function form(g, x, y, s, title, fill, signed, showSeal) {
  paper(g, x, y, 475, 410, fill, true);
  label(g, title, x + 41, y + 44, C.muted);
  rule(g, x + 40, y + 60, 393);
  head(g, 'Credit request', x + 39, y + 125, 43);
  mono(g, s.invoice + '  /  R' + s.revision, x + 40, y + 165, 19);
  text(g, s.customer + '    /    GPU usage', x + 40, y + 205, 24);
  mono(g, 'Type  ' + tuple(s).requestType, x + 40, y + 238, 18, C.muted);
  head(g, usd(s.amount), x + 38, y + 298, 55);
  line(g, x + 39, y + 354, x + 427, y + 354, C.rule);
  if (signed) signature(g, s.customer, x + 48, y + 341, typeof signed === 'number' ? signed : 1);
  mono(g, s.policy, x + 426, y + 341, 16, C.muted, 'right');
  if (showSeal) text(g, showSeal, x + 42, y + 390, 19, C.teal, 'Sans', 600);
}
export function consent(g, c) {
  board(g, '#a74d3f', '#783637');
  const n = beat(c);
  const newSig = cue(c, 3, 'Alex signs', 1.3);
  const revised = cue(c, 3, 'amount to forty dollars');
  const separate = cue(c, 4, 'exactly five hundred dollars');
  const s = separate
    ? boundary
    : revised
      ? changed
      : newSig === 1
        ? confirmed
        : n >= 2
          ? small
          : original;
  const hasCopy = newSig > 0;
  head(
    g,
    n === 1
      ? 'One request per invoice'
      : separate
        ? 'Separate signed proposal at the threshold'
        : 'The two-part confirmation form',
    63,
    83,
    45,
    C.white,
  );
  const sig = separate ? true : newSig && !revised ? newSig : false;
  let status = '';
  const outcome = decide(s).outcome;
  if (outcome === 'HANDOFF' && (n === 1 || cue(c, 4, 'This time the request needs a specialist')))
    status = 'Specialist review';
  else if (outcome === 'CONFIRM' && revised && cue(c, 4, 'Ask Alex to confirm forty dollars'))
    status = 'Confirm the new amount';
  else if (outcome === 'QUEUE ELIGIBLE' && cue(c, 3, 'With every field matching'))
    status = 'Eligible for queue';
  else if (n === 2) status = 'Awaiting confirmation';
  const split = ease(cue(c, 3, 'Keep the signed copy', 1.2));
  const x = lerp(349, 67, split),
    copyX = lerp(351, 663, split);
  if (hasCopy)
    form(
      g,
      copyX + 4,
      144,
      separate ? boundary : confirmed,
      'RETAINED   /   ALEX SIGNED',
      C.pink,
      separate ? 1 : newSig,
      '',
    );
  form(g, x, 137, s, 'SUPPORT   /   PROPOSAL', C.paper, sig, status);
  if (n === 5)
    text(g, 'Multiple partial credits require a remaining-balance check.', 74, 598, 23, C.cream);
}
