import {
  amber,
  arrow,
  blue,
  box,
  brass,
  cream,
  dim,
  disk,
  faint,
  field,
  glow,
  green,
  heading,
  ink,
  label,
  line,
  mix,
  moving,
  night,
  pale,
  paper,
  path,
  red,
  t,
  tag,
  tickAxis,
  timing,
} from './ink.mjs';
import {
  callCases,
  heartbeatClock,
  heartbeatExample,
  lookupCases,
  routeReceipt,
  routeTests,
  timeouts,
  trusted,
  wrongAccount,
} from './examples.mjs';

export function ageRule(g, age, minimum, stale, { x = 93, y = 275, w = 760, max = 60 } = {}) {
  const pos = (n) => x + (w * n) / max;
  box(g, x, y, w, 19, '#d5d3be');
  box(g, pos(minimum), y, pos(max) - pos(minimum), 19, '#7daea0');
  for (let n = 0; n <= max; n += 5) line(g, pos(n), y, pos(n), y + (n % 10 ? 7 : 13), ink, 1);
  for (let n = 0; n <= max; n += 10) t(g, n, pos(n), y + 42, 16, dim, 'mono', 'center');
  path(
    g,
    [
      [pos(age) - 7, y - 10],
      [pos(age), y],
      [pos(age) + 7, y - 10],
    ],
    blue,
    1,
    true,
  );
  t(
    g,
    (stale ? 'Stale key' : 'Current key') + ' · ' + age + ' d',
    pos(age),
    y - 17,
    21,
    blue,
    'bold',
    'center',
  );
  line(g, pos(minimum), y + 45, pos(minimum), y + 68, green, 2);
  t(g, 'P-7 minimum · ' + minimum + ' d', pos(minimum), y + 92, 20, green, 'bold', 'center');
}
function opening(g, c) {
  const { b, q } = timing(c);
  if (b > 1) {
    heading(g, 'Eligibility inquiry   /   acct_10234', 'Would you return this candidate?');
    tag(g, 'not_eligible', 57, 141, 217, 54, blue);
    ageRule(g, trusted.ageDays, trusted.thresholdDays, true);
    if (q(3, 'Reject it', 0.4) === 1)
      label(g, 'Reject the decision. The stale key qualifies.', 82, 445, red);
    return;
  }
  heading(g, 'Request recorder   /   elapsed seconds', 'Did the model finish?', true);
  const left = 234,
    right = 850,
    x = (n) => mix(left, right, n / 6);
  box(g, 34, 122, 889, 305, '#19383d', '#486166', 1.25);
  for (let i = 0; i <= 24; i++)
    line(g, x(i / 4), 160, x(i / 4), 409, i % 4 ? '#264449' : '#3c595c', 1);
  for (let n = 0; n <= 6; n++) t(g, n + ' s', x(n), 149, 15, pale, 'mono', 'center');
  for (const x0 of [44, 913]) for (const y0 of [133, 417]) disk(g, x0, y0, 2.5, pale);
  const app = 3 + q(0, 'Four seconds', 0.8);
  const appDone = app >= timeouts.limit;
  const finished = q(1, 'first possible history', 1.2),
    running = q(1, 'second history', 2.3);
  function pen(y, name, value, color, end) {
    t(g, name, 43, y + 6, 19, pale, 'mono');
    line(g, left, y, right, y, '#517074', 1.5);
    if (value <= 0) return;
    path(
      g,
      [
        [left, y],
        [left + 7, y - 11],
        [x(value), y - 11],
      ],
      color,
      4,
    );
    const px = x(value);
    path(
      g,
      [
        [px - 4, y - 20],
        [px + 4, y - 20],
        [px, y - 11],
      ],
      color,
      1,
      true,
    );
    box(g, px - 4, y - 29, 8, 8, color);
    disk(g, px, y - 11, 3.5, color);
    if (end) {
      const at = x(value) + (value === 4 ? 9 : 0);
      t(g, end, at, y + 23, 18, color, 'bold', value === 3 || value >= 5 ? 'right' : 'left');
    }
  }
  pen(202, 'App wait', app, amber, appDone ? 'timeout recorded' : 'waiting');
  if (appDone) {
    g.setLineDash([3, 4]);
    line(g, x(4), 159, x(4), 410, amber, 1.4);
    g.setLineDash([]);
  }
  pen(
    292,
    'Remote case 1',
    timeouts.lost * finished,
    glow,
    finished === 1 ? 'finished · reply lost' : '',
  );
  pen(
    385,
    'Remote case 2',
    timeouts.running * running,
    '#83b8ec',
    running === 1 ? 'still working →' : '',
  );
  if (b === 0 && appDone) t(g, 'Provider outcome   ?', 44, 469, 24, cream, 'mono');
  if (q(1, 'Leave the remote outcome', 0.6) > 0.5)
    t(
      g,
      'Caller timed out     /     Provider outcome and usage unknown',
      44,
      469,
      22,
      cream,
      'mono',
      'left',
      870,
    );
}
function keyShape(g, x, y, k = 1, color = brass) {
  g.save();
  g.translate(x, y);
  g.scale(k, k);
  disk(g, 0, 0, 21, color);
  disk(g, -5, 0, 6, cream);
  path(
    g,
    [
      [14, -6],
      [66, -6],
      [66, 7],
      [59, 7],
      [59, 13],
      [50, 13],
      [50, 6],
      [14, 6],
    ],
    color,
    1,
    true,
  );
  g.restore();
}
function secrets(g, c) {
  const { b, q } = timing(c);
  if (b <= 1) {
    heading(g, 'Startup   /   local fixture', 'What did the startup check prove?');
    const loaded = q(1, 'local placeholder', 1.2),
      empty = q(0, 'blank value', 0.5);
    paper(g, 74, 185, 334, 142);
    t(g, 'LLM_API_KEY', 96, 237, 26, ink, 'mono');
    t(
      g,
      loaded > 0 ? 'placeholder' : empty ? 'blank string' : 'missing',
      96,
      289,
      27,
      loaded ? blue : red,
      'mono',
    );
    arrow(g, 423, 262, 527, 262, dim);
    box(g, 544, 185, 308, 144, night);
    t(g, 'Startup output', 564, 225, 16, pale, 'mono');
    t(g, loaded >= 1 ? 'loaded' : 'stopped', 562, 293, 46, loaded >= 1 ? glow : amber, 'serif');
    if (loaded >= 1) label(g, 'Provider permissions still need a provider check.', 76, 413, ink);
  } else if (b <= 3) {
    heading(g, 'Frontend build   /   public settings', 'Follow the bytes into the browser');
    field(g, 'Referenced settings', 'NEXT_PUBLIC_…', 52, 186, 274, ink, 27);
    t(g, 'VITE_…', 52, 263, 26, blue, 'mono');
    box(g, 368, 171, 157, 148, '#d5d2bb', ink);
    for (let i = 0; i < 4; i++) line(g, 389 + i * 32, 216, 389 + i * 32, 276, dim, 2);
    t(g, 'Build', 445, 150, 21, ink, 'bold', 'center');
    box(g, 609, 159, 280, 183, ink);
    box(g, 618, 177, 262, 153, '#e0e6d8');
    for (let i = 0; i < 3; i++) disk(g, 626 + i * 8, 168, 2.3, cream);
    t(g, 'Client bundle', 636, 212, 21, ink, 'bold');
    const move = q(2, 'browser downloads', 1.8);
    line(g, 190, 285, 744, 285, dim);
    keyShape(g, mix(226, 740, move), 285, 0.85);
    if (q(3, 'The browser can', 0)) {
      t(g, 'Bytes readable here', 636, 318, 18, red, 'mono');
      label(g, 'Keep provider credentials in the server environment.', 52, 429);
    }
  } else {
    heading(g, 'Deployed route   /   organization quota', 'Who may start a billable call?');
    const enforced = Boolean(q(5, 'Now require sign-in', 0));
    const receipt = routeReceipt(routeTests[0], enforced);
    const inbound = enforced ? q(5, 'send the same request', 1.1) : q(4, 'signed-out caller', 1.3);
    const outbound = receipt.stop ? 0 : q(5, 'The server forwards', 1.5);
    const decided = receipt.stop ? inbound === 1 : outbound === 1;
    const y = 285, browser = 116, gate = 357, adapter = 524, provider = 827;
    box(g, 326, 144, 306, 217, '#e0e4d3', faint);
    t(g, 'Application server', 348, 178, 19, green, 'bold');
    t(g, enforced ? 'Sign-in required' : 'Forwards without sign-in', 348, 216, 21, ink, 'bold');
    t(g, 'Signed-out browser', browser, 237, 19, ink, 'bold', 'center');
    t(g, 'Provider', provider, 237, 21, ink, 'bold', 'center');
    line(g, browser, y, provider, y, faint, 3);
    line(g, browser, y, mix(browser, gate - 18, inbound), y, blue, 3);
    moving(g, [[browser, y], [gate - 18, y]], inbound, blue, 'U', 16);
    keyShape(g, adapter - 37, y + 39, 0.42, green);
    t(g, 'Server key', adapter, y + 45, 16, green);
    if (enforced) line(g, gate, y - 24, gate, y + 24, decided ? red : ink, 5);
    if (outbound > 0) {
      const x = mix(gate, provider, outbound);
      line(g, gate, y, x, y, brass, 4);
      disk(g, x, y, 9, brass);
      t(g, 'Provider call', 687, y - 17, 17, brass, 'mono', 'center');
    }
    field(g, 'Billable calls for this request', decided ? String(receipt.providerCalls) : '?',
      53, 409, 330, decided ? (receipt.stop ? green : brass) : ink, 34);
    if (decided) {
      label(g, receipt.stop ? 'Stopped at sign-in' : 'Charged to the organization', 469, 447,
        receipt.stop ? red : brass);
    }
  }
}
function wrapper(g, c) {
  const { b, q } = timing(c);
  heading(g, 'Request and return   /   trace_7e3b', 'Where do trusted facts enter?');
  box(g, 240, 150, 484, 264, '#e0e4d3');
  t(g, 'Server', 263, 185, 20, green, 'bold');
  const xs = [85, 298, 478, 658, 851],
    names = ['Browser', 'Access', 'P-7 + key age', 'Adapter', 'Provider'];
  line(g, xs[0], 271, xs[4], 271, dim, 3);
  xs.forEach((x, i) => {
    disk(g, x, 271, 11, cream, ink, 2);
    t(g, names[i], x, 240, 20, ink, 'bold', 'center');
  });
  const trace = b === 0 ? 0.53 * q(0, 'Follow them', 2) : 0.53 + 0.47 * q(1, 'maps the task', 1.8);
  moving(
    g,
    [
      [85, 271],
      [851, 271],
    ],
    trace,
    blue,
    '',
    9,
  );
  if (q(0, 'loads the key', 0.6) > 0) {
    line(g, 478, 287, 478, 312, green);
    t(g, '45 days · stale', 478, 337, 19, green, 'mono', 'center');
  }
  if (b >= 1) {
    keyShape(g, 646, 311, 0.43);
    t(g, 'server key', 650, 346, 15, dim, 'mono', 'center');
  }
  if (b === 2) {
    const pts = [
      [851, 290],
      [851, 384],
      [300, 384],
      [89, 384],
    ];
    path(g, pts, green, 2);
    moving(g, pts, q(2, 'returns a candidate', 2), green, '', 9);
    t(g, 'Validate candidate', 488, 377, 18, green, 'bold', 'center');
    t(g, 'Typed result', 88, 419, 17, green, 'mono', 'center');
  }
}
function task(g, c) {
  const { b, q } = timing(c);
  if (b === 2) {
    heading(g, 'Field meaning   /   P-7', 'Read the legacy field as a minimum age');
    t(g, 'rotation_window_days', 50, 165, 25, dim, 'mono', 'left', 310);
    arrow(g, 378, 155, 440, 155, dim);
    t(g, 'minimum_key_age_days', 465, 165, 27, green, 'mono');
    ageRule(g, 45, 30, true);
    label(g, 'Creating a job requires a fresh authorization.', 64, 448);
  } else {
    heading(g, 'Domain contract   /   provider adapter', 'Carry the task across the boundary');
    paper(g, 50, 147, 397, 287);
    t(g, 'LLMTask', 73, 197, 31, ink, 'serif');
    const rows = [
      'decide_rotation',
      'acct_10234    P-7',
      'trace_7e3b    rotation_decision@2',
      'connect 2 s  /  read 8 s',
      'deadline 20 s  /  retries 2',
    ];
    rows.forEach((s, i) => t(g, s, 75, 235 + i * 39, 18, i < 2 ? blue : ink, 'mono', 'left', 349));
    arrow(g, 461, 288, 534, 288, dim);
    paper(g, 548, 174, 357, 237);
    t(g, b === 0 ? 'Adapter input' : 'Provider schema', 569, 218, 29, ink, 'serif');
    const mapped = q(1, 'turns those requirements', 0.9) === 1;
    [
      mapped ? 'text.format' : 'Required response fields',
      'decision',
      'rotation_window_days',
      'source_line_ids',
    ].forEach((s, i) => t(g, s, 572, 258 + i * 36, 19, i === 0 ? green : ink, 'mono', 'left', 313));
  }
}
function candidates(g, c) {
  const { b, q } = timing(c),
    row = callCases[b],
    v = row.value;
  const trigger = ['conflicts', 'number disagrees', 'server accepts'][b];
  const seen = q(b, trigger, 0.65) === 1;
  heading(g, 'Candidate comparison   /   acct_10234', 'Does the reply survive both checks?');
  paper(g, 50, 154, 395, 249);
  t(g, 'Model candidate', 74, 203, 28, blue, 'serif');
  paper(g, 514, 154, 395, 249);
  t(g, 'Trusted record', 538, 203, 28, green, 'serif');
  const values = [v.decision, v.minimum_key_age_days + ' days', v.source_line_ids.join(',')];
  const facts = [
    'Stale key · ' + trusted.ageDays + ' days old',
    trusted.thresholdDays + ' days',
    trusted.policyId,
  ];
  for (let i = 0; i < 3; i++) {
    const y = 244 + i * 58,
      bad = (b === 0 && i === 0) || (b === 1 && i === 1);
    t(g, values[i], 74, y, 24, seen && bad ? red : ink, 'mono');
    t(g, facts[i], 538, y, 23, ink, 'mono');
    if (seen) t(g, bad ? '×' : '✓', 478, y, 29, bad ? red : green, 'bold', 'center');
  }
  if (seen)
    label(
      g,
      [
        "Rejected · contradicts the key's age and stale flag",
        'Rejected · threshold differs from P-7',
        'Accepted · typed eligibility decision',
      ][b],
      56,
      460,
      b < 2 ? red : green,
    );
}
function parser(g, c) {
  const { b, q } = timing(c);
  if (b < 2) {
    heading(g, 'Raw response   /   ordered pairs', 'Catch the duplicate before keys collapse');
    const duplicate = q(0, 'duplicate keys', 0.9);
    paper(g, 56, 152, 474, 240);
    t(g, 'rotation_window_days', 84, 218, 22, ink, 'mono');
    t(g, '30', 480, 218, 27, blue, 'mono', 'right');
    if (duplicate > 0) {
      t(g, 'rotation_window_days', 84, 284, 22, ink, 'mono');
      t(g, '90', 480, 284, 27, red, 'mono', 'right');
    }
    line(g, 84, 305, 501, 305, faint, 1);
    t(g, 'ordered input', 84, 357, 17, dim, 'mono');
    arrow(g, 551, 250, 616, 250, dim);
    t(g, b === 0 ? 'Default map' : 'Pair hook', 641, 209, 24, ink, 'serif');
    t(
      g,
      b === 0 ? (duplicate ? 'last value wins' : 'reading pairs') : 'duplicate field',
      641,
      264,
      27,
      b === 0 ? brass : red,
      'bold',
    );
    if (b === 1)
      label(g, 'Reject duplicate names, NaN, Infinity and excessive nesting.', 59, 454, red);
  } else if (b === 2) {
    heading(g, 'Strict field types   /   parsed object', 'Can true stand in for an integer?');
    const reject = q(2, 'reject true', 0.4);
    tag(g, 'true', 76, 214, 163, 67, blue);
    arrow(g, 256, 247, 352, 247, dim);
    box(g, 373, 185, 244, 127, null, ink, 3);
    t(g, 'type(value)', 495, 228, 22, ink, 'mono', 'center');
    t(g, 'is int', 495, 272, 30, ink, 'mono', 'center');
    if (reject) label(g, 'REJECT', 680, 255, red);
    t(
      g,
      'Exact fields   /   enum   /   integer   /   evidence list',
      70,
      387,
      21,
      ink,
      'mono',
      'left',
      840,
    );
  } else {
    heading(
      g,
      'Trusted record   /   inclusive threshold',
      b === 4 ? 'What if the record is missing?' : 'Does this key satisfy both parts of P-7?',
    );
    if (b === 3) {
      const current = Boolean(q(3, 'current key', 0));
      const younger = Boolean(q(3, 'twenty-nine days', 0)) && !current;
      const age = current ? 45 : younger ? 29 : 30;
      ageRule(g, age, trusted.thresholdDays, !current);
      const qualifies = wrongAccount(!current, age).status === 'accepted';
      const resultCue = current ? 'fails the stale check' : younger ? 'too young' : 'qualifies';
      if (!q(3, resultCue, 0)) return;
      label(
        g,
        qualifies
          ? 'Stale and at least 30 days old · eligible'
          : current
            ? 'Current key · ineligible'
            : 'Below the minimum age · ineligible',
        65,
        440,
        qualifies ? green : red,
      );
    } else {
      paper(g, 86, 165, 355, 197);
      t(g, 'Account lookup', 115, 215, 29, ink, 'serif');
      t(g, 'No record', 115, 301, 35, red, 'bold');
      arrow(g, 457, 268, 574, 268, dim);
      t(g, 'Lookup failure', 599, 282, 33, red, 'serif');
      t(g, 'Eligibility remains unknown.', 599, 325, 19, ink);
    }
  }
}
function failure(g, c) {
  const { b, q } = timing(c);
  heading(
    g,
    'Task receipt   /   finally',
    b === 0
      ? 'When does the status change to OK?'
      : b === 1
        ? 'How many calls reached the provider?'
        : 'What did the user receive?',
  );
  if (b === 2) {
    for (const [x, name, value, detail] of [
      [58, 'Attempt', 'Usage pending', 'Provider request ID if known'],
      [500, 'Task', 'Timeout', 'Elapsed time and caller outcome'],
    ]) {
      paper(g, x, 174, 404, 211);
      t(g, name, x + 24, 226, 30, ink, 'serif');
      t(g, value, x + 24, 298, 32, brass, 'bold');
      t(g, detail, x + 24, 353, 18, dim, 'sans', 'left', 352);
    }
    return;
  }
  const columns = [261, 481, 704];
  ['Lookup', 'Provider', 'Validate'].forEach((s, i) =>
    t(g, s, columns[i], 190, 20, dim, 'mono', 'center'),
  );
  const lines =
    b === 0 ? [{ account: 'acct_10234', called: true, status: 'accepted' }] : lookupCases;
  lines.forEach((row, i) => {
    const y = 244 + i * 79;
    t(g, row.account, 53, y + 6, 19, ink, 'mono');
    const reached =
      b === 0
        ? q(0, 'loads the account', 2)
        : i === 0
          ? q(1, 'wrong answer', 1.4)
          : q(1, 'unknown account', 0.8);
    const last = row.called ? 2 : 0;
    line(g, columns[0], y, columns[2], y, faint, 1);
    line(g, columns[0], y, mix(columns[0], columns[last], reached), y, blue, 4);
    columns.forEach((x, j) =>
      disk(
        g,
        x,
        y,
        9,
        j === last && b === 1 && reached === 1 ? red : j <= last && reached === 1 ? blue : cream,
        dim,
        1,
      ),
    );
    if (reached >= 1)
      t(
        g,
        b === 0 ? 'checked' : row.called ? 'rejected' : 'missing',
        columns[last],
        y + 33,
        17,
        b === 1 ? red : green,
        'mono',
        'center',
      );
  });
  const ok = b === 0 && q(0, 'change the status', 0.7) === 1;
  label(
    g,
    b === 0
      ? ok
        ? 'finally   /   OK   /   0.05 ms'
        : 'Status starts at failed'
      : q(1, 'Just one', 0.5) === 1
        ? '2 failed tasks     /     1 provider call'
        : 'Follow the two failed tasks.',
    58,
    413,
    ok ? green : ink,
  );
}
function heartbeatTimers(g, c) {
  const { interval, readTimeout, firstTextDeadline } = heartbeatExample;
  const firstCue = c.wordCue('six heartbeats');
  const expiryCue = c.wordCue('deadline expires');
  const approach = c.reveal('six heartbeats', expiryCue.start - firstCue.start, {
    captionStart: 'six heartbeats',
  });
  const expiry = c.reveal('deadline expires', expiryCue.end - expiryCue.start, {
    captionStart: 'deadline expires',
  });
  const elapsed = mix(0, firstTextDeadline - interval, approach) + interval * expiry;
  const clock = heartbeatClock(elapsed);
  const left = 215,
    right = 894,
    end = firstTextDeadline + readTimeout,
    x = (second) => mix(left, right, second / end);
  const bytesY = 224,
    readY = 307,
    textY = 385,
    movingDeadline = x(clock.readDeadline),
    fixedDeadline = x(firstTextDeadline),
    readColor = '#8bc9f1',
    track = '#547477';

  tickAxis(g, left, right, 144, end, interval, pale);
  const playhead = x(elapsed);
  g.setLineDash([4, 5]);
  line(g, playhead, 183, playhead, 333, pale, 1.5);
  line(g, playhead, 365, playhead, 402, pale, 1.5);
  g.setLineDash([]);
  for (const [name, y] of [
    ['Heartbeats', bytesY],
    ['Read timer', readY],
    ['Text deadline', textY],
  ]) {
    t(g, name, 42, y + 7, 22, cream, 'bold');
    line(g, left, y, right, y, track, 1.5);
  }
  for (let i = 1; i <= clock.received; i++) {
    const at = x(i * interval);
    path(
      g,
      [
        [at - 10, bytesY],
        [at - 4, bytesY],
        [at, bytesY - 24],
        [at + 5, bytesY],
        [at + 10, bytesY],
      ],
      i === clock.received ? glow : '#76a89c',
      3,
    );
  }

  const windowStart = x(clock.lastRead);
  box(g, windowStart, readY - 18, movingDeadline - windowStart, 36, '#294d62', readColor);
  t(
    g,
    readTimeout + ' s read window',
    (windowStart + movingDeadline) / 2,
    readY + 7,
    20,
    cream,
    'bold',
    'center',
    movingDeadline - windowStart - 16,
  );
  line(g, movingDeadline, readY - 26, movingDeadline, readY + 23, readColor, 3);
  t(g, clock.readDeadline + ' s', movingDeadline, readY - 34, 21, readColor, 'mono', 'center');

  line(g, left, textY, fixedDeadline, textY, amber, 2);
  line(g, fixedDeadline, textY - 21, fixedDeadline, textY + 18, amber, 3);
  t(g, firstTextDeadline + ' s deadline', fixedDeadline, textY - 29, 21, amber, 'mono', 'center');
  if (clock.firstTextExpired) {
    disk(g, fixedDeadline, textY, 8, amber);
    t(g, 'First-text timeout', left, 440, 24, amber, 'bold');
    t(g, 'Read timer had time left', right, 440, 22, readColor, 'bold', 'right');
  } else t(g, 'Waiting for visible text', left, 440, 22, pale, 'sans');
}

function timers(g, c) {
  const { b, q } = timing(c);
  heading(
    g,
    'Transport clocks   /   local fixture',
    b === 0
      ? 'Which wait is holding the request?'
      : b === 1
        ? 'Can bytes arrive while text is late?'
        : 'What happens at the cancellation deadline?',
    true,
  );
  if (b === 0) {
    const steps = ['Pool', 'Connect', 'Write', 'Read chunk'],
      cues = ['pooled connection', 'open a new', 'write the request', 'next chunk'];
    steps.forEach((s, i) => {
      const x = 138 + i * 228;
      disk(g, x, 269, 72, '#233e44', pale, 2);
      const u = q(0, cues[i], 1.1);
      const angle = -Math.PI * 0.8 + u * Math.PI * 1.3;
      line(g, x, 269, x + Math.cos(angle) * 46, 269 + Math.sin(angle) * 46, amber, 5);
      disk(g, x, 269, 6, amber);
      t(g, s, x, 393, 22, cream, 'bold', 'center');
    });
  } else if (b === 1) {
    heartbeatTimers(g, c);
  } else {
    const left = 128,
      x = (n) => left + n * 34;
    tickAxis(g, left, x(20), 291, 20, 5, pale, ' ms');
    t(g, 'Sleeping coroutine', left, 203, 22, cream, 'bold');
    line(g, left, 237, x(20), 237, '#688485', 8);
    line(g, x(1), 215, x(1), 316, amber, 3);
    t(g, '1 ms', x(1), 349, 18, amber, 'mono', 'center');
    const cancel = b === 3 || q(2, 'requests cancellation', 0.5) > 0;
    if (cancel) {
      arrow(g, x(1), 378, x(1) + 187, 378, glow);
      t(g, 'await cleanup', x(1) + 206, 385, 22, glow, 'mono');
    }
    if (b === 3) t(g, 'Remote outcome still needs confirmation.', 54, 466, 24, cream, 'serif');
  }
}
export const boundaryScenes = [
  opening,
  secrets,
  wrapper,
  task,
  candidates,
  parser,
  failure,
  timers,
];
