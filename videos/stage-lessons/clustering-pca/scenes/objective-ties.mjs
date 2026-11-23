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
  const points = [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ];
  const m = cloud(left, {
    coords: points,
    equal: true,
    heightRatio: 0.8,
    names: ['S0', 'S1', 'S2', 'S3'],
    x: [-1, 3],
    y: [-1, 3],
  });
  const centers = rings(m, [
    [0, 1],
    [2, 1],
  ]);
  const [a, b, d] = right.rows(3, 'normal');
  const scores = scoreBars(a, ['left/right', 'bottom/top'], [0, 0], {
    max: 4,
    format: (v) => v.toFixed(0),
  });
  scores.readouts.forEach((n) => n.set('opacity', 0));
  const inertiaName = place(note('Inertia'), a, 'top');
  const meaning = place(
    column([label('User tier?', { size: 36 }), label('Severity?', { size: 36 })], { gap: 'wide' }),
    b,
  );
  const names = place(note('Separate square: S0 through S3'), ribbon);
  const note0 = place(label('Same J. Different members.', { size: 36, color: 'yellow' }), d);
  s.add(heading(c.title), names, m.chart, centers, scores, inertiaName);
  c.on('left', () =>
    s.play(...['S0', 'S1', 'S2', 'S3'].map((id, i) => m.chart.assign(id, 'g' + (i < 2 ? 0 : 1)))),
  );
  c.on('bottom', () =>
    s.play(
      ...centers.map((r, i) => to(r, (n) => n.moveTo(m.p([1, 2 * i])))),
      ...['S0', 'S1', 'S2', 'S3'].map((id, i) => m.chart.assign(id, 'g' + (i % 2))),
    ),
  );
  c.after('left', () => s.play(scores.update([4, 0]), fade(scores.readouts[0], 1)));
  c.after('bottom', () => s.play(scores.update([4, 4]), fade(scores.readouts[1], 1)));
  c.show('meaning', [meaning, note0]);
  c.on('outlier', () => s.play(indicate(m.chart.point('S3'), { scale: 1 })));
}
