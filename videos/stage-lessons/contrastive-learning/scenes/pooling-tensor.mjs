import { assertEqual, column, heatmap, indicate, matrixProduct, place, row } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  comparisonRow,
  finiteUnit,
  maskedMean,
} from '../../../films/contrastive-learning/arithmetic.mjs';

export default function poolingTensor(s, c) {
  const [top, middle, foot] = area.rows([3, 4, 2], 'normal');
  const regions = top.columns(3, 'loose');
  const states = [
    [
      [1, 0],
      [0, 1],
      [99, 99],
    ],
    [
      [0, 2],
      [0, 0],
      [99, 99],
    ],
  ];
  const masks = [
    [1, 1, 0],
    [1, 0, 0],
  ];
  const grids = states.map((v, i) =>
    place(
      heatmap(v, {
        size: 34,
        cellWidth: 100,
        cellHeight: 62,
        values: true,
        rowLabels: ['token', 'token', 'padding'],
        colors: ['surface', i ? 'pink' : 'cyan'],
      }),
      regions[i],
    ),
  );
  const means = states.map((v, i) => maskedMean(v, masks[i]));
  const pooled = place(
    column(
      means.map((v, i) =>
        row([
          label(i ? 'B' : 'A'),
          mono('Σ / ' + masks[i].reduce((a, b) => a + b) + ' = [' + v.join(', ') + ']', {
            color: 'yellow',
            size: 35,
          }),
        ]),
      ),
      { gap: 'wide' },
    ),
    regions[2],
  );
  const q = means.map(finiteUnit);
  const product = place(
    matrixProduct(
      q,
      [
        [1, 0],
        [0, 1],
      ],
      {
        width: middle.width - 80,
        size: 34,
        cell: 100,
        names: ['unit Q', 'unit Pᵀ', 'cosines'],
        format: (v) => v.toFixed(2),
      },
    ),
    middle,
  );
  const loss = q.reduce((sum, v, i) => sum + comparisonRow(v, 0.2, i).loss, 0) / q.length;
  assertEqual(Math.abs(loss - 0.3499312645245316) < 1e-12, true, 'the two-row mean loss');
  const derivative = 5 / (4 * Math.sqrt(2));
  const result = place(
    column(
      [
        mono(`CE = ${loss.toFixed(6)}`, { color: 'yellow' }),
        mono(`A · first token gradient  [−${derivative.toFixed(4)}, +${derivative.toFixed(4)}]`, {
          color: 'cyan',
          size: 36,
        }),
        note('Masked padding gradient  [0, 0]'),
      ],
      { gap: 'tight', align: 'center' },
    ),
    foot,
  );
  const normalizedNumbers = [...product.a.numbers.flat(), ...product.b.numbers.flat()];
  normalizedNumbers.forEach((n) => n.set('visible', false));
  s.add(heading(c.title), grids, product);
  c.on('cl-pooling-tensor-mask', () =>
    s.play(...grids.map((g, i) => g.mark((r) => masks[i][r] === 0, 'masked', { duration: 0.7 }))),
  );
  c.on('cl-pooling-tensor-sum', () =>
    s.play(...grids.map((g, i) => g.light({ row: i === 0 ? [0, 1] : 0 }, { duration: 0.6 }))),
  );
  c.show('cl-pooling-tensor-mean', pooled, { after: true });
  c.show('cl-pooling-tensor-norm', normalizedNumbers, { after: true });
  c.on('cl-pooling-tensor-matrix', () => s.play(product.complete({ duration: 1.8 })));
  c.show('cl-pooling-tensor-loss', result.nodes[0], { after: true });
  c.show('cl-pooling-tensor-gradient', result.nodes.slice(1), { after: true });
}
