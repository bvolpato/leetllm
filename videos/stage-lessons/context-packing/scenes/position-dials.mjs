import { circle, dynamic, line, place, polyline } from 'vizmatic/stage';
import { heading, area, label, mono } from '../../kit-narrated.mjs';
import { longContextModel } from '../../../films/context-packing/construction.mjs';

export default function positionDials(s, c) {
  const model = longContextModel('position-dials', {});
  const [legend, bands, result] = area.rows([0.8, 4.2, 1], 'tight');
  const [keyLabel, queryLabel] = legend.columns(2, 'wide');
  const separation = s.value(0), uniform = s.value(0), ramp = s.value(0);
  const extension = model.target / model.train;
  const format = value => value.toLocaleString('en-US');

  s.add(heading(c.title),
    place(label('Key at position 1', { color: 'yellow', size: 47 }), keyLabel, 'right'),
    dynamic(() => {
      const text = separation.value === 0 ? 'Query at position 1' :
        separation.value === 1 ? 'Query at position 2' : 'Moving query to position 2';
      return [place(label(text, { color: 'blue', size: 47 }), queryLabel, 'left')];
    }));
  const original = place(label('Angle = position × frequency'), result);
  const eighths = place(label(`${format(model.train)} → ${format(model.target)} positions   ·   each position ÷ ${extension}`), result);
  const mapped = place(mono(`${format(model.position)} ÷ ${extension} = ${format(model.mapped)}`), result);
  const blended = place(label('Example YaRN bands   ·   original fast step, interpolated slow step'), result);
  s.add(original);

  const regions = bands.columns(3, 'normal');
  for (const [i, [band, frequency]] of [['Fast', 1], ['Middle', 0.2], ['Slow', 0.04]].entries()) {
    const [name, body, foot] = regions[i].rows([0.65, 4, 0.8], 'tight');
    const [x, y] = body.point('center');
    const radius = Math.min(body.width, body.height) * 0.46;
    const point = (angle, length) => [x + Math.cos(angle) * length, y - Math.sin(angle) * length];
    s.add(place(label(band, { size: 42 }), name),
      circle(radius, { stroke: 'dim', fill: null, width: 3 }).moveTo([x, y]),
      line([x, y], point(0, radius), { stroke: 'dim', width: 2 }),
      dynamic(() => {
        const compressed = 1 + uniform.value * (1 / extension - 1);
        const scale = compressed + ramp.value * (model.step[i] - 1 / extension);
        const keyAngle = frequency * scale;
        const gap = separation.value * keyAngle;
        const nodes = [
          line([x, y], point(keyAngle + gap, radius), { stroke: 'blue', width: 10 }),
          line([x, y], point(keyAngle, radius * 0.82), { stroke: 'yellow', width: 8 }),
          place(mono(`Gap  ${Number(gap.toFixed(3))} rad`, { size: 38 }), foot),
        ];
        if (gap > 0) {
          const arc = Array.from({ length: 17 }, (_, j) => point(keyAngle + gap * j / 16, radius * 0.65));
          nodes.push(polyline(arc, { stroke: 'ink', width: 4 }));
        }
        return nodes;
      }));
  }
  c.on('position-dials-0', () => s.play(separation.to(1, { duration: 1.35 })));
  c.swap('compress', original, eighths);
  c.on('compress', () => s.play(uniform.to(1, { duration: 1.25 })));
  c.swap('mapped', eighths, mapped, { after: true });
  c.swap('position-dials-2', mapped, blended);
  c.on('position-dials-2', () => s.play(ramp.to(1, { duration: 1.25 })));
}
