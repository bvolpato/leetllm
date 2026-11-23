import { boxOf, dot, indicate, place, to } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { WIDTH_TWO } from '../../../films/beam-search/arithmetic.mjs';
import { miaLattice } from '../parts.mjs';

export default function searchLattice(s, c) {
  const board = miaLattice(WIDTH_TWO, { firstStepPruned: true });
  const complete = place(
    label('opened the door · EOS · p = 0.153', { color: 'yellow' }),
    board.footer,
    'left',
  );
  const unfinished = place(note('quietly: unfinished at horizon 4'), board.footer, 'right');
  const signals = board.columns.map((col, depth) =>
    depth === 0
      ? []
      : col.map((entry) =>
          dot(8, entry.color).moveTo(
            boxOf(board.byKey.get(entry.candidate.parent).frame).point('right'),
          ),
        ),
  );
  const transfers = [
    null,
    'search-lattice-beat-1-focus-1',
    'search-lattice-beat-2-focus-1',
    'search-lattice-beat-3-focus-1',
  ];
  s.add(heading(c.title), [board.headings, board.skeleton, board.columns[0].map((e) => e.words)]);
  for (let depth = 1; depth < 4; depth++) {
    c.show(transfers[depth], signals[depth]);
    c.on(transfers[depth], () =>
      s.play(
        ...signals[depth].map((signal, i) =>
          to(signal, (n) => n.moveTo(boxOf(board.columns[depth][i].frame).point('left')), {
            duration: 1.1,
          }),
        ),
      ),
    );
    c.hide(transfers[depth], signals[depth], { after: true, lead: -1.1 });
  }
  c.show(
    'search-lattice-beat-1-focus-1',
    board.columns[1].map((e) => e.words),
    { stagger: true },
  );
  c.show(
    'search-lattice-beat-2-focus-1',
    board.columns[2].map((e) => e.words),
    { stagger: true },
  );
  c.on('search-lattice-beat-2-focus-1', () => {
    for (const col of board.columns.slice(1, 3))
      s.play(
        ...col.map((e) =>
          to(
            e.frame,
            (n) =>
              n
                .stroke(e.candidate.status === 'active' ? e.color : 'dim')
                .dash(e.candidate.status === 'pruned' ? [8, 8] : []),
            { duration: 0.5 },
          ),
        ),
      );
  });
  c.show(
    'search-lattice-beat-3-focus-1',
    board.columns[3].map((e) => e.words),
    { after: true },
  );
  c.show('search-lattice-beat-3-focus-1', complete, { after: true });
  c.show('search-lattice-beat-3-focus-2', unfinished, { after: true });
}
