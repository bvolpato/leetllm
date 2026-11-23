import { place } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { frame, ownedTable, vectorPlane, P, scale, H, transform, vectorText } from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    [left, right] = f.body.columns([3, 2], 'loose');
  const a = s.value(1),
    b = s.value(1),
    join = s.value(0);
  const p = vectorPlane(left, {
    title: 'P: first / third outputs',
    x: 'first output',
    y: 'third output',
    max: 1.5,
  });
  const first = p.mark(() => [a.value, P[0][2] * a.value], 'blue');
  const second = p.mark(
    () => [a.value * join.value, P[0][2] * a.value * join.value + P[1][2] * b.value],
    'pink',
    () => [a.value * join.value, P[0][2] * a.value * join.value],
  );
  const table = ownedTable(right, {
    title: 'password contributions',
    rows: ['first row', 'second row'],
    columns: ['out 0', 'out 1', 'out 2'],
    values: () => [scale(P[0], a.value), scale(P[1], b.value)],
    colors: ['blue', 'pink'],
  });
  const answer = place(
    mono('password → ' + vectorText(transform(H[0][2])), { color: 'yellow' }),
    f.foot,
  );
  const result = p.mark(() => [a.value, P[0][2] * a.value + P[1][2] * b.value], 'cyan');
  s.add(f.title, table.nodes, first, second);
  c.take(p.nodes);
  c.on('scale-first', () => s.play(a.to(H[0][2][0], { duration: 2 })));
  c.on('scale-second', () => s.play(b.to(H[0][2][1], { duration: 2 })));
  c.on('join-vectors', () => s.play(join.to(1, { duration: 3 })));
  c.show('join-landed', [result, answer], { after: true });
  c.clear(p.lines, 0.46, 0.2);
}
