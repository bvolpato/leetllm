import {
  afternoonHeartbeats,
  heartbeats,
  pairedRows,
  revisionRecords,
} from '../../../films/streaming-features/fixtures.mjs';
import {
  availableHeartbeat,
  applyLatestState,
  sourceFreshness,
  typedParity,
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
  rule,
  bracket,
  answer,
  after,
  progress,
  hh,
  heading,
} from './instrument.mjs';
const modeName = (m) =>
  ({
    normal: 'Normal scoring',
    degraded: 'Validated fallback',
    abstain: 'Withhold estimate',
    'unknown / abstain': 'Unknown · abstain',
    'invalid clock': 'Clock error',
  })[m];
function lagPolicy(g, y) {
  heading(g, 'LAG IN MINUTES', 45, y);
  mono(g, '≤15  Normal', 250, y, 17);
  mono(g, '15 < lag ≤ 45  Fallback', 430, y, 17);
  mono(g, '>45  Abstain', 755, y, 17);
}
function meter(g, x, y, r, minutes) {
  const a = (t) => Math.PI + (Math.PI * t) / 90;
  dot(g, x, y, r + 10, C.deep);
  dot(g, x, y, r + 5, C.lip);
  dot(g, x, y, r, C.paper);
  for (const [t, u, c] of [
    [0, 15, C.teal],
    [15, 45, '#b47b37'],
    [45, 90, C.rust],
  ]) {
    g.beginPath();
    g.arc(x, y, r - 14, a(t), a(u));
    g.lineWidth = 9;
    g.strokeStyle = c;
    g.stroke();
  }
  for (let t = 0; t <= 90; t += 5) {
    const large = t % 15 === 0,
      ang = a(t),
      d = r - (large ? 31 : 25);
    line(
      g,
      x + Math.cos(ang) * (r - 19),
      y + Math.sin(ang) * (r - 19),
      x + Math.cos(ang) * d,
      y + Math.sin(ang) * d,
      C.ink,
      large ? 2 : 1,
    );
    if ([0, 15, 45, 90].includes(t))
      mono(g, t, x + Math.cos(ang) * (r - 45), y + Math.sin(ang) * (r - 45), 15, C.ink, 'center');
  }
  if (minutes != null) {
    const ang = a(minutes),
      d = r - 59;
    path(
      g,
      [
        [x + 5 * Math.sin(ang), y - 5 * Math.cos(ang)],
        [x + d * Math.cos(ang), y + d * Math.sin(ang)],
        [x - 5 * Math.sin(ang), y + 5 * Math.cos(ang)],
      ],
      C.rust,
      1,
      true,
    );
  }
  dot(g, x, y, 8, C.ink);
  mono(g, minutes == null ? '?' : minutes + ' min', x, y + 36, 28, C.ink, 'center');
  mono(g, 'SOURCE LAG', x, y + 66, 14, C.grey, 'center');
}
export function policy(g, k) {
  board(g, k, 'A fast read can be stale', 'NOON REQUEST');
  const b = k.beat.beatIndex + 1;
  const through = [712, 690, 630][b - 1];
  const { lagSeconds, mode } = sourceFreshness(through * 60, 720 * 60);
  const read = after(k, b, ['Eight minutes of lag', 'Thirty minutes', 'Ninety minutes'][b - 1]);
  const result = after(k, b, ['Score normally', 'separately validated fallback', 'Withhold the narrow'][b - 1]);
  meter(g, 230, 292, 141, read ? lagSeconds / 60 : null);
  heading(g, 'ALL INPUTS COVERED THROUGH', 458, 160);
  mono(g, hh(through), 458, 208, 41, C.green);
  heading(g, 'REQUEST TIME', 458, 278);
  mono(g, '12:00', 458, 325, 41);
  if (result)
    type(g, modeName(mode), 460, 420, 33, mode === 'normal' ? C.green : C.amber, 'left', 'Serif');
  lagPolicy(g, 496);
}
export const boundaries = [900, 901, 2700, 2701, null, -1];
export function edges(g, k) {
  const b = k.beat.beatIndex + 1;
  board(
    g,
    k,
    b === 1 ? 'Three clocks on one row' : 'One second changes the mode',
    'FRESHNESS POLICY',
    b > 1,
  );
  if (b === 1) {
    [
      ['Heartbeat sent', '01:00', '8 h age'],
      ['Last write', '08:59', '1 min ago'],
      ['Covered through', '08:30', '30 min lag'],
    ].forEach(([a, v, u], i) => {
      const y = 156 + i * 98;
      mono(g, a, 47, y, 20, C.muted);
      mono(g, v, 376, y, 29);
      mono(g, u, 702, y, 23, i === 2 ? C.amber : C.green);
      line(g, 47, y + 40, 902, y + 40, C.lip, 1);
    });
    answer(g, 'REQUEST TIME', '09:00', 47, 414, 855);
    return;
  }
  if (b === 4) {
    heading(g, 'POLICY AT 09:00', 50, 136, true);
    type(g, '30 minutes of lag', 50, 195, 35, C.ink, 'left', 'Serif');
    line(g, 51, 239, 903, 239, '#a3aa94', 1);
    mono(g, 'Mode', 51, 289, 20, C.grey);
    mono(g, 'Degraded', 361, 289, 24, C.rust);
    if (after(k, 4, 'run it on the inputs')) {
      mono(g, 'Fallback evaluation', 51, 355, 20, C.grey);
      type(g, 'Use the inputs available during the delay.', 361, 355, 22, C.ink);
      mono(g, 'Lookup latency', 51, 422, 20, C.grey);
      type(g, 'Measure request and response times.', 361, 422, 22, C.ink);
    }
    return;
  }
  const revealAt = [
    'Fifteen minutes is normal',
    'Add one second',
    'Forty-five minutes',
    'One second more',
    'With missing',
    'A future',
  ];
  heading(g, 'EXACT SOURCE LAG', 64, 121, true);
  heading(g, 'POLICY DECISION', 430, 121, true);
  boundaries.forEach((sec, i) => {
    const y = 167 + i * 54;
    const value =
      sec == null
        ? 'Unknown'
        : sec < 0
          ? '−00:01'
          : String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
    const m = sourceFreshness(sec == null ? null : 3600 - sec, 3600).mode;
    mono(g, value, 64, y, 22, C.ink);
    if (after(k, 2, revealAt[i]))
      type(g, modeName(m), 429, y, 23, m === 'normal' ? C.teal : C.rust);
    line(g, 63, y + 23, 890, y + 23, '#acb09f', 1);
  });
  if (b >= 3) mono(g, 'Compare exact seconds before display rounding.', 64, 497, 16, C.grey);
}
const queueDepthByJob = new Map([['J-201', 5], ['J-202', 18]]);
export function rowsAt(rerun) {
  return pairedRows.map(({ job, offline, online: captured }) => ({
    job, offline, captured,
    online: rerun ? queueDepthByJob.get(job) : captured,
  }));
}
export function pairs(g, k) {
  board(g, k, 'Follow the value back to its job', 'PARITY');
  const b = k.beat.beatIndex + 1,
    swapped = after(k, 2, 'Serving swaps'),
    fixed = after(k, 3, 'The new run returns');
  const reveal = after(k, 3, 'Two rows disagree');
  heading(g, 'BATCH REPLAY', 58, 122);
  heading(g, fixed ? 'NEW SERVING RUN' : 'CAPTURED SERVING', 671, 122);
  const rows = rowsAt(fixed);
  const y = (i) => 207 + 123 * i;
  if (swapped) {
    for (let i = 0; i < 2; i++) {
      const dest = rows.findIndex((r) => r.online === rows[i].offline);
      const color = i ? C.amber : C.green;
      g.beginPath();
      g.moveTo(332, y(i));
      g.bezierCurveTo(456, y(i), 499, y(dest), 626, y(dest));
      g.strokeStyle = C.deep;
      g.lineWidth = 10;
      g.stroke();
      g.strokeStyle = color;
      g.lineWidth = 5;
      g.stroke();
      dot(g, 333, y(i), 8, color);
      dot(g, 626, y(dest), 8, color);
    }
  }
  rows.forEach((r, i) => {
    ticket(g, 54, y(i) - 42, 260, 82, r.job + '    REPLAY', String(r.offline));
    ticket(g, 646, y(i) - 42, 265, 82, r.job + (fixed ? '    RERUN' : '    CAPTURE'), swapped ? String(r.online) : '?');
  });
  if (reveal)
    answer(
      g,
      'MATCH BY REQUEST',
      rows.filter((r) => r.offline !== r.online).length + ' mismatches',
      51,
      417,
      861,
    );
  else
    type(
      g,
      b === 1
        ? 'Pair the request, cutoff, routing and definition version.'
        : 'How many request pairs disagree?',
      50,
      450,
      25,
      C.cream,
      'left',
      'Serif',
    );
  if (fixed)
    mono(g, 'Original capture     ' + rows.map((r) => r.job + '  ' + r.captured).join('     ·     '), 52, 496, 17, C.muted);
}
const floatPair = [0.25, 0.2504];
export const schemaExamples = { floatPair, tolerance: 0.001 };
export function correctionAges(servingRecords = revisionRecords) {
  const cutoff = 640;
  const store = new Map();
  for (const record of servingRecords) {
    if (record.available <= cutoff) applyLatestState(store, record);
  }
  return [availableHeartbeat(revisionRecords, cutoff).ageHours * 60, cutoff - store.get('J-204').event];
}
export function fields(g, k) {
  const b = k.beat.beatIndex + 1;
  board(
    g,
    k,
    b <= 2
      ? 'Equal-looking fields'
      : b <= 4
        ? 'How close is close enough?'
        : 'Replay against a known answer',
    'FIELD CONTRACT',
    true,
  );
  if (b <= 2) {
    const rows = [
      ['Field presence', 'Absent', 'Present: null'],
      ['Integer flag', '0', 'False'],
    ];
    heading(g, 'FIELD', 51, 133, true);
    heading(g, 'REPLAY', 348, 133, true);
    heading(g, 'SERVING', 624, 133, true);
    rows.forEach(([label, v, w], i) => {
      const y = 202 + i * 91;
      mono(g, label, 51, y, 20, C.ink);
      mono(g, v, 348, y, 23, C.teal);
      mono(g, w, 624, y, 23, C.rust);
      line(g, 50, y + 39, 904, y + 39, '#abb09c', 1);
    });
    type(
      g,
      b === 1
        ? 'Python equality accepts 0 == False.'
        : 'The schema requires an integer. The Boolean fails.',
      51,
      417,
      26,
      C.ink,
      'left',
      'Serif',
    );
  } else if (b <= 4) {
    heading(g, 'REPLAY', 56, 137, true);
    mono(g, '0.2500', 56, 190, 38, C.ink);
    heading(g, 'SERVING', 535, 137, true);
    mono(g, '0.2504', 535, 190, 38, C.ink);
    const x = rule(
      g,
      98,
      332,
      743,
      0,
      0.00125,
      [
        [0, '0'],
        [0.0005, '0.0005'],
        [0.001, '0.001'],
      ],
      C.grey,
    );
    line(g, x(0.001), 273, x(0.001), 325, C.rust, 3);
    mono(g, 'Absolute limit', x(0.001), 249, 17, C.rust, 'center');
    if (after(k, 3, 'Four ten-thousandths')) {
      const diff = Math.abs(floatPair[0] - floatPair[1]);
      bracket(g, x(0), x(diff), 301, diff.toFixed(4), C.teal);
      const mismatches = typedParity(
        { estimate: floatPair[0] },
        { estimate: floatPair[1] },
        { absolute: 0.001 },
      );
      type(
        g,
        mismatches.length ? 'Outside tolerance' : 'Finite estimates pass within 0.001.',
        51,
        445,
        26,
        C.teal,
        'left',
        'Serif',
      );
    }
  } else {
    const examples = [
      ['10:40 age parity', ...correctionAges().map((v) => v + ' min')],
      ['Same-key conflict', 'Quarantine', 'Quarantine'],
      ['16:00 age', '4 h', '4 h'],
      ['Job key swapped', '5 / 18', '18 / 5'],
      ['Age cached at write', '4 h', '0.03 h'],
    ];
    heading(g, 'CASE', 50, 116, true);
    heading(g, 'REPLAY', 401, 116, true);
    heading(g, 'SERVING', 619, 116, true);
    examples.forEach(([label, v, w], i) => {
      const y = 163 + i * 57;
      mono(g, label, 50, y, 17, C.ink);
      mono(g, v, 401, y, 17, C.ink);
      mono(g, w, 619, y, 17, C.ink);
      const resultCue = i === 0 ? 'Both paths give ten minutes' : i < 3 ? 'cases also agree' : 'Both deliberate errors fail';
      const ready = after(k, 5, resultCue);
      if (ready) mono(g, v === w ? 'Pass' : 'Fail', 851, y, 17, v === w ? C.teal : C.rust);
      line(g, 49, y + 25, 910, y + 25, '#adb3a0', 1);
    });
    if (after(k, 5, 'To check the revision'))
      type(g, 'Compare revision or phase separately to check the correction.', 49, 444, 22, C.ink);
    if (b === 6)
      type(
        g,
        'A hand-computed answer also catches a shared bug.',
        49,
        485,
        21,
        C.ink,
        'left',
        'Serif',
      );
  }
}

export function cached(g, k) {
  const b = k.beat.beatIndex + 1;
  board(g, k, b <= 2 ? 'One request, two ages' : 'Hold the worker timestamp fixed', 'J-204');
  const times = b < 3 ? [960] : [900, 960];
  const repair = after(k, 4, 'rerun paired replay');
  heading(g, 'REQUEST', 51, 138);
  heading(g, 'EXPECTED FROM H3', 316, 138);
  heading(g, repair ? 'CORRECTED READ' : b >= 3 ? 'IF AGE WAS CACHED' : 'CAPTURED READ', 673, 138);
  times.forEach((time, i) => {
    const y = 211 + i * 93;
    const read = availableHeartbeat(heartbeats, time);
    mono(g, hh(time), 52, y, 29, C.cream);
    mono(g, hh(time) + ' − ' + hh(read.event) + ' = ' + read.ageHours + ' h', 316, y, 21, C.green);
    mono(g, repair ? read.ageHours + ' h' : '0.03 h', 676, y, 27, repair ? C.green : C.red);
    line(g, 51, y + 41, 910, y + 41, C.lip, 1);
  });
  if (b >= 3 && !repair)
    mono(
      g,
      'Probe: if both reads return 0.03 h, trace the stored field and units.',
      49,
      430,
      16,
      C.muted,
    );
  else if (repair)
    ticket(
      g,
      46,
      389,
      857,
      82,
      'ORIGINAL 16:00 CAPTURE   /   RETAINED',
      '0.03 h     ·     rerun the paired comparison',
    );
  else
    type(
      g,
      b === 2
        ? 'Trace H3, its timestamp and its units.'
        : 'Would you choose a model from this comparison?',
      50,
      427,
      29,
      C.cream,
      'left',
      'Serif',
    );
}
export const practiceJob = { id: 'J-206', heartbeats: afternoonHeartbeats };
export const finalRead = (at) => availableHeartbeat(practiceJob.heartbeats, at);
export const finalMode = (through) => sourceFreshness(through * 60, 850 * 60);
export function final(g, k) {
  const b = k.beat.beatIndex + 1;
  board(
    g,
    k,
    b <= 4 ? 'Two reads, ten minutes apart' : 'The same heartbeat, a different frontier',
    practiceJob.id + '   /   PRACTICE',
  );
  const sealed = after(k, 2, 'H seven, three hours');
  const later = after(k, 2, 'Move the request');
  const now = later ? 850 : 840;
  const h7 = finalRead(840),
    r = finalRead(now);
  if (b <= 4) {
    const times = [
      [afternoonHeartbeats[0].event, null, afternoonHeartbeats[0].available],
      [
        afternoonHeartbeats[1].event,
        afternoonHeartbeats[1].ingested,
        afternoonHeartbeats[1].available,
      ],
    ];
    const cols = [224, 455, 700];
    ['WORKER', 'BROKER', 'PUBLISHED'].forEach((s, i) => heading(g, s, cols[i], 131));
    times.forEach((t, i) => {
      const y = 197 + i * 84;
      const h = afternoonHeartbeats[i];
      wave(g, h.id, 45, y - 12, 58, 12, C.green);
      mono(g, h.id, 116, y - 9, 20);
      for (let j = 0; j < 3; j++) {
        if (t[j] != null) mono(g, hh(t[j]), cols[j], y, 26, t[j] > now ? C.amber : C.cream);
        else mono(g, '·', cols[j], y, 22, C.muted);
      }
      line(g, 46, y + 32, 906, y + 32, C.lip, 1);
    });
    ticket(
      g,
      44,
      364,
      389,
      91,
      practiceJob.id + '   14:00 CAPTURE',
      sealed ? h7.id + '    ' + h7.ageHours + ' h' : 'Pulse ?    Age ?',
    );
    if (later) {
      const ready = after(k, 2, 'Now the scheduler reads');
      ticket(
        g,
        469,
        364,
        440,
        91,
        practiceJob.id + '   14:10 CAPTURE',
        ready ? r.id + '    ' + r.ageHours * 60 + ' min' : 'Pulse ?    Age ?',
        C.teal,
      );
    }
    if (after(k, 4, 'At two ten'))
      mono(g, '14:10 − 13:50 = 20 min since H8 was sent', 46, 485, 17, C.green);
  } else {
    const corrected = after(k, 7, 'one fifty-five');
    const through = corrected ? 835 : 820;
    const active = finalMode(through);
    const stated = corrected ? after(k, 8, 'Fifteen minutes') : after(k, 6, 'thirty minutes');
    const decided = corrected ? after(k, 8, 'Score normally') : after(k, 6, 'Use the validated');
    const x = (t) => 341 + (t - 815) * 15;
    const lanes = [
      ['H8 sent', 830, '20 min old'],
      ['Row written', 849, '1 min ago'],
      ['All inputs covered', through, stated ? active.lagSeconds / 60 + ' min lag' : 'Lag ?'],
    ];
    line(g, x(850), 126, x(850), 343, C.amber, 2);
    mono(g, 'Read 14:10', x(850), 105, 17, C.amber, 'center');
    lanes.forEach(([name, t, units], i) => {
      const y = 165 + i * 77;
      mono(g, name, 44, y, 16, C.muted);
      mono(g, hh(t), 237, y, 19, C.cream);
      line(g, x(t), y, x(850), y, i === 2 ? C.green : C.lip, 4);
      dot(g, x(t), y, 6, i === 2 ? C.green : C.muted);
      mono(g, units, 849, y + 25, 15, i === 2 ? C.green : C.muted, 'right');
    });
    lagPolicy(g, 379);
    ticket(g, 45, 414, 347, 83, practiceJob.id + '   14:00 SEALED CAPTURE', h7.id + '    ' + h7.ageHours + ' h');
    ticket(
      g,
      412,
      414,
      494,
      83,
      practiceJob.id + '   14:10 SCORING MODE',
      decided
        ? active.mode === 'degraded'
          ? 'Degraded · fallback'
          : modeName(active.mode)
        : 'Which mode?',
      decided ? (active.mode === 'normal' ? C.teal : C.rust) : C.ink,
    );
  }
}
