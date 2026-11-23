import assert from 'node:assert/strict';
import { place, layerFlag, stream } from '../../../films/local-llm-placement/model.mjs';
import {
  ink,
  paper,
  teal,
  blue,
  mint,
  fog,
  gold,
  red,
  white,
  dark,
  pale,
  mono,
  serif,
  sans,
  rect,
  line,
  label,
  dot,
  plate,
  hatch,
  header,
  foot,
  chip,
  trace,
  strip,
  cue,
} from './art.mjs';
const all = place(16),
  split = place(8);
const fmt = (v) => v.map((n) => n.toFixed(4)).join('   ');
function placement(c) {
  const b = c.beat.beatIndex,
    low = cue(c, 1, 'Lower the allowance');
  const model = low ? split : all;
  const travel = cue(c, 2, 'Send the pair across', 1.7);
  const changed = cue(c, 2, 'Now apply block seventeen');
  const finish = cue(c, 3, 'Continue through the suffix', 2.8);
  const count = low ? 16 + changed + Math.floor(finish * 15) : 32;
  return {
    model,
    travel,
    count,
    vector: model.blocks[count - 1].output,
    compare: cue(c, 3, 'Compare the final pair'),
    low,
  };
}
function bank(g, x, first, count, col, active) {
  for (let i = 0; i < count; i++) {
    const px = x + (i % 16) * 32,
      py = 399 + Math.floor(i / 16) * 50;
    rect(
      g,
      px,
      py,
      27,
      42,
      col,
      first + i === active ? gold : '#bed9c2',
      first + i === active ? 4 : 1,
      3,
    );
    line(
      g,
      [
        [px + 7, py + 9],
        [px + 7, py + 29],
        [px + 18, py + 29],
      ],
      '#316168',
      2,
    );
  }
  label(
    g,
    count
      ? 'Weights ' +
          first +
          '–' +
          (first + count - 1) +
          '   /   ' +
          (count * 0.3).toFixed(1) +
          ' GB'
      : 'No block weights assigned',
    x,
    533,
    28,
    white,
    mono,
    500,
  );
}
const flagCount = 24,
  totalBlocks = 32,
  rule = layerFlag(totalBlocks, flagCount);
function flags(g, c) {
  const output = cue(c, 5, 'Count the output first'),
    remaining = cue(c, 5, 'Count backward from block'),
    counted = cue(c, 5, 'Blocks nine through thirty-one'),
    start = rule.hidden.findIndex((h) => h.gpu);
  header(
    g,
    'RUNNER PLACEMENT',
    'Which hidden block starts the suffix?',
    'Inspected llama.cpp suffix rule  /  32 hidden blocks numbered 0–31  /  GPU-layer count 24',
  );
  const x = 235,
    y = 476,
    pitch = 46;
  label(g, 'Input', 93, y - 57, 32, ink);
  rect(g, 91, y, 102, 113, '#d4d8ca', ink, 2, 5);
  label(g, 'CPU', 142, y + 56, 26, ink, mono, 600, 'center');
  for (let i = 0; i <= totalBlocks; i++) {
    const gpu = i === totalBlocks ? output && rule.outputGpu : counted && rule.hidden[i].gpu,
      px = x + i * pitch;
    rect(g, px, y, 41, 113, gpu ? mint : '#dbe1d5', gpu ? teal : '#9baea2', 2, 3);
    if (i % 4 === 0 || i === 31 || (counted && i === start))
      label(g, i === 32 ? 'Out' : i, px + 19, y + 145, 22, ink, mono, 600, 'center');
  }
  label(g, 'Hidden transformer blocks', x, 383, 38, ink, serif, 600);
  label(g, 'Output slot', x + 32 * pitch + 41, 383, 32, ink, sans, 600, 'right');
  line(
    g,
    [
      [x + 32 * pitch + 20, 414],
      [x + 32 * pitch + 20, 466],
    ],
    teal,
    3,
  );
  if (counted) {
    const left = x + start * pitch,
      right = x + 32 * pitch + 40;
    line(
      g,
      [
        [left, 665],
        [left, 688],
        [right, 688],
        [right, 665],
      ],
      teal,
      5,
    );
    label(
      g,
      rule.hiddenGpu + ' hidden blocks + 1 output = ' + flagCount + ' slots',
      (left + right) / 2,
      752,
      40,
      teal,
      mono,
      600,
      'center',
    );
  }
  foot(
    g,
    counted
      ? 'CPU input  /  GPU hidden blocks ' + start + '–31 plus output  /  before tensor overrides'
      : remaining
        ? flagCount +
          ' slots − 1 output = ' +
          rule.hiddenGpu +
          ' hidden blocks. Count back from block 31.'
        : output
          ? 'One of the slots goes to the output.'
          : 'Count backward from the last position. Where does the suffix begin?',
  );
}
function blocks(g, c) {
  if (c.beat.beatIndex >= 4) {
    flags(g, c);
    return;
  }
  const s = placement(c),
    m = s.model,
    w = 616,
    x1 = 100,
    x2 = 1204,
    y = 307;
  header(
    g,
    'TRANSFORMER BLOCK PLACEMENT',
    'Follow one pair between processors',
    '32 ordered blocks  /  0.3 GB of weights per block  /  3.2 GB fixed device use',
    true,
  );
  for (const [x, name, first, n] of [
    [x1, 'Host RAM', 1, m.cpuBlocks],
    [x2, 'GPU memory', m.cpuBlocks + 1, m.gpuBlocks],
  ]) {
    plate(g, x, y, w, 269, '#254c50');
    label(g, name, x + 44, y + 44, 35, white, sans, 600);
    bank(g, x + 50, first, n, '#78b2c1', s.count);
  }
  const left = x1 + 307,
    right = x2 + 307;
  const socketY = (t) => 737 + Math.sin(Math.PI * t) * 15;
  for (let wire = -3; wire <= 3; wire++) {
    const points = Array.from({ length: 33 }, (_, i) => [
      left + ((right - left) * i) / 32,
      socketY(i / 32) + wire * 8,
    ]);
    line(g, points, wire === 0 ? gold : '#a18961', wire === 0 ? 4 : 2);
  }
  for (const [x, name, sub] of [
    [x1, 'CPU', s.low ? 'Block 16 complete' : 'Idle'],
    [
      x2,
      'GPU',
      s.low
        ? s.travel < 1
          ? 'Block 17 waits'
          : s.count === 16
            ? 'Block 17 input'
            : 'Block ' + s.count + ' complete'
        : 'Block 32 complete',
    ],
  ]) {
    plate(g, x + 52, 624, 510, 214, '#274d54');
    chip(g, x + 85, 647, 444, 145, '');
    label(g, name, x + 307, 676, 30, white, mono, 600, 'center');
    label(g, sub, x + 307, 817, 25, white, mono, 500, 'center');
  }
  const px = s.low ? left + (right - left) * s.travel : right,
    py = socketY(s.travel);
  rect(g, px - 208, py - 33, 416, 66, gold, ink, 3, 7);
  label(g, fmt(s.vector), px, py, 33, ink, mono, 600, 'center');
  if (s.travel > 0)
    label(
      g,
      cue(c, 2, 'the activation') ? 'Activation   16 → 17' : 'Block 16 output',
      960,
      611,
      30,
      gold,
      mono,
      600,
      'center',
    );
  else label(g, 'Host–device link', 958, 617, 28, fog, sans, 500, 'center');
  const footText = s.compare
    ? 'Same input, all on GPU   [ ' + fmt(all.output) + ' ]     ·     split result matches'
    : s.low
      ? '8 GB allowance  −  3.2 GB fixed  =  4.8 GB for the trailing 16 blocks'
      : '16 GB allowance  −  3.2 GB fixed  =  12.8 GB for up to 32 blocks';
  foot(g, footText, true);
}
function timeAxis(g, x, y, w, maximum, ticks, unit) {
  line(
    g,
    [
      [x, y],
      [x + w, y],
    ],
    ink,
    2,
  );
  for (const t of ticks) {
    const xx = x + (w * t) / maximum;
    line(
      g,
      [
        [xx, y - 7],
        [xx, y + 10],
      ],
      ink,
      2,
    );
    label(g, String(t), xx, y + 36, 24, ink, mono, 500, 'center');
  }
  label(g, unit, x + w, y + 73, 25, teal, mono, 600, 'right');
}
function serialAt(rate) {
  return { device: (7.6 / rate) * 1000, local: (5.6 / rate) * 1000, host: (2 / 25) * 1000 };
}
function peakReplay(g, c) {
  const changed = c.reveal('Substitute the peak', 1.2, { captionStart: false });
  const hostConfirmed = c.reveal('still takes eighty milliseconds', 0, { captionStart: false });
  const totalConfirmed = c.reveal('eighty-five and a half milliseconds', 0, { captionStart: false });
  const x = 499,
    w = 1240,
    scale = w / 100;
  header(
    g,
    'BANDWIDTH REPLAY',
    'Which part keeps its width?',
    'Same 7.6 GB step  /  same 25 GB/s host link  /  serial transfers only',
  );
  for (const [i, rate] of [500, 500 + (1008 - 500) * changed].entries()) {
    const s = serialAt(rate),
      y = 345 + i * 218;
    label(g, i ? 'Replay' : 'Reference', 94, y + 21, 39, ink, serif, 600);
    label(g, Math.round(rate).toLocaleString('en-US') + ' GB/s device', 94, y + 78, 28, ink, mono);
    rect(g, x, y, s.device * scale, 46, blue);
    label(
      g,
      'Device only   ' + s.device.toFixed(2) + ' ms',
      x + s.device * scale + 22,
      y + 23,
      26,
      ink,
      mono,
    );
    strip(
      g,
      x,
      y + 85,
      w,
      59,
      [
        [s.local, blue],
        [s.host, gold],
      ],
      100,
    );
    label(
      g,
      s.host.toFixed(0) + ' ms host link',
      x + (s.local + s.host / 2) * scale,
      y + 115,
      28,
      ink,
      mono,
      600,
      'center',
    );
    const mixed = i && changed && !totalConfirmed ? 'Mixed   ? ms' : 'Mixed   ' + (s.local + s.host).toFixed(2) + ' ms';
    label(g, mixed, x, y + 176, 28, ink, mono, 600);
    if (hostConfirmed) {
      const start = x + s.local * scale;
      const end = start + s.host * scale;
      line(g, [[start, y + 82], [start, y + 71], [end, y + 71], [end, y + 82]], ink, 3);
    }
  }
  timeAxis(g, x, 780, w, 100, [0, 20, 40, 60, 80, 100], 'milliseconds');
  const note = hostConfirmed
    ? 'Only the blue device reads shrink. The gold host leg stays 80 ms wide.'
    : changed
      ? 'The device rate changes. The host link is still 25 GB/s.'
      : 'Predict the mixed run at the advertised 1,008 GB/s device peak.';
  label(g, note, 94, 865, 33, ink, sans, 600, 'left', 1717);
}
function transport(g, c) {
  if (c.beat.beatIndex === 4) {
    peakReplay(g, c);
    return;
  }
  const b = c.beat.beatIndex,
    mixed = stream(1),
    ref = stream(0),
    store = stream(2);
  const host = cue(c, 2, 'Append the host leg', 1.1),
    storage = b === 3;
  const x = 397,
    w = 1340,
    max = storage ? 1600 : 100;
  header(
    g,
    'SERIAL TRANSPORT WORKSHEET',
    storage ? 'What if the file must be read again?' : 'Which leg takes most of the step?',
    storage
      ? 'Same 7.6 GB payload  /  expanded time axis  /  storage rate supplied at 5 GB/s'
      : 'Same 7.6 GB per step  /  device at 500 GB/s  /  host link at 25 GB/s  /  no overlap or compute',
  );
  timeAxis(
    g,
    x,
    storage ? 745 : 708,
    w,
    max,
    storage ? [0, 400, 800, 1200, 1600] : [0, 20, 40, 60, 80, 100],
    'milliseconds',
  );
  function lane(y, name, path, spans, opacity = 1) {
    label(g, name, 84, y + 33, 35, ink, serif, 600);
    line(
      g,
      [
        [x, y + 63],
        [x + w, y + 63],
      ],
      '#bcc6b8',
      2,
    );
    for (const [i, sp] of path.spans.entries()) {
      if (i >= spans) continue;
      const left = x + (w * (sp.start * 1000)) / max,
        width = (w * sp.seconds * 1000) / max;
      g.save();
      g.globalAlpha = i === 1 ? opacity : 1;
      rect(g, left, y, width, 63, sp.name === 'Storage read' ? '#bf936d' : i ? gold : blue);
      if (width > 60) hatch(g, left, y, width, 18, '#ffffff65');
      g.restore();
    }
  }
  lane(storage ? 309 : 362, 'Device only', ref, 1);
  const refDone = cue(c, 0, 'That gives');
  if (refDone)
    label(
      g,
      '7.6 GB ÷ 500 GB/s  =  ' + (ref.total * 1000).toFixed(1) + ' ms',
      x,
      storage ? 406 : 458,
      31,
      ink,
      mono,
      500,
    );
  if (b > 0) {
    lane(storage ? 451 : 515, 'Mixed', mixed, host ? 2 : 1, host);
    let desc = '5.6 GB on device    +    2 GB over host link';
    if (host === 1)
      desc = '5.6 GB ÷ 500 GB/s  +  2 GB ÷ 25 GB/s  =  ' + (mixed.total * 1000).toFixed(1) + ' ms';
    label(g, desc, x, storage ? 546 : 617, 32, ink, mono, 500);
    if (storage) {
      lane(591, 'File reread', store, 1);
      label(g, '7.6 GB ÷ 5 GB/s  =  ' + store.total.toFixed(2) + ' s', x, 687, 32, ink, mono, 500);
    }
  }
  foot(
    g,
    storage
      ? 'Check file reads and major faults, swap I/O, or supported managed-migration events.'
      : host === 1
        ? 'Host leg 80 ms   /   device leg 11.2 ms   /   serial legs add.'
        : b === 0
          ? 'Time in seconds = gigabytes read ÷ gigabytes per second.'
          : 'Where will the mixed run end on the same time ruler?',
  );
}
export const transportPainters = [blocks, transport];
export function checkTransport(clock) {
  assert.deepEqual(
    [all.gpuBlocks, split.cpuBlocks, split.gpuBlocks, split.boundaries],
    [32, 16, 16, 1],
  );
  assert.deepEqual(split.blocks[15].output, split.blocks[16].input);
  const after = placement(clock(2, 1)),
    inFlight = placement({
      beat: { beatIndex: 2 },
      reveal: (phrase) => (phrase.startsWith('Send') ? 0.5 : 0),
    });
  assert.deepEqual(
    [inFlight.travel, inFlight.count, fmt(inFlight.vector)],
    [0.5, 16, '0.8071   0.6929'],
  );
  assert.equal(fmt(after.vector), '0.7979   0.7021');
  assert.equal(fmt(placement(clock(3, 1)).vector), fmt(all.output));
  assert.deepEqual(
    [rule.inputGpu, rule.hiddenGpu, rule.hidden.findIndex((h) => h.gpu), rule.outputGpu],
    [false, 23, 9, true],
  );
  assert.deepEqual(
    [0, 1, 2].map((i) => Number((stream(i).total * 1000).toFixed(2))),
    [15.2, 91.2, 1520],
  );
  assert.deepEqual(
    stream(1).spans.map((s) => [s.gb, s.rate, +s.seconds.toFixed(4)]),
    [
      [5.6, 500, 0.0112],
      [2, 25, 0.08],
    ],
  );
  const peak = serialAt(1008);
  assert.deepEqual(
    [peak.device.toFixed(2), (peak.local + peak.host).toFixed(2), peak.host],
    ['7.54', '85.56', serialAt(500).host],
  );
}
