import { arrayCells, barChart, column, fitted, indicate, place } from 'vizmatic/stage';
import { display, label, mono, note } from '../../kit-narrated.mjs';
import {
  begin,
  FOOT,
  LEFT,
  RIGHT,
  NAMES,
  POINT_COLORS,
  POLICY_SCORES,
  policyVectors,
  policyQuery,
  taskHeader,
} from '../parts.mjs';
export default function policyBaseline(s, c) {
  const header = taskHeader();
  const chart = place(
    fitted(LEFT.inset('normal'), (width) =>
      barChart(
        NAMES.map((label, i) => ({
          label,
          value: policyVectors[i].reduce((sum, x, j) => sum + x * policyQuery[j], 0),
          color: POINT_COLORS[i],
        })),
        { width, height: LEFT.height * 0.7, max: 2, labelSize: 36, showValues: false },
      ),
    ),
    LEFT,
  );
  const rows = RIGHT.rows([2, 2, 1], 'wide');
  const query = place(
    column(
      [
        label('query', { color: 'cyan' }),
        arrayCells(
          policyQuery.map((x) => x.toFixed(2)),
          { cell: 108, size: 34, indices: false, color: 'cyan' },
        ),
      ],
      { gap: 'wide' },
    ),
    rows[0],
  );
  const scores = place(
    column(
      [0, 1, 3].map((i) =>
        mono(NAMES[i] + '  ' + POLICY_SCORES[i].toFixed(3), { color: POINT_COLORS[i], size: 44 }),
      ),
      { gap: 'normal' },
    ),
    rows[1],
  );
  const fixture = place(note('Hand-authored teaching vectors'), rows[2]);
  const recall = place(label('Recall@2 = 2 / 2 = 1', { color: 'yellow' }), FOOT);
  begin(
    s,
    c,
    'policy-baseline',
    'Keep the answer beside the geometry',
    [chart, query, fixture],
    header,
  );
  c.on('policy-normalize', () => s.play(chart.update(POLICY_SCORES, { duration: 1.8 })));
  c.show('policy-scores', scores.nodes.slice(0, 2), { after: true });
  c.show('policy-control', scores.nodes[2], { after: true });
  c.show('policy-recall', recall, { after: true });
}
