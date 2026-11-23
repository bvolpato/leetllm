import { assertEqual, seq } from 'vizmatic/stage';
import { rankSheet } from '../rank-sheet.mjs';

export default function bread(s, c) {
  const b = rankSheet(c.title, {
    lanes: [
      ['Basics', 'Soup'],
      ['Slow Bread', 'Basics'],
    ],
    ids: ['Basics', 'Slow Bread', 'Soup'],
  });
  assertEqual(
    b.result.map((r) => r.score.toFixed(5)).join(' '),
    '0.03252 0.01639 0.01613',
    'bread ranks',
  );
  const title = b.top('“Bread that rises overnight”     ·     required source: Slow Bread');
  const pool = b.bottom('All three books reach selection    ·    one book fits in context');
  const question = b.bottom('With the order fixed, how many context slots does Slow Bread need?');
  const first = b.edge(s, 1);
  const hit = (n) => Number(b.result.slice(0, n).some((book) => book.id === 'Slow Bread'));
  const open = b.bottom(
    'Required source in context    ' +
      hit(2) +
      ' / 1     ·     Slow Bread: refrigerate the dough overnight',
  );
  const shut = b.bottom(
    'Required source in context    ' + hit(1) + ' / 1     ·     Basics: mix flour and water',
  );
  s.add(b.shell, title);
  c.on('bread-votes', () => s.play(seq(b.cast(0), b.cast(1))));
  c.show('bread-order', [b.scores, b.order, pool]);
  c.swap('one-slot', pool, [shut, first.mark], { after: true });
  c.swap('bread-question', shut, question);
  c.hide('bread-two', question);
  c.after('bread-two', () => s.play(first.move(2)));
  c.show('bread-recovered', open, { after: true });
}
