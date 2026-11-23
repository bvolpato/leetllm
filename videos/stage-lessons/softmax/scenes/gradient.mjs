// Scene `gradient`: subtract what happened from what was predicted.
//
// The picture: a table subtracts the target from each share. Each result becomes an arrow under
// the ruler: the way that descent moves the score of its word. The three corrections then balance.
import { draw, grid, place, rect, row } from 'vizmatic/stage';
import { GRAD, PROBS, TARGET } from '../../../films/softmax/fixtures.mjs';
import { mono, note } from '../../kit-narrated.mjs';
import { MARK_COLOR, STATE, TARGET_COLOR, WORDS, WORD_COLOR, dogScene } from '../parts.mjs';

const signed = (value) => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(3)}`;

export default function gradient(s, c) {
  const { b, under, finish } = dogScene(s, c, STATE['gradient-chain'], 5);
  const [upper, lower] = under(5).rows([3, 2], 'normal');

  // The subtraction, one row for each word: share, minus target, gives the gradient of its score.
  const heads = ['', 'share', 'target', 'gradient'].map((words) => note(words));
  const rows = WORDS.map((word, i) => [
    mono(word, { color: WORD_COLOR[i], size: 36 }),
    mono(PROBS[i].toFixed(3), { size: 36 }),
    mono(`− ${Number(i === TARGET)}`, { size: 36, color: TARGET_COLOR }),
    mono(signed(GRAD[i]), { size: 36, color: MARK_COLOR }),
  ]);
  place(
    grid([...heads, ...rows.flat()], {
      columns: 4,
      gap: ['wide', 'tight'],
      align: ['left', 'right', 'right', 'right'],
    }),
    upper,
    'top',
  );
  s.add(heads[0], heads[1], ...rows.flatMap((cells) => [cells[0], cells[1]]));
  c.show('gradient-target', [heads[2], ...rows.map((cells) => cells[2])]);
  c.show('gradient-0', [heads[3], rows[0][3]], { after: true });
  c.show('gradient-1', rows[1][3], { after: true });
  c.show('gradient-2', rows[2][3], { after: true });

  // Descent subtracts each gradient: an arrow under the ruler for the move of each score.
  c.show('gradient-descent', draw(b.pushes));

  // The balance: the two positive parts are as long as the negative part.
  const scale = lower.width / -GRAD[TARGET];
  const part = (i) =>
    rect(Math.abs(GRAD[i]) * scale, 34, { fill: WORD_COLOR[i], stroke: null, opacity: 0.86 });
  const parts = [part(0), part(2), part(1)];
  const balance = [row([parts[0], parts[1]], { gap: 'none' }), parts[2]];
  const total = mono('total 0', { color: MARK_COLOR, size: 36 });
  place(grid([...balance, total], { columns: 1, gap: 'tight', align: 'left' }), lower, 'top');
  c.show('gradient-balance', [balance[0], parts[2]], { stagger: true });
  c.show('gradient-zero', total, { after: true });
  finish(STATE.gradient, 5);
}
