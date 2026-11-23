import { axes, place, dot, beside, indicate, line } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT, RELEASES } from '../parts.mjs';
export default function gates(s, c) {
  const board = caseBoard();
  const [plotRegion, operations] = MAIN.rows([4, 1], 'wide');
  const plot = place(
    axes({
      width: plotRegion.width - 160,
      height: plotRegion.height - 100,
      x: [0.85, 1.02],
      y: [0, 2200],
      xStep: 0.05,
      yStep: 1000,
      labelSize: 34,
      grid: true,
      tips: false,
    }),
    plotRegion,
  );
  const points = RELEASES.map((r, i) =>
    dot(11, i === 1 ? 'blue' : 'dim').moveTo(plot.world(r.quality, r.ms)),
  );
  const names = points.map((p, i) =>
    beside(label(['F', 'B', 'S'][i], { size: 34 }), p, 'under', 'normal'),
  );
  const costs = RELEASES.map((r, i) =>
    place(
      note(`${['F', 'B', 'S'][i]} · ${r.id}: $${r.cost} · schema ${r.schema}`),
      operations.columns(3, 'wide')[i],
    ),
  );
  const legend = RELEASES.map((r, i) =>
    place(note(`${['F', 'B', 'S'][i]} · ${r.id}`), operations.columns(3, 'wide')[i]),
  );
  const limits = place(
    note('Quality ≥ 0.98 · latency ≤ 900 ms · cost ≤ $0.015 · schema = 1'),
    FOOT,
  );
  const result = place(
    label('Balanced clears these four point-estimate gates', { color: 'yellow', size: 36 }),
    FOOT,
  );
  const quality = line(plot.world(0.98, 0), plot.world(0.98, 2200), { stroke: 'yellow', width: 3 });
  const latency = line(plot.world(0.85, 900), plot.world(1.02, 900), {
    stroke: 'yellow',
    width: 3,
  });
  s.add(heading('Intersect quality and operational gates'), plot, points, names, legend, limits);
  c.take(board.nodes);
  c.on('gates-beat-1-focus-2', () => s.play(indicate(points, { scale: 1, color: 'yellow' })));
  c.show('quality-boundary', quality);
  c.on('gates-beat-1-focus-1', () =>
    s.play(indicate([points[1], points[2]], { scale: 1, color: 'yellow' })),
  );
  c.show('gates-beat-2-focus-2', latency);
  c.on('gates-beat-2-focus-1', () => s.play(indicate(points[2], { scale: 1, color: 'red' })));
  c.swap('gates-beat-3-focus-2', legend, costs);
  c.on('ba-gates-cost', () => s.play(indicate(costs, { scale: 1, color: 'yellow' })));
  c.swap('gates-beat-3-focus-1', limits, result, { after: true });
  c.keep(board.nodes);
}
