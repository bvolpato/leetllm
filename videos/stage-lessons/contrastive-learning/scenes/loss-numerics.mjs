import { heatmap, assertEqual, indicate, place } from 'vizmatic/stage';
import { area, heading, mono, note } from '../../kit-narrated.mjs';
import { comparisonRow } from '../../../films/contrastive-learning/arithmetic.mjs';
export default function lossNumerics(s, c) {
  const [top, body, foot] = area.rows([1, 7, 1], 'normal');
  const scores = [0.9, 0.2],
    tau = 0.05,
    r = comparisonRow(scores, tau);
  const values = [scores, r.logits, r.centered, r.masses, r.probs];
  const table = (rows) =>
    place(
      heatmap(rows, {
        cellWidth: 340,
        cellHeight: 85,
        size: 34,
        values: true,
        rowLabels: ['score', 'score / τ', 'logit − max', 'exp(centered)', 'probability'],
        columnLabels: ['A: positive target', 'B: negative'],
        domain: [-14, 18],
        format: (v) =>
          Math.abs(v) > 1e10 ? v.toExponential(0) : Number(v.toPrecision(8)).toString(),
      }),
      body,
    );
  const grid = table(values);
  const temperature = place(
    mono('target: column A     τ = ' + tau, { color: 'green', size: 34 }),
    top,
  );
  const result = place(mono('loss = ' + r.loss.toExponential(2), { color: 'yellow' }), foot);
  const reverse = comparisonRow(scores.toReversed(), tau);
  const reversedGrid = table([
    scores.toReversed(),
    reverse.logits,
    reverse.centered,
    reverse.masses,
    reverse.probs,
  ]);
  const swapped = place(mono('swapped loss = ' + reverse.loss.toFixed(2), { color: 'red' }), foot);
  const big = 1e308,
    tiedRow = comparisonRow([big, big], 1);
  assertEqual(tiedRow.loss, Math.log(2), 'tied huge logits');
  const tied = table([[big, big], tiedRow.logits, tiedRow.centered, tiedRow.masses, tiedRow.probs]);
  const tiedTemp = place(mono('target: column A     τ = 1', { color: 'green', size: 34 }), top);
  const tiedLoss = place(note('tied huge logits → log 2; finite nonzero vectors normalize'), foot);
  const formula = place(
    mono('∂L/∂sᵢ = (pᵢ − 1[i = target]) / τ', { color: 'yellow', size: 34 }),
    top,
  );
  const derivative = place(
    heatmap(
      [tiedRow.probs, [1, 0], tiedRow.probs.map((p, i) => p - Number(i === 0)), tiedRow.gradients],
      {
        cellWidth: 340,
        cellHeight: 95,
        size: 34,
        values: true,
        rowLabels: ['p', 'positive indicator', 'p − indicator', 'score gradient (τ = 1)'],
        columnLabels: ['A: positive target', 'B: negative'],
        domain: [-1, 1],
        format: (v) => v.toFixed(2),
      },
    ),
    body,
  );
  grid.numbers
    .slice(1)
    .flat()
    .forEach((n) => n.set('visible', false));
  s.add(heading(c.title), temperature, grid);
  c.on('cl-loss-numerics-scores', () => s.play(indicate(grid.cells[0], { scale: 1 })));
  for (const [cue, i] of [
    ['cl-loss-numerics-logits', 1],
    ['cl-loss-numerics-center', 2],
    ['cl-loss-numerics-mass', 3],
    ['cl-loss-numerics-prob', 4],
  ])
    c.show(cue, grid.numbers[i], { after: true });
  c.show('cl-loss-numerics-loss', result, { after: true });
  c.swap('numerics-swap-input', [grid, result], reversedGrid);
  c.show('cl-loss-numerics-swap', swapped, { after: true });
  c.on('cl-loss-numerics-finite', () => s.play(indicate(reversedGrid.cells[1], { scale: 1 })));
  c.on('cl-loss-numerics-gap', () => s.play(indicate(reversedGrid.cells[2], { scale: 1 })));
  c.swap(
    'cl-loss-numerics-tied',
    [reversedGrid, temperature, swapped],
    [tied, tiedTemp, tiedLoss],
    {
      after: true,
    },
  );
  c.on('cl-loss-numerics-tiny', () => s.play(indicate(tiedLoss, { scale: 1 })));
  c.swap('cl-loss-numerics-gradient', [tied, tiedTemp], [derivative, formula], { after: true });
}
