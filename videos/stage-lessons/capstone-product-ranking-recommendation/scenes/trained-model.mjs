import { axes, dynamic, place, polyline } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { open } from '../parts.mjs';
import { FITS } from '../../../films/capstone-product-ranking-recommendation/fitted-models.mjs';
import { TEST_REQUESTS } from '../../../films/capstone-product-ranking-recommendation/fixtures.mjs';
import { evaluatedRanking } from '../../../films/capstone-product-ranking-recommendation/model.mjs';

export default function trainedModel(s, c) {
  const [left, right] = open(s, c).columns([1.25, 1], 'wide');
  const [caption, plot, legend] = left.rows([1, 5, 1], 'normal'),
    rows = right.rows(6, 'normal');
  const a = place(
    axes({
      x: [0, 600],
      y: [0, 9],
      width: 620,
      height: 360,
      xStep: 300,
      yStep: 3,
      labelSize: 28,
      tips: false,
    }),
    plot,
  );
  const colors = ['blue', 'cyan'],
    step = s.value(0);
  const weights = FITS[1].weights;
  const mean = (weights) =>
    TEST_REQUESTS.reduce((sum, r) => sum + evaluatedRanking(r, weights).ndcg, 0) /
    TEST_REQUESTS.length;
  s.add(
    a,
    place(note('Quality coefficient by training step'), caption),
    place(note('Blue  λ = 0      Cyan  λ = 0.1'), legend),
    place(label('Two candidate fits'), rows[0]),
  );
  s.add(
    dynamic(() =>
      FITS.flatMap((fit, i) => {
        const n = Math.round(step.value);
        if (n === 0) return [];
        const points = [a.world(0, 0)];
        for (let j = 5; j < n; j += 5) points.push(a.world(j, fit.history[j][1]));
        points.push(a.world(n, fit.history[n][1]));
        return [polyline(points, { stroke: colors[i], width: 6 })];
      }),
    ),
  );
  c.on('model-fit', () => s.play(step.to(600, { duration: 3 })));
  c.show('model-choose', place(note('Validation NDCG   1.000 / 1.000'), rows[1]));
  c.show('model-selected', place(mono('Tie-break → λ = 0.1', { color: 'cyan' }), rows[2]), { after: true });
  c.show(
    'model-weights',
    place(mono('w = [' + weights.map((x) => x.toFixed(3)).join(', ') + ']', { size: 35 }), rows[3]),
  );
  c.show(
    'model-test',
    place(
      mono('Test   ' + mean([1, 0]).toFixed(3) + ' → ' + mean(weights).toFixed(3), {
        size: 36,
        color: 'green',
      }),
      rows[4],
    ),
  );
  c.show('model-separate', place(note('Synthetic holdout • two requests'), rows[5]));
}
