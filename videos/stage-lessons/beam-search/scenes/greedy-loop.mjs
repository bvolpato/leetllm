import { boxOf, indicate, place, row } from 'vizmatic/stage';
import { heading, chip, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { stablePolicy } from '../../../films/beam-search/arithmetic.mjs';
import { rotationRow } from '../parts.mjs';

export default function greedyLoop(s, c) {
  const board = rotationRow(s);
  const first = place(
    row([
      note('Prefix'),
      chip('First step is'),
      namedBox('…', { width: 240, height: 84, dash: true }),
    ]),
    board.foot,
  );
  const next = place(
    row([
      note('Prefix'),
      chip('First step is'),
      chip('create', { color: 'cyan' }),
      namedBox('…', { width: 140, height: 84, dash: true }),
    ]),
    board.foot,
  );
  const final = place(
    row([
      note('Prefix'),
      chip('First step is'),
      chip('create', { color: 'cyan' }),
      chip('.', { color: 'yellow' }),
    ]),
    board.foot,
  );
  const nextRow = rotationRow(s, {
    values: stablePolicy([4, 1.5, 0.5]).probabilities,
    words: ['period', 'then', 'after'],
  });
  s.add(heading(c.title), [board.nodes, first]);
  c.swap('greedy-loop-build-0', first, next, { after: true });
  c.swap('greedy-loop-build-0', [board.chart, board.strip], [nextRow.chart, nextRow.strip], {
    after: true,
  });
  c.swap('greedy-loop-build-1', next, final, { after: true });
  c.after(
    'greedy-loop-build-1',
    () => s.play(indicate(nextRow.chart.bar(0), { scale: 1, color: 'yellow' })),
    0.4,
  );
}
