import {
  arrow,
  beside,
  rect,
  boxOf,
  column,
  dot,
  dynamic,
  heatmap,
  indicate,
  line,
  place,
  tex,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { nonlinearTrace } from '../../../films/training-backpropagation-gradient-descent/model.mjs';
import { relay } from '../parts.mjs';
export default function localRules(s, c) {
  const m = nonlinearTrace();
  const [head, body, foot] = area.rows([1, 5, 1], 'wide');
  const cols = body.columns(3, 'loose');
  const inputs = place(
    column(
      [
        label('saved input'),
        mono(`[${m.x}, 1]`, { color: 'cyan' }),
        label('incoming error'),
        mono(`[${m.residual}, 0]`, { color: 'yellow' }),
      ],
      { gap: 'wide' },
    ),
    cols[0],
  );
  const matrix = place(
    heatmap(
      [
        [0, 0],
        [0, 0],
      ],
      { size: 40, cell: 130, valueSize: 40, values: true, domain: [-8, 0] },
    ),
    cols[1],
  );
  const columnLabels = [m.x, 1].map((v, i) =>
    beside(
      note('x' + (i + 1) + ' = ' + v, { color: 'cyan' }),
      matrix.cell(0, i),
      'above',
      'normal',
    ),
  );
  const rowLabels = [m.residual, 0].map((v, i) =>
    beside(note('δ' + (i + 1) + ' = ' + v, { color: 'yellow' }), matrix.cell(i, 0), 'left', 'wide'),
  );
  const gradientName = beside(label('∇W'), matrix, 'under', 'normal');
  const matrixName = place(note('Saved input · saved gate · saved winner'), head);
  const transpose = place(tex('\\nabla_x L = W^T \\nabla_z L', { size: 40 }), cols[2]);
  const pulses = cols.map(() => s.value(0));
  const results = [];
  const gates = cols.map((region, i) => {
    const [h, route, f] = region.rows([1, 3, 1], 'wide');
    const z = place(mono(`z = ${[m.z[0], m.z[1], 0][i]}`, { color: 'cyan' }), h);
    const center = route.point('center'),
      top = route.point('top'),
      bottom = route.point('bottom');
    const width = route.width * 0.3;
    const wire = line(top, bottom, { stroke: 'grid', width: 4 });
    const gate =
      i === 0
        ? [
            line([center[0] - width, center[1]], [center[0] - width * 0.25, center[1]], {
              stroke: 'green',
              width: 8,
            }),
            line([center[0] + width * 0.25, center[1]], [center[0] + width, center[1]], {
              stroke: 'green',
              width: 8,
            }),
          ]
        : line([center[0] - width, center[1]], [center[0] + width, center[1]], {
            stroke: 'dim',
            width: 8,
          });
    const marker = dynamic(() =>
      dot(12, 'yellow').moveTo([
        top[0],
        top[1] + (bottom[1] - top[1]) * pulses[i].value * (i === 0 ? 1 : 0.5),
      ]),
    );
    const result = place(mono(`gradient ${i === 0 ? m.residual : 0}`, { color: 'yellow' }), f);
    results.push(result);
    return [z, wire, gate, marker];
  });
  const forwardValues = [
    [m.hidden[0], m.hidden[1]],
    [m.z[1], 0],
  ];
  const forwardPool = place(
    heatmap(forwardValues, { cell: 130, valueSize: 40, values: true, domain: [-4, 2] }),
    cols[0],
  );
  const pool = place(
    heatmap(
      [
        [0, 0],
        [0, 0],
      ],
      { cell: 130, valueSize: 40, values: true, domain: [-4, 0] },
    ),
    cols[2],
  );
  const savedCell = boxOf(forwardPool.cell(0, 0));
  const savedWinner = rect(savedCell.width, savedCell.height, { stroke: 'green', width: 6 }).moveTo(
    savedCell.point('center'),
  );
  const gradientCell = boxOf(pool.cell(0, 0));
  const destination = rect(gradientCell.width, gradientCell.height, {
    stroke: 'green',
    width: 6,
  }).moveTo(gradientCell.point('center'));
  const forwardName = beside(label('forward window'), forwardPool, 'above', 'wide');
  const gradientTitle = beside(label('input gradients'), pool, 'above', 'wide');
  const poolIn = place(mono('incoming ' + m.residual, { color: 'yellow' }), cols[1]);
  const winner = beside(note('Saved winner: first maximum'), forwardPool, 'under', 'normal');
  const caption = place(note('Local rules use the forward values that were saved.'), foot);
  const title = heading(c.title);
  s.add(
    title,
    inputs,
    matrix,
    columnLabels,
    rowLabels,
    gradientName,
    matrixName,
    transpose,
    caption,
  );
  c.on('dense-outer', () => {
    const values = [
      [0, 0],
      [0, 0],
    ];
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 2; col++) {
        values[row][col] = [m.residual, 0][row] * [m.x, 1][col];
        s.play(
          indicate(rowLabels[row], { scale: 1, duration: 0.45 }),
          indicate(columnLabels[col], { scale: 1, duration: 0.45 }),
          matrix.setValue(
            {},
            values.map((r) => [...r]),
            { duration: 0.45 },
          ),
        );
      }
  });
  c.on('dense-input', () => s.play(indicate(transpose, { scale: 1 })));
  c.swapAll('relu-mask', gates, { keep: [title, caption, matrixName] });
  c.on('relu-mask', () => s.play(pulses[0].to(1, { duration: 1.4 })), 0.5);
  c.show('relu-mask', results[0], { after: true });
  c.on('relu-block', () => s.play(pulses[1].to(1, { duration: 1 })));
  c.show('relu-block', results[1], { after: true });
  c.on('relu-zero', () => s.play(pulses[2].to(1, { duration: 1 })));
  c.show('relu-zero', results[2], { after: true });
  c.swapAll(
    'pool-save',
    [forwardPool, savedWinner, forwardName, pool, destination, gradientTitle, poolIn, winner],
    { keep: [title, caption, matrixName] },
  );
  c.on(
    'pool-route',
    () => {
      relay(s, poolIn, pool.cell(0, 0));
      s.play(indicate(savedWinner, { scale: 1 }), indicate(destination, { scale: 1 }));
      s.play(
        pool.setValue(
          {},
          [
            [m.residual, 0],
            [0, 0],
          ],
          { duration: 1 },
        ),
      );
    },
    0.5,
  );
}
