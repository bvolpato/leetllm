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
  const m = cloud();
  c.take(m.chart);
  const [a, b, d] = right.rows(3, 'normal');
  const j = scoreBars(a, ['k=2', 'k=3', 'k=4'], [0, 0, 0], { max: clusterTrials[0].inertia });
  const scores = scoreBars(
    b,
    ['k=2', 'k=3', 'k=4'],
    clusterTrials.map((t) => t.silhouette),
    { max: 1 },
  );
  j.readouts.forEach((n) => n.set('opacity', 0));
  const inertiaName = place(note('Inertia'), a, 'top');
  const silhouetteName = place(note('Mean silhouette'), b, 'top');
  const ss = silhouette(xy, clusterTrials[1].labels, 0);
  const detail = place(
    column(
      [
        mono('a = ' + ss.a.toFixed(3), { size: 34 }),
        mono('b = ' + ss.b.toFixed(3), { size: 34 }),
        tex('s=(b-a)/\\max(a,b)', { size: 36 }),
      ],
      { gap: 'normal' },
    ),
    d,
  );
  const twoRings = rings(m, clusterTrials[0].centers);
  const third = rings(m, [centroids[2]], ['pink'])[0];
  const fourth = rings(m, [clusterTrials[2].centers[3]], ['green'])[0];
  const apply = (trial) =>
    s.play(
      ...IDS.map((id, i) => m.chart.assign(id, 'g' + trial.labels[i])),
      ...twoRings.map((r, i) => to(r, (n) => n.moveTo(m.p(trial.centers[i])))),
    );
  s.add(heading(c.title), identity(), j, inertiaName);
  c.on('two', () => apply(clusterTrials[0]));
  c.show('two', twoRings);
  c.on('three', () => apply(clusterTrials[1]));
  c.show('three', third);
  c.on('four', () => apply(clusterTrials[2]));
  c.show('four', fourth);
  c.on('four', () => s.play(to(third, (n) => n.moveTo(m.p(clusterTrials[2].centers[2])))));
  const revealInertia = (cue, count) => {
    c.after(cue, () =>
      s.play(j.update(clusterTrials.map((trial, i) => (i < count ? trial.inertia : 0))), {
        duration: 0.3,
      }),
    );
    s.at(c.cue(cue).end + 0.6, () => s.play(fade(j.readouts[count - 1], 1), { duration: 0.15 }));
  };
  revealInertia('two', 1);
  revealInertia('three', 2);
  revealInertia('four', 3);
  c.on('return', () => apply(clusterTrials[1]));
  c.hide('return', fourth);
  c.on('return', () => s.play(to(third, (n) => n.moveTo(m.p(centroids[2])))));
  c.on('own', () => s.play(m.chart.nearest('A', 1, { among: ['B'] })));
  c.on('other', () => s.play(m.chart.nearest('A', 2, { among: ['C', 'D'] })));
  c.show('formula', detail);

  c.show('means', [scores, silhouetteName], { after: true });
  c.on('singletons', () => s.play(indicate(scores.bar(2), { scale: 1 })));

  c.on('clear-search', () => s.play(m.chart.nearest('A', 0)));
  c.keep(m.chart);
}
