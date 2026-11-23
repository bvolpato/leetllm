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
  validateModel();
  const m = cloud();
  c.take(m.chart);
  const amount = s.value(0),
    move = s.value(0);
  const centers = () => seeds.map((p, i) => p.map((v, j) => mix(v, centroids[i][j], move.value)));
  const members = links(m, xy, centers, labels, () => amount.value);
  const marks = dynamic(() =>
    group(...centers().map((p, i) => circle(14, { stroke: COLORS[i], width: 5 }).moveTo(m.p(p)))),
  ).zIndex(-2);
  const [a, b, d] = right.rows(3, 'wide');
  const objective = scoreBars(a, ['J'], [initialInertia], {
    max: initialInertia,
    colors: ['yellow'],
    showValues: false,
  });
  const barBox = boxOf(objective.bar(0));
  objective.bar(0).hide();
  const objectiveBar = dynamic(() => {
    const height = (barBox.height * inertia(centers())) / initialInertia;
    return rect(barBox.width, height, { fill: 'yellow', stroke: 'yellow', width: 0 }).moveTo([
      barBox.cx,
      barBox.bottom - height / 2,
    ]);
  });
  const value = liveNumber(b, () => inertia(centers()), 'J = ');
  const meanx = place(mono('(1.0 + 1.2) / 2 = 1.1', { size: 34 }), d);
  const meany = place(mono('(1.0 + 1.8) / 2 = 1.4', { size: 34 }), d);
  const settled = place(label('Assignments repeat', { size: 36, color: 'yellow' }), d);
  s.add(
    heading(c.title),
    identity(),
    objective,
    objectiveBar,
    value,
    members,
    place(note('Assign with fixed centers. Update with fixed memberships.'), foot),
  );
  c.show('seed', marks);
  c.on('assign', () =>
    s.play(
      amount.to(1, { duration: 2 }),
      ...IDS.map((id, i) => m.chart.assign(id, 'g' + labels[i], { duration: 2 })),
    ),
  );
  c.on('predict', () => s.play(indicate(m.chart.point('A'), { scale: 1 })));
  c.show('meanx', meanx, { after: true });
  c.swap('meany', meanx, meany, { after: true });
  c.on('update', () =>
    s.play(move.to(1, { duration: 2 }), objective.update([updatedInertia], { duration: 2 })),
  );
  c.on('again', () => s.play(indicate(marks, { scale: 1 })));
  c.swap('settled', meany, settled, { after: true });
  c.on('restarts', () => s.play(indicate(settled, { scale: 1 })));
  c.keep(m.chart);
}
