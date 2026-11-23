import { C, mix, series, cap } from './bench.mjs';
import { tokenValues, ticketClock } from '../../../films/cuda-execution/fixtures.mjs';
import {
  modeledCopySchedule,
  roofline,
  residentResources,
  tileReuse,
  memoryRequests,
  sum,
} from '../../../films/cuda-execution/arithmetic.mjs';
import { wiring } from './lanes.mjs';

export const readWait = (call) =>
  Math.max(0, ticketClock.eventEnd - call) + (ticketClock.scalarAt - ticketClock.eventEnd);
export function copies(v) {
  const { b, cue, text, box, line, wafer, readout } = v;
  if (b === 6) {
    const t = cue(6, 'Wait for the device', 1.5);
    text('Device output', 85, 166, 23, C.mint);
    text('Pinned host buffer', 571, 166, 23, C.blue);
    wafer(82, 215, 235, 80, 'feature', C.mint, 28);
    line(321, 255, 565, 255, C.edge, 3);
    v.dot(mix(321, 565, t), 255, 7, C.gold);
    wafer(568, 215, 286, 80, t === 1 ? 'feature' : 'copy pending', t === 1 ? C.blue : null, 24);
    readout(
      t === 1 ? 'Transfer complete   ·   CPU can read the host buffer' : 'Wait for device-to-host completion',
    );
    return;
  }
  const overlap = b >= 2 && cue(2, 'Put the copies') > 0,
    r = modeledCopySchedule(overlap);
  let t;
  if (b < 2) t = b === 0 ? 20 * cue(0, 'Follow both batches', 2.8) : 20;
  else if (b < 4) t = 6 * cue(2, 'Start copying B', 1.4);
  else if (b === 4) t = 6 + (r.completion - 6) * cue(4, 'Let A finish', 1.9);
  else t = 6 * cue(5, 'Replay just', 1.9);
  const x = (ms) => 157 + 36 * ms;
  if (b === 5) {
    t = 6 * cue(5, 'Release each pinned source', 2) + 11 * cue(5, 'Keep it until', 1.8);
    text('Use the transfer and kernel end marks to release buffers', 51, 127, 23);
    const life = r.events.map((e) => ({
      owner: e.owner,
      host: e.lane === 'copy',
      start: e.lane === 'copy' ? 0 : r.events.find((c) => c.owner === e.owner && c.lane === 'copy').start,
      end: e.end,
    }));
    life.forEach((l, i) => {
      const y = 164 + i * 50,
        label = (l.host ? 'Pinned ' : 'Device ') + l.owner;
      text(label, 48, y + 14, 17, C.dim);
      const x0 = x(l.start),
        end = x(l.end);
      box(x0, y, end - x0, 26, C.edge, 2);
      box(x0, y, Math.max(0, x(Math.min(t, l.end)) - x0), 26, l.owner === 'A' ? C.mint : C.gold, 2);
      if (t >= l.end) text('reusable at ' + l.end + ' ms', end + 9, y + 13, 16, C.silk);
    });
    line(x(t), 150, x(t), 349, C.paper, 1.7);
    readout(
      'Pinned source: hold through copy    ·    Device input: hold through kernel',
      'Each marked interval belongs to one buffer in this two-stream schedule.',
    );
    return;
  }
  text(
    overlap ? 'Separate copy and compute streams' : 'One stream   ·   ordered copies and kernels',
    51,
    125,
    24,
  );
  if (b === 0 && t === 0) {
    text('Pinned source buffers', 166, 365, 18, C.dim);
    wafer(414, 345, 112, 39, 'A', C.mint, 17);
    wafer(554, 345, 112, 39, 'B', C.gold, 17);
  }
  ['copy', 'compute'].forEach((name, i) => {
    const y = 183 + 75 * i;
    text(name, 53, y + 17, 19, C.dim);
    line(x(0), y + 37, x(20), y + 37, C.edge);
    r.events
      .filter((e) => e.lane === name)
      .forEach((e) => {
        if (t <= e.start) return;
        const dur = Math.min(t, e.end) - e.start,
          w = dur * 36;
        box(x(e.start), y, w, 36, e.owner === 'A' ? C.mint : C.gold, 3);
        if (w > 24) text(e.owner, x(e.start) + w / 2, y + 18, 18, C.ink, 'center', 'Mono');
      });
  });
  if (overlap)
    for (const owner of ['A', 'B']) {
      const ready = r.inputReady[owner],
        start = r.computeReady[owner];
      if (t >= ready) {
        const last = Math.min(t, start),
          col = owner === 'A' ? C.mint : C.gold;
        line(x(ready), 221, x(ready), 241, col, 1.5);
        line(x(ready), 241, x(last), 241, col, 1.5);
        v.dot(x(ready), 221, 3, col);
        if (t >= start) {
          line(x(start), 241, x(start), 258, col, 1.5);
          v.dot(x(start), 258, 3, col);
        }
      }
    }
  for (const mark of [0, 3, 6, 10, 17, 20]) {
    line(x(mark), 305, x(mark), 311, C.dim, 1);
    text(mark, x(mark), 329, 16, C.dim, 'center', 'Mono');
  }
  line(x(t), 167, x(t), 306, C.paper, 1.8);
  text('ms', 905, 327, 15, C.dim);
  const state =
    b === 5
      ? 'Pinned source ' +
        (t >= 3 ? 'A reusable' : 'A in use') +
        '   ·   ' +
        (t >= 6 ? 'B reusable' : 'B in use')
      : b === 3
        ? 'Copy events recorded at 3 ms and 6 ms'
        : overlap
          ? 'B waits for its copy event and the compute lane'
          : 'Pinned sources A and B   ·   3 ms copy, 7 ms kernel';
  if (b !== 0 || t > 0) text(state, 60, 373, 19, C.silk);
  readout(
    b === 5
      ? 'Keep device input until its kernel finishes reading'
      : b === 4 && t >= 17
        ? 'Two batches   20 ms serial → ' + r.completion + ' ms overlapped'
        : b === 3
          ? 'At 6 ms, can B start?'
          : 'Copy completion makes the input eligible for its consumer',
    'Illustrative schedule with separate device buffers and a free copy engine.',
  );
}
export function bound(v) {
  const { b, cue, text, line, dot, readout } = v;
  const highlight = b === 0 ? cue(0, 'Divide operations', 1) : 1;
  const intensity = 0.25 + 0.75 * cue(2, 'At a thousand bytes', 1.1) + 3 * cue(3, 'Follow the point', 2.1),
    r = roofline(intensity);
  const x = (i) => 97 + i * 137,
    y = (n) => 353 - n * 1.92;
  for (const q of [0, 40, 80, 100]) {
    line(x(0), y(q), x(4.3), y(q), C.edge, 1);
    text(q, 81, y(q), 14, C.dim, 'right', 'Mono');
  }
  for (const i of [0, 1, 2, 3, 4]) text(i, x(i), 375, 16, C.dim, 'center', 'Mono');
  text('GFLOP/s', 56, 119, 19, C.dim);
  text('FLOP per byte', 712, 375, 17, C.dim);
  line(x(0), y(0), x(2.5), y(100), C.mint, 4);
  line(x(2.5), y(100), x(4.3), y(100), C.mint, 4);
  text('Compute ceiling', x(2.9), y(100) - 21, 18, C.mint);
  if (highlight) {
    dot(x(r.intensity), y(r.bound), 9, C.gold);
    line(x(r.intensity), y(r.bound) + 10, x(r.intensity), 352, C.gold, 1);
  }
  text('1,000 FLOP', 745, 178, 23, C.paper);
  text(Math.round(r.bytes).toLocaleString('en-US') + ' bytes', 745, 224, 21, C.gold);
  text('40 GB/s', 745, 284, 20, C.dim);
  text('matched level', 745, 317, 16, C.dim);
  const atStop = [0.25, 1, 4].includes(r.intensity);
  readout(
    b === 0
      ? 'How far can these bytes take the kernel?'
      : atStop
        ? 'Upper bound   min(100, 40 × ' + r.intensity + ') = ' + r.bound + ' GFLOP/s'
        : 'Upper bound   ≈ ' + r.bound.toFixed(1) + ' GFLOP/s',
    'Illustrative hardware limits. Measure traffic beyond cache for this device-memory bound.',
  );
}
export function occupancy(v) {
  const { b, cue, text, box, line, wafer, readout } = v;
  const tile = cue(2, 'double the tile', 0.85, 'Now double the tile') > 0 ? 32 : 16,
    r = residentResources(tile);
  const blocks =
    b < 2 ? 1 : b === 2 && tile === 16 ? 1 + Math.floor((r.blocks - 1) * cue(2, 'Fill the SM', 1.5)) : r.blocks;
  if (b < 4) {
    text('Warp slots in one hypothetical SM', 54, 132, 23);
    for (const i of series(64)) {
      const x = 61 + 34 * (i % 16),
        y = 174 + 43 * Math.floor(i / 16);
      box(x, y, 30, 36, i < blocks * r.warpsPerBlock ? (Math.floor(i / 8) % 2 ? C.gold : C.mint) : C.edge, 3);
    }
    text('Shared memory', 648, 174, 19, C.dim);
    text(blocks * tile + ' / 64 KiB', 648, 207, 24, C.silk, 'left', 'Mono');
    text(b === 0 ? 'Threads / block' : 'Registers / block', 648, 269, 19, C.dim);
    text(
      b === 0 ? '256 threads' : r.registersPerBlock.toLocaleString('en-US'),
      648,
      306,
      24,
      C.silk,
      'left',
      'Mono',
    );
    readout(
      blocks +
        ' resident ' +
        (blocks === 1 ? 'block' : 'blocks') +
        '   ·   ' +
        blocks * r.warpsPerBlock +
        ' / 64 warp slots' +
        (b >= 2 ? '   ·   ' + (100 * blocks * r.warpsPerBlock) / 64 + '% occupancy' : ''),
      b >= 2
        ? '64 KiB of shared memory limits these blocks. Hardware can impose additional allocation constraints.'
        : '256 threads per block   ·   32 registers per thread   ·   65,536 registers on this SM',
    );
  } else {
    const reused = tileReuse(tokenValues, 2, true);
    const loaded = cue(4, 'Load our eight values once', 0);
    const firstPass = cue(4, 'read the shared copy twice', 0);
    const secondPass = cue(4, 'Both passes got their inputs', 0);
    const passes = Number(firstPass) + Number(secondPass);
    text('Global reads', 56, 133, 19, C.dim);
    v.row(
      tokenValues.map(value => loaded ? value : null),
      60,
      161,
      840,
      43,
      tokenValues.map(() => loaded ? C.paper : null),
    );
    ['Shared pass 1', 'Shared pass 2'].forEach((label, i) => {
      text(label, 62, 259 + i * 66, 19, C.dim);
      if (i < passes) {
        v.row(
          reused.reads[i].map((q) => q.value),
          230,
          234 + i * 66,
          526,
          42,
          tokenValues.map(() => C.mint),
          6,
          19,
        );
        text('Σ ' + reused.passSums[i], 794, 255 + i * 66, 20, C.gold, 'left', 'Mono');
      }
    });
    readout(
      loaded
        ? reused.globalLoads + ' global loads   ·   ' + reused.reads.slice(0, passes).flat().length + ' shared reads'
        : 'How often will the kernel read global memory?',
      'Verify the result and time the entire step before accepting the larger tile.',
    );
  }
}
export function profileLayout(stride) {
  const words = [];
  tokenValues.forEach((value, i) => { words[i * stride] = value; });
  const receipt = memoryRequests(stride);
  return { receipt, loads: receipt.rows.map((r) => words[r.word]) };
}
const packedLayout = profileLayout(1);
const stridedLayout = profileLayout(32);

export function profiler(v) {
  const { b, cue, text, box, wafer, line, readout } = v;
  if (b < 2) {
    text(b === 0 ? 'Nsight Systems   /   step timeline' : 'Nsight Compute   /   selected kernel', 53, 136, 24);
    if (b === 0) {
      [
        ['CPU', 'Prepare next batch', 0.02, 0.46, C.blue],
        ['Copy', 'H → D', 0.5, 0.62, C.gold],
        ['GPU', 'Kernel', 0.62, 0.98, C.mint],
      ].forEach(([name, op, a, z, col], i) => {
        const y = 184 + 62 * i;
        text(name, 61, y + 19, 20, C.dim);
        line(160, y + 38, 890, y + 38, C.edge, 1);
        box(160 + 730 * a, y, 730 * (z - a), 36, col, 3);
        text(op, 160 + (730 * (a + z)) / 2, y + 18, 16, C.ink, 'center');
      });
    } else {
      ['Instruction stalls', 'Resident warps', 'DRAM traffic'].forEach((k, i) => {
        const x = 65 + 292 * i;
        wafer(x, 208, 243, 71, k, C.paper, 21);
        text(['Where execution waited', 'Warps on the SM', 'Bytes beyond cache'][i], x, 328, 17, C.dim);
      });
    }
    readout(
      b === 0
        ? 'Inspect the idle gap before tuning the kernel'
        : 'Match measured traffic to bandwidth at the same memory level',
    );
  } else if (b < 4) {
    text('In-bounds loads', 56, 143, 21, C.dim);
    v.row(tokenValues, 60, 180, 836, 48);
    const duplicate = cue(2, 'adds a one twice') > 0,
      n = sum(tokenValues);
    text('Reference', 60, 284, 19, C.dim);
    text(n, 218, 284, 31, C.mint, 'left', 'Mono');
    text('Kernel', 411, 284, 19, C.dim);
    text(duplicate ? n + tokenValues[1] : '···', 533, 284, 31, C.red, 'left', 'Mono');
    if (duplicate) text('+ word 1 again', 640, 284, 18, C.red);
    readout(
      b === 2
        ? 'A legal address can still give the wrong sum'
        : 'Compare with a trusted result and check the kernel with Compute Sanitizer',
      'Memory, race and synchronization checks complement the numerical reference.',
    );
  } else {
    const packed = cue(4, 'Pack the words side by side', 0);
    const layout = packed ? packedLayout : stridedLayout;
    const route = packed ? cue(5, 'Trace the segment boundaries', 1) : 1;
    const r = wiring(v, layout.receipt, true, route, layout.loads);
    const footprintReady = route === 1 && (!packed || cue(5, 'The strided layout needed', 0));
    if (packed && footprintReady)
      text(
        'Packed sum  ' + sum(layout.loads) + '     Reference  ' + sum(tokenValues),
        475,
        383,
        18,
        C.mint,
        'center',
        'Mono',
      );
    readout(
      footprintReady
        ? (packed ? 'Packed' : 'Strided') + '   ·   ' + r.segments.length +
          ' aligned ' + (r.segments.length === 1 ? 'segment' : 'segments') + '   ·   ' + r.footprint + ' B footprint'
        : b === 4 ? 'How many segments contain these eight words?' : 'Follow the eight addresses',
      b === 6
        ? 'APOD: assess, parallelize, optimize, deploy. Include repacking and compare whole-step times.'
        : 'Each lane reads one 4-byte word. Each aligned segment spans 32 bytes.',
    );
  }
}
export function reporting(v) {
  const { b, cue, text, line, box, wafer, readout } = v;
  if (b < 2) {
    ['Forward', 'Backward', 'Update'].forEach((name, i) => {
      const x = 75 + i * 295;
      wafer(x, 191, 215, 65, name, i === 2 && b === 1 ? C.gold : C.paper, 26);
      if (i < 2) line(x + 218, 223, x + 281, 223, C.mint, 3);
    });
    text(b === 1 ? 'Adam' : 'SGD', 772, 152, 22, C.gold, 'center');
    if (b === 1) text('first m and v arrays', 765, 317, 19, C.gold, 'center');
    else text('features and targets share the model device', 481, 323, 22, C.dim, 'center');
    readout(
      b === 0
        ? 'Run a typical batch and the longest supported batch'
        : 'The first Adam update can allocate moments after backward succeeds',
    );
  } else if (b < 5) {
    const later = cue(2, 'until thirty-two milliseconds') > 0;
    const x = (t) => 164 + t * 16.6;
    text('Same GPU work in both runs', 54, 121, 21, C.dim);
    line(x(1), 183, x(41), 183, C.mint, 18);
    text('GPU', 55, 182, 20, C.mint);
    for (const [k, call] of [2, 32].entries()) {
      const y = 255 + k * 83;
      text(k ? 'Read later' : 'Read now', 55, y, 18, C.dim);
      if (k && !later) {
        line(x(2), y, x(42), y, C.edge);
        continue;
      }
      if (k) box(x(2), y - 9, x(call) - x(2), 18, C.blue, 2);
      box(x(call), y - 9, x(41) - x(call), 18, C.gold, 1);
      box(x(41), y - 9, x(42) - x(41), 18, C.paper);
      text(call + ' ms', x(call), y + 33, 15, C.dim, 'center', 'Mono');
      text('42 ms', x(42), y + 33, 15, C.dim, 'center', 'Mono');
    }
    readout(
      b === 4
        ? 'A deferred kernel error can surface at a later host wait'
        : b === 3
          ? 'Time inside item()   ' + readWait(2) + ' ms → ' + readWait(32) + ' ms'
          : 'Move the read. Keep kernel completion at 41 ms.',
      b === 4
        ? 'Enable launch blocking for diagnosis. Disable it for performance timing.'
        : 'Blue: other host work     •     Gold: waiting for the kernel     •     Ivory: scalar transfer',
    );
  } else {
    const x = (t) => 130 + 16 * t;
    text('Target step on a busy stream', 57, 141, 23);
    [
      [0, 5, 'Prior', C.gold],
      [5, 45, 'Target kernel', C.mint],
    ].forEach(([a, z, name, col]) => {
      box(x(a), 210, 16 * (z - a) - 1, 62, col, 2);
      text(name, (x(a) + x(z)) / 2, 241, 19, C.ink, 'center');
    });
    for (const t of [0, 5, 45]) text(t + ' ms', x(t), 304, 18, C.dim, 'center', 'Mono');
    const started = cue(5, 'start the host clock') > 0;
    if (started) {
      line(x(5), 323, x(45), 323, C.paper, 3);
      text('Timed interval   40 ms', (x(5) + x(45)) / 2, 354, 21, C.silk, 'center');
    }
    readout(
      'Drain earlier work before starting the host measurement',
      'Stop after completion. CUDA events measure time between recorded stream timestamps, including gaps.',
    );
  }
}
