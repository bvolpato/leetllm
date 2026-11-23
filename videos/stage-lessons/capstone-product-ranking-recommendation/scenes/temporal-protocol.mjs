import { beside, dot, draw, line, place } from 'vizmatic/stage';
import { mono, note } from '../../kit-narrated.mjs';
import { open } from '../parts.mjs';

export default function temporalProtocol(s, c) {
  const [header, chart, summary] = open(s, c).rows([1, 6, 1], 'wide');
  const [ids, plot] = chart.columns([1, 4], 'wide');
  const rows = [
    ['TRAIN-1', 1.5, 2.375],
    ['TRAIN-2', 2.5, 3.375],
    ['TRAIN-3', 3.5, 4.375],
    ['PENDING-4', 4.5, 5.5],
    ['VALID-5', 5.5, 6.375],
    ['VALID-6', 6.5, 6.75],
    ['TEST-7', 7.5, 8.375],
    ['TEST-8', 8.5, 9.375],
  ];
  const x = (d) => plot.left + ((d - 1) * plot.width) / 9.25;
  const slots = plot.rows(8, 'normal'),
    names = ids.rows(8, 'normal');
  const trainingFreeze = 5;
  const requestNames = rows.map(([id], i) => place(mono(id, { size: 28 }), names[i]));
  const keys = header.columns(3, 'normal');
  s.add(
    place(note('8 requests × 3 products'), keys[0]),
    place(note('Cyan = served'), keys[1]),
    place(note('White = label ready'), keys[2]),
  );
  c.show(
    'temporal-rows',
    rows.flatMap(([, d], i) => [
      requestNames[i],
      dot(9, 'cyan').moveTo([x(d), slots[i].cy]),
    ]),
  );
  c.show(
    'temporal-clocks',
    rows.flatMap(([, d, end], i) => [
      line([x(d), slots[i].cy], [x(end), slots[i].cy], { stroke: 'dim', width: 4 }),
      dot(8, 'ink').moveTo([x(end), slots[i].cy]),
    ]),
  );
  c.show(
    'temporal-windows',
    [trainingFreeze, 7, 10].flatMap((d) => [
      line([x(d), chart.top], [x(d), chart.bottom], { stroke: 'yellow', width: 3 }),
      note('May ' + d, { size: 26 }).moveTo([x(d), chart.top - 22]),
    ]),
  );
  const freeze = place(note('Every label must arrive strictly before its label freeze.'), summary);
  const counts = place(
    mono('3 train     •     2 validation     •     2 test', { size: 35 }),
    summary,
  );
  c.show('temporal-freeze', freeze);
  c.swap('temporal-counts', freeze, counts);
  const pendingIndex = rows.findIndex(([id]) => id === 'PENDING-4');
  const labelReady = rows[pendingIndex][2];
  const hoursLate = (labelReady - trainingFreeze) * 24;
  const y = slots[pendingIndex].cy;
  const delay = line([x(trainingFreeze), y], [x(labelReady) - 8, y], { stroke: 'pink', width: 8 });
  c.on('temporal-pending', () => s.play(draw(delay, { duration: 0.75 })));
  c.show(
    'temporal-late',
    beside(
      note(`Excluded (labels arrived ${hoursLate} hours late)`, { color: 'pink' }),
      requestNames[pendingIndex], 'right', 'normal',
    ),
    { after: true },
  );
}
