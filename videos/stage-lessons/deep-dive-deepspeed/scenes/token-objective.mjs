import { assertEqual, barChart, column, place, row, stateGrid } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { WORK, open, finish } from '../parts.mjs';
export default function objective(s, c) {
  const b = open(s, c, 'token-objective');
  const [top, plot, foot] = WORK.rows([1.5, 3, 1], 'normal');
  const counts = [2, 6],
    total = counts.reduce((a, v) => a + v, 0),
    shares = counts.map((n) => n / total);
  assertEqual(shares[0] + shares[1], 1, 'valid token weights');
  const sets = counts.map((count, i) =>
    column(
      [
        label(`R${i}: ${count} valid tokens`, { color: 'green' }),
        stateGrid({
          columns: count,
          rows: 1,
          cell: 48,
          gap: 8,
          initial: 'valid',
          states: { valid: { color: 'green', fill: 0.7 } },
        }),
      ],
      { gap: 'normal' },
    ),
  );
  place(row(sets, { gap: 'loose' }), top);
  const chart = place(
    barChart(
      [
        { label: 'R0 influence', value: 0.5, color: 'cyan' },
        { label: 'R1 influence', value: 0.5, color: 'cyan' },
      ],
      {
        width: plot.width - 200,
        height: plot.height - 120,
        max: 1,
        labelSize: 34,
        showValues: true,
      },
    ),
    plot,
  );
  const equal = place(mono('rank mean: L = (L0 + L1)/2'), foot);
  const weighted = place(
    mono(`token mean: L = (${counts[0]}/${total})L0 + (${counts[1]}/${total})L1`),
    foot,
  );
  const nonlinear = place(
    mono('v ← β₂v + (1 − β₂) × reduced_gradient²', { size: 34, color: 'pink' }),
    foot,
  );
  const scope = place(note('Reference: same examples, masks, accumulation.'), foot);
  s.add(sets, chart, equal);
  c.after('token', () => s.play(chart.update(shares, { duration: 1.5 })));
  c.swap('token', equal, weighted, { after: true });
  c.swap('adam', weighted, nonlinear);
  c.swap('scope', nonlinear, scope);
  finish(c, b, 'token-objective');
}
