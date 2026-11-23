import assert from 'node:assert/strict';
import { requests, predictionRows, deployed } from '../../../films/model-monitoring/fixtures.mjs';
import {
  requestContract,
  cohortAsOf,
  fixedCapacityReplay,
} from '../../../films/model-monitoring/model.mjs';
import {
  C,
  surface,
  box,
  circle,
  line,
  txt,
  mono,
  serif,
  paper,
  heading,
  stamp,
  screw,
  arrow,
  pct,
  fix,
} from './instruments.mjs';

const noon = 12 * 60;
function time(minute) {
  return (
    String(Math.floor(minute / 60)).padStart(2, '0') + ':' + String(minute % 60).padStart(2, '0')
  );
}
function dialPoint(x, y, r, min) {
  const a = (min / 720) * Math.PI * 2 - Math.PI / 2;
  return [x + r * Math.cos(a), y + r * Math.sin(a)];
}
const snapshots = requests.slice(-2);
export function opening(c, s) {
  surface(c, true);
  const cx = 525,
    cy = 530,
    rad = 407;
  circle(c, cx, cy, rad + 19, C.deep, C.brass, 8);
  circle(c, cx, cy, rad, C.cream, C.gold, 6);
  for (let i = 0; i < 144; i++) {
    const hr = i % 12 === 0;
    line(
      c,
      [dialPoint(cx, cy, rad - 12, i * 5), dialPoint(cx, cy, rad - (hr ? 42 : 23), i * 5)],
      hr ? C.ink : C.rule,
      hr ? 6 : 2,
    );
    if (hr) {
      const [x, y] = dialPoint(cx, cy, rad - 77, i * 5);
      serif(c, i === 0 ? '12' : i / 12, x, y, 43, C.ink, 'center');
    }
  }
  const arc = s.motion(2, 'Sweep back', 1.6);
  if (arc > 0) {
    c.beginPath();
    c.arc(cx, cy, rad - 107, -Math.PI / 2, -Math.PI / 2 - (arc * Math.PI) / 6, true);
    c.strokeStyle = C.brass;
    c.lineWidth = 30;
    c.stroke();
  }
  // Pins sit on a twelve-hour clock. The sweep spans precisely sixty minutes.
  const old = s.at(3, 'The service'),
    fresh = s.at(3, 'That snapshot'),
    score = s.at(4, 'Did it');
  line(
    c,
    [
      [cx, cy + 49],
      [cx, cy - 255],
    ],
    C.ink,
    14,
  );
  circle(c, cx, cy, 19, C.gold, C.ink, 5);
  serif(c, 'Scheduler', cx, cy + 112, 55, C.ink, 'center');
  mono(c, 'NOON', cx, cy + 173, 33, C.muted, 'center');
  snapshots.forEach((row, i) => {
    const entered = i ? s.motion(1, 'At eleven fifty-five', 0.7) : 1;
    if (entered === 0) return;
    c.save();
    c.globalAlpha = entered;
    const tone = (i ? fresh : old) ? (i ? C.sea : C.red) : C.ink;
    const [x, y] = dialPoint(cx, cy, rad - 107, noon - row.age);
    circle(c, x, y, 12, tone, C.cream, 3);
    const lx = i ? cx + 90 : x,
      ly = i ? y + 66 : y + 74;
    line(
      c,
      [
        [x, y + 16],
        [lx, ly - 29],
      ],
      tone,
      2,
    );
    mono(c, time(noon - row.age), lx, ly, 35, tone, 'center');
    const ty = 151 + i * 348;
    c.translate(55 * (1 - entered), 0);
    paper(c, 1040, ty, 744, 286);
    mono(c, row.id + '  /  ' + time(noon - row.age), 1094, ty + 69, 36, C.muted);
    serif(c, row.backlog + ' jobs', 1090, ty + 158, 89, C.ink);
    if (i ? fresh : old) stamp(c, i ? 'SCORE' : 'BLOCK', 1486, ty + 155, tone, 38);
    txt(c, (i ? fresh : old) ? row.age + ' min old' : 'Queue snapshot', 1096, ty + 232, 35, tone);
    c.restore();
  });
  if (score) {
    mono(c, '0.91   →   review', 1084, 857, 47, C.mint);
    txt(c, 'Outcome pending', 1086, 922, 36, C.cream);
  } else if (s.beat === 2) txt(c, 'Which reading can go to the model?', 1044, 894, 42, C.cream);
}
export function trace(c, s) {
  surface(c);
  heading(c, 'SOURCE HISTORY     /     s-100', 'Two clocks follow one job');
  const events = [
    ['09:50', 'Heartbeat'],
    ['11:50', 'Snapshot'],
    ['12:00', 'Request'],
  ];
  const xs = [180, 1452, 1558],
    y = 473;
  line(
    c,
    [
      [xs[0], y],
      [xs[2], y],
    ],
    C.muted,
    7,
  );
  events.forEach(([t, l], i) => {
    circle(c, xs[i], y, 14, i === 1 ? C.sea : C.ink);
    const yy = i === 1 ? y + 95 : y - 105;
    line(
      c,
      [
        [xs[i], y + (i === 1 ? 16 : -16)],
        [xs[i], yy + (i === 1 ? -32 : 32)],
      ],
      C.muted,
    );
    mono(c, t, xs[i], yy, 39, C.ink, 'center');
    txt(c, l, xs[i], yy + (i === 1 ? 57 : -52), 34, C.muted, { align: 'center' });
  });
  mono(c, '120 min', 774, 424, 50, C.sea, 'center');
  if (s.at(2, 'That is the age')) {
    line(
      c,
      [
        [xs[1], 487],
        [xs[1], 505],
        [xs[2], 505],
        [xs[2], 487],
      ],
      C.brass,
      4,
    );
    mono(c, '10 min', 1625, 528, 34, C.brass);
  }
  paper(c, 140, 696, 1630, 240, false);
  mono(c, 's-100', 190, 760, 36, C.sea);
  txt(c, '18 queued   ·   2 h since heartbeat', 440, 760, 43);
  if (s.at(3, 'Save the input')) {
    mono(c, 'v3    0.18 < 0.50', 190, 856, 46, C.ink);
    txt(c, 'Pass through', 970, 856, 46, C.sea);
  } else txt(c, 'Measured at 11:50', 190, 856, 43, C.muted);
}
export function intake(c, s) {
  surface(c, true);
  heading(c, 'INTAKE REGISTER     /     12:00', 'Six requests at the gate', true);
  paper(c, 90, 240, 1740, 696);
  const xs = [145, 432, 700, 1022, 1315];
  ['Request', 'Queue', 'Heartbeat age', 'Snapshot age', 'Decision'].forEach((h, i) =>
    txt(c, h, xs[i], 320, 32, C.muted),
  );
  requests.forEach((r, i) => {
    const y = 416 + i * 85,
      verdict = requestContract(r);
    line(
      c,
      [
        [140, y - 45],
        [1780, y - 45],
      ],
      C.rule,
      2,
    );
    [r.id, r.backlog ?? 'missing', r.heartbeatHours + ' h', r.age + ' min'].forEach((v, j) =>
      mono(
        c,
        v,
        xs[j],
        y,
        38,
        (j === 1 && r.backlog === null) || (j === 3 && r.age > 60) ? C.red : C.ink,
      ),
    );
    let val = '·',
      col = C.muted;
    if (s.at(4, 'For the other two')) {
      val = verdict === 'pass' ? fix(r.score) + '   scored' : 'Fallback';
      col = verdict === 'pass' ? C.sea : C.red;
    } else if (verdict === 'schema' && s.at(3, 'Row s-104')) {
      val = 'Missing count';
      col = C.red;
    } else if (verdict === 'freshness' && s.at(3, 'END')) {
      val = 'Stale';
      col = C.red;
    }
    mono(c, val, xs[4], y, 33, col);
  });
  txt(
    c,
    s.beat === 1
      ? 'Queue count must be a nonnegative whole number.     Heartbeat age ≥ 0.'
      : s.beat === 2
        ? 'Snapshot age must be between 0 and 60 minutes, inclusive.'
        : !s.at(4, 'For the other two')
          ? 'Check the count and snapshot age together.'
          : 'Four scores     /     two fallbacks to investigate',
    110,
    993,
    39,
    C.cream,
  );
}
function parityState(s) {
  const capacity = s.at(3, 'Now open two hundred') ? 200 : s.at(3, 'Open a hundred') ? 100 : 50;
  const repaired = s.at(4, 'On this row');
  const raw = fixedCapacityReplay(capacity);
  return {
    ...raw,
    repaired,
    liveCapacity: repaired ? capacity : raw.servingCapacity,
    live: repaired ? raw.training : raw.serving,
  };
}
export function rack(c, s) {
  surface(c, true);
  heading(c, 'SAME-ROW REPLAY     /     20 JOBS', 'How many runner slots are staffed?', true);
  const p = parityState(s);
  // Queued jobs wait outside the staffed banks.
  txt(c, p.numerator + ' queued jobs', 110, 239, 32, C.cream);
  for (let i = 0; i < p.numerator; i++) box(c, 400 + i * 23, 226, 17, 29, C.coral, 3);
  box(c, 90, 264, 834, 602, '#18302e', 22);
  for (let bank = 0; bank < 4; bank++) {
    const open = bank * 50 < p.trainingCapacity;
    const x = 120 + (bank % 2) * 394,
      y = 296 + Math.floor(bank / 2) * 266;
    box(c, x, y, 370, 230, open ? C.cream : '#37514c', 12);
    for (let i = 0; i < 50; i++) {
      const sx = x + 20 + (i % 10) * 34,
        sy = y + 24 + Math.floor(i / 10) * 31;
      box(c, sx, sy, 24, 15, open ? '#86ac98' : '#51675f', 4);
    }
    txt(c, open ? '50 staffed' : 'Closed', x + 24, y + 190, 32, open ? C.ink : '#d2d9c8');
  }
  mono(c, p.trainingCapacity + ' staffed slots', 118, 932, 45, C.mint);
  paper(c, 982, 264, 850, 604);
  const show = s.at(2, 'The weights') || s.beat >= 3;
  [
    ['Training', p.trainingCapacity, p.training],
    ['Serving', p.liveCapacity, p.live],
  ].forEach(([l, d, v], i) => {
    const y = 365 + i * 236;
    txt(c, l, 1034, y, 35, C.muted);
    if (show) {
      serif(c, p.numerator + ' / ' + d, 1032, y + 99, 70);
      mono(c, '= ' + fix(v), 1478, y + 100, 50, p.repaired ? C.sea : C.ink);
    } else {
      txt(c, i ? 'backlog / fixed 100' : 'backlog / staffed slots', 1034, y + 100, 47);
    }
  });
  line(
    c,
    [
      [1030, 541],
      [1770, 541],
    ],
    C.rule,
    2,
  );
  if (p.repaired) txt(c, 'Both divisors read the staffed-slot count.', 1000, 932, 40, C.mint);
  else if (s.beat === 3 && p.trainingCapacity === 200)
    txt(c, 'Which field should serving read?', 1000, 932, 42, C.cream);
}
const delayedPrediction = predictionRows.find((r) => r.id === 'p-005');
const originalArrival = -1;
const earlyRows = predictionRows.map((r) => ({
  ...r,
  arrivalHours: r === delayedPrediction ? originalArrival : r.arrivalHours,
}));
function archiveState(s, lateChapter) {
  const delay = lateChapter ? s.motion(1, 'Move its arrival', 2) : 0;
  const arrival = originalArrival + delay * (delayedPrediction.arrivalHours - originalArrival);
  const rows = earlyRows.map((r) =>
    r.id === delayedPrediction.id ? { ...r, arrivalHours: arrival } : r,
  );
  return {
    rows,
    totals: cohortAsOf(rows, 0),
    showLabels: lateChapter || s.at(3, 'In this first'),
    answer: lateChapter ? s.at(2, 'Job five still') : s.at(3, 'We kept'),
  };
}
export function archive(c, s, lateChapter) {
  const a = archiveState(s, lateChapter);
  surface(c);
  if (lateChapter && s.beat >= 5) {
    const fifth = a.rows[4];
    heading(
      c,
      'ARCHIVE REPLAY    /    SAME NOON CUTOFF',
      s.beat === 5
        ? 'Which revision could noon see?'
        : s.beat === 6
          ? 'When is the whole cohort due?'
          : 'Which labels tend to arrive first?',
    );
    if (s.beat === 5) {
      paper(c, 116, 288, 1670, 551, false);
      mono(
        c,
        fifth.id + '    /    deadline ' + time(noon + 60 * fifth.dueHours),
        167,
        373,
        44,
        C.muted,
      );
      [
        ['12:00 report', 'No label available'],
        ['13:00 storage', 'First label records a miss'],
      ].forEach(([t, l], i) => {
        const y = 508 + i * 168;
        mono(c, t, 169, y, 44, C.ink);
        txt(c, l, 797, y, 50, i ? C.red : C.brass);
      });
      txt(c, 'Preserve each revision and its arrival time.', 169, 778, 44);
    } else if (s.beat === 6) {
      const x = 195,
        w = 1430,
        y = 523;
      box(c, x, y - 43, w * 0.47, 86, '#a6c2ae', 6);
      txt(c, 'Prediction window', x + 50, y, 40);
      line(
        c,
        [
          [x + w * 0.47, y],
          [x + w, y],
        ],
        C.brass,
        6,
      );
      circle(c, x + w * 0.47, y, 15, C.sea);
      circle(c, x + w, y, 15, C.brass);
      txt(c, 'Last prediction', x + w * 0.47, y + 109, 39, C.ink, { align: 'center' });
      txt(c, 'Last deadline', x + w, y + 109, 39, C.ink, { align: 'center' });
      txt(c, 'Common deadline horizon', x + w * 0.74, y - 66, 38, C.brass, { align: 'center' });
      txt(c, 'For variable deadlines, test each job’s due time.', 127, 892, 48);
    } else {
      const outcomes = [true, true, false, false, false];
      txt(c, 'Example arrival order', 130, 354, 44, C.muted);
      outcomes.forEach((miss, i) => {
        const x = 190 + i * 287;
        circle(c, x, 535, 57, miss ? C.red : C.sea);
        txt(c, miss ? 'Miss' : 'Met', x, 535, 32, C.cream, { align: 'center' });
      });
      line(
        c,
        [
          [109, 665],
          [109, 693],
          [579, 693],
          [579, 665],
        ],
        C.brass,
        5,
      );
      mono(c, 'Early   2 / 2 missed', 116, 777, 42, C.brass);
      mono(c, 'Complete   2 / 5 missed', 950, 777, 42, C.ink);
      txt(c, 'With zero mature predictions, coverage is undefined.', 118, 942, 42, C.muted);
    }
    return;
  }
  heading(
    c,
    'PREDICTION ARCHIVE    /    AS OF 12:00',
    lateChapter ? 'One label arrives two hours later' : 'Six deadlines on the noon report',
  );
  // Ring and label stamp occupy different vertical lanes, including when their times coincide.
  const left = 365,
    step = 157,
    xx = (h) => left + (h + 5) * step;
  const cutoff = xx(0);
  box(c, cutoff, 281, xx(1) - cutoff + 65, 607, '#dddecb');
  for (let h = -5; h <= 1; h++) {
    const x = xx(h);
    line(
      c,
      [
        [x, 293],
        [x, 873],
      ],
      h === 0 ? C.brass : C.rule,
      h === 0 ? 5 : 1,
    );
    mono(c, time(noon + 60 * h), x, 263, 30, h === 0 ? C.brass : C.ink, 'center');
  }
  txt(c, 'Noon report', 1480, 263, 34, C.muted);
  a.rows.forEach((r, i) => {
    let y = 348 + i * 94;
    const closed = r.dueHours <= 0;
    const present = closed && r.arrivalHours !== null && r.arrivalHours <= 0;
    line(
      c,
      [
        [xx(-5) - 35, y],
        [xx(1) + 53, y],
      ],
      C.rule,
      2,
    );
    mono(c, r.id, 106, y, 39);
    circle(c, xx(r.dueHours), y, 14, C.cream, C.brass, 6);
    if (a.showLabels && r.arrivalHours !== null) {
      const lx = xx(r.arrivalHours);
      line(
        c,
        [
          [xx(r.dueHours), y + 16],
          [xx(r.dueHours), y + 28],
          [lx, y + 28],
        ],
        C.sea,
        3,
      );
      box(c, lx - 12, y + 16, 24, 24, C.sea, 3);
    }
    if (a.showLabels && closed) {
      box(c, 1480, y - 26, 285, 58, present ? '#d4e3cb' : '#f8ecd5', 4);
      if (!present) {
        c.strokeStyle = C.brass;
        c.lineWidth = 2;
        c.setLineDash([10, 7]);
        c.strokeRect(1480, y - 26, 285, 58);
        c.setLineDash([]);
      }
      const outcome = r.label ? 'Missed' : 'Met deadline';
      txt(
        c,
        present ? outcome : 'Label pending',
        1502,
        y + 5,
        34,
        present ? (r.label ? C.red : C.sea) : C.brass,
      );
    } else if ((!lateChapter && s.at(2, 'Leave it open')) || lateChapter) {
      const status = closed ? 'Closed' : lateChapter ? 'Window open' : 'Open';
      txt(c, status, 1502, y + 5, 33, closed ? C.ink : C.muted);
    }
  });
  circle(c, 117, 925, 12, C.cream, C.brass, 5);
  txt(c, 'Deadline', 145, 925, 33);
  if (a.showLabels) {
    box(c, 387, 913, 24, 24, C.sea, 3);
    txt(c, 'Label entered storage', 431, 925, 33);
  }
  if (a.answer)
    mono(
      c,
      a.totals.joined + ' / ' + a.totals.mature + ' joined   ' + pct(a.totals.coverage),
      1050,
      944,
      48,
      C.sea,
    );
  else if (lateChapter && s.at(1, 'At noon, how many'))
    txt(c, 'How many joined by noon?', 1046, 944, 42, C.ink);
}
export function identity(c, s) {
  surface(c, true);
  heading(c, 'IDENTITY CHECK    /    0.91', 'Who owns the outcome?', true);
  const joined = s.at(2, 'After one');
  [
    [snapshots[1].id, 'Live queue snapshot', 'Scored at noon', snapshots[1].score],
    ['p-005', 'Archived prediction', 'Deadline at 11:00', predictionRows[4].score],
  ].forEach(([id, l, t, score], i) => {
    const x = 112 + i * 897;
    paper(c, x, 280, 798, 608);
    txt(c, l, x + 55, 379, 39, C.muted);
    mono(c, id, x + 50, 486, 83, C.ink);
    line(
      c,
      [
        [x + 48, 555],
        [x + 747, 555],
      ],
      C.rule,
      3,
      [9, 7],
    );
    mono(c, fix(score), x + 51, 635, 59, C.sea);
    txt(c, t, x + 264, 635, 38);
    if (joined && i) stamp(c, 'MISSED  ·  label at 13:00', x + 50, 786, C.red, 34);
    else {
      line(
        c,
        [
          [x + 52, 806],
          [x + 600, 806],
        ],
        C.muted,
        3,
        [8, 9],
      );
      txt(c, i || s.beat === 1 ? 'Outcome' : 'Awaiting its own label', x + 52, 754, 36, C.muted);
    }
  });
}
export function checkDispatch() {
  assert.deepEqual(
    snapshots.map((r) => [time(noon - r.age), r.backlog, requestContract(r)]),
    [
      ['09:00', 22, 'freshness'],
      ['11:55', 40, 'pass'],
    ],
  );
  assert.deepEqual(requests.map(requestContract), [
    'pass',
    'pass',
    'pass',
    'schema',
    'freshness',
    'pass',
  ]);
  assert.deepEqual(
    [60, 61, -1].map((age) => requestContract({ ...requests[0], age })),
    ['pass', 'freshness', 'freshness'],
  );
  const probe = (beat, phrases = [], delay = 0) => ({
    beat,
    at: (n, p) => beat > n || (beat === n && (!p || phrases.includes(p))),
    motion: (n, p) => (beat > n ? 1 : beat === n && p === 'Move its arrival' ? delay : 0),
  });
  for (const [state, exp] of [
    [probe(1), [50, 100, 0.4, 0.2]],
    [probe(3, ['Open a hundred']), [100, 100, 0.2, 0.2]],
    [probe(3, ['Now open two hundred']), [200, 100, 0.1, 0.2]],
    [probe(4, ['On this row']), [200, 200, 0.1, 0.1]],
  ]) {
    const p = parityState(state);
    assert.deepEqual([p.trainingCapacity, p.liveCapacity, p.training, p.live], exp);
  }
  for (const [progress, expected] of [
    [0, [-1, 5]],
    [0.5, [0, 5]],
    [0.75, [0.5, 4]],
    [1, [1, 4]],
  ]) {
    const a = archiveState(probe(1, [], progress), true);
    const { dueHours, arrivalHours, ...prediction } = a.rows[4];
    assert.equal(dueHours, -1);
    assert.deepEqual({ ...prediction, dueHours, arrivalHours: 1 }, delayedPrediction);
    assert.deepEqual([arrivalHours, a.totals.joined], expected);
    assert.equal(a.totals.mature, 5);
    assert.equal(a.totals.immature, 1);
    assert.equal(a.answer, false);
  }
  assert.equal(archiveState(probe(2, ['Job five still']), true).answer, true);
  assert.equal(deployed.threshold, 0.5);
}
