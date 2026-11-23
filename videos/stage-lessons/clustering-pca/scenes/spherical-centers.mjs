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
  const origin = left.point('center'),
    unit = Math.min(left.width, left.height) * 0.4;
  const p = ([x, y]) => [origin[0] + x * unit, origin[1] - y * unit];
  const u = [
      [1, 0],
      [0, 1],
    ],
    mean = u[0].map((v, j) => (v + u[1][j]) / u.length);
  const inputs = u.map((v, i) => arrow(p([0, 0]), p(v), { stroke: COLORS[i], width: 5 }));
  const center = arrow(p([0, 0]), p(mean), { stroke: 'yellow', width: 7 });
  const circle0 = circle(unit, { stroke: 'grid', width: 2 }).moveTo(origin);
  const q = [1, 0],
    centers = [
      [0.1, 0],
      [0.8, 0.6],
    ];
  const constructed = centers.map((v, i) =>
    arrow(p([0, 0]), p(v), { stroke: COLORS[i], width: 6 }),
  );
  const qArrow = arrow(p([0, 0]), p(q), { stroke: 'yellow', width: 4 });
  const c0Marker = dot(11, 'cyan').moveTo(p(centers[0]));
  const queryTip = circle(12, { stroke: 'yellow', width: 4 }).moveTo(p(q));
  const trips = centers.map((v, i) => line(p(q), p(v), { stroke: COLORS[i], width: 6 }));
  const aligned = line(origin, p(q), { stroke: 'cyan', width: 5, dash: [12, 8] });
  const endpointNames = [
    beside(label('C0', { size: 36, color: 'cyan' }), c0Marker, 'under', 'normal'),
    beside(
      label('C1', { size: 36, color: 'blue' }),
      constructed[1],
      'right',
      'normal',
      p(centers[1]),
    ),
    beside(label('Q', { size: 36, color: 'yellow' }), qArrow, 'under', 'normal', p(q)),
  ];
  const [a, b, d] = right.rows([1, 2, 1], 'normal');
  const midpoint = place(mono('Mean = (' + mean.join(', ') + ')', { size: 38 }), a, 'top');
  const norm = place(
    mono('Length ≈ ' + Math.hypot(...mean).toFixed(3), { size: 38, color: 'yellow' }),
    a,
    'bottom',
  );
  const formula = place(
    column(
      [note('Squared distance for a unit query q'), mono('1 + ‖c‖² − 2(q · c)', { size: 39 })],
      { gap: 'normal' },
    ),
    b,
  );
  const euclid = scoreBars(
    b,
    ['C0', 'C1'],
    centers.map((v) => distance(q, v) ** 2),
    { max: 1, format: (v) => v.toFixed(2) },
  );
  const cos = scoreBars(
    b,
    ['C0', 'C1'],
    centers.map((v) => cosine(q, v)),
    { max: 1, format: (v) => v.toFixed(2) },
  );
  const euclidName = place(note('Squared distance: smaller wins'), b, 'top');
  const cosineName = place(note('Cosine: larger wins'), b, 'top');
  const [distanceResult, cosineResult] = d.rows(2, 'tight');
  const euclidWinner = place(label('Distance → C1', { size: 36, color: 'blue' }), distanceResult);
  const cosineWinner = place(label('Cosine → C0', { size: 36, color: 'cyan' }), cosineResult);
  const rule = place(label('Normalize the nonzero sum', { size: 34, color: 'yellow' }), d);
  const zero = place(label('Choose a new seed', { size: 38, color: 'yellow' }), d);
  const vectorSum = u[0].map((v, i) => v + u[1][i]);
  const length = Math.hypot(...vectorSum);
  const unitSum = vectorSum.map((v) => v / length);
  const sum = arrow(origin, p(vectorSum), { stroke: 'yellow', width: 6 });
  const oppositeVector = u[0].map((v) => -v);
  const opposite = arrow(origin, p(oppositeVector), { stroke: 'red', width: 6 });
  const pairSum = (second) => {
    const result = u[0].map((v, i) => v + second[i]);
    const pair = (v) => '(' + v.join(', ') + ')';
    return place(
      column(
        [
          note('Group sum'),
          mono(pair(u[0]) + ' + ' + pair(second), { size: 41 }),
          mono('= ' + pair(result), { size: 41, color: 'yellow' }),
        ],
        { gap: 'normal' },
      ),
      b,
    );
  };
  const diagonalSum = pairSum(u[1]);
  const cancelledSum = pairSum(oppositeVector);
  const groupMeans = place(
    column(
      centers.map((p, i) => mono('C' + i + ' = (' + p.join(', ') + ')', { size: 34 })),
      { gap: 'normal' },
    ),
    a,
  );
  s.add(
    heading(c.title),
    place(note('Unit inputs → ordinary mean → explicit spherical update'), ribbon),
    circle0,
    inputs,
    place(note('An ordinary coordinate mean can lie inside the unit circle.'), foot),
  );
  c.show('mean', [center, midpoint]);
  c.show('norm', [norm, formula], { after: true });
  c.swap(
    'groups',
    [inputs, center, midpoint, norm, formula],
    [constructed, qArrow, c0Marker, endpointNames, groupMeans],
  );
  c.show('euclidean', [queryTip, trips.map((trip) => draw(trip)), euclid, euclidName]);
  c.show('near', euclidWinner, { after: true });
  c.swap('cosine', [trips, euclid, euclidName], [draw(aligned), cos, cosineName]);
  c.show('aligned', cosineWinner, { after: true });
  c.swap(
    'normalize',
    [
      constructed,
      qArrow,
      c0Marker,
      endpointNames,
      aligned,
      queryTip,
      cos,
      cosineName,
      euclidWinner,
      cosineWinner,
      groupMeans,
    ],
    [inputs, sum, diagonalSum],
  );
  c.show('unit', rule);
  c.on(
    'unit',
    () =>
      s.play(
        to(sum, (n) =>
          n
            .moveTo(boxOf(arrow(origin, p(unitSum), { stroke: 'yellow' })).point('center'))
            .scale(1 / length),
        ),
        { duration: 1.5 },
      ),
    0.6,
  );
  c.swap('zero', [sum, rule, inputs[1], diagonalSum], [opposite, cancelledSum]);
  c.show('fallback', zero);
}
