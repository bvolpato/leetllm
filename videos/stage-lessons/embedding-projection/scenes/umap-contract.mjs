import { arrow, column, dot, dynamic, group, indicate, line, place, tex } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { begin, FOOT, LEFT, RIGHT, mathPlot, taskHeader } from '../parts.mjs';
export default function umapContract(s, c) {
  const header = taskHeader(),
    gap = s.value(3),
    repel = s.value(1);
  const chart = mathPlot(LEFT, { x: [-4, 4], y: [-3, 3] });
  const picture = dynamic(() =>
    group(
      line(chart.world(-gap.value / 2, 0), chart.world(gap.value / 2, 0), {
        stroke: 'yellow',
        width: 6,
      }),
      line(chart.world(gap.value / 2, 0), chart.world(2.5, repel.value), {
        stroke: 'dim',
        width: 2,
        dash: [8, 8],
      }),
      dot(18, 'ink').moveTo(chart.world(-gap.value / 2, 0)),
      dot(18, 'ink').moveTo(chart.world(gap.value / 2, 0)),
      dot(16, 'dim').moveTo(chart.world(2.5, repel.value)),
    ),
  );
  const rows = RIGHT.rows(4, 'wide');
  const local = place(
    tex('p_{j|i}=e^{-\\max(0,d_{ij}-\\rho_i)/\\sigma_i}', { size: 36, color: 'ink' }),
    rows[0],
  );
  const union = place(tex('p+q-pq', { size: 56, color: 'yellow' }), rows[1]);
  const map = place(tex('q=(1+a\\,d^{2b})^{-1}', { size: 48, color: 'ink' }), rows[2]);
  const sampling = place(
    column(
      [label('edge: attraction', { color: 'ink' }), label('nonedge: repulsion', { color: 'dim' })],
      { gap: 'tight' },
    ),
    rows[3],
  );
  const footer = place(
    label('Each neighbor has its own membership strength', { size: 36, color: 'yellow' }),
    FOOT,
  );
  const transform = place(
    label('Fitted UMAP transform     →     verify neighbors and task', {
      size: 36,
      color: 'yellow',
    }),
    FOOT,
  );
  begin(s, c, 'umap-contract', 'Separate the graph from the map forces', [chart, picture], header);
  c.show('umap-local', local);
  c.show('umap-memberships', footer);
  c.show('umap-combine', union);
  c.show('umap-map-rule', map);
  c.show('umap-ce', sampling);
  c.on('umap-ce', () => s.play(gap.to(1.2, { duration: 2 }), repel.to(2.5, { duration: 2 })));
  c.on('umap-sampling', () => s.play(repel.to(1.5, { duration: 1.5 })));
  c.swap('umap-transform', footer, transform);
}
