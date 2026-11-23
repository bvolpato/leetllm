import {
  C,
  base,
  cue,
  caption,
  slip,
  box,
  label,
  line,
  arrow,
  text,
  dot,
  stamp,
  rail,
} from './art.mjs';
import {
  sequence,
  batchDigest,
  batchLedger,
  reviewStats as stats,
  means,
  windowCase,
  included,
  rollingTotal,
} from './examples.mjs';

export function batch(c, k) {
  const swapped = k.beat.beatIndex === 0 && cue(k, 0, 'Swapping two notes');
  const started = k.beat.beatIndex >= 1;
  const receipts = cue(k, 1, 'Forty-one notes have verified receipts');
  const timed = cue(k, 1, 'reply timed out');
  const selected = cue(k, 2, 'Look up item forty-two');
  const ordered = swapped ? [sequence[1], sequence[0], ...sequence.slice(2)] : sequence;
  const fingerprint = batchDigest(ordered).slice(0, 10);
  base(
    c,
    'Publication ledger   /   50 release notes',
    started ? 'Where should recovery begin?' : 'What set did the reviewer see?',
  );
  label(
    c,
    started
      ? 'APPROVED ORDER   /   DURABLE ITEM KEYS'
      : swapped
        ? 'REORDERED COPY   /   DIFFERENT DIGEST'
        : 'REVIEWED ORDER   /   EXACT ITEMS',
    88,
    305,
  );
  const x = 89,
    y = 350,
    stepX = 113,
    stepY = 94;
  ordered.forEach((item, i) => {
    const xx = x + (i % 10) * stepX,
      yy = y + Math.floor(i / 10) * stepY;
    const state = batchLedger[i].state;
    const done = receipts && state === 'Receipt',
      missing = timed && state === 'Unknown';
    const fill = done ? C.mint : missing ? C.blush : C.paper;
    box(c, xx, yy, 97, 75, fill, 5, missing ? C.red : C.line);
    text(
      c,
      item.key.split('-')[1],
      xx + 47,
      yy + 49,
      34,
      missing ? C.red : done ? C.teal : C.mute,
      'Mono',
      600,
      'center',
    );
    if (done) line(c, xx + 15, yy + 61, xx + 80, yy + 61, C.teal, 4);
    if (missing) dot(c, xx + 83, yy + 12, 5, C.red);
  });
  const side = 1296;
  if (!started) {
    label(c, 'ENVELOPE DIGEST', side, 381);
    text(c, batchDigest(sequence).slice(0, 10) + '…', side, 459, 42, C.teal, 'Mono');
    text(c, 'Reviewed order', side, 521, 37, C.mute);
    if (swapped) {
      text(c, fingerprint + '…', side, 653, 42, C.red, 'Mono');
      text(c, 'Items 1 and 2 swapped', side, 715, 34, C.mute);
    }
  } else {
    label(c, 'WORKER’S ITEM LEDGER', side, 381);
    text(
      c,
      batchLedger.filter((x) => x.state === 'Receipt').length + ' receipts',
      side,
      474,
      52,
      C.teal,
      'Serif',
    );
    if (timed) {
      text(c, '1 unknown', side, 568, 52, C.red, 'Serif');
      text(c, '8 unsent', side, 662, 52, C.mute, 'Serif');
    } else text(c, '9 without receipts', side, 568, 39, C.mute, 'Serif');
    if (selected) stamp(c, 'Query   note-42', side, 723, C.blue);
  }
  caption(
    c,
    selected
      ? 'Read the original item key. Keep every verified receipt and respect the dependency rule.'
      : started
        ? 'A shared approval still needs a separate result for every publication.'
        : 'The ordered contents, destinations, scope and preconditions travel in one envelope.',
  );
}

export function queue(c, k) {
  if (k.beat.beatIndex === 3) {
    const ages = [2, 3, 4, 5, 6, 7, 60];
    const median = cue(k, 3, 'middle one'),
      tail = cue(k, 3, 'oldest has waited');
    base(c, 'Pending queue   /   Seven requests', 'How long has the oldest request waited?');
    label(c, 'AGE IN MINUTES', 88, 308);
    const floor = 770;
    line(c, 130, floor, 1780, floor);
    ages.forEach((age, i) => {
      const x = 175 + 227 * i,
        h = age * 6.6;
      const color = tail && i === 6 ? C.red : median && i === 3 ? C.teal : C.blue;
      box(c, x, floor - h, 137, h, color, 2);
      text(c, age + ' min', x + 68, floor - h - 25, 37, color, 'Mono', 500, 'center');
    });
    caption(
      c,
      tail
        ? 'Median   5 min     ·     oldest   60 min     ·     inspect expirations by tool and tier'
        : median
          ? 'The fourth request is the median of seven ordered waits.'
          : 'Order pending requests by age. Each bar uses the same scale.',
    );
    return;
  }
  const seeds = cue(k, 1, 'uncover which packets'),
    missed = cue(k, 2, 'Packet three was approved');
  const summary = cue(k, 0, 'Across five opened');
  const x = 237,
    scale = 39,
    y = 380,
    colors = [C.ochre, C.teal];
  base(c, 'Offline review exercise   /   No live writer', 'What did the reviewers catch?');
  label(c, 'SECONDS SINCE EXERCISE START', 88, 286);
  for (const t of [0, 5, 10, 15, 20, 25]) {
    const xx = x + t * scale;
    line(c, xx, 352, xx, 793, '#c8ccbe', 2);
    text(c, t, xx, 335, 29, C.mute, 'Mono', 400, 'center');
  }
  label(c, 'Decision', 1250, 331);
  if (seeds) label(c, 'Known condition', 1540, 331);
  stats.rows.forEach((row, i) => {
    const yy = y + i * 72;
    text(c, row.id, 92, yy + 31, 36, C.ink, 'Mono');
    const opened = row.started !== null;
    box(
      c,
      x + row.submitted * scale,
      yy + 7,
      ((opened ? row.started : row.expires) - row.submitted) * scale,
      23,
      opened ? colors[0] : '#bcb9ac',
      3,
    );
    if (opened)
      box(
        c,
        x + row.started * scale,
        yy + 7,
        (row.decided - row.started) * scale,
        23,
        colors[1],
        3,
      );
    dot(c, x + (opened ? row.decided : row.expires) * scale, yy + 18, 9, opened ? C.teal : C.mute);
    text(
      c,
      opened ? (row.decision === 'approve' ? 'Approved' : 'Rejected') : 'Expired',
      1250,
      yy + 30,
      35,
      opened ? C.ink : C.mute,
    );
    if (seeds)
      text(
        c,
        row.seeded ? 'Seeded defect' : 'Clean',
        1540,
        yy + 30,
        33,
        row.seeded ? C.red : C.mute,
      );
    if (missed && row.seeded && row.decision === 'approve')
      box(c, 1218, yy - 15, 592, 66, null, 7, C.red);
  });
  box(c, 92, 825, 34, 12, colors[0]);
  text(c, 'Queue wait', 140, 844, 28, C.mute);
  box(c, 405, 825, 34, 12, colors[1]);
  text(c, 'Review time', 453, 844, 28, C.mute);
  box(c, 773, 825, 34, 12, '#bcb9ac');
  text(c, 'Unopened until expiry', 821, 844, 28, C.mute);
  caption(
    c,
    missed
      ? 'Caught   ' +
          stats.caught.length +
          ' / ' +
          stats.seeded.length +
          ' seeded defects     ·     false alarms   0 / 2 clean decisions'
      : seeds
        ? 'Which planted defect did a reviewer approve?'
        : k.beat.beatIndex === 1
          ? '3 approvals / 5 decisions. One packet expired unopened.'
          : summary
            ? 'Mean wait    26 / 5 = ' +
              means.wait +
              ' s       Mean review    32 / 5 = ' +
              means.review +
              ' s'
            : 'P1 waited from 0 to 4 seconds. Its review lasted from 4 to 10.',
  );
}

export function weekend(c, k) {
  if (k.beat.beatIndex === 3) {
    const fail = cue(k, 3, 'two failed rollouts'),
      deny = cue(k, 3, 'policy blocks');
    base(c, 'Vega’s weekend policy   /   Local clock', 'What can run at three in the morning?');
    const cx = 423,
      cy = 534,
      r = 215;
    dot(c, cx, cy, r, C.dark);
    for (let h = 0; h < 12; h++) {
      const a = (h * Math.PI) / 6 - Math.PI / 2;
      line(
        c,
        cx + (r - 26) * Math.cos(a),
        cy + (r - 26) * Math.sin(a),
        cx + (r - 11) * Math.cos(a),
        cy + (r - 11) * Math.sin(a),
        C.paper,
        5,
      );
    }
    line(c, cx, cy, cx, cy - 150, C.white, 9);
    line(c, cx, cy, cx + 106, cy, '#efb675', 14);
    dot(c, cx, cy, 12, C.pale);
    text(c, '03:00 local', cx, 820, 45, C.ink, 'Mono', 400, 'center');
    label(c, 'SERVICE HISTORY   /   PAST HOUR', 809, 369);
    if (fail) text(c, '2 failed rollouts', 809, 478, 65, C.ink, 'Serif');
    if (deny) {
      stamp(c, 'Write blocked', 809, 559, C.red);
      stamp(c, 'Scoped read allowed', 809, 655, C.teal);
    }
    caption(
      c,
      '02:00 to before 08:00 local   ·   at least two recent failures   ·   write-tier requests',
    );
    return;
  }
  if (k.beat.beatIndex === 0) {
    const add = cue(k, 0, 'Another move'),
      total = cue(k, 0, 'eighteen points count');
    base(c, 'Weekend exercise   /   Rolling increase budget', 'How much traffic was added?');
    label(c, 'ADDED TRAFFIC   /   PERCENTAGE POINTS', 88, 326);
    const x = 236,
      w = 1420,
      step = w / 20;
    box(c, x, 488, 20 * step, 85, '#d7d6c9', 4);
    box(c, x, 488, 9 * step, 85, C.teal, 4);
    if (add) box(c, x + 9 * step, 488, 9 * step, 85, C.ochre, 4);
    line(c, x + 10 * step, 409, x + 10 * step, 655, C.red, 5);
    text(c, 'Senior above 10', x + 10 * step, 384, 38, C.red, 'Sans', 600, 'center');
    text(c, '0% → 9%    +9', x, 656, 38, C.teal);
    if (add) text(c, '9% → 18%    +9', x + 10.5 * step, 656, 38, C.ochre);
    if (total) stamp(c, '18 points   ·   senior review', x, 731, C.red);
    caption(
      c,
      'Count positive increases in the last hour. Every promotion still requires approval.',
    );
    return;
  }
  const answered = cue(k, 2, 'Eleven points count');
  base(c, 'Weekend exercise   /   Trusted service history', 'Does this request cross ten points?');
  label(c, 'ONE-HOUR WINDOW   /   UTC', 88, 299);
  const xs = [218, 959, 1700],
    yy = 527;
  box(c, xs[0], yy - 54, xs[2] - xs[0], 109, C.mint, 3);
  line(c, xs[0] - 66, yy, xs[2] + 65, yy, C.teal, 5);
  xs.forEach((x, i) => {
    dot(c, x, yy, 17, i === 0 ? C.paper : C.teal, C.teal);
    const time = i === 2 ? windowCase.now : windowCase.past[i].at / 60;
    const val = i === 2 ? windowCase.proposed : windowCase.past[i].to - windowCase.past[i].from;
    text(c, '+' + val + ' points', x, yy - 102, 45, C.ink, 'Serif', 400, 'center');
    text(
      c,
      Math.floor(time / 60) + ':' + String(time % 60).padStart(2, '0'),
      x,
      yy + 134,
      42,
      C.ink,
      'Mono',
      400,
      'center',
    );
    text(
      c,
      ['Open boundary', 'Earlier increase', 'Proposed now'][i],
      x,
      yy + 202,
      34,
      C.mute,
      'Sans',
      400,
      'center',
    );
  });
  caption(
    c,
    answered
      ? included[0] +
          ' + ' +
          included[1] +
          ' + ' +
          windowCase.proposed +
          ' = ' +
          rollingTotal +
          ' points    ·    exceeds 10    ·    senior review'
      : 'Count increases in (21:10, 22:10], then include this proposed increase once.',
  );
}
