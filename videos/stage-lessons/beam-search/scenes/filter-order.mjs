import { barChart, column, indicate, place, row } from 'vizmatic/stage';
import { heading, area, label, mono, note } from '../../kit-narrated.mjs';
import { retainedPolicy } from '../../../films/beam-search/arithmetic.mjs';
import { COLORS } from '../parts.mjs';

export default function filterOrder(s, c) {
  const input = [0.6, 0.25, 0.15];
  const afterK = retainedPolicy(input, 'k', 2).probabilities;
  const kp = retainedPolicy(afterK, 'p', 0.7).probabilities;
  const pk = retainedPolicy(retainedPolicy(input, 'p', 0.7).probabilities, 'k', 2).probabilities;
  const [header, body, footer] = area.rows([1, 4.5, 1.5], 'wide');
  const names = ['top-k 2 → top-p .70', 'top-p .70 → top-k 2'];
  const regions = body.columns(2, 'loose');
  const titles = regions.map((region, i) =>
    place(label(names[i], { size: 34 }), header.columns(2, 'loose')[i]),
  );
  const charts = regions.map((region) =>
    place(
      barChart(
        ['A', 'B', 'C'].map((label, i) => ({ label, value: input[i], color: COLORS[i] })),
        {
          width: region.width * 0.86,
          height: region.height * 0.68,
          max: 1,
          labelSize: 40,
          showValues: true,
          format: (v) => v.toFixed(3),
        },
      ),
      region,
      'bottom',
    ),
  );
  const denominator = place(mono('.60 / .85 = .706', { color: 'yellow' }), footer, 'left');
  const difference = place(label('Only A                 A and B', { color: 'yellow' }), footer);
  const receipt = place(note('Processor order is part of the recorded policy'), footer, 'right');
  s.add(heading(c.title), [titles, charts]);
  c.on('filter-order-build-0', () => s.play(charts[0].update(afterK, { duration: 1.2 })));
  c.show('filter-order-build-0', denominator);
  c.after('filter-order-build-1', () =>
    s.play(charts[0].update(kp, { duration: 1.2 }), charts[1].update(pk, { duration: 1.2 })),
  );
  c.swap('filter-order-build-1', denominator, difference, { after: true });
  c.swap('filter-order-build-2', difference, receipt);
}
