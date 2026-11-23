import { arrow, boxOf, dot, heatmap, indicate, place, row, to } from 'vizmatic/stage';
import { area, heading, label, namedBox } from '../../kit-narrated.mjs';

export default function architectures(s, c) {
  const regions = area.rows(3, 'normal');
  const rows = regions.map((r) => r.columns([2, 2, 3, 2], 'wide'));
  const names = ['bi-encoder', 'cross-encoder', 'late interaction'];
  const labels = names.map((n, i) => place(label(n), rows[i][0], 'left'));
  const query = rows.map((r) =>
    place(namedBox('query', { width: 230, height: 94, color: 'cyan' }), r[1]),
  );
  const document = rows.map((r) =>
    place(namedBox('document', { width: 230, height: 94, color: 'blue' }), r[3]),
  );
  const independent = rows[0][2].rows(2, 'tight');
  const pooled = place(
    heatmap([[1, 1]], {
      size: 34,
      cell: 72,
      values: false,
      colors: ['surface', 'cyan'],
      rowLabels: ['q'],
    }),
    independent[0],
  );
  const stored = place(
    heatmap([[1, 1]], {
      size: 34,
      cell: 72,
      values: false,
      colors: ['surface', 'blue'],
      rowLabels: ['stored d'],
    }),
    independent[1],
  );
  const joint = place(
    heatmap(
      [
        [0, 0, 0],
        [0, 0, 0],
      ],
      { size: 34, cell: 72, values: false, domain: [0, 1] },
    ),
    rows[1][2],
  );
  const late = place(
    heatmap(
      [
        [0.12, 0.93, 0.08],
        [0.19, 0.07, 0.91],
      ],
      { size: 34, cell: 72, values: false },
    ),
    rows[2][2],
  );
  const packet = dot(12, 'blue').moveTo(boxOf(document[0]).point('left'));
  const links = [pooled, joint, late].flatMap((g, i) => [
    arrow(boxOf(query[i]).point('right'), boxOf(g).point('left'), {
      stroke: 'dim',
      width: 2,
      pad: 12,
    }),
    arrow(boxOf(document[i]).point('left'), boxOf(i === 0 ? stored : g).point('right'), {
      stroke: 'dim',
      width: 2,
      pad: 12,
    }),
  ]);
  s.add(heading(c.title), labels, query, document, pooled, stored, joint, late, links, packet);
  c.on('cl-architectures-bi', () =>
    s.play(to(packet, (n) => n.moveTo(boxOf(stored).point('right')), { duration: 1.2 })),
  );
  c.on('cl-architectures-cross', () =>
    s.play(
      joint.setValue(
        {},
        [
          [1, 0.5, 1],
          [0.5, 1, 0.5],
        ],
        { duration: 1.3 },
      ),
    ),
  );
  c.on('cl-architectures-late', () => s.play(late.light({ row: 0, col: 1 }, { duration: 1 })));
}
