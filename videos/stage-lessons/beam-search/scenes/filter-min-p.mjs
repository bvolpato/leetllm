import { place } from 'vizmatic/stage';
import { heading, mono } from '../../kit-narrated.mjs';
import { retainedPolicy } from '../../../films/beam-search/arithmetic.mjs';
import { FLAT, WORKSHEET, rotationRow } from '../parts.mjs';

export default function filterMinP(s, c) {
  const board = rotationRow(s, { values: WORKSHEET });
  const cutoff = 0.1 * Math.max(...WORKSHEET),
    flatCut = 0.1 * Math.max(...FLAT);
  const rule = place(mono('cutoff = .10 × .568 = .0568', { color: 'yellow' }), board.foot);
  const flatRule = place(mono('cutoff = .10 × .28 = .028', { color: 'yellow' }), board.foot);
  const parameter = place(
    mono('base = .10 · cutoff follows the maximum', { color: 'yellow' }),
    board.foot,
  );
  s.add(heading(c.title), [board.nodes, parameter]);
  c.swap('filter-min-p-build-0', parameter, rule, { after: true });
  c.after('filter-min-p-build-0', () =>
    s.play(
      board.chart.cutAt(cutoff, { label: '', duration: 0.7 }),
      ...board.masses.map((v, i) =>
        v.to(retainedPolicy(WORKSHEET, 'min-p', 0.1).probabilities[i], { duration: 1.2 }),
      ),
    ),
  );
  c.onBeat(1, () => s.play(...board.update(FLAT)));
  c.hide(1, [rule, board.chart.valueCut]);
  c.show('filter-min-p-build-1', flatRule, { after: true });
  c.after('filter-min-p-build-1', () =>
    s.play(board.chart.cutAt(flatCut, { label: '', duration: 1.2 })),
  );
}
