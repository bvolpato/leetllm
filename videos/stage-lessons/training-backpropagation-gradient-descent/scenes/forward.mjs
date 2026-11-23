import { column, dynamic, line, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { reverseTrace } from '../../../films/training-backpropagation-gradient-descent/model.mjs';
import { example } from '../parts.mjs';
import { latencyStrip, work } from '../latency.mjs';

export default function forward(s, c) {
  const m = reverseTrace();
  const p = latencyStrip(s, m.prediction, example.target);
  const [arithmetic, drawing] = work.columns([1, 1], 'loose');
  const [formula, residual, loss] = arithmetic.rows(3, 'normal');
  const input = place(mono('complexity   x = ' + example.x, { size: 46 }), formula);
  const weight = place(mono('w × x   =   1 × 2', { color: 'blue', size: 46 }), formula);
  const bias = place(mono('w × x + b   =   2 + 0', { color: 'cyan', size: 46 }), formula);
  const error = place(
    column([
      note('prediction minus measurement'),
      mono(m.prediction + ' − ' + example.target + ' = ' + m.residual + ' ms', {
        size: 50,
        color: 'yellow',
      }),
    ]),
    residual,
  );
  const score = place(mono('loss = ' + m.loss + ' ms²', { size: 56, color: 'yellow' }), loss);
  const [unitRegion, squareRegion, captionRegion] = drawing.rows([1, 5, 1], 'normal');
  const n = Math.abs(m.residual);
  const unit = Math.min(squareRegion.height, squareRegion.width) / n;
  const [cx, cy] = squareRegion.point('center');
  const left = cx - (n * unit) / 2,
    top = cy - (n * unit) / 2;
  const fill = s.value(0);
  const cells = Array.from({ length: n * n }, (_, i) => {
    const center = [left + ((i % n) + 0.5) * unit, top + (Math.floor(i / n) + 0.5) * unit];
    return rect(unit - 3, unit - 3, { fill: 'blue', stroke: 'surface' }).moveTo(center);
  });
  const half = dynamic(() => {
    const height = Math.max(0.1, (n * unit * fill.value) / 2);
    return rect(n * unit, height, { fill: 'yellow', stroke: 'yellow' }).moveTo([
      cx,
      top + height / 2,
    ]);
  });
  const width = line([left, top - 9], [left + n * unit, top - 9], { stroke: 'blue', width: 5 });
  const side = place(note(n + ' ms on each side'), unitRegion);
  const area = place(label(n * n + ' square milliseconds'), captionRegion);
  const halfLabel = place(label('half the area'), captionRegion);
  c.take(p.picture);
  s.add(heading(c.title));
  c.show('forward-input', input);
  c.swap('forward-weight', input, weight);
  c.swap('forward-bias', weight, bias);
  c.show('forward-error', error);
  c.show('forward-square', [cells, side, width]);
  c.show('forward-area', area);
  c.swap('forward-half', area, halfLabel);
  c.show('forward-half', half);
  c.on('forward-half', () => s.play(fill.to(1, { duration: 0.8 })));
  c.show('forward-score', score);
}
