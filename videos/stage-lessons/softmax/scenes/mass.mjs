// Scene `mass`: three weights divide one budget.
//
// The picture: each weight fills its part of the unit strip. Then one score rises, and every
// share of the strip changes with it.
import { beside, decimal, grid, place, write } from 'vizmatic/stage';
import { display, heading, label, mono, note } from '../../kit-narrated.mjs';
import { BOARD, READ, SIDE, STATE, TARGET_COLOR, WORD_COLOR, board, recipe } from '../parts.mjs';

export default function mass(s, c) {
  const b = board(s, STATE.exponentials);
  const [top] = BOARD.rows([1, 6, 2], 'normal');
  const continued = place(label('The dog slept', { size: 56, color: TARGET_COLOR }), top, 'left');
  const [scoresLine, weightsLine, sharesLine] = recipe(3);
  s.add(heading(c.title), b.strip);
  c.take([continued, ...scoresLine, ...weightsLine, ...b.standing(STATE.exponentials)]);
  c.show(0, [sharesLine[0], write(sharesLine[1])]);

  // Sum the weights before dividing the budget on the later share cues.
  const added = b.fill.map(() => s.value(0));
  const total = () => b.weights().reduce((sum, weight, i) => sum + weight * added[i].value, 0);
  const [, lower] = SIDE.rows([2, 3], 'normal');
  const sum = [note('running sum of weights'), decimal(total, { digits: 3, size: 71 })];
  place(grid(sum, { columns: 1, gap: 'tight', align: 'center' }), lower, 'top');
  c.show('mass-add-0', sum);
  [0, 1, 2].forEach((i) => {
    c.on(`mass-add-${i}`, () => s.play(added[i].to(1, { duration: 0.7 })));
    c.after(`mass-share-${i}`, () => {
      b.read[i].set(READ.share);
      s.play(b.fill[i].to(1, { duration: 0.5 }));
    });
  });
  const one = beside(mono('= 1', { color: 'yellow', size: 34 }), b.unit, 'right', 'normal');
  c.show('mass-unit', one, { after: true });

  // Raise one score: its weight grows, the total grows, and every share changes.
  c.on('mass-raise', () => s.play(b.z[1].to(2, { duration: 1.4 })));
  // The original scores return: the word goes back, and the ruler shows the scores of the start again.
  c.on('mass-restore', () =>
    s.play(
      b.z[1].to(1, { duration: 1.2 }),
      b.offset.to(0, { duration: 1.2 }),
      b.shift.to(0, { duration: 1.2 }),
    ),
  );

  // The prediction: which of the two observations costs more?
  const asked = [
    mono('ran 84%', { color: WORD_COLOR[0] }),
    display('cost ?'),
    mono('slept 11%', { color: TARGET_COLOR }),
    display('cost ?'),
  ];
  place(grid(asked, { columns: 2, gap: ['wide', 'normal'], align: 'left' }), lower, 'top');
  c.hide('mass-eleven', sum);
  c.show('mass-eleven', asked[2], { after: true });
  c.show('mass-predict', [asked[0], asked[1], asked[3]]);
  c.hide('mass-predict', one);
  c.keep([continued, ...scoresLine, ...weightsLine, ...sharesLine, ...b.standing(STATE.mass)]);
}
