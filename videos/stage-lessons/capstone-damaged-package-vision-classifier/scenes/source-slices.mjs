import { column, place } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { caption } from '../inspection.mjs';
import { visionOutcomes } from '../../../films/capstone-damaged-package-vision-classifier/fixtures.mjs';
import { visionJoin } from '../../../films/capstone-damaged-package-vision-classifier/arithmetic.mjs';
import {
  visionServed,
  visionTestRows,
} from '../../../films/capstone-damaged-package-vision-classifier/construction.mjs';
import { ACTION } from '../parts.mjs';

export default function scene(s, c) {
  const data = visionJoin(visionTestRows, visionServed, visionOutcomes, 12);
  const [head, cards, metrics, total, foot] = area.rows([1, 2.6, 2.3, 1, 1], 'normal');
  const headings = head.columns(2, 'loose'),
    panes = cards.columns(2, 'loose'),
    formulas = metrics.columns(2, 'loose');
  const summaries = ['customer_phone', 'warehouse_camera'].map((source, i) => {
    const rows = data.joined.filter((row) =>
      visionTestRows.some(
        (view) => view.photo.case_id === row.case_id && view.photo.source === source,
      ),
    );
    const tp = rows.filter((r) => r.cell === 'TP').length;
    const sent = rows.filter((r) => r.action === 'priority_damage_review').length;
    const damaged = rows.filter((r) => r.confirmed_damage).length;
    const tally = (n, d) => n + ' / ' + d + (d ? '' : '   undefined');
    const examples = rows.map((r) =>
      mono(
        r.case_id + '   ' + ACTION[r.action] + '   ' + (r.confirmed_damage ? 'Damaged' : 'Clear'),
        { size: 37 },
      ),
    );
    s.add(
      caption(
        headings[i],
        (i ? 'Warehouse camera' : 'Customer phone') + '   ·   ' + rows.length + ' cases',
        'cyan',
        42,
      ),
      place(column(examples, { gap: 'wide' }), panes[i]),
    );
    return place(
      column(
        [
          label('Precision    ' + tally(tp, sent), { size: 43 }),
          label('Recall    ' + tally(tp, damaged), { size: 43 }),
        ],
        { gap: 'normal' },
      ),
      formulas[i],
    );
  });
  s.add(heading(c.title));
  c.show('phone', summaries[0], { after: true });
  c.show('warehouse', summaries[1], { after: true });
  c.show(
    'pool',
    caption(total, 'All four cases    •    Precision  1/2    •    Recall  1/2', 'yellow'),
    { after: true },
  );
  c.show(
    'overlap',
    caption(foot, 'Count each physical case once in the overall result.', 'dim', 38),
  );
}
