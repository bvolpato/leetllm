import { boxOf, dot, dynamic, group, indicate, line, place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import {
  begin,
  BODY,
  FOOT,
  mathPlot,
  NEIGHBOR_SOURCE,
  NEIGHBOR_SOURCE_3D,
  NEIGHBOR_PCA,
  NEIGHBOR_MAP,
  SOURCE_NEIGHBORS,
  NAMES,
  POINT_COLORS,
  taskHeader,
} from '../parts.mjs';
const nearest = (points) =>
  points.map(
    (p, i) =>
      points
        .map((q, j) => ({ j, d: Math.hypot(...p.map((x, k) => x - q[k])) }))
        .filter((v) => v.j !== i)
        .sort((a, b) => a.d - b.d || a.j - b.j)[0].j,
  );
export default function verify(s, c) {
  const header = taskHeader(),
    fit = s.value(0),
    distortion = s.value(0);
  const [plots, ledgerRegion] = BODY.rows([4, 3], 'wide');
  const regions = plots.columns(2, 'loose');
  const source = mathPlot(regions[0], { x: [-4, 5], y: [-3, 5], grid: false });
  const map = mathPlot(regions[1], { x: [-1, 5.5], y: [-1, 5.5], grid: false });
  const sourceAt = () =>
    NEIGHBOR_SOURCE.map((p, i) => p.map((x, j) => x + (NEIGHBOR_PCA[i][j] - x) * fit.value));
  const mapAt = () =>
    NEIGHBOR_SOURCE.map((p, i) => p.map((x, j) => x + (NEIGHBOR_MAP[i][j] - x) * distortion.value));
  const marked = (chart, region, points, edges = false) =>
    dynamic(() => {
      const values = points(),
        nodes = [];
      if (edges) {
        const nb = nearest(values);
        values.forEach((p, i) =>
          nodes.push(
            line(chart.world(...p), chart.world(...values[nb[i]]), { stroke: 'dim', width: 2 }),
          ),
        );
      }
      values.forEach((p, i) => {
        const a = chart.world(...p),
          side = i % 2,
          dest = [
            side ? region.right - 35 : region.left + 35,
            region.top + 85 + (Math.floor(i / 2) * (region.height - 115)) / 3,
          ];
        const end = [dest[0] + (side ? -42 : 42), dest[1]];
        nodes.push(line(a, end, { stroke: POINT_COLORS[i], width: 1 }));
        nodes.push(dot(11, POINT_COLORS[i]).moveTo(a));
        nodes.push(label(NAMES[i], { size: 34, color: POINT_COLORS[i] }).moveTo(dest));
      });
      return group(...nodes);
    });
  const sourceMarks = marked(source, regions[0], sourceAt),
    mapMarks = marked(map, regions[1], mapAt, true);
  const captions = [
    place(note('source x-y • neighbors use full 3D'), regions[0], 'top'),
    place(note('map • recomputed nearest neighbors'), regions[1], 'top'),
  ];
  const pcaCaption = place(note('PCA map • same six full-3D neighbors'), regions[0], 'top');
  const ledgerRows = ledgerRegion.rows(7, 'none');
  const cells = ledgerRows.map((r) => r.columns([1, 2, 2, 1], 'normal'));
  const heads = ['point', 'source nearest', 'map nearest', 'agree?'].map((v, j) =>
    place(note(v), cells[0][j]),
  );
  const staticRows = NAMES.flatMap((n, i) => [
    place(mono(n, { size: 29, color: POINT_COLORS[i] }), cells[i + 1][0]),
    place(
      mono(NAMES[SOURCE_NEIGHBORS[i]], { size: 29, color: POINT_COLORS[SOURCE_NEIGHBORS[i]] }),
      cells[i + 1][1],
    ),
  ]);
  const ledger = dynamic(() => {
    const nb = nearest(mapAt());
    return group(
      ...nb.flatMap((j, i) => [
        mono(NAMES[j], { size: 29, color: POINT_COLORS[j] }).moveTo(
          cells[i + 1][2].point('center'),
        ),
        mono(j === SOURCE_NEIGHBORS[i] ? 'yes' : 'no', {
          size: 29,
          color: j === SOURCE_NEIGHBORS[i] ? 'ink' : 'red',
        }).moveTo(cells[i + 1][3].point('center')),
      ]),
    );
  });
  const pcaScore = place(label('PCA: 6 / 6 choices agree', { color: 'yellow' }), FOOT);
  const score = place(label('3 / 6 choices agree = 0.50', { color: 'yellow' }), FOOT);
  const judged = place(
    label('Neighbor agreement + judged policy relevance', { color: 'yellow', size: 36 }),
    FOOT,
  );
  begin(
    s,
    c,
    'verify',
    'Check the neighbors behind the islands',
    [sourceMarks, mapMarks, captions, heads, staticRows, ledger],
    header,
  );
  c.on('verify-beat-1-focus-1', () =>
    s.play(indicate(staticRows[1], { scale: 1, color: 'yellow' })),
  );
  c.on('verify-beat-1-focus-2', () => s.play(indicate(ledger, { scale: 1, color: 'yellow' })));
  c.on('verify-beat-2-focus-1', () => s.play(fit.to(1, { duration: 2 })));
  c.swap('verify-beat-2-focus-1', captions[0], pcaCaption, { fade: 0.15 });
  c.on('verify-distort', () => s.play(distortion.to(1, { duration: 2 })));
  c.show('verify-overlap', score, { after: true });
  c.on('verify-beat-3-focus-1', () => s.play(indicate(ledger, { scale: 1, color: 'yellow' })));
  c.swap('verify-beat-3-focus-2', score, judged);
}
