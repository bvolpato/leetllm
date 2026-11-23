import {
  C,
  base,
  book,
  drawer,
  card,
  type,
  pen,
  mono,
  mid,
  rect,
  line,
  circle,
  row,
  stamp,
  phase,
  ease,
  heading,
  sheet,
} from './atelier.mjs';
import { garden, river, runHolds } from '../../../films/agent-evaluation/circulation.mjs';
import { verifyHold } from '../../../films/agent-evaluation/model.mjs';

export { garden, river, runHolds };
export const trial = (task, ...numbers) =>
  runHolds(
    task,
    numbers.map((n) => 'op-' + n),
  );
export const clean = trial(river),
  first = trial(river, 17),
  same = trial(river, 17, 17),
  extra = trial(river, 17, 18);
const attemptLabel = (attempt, suffix) =>
  attempt.receipt.operation.slice(3) + '  →  ' + attempt.receipt.hold + '    ' + suffix;
const miraFirst = trial(garden, 41),
  miraExtra = trial(garden, 41, 42),
  miraSame = trial(garden, 41, 41);
function account(c, t, state, opts = {}) {
  drawer(c, {
    owner: t.reader,
    bookId: t.book,
    version: state?.account.version,
    records: state?.account.holds,
    ...opts,
  });
}
function slip(
  c,
  { x = 100, y = 355, w = 760, title = 'Dispatch receipt', t = river, receipt, annotation },
) {
  sheet(c, x, y, w, 430, title);
  row(c, 'Reader', t.reader, x + 40, y + 154, w - 80);
  row(c, 'Book', t.book, x + 40, y + 235, w - 80);
  row(c, 'Key', receipt?.operation ?? 'pending', x + 40, y + 316, w - 80);
  mono(
    c,
    annotation ?? receipt.hold + '  /  committed v' + receipt.version,
    x + 40,
    y + 390,
    30,
    C.green,
    w - 75,
  );
}
function message(c, y = 272) {
  card(c, 778, y, 725, 187, C.light);
  mono(c, 'LIBRARY ASSISTANT', 819, y + 52, 27, C.green);
  pen(c, '“Your book is reserved.”', 816, y + 130, 61, C.ink, 642);
}
export function intro(c, k) {
  base(c);
  book(c, river, 104, 178, 1.12);
  const open = ease(phase(k, 1, 'Open Lena’s account', 0.8));
  if (open < 1) {
    c.save();
    c.globalAlpha = 1 - open;
    message(c, 116 - 50 * open + 25 * (1 - phase(k, 0, 'Your book is reserved', 0.48)));
    c.restore();
  }
  const settled = k.beat.beatIndex === 2;
  account(c, river, clean, {
    x: 865,
    y: 244,
    w: 900,
    h: 651,
    open,
    caption: settled ? '0 matching holds  ·  Fail' : null,
    affinity: C.red,
  });
}
export function reset(c, k) {
  base(c);
  const restored = phase(k, 1, 'Restore the library snapshot'),
    cleared = phase(k, 1, 'Clear the assistant'),
    expired = phase(k, 1, 'invalidate the old approval');
  const askAboutRestart = !restored && phase(k, 0, 'There’s a hold on B8');
  heading(
    c,
    'EPISODE FIXTURE',
    askAboutRestart
      ? 'Will restarting the assistant clear Lena’s holds?'
      : 'One hold on River Stories',
  );
  book(c, river, 112, 307, 0.68);
  card(c, 338, 559, 470, 258, C.sheet);
  mono(c, 'ASSISTANT MEMORY', 370, 613, 27);
  row(c, 'Cache', cleared ? 'empty' : 'B8 lookup', 370, 675, 398);
  row(
    c,
    'Permit',
    expired ? 'invalidated' : 'prior call',
    370,
    766,
    398,
    expired ? C.green : C.red,
  );
  drawer(c, {
    x: 930,
    y: 278,
    w: 860,
    h: 610,
    owner: 'Lena',
    bookId: 'all books',
    version: restored ? 2 : 12,
    records: restored ? [] : [{ id: 'old-4', book: 'B8' }],
    caption: restored ? 'Restored snapshot' : 'Inherited account',
    affinity: restored ? C.green : C.wood,
  });
  if (phase(k, 1, 'Freeze the request'))
    mono(
      c,
      'Frozen episode: one B7 hold   /   permitted tools   /   budget   /   checks',
      111,
      952,
      30,
      C.muted,
      1680,
    );
}
export function dispatch(c, k) {
  base(c);
  const got = phase(k, 0, 'The catalog returns'),
    permitted = phase(k, 1, 'permits this call'),
    sent = phase(k, 2, 'Dispatch operation seventeen'),
    committed = phase(k, 2, 'adds hold seventeen');
  heading(
    c,
    'CIRCULATION   /   LENA',
    committed
      ? 'The library commits the hold'
      : sent
        ? 'The request leaves the host'
        : permitted
          ? 'The host permits operation 17'
          : k.beat.beatIndex === 0
            ? 'Look up the title'
            : 'Request a hold for Lena',
  );
  if (k.beat.beatIndex === 0) {
    book(c, river, 121, 289, 0.85);
    sheet(c, 782, 365, 876, 370, 'Catalog lookup');
    row(c, 'Title', 'River Stories', 830, 525, 773);
    if (got) row(c, 'Book ID', river.book, 830, 639, 773, C.green);
    return;
  }
  const run = committed ? first : clean;
  slip(c, {
    title: committed ? 'Dispatch receipt' : 'Write request',
    receipt: first.attempts[0].receipt,
    annotation: committed
      ? 'hold-17  /  committed v3'
      : sent
        ? 'Dispatched'
        : permitted
          ? 'Permitted  /  awaiting dispatch'
          : 'Requested  /  awaiting permission',
  });
  account(c, river, run, {
    x: 948,
    y: 277,
    w: 856,
    h: 630,
    caption: committed ? 'One saved hold' : null,
  });
}
export function comparedRead(t, run, variant) {
  const write = run.attempts[0].receipt;
  const read = { ...run.read };
  if (variant === 'book') read.book = 'B8';
  if (variant === 'old') read.version = write.version - 1;
  if (variant === 'both') {
    read.book = 'B8';
    read.version = write.version - 1;
    read.ids = [];
    read.count = 0;
    read.hold = false;
  }
  const forbidden = variant === 'denied';
  return {
    read,
    write,
    forbidden,
    passed: verifyHold({ authorized: true, attemptedForbidden: forbidden, write, read }, t),
  };
}
function comparison(c, t, run, variant, { ready = true, verdict = true, highlight = true } = {}) {
  const f = comparedRead(t, run, variant);
  const x = 140,
    y = 278,
    w = 762;
  sheet(c, x, y, w, 496, 'Permitted write');
  sheet(c, 1009, y, w, 496, 'Independent read');
  const cols = [
    ['Reader', t.reader, f.read.reader],
    ['Book', f.write.book, f.read.book],
    ['Version', 'commit ' + f.write.version, 'snapshot ' + f.read.version],
    ['Hold ID', f.write.hold, f.read.ids.join(', ') || 'none'],
  ];
  cols.forEach(([name, left, right], i) => {
    row(c, name, left, x + 38, y + 158 + 80 * i, w - 76);
    row(
      c,
      name,
      ready ? right : 'awaiting read',
      1047,
      y + 158 + 80 * i,
      w - 76,
      ready &&
        highlight &&
        ((i === 1 && left !== right) ||
          (i === 2 && f.read.version < f.write.version) ||
          (i === 3 && f.read.count !== 1))
        ? C.red
        : C.ink,
    );
  });
  if (verdict) {
    const label = f.forbidden
      ? 'Forbidden attempt  ·  Block'
      : f.passed
        ? 'One matching hold  ·  Pass'
        : variant === 'old'
          ? 'Stale snapshot  ·  Fail'
          : variant === 'both'
            ? 'Wrong book and stale snapshot'
            : 'Wrong book  ·  Fail';
    stamp(c, label, 1009, 817, f.passed ? C.green : C.red, 766);
  }
  if (f.forbidden) mono(c, 'Private read denied  /  0 records returned', 141, 866, 30, C.red, 805);
}
export function verify(c, k) {
  base(c);
  heading(c, 'ACCOUNT VERIFICATION', 'Compare the two records');
  const b = k.beat.beatIndex;
  let variant = 'match';
  if (b === 1)
    variant = phase(k, 1, 'change just the read version')
      ? 'old'
      : phase(k, 1, 'Put B seven back')
        ? 'match'
        : phase(k, 1, 'changing just the book')
          ? 'book'
          : 'match';
  if (b === 2 && phase(k, 2, 'one forbidden attempt')) variant = 'denied';
  comparison(c, river, first, variant, {
    ready: !!phase(k, 0, 'returns a snapshot'),
    verdict: !!phase(k, 1, 'This run passes'),
  });
}
export function recover(c, k) {
  base(c);
  const b = k.beat.beatIndex;
  if (!b) {
    const second = phase(k, 0, 'charge a second dispatch'),
      got = phase(k, 0, 'B7 comes back'),
      lost = phase(k, 0, 'lose the reply');
    heading(
      c,
      'RECOVERY   /   LENA',
      lost ? 'A write reply goes missing' : 'A catalog read times out',
    );
    sheet(c, 124, 340, 745, 430, lost ? 'Write dispatch' : 'Lookup dispatches');
    row(c, lost ? 'Operation' : 'Attempt 1', lost ? 'op-17' : 'timeout', 169, 502, 654);
    if (second)
      row(
        c,
        lost ? 'Reply' : 'Attempt 2',
        lost ? 'lost' : got ? 'B7 returned' : 'sent',
        169,
        610,
        654,
      );
    drawer(c, { x: 993, y: 276, w: 776, h: 616, owner: 'Lena', bookId: 'B7', open: 0 });
    mono(c, lost ? 'Commit status unknown to assistant' : 'Independent account', 1000, 942, 30);
    return;
  }
  if (b === 4) {
    const expired = phase(k, 4, 'permission has expired'),
      probes = phase(k, 4, 'Test stale reads');
    heading(
      c,
      'RETRY POLICY',
      expired ? 'Recheck authority before dispatch' : 'What makes replay safe?',
    );
    slip(c, { title: 'Original request', receipt: first.attempts[0].receipt });
    sheet(c, 975, 355, 803, 430, 'Retry request');
    row(c, 'Payload', 'Lena / B7', 1014, 505, 722);
    row(c, 'Operation', 'op-17', 1014, 598, 722);
    stamp(
      c,
      expired ? 'Expired permit  ·  Stop' : 'Same key + replay guarantee',
      1014,
      648,
      expired ? C.red : C.green,
      727,
    );
    if (probes)
      mono(
        c,
        'Other cases   /   stale read     malformed call     exhausted budget',
        135,
        883,
        29,
        C.muted,
        1630,
      );
    return;
  }
  const leftRetry = phase(k, 2, 'Send seventeen again'),
    rightRetry = phase(k, 2, 'send eighteen on the right'),
    grade = b === 3;
  const leftSaved = phase(k, 2, 'returns its saved receipt'),
    rightSaved = phase(k, 2, 'creates a second hold');
  const left = leftSaved ? same : first,
    right = rightSaved ? extra : first;
  heading(
    c,
    'LOST WRITE REPLY   /   TWO COPIES OF THE SAME ACCOUNT',
    'Which retry leaves one hold?',
  );
  [
    [left, 100, 'Reuse key 17', leftRetry, leftSaved],
    [right, 1000, 'Use key 18', rightRetry, rightSaved],
  ].forEach(([run, x, title, retried, saved]) => {
    pen(c, title, x + 10, 301, 48);
    account(c, river, run, {
      x,
      y: 337,
      w: 816,
      h: 549,
      showKeys: true,
      caption: grade ? (run.passed ? '1 match  ·  Pass' : '2 matches  ·  Fail') : null,
      affinity: run.passed ? C.green : C.red,
    });
    mono(
      c,
      (retried ? 2 : 1) +
        ' write dispatch' +
        (retried ? 'es' : '') +
        '   /   ' +
        (saved
          ? run.attempts[1].replay
            ? 'saved receipt'
            : 'new receipt'
          : retried
            ? 'awaiting reply'
            : 'reply lost'),
      x + 12,
      943,
      29,
      C.ink,
      805,
    );
  });
}
export function surfaces(c, k) {
  base(c);
  const b = k.beat.beatIndex;
  heading(
    c,
    'GRADER ACCESS',
    b === 0
      ? 'What did the website display?'
      : b === 1
        ? 'What did the database save?'
        : 'Who authorized this write?',
  );
  if (!b) {
    rect(c, 295, 296, 1330, 574, C.ink, 18);
    rect(c, 312, 355, 1296, 497, C.sheet, 5);
    [346, 376, 406].forEach((X) => circle(c, X, 327, 8, C.gold));
    mono(c, 'catalog   /   reservations', 456, 339, 29, C.paper);
    book(c, river, 402, 412, 0.56);
    pen(c, 'River Stories', 831, 529, 74);
    type(c, 'Your book is reserved.', 834, 656, 57, C.green);
    return;
  }
  if (b === 1) {
    book(c, river, 160, 327, 0.81);
    account(c, river, first, { x: 936, y: 287, w: 823, h: 614, caption: '1 matching hold' });
    return;
  }
  slip(c, {
    title: 'Trusted host decision',
    receipt: first.attempts[0].receipt,
    annotation: 'Permit   /   before dispatch',
  });
  account(c, river, first, { x: 951, y: 281, w: 835, h: 618, caption: 'Independent read' });
}
export function closing(c, k) {
  base(c);
  const b = k.beat.beatIndex;
  if (b <= 1) {
    const fixed = phase(k, 1, 'There’s hold seventeen');
    heading(
      c,
      'FINAL PRACTICE   /   LENA',
      b === 0 ? 'Which record would you replace?' : 'Keep the receipt and repeat the read',
    );
    comparison(c, river, first, fixed ? 'match' : 'both', { highlight: b === 1, verdict: !!fixed });
    return;
  }
  const reading = phase(k, 2, 'successful read'),
    reset = b >= 5,
    writing = phase(k, 5, 'write commits'),
    retry = phase(k, 5, 'reuse key forty-one'),
    finalRead = phase(k, 6, 'There’s hold forty-one');
  const state = reset ? (writing ? (retry ? miraSame : miraFirst) : trial(garden)) : miraExtra;
  const show = reset
    ? b === 5
      ? 1 - ease(phase(k, 5, 'Dispatch key forty-one', 0.65))
      : ease(phase(k, 6, 'Read Mira’s', 0.65))
    : ease(phase(k, 2, 'successful read', 0.65));
  book(c, garden, 103, 176, 1.08);
  mono(c, reset ? 'REPLAY FROM v7' : 'ONE HOLD REQUESTED', 115, 130, 29);
  account(c, garden, state, {
    x: 895,
    y: 210,
    w: 880,
    h: 667,
    open: show,
    caption: reset
      ? finalRead
        ? 'Exactly one  ·  Pass'
        : null
      : b >= 3
        ? 'Two matching holds  ·  Fail'
        : null,
    affinity: reset ? C.green : C.red,
  });
  if (!reset && b === 3) mono(c, 'First commit v8   /   independent read v9', 972, 937, 30, C.ink);
  if (!reset && b === 2 && !reading) mono(c, 'Write committed at v8', 933, 935, 35, C.ink);
  else if (!reset && b === 2)
    mono(c, 'Permitted write v8   /   later read v9', 922, 936, 32, C.ink);
  if (!reset && b >= 3) {
    const trace = phase(k, 3, 'look up the second hold');
    card(c, 283, 676, 672, 203, C.lavender);
    mono(c, 'TRUSTED WRITE TRACE', 312, 722, 25);
    mono(c, attemptLabel(miraExtra.attempts[0], 'reply lost'), 312, 782, 32, C.ink);
    if (trace && phase(k, 3, 'retry used key forty-two'))
      mono(c, attemptLabel(miraExtra.attempts[1], 'new write'), 312, 838, 32, C.red);
    if (b === 4 && phase(k, 4, 'Zero'))
      mono(c, 'Known case   /   untouched trials = 0', 990, 942, 30);
  }
  if (reset) {
    card(c, 285, 674, 659, 213, C.lavender);
    mono(c, 'DISPATCH LOG   /   MIRA + B9', 314, 722, 25);
    if (!writing && phase(k, 5, 'Dispatch key forty-one'))
      mono(c, '41    dispatched', 315, 782, 33, C.ink);
    if (writing) mono(c, attemptLabel(state.attempts[0], 'reply lost'), 315, 782, 33, C.ink);
    if (retry)
      mono(
        c,
        phase(k, 5, 'returns its saved receipt')
          ? attemptLabel(state.attempts[1], 'saved reply')
          : '41    same payload, sent again',
        315,
        842,
        33,
        C.green,
      );
    if (b === 5)
      mono(
        c,
        writing ? 'Committed v8   /   account read pending' : 'Reset snapshot v7',
        956,
        937,
        31,
      );
  }
}
