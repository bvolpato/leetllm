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
  const repair = emptyCenterRepair();
  const mode = s.value(0),
    joined = s.value(0),
    fitProgress = s.value(0);
  const currentCenters = () =>
    [xy[0], xy[1], xy[repair.farthest]].map((p, i) =>
      p.map((v, j) => mix(v, repair.fit.centers[i][j], fitProgress.value)),
    );
  const wires = dynamic(() => {
    if (joined.value === 0) return group();
    const assignments =
      mode.value >= 2 ? repair.fit.labels : mode.value >= 1 ? repair.after : repair.before;
    return group(
      ...xy.map((p, i) =>
        line(m.p(p), m.p(currentCenters()[assignments[i]]), {
          stroke: COLORS[assignments[i]],
          width: 4,
          opacity: 0.65,
        }),
      ),
    );
  }).zIndex(-2);
  const [a, b, d] = right.rows(3, 'normal');
  const counts = scoreBars(a, ['C0', 'C1', 'C2'], repair.counts, {
    max: xy.length,
    format: (v) => v.toFixed(0),
  });
  const far = place(
    column(
      [
        note('Off the plotted range'),
        mono('(100, 100)', { size: 36 }),
        circle(16, { stroke: 'pink', width: 5 }),
      ],
      { gap: 'normal' },
    ),
    b,
  );
  const fail = place(label('Empty mean: stop', { color: 'red', size: 36 }), d);
  const fixed = place(label('Reseed at F', { color: 'yellow', size: 36 }), d);
  const local = place(label('Local solution', { color: 'yellow', size: 36 }), d);
  const rings0 = rings(m, [xy[0], xy[1]]);
  const moving = circle(14, { stroke: 'pink', width: 5 })
    .moveTo(boxOf(far).point('bottom'))
    .zIndex(-2);
  const policy = place(
    column([note('First-center ties'), note('Stop on repeated assignments'), note('20-step cap')], {
      gap: 'normal',
    }),
    b,
  );
  s.add(
    heading(c.title),
    identity(),
    wires,
    place(note('Same observations. Different seeds.'), foot),
  );
  c.show('bad', [far, rings0]);
  c.show('counts', counts, { after: true });
  c.after('counts', () =>
    s.play(joined.to(1), ...IDS.map((id, i) => m.chart.assign(id, 'g' + repair.before[i]))),
  );
  c.show('empty', fail, { after: true });
  c.swap('repair', fail, fixed);
  c.hide('repair', far);
  c.show('repair', moving);
  c.on('repair', () =>
    s.play(to(moving, (n) => n.moveTo(m.p(xy[repair.farthest])), { duration: 2 })),
  );
  c.on('again', () => {
    mode.set(1);
    return s.play(
      ...IDS.map((id, i) => m.chart.assign(id, 'g' + repair.after[i])),
      counts.update([0, 1, 2].map((k) => repair.after.filter((v) => v === k).length)),
    );
  });
  c.show('cap', policy, { after: true });
  c.on('cap', () => s.play(indicate(counts, { scale: 1 })));
  c.swap('local', fixed, local, { after: true });
  c.on('local', () => {
    mode.set(2);
    return s.play(
      fitProgress.to(1),
      ...rings0.map((r, i) => to(r, (n) => n.moveTo(m.p(repair.fit.centers[i])))),
      to(moving, (n) => n.moveTo(m.p(repair.fit.centers[2]))),
      ...IDS.map((id, i) => m.chart.assign(id, 'g' + repair.fit.labels[i])),
      counts.update([0, 1, 2].map((k) => repair.fit.labels.filter((v) => v === k).length)),
    );
  });
  c.on('identity-reset', () => s.play(...IDS.map((id) => m.chart.assign(id, 'none'))));
  c.keep(m.chart);
}
