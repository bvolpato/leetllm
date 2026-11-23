import {
  C,
  at,
  base,
  box,
  line,
  dot,
  txt,
  mono,
  serif,
  note,
  unit,
  shell,
  form,
} from './bench.mjs';
import {
  observations,
  traces,
  shiftProfiles,
  edgeDevice,
  sum,
  trialTimes,
  trialRank,
  trialLimit,
} from './examples.mjs';
const fmtSecs = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });
export function thermal(ctx, c) {
  const i = c.beat.id;
  const replay = i === 'runb',
    run = Number(replay),
    trace = traces[run];
  let minute;
  if (i === 'strip') minute = 1.5 * c.reveal('As the strip moves', 2);
  if (i === 'dip')
    minute = at(c, 'sixteen point eight') ? 8 : 1.5 + 6.45 * c.reveal('Advance to minute eight', 2);
  if (i === 'recover')
    minute = at(c, 'eighteen point six') ? 10 : 8 + 1.96 * c.reveal('At minute ten', 2);
  if (replay)
    minute = at(c, 'is nineteen') ? 10 : 9.95 * c.reveal('Replay with a second', 3.5);
  const { seen, latest, lowest } = observations(trace, minute);
  base(ctx, 'Can a fast finish erase a slow sample?', 'TEN-MINUTE RECORDER');
  shell(ctx, 33, 108, 894, 320);
  box(ctx, 55, 133, 655, 265, C.paper, 6);
  const left = 100,
    right = 680,
    top = 166,
    bottom = 347;
  const scroll = Math.max(0, minute - 6) * 0.58;
  const x = (t) => left + (t - scroll) * 57;
  const y = (v) => bottom - ((v - 15) * (bottom - top)) / 9;
  ctx.save();
  ctx.beginPath();
  ctx.rect(left - 6, top - 8, right - left + 12, bottom - top + 45);
  ctx.clip();
  for (let t = 0; t <= 12; t++) {
    line(
      ctx,
      [
        [x(t), top],
        [x(t), bottom],
      ],
      C.grid,
      1,
    );
    if (t % 2 === 0) mono(ctx, String(t), x(t), bottom + 18, 14, C.muted, 'center');
  }
  [16, 18, 20, 22, 24].forEach((v) =>
    line(
      ctx,
      [
        [left, y(v)],
        [right, y(v)],
      ],
      v === 18 ? C.orange : C.grid,
      v === 18 ? 2.5 : 1,
    ),
  );
  const stroke = (points, color, r = 5) => {
    if (points.length > 1)
      line(
        ctx,
        points.map(([t, v]) => [x(t), y(v)]),
        color,
        2.5,
      );
    for (const [t, v] of points) dot(ctx, x(t), y(v), r, color);
  };
  if (replay) {
    stroke(traces[0], '#97a29a', 3.5);
    dot(ctx, x(8), y(16.8), 7, C.orange);
    dot(ctx, x(8), y(16.8), 3, C.white);
  }
  stroke(seen, replay ? C.plum : C.green);
  const [tm, rate] = lowest;
  dot(ctx, x(tm), y(rate), 9, C.paper);
  dot(ctx, x(tm), y(rate), 6, rate < 18 ? C.orange : C.green);
  line(
    ctx,
    [
      [x(minute), top],
      [x(minute), bottom],
    ],
    '#738c83',
    1.3,
  );
  ctx.restore();
  for (const v of [16, 18, 20, 22, 24])
    mono(ctx, '' + v, 87, y(v), 14, v === 18 ? C.orange : C.muted, 'right');
  txt(ctx, 'tokens/s', 66, 148, 13, C.muted);
  txt(ctx, 'minutes', 646, 380, 14, C.muted, 'center');
  txt(ctx, 'Floor 18', 601, y(18) - 12, 15, C.orange);
  txt(ctx, 'RUN ' + (replay ? 'B' : 'A'), 744, 155, 18, C.white, { weight: 600 });
  txt(ctx, 'Latest sample', 744, 201, 17, C.mint);
  mono(ctx, latest[1].toFixed(1), 744, 238, 38, C.white);
  txt(ctx, 'Lowest sample', 744, 293, 17, C.mint);
  mono(ctx, lowest[1].toFixed(1), 744, 330, 38, lowest[1] < 18 ? '#ffba8a' : C.white);
  txt(ctx, 'at ' + unit(lowest[0]) + ' min', 744, 366, 17, C.mint);
  let label = 'Synthetic samples   ·   every dot must reach 18 tokens/s.';
  if (run === 0 && rate < 18)
    label =
      minute === 10
        ? 'Current 18.6   ·   lowest 16.8   ·   run A misses the floor.'
        : 'The 16.8 sample stays on the strip. What if the rate recovers?';
  if (replay)
    label =
      minute === 10
        ? 'B clears the sampled floor. The gray trace preserves run A.'
        : 'Run B in purple   ·   run A retained in gray';
  note(ctx, label);
}

const phaseColors = [C.plum, C.green, C.copper];
const phaseNames = ['Retrieval + prefill', 'Decode', 'Idle'];
function phaseTable(ctx, phases, count, knownEnergy, times = {}) {
  const xs = [49, 372, 554, 739];
  ['Phase', 'Seconds', 'Power', 'Energy'].forEach((s, i) =>
    txt(ctx, s, xs[i], 164, 16, C.muted, { weight: 600 }),
  );
  phases.forEach(({ seconds, watts }, i) => {
    const y = 206 + 45 * i;
    line(
      ctx,
      [
        [48, y - 22],
        [909, y - 22],
      ],
      C.grid,
      1,
    );
    if (!count.includes(i)) return;
    box(ctx, 50, y - 11, 6, 22, phaseColors[i], 2);
    txt(ctx, phaseNames[i], 71, y, 20);
    mono(ctx, times[i] ?? fmtSecs(seconds), 372, y, 20);
    mono(ctx, unit(watts) + ' W', 554, y, 20);
    if (knownEnergy.includes(i))
      mono(ctx, ((seconds * watts) / 3600).toFixed(2) + ' Wh', 739, y, 20);
  });
}
function battery(
  ctx,
  { x = 164, y, width = 645, phases, name, max, usable, complete, drawParts, totalLabel },
) {
  const h = 28,
    scale = width / max;
  txt(ctx, name, 48, y + h / 2, 17, C.ink, { weight: 600 });
  box(ctx, x, y, width, h, '#e0dece', 4, C.metal);
  box(ctx, x + usable * scale, y + 2, (max - usable) * scale - 2, h - 4, '#e8cdbc', 2);
  box(ctx, x + width + 1, y + 6, 8, 16, C.metal, 2);
  let off = 0;
  phases.forEach(({ watts, seconds }, i) => {
    if (!drawParts.includes(i)) return;
    const w = ((seconds * watts) / 3600) * scale;
    box(ctx, x + off, y + 3, w, h - 6, phaseColors[i]);
    off += w;
  });
  line(
    ctx,
    [
      [x + usable * scale, y - 6],
      [x + usable * scale, y + h + 5],
    ],
    C.orange,
    2,
  );
  if (complete) mono(ctx, totalLabel, x + width + 19, y + h / 2, 17, C.ink);
}
const wh = (phases) => sum(phases.map(({ watts, seconds }) => (watts * seconds) / 3600));
export function energy(ctx, c) {
  const i = c.beat.id,
    second = (i === 'other' && at(c, 'Use Boost now')) || i === 'bill';
  const [eco, boost] = shiftProfiles;
  const a = eco.phases,
    b = boost.phases;
  if (i === 'decode' && !at(c, 'Start with Eco')) {
    base(ctx, 'What rates should we budget for this shift?', 'BATTERY WORKSHEET');
    txt(ctx, 'Planning assumptions for 30,000 tokens over 8 hours', 49, 135, 24);
    const xs = [61, 328, 650];
    ['Profile', 'Assumed decode rate', 'Whole-device power'].forEach((s, j) =>
      txt(ctx, s, xs[j], 209, 19, C.muted),
    );
    [eco, boost].forEach((p, j) => {
      const y = 263 + 78 * j;
      const active = at(c, j ? 'Boost runs' : 'Eco runs');
      line(
        ctx,
        [
          [49, y - 33],
          [908, y - 33],
        ],
        C.grid,
        1,
      );
      txt(ctx, j ? 'Boost' : 'Eco', xs[0], y, 26);
      if (active) {
        mono(ctx, p.rate + ' tokens/s', xs[1], y, 25, C.green);
        mono(ctx, p.watts + ' W', xs[2], y, 25);
      }
    });
    note(ctx, 'The recorder sampled ten minutes. This worksheet assumes rates for the shift.');
    return;
  }
  const phases = second ? b : a,
    firstSettled =
      (i === 'shift' && at(c, 'eleven point one three')) || i === 'other' || i === 'bill';
  const secondSettled = i === 'bill' && at(c, 'fourteen point zero seven');
  const decodeKnown = i !== 'decode' || at(c, 'one point six two');
  const idleKnown = i !== 'decode';
  base(ctx, 'Will the whole shift fit in usable charge?', 'BATTERY WORKSHEET');
  txt(
    ctx,
    '8 h   ·   30,000 tokens   ·   ' +
      (second ? 'Boost at ' + boost.rate : 'Eco at ' + eco.rate) +
      ' tokens/s assumed   ·   whole-device power',
    48,
    120,
    21,
  );
  phaseTable(
    ctx,
    phases,
    idleKnown ? [0, 1, 2] : [1],
    second ? (secondSettled ? [0, 1, 2] : [0]) : firstSettled ? [0, 1, 2] : decodeKnown ? [1] : [],
  );
  txt(ctx, 'Energy used', 48, 343, 16, C.muted);
  mono(ctx, '12 usable', 164 + (645 * 12) / 15, 343, 16, C.orange, 'center');
  mono(ctx, '15 Wh', 164 + 645, 343, 15, C.muted, 'center');
  battery(ctx, {
    y: 363,
    phases: a,
    name: 'Eco',
    max: 15,
    usable: 12,
    complete: firstSettled,
    drawParts: firstSettled ? [0, 1, 2] : decodeKnown ? [1] : [],
    totalLabel: wh(a).toFixed(2) + ' Wh',
  });
  if (second)
    battery(ctx, {
      y: 409,
      phases: b,
      name: 'Boost',
      max: 15,
      usable: 12,
      complete: secondSettled,
      drawParts: secondSettled ? [0, 1, 2] : [0],
      totalLabel: wh(b).toFixed(2) + ' Wh',
    });
  note(
    ctx,
    secondSettled
      ? '14.07 Wh crosses the reserve line. Boost misses the shift budget.'
      : second
        ? 'Same demand and pack. Recompute decode time and the idle remainder.'
        : 'Energy per phase = whole-device watts × seconds ÷ 3,600',
  );
}

function latencyTrial(ctx, c) {
  const ranked = at(c, 'the nineteenth time');
  const timed = at(c, 'two hundred thirty-eight milliseconds');
  base(ctx, 'How long until the crew sees the first token?', 'OFFLINE ACCEPTANCE RUN');
  txt(ctx, '20 representative requests   ·   illustrative end-to-end times', 44, 118, 21);
  txt(ctx, 'Dispatch  →  retrieval  →  prefill  →  first visible token', 44, 160, 19, C.muted);
  const x = (i) => 72 + i * 43;
  const y = (ms) => 382 - ms * 0.6;
  const bound = y(trialLimit);
  line(
    ctx,
    [
      [52, bound],
      [916, bound],
    ],
    C.orange,
    2,
  );
  txt(ctx, '250 ms', 58, bound - 15, 17, C.orange);
  trialTimes.forEach((ms, i) => {
    const marked = ranked && i === trialRank - 1;
    box(ctx, x(i) - 9, y(ms), 18, 382 - y(ms), marked ? C.green : C.track, 2);
    dot(ctx, x(i), y(ms), marked ? 6 : 4, marked ? C.green : C.muted);
    if ([0, trialRank - 1, trialTimes.length - 1].includes(i))
      mono(ctx, String(i + 1), x(i), 398, 15, C.ink, 'center');
    if (marked && timed) mono(ctx, ms + ' ms', x(i), bound - 20, 17, C.green, 'center');
    if (i === trialTimes.length - 1) mono(ctx, ms + ' ms', x(i), y(ms) - 17, 17, C.ink, 'center');
  });
  txt(ctx, 'Request rank, fastest to slowest', 478, 423, 18, C.muted, { align: 'center' });
  let message = 'Target   ·   p95 time to first visible token under 250 ms';
  if (timed)
    message =
      'Rank 19 of 20 gives p95 = ' +
      trialTimes[trialRank - 1] +
      ' ms. The maximum is ' +
      trialTimes.at(-1) +
      ' ms.';
  note(ctx, message);
}
export function field(ctx, c) {
  const i = c.beat.id;
  if (i === 'crew') {
    const d = edgeDevice();
    base(ctx, 'A six-hour trial underground', 'NEW CREW');
    txt(ctx, 'One complete read per step   ·   2.4B active weights   ·   4 bits each', 48, 132, 22);
    const bus = at(c, 'thirty steps a second');
    mono(ctx, '36 GB/s  ÷  1.2 GB', 48, 203, 30);
    if (bus) mono(ctx, '=  ' + d.ceiling + ' steps/s at most', 478, 203, 27, C.green);
    txt(ctx, 'Resident memory    /    2,048 MiB', 48, 287, 21);
    const x0 = 52,
      w = 844;
    let x = x0;
    box(ctx, x, 320, w, 43, C.track, 4);
    d.memory.forEach((v, j) => {
      const width = (w * v) / 2048;
      box(ctx, x, 320, width, 43, [C.plum, C.green, C.copper, C.dark][j]);
      x += width;
      txt(
        ctx,
        ['Weights', 'Cache', 'Workspace', 'Runtime'][j] + ' ' + unit(v),
        52 + j * 216,
        393,
        18,
      );
    });
    note(
      ctx,
      c.elapsed >= c.speechDuration
        ? 'Resident allocations sum to ' + unit(d.resident) + ' MiB, leaving ' + d.margin + ' MiB.'
        : 'Count weights, cache, workspace and runtime against the same RAM limit.',
    );
    return;
  }
  if (i === 'trial' && at(c, 'Sort these twenty') && !at(c, 'Check the ten-minute rate'))
    return latencyTrial(ctx, c);
  const original = edgeDevice(1),
    repair = edgeDevice(0.9);
  const changed = i === 'trial' || (i === 'firstbill' && at(c, 'point nine watts'));
  const settled = i === 'trial' && at(c, 'six point zero nine');
  const first = i === 'trial' || (i === 'firstbill' && at(c, 'six point six seven'));
  const toPhases = (d) => d.seconds.map((seconds, j) => ({ seconds, watts: d.watts[j] }));
  const phases = toPhases(changed ? repair : original);
  base(ctx, 'Can the next crew finish its shift?', 'NEW CREW');
  txt(ctx, '6 hours   ·   10,000 tokens at 20 tokens/s   ·   6.5 usable Wh', 48, 121, 22);
  if (i === 'trial' && at(c, 'Start it offline')) {
    txt(ctx, 'Offline acceptance run', 49, 177, 21, C.muted);
    if (at(c, 'Check the ten-minute rate'))
      txt(
        ctx,
        'Example p95   ' + trialTimes[trialRank - 1] + ' ms < ' + trialLimit + ' ms',
        512,
        177,
        19,
        C.green,
      );
    const known = at(c, 'and try a missing'),
      missing = at(c, 'a missing code');
    txt(ctx, 'Sensor A   /   E2', 50, 232, 24);
    if (known) serif(ctx, 'M7    ·    battery low', 378, 232, 26, C.green);
    txt(ctx, 'Sensor A   /   E9', 50, 295, 24);
    if (missing) serif(ctx, 'No local entry    ·    review', 378, 295, 26, C.orange);
  } else {
    const knownEnergy = settled || (first && !changed) ? [0, 1, 2] : changed ? [0, 1] : [];
    const times = {};
    if (i === 'order' || (i === 'firstbill' && !at(c, 'five hundred seconds'))) times[1] = '10,000 ÷ 20';
    if (i === 'order' || (i === 'firstbill' && !at(c, 'twenty thousand eight hundred'))) times[2] = 'Remainder';
    phaseTable(ctx, phases, [0, 1, 2], knownEnergy, times);
  }
  txt(ctx, 'Shift energy', 48, 345, 16, C.muted);
  txt(ctx, '6.5 Wh', 164 + (645 * 6.5) / 7.5, 345, 16, C.orange, { align: 'center' });
  battery(ctx, {
    y: 366,
    phases: toPhases(original),
    name: 'Idle 1 W',
    max: 7.5,
    usable: 6.5,
    complete: first,
    drawParts: first ? [0, 1, 2] : [],
    totalLabel: original.total.toFixed(2) + ' Wh',
  });
  if (changed)
    battery(ctx, {
      y: 411,
      phases: toPhases(repair),
      name: 'Idle 0.9 W',
      max: 7.5,
      usable: 6.5,
      complete: settled,
      drawParts: settled ? [0, 1, 2] : [0, 1],
      totalLabel: repair.total.toFixed(2) + ' Wh',
    });
  if (i === 'trial' && at(c, 'Next speculative decoding')) {
    note(ctx, 'Next lesson   ·   a small model drafts, a target model verifies.');
    return;
  }
  note(
    ctx,
    settled
      ? 'Qualify this candidate on the handheld, including the first read after recovery.'
      : changed
        ? 'Change only idle watts. Keep every phase duration.'
        : 'The idle interval is everything left after retrieval, prefill and decode.',
  );
}
