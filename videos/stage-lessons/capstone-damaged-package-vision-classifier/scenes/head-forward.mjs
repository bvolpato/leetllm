import { place, table } from 'vizmatic/stage';
import { area, heading } from '../../kit-narrated.mjs';
import { caption } from '../inspection.mjs';
import { visionHead } from '../../../films/capstone-damaged-package-vision-classifier/arithmetic.mjs';

export default function scene(s, c) {
  const m = visionHead();
  const [inputs, sum, outputs] = area.rows([4, 1.2, 2], 'wide');
  const [p, loss] = outputs.columns(2, 'wide');
  const field = place(
    table(
      [
        { key: 'id', label: 'Head input' },
        { key: 'value', label: 'Feature value' },
        { key: 'weight', label: 'Weight' },
        { key: 'term', label: 'Contribution', sample: '−0.50' },
      ],
      m.features.map((x, i) => ({
        id: 'Feature ' + (i + 1),
        value: x,
        weight: m.weights[i],
        term: null,
      })),
      { width: inputs.width * 0.85, size: 45 },
    ),
    inputs,
  );
  const bias = caption(sum, 'Add the two products, then add the bias of −1.', 'yellow');
  const z = caption(sum, 'Logit   =   0.50 − 0.50 − 1   =   ' + m.logit, 'yellow', 48);
  s.add(heading(c.title), field, bias);
  c.after('first', () => s.play(field.setCell('Feature 1', 'term', m.products[0].toFixed(2))));
  c.after('second', () => s.play(field.setCell('Feature 2', 'term', m.products[1].toFixed(2))));
  c.swap('logit', bias, z, { after: true });
  c.show('probability', caption(p, 'Sigmoid(−1)  ≈  ' + m.probability.toFixed(4), 'blue', 46), {
    after: true,
  });
  c.show('loss', caption(loss, 'Loss  =  −ln(p)  ≈  ' + m.loss.toFixed(4), 'yellow', 46), {
    after: true,
  });
}
