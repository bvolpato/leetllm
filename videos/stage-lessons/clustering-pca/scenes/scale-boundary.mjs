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
  const model = scaleCalculation();
  const m = cloud(left, {
    coords: model.rows.map((r) => r.standardized),
    names: model.rows.map((r) => r.id),
    equal: true,
    heightRatio: 0.79,
    x: [-2, 2],
    y: [-2, 2],
    autoNames: true,
    xLabel: 'standardized topic',
    yLabel: 'standardized length',
  });
  const [a, b, d] = right.rows([2, 2, 1], 'normal');
  const fitted = place(
    column(
      [
        label('Stored transform revision', { size: 34 }),
        mono('μ = (' + means.map((v) => v.toFixed(1)).join(', ') + ')', { size: 32 }),
        mono('σ = (' + stds.map((v) => v.toFixed(3)).join(', ') + ')', { size: 32 }),
        tex('z=(x-\\mu)/\\sigma', { size: 38 }),
      ],
      { gap: 'normal' },
    ),
    a,
  );
  const qRaw = [-3.1, 300],
    q = qRaw.map((v, j) => (v - means[j]) / stds[j]);
  const wrongMean = [means[0], qRaw[1]],
    wrong = qRaw.map((v, j) => (v - wrongMean[j]) / stds[j]);
  const incoming = place(
    column(
      [
        label('Raw query Q', { size: 34, color: 'yellow' }),
        mono('(' + qRaw.join(', ') + ')', { size: 36, color: 'yellow' }),
      ],
      { gap: 'normal' },
    ),
    b,
  );
  const arithmetic = place(
    column(
      [
        mono(`(−3.1 − ${means[0]}) / ${stds[0].toFixed(3)}`, { size: 32 }),
        mono(`(300 − ${means[1]}) / ${stds[1].toFixed(3)}`, { size: 32 }),
        mono('Q → (' + q.map((v) => v.toFixed(3)).join(', ') + ')', { size: 32, color: 'yellow' }),
      ],
      { gap: 'normal' },
    ),
    b,
  );
  const alternative = place(
    column(
      [
        label('Different μ′ = (0, 300)', { size: 34, color: 'red' }),
        mono(`(300 − 300) / ${stds[1].toFixed(3)} = 0`, { size: 30, color: 'red' }),
        mono('Q′ → (' + wrong.map((v) => v.toFixed(3)).join(', ') + ')', {
          size: 32,
          color: 'red',
        }),
      ],
      { gap: 'normal' },
    ),
    b,
  );
  const invalid = place(label('Different origin: reject', { size: 34, color: 'red' }), d);
  const repaired = place(label('Use the stored transform', { size: 34, color: 'yellow' }), d);
  const boundary = place(
    row(
      [
        chip('corpus / development', { color: 'cyan' }),
        chip('unseen queries', { color: 'yellow', dash: true }),
      ],
      { gap: 'wide' },
    ),
    foot,
  );
  s.add(
    heading(c.title),
    place(note('Six metadata rows. One fitted coordinate system.'), ribbon),
    m.chart,
    fitted,
  );
  c.on('fit', () => s.play(indicate(fitted, { scale: 1 })));
  c.on('formula', () => s.play(indicate(m.chart.point('B100'), { scale: 1 })));
  c.show('query', incoming);
  c.swap('query', incoming, arithmetic, { after: true });
  c.after(
    'query',
    () =>
      s.play(
        m.chart.insert(
          { name: 'Q', x: q[0], y: q[1], query: true, color: 'yellow', side: 'left' },
          { from: boxOf(incoming).point('center'), duration: 1.2 },
        ),
      ),
    0.5,
  );
  c.swap('bad', arithmetic, alternative, { after: true });
  c.after('bad', () =>
    s.play(m.chart.move('Q', wrong, { duration: 1.2 }), recolor(m.chart.point('Q'), 'red')),
  );
  c.show('bad', invalid, { after: true });
  c.after('restore', () =>
    s.play(m.chart.move('Q', q, { duration: 1.2 }), recolor(m.chart.point('Q'), 'yellow')),
  );
  c.swap('restore', alternative, arithmetic, { after: true });
  c.swap('restore', invalid, repaired, { after: true });
  c.on('weights', () => s.play(indicate(fitted, { scale: 1 })));
  c.show('held', boundary);
}
