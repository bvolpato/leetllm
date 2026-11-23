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
  classifyFailure,
  deadlineReservation,
  deniedB,
  expires,
  idempotentJobTrace,
  jitterWindows,
  open,
  permit,
  probeA,
  probeC,
  retryPlan,
  trusted,
  workerDraws,
} from './examples.mjs';

function deadline(g, c) {
  const { b, q } = timing(c),
    plan = retryPlan(),
    x = (n) => 80 + 40 * n;
  const short = q(2, 'one point two', 0.75);
  heading(
    g,
    short ? 'Separate example   /   safe read' : 'Monotonic task clock   /   safe read',
    short ? 'Will the minimum wait fit?' : 'How much of the deadline is left?',
  );
  if (short) {
    tickAxis(g, 80, 880, 315, 4, 1);
    box(g, 80, 237, 400, 44, brass);
    line(g, 320, 198, 320, 320, red, 4);
    t(g, '1.2 s left', 320, 180, 24, red, 'bold', 'center');
    t(g, '2 s provider floor', 97, 267, 21, cream, 'bold');
    if (q(2, 'so stop', 0)) label(g, 'Stop before sleeping.', 80, 416, red);
    return;
  }
  const spans = [
    ['Attempt 1', 0, plan.firstAttempt.end, q(0, 'first attempt occupies', 2), blue],
    ['Floor', plan.firstAttempt.end, plan.retryAfter, q(1, 'requests two seconds', 1.2), brass],
    [
      'Jitter',
      plan.firstAttempt.end + plan.retryAfter,
      plan.wait - plan.retryAfter,
      q(1, 'half a second of full jitter', 1.1),
      '#7b7739',
    ],
    [
      'Retry',
      plan.secondAttempt.start,
      plan.secondAttempt.duration,
      q(2, 'three-second retry', 1.4),
      green,
    ],
  ];
  tickAxis(g, 80, 880, 318, 20, 2);
  let elapsed = 0;
  for (const [name, start, length, u, color] of spans)
    if (u > 0) {
      box(g, x(start), 238, length * u * 40, 59, color);
      t(g, name, x(start) + 4, name === 'Jitter' ? 182 : 220, 20, color, 'bold');
      elapsed = start + length * u;
    }
  line(g, x(20), 205, x(20), 322, red, 2);
  t(g, 'Deadline ' + plan.deadline + ' s', x(plan.deadline), 151, 17, red, 'mono', 'right');
  field(g, 'Elapsed', +elapsed.toFixed(1) + ' s', 80, 407, 260);
  const answered = q(1, 'Six seconds', 0);
  field(g, 'Remaining', answered ? +(plan.deadline - elapsed).toFixed(1) + ' s' : '?',
    434, 407, 250, answered ? green : ink);
}
const errorRows = [
  [429, 'rate_limit', 'Retry safe read'],
  [429, 'credit_balance_exhausted', 'Repair quota'],
  [503, 'transient', 'Retry safe read'],
  [400, 'invalid request', 'Fix request'],
  [401, 'unauthorized', 'Repair access'],
  [429, 'unmapped', 'Inspect error'],
];
function errors(g, c) {
  const { b, q } = timing(c);
  heading(
    g,
    'Admission control   /   normalized cause',
    b === 0
      ? 'Which limit does this burst consume?'
      : b === 3
        ? 'Did the task succeed?'
        : 'What does the error actually say?',
  );
  if (b === 0) {
    const n = Math.round(5 * q(0, 'five requests', 1.3)),
      y = 258;
    for (let i = 0; i < 5; i++) {
      box(g, 58 + i * 103, y - 37, 83, 65, i < n ? blue : null, dim);
      if (i < n) t(g, '16k', 99 + i * 103, y + 5, 23, cream, 'mono', 'center');
    }
    field(g, 'Request slots', n, 646, 182, 227);
    field(g, 'Input tokens', (n * 16000).toLocaleString('en-US'), 646, 295, 240, blue);
    t(g, 'Simplified input-only admission', 59, 403, 20, dim, 'mono');
  } else if (b < 3) {
    const index =
      b === 1
        ? q(1, 'second ran out', 0.5) > 0
          ? 1
          : q(1, 'five-oh-three', 0.5) > 0
            ? 2
            : 0
        : q(2, 'unfamiliar', 0.4) > 0
          ? 5
          : q(2, 'four-oh-one', 0.4) > 0
            ? 4
            : 3;
    const [status, code, description] = errorRows[index];
    const className = classifyFailure(status, code),
      retry = className === 'bounded_retry';
    paper(g, 58, 166, 459, 191);
    t(g, 'HTTP ' + status, 82, 236, 43, ink, 'serif');
    t(g, code, 82, 307, 22, blue, 'mono', 'left', 408);
    arrow(g, 535, 264, 632, 264, dim);
    t(g, description, 652, 274, 27, retry ? green : red, 'bold', 'left', 258);
    t(
      g,
      retry
        ? 'Within deadline and retry cap'
        : index === 5
          ? 'Stop until the adapter can classify the cause.'
          : 'Operator or request repair',
      60,
      435,
      23,
      ink,
    );
  } else {
    line(g, 104, 277, 840, 277, dim, 3);
    [
      ['HTTP', '200', blue],
      ['Body', 'Candidate', blue],
      ['Policy', 'Failed', red],
    ].forEach(([s, v, color], i) => {
      const x = 139 + i * 329;
      disk(g, x, 277, 13, color);
      t(g, s, x, 224, 22, dim, 'mono', 'center');
      t(g, v, x, 345, 27, color, 'bold', 'center');
    });
    label(g, 'Keep the validation failure on the task.', 57, 445, red);
  }
}
function jitter(g, c) {
  const { b, q } = timing(c);
  if (b < 2) {
    heading(g, 'Six workers   /   elapsed wait only', 'When do the retries land?');
    const spread = q(0, 'own random waits', 2.2);
    const left = 155,
      right = 859,
      x = (n) => mix(left, right, n / 3.2);
    workerDraws.forEach(([first, second], i) => {
      const y = 170 + i * 44;
      t(g, 'W' + (i + 1), 90, y + 5, 17, dim, 'mono');
      line(g, left, y, right, y, faint, 1);
      const a = mix(1, first, spread),
        z = mix(3, first + 2 * second, spread);
      line(g, x(a), y, x(z), y, blue, 2);
      disk(g, x(a), y, 6, cream, blue);
      disk(g, x(z), y, 7, blue);
    });
    disk(g, 164, 136, 6, cream, blue, 2);
    t(g, 'First retry', 181, 142, 19, ink);
    disk(g, 346, 136, 7, blue);
    t(g, 'Second retry', 363, 142, 19, ink);
    tickAxis(g, left, x(3), 416, 3, 1);
  } else {
    const full = b < 4,
      rows = jitterWindows(full),
      idx = b === 3 ? (q(3, 'For retry two', 0.4) === 1 ? 1 : 0) : b === 5 ? 1 : 0,
      row = rows[idx];
    const answer = full
      ? b === 3
        ? idx === 0
          ? q(3, 'half a second', 0.65)
          : q(3, 'wait is one second', 0.9)
        : 0
      : b === 4
        ? q(4, 'gives two seconds', 0.8)
        : q(5, 'gives three and a half seconds', 1.2);
    heading(
      g,
      full ? 'Full jitter   /   cap 8 s' : 'Decorrelated jitter   /   cap 8 s',
      'Where does the halfway draw land?',
    );
    const left = 102,
      right = 859,
      x = (n) => mix(left, right, n / 8);
    tickAxis(g, left, right, 317, 8, 1);
    box(g, x(row.low), 239, x(row.high) - x(row.low), 50, '#c7dbdb', blue, 2);
    t(g, 'Window ' + row.low + ' to ' + row.high + ' s', left, 178, 26, ink, 'serif');
    if (answer === 1) {
      line(g, x(row.wait), 224, x(row.wait), 304, red, 3);
      disk(g, x(row.wait), 221, 5, red);
    }
    const preceding =
      b === 3 && idx === 1
        ? 'Previous wait 0.5 s'
        : b === 5
          ? 'Previous sleep 2 s'
          : full
            ? 'Base 1 s'
            : 'Previous sleep 1 s';
    t(g, preceding, left, 407, 23, dim, 'mono');
    t(g, 'Draw  ½', left, 447, 20, dim, 'mono');
    if (answer === 1) label(g, 'Delay  ' + row.wait + ' s', 590, 413, blue);
  }
}
export function reservePicture(
  g,
  r,
  reveals,
  decision,
  { scale = 123, left = 78, markAt = r.remaining } = {},
) {
  const y = 253,
    x = (n) => left + scale * n;
  let used = 0;
  for (const [i, [name, length, color]] of [
    ['Floor', r.floor, brass],
    ['Jitter', r.jitter, '#8c783a'],
    ['Call', r.call, blue],
    ['Check', r.check, green],
  ].entries()) {
    const u = reveals[i];
    if (u > 0) {
      box(g, x(used), y, length * scale * u, 55, color);
      const top = i % 2 ? y - 48 : y - 13;
      line(g, x(used + length / 2), y, x(used + length / 2), top + 5, color, 1);
      t(g, name + ' ' + length + ' s', x(used + length / 2), top, 16, color, 'mono', 'center');
    }
    used += length;
  }
  tickAxis(
    g,
    left,
    x(Math.ceil(Math.max(r.required, r.remaining))),
    331,
    Math.ceil(Math.max(r.required, r.remaining)),
    1,
  );
  line(g, x(markAt), 240, x(markAt), 335, red, 3);
  t(g, markAt + ' s available', x(markAt), 160, 21, red, 'bold', 'right');
  if (decision)
    t(
      g,
      r.required.toFixed(1) +
        ' s needed     /     ' +
        (r.admitted ? 'Retry fits' : 'Stop before dispatch'),
      left,
      435,
      29,
      r.admitted ? green : red,
      'bold',
    );
}
function reservation(g, c) {
  const { b, q } = timing(c);
  if (b >= 5) {
    heading(
      g,
      'Retry ownership   /   nested loops',
      'How many times can one task reach the provider?',
    );
    const inner = b === 6 ? 1 : 3;
    for (let i = 0; i < 3; i++) {
      const y = 197 + i * 78;
      t(g, 'Wrapper call ' + (i + 1), 71, y + 6, 19, ink, 'mono');
      line(g, 294, y, 748, y, faint);
      for (let j = 0; j < inner; j++) disk(g, 333 + j * 141, y, 15, blue);
    }
    const show = b === 6 || q(5, 'Up to nine', 0.8) === 1;
    if (show) label(g, 3 * inner + ' provider attempts maximum', 77, 445, green);
    return;
  }
  if (b === 1) {
    heading(g, 'Retry-After   /   parse before admission', 'Where does the floor come from?');
    const rows = [
      ['delay-seconds', '2', '2 s'],
      ['HTTP date', 'in the past', '0 s'],
      ['Malformed', 'unknown', 'explicit fallback'],
    ];
    rows.forEach(([name, raw, result], i) => {
      const y = 198 + i * 87;
      t(g, name, 65, y, 22, ink, 'bold');
      t(g, raw, 356, y, 20, dim, 'mono');
      arrow(g, 529, y - 6, 625, y - 6, dim);
      t(g, result, 656, y, 21, green, 'bold');
    });
    return;
  }
  heading(
    g,
    'Admission   /   wait + call + validation',
    b === 3 ? 'Can the same retry still fit?' : 'Reserve the entire retry',
  );
  const remaining = b >= 3 ? 5.5 : 6,
    r = deadlineReservation(remaining);
  const floor = q(0, 'asks for two seconds', 0.8),
    j = q(0, 'half a second', 0.9);
  const call = q(2, 'three-second allowance', 0.8),
    check = q(2, 'four tenths', 0.8);
  reservePicture(
    g,
    r,
    [floor, j, call, check],
    b === 2 ? q(2, 'can schedule', 0.6) === 1 : b === 4 && q(4, 'Stop before the wait', 0.65) === 1,
  );
}
function contact(g, x, y, lift, color) {
  line(g, x - 102, y, x - 35, y, color, 5);
  line(g, x + 39, y, x + 112, y, color, 5);
  line(g, x - 35, y, x + 35, y - 47 * lift, color, 6);
  for (const xx of [x - 35, x + 39]) disk(g, xx, y, 7, night, color, 3);
}
function breaker(g, c) {
  const { b, q } = timing(c);
  heading(
    g,
    'Primary circuit   /   dependency health',
    b === 0 ? 'Which failures belong to the breaker?' : 'What changes when the contact opens?',
    true,
  );
  if (b === 0) {
    [
      ['429 · rate limit', 'Bounded retry'],
      ['Credit exhausted', 'Quota repair'],
      ['Unauthorized', 'Access repair'],
    ].forEach(([s, v], i) => {
      const y = 213 + 84 * i;
      t(g, s, 89, y, 24, cream, 'mono');
      arrow(g, 392, y - 7, 535, y - 7, pale);
      t(g, v, 571, y, 27, i === 0 ? glow : amber, 'bold');
    });
    return;
  }
  const count = Number(q(1, 'first adds one', 0.8) === 1) + Number(q(1, 'second opens', 0.8) === 1);
  const test = q(2, 'one probe', 1),
    openNow = count === 2;
  const success = q(2, 'Success closes', 0.8),
    failure = q(2, 'another failure', 0.8);
  const lift = Math.max(openNow ? 1 - success : 0, failure);
  contact(g, 490, 285, lift, lift ? amber : glow);
  line(g, 90, 285, 388, 285, pale, 2);
  line(g, 602, 285, 850, 285, pale, 2);
  t(g, 'Router', 86, 238, 22, cream, 'bold');
  t(g, 'Primary', 855, 238, 22, cream, 'bold', 'right');
  if (test > 0) {
    if (!success) {
      disk(g, 541, 238, 15, amber);
      t(g, '1 probe', 541, 207, 18, amber, 'mono', 'center');
    }
    t(
      g,
      failure
        ? 'If the probe fails   /   open again'
        : success
          ? 'If the probe succeeds   /   closed'
          : 'Half-open   /   one probe',
      86,
      435,
      25,
      success && !failure ? glow : amber,
      'bold',
    );
  } else {
    t(g, count + ' / ' + permit.threshold + ' qualifying failures', 85, 399, 25, cream, 'mono');
    t(
      g,
      openNow ? 'OPEN · divert or fail fast' : 'CLOSED · primary admits requests',
      86,
      455,
      23,
      openNow ? amber : glow,
      'bold',
    );
  }
}
function gate(g, c) {
  const { b, q } = timing(c);
  if (b === 0) {
    heading(g, 'Recovery clock   /   consecutive failures', 'When does the cooldown start?', true);
    const x = (n) => 99 + (n - 100) * 59;
    for (const [i, n] of [100, 101, 102, 103, 104, 113].entries()) {
      const show = [
        1,
        q(0, 'Its failure comes', 0.55),
        q(0, 'second request', 0.55),
        q(0, 'Its failure opens', 0.55),
        q(0, 'next request', 0.55),
        q(0, 'ten-second cooldown', 1),
      ][i];
      if (show) {
        line(g, x(n), 254, x(n), 304, pale, 1.5);
        disk(g, x(n), 254, 7, [glow, amber, glow, amber, pale, pale][i]);
        t(g, n, x(n), 337, 16, pale, 'mono', 'center');
      }
    }
    line(g, x(100), 254, x(113), 254, pale, 2);
    if (q(0, 'ten-second cooldown', 1) > 0) {
      box(g, x(103), 232, 590 * q(0, 'ten-second cooldown', 1.3), 22, amber);
      t(g, '10 s cooldown', x(107), 206, 24, amber, 'bold');
    }
    if (q(0, 'Its failure comes', 0.7) === 1)
      t(
        g,
        q(0, 'Its failure opens', 0.7) === 1
          ? 'Failures at 101 s and 103 s · primary opens'
          : 'First failure at 101 s · primary stays closed',
        98,
        427,
        21,
        cream,
        'mono',
      );
    return;
  }
  if (b === 5) {
    heading(
      g,
      'Fallback approval   /   failure domains',
      'Can the backup serve this account?',
      true,
    );
    box(g, 61, 173, 398, 202, null, pale, 2);
    box(g, 522, 173, 378, 202, null, pale, 2);
    t(g, 'Primary region', 84, 219, 27, cream, 'serif');
    t(g, 'Other region', 548, 219, 27, cream, 'serif');
    for (const [x, s] of [
      [85, 'Zone A'],
      [252, 'Zone B'],
      [549, 'Supported deployment'],
    ]) {
      box(g, x, 263, s.length < 7 ? 143 : 318, 67, '#26474a');
      t(g, s, x + 12, 305, 19, glow, 'mono');
    }
    t(g, 'Check permission, retention, capacity, schema and the result.', 60, 415, 20, cream);
    return;
  }
  if (b >= 6) {
    heading(
      g,
      'Concurrent router workers   /   atomic permit',
      b === 6 ? 'Can two workers acquire one slot?' : 'Can this reply change the breaker?',
      true,
    );
    const old = b === 7;
    fieldDark(g, old ? 'Delayed reply' : 'Worker A', old ? 'GEN 7' : 'Acquire', 64, 198);
    fieldDark(g, old ? 'Current owner' : 'Worker B', old ? 'GEN 8' : 'Acquire', 64, 309);
    box(g, 510, 177, 362, 206, '#0a2026', pale, 2);
    t(g, 'Primary probe slot', 691, 225, 24, cream, 'serif', 'center');
    const owner = old ? probeC.state : probeA.state;
    const grant = old || q(6, 'Grant it atomically', 0.9) === 1;
    t(
      g,
      grant ? owner.owner + '   /   GEN ' + owner.generation : 'Empty',
      691,
      312,
      34,
      grant ? glow : pale,
      'mono',
      'center',
    );
    if (old && q(7, 'They differ', 0.55) === 1)
      t(g, '7 ≠ 8     /     Discard the stale reply', 65, 452, 25, amber, 'bold');
    if (!old && grant) t(g, 'One grant   /   expires unless renewed', 64, 453, 23, amber, 'mono');
    return;
  }
  const arrived = q(1, 'A and B reach', 1.2),
    claimed = q(2, 'takes the slot', 0.9);
  const diverted = q(3, 'B takes the approved fallback', 1.4),
    failed = q(3, "A's failure", 0.8) === 1;
  const next = q(3, 'C gets the slot', 0.9),
    done = q(3, 'probe succeeds', 0.7) === 1,
    d = q(3, 'D can go', 1);
  const replay = b === 4;
  heading(
    g,
    'Recovery gate   /   one primary probe',
    replay ? 'Does this account permit fallback?' : 'Who owns the probe?',
    true,
  );
  const waitingA = [435, 235],
    waitingB = [435, 289],
    slot = [645, 259],
    backup = [770, 383];
  const throat = [490, 259],
    approachA = [[115, 215], [310, 215], waitingA],
    approachB = [[115, 331], [310, 331], waitingB];
  path(g, [...approachA, throat, slot, [833, 259]], pale, 2);
  path(g, [...approachB, throat, [520, 383], backup], pale, 2);
  // A single machined socket has room for exactly one request token.
  const sx = slot[0],
    sy = slot[1];
  const jaws = [
    [sx - 43, sy - 31],
    [sx - 32, sy - 45],
    [sx + 47, sy - 45],
    [sx + 47, sy + 45],
    [sx - 32, sy + 45],
    [sx - 43, sy + 31],
    [sx + 27, sy + 31],
    [sx + 27, sy - 31],
  ];
  path(g, jaws, '#749d96', 1, true);
  for (const dy of [-38, 38]) {
    disk(g, sx + 36, sy + dy, 3.8, night);
    line(g, sx + 34, sy + dy, sx + 38, sy + dy, pale, 1);
  }
  disk(g, sx, sy, 24, night, '#537772', 1.5);
  t(g, 'Primary probe', 647, 173, 22, glow, 'bold', 'center');
  t(g, 'Fallback', 770, 343, 22, amber, 'bold', 'center');
  t(
    g,
    (replay
      ? expires
      : done
        ? d
          ? 127
          : 126
        : next
          ? 125
          : failed
            ? q(3, 'next arrival', 0.5) === 1
              ? 116
              : 115
            : expires) + ' s',
    60,
    165,
    26,
    cream,
    'mono',
  );
  const granting = !replay && ((claimed > 0 && claimed < 1) || (next > 0 && next < 1));
  const occupied = replay || (claimed === 1 && !failed) || (next === 1 && !done);
  if (replay || !failed)
    moving(
      g,
      claimed || replay ? [waitingA, throat, slot] : approachA,
      replay ? 1 : claimed || arrived,
      blue,
      'A',
      22,
    );
  if (!failed || replay) {
    const toBackup = !replay ? diverted : 0;
    if (toBackup) moving(g, [waitingB, throat, [520, 383], backup], toBackup, brass, 'B', 22);
    else moving(g, approachB, replay || b >= 2 ? 1 : arrived, brass, 'B', 22);
  }
  if (failed && !replay && !done && next === 0)
    moving(g, [waitingB, throat, [520, 383], backup], q(3, 'next arrival', 1), brass, 'R', 20);
  if (next > 0 && !replay && !done) moving(g, [waitingA, throat, slot], next, green, 'C', 22);
  if (done && !replay && d > 0) moving(g, [waitingA, throat, slot, [833, 259]], d, blue, 'D', 22);
  const verdict = replay
    ? q(4, 'Return a routing failure', 0)
      ? '1 day allowed  /  7 days retained  /  ' + deniedB.route
      : q(4, 'seven days', 0)
        ? '1 day allowed  /  7 days retained'
        : q(4, 'one day', 0) ? '1 day allowed' : 'Check account retention'
    : done
      ? 'Closed   /   regular primary traffic'
      : failed && next === 0
        ? 'Open   /   cooldown restarts'
        : granting
          ? 'Granting the probe to ' + (next ? probeC.state.owner : probeA.state.owner)
          : occupied
            ? 'Half-open   /   ' + (next ? probeC.state.owner : probeA.state.owner) + ' owns the slot'
            : 'Cooldown expired   /   one slot available';
  t(g, verdict, 62, 458, 22, replay ? amber : cream, 'mono', 'left', 843);
}
function fieldDark(g, name, value, x, y) {
  t(g, name, x, y, 18, pale, 'mono');
  t(g, value, x, y + 48, 32, cream, 'bold');
}

function intent(g, c) {
  const { b, q } = timing(c),
    first = q(1, 'creates job', 0.7),
    retry = q(2, 'service finds', 0.9),
    lost = q(1, 'acknowledgment gets lost', 1);
  heading(
    g,
    'Authorized action   /   tenant + intent',
    b === 0 ? 'What turns eligibility into a write?' : 'Does the retry create another job?',
  );
  const record = idempotentJobTrace(retry === 1 ? 2 : first === 1 ? 1 : 0);
  t(g, 'Caller', 70, 180, 28, ink, 'serif');
  t(g, 'Job service', 599, 180, 28, ink, 'serif');
  const tracks = [229, 333];
  tracks.forEach((y, i) => {
    line(g, 87, y, 555, y, faint, 2);
    if (i === 0 || b === 2) {
      const u = i === 0 ? first : retry;
      tag(
        g,
        i === 0 && b === 0 ? 'read only' : '7e3b',
        mix(86, 400, u),
        y - 22,
        137,
        45,
        i === 0 ? blue : green,
      );
    }
  });
  paper(g, 582, 200, 307, 175);
  t(g, 'Intent   7e3b', 605, 258, 22, ink, 'mono');
  t(
    g,
    record.jobs ? record.first.jobId : 'No job yet',
    605,
    325,
    33,
    record.jobs ? green : dim,
    'bold',
  );
  if (b === 1 && lost) {
    line(g, 565, 286, mix(565, 318, lost), 286, red, 2);
    if (lost === 1) t(g, '×', 309, 293, 26, red, 'bold');
  }
  const outcome =
    b === 0
      ? 'Check current state and authorize the write.'
      : b === 1
        ? lost === 1
          ? 'Caller lost the acknowledgment.'
          : record.jobs
            ? 'Destination has stored the job.'
            : 'Authorized request in transit.'
        : record.retry
          ? 'created = false     /     jobs = ' + record.jobs
          : 'Same tenant, key and arguments';
  t(g, outcome, 66, 446, 24, ink, 'mono', 'left', 833);
}
function uncertainty(g, c) {
  const { b, q } = timing(c);
  heading(
    g,
    'Write recovery   /   tenant + intent key',
    b === 0
      ? 'What survives a restart?'
      : b === 3
        ? 'Is next month the same intent?'
        : 'Who knows whether the write happened?',
  );
  if (b === 3) {
    const second = q(3, 'new intent', 0.75);
    for (const [i, name] of ['Original rotation', 'Later rotation'].entries()) {
      const y = 195 + 124 * i;
      t(g, name, 75, y + 32, 24, ink, 'serif');
      tag(g, i === 0 ? '7e3b' : 'new key', 356, y, 161, 54, i === 0 ? blue : green);
      arrow(g, 539, y + 27, 650, y + 27, dim);
      t(
        g,
        i === 0 ? 'JOB-001' : second ? 'Separate history' : 'Authorize first',
        682,
        y + 35,
        22,
        ink,
        'bold',
      );
    }
  } else {
    const restarted = q(0, 'restart the server', 0.7) === 1;
    const durable = b > 0;
    paper(g, 55, 174, 393, 229);
    paper(g, 521, 174, 381, 229);
    t(g, durable ? 'Durable claim' : 'Process memory', 77, 224, 27, ink, 'serif');
    t(g, 'Destination', 547, 224, 27, ink, 'serif');
    t(
      g,
      durable ? 'tenant + 7e3b' : restarted ? 'Empty after restart' : '7e3b → JOB-001',
      80,
      284,
      23,
      durable ? green : blue,
      'mono',
      'left',
      341,
    );
    t(g, durable ? 'fingerprint · pending' : 'Sequential dictionary', 80, 338, 18, dim, 'mono');
    t(
      g,
      b === 0 ? 'JOB-001' : b === 1 ? 'Outcome unknown' : 'Look up 7e3b',
      545,
      287,
      25,
      b === 1 ? brass : green,
      'bold',
    );
    if (b === 2) t(g, 'or deduplicate same key', 545, 337, 19, dim);
    t(
      g,
      b === 0
        ? 'A second worker can also race the first lookup.'
        : b === 1
          ? 'Crash after dispatch   /   the local row still says pending.'
          : 'Use the destination receipt to reconcile the local claim.',
      59,
      150,
      20,
      ink,
    );
  }
}
function format(g, c) {
  const { b, q } = timing(c);
  heading(
    g,
    'Structured output   /   successful completion',
    b === 3
      ? 'Which responses go to the parser?'
      : b === 2
        ? 'What must a recursive grammar remember?'
        : 'Which decisions fit through the schema?',
  );
  if (b === 0) {
    tag(g, 'eligible', 68, 196, 187, 49, blue);
    tag(g, 'not_eligible', 68, 283, 187, 49, blue);
    for (const y of [221, 308]) arrow(g, 274, y, 537, y, dim);
    line(g, 402, 157, 402, 200, ink, 7);
    line(g, 402, 244, 402, 285, ink, 7);
    line(g, 402, 329, 402, 372, ink, 7);
    t(g, 'Allowed enum', 405, 413, 19, dim, 'mono', 'center');
    paper(g, 570, 180, 330, 187);
    t(g, 'Account check', 590, 228, 25, ink, 'serif');
    t(g, 'Stale key · ' + trusted.ageDays + ' d ≥ ' + trusted.thresholdDays + ' d',
      590, 283, 22, green, 'mono', 'left', 286);
    if (q(0, 'look up', 0.7) === 1) t(g, 'eligible', 590, 334, 27, green, 'bold');
  } else if (b === 1) {
    paper(g, 83, 141, 797, 295);
    [
      'text.format',
      '    type  =  json_schema',
      '    strict  =  true',
      '    required  =  decision, age field, source IDs',
      '    additionalProperties  =  false',
    ].forEach((s, i) =>
      t(g, s, 110, 201 + i * 46, i === 0 ? 28 : 21, i === 0 ? blue : ink, 'mono', 'left', 749),
    );
  } else if (b === 2) {
    const levels = 1 + Math.floor(2.99 * q(2, 'track nested structures', 1.5));
    for (let i = 0; i < levels; i++) {
      const x = 97 + i * 104,
        y = 157 + i * 43,
        w = 743 - i * 208,
        h = 247 - i * 86;
      box(g, x, y, w, h, null, i === levels - 1 ? blue : dim, 2);
      t(g, '{', x + 10, y + 32, 27, blue, 'mono');
      t(g, '}', x + w - 30, y + h - 12, 27, blue, 'mono');
    }
    t(g, 'Each opening brace adds one closing obligation.', 96, 429, 23, ink);
  } else {
    [
      ['Refusal', 'Return refusal'],
      ['Incomplete / empty', 'Named failure'],
      ['Completed text', 'Parse → validate'],
    ].forEach(([name, result], i) => {
      const y = 199 + i * 87;
      t(g, name, 72, y, 24, ink, 'serif');
      arrow(g, 389, y - 7, 536, y - 7, dim);
      t(g, result, 574, y, 24, i === 2 ? green : red, 'bold');
    });
  }
}
function sdk(g, c) {
  const { b, q } = timing(c);
  heading(
    g,
    'Local SDK fixture   /   Responses adapter',
    b === 0
      ? 'What bytes reached the mock?'
      : b === 1
        ? 'One adapter, four prepared replies'
        : b === 2
          ? 'Where must the corporate root go?'
          : b === 3
            ? 'Who owns the retry clock?'
            : 'What does store = false cover?',
  );
  if (b === 0) {
    tag(g, 'LLMTask', 58, 232, 176, 58);
    arrow(g, 256, 262, 347, 262, dim);
    paper(g, 371, 150, 520, 260);
    [
      'POST /v1/responses',
      'account_id: ' + trusted.accountId,
      'credential_age_days: ' + trusted.ageDays,
      'key_stale: ' + trusted.stale,
      trusted.policyId + ' minimum: ' + trusted.thresholdDays + ' days',
      'text.format    /    strict schema',
    ].forEach((s, i) =>
      t(g, s, 398, 191 + i * 39, i === 0 ? 24 : 19, i === 0 ? blue : ink, 'mono'),
    );
  } else if (b === 1) {
    const cues = ['Thirty days', 'ninety', 'refusal', 'runs out of output tokens'];
    const outcomes = ['Typed decision', 'Policy mismatch', 'Refusal', 'Incomplete'];
    ['30 days · completed', '90 days · completed', 'Refusal item', 'Output limit'].forEach(
      (s, i) => {
        const y = 172 + i * 76;
        t(g, s, 74, y + 24, 22, ink, 'mono');
        arrow(g, 400, y + 17, 519, y + 17, faint);
        if (q(1, cues[i], 0.55) > 0)
          t(g, outcomes[i], 552, y + 24, 25, i === 0 ? green : red, 'bold');
      },
    );
  } else if (b === 2) {
    const installed = q(2, 'install it in the active trust store', 1.4);
    const names = ['Server certificate', 'Corporate root', 'Active OS trust store'];
    names.forEach((s, i) => {
      const x = 157 + i * 319;
      if (i < 2) line(g, x + 35, 272, x + 278, 272, i === 1 && installed < 1 ? faint : green, 4);
      disk(g, x, 272, 37, cream, i === 1 ? brass : blue, 4);
      t(g, i === 0 ? 'TLS' : i === 1 ? 'CA' : 'OS', x, 280, 22, ink, 'mono', 'center');
      t(g, s, x, 356, 21, ink, 'bold', 'center');
    });
    if (installed === 1)
      label(g, 'Root installed in the trust path the client loads.', 61, 444, green);
  } else if (b === 3) {
    field(g, 'SDK max_retries', '0', 93, 203, 276, blue, 64);
    field(g, 'Transport timeout', '5 s', 446, 203, 310, brass, 64);
    line(g, 93, 328, 839, 328, ink, 2);
    label(g, 'The wrapper enforces the whole-task deadline.', 93, 399);
  } else {
    [
      ['Responses application state', 'store = false'],
      ['Abuse-monitoring logs', 'Check organization controls'],
      ['Tools and caches', 'Review separate retention'],
    ].forEach(([s, v], i) => {
      const y = 197 + i * 82;
      t(g, s, 63, y, 23, ink, 'serif');
      t(g, v, 493, y, 22, i === 0 ? green : brass, 'mono', 'left', 410);
      line(g, 63, y + 22, 897, y + 22, faint, 1);
    });
  }
}
export const resilienceScenes = [
  deadline,
  errors,
  jitter,
  reservation,
  breaker,
  gate,
  intent,
  uncertainty,
  format,
  sdk,
];
