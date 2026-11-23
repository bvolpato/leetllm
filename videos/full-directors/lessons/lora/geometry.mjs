import { C, num, vec, count, lerp } from './bench.mjs';
import { EXAMPLE, FACTORS } from '../../../films/lora/fixtures.mjs';
import { matvec, matmul } from '../../../films/lora/arithmetic.mjs';
import { forward } from '../../../films/lora/model.mjs';

export function paths(d) {
  const { at, seen, key, slab, line, circle, txt, label, head, fade, arrow } = d;
  head('One request passes through two weight paths');
  key(114, 335, 'P04', 92);
  arrow(237, 335, 368, 335, C.blue);
  line(368, 335, 368, 215, C.blue, 4);
  arrow(368, 215, 462, 215, C.blue);
  slab(470, 164, 282, 99, 'Frozen projection', 'W₀ × input', C.blue);
  arrow(757, 215, 926, 215, C.blue);
  line(926, 215, 926, 318, C.blue, 4);
  circle(926, 338, 23, C.light, C.ink);
  txt('+', 926, 338, 32, C.ink, 'center');
  arrow(950, 338, 1090, 338, C.ink);
  label('output', 1025, 308);
  fade(at(2, 'two small trainable matrices'), () => {
    const active = seen(3, 'select the policy pair');
    ['code review', 'policy', 'science tutor'].forEach((name, i) => {
      const x = 400 + i * 207,
        col = i === 1 && active ? C.red : C.muted;
      slab(x, 470, 188, 77, name, 'A  →  B', col);
    });
    if (active) {
      line(368, 335, 368, 429, C.red, 4);
      line(368, 429, 700, 429, C.red, 4);
      arrow(700, 429, 700, 466, C.red);
      line(797, 507, 805, 507, C.red, 4);
      line(805, 507, 805, 364, C.red, 4);
      arrow(805, 364, 901, 344, C.red);
    }
  });
}
const columnW = [
  [1, 1.5],
  [1.5, -0.5],
];
export function columns(d) {
  const { head, grid, line, arrow, matrix, at, seen, label, mono } = d;
  head('How much of each column enters the output?');
  grid(72, 146, 536, 400, 40);
  const X = (x) => 146 + x * 115,
    Y = (y) => 482 - y * 115;
  line(X(0), 178, X(0), 537, C.muted);
  line(73, Y(0), 605, Y(0), C.muted);
  const cx = 1 + 0.5 * at(2, 'stretches the blue column'),
    cy = at(2, 'Add the second column');
  const u = [cx, 1.5 * cx],
    v = matvec(columnW, [cx, cy]);
  arrow(X(0), Y(0), X(u[0]), Y(u[1]), C.blue, 6);
  arrow(X(u[0]), Y(u[1]), X(v[0]), Y(v[1]), C.teal, 6);
  if (cy === 1) {
    arrow(X(0), Y(0), X(v[0]), Y(v[1]), C.red, 4);
    mono('Output = ' + vec(v), 85, 585, 25, C.red);
  }
  label('Weight columns', 695, 170);
  matrix(columnW, 696, 208, 72);
  label('Input', 942, 170);
  matrix([[1.5], [1]], 944, 208, 72, C.teal);
  mono('x₁ w₁ + x₂ w₂', 695, 432, 29);
  if (seen(3, 'every entry')) label('Full tuning can change all four weights', 695, 495, C.red);
}
export function additive(d) {
  const { head, matrix, arrow, mono, label, at, fade, seen } = d;
  const f = forward(2);
  head('Two contributions to the same output');
  label('Same input on both paths', 70, 161);
  matrix([[2], [1]], 104, 253, 64, C.ink);
  arrow(190, 287, 306, 211, C.blue);
  arrow(190, 345, 306, 444, C.red);
  label('Frozen W₀', 330, 135, C.blue);
  matrix(EXAMPLE.W, 326, 165, 49);
  label('Correction ΔW', 330, 373, C.red);
  matrix(f.update, 326, 405, 49, C.red);
  mono('× x', 463, 219);
  mono('× x', 463, 456);
  arrow(534, 216, 640, 216, C.blue);
  arrow(534, 453, 640, 453, C.red);
  mono(vec(f.base), 659, 218, 33, C.blue);
  if (seen(1, 'correction to the very same input')) mono(vec(f.correction), 659, 453, 33, C.red);
  arrow(800, 221, 913, 313, C.blue);
  arrow(800, 451, 913, 349, C.red);
  mono('+', 917, 330, 37);
  if (seen(1, 'adds their outputs')) mono(vec(f.output), 974, 328, 36, C.teal);
  fade(at(3, 'negative of the first'), () =>
    mono('ΔW columns    [1, 2]    and    −[1, 2]', 315, 574, 25, C.red),
  );
}
export function widthTrial(width, x) {
  const A =
    width === 1
      ? [[1, 0]]
      : [
          [1, 0],
          [0, 1],
        ];
  const B =
    width === 1
      ? [[1], [0]]
      : [
          [1, 0],
          [0, 1],
        ];
  return matvec(B, matvec(A, x));
}
export function dimension(d) {
  const { b, at, seen, head, arrow, dial, mono, label, line, circle, grid, txt } = d;
  if (b <= 2) {
    head('One adjustable number');
    const theta = at(1, 'Turn the dial', 1.3);
    dial(260, 337, 93, theta, 'Optimization coordinate', 'θ = ' + num(theta, 2));
    mono('ΔW = θ I₃', 260, 537, 31, C.ink, 'center');
    const x = 783,
      y = 359,
      axes = [
        [253, 65],
        [-173, 120],
        [0, -192],
      ];
    for (let i = 0; i < 3; i++) {
      const [dx, dy] = axes[i],
        col = [C.blue, C.teal, C.red][i];
      line(x - 0.16 * dx, y - 0.16 * dy, x + dx * 1.06, y + dy * 1.06, C.grid, 3);
      arrow(x, y, x + dx * theta, y + dy * theta, col, 7);
      mono('e' + ['₁', '₂', '₃'][i], x + 1.18 * dx, y + 1.18 * dy, 25, col, 'center');
    }
    circle(x, y, 6, C.ink);
    if (seen(2, 'Three directions'))
      txt('Three independent outputs   ·   rank 3', 800, 570, 29, C.ink, 'center');
    return;
  }
  const held = b >= 4,
    k = held ? 2 : 1;
  head(held ? 'Test both widths on larger inputs' : 'Fit horizontal and vertical corrections');
  const two = seen(3, 'second independent direction');
  [1, 2].forEach((width, i) => {
    const x = 185 + i * 570,
      y = 429,
      scale = 76;
    label('Factor width ' + width, x - 66, 167, width === 1 ? C.blue : C.teal);
    grid(x - 72, y - 204, 352, 266, 38);
    line(x - 50, y, x + 250, y, C.muted);
    line(x, y + 44, x, y - 199, C.muted);
    [
      [k, 0],
      [0, k],
    ].forEach((v, j) => {
      const col = j ? C.red : C.blue,
        end = widthTrial(width, v);
      circle(x + scale * v[0], y - scale * v[1], 12, null, col, 3);
      const answer = held
        ? seen(5, width === 1 ? (j ? 'vertical input maps' : 'horizontal arrow reaches') : 'second direction reaches')
        : width === 1 || j === 0 || two;
      if (answer) {
        arrow(x, y, x + scale * end[0], y - scale * end[1], col, 5);
        if (end.every((n) => !n)) circle(x, y, 7, col);
      }
    });
    if (held && seen(5, width === 1 ? 'Try width two' : 'Choose width two')) {
      const hits = [
        [k, 0],
        [0, k],
      ].filter((v) => widthTrial(width, v).every((z, j) => z === v[j])).length;
      mono(hits + ' / 2 exact', x - 52, 542, 33, hits === 2 ? C.teal : C.red);
    }
  });
  label(
    held ? 'Held-out inputs  [2, 0]  and  [0, 2]' : 'Training inputs  [1, 0]  and  [0, 1]',
    72,
    606,
  );
  label('Open rings = requested outputs', 780, 606);
}
export function direction(d) {
  const { head, b, at, grid, line, arrow, circle, mono, label, matrix } = d;
  head('One measurement sets the length and sign');
  const t = at(2, 'As the input moves', 2);
  const x = [2 - 2 * t, 1],
    z = x[0] - x[1],
    v = [z, 2 * z];
  grid(85, 160, 558, 390, 39);
  const X = (n) => 358 + n * 76,
    Y = (n) => 355 - n * 76;
  line(X(-1.2), Y(-2.4), X(1.2), Y(2.4), C.grid, 6);
  line(110, Y(0), 615, Y(0), C.muted);
  line(X(0), 176, X(0), 532, C.muted);
  arrow(X(0), Y(0), X(v[0]), Y(v[1]), C.red, 7);
  if (z === 0) circle(X(0), Y(0), 5, C.red);
  mono('Correction = ' + vec(v), 85, 585, 25, C.red);
  label('Input and measurement', 698, 171);
  mono('x = ' + vec(x), 698, 226, 29, C.blue);
  mono('Ax = ' + num(x[0]) + ' − 1 = ' + num(z), 698, 289, 27);
  mono('b = [1, 2]', 698, 357, 25, C.red);
  if (b === 3) {
    label('Outer product   b [1, −1]', 700, 435);
    matrix(
      [
        [1, -1],
        [2, -2],
      ],
      735,
      467,
      48,
      C.red,
    );
  }
}
export function plane(d) {
  const { head, arrow, line, path, circle, mono, label, txt, at, b } = d;
  head('Two independent directions span a plane');
  const target = [0.3, 0.4, 1];
  const turn = at(3, 'rotate its plane', 1.8),
    theta = turn * Math.atan2(target[2], target[1]),
    cs = Math.cos(theta),
    sn = Math.sin(theta);
  const X = (a, z) => 385 + 143 * a - 78 * z * cs,
    Y = (a, z) => 391 + 29 * a + 54 * z * cs - 161 * z * sn;
  path(
    [
      [-1.3, -1.3],
      [1.5, -1.3],
      [1.5, 1.3],
      [-1.3, 1.3],
    ].map(([a, z]) => [X(a, z), Y(a, z)]),
    C.teal,
    2,
    C.mint,
    true,
  );
  for (let k = -1; k <= 1; k += 0.5) {
    line(X(k, -1.3), Y(k, -1.3), X(k, 1.3), Y(k, 1.3), C.grid);
    line(X(-1.3, k), Y(-1.3, k), X(1.5, k), Y(1.5, k), C.grid);
  }
  const a = 1,
    z = at(1, 'second independent direction') * (1 - 1.8 * at(2, 'move head to tail', 1.7));
  arrow(X(0, 0), Y(0, 0), X(a, 0), Y(a, 0), C.blue, 7);
  arrow(X(a, 0), Y(a, 0), X(a, z), Y(a, z), C.red, 7);
  circle(X(a, z), Y(a, z), 7, C.ink);
  if (b >= 2) {
    const [tx, ty, tz] = target;
    const xx = 385 + 143 * tx - 78 * ty,
      yy = 391 + 29 * tx + 54 * ty - 161 * tz;
    // Project the target onto the current second basis vector to draw the remaining gap.
    const along = ty * cs + tz * sn;
    line(X(tx, along), Y(tx, along), xx, yy, C.muted);
    line(xx + 55, 168, xx, yy, C.red, 2.5);
    circle(xx, yy, 10, C.light, C.red, 3);
    let targetLabel = 'Can the tip reach this ring?';
    if (b === 3) targetLabel = 'Target outside this plane';
    if (turn === 1) targetLabel = 'Target in rotated plane';
    txt(targetLabel, xx + 40, 147, 28, C.red, 'left', 'Sans', 600);
  }
  label('Output coordinates', 745, 220);
  mono('b₁ = [1, 0, 0]', 745, 276, 26, C.blue);
  mono('b₂ = ' + vec([0, cs, sn]), 745, 333, 26, C.red);
  mono('Δh = ' + vec([a, z * cs, z * sn]), 745, 430, 27, C.teal);
  if (b === 3) label('Factor width 2   ·   rank at most 2', 737, 533);
}
export function product(d) {
  const { head, b, seen, matrix, mono, label } = d;
  head('Which two numbers meet in one cell?');
  const { A, B } = FACTORS,
    P = matmul(B, A),
    pick = b >= 2;
  label('Output directions   B', 105, 175, C.red);
  matrix(B, 126, 215, 61, C.red, (i) => pick && i === 0);
  mono('×', 339, 306, 45);
  label('Input measurements   A', 436, 175, C.blue);
  matrix(A, 440, 248, 61, C.blue, (_, j) => pick && j === 2);
  mono('=', 707, 306, 45);
  label('Product   BA', 857, 175);
  const full = seen(3, 'entire correction'),
    cell = seen(3, 'Minus one and a half');
  matrix(
    P.map((r, i) => r.map((v, j) => (full || (cell && i === 0 && j === 2) ? v : null))),
    847,
    216,
    61,
    C.ink,
    (i, j) => pick && i === 0 && j === 2,
  );
  if (pick)
    mono(
      'row 1 · column 3      1 × (−1) + (−0.5) × 1  =  ' + (cell ? num(P[0][2]) : '?'),
      110,
      515,
      27,
      C.red,
    );
}
export function outputs(d) {
  const { head, b, clock, at, mono, label, line, circle, arrow } = d;
  // Finish the construction on the last word of the spoken result.
  const clause = (beat, phrase) => {
    if (b !== beat) return Number(b > beat);
    const { start, end } = clock.wordCue(phrase);
    if (clock.elapsed >= end) return 1;
    return Math.max(0, (clock.elapsed - start) / (end - start));
  };
  const inputMove = at(4, 'Change the first input from two to one', 1.2);
  const replay = inputMove > 0;
  const x = [lerp(EXAMPLE.x[0], EXAMPLE.x[1], inputMove), EXAMPLE.x[1]];
  const scale = 2;
  const f = forward(scale, x);
  const [a1, a2] = EXAMPLE.A[0];
  const measurement = replay
    ? clause(5, 'One minus one is zero')
    : clause(2, 'Two minus one leaves one');
  if (b === 5) clock.reveal('zero', 0, { captionStart: 'zero' });
  const firstTerm = at(2, 'A subtracts the second coordinate from the first', 0.8);
  const expanded = replay
    ? clause(5, 'B has nothing to expand') === 1
    : clause(2, 'the whole amount to the second') === 1;
  const corrected = replay
    ? expanded
    : clause(2, 'the correction is one and two') === 1;

  head(
    replay ? 'How does the same adapter handle a new input?' : 'Follow one measurement to both outputs',
  );
  label('Layer input', 64, 150);
  mono('x = ' + vec(x), 64, 193, 36);
  line(421, 144, 421, 525, C.grid);
  mono('A = ' + vec(EXAMPLE.A[0]), 64, 259, 25);
  const origin = 150, unit = 107;
  const firstEnd = origin + unit * a1 * x[0];
  const secondEnd = firstEnd + unit * a2 * x[1] * measurement;
  for (let i = 0; i <= 2; i++) {
    const tick = origin + unit * i;
    mono(i, tick, 291, 18, C.muted, 'center');
    line(tick, 302, tick, 392, i === 0 ? C.muted : C.grid, 1.5);
  }
  for (const y of [315, 374]) line(origin - 10, y, 385, y, C.grid, 2);
  mono('+x₁', 65, 315, 23);
  mono('−x₂', 65, 374, 23);
  arrow(origin, 315, lerp(origin, firstEnd, firstTerm), 315, C.brass, 6);
  if (firstTerm === 1 && measurement > 0) {
    line(firstEnd, 321, firstEnd, 369, C.brass, 2);
    arrow(firstEnd, 374, secondEnd, 374, C.brass, 6);
  }
  if (measurement === 1) circle(secondEnd, 374, 6, C.ink);
  mono('Ax = ' + (measurement === 1 ? num(f.intermediate[0]) : '?'), 64, 424, 31);
  if (b >= 2) {
    mono('B = ' + vec(EXAMPLE.B.map(([v]) => v)) + 'ᵀ', 64, 474, 23);
    mono('s = ' + scale, 307, 474, 23);
  }
  if (expanded) mono('B(Ax) = ' + vec(matvec(EXAMPLE.B, f.intermediate)), 64, 523, 28);
  if (corrected) mono('sB(Ax) = ' + vec(f.correction), 64, 569, 28);

  circle(469, 127, 7, C.blue);
  label('Frozen base', 485, 127, C.blue);
  if ((!replay && b >= 3) || (replay && corrected)) {
    circle(627, 127, 9, null, C.teal, 2.5);
    label('Adapted output', 645, 127, C.teal);
  }
  f.base.forEach((base, i) => {
    const y = 245 + 172 * i,
      X = (t) => 462 + 53 * t;
    label('Output ' + (i + 1) + '   ·   W₀ row ' + vec(EXAMPLE.W[i]), 459, y - 73, C.blue);
    line(X(0), y, X(12.4), y, C.grid, 3);
    for (let t = 0; t <= 12; t += 2) {
      line(X(t), y - 7, X(t), y + 8, C.muted);
      mono(t, X(t), y + 27, 19, C.muted, 'center');
    }
    const baseShown = clause(1, i ? 'gives ten' : 'gives four') === 1;
    const added = replay ? 0 : clause(3, i ? 'Ten becomes twelve' : 'Four becomes five');
    const outputShown = replay ? corrected : added === 1;
    if (added > 0) arrow(X(base), y, X(base + added * f.correction[i]), y, C.brass, 7);
    if (baseShown) {
      circle(X(base), y, 9, C.blue);
      if (Number.isInteger(base) && (inputMove === 0 || inputMove === 1))
        mono(num(base), X(base), y - 31, 25, C.blue, 'center');
    }
    if (outputShown) {
      const end = X(f.output[i]);
      circle(end, y, 13, null, C.teal, 3);
      if (!replay) mono(num(f.output[i]), end, y + 62, 25, C.teal, 'center');
    }
  });
  if (replay && corrected) label('The output rings land on the base marks', 459, 513, C.teal);
  const outputReady = replay
    ? clause(5, 'The adapted output stays at three, seven') === 1
    : clause(3, 'Ten becomes twelve') === 1;
  if (outputReady) mono('h = ' + vec(f.output), 459, 569, 34, C.teal);
}
export function rectangles(d) {
  const { b, head, box, line, mono, label, seen } = d;
  const small = b === 3,
    inp = small ? 15 : 4096,
    out = small ? 10 : 4096,
    r = small ? 3 : 16,
    cell = small ? 19 : 0.075;
  const w = inp * cell,
    h = out * cell;
  head('Count the weights in both thin rectangles');
  const x = 83,
    y = 203;
  box(x, y, w, h, C.sky, C.blue);
  for (let i = 1; i < (small ? inp : 16); i++)
    line(
      x + (w * i) / (small ? inp : 16),
      y,
      x + (w * i) / (small ? inp : 16),
      y + h,
      C.blue,
      0.65,
    );
  for (let i = 1; i < (small ? out : 16); i++)
    line(
      x,
      y + (h * i) / (small ? out : 16),
      x + w,
      y + (h * i) / (small ? out : 16),
      C.blue,
      0.65,
    );
  label('Frozen matrix', x, 158, C.blue);
  mono(out + ' × ' + inp, x, y + h + 39, 26, C.blue);
  if (b >= 2) {
    const H = small ? r * cell : 22;
    label(
      small ? 'Two trainable factors' : 'Enlarged thickness of rank-16 factors',
      546,
      161,
      C.red,
    );
    const aCount = r * inp, bCount = out * r;
    const aShown = small ? seen(3, 'and B stores') : seen(2, 'trainable values altogether');
    const bShown = small ? seen(3, 'That makes') : aShown;
    box(548, y, H, h, C.peach, C.red);
    box(646, y, w, H, C.peach, C.red);
    mono('A   ' + r + ' × ' + inp + (aShown ? ' = ' + count(aCount) : ''), 646, y + H + 32, 24, C.red);
    mono('B   ' + out + ' × ' + r + (bShown ? ' = ' + count(bCount) : ''), 646, y + h - 38, 24, C.red);
    const n = aCount + bCount;
    if (small ? seen(3, 'half the one') : seen(2, 'The inset'))
      mono(
        count(n) + ' / ' + count(inp * out) + '  =  ' + num((100 * n) / (inp * out), 2) + '%',
        548,
        588,
        25,
        C.teal,
      );
  } else mono(count(inp * out) + ' weights', 542, 340, 35, C.blue);
}
