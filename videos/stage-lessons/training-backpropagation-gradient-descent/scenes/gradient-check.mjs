import { axes, column, dot, dynamic, line, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { finiteDifference } from '../../../films/training-backpropagation-gradient-descent/model.mjs';
import { lossAt } from '../../../films/training-backpropagation-gradient-descent/arithmetic.mjs';

export default function gradientCheck(s, c) {
  const m = finiteDifference();
  const leftWeight = 1 - m.epsilon;
  const rightWeight = 1 + m.epsilon;
  const [body, foot] = area.rows([5, 1], 'loose');
  const [left, right] = body.columns([3, 2], 'loose');
  const ax = place(
    axes({
      x: [0.982, 1.018],
      y: [7.86, 8.14],
      width: left.width * 0.8,
      height: left.height * 0.7,
      labels: false,
      grid: true,
      tips: false,
    }),
    left,
  );
  ax.plot(lossAt, { stroke: 'cyan', width: 4 });
  const eps = s.value(0);
  const samples = dynamic(() => [
    dot(13, 'blue').moveTo(ax.world(1 - eps.value, lossAt(1 - eps.value))),
    dot(13, 'pink').moveTo(ax.world(1 + eps.value, lossAt(1 + eps.value))),
  ]);
  const blue = ax.world(leftWeight, m.minus);
  const pink = ax.world(rightWeight, m.plus);
  const corner = ax.world(rightWeight, m.minus);
  const changes = [
    line(blue, corner, { stroke: 'blue', width: 4 }),
    line(corner, pink, { stroke: 'pink', width: 4 }),
    line(blue, pink, { stroke: 'yellow', width: 4 }),
  ];
  const premise = place(
    column(
      [label('Bias stays at zero'), mono(`w = 1 ± ${m.epsilon}`), note('Weight →     Loss ↑')],
      { gap: 'wide' },
    ),
    right,
    'top',
  );
  const readings = place(
    column(
      [
        mono(`L(${leftWeight}) = ${m.minus.toFixed(4)}`, { size: 44, color: 'blue' }),
        mono(`L(${rightWeight}) = ${m.plus.toFixed(4)}`, { size: 44, color: 'pink' }),
      ],
      { gap: 'wide' },
    ),
    right,
    'bottom',
  );
  const quotient = `${(m.plus - m.minus).toFixed(2)} / ${(2 * m.epsilon).toFixed(2)}`;
  const pending = place(
    mono(`Change in loss / change in weight = ${quotient} = ?`, { size: 46 }),
    foot,
  );
  const answer = place(
    mono(`${quotient} = ${m.numerical.toFixed(0)}     Backpropagation: ${m.analytic}`, {
      size: 52,
      color: 'yellow',
    }),
    foot,
  );

  s.add(heading(c.title), ax, samples, premise);
  c.on('check-minus', () => s.play(eps.to(m.epsilon, { duration: 1.5 })));
  c.show('check-readings', readings);
  c.show('check-ratio', [changes, pending]);
  c.swap('check-match', pending, answer, { after: true });
}
