import { C, mix, cap, series } from './bench.mjs';
import {
  tokenValues,
  extendedValues,
  freshRuntimeValues,
  ticketClock,
  freshClock,
} from '../../../films/cuda-execution/fixtures.mjs';
import { executionAt, reduction, warmupTrace } from '../../../films/cuda-execution/arithmetic.mjs';

function meter(v, time, clock) {
  const { ctx, text, line, dot } = v,
    cx = 238,
    cy = 259,
    r = 141;
  const rim = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  [
    [0, '#5d6c60'],
    [0.28, '#ebddaf'],
    [0.48, '#a2a08b'],
    [0.7, '#e2d3ab'],
    [1, '#566456'],
  ].forEach(([a, c]) => rim.addColorStop(a, c));
  const enamel = ctx.createRadialGradient(cx - 34, cy - 35, 8, cx, cy, r);
  enamel.addColorStop(0, '#fffae4');
  enamel.addColorStop(0.92, C.paper);
  enamel.addColorStop(1, '#c7c2a5');
  dot(cx + 2, cy + 5, r + 6, C.deep);
  dot(cx, cy, r + 6, rim);
  dot(cx, cy, r + 2, '#4a5950');
  dot(cx, cy, r, enamel);
  const max = 50;
  const angle = (t) => (0.72 + (1.56 * t) / max) * Math.PI;
  function point(t, rad) {
    return [cx + Math.cos(angle(t)) * rad, cy + Math.sin(angle(t)) * rad];
  }
  for (const i of series(max + 1)) {
    const [x, y] = point(i, 127);
    line(...point(i, i % 5 ? 121 : 116), x, y, C.ink, i % 5 ? 1 : 2.4);
    if (i % 5 === 0) text(i, ...point(i, 100), 16, C.ink, 'center', 'Mono');
  }
  if (time > clock.eventStart) {
    ctx.beginPath();
    ctx.arc(cx, cy, 134, angle(clock.eventStart), angle(Math.min(time, clock.eventEnd)));
    ctx.strokeStyle = '#248a82';
    ctx.lineWidth = 6;
    ctx.stroke();
    dot(...point(clock.eventStart, 134), 4, C.ink);
    if (time >= clock.eventEnd) dot(...point(clock.eventEnd, 134), 4, C.ink);
  }
  const theta = angle(time),
    tip = point(time, 122);
  ctx.beginPath();
  ctx.moveTo(...tip);
  ctx.lineTo(
    cx - 11 * Math.cos(theta) + 3.6 * Math.sin(theta),
    cy - 11 * Math.sin(theta) - 3.6 * Math.cos(theta),
  );
  ctx.lineTo(
    cx - 11 * Math.cos(theta) - 3.6 * Math.sin(theta),
    cy - 11 * Math.sin(theta) + 3.6 * Math.cos(theta),
  );
  ctx.closePath();
  ctx.fillStyle = C.ink;
  ctx.fill();
  line(cx, cy, ...point(Math.min(time, clock.hostReturn), 77), '#a34132', 6);
  dot(cx, cy, 8, '#7f7862');
  dot(cx, cy, 3, C.ink);
  text('ms', cx, cy + 80, 20, C.ink, 'center', 'Serif');
}
function log(v, id, value, interval) {
  const { strip, text, line, box, dot, ctx } = v;
  const steel = ctx.createLinearGradient(0, 155, 0, 213);
  [
    [0, '#4c6258'],
    [0.24, '#9fa78d'],
    [0.4, '#c3bea1'],
    [0.48, '#667769'],
    [0.72, '#566c60'],
    [1, '#293d35'],
  ].forEach(([a, c]) => steel.addColorStop(a, c));
  box(504, 152, 390, 65, C.deep, 10);
  box(505, 151, 388, 60, steel, 10);
  box(516, 167, 365, 20, '#1b2821', 4);
  box(520, 172, 357, 6, '#586151', 2);
  for (const x of [511, 887]) dot(x, 180, 2.5, C.ink);
  strip(519, 178, 360, 181);
  text('TICKET ' + id, 545, 203, 17, C.ink, 'left', 'Mono');
  line(544, 224, 855, 224, C.shade, 1);
  text('Pooled feature', 545, 249, 16, C.ink);
  text(value ?? '···', 850, 250, 27, C.ink, 'right', 'Mono');
  text('Caller time', 545, 304, 16, C.ink);
  text(interval == null ? '···' : interval + ' ms', 850, 304, 27, C.ink, 'right', 'Mono');
  line(545, 332, 855, 332, C.shade, 1);
}
export function timepiece(v, recap = false) {
  const { b, cue, said, text, readout } = v;
  const f = ticketClock,
    values = tokenValues;
  let t,
    request,
    print,
    enterTime = false;
  if (recap) {
    t =
      2 * cue(0, 'short hand stops') +
      39 * cue(1, 'Let the device finish', 2.1) +
      cue(1, 'Now read the scalar');
    request = cue(1, 'Call item');
    print = t >= 42;
    enterTime = said(1);
  } else {
    t = 2 * cue(0, 'Python asks') + 39 * cue(1, 'Follow the needle', 2) + cue(2, 'Now the scalar arrives');
    request = cue(1, 'we call item');
    print = cue(2, 'Watch the printer') === 1;
  }
  const state = executionAt(t, f, values);
  meter(v, t, f);
  text('Python  /  ' + (request ? 'm.item()' : 'm = x.mean()'), 520, 121, 23, C.silk, 'left', 'Mono');
  log(
    v,
    102,
    print && state.reported ? state.scalar.toFixed(3) : null,
    enterTime ? state.hostInterval : null,
  );
  const status = state.reported
    ? 'Scalar received at ' + f.scalarAt + ' ms'
    : request
      ? 'Python is waiting'
      : state.returned
        ? 'CUDA tensor returned at ' + f.hostReturn + ' ms'
        : 'Submitting the mean';
  text(status, 702, 382, 18, state.reported ? C.mint : C.gold, 'center');
  if (recap)
    readout(
      t >= 41 ? 'Stream events   41 − 1 = 40 ms' : 'Same stream   ·   mean → next layer',
      'Red hand: launch returns     •     Black hand: caller clock',
    );
  else
    readout(
      'GPU input    ' + values.join('   '),
      'Modeled run   ·   The short red hand stops when mean returns.',
    );
}
function freshTimepiece(v) {
  const { b, clock, cue, text, line, dot, readout } = v;
  const { hostStart, hostReturn, eventStart, eventEnd, scalarAt } = freshClock;
  const spoken = (beat, phrase, captionStart = false) => {
    if (b !== beat) return Number(b > beat);
    const { start, end } = clock.wordCue(phrase);
    return clock.reveal(phrase, end - start, { captionStart });
  };
  const returnProgress = spoken(3, 'The call returns at six');
  const eventProgress = spoken(4, 'Watch the stream record its end event');
  const transfer = spoken(4, 'follow the scalar back to Python');
  const t =
    mix(hostStart, hostReturn, returnProgress) +
    (eventEnd - hostReturn) * eventProgress +
    (scalarAt - eventEnd) * transfer;
  const state = executionAt(t, freshClock, freshRuntimeValues);
  const submitted = spoken(3, 'your log will say two milliseconds again');
  const request = cue(3, 'Python asks for the scalar', 0);
  const callerAnswer = spoken(5, 'Twenty milliseconds') === 1;
  const caller = spoken(5, 'Subtract the host start at four from the scalar arrival at twenty-four');
  const events = spoken(5, 'The stream events ran from five to twenty-three');
  const eventAnswer = spoken(5, "That's eighteen milliseconds", "That's eighteen milliseconds");
  const enterTime = spoken(6, "Enter the caller's twenty milliseconds beside the feature") === 1;

  const x = (ms) => 73 + 20 * (ms - hostStart);
  const hostY = 207;
  const streamY = 315;
  const mark = (ms, y, color) => {
    dot(x(ms), y, 5, color);
    text(ms, x(ms), y + 25, 20, color, 'center', 'Mono');
  };
  const interval = (start, end, y, progress, color) => {
    if (!progress) return;
    const left = x(start);
    const right = mix(left, x(end), progress);
    line(left, y, right, y, color, 2);
    line(left, y - 5, left, y + 5, color, 2);
    line(right, y - 5, right, y + 5, color, 2);
  };
  text('Host caller', 54, 129, 23, C.gold);
  text('CUDA stream', 54, 283, 23, C.mint);
  text('ms', x(scalarAt), 129, 18, C.dim, 'right', 'Mono');
  for (const ms of [10, 15, 20]) {
    const tick = x(ms);
    line(tick, hostY, tick, 245, C.edge, 1);
    text(ms, tick, 260, 16, C.dim, 'center', 'Mono');
    line(tick, 275, tick, streamY, C.edge, 1);
  }
  line(x(hostStart), hostY, x(scalarAt), hostY, C.edge, 3);
  line(x(hostStart), streamY, x(scalarAt), streamY, C.edge, 3);
  line(x(hostStart), hostY, x(Math.min(t, hostReturn)), hostY, C.gold, 10);
  if (request) line(x(hostReturn), hostY, x(t), hostY, C.gold, 3);
  if (t >= eventStart) {
    line(x(eventStart), streamY, x(Math.min(t, eventEnd)), streamY, C.mint, 10);
    mark(eventStart, streamY, C.mint);
  }
  if (transfer > 0 && !state.reported) {
    const scalarX = mix(x(eventEnd), x(scalarAt), transfer);
    const scalarY = mix(streamY, hostY, transfer);
    line(x(eventEnd), streamY, scalarX, scalarY, C.silk, 2);
    dot(scalarX, scalarY, 7, C.silk);
  }
  mark(hostStart, hostY, C.gold);
  if (state.returned) mark(hostReturn, hostY, C.gold);
  if (state.deviceComplete) mark(eventEnd, streamY, C.mint);
  if (state.reported) mark(scalarAt, hostY, C.gold);

  interval(hostStart, scalarAt, 180, caller, C.gold);
  interval(eventStart, eventEnd, 371, events, C.mint);
  if (caller === 1)
    text(
      `${scalarAt} − ${hostStart} = ${state.hostInterval} ms`,
      x((hostStart + scalarAt) / 2),
      155,
      24,
      C.gold,
      'center',
      'Mono',
    );
  if (eventAnswer === 1)
    text(
      `${eventEnd} − ${eventStart} = ${state.eventInterval} ms`,
      x((eventStart + eventEnd) / 2),
      392,
      24,
      C.mint,
      'center',
      'Mono',
    );

  text('Python  /  ' + (request ? 'm.item()' : 'm = x.mean()'), 520, 121, 23, C.silk, 'left', 'Mono');
  log(v, 104, state.reported ? state.scalar.toFixed(4) : null, enterTime ? state.hostInterval : null);
  const status = state.reported
    ? 'Scalar received at ' + scalarAt + ' ms'
    : state.deviceComplete
      ? 'Stream done. Scalar pending.'
      : request
        ? 'Python is waiting'
        : state.returned
          ? 'CUDA tensor returned at ' + hostReturn + ' ms'
          : 'Submitting the mean';
  text(status, 702, 382, 20, state.reported ? C.mint : C.gold, 'center');
  readout(
    enterTime
      ? 'Caller time entered on ticket 104'
      : callerAnswer
        ? 'Caller wait   ' + state.hostInterval + ' ms'
        : state.reported
          ? 'Which two marks give the caller’s time?'
          : submitted === 1 && !request
            ? 'Submission   ' + hostReturn + ' − ' + hostStart + ' = ' + state.submitted + ' ms'
            : 'When can the caller read the feature?',
  );
}
export function clocks(v) {
  if (v.b < 2) return timepiece(v, true);
  const { cue, wafer, line, text, readout } = v;
  const progress = cue(2, 'exclude the setup', 3.8),
    t = progress * 30;
  const run = warmupTrace(t);
  text('Warmup and timed calls', 50, 132, 24);
  run.events.forEach((e, i) => {
    const x = 74 + e.start * 26,
      w = (e.end - e.start) * 26;
    wafer(
      x,
      207,
      w - 4,
      82,
      t >= e.end ? e.end - e.start + ' ms' : null,
      i === 0 ? C.shade : t >= e.end ? C.mint : null,
      27,
    );
    text(e.id, x + w / 2, 326, 20, i ? C.silk : C.dim, 'center');
  });
  line(74 + t * 26, 180, 74 + t * 26, 311, C.gold, 3);
  readout(
    run.mean == null ? 'Collect completed warmed calls' : 'Warmed mean   ' + run.mean + ' ms',
    'Keep the input shape, warmup and measurement boundaries fixed.',
  );
}

export function residence(v) {
  const { b, cue, text, row, box, line, readout } = v;
  const t = cue(0, 'Copy the row', 1.6);
  text('Host memory', 54, 126, 22, C.blue);
  text('Device global memory', 54, 374, 22, C.mint);
  row(
    tokenValues,
    65,
    154,
    825,
    46,
    tokenValues.map((_, i) => (i === 6 ? C.gold : C.blue)),
  );
  for (const i of series(8)) {
    const x = 112 + i * 104;
    line(x, 207, x, 297, C.edge, 1);
    if (t > 0 && t < 1) {
      box(x - 3, mix(208, 292, t), 6, 9, C.gold, 2);
    }
  }
  row(
    tokenValues.map((v, i) => (t * 8 >= i + 1 ? v : '·')),
    65,
    312,
    825,
    46,
    tokenValues.map((_, i) => (t * 8 >= i + 1 ? (i === 6 ? C.gold : C.mint) : null)),
  );
  if (b === 1) {
    const fired = cue(1, 'launches a function', 1.2);
    if (fired > 0) for (let i = 0; i < Math.ceil(8 * fired); i++) box(109 + i * 104, 296, 5, 9, C.mint, 1);
    if (cue(1, 'larger batches') > 0) text('Kernel reads   8 / 8', 904, 374, 20, C.gold, 'right', 'Mono');
  }
  readout(
    b === 0 ? (t === 1 ? 'Token 6 holds 1 in both allocations' : 'x = cpu_row.to("cuda")') : 'm = x.mean()',
    b === 0
      ? 'One feature at each of eight token positions'
      : 'Python submits the kernel. Its threads read the device allocation.',
  );
}
export function setup(v) {
  const { b, cue, wafer, text, line, strip, readout } = v;
  if (b <= 1) {
    const rows = [
      ['Driver', 'nvidia-smi', 'CUDA version supported by this driver'],
      ['Compiler', 'nvcc --version', 'Version of the local compiler'],
      ['Package', 'torch.version.cuda', 'CUDA used to build this PyTorch'],
    ];
    rows.forEach(([k, cmd, meaning], i) => {
      const y = 120 + i * 89,
        lit = i === 0 || (i === 1 && cue(0, 'Ask the compiler') > 0) || (i === 2 && b === 1);
      wafer(55, y, 143, 49, k, lit ? C.paper : null, 19);
      line(199, y + 25, 235, y + 25, C.edge);
      text(cmd, 248, y + 10, 23, lit ? C.gold : C.dim, 'left', 'Mono');
      if (lit) text(meaning, 248, y + 41, 18, C.silk);
    });
    readout('Three version checks on one host');
  } else if (b < 4) {
    ['Python environment A', 'Python environment B'].forEach((name, i) => {
      const x = 58 + 425 * i;
      strip(x, 141, 389, 209);
      text(name, x + 26, 173, 21, C.ink);
      line(x + 24, 201, x + 365, 201, C.shade, 1);
      text('torch.version.cuda', x + 26, 227, 17, C.ink, 'left', 'Mono');
      const seen = !i || cue(2, 'Try the other') > 0;
      text(seen ? (i ? 'CUDA build' : 'None') : '···', x + 26, 266, 29, C.ink, 'left', 'Mono');
      if (seen) text('is_available()   False', x + 26, 319, 18, C.ink, 'left', 'Mono');
    });
    readout(
      b === 2
        ? 'A build without CUDA cannot run this kernel'
        : 'CUDA build installed, device still unavailable',
      'Check driver compatibility, container access and process visibility.',
    );
  } else {
    text('Physical devices', 60, 132, 21, C.dim);
    for (let i = 0; i < 4; i++) wafer(72 + i * 154, 175, 118, 66, 'GPU ' + i, i === 3 ? C.gold : null);
    const t = cue(4, 'Follow physical GPU');
    v.trace(591, 247, 599, 314, C.gold, t);
    if (t > 0) wafer(507, 322, 189, 56, 'cuda:0', C.mint, 24);
    text('Inside the process', 67, 347, 21, C.mint);
    if (b === 5) {
      text('Device capability', 685, 159, 18, C.dim);
      text('Compare build targets', 685, 207, 18, C.gold);
    }
    readout(
      b === 4 ? 'One visible device gets logical index 0' : 'Compare compute capability with compiled targets',
      b === 4 ? 'CUDA_VISIBLE_DEVICES=3' : 'Run the operation and verify its output.',
    );
  }
}
export function classifier(v) {
  const { b, cue, text, box, line, wafer, readout } = v;
  const shapes = [
      [4, 8, 16],
      [4, 16],
      [4, 3],
    ],
    labels = ['Ticket features', 'Mean over tokens', 'Logits'];
  shapes.forEach((s, i) => {
    const visible = i === 0 || cue(0, i === 1 ? 'Pooling leaves' : 'turns each ticket') > 0;
    if (!visible) return;
    const x = 64 + i * 301,
      nx = s.at(-1),
      ny = s.length === 3 ? s[1] : s[0],
      step = i === 2 ? 17 : 9;
    text(labels[i], x, 126, 20, i === 2 ? C.mint : C.silk);
    const layers = i === 0 ? 4 : 1;
    for (let layer = layers - 1; layer >= 0; layer--) {
      const dx = layer * 6,
        dy = -layer * 4;
      box(x + dx - 3, 171 + dy - 3, nx * step + 5, ny * step + 5, C.board, 2);
      for (let j = 0; j < ny; j++)
        for (let k = 0; k < nx; k++)
          box(
            x + dx + k * step,
            171 + dy + j * step,
            step - 1,
            step - 1,
            i === 0 ? (k === 0 ? C.gold : C.blue) : i === 1 ? C.paper : C.mint,
            1,
          );
    }
    text(s.join(' × '), x, 267, 20, C.silk, 'left', 'Mono');
    if (b >= 2)
      text(s.reduce((a, z) => a * z, 4).toLocaleString('en-US') + ' B', x, 294, 18, C.blue, 'left', 'Mono');
  });
  const moved = cue(4, 'Copy the four labels', 1.5);
  if (b >= 5) {
    const checked = cue(5, 'are finite') > 0,
      stepped = cue(5, 'gradient descent step') === 1;
    ['loss', 'backward', 'finite?', 'SGD'].forEach((l, i) => {
      const pass = [true, cue(5, 'work backward') > 0, checked, stepped][i];
      wafer(74 + 220 * i, 329, 166, 42, i === 2 && checked ? 'finite' : l, pass ? C.mint : null, 18);
    });
  } else if (b >= 2) {
    text('CPU', 61, 348, 18, C.blue);
    text('cuda:0', 464, 348, 18, C.mint);
    line(118, 366, 736, 366, C.edge, 2);
    wafer(mix(117, 544, moved), 338, 163, 50, '[0, 2, 1, 0]', moved === 1 ? C.mint : C.gold, 16);
    text('loss', 797, 365, 23, C.paper);
  } else {
    text('Linear(16, 3)', 58, 355, 23, C.gold, 'left', 'Mono');
    if (b === 1) text('3 × (16 weights + 1 bias) = 51', 330, 355, 23, C.paper, 'left', 'Mono');
  }
  if (b === 4 && moved === 1) {
    const shown = Math.ceil(4 * cue(4, 'pick out', 1));
    [0, 2, 1, 0]
      .slice(0, shown)
      .forEach((target, ticket) => box(666 + target * 17, 171 + ticket * 17, 16, 16, C.gold, 1));
  }
  const titles = [
    'Pool each feature column',
    'Each score has its own weights and bias',
    'Four int64 class labels   ·   32 B',
    'Shapes agree. Where are the labels?',
    'Cross-entropy reads logits and labels on cuda:0',
    'Forward → loss → backward → finite checks → SGD',
    'Time the step with diagnostic reads outside the interval',
  ];
  readout(
    b === 4 && moved < 1 ? 'Move the labels to the device holding the logits' : titles[b],
    b >= 5
      ? 'Random features exercise the update. Real labeled tickets test routing quality.'
      : 'One label per ticket',
  );
}
export function practice(v, fresh = false) {
  const { b, clock, cue, text, wafer, readout, line } = v;
  const vals = fresh ? freshRuntimeValues : extendedValues,
    width = fresh ? 8 : 4,
    r = reduction(vals, width);
  if (fresh && b >= 3) return freshTimepiece(v);
  const cellW = fresh ? 68 : 54, cellGap = fresh ? 9 : 7;
  const perGroupW = width * (cellW + cellGap) - cellGap;
  const workers = width * r.blocks.length;
  const placed = fresh ? cue(1, 'Copy each real input', 2) : cue(0, 'extra workers', 1.3);
  const guardWrites = fresh ? Math.floor((workers - vals.length) * cue(1, 'write a zero locally', 0.9)) : 0;
  const arrivals = fresh ? Math.floor(workers * cue(1, 'Bring all eight', 1.6)) : 0;
  let reads = 0, barrierMarks = 0;
  text('Source row   ' + vals.join('   '), 55, 121, 21, C.gold, 'left', 'Mono', 850);
  r.blocks.forEach((blk, k) => {
    const x = fresh ? 200 : 64 + 285 * k,
      y = fresh ? 178 + k * 106 : 242;
    text('Block ' + k, fresh ? 62 : x, fresh ? y + 20 : y - 49, 20, C.dim);
    blk.threads.forEach((t, j) => {
      const written = fresh
        ? t.index < Math.floor(placed * vals.length) + guardWrites
        : placed * width >= j + 1;
      const slotX = x + j * (cellW + cellGap);
      if (written && t.valid) reads++;
      wafer(
        slotX,
        y,
        cellW,
        42,
        written ? t.value : '·',
        written ? (t.valid ? (t.value === 0 ? C.gold : C.mint) : C.shade) : null,
        22,
      );
      if (written)
        text(
          t.valid ? 'T' + t.index : 'guard',
          slotX + cellW / 2,
          y + 61,
          14,
          t.valid ? C.dim : C.gold,
          'center',
          'Mono',
        );
      if (written && t.reachesBarrier && t.index < arrivals) {
        line(slotX, y + 74, slotX + cellW, y + 74, C.mint, 4);
        barrierMarks++;
      }
    });
    if (!fresh && placed === 1) line(x, y + 74, x + perGroupW, y + 74, C.mint, 3);
    let gathered;
    if (fresh) {
      const gather = cue(2, k === 0 ? "Gather the first block's sum" : "Gather the second block's sum", 1.3);
      if (gather > 0) line(x, y - 9, x + perGroupW * gather, y - 9, C.gold, 2);
      gathered = gather === 1 && cue(2, k === 0 ? "Gather the second block's sum" : 'For the divisor', 0);
    } else {
      gathered = cue(1, 'Combine the three', 0.8) === 1;
    }
    if (gathered)
      text(
        'Σ ' + blk.subtotal,
        fresh ? 850 : x + perGroupW / 2,
        fresh ? y + 20 : y + 109,
        23,
        C.gold,
        'center',
        'Mono',
      );
  });
  const rounded = Math.fround(r.mean);
  if (fresh) {
    let caption = 'Which slots can read the ticket?';
    if (b >= 1) caption = reads + ' input reads   ·   ' + barrierMarks + ' barrier arrivals';
    if (cue(2, 'For the divisor', 0)) caption = 'Count the ' + reads + ' source positions';
    if (cue(2, 'Divide thirty-five by thirteen', 0)) caption = 'Device mean   ' + r.total + ' / ' + reads;
    if (cue(2, 'Keep that number for the log', 0)) caption += ' ≈ ' + rounded.toFixed(4);
    readout(caption);
  } else {
    let compare = 'Wait for the FP32 result';
    if (b === 2) {
      cue(2, 'Format the number');
      const phrase = 'Python gets the stored float';
      const { start, end } = clock.wordCue(phrase);
      if (clock.reveal(phrase, end - start, { captionStart: false }) === 1) {
        compare = 'Python FP32  ' + rounded + '  •  Exact mean  ' + r.mean;
        const logCue = clock.wordCue('Format the number to one decimal place for the log');
        if (clock.elapsed >= logCue.end) compare += '  •  Log  ' + rounded.toFixed(1);
      }
    }
    readout(
      b === 0
        ? 'How many zeros in the last block have an input address?'
        : b === 1
          ? cue(1, 'Is that the number')
            ? 'Exact mean   ' + r.total + ' / ' + r.denominator + ' = ' + r.mean
            : 'Which divisor counts the ticket?'
          : compare,
      'Gold zero: present in the input     •     Gray zero: neutral contribution from a guarded thread',
    );
  }
}
