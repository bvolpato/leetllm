// Scene `scores`: the places of the words are their scores, and only the gaps count.
//
// The picture: a ruler draws under the three words. A shared offset changes every number of the
// ruler, and no word and no gap moves.
import { draw, place } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { BOARD, SIDE, STATE, TARGET_COLOR, board, recipe } from '../parts.mjs';

export default function scores(s, c) {
  const b = board(s, STATE.intro);
  const [top] = BOARD.rows([1, 6, 2], 'normal');
  const continued = place(label('The dog slept', { size: 56, color: TARGET_COLOR }), top, 'left');
  const [line] = recipe(1);
  s.add(heading(c.title));
  c.take([continued, ...b.standing(STATE.intro)]);

  // The ruler: each word stands at its score.
  c.show('score-values', [draw(b.rule), b.ticks]);
  c.show('score-logits', line);
  const lead = b.gap(1, 0),
    second = b.gap(2, 1, 'dim');
  c.show('score-gaps', [lead, second]);

  // One offset for every score: the numbers of the ruler change, and the gaps hold.
  const added = place(mono('+ 1000 to every score', { color: 'cyan' }), SIDE);
  c.show('score-offset', added);
  c.on('score-offset', () => s.play(b.offset.to(1000, { duration: 1.6 })));
  c.on('score-restore', () => s.play(b.offset.to(0, { duration: 1.6 })));
  c.hide('score-restore', added);
  c.hide('score-next', [lead, second]);
  c.keep([continued, ...line, ...b.standing(STATE.scores)]);
}
