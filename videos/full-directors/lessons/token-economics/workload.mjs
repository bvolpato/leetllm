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
  label,
  line,
  nfmt,
  paper,
  rule,
  scaleBar,
  segments,
  slipRow,
  type,
  usd,
} from './press.mjs';
import {
  F,
  acceptedTaskCost,
  historyUsage,
  month,
  nightlyLines,
  overnight,
  receipt,
  refundAttempts,
  terra,
} from './ledger.mjs';

export function writeRead(c, k) {
  const read = cue(k, 4, 'Only that middle charge changes');
  const r = receipt(1800, read ? 1280 : 0, read ? 0 : 1280, 180, terra);
  head(
    c,
    'TERRA STANDARD   /   GLOBAL   /   21 SEP 2026',
    read ? 'The same prefix comes back for a read' : 'A write pays for the prefix once',
  );
  const x = 110,
    y = 305,
    w = 510,
    gap = 82;
  [r.rows[0], read ? r.rows[1] : r.rows[2], r.rows[3]].forEach((row, i) => {
    const left = x + i * (w + gap);
    paper(c, left, y, w, 420, i === 1 ? '#f6dda2' : C.paper, true);
    label(c, i === 1 ? 'POLICY PREFIX   /   P1' : 'SAME REQUEST', left + 32, y + 51);
    type(c, row.name, left + 30, y + 129, 52, C.ink, 'serif', 'left', w - 60);
    type(c, nfmt(row.count) + ' tokens', left + 32, y + 211, 43, C.ink, 'mono');
    type(c, '$' + row.rate.toFixed(2) + ' / million', left + 32, y + 278, 34, C.soft);
    if (bno(k) >= 2) {
      rule(c, left + 34, y + 318, w - 68);
      type(c, usd(row.cost), left + 32, y + 365, 49, i === 1 ? C.amber : C.ink, 'mono');
    }
  });
  if (bno(k) >= 2)
    type(
      c,
      (read ? 'Read call     ' : 'Write call     ') + usd(r.total),
      111,
      810,
      50,
      C.white,
      'serif',
    );
  if (bno(k) === 5) {
    const pair = r.total + receipt(1800, 0, 1280, 180, terra).total;
    footer(
      c,
      'Write then read    ' +
        usd(pair) +
        '       Two ordinary calls    ' +
        usd(2 * receipt(1800, 0, 0, 180, terra).total),
    );
  } else if (bno(k) < 4)
    footer(
      c,
      '30-minute write = 1.25 × ordinary input. It includes processing the written tokens.',
    );
}
export function compatibility(c, k) {
  const b = bno(k);
  if (b <= 2) {
    head(c, 'PREFIX MATCH   /   RENDERED REQUESTS', 'Compare from the first field');
    const changed = cue(k, 1, 'The common run stops there');
    const first = ['system', 'policy v3', 'tools v2', 'order 42'],
      second = ['system', changed ? 'policy v4' : 'policy v3', 'tools v2', 'order 77'];
    [first, second].forEach((row, j) => {
      label(c, j ? 'NEW' : 'SAVED', 108, 400 + j * 200, C.white);
      row.forEach((v, i) => {
        const common = i < (changed ? 1 : 3);
        const x = 315 + i * 368,
          y = 351 + j * 200;
        box(c, x, y, 347, 111, common ? C.mint : i === 1 ? C.gold : C.paper, null, 0, 7);
        type(c, v, x + 174, y + 54, 43, common ? C.ink : C.soft, 'mono', 'center');
      });
    });
    const end = 315 + 368 * (changed ? 1 : 3) - 12;
    line(c, 315, 735, end, 735, C.gold, 8);
    type(c, 'Shared prefix', 315, 799, 42, C.gold, 'serif');
    if (b === 2)
      footer(
        c,
        'Preserve access boundaries and instruction priority. Verify freshness and the reported read.',
      );
  } else if (b < 6) {
    const anthropic = b === 5;
    head(
      c,
      'CACHE POLICY   /   NOV 2026 GUIDE SNAPSHOT',
      anthropic ? 'Check the platform’s retention terms' : 'How long will the provider keep it?',
    );
    const rows = anthropic
      ? [
          ['5 min', 1.25],
          ['1 hour', 2],
        ]
      : [
          ['30 min', 1.25],
          ['12 hours', 2.5],
        ];
    rows.slice(0, b === 3 ? 1 : 2).forEach(([t, m], i) => {
      const x = 115 + i * 860;
      paper(c, x, 326, 810, 442, i ? '#e2e8dd' : C.paper);
      label(c, anthropic ? 'ANTHROPIC  /  WRITE' : 'GPT-5.6+  /  WRITE', x + 53, 397);
      type(c, t, x + 48, 506, 97, C.ink, 'serif');
      rule(c, x + 53, 577, 690);
      type(c, m + ' × ordinary input price', x + 52, 657, 40, C.amber, 'mono', 'left', 708);
    });
    footer(
      c,
      anthropic
        ? 'Verify model minimum, platform and read rate.'
        : 'Minimum in this guide: 1,024 visible input tokens. Earlier model rules differ.',
    );
  } else {
    head(c, 'LATENCY TRACE', 'Time the answer at the client');
    line(c, 195, 542, 1718, 542, C.dim, 7);
    [
      ['Send', 214],
      ['First token', 776],
      ['Token 2', 1090],
      ['Last token', 1670],
    ].forEach(([t, x]) => {
      dot(c, x, 542, 19, C.gold);
      type(c, t, x, 457, 38, C.white, 'sans', 'center');
    });
    type(c, 'Time to first token', 491, 648, 40, C.mint, 'serif', 'center');
    type(c, 'Inter-token time', 951, 718, 38, C.sky, 'serif', 'center');
    line(c, 214, 780, 1670, 780, C.gold, 3);
    type(c, 'End-to-end latency', 937, 850, 46, C.gold, 'serif', 'center');
  }
}
export function cohorts(c, k) {
  const priced = cue(k, 2, 'They use fresh order data'),
    short = cue(k, 3, 'That saves');
  const items = [
    ['Stored reply', 'Approved answer', 3200, 0],
    ['Policy', '1,800 in · 1,280 read · 180 out', 1800, F.prefixMicro],
    ['Live order', '900 in · 0 read · 95 out', 3000, F.dailySlices[1].cost],
    [
      'Exception',
      '2,200 in · 1,280 read · ' + (short ? 130 : 220) + ' out',
      500,
      short ? F.conciseMicro : F.verboseMicro,
    ],
  ];
  head(c, 'SUPPORT JOURNAL   /   8,500 REQUESTS', 'Where did the day’s money go?');
  paper(c, 107, 265, 1706, 523);
  const starts = [156, 780, 1076, 1349];
  ['Support work', 'Requests', 'USD per call', 'USD per day'].forEach((v, i) =>
    label(c, v, starts[i], 320),
  );
  items.forEach(([name, detail, count, unit], i) => {
    const y = 400 + i * 99;
    type(c, name, 156, y, 40, C.ink, 'serif');
    type(c, detail, 156, y + 41, 27, C.soft);
    type(c, nfmt(count), 780, y + 8, 37, C.ink, 'mono');
    type(c, usd(unit), 1076, y + 8, 34, C.ink, 'mono');
    if (priced) {
      type(c, usd(count * unit, 3), 1349, y, 37, i === 2 ? C.teal : C.ink, 'mono');
      scaleBar(c, 1349, y + 31, 385, 15, count * unit, 11025000, i === 2 ? C.teal : '#93aaa0');
    }
  });
  if (bno(k) >= 3)
    type(
      c,
      usd(short ? F.optimizedDailyMicro : F.actualDailyMicro, 3) +
        ' support + ' +
        usd(F.evaluationMicro, 3) +
        ' nightly = ' +
        usd((short ? F.optimizedDailyMicro : F.actualDailyMicro) + F.evaluationMicro, 3) +
        ' / day',
      113,
      850,
      44,
      C.white,
      'mono',
    );
  if (cue(k, 4, 'Keep that estimate outside'))
    type(
      c,
      'Avoided generation outside the bill     3,200 × ' +
        usd(F.prefixMicro, 5) +
        ' = ' +
        usd(3200 * F.prefixMicro, 3),
      113,
      922,
      35,
      C.gold,
    );
}
export function fiveTurns(c, k) {
  const warm = cue(k, 5, 'At the supplied rates'),
    s = historyUsage(Boolean(warm));
  const displayAll = cue(k, 1, 'Lay out all five receipts', 1.4);
  const count = bno(k) > 1 ? 5 : 1 + Math.floor(4 * displayAll);
  head(
    c,
    warm ? 'IDEALIZED CACHE   /   SAME FIVE TURNS' : 'AGENT JOURNAL   /   FIVE TURNS',
    warm ? 'Suppose the whole prior input gets the read rate' : 'The previous turn comes along',
  );
  label(c, 'INPUT POSITIONS', 343, 290, C.dim);
  label(c, 'OUTPUT', 1324, 290, C.dim);
  label(c, 'CHARGE', 1570, 290, C.dim);
  for (let i = 0; i < count; i++) {
    const y = 337 + i * 90,
      cost = receipt(s.inputs[i], s.reads[i], 0, 200).total;
    type(c, 'Turn ' + (i + 1), 114, y + 26, 38, C.white, 'serif');
    const w = (745 * s.inputs[i]) / 6000;
    segments(c, 342, y, w, 56, [
      [s.reads[i], C.gold],
      [s.inputs[i] - s.reads[i], C.mint],
    ]);
    type(c, nfmt(s.inputs[i]), 360 + w, y + 29, 34, C.white, 'mono');
    type(c, '200', 1324, y + 28, 35, C.sky, 'mono');
    type(c, cents(cost), 1570, y + 28, 38, C.white, 'mono');
  }
  const showTotal = warm ? cue(k, 6, 'On an actual call') : cue(k, 4, 'Five cents paid');
  if (showTotal)
    type(
      c,
      (warm ? nfmt(s.cached) + ' assumed reads  +  ' : '') +
        nfmt(s.ordinary) +
        ' ordinary' +
        '  +  ' +
        nfmt(s.output) +
        ' output     ' +
        cents(s.cost * 1e6),
      112,
      863,
      43,
      C.white,
      'mono',
      'left',
      1700,
    );
  else if (warm) footer(c, 'Gold marks the assumed reads. Output stays at 200 tokens per turn.');
  else if (bno(k) === 3)
    footer(c, 'The last charge is only one of the five. What did the task cost?');
  else if (bno(k) === 1) footer(c, '200 generated tokens + 800 tool tokens enter the next prompt.');
  if (warm && showTotal)
    label(c, 'For a real call, price the reported cached_tokens field.', 112, 930, C.gold);
}
export function answer(c, k) {
  const clipped = cue(k, 2, 'Read what the customer gets') && !cue(k, 3, 'Cutting ninety');
  const short = cue(k, 1, 'All three fields survive');
  const output = clipped ? 55 : short ? 130 : 220;
  head(c, 'REFUND CORRESPONDENCE', 'What survives the edit?');
  paper(c, 127, 285, 1130, 535);
  clip(c, 684, 285);
  label(c, 'EXCERPTS   /   CUSTOMER REPLY', 184, 353);
  const fields = clipped
    ? ['Refund eligible.', '', '']
    : short
      ? ['Refund eligible.', 'Returns policy §3.', 'Confirm your order ID.']
      : [
          'Your order qualifies for a refund.',
          'See section 3 of the returns policy.',
          'Please confirm your order ID to proceed.',
        ];
  ['Decision', 'Citation', 'Next step'].forEach((name, i) => {
    const y = 453 + i * 114;
    label(c, name, 181, y);
    if (fields[i]) type(c, fields[i], 435, y, 41, C.ink, 'serif', 'left', 751);
    else rule(c, 437, y + 9, 636);
  });
  label(c, 'FULL REPLY', 1349, 371, C.dim);
  type(c, String(output), 1338, 492, 119, C.white, 'serif');
  type(c, 'output tokens', 1349, 594, 42, C.white);
  scaleBar(c, 1350, 672, 365, 42, output, 220, C.sky, '#435c5b');
  if (bno(k) === 3 && !clipped)
    footer(c, '500 attempts × 90 fewer output tokens × $15 / million = $0.675 less');
}
// Perforations and the fixed input engraving repeat once per charged attempt.
function stamp(c, x, y, w, h, color, r, commonWidth) {
  paper(c, x, y, w, h, C.paper);
  box(c, x + 9, y + 9, w - 18, h - 18, null, color, 3);
  for (let j = 13; j < w - 5; j += 23) {
    dot(c, x + j, y, 5, C.night);
    dot(c, x + j, y + h, 5, C.night);
  }
  box(c, x + 18, y + 22, commonWidth - 23, h - 48, color);
  for (let j = 2; j < 6; j++)
    line(c, x + 26, y + 20 + j * 11, x + commonWidth - 18, y + 22 + j * 11, C.paper, 1.6);
  box(c, x + commonWidth * 0.32, y + h * 0.36, commonWidth * 0.43, h * 0.28, C.paper);
  line(c, x + commonWidth * 0.32, y + h * 0.36, x + commonWidth * 0.53, y + h * 0.53, color, 2);
  line(c, x + commonWidth * 0.53, y + h * 0.53, x + commonWidth * 0.75, y + h * 0.36, color, 2);
  type(
    c,
    cents(r.costMicro),
    x + commonWidth + (w - commonWidth) * 0.5,
    y + h * 0.54,
    35,
    color,
    'bold',
    'center',
    w - commonWidth - 19,
  );
  type(
    c,
    r.task + ' · ' + (r.accepted ? 'CLOSED' : 'OPEN'),
    x + w * 0.5,
    y + h + 36,
    29,
    r.accepted ? C.mint : C.coral,
    'mono',
    'center',
    w + 2,
  );
}
export function postage(c, k) {
  const b = bno(k),
    aligned = cue(k, 4, 'Place the stamps edge to edge', 0.8);
  const long = refundAttempts(false),
    short = refundAttempts(true);
  const steps = [
    cue(k, 1, 'A closes'),
    cue(k, 1, 'B stays open'),
    cue(k, 1, 'This time it closes'),
  ];
  const factor = 0.083,
    common = receipt(2200, 1280, 0, 0).total * factor;
  head(c, 'REFUND CORRESPONDENCE   /   CHARGED ATTEMPTS', 'What did it cost to close A and B?');
  const rows = [
    [long, 'Long reply', C.blue, 280],
    [short, 'Short reply', C.red, 538],
  ];
  for (const [list, name, color, y] of rows) {
    type(c, name, 111, y + 45, 48, C.white, 'serif');
    label(c, (name === 'Long reply' ? 220 : 130) + ' output tokens', 112, y + 114, C.dim);
    let x = 538;
    list.forEach((r, i) => {
      const w = r.costMicro * factor,
        filedX = i === 0 ? 538 : 1100;
      const filedY = y + (i === 2 ? 183 : 0);
      const moveX = Math.min(1, aligned * 2),
        moveY = Math.max(0, aligned * 2 - 1);
      const posX = filedX + (x - filedX) * moveX,
        posY = filedY + (y - filedY) * moveY;
      if ((list === long && b >= 3) || (list === short && steps[i]))
        stamp(c, posX, posY, w, 112, color, r, common);
      x += w;
    });
    if (b >= 4 && ended(k, 4)) {
      const res = acceptedTaskCost(list);
      type(
        c,
        cents(res.spend) +
          ' ÷ ' +
          res.accepted +
          ' = ' +
          cents(res.costPerAccepted) +
          ' per closed case',
        540,
        y + 216,
        37,
        C.white,
        'serif',
      );
    }
  }
  if (b === 1 && !steps[0]) {
    for (const [i, name] of ['A', 'B'].entries()) {
      const x = 538 + i * 560,
        y = 445;
      paper(c, x, y, 483, 203, i ? '#d1dfd6' : C.paper);
      line(c, x, y, x + 242, y + 111, C.soft, 2);
      line(c, x + 483, y, x + 242, y + 111, C.soft, 2);
      type(c, 'Refund case ' + name, x + 240, y + 157, 41, C.ink, 'serif', 'center');
    }
  }
  if (b === 2 || b === 3) {
    const result = acceptedTaskCost(short);
    type(
      c,
      b === 2 ? 'Spend for both cases' : 'Which format costs less per closed case?',
      112,
      829,
      35,
      C.white,
      'serif',
      'left',
      907,
    );
    if (b === 2 && ended(k, 2)) type(c, usd(result.spend, 5), 113, 890, 40, C.gold, 'mono');
  }
}
export function schedule(c, k, recovery = false) {
  const b = bno(k);
  if (recovery && b >= 3) {
    const expired = cue(k, 3, 'Keep those six receipts');
    head(c, 'NIGHTLY BATCH   /   10 JOBS', 'Keep the work that finished');
    for (let i = 0; i < 10; i++) {
      const x = 111 + (i % 5) * 346,
        y = 301 + Math.floor(i / 5) * 197;
      paper(c, x, y, 315, 158, expired ? (i < 6 ? '#cde7cf' : '#f5d4bb') : C.paper, true);
      label(c, 'JOB ' + String(i + 1).padStart(2, '0'), x + 25, y + 41);
      type(
        c,
        expired ? (i < 6 ? 'Receipt kept' : 'Expired') : 'Submitted',
        x + 24,
        y + 104,
        41,
        expired && i >= 6 ? C.red : C.ink,
        'serif',
      );
    }
    if (b === 3 && expired)
      footer(c, 'Recover jobs 07–10 after inspecting errors. Each retry needs its own budget.');
    if (b === 4) {
      type(c, 'Recovery needs 4 h', 114, 778, 54, C.white, 'serif');
      type(c, '3 h remain', 780, 778, 54, C.gold, 'serif');
      if (cue(k, 4, 'A discounted lane'))
        type(c, 'Window too short', 1240, 778, 51, C.coral, 'serif');
    }
    return;
  }
  head(
    c,
    'DISPATCH CLOCK   /   POLICYOPS',
    recovery ? 'Leave room for recovery' : 'Which work can wait?',
  );
  type(c, 'Live support', 112, 339, 49, C.white, 'serif');
  type(c, 'Customer waiting', 727, 339, 42, C.sky);
  line(c, 112, 410, 1710, 410, C.dim, 2);
  type(c, 'Nightly evaluation', 110, 496, 54, C.white, 'serif');
  const x = 118,
    w = 1540,
    hour = w / 48,
    y = 610;
  box(c, x, y, w, 95, '#48615a');
  if (b >= 2 || recovery) {
    box(c, x, y, 24 * hour, 95, C.mint);
    type(c, '24 h provider window', x + 40, y + 47, 42, C.ink);
    if (recovery || b >= 3) {
      box(c, x + 24 * hour, y, 4 * hour, 95, C.gold);
      label(c, '+4 h', x + 26 * hour, y + 49, C.ink, 'center');
    }
  }
  for (const h of [0, 24, 48]) {
    line(c, x + h * hour, y - 11, x + h * hour, y + 112, C.white, 3);
    type(c, h + ' h', x + h * hour, y + 159, 35, C.white, 'mono', 'center');
  }
  if (b >= 2 || recovery) type(c, '48 h deadline', x + w, y - 54, 39, C.gold, 'sans', 'right');
  if (b === 2 && !recovery)
    footer(c, 'Worksheet assumes 50% lower token prices for the eligible Batch route.');
  if (b >= 3 || recovery)
    footer(c, 'Offline + supported model and endpoint + enough time for processing and recovery');
}
export function nightly(c, k) {
  const b = bno(k),
    cold = cue(k, 3, 'Each million of those tokens');
  if (b >= 5) {
    head(c, 'MONTHLY CUSHION   /   12 NIGHTS', 'How much extra can each night use?');
    paper(c, 118, 310, 1683, 493);
    label(c, 'AVAILABLE ABOVE THE BASE FORECAST', 175, 377);
    type(c, '$32.82', 168, 483, 95, C.ink, 'serif');
    const x = 178,
      w = 1538;
    for (let i = 0; i < 12; i++) {
      box(c, x + (i * w) / 12, 582, w / 12 - 5, 68, '#d9bd79');
      type(c, i + 1, x + ((i + 0.5) * w) / 12, 615, 28, C.ink, 'mono', 'center');
    }
    if (cue(k, 6, 'Each cold night adds'))
      type(
        c,
        usd(month().headroom / 12, 3) +
          ' available per night    <    ' +
          usd(F.coldNightExtraMicro, 2) +
          ' extra for a miss',
        174,
        733,
        43,
        C.ink,
        'mono',
        'left',
        1570,
      );
    return;
  }
  const scaled = cue(k, 4, 'One night costs'),
    count = scaled ? 2000 : 1;
  head(
    c,
    'EVALUATION   /   ESTIMATED BATCH RATES',
    scaled ? 'Carry both receipts through 2,000 checks' : 'Price one nightly check twice',
  );
  [true, false].forEach((warm, i) => {
    const x = 110 + i * 862,
      y = 302,
      rows = nightlyLines(warm, count),
      allowed = warm || cold;
    paper(c, x, y, 816, 488, i ? '#f5e4c8' : C.paper, true);
    label(
      c,
      (warm ? 'POLICY READ' : 'POLICY READ MISSES') +
        '   /   ' +
        nfmt(count) +
        (scaled ? ' CHECKS' : ' CHECK'),
      x + 42,
      y + 57,
    );
    rows.forEach((row, j) =>
      slipRow(
        c,
        x + 42,
        y + 141 + j * 79,
        728,
        nfmt(row.tokens) + ' ' + row.name,
        allowed ? usd(row.cost, scaled ? 2 : 6) : '?',
        j === 0 ? C.amber : C.ink,
      ),
    );
    type(
      c,
      allowed
        ? usd(
            rows.reduce((sum, row) => sum + row.cost, 0),
            scaled ? 2 : 6,
          )
        : '?',
      x + 772,
      y + 410,
      54,
      C.ink,
      'mono',
      'right',
    );
  });
  if (scaled && cue(k, 4, "That's the amount"))
    footer(
      c,
      'An overnight miss adds    ' + usd(overnight(false).total - overnight(true).total, 2),
    );
}
