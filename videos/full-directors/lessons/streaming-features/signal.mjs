import {
  heartbeats,
  hourlyRows,
  backlogUpdates,
  revisionRecords,
} from '../../../films/streaming-features/fixtures.mjs';
import {
  availableHeartbeat,
  pointInTime,
  applyLatestState,
} from '../../../films/streaming-features/arithmetic.mjs';
import {
  C,
  board,
  box,
  chassis,
  screen,
  line,
  path,
  dot,
  wave,
  type,
  mono,
  ticket,
  clockFace,
  rule,
  answer,
  after,
  progress,
  hh,
  heading,
} from './instrument.mjs';

const [h1, h2, h3] = heartbeats;
const job = 'J-204';
export function opening(g, k) {
  board(g, k, 'The pulse on the wire', job);
  const sent = progress(k, 1, 'sends a heartbeat', 1);
  const atNine = after(k, 1, 'At nine');
  const zoom = 1 + 1.65 * (1 - sent);
  g.save();
  g.beginPath();
  g.rect(0, 85, 960, 455);
  g.clip();
  g.translate(139 + 280 * (1 - sent), 249);
  g.scale(zoom, zoom);
  g.translate(-139, -249);
  const arrival = progress(k, 4, 'At eleven', 1);
  const minute = arrival > 0 ? Math.round(540 + 120 * arrival) : atNine ? 540 : 510;
  const active = arrival === 1 ? h2 : h1;
  chassis(g, 40, 171, 191, 178);
  screen(g, 53, 188, 165, 85);
  wave(g, 'H2', 63, 229, 144, 23);
  mono(g, 'WORKER', 64, 295, 16);
  mono(g, 'H2   08:30', 64, 322, 17, C.green);
  chassis(g, 644, 138, 270, 214);
  mono(g, 'FEATURE STORE', 668, 167, 16);
  screen(g, 661, 194, 235, 106);
  wave(g, active.id, 681, 232, 114, 17);
  mono(g, active.id, 850, 231, 21, C.green, 'center');
  mono(g, 'Sent ' + hh(active.event), 678, 272, 17);
  mono(g, 'Readable ' + hh(active.available), 667, 328, 15, C.muted);
  for (let i = 0; i < 3; i++)
    line(g, 231, 270 + i * 5, 644, 270 + i * 5, i === 1 ? C.lip : C.deep, i === 1 ? 3 : 4);
  dot(g, 231, 275, 8, C.lip);
  dot(g, 644, 275, 8, C.lip);
  if (sent > 0 && arrival < 1) {
    const x = 231 + sent * 150 + arrival * 263;
    line(g, x, 261, x, 248, C.amber, 2);
    wave(g, 'H2', x - 32, 275, 64, 14, C.amber);
    if (sent > 0.4) mono(g, 'H2', x, 235, 18, C.amber, 'center');
  }
  clockFace(g, 455, 146, 43, minute, hh(minute));
  g.restore();
  const hasAnswer = after(k, 3, 'H one, eight hours');
  const read = availableHeartbeat(heartbeats, 540);
  if (atNine)
    ticket(
      g,
      42,
      394,
      370,
      89,
      'SCHEDULER READ    09:00',
      hasAnswer ? read.id + '   ' + read.ageHours + ' h' : 'Pulse ?     Age ?',
    );
  if (hasAnswer) {
    if (after(k, 4, 'Training on'))
      ticket(
        g,
        435,
        394,
        478,
        89,
        'ARCHIVE FILTERED BY SEND TIME',
        'H2   0.5 h   ·   leaked',
        C.rust,
      );
    else {
      heading(g, 'AGE AT THE REQUEST', 452, 418);
      mono(g, '09:00 − 01:00 = 8 h', 452, 451, 24, C.green);
    }
  }
}

export function delivery(g, k) {
  board(g, k, 'When the store can answer', 'PUBLICATION');
  const firstComparison = k.beat.beatIndex < 2;
  if (firstComparison) {
    mono(g, `Earlier pulse ${h1.id}   Sent ${hh(h1.event)}   Published ${hh(h1.available)}`, 39, 109, 20);
  }
  const earlier = after(k, 3, 'eight fifty-nine');
  const read = availableHeartbeat([h1, { ...h2, available: earlier ? 539 : 542 }], 540);
  const ticks = [
    [510, '08:30'],
    [525, '08:45'],
    [540, '09:00'],
  ];
  const x = rule(g, 225, 350, 637, 507, 545, ticks);
  const stations = [
    ['Worker sent', 510],
    ['Broker received', 538],
    ['Store published', earlier ? 539 : 542],
  ];
  const show = [true, after(k, 1, 'the broker receives'), after(k, 1, 'the store publishes')];
  line(g, x(540), 133, x(540), 347, C.amber, 2);
  mono(g, 'Read at 09:00', x(540), 109, 16, C.amber, 'center');
  stations.forEach(([name, t], i) => {
    const y = 165 + i * 76;
    mono(g, name, 39, y, 17);
    line(g, 215, y, 900, y, '#456065', 1);
    if (!show[i]) return;
    if (i) line(g, x(stations[i - 1][1]), y - 76, x(t), y, C.green, 4);
    dot(g, x(t), y, 6, C.green);
    const labelRight = i === 0 || t > 540;
    mono(
      g,
      firstComparison && i === 0 ? `${h2.id}  ${hh(t)}` : hh(t),
      x(t) + (labelRight ? 14 : -14),
      y - 16,
      18,
      C.green,
      labelRight ? 'left' : 'right',
    );
  });
  const revealed = earlier ? after(k, 3, 'reads H two') : after(k, 2, 'reads H one');
  answer(
    g,
    '09:00   /   ' + job,
    revealed ? read.id + '     ' + (read.ageHours === 0.5 ? '30 min' : '8 h') : 'Which pulse?',
    45,
    408,
    861,
  );
  if (k.beat.beatIndex === 3)
    mono(
      g,
      'UTC clocks    ·    published ≤ cutoff    ·    same tick: compare sequence',
      45,
      488,
      15,
      C.muted,
    );
}

export function repeatRead(g, k) {
  board(g, k, 'One job, three cutoffs', job);
  const at = after(k, 4, 'Move the request') ? 960 : after(k, 2, 'Move the request') ? 720 : 540;
  const x = rule(g, 173, 367, 674, 0, 960, [
    [60, '01:00'],
    [510, '08:30'],
    [720, '12:00'],
    [960, '16:00'],
  ]);
  for (const [i, h] of heartbeats.entries()) {
    const y = 170 + 72 * i;
    mono(g, h.id, 72, y, 25, C.cream);
    line(g, 165, y, 880, y, C.metal, 2);
    dot(g, x(h.event), y, 5, C.amber);
    line(g, x(h.event), y, x(h.available), y - 23, C.green, 3);
    dot(g, x(h.available), y - 23, 4, C.green);
    mono(
      g,
      hh(h.event) + ' → ' + hh(h.available),
      x(h.event) + (i === 0 ? 12 : 0),
      y + 19,
      15,
      C.muted,
      i === 0 ? 'left' : 'center',
    );
  }
  for (const [top, bottom] of [
    [125, 175],
    [202, 248],
    [275, 319],
    [343, 349],
  ])
    line(g, x(at), top, x(at), bottom, C.amber, 2);
  mono(g, hh(at) + ' read', x(at), 105, 16, C.amber, 'center');
  const known =
    at === 540 || (at === 720 ? after(k, 3, 'H two, three and a half') : after(k, 4, 'the age is four hours'));
  const row = availableHeartbeat(heartbeats, at);
  answer(
    g,
    'CAPTURE   ' + hh(at),
    known
      ? row.id + '     ' + hh(at) + ' − ' + hh(row.event) + ' = ' + row.ageHours + ' h'
      : 'Pulse ?     Age ?',
    45,
    414,
    865,
  );
}

export function joins(g, k) {
  const global = after(k, 3, 'latest state');
  board(g, k, global ? 'One snapshot at 09:30 for both jobs' : 'A different starting point for each job', 'BACKWARD JOIN', true);
  const sharedResult = after(k, 4, 'The first job gets twelve');
  const x = (t) => 251 + (t - 525) * 11;
  for (const [i, row] of hourlyRows.entries()) {
    const y = 199 + i * 158;
    mono(g, row.job, 49, y - 20, 23, C.ink);
    mono(g, 'Scored at ' + hh(row.cutoff), 49, y + 10, 16, C.grey);
    line(g, 246, y, 873, y, '#9eaa96', 2);
    const cutoff = global ? 570 : row.cutoff;
    for (const r of backlogUpdates.filter((r) => r.job === row.job)) {
      dot(g, x(r.time), y, 7, C.teal);
      mono(g, r.value, x(r.time), y - 30, 24, C.ink, 'center');
      mono(g, hh(r.time), x(r.time), y + 28, 15, C.grey, 'center');
    }
    const xt = x(cutoff);
    path(
      g,
      [
        [xt - 7, y - 54],
        [xt + 7, y - 54],
        [xt, y - 45],
      ],
      C.rust,
      1,
      true,
    );
    line(g, xt, y - 44, xt, y + 9, C.rust, 2);
    mono(g, (global ? 'Snapshot ' : 'Request ') + hh(cutoff), xt, y - 75, 16, C.rust, 'center');
    if (global ? sharedResult : after(k, 2, i === 0 ? 'its backlog was five' : 'its backlog was eight')) {
      const match = backlogUpdates.find(
        (r) => r.job === row.job && r.value === pointInTime(row.job, cutoff),
      );
      line(g, x(match.time), y + 53, xt, y + 53, C.rust, 3);
      path(
        g,
        [
          [x(match.time) + 7, y + 47],
          [x(match.time), y + 53],
          [x(match.time) + 7, y + 59],
        ],
        C.rust,
        2,
      );
      mono(g, 'Read ' + match.value, 133, y + 47, 18, C.teal, 'center');
    }
  }
  if (sharedResult)
    type(
      g,
      'J-201 was scored at 09:00. Its 09:15 update belongs to a later read.',
      44,
      469,
      21,
      C.rust,
    );
}

export function joinRules(g, k) {
  const b = k.beat.beatIndex + 1;
  board(
    g,
    k,
    b <= 2
      ? 'Sort the join clock'
      : b <= 4
        ? 'A lookback has one clock'
        : 'Which timestamp does Feast filter?',
    'HISTORICAL READ',
    true,
  );
  if (b <= 2) {
    const sorted = after(k, 1, 'Then use');
    const rows = sorted
      ? backlogUpdates
      : [backlogUpdates[1], backlogUpdates[0], backlogUpdates[2]];
    heading(g, 'JOB', 108, 138, true);
    heading(g, 'JOIN CLOCK', 359, 138, true);
    heading(g, 'BACKLOG', 661, 138, true);
    rows.forEach((r, i) => {
      const y = 196 + i * 76;
      line(g, 66, y + 31, 885, y + 31, '#adb2a0', 1);
      mono(g, r.job, 108, y, 25, C.ink);
      mono(g, hh(r.time), 359, y, 28, sorted ? C.teal : C.rust);
      mono(g, r.value, 695, y, 26, C.ink);
    });
    type(
      g,
      sorted
        ? 'Search backward within each job. Exact matches count.'
        : 'Read the join clock from top to bottom.',
      70,
      443,
      24,
      C.ink,
    );
  } else {
    const rows =
      b <= 4
        ? [
            ['Worker time', '08:30', 'Inside the 24 h lookback'],
            ['Prediction', '09:00', 'Search backward by job'],
            ['Publication', '09:15', 'First readable in the store'],
          ]
        : [
            ['Event time', '≤ cutoff', 'Default historical filter'],
            ['Creation time', '≤ cutoff', 'Optional on supported stores'],
            ['Publication', '≤ cutoff', 'Required for serving replay'],
          ];
    rows.forEach(([name, operand, role], i) => {
      const y = 154 + i * 97;
      mono(g, name, 55, y, 19, C.grey);
      mono(g, operand, 298, y, 27, C.ink);
      if (i < 2 || b >= 4 || after(k, 3, 'Follow it to publication'))
        type(g, role, 539, y, 21, i === 2 ? C.rust : C.ink);
      line(g, 55, y + 39, 890, y + 39, '#afb3a2', 1);
    });
    if (b !== 3 || after(k, 3, 'The scheduler had already'))
      type(
        g,
        b <= 4
          ? 'A late publication fails the 09:00 read.'
          : 'Warehouse insertion can precede feature publication.',
        56,
        459,
        25,
        C.rust,
      );
  }
}
export function batch(g, k) {
  board(g, k, 'One feed, two ways to read it', 'STORE DESIGN');
  const lane = (y, name, records) => {
    mono(g, name, 45, y, 18);
    line(g, 240, y, 880, y, C.lip, 2);
    records.forEach((r, i) => {
      const x = 253 + i * 210;
      screen(g, x, y - 39, 168, 78);
      wave(g, r.id, x + 12, y - 10, 62, 13);
      mono(g, r.id, x + 88, y - 9, 19, C.green);
      mono(g, 'Sent ' + hh(r.event), x + 12, y + 22, 15);
    });
  };
  lane(195, 'Day archive', heartbeats);
  lane(325, '09:00 online', [h1]);
  const row = availableHeartbeat(heartbeats, 540);
  if (after(k, 3, 'If the writer') && !after(k, 3, 'Save the worker'))
    answer(g, 'WROTE AT 01:02', '2 min ÷ 60 min/h ≈ 0.03 h', 46, 410, 860);
  else if (after(k, 3, 'Save the worker'))
    answer(
      g,
      'READ BOTH AT 09:00',
      row.id + '     09:00 − 01:00 = ' + row.ageHours + ' h',
      46,
      410,
      860,
    );
  else {
    heading(g, 'STREAM INPUT', 47, 418);
    type(g, 'Read a bounded day for training. Read one key for this request.', 47, 453, 23);
  }
}

// The article delivers H1 again at 11:05, after the 10:40 age was captured.
export const oldHeartbeatRetry = { ...h1, job, available: 665, version: 1, phase: '' };

export function revisions(g, k) {
  const older = after(k, 3, 'At eleven oh five');
  board(g, k, older ? 'A later delivery with an older worker time' : 'An old revision comes back', job);
  const n = after(k, 2, 'At ten thirty-six') ? 3 : after(k, 1, 'At ten thirty-four') ? 2 : 1;
  const updateRows = revisionRecords.slice(0, n);
  const store = new Map();
  updateRows.forEach((r) => applyLatestState(store, r));
  const winner = store.get(job);
  if (older) applyLatestState(store, oldHeartbeatRetry);
  const current = store.get(job);
  heading(g, 'ARRIVAL', 56, 132);
  heading(g, 'PULSE', 218, 132);
  heading(g, 'WORKER TIME', 406, 132);
  heading(g, 'REVISION', 603, 132);
  heading(g, 'PHASE', 747, 132);
  const visible = older ? [winner, oldHeartbeatRetry] : updateRows;
  visible.forEach((r, i) => {
    const y = 194 + i * 70;
    line(g, 47, y + 32, 912, y + 32, C.lip, 1);
    mono(g, hh(r.available), 57, y, 24);
    mono(g, r === oldHeartbeatRetry ? 'H1 retry' : i === 2 ? 'H4 retry' : 'H4', 218, y, 21);
    mono(g, hh(r.event), 408, y, 24, older ? C.amber : C.cream);
    mono(g, 'v' + r.version, 606, y, 24, older ? C.cream : C.amber);
    type(g, r.phase === '' ? '·' : r.version === 1 ? 'Scaled up' : 'Corrected', 747, y, 22);
  });
  if (older)
    mono(g, 'Worker time    ' + hh(oldHeartbeatRetry.event) + ' < ' + hh(winner.event), 56, 342, 24, C.amber);
  const revealed = n !== 3 || after(k, 3, 'Keep version two');
  answer(
    g,
    'ONLINE   /   ' + job,
    revealed
      ? 'v' + current.version + '    ' + (current.version === 2 ? 'Corrected' : 'Scaled up')
      : 'Which revision?',
    46,
    399,
    866,
  );
  if (after(k, 3, 'the heartbeat is ten minutes old'))
    mono(g, '10:40 capture    10:40 − ' + hh(winner.event) + ' = ' + (640 - winner.event) + ' min', 46, 485, 17, C.green);
}

export const candidate = (phase) => ({
  id: 'H5',
  job: 'J-205',
  event: 630,
  available: 631,
  version: 7,
  phase,
});
export function conflicting(phases) {
  const store = new Map();
  for (const phase of phases) applyLatestState(store, candidate(phase));
  return store.get('J-205').quarantined;
}
export function quarantine(g, k) {
  const callback = k.beat.beatIndex === 3;
  board(g, k, callback ? 'What did the scheduler read at 09:00?' : 'Two payloads claim version seven', callback ? job : 'J-205');
  if (k.beat.beatIndex >= 2) {
    if (k.beat.beatIndex === 2) {
      ticket(g, 48, 150, 406, 131, 'CURRENT ONLINE STATE', '10:30    v7 conflict', C.rust);
      ticket(g, 506, 150, 403, 131, 'EARLIER J-205 LOOKUP', 'Before 10:30');
      type(g, 'Historical-read error', 49, 354, 29, C.red, 'left', 'Serif');
      mono(g, 'Reopen the captured row, or replay the published states.', 49, 412, 17, C.muted);
      return;
    }
    ticket(g, 48, 150, 406, 131, 'J-204   /   CURRENT', '10:30    v2 corrected');
    ticket(g, 506, 150, 403, 131, 'J-204   /   EARLIER CAPTURE', '09:00    H1    8 h', C.teal);
    type(g, 'Historical read', 49, 354, 29, C.cream, 'left', 'Serif');
    mono(
      g,
      'Request predates current state → read the capture or replay publication history.',
      49,
      412,
      15,
      C.muted,
    );
    return;
  }
  const show = after(k, 1, 'Read them in opposite');
  const decided = after(k, 2, 'Quarantine the state');
  for (const [i, phases] of [
    ['Scaled up', 'Failed'],
    ['Failed', 'Scaled up'],
  ].entries()) {
    const x = 48 + i * 457;
    chassis(g, x, 124, 400, 250);
    mono(g, i ? 'B then A' : 'A then B', x + 25, 156, 21, C.cream);
    screen(g, x + 18, 185, 364, 160);
    phases.slice(0, show ? 2 : 1).forEach((phase, j) => {
      mono(g, '10:30   v7', x + 34, 222 + j * 73, 19, C.green);
      type(g, phase, x + 218, 222 + j * 73, 23, C.cream);
    });
    const locked = decided && conflicting(phases);
    type(
      g,
      locked ? 'Quarantined' : 'Which phase?',
      x + 200,
      420,
      30,
      locked ? C.red : C.cream,
      'center',
      'Serif',
    );
  }
  if (after(k, 2, 'Repeat either'))
    mono(
      g,
      'Same key + different payloads     ·     retries preserve the conflict',
      50,
      480,
      16,
      C.muted,
    );
}
