import { C, fmt, clamp, sum } from './studio.mjs';
import { mesh, partials, output, schedules, attention } from './experiments.mjs';

export function offload(p) {
  const { beat, at } = p;
  if (beat === 5) {
    p.title(
      'Check the integration before launching',
      'DeepSpeed training   /   documented composition',
    );
    for (let i = 0; i < 4; i++) p.center('Stage ' + i, 751 + i * 283, 347, 38, C.sub);
    ['AutoTP', 'PipelineModule'].forEach((k, r) => {
      const y = 404 + r * 192;
      p.text(k, 110, y + 74, 44, C.ink, 'Mono');
      if (r && !at(5, 'Its PipelineModule')) return;
      for (let j = 0; j < 4; j++)
        p.block(
          629 + j * 283,
          y,
          244,
          111,
          r && j > 1 ? C.bad : C.opt,
          r && j > 1 ? 'Excluded' : 'Allowed',
          31,
        );
    });
    p.text('ZeRO-3 ranks must enter matching module gathers.', 111, 923, 42);
    return;
  }
  if (beat === 6) {
    p.title('Price a communication bucket', '500 million BF16 elements   /   2 bytes per element');
    p.ribbon(140, 410, 1540, 167, C.weight, 10);
    p.text('500,000,000 × 2 B = 1 GB', 138, 740, 67, C.ink, 'Mono');
    if (at(6, 'It scales that loss')) {
      p.text('The engine scales each microbatch loss during backward', 139, 845, 40, C.sub);
      if (at(6, 'and updates the weights'))
        p.text('and updates at the accumulation boundary.', 139, 902, 40, C.sub);
    }
    return;
  }
  const progress = at(3, 'four-gigabyte transfer', 3.6);
  p.title(
    'Trace an offloaded buffer',
    beat >= 3
      ? 'Host DRAM → GPU   /   measured host link 20 GB/s'
      : 'GPU HBM   /   host DRAM   /   NVMe storage',
  );
  const xs = [157, 788, 1420];
  p.line(207, 527, 1642, 527, C.copper, 14);
  for (const [i, x] of xs.entries()) {
    if (i === 0) p.pcb(x, 425, 326, 218);
    else if (i === 1) {
      p.rect(x, 430, 322, 194, C.pcb, null, 7);
      for (let k = 0; k < 4; k++) p.rect(x + 15 + k * 77, 474, 61, 83, C.deep, null, 3);
      for (let k = 0; k < 15; k++) p.rect(x + 15 + k * 20, 619, 12, 18, C.copper);
    } else {
      p.rect(x, 455, 319, 133, C.pcb, null, 10);
      p.dot(x + 294, 521, 11, C.copper);
      p.dot(x + 294, 521, 6, C.paper);
      for (let k = 0; k < 11; k++) if (k !== 4) p.rect(x - 13, 459 + k * 11, 20, 7, C.copper);
      p.rect(x + 27, 489, 63, 66, C.deep, null, 4);
      for (const xx of [103, 195]) p.rect(x + xx, 476, 79, 91, C.deep, null, 4);
      p.text('NAND', x + 141, 533, 21, C.light, 'Mono', 'center');
      p.text('NAND', x + 233, 533, 21, C.light, 'Mono', 'center');
    }
    p.text(['GPU HBM', 'Host DRAM', 'NVMe'][i], x, 362, 43, C.ink, 'Serif');
  }
  if (beat >= 3) {
    const x = 870 - 594 * progress;
    p.block(x, 510, 97, 67, C.grad, '4 GB', 25);
    p.text(
      at(3, 'two-hundred-millisecond') ? '4 GB ÷ 20 GB/s = 0.2 s' : '4 GB ÷ 20 GB/s',
      115,
      817,
      64,
      C.ink,
      'Mono',
    );
    p.tag('Payload-only lower bound   /   add latency and competing traffic', 117, 920);
  } else {
    p.tag('FSDP2 CPU offload', 150, 771);
    p.text('Host-side optimizer', 150, 840, 40);
    p.tag('ZeRO-Infinity', 1065, 771);
    p.text('CPU and NVMe tiers', 1065, 840, 40);
  }
}

export function deviceMesh(p) {
  const { beat, at } = p,
    all = beat >= 2;
  p.title('Which ranks own different sequences?', 'One regular mesh   /   no expert axis');
  const groups = all ? mesh.dp : 1;
  for (let r = 0; r < groups; r++) {
    const x = 113 + (r % 4) * 438,
      y = 260 + Math.floor(r / 4) * 263;
    p.pcb(x, y, 368, 195);
    p.text('Replica ' + r, x + 18, y + 43, 30, C.light, 'Mono');
    for (let depth = 0; depth < mesh.pp; depth++)
      for (let pos = 0; pos < mesh.cp; pos++)
        for (let tensor = 0; tensor < mesh.tp; tensor++) {
          const row = depth * 2 + pos;
          p.rect(
            x + 22 + tensor * 80,
            y + 59 + row * 30,
            73,
            24,
            pos ? C.copper : '#aed2c2',
            null,
            2,
          );
        }
  }
  if (!all) {
    p.text('One sequence replica', 644, 350, 58, C.ink, 'Serif');
    p.tag('4 matrix partitions across each row', 647, 450);
    p.tag('2 context slices per pipeline stage', 647, 528);
    p.tag('2 pipeline stages per replica', 647, 606);
    p.text('4 × 2 × 2 = 16 cooperating ranks', 646, 740, 42, C.ink, 'Mono');
    return;
  }
  p.text(
    '8 × 4 × 2 × 2 = ' + mesh.dp * mesh.tp * mesh.pp * mesh.cp + ' ranks',
    110,
    835,
    47,
    C.ink,
    'Mono',
  );
  if (at(2, 'global sequence batch'))
    p.text(
      '1 sequence × 4 microbatches × 8 replicas = ' + mesh.micro * mesh.accum * mesh.dp,
      110,
      935,
      41,
      C.opt,
      'Mono',
    );
}

export function tensor(p) {
  const { beat, at } = p;
  if (beat <= 3) {
    const numeric = beat >= 2,
      result = at(2, 'The output is eight');
    p.title(
      'Split a matrix multiply across two ranks',
      numeric
        ? 'Tiny MLP   /   positive hidden values   /   ReLU'
        : 'Same input to both ranks   /   split first weight by output column',
    );
    p.text('Hidden column', 103, 310, 34, C.sub);
    p.text('Matching row', 582, 310, 34, C.sub);
    p.text('Partial output', 1143, 310, 34, C.sub);
    for (let i = 0; i < 2; i++) {
      const y = 373 + i * 207,
        c = i ? C.grad : C.weight;
      p.block(103, y, 325, 115, c, numeric ? 'h = ' + (i + 2) : 'h' + i, 42);
      p.text('×', 469, y + 83, 54, C.sub);
      p.block(580, y, 350, 115, c, numeric ? (i ? '[2, −1]' : '[1, 4]') : 'W₂ row ' + i, 40);
      p.text('→', 1009, y + 82, 58, C.sub);
      if (!numeric || at(2, 'The partial vectors'))
        p.block(
          1143,
          y,
          505,
          115,
          c,
          numeric
            ? '[' + partials[i].map((v) => fmt(v)).join(', ') + ']'
            : 'Output coordinates 0, 1',
          numeric ? 43 : 31,
        );
    }
    if (numeric)
      p.text(
        result
          ? 'All-reduce sum   =   [' + output.join(', ') + ']'
          : 'Sum matching output coordinates',
        110,
        914,
        57,
        result ? C.opt : C.sub,
        'Serif',
      );
    else p.text('The elementwise activation stays on each rank.', 110, 914, 43, C.sub);
    return;
  }
  p.title(
    'Attention heads also have owners',
    'Classic replicated-input/output tensor-parallel layout',
  );
  for (let r = 0; r < 2; r++) {
    const y = 328 + r * 215;
    p.text('Rank ' + r, 114, y + 66, 45, C.ink, 'Serif');
    for (let j = 0; j < 2; j++)
      p.block(420 + j * 244, y, 217, 101, r ? C.grad : C.weight, 'Head ' + (r * 2 + j), 32);
    p.text('→', 928, y + 74, 51, C.sub);
    p.block(1050, y, 575, 101, r ? C.grad : C.weight, 'Output-projection partial', 31);
  }
  p.text(
    beat === 4
      ? 'Attention + MLP   /   2 forward and 2 backward all-reduces'
      : 'TP splits layer arithmetic. ZeRO changes state ownership.',
    112,
    891,
    40,
    C.opt,
  );
}

export function pipeline(p) {
  const { beat, at } = p;
  if (beat >= 4) {
    const large = at(5, 'eight stages'),
      stages = large ? 8 : 4,
      m = large ? 32 : 8,
      b = stages - 1;
    p.title(
      'Which denominator counts idle time?',
      'Balanced stages   /   transfer and optimizer costs omitted',
    );
    const x = 140,
      y = 397,
      w = 1570;
    p.ribbon(x, y, (w * m) / (m + b), 144, C.opt, m);
    p.ribbon(x + (w * m) / (m + b), y, (w * b) / (m + b), 144, C.grad, b);
    p.text(m + ' useful', x, y + 226, 44, C.opt, 'Mono');
    p.text(b + ' fill/drain', x + w, y + 226, 44, C.grad, 'Mono', 'right');
    p.text('Bubble / useful', 140, 764, 39);
    p.text(b + '/' + m + ' = ' + fmt((100 * b) / m) + '%', 1100, 764, 49, C.grad, 'Mono');
    p.text('Idle / elapsed', 140, 904, 39);
    p.text(
      b + '/' + (m + b) + ' = ' + fmt((100 * b) / (m + b)) + '%',
      1100,
      904,
      49,
      C.grad,
      'Mono',
    );
    return;
  }
  const alternate = beat > 1 || at(1, 'one-forward-one-backward flush');
  const s = schedules[Number(alternate)];
  p.title(
    alternate ? 'One forward, one backward' : 'Fill the pipeline with microbatches',
    '4 stages   /   8 microbatches   /   F forward, B backward',
  );
  const x0 = 287,
    dx = 59;
  for (let r = 0; r < 4; r++) {
    const y = 314 + 142 * r;
    p.text('Stage ' + r, 99, y + 64, 35, C.ink, 'Serif');
    for (let i = 0; i < s.ticks; i++) p.rect(x0 + i * dx, y, dx - 4, 86, C.bed, null, 2);
  }
  const seen =
    beat > 1
      ? s.ticks
      : Math.ceil(
          s.ticks *
            (alternate ? at(1, 'one-forward-one-backward flush', 3) : at(1, 'GPipe completes', 3)),
        );
  for (const e of s.events.filter((e) => e.tick < seen)) {
    const x = x0 + e.tick * dx,
      y = 314 + e.stage * 142;
    p.block(x, y, dx - 4, 80, e.kind === 'F' ? C.weight : C.opt, e.kind + e.microbatch, 23);
  }
  if (beat >= 2) {
    p.text('Peak sets', 1647, 273, 29, C.sub, 'Mono');
    s.maxLive.forEach((v, r) => p.center(String(v), 1721, 374 + r * 142, 43, C.opt));
  }
  p.text(
    beat === 1
      ? 'Each column is one time slot'
      : beat === 2
        ? 'Peak live sets by stage   ' + s.maxLive.join('  /  ')
        : '16 active + 6 idle = 22 slots   /   idle fraction 3/11',
    112,
    955,
    38,
    C.ink,
    'Mono',
  );
}

export function context(p) {
  const { beat, at } = p;
  const arrives = at(2, 'Another block arrives', 1.4);
  const merged = at(3, 'Three of the four parts');
  p.title('Keep the query on its owner', 'Follow Q0   /   two unmasked key–value blocks');
  for (const [r, x] of [133, 1080].entries()) {
    p.pcb(x, 365, 690, 264);
    p.text('Rank ' + r, x + 28, 419, 34, C.light, 'Mono');
    p.block(x + 40, 484, 177, 98, C.weight, 'Q' + r, 46);
  }
  const q = beat === 1 ? at(1, 'rotates KV blocks', 2) : arrives;
  p.line(825, 535, 1077, 535, C.copper, 8);
  const offset = 96 * Math.sin(Math.PI * q);
  p.block(428 + 947 * q, 484 - offset, 330, 98, C.opt, 'KV0   v=2', 36);
  p.block(1375 - 947 * q, 484 + offset, 330, 98, C.grad, 'KV1   v=10', 36);
  if (beat === 1) {
    p.text(
      'Each query sees remote keys and values as their blocks circulate.',
      110,
      841,
      42,
      C.sub,
    );
    return;
  }
  if (!merged) {
    p.text('KV₀   score 0   →   mass 1', 109, 745, 43, C.opt, 'Mono');
    if (arrives === 1) p.text('KV1   score ln 3   →   mass 3', 109, 851, 43, C.grad, 'Mono');
    return;
  }
  const renormalized = at(3, 'use the new maximum'),
    state = attention[1];
  p.text(
    renormalized
      ? 'New maximum = ln 3   /   old mass × (1/3)'
      : 'Masses 1 and 3   /   total mass 4',
    112,
    715,
    42,
    C.ink,
    'Mono',
  );
  p.text(
    renormalized
      ? '(2/3 + 10) / (1/3 + 1) = ' + fmt(state.output)
      : '(1 × 2 + 3 × 10) / 4 = ' + fmt(state.output),
    112,
    835,
    59,
    C.opt,
    'Mono',
  );
  if (beat === 4)
    p.tag('The query still visits each allowed position as sequence length grows.', 112, 952);
}
