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
  svgPath,
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
  const hulls = [0, 1, 2].map((i) => m.chart.hull('g' + i));
  const [a, b, d] = right.rows(3, 'normal');
  const sizes = scoreBars(a, ['0', '1', '2', '3', '4', '5'], [2, 2, 2, 0, 0, 0], {
    max: 2,
    format: (v) => v.toFixed(0),
  });
  const run = place(
    column([label('Run ID + group ID', { size: 34 }), note('Reviewed name belongs to examples')], {
      gap: 'normal',
    }),
    b,
  );
  const purity = place(mono('purity = 1', { size: 40, color: 'yellow' }), d);
  const singleton = xy.map((p) =>
    circle(14, { stroke: 'yellow', width: 3 }).moveTo(m.p(p)).zIndex(-2),
  );
  const final = place(chip('final benchmark: untouched', { color: 'yellow', dash: true }), foot);
  s.add(heading(c.title), identity(), m.chart, hulls, sizes, run);
  c.on('samples', () => s.play(indicate([m.chart.point('A'), m.chart.point('B')], { scale: 1 })));
  c.on('metadata', () => s.play(indicate(m.chart.point('F'), { scale: 1 })));
  c.on('run', () => s.play(indicate(run, { scale: 1 })));
  c.on('purity', () => s.play(indicate(sizes, { scale: 1 })));
  c.show('clean', purity, { after: true });
  c.hide('singletons', hulls);
  c.show('singletons', singleton);
  c.on('singletons', () =>
    s.play(
      sizes.update(IDS.map(() => 1)),
      ...IDS.map((id) => to(m.chart.point(id), (n) => n.scale(0.5))),
      ...IDS.map((id) => m.chart.assign(id, 'none')),
    ),
  );
  c.on('sizes', () => s.play(indicate(sizes, { scale: 1 })));
  c.show('final', final);
}
