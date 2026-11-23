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
  const m = cloud(left, { assigned: true });
  c.take(m.chart);
  const regions = right.rows([3, 1, 1], 'wide');
  const docs = matrix(
    xy.map((p) => p.map((v) => v.toFixed(1))),
    { size: 34 },
  );
  const center = matrix(
    seeds.map((p) => p.map((v) => v.toFixed(1))),
    { size: 34 },
  );
  place(row([docs, center], { gap: 'wide' }), regions[0]);
  const wrong = place(
    matrix(
      seeds.map((p) => [p[0].toFixed(1)]),
      { size: 34, color: 'red' },
    ),
    boxOf(center),
  );
  const broadcast = place(
    matrix(
      seeds.map((p) => [p[0].toFixed(1), p[0].toFixed(1)]),
      { size: 34, color: 'red' },
    ),
    boxOf(center),
  );
  const shapes = place(mono('n × d     k × d', { size: 36 }), regions[1]);
  const invalid = place(label('Reject width / NaN', { color: 'red', size: 36 }), regions[2]);
  const objective = place(tex('J=\\sum_i\\|x_i-\\mu\\|^2', { size: 40 }), regions[1]);
  const gradient = place(tex('-2\\sum_i(x_i-\\mu)=0', { size: 40 }), regions[2]);
  const mean = place(
    mono('μ = (' + centroids[0].map((v) => v.toFixed(2)).join(', ') + ')', {
      color: 'yellow',
      size: 36,
    }),
    regions[2],
  );
  const ring = rings(m, [seeds[0]])[0];
  s.add(heading(c.title), identity(), docs, center);
  c.show('width', shapes);
  c.show('reject', invalid);
  c.swap('reject', center, wrong);
  c.swap('broadcast', wrong, broadcast);
  c.swap('objective', [shapes, invalid], objective);
  c.swap('objective', broadcast, center);
  c.show('gradient', gradient);
  c.swap('mean', gradient, mean, { after: true });
  c.show('mean', ring);
  c.on('mean', () => s.play(to(ring, (n) => n.moveTo(m.p(centroids[0])), { duration: 1.2 })));
  c.on('metric', () => s.play(indicate(objective, { scale: 1 })));
  c.after('metric', () => s.play(...IDS.map((id) => m.chart.assign(id, 'none'))));
  c.keep(m.chart);
}
