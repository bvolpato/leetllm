import { beside, boxOf, place, stateGrid } from 'vizmatic/stage';
import { mono, note } from '../../kit-narrated.mjs';
import { sampleModel } from '../../../films/prefix-reuse/model.mjs';
import { board, body, pointAt, readings } from '../parts.mjs';

export default function pool(s, c) {
  board(s, c, 'Which five physical blocks can R4 take?', 'KV pool · persistent block IDs');
  const [before, after] = [0, 2].map((beat) => sampleModel('pool', { beat, beatP: 0.9 }));
  const [region, key] = body.rows([3, 1], 'wide');
  const states = {
    referenced: { color: 'blue', fill: 0.4 },
    cached: { color: 'green', fill: 0.24 },
    free: { color: 'dim', fill: 0.06, dash: true },
    new: { color: 'cyan', fill: 0.55 },
  };
  const pool = place(
    stateGrid({
      columns: 10,
      rows: 2,
      cell: 124,
      gap: 23,
      states,
      initial: before.blocks.map((b) => b.state),
    }),
    region,
  );
  const ids = before.blocks.map(({ id }) => {
    const cell = boxOf(pool.cells[id]);
    return mono(String(id), { size: 35 }).moveTo([cell.cx, cell.cy - cell.height / 5]);
  });
  const owner = (id, name) => {
    const cell = boxOf(pool.cells[id]);
    return note(name, { size: 32, color: 'ink' }).moveTo([cell.cx, cell.cy + cell.height / 5]);
  };
  const legend = place(
    pool.legend(
      [
        ['referenced', 'Referenced'],
        ['cached', 'Idle cached'],
        ['free', 'Free'],
        ['new', 'R4'],
      ],
      { size: 36 },
    ),
    key,
  );
  const taken = after.blocks.filter((b) => b.state === 'new').map((b) => b.id);
  const free = taken.filter((i) => before.blocks[i].state === 'free'),
    replaced = taken.filter((i) => before.blocks[i].state === 'cached');
  const oldOwners = replaced.map((id) => owner(id, before.blocks[id].content));
  const displaced = replaced[0];
  const lookup = beside(note('Look up “' + before.blocks[displaced].content + '”', {
    size: 34, color: 'yellow',
  }), pool.cells[displaced], 'above', 'normal');
  s.add(pool, ids, legend, owner(0, 'G'), owner(1, 'G'), oldOwners);
  c.show('pool-free', free.map((id) => owner(id, after.blocks[id].content)), { after: true });
  c.swap('pool-replace', oldOwners, replaced.map((id) => owner(id, after.blocks[id].content)), { after: true });
  c.show('evicted-entry', lookup);
  c.hide('resident-pool', lookup);
  c.on('referenced-blocks', () =>
    s.play(...pool.indexes('referenced').map((i) => pointAt(pool.cells[i]))),
  );
  c.on('cached-available', () =>
    s.play(...pool.indexes('cached').map((i) => pointAt(pool.cells[i]))),
  );
  c.after('pool-free', () => s.play(pool.change(free, 'new')));
  c.after('pool-replace', () => s.play(pool.change(replaced, 'new')));
  c.on('protect-references', () =>
    s.play(
      ...before.blocks
        .filter((b) => b.state === 'referenced')
        .map((b) => pointAt(pool.cells[b.id])),
    ),
  );
  c.on('evicted-entry', () => s.play(pointAt(pool.cells[displaced])));
  readings(s, c, 'Each number identifies a physical block.', [
    ['allocate-five', 'R4 requests five blocks.'],
    ['pool-free', 'R4 takes free blocks ' + free.join(', ') + '.', 'cyan'],
    ['pool-replace', 'R4 replaces cached contents at ' + replaced.join(' and ') + '.', 'cyan'],
    ['evicted-entry', '“' + before.blocks[displaced].content + '” misses. R4 now occupies block ' + displaced + '.', 'red'],
    [
      'resident-pool',
      after.blocks.length +
        ' physical blocks   ·   ' +
        after.referenced +
        ' referenced   ·   ' +
        after.available +
        ' available',
    ],
  ]);
}
