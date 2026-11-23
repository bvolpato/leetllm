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
  c.take(m.chart);
  const cells = m.chart.cells(centroids);
  const [a, b, d] = right.rows(3, 'normal');
  const lists = place(
    column(
      [
        label('C0: A  B', { size: 38, color: 'cyan' }),
        label('C1: C  D', { size: 38, color: 'blue' }),
        label('C2: E  F', { size: 38, color: 'pink' }),
      ],
      { gap: 'normal' },
    ),
    a,
  );
  const formula = place(
    column(
      [tex('N_{scan}\\approx N n_{probe}/K', { size: 36 }), tex('W=K+N_{scan}', { size: 40 })],
      { gap: 'normal' },
    ),
    b,
  );
  const precision = place(label('Full vectors / compressed codes', { size: 31 }), d);
  const K = 4096,
    probes = 16,
    side = Math.sqrt(K),
    cell = (Math.min(left.height, left.width) / side) * 0.87;
  // One path keeps a 64-by-64 list map affordable in the frame-by-frame check.
  const bounds = left.inset('wide'),
    size = cell * side,
    origin = [bounds.cx - size / 2, bounds.cy - size / 2];
  let path = '';
  for (let i = 0; i <= side; i++) {
    path +=
      'M ' +
      (origin[0] + i * cell) +
      ' ' +
      origin[1] +
      ' v ' +
      size +
      ' M ' +
      origin[0] +
      ' ' +
      (origin[1] + i * cell) +
      ' h ' +
      size +
      ' ';
  }
  const map = svgPath(path, { stroke: 'dim', width: 2 });
  const selected = Array.from({ length: probes }, (_, i) =>
    rect(cell - 2, cell - 2, { fill: 'yellow' }).moveTo([
      origin[0] + ((i % 4) + 28.5) * cell,
      origin[1] + (Math.floor(i / 4) + 28.5) * cell,
    ]),
  );
  const count = place(
    mono(probes + ' / ' + K + ' = ' + ((100 * probes) / K).toFixed(4) + '%', {
      size: 34,
      color: 'yellow',
    }),
    a,
  );
  const unevenLists = [['A'], ['B', 'C', 'D', 'E'], ['F']];
  const openedCount = unevenLists.slice(0, 2).flat().length;
  assertEqual(openedCount, 5, 'actual opened uneven lists contain five documents');
  const listSlots = b.rows(4, 'tight');
  const unevenName = place(note('Separate uneven lists: 6 documents'), listSlots[0]);
  const closed = ['L0: closed', 'L1: closed', 'L2: closed'].map((v, i) =>
    place(mono(v, { size: 34, color: 'dim' }), listSlots[i + 1]),
  );
  const opened = unevenLists
    .slice(0, 2)
    .map((ids, i) => `L${i}: [ ${ids.join(' ')} ]`)
    .map((v, i) => place(mono(v, { size: 34, color: COLORS[i] }), listSlots[i + 1]));
  const candidateSlots = d.rows(2, 'normal');
  const scanned = unevenLists
    .slice(0, 2)
    .flat()
    .map((id) => chip(id, { color: 'yellow' }));
  place(row(scanned, { gap: 'tight' }), candidateSlots[0]);
  const uneven = place(
    mono(`Scanned: ${unevenLists[0].length} + ${unevenLists[1].length} = ${openedCount}`, {
      size: 34,
      color: 'yellow',
    }),
    candidateSlots[1],
  );

  const audit = place(
    column(
      [
        label('Exact geometric neighbors', { size: 32 }),
        label('Reviewed relevant documents', { size: 32 }),
        label('Measured latency', { size: 32 }),
      ],
      { gap: 'normal' },
    ),
    d,
  );
  assertEqual(side * side, K, '4096 lists form a 64-square grid');
  s.add(heading(c.title), identity(), lists, precision);
  c.on('payload', () => s.play(indicate(lists, { scale: 1 })));
  c.on('all', () => s.play(...cells.map((cell) => cell.shade())));
  c.on('codes', () => s.play(indicate(precision, { scale: 1, color: 'red' })));
  c.swap('grid', m.chart, [map]);
  c.show('grid', formula);
  c.on('coarse', () => s.play(indicate(formula, { scale: 1 })));
  c.swap('sixteen', lists, count, { after: true });
  c.show('sixteen', selected, { after: true });
  c.hide('uneven', [precision, formula]);
  c.show('uneven', [unevenName, closed], { lead: -0.3 });
  c.swap('uneven', closed[0], opened[0], { lead: -0.6 });
  c.swap('uneven', closed[1], opened[1], { lead: -1.8 });
  c.show('uneven', scanned[0], { lead: -1.1 });
  c.show('uneven', scanned.slice(1), { lead: -2.3 });
  c.show('uneven', uneven, { after: true });
  c.on('ann', () => s.play(indicate(selected, { scale: 1 })));
  c.swap('semantic', [uneven, unevenName, closed[2], opened, scanned], audit);
  c.on('latency', () => s.play(indicate(audit, { scale: 1 })), 0.6);
}
