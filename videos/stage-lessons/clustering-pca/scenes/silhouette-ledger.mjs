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
  const [a, b, d] = right.rows([3, 2, 1], 'normal');
  const trial = clusterTrials[1],
    ss = xy.map((_, i) => silhouette(xy, trial.labels, i));
  const bars = scoreBars(
    a,
    IDS,
    ss.map((v) => v.score),
    {
      max: 1,
      width: a.width * 0.98,
      showValues: true,
      format: (v) => v.toFixed(2),
      colors: IDS.map((_, i) => COLORS[labels[i]]),
    },
  );
  const four = clusterTrials[2];
  const fourScores = xy.map((_, i) => silhouette(xy, four.labels, i).score);
  const barsFour = scoreBars(a, IDS, fourScores, {
    max: 1,
    width: a.width * 0.98,
    format: (v) => v.toFixed(2),
    colors: IDS.map((_, i) => COLORS[four.labels[i]]),
  });
  const fourName = place(note('Point contributions: k=4'), a, 'top');
  const threeName = place(note('Point contributions: k=3'), a, 'top');
  const meanName = place(note('Mean silhouette'), b, 'top');
  const equation = place(
    column(
      [
        mono('a = ' + ss[0].a.toFixed(3), { size: 34 }),
        mono('b = ' + ss[0].b.toFixed(3), { size: 34 }),
        tex('s=(b-a)/\\max(a,b)', { size: 36 }),
      ],
      { gap: 'normal' },
    ),
    b,
  );
  const meansPlot = scoreBars(
    b,
    ['k2', 'k3', 'k4'],
    clusterTrials.map((t) => t.silhouette),
    { max: 1 },
  );
  const singleton = place(label('Singleton → 0', { size: 34, color: 'yellow' }), d);
  const read = place(note('Read the actual messages'), d);
  const largestError = Math.max(...clusterTrials.map((t) => t.inertia));
  const x = (i) => a.left + a.width * (0.15 + 0.35 * i);
  const y = (error) => a.bottom - 55 - (error / largestError) * (a.height - 162);
  const points = clusterTrials.map((t, i) => [x(i), y(t.inertia)]);
  const errorMark = (i) => {
    const [px, py] = points[i];
    const trial = clusterTrials[i];
    return [
      dot(9, 'yellow').at(px, py),
      mono(trial.inertia.toFixed(2), { size: 31 }).moveTo([px + (i === 1 ? 16 : 0), py - 46]),
      note('k = ' + trial.k).moveTo([px, a.bottom - 22]),
    ];
  };
  const edge = (i) => draw(line(points[i], points[i + 1], { stroke: 'yellow', width: 4 }));
  const signs = place(mono('b < a ⇒ s < 0   b = a ⇒ s = 0', { size: 31 }), d);
  s.add(heading(c.title), identity());
  c.on('own', () => s.play(m.chart.nearest('A', 1, { among: ['B'] })));
  c.on('other', () => s.play(m.chart.nearest('A', 2, { among: ['C', 'D'] })));
  c.show('score', equation, { after: true });
  c.on('single', () =>
    s.play(
      m.chart.nearest('A', 0),
      ...IDS.map((id, i) => m.chart.assign(id, 'g' + four.labels[i])),
    ),
  );
  c.show('single', [singleton, barsFour, fourName], { after: true });
  c.after('collect', () =>
    s.play(...IDS.map((id, i) => m.chart.assign(id, 'g' + trial.labels[i]))),
  );
  c.swap('collect', [singleton, barsFour, fourName], [bars, threeName], { after: true });
  c.hide('mean', equation);
  c.show('mean', [meansPlot, meanName], { after: true, fade: 0.2 });
  c.swap('elbow', [bars, threeName], [place(note('Inertia'), a, 'top'), errorMark(0)]);
  c.show('third', [edge(0), errorMark(1)]);
  c.show('fourth', [edge(1), errorMark(2)]);
  c.show('signs', signs);
  c.swap('read', signs, read);
  c.on('read', () => s.play(m.chart.nearest('A', 0)));
}
