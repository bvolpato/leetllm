import { heatmap, tokens } from 'vizmatic/stage';
import { C, assertEqual, body, foot, note, place, readout, start } from '../parts.mjs';
import { meanVisible } from '../../../films/grouped-query-attention/model.mjs';
export default function causalRepair(s, c) {
  start(s, c.title);
  const [values, chunk] = body.columns(2, 'loose');
  const [head, inputs, weights, answer] = values.rows([1, 3, 1, 2], 'normal');
  const v = [1, 2, 9],
    fixed = meanVisible(v);
  assertEqual(fixed, 4, 'latest query output');
  const strip = place(tokens(v, { size: 42, rows: { key: [0, 1, 2] } }), inputs);
  s.add(place(note('Cached values · scores all zero'), head, 'left'), strip);
  readout(
    s,
    c,
    weights,
    [
      [null, 'Latest query at position 2'],
      ['bad', 'Visible weights     [1, 0, 0]', C.failure],
      ['correct', 'Visible weights     [⅓, ⅓, ⅓]', C.query, true],
    ],
    { size: 39 },
  );
  c.on('bad', () => s.play(strip.mark([1, 2], 'masked')));
  c.on('correct', () => s.play(strip.mark([1, 2], 'kept')));
  readout(
    s,
    c,
    answer,
    [
      ['wrong', 'Upper-left output     ' + v[0], C.failure, true],
      ['mean', 'Full-prefix output     ' + fixed, C.result, true],
    ],
    { size: 42 },
  );
  const [axis, mask, legend] = chunk.rows([1, 5, 1], 'normal');
  const matrix = place(
    heatmap(
      [
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
      ],
      {
        cell: 65,
        size: 34,
        values: false,
        domain: [0, 1],
        colors: ['grid', C.key],
        columnLabels: ['0', '1', '2', '3', '4'],
        rowLabels: ['q3', 'q4'],
        initial: 'empty',
      },
    ),
    mask,
  );
  s.add(place(note('Chunk mask · absolute key position'), axis, 'left'), matrix);
  c.after('chunk', () =>
    s.play(
      matrix.mark((row, col) => row === 1 || col < 4, 'open'),
      { duration: 0.6 },
    ),
  );
  c.on('leak', () =>
    s.play(
      matrix.mark({ row: 0, col: 4 }, 'open'),
      matrix.light({ row: 0, col: 4 }, { color: C.failure }),
    ),
  );
  c.on('boundary', () => s.play(matrix.light(null), matrix.mark({ row: 0, col: 4 }, 'future')));
  readout(
    s,
    c,
    legend,
    [
      ['leak', 'q3 can see future key 4.', C.failure],
      ['boundary', 'q3 ends at key 3. q4 ends at key 4.', C.result],
    ],
    { size: 34 },
  );
  readout(
    s,
    c,
    foot,
    [
      ['sdpa', 'PyTorch SDPA uses an upper-left non-square causal mask.'],
      ['repair', 'Query at position 2: which values belong in the average?', C.result],
      ['correct', 'Use the absolute query position and valid request length.'],
      ['flash', 'FlashAttention uses a bottom-right non-square causal convention.'],
      ['compare', 'Compare both chunk rows with full-prefix recomputation.'],
    ],
    { align: 'center', size: 35 },
  );
}
