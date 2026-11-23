import { C, num, vec, count, lerp } from './bench.mjs';
import { EXAMPLE } from '../../../films/lora/fixtures.mjs';
import { matmul, matvec } from '../../../films/lora/arithmetic.mjs';
import { forward, doraRow } from '../../../films/lora/model.mjs';
import { multiplier } from './training.mjs';

export function merge(d, exporting) {
  const { b, head, seen, at, fade, matrix, label, mono, slab, arrow } = d;
  if (exporting && b !== 2) {
    head('Keep a recoverable pair before merging');
    slab(93, 196, 350, 97, 'Clean base', 'exact checkpoint revision', C.blue);
    slab(93, 364, 350, 97, 'Saved adapter', 'A, B, scale and targets', C.red);
    arrow(450, 247, 607, 300, C.blue);
    arrow(450, 412, 607, 335, C.red);
    slab(620, 264, 432, 114, 'Returned dense model', 'dense = wrapped.merge_and_unload()', C.teal);
    if (b >= 3) {
      arrow(840, 383, 840, 437, C.muted);
      slab(620, 446, 432, 83, 'Quantized export', 'evaluate after requantization', C.brass);
    }
    label(
      b === 1
        ? 'The wrapped base is modified. Use the returned model.'
        : 'Changing the numerical base calls for a fresh output comparison.',
      84,
      560,
    );
    return;
  }
  const f = forward(2);
  head(
    exporting
      ? 'Verify the returned weights on the same input'
      : 'Fold the correction into the frozen weights',
  );
  label('Original W₀', 122, 167, C.blue);
  matrix(EXAMPLE.W, 132, 205, 74, C.blue);
  mono('+', 343, 281, 46);
  label('Scaled product   sBA', 443, 167, C.red);
  matrix(f.update, 464, 205, 74, C.red);
  mono('=', 688, 281, 46);
  label('Merged weights', 813, 167, C.teal);
  const p = exporting ? 1 : at(1, 'add it to the base matrix', 0.8);
  matrix(
    f.merged.map((r) => r.map((v) => (p === 1 ? v : null))),
    826,
    205,
    74,
    C.teal,
  );
  if (p === 1) {
    mono('x = ' + vec(EXAMPLE.x), 117, 454, 28);
    mono('W₀x + sB(Ax) = ' + vec(f.output), 421, 454, 26, C.teal);
  }
  if (b >= 2) label('Compare with dropout off and a tolerance appropriate to the dtype.', 118, 551);
  if (!exporting && b === 3)
    label('For per-request selection, keep the base and each adapter separate.', 117, 597, C.blue);
}
export function dora(d) {
  const { b, seen, at, head, grid, line, arrow, label, mono, box, matrix } = d;
  if (b >= 4) {
    const big = b === 5,
      rows = big ? 4096 : 4,
      cols = big ? 4096 : 6,
      r = big ? 16 : 2,
      n = r * (rows + cols);
    head('Each output row adds one magnitude');
    label(big ? '4096 outputs × 4096 inputs' : '4 outputs × 6 inputs', 78, 171, C.blue);
    if (!big) {
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 6; j++) box(85 + j * 51, 225 + i * 64, 45, 52, C.sky, C.blue, 2);
        box(432, 225 + i * 64, 70, 52, C.peach, C.red, 3);
        mono('m' + (i + 1), 467, 250 + i * 64, 23, C.red, 'center');
      }
    } else {
      box(86, 207, 284, 284, C.sky, C.blue);
      grid(86, 207, 284, 284, 17.75);
      box(404, 207, 24, 284, C.peach, C.red);
      label('m', 450, 348, C.red);
    }
    mono('LoRA    ' + count(n), 605, 250, 34, C.blue);
    mono('DoRA    +' + count(rows), 605, 329, 34, C.red);
    mono(num((100 * rows) / n) + '% extra', 605, 421, 32, C.teal);
    return;
  }
  head('Normalize the direction, then set its magnitude');
  const turn = at(2, 'directional factors', 1),
    grow = at(2, 'magnitude can both change', 1);
  const v = [3 + 0.5 * turn, 4],
    m = 5 + grow,
    f = doraRow(v, m, [1, 0]);
  const X = (n) => 137 + 67 * n,
    Y = (n) => 535 - 67 * n;
  grid(96, 147, 469, 402, 67);
  line(96, Y(0), 568, Y(0), C.muted);
  line(X(0), 144, X(0), 557, C.muted);
  arrow(X(0), Y(0), X(v[0]), Y(v[1]), C.blue, 8);
  arrow(X(0), Y(0), X(f.weight[0]), Y(f.weight[1]), C.teal, 4);
  label('Row-wise formula for ‖Vᵢ‖ > 0', 629, 171);
  mono('Wᵢ = mᵢ Vᵢ / ‖Vᵢ‖', 629, 232, 32);
  mono('Vᵢ = ' + vec(v), 629, 315, 27, C.blue);
  mono('‖Vᵢ‖ = ' + num(f.norm), 629, 369, 27, C.blue);
  mono('mᵢ = ' + num(m), 629, 426, 27, C.red);
  mono('Wᵢ = ' + vec(f.weight), 629, 493, 28, C.teal);
  if (b === 3) label('Write this final row into the dense export.', 629, 570);
}
export function radial(d) {
  const { b, head, seen, at, label, mono, arrow, grid, line, circle } = d;
  const gradient = b >= 3;
  head(
    gradient
      ? 'Which derivative responds to a radial stretch?'
      : 'What changes when the directional row doubles?',
  );
  const stretch = at(1, 'double both coordinates', 1) * (1 - at(2, 'rewind to three', 0.8));
  const v = [3 * (1 + stretch), 4 * (1 + stretch)],
    m = 5,
    f = doraRow(v, m, [1, 0]);
  if (!gradient) {
    const X = (n) => 121 + 50 * n,
      Y = (n) => 555 - 50 * n;
    grid(95, 130, 467, 440, 50);
    arrow(X(0), Y(0), X(v[0]), Y(v[1]), C.blue, 8);
    if (b > 1 || stretch === 0) arrow(X(0), Y(0), X(f.weight[0]), Y(f.weight[1]), C.teal, 4);
    mono('V = ' + vec(v), 638, 195, 33, C.blue);
    mono('‖V‖ = ' + num(f.norm), 638, 265, 29, C.blue);
    mono('m = 5     x = [1, 0]', 638, 344, 26);
    const hide = stretch > 0 && b === 1;
    mono('h = ' + (hide ? '?' : num(f.output)), 638, 447, 40, C.teal);
    label('h = m (V · x) / ‖V‖    for ‖V‖ > 0', 630, 530);
    return;
  }
  const X = (n) => 161 + 337 * n,
    Y = (n) => 318 - 337 * n;
  grid(93, 192, 485, 350, 47);
  line(98, Y(0), 570, Y(0), C.muted);
  line(X(0), 194, X(0), 542, C.muted);
  const showFull = seen(4, 'full gradient ends'),
    sub = at(4, 'takes away', 1);
  arrow(X(0), Y(0), X(f.detached[0]), Y(f.detached[1]), C.blue, 6);
  if (sub > 0) {
    arrow(X(1), Y(0), X(1 + (f.full[0] - 1) * sub), Y(f.full[1] * sub), C.red, 4);
  }
  if (showFull) arrow(X(0), Y(0), X(f.full[0]), Y(f.full[1]), C.teal, 6);
  mono('V = [3, 4]    ‖V‖ = m = 5', 614, 174, 23);
  label('Hold the denominator fixed in backward', 614, 243, C.blue);
  mono('∇V h = ' + vec(f.detached), 614, 291, 27, C.blue);
  if (seen(3, 'unit direction')) mono('u = V / ||V|| = [0.6, 0.8]', 614, 331, 21);
  if (showFull) {
    label('Differentiate through the norm', 614, 363, C.teal);
    mono('grad h = [1, 0] − 0.6 u', 614, 410, 24, C.teal);
    mono('       = ' + vec(f.full), 614, 447, 24, C.teal);
  }
  if (seen(5, 'detached rule gives three'))
    mono(
      'Radial dot    ' +
        num(3 * f.detached[0] + 4 * f.detached[1]) +
        '   vs   ' +
        num(3 * f.full[0] + 4 * f.full[1]),
      615,
      498,
      25,
    );
  if (b === 7)
    label('VL-BART correlations   ·   full −0.62   ·   LoRA +0.83   ·   DoRA −0.31', 85, 597);
}
export const artifactBudget = (tenants, base, adapterMB) => ({
  merged: tenants * base,
  shared: base + (tenants * adapterMB) / 1000,
});
const requests = [
  { name: 'Policy', x: EXAMPLE.x, A: EXAMPLE.A, B: EXAMPLE.B, scale: 2 },
  { name: 'Science', x: [1, 2], A: [[0, 1]], B: [[-1], [1]], scale: 1 },
];
const weightT = EXAMPLE.W[0].map((_, i) => EXAMPLE.W.map((row) => row[i]));
export function projectBatch() {
  const base = matmul(requests.map(({ x }) => x), weightT);
  return requests.map((request, i) => {
    const { x, A, B, scale } = request;
    const correction = matvec(B, matvec(A, x)).map((v) => scale * v);
    const output = base[i].map((v, j) => v + correction[j]);
    return { ...request, base: base[i], correction, output };
  });
}
function batchedServing(d) {
  const { head, at, seen, line, arrow, box, label, mono, matrix, circle, path, fade } = d;
  const stack = at(3, 'heterogeneous adapters', 1);
  const base = at(3, 'the base product', 0.5);
  const adapt = at(3, 'and adapter i adds', 0.5);
  const result = at(3, 'B i transpose', 0.6);
  head('Two requests pass through one base product');
  const rows = projectBatch();
  label(stack === 1 ? 'Batch X' : 'Request rows', 75, 206);
  rows.forEach(({ name, x }, i) => {
    const y = lerp(i ? 417 : 265, i ? 369 : 313, stack);
    const col = i ? C.teal : C.red;
    box(76, y - 24, 200, 48, i ? C.mint : C.peach, col, 4);
    label(name, 87, y, col);
    mono(vec(x), 266, y, 21, C.ink, 'right');
  });
  if (stack === 1) {
    path([[76, 283], [67, 283], [67, 399], [76, 399]], C.ink, 2);
    path([[275, 283], [284, 283], [284, 399], [275, 399]], C.ink, 2);
    arrow(289, 341, 351, 341, C.blue);
  }
  box(359, 266, 196, 150, C.light, C.blue, 6);
  label('Base product', 457, 292, C.blue, 'center');
  mono('X ×', 375, 358, 25, C.blue);
  matrix(weightT, 452, 318, 39, C.blue);
  mono('W₀ᵀ', 491, 433, 19, C.blue, 'center');
  fade(base, () => {
    arrow(562, 341, 622, 341, C.blue);
    label('Base rows', 697, 262, C.blue, 'center');
    matrix(rows.map((row) => row.base), 644, 285, 56, C.blue);
  });
  rows.forEach(({ name, A, B, scale, correction, output }, i) => {
    const col = i ? C.teal : C.red;
    const lane = i ? 497 : 175, sum = i ? 420 : 270;
    fade(adapt, () => {
      const turn = i ? 127 : 216;
      line(turn, i ? 399 : 284, turn, lane, col, 3);
      arrow(turn, lane, 351, lane, col, 3);
      box(359, lane - 42, 477, 84, C.light, col, 6);
      label(name + ' adapter', 376, lane - 16, col);
      mono('s = ' + scale + '    A = ' + vec(A[0]) + '    Bᵀ = ' + vec(B.map(([v]) => v)), 376, lane + 18, 18);
      line(838, lane, 907, lane, col, 3);
      arrow(907, lane, 907, sum + (i ? 19 : -19), col, 3);
      arrow(764, i ? 369 : 313, 884, sum, C.blue, 3);
      circle(907, sum, 17, C.light, C.ink);
      mono('+', 907, sum, 27, C.ink, 'center');
    });
    fade(result, () => {
      mono(vec(correction), 818, lane - 16, 23, col, 'right');
      arrow(928, sum, 970, sum, C.ink, 3);
      label(name + ' output', 986, sum - 29, col);
      mono(vec(output), 986, sum + 4, 27);
    });
  });
  if (seen(3, 'and adapter i adds'))
    mono('Correction for row i = sᵢ (Xᵢ Aᵢᵀ) Bᵢᵀ', 359, 594, 23);
}
export function serving(d) {
  const { b, at, seen, head, slab, label, mono, box, line, arrow, fade } = d;
  if (b === 2) {
    const f = artifactBudget(50, 14, 128);
    if (seen(2, 'four of the next five requests')) {
      head('Which traffic could use a dedicated model?');
      label('Next five requests', 78, 168);
      for (let i = 0; i < 4; i++) {
        box(80 + i * 110, 234, 98, 62, C.peach, C.red, 5);
        label('Policy', 129 + i * 110, 265, C.red, 'center');
      }
      box(80, 398, 98, 62, C.mint, C.teal, 5);
      label('Science', 129, 429, C.teal, 'center');
      if (seen(2, 'a dedicated merged model')) {
        label('If this traffic pattern holds', 688, 168);
        arrow(519, 265, 668, 265, C.red);
        slab(684, 218, 431, 94, 'Dedicated policy model', 'Policy update merged into base', C.red);
      }
      if (seen(2, 'other adapters can keep sharing')) {
        arrow(186, 429, 668, 429, C.teal);
        slab(684, 382, 431, 94, 'Shared base', 'Load the requested adapter', C.teal);
      }
      return;
    }
    const shared = seen(2, 'Now keep one base');
    head('How much disk space do fifty tasks need?');
    label('Fifty merged checkpoints   ·   14 GB each', 79, 164, C.blue);
    for (let i = 0; i < 50; i++) {
      const x = i % 10,
        y = Math.floor(i / 10);
      box(80 + x * 43, 227 + y * 39, 36, 30, C.sky, C.blue, 3);
      if (shared) box(679 + x * 30, 305 + y * 24, 23, 17, C.peach, C.red, 2);
    }
    mono('50 × 14 = ' + (seen(2, 'seven hundred gigabytes') ? f.merged : '?') + ' GB', 77, 492, 29, C.blue);
    if (shared) {
      label('Fifty adapters   ·   128 MB each', 659, 164, C.red);
      slab(677, 200, 302, 77, 'One base', '14 GB', C.blue);
      mono('14 + 50 × 0.128 = ' + (seen(2, 'twenty point four gigabytes') ? num(f.shared) : '?') + ' GB', 656, 494, 23, C.red);
    }
    label('Disk footprint in decimal GB', 78, 572);
    if (seen(2, 'about thirty-four times'))
      mono('Merged copies use ' + num(f.merged / f.shared, 1) + '× as much disk space.', 78, 608, 25, C.ink);
    return;
  }
  if (b === 4) {
    head('One engine-managed page pool');
    label('S-LoRA   ·   noncontiguous device pages', 78, 161);
    const pages = ['KV', 'A₁', 'KV', 'B₂', '', 'A₂', 'KV', 'B₁', 'KV', '', 'KV', ''];
    pages.forEach((v, i) => {
      const pre = seen(4, 'prefetching') && i === 4,
        what = pre ? 'A₃' : v;
      const x = 83 + (i % 6) * 169,
        y = 225 + Math.floor(i / 6) * 107;
      box(
        x,
        y,
        147,
        81,
        what === 'KV' ? C.sky : what ? C.peach : C.light,
        what ? C.muted : C.grid,
        5,
      );
      mono(what || 'free', x + 72, y + 40, 25, C.ink, 'center');
    });
    label('Prefetch an upcoming adapter into a free page.', 84, 510, C.red);
    label('KV tensors and adapter weights share this pool.', 84, 565);
    return;
  }
  if (b === 3) return batchedServing(d);
  head('Which adapter belongs to this request?');
  for (let i = 0; i < 2; i++) {
    const y = 202 + i * 207,
      col = i ? C.teal : C.red;
    slab(63, y + 40, 192, 76, i ? 'Science tutor' : 'Policy review', 'request ' + (i + 1), C.ink);
    line(259, y + 77, 322, y + 77, C.ink, 3);
    line(322, y + 26, 322, y + 126, C.muted, 3);
    arrow(322, y + 26, 410, y + 26, C.blue);
    arrow(322, y + 126, 410, y + 126, col);
    slab(420, y - 10, 284, 75, 'Shared base', 'Xᵢ W₀ᵀ', C.blue);
    slab(420, y + 90, 284, 75, i ? 'Science factors' : 'Policy factors', 'sᵢ (Xᵢ Aᵢᵀ) Bᵢᵀ', col);
    arrow(711, y + 26, 827, y + 69, C.blue);
    arrow(711, y + 126, 827, y + 84, col);
    mono('+', 837, y + 77, 35);
    arrow(867, y + 77, 928, y + 77, C.ink);
    label('Output row ' + (i + 1), 943, y + 77);
  }
  label('Both requests share W₀. Each correction reads its own input row.', 68, 616);
}
export const rankRuns = [
  { r: 8, alpha: 16, n: [19, 19] },
  { r: 16, alpha: 32, n: [20, 18] },
];
export function compare(d) {
  const { head, label, box, mono, seen } = d;
  head('Which rank meets both held-out requirements?');
  label('Illustrative sweep   ·   same tokens, targets, scale and cases', 76, 157);
  const named = ['Policy', 'Routine'];
  rankRuns.forEach(({ r, n }, i) => {
    const x = 90 + i * 554;
    const verdictKnown = seen(3, i === 0 ? 'The routine row' : 'Inspect those missed replies');
    mono('r = ' + r, x, 230, 34, C.blue);
    for (let j = 0; j < 2; j++) {
      const y = 311 + j * 100,
        show = seen(2, i ? (j ? 'Its training loss' : 'and eighteen routine') : (j ? 'Rank sixteen gets' : 'and nineteen routine'));
      label(named[j], x, y);
      for (let k = 0; k < 20; k++)
        box(
          x + k * 22,
          y + 26,
          17,
          26,
          show ? (k < n[j] ? C.mint : C.peach) : C.light,
          show ? (k < n[j] ? C.teal : C.red) : C.grid,
          2,
        );
      if (show) {
        const verdictColor = n[j] < 19 ? C.red : C.teal;
        mono(n[j] + '/20', x + 311, y, 24, verdictKnown ? verdictColor : C.ink);
      }
    }
    if (verdictKnown) {
      const pass = n.every((v) => v >= 19);
      label(
        pass ? 'Keep this candidate' : 'Routine set below threshold',
        x,
        556,
        pass ? C.teal : C.red,
      );
    }
  });
  label('Release minimum   19 / 20 in each set', 78, 604);
}
function rankWorksheet({ b, head, seen, box, txt, mono, label }) {
  const first = seen(2, 'rank eight');
  const second = seen(2, 'rank sixteen');
  head(b === 1 ? 'Choose one controlled comparison' : 'What changes between these two runs?');
  const cards = [
    ['Rank', rankRuns.map((run) => run.r)],
    ['Learning rate', ['0.0001', '0.0002']],
    ['Dropout', ['0', '0.05']],
    ['Target layers', ['Q + V', 'All linear']],
  ];
  for (const [i, [name, values]] of cards.entries()) {
    const x = 73 + (i % 2) * 545;
    const y = 144 + Math.floor(i / 2) * 150;
    box(x, y, 502, 126, C.light, C.grid, 5);
    txt(name, x + 20, y + 30, 24, C.ink);
    if (i > 0 && first) label('Fixed', x + 474, y + 30, C.teal, 'right');
    values.forEach((value, j) => {
      const selected = j === 0 ? first : i === 0 && second;
      const edge = i === 0 ? C.blue : C.teal;
      const left = x + 18 + j * 231;
      box(left, y + 58, 218, 49, selected ? (i === 0 ? C.sky : C.mint) : C.paper,
        selected ? edge : C.grid, 5);
      const text = i === 0 && selected ? `Run ${j + 1}   ·   ${value}` : String(value);
      mono(text, left + 109, y + 83, 22, selected ? edge : C.muted, 'center');
    });
  }
  if (b === 1) {
    label('Choose the baseline settings before running the comparison.', 75, 520);
    return;
  }
  if (seen(2, 'multiplier at two')) {
    const scale = multiplier([rankRuns[0].r, rankRuns[0].alpha], false);
    label('Ordinary LoRA', 76, 481);
    mono('α / r = ' + scale, 76, 522, 28, C.blue);
    rankRuns.forEach(({ r, alpha }, i) => {
      if (seen(2, i === 0 ? 'alpha of sixteen' : 'thirty-two')) {
        const x = 425 + i * 352;
        label('Run ' + (i + 1), x, 481);
        mono(`${alpha} / ${r} = ${multiplier([r, alpha], false)}`, x, 522, 28, C.blue);
      }
    });
  }
  if (seen(2, 'same training examples'))
    label('Both runs   ·   same examples   ·   same supervised tokens per step   ·   same held-out tickets', 76, 591);
}

export const formatProbe = {
  replies: ['routine', 'routine'],
  spans: ['{"queue":', '"routine"', '}'],
  originalMask: [false, true, false],
  revisedMask: [true, true, true],
};

function replyDiagnosis({ head, seen, box, txt, label, mono, line }) {
  head('What would you check after a missed reply?');
  const cost = seen(5, 'Record validation loss');
  const card = (x, name, a, b, active) => {
    const color = active ? C.blue : C.muted;
    box(x, 137, 516, 119, C.light, active ? C.blue : C.grid, 5);
    if (active) box(x, 137, 7, 119, C.blue, null, 2);
    txt(name, x + 22, 165, 23, color);
    label(a, x + 22, 205);
    label(b, x + 22, 233);
  };
  const slow = seen(5, 'For a slow reply');
  card(74, 'Held-out replies', 'Policy and routine tickets', 'Mark false refusals in each set',
    !cost || (seen(5, 'Try a format check') && !slow));
  card(610, 'Run measurements', 'Validation loss and peak training memory', 'Request latency at serving time',
    cost && (!seen(5, 'Try a format check') || slow));
  if (!seen(5, 'Try a format check')) return;

  label('Routine ticket   ·   format check', 78, 299);
  if (seen(5, 'Both ranks reply')) {
    rankRuns.forEach(({ r }, i) => {
      const y = 359 + i * 58;
      label('Rank ' + r, 78, y);
      mono(formatProbe.replies[i], 181, y, 26, C.blue);
    });
  }
  if (seen(5, 'caller expects')) {
    label('Required', 78, 485);
    mono(formatProbe.spans.join(''), 181, 485, 24);
  }
  if (seen(5, 'Which parts')) {
    line(554, 295, 554, 520, C.grid);
    const revised = seen(5, 'Include the field name');
    const known = seen(5, 'only the value counts');
    const mask = revised ? formatProbe.revisedMask : formatProbe.originalMask;
    label(revised ? 'Proposed loss mask' : 'Which answer spans receive loss?', 591, 299);
    let x = 591;
    formatProbe.spans.forEach((span, i) => {
      const w = [180, 199, 90][i];
      const active = known && mask[i];
      box(x, 340, w, 65, active ? C.mint : C.light, active ? C.teal : C.grid, 4);
      mono(span, x + w / 2, 373, 23, active ? C.teal : C.ink, 'center');
      txt(known ? (active ? 'Supervised' : 'Masked') : '?', x + w / 2, 436, 19,
        active ? C.teal : C.muted, 'center');
      x += w + 8;
    });
    if (seen(5, 'and retest')) label('Retest the same reply format.', 591, 485, C.teal);
  }
  let next;
  if (slow) next = 'Slow reply   →   trace adapter loading and execution on the serving device.';
  else if (seen(5, 'For a missing new token'))
    next = 'Missing token   →   inspect its input and output rows. Q + V leaves both frozen.';
  else if (seen(5, 'For a missed fact'))
    next = 'Missed fact   →   inspect the rule supplied with the ticket.';
  if (next) {
    line(76, 543, 1120, 543);
    label(next, 77, 586);
  }
}

export function diagnosis(d) {
  const { b, head, slab, label, line, path, grid } = d;
  if (b <= 2) return rankWorksheet(d);
  if (b === 5) return replyDiagnosis(d);
  head('Choose one controlled comparison');
  const flat = b === 3;
  label('Schematic loss', 80, 164);
  grid(82, 203, 441, 268, 44);
  line(83, 471, 536, 471, C.muted);
  label('Training steps →', 82, 511);
  const points = (fn) =>
    Array.from({ length: 41 }, (_, i) => [90 + i * 10.5, 453 - fn(i / 40) * 230]);
  path(
    points((t) => (flat ? 0.62 : 0.88 - 0.66 * Math.sqrt(t))),
    C.blue,
    4,
  );
  label('Training', 78, 571, C.blue);
  path(
    points((t) => (flat ? 0.69 : 0.82 - 0.4 * t + 0.52 * t * t)),
    C.red,
    4,
  );
  label('Validation', 212, 571, C.red);
  const rows = flat
    ? [
        ['Flat training loss', 'Check format and supervised mask'],
        ['Policy misses persist', 'Inspect matched modules and gradients'],
      ]
    : b === 4
      ? [
          ['Training loss falls', 'Check the examples the model fitted'],
          ['Validation turns upward', 'Audit data coverage and regularization'],
        ]
      : [
          ['Single-adapter latency', 'Compare a supported merge'],
          ['Broad adaptation need', 'Compare full tuning on the same cases'],
        ];
  rows.forEach(([name, sub], i) =>
    slab(591, 215 + i * 139, 522, 101, name, sub, i ? C.red : C.blue),
  );
}
