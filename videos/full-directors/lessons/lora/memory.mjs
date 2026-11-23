import { C, num, vec, count, lerp } from './bench.mjs';
import { nf4Block, trainingInventory } from '../../../films/lora/model.mjs';
import { NF4_LEVELS } from '../../../films/lora/fixtures.mjs';

const colors = [C.blue, C.muted, C.teal, C.brass];
export const bitsPerScale = 8 / 64 + 32 / (64 * 256);
export const scaleSavingGB = (n) => (n * (32 / 64 - bitsPerScale)) / 8;
export function inventory(d) {
  const { b, at, seen, head, box, mono, label, line, fade } = d;
  const long = seen(2, 'saved activations grow'),
    half = seen(3, 'halves the adapter state');
  const inv = trainingInventory(long ? 13 : 8, half ? 0.5 : 1),
    unit = 27,
    x = 76,
    y = 380,
    cap = x + 32 * unit;
  head(b === 5 ? 'Inside the frozen-weight allocation' : 'Will this peak fit a 32 GB device?');
  if (b === 5) {
    label('Same four supported base weights', 82, 165, C.blue);
    for (let i = 0; i < 4; i++) {
      box(83 + i * 162, 228, 152, 76, C.sky, C.blue, 4);
      mono('16 bits', 159 + i * 162, 265, 23, C.blue, 'center');
    }
    label('Packed NF4 payload', 82, 365, C.red);
    for (let i = 0; i < 4; i++) box(83 + i * 40, 405, 38, 72, C.peach, C.red, 3);
    mono('4 × 4 bits', 282, 443, 26, C.red);
    label('Block scale + higher-precision tensors still occupy memory.', 83, 559);
    return;
  }
  label('Fixed microbatch    ·    ' + (long ? '2,048' : '1,024') + ' tokens per ticket', 76, 162);
  inv.parts.forEach((part, i) => {
    const xx = x + i * 270;
    box(xx, 219, 15, 40, colors[i], null, 2);
    label(part.label, xx + 24, 226);
    mono(num(part.gb) + ' GB', xx + 24, 263, 29, colors[i]);
  });
  const ready = seen(1, 'those allocations total');
  const result = half ? seen(4, "We're one and a half over") : long ? seen(2, 'new peak') : ready;
  let xx = x;
  if (ready && (!half || result)) {
    for (const [i, part] of inv.parts.entries()) {
      box(xx, y, unit * part.gb, 70, colors[i]);
      xx += unit * part.gb;
    }
  }
  line(x, y + 73, x + 36 * unit, y + 73, C.muted, 2);
  line(cap, y - 45, cap, y + 96, C.red, 3);
  mono('32 GB', cap, y - 70, 22, C.red, 'center');
  if (result) {
    mono(num(inv.total) + ' GB', x, 546, 41);
    label(
      inv.total > 32 ? num(inv.total - 32) + ' GB over capacity' : num(32 - inv.total) + ' GB free',
      419,
      546,
      inv.total > 32 ? C.red : C.teal,
    );
  } else if (half) mono('Revised peak = ?', x, 546, 31);
}
export function planning(d) {
  const { b, seen, head, label, line, box, mono } = d;
  const n = b >= 3 ? 65 : 70;
  head(n + ' billion parameters   ·   decimal GB');
  const master = b === 1 && seen(1, 'master copy'),
    frozen = b >= 2;
  const values = [2 * n, 2 * n, 4 * n, 4 * n, ...(master ? [4 * n] : [])];
  const cols = [C.blue, C.red, C.brass, C.teal, C.muted];
  const names = ['Weights', 'Gradients', 'Adam m', 'Adam v', 'Master'];
  const u = 0.81;
  let x = 88;
  label('Full tuning   ·   model state only', 88, 165);
  values.forEach((v, i) => {
    box(x, 204, v * u, 65, cols[i]);
    mono(v, x + (v * u) / 2, 238, 23, C.light, 'center');
    label(names[i], x, 300, cols[i]);
    x += v * u;
  });
  mono(count(values.reduce((a, z) => a + z, 0)) + ' GB', x + 14, 235, 25);
  if (frozen) {
    label('Frozen 16-bit base', 87, 366, C.blue);
    box(88, 402, n * 2 * u, 46, C.blue);
    mono(n * 2 + ' GB', 220, 425, 27, C.blue);
  }
  if (b >= 4) {
    const packed = n * 0.5,
      scales = (n * bitsPerScale) / 8,
      floor = packed + scales;
    const start = 564,
      y = 418,
      unit = 10.6;
    label('48 GB device   ·   enlarged scale', start, 366);
    box(start, y, 48 * unit, 39, C.light, C.muted);
    box(start, y, packed * unit, 39, C.blue);
    box(start + packed * unit, y, scales * unit, 39, C.brass);
    mono(num(floor, 1) + ' GB base + scales', start, 499, 21, C.blue);
    mono(num(48 - floor, 1) + ' GB left', start + 320, 499, 21, C.red);
    label('Remaining space must cover every other live allocation.', start, 559);
  }
}
export function backward(d) {
  const { b, at, head, slab, arrow, label, mono, box, grid, line } = d;
  head('A frozen projection still carries an input gradient');
  if (b === 1) {
    slab(82, 235, 223, 99, 'Earlier adapter', 'trainable A and B', C.red);
    slab(480, 235, 221, 99, 'Frozen map', 'W₀', C.blue);
    slab(859, 235, 231, 99, 'Later loss', 'incoming gradient g', C.ink);
    arrow(309, 280, 471, 280, C.blue);
    arrow(707, 280, 849, 280, C.blue);
    const t = at(1, 'gradient still multiplies', 1);
    arrow(963, 404, 963 - 368 * t, 404, C.red);
    arrow(588, 404, 588 - 392 * t, 404, C.red);
    if (t > 0) mono('W₀ᵀ g', 473, 459, 29, C.red);
    label('No parameter update for W₀', 455, 546, C.blue);
    return;
  }
  label('Token activations', 78, 172, C.teal);
  box(78, 211, 401, 30, C.mint, C.teal, 2);
  mono('T = 2,048', 78, 282, 28, C.teal);
  label('Materialized attention scores', 675, 172, C.blue);
  box(674, 211, 282, 282, C.sky, C.blue);
  grid(674, 211, 282, 282, 23.5);
  mono('T × T', 993, 349, 24, C.blue);
  label(
    b === 2
      ? 'Sequence length enters twice in the score matrix.'
      : 'Avoid materializing this matrix with a supported attention kernel.',
    76,
    552,
  );
  if (b === 3)
    label(
      'A smaller microbatch reduces live tokens. Checkpointing recomputes activations.',
      76,
      597,
    );
}
const codec = nf4Block([-0.2, 0, 0.2, 2]);
export function nf4(d) {
  const { b, head, seen, line, circle, mono, label, box, arrow } = d;
  head('Which nearby code will this weight use?');
  const zoom = b >= 3,
    lo = zoom ? -0.2 : -1,
    hi = zoom ? 0.2 : 1,
    X = (n) => 100 + ((n - lo) / (hi - lo)) * 985,
    y = 267;
  label(zoom ? 'Magnified center of the NF4 codebook' : 'All sixteen NF4 levels', 78, 151);
  line(81, y, 1110, y, C.muted, 3);
  NF4_LEVELS.forEach((v, i) => {
    if (v < lo || v > hi) return;
    const x = X(v);
    line(x, y - 17, x, y + 16, v === 0 ? C.ink : C.blue, 3);
    mono(i, x, y + 44, zoom ? 22 : 15, C.blue, 'center');
    if (zoom) mono(num(v, 5), x, y - 44, 17, C.muted, 'center');
  });
  if (!zoom) {
    label('Index', 79, 337, C.blue);
    mono('7 negative levels     zero     8 positive levels', 106, 459, 27);
    return;
  }
  if (b >= 3) {
    const xx = X(0.1);
    arrow(xx, 385, xx, y + 68, C.red, 3);
    mono('+0.1', xx, 410, 22, C.red, 'center');
    if (seen(4, 'look across zero')) {
      arrow(X(-0.1), 385, X(-0.1), y + 68, C.teal, 3);
      mono('−0.1', X(-0.1), 410, 22, C.teal, 'center');
    }
  }
  if (b === 3) {
    mono('Weights ' + vec([-0.2, 0, 0.2, 2]) + '     block scale = ' + codec.scale, 77, 510, 26);
    label('Normalize by the largest absolute weight. Which mark is closer to +0.1?', 78, 575);
    return;
  }
  const indices = [2, 0, 1, 3],
    phrases = ['closer to code eight', 'closer to code six', 'code seven', 'code fifteen'];
  indices.forEach((j, i) => {
    const x = 72 + i * 280;
    if (seen(4, phrases[i])) {
      label('Weight ' + num(codec.normalized[j] * codec.scale), x, 478);
      mono('code ' + codec.codes[j], x, 521, 27, C.blue);
      if (seen(5, 'multiply its level')) mono('→ ' + num(codec.decoded[j], 4), x, 572, 24, C.teal);
    }
  });
}
export function nested(d) {
  const { b, head, box, line, mono, label, slab, arrow, at } = d;
  if (b < 4) {
    head('How much space do the scales take?');
    label('64 weights in one block', 85, 164, C.blue);
    for (let j = 0; j < 64; j++)
      box(91 + (j % 8) * 27, 206 + Math.floor(j / 8) * 27, 22, 22, C.sky, C.blue, 2);
    arrow(319, 309, 450, 309, C.muted);
    slab(
      470,
      259,
      208,
      93,
      b === 1 ? 'Block scale' : 'Scale index',
      b === 1 ? '32 bits' : '8 bits',
      C.brass,
    );
    if (b > 1) {
      arrow(688, 309, 788, 309, C.muted);
      slab(802, 259, 289, 93, 'Parent scale', '32 bits / 256 scales', C.teal);
    }
    mono(
      b === 1
        ? '32 / 64 = 0.5 bits per weight'
        : '8 / 64 + 32 / (64 × 256) ≈ ' + num(bitsPerScale) + ' bits per weight',
      81,
      499,
      26,
    );
    if (b === 3)
      label(
        'At 65B weights, the scale estimate saves ' +
          num(scaleSavingGB(65), 2) +
          ' GB. Retain the offset and codebook too.',
        81,
        570,
      );
    return;
  }
  head('Optimizer pages can migrate under pressure');
  label('GPU memory', 95, 161, C.blue);
  label('Host memory', 790, 161, C.teal);
  box(86, 193, 475, 301, C.light, C.blue, 10);
  box(774, 193, 354, 301, C.light, C.teal, 10);
  slab(118, 228, 405, 73, 'Base weights', 'resident', C.blue);
  slab(118, 316, 405, 73, 'Saved activations', 'resident', C.teal);
  const t = at(4, 'migrate optimizer-state pages', 1.6);
  const x = lerp(120, 808, t);
  box(x, 411, 256, 51, C.peach, C.red, 5);
  mono('Adam state page', x + 128, 438, 21, C.red, 'center');
  label('Managed memory can trade GPU residency for page-transfer time.', 87, 561);
}
export function precision(d) {
  const { b, head, label, slab, seen, arrow, box, mono } = d;
  head('Inspect each tensor where the job uses it');
  if (b <= 4) {
    const cpu = b === 2 || (b === 3 && !seen(3, 'quantized-model path'));
    const low = cpu && seen(2, 'disabling adapter');
    const trl = b >= 3 && !cpu;
    label(
      cpu
        ? 'Pinned CPU wrapper   ·   BF16 base'
        : trl
          ? 'Quantized TRL path   ·   after trainer setup'
          : 'Four choices for a QLoRA run',
      74,
      158,
    );
    const values = [
      cpu ? 'BF16' : 'Packed 4-bit codes',
      cpu ? 'Check during a forward pass' : 'Configured compute dtype, e.g. BF16',
      cpu
        ? low
          ? 'BF16 (promotion off)'
          : 'FP32 (default promotion)'
        : trl
          ? 'BF16 factors in TRL 1.17.1'
          : 'Inspect A and B',
      'Inspect optimizer tensors',
    ];
    ['Base storage', 'Base computation', 'Adapter storage', 'Optimizer state'].forEach((v, i) =>
      slab(
        79 + (i % 2) * 555,
        210 + Math.floor(i / 2) * 151,
        481,
        107,
        v,
        values[i],
        [C.blue, C.teal, C.red, C.brass][i],
      ),
    );
    if (trl) label('The cited TRL cast excludes the DoRA magnitude vector.', 79, 563);
  } else {
    label('bitsandbytes 0.50.2   ·   four-bit backward for an input gradient', 76, 171);
    slab(77, 263, 212, 115, 'Packed base', '4-bit values', C.blue);
    arrow(299, 319, 400, 319, C.muted);
    slab(410, 243, 362, 153, 'Temporary matrix', 'dequantized weights', C.red);
    arrow(786, 319, 883, 319, C.muted);
    slab(894, 263, 231, 115, 'Input gradient', 'backward result', C.teal);
    label('Profile the peak while the temporary is live.', 405, 476, C.red);
    if (b === 6)
      label('Prepare for k-bit training, attach factors, then profile the full job.', 79, 577);
  }
}
export function sharding(d) {
  const { b, at, head, box, mono, label, arrow, txt, slab } = d;
  head('Gather the unit before it computes');
  const t = at(2, 'gathers its frozen weights', 1.3),
    block = b >= 3;
  label('Distributed training   ·   four ranks', 76, 155);
  for (let i = 0; i < 4; i++) {
    const y = 231 + i * 83;
    label('rank ' + i, 78, y);
    for (let j = 0; j < 2; j++) {
      box(178 + j * 81, y - 25, 70, 49, C.sky, C.blue, 3);
      mono('w' + (i + 4 * j), 212 + j * 81, y, 19, C.blue, 'center');
    }
    if (t) arrow(355, y, 355 + 142 * t, y + (330 - y) * t, C.muted, 2);
  }
  if (b === 1) {
    label('Inference placement', 589, 242);
    mono('device_map="auto"', 589, 297, 28, C.blue);
    label('Training layout', 589, 385);
    mono('FSDP / DeepSpeed', 589, 437, 28, C.teal);
  } else {
    label(block ? 'Smaller unit on rank 0' : 'Gathered unit on rank 0', 587, 199, C.blue);
    for (let j = 0; j < (block ? 4 : 8); j++) {
      const x = 596 + (j % 4) * 101,
        y = 241 + Math.floor(j / 4) * 66;
      box(x, y, 83, 51, t === 1 ? C.sky : C.light, C.blue, 3);
      if (t === 1) mono('w' + j, x + 42, y + 26, 20, C.blue, 'center');
    }
    label('Peak also includes activations, factors and temporaries.', 568, 432);
    if (b === 4) label('Resume with the optimizer, schedule and data state.', 568, 509, C.teal);
  }
}
