import { place, terminal } from 'vizmatic/stage';
import { mono } from '../kit-narrated.mjs';
import { rows, score } from './parts.mjs';

export const command = (text) => ({ text, kind: 'command', color: 'blue' });
export const output = (text, color = 'ink') => ({ text, color });

const result = score(rows);
export const scoreLines = [
  output('Eval rows: ' + result.total),
  output('Exact-match accuracy on tiny fixture:'),
  output(result.fraction.toFixed(3) + ' (' + result.correct + '/' + result.total + ')', 'green'),
  output('Gate passed. You may commit.'),
];

export function checkoutPair(
  main,
  cloneLines,
  localLines = [command('./repro.sh'), ...scoreLines],
) {
  const [head, panes, foot] = main.rows([0.75, 9, 0.65], 'normal');
  const places = panes.columns(2, 'normal');
  const heads = head.columns(2, 'normal');
  const titles = ['Original checkout', 'Temporary clone'].map((title, i) =>
    place(mono(title, { size: 39, color: i ? 'cyan' : 'ink' }), heads[i], 'left'),
  );
  const [original, clone] = [localLines, cloneLines].map((lines, i) =>
    place(
      terminal(lines, {
        title: 'access-rag · selected lines',
        columns: 41,
        size: 33,
        shown: false,
      }),
      places[i],
      'top left',
    ),
  );
  return { titles, original, clone, foot };
}
