import { indicate, place, recolor, to } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { WIDTH_TWO } from '../../../films/beam-search/arithmetic.mjs';
import { miaLattice } from '../parts.mjs';

export default function firstBeam(s, c) {
  const board = miaLattice(WIDTH_TWO);
  const entries = board.columns[0];
  const cutoff = place(
    label('Width 2 · retain opened and looked', { color: 'yellow' }),
    board.footer,
  );
  s.add(heading(c.title), [board.headings, board.skeleton, entries.map((e) => e.words)]);
  c.take(board.skeleton);
  c.on('first-beam-beat-1-focus-1', () =>
    s.play(
      indicate(
        entries.map((e) => e.words),
        { scale: 1, color: 'yellow' },
      ),
    ),
  );
  c.after('beam-retain', () =>
    s.play(
      ...entries.slice(0, 2).map((e) => to(e.frame, (n) => n.stroke(e.color), { duration: 0.8 })),
    ),
  );
  c.on('first-beam-beat-2-focus-1', () =>
    s.play(
      indicate(
        entries.slice(0, 2).map((e) => e.words),
        { scale: 1, color: 'yellow' },
      ),
    ),
  );
  c.show('first-beam-beat-2-focus-2', cutoff);
  c.on('first-beam-beat-3-focus-1', () =>
    s.play(indicate(entries[2].frame, { scale: 1, color: 'yellow' })),
  );
  c.after('beam-prune', () =>
    s.play(
      ...entries[2].words.nodes.map((n) => recolor(n, 'dim', { duration: 0.6 })),
      to(entries[2].frame, (n) => n.stroke('dim').dash([8, 8]), { duration: 0.6 }),
    ),
  );
  c.on('first-beam-beat-3-focus-2', () =>
    s.play(
      indicate(
        entries.slice(0, 2).map((e) => e.frame),
        { scale: 1, color: 'yellow' },
      ),
    ),
  );
}
