import { assertEqual, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

export default function batchIdentity(s, c) {
  const ids = ['A', 'B', 'C', 'D', 'E', 'F'],
    half = ids.length / 2;
  const [grid, panel] = area.columns([1, 1], 'wide');
  const bands = grid.rows(7, 'tight').map((r) => r.columns([1.3, 1, 1, 1, 1, 1, 1], 'tight'));
  const axes = ids.flatMap((id, i) => [
    place(note('p' + id, { size: 35 }), bands[0][i + 1]),
    place(note('q' + id, { size: 35 }), bands[i + 1][0]),
  ]);
  const board = [],
    active = [],
    second = [],
    cross = [];
  const mark = (cell, fill, border) =>
    place(rect(cell.width * 0.83, cell.height * 0.68, { fill, stroke: border, width: 2 }), cell);
  for (let i = 0; i < ids.length; i++) {
    for (let j = 0; j < ids.length; j++) {
      const cell = bands[i + 1][j + 1];
      board.push(mark(cell, 'surface', 'grid'));
      const samePool = Math.floor(i / half) === Math.floor(j / half);
      const group = samePool ? (i < half ? active : second) : cross;
      group.push(mark(cell, i === j ? 'green' : 'pink', 'surface'));
    }
  }
  const [key, legend, counts, explanation, footer] = panel.rows([1.3, 1, 1.4, 1.4, 1.1], 'normal');
  const idKey = place(label('One row per query', { size: 43, color: 'cyan' }), key);
  const colors = place(
    note('Green: assigned pair    Pink: competing passage', { size: 32 }),
    legend,
  );
  const enc = (n) => place(mono(n + ' text encodings', { size: 43 }), counts);
  const cmp = (n) =>
    place(mono(n + ' off-diagonal scores', { size: 39, color: 'pink' }), explanation);
  const onePool = half * (half - 1),
    separate = 2 * onePool,
    joined = ids.length * (ids.length - 1);
  const firstEnc = enc(2 * half),
    bothEnc = enc(2 * ids.length);
  const oneCount = cmp(onePool),
    twoCount = cmp(separate),
    allCount = cmp(joined);
  const solo = place(note('A alone: share 1, loss 0'), footer);
  const ask = place(
    note('Does accumulating gradients fill the gap?', { color: 'yellow', size: 33 }),
    footer,
  );
  const separatePools = place(
    note('Accumulated gradients · two separate pools', { size: 33 }),
    footer,
  );
  const audit = place(
    note('A pink cell can contain a second valid answer.', { color: 'yellow', size: 33 }),
    footer,
  );
  assertEqual(cross.length, joined - separate, 'new cross-batch comparisons in the gathered pool');
  s.add(heading(c.title), axes, board, idKey, colors);
  c.show('batch-alone', [active[0], solo]);
  c.hide('batch-three', solo);
  c.show('batch-three', [active.slice(1), firstEnc, oneCount]);
  c.show('batch-second', second);
  c.swap('batch-second', [firstEnc, oneCount], [bothEnc, twoCount]);
  c.show('batch-predict', ask);
  c.swap('batch-separate', ask, separatePools, { after: true });
  c.hide('batch-gather', separatePools);
  c.show('batch-gather', cross);
  c.swap('batch-total', twoCount, allCount, { after: true });
  c.show('batch-audit', audit);
}
