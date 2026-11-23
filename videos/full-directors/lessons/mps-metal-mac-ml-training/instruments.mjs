import assert from 'node:assert/strict';
import { profilingTrace, crossoverCost } from '../../../films/mps-metal-mac-ml-training/arithmetic.mjs';
import {
  board,
  box,
  line,
  text,
  mono,
  note,
  cue,
  mix,
  ink,
  pale,
  gpu,
  mint,
  cpu,
  gold,
  rose,
  axis,
} from './bench.mjs';
const light = '#d7e5d7',
  dim = '#91a9a2',
  dark = '#26464a';
const dispatch = 3,
  work = 35,
  completed = dispatch + work;
export function timer(c, k) {
  const beat = k.beat.beatIndex;
  const replay = beat >= 1;
  board(
    c,
    'When did the work finish?',
    'COMPLETION TIMER   /   MODELED SERIAL DISPATCH AND EXECUTION',
    true,
  );
  const submitPhrase = 'as Python submits';
  const dispatchPhrase = 'Python returns after three milliseconds';
  const waitPhrase = 'wait for completion';
  const finishPhrase = 'The block finishes thirty-eight milliseconds from the start';
  const dispatchDuration = beat === 0
    ? k.wordCue(dispatchPhrase).end - k.wordCue(submitPhrase).start
    : 0;
  const replayEnd = beat === 1 ? k.wordCue(finishPhrase).end : 0;
  const waitDuration = beat === 1 ? replayEnd - k.wordCue(waitPhrase).start : 0;
  const send = replay
    ? cue(k, 1, 'submit the block again', 1, 'Start the clock and submit')
    : cue(k, 0, submitPhrase, dispatchDuration, 'Start a clock as Python submits');
  const run = replay
    ? cue(k, 1, waitPhrase, waitDuration, 'This time wait')
    : cue(k, 0, 'Watch the device lane', 3);
  const synchronized = beat > 1 || (beat === 1 && k.elapsed >= replayEnd);
  const x = 229,
    s = 22;
  const dispatchEdge = x + dispatch * s;
  const gpuEdge = dispatchEdge + work * run * s;
  text(c, 'Python', 74, 247, 25, pale);
  text(c, 'Apple GPU', 74, 357, 25, pale);
  for (const i of [0, 10, 20, 30, 40]) line(c, x + i * s, 203, x + i * s, 424, '#56706f', 1, [4, 7]);
  box(c, x, 217, dispatch * send * s, 60, gold);
  if (send === 1) {
    if (replay) {
      box(c, dispatchEdge, 217, gpuEdge - dispatchEdge, 60, dark);
      if (gpuEdge - dispatchEdge > 200)
        mono(c, 'synchronize()', (dispatchEdge + gpuEdge) / 2, 247, 22, light, 'center');
    }
    line(c, dispatchEdge, 205, dispatchEdge, 292, gold, 3);
    mono(c, replay ? 'Dispatch returns' : 'Clock stops', dispatchEdge + 10, 191, 21, gold);
  }
  if (run > 0) {
    box(c, dispatchEdge, 326, gpuEdge - dispatchEdge, 60, mint);
    line(c, gpuEdge, 313, gpuEdge, 403, mint, 3);
  }
  if (synchronized) {
    const stopEdge = x + completed * s;
    line(c, stopEdge, 205, stopEdge, 403, mint, 3);
    mono(c, 'Clock stops', stopEdge - 10, 191, 21, mint, 'right');
  }
  axis(c, x, 424, 40 * s, 40, 5, light, ' ms');
  mono(c, 'Host clock', 80, 503, 23, dim);
  const earlyStop = !replay && send === 1;
  const reading = synchronized ? completed + ' ms'
    : earlyStop ? dispatch + ' ms'
    : send > 0 ? 'Running' : '0 ms';
  mono(c, reading, 257, 500, 41, synchronized ? mint : earlyStop ? gold : pale);
  note(
    c,
    replay
      ? 'Clear prior work → start → submit the warmed block → synchronize → stop.'
      : 'Compare the host clock with the GPU lane.',
    ink,
    mint,
  );
}
export function bracket(c, k) {
  const b = k.beat.beatIndex;
  board(
    c,
    b < 3 ? 'Put the clock around ten completed products' : 'Where can a scalar read make Python wait?',
    b < 3 ? 'TIMING BRACKET   /   256 × 256 MATRICES' : 'TRAINING LOOP   /   SCALAR READ',
    true,
  );
  if (b < 3) {
    const warm = cue(k, 0, 'Run three warmup products', 1.8);
    const start = cue(k, 0, 'Start the clock');
    const timed = cue(k, 0, 'Submit ten products', 2.4);
    const sync = cue(k, 0, 'synchronize again', 0.65, 'On MPS, synchronize again');
    const normalized = cue(k, 1, 'Divide the completed block time');
    mono(c, 'allocate & place', 70, 205, 22, dim);
    const x = 81,
      y = 308,
      w = 65;
    for (let i = 0; i < 13; i++) {
      const j = i < 3 ? i : i - 3,
        xi = x + i * w + (i < 3 ? 0 : 103);
      const done = i < 3 ? warm * 3 >= j + 1 : timed * 10 >= j + 1;
      box(c, xi, y, w - 7, 85, done ? (i < 3 ? gold : mint) : dark, 4);
      mono(c, j + 1, xi + (w - 7) / 2, y + 43, 27, done ? ink : dim, 'center');
    }
    if (start) {
      line(c, 339, 264, 339, 435, gold, 4);
      mono(c, 'START', 339, 239, 19, gold, 'center');
    }
    if (sync) {
      line(c, 1054, 264, 1054, 435, mint, 4);
      mono(c, 'MPS sync', 1054, 239, 19, mint, 'center');
    }
    text(c, 'Warmup', 169, 451, 26, pale, 'Sans', 'center');
    text(c, 'Measured products', 706, 451, 26, pale, 'Sans', 'center');
    if (normalized) mono(c, 'mean = (stop − start) / 10', 1112, 508, 24, mint, 'right');
    note(
      c,
      b === 2
        ? 'Repeat the bracket. Keep size, dtype and step count fixed.'
        : 'MPS waits at both boundaries. On CPU, each matrix product returns when complete.',
      ink,
      mint,
    );
  } else {
    mono(c, 'loss.detach().cpu().item()', 75, 212, 31, pale);
    const xx = [84, 429, 775];
    const labels = [
      ['detach()', 'Stops tracking gradients'],
      ['cpu()', 'Makes the value host-visible'],
      ['item()', 'Reads one scalar'],
    ];
    labels.forEach(([name, desc], i) => {
      const x = xx[i];
      box(c, x, 303, 314, 113, i === 1 ? gold : dark, 6);
      mono(c, name, x + 157, 335, 26, i === 1 ? ink : pale, 'center');
      text(c, desc, x + 157, 379, 19, i === 1 ? ink : light, 'Sans', 'center');
    });
    const wait = cue(k, 3, 'can make Python wait', 1.7);
    box(c, 435, 453, 303 * wait, 16, gold);
    note(
      c,
      b === 4
        ? 'Calling item() on the MPS scalar can also wait before the next launch.'
        : 'The host can use the CPU tensor for NumPy after the transfer.',
      ink,
      mint,
    );
  }
}
const queued = profilingTrace(false),
  logged = profilingTrace(true);
const firstProduct = { name: 'matmul', start: queued.host[0].start, end: queued.gpu[0].end };
export function profile(c, k) {
  const replaying = k.beat.beatIndex >= 2;
  board(
    c,
    replaying ? 'Find the gap beneath the host log' : 'Line up the first matrix product with GPU work',
    'METAL SYSTEM TRACE   /   ILLUSTRATIVE MILLISECONDS',
    true,
  );
  const scan = cue(k, 0, 'signposts mark', 2.8),
    replay = cue(k, 2, 'This time Python reads', 3.4);
  const x = 242,
    unit = 21.6;
  text(c, 'PyTorch signpost', 61, 193, 21, light);
  line(c, x, 215, x + unit * 40, 215, dim, 1);
  const end = Math.min(scan * queued.completion, firstProduct.end);
  if (end > firstProduct.start) {
    const left = x + unit * firstProduct.start;
    const span = unit * (end - firstProduct.start);
    box(c, left, 170, span, 42, dark, 2, gold);
    if (span > 85) mono(c, firstProduct.name, left + span / 2, 191, 20, gold, 'center');
    if (end === firstProduct.end) line(c, left + span, 213, left + span, 236, gold, 2, [3, 3]);
  }
  const lanes = [
    ['GPU execution', queued.gpu, scan * queued.completion, 236],
  ];
  if (replaying) lanes.push(
    ['Replay host', logged.host, replay * logged.completion, 334],
    ['Replay GPU', logged.gpu, replay * logged.completion, 408],
  );
  for (const [name, items, time, y] of lanes) {
    text(c, name, 61, y + 25, 22, light);
    line(c, x, y + 50, x + unit * 40, y + 50, dim, 1);
    items.forEach((part, j) => {
      const d = Math.max(0, Math.min(time, part.end) - part.start);
      if (!d) return;
      const label =
        part.kind === 'logging'
          ? 'log'
          : part.kind === 'wait'
            ? 'wait'
            : part.kind === 'enqueue'
              ? ''
              : String(j + 1);
      const color =
        part.kind === 'logging'
          ? rose
          : part.kind === 'wait'
            ? gold
            : part.kind === 'enqueue'
              ? light
              : mint;
      box(c, x + unit * part.start, y, unit * d - 1, 49, color, 3);
      if (unit * d > 30) mono(c, label, x + unit * (part.start + d / 2), y + 26, 20, ink, 'center');
    });
  }
  if (!replaying && scan === 1) {
    mono(c, 'matmul', x, 350, 24, gold);
    text(c, 'Named operation in the PyTorch trace', x + 129, 350, 23, pale);
    mono(c, '1', x, 406, 24, mint);
    text(c, 'First execution interval on the Apple GPU', x + 129, 406, 23, pale);
  }
  const gap = cue(k, 2, 'Find the first strip marked log');
  if (gap) {
    const interval = logged.host.find((p) => p.kind === 'logging');
    for (const tm of [interval.start, interval.end])
      line(c, x + tm * unit, 383, x + tm * unit, 460, rose, 2, [5, 5]);
    mono(c, 'idle', x + (unit * (interval.start + interval.end)) / 2, 438, 24, rose, 'center');
  }
  axis(c, x, 484, unit * 40, 40, 5, light, ' ms');
  note(
    c,
    k.beat.beatIndex < 2
      ? 'Warm up, capture MPS signposts, then align operations with the GPU execution track.'
      : 'profile(wait_until_completed=False) preserves the opportunity to queue work.',
    ink,
    mint,
  );
}
export function crossover(c, k) {
  board(
    c,
    'When does GPU launch cost pay off?',
    'SQUARE MATRIX PRODUCT   /   ILLUSTRATIVE COST MODEL',
    true,
  );
  const grow = cue(k, 1, 'Double the matrix width', 1.7);
  const width = Math.round(mix(256, 512, grow)),
    cost = crossoverCost(width);
  mono(c, 'N = ' + width, 71, 203, 27, mint);
  mono(c, 'Relative arithmetic   ×' + Number(cost.work.toFixed(2)), 1102, 203, 23, light, 'right');
  const x = 250,
    s = 91;
  for (const [i, label, parts] of [
    [0, 'CPU', [[cost.host, gold]]],
    [
      1,
      'MPS',
      [
        [cost.dispatch, rose],
        [cost.device, mint],
      ],
    ],
  ]) {
    const y = 266 + i * 112;
    text(c, label, 82, y + 34, 31, light);
    let xx = x;
    for (const [val, color] of parts) {
      box(c, xx, y, val * s, 65, color, 3);
      xx += val * s;
    }
    mono(c, Number((i ? cost.mps : cost.host).toFixed(2)) + ' ms', xx + 16, y + 34, 23, pale);
  }
  axis(c, x, 472, 8 * s, 8, 1, light, ' ms');
  mono(c, 'pink = fixed launch   /   mint = GPU calculation', 1105, 532, 21, light, 'right');
  note(
    c,
    cost.winner.toUpperCase() + ' finishes first in this model. Measure the crossover on your Mac.',
    ink,
    mint,
  );
}
export function checkInstruments() {
  assert.equal(completed, 38);
  assert.deepEqual([firstProduct.start, queued.gpu[0].start, firstProduct.end], [0, 1, 5]);
  assert.deepEqual(
    queued.gpu.map((x) => x.end - x.start),
    [4, 4, 4],
  );
  assert.deepEqual(
    logged.gpu.map((x) => x.end - x.start),
    [4, 4, 4],
  );
  for (const log of logged.host.filter((p) => p.kind === 'logging'))
    assert(logged.gpu.every((g) => g.end <= log.start || g.start >= log.end));
  assert.equal(crossoverCost(256).winner, 'cpu');
  assert.equal(crossoverCost(512).winner, 'mps');
  assert.equal(crossoverCost(512).work, 8);
}
