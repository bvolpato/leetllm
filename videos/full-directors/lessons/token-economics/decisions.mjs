import {
  C,
  bno,
  box,
  cents,
  clip,
  cue,
  dot,
  ended,
  footer,
  head,
  key,
  label,
  line,
  nfmt,
  paper,
  rule,
  scaleBar,
  seal,
  type,
  usd,
} from './press.mjs';
import {
  F,
  acceptedTaskCost,
  balance,
  month,
  policy,
  practice,
  rateContentDigest,
  receipt,
  report,
} from './ledger.mjs';

export function archive(c, k) {
  const b = bno(k),
    edit = cue(k, 3, 'Compare the two fingerprints') && !cue(k, 3, 'The original fingerprint');
  head(c, 'TRACE ARCHIVE   /   ATTEMPT A1', 'Can we reproduce this charge?');
  paper(c, 112, 329, 766, 440, '#e6dbbc');
  label(c, 'TASK T42  /  POLICY ANSWER', 160, 388);
  type(c, 'Archived record', 157, 480, 65, C.ink, 'serif');
  type(c, 'standard-sep21', 158, 566, 42, C.ink, 'mono');
  type(c, 'Output   $15 / million', 159, 638, 36);
  const saved = rateContentDigest(15),
    current = rateContentDigest(edit ? 16 : 15);
  type(c, saved.slice(0, 16), 158, 712, 33, C.teal, 'mono');
  if (b < 3) {
    paper(c, 959, 329, 846, 440, C.paper, true);
    label(c, 'INDIVIDUAL ATTEMPT', 1012, 390);
    type(c, 'policy-answer-42', 1007, 483, 57, C.ink, 'serif');
    type(c, 'Usage · outcome · release · feature', 1008, 575, 34);
    type(
      c,
      b === 2 ? 'Receipt missing → keep open' : 'Model · tier · billing scope · rate date',
      1008,
      663,
      34,
      b === 2 ? C.red : C.soft,
    );
  } else {
    paper(c, 959, 329, 846, 440, C.paper);
    label(c, 'TABLE OFFERED FOR REPLAY', 1008, 388);
    type(c, 'standard-sep21', 1008, 482, 57, C.ink, 'serif');
    type(c, 'Output   $' + (edit ? 16 : 15) + ' / million', 1008, 576, 40);
    type(c, current.slice(0, 16), 1008, 680, 34, edit ? C.red : C.teal, 'mono');
    seal(c, edit ? 'MISMATCH' : 'MATCH', 1610, 682, edit ? C.red : C.teal, 228);
  }
  if (b === 4)
    footer(c, 'Retain the approved bytes, provider evidence, approver and linked quality report.');
}
export function forecast(c, k) {
  const b = bno(k),
    grown = cue(k, 2, 'Add the same nightly charge') && !cue(k, 4, 'Reset support'),
    cold = cue(k, 4, 'Only the evaluation charge grows') && !cue(k, 5, 'Put evaluation back'),
    supportMiss = cue(k, 5, 'Policy and exception inputs get dearer');
  const s = month({
    supportFactor: grown ? 1.1 : 1,
    coldNights: cold ? 30 : 0,
    coldSupport: Boolean(supportMiss),
  });
  head(
    c,
    '30-DAY GENERATION PLAN',
    supportMiss
      ? 'Interactive prefix reads miss'
      : cold
        ? 'The evaluation runs cold'
        : grown
          ? 'Ten percent more support work'
          : 'The base plan',
  );
  paper(c, 111, 290, 1698, 492);
  label(c, 'USD PER DAY', 164, 351);
  type(c, '(', 149, 479, 95, C.soft, 'serif');
  type(c, 'Support', 220, 436, 48, C.ink, 'serif');
  type(c, usd(s.support, 4), 220, 516, 53, C.teal, 'mono');
  type(c, '+', 642, 480, 66, C.soft);
  type(c, 'Nightly evaluation', 767, 436, 46, C.ink, 'serif');
  type(c, usd(s.evaluation, 3), 767, 516, 53, C.blue, 'mono');
  type(c, ')', 1280, 479, 95, C.soft, 'serif');
  type(c, '× 30 days', 1430, 477, 49, C.soft, 'serif');
  const x = 168,
    w = 1530,
    max = 950e6,
    y = 663,
    limitX = x + (w * F.budgetMicro) / max;
  box(c, x, y, w, 47, '#d2d5c7');
  box(c, x, y, (w * s.support * 30) / max, 47, C.teal);
  box(c, x + (w * s.support * 30) / max, y, (w * s.evaluation * 30) / max, 47, C.blue);
  line(c, limitX, y - 24, limitX, y + 64, C.red, 5);
  type(c, '$750 limit', limitX, y - 55, 34, C.red, 'mono', 'center');
  const show = grown
    ? cue(k, 2, "That's over budget")
    : cold
      ? ended(k, 4)
      : supportMiss
        ? ended(k, 5)
        : true;
  if (show) type(c, usd(s.total, 2) + ' / month', 110, 863, 58, C.white, 'serif');
  if (b === 3 && cue(k, 3, 'The sample meets'))
    type(
      c,
      '1,994 / 2,000 pass   ·   0 unsafe / 1,200   ·   budget exceeds $750',
      1800,
      864,
      36,
      C.gold,
      'sans',
      'right',
      1075,
    );
  if (b === 1)
    type(
      c,
      '2,000 checks each night. Which daily term changes?',
      1800,
      863,
      35,
      C.gold,
      'sans',
      'right',
    );
}
export function quality(c, k) {
  const b = bno(k),
    unsafe = cue(k, 3, 'The release fails') && !cue(k, 5, 'Return to zero'),
    small = b === 5 && cue(k, 5, 'With six hundred') && !cue(k, 5, 'Three over twelve hundred');
  const s = report(Number(Boolean(unsafe)), small ? 600 : 1200);
  if (b < 5) {
    head(c, 'RELEASE REVIEW   /   CITED SUPPORT', 'Read the evidence behind the decision');
    paper(c, 110, 292, 1700, 509);
    clip(c, 960, 292);
    label(c, 'RELEASE + ANSWER SCHEMA MATCH   /   EVIDENCE COMPLETE', 168, 363);
    if (b === 1) {
      type(c, 'cited-support-answer-v3', 166, 475, 62, C.ink, 'serif');
      type(c, 'Evidence age', 170, 585, 41);
      line(c, 588, 591, 1590, 591, '#8b9b87', 5);
      for (const [x, v] of [
        [588, 'now'],
        [1590, '1 h maximum'],
      ]) {
        dot(c, x, 591, 12, C.teal);
        label(c, v, x, 667, C.soft, 'center');
      }
    } else {
      const rows = [
        ['Cited answer reviews', '2,000 required', nfmt(F.reviewedAnswers)],
        [
          'Cited answers passed',
          '≥ 99.5%',
          nfmt(F.citedAnswersPassed) + ' / 2,000  ·  ' + (100 * s.rate).toFixed(1) + '%',
        ],
        ['Reviewed cache hits', '≥ 1,000', nfmt(s.n)],
        ['Unsafe hits observed', '0 allowed', s.unsafe],
      ];
      rows.forEach(([name, floor, value], i) => {
        const y = 452 + i * 88;
        type(c, name, 167, y, 36, C.ink);
        type(c, floor, 782, y, 34, C.soft, 'mono');
        if (b >= 3)
          type(c, value, 1738, y, 35, i === 3 && s.unsafe ? C.red : C.teal, 'mono', 'right');
        rule(c, 166, y + 42, 1570);
      });
    }
    if (b >= 3)
      type(
        c,
        s.passes ? 'Sample passes the lab rules' : 'Hold · one observed unsafe hit',
        112,
        877,
        49,
        s.passes ? C.mint : C.coral,
        'serif',
      );
  } else {
    head(
      c,
      'ZERO FAILURES   /   INDEPENDENT, REPRESENTATIVE REVIEWS',
      'How much risk can zero hide?',
    );
    paper(c, 112, 303, 1694, 489);
    type(c, '0 observed', 163, 404, 62, C.ink, 'serif');
    type(c, nfmt(s.n) + ' reviewed hits', 164, 489, 46, C.soft);
    type(c, 'Approx. 95% upper rate', 967, 385, 44, C.ink, 'serif');
    type(
      c,
      '3 / ' + nfmt(s.n) + ' ≈ ' + (100 * s.upper).toFixed(2) + '%',
      967,
      487,
      55,
      C.teal,
      'mono',
    );
    const left = 170,
      w = 1552,
      y = 606;
    scaleBar(c, left, y, w, 54, s.upper, 0.01, C.teal);
    for (const [x, t] of [
      [left, '0%'],
      [left + w / 2, '0.5%'],
      [left + w, '1%'],
    ]) {
      line(c, x, y + 54, x, y + 70, C.soft, 2);
      type(c, t, x, y + 111, 34, C.soft, 'mono', 'center');
    }
    if (b === 6)
      footer(c, 'At that rate, 3,200 hits × 0.25% ≈ 8 expected. A day can exceed eight.');
    if (b === 7)
      footer(
        c,
        'Exact upper rate: 1 − 0.05^(1/n). Related or selected cases need a different analysis.',
      );
  }
}
export function reservation(c, k) {
  const b = bno(k);
  if (b === 1) {
    head(
      c,
      'INTERACTIVE LANE   /   HALF-CENT LAB CEILING',
      'What happens when the prefix goes cold?',
    );
    const cold = cue(k, 1, 'The same policy answer');
    [policy(!cold), receipt(2200, cold ? 0 : 1280, 0, 130)].forEach((r, i) => {
      const x = 116 + i * 856;
      paper(c, x, 317, 813, 465);
      label(c, cold ? 'COLD INPUT' : 'REPORTED PREFIX READ', x + 53, 393);
      type(c, i ? 'Concise exception' : 'Policy answer', x + 51, 500, 55, C.ink, 'serif');
      type(c, usd(r.total, 6), x + 49, 610, 62, cold ? C.red : C.teal, 'mono');
      type(c, 'Lab ceiling   $0.005000', x + 52, 716, 36, C.soft, 'mono');
    });
    return;
  }
  if (b >= 6) {
    head(c, 'REPLAY   /   1,800 COLD INPUT', 'The cap includes reasoning');
    const r = receipt(1800, 0, 0, 300, F.standard, 300);
    paper(c, 115, 315, 1692, 489);
    label(c, 'SENT OUTPUT CAP', 170, 386);
    type(c, '300 tokens', 168, 474, 72, C.ink, 'serif');
    box(c, 170, 559, 1552, 84, C.gold);
    type(c, 'All 300 spent on reasoning', 206, 599, 43, C.ink);
    type(c, 'Visible text    0', 169, 718, 42, C.red, 'mono');
    type(c, 'Billed    ' + usd(r.total, 6), 1721, 718, 45, C.ink, 'mono', 'right');
    if (b === 7)
      footer(c, 'If useful answers need a larger cap, raise the reservation and reprice the lane.');
    return;
  }
  const bigger = cue(k, 4, 'Leave the three'),
    input = bigger ? 2300 : 2200,
    r = receipt(input, 0, 0, 300);
  const solved = bigger ? cue(k, 5, 'Those extra tokens') : ended(k, 2);
  const verdict = bigger ? cue(k, 5, 'Those extra tokens') : cue(k, 3, 'so this call can start');
  head(c, 'GATEWAY   /   COLD-INPUT RESERVATION', 'Can this generation start?');
  paper(c, 119, 300, 1674, 512, C.paper);
  type(c, 'Cold input', 176, 380, 46, C.ink, 'serif');
  type(c, 'Sent output cap', 915, 380, 46, C.ink, 'serif');
  type(c, nfmt(input) + ' × $2.50 / M', 176, 481, 48, C.teal, 'mono');
  type(c, '300 × $15 / M', 915, 481, 48, C.blue, 'mono');
  rule(c, 177, 557, 1540);
  type(c, 'Single-call ceiling   1¢', 175, 625, 45, C.ink, 'serif');
  if (solved) {
    type(
      c,
      cents(r.rows[0].cost) + ' + ' + cents(r.rows[3].cost) + ' = ' + cents(r.total),
      175,
      729,
      45,
      C.ink,
      'mono',
    );
  } else type(c, 'Required reservation   ?', 175, 729, 43, C.soft, 'mono');
  if (verdict)
    seal(
      c,
      r.total <= 10000 ? 'MAY START' : 'REFUSE',
      1498,
      705,
      r.total <= 10000 ? C.teal : C.red,
      337,
    );
  if (b === 3) footer(c, 'Equality passes the lane ceiling. The account must also have the funds.');
}
export function accountState(k, exercise = false) {
  if (exercise) {
    const phase = cue(k, 5, 'The provider may still')
      ? 'timeout'
      : cue(k, 4, 'The second sees')
        ? 'held'
        : 'arrival';
    return balance(17000, phase, receipt(1600, 0, 0, 400).total);
  }
  const replay = cue(k, 3, 'Replay the same admission');
  const phase = replay
    ? cue(k, 3, 'The provider may still')
      ? 'timeout'
      : 'held'
    : cue(k, 2, 'The rest of the held cent')
      ? 'receipt'
      : cue(k, 2, 'B sees six tenths')
        ? 'held'
        : 'arrival';
  return balance(16000, phase);
}
function brass(c, x, y, w, h) {
  const g = c.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#d9bd7e');
  g.addColorStop(0.4, '#937e4b');
  g.addColorStop(0.71, '#ecd6a8');
  g.addColorStop(1, '#736141');
  box(c, x, y, w, h, g, '#283d35', 3, 17);
  for (const xx of [x + 19, x + w - 19])
    for (const yy of [y + 17, y + h - 17]) {
      dot(c, xx, yy, 5, '#58644e');
    }
}
function drawer(c, s, showB = true, requestAmount = cents(s.reserve)) {
  const x = 122,
    y = 335,
    w = 1675,
    inner = w - 78,
    heldColor = '#e5bd70';
  brass(c, x, y, w, 350);
  box(c, x + 28, y + 33, w - 56, 277, '#35473c', '#27392f', 4, 8);
  label(c, 'SHARED ACCOUNT   /   ' + cents(s.total) + ' TOTAL', x + 50, y + 74, C.white);
  let left = x + 39;
  const top = y + 121,
    h = 151;
  const parts = [
    [s.held, heldColor, 'A · HELD'],
    [s.spent, C.coral, 'A · SPENT'],
    [s.free, '#afcfb4', 'FREE'],
  ];
  for (const [amount, color, name] of parts) {
    if (!amount) continue;
    const length = (inner * amount) / s.total;
    box(c, left, top, length, h, color, '#364c41', 3);
    label(c, name, left + length / 2, top + 41, C.ink, 'center', length - 36);
    type(
      c,
      name === 'FREE' && !showB ? '?' : cents(amount),
      left + length / 2,
      top + 104,
      55,
      C.ink,
      'mono',
      'center',
      length - 40,
    );
    left += length;
  }
  if (s.phase === 'arrival') {
    key(c, 222, 742, 'A requests', requestAmount, C.blue, 442);
    key(c, 1256, 742, 'B requests', requestAmount, C.blue, 442);
  } else {
    const state =
      s.phase === 'receipt'
        ? 'A · matched receipt'
        : s.phase === 'timeout'
          ? 'A · local timeout'
          : 'A · dispatched';
    key(
      c,
      138,
      742,
      state,
      s.phase === 'receipt' ? cents(s.spent) + ' charged' : '1¢ reserved',
      s.phase === 'timeout' ? C.red : C.blue,
      684,
    );
    if (showB)
      key(
        c,
        1084,
        742,
        s.canB ? 'B · funds available' : 'B · waiting',
        cents(s.reserve) + ' required',
        s.canB ? C.teal : C.amber,
        684,
      );
    else key(c, 1084, 742, 'B requests', cents(s.reserve) + ' required', C.blue, 684);
  }
}
export function atomic(c, k) {
  const s = accountState(k);
  head(
    c,
    'ADMISSION LEDGER   /   CALLS A AND B',
    s.phase === 'receipt'
      ? 'Settle A against the actual receipt'
      : s.phase === 'timeout'
        ? 'A’s timer expires locally'
        : bno(k) >= 3
          ? 'Replay the same reservation'
          : 'One balance, two arrivals',
  );
  drawer(c, s, s.phase !== 'held' || cue(k, 2, 'Watch what changes'));
  if (s.phase === 'held' && bno(k) === 2 && cue(k, 2, 'Settle that charge')) {
    paper(c, 686, 228, 548, 86);
    type(c, 'Receipt A   ' + cents(F.conciseMicro), 959, 271, 40, C.ink, 'mono', 'center');
  }
  if (s.phase === 'receipt') footer(c, 'Released to free funds    ' + cents(s.reserve - s.spent));
  if (s.phase === 'timeout' && bno(k) === 4)
    footer(c, 'Attempt A remains open until its provider usage can be reconciled.');
}
export function fresh(c, k) {
  const b = bno(k);
  if (b >= 3) {
    const s = accountState(k, true);
    const priced = cue(k, 4, 'Reserve one cent');
    head(c, 'NEW WORKLOAD   /   COLD CALLS', 'Two more calls arrive');
    label(
      c,
      'Each call    1,600 input × $2.50/M + 400 capped output × $15/M' +
        (priced ? ' = ' + cents(s.reserve) : ''),
      118,
      268,
      C.white,
    );
    drawer(c, s, true, priced ? cents(s.reserve) : '?');
    return;
  }
  head(c, 'NEW WORKLOAD   /   GENERATION RECEIPTS', 'What did one accepted task cost?');
  const s = acceptedTaskCost(practice);
  practice.forEach((r, i) => {
    const x = 113 + i * 431;
    paper(c, x, 327, 393, 383, i === 2 ? '#ebd9c6' : C.paper, true);
    clip(c, x + 197, 327);
    label(c, 'TASK ' + r.task, x + 35, 394);
    type(c, r.id, x + 30, 483, 73, C.ink, 'serif');
    type(c, cents(r.costMicro), x + 31, 574, 51, C.ink, 'mono');
    type(c, r.status, x + 33, 652, 36, r.accepted ? C.teal : C.red);
  });
  if (cue(k, 2, 'If nothing succeeds'))
    type(
      c,
      cents(s.spend) +
        ' ÷ ' +
        s.accepted +
        ' accepted tasks = ' +
        cents(s.costPerAccepted) +
        ' per accepted task',
      116,
      837,
      56,
      C.white,
      'serif',
      'left',
      1685,
    );
}
export function calendar(c, k) {
  const b = bno(k);
  const eleven = month({ coldNights: 11 });
  const twelve = month({ coldNights: 12 });
  const extra = twelve.total - eleven.total;
  const build = cue(k, 1, 'Post those eleven nights', 1.2);
  const focus = cue(k, 2, 'Look at night twelve');
  const post = cue(k, 3, 'Post the twelfth cold night', 1.15);
  const hold = cue(k, 3, 'Hold this plan');
  let showEleven = b > 1;
  let showTwelve = false;
  let showShortfall = false;
  let overrun = 0;
  if (b === 1) {
    const amount = 'The month now costs seven hundred forty-eight dollars and eighty-six cents';
    k.reveal(amount, 0);
    showEleven = k.elapsed >= k.wordCue(amount).end;
  }
  if (b === 3) {
    const amount = 'The month reaches seven hundred fifty-one dollars and seventy-four cents';
    const shortfall = 'Eleven cold nights fit, and twelve leave a dollar seventy-four short';
    k.reveal(amount, 0);
    k.reveal(shortfall, 0);
    const amountEnd = k.wordCue(amount).end;
    showTwelve = k.elapsed >= amountEnd;
    showShortfall = k.elapsed >= k.wordCue(shortfall).end;
    overrun = Math.max(0, Math.min(1, (k.elapsed - amountEnd) / 0.45));
  }

  const posted = Math.floor(11 * build);
  head(
    c,
    'MONTH END   /   2,000 EVALUATION CHECKS PER NIGHT',
    'Can the budget cover night twelve?',
  );
  box(c, 112, 306, 1017, 502, '#122a25', '#937b4c', 6, 16);
  for (let i = 0; i < 30; i++) {
    const x = 145 + (i % 6) * 160,
      y = 347 + Math.floor(i / 6) * 86,
      cold = i < posted || (i === 11 && post >= 0.5),
      next = i === 11 && focus;
    box(c, x, y, 142, 69, cold ? C.gold : '#344f45', next ? C.white : '#698171', next ? 5 : 2, 5);
    type(c, i + 1, x + 71, y + 35, 39, cold ? C.ink : C.white, 'mono', 'center');
  }
  type(c, 'Gold = prefix read missed', 116, 863, 35, C.gold);
  if (hold) seal(c, 'HOLD PLAN', 1001, 855, C.coral, 225);

  paper(c, 1187, 321, 625, 520, C.paper, true);
  label(c, '30-DAY FORECAST', 1233, 372);
  type(c, showEleven ? '11 cold nights' : 'All reads', 1233, 453, 42, C.ink, 'serif');
  type(
    c,
    usd(showEleven ? eleven.total : month().total, 2),
    1766,
    453,
    58,
    C.ink,
    'serif',
    'right',
  );
  rule(c, 1233, 499, 533);
  if (build > 0 || b > 1)
    type(c, 'Each cold night adds ' + usd(extra, 2), 1233, 620, 36, C.amber, 'sans');
  if (b === 1) {
    type(c, 'Monthly cap', 1233, 553, 40, C.soft, 'serif');
    type(c, usd(F.budgetMicro, 2), 1766, 553, 44, C.ink, 'mono', 'right');
  } else {
    type(c, '12 cold nights', 1233, 551, 42, C.ink, 'serif');
    type(
      c,
      showTwelve ? usd(twelve.total, 2) : '?',
      1766,
      551,
      58,
      showTwelve ? C.red : C.soft,
      'serif',
      'right',
    );
    // Give the last few dollars their own scale so the crossing stays visible.
    const x = 1233;
    const y = 709;
    const w = 533;
    const h = 42;
    const room = (w * eleven.headroom) / extra;
    const cap = x + room;
    box(c, x, y, room, h, C.mint);
    if (post > 0) box(c, x, y, room * post, h, C.gold);
    if (overrun > 0) box(c, cap, y, (w - room) * overrun, h, C.coral);
    line(c, cap, y - 18, cap, y + h + 7, C.ink, 4);
    type(c, usd(F.budgetMicro, 2) + ' cap', cap, 671, 32, C.ink, 'mono', 'center');
    type(
      c,
      usd(eleven.headroom, 2) + (post === 1 ? ' fits' : ' room'),
      x + room / 2,
      792,
      36,
      post === 1 ? C.amber : C.teal,
      'sans',
      'center',
    );
    if (showShortfall)
      type(
        c,
        usd(-twelve.headroom, 2) + ' over',
        cap + (w - room) / 2,
        792,
        37,
        C.red,
        'sans',
        'center',
      );
  }
}
