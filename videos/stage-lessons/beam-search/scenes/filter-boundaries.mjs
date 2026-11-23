import { indicate, line, place, row } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { stablePolicy } from '../../../films/beam-search/arithmetic.mjs';
import { rotationRow } from '../parts.mjs';

export default function filterBoundaries(s, c) {
  const input = [0.5, 0.25, 0.25, 0];
  const board = rotationRow(s, { values: input });
  const footRows = board.foot.rows(2, 'tight');
  const rules = place(
    row(
      [
        label('k = 2: create / revoke', { size: 34 }),
        label('p = .75: create / revoke', { size: 34 }),
        label('min-p = .5: first three', { size: 34 }),
      ],
      { gap: 'wide' },
    ),
    footRows[0],
  );
  const positive = place(
    label('p = 1: every positive-mass token', { color: 'yellow' }),
    footRows[1],
  );
  const actual = stablePolicy().probabilities;
  const unrounded = place(note('Unrounded original softmax row'), footRows[0]);
  const comparison = place(
    mono(
      `Σ first 3 = ${actual
        .slice(0, 3)
        .reduce((a, b) => a + b, 0)
        .toFixed(6)} < .99`,
      { color: 'yellow' },
    ),
    footRows[1],
  );
  const band = board.stripRegion.rows([1, 1], 'tight')[1];
  const x = band.left + 0.75 * band.width;
  const crossing = line([x, band.top], [x, band.bottom], { stroke: 'yellow', width: 5 });
  s.add(heading(c.title), board.nodes);
  c.after('boundary-rank', () => s.play(board.chart.cutAfter(2, { label: '', duration: 0.6 })));
  c.show('boundary-cumulative', crossing, { after: true });
  c.hide('boundary-cumulative', board.chart.rankCut, { after: true });
  c.hide('filter-boundaries-build-0', crossing);
  c.after('filter-boundaries-build-0', () =>
    s.play(board.chart.cutAt(0.25, { label: '', duration: 0.6 })),
  );
  c.show('filter-boundaries-build-0', rules, { after: true });
  c.show('filter-boundaries-build-1', positive);
  c.on('filter-boundaries-build-1', () =>
    s.play(indicate(board.chart.bars.slice(0, 3), { scale: 1, color: 'yellow' })),
  );
  c.onBeat(2, () => s.play(...board.update(actual)));
  c.swap(2, rules, unrounded);
  c.hide(2, board.chart.valueCut);
  c.swap('boundary-precision', positive, comparison, { after: true });
  c.after('filter-boundaries-build-2', () =>
    s.play(indicate(board.chart.bar(3), { scale: 1, color: 'yellow' })),
  );
}
