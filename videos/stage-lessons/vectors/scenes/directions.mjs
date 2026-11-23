import { dynamic, group, line, place } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { frame, ownedTable, vectorPlane, P } from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    [left, right] = f.body.columns([3, 2], 'loose');
  const a = s.value(0),
    b = s.value(0);
  const p = vectorPlane(left, {
    title: 'P: first / third outputs',
    x: 'first output',
    y: 'third output',
    max: 1.5,
  });
  const mappedGrid = dynamic(() => {
    const lines = [];
    const at = (u, v) =>
      p.world(
        u * P[0][0] * a.value + v * P[1][0] * b.value,
        u * P[0][2] * a.value + v * P[1][2] * b.value,
      );
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      lines.push(
        line(at(t, 0), at(t, 1), { stroke: 'grid', width: 2 }),
        line(at(0, t), at(1, t), { stroke: 'grid', width: 2 }),
      );
    }
    return group(...lines);
  });
  const first = p.mark(() => [P[0][0] * a.value, P[0][2] * a.value], 'blue');
  const second = p.mark(() => [P[1][0] * b.value, P[1][2] * b.value], 'pink');
  const table = ownedTable(right, {
    title: 'P: complete directions',
    rows: ['first input', 'second input'],
    columns: ['out 0', 'out 1', 'out 2'],
    values: () => P,
    colors: ['blue', 'pink'],
  });
  const shape = place(mono('2 inputs → 3 outputs', { color: 'yellow' }), f.foot);
  s.add(f.title, p.nodes, table.nodes, mappedGrid, first, second);
  c.show('map-shape', shape);
  c.on('first-direction', () => s.play(a.to(1, { duration: 3 })));
  c.on('second-direction', () => s.play(b.to(1, { duration: 3 })));
  c.keep(p.nodes);
}
