import { assertEqual, dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { adam } from '../../../films/deep-dive-deepspeed/arithmetic.mjs';

export default function reduce(s, c) {
  const [inputs, branches, answer, recipe] = area
    .inset('normal')
    .rows([1.2, 3.2, 1, 0.65], 'normal');
  const pairs = [
    [1, 3],
    [1, -1],
  ];
  const histories = pairs.map(([a, b]) => {
    const mean = (a + b) / 2;
    const meanSquares = (a ** 2 + b ** 2) / 2;
    return {
      mean,
      square: mean ** 2,
      meanSquares,
      next: adam([1, 0, 0], mean, 1),
      localV: (adam([1, 0, 0], a, 1)[2] + adam([1, 0, 0], b, 1)[2]) / 2,
    };
  });
  assertEqual(histories[0].square, 4, 'square of the reduced gradient');
  assertEqual(histories[0].meanSquares, 5, 'local squares averaged');
  assertEqual(histories[1].next[2], 0, 'cancellation leaves the second moment zero');
  assertEqual(histories[1].localV, 0.001, 'local squares retain a false second moment');

  const which = s.value(0),
    phase = s.value(0);
  const ranks = inputs.columns(2, 'wide');
  const forks = branches.columns(2, 'loose').map((box) => box.rows([0.8, 1, 1, 1], 'tight'));
  const stageNames = ['Reduce at the owner, then square', 'Square on each rank, then reduce'];
  s.add(
    heading(c.title),
    place(
      note(
        'First Adam step   ·   W = 1   ·   m = v = 0   ·   β₁ = 0.9   ·   β₂ = 0.999   ·   lr = 0.01   ·   ε = 10⁻⁸',
        { size: 32 },
      ),
      recipe,
    ),
    ranks.map((r, rank) => [
      place(rect(r.width - 180, 88, { fill: 'surface', stroke: 'cyan', width: 3 }), r),
      dynamic(() =>
        mono('R' + rank + ' gradient   ' + pairs[which.value][rank], {
          size: 47,
          color: 'cyan',
        }).moveTo(r.point('center')),
      ),
    ]),
    forks.map(([name], i) => place(label(stageNames[i], { size: 41 }), name)),
  );
  s.add(
    dynamic(() => {
      const [a, b] = pairs[which.value];
      const { mean, square, meanSquares, next, localV } = histories[which.value];
      const fmt = (v) => (v === 0 ? '0' : v.toFixed(3));
      const f = phase.value;
      const work = [];
      const write = (side, row, words, color) =>
        work.push(mono(words, { size: 39, color }).moveTo(forks[side][row].point('center')));
      if (f >= 1)
        write(0, 1, '(' + a + ' + ' + (b < 0 ? '(' + b + ')' : b) + ') / 2 = ' + mean, 'cyan');
      if (f >= 2) write(0, 2, mean + '² = ' + square, 'cyan');
      if (f >= 3 && (!which.value || f >= 5)) {
        write(1, 1, 'local squares    ' + a ** 2 + '    ' + b ** 2, 'pink');
        write(1, 2, '(' + a ** 2 + ' + ' + b ** 2 + ') / 2 = ' + meanSquares, 'pink');
      }
      if (f >= 4) {
        write(0, 3, 'v = 0.001 × ' + square + ' = ' + fmt(next[2]), 'cyan');
        if (!which.value || f >= 5)
          write(1, 3, 'v = 0.001 × ' + meanSquares + ' = ' + fmt(localV), 'pink');
      }
      const prompt = which.value
        ? f === 0
          ? 'The gradients cancel. What should the owner store in v?'
          : 'Owner R0    ·    W = 1    ·    m = 0    ·    v = 0'
        : f < 5
          ? 'Two equally weighted gradients for the same weight'
          : 'Owner R0    ·    W ≈ ' +
            next[0].toFixed(2) +
            '    ·    m = ' +
            next[1].toFixed(1) +
            '    ·    v = ' +
            fmt(next[2]);
      work.push(label(prompt, { size: 45, color: 'blue' }).moveTo(answer.point('center')));
      return work;
    }),
  );
  c.after('mean', () => phase.set(1));
  c.after('square', () => phase.set(2));
  c.after('local', () => phase.set(3));
  c.after('write-v', () => phase.set(4));
  c.after('owner', () => phase.set(5));
  c.on('reset', () => phase.set(0));
  c.after('change', () => {
    which.set(1);
    phase.set(0);
  });
  c.after('cancel', () => phase.set(4));
  c.after('mistaken', () => phase.set(5));
}
