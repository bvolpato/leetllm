import { indicate, place } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { WIDTH_TWO } from '../../../films/beam-search/arithmetic.mjs';
import { miaLattice } from '../parts.mjs';

export default function probabilities(s, c) {
  const board = miaLattice(WIDTH_TWO);
  const openings = board.columns[0].map((e) => e.words);
  const product = place(mono('0.45 × 0.50 = 0.225', { color: 'yellow' }), board.footer, 'left');
  const log = place(mono('log .45 + log .50 = log .225', { size: 34 }), board.footer, 'right');
  const eos = board.columns[3][0].words;
  s.add(heading(c.title), [board.headings, board.skeleton, openings]);
  c.take(board.skeleton);
  c.on('probabilities-beat-1-focus-1', () =>
    s.play(indicate(openings[0], { scale: 1, color: 'yellow' })),
  );
  c.on('probabilities-beat-1-focus-2', () =>
    s.play(indicate(openings, { scale: 1, color: 'yellow' })),
  );
  c.show('probabilities-beat-2-focus-2', board.columns[1][0].words);
  c.show('probabilities-beat-2-focus-1', [product, log], { after: true });
  c.on('probabilities-beat-3-focus-2', () =>
    s.play(indicate(board.columns[3][0].frame, { scale: 1, color: 'yellow' })),
  );
  c.show('probabilities-beat-3-focus-1', [board.columns[2][0].words, eos]);
  c.keep(board.skeleton);
}
