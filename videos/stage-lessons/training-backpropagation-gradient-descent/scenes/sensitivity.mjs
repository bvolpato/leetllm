import {
  axes,
  column,
  decimal,
  dot,
  dynamic,
  indicate,
  line,
  place,
  row,
  rect,
  tangentLine,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { reverseTrace } from '../../../films/training-backpropagation-gradient-descent/model.mjs';
export default function sensitivity(s, c) {
  const m = reverseTrace();
  const [body, foot] = area.rows([5, 2], 'loose');
  const [left, right] = body.columns([3, 2], 'loose');
  const [head, plotArea] = left.rows([1, 5], 'wide');
  const p = s.value(m.prediction);
  const ax = place(
    axes({
      x: [0, 8],
      y: [0, 18],
      width: plotArea.width * 0.84,
      height: plotArea.height * 0.8,
      xStep: 2,
      yStep: 8,
      labelSize: 34,
      tips: false,
    }),
    plotArea,
  );
  ax.plot((x) => 0.5 * (x - 6) ** 2, { stroke: 'cyan', width: 4 });
  const point = dynamic(() => dot(14, 'blue').moveTo(ax.world(p.value, 0.5 * (p.value - 6) ** 2)));
  const tangent = dynamic(() => {
    const x = p.value,
      y = 0.5 * (x - 6) ** 2,
      slope = x - 6;
    return line(ax.world(x - 0.6, y - 0.6 * slope), ax.world(x + 0.6, y + 0.6 * slope), {
      stroke: 'yellow',
      width: 3,
    });
  });
  const name = place(label('Prediction → loss'), head);
  const [r0, r1, r2] = right.rows([1.5, 1, 3], 'wide');
  const premise = place(
    column([mono('x = 2'), mono('target = 6 ms', { color: 'pink' })], { gap: 'normal' }),
    r0,
  );
  const slope = place(mono(`at 2: slope ${m.gradPrediction}`, { color: 'yellow' }), r1);
  const [comparisonHead, comparisonBody] = r2.rows([1, 3], 'normal');
  const question = place(note('Equal ε nudges → prediction displacement'), comparisonHead);
  const displacement = s.value(0);
  const lanes = comparisonBody.rows(2, 'wide');
  const results = [];
  const comparison = lanes.flatMap((r, i) => {
    const [name, mark, result] = r.columns([1.3, 3, 0.7], 'normal');
    const color = i === 0 ? 'blue' : 'cyan';
    const parameter = place(mono(i === 0 ? 'w + ε' : 'b + ε', { size: 34, color }), name);
    const start = mark.point('left');
    const baseline = line(start, mark.point('right'), { stroke: 'grid', width: 3 });
    const bar = dynamic(() => {
      const width = Math.max(2, mark.width * displacement.value * (i === 0 ? 1 : 0.5));
      return rect(width, 24, { fill: color, stroke: color }).moveTo([
        start[0] + width / 2,
        start[1],
      ]);
    });
    results.push(place(mono(i === 0 ? '2ε' : 'ε', { size: 34, color }), result));
    return [parameter, baseline, bar];
  });
  const [a, b] = foot.columns(2, 'loose');
  const weight = place(
    column(
      [
        mono('∂prediction / ∂w = 2', { color: 'blue' }),
        mono(`∂loss / ∂w = ${m.gradWeight}`, { color: 'yellow' }),
      ],
      { gap: 'wide' },
    ),
    a,
  );
  const bias = place(
    column(
      [
        mono('∂prediction / ∂b = 1', { color: 'cyan' }),
        mono(`∂loss / ∂b = ${m.gradBias}`, { color: 'yellow' }),
      ],
      { gap: 'wide' },
    ),
    b,
  );

  s.add(heading(c.title), ax, point, name, premise, question, comparison);
  c.on('sensitivity-nudge', () => s.play(p.to(2.4, { duration: 1.5 })));
  c.show('sensitivity-slope', tangent);
  c.on('sensitivity-slope-result', () => s.play(p.to(2, { duration: 0.6 })));
  c.show('sensitivity-slope-result', slope, { after: true });
  c.on('sensitivity-compare', () => s.play(indicate(question, { scale: 1 })));
  c.show('sensitivity-weight', weight.nodes[0], { after: true });
  c.on('sensitivity-weight', () => s.play(displacement.to(1, { duration: 1.2 })));
  c.show('sensitivity-weight', results, { after: true });
  c.on('sensitivity-gradients', () => s.play(p.to(2, { duration: 0.6 })));
  c.show('sensitivity-gradients', [weight.nodes[1], bias], { after: true });
}
