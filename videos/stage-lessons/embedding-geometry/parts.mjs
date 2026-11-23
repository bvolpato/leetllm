import {
  axes,
  arrow,
  arc,
  circle,
  dot,
  dynamic,
  group,
  rect,
  beside,
  line,
  place,
  row,
  table,
} from 'vizmatic/stage';
import { area, label, note } from '../kit-narrated.mjs';
import { PASSAGES, QUERY } from '../../films/embedding-geometry/fixtures.mjs';
import { normalized } from '../../films/embedding-geometry/arithmetic.mjs';
export { PASSAGES, QUERY };
export const COLOR = Object.freeze({
  query: 'cyan',
  A: 'green',
  B: 'pink',
  stored: 'blue',
  active: 'yellow',
  failure: 'red',
});
export const STATE = Object.freeze({
  opening: 'raw A/B, cosine',
  coordinates: 'raw A/B, dot',
  rulers: 'raw A/B, all rulers',
  magnitude: 'A scaled tenfold',
  normalize: 'unit A/B',
  'norm-contract': 'validated unit input',
  prefix: 'two-coordinate prefixes',
  payload: 'PQ payload plus retained originals',
  quantization: 'C/D merged',
  'scalar-codec': 'decoded with scale and offset',
  'scalar-scales': 'scale-aware scores',
  calibration: 'fine bound plus clipped outlier',
  'wide-arithmetic': 'wide operands and accumulator',
  'pq-codebooks': 'four centroid IDs',
  'pq-distance': 'ADC lookup totals',
  'pq-transform': 'rotation and residual anchor',
  'binary-pack': 'one differing bit',
  'sign-angle': 'fixed signs, separated directions',
  graph: 'E found with wider search',
  'index-memory': 'graph and code ledger',
  'authorized-funnel': 'allowed rotation survives',
  deployment: 'eligible shortlist rescored',
  synthesis: 'metric and transform contract',
  'fresh-query': 'upward query, D recovered at K=2',
});

// Equal units preserve the angles. All screen positions come from the plot region.
export function applePlane(
  s,
  {
    vectors = () => PASSAGES.map((p) => p.vector),
    query = () => QUERY,
    extent = null,
    region = area.columns([3, 2], 'loose')[0],
    unitCircle = false,
    detail = extent === null,
  } = {},
) {
  const plotRegion = region.inset('wide');
  const width = plotRegion.width - 80,
    height = plotRegion.height - 150;
  const ax = axes({
    x: extent ? () => [-0.3, extent()] : [-0.3, 4.8],
    y: extent
      ? () => [-0.5, -0.5 + ((extent() + 0.3) * height) / width]
      : [-0.5, -0.5 + (5.1 * height) / width],
    width,
    height,
    xStep: 1,
    yStep: 1,
    labelSize: 34,
    grid: true,
    tips: false,
  }).at(...plotRegion.point('center'));
  const p = (v) => ax.world(v[0], v[1]);
  const arrows = dynamic(() =>
    group(
      ...[query(), ...vectors()].flatMap((v, i) => [
        arrow(p([0, 0]), p(v), {
          stroke: ['cyan', 'green', 'pink'][i],
          width: i ? 6 : 3,
          tip: i ? 26 : 8,
          pad: 0,
        }),
        dot(i ? 10 : 2, ['cyan', 'green', 'pink'][i]).moveTo(p(v)),
      ]),
    ),
  );
  const circleNode = unitCircle
    ? dynamic(() =>
        arc(Math.abs(p([1, 0])[0] - p([0, 0])[0]), -Math.PI / 2, 0, {
          stroke: 'dim',
          width: 3,
        }).at(...p([0, 0])),
      )
    : null;
  const legendRegion = region.rows([1, 8], 'tight')[0];
  const legend = place(
    row(
      [
        label('q', { color: 'cyan' }),
        label('A', { color: 'green' }),
        label('B', { color: 'pink' }),
      ],
      { gap: 'wide' },
    ),
    legendRegion,
    'right',
  );
  const ray = (i) =>
    dynamic(() => {
      const v = vectors()[i];
      const a = Math.atan2(v[1], v[0]),
        q = query();
      const b = Math.atan2(q[1], q[0]);
      return arc(100 + i * 28, -a, -b, { stroke: ['green', 'pink'][i], width: 5 }).at(...p([0, 0]));
    });
  const gap = (i) =>
    dynamic(() => line(p(query()), p(vectors()[i]), { stroke: 'yellow', width: 5, dash: [10, 8] }));
  const projection = (i) =>
    dynamic(() => {
      const v = vectors()[i];
      return line(p([0, 0.65 + i * 0.2]), p([v[0], 0.65 + i * 0.2]), {
        stroke: ['green', 'pink'][i],
        width: 8,
      });
    });
  const inset = region
    .inset('normal')
    .rows([3, 5], 'normal')[0]
    .columns([3, 2], 'normal')[0]
    .rows([9, 1], 'none')[0];
  const origin = [inset.left + inset.width * 0.08, inset.bottom - inset.height * 0.16];
  const length = inset.width * 0.75;
  const detailPlate = rect(inset.width, inset.height, {
    fill: 'surface',
    stroke: 'dim',
    width: 2,
  }).moveTo(inset.point('center'));
  const detailTitle = place(note('directions at unit length'), inset.inset('normal'), 'top left');
  const directions = dynamic(() =>
    group(
      ...[query(), ...vectors()].flatMap((v, i) => {
        const u = normalized(v),
          end = [origin[0] + u[0] * length, origin[1] - u[1] * length];
        const mark = arrow(origin, end, {
          stroke: ['cyan', 'green', 'pink'][i],
          width: 5,
          tip: 16,
        });
        const name = beside(
          label(['q', 'A', 'B'][i], { color: ['cyan', 'green', 'pink'][i], size: 34 }),
          dot(5).moveTo(end),
          'right',
          'normal',
        );
        return [mark, name];
      }),
    ),
  );
  const detailNodes = detail ? [detailPlate, detailTitle, directions] : [];
  return {
    ax,
    arrows,
    circleNode,
    detailNodes,
    legend,
    nodes: [ax, circleNode, ...detailNodes, arrows, legend].filter(Boolean),
    p,
    ray,
    gap,
    projection,
  };
}

// The same named passages occupy one lane each. Only allowed passages reach originals.
export function candidateFunnel(region = area, filterFirst = true) {
  const [head, body, foot] = region.rows([1, 6, 1], 'wide');
  const names = filterFirst
    ? ['pool', 'permission', 'shortlist', 'originals']
    : ['pool', 'shortlist', 'permission', 'originals'];
  const cols = body.columns(4, 'wide');
  const headers = names.map((x, i) =>
    place(
      label(x, { color: i === (filterFirst ? 1 : 2) ? 'yellow' : 'dim', size: 34 }),
      head.columns(4, 'wide')[i],
    ),
  );
  const lanes = cols.map((r) => r.rows(3, 'normal'));
  const candidates = ['Private', 'Rotation', 'Lifecycle'].map((name, i) => ({
    name,
    color: ['red', 'green', 'pink'][i],
    start: lanes[0][i],
    gate: lanes[filterFirst ? 1 : 2][i],
    shortlist: lanes[filterFirst ? 2 : 1][i],
    original: lanes[3][i],
  }));
  const rails = candidates.flatMap((r, i) =>
    cols.slice(0, -1).map((col, j) =>
      line(lanes[j][i].point(j === 0 ? 'right' : 'center'), lanes[j + 1][i].point('center'), {
        stroke: 'faint',
        width: 3,
      }),
    ),
  );
  const marks = candidates.map((r) => place(dot(15, r.color), r.start.inset('tight'), 'right'));
  const ids = candidates.map((r, i) =>
    place(
      label(r.name + (i === 0 ? '   denied' : '   allowed'), { color: r.color, size: 32 }),
      r.start,
      'left',
    ),
  );
  const gate = line(
    cols[filterFirst ? 1 : 2].point('top'),
    cols[filterFirst ? 1 : 2].point('bottom'),
    { stroke: 'yellow', width: 5 },
  );
  const shelf = place(note('retained full-precision vectors'), foot, 'right');
  return {
    headers,
    rails,
    marks,
    ids,
    gate,
    shelf,
    candidates,
    cols,
    nodes: [...headers, ...rails, gate, ...marks, ...ids, shelf],
  };
}
