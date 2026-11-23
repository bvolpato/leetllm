import { dynamic, place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { open } from '../parts.mjs';
import { TRAINING_PAIRS } from '../../../films/capstone-product-ranking-recommendation/training-data.mjs';
import { meanPairGradient } from '../../../films/capstone-product-ranking-recommendation/model.mjs';

export default function trainingMatrix(s, c) {
  const [table, work] = open(s, c).columns([1, 1], 'loose');
  const rows = table.rows(10, 'normal'),
    stages = work.rows(5, 'wide');
  const count = s.value(0);
  s.add(
    place(note('Request       Pair       Δmatch    Δquality'), rows[0]),
    place(label('First full gradient step'), stages[0]),
  );
  c.on('training-pairs', () => s.play(count.to(9, { duration: 2.2 })));
  s.add(
    dynamic(() =>
      TRAINING_PAIRS.slice(0, Math.round(count.value)).map((p, i) =>
        place(
          mono(
            p.request +
              '     ' +
              p.better +
              ' > ' +
              p.worse +
              '     ' +
              p.difference.map((x) => x.toFixed(2)).join('     '),
            { size: 29, color: ['blue', 'cyan', 'green'][Math.floor(i / 3)] },
          ),
          rows[i + 1],
        ),
      ),
    ),
  );
  const gradient = meanPairGradient([0, 0]);
  const vector = (v, n) => '[' + v.map((x) => x.toFixed(n)).join(', ') + ']';
  c.show(
    'training-gradient',
    place(mono('Mean ∇  ' + vector(gradient, 5), { size: 33 }), stages[1]),
  );
  c.show(
    'training-update',
    place(
      mono(
        '−0.3∇  ' +
          vector(
            gradient.map((x) => -0.3 * x),
            4,
          ),
        { size: 34, color: 'yellow' },
      ),
      stages[2],
    ),
  );
  c.show('training-weights', place(note('Each row contributes 1/9 of the gradient.'), stages[3]));
  c.show('training-scale', place(note('Fit any feature scaling on training rows.'), stages[4]));
}
