import { heatmap } from 'vizmatic/stage';
import { heading } from '../../kit-narrated.mjs';
import {
  C,
  HEADS,
  assertEqual,
  block,
  body,
  change,
  compactMiB,
  foot,
  kvGroupForQuery,
  mono,
  note,
  place,
  point,
  range,
  readout,
  repeatedMiB,
  right,
  wall,
} from '../parts.mjs';

export default function kernelRoute(s, c) {
  const title = heading(c.title);
  s.add(title);
  const cache = wall(s, c);
  const [axis, grid, calc] = right.rows([1, 4, 2], 'normal');
  const keys = [1, 10];
  const scores = range(HEADS.queries).map((i) => (i + 1) * keys[kvGroupForQuery(i)]);
  const table = place(
    heatmap([scores.slice(0, 4), scores.slice(4)], {
      values: true,
      initial: 'empty',
      cell: 85,
      size: 40,
      domain: [0, 80],
      colors: ['surface', C.query],
      rowLabels: ['KV0', 'KV1'],
    }),
    grid,
  );
  s.add(place(note('Raw dot products · four readers per group'), axis, 'left'), table);
  change(s, c, 'group0', cache.lit, 3);
  change(s, c, 'group1', cache.lit, 4);
  readout(
    s,
    c,
    calc,
    [
      ['keys', 'Keys     1 and 10', C.key, true],
      ['scores', 'Q3: 4 × 1       Q4: 5 × 10', C.query, true],
    ],
    { size: 40 },
  );
  c.after('scores', () => s.play(table.mark(() => true, 'open', { duration: 0.65, lag: 0.04 })));

  const [spec, columns, ...rows] = body.rows([1, 1, 3, 3], 'tight');
  const [name, retained, extra] = columns.columns([1, 2, 5], 'normal');
  const board = [
    place(note('1 layer · 2 requests × 1,024 positions · width 64 · 2 bytes/number'), spec, 'left'),
    place(note('Group'), name, 'left'),
    place(note('Retained K/V'), retained, 'left'),
    place(note('Additional repeated K/V'), extra, 'left'),
  ];
  const copies = [],
    histories = [];
  for (const [i, lane] of rows.entries()) {
    const [id, saved, expanded] = lane.columns([1, 2, 5], 'normal');
    board.push(place(mono('KV' + i, { size: 41 }), id, 'left'));
    const repeated = expanded.columns(HEADS.queries / HEADS.gqaKV, 'tight');
    const cellWidth = repeated[0].width * 0.94;
    const cells = [saved, ...repeated];
    for (const [j, cell] of cells.entries()) {
      const target = j === 0 ? histories : copies;
      for (const [k, color] of [C.key, C.value].entries()) {
        const xy = point(cell, 0.5, k === 0 ? 0.37 : 0.64);
        board.push(
          block(cellWidth, lane.height * 0.23, ...xy, 'surface', { stroke: 'faint', width: 2 }),
        );
        target.push(block(cellWidth, lane.height * 0.23, ...xy, color));
      }
    }
  }
  c.swapAll('layout', [...board, ...histories], { keep: [title] });
  c.show('repeat', copies, { after: true });
  c.hide('release', copies);
  assertEqual(compactMiB + repeatedMiB, 5, 'simultaneously live K/V arrays');
  readout(
    s,
    c,
    foot,
    [
      ['retained', '2 stored heads    ·    K + V = ' + compactMiB + ' MiB', C.key, true],
      [
        'copies',
        'Compact: ' + compactMiB + ' MiB      Additional: ' + repeatedMiB + ' MiB',
        'ink',
        true,
      ],
      ['ask', 'Live K/V arrays = ' + compactMiB + ' + ' + repeatedMiB + ' = ? MiB', C.result],
      ['peak', compactMiB + repeatedMiB + ' MiB live', C.result, true],
      ['release', 'After the call: ' + compactMiB + ' MiB retained'],
      ['inspect', 'Profile the dispatched kernel and its live allocations.'],
      ['separate', 'Each query still scores keys and mixes values.'],
    ],
    { size: 39, align: 'center' },
  );
}
