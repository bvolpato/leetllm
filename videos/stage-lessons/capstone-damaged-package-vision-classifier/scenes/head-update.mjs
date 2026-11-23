import { dot, line, place, table, to } from 'vizmatic/stage';
import { area, heading } from '../../kit-narrated.mjs';
import { caption } from '../inspection.mjs';
import { visionHead } from '../../../films/capstone-damaged-package-vision-classifier/arithmetic.mjs';

export default function scene(s, c) {
  const m = visionHead();
  const [gradient, body, rule, rail, result] = area.rows([1, 4, 1, 1.4, 1], 'normal');
  const names = ['Weight 1', 'Weight 2', 'Bias'];
  const factors = [...m.features, 1],
    before = [...m.weights, m.bias],
    after = [...m.nextWeights, m.nextBias];
  const gradients = [...m.gradients, m.logitGradient];
  const parameters = place(
    table(
      [
        { key: 'id', label: 'Parameter' },
        { key: 'value', label: 'Before' },
        { key: 'factor', label: 'Multiplier' },
        { key: 'grad', label: 'Gradient', sample: '−1.4621' },
        { key: 'next', label: 'After', sample: '−0.9269' },
      ],
      names.map((id, i) => ({
        id,
        value: before[i].toFixed(2),
        factor: factors[i],
        grad: null,
        next: null,
      })),
      { width: body.width * 0.92, size: 39 },
    ),
    body,
  );
  const prompt = caption(rule, 'Subtract 0.10 × gradient. Which weight goes down?', 'yellow');
  const [begin, track, end] = rail.columns([1, 4, 1], 'normal');
  const position = (z) => [track.left + (z + 1) * track.width, track.cy];
  const mark = dot(20, 'yellow').moveTo(position(m.logit));
  const axis = line(position(-1), position(0), { stroke: 'grid', width: 5 });
  s.add(
    heading(c.title),
    parameters,
    caption(begin, 'Logit   −1', 'dim', 36),
    axis,
    mark,
    caption(end, '0', 'dim', 36),
  );
  c.show(
    'gradient',
    caption(
      gradient,
      'Logit gradient   =   p − target   ≈   ' + m.logitGradient.toFixed(4),
      'blue',
    ),
    { after: true },
  );
  c.after('factors', () =>
    s.play(...names.map((id, i) => parameters.setCell(id, 'grad', gradients[i].toFixed(4)))),
  );
  c.show('ask', prompt);
  c.after('update', () =>
    s.play(...names.map((id, i) => parameters.setCell(id, 'next', after[i].toFixed(4)))),
  );
  c.swap(
    'update',
    prompt,
    caption(rule, 'Same features [2, −1]     •     Recompute with the updated head', 'dim', 37),
    { after: true },
  );
  c.after('logit', () =>
    s.play(to(mark, (n) => n.moveTo(position(m.nextLogit)), { duration: 0.6 })),
  );
  const z = caption(result, 'New logit   ' + m.nextLogit.toFixed(4), 'yellow');
  c.show('logit', z, { after: true });
  c.swap(
    'loss',
    z,
    caption(
      result,
      'p  ≈  ' +
        m.nextProbability.toFixed(4) +
        '       Loss   ' +
        m.loss.toFixed(4) +
        '  →  ' +
        m.nextLoss.toFixed(4),
      'yellow',
    ),
    { after: true },
  );
}
