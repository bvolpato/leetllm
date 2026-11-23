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
  const [top, mid, bottom] = right.rows([3, 1, 1], 'normal');
  const dx = xy[1][0] - xy[0][0],
    dy = xy[1][1] - xy[0][1];
  const unit = (top.height * 0.65) / dy;
  const origin = top.inset('loose').point('bottom left');
  const a = origin,
    corner = [a[0] + dx * unit, a[1]],
    b = [corner[0], a[1] - dy * unit];
  const ends = [dot(12, 'ink').moveTo(a), dot(12, 'ink').moveTo(b)];
  const names = [
    beside(label('A', { size: 36 }), ends[0], 'left', 'normal'),
    beside(label('B', { size: 36 }), ends[1], 'right', 'normal'),
  ];
  const enlarged = place(note('A–B: enlarged, equal units'), top, 'top');
  const lx = line(a, corner, { stroke: 'yellow', width: 5 }).zIndex(-2);
  const ly = line(corner, b, { stroke: 'yellow', width: 5 }).zIndex(-2);
  const diagonal = line(a, b, { stroke: 'cyan', width: 6 }).zIndex(-2);
  const dxName = beside(mono('Δx = ' + dx.toFixed(1), { size: 34 }), lx, 'under', 'normal');
  const dyName = beside(mono('Δy = ' + dy.toFixed(1), { size: 34 }), ly, 'right', 'normal');
  const calc = place(
    column(
      [
        row(
          [
            mono(`${dx.toFixed(1)}² = ${(dx * dx).toFixed(2)}`, { size: 34 }),
            mono(`${dy.toFixed(1)}² = ${(dy * dy).toFixed(2)}`, { size: 34 }),
          ],
          { gap: 'normal' },
        ),
        mono(
          `${(dx * dx).toFixed(2)} + ${(dy * dy).toFixed(2)} = ${(dx * dx + dy * dy).toFixed(2)}`,
          { size: 34 },
        ),
      ],
      { gap: 'tight' },
    ),
    mid,
  );
  const result = place(
    mono('√' + (dx * dx + dy * dy).toFixed(2) + ' = ' + distance(xy[0], xy[1]).toFixed(3), {
      color: 'yellow',
      size: 38,
    }),
    mid,
  );
  const other = place(mono('d(A,C) = ' + distance(xy[0], xy[2]).toFixed(3), { size: 36 }), bottom);
  const cloudDiagonal = line(m.p(xy[0]), m.p(xy[1]), { stroke: 'cyan', width: 5 }).zIndex(-2);
  s.add(
    heading(c.title),
    identity(),
    ends,
    names,
    enlarged,
    place(note('Two coordinate changes → one distance'), foot),
  );
  c.show('x', [draw(lx), dxName]);
  c.show('y', [draw(ly), dyName]);
  c.show('square', calc, { after: true });
  c.show('root', [draw(diagonal), draw(cloudDiagonal)]);
  c.swap('root', calc, result, { after: true });
  c.show('compete', other, { after: true });
  c.on('compete', () => s.play(m.chart.nearest('A', 2, { among: ['B', 'C'], color: 'yellow' })));
  c.on('winner', () => s.play(m.chart.nearest('A', 1, { among: ['B', 'C'], color: 'yellow' })));
  c.on('pairs', () =>
    s.play(
      m.chart.nearest('A', 0),
      ...[0, 1, 2].map((k) => m.chart.assign([IDS[2 * k], IDS[2 * k + 1]], 'g' + k)),
    ),
  );
  c.keep(m.chart);
}
