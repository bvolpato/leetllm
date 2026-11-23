import * as E from './examples.mjs';
import { C, short, pct, mix } from './drawing.mjs';

function lock(g, x, y, open) {
  g.ctx.beginPath();
  g.ctx.arc(x + 15 + (open ? 8 : 0), y - 4, 9, Math.PI, 0);
  g.ctx.strokeStyle = open ? C.stable : C.red;
  g.ctx.lineWidth = 4;
  g.ctx.stroke();
  g.rect(x, y - 4, 31, 24, open ? C.stable : C.red, 4);
  g.dot(x + 15, y + 6, 2.5, C.white);
}
export function shadow(g) {
  const { beat, cue, head, txt, mono, rect, paper, path, line, seal, roller } = g;
  head(
    'Shadow lane  /  read-only copies',
    beat < 4 ? 'Which output reaches the user?' : 'Who gets the third reply?',
  );
  if (beat < 4) {
    const candidate = cue(1, 'a minimized copy');
    path(
      [
        [74, 207],
        [873, 207],
      ],
      C.stable,
      6,
    );
    path(
      [
        [229, 207],
        [337, 318],
        [872, 318],
      ],
      candidate ? C.candidate : C.rule,
      4,
    );
    g.dot(229, 207, 9, C.ink);
    txt('Policy question', 59, 168, 23, C.ink, { face: 'Serif' });
    mono('STABLE', 409, 194, 18, C.stable);
    mono('CANDIDATE', 410, 304, 18, C.candidate);
    seal('User reply', 737, 185, C.stable, 159);
    if (candidate) seal('Evaluator', 737, 296, C.candidate, 159);
    if (beat >= 2) {
      const write = cue(2, 'Now try the deployment tool');
      const tool = write ? 'deploy application' : 'read policy';
      paper(59, 373, 835, 104);
      mono(tool, 78, 427, 20, C.ink, 251);
      lock(g, 379, 411, !write);
      txt('Allowlist', 424, 426, 19);
      lock(g, 604, 411, !write);
      txt('Credential', 649, 426, 19);
      if (cue(2, 'credential only permits reads') || !write)
        mono(E.authorize(tool) ? 'ADMIT' : 'DENY', 798, 428, 19, write ? C.red : C.stable);
    }
    return;
  }
  const waiting = cue(4, 'A third copy arrives') && !cue(5, 'Drop the third copy');
  const n = cue(5, 'Drop the third copy')
    ? 3
    : cue(4, 'Put the second')
      ? 2
      : cue(4, 'Put the first')
        ? 1
        : 0;
  const req = Array.from({ length: n }, (_, i) => ({ id: i + 1, tool: 'read policy' }));
  const { accepted, dropped } = E.enqueue(req);
  mono('CUSTOMERS', 58, 151, 15, C.stable);
  for (let i = 0; i < 3; i++) {
    const x = 244 + i * 216;
    paper(x, 113, 181, 80);
    txt('User ' + (i + 1), x + 13, 141, 19);
    mono(
      cue(4, 'Stable returns three replies') ? 'Stable replied' : 'Incoming',
      x + 13,
      174,
      16,
      C.stable,
    );
  }
  mono('SHADOW QUEUE', 57, 269, 15, C.candidate);
  for (let i = 0; i < 2; i++) {
    const x = 242 + i * 215;
    rect(x, 233, 183, 112, '#a9b9ae', 5);
    rect(x + 7, 240, 169, 99, C.ink, 4);
    if (accepted[i]) {
      paper(x + 13, 247, 156, 85);
      mono('Copy 0' + accepted[i].id, x + 25, 295, 24);
    } else mono('Empty', x + 40, 301, 24, C.white);
    roller(x, 348, 183);
  }
  if (waiting) {
    paper(747, 240, 151, 94);
    mono('Copy 03', 760, 277, 21);
    mono('Arrived', 760, 305, 17, C.dim);
  }
  if (dropped.length) {
    g.path(
      [
        [711, 252],
        [814, 321],
        [814, 370],
      ],
      C.red,
      4,
    );
    paper(744, 370, 156, 78);
    mono('Copy 03', 759, 398, 18);
    mono('DROPPED', 759, 428, 20, C.red);
  }
  mono(
    accepted.length + ' admitted   /   ' + dropped.length + ' missing comparisons',
    243,
    444,
    19,
    C.dim,
    470,
  );
}

export function agreement(g) {
  const { head, beat, cue, txt, mono, paper, seal, line } = g;
  head(
    'Shadow comparison  /  known support label',
    beat < 4 ? 'Can two matching routes both be wrong?' : 'Two permissions for each tool call',
  );
  if (beat < 4) {
    const scrub = cue(1, 'replaces the ship number');
    const wrong = cue(3, 'both releases serve');
    paper(43, 122, 876, 89);
    mono(scrub ? 'MINIMIZED QUESTION' : 'INCOMING QUESTION', 62, 149, 13, C.dim);
    txt('Approval for ' + (scrub ? '[SHIP]' : 'SHIP-4412') + '?', 62, 187, 29, C.ink, {
      face: 'Serif',
    });
    const res = E.approvalRoute(wrong ? 'historical' : 'candidate', false);
    ['Stable', 'Candidate'].forEach((l, i) => {
      const x = 49 + i * 451;
      txt(l, x, 269, 28, C.ink, { face: 'Serif' });
      line(x, 286, x + 402, 286);
      mono(res, x, 340, 34, wrong ? C.red : C.stable);
    });
    mono('Approval record   empty', 50, 406, 20);
    seal('Routes agree', 500, 377, C.stable, 196);
    seal(wrong ? 'Both wrong' : 'Correct to withhold', 705, 377, wrong ? C.red : C.stable, 205);
    return;
  }
  mono('TOOL REQUEST', 59, 146, 15, C.dim);
  mono('ALLOWLIST', 348, 146, 15, C.dim);
  mono('CREDENTIAL', 526, 146, 15, C.dim);
  mono('DECISION', 764, 146, 15, C.dim);
  E.authCases.forEach((r, i) => {
    const y = 196 + i * 101;
    paper(42, y - 27, 876, 81);
    txt(r.tool, 57, y + 16, 21, C.ink, { face: 'Serif' });
    lock(g, 351, y - 1, r.listed);
    mono(r.listed ? 'yes' : 'no', 396, y + 17, 17);
    lock(g, 533, y - 1, r.scoped);
    mono(r.scoped ? 'yes' : 'no', 578, y + 17, 17);
    if (beat === 5)
      seal(r.allowed ? 'ADMIT' : 'DENY', 744, y - 14, r.allowed ? C.stable : C.red, 149);
  });
}

function pointAlong(points, f) {
  const segments = points
    .slice(1)
    .map((end, i) => ({
      a: points[i],
      b: end,
      len: Math.hypot(end[0] - points[i][0], end[1] - points[i][1]),
    }));
  let dist = f * segments.reduce((n, s) => n + s.len, 0);
  for (const { a, b, len } of segments) {
    if (dist <= len) return [mix(a[0], b[0], dist / len), mix(a[1], b[1], dist / len)];
    dist -= len;
  }
  return points.at(-1);
}
function track(g, points, col) {
  g.path(points, '#99a99e', 13);
  g.path(points, '#e5e8d9', 8);
  g.path(points, col, 2);
}
export function sticky(g) {
  const { beat, cue, head, rect, txt, mono, dot, seal, paper } = g;
  head('Dispatch router  /  normal widening', 'Follow the fourth turn');
  const firstSix = cue(1, 'Thread six lands'),
    firstZero = cue(1, 'Thread zero lands');
  const widening = cue(2, 'Widen the threshold', 1.4);
  const threshold = Math.round(mix(10, 100, widening));
  const axisX = 52,
    axisW = 834;
  mono('First-turn bucket  <  ' + threshold, 52, 132, 17, C.candidate);
  rect(axisX, 163, axisW, 17, C.gray, 2);
  rect(axisX, 163, (axisW * threshold) / 100, 17, C.candidate, 2);
  for (let i = 0; i <= 100; i += 10) {
    const x = axisX + (i * axisW) / 100;
    g.line(x, 183, x, 190);
    mono(i, x - 5, 209, 13, C.dim);
  }
  if (firstSix) dot(axisX + (E.bucketOf('thread-6') / 100) * axisW, 172, 7, C.brass);
  if (firstZero) dot(axisX + (E.bucketOf('thread-0') / 100) * axisW, 172, 7, C.stable);
  const tracks = [
    [
      [77, 311],
      [346, 311],
      [488, 311],
      [601, 274],
      [781, 274],
    ],
    [
      [77, 383],
      [346, 383],
      [489, 383],
      [604, 417],
      [781, 417],
    ],
  ];
  track(g, tracks[0], C.stable);
  track(g, tracks[1], C.candidate);
  const st = firstZero ? E.firstRoutes[1] : null,
    ca = firstSix ? E.firstRoutes[0] : null;
  [
    ['thread-0', st, 311],
    ['thread-6', ca, 383],
  ].forEach(([id, target, y]) => {
    if (!target) return;
    rect(49, y - 19, 125, 36, target === E.STABLE ? C.stable : C.candidate, 4);
    mono(id, 60, y + 6, 17, C.white);
    mono('bucket ' + E.bucketOf(id), 182, y - 14, 13, C.dim);
  });
  [
    [E.STABLE, 274],
    [E.CANDIDATE, 417],
  ].forEach(([d, y]) => {
    rect(776, y - 25, 144, 50, C.ink, 4);
    mono(E.nameOf(d), 786, y + 6, 17, C.white, 125);
  });
  if (cue(1, 'saves each release')) {
    mono('Turn 1 saved', 310, 254, 14, C.dim);
    seal(E.nameOf(E.firstRoutes[1]), 311, 278, C.stable, 117);
    seal(E.nameOf(E.firstRoutes[0]), 311, 398, C.candidate, 134);
  }
  const newThread = cue(3, 'Now start a new conversation');
  if (cue(2, 'Thread zero now sends turn four')) {
    const progress = cue(3, 'Follow the route saved on turn one', 1.95);
    const target = E.retained === E.STABLE ? 0 : 1;
    const [x, y] = pointAlong(
      tracks[target].map(([u, v], i) => [i === 0 ? 75 : u, v]),
      progress,
    );
    const yoff = target === 0 ? 38 : -35;
    g.dot(x, y, 6, C.ink);
    g.line(x, y + 5, x, y + yoff - 11, C.ink, 2);
    rect(x - 33, y + yoff - 13, 66, 26, C.brass, 12);
    mono('Turn 4', x - 27, y + yoff + 5, 14);
    if (progress === 1 && cue(3, 'Stable handles turn four'))
      mono('served', 829, 316, 16, C.stable);
  }
  if (newThread) {
    const id = E.threads[2];
    const target = E.newRoute;
    paper(396, 457, 516, 47);
    mono(
      id + '   bucket ' + E.bucketOf(id) + '   →   ' + E.nameOf(target),
      411,
      487,
      17,
      C.candidate,
      480,
    );
  }
}

export function shares(g) {
  const { beat, cue, head, txt, mono, paper, dot, rect, seal, rail } = g;
  head(
    'Conversation assignments  /  observed requests',
    beat === 1
      ? 'Write the first route once'
      : beat === 2
        ? 'Count threads, then count requests'
        : 'What overrides a saved route?',
  );
  if (beat !== 2) {
    const abort = beat === 3;
    const map = new Map([['thread-6', E.CANDIDATE]]);
    const pick = E.route('thread-6', 0, map, abort ? new Set([E.CANDIDATE]) : new Set());
    paper(52, 132, 393, 295);
    mono('SAVED ASSIGNMENT', 73, 169, 15, C.dim);
    txt('thread-6', 72, 231, 43, C.ink, { face: 'Mono' });
    mono('Turn 1    ' + E.nameOf(E.CANDIDATE), 73, 288, 20);
    mono('Bucket    ' + E.bucketOf('thread-6'), 73, 329, 20);
    mono(abort ? 'Release blocked' : 'Durable first write', 73, 392, 19, abort ? C.red : C.stable);
    g.line(455, 274, 532, 274, C.ink, 3);
    g.dot(532, 274, 6, C.ink);
    txt(abort ? 'Fallback target' : 'Later turn', 559, 199, 24, C.ink, { face: 'Serif' });
    mono(E.nameOf(pick), 559, 263, 38);
    mono(abort ? 'Check state before resuming' : 'Stored release wins', 559, 337, 17, C.dim, 352);
    return;
  }
  const exp = E.requestExposure(E.trafficCounts, 0);
  const show = cue(2, 'Now count their requests');
  mono('10 NEW THREADS', 49, 140, 16, C.dim);
  mono('Requests by thread', 51, 405, 15, C.dim);
  E.trafficCounts.forEach((n, i) => {
    const x = 83 + i * 87,
      col = i === 0 ? C.candidate : C.stable;
    dot(x, 182, 20, col);
    mono(i === 0 ? 'C' : 'S', x - 6, 188, 16, C.white);
    if (show)
      for (let j = 0; j < n; j++) {
        const u = x - 10 + (j % 2) * 16,
          y = 223 + Math.floor(j / 2) * 15;
        rect(u, y, 12, 10, col, 2);
      }
  });
  mono('Candidate threads   1 / 10 = ' + pct(1, 10), 51, 453, 18, C.candidate, 406);
  if (cue(2, 'Twenty out of twenty-nine'))
    mono(
      'Candidate requests   20 / ' + exp.total + ' ≈ ' + pct(exp.requestShare, 1),
      487,
      453,
      18,
      C.candidate,
      430,
    );
}

function twoWindows(g) {
  const { cue, paper, mono, txt, seal, line } = g;
  const second = cue(7, 'Now look at the ten percent sample'),
    danger = cue(8, 'A hundred twelve');
  const labels = [
    'Requests reviewed',
    'p95 latency',
    'Transport errors',
    'Useful / answerable',
    'Useful / rollback',
    'Unsupported serves',
  ];
  const ypos = 184;
  labels.forEach((v, i) => txt(v, 43, ypos + i * 43, 19));
  E.alternatives.forEach((s, i) => {
    const show = !i || second,
      x = 332 + i * 302;
    paper(x, 110, 275, 346);
    txt(s.share + '% window', x + 16, 145, 27, C.ink, { face: 'Serif' });
    if (!show) return;
    const rates = cue(7, 'The results are ninety-four percent');
    const plus = (v, label) => (rates ? v + '  ·  ' + label : v);
    const vals = [
      s.reviewed + ' / ' + s.requests,
      s.p95 + ' ms',
      plus(s.errors + ' / ' + s.requests, pct(s.errors, s.requests, i ? 2 : 3)),
      plus(s.good + ' / ' + s.possible, pct(s.good, s.possible)),
      plus(s.rollbackGood + ' / ' + s.rollback, pct(s.rollbackGood, s.rollback)),
      s.unsafe + (s.unsafe ? '  (' + pct(s.unsafe, s.requests, 1) + ')' : ''),
    ];
    vals.forEach((v, j) => {
      if (!i || j !== 5 || danger) {
        mono(v, x + 16, ypos + j * 43, 18, i && j === 5 ? C.red : C.ink, 244);
        line(x + 15, ypos + j * 43 + 11, x + 260, ypos + j * 43 + 11);
      }
    });
    const verdict = i ? cue(8, 'Abort this canary') : cue(7, 'This window clears');
    if (verdict) seal(s.unsafe ? 'ABORT' : 'PASS', x + 14, 409, s.unsafe ? C.red : C.stable, 247);
  });
}
export function policy(g) {
  const { beat, cue, head, txt, mono, line, rect, paper, seal } = g;
  head(
    'Rollout analysis  /  live window',
    beat < 4
      ? 'Which population can count?'
      : beat < 6
        ? 'Which ceiling applies?'
        : 'Two independent traffic samples',
  );
  if (beat >= 6) {
    twoWindows(g);
    return;
  }
  if (beat >= 4) {
    const reader = cue(5, 'shorter worksheet'),
      probe = cue(5, 'A latency of five hundred twenty');
    const axis = (x, y, w, lim) => {
      const pos = (n) => x + ((n - 450) * w) / 150;
      line(x, y, x + w, y, C.ink, 2);
      for (let n = 450; n <= 600; n += 25) {
        line(pos(n), y - 6, pos(n), y + 6);
        mono(n, pos(n) - 11, y + 28, 11, C.dim);
      }
      line(pos(lim), y - 55, pos(lim), y + 4, C.candidate, 3);
      mono('≤ ' + lim + ' ms', pos(lim) - 48, y - 67, 18, C.candidate);
      if (probe) {
        g.dot(pos(520), y, 8, C.stable);
        mono('520', pos(520) - 21, y + 58, 19, C.stable);
      }
    };
    txt('Full reference policy', 49, 160, 25, C.ink, { face: 'Serif' });
    axis(55, 288, 376, 550);
    if (reader) {
      txt('Compact worksheet', 508, 160, 25, C.ink, { face: 'Serif' });
      axis(515, 288, 376, 500);
    }
    mono('Transport errors ≤ 1%    /    Shadow drops ≤ 2%', 63, 433, 20, C.dim);
    return;
  }
  paper(42, 123, 475, 328);
  mono('WINDOW  /  rollout-052', 64, 164, 20, C.stable);
  mono('candidate  ' + short(E.CANDIDATE), 64, 200, 18);
  line(74, 288, 462, 288, C.ink, 2);
  rect(76, 266, 191, 22, C.stable);
  mono('0 s', 68, 323, 16);
  mono('end 60 s', 225, 323, 16);
  mono('as of 120 s', 360, 323, 16);
  mono('Recency 60 s   /   limit 300 s', 65, 394, 19);
  const rows =
    beat === 1
      ? [
          ['Requests', '≥ 1,000'],
          ['Support, latency, transport', 'Every request'],
        ]
      : [
          ['Answerable', '≥ 100'],
          ['Rollback subset', '≥ 50'],
          ['Useful in each group', '≥ 90%'],
        ];
  rows.forEach(([a, b], i) => {
    let y = 160 + i * 96;
    txt(a, 550, y, 21);
    mono(b, 550, y + 39, 26, C.stable);
  });
}

export function live(g) {
  const { beat, cue, head, paper, txt, mono, rail, seal, line } = g;
  const complete = beat >= 3 && beat <= 5;
  const arrived = cue(6, 'The candidate served an approval');
  const w = complete ? E.windows.complete : arrived ? E.windows.returned : E.windows.control;
  head(
    'rollout-052  /  ' + short(E.CANDIDATE),
    complete ? 'An independent complete window' : 'Review coverage for request 98',
  );
  const counts = [
    ['Support reviews', w.reviewed, w.requests],
    ['Volume floor', w.requests, 1000],
  ];
  counts.forEach(([label, n, max], i) => {
    const y = 165 + 124 * i;
    txt(label, 48, y, 24, C.ink, { face: 'Serif' });
    mono(n + ' / ' + max, 292, y, 20);
    rail(49, y + 19, 397, n, i ? 1200 : max, i ? C.stable : C.candidate);
    if (i) {
      const floorX = 49 + (397 * 1000) / 1200;
      line(floorX, y + 11, floorX, y + 39, C.ink, 2);
      mono('1,000 required', floorX - 55, y + 61, 13, C.dim);
    }
  });
  paper(487, 127, 425, 297);
  if (complete) {
    const rows = [
      ['Unsupported', String(w.unsafe) + ' / 0 allowed'],
      ['p95', w.p95 + ' / 550 ms'],
      ['Transport errors', w.errors + ' / ' + w.requests],
      ['Shadow drops', '0.1% / 2%'],
      ['Useful answers', w.useful + ' / ' + w.answerable],
      ['Rollback useful', w.rollbackUseful + ' / ' + w.rollback],
    ];
    rows.forEach(([a, b], i) => {
      const y = 159 + i * 46;
      txt(a, 507, y, 17);
      mono(b, 732, y, 18, C.stable, 160);
      line(504, y + 12, 892, y + 12);
    });
  } else {
    mono('REVIEW  /  98', 508, 170, 16, C.dim);
    txt(
      arrived ? 'Unsupported approval' : 'Awaiting support review',
      508,
      225,
      29,
      arrived ? C.red : C.ink,
      { face: 'Serif', w: 381 },
    );
    mono('Confirmed unsafe   ' + w.unsafe, 508, 296, 19);
    mono('Missing reviews    ' + (w.requests - w.reviewed), 508, 341, 19);
    mono('Volume gap         ' + Math.max(0, 1000 - w.requests), 508, 385, 19);
  }
  const show = complete
    ? cue(5, 'Pass this window')
    : beat < 6
      ? cue(2, 'Hold this canary')
      : cue(8, 'Stop candidate traffic now');
  if (show)
    seal(
      w.status,
      53,
      433,
      w.status === 'ABORT' ? C.red : w.status === 'PASS' ? C.stable : C.hold,
      389,
    );
}
