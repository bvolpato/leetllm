import { axes, column, dot, dynamic, line, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { updateOnce } from '../../../films/training-backpropagation-gradient-descent/model.mjs';
import { latencyStrip, work } from '../latency.mjs';

export default function learningRate(s, c) {
  const title = heading(c.title);
  const [top, body, foot] = area.rows([1, 5, 1], 'normal');
  const [plot, readouts] = body.columns([3, 2], 'wide');
  const rule = place(mono('next residual = [1 − η(x² + 1)] × old residual', { size: 42 }), top);
  const axis = place(
    axes({
      x: [0, 3.2],
      y: [-10, 15],
      xStep: 1,
      yStep: 5,
      width: plot.width * 0.86,
      height: plot.height * 0.78,
      labels: false,
      tips: false,
      grid: true,
    }),
    plot,
  );
  const tickLabels = [
    ...[0, 1, 2, 3].map((step) => {
      const [x, y] = axis.world(step, -10);
      return mono(String(step), { size: 32, color: 'dim' }).moveTo([x, y + 38]);
    }),
    ...[-10, -5, 0, 5, 10, 15].map((r) => {
      const [x, y] = axis.world(0, r);
      return mono(String(r), { size: 32, color: 'dim' }).moveTo([x - 60, y]);
    }),
  ];
  const zero = line(axis.world(0, 0), axis.world(3.1, 0), { stroke: 'dim', width: 4 });
  const axisName = place(note('Training step →     Signed residual in ms ↑'), foot);
  const slots = readouts.rows(4, 'normal');
  const curves = [0.1, 0.2, 0.4, 0.5].map((rate, i) => {
    const color = ['blue', 'green', 'yellow', 'pink'][i];
    const { multiplier, residual } = updateOnce(rate);
    const at = (k) => residual * multiplier ** k;
    const progress = s.value(0);
    const trace = dynamic(() => {
      const lines = [];
      for (let k = 0; k < Math.ceil(progress.value); k++) {
        const t = Math.min(progress.value - k, 1);
        lines.push(
          line(axis.world(k, at(k)), axis.world(k + t, at(k) + t * (at(k + 1) - at(k))), {
            stroke: color,
            width: 6,
          }),
        );
      }
      for (let k = 0; k <= Math.floor(progress.value); k++)
        lines.push(dot(10, color).moveTo(axis.world(k, at(k))));
      return lines;
    });
    const name = place(mono('η ' + rate + '    × ' + multiplier, { size: 43, color }), slots[i]);
    return {
      name,
      trace,
      run: () => {
        for (let k = 1; k <= 3; k++) s.play(progress.to(k, { duration: 0.7 }));
      },
    };
  });
  const m = updateOnce(0.1, { x: -2, weight: -1, bias: 0, target: 6 });
  const p = latencyStrip(s, m.prediction, 6);
  const old = place(
    column(
      [
        mono('w = −1     x = −2     b = 0', { size: 48 }),
        label('If the prediction is too low, which way should the weight move?'),
      ],
      { gap: 'wide' },
    ),
    work,
  );
  const next = place(
    column(
      [
        mono('∂L/∂w = (−4) × (−2) = +8', { size: 48 }),
        mono('w = −1.8     b = 0.4', { size: 53, color: 'blue' }),
      ],
      { gap: 'wide' },
    ),
    work,
  );
  const valley = place(label('Exact fits on this one request   ·   2w + b = 6'), foot);
  s.add(title, axis, tickLabels, zero, axisName, dot(13, 'ink').moveTo(axis.world(0, -4)));
  c.show('rate-rule', rule);
  for (const [i, cue] of [
    'rate-contract',
    'rate-exact',
    'rate-boundary',
    'rate-diverge',
  ].entries()) {
    c.show(cue, [curves[i].name, curves[i].trace]);
    c.on(cue, curves[i].run);
  }
  c.swap('rate-valley', axisName, valley);
  c.swapAll('rate-sign', [p.picture, old], { keep: [title] });
  c.swap('rate-sign-step', old, next);
  c.on('rate-sign-payoff', () => s.play(p.model.to(m.nextPrediction, { duration: 1.1 })));
}
