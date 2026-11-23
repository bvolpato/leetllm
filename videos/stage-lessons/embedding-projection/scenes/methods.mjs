import { boxOf, column, dot, dynamic, group, indicate, line, place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import {
  begin,
  FOOT,
  LEFT,
  RIGHT,
  mathPlot,
  PCA_POINTS,
  PCA_AXIS,
  PCA_PROJECTION,
  policyCloud,
  taskHeader,
} from '../parts.mjs';
export default function methods(s, c) {
  const header = taskHeader(),
    angle = s.value(0),
    projected = s.value(0);
  const axis = mathPlot(LEFT, { x: [-4, 4], y: [-2, 2], height: (LEFT.width * 0.76) / 2 });
  const varianceFrame = place(
    mono('axis variance = 0.000', { size: 36, color: 'yellow' }),
    LEFT,
    'bottom',
  );
  const variance = dynamic(() => {
    const scores = PCA_POINTS.map((p) => p.x * Math.cos(angle.value) + p.y * Math.sin(angle.value));
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const v = scores.reduce((sum, x) => sum + (x - avg) ** 2, 0) / (scores.length - 1);
    return mono('axis variance = ' + v.toFixed(3), { size: 36, color: 'yellow' }).moveTo(
      boxOf(varianceFrame).point('center'),
    );
  });
  const moving = dynamic(() => {
    const a = angle.value,
      u = [Math.cos(a), Math.sin(a)];
    const nodes = [
      line(axis.world(-3.5 * u[0], -3.5 * u[1]), axis.world(3.5 * u[0], 3.5 * u[1]), {
        stroke: 'yellow',
        width: 5,
      }),
    ];
    PCA_POINTS.forEach((p, i) => {
      const score = p.x * u[0] + p.y * u[1],
        q = [
          p.x + (score * u[0] - p.x) * projected.value,
          p.y + (score * u[1] - p.y) * projected.value,
        ];
      const foot = [score * u[0], score * u[1]];
      nodes.push(line(axis.world(p.x, p.y), axis.world(...foot), { stroke: 'dim', width: 2 }));
      nodes.push(dot(9, 'dim').moveTo(axis.world(p.x, p.y)));
      nodes.push(dot(8, 'yellow').moveTo(axis.world(...foot)));
      nodes.push(dot(12, 'ink').moveTo(axis.world(...q)));
    });
    return group(...nodes);
  });
  const [head, graphRegion, footer] = RIGHT.rows([1, 4, 1], 'normal');
  const graph = policyCloud(graphRegion);
  const captions = [
    place(label('Four-point variance fixture', { color: 'yellow' }), LEFT, 'top'),
    place(label('Six policy points: neighbors', { color: 'ink', size: 36 }), head),
    place(note('Keep the neighbor identities'), footer),
  ];
  const result = place(
    label('Large variance can hide a useful small distinction', { size: 36, color: 'yellow' }),
    FOOT,
  );
  begin(
    s,
    c,
    'methods',
    'A ruler and a neighborhood',
    [axis, moving, captions, graph, variance],
    header,
  );
  c.on('methods-beat-1-focus-2', () => s.play(angle.to(0.2, { duration: 1 })));
  c.on('methods-beat-1-focus-1', () => s.play(angle.to(-0.5, { duration: 1 })));
  c.on('axis-sweep', () => s.play(angle.to(Math.atan2(PCA_AXIS.y, PCA_AXIS.x), { duration: 1.2 })));
  c.on('axis-project', () => s.play(projected.to(1, { duration: 1.5 })));
  c.on('methods-beat-2-focus-1', () =>
    s.play(graph.nearest('R1', 1, { duration: 0.6, color: 'yellow' })),
  );
  c.on('methods-beat-2-focus-2', () =>
    s.play(graph.nearest('S1', 1, { duration: 0.6, color: 'yellow' })),
  );
  c.show('methods-beat-3-focus-1', result);
}
