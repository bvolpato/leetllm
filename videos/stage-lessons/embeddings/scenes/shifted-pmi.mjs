import { assertEqual, column, dynamic, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { EMBEDDING_COUNTS } from '../../../films/embeddings/fixtures.mjs';
import { countRepresentation } from '../../../films/embeddings/model.mjs';
import { fmt, LOW, MID, plane, TOP } from '../parts.mjs';

export default function shiftedPmi(s, c) {
  const counts = countRepresentation();
  const p = plane(s, {
    title: 'Pairs involving apple',
    xName: 'expected noise draws',
    yName: 'observed pairs',
  });
  const draws = s.value(1),
    columnIndex = s.value(0);
  const columnId = () => Math.round(columnIndex.value);
  const observed = () => EMBEDDING_COUNTS[0][columnId()];
  const k = () => Math.round(draws.value);
  const noise = () => k() * counts.expected[0][columnId()];
  assertEqual(counts.cols[0], counts.cols[2], 'fruit and water have the same noise probability');
  const [chart, names] = p.plot.rows([8, 1], 'normal');
  const slots = chart.columns(2, 'wide');
  const bars = dynamic(() =>
    [observed(), noise()].flatMap((n, i) => {
      if (n === 0) return [];
      const height = (n / 18) * chart.height * 0.87;
      const color = i === 0 ? 'cyan' : 'pink';
      return [
        rect(slots[i].width * 0.56, height, { fill: color, stroke: color }).moveTo([
          slots[i].cx,
          chart.bottom - height / 2,
        ]),
      ];
    }),
  );
  const labels = names
    .columns(2, 'wide')
    .map((r, i) => place(note(i === 0 ? 'Observed pairs' : 'Expected noise draws'), r));
  const pair = dynamic(
    () =>
      place(
        column(
          [
            label('apple × ' + (columnId() === 0 ? 'fruit' : 'water'), { size: 50 }),
            mono('Observed   ' + observed(), { color: 'cyan', size: 37 }),
            mono(
              'Noise   ' +
                k() +
                ' × ' +
                counts.rows[0] * counts.cols[columnId()] +
                '/' +
                counts.total +
                ' ≈ ' +
                fmt(noise(), 2),
              { color: 'pink', size: 37 },
            ),
          ],
          { gap: 'normal' },
        ),
        TOP,
        'left',
      ).nodes,
  );
  const rule = place(
    column(
      [
        mono('Optimal score = PMI − ln(k)', { size: 39 }),
        note('Independent pair score, frequency-based noise'),
      ],
      { gap: 'normal' },
    ),
    MID,
    'left',
  );
  const read = dynamic(() =>
    place(
      mono(
        observed()
          ? 'ln(' +
              observed() +
              ' / ' +
              fmt(noise(), 2) +
              ') ≈ ' +
              fmt(Math.log(observed() / noise()))
          : 'Optimal score → −∞',
        { size: 40, color: 'yellow' },
      ),
      LOW,
      'left',
    ),
  );
  const rank = place(note('Rank of fitted scores ≤ embedding width'), LOW, 'bottom left');
  s.add(heading(c.title), p.frame, p.cap, bars, labels, pair);
  c.show('optimum', [read, rule]);
  c.on('four', () => s.play(draws.to(4, { duration: 1.25 })));
  c.on('absent', () => columnIndex.set(2));
  c.show('capacity', rank);
  c.keep(p.frame);
}
