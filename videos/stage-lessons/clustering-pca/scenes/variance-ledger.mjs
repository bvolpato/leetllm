import {
  place,
  column,
  row,
  grid,
  beside,
  boxOf,
  line,
  arrow,
  circle,
  dot,
  rect,
  group,
  dynamic,
  to,
  draw,
  indicate,
  recolor,
  fade,
  matrix,
  tex,
  stateGrid,
  appear,
  decimal,
  barChart,
  scatter,
  assertEqual,
} from 'vizmatic/stage';
import {
  area,
  heading,
  label,
  note,
  mono,
  para,
  namedBox,
  chip,
  tint,
} from '../../kit-narrated.mjs';
import {
  IDS,
  COLORS,
  STATE,
  left,
  right,
  ribbon,
  body,
  foot,
  cloud,
  identity,
  messageKey,
  rings,
  links,
  scoreBars,
  liveNumber,
  xy,
  messages,
  labels,
  seeds,
  centroids,
  pca,
  query,
  clusterTrials,
  transferDocuments,
  transferQuery,
  scaleFixture,
  means,
  stds,
  inertia,
  initialInertia,
  updatedInertia,
  coarseDistances,
  distance,
  mix,
  silhouette,
  lloyd,
  seedMass,
  emptyCenterRepair,
  energyRows,
  scaleCalculation,
  cosine,
  validateModel,
} from '../parts.mjs';

export default function scene(s, c) {
  const rows = energyRows(),
    r = rows[2];
  const coords = rows.map((r) => r.centered);
  const original = cloud(left, { assigned: true });
  c.take(original.chart);
  const m = cloud(left, { equal: true, coords, x: [-5, 5], y: [-3, 3], assigned: true });
  const vector = arrow(m.p([0, 0]), m.p(r.centered), { stroke: 'ink', width: 5 }).zIndex(-2);
  const projection = arrow(m.p([0, 0]), m.p(r.foot), { stroke: 'yellow', width: 5 }).zIndex(-2);
  const residual = line(m.p(r.foot), m.p(r.centered), { stroke: 'red', width: 5 }).zIndex(-2);
  const [a, b, d] = right.rows(3, 'normal');
  const retained = scoreBars(
    a,
    IDS,
    IDS.map(() => 0),
    {
      max: Math.max(...rows.map((r) => r.total)),
      showValues: false,
      colors: IDS.map(() => 'yellow'),
    },
  );
  const discarded = scoreBars(
    b,
    IDS,
    IDS.map(() => 0),
    { max: Math.max(...rows.map((r) => r.total)), showValues: false, colors: IDS.map(() => 'red') },
  );
  const total = rows.reduce((sum, r) => sum + r.total, 0),
    kept = rows.reduce((sum, r) => sum + r.retained, 0);
  const equation = place(tex('\\|x_c\\|^2=z^2+\\|r\\|^2', { size: 40 }), d);
  const amountRows = d.rows(3, 'tight');
  const totalAmount = place(mono('total ' + total.toFixed(3), { size: 34 }), amountRows[0]);
  const keptAmount = place(
    mono('kept ' + kept.toFixed(3), { size: 34, color: 'yellow' }),
    amountRows[1],
  );
  const lostAmount = place(
    mono('lost ' + pca.residual.toFixed(3), { size: 34, color: 'red' }),
    amountRows[2],
  );
  const originNote = place(
    note('Move the origin to the fitted mean; keep the same coordinate scale.'),
    foot,
  );
  const variance = place(
    mono('sample variance = energy / ' + (rows.length - 1), { size: 30 }),
    foot,
  );
  s.add(heading(c.title), identity(), retained, discarded, originNote);
  c.on('origin', () =>
    s.play(
      original.chart.move(
        Object.fromEntries(
          IDS.map((id, i) => [id, xy[i].map((v, j) => v + [5, 3][j] - pca.mean[j])]),
        ),
        { duration: 2 },
      ),
    ),
  );
  c.on(
    'origin',
    () => {
      original.chart.set('opacity', 0);
      s.add(m.chart);
    },
    2,
  );
  c.show('split', [vector, projection, residual, equation]);
  c.on('orthogonal', () => s.play(indicate(residual, { scale: 1 })));
  c.on('sum', () =>
    s.play(
      retained.update(
        rows.map((r) => r.retained),
        { duration: 2 },
      ),
      discarded.update(
        rows.map((r) => r.discarded),
        { duration: 2 },
      ),
    ),
  );
  c.swap('total', equation, totalAmount, { after: true });
  c.show('retained', keptAmount, { after: true });
  c.show('discarded', lostAmount, { after: true });
  c.swap('divide', originNote, variance);
  c.on('reconstruct', () => s.play(indicate(m.chart.point('C'), { scale: 1 })));
}
