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
  const model = scaleCalculation();
  const indices = [0, 1, 3],
    names = indices.map((i) => model.rows[i].id);
  const raw = indices.map((i) => model.rows[i].raw);
  const scaled = indices.map((i) => model.rows[i].standardized);
  const [overview, detail] = left.columns([3, 2], 'wide');
  const m = cloud(overview, {
    coords: raw,
    names,
    equal: true,
    x: [-300, 300],
    y: [-20, 580],
    sides: ['under', 'right', 'over'],
    xLabel: 'topic',
    yLabel: 'characters',
  });
  const zoom = cloud(detail, {
    coords: [raw[0], raw[2]],
    names: [names[0], names[2]],
    equal: true,
    x: [-9, 9],
    y: [96, 114],
    sides: ['under', 'over'],
    xLabel: 'topic',
    yLabel: 'characters',
    heightRatio: 0.5,
  });
  const zoomName = place(note('Raw pair: enlarged'), detail, 'top');
  const z = cloud(left, {
    coords: [],
    names: [],
    equal: true,
    x: [-1.7, 1.7],
    y: [-1.6, 0.6],
    xLabel: 'standardized topic',
    yLabel: 'standardized length',
  });
  const [a, b, d] = right.rows([2, 2, 1], 'normal');
  const bars = scoreBars(a, ['B500', 'D110'], [0, 0], {
    max: Math.max(...model.pairs.map((p) => p.raw)),
    colors: ['cyan', 'pink'],
    height: Math.max(40, a.height - 165),
  });
  const zbars = scoreBars(a, ['B500', 'D110'], [0, 0], {
    max: Math.max(...model.pairs.map((p) => p.standardized)),
    colors: ['cyan', 'pink'],
  });
  [...bars.readouts, ...zbars.readouts].forEach((n) => n.set('opacity', 0));
  const steps = b.rows(2, 'wide');
  const subtract = raw[0].map((v, j) =>
    place(
      column(
        [
          note(j === 0 ? 'B100: topic' : 'B100: characters'),
          mono(`${v} − ${means[j]} = ${(v - means[j]).toFixed(1)}`, { size: 32 }),
        ],
        { gap: 'tight' },
      ),
      steps[j],
    ),
  );
  const divide = scaled[0].map((v, j) =>
    place(
      column(
        [
          note(j === 0 ? 'B100: standardized topic' : 'B100: standardized length'),
          mono(`${(raw[0][j] - means[j]).toFixed(1)} / ${stds[j].toFixed(3)} = ${v.toFixed(3)}`, {
            size: 32,
          }),
        ],
        { gap: 'tight' },
      ),
      steps[j],
    ),
  );
  const rawResult = place(label('Nearest: D110', { color: 'yellow', size: 36 }), d);
  const result = place(label('Nearest: B500', { color: 'yellow', size: 36 }), d);
  const rawName = place(note('Raw distance'), a, 'top');
  const zName = place(note('Standardized distance'), a, 'top');
  const units = place(
    note('Raw views use equal coordinate units. The inset enlarges the close pair.'),
    foot,
  );
  const standard = place(note('New axes: the same rows after the stored transform'), foot);
  const zoomLink = line(zoom.p(raw[0]), zoom.p(raw[2]), { stroke: 'yellow', width: 4 }).zIndex(-2);
  s.add(
    units,
    rawName,
    heading(c.title),
    place(note('Separate metadata fixture. Three retained rows.'), ribbon),
    m.chart,
    zoom.chart,
    zoomName,
    bars,
  );
  c.on('raw', () => s.play(bars.update(model.pairs.map((p) => p.raw))));
  c.show('raw', zoomLink);
  c.after('raw', () => s.play(...bars.readouts.map((n) => fade(n, 1))), 1.3);
  c.show('winnerraw', rawResult, { after: true });
  c.hide('transform', rawResult);
  c.show('transform', subtract);
  c.swap('divide', subtract, divide, { after: true });
  c.swap('divide', [m.chart, zoom.chart, zoomName, zoomLink, units], [z.chart, standard], {
    after: true,
  });
  c.after(
    'divide',
    () =>
      s.play(
        ...names.map((name, i) =>
          z.chart.insert(
            {
              name,
              color: 'ink',
              x: scaled[i][0],
              y: scaled[i][1],
              side: i === 0 ? 'under' : i === 1 ? 'over' : 'right',
            },
            { from: m.chart.point(name), duration: 2 },
          ),
        ),
      ),
    0.6,
  );
  c.on('row', () => s.play(...divide.map((n) => indicate(n, { scale: 1 }))), 0.8);
  c.swap('recompute', bars, zbars);
  c.swap('recompute', rawName, zName);
  c.after('recompute', () =>
    s.play(
      zbars.update(model.pairs.map((p) => p.standardized)),
      z.chart.nearest('B100', 1, { among: ['B500', 'D110'] }),
    ),
  );
  c.after('recompute', () => s.play(...zbars.readouts.map((n) => fade(n, 1))), 1.3);
  c.show('winner', result, { after: true });
  c.on('contract', () => s.play(...divide.map((n) => indicate(n, { scale: 1 }))));
  c.on('clear-search', () => s.play(z.chart.nearest('B100', 0)));
}
