import { arrow, dot, dynamic, group, indicate, line, place } from 'vizmatic/stage';
import { display, label, mono, note } from '../../kit-narrated.mjs';
import { begin, FOOT, LEFT, RIGHT, mathPlot, UMAP_DIRECTIONS, UMAP_UNION, TOP } from '../parts.mjs';
export default function umap(s, c) {
  const header = place(
      label('How strongly do A and B count each other as neighbors?', { size: 46 }),
      TOP,
    ),
    gap = s.value(3),
    repel = s.value(0),
    joined = s.value(0);
  const chart = mathPlot(LEFT, { x: [-4, 4], y: [-3, 3] });
  const picture = dynamic(() => {
    const a = chart.world(-gap.value / 2, 0),
      b = chart.world(gap.value / 2, 0);
    const edges =
      joined.value > 0.5
        ? [line(a, b, { stroke: 'yellow', width: 7 })]
        : [
            arrow(chart.world(-gap.value / 2, 0.25), chart.world(gap.value / 2, 0.25), {
              stroke: 'cyan',
              width: 5,
              pad: 12,
            }),
            arrow(chart.world(gap.value / 2, -0.25), chart.world(-gap.value / 2, -0.25), {
              stroke: 'pink',
              width: 4,
              pad: 12,
            }),
          ];
    return group(
      ...edges,
      dot(18, 'ink').moveTo(a),
      dot(18, 'ink').moveTo(b),
      label('A', { size: 38 }).at(a[0] - 36, a[1] + 55),
      label('B', { size: 38 }).at(b[0] + 36, b[1] + 55),
      dot(14, 'dim').moveTo(chart.world(2 + repel.value, 2)),
    );
  });
  const rows = RIGHT.rows(4, 'wide');
  const p = place(
    mono('p = ' + UMAP_DIRECTIONS[0].toFixed(2), { size: 56, color: 'cyan' }),
    rows[0],
  );
  const q = place(
    mono('q = ' + UMAP_DIRECTIONS[1].toFixed(2), { size: 56, color: 'pink' }),
    rows[1],
  );
  const overlap = place(
    mono('p × q = ' + (UMAP_DIRECTIONS[0] * UMAP_DIRECTIONS[1]).toFixed(2), {
      size: 48,
      color: 'dim',
    }),
    rows[2],
  );
  const union = place(display(UMAP_UNION.toFixed(2), { color: 'yellow' }), rows[3]);
  const headers = ['A → B', 'B → A', 'Shared strength', 'Undirected edge'].map((words, i) =>
    place(note(words), rows[i], 'top'),
  );
  [p, q, overlap, union].forEach((node, i) => node.moveTo([rows[i].cx, rows[i].cy + 25]));
  const rule = place(label('fuzzy union: p + q − p q', { color: 'yellow' }), FOOT);
  begin(s, c, 'umap', 'Two directed strengths, one edge', [picture, rule], header);
  c.show('umap-beat-1-focus-1', headers);
  c.show('umap-p', p, { after: true });
  c.show('umap-q', q, { after: true });
  c.on('umap-beat-2-focus-1', () => s.play(indicate(rule, { scale: 1, color: 'yellow' })));
  c.show('umap-overlap', overlap, { after: true });
  c.show('umap-result', union, { after: true });
  c.after('umap-result', () => s.play(joined.to(1, { duration: 0.2 })));
  c.on('umap-attraction', () => s.play(gap.to(1.2, { duration: 2 })));
  c.on('umap-repulsion', () => s.play(repel.to(1, { duration: 1.5 })));
}
