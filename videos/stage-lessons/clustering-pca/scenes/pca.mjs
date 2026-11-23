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
  const centered = xy.map((p) => p.map((v, j) => v - pca.mean[j]));
  const original = cloud();
  const m = cloud(left, { coords: centered, x: [-5, 5], y: [-3, 3] });
  const screenTarget = xy.map((p) => p.map((v, j) => v + [5, 3][j] - pca.mean[j]));
  const angle = s.value(Math.PI / 2),
    on = s.value(0);
  const vector = () => [Math.cos(angle.value), Math.sin(angle.value)];
  const score = (p) => p[0] * vector()[0] + p[1] * vector()[1];
  const feet = () => centered.map((p) => vector().map((v) => v * score(p)));
  const axis = dynamic(() => {
    const v = vector(),
      extent = Math.min(5, 2.2 / Math.max(0.001, Math.abs(v[1])));
    return group(
      line(m.p(v.map((x) => x * -extent)), m.p(v.map((x) => x * extent)), {
        stroke: 'yellow',
        width: 5,
      }),
      ...centered.flatMap((p, i) =>
        on.value > 0
          ? [
              line(m.p(p), m.p(feet()[i]), { stroke: 'dim', width: 3 }),
              dot(6, 'yellow').moveTo(m.p(feet()[i])),
            ]
          : [],
      ),
    );
  }).zIndex(-2);
  const [a, b, d] = right.rows(3, 'normal');
  const energy = liveNumber(
    a,
    () => centered.reduce((n, p) => n + score(p) ** 2, 0),
    'Σ score² = ',
  );
  const [formulaRegion, scoreRegion] = b.rows(2, 'normal');
  const formula = place(tex('z_i=(x_i-\\mu)\\cdot v', { size: 42 }), formulaRegion);
  const result = place(
    mono((pca.varianceKept * 100).toFixed(1) + '% retained', { size: 36, color: 'yellow' }),
    d,
  );
  const originalScore = place(
    mono('C: z = ' + pca.scores[2].toFixed(3), { size: 36 }),
    scoreRegion,
  );
  const sign = place(mono('C: −z = ' + (-pca.scores[2]).toFixed(3), { size: 36 }), scoreRegion);
  const direction = arrow(m.p([0, 0]), m.p(pca.vector.map((v) => 2.5 * v)), {
    stroke: 'yellow',
    width: 8,
  }).zIndex(-1);
  const reversed = arrow(m.p([0, 0]), m.p(pca.vector.map((v) => -2.5 * v)), {
    stroke: 'yellow',
    width: 8,
  }).zIndex(-1);
  const rawMatrix = place(
    column(
      [
        label('Original rows', { size: 36 }),
        matrix(
          xy.map((p) => p.map((v) => v.toFixed(2))),
          { size: 34 },
        ),
        mono('μ = (' + pca.mean.map((v) => v.toFixed(3)).join(', ') + ')', { size: 32 }),
      ],
      { gap: 'normal' },
    ),
    right,
  );
  const centeredMatrix = place(
    column(
      [
        label('Centered rows', { size: 36 }),
        matrix(
          centered.map((p) => p.map((v) => v.toFixed(2))),
          { size: 34 },
        ),
        mono('μ = (' + pca.mean.map((v) => v.toFixed(3)).join(', ') + ')', { size: 32 }),
      ],
      { gap: 'normal' },
    ),
    right,
  );
  s.add(
    rawMatrix,
    heading(c.title),
    identity(),
    original.chart,
    place(note('Origin moves to the fitted mean. Pixels per coordinate unit stay fixed.'), foot),
  );
  c.on('center', () =>
    s.play(
      original.chart.move(Object.fromEntries(IDS.map((id, i) => [id, screenTarget[i]])), {
        duration: 3,
      }),
    ),
  );
  c.on(
    'center',
    () => {
      original.chart.set('opacity', 0);
      s.add(m.chart);
    },
    3,
  );
  c.swap('center', rawMatrix, centeredMatrix, { after: true });
  c.swap('project', centeredMatrix, energy);
  c.show('project', axis);
  c.on('project', () => s.play(on.to(1, { duration: 1.5 })));
  c.on('rotate', () => s.play(angle.to(Math.atan2(pca.vector[1], pca.vector[0]), { duration: 5 })));
  c.show('best', result, { after: true });
  c.show('score', [formula, originalScore, direction]);
  c.swap('sign', [originalScore, direction], [sign, reversed], { after: true });
  c.clear([axis], 0.65, 0.2);
}
