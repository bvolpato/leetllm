import { beside, column, grid, dynamic, indicate, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note, chip } from '../../kit-narrated.mjs';
import { plane, LEFT, RIGHT, TOP, MID, LOW, fmt } from '../parts.mjs';
import { EMBEDDING_COUNTS } from '../../../films/embeddings/fixtures.mjs';
import { countRepresentation } from '../../../films/embeddings/model.mjs';
export default function countPpmi(s, c) {
  const p = plane(s, {
      title: 'apple · pear · river · lake',
      xName: 'context columns',
      yName: 'word rows',
    }),
    m = countRepresentation();
  const names = ['apple', 'pear', 'river', 'lake'];
  const cells = EMBEDDING_COUNTS.flatMap((r, i) => [
    label(names[i], { size: 34, color: i < 2 ? 'cyan' : 'green' }),
    ...r.map((v) => chip(String(v), { width: 100, color: v ? 'ink' : 'dim' })),
  ]);
  const table = place(grid(cells, { columns: 5, gap: ['wide', 'normal'] }), p.plot);
  const head = ['fruit', 'sweet', 'water', 'shore'].map((name, i) =>
    beside(note(name), table, 'above', 'normal', cells[i + 1]),
  );
  const count = place(
    column(
      [
        label('apple × fruit', { color: 'cyan' }),
        mono(`count = ${EMBEDDING_COUNTS[0][0]}`),
        note(`row ${m.rows[0]} / column ${m.cols[0]} / total ${m.total}`),
      ],
      { gap: 'normal' },
    ),
    TOP,
    'left',
  );
  const skeleton = [
    place(label('observed count', { color: 'dim' }), TOP, 'left'),
    place(label('chance baseline', { color: 'dim' }), MID, 'left'),
    place(label('log ratio → PPMI', { color: 'dim' }), LOW, 'left'),
  ];
  const baselineProgress = s.value(0);
  const ratio = dynamic(() => {
    const width = MID.width * 0.85,
      at = MID.point('bottom');
    return [
      rect(width, 14, { fill: 'dim', stroke: 'dim' }).moveTo([at[0], at[1] - 20]),
      rect(
        Math.max(1, ((width * m.expected[0][0]) / EMBEDDING_COUNTS[0][0]) * baselineProgress.value),
        14,
        { fill: 'yellow', stroke: 'yellow' },
      ).moveTo([
        at[0] -
          width / 2 +
          (((width * m.expected[0][0]) / EMBEDDING_COUNTS[0][0]) * baselineProgress.value) / 2,
        at[1] - 20,
      ]),
    ];
  });
  const expected = place(
    column(
      [
        label('chance baseline'),
        mono(`${m.rows[0]} × ${m.cols[0]} / ${m.total} ≈ ${fmt(m.expected[0][0], 2)}`, {
          color: 'yellow',
        }),
      ],
      { gap: 'normal' },
    ),
    MID,
    'left',
  );
  const log = place(
    column(
      [
        label('log(observed / expected)'),
        mono(`ln(8 / ${fmt(m.expected[0][0], 2)}) ≈ ${fmt(m.ppmi[0][0])}`, { color: 'yellow' }),
      ],
      { gap: 'normal' },
    ),
    LOW,
    'left',
  );
  const floor = place(
    column(
      [
        label('PPMI = max(0, PMI)'),
        note('unobserved cell → 0'),
        note('association needs evaluation'),
      ],
      { gap: 'normal' },
    ),
    LOW,
    'left',
  );
  const backing = rect(p.plot.width - 8, p.plot.height - 8, {
    fill: 'surface',
    stroke: 'surface',
  }).moveTo(p.plot.point('center'));
  s.add(heading(c.title), p.nodes, backing, table, head, skeleton);
  c.on('matrix', () => s.play(indicate(table, { scale: 1, color: 'yellow' })));
  c.swap('marginals', skeleton[0], count);
  c.swap('expected', skeleton[1], expected, { after: true });
  c.show('expected', ratio, { after: true });
  c.after('expected', () => s.play(baselineProgress.to(1, { duration: 1.2 })));
  c.swap('log', skeleton[2], log, { after: true });
  c.swap('floor', log, floor);
  c.on('zeros', () =>
    s.play(
      indicate(
        cells.filter(
          (_, i) => i % 5 !== 0 && EMBEDDING_COUNTS[Math.floor(i / 5)][(i % 5) - 1] === 0,
        ),
        { scale: 1, color: 'yellow' },
      ),
    ),
  );
  c.keep(p.frame);
}
