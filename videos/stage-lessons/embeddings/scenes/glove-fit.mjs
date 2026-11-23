import { column, dot, dynamic, line, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { plane, TOP, MID, LOW, FOOT, fmt } from '../parts.mjs';
import { gloveResidual } from '../../../films/embeddings/arithmetic.mjs';
export default function gloveFit(s, c) {
  const p = plane(s, {
      title: 'Three observed GloVe cells',
      xName: 'natural log count',
      yName: 'three observed cells',
    }),
    span = s.value(0),
    weight = s.value(0);
  const counts = [3, 30, 300],
    rows = counts.map((n) => gloveResidual(n)),
    lanes = p.plot.rows(3, 'wide');
  const x = (v) => p.plot.left + (v / 6) * p.plot.width;
  const rulers = lanes.flatMap((r) => [
    line([p.plot.left, r.point('center')[1]], [p.plot.right, r.point('center')[1]], {
      stroke: 'dim',
      width: 2,
    }),
  ]);
  const marks = dynamic(() =>
    rows.flatMap((r, i) => {
      const y = lanes[i].point('center')[1];
      return [
        dot(10, 'cyan').moveTo([x(r.target), y]),
        line([x(r.score), y - 22], [x(r.score), y + 22], { stroke: 'yellow', width: 5 }),
        line([x(r.score), y + 30], [x(r.score + (r.target - r.score) * span.value), y + 30], {
          stroke: 'pink',
          width: 8,
        }),
      ];
    }),
  );
  const inputs = place(
    column(
      [
        label('Predicted score'),
        mono('score = ln(30)', { color: 'yellow' }),
        note('dot product + two biases'),
      ],
      { gap: 'normal' },
    ),
    TOP,
    'left',
  );
  const laneNames = rows.map((r, i) =>
    place(label(r.count + ' pairs', { size: 36 }), lanes[i].inset('tight'), 'top left'),
  );
  const targets = rows.map((r, i) =>
    place(
      mono('ln(' + r.count + ') = ' + fmt(r.target), { size: 32, color: 'cyan' }),
      lanes[i].inset('tight'),
      'top right',
    ),
  );
  const residual = place(
    column(
      [label('Residual = score − log count'), mono('Loss = weight × residual²', { size: 37 })],
      { gap: 'normal' },
    ),
    MID,
    'left',
  );
  const zero = place(label('count 30: residual 0', { color: 'yellow' }), LOW, 'top left');
  const error = place(
    mono(`count 3: squared ${fmt(rows[0].squared)}`, { size: 36, color: 'pink' }),
    LOW,
    'left',
  );
  const weights = place(
    column(
      [
        mono('min(1, (count / 100)^0.75)', { size: 34 }),
        note('frequent observed cells receive more weight'),
      ],
      { gap: 'wide' },
    ),
    LOW,
    'left',
  );
  const weightValues = rows.map((r, i) =>
    place(mono('weight ' + fmt(r.weight), { size: 34 }), lanes[i].inset('tight'), 'top right'),
  );
  const weightBars = dynamic(() =>
    rows.map((r, i) =>
      rect(Math.max(1, p.plot.width * r.weight * weight.value), 12, {
        fill: 'cyan',
        stroke: 'cyan',
      }).moveTo([p.plot.left + (p.plot.width * r.weight * weight.value) / 2, lanes[i].cy]),
    ),
  );
  const backing = rect(p.plot.width - 8, p.plot.height - 8, {
    fill: 'surface',
    stroke: 'surface',
  }).moveTo(p.plot.point('center'));
  c.take(p.frame);
  s.add(heading(c.title), p.nodes, backing, rulers, marks, inputs, laneNames);
  c.on('score', () => s.play(span.to(0.15, { duration: 1 })));
  c.show('targets', [targets, residual]);
  c.on('targets', () => s.play(span.to(1, { duration: 1.6 })));
  c.show('zero', zero, { after: true });
  c.show('error', error, { after: true });
  c.hide('weights', [zero, error]);
  c.show('weights', weights);
  c.hide('weight-values', [marks, targets]);
  c.swap('weight-values', p.foot, place(note('Count weight from 0 to 1'), FOOT));
  c.show('weight-values', [weightBars, weightValues], { after: true });
  c.after('weight-values', () => s.play(weight.to(1, { duration: 1.2 })));
  c.keep(p.frame);
}
