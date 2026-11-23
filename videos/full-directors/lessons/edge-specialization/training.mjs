import { C, at, base, box, line, dot, txt, mono, serif, note, form, fmt } from './bench.mjs';
import { train, gradient, gradientStep, parts, signals, sum, alpha, beta } from './examples.mjs';
export function training(ctx, c) {
  const i = c.beat.id;
  const t = i === 'votes' ? 1 : i === 'learn' ? 3 : 1 + 2 * c.reveal('Raise the temperature', 2.5);
  const n = i === 'learn' ? Math.floor(60 * c.reveal('Train the student', 4)) : 0;
  const state = train(n, t);
  base(ctx, 'What does the runner-up teach?', 'TRAINING BENCH');
  txt(ctx, 'One context  ·  aligned actions', 46, 115, 21);
  box(ctx, 50, 159, 21, 14, C.green, 2);
  txt(ctx, 'Teacher', 81, 166, 19);
  box(ctx, 185, 159, 21, 14, C.plum, 2);
  txt(ctx, 'Student', 216, 166, 19);
  mono(ctx, 'T = ' + t.toFixed(1) + '     Updates ' + n, 908, 166, 19, C.ink, 'right');
  const zero = 378,
    maxHeight = 153;
  [0, 0.5, 1].forEach((v) => {
    const y = zero - maxHeight * v;
    line(
      ctx,
      [
        [97, y],
        [904, y],
      ],
      C.grid,
      1,
    );
    mono(ctx, fmt(v), 78, y, 15, C.muted, 'right');
  });
  ['Lookup', 'Explain', 'Review'].forEach((name, j) => {
    const x = 151 + 274 * j;
    [state.teacher[j], state.student[j]].forEach((v, k) => {
      const y = zero - maxHeight * v,
        bx = x + 65 * k;
      box(ctx, bx, y, 55, zero - y, k ? C.plum : C.green, 2);
      mono(ctx, v.toFixed(2), bx + 27, y - 15, 16, k ? C.plum : C.green, 'center');
    });
    serif(ctx, name, x + 59, 410, 26, C.ink, 'center');
  });
  note(ctx, 'Forward KL  ' + state.loss.toFixed(4) + '     ·     Fixed teacher logits [4, 2, 1]');
}

export function objective(ctx, c) {
  const i = c.beat.id;
  if (i === 'loss' || i === 'sum') return objectiveSum(ctx, c);
  const g = gradientStep(gradient);
  base(ctx, 'Which way does the student logit move?', 'ONE ALIGNED EVENT');
  txt(ctx, 'Forward KL   ·   T = 2   ·   learning rate = 0.1', 46, 122, 21);
  const x = 124,
    w = 698,
    y = 244;
  for (let j = 0; j <= 10; j++) {
    const a = x + (w * j) / 10;
    line(
      ctx,
      [
        [a, y - 7],
        [a, y + 9],
      ],
      C.muted,
      1.5,
    );
    if (j % 2 === 0) mono(ctx, (j / 10).toFixed(1), a, y + 27, 15, C.muted, 'center');
  }
  line(
    ctx,
    [
      [x, y],
      [x + w, y],
    ],
    C.ink,
    2,
  );
  for (const [name, v, color] of [
    ['Student', gradient.q, C.plum],
    ['Teacher', gradient.p, C.green],
  ]) {
    dot(ctx, x + w * v, y, 9, color);
    txt(ctx, name + '  ' + v, x + w * v, y - 42, 21, color, { align: 'center', weight: 600 });
  }
  const raw = i === 'step' && at(c, 'minus one quarter');
  const scaled = i === 'step' && at(c, 'scaled derivative is minus one');
  const delta = i === 'step' && at(c, 'rises by one tenth');
  const rows = [
    ['Raw derivative', '(0.2 − 0.7) / 2', raw, g.raw],
    ['Scale by T²', '4 × derivative', scaled, g.scaled],
    ['Logit change', '−0.1 × scaled', delta, g.delta],
  ];
  rows.forEach(([name, eq, ready, value], j) => {
    const a = 47 + j * 300;
    line(
      ctx,
      [
        [a, 311],
        [a + 262, 311],
      ],
      C.metal,
      1,
    );
    txt(ctx, name, a, 337, 20, C.muted);
    mono(ctx, eq, a, 377, 20);
    if (ready)
      serif(ctx, (value > 0 ? '+' : '') + fmt(value), a, 422, 30, value > 0 ? C.green : C.plum);
  });
  note(
    ctx,
    delta
      ? 'Subtracting a negative gradient increases the logit.'
      : 'Compare the probabilities at the same positive temperature.',
  );
}
function objectiveSum(ctx, c) {
  const result = c.beat.id === 'sum';
  const cues = ['contributes point two', 'contributes point one two', 'add point zero two'];
  const total = result && at(c, 'loss of point three four');
  base(ctx, 'How much does each training signal contribute?', 'LOSS WORKSHEET');
  txt(
    ctx,
    'α = ' + alpha + '      β = ' + beta + '      Soft loss already includes T²',
    46,
    120,
    21,
  );
  const xs = [59, 318, 499, 730];
  ['Signal', 'Loss', 'Weight', 'Contribution'].forEach((t, j) =>
    txt(ctx, t, xs[j], 179, 19, C.muted),
  );
  signals.forEach((s, i) => {
    const y = 239 + i * 76;
    line(
      ctx,
      [
        [47, y - 36],
        [916, y - 36],
      ],
      C.grid,
      1,
    );
    txt(ctx, s.name, 59, y, 23);
    mono(ctx, fmt(s.value), 318, y, 23);
    mono(ctx, ['1 − α', 'α', 'β'][i] + ' = ' + fmt(s.weight), 499, y, 21);
    if (result && at(c, cues[i])) mono(ctx, fmt(parts[i]), 730, y, 23, C.green);
  });
  note(
    ctx,
    total
      ? 'Weighted loss   ' + parts.map(fmt).join(' + ') + ' = ' + fmt(sum(parts))
      : 'Multiply each loss by its own weight, then add.',
  );
}
