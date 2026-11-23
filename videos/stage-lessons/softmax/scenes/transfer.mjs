// Scene `transfer`: a fresh prefix on the same board, and the mean of two losses.
//
// The picture: the three words slide to the scores of a new sentence, the viewer predicts the
// sign of one correction, and the board pays it off. Then the two examples meet in one table.
import { column, draw, grid, group, indicate, place, rect, tex } from 'vizmatic/stage';
import {
  FRESH_LOGITS,
  FRESH_TARGET,
  GRAD,
  PROBS,
  TARGET,
} from '../../../films/softmax/fixtures.mjs';
import { freshState } from '../../../films/softmax/model.mjs';
import { area, display, label, mono, note } from '../../kit-narrated.mjs';
import { MARK_COLOR, READ, STATE, TARGET_COLOR, WORDS, WORD_COLOR, dogScene } from '../parts.mjs';
import { wordBudget } from '../word-budget.mjs';

export default function transfer(s, c) {
  const { b, said, stack, under } = dogScene(s, c, STATE.temperature, 6);
  const before = freshState(0),
    after = freshState(1);
  const dog = -Math.log(PROBS[TARGET]);
  const [upper, lower] = under(6).rows([1, 1], 'tight');

  // A new sentence: the words take its scores, and the observed word is another one.
  const cat = place(label('The cat …', { size: 56 }), b.top, 'left');
  const came = place(label('The cat ate', { size: 56, color: TARGET_COLOR }), b.top, 'left');
  const observed = b.tag(FRESH_TARGET, 'observed', TARGET_COLOR);
  c.swap('transfer-cat', [said, b.observed], cat);
  // The words cross while they travel, so the numbers of the bars wait for the end of the move.
  c.on('transfer-forward', () => {
    WORDS.forEach((_, i) => b.read[i].set(READ.none));
    b.namesOn.set(0);
    s.play(...b.z.map((value, i) => value.to(FRESH_LOGITS[i], { duration: 1.9 })));
    b.namesOn.set(1);
  });
  c.after('transfer-forward', () => WORDS.forEach((_, i) => b.read[i].set(READ.share)));
  // The first line of the recipe takes the scores of the new sentence.
  const fresh = tex(`z^{(0)} = [${FRESH_LOGITS.join(',\\ ')}]`, { size: 44, color: 'cyan' })
    .moveTo(stack[0][1])
    .alignTo(stack[0][1], 'left');
  c.swap('transfer-forward', stack[0][1], fresh);
  c.swap('transfer-target', cat, [came, observed]);

  // The prediction, and its answer: the gradient of the observed word, and its move.
  const asked = place(display('p − y = ?', { color: MARK_COLOR }), upper);
  const answer = place(
    mono(
      `${before.probabilities[FRESH_TARGET].toFixed(3)} − 1 = −${Math.abs(before.gradient[FRESH_TARGET]).toFixed(3)}`,
      { color: MARK_COLOR, size: 44 },
    ),
    upper,
  );
  const pushes = group(...WORDS.map((_, i) => b.push(i, FRESH_LOGITS[i], after.logits[i])));
  c.show('transfer-predict', asked);
  c.swap('transfer-gradient', asked, answer, { after: true });
  c.show('transfer-update', draw(pushes));
  c.on('transfer-update', () =>
    s.play(...b.z.map((value, i) => value.to(after.logits[i], { duration: 1.8 }))),
  );
  // The two corrections to one scale: the likely word needs less than the surprising one.
  const scale = lower.width / Math.abs(GRAD[TARGET]);
  const bar = (value, color) =>
    rect(Math.abs(value) * scale * 0.6, 34, { fill: color, stroke: null, opacity: 0.86 });
  const compared = [
    note('ate, now'),
    bar(before.gradient[FRESH_TARGET], WORD_COLOR[2]),
    note('slept, before'),
    bar(GRAD[TARGET], WORD_COLOR[1]),
  ];
  place(grid(compared, { columns: 2, gap: ['normal', 'tight'], align: 'left' }), lower, 'left');
  c.show('transfer-smaller', compared);

  // Both first predictions again: two shares, two losses, one mean.
  const heads = ['example', 'share', 'loss'].map((words) => note(words));
  const rows = [
    [
      mono('dog · slept', { color: WORD_COLOR[1], size: 36 }),
      mono(PROBS[TARGET].toFixed(3), { size: 36 }),
      mono(dog.toFixed(3), { size: 36 }),
    ],
    [
      mono('cat · ate', { color: WORD_COLOR[2], size: 36 }),
      mono(before.probabilities[FRESH_TARGET].toFixed(3), { size: 36 }),
      mono(before.loss.toFixed(3), { size: 36 }),
    ],
  ];
  const product = mono(
    `product ${(PROBS[TARGET] * before.probabilities[FRESH_TARGET]).toFixed(3)}`,
    { size: 36, color: 'cyan' },
  );
  const sum = mono(`sum ${(dog + before.loss).toFixed(3)}`, { size: 36, color: MARK_COLOR });
  const mean = mono(`mean ${((dog + before.loss) / 2).toFixed(3)}`, {
    size: 36,
    color: TARGET_COLOR,
  });
  const table = grid([...heads, ...rows.flat()], {
    columns: 3,
    gap: ['wide', 'tight'],
    align: ['left', 'right', 'right'],
  });
  place(column([table, product, sum, mean], { gap: 'tight', align: 'right' }), under(6), 'top');
  c.on('transfer-return', () =>
    s.play(...b.z.map((value, i) => value.to(FRESH_LOGITS[i], { duration: 1.2 }))),
  );
  c.swap('transfer-return', [answer, compared, pushes], [heads, rows]);
  c.show('transfer-product', product, { after: true });
  c.show('transfer-loss-sum', sum, { after: true });
  c.show('transfer-mean', mean, { after: true });
  c.on('transfer-most', () => s.play(indicate(rows[0][2], { color: MARK_COLOR })));

  // Use the opening prediction again and change only the word on the page.
  const [sentence, budget, result] = area.rows([1, 1.6, 1.6], 'wide');
  const frozen = wordBudget(s, budget, () => PROBS);
  frozen.shown.forEach((value) => value.set(1));
  const oldWord = place(display('The dog slept', { color: WORD_COLOR[TARGET] }), sentence, 'left');
  const newWord = place(
    display('The dog ate', { color: WORD_COLOR[FRESH_TARGET] }),
    sentence,
    'left',
  );
  const rawScores = place(mono('scores   [3, 1, 0]'), sentence, 'right');
  const [costBand, slopes] = result.rows(2, 'wide');
  const oldCost = place(mono('Observed slept     ' + dog.toFixed(3) + ' nats'), costBand, 'left');
  const newCost = place(
    mono('Observed ate     ' + (-Math.log(PROBS[FRESH_TARGET])).toFixed(3) + ' nats', {
      color: WORD_COLOR[FRESH_TARGET],
    }),
    costBand,
    'right',
  );
  const unknown = place(mono('Observed ate     ? nats'), costBand, 'right');
  const gradientRow = place(
    grid(
      [
        note('p − y'),
        ...WORDS.map((word, i) => {
          const g = PROBS[i] - Number(i === FRESH_TARGET);
          return mono(word + '  ' + (g < 0 ? '−' : '+') + Math.abs(g).toFixed(3), {
            color: WORD_COLOR[i],
          });
        }),
      ],
      { columns: 4, gap: 'loose' },
    ),
    slopes,
  );
  c.swapAll('transfer-replay', [oldWord, rawScores, frozen.frame, frozen.body, oldCost]);
  c.swap('transfer-relabel', oldWord, [newWord, unknown], { after: true });
  c.swap('transfer-relabel-loss', unknown, newCost, { after: true });
  c.show('transfer-relabel-gradient', gradientRow, { after: true });
}
