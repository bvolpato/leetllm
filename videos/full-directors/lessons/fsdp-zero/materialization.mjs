import { C, fmt, sum } from './studio.mjs';
import {
  letters,
  ranks,
  perRank,
  lifetimes,
  afterForward,
  shardGroupSize,
  gatherState,
  budget,
  adam,
  portGBps,
} from './experiments.mjs';

export function lifecycle(p) {
  const { at } = p;
  const gather = at(1, 'all four ranks supply'),
    released = at(2, 'release the full compute'),
    again = at(2, 'Backward gathers'),
    reduced = at(3, 'reduce-scatter sends'),
    updated = at(3, 'optimizer updates');
  const weights = gather && (!released || again) && !reduced,
    saved = at(1, 'save the activations') && !reduced;
  p.title(
    'Inside the same communication unit',
    'Rank 2   /   FULL_SHARD   /   one forward and backward',
  );
  const lines = [
    ['Owned weight', C.weight],
    ['Compute copy', C.weight],
    ['Activation', C.opt],
    ['Gradient', C.grad],
  ];
  for (const [i, [name, color]] of lines.entries()) {
    const y = 251 + i * 154;
    p.text(name, 105, y + 69, 43, C.ink, 'Serif');
    if (i === 2) {
      p.rect(537, y, 1125, 91, C.bed, null, 9);
      if (saved) p.block(537, y, 1125, 91, color, 'Saved local input X', 36);
    } else
      for (const j of ranks) {
        const x = 537 + 285 * j;
        p.rect(x, y, 269, 91, C.bed, null, 5);
        const on =
          i === 0 ? j === 2 : i === 1 ? weights : reduced ? j === 2 : at(3, 'Backward produces');
        if (on) p.block(x, y, 269, 91, color, letters[j] + (updated && i === 0 ? '′' : ''), 39);
      }
  }
  const phase = updated
    ? 'Update C'
    : reduced
      ? 'Reduced shard C'
      : again
        ? 'Backward uses W for dX'
        : released
          ? 'Reshard after forward'
          : gather
            ? 'Gathered for forward'
            : 'Persistent shard';
  p.text(phase, 538, 943, 45, C.ink);
}

export function dtype(p) {
  const { at, beat } = p;
  const cues = [
    at(3, 'gather the full BF16'),
    at(3, 'form the local gradient'),
    at(4, 'release the compute copy'),
    at(4, 'Reduce-scatter leaves'),
    at(4, 'Adam uses that shard'),
    at(5, 'Clear it with'),
  ];
  const phase = cues.filter(Boolean).length,
    parts = lifetimes(phase);
  p.title(
    'Follow the allocations on rank zero',
    '1B parameters   /   4 ranks   /   Adam moments initialized',
  );
  const labels = [
    'Owned FP32 weight',
    'Two FP32 moments',
    'Gathered BF16 weights',
    phase >= 4 ? 'Reduced FP32 gradient' : 'Full local FP32 gradient',
  ];
  for (const [i, v] of parts.entries()) {
    const y = 266 + i * 145;
    p.text(labels[i], 105, y + 64, 39, C.ink, 'Serif');
    for (const j of ranks) {
      const x = 651 + j * 207;
      p.rect(x, y, 196, 89, C.bed, null, 5);
      if (j < v)
        p.block(
          x,
          y,
          196,
          89,
          [C.weight, C.opt, C.weight, C.grad][i],
          i === 0 && phase >= 5 ? 'W′' : '1 GB',
          30,
        );
    }
    p.text(fmt(v) + ' GB', 1535, y + 63, 46, C.ink, 'Mono');
  }
  p.text(
    phase === 6
      ? 'zero_grad(set_to_none=True)'
      : phase === 5
        ? 'After optimizer.step(), .grad is still live'
        : beat < 3
          ? '4 B weight  +  4 B gradient when present  +  8 B moments'
          : 'Shown buffers total ' + sum(parts) + ' GB',
    106,
    938,
    42,
    phase === 5 ? C.grad : C.sub,
  );
}

export function binding(p) {
  const { beat, at } = p;
  if (beat === 1 || beat === 6) {
    const grouped = at(1, 'on each block first'),
      root = at(1, 'then on the root'),
      opt = at(1, 'Build the optimizer afterwards');
    p.title(
      beat === 1 ? 'Choose the gather boundary' : 'A frozen base can still be read',
      beat === 1
        ? '10 blocks × 3 GB   /   24 GB card'
        : 'Frozen weights still participate in forward and input-gradient compute',
    );
    if (beat === 6) {
      p.block(145, 430, 437, 150, C.weight, 'Frozen W', 54);
      p.block(145, 677, 437, 108, C.opt, 'Trainable adapter', 34);
      p.text('→', 622, 539, 82, C.opt);
      p.text('X W', 780, 535, 72, C.ink, 'Mono');
      p.text('→', 1065, 539, 82, C.opt);
      p.text('dX = dY W^T', 1218, 535, 51, C.ink, 'Mono');
      p.tag('Gather W when the unit needs its values', 145, 345);
      return;
    }
    for (let i = 0; i < 10; i++) {
      const x = 112 + i * 166;
      p.block(x, 360, 152, 130, grouped && i > 0 ? C.sub : C.weight, String(i + 1), 43);
    }
    const width = grouped ? 152 : 1646;
    p.line(112, 545, 112 + width, 545, C.weight, 6);
    p.text(
      grouped ? '3 GB per block gather' : '30 GB root gather',
      112,
      657,
      64,
      grouped ? C.ok : C.bad,
      'Serif',
    );
    if (root) p.tag('Root takes the remaining embeddings and head', 115, 756);
    if (opt)
      p.text('AdamW(model.parameters())  →  owned DTensor shards', 115, 870, 43, C.opt, 'Mono');
    return;
  }
  if (beat === 2 || beat === 3) {
    const policies = [true];
    if (at(2, 'False keeps')) policies.push(false);
    if (at(3, 'Set the policy to four')) policies.push(4);
    p.title('What stays after forward?', 'reshard_after_forward   /   one unit sharded across ' + shardGroupSize + ' ranks');
    const xs = [430, 874, 1375];
    ['Forward', 'Retained compute weights', 'Backward'].forEach((label, i) =>
      p.text(label, xs[i], 314, 35, C.sub),
    );
    policies.forEach((policy, i) => {
      const { retained, gatherRanks } = afterForward(policy);
      const y = 400 + i * 162;
      const setting = policy === true ? 'True' : policy === false ? 'False' : 'Integer ' + policy;
      const kept = retained === 0 ? 'Released' : retained === 1 ? 'Full unit' : '1/' + policy + ' of unit';
      p.text(setting, 112, y + 67, 44, C.ink, 'Mono');
      p.ribbon(xs[0], y, 340, 98, C.weight, shardGroupSize);
      p.text('Full unit', xs[0], y + 137, 30, C.sub);
      p.rect(xs[1], y, 340, 98, C.bed, null, 5);
      if (retained) p.block(xs[1], y, 340 * retained, 98, C.weight);
      p.text(kept, xs[1], y + 137, 30, C.sub);
      p.ribbon(xs[2], y, 340, 98, C.weight, gatherRanks || 1);
      const action = gatherRanks ? 'Gather across ' + gatherRanks + ' ranks' : 'Use retained unit';
      p.text(action, xs[2], y + 137, 32, C.ink);
    });
    if (at(2, 'The default selects'))
      p.tag('Default   /   non-root True, root False', 112, 950);
    return;
  }
  if (beat === 4) {
    p.title(
      'Two controls keep different tensors',
      'Four ranks   /   one unit during gradient accumulation',
    );
    const active = at(4, 'Disabling gradient synchronization'),
      retained = at(4, 'Retaining full parameters');
    const rows = [
      ['Optimizer parameter', 1, C.weight],
      ['Gradients, sync disabled', active ? 4 : 0, C.grad],
      ['Gradients, reduce each time', at(4, 'Keeping reductions enabled') ? 1 : 0, C.grad],
      ['Retain full compute weights', retained ? 4 : 0, C.weight],
    ];
    rows.forEach(([name, n, col], i) => {
      const y = 264 + i * 159;
      p.text(name, 100, y + 70, 39);
      for (const j of ranks) {
        const x = 800 + j * 238;
        p.rect(x, y, 206, 96, C.bed, null, 4);
        if (j < n) p.block(x, y, 206, 96, col, letters[j], 36);
      }
    });
    return;
  }
  p.title(
    'Clip the norm over the owned parameters',
    'Gradient clipping   /   four coordinated ranks',
  );
  for (const r of ranks) {
    const x = 120 + r * 435;
    p.pcb(x, 327, 340, 177);
    p.center('grad ' + letters[r], x + 170, 430, 48, C.light);
  }
  p.text('FSDP2   clip_grad_norm_(DTensor parameters)', 121, 655, 44, C.ink, 'Mono');
  p.text('FSDP1   wrapper.clip_grad_norm_(...)', 121, 770, 44, C.ink, 'Mono');
  p.tag('FSDP1 compile uses original parameters', 122, 916);
}

export function trade(p) {
  p.title('The next unit needs both memory and time', 'One rank   /   model-state units');
  for (const i of ranks) {
    const size = sum(Object.values(perRank(i))),
      x = 115 + i * 435;
    p.text(i ? 'ZeRO-' + i : 'DDP', x, 296, 43, C.ink, 'Serif');
    p.rect(x, 337, 350, 79, C.bed, null, 5);
    p.ribbon(x, 337, (350 * size) / 8, 79, C.weight, 1);
    p.text(fmt(size) + ' units', x, 477, 37, C.sub, 'Mono');
  }
  if (p.beat === 1) {
    p.tag('Full sharding gathers a unit before compute', 115, 750);
    return;
  }
  const early = p.at(2, 'while the current unit computes');
  p.text('Current compute', 110, 662, 35);
  p.text('Next gather', 110, 803, 35);
  p.block(523, 591, 712, 91, C.opt, 'Block 1', 37);
  p.block(early ? 523 : 1235, 736, 475, 91, C.weight, 'Block 2', 37);
  p.tag(
    p.beat === 3
      ? 'Compare wrap sizes at the same workload   /   peak memory and step time'
      : early
        ? 'Prefetch places the next transfer under current compute'
        : 'The gather begins when block one finishes.',
    110,
    952,
  );
}

function transferMachine(p, s) {
  const x = 829,
    w = 675;
  p.text('Block 1 compute weights', 110, 296, 44, C.ink, 'Serif');
  p.text('Block 2 transfer', x, 296, 44, C.ink, 'Serif');
  p.text(fmt(s.time, 1) + ' ms', 1780, 296, 58, C.ink, 'Mono', 'right');
  for (let i = 0; i < 4; i++) {
    const y = 364 + i * 41;
    p.rect(115, y, 598, 34, s.first ? C.weight : C.bed, null, 3);
    if (s.first) p.rect(115 + (578 * s.time) / 6, y, 12, 34, C.light);
  }
  p.text(
    s.first ? '3.5 GB resident' : 'Released at 6 ms',
    115,
    587,
    32,
    s.first ? C.weight : C.sub,
    'Mono',
  );
  p.rect(x, 367, w, 155, C.bed, null, 6);
  const done = w * s.transferred;
  if (done > 0) p.ribbon(x, 367, done, 155, C.grad, 1);
  for (let i = 1; i < 4; i++) p.line(x + (w * i) / 4, 367, x + (w * i) / 4, 522, C.light, 5);
  p.text(
    s.second ? '3.5 GB ready' : '4 ms of link time',
    x,
    587,
    32,
    s.second ? C.ok : C.sub,
    'Mono',
  );
  if (s.launch === 5 && p.beat === 5 && !s.second)
    p.text(fmt(s.remaining, 1) + ' ms left', 1777, 470, 32, C.grad, 'Mono', 'right');
  const X = (t) => 440 + t * 136;
  p.text('Compute', 115, 708, 33);
  p.text('All-gather', 115, 806, 33);
  p.line(X(0), 705, X(10), 705, C.line);
  p.line(X(0), 801, X(10), 801, C.line);
  if (s.time > 0) p.rect(X(0), 665, X(Math.min(s.time, 6)) - X(0), 45, C.weight);
  if (s.time > s.launch) p.rect(X(s.launch), 762, 136 * Math.min(4, s.time - s.launch), 45, C.grad);
  if (s.time > 6 && s.launch === 5)
    p.rect(X(6), 665, 136 * (Math.min(9, s.time) - 6), 45, '#edd0c3');
  if (s.time > Math.max(s.ready, 6))
    p.rect(X(Math.max(s.ready, 6)), 665, 136 * (s.time - Math.max(s.ready, 6)), 45, C.opt);
  p.line(X(6), 638, X(6), 831, C.ink, 3);
  for (const t of [0, 4, 5, 6, 9]) p.text(t + '', X(t), 866, 28, C.sub, 'Mono', 'center');
  if (s.second && s.first)
    p.text('Two complete blocks live   3.5 + 3.5 = ' + fmt(s.weights) + ' GB', 115, 957, 37, C.opt);
  else if (s.time >= 9 && s.launch === 5)
    p.text('Block 2 starts at 9 ms   /   ' + s.wait + ' ms exposed', 115, 957, 37, C.bad);
  else
    p.text(
      s.launch === 5
        ? 'Earlier launch at 0 ms, ready at 4 ms. Same transfer on replay.'
        : 'Block 2 needs its weights at 6 ms',
      115,
      957,
      37,
      C.sub,
    );
}
export function granularity(p) {
  const { beat, at } = p;
  if (beat <= 2) {
    const separate = at(2, 'each block its own group'),
      second = at(2, 'The second block'),
      gathered = at(1, 'gathers all four blocks');
    p.title('Which blocks enter the gather?', 'Four blocks   /   3.5 GB each');
    for (const j of ranks) {
      const x = 133 + j * 420;
      p.text('Block ' + (j + 1), x, 375, 47, C.ink, 'Serif');
      p.rect(x, 431, 347, 171, C.bed, null, 6);
      if (gathered && (!separate || j === Number(second)))
        p.ribbon(x, 431, 347, 171, j === 1 ? C.grad : C.weight, 4);
      p.text('3.5 GB', x, 684, 40, C.sub, 'Mono');
    }
    p.text(
      gathered
        ? separate
          ? '1 × 3.5 = 3.5 GB'
          : '4 × 3.5 = 14 GB'
        : 'Block 1 requests its full weights',
      133,
      862,
      63,
      C.ink,
      'Serif',
    );
    return;
  }
  if (beat >= 6) {
    p.title(
      'Locate the exposed transfer in the profiler',
      'Two launches   /   identical 4 ms transfers   /   block 2 needs weights at 6 ms',
    );
    const left = 460,
      scale = 137;
    const pos = (t) => left + scale * t;
    p.line(pos(6), 284, pos(6), 781, C.bad, 4);
    for (const t of [0, 4, 5, 6, 9])
      p.text(t + ' ms', pos(t), 259, 31, t === 6 ? C.bad : C.sub, 'Mono', 'center');
    const rows = [
      ['Block 1 compute', 0, 6, C.weight],
      ['Early gather', 0, 4, C.grad],
      ['Late gather', 5, 9, C.grad],
    ];
    rows.forEach(([name, start, end, col], i) => {
      const y = 329 + i * 148;
      p.text(name, 106, y + 62, 36, C.ink, 'Serif');
      p.line(left, y + 86, pos(9), y + 86, C.line);
      p.block(pos(start), y, (end - start) * scale, 81, col);
    });
    p.line(pos(6), 779, pos(9), 779, C.bad, 5);
    p.center('3 ms exposed', pos(7.5), 838, 38, C.bad);
    p.tag(
      beat === 6
        ? 'Inspect the actual launch and completion on the communication stream.'
        : 'Also count overlapping activations, prefetched weights and unsynchronized gradients.',
      108,
      954,
    );
    return;
  }
  const late = at(4, 'Replay the same four milliseconds') && !at(5, 'Compare the early launch');
  let t = 4 * at(4, 'Launch at zero', 2);
  if (late) t = 5 + at(4, 'launching at five', 1.5) + 3 * at(5, 'Let the rest arrive', 2.25);
  if (beat >= 5 && !late) t = 4;
  p.title(
    late ? 'Replay with the launch at 5 ms' : 'Launch alongside block one',
    'Rank 0   /   one gather per block   /   compute window 0–6 ms',
  );
  transferMachine(p, gatherState(late ? 5 : 0, t));
}

export function links(p) {
  const { at, beat } = p;
  if (beat === 3) {
    p.title(
      'Read the speed printed on one port',
      'One direction   /   nominal line rate   /   8 bits in each byte',
    );
    const ports = at(3, 'eight hundred gigabits') ? [400, 800] : [400];
    for (const [i, rate] of ports.entries()) {
      const y = 323 + 240 * i;
      p.pcb(110, y, 377, 177);
      p.rect(142, y + 22, 314, 126, C.deep, null, 8);
      for (let j = 0; j < 8; j++) p.rect(162 + j * 34, y + 29, 20, 41, C.copper, null, 2);
      p.center(rate + ' Gb/s', 299, y + 125, 38, C.light);
      const bytes = portGBps(rate);
      p.ribbon(573, y + 32, bytes * 8, 96, C.opt, bytes / 10);
      p.text(bytes + ' GB/s', 1450, y + 103, 53, C.ink, 'Mono');
    }
    p.tag('Port sharing, contention and protocol overhead reduce usable bandwidth.', 113, 907);
    return;
  }
  if (beat === 4) {
    p.title('Trace one GPUDirect RDMA payload', 'Two hosts with compatible network adapters');
    const travel = at(4, 'read and write GPU memory', 2.8);
    for (const [r, x] of [118, 1152].entries()) {
      p.pcb(x, 353, 654, 342);
      p.text('Host ' + r, x + 31, 417, 37, C.light, 'Serif');
      const mem = r ? x + 348 : x + 35,
        nic = r ? x + 34 : x + 392;
      p.rect(mem, 497, 264, 123, C.deep, null, 8);
      p.center('GPU HBM', mem + 132, 548, 35, C.light);
      p.rect(nic, 497, 207, 123, C.bed, null, 5);
      p.center('NIC', nic + 104, 550, 38);
      p.rect(x + 280, 378, 312, 68, C.deep, null, 4);
      p.center('Host DRAM', x + 435, 423, 30, C.light);
    }
    p.line(280, 587, 1650, 587, C.copper, 8);
    p.block(238 + 1370 * travel, 566, 84, 43, C.grad);
    p.center('network', 959, 547, 32, C.grad);
    p.text(
      'The adapter moves the payload between GPU memory and the network.',
      111,
      835,
      41,
      C.ink,
    );
    p.tag('Measure the host link, peer link and storage separately.', 112, 934);
    return;
  }
  p.title('Follow the bytes across the link', 'Group ranks by their measured peer links');
  const centers = [252, 674, 1260, 1682];
  p.line(centers[0], 476, centers[1], 476, C.opt, 18);
  p.line(centers[2], 476, centers[3], 476, C.opt, 18);
  p.line(centers[1], 476, centers[2], 476, C.grad, 9);
  for (const [i, x] of centers.entries()) {
    p.pcb(x - 119, 406, 238, 140);
    p.center('GPU ' + i, x, 490, 40, C.light);
  }
  p.center('Fast peer domain', 462, 639, 35, C.opt);
  p.center('Fast peer domain', 1472, 639, 35, C.opt);
  p.center('NIC  ↔  network  ↔  NIC', 964, 359, 32, C.grad);
  p.tag('Measure exposed exchange before placing a tensor or context group', 113, 820);
}

export function hybrid(p) {
  const { at } = p;
  const local = at(2, 'keep each gather inside'),
    answer = at(3, 'Eight');
  p.title(
    local ? 'Keep each gather inside a node' : 'Shard across all four nodes',
    '70B model   /   1,120 GB state   /   4 nodes of 8',
  );
  for (const r of ranks) {
    const y = 250 + r * 123;
    p.text('Node ' + r, 113, y + 60, 37);
    for (let j = 0; j < 8; j++) {
      const x = 369 + j * 172,
        id = local ? j : r * 8 + j;
      p.block(x, y, 144, 82, id === 0 ? C.grad : C.pcb, String(id).padStart(2, '0'), 33);
    }
  }
  const groups = local ? 8 : 32;
  p.text(
    !local || answer
      ? '1,120 ÷ ' + groups + ' = ' + fmt(budget(70, groups, 3).state) + ' GB per rank'
      : '1,120 GB ÷ how many distinct shards?',
    112,
    867,
    55,
    local && answer ? C.bad : C.ink,
    'Serif',
  );
  p.tag(
    local
      ? answer
        ? 'Global 35 GB   /   node-local 140 GB   /   capacity 80 GB'
        : 'Global sharding used 35 GB per rank. Read the repeated IDs in the local layout.'
      : 'Each tile names a different state shard',
    115,
    948,
  );
}

export function checkpoint(p) {
  const { beat, at } = p;
  if (beat === 1) {
    p.title(
      'Save at a completed optimizer step',
      'Sharded checkpoint   /   each rank writes its owned tensors',
    );
    for (const r of ranks) {
      const x = 112 + r * 436;
      p.pcb(x, 336, 358, 234);
      p.center('Rank ' + r, x + 179, 398, 36, C.light);
      ['W', 'm', 'v'].forEach((v, j) =>
        p.block(x + 30 + j * 102, 441, 90, 76, j ? C.opt : C.weight, v + letters[r], 29),
      );
    }
    p.text('Restore the next batch', 112, 738, 50, C.ink, 'Serif');
    p.tag('Data cursor, RNG, counters, scheduler and scaler when used', 112, 822);
    p.tag('Mid-accumulation also requires gradients and the microstep', 112, 916);
    return;
  }
  if (beat === 5) {
    p.title(
      'Compare one global batch after resharding',
      'Replay example   /   valid targets 17, 18, 19, 20',
    );
    const targetIDs = [17, 18, 19, 20],
      gs = [-2, -6, -6, -6];
    for (const r of [0, 1]) {
      const y = 352 + r * 226;
      p.text(r ? '4 owners' : '2 owners', 110, y + 68, 45, C.ink, 'Serif');
      for (const j of ranks) {
        const x = 436 + j * 268,
          owner = r ? j : Math.floor(j / 2);
        p.block(x, y, 242, 99, [C.pcb, C.weight, C.grad, C.work][owner], 'ID ' + targetIDs[j], 34);
        p.text('g = ' + fmt(gs[j]), x + 16, y + 152, 29, C.sub, 'Mono');
      }
    }
    if (at(5, 'Its four contributions average'))
      p.text(
        'Both reduced means   ' + fmt(sum(gs) / gs.length) + '   /   compare within tolerance',
        109,
        919,
        40,
        C.opt,
        'Mono',
      );
    return;
  }
  const restored = at(3, 'Apply the update'),
    reset = at(3, 'Now update the reset');
  p.title(
    'Replay the first update after loading',
    'Same weight and g = −1   /   both betas 0.5   /   LR 0.1   /   epsilon and decay 0',
  );
  const states = [
    restored ? adam([1, 1, -1]) : adam([1, 1]),
    reset ? adam([-1]) : { m: 0, v: 0, t: 0 },
  ];
  const x = 829,
    scale = 7900;
  for (const r of [0, 1]) {
    const y = 382 + r * 296,
      applied = r ? reset : restored,
      s = states[r],
      d = applied ? s.delta : 0;
    p.text(r ? 'Reset Adam' : 'Restore Adam', 110, y - 8, 49, C.ink, 'Serif');
    p.tag('m ' + fmt(s.m, 3) + '   v ' + fmt(s.v, 3) + '   t ' + s.t, 110, y + 65);
    p.line(x, y, x + 820, y, C.line, 5);
    p.line(x, y - 43, x, y + 51, C.ink, 4);
    if (applied) p.rect(x, y - 8, d * scale, 16, r ? C.grad : C.opt);
    p.dot(x + d * scale, y, 22, r ? C.grad : C.opt);
    p.text(
      applied ? '+' + fmt(d, 5) : 'saved weight',
      x + d * scale,
      y + 99,
      38,
      r ? C.grad : C.opt,
      'Mono',
      applied ? 'center' : 'left',
    );
  }
  p.text(
    beat === 2
      ? 'Earlier gradients   +1, +1   /   next gradient   −1'
      : beat === 3
        ? 'Displacement from the same saved weight'
        : 'Compare next batch, gradients, moments, counters and updated weights',
    109,
    940,
    34,
    C.sub,
  );
}
