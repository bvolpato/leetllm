import { area, heading, label, mono, note, tint } from '../../kit-narrated.mjs';
import {
  table,
  place,
  row,
  column,
  arrayCells,
  numberLine,
  barChart,
  axes,
  dynamic,
  group,
  rect,
  line,
  dot,
  arrow,
  draw,
  indicate,
  to,
  fade,
  morph,
  assertEqual,
  polyline,
} from 'vizmatic/stage';
import {
  robustUnit,
  cosine,
  scalarEncode,
  dot as inner,
  l2,
} from '../../../films/embedding-geometry/arithmetic.mjs';

import { applePlane, PASSAGES, QUERY } from '../parts.mjs';
export default function pqTransform(s, c) {
  const theta = s.value(0),
    anchor = s.value(0),
    reconstruction = s.value(0);
  const [left, right] = area.columns([3, 2], 'loose');
  const rotate = (v) => [
    v[0] * Math.cos(theta.value) - v[1] * Math.sin(theta.value),
    v[0] * Math.sin(theta.value) + v[1] * Math.cos(theta.value),
  ];
  const board = applePlane(s, {
    region: left,
    vectors: () => PASSAGES.map((p) => rotate(p.vector)),
    query: () => rotate(QUERY),
    extent: () => 5.5,
  });
  const document = PASSAGES[1].vector;
  const gridStep = 1.5;
  const reconstructed = document.map((x) => Math.round(x / gridStep) * gridStep);
  const centroid = [3, 1];
  const residual = document.map((x, i) => x - centroid[i]);
  residual.forEach((x, i) => assertEqual(centroid[i] + x, document[i], 'centroid plus residual'));
  const length = (v) => Math.hypot(...v);
  const current = () => document.map((x, i) => x + (reconstructed[i] - x) * reconstruction.value);
  const ghost = dynamic(() =>
    arrow(board.p([0, 0]), board.p(rotate(current())), { stroke: 'blue', width: 4, tip: 15 }),
  );
  const ticks = dynamic(() =>
    group(
      ...[document, current()].map((v, i) => {
        const d = rotate(v),
          p = board.p(d),
          m = Math.hypot(...d),
          tick = 15;
        return line(
          [p[0] - (d[1] / m) * tick, p[1] - (d[0] / m) * tick],
          [p[0] + (d[1] / m) * tick, p[1] + (d[0] / m) * tick],
          { stroke: i ? 'blue' : 'pink', width: 5 },
        );
      }),
    ),
  );
  const coarse = dynamic(() =>
    arrow(board.p([0, 0]), board.p(rotate(centroid)), { stroke: 'blue', width: 5 }),
  );
  const residualArrow = dynamic(() => {
    const from = centroid.map((x) => x * anchor.value);
    return arrow(board.p(rotate(from)), board.p(rotate(from.map((x, i) => x + residual[i]))), {
      stroke: anchor.value < 1 ? 'red' : 'yellow',
      width: 8,
    });
  });
  const centroidName = dynamic(() => {
    const p = board.p(rotate(centroid));
    return label('coarse centroid', { color: 'blue', size: 34 }).moveTo([p[0] + 130, p[1] + 65]);
  });
  const [top, mid, foot] = right.rows([3, 3, 2], 'wide');
  const normSlots = top.rows(3, 'normal');
  const norm = [
    place(
      label('original B: ‖d‖ = ' + length(document).toFixed(3), { size: 36, color: 'pink' }),
      normSlots[0],
    ),
    dynamic(() =>
      label('reconstructed: ' + length(current()).toFixed(3), { size: 36, color: 'blue' }).moveTo(
        normSlots[1].point('center'),
      ),
    ),
    place(mono('cos = dot / (‖q‖ ‖d‖)', { size: 36 }), normSlots[2]),
  ];
  const tab = place(
    table(
      ['operation', { key: 'preserves', marks: true, sample: 'centroid + residual' }],
      [
        { id: 'rotation', operation: 'rotation', preserves: 'exact dot + L2' },
        { id: 'codec', operation: 'codebooks', preserves: 'approximation' },
        { id: 'residual', operation: 'residual code', preserves: null },
      ],
      { size: 34, width: mid.width },
    ),
    mid,
  );
  const result = place(mono('document = centroid + residual', { size: 36, color: 'yellow' }), foot);
  s.add(heading(c.title), board.nodes, norm, tab, ghost, ticks);
  c.on('lengths', () => s.play(reconstruction.to(1, { duration: 2 })));
  c.on('norm', () => s.play(indicate(norm, { scale: 1 })));
  c.on('rotate', () =>
    s.play(theta.to(Math.PI / 12, { duration: 3 }), tab.light('rotation', null, { duration: 3 })),
  );
  c.on('quantize', () => s.play(tab.light('codec')));
  c.hide('anchor', [ghost, ticks, board.ax]);
  c.show('anchor', [coarse, centroidName, residualArrow]);
  c.on('anchor', () =>
    s.play(tab.setCell('residual', 'preserves', { value: 'wrong origin', state: 'fail' }), {
      duration: 0.5,
    }),
  );
  c.on('restore', () =>
    s.play(
      anchor.to(1, { duration: 2 }),
      tab.setCell('residual', 'preserves', { value: 'centroid + residual', state: 'pass' }),
      { duration: 2 },
    ),
  );
  c.show('restore', result, { after: true });
}
