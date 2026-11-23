// Scene `exponentials`: each score gets a positive weight, and a common shift changes no ratio.
//
// The picture: the outline over each word fills as its weight is computed. Then the numbers of
// the ruler and of the weights change together, and no bar moves.
import { column, place, tex, write } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { BOARD, MARK_COLOR, READ, SIDE, STATE, TARGET_COLOR, board, recipe } from '../parts.mjs';

export default function exponentials(s, c) {
  const b = board(s, STATE.scores);
  const [top] = BOARD.rows([1, 6, 2], 'normal');
  const continued = place(label('The dog slept', { size: 56, color: TARGET_COLOR }), top, 'left');
  const [scoresLine, weightsLine] = recipe(2);
  s.add(heading(c.title));
  c.take([continued, ...scoresLine, ...b.standing(STATE.scores)]);
  c.show(0, [weightsLine[0], write(weightsLine[1])]);

  // Each outline fills as the voice names its word, and its weight shows over it.
  ['exp-ran', 'exp-slept', 'exp-ate'].forEach((cue, i) =>
    c.on(cue, () => {
      b.read[i].set(READ.weight);
      s.play(b.solid[i].to(1, { duration: 0.6 }));
    }),
  );
  c.show(0, b.readouts);

  // The ratio of two weights, before the shift and after it. It is e to the gap of two points.
  const ratio = (weights) =>
    tex(`\\frac{${weights[0]}}{${weights[1]}} \\approx ${Math.exp(2).toFixed(1)}`, {
      size: 50,
      color: MARK_COLOR,
    });
  const before = ratio([Math.exp(3).toFixed(1), Math.exp(1).toFixed(2)]),
    after = ratio(['1', Math.exp(-2).toFixed(3)]);
  const shifted = mono('− 3 from every score', { color: 'cyan' });
  const inputs = mono('+ 1000, then − 1003', { color: 'cyan' });
  const overflow = mono('e¹⁰⁰³ overflows', { color: 'red' });
  const [, lower] = SIDE.rows([2, 3], 'normal');
  place(column([before, shifted, after], { gap: 'wide', align: 'center' }), lower, 'top');
  place(column([inputs, overflow], { gap: 'normal', align: 'center' }), lower, 'top');
  c.show('exp-ratio', before, { after: true });

  // Subtract the largest score: the leader stands at zero, and every weight shrinks by one factor.
  c.show('exp-shift', shifted);
  c.on('exp-shift', () => s.play(b.shift.to(3, { duration: 1.6 })));
  c.show('exp-survives', after);

  // A thousand more on every input, and the new maximum off again: nothing on the board moves.
  c.swap('exp-offset', [before, shifted, after], inputs);
  c.on('exp-offset', () =>
    s.play(b.offset.to(1000, { duration: 1.6 }), b.shift.to(1003, { duration: 1.6 })),
  );
  c.show('exp-overflow', overflow);
  c.keep([continued, ...scoresLine, ...weightsLine, ...b.standing(STATE.exponentials)]);
}
