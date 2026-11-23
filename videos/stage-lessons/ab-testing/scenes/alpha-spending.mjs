import { assertEqual, axes, column, dot, dynamic, line, place } from 'vizmatic/stage';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { alphaSpend } from '../../../films/ab-testing/model.mjs';

export default function spending(s, c) {
  const [scope, plot, reading, foot] = area.rows([0.9, 3.7, 1, 0.95], 'normal');
  const limit = 0.05;
  const fraction = s.value(0);
  const axis = place(
    axes({
      x: [0, 1],
      y: [0, 5.1],
      width: plot.width * 0.77,
      height: plot.height * 0.85,
      labels: false,
      ticks: false,
      tips: false,
    }),
    plot,
  );
  axis.plot((t) => 100 * alphaSpend(t), { to: () => fraction.value, stroke: 'cyan', width: 6 });
  const cumulative = dynamic(() =>
    dot(15, 'yellow').moveTo(axis.world(fraction.value, 100 * alphaSpend(fraction.value))),
  );
  const unit = place(label('Cumulative false-alarm budget under no effect'), scope);
  const cap = line(axis.world(0, 5), axis.world(1, 5), { stroke: 'dim', width: 3, dash: [9, 8] });
  const capLabel = note('5%', { color: 'yellow' }).moveTo([
    axis.world(0, 5)[0] - 64,
    axis.world(0, 5)[1],
  ]);
  const tickLabels = [0, 0.5, 1].map((t) =>
    mono(String(t), { size: 32 }).moveTo([axis.world(t, 0)[0], axis.world(t, 0)[1] + 30]),
  );
  const amount = dynamic(() =>
    place(
      mono(
        Math.round(fraction.value * 100) +
          '% of planned information     ' +
          (100 * alphaSpend(fraction.value)).toFixed(2) +
          '% cumulative error',
        { size: 41, color: 'cyan' },
      ),
      reading,
    ),
  );
  const formula = place(mono('A(t) = 2 × [1 − Φ(1.96 / √t)]    for t > 0', { size: 36 }), foot);
  assertEqual((100 * alphaSpend(0.5)).toFixed(2), '0.56', 'half-information spending');
  assertEqual(alphaSpend(1).toFixed(2), limit.toFixed(2), 'full spending');
  s.add(heading(c.title), axis, cap, capLabel, tickLabels, cumulative, amount, unit);
  c.on('half', () => s.play(fraction.to(0.5, { duration: 1.6 })));
  c.on('full', () => s.play(fraction.to(1, { duration: 1.6 })));
  c.show('function', formula);

  const [names, rules, decisions] = plot.columns([1.45, 3.6, 1.25], 'wide');
  const lanes = rules.rows(2, 'wide');
  const x = (z) => rules.point('left')[0] + ((z - 1.9) / 0.21) * rules.width;
  const z = 2.0;
  const cutoffs = [1.96, 2.045];
  const plans = cutoffs.map((cutoff, i) => {
    const y = lanes[i].point('center')[1];
    const crosses = z >= cutoff;
    return {
      guide: [
        place(
          column(
            [
              label(i ? 'Six looks' : 'One look', { size: 44 }),
              note(i ? 'no earlier crossing' : 'final analysis'),
            ],
            { gap: 'tight' },
          ),
          names.rows(2, 'wide')[i],
        ),
        line([x(1.9), y], [x(2.11), y], { stroke: 'grid', width: 5 }),
        line([x(cutoff), y - 31], [x(cutoff), y + 31], { stroke: 'yellow', width: 5 }),
        mono(String(cutoff), { size: 40, color: 'yellow' }).moveTo([x(cutoff), y - 62]),
      ],
      value: dot(14, 'cyan').moveTo([x(z), y]),
      decision: place(
        chip(crosses ? 'Reject' : 'No rejection', { color: crosses ? 'cyan' : 'dim' }),
        decisions.rows(2, 'wide')[i],
      ),
    };
  });
  const boundary = place(label('Final positive z boundary for each plan'), scope);
  const observed = place(mono('Observed final z = 2.00', { size: 52, color: 'cyan' }), reading);
  const ask = place(label('Which plan rejects the no-effect null?', { color: 'yellow' }), foot);
  c.swapAll('two-plans', [
    heading('The same final result under two plans'),
    boundary,
    plans[0].guide,
  ]);
  c.show('six', plans[1].guide);
  c.show('statistic', [observed, ...plans.map((p) => p.value)]);
  c.show('question', ask);
  c.hide('ordinary', ask);
  c.show('ordinary', plans[0].decision, { after: true });
  c.show('sequential', plans[1].decision, { after: true });
}
