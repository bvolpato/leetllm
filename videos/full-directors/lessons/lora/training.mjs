import { C, vec, num, count } from './bench.mjs';
import {
  learningSteps,
  adapterGradients,
  projectionBudget,
  rectangularExample,
} from '../../../films/lora/model.mjs';

export function gradient(d, derive) {
  const { b, head, at, seen, mono, label, slab, line, arrow, circle, txt } = d;
  head(derive ? 'Trace the loss gradient back through B' : 'Which factor moves first?');
  const symbolic = derive && b <= 2;
  const bothZero =
    (derive && b === 6) || (!derive && b === 4 && seen(4, 'If both factors start at zero'));
  const reverse = derive && bothZero && seen(6, 'Reverse the initialization');
  const nonzero = reverse && seen(6, 'Starting both factors nonzero');
  const cancels = (!derive && b === 5) || (derive && b === 5 && seen(5, 'If A x measures zero'));
  if (bothZero || cancels) {
    const A = cancels ? [[1, -1]] : [[nonzero ? 1 : 0]],
      B = [[reverse ? 1 : 0]],
      x = cancels ? [1, 1] : [1];
    const gradients = adapterGradients({ A, B, x, g: [-1] });
    label('Separate example   ·   s = 1   ·   incoming loss gradient = −1', 80, 161);
    slab(86, 232, 223, 94, 'Input', 'x = ' + vec(x), C.blue);
    slab(366, 232, 228, 94, 'Measure', 'A row = ' + vec(A[0]), C.teal);
    slab(647, 232, 188, 94, 'Expand', 'B = ' + num(B[0][0]), C.red);
    slab(884, 232, 236, 94, 'Correction', 'B(Ax) = ' + num(B[0][0] * gradients.z[0]), C.blue);
    arrow(315, 279, 358, 279, C.blue);
    arrow(597, 279, 639, 279, C.teal);
    arrow(840, 279, 878, 279, C.red);
    arrow(995, 401, 744, 401, C.red);
    arrow(738, 401, 476, 401, B[0][0] ? C.teal : C.muted);
    mono('dL/dA = ' + vec(gradients.gradA[0]), 315, 466, 27, C.teal);
    mono('dL/dB = ' + num(gradients.gradB[0][0]), 685, 466, 27, C.red);
    label(
      nonzero
        ? 'Two nonzero factors already change the output.'
        : reverse
          ? 'Nonzero B passes the error to A.'
          : cancels
            ? 'Equal coordinates cancel in A. The loss gradient of B is zero.'
            : 'Both zero factors block the first loss gradients.',
      119,
      558,
    );
    return;
  }
  const second = derive ? seen(4, 'moves B to one tenth') : seen(4, 'B moves to one tenth');
  const recomputed = derive ? seen(5, 'Run the next pass') : seen(4, 'next error');
  // The optimizer step changes the weights. The next pass supplies fresh activations and gradients.
  const steps = learningSteps(),
    weights = steps[second ? 1 : 0],
    pass = steps[recomputed ? 1 : 0];
  const origin = derive ? 4 : 3;
  let back = derive
    ? at(4, 'minus one back to B', 0.65)
    : at(3, 'Follow the error back to B', 0.65);
  let through = derive ? at(4, 'At A', 0.7) : at(3, 'To reach A', 0.7);
  if (derive && recomputed) {
    back = at(5, 'the error is minus nine tenths', 0.65);
    through = at(5, 'passes a tenth', 0.7);
  }
  const grads = adapterGradients({ A: [[pass.a]], B: [[pass.b]], x: [1], g: [pass.output - 1] });
  const revealedOutput = symbolic || derive || seen(2, 'So does the adapter');
  const xs = [81, 360, 666, 955],
    w = 173,
    y = 230;
  for (let i = 0; i < 3; i++) arrow(xs[i] + w + 3, y + 46, xs[i + 1] - 9, y + 46, C.muted);
  slab(xs[0], y, w, 94, 'Input', symbolic ? 'x' : 'x = 1', C.blue);
  slab(xs[1], y, w, 94, 'Measure', symbolic ? 'z = Ax' : 'A = ' + num(pass.a), C.teal);
  slab(xs[2], y, w, 94, 'Expand', symbolic ? 'sBz' : 'B = ' + num(pass.b), C.red);
  slab(
    xs[3],
    y,
    w,
    94,
    'Output',
    symbolic ? 'W₀x + sBz' : revealedOutput ? 'h = ' + num(pass.output) : 'h = ?',
    C.blue,
  );
  if (!symbolic) label('W₀x = 0     target = 1     s = 1     L = (h − 1)² / 2', 78, 164);
  if (symbolic) {
    const toB = at(1, 'incoming loss gradient'),
      toA = at(1, 'pass g through B transpose');
    arrow(1040, 381, 1040 - 290 * toB, 381, C.red, 5);
    arrow(747, 381, 747 - 300 * toA, 381, C.teal, 5);
    if (seen(1, 'To reach A')) mono('∂L/∂B = s g zᵀ', 687, 446, 26, C.red);
    if (b >= 2 || (toA && d.clock.elapsed >= d.clock.speechDuration))
      mono('∂L/∂A = s (Bᵀg) xᵀ', 196, 446, 26, C.teal);
    if (b === 2) label('Random A, zero B   ·   loss gradient before optimizer decay', 184, 545);
    return;
  }
  const showB = derive ? (recomputed ? seen(5, 'This time B') : seen(4, 'At A')) : seen(3, 'To reach A');
  const showA = derive
    ? recomputed
      ? seen(5, 'Both can move') ||
        d.clock.reveal('Its gradient is minus nine hundredths', 0, { captionStart: false })
      : seen(4, 'A stays at one')
    : through === 1;
  if (back > 0) {
    line(1044, 330, 1044, 389, C.red, 3);
    arrow(1044, 389, 1044 - 289 * back, 389, C.red, 6);
    circle(1044 - 289 * back, 389, 7, C.red);
    mono('g = ' + num(pass.output - 1), 962, 439, 23, C.red);
  }
  if (through > 0) {
    const color = pass.b === 0 ? C.muted : C.teal;
    arrow(745, 389, 745 - 301 * through, 389, color, pass.b === 0 ? 2 : 5);
    circle(745 - 301 * through, 389, 6, pass.b === 0 ? C.paper : color, color);
    mono('B × g = ' + num(pass.b) + ' × (' + num(pass.output - 1) + ')', 585, 357, 21, color, 'center');
  }
  if (derive && b === 3 && d.clock.reveal('Can the error get to B', 0, { captionStart: false }))
    label('Where does the backward signal stop?', 128, 512);
  if (derive && recomputed) {
    mono('B: ' + num(steps[0].b) + ' → ' + num(pass.b), xs[2], 205, 22, C.red);
    mono('A remains ' + num(pass.a), xs[1], 205, 22, C.teal);
  }
  if (showB) mono('dL/dB = ' + num(grads.gradB[0][0]), 664, 464, 30, C.red);
  if (showA) mono('dL/dA = ' + num(grads.gradA[0][0]), 345, 464, 30, recomputed ? C.teal : C.muted);
  if (second && !recomputed) {
    label('Pass 1 above   ·   updated weights for the next pass', 128, derive ? 503 : 535);
    mono(
      'A = ' + num(weights.a) + '       B = 0 − 0.1 × (−1) = ' + num(weights.b),
      128,
      derive ? 540 : 579,
      26,
      C.red,
    );
  } else if (b >= origin && back)
    label(
      recomputed
        ? (showA ? 'Pass 2   ·   the backward signal reaches both factors' : 'Pass 2   ·   recomputed with the new B')
        : 'Pass 1   ·   the loss travels back from the output',
      128,
      537,
    );
}
export function strength(d) {
  const { b, head, at, seen, arrow, grid, dial, mono, label, line } = d;
  head('Scale stretches a fixed correction');
  const r = seen(2, 'Increasing rank') ? 4 : 2,
    alpha = 2 + 2 * at(1, 'Turning it', 1.1) + 4 * at(2, 'scale is held constant', 0.65),
    s = alpha / r;
  dial(222, 336, 82, s - 1, 'Explicit multiplier', 'α / r = ' + num(s));
  const x = 613,
    y = 429;
  grid(526, 176, 539, 314, 39);
  line(527, y, 1062, y, C.muted);
  line(x, 185, x, 483, C.muted);
  arrow(x, y, x + 141, y - 70.5, C.muted, 3);
  arrow(x, y, x + 141 * s, y - 70.5 * s, C.red, 6);
  mono('BAx = [0.5, 0.25]', 552, 538, 23);
  mono('α = ' + num(alpha) + '     r = ' + r, 95, 543, 24);
  if (b >= 2)
    label(
      alpha === 8
        ? 'Double r and α to restore the multiplier.'
        : alpha > 4
          ? 'Raise α to restore the multiplier.'
          : 'Same α. A wider factor changes the divisor.',
      552,
      595,
      C.teal,
    );
}
export const sweeps = [
  [8, 16],
  [32, 16],
  [32, 64],
];
export const multiplier = ([r, a], rs) => a / (rs ? Math.sqrt(r) : r);
export function scaling(d) {
  const { b, head, seen, box, mono, label, line } = d;
  head('What multiplier does this recipe apply?');
  const rs = b >= 2;
  mono(rs ? 's = α / √r' : 's = α / r', 84, 170, 34, C.red);
  label('Rank', 84, 250);
  label('Alpha', 259, 250);
  label('Explicit scale', 458, 250);
  sweeps.forEach((pair, i) => {
    const y = 323 + 86 * i,
      show = rs || i === 0 || seen(1, i === 1 ? 'raise rank' : 'alpha must become');
    mono(pair[0], 85, y, 31);
    mono(pair[1], 259, y, 31);
    line(461, y, 938, y, C.grid, 2);
    if (show) {
      const n = multiplier(pair, rs);
      box(461, y - 11, n * 37, 22, C.red, null, 4);
      mono(num(n), 975, y, 27, C.red);
    }
  });
  if (b >= 3)
    label(
      b === 3
        ? 'At initialization, B = 0 makes the correction zero for all three.'
        : 'Compare update norms and held-out performance for the trained factors.',
      84,
      589,
    );
}
export const chosen = (rows, mode) =>
  rows.filter(
    (r, i) =>
      mode === 'all' || (mode === 'attention' ? i < 4 : mode === 'qv' && [0, 2].includes(i)),
  );
export const cost = (rows) => rows.reduce((s, r) => s + r.count, 0);
function modules(d, rows, mode, detail) {
  const { box, txt, mono, label, line } = d;
  const selected = chosen(rows, mode);
  rows.forEach((r, i) => {
    const x = 67 + i * 154,
      y = 274,
      active = selected.includes(r),
      col = active ? C.red : C.muted;
    const maxDim = Math.max(...rows.map((t) => Math.max(t.input, t.out)));
    const h = (105 * r.out) / maxDim,
      w = (125 * r.input) / maxDim;
    box(x + (125 - w) / 2, y + 118 - h, w, h, active ? C.peach : C.light, col, 3);
    txt(r.name.toUpperCase(), x + 62, y + 91 - h, 23, col, 'center', 'Sans', 700);
    mono(r.out + '×' + r.input, x + 62, y + 146, 15, C.ink, 'center');
    if (active) mono(count(r.count), x + 62, y + 192, 20, C.red, 'center');
  });
  line(70, 215, 633, 215, C.blue, 3);
  label('Attention projections', 70, 189, C.blue);
  line(681, 215, 1113, 215, C.teal, 3);
  label('Per-token MLP', 681, 189, C.teal);
  if (detail) mono('Σ r (in + out)  =  ' + count(cost(selected)), 75, 548, 31, C.red);
}
export function targets(d, budget) {
  const { b, seen, head, label } = d;
  const tiny = budget && b >= 4,
    rows = tiny ? projectionBudget(16, 32, 8, 2) : projectionBudget();
  let mode = budget
    ? b >= 2 && !tiny
      ? 'all'
      : 'qv'
    : seen(2, 'feed-forward layers')
      ? 'all'
      : seen(2, 'other attention projections') ? 'attention' : 'qv';
  if (tiny && seen(5, 'all attention')) mode = seen(5, 'all seven') ? 'all' : 'attention';
  head(
    tiny
      ? 'Read the actual Qwen2 projection shapes'
      : budget
        ? 'How many factor weights enter the block?'
        : 'Where does the adapter enter the block?',
  );
  modules(d, rows, mode, budget);
  label(
    tiny
      ? 'Tiny Qwen2   ·   r = 2   ·   GQA narrows K and V   ·   output head excluded'
      : budget
        ? '4096 hidden   ·   11008 MLP   ·   r = 16'
        : 'Warm modules receive factors. Cool modules keep their original weights.',
    78,
    603,
  );
}
export function placement(d) {
  const { b, at, seen, head, slab, box, line, arrow, label, mono, fade } = d;
  head('Follow the learned state into the transformer');
  ['Input embeddings', 'Layer prefix', 'Weight update'].forEach((name, i) => {
    const x = 90 + i * 374,
      col = [C.teal, C.blue, C.red][i],
      active = i === 0 || seen(2, i === 1 ? 'Prefix tuning' : 'LoRA places');
    label(name, x, 165, col);
    [0, 1].forEach((j) => {
      const y = 262 + 112 * j;
      slab(x + 71, y, 167, 68, 'Layer ' + (2 - j), 'projection W', C.blue);
      if (i === 1 && active) {
        box(x - 17, y + 12, 62, 42, C.sky, C.blue, 4);
        mono('K,V', x + 13, y + 34, 18, C.blue, 'center');
        arrow(x + 46, y + 32, x + 69, y + 32, col, 3);
      }
      if (i === 2 && active) {
        box(x + 242, y + 16, 88, 36, C.peach, C.red, 3);
        mono('+ sBA', x + 286, y + 34, 18, C.red, 'center');
      }
    });
    arrow(x + 153, 370, x + 153, 335, C.muted);
    arrow(x + 153, 481, x + 153, 448, C.muted);
    for (let k = 0; k < 5; k++)
      box(
        x + 30 + k * 46,
        492,
        38,
        36,
        i === 0 && k < 2 ? C.mint : C.light,
        i === 0 && k < 2 ? C.teal : C.grid,
        4,
      );
    if (active)
      label(
        ['learned virtual tokens', 'keys and values per layer', 'factors in matched W'][i],
        x + 4,
        566,
        col,
      );
  });
}
export function rectangular(d) {
  const { b, head, label, matrix, mono, seen } = d;
  if (b >= 5) {
    head('Count operations for a single token');
    const w = 4096,
      r = 16;
    label('Frozen projection', 81, 186, C.blue);
    mono('2 × 4096²', 83, 244, 30, C.blue);
    mono(count(2 * w * w) + ' FLOPs', 83, 312, 35, C.blue);
    label('Both thin products', 626, 186, C.red);
    mono('2 × (16 × 4096 + 4096 × 16)', 626, 246, 24, C.red);
    mono(count(4 * r * w) + ' FLOPs', 626, 313, 35, C.red);
    mono('Extra arithmetic    ' + num((100 * 2 * r) / w, 2) + '%', 82, 444, 37, C.teal);
    label('Multiply-add = 2 FLOPs. Scale and final addition excluded.', 83, 516);
    if (b === 6) label('Forming a dense BA separately costs about 2 × 4096² × 16 FLOPs.', 82, 574);
    return;
  }
  const changed = seen(4, 'displayed B entries change'),
    f = rectangularExample(changed ? 1 : 0);
  head('This layer maps four input coordinates to three outputs');
  label('Base W₀    3 × 4', 75, 154, C.blue);
  matrix(f.W, 80, 192, 71);
  label('A    2 × 4', 465, 154, C.teal);
  matrix(f.A, 468, 192, 78, C.teal);
  label('B    3 × 2', 928, 154, C.red);
  matrix(f.B, 925, 192, 71, C.red, (i, j) => changed && f.B[i][j] !== 0);
  mono('x = ' + vec(f.x), 75, 435, 27);
  if (seen(2, 'B maps those two')) mono('Ax = ' + vec(f.z), 75, 493, 26, C.teal);
  if (seen(2, 'so its correction')) mono('2 B(Ax) = ' + vec(f.correction), 631, 493, 26, C.red);
  if (seen(3, 'B initially gives no correction')) {
    mono('W₀x = ' + vec(f.base), 75, 552, 26, C.blue);
    const outputKnown = !changed || seen(4, 'The explicit dense merge');
    mono('h = ' + (outputKnown ? vec(f.output) : '?'), 631, 552, 26, C.red);
  }
  if (changed) {
    label('Scale = 2   ·   two edited B entries', 465, 433);
    if (seen(4, 'this exercise')) label('Dense merge agrees', 926, 433, C.red);
  }
}
export function wrapper(d) {
  const { b, head, label, slab, mono, seen } = d;
  const rows = projectionBudget(16, 32, 8, 2);
  const total = cost(rows);
  const larger = seen(4, 'For the larger model');
  head(larger ? 'Check the targets on the larger model' : 'Tiny Qwen2 on CPU');
  if (b <= 2) {
    modules(d, rows, b === 1 ? 'none' : 'all', b === 2);
    label(
      'Seeded random base   ·   PyTorch 2.13   ·   Transformers 5.16.1   ·   PEFT 0.20',
      76,
      599,
    );
    return;
  }
  if (larger) {
    label('Completed CPU run   ·   tiny Qwen2', 78, 170, C.teal);
    mono(rows.length + ' matched projections', 78, 235, 24);
    mono(count(total) + ' trainable parameters', 78, 288, 24);
    mono(count(3408 + total) + ' total parameters', 78, 341, 24);
    label('Separate and merged logits agree within tolerance.', 78, 413, C.teal);
    label('Proposed run   ·   Qwen2.5-7B', 634, 170, C.blue);
    if (seen(4, 'rank sixteen')) mono('r = 16', 634, 235, 26);
    if (seen(4, 'alpha thirty-two')) mono('alpha = 32', 851, 235, 26);
    if (seen(4, 'all-linear targeting')) mono('targets = all-linear', 634, 288, 23);
    if (seen(4, 'dropout to zero point zero five')) mono('dropout = 0.05', 634, 341, 23);
    if (seen(4, 'causal language modeling')) mono('bias = none   ·   CAUSAL_LM', 634, 394, 23);
    if (seen(4, 'Before training')) {
      label('Inspect each matched name and weight shape.', 634, 500, C.blue);
      mono('print_trainable_parameters()', 634, 548, 23);
    }
    return;
  }
  mono('3,408 frozen  +  ' + total + ' trainable  =  ' + count(3408 + total), 80, 181, 31);
  if (b === 4) label(rows.length + ' matched projections   ·   rank 2   ·   all-linear', 80, 221, C.teal);
  ['Initialization', 'Two SGD passes', 'Save and reload', 'Merge in eval mode'].forEach(
    (name, i) => {
      const ready = i === 0 || seen(3, ['', 'two steps', 'reloads', 'supported merge'][i]);
      slab(
        76 + (i % 2) * 565,
        267 + Math.floor(i / 2) * 129,
        493,
        95,
        name,
        ready
          ? [
              'Original outputs agree',
              'B, then A receive gradients',
              'Exact seeded base + adapter',
              'Logits within tolerance',
            ][i]
          : 'Pending comparison',
        ready ? C.teal : C.muted,
      );
    },
  );
}
export function lexical(d) {
  const { b, head, box, mono, txt, seen, label, line, arrow } = d;
  head('Give the new token a row on both sides');
  const resized = seen(1, 'Resize token embeddings'),
    trained = seen(2, 'both places');
  [0, 1].forEach((i) => {
    const x = 125 + i * 614;
    label(i ? 'Output readout   ·   untied' : 'Input embedding', x, 165, i ? C.red : C.blue);
    for (let j = 0; j < (resized ? 5 : 4); j++) {
      const y = 219 + j * 55;
      mono('ID ' + j, x - 56, y + 17, 15, C.muted);
      for (let k = 0; k < 4; k++)
        box(
          x + k * 62,
          y,
          54,
          38,
          j < 4 ? C.sky : trained ? C.mint : C.light,
          j < 4 ? C.blue : trained ? C.teal : C.red,
          3,
        );
    }
    if (resized)
      txt(
        trained ? 'Train and save row 4' : 'Allocated row 4',
        x,
        529,
        22,
        trained ? C.teal : C.red,
      );
  });
  arrow(410, 331, 691, 331, C.muted);
  label('Attention path', 470, 293);
  if (b === 3)
    label('Reload both sets of rows and check generation of the new ID.', 97, 592, C.teal);
}
