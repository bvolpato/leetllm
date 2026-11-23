import { place } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { frame, ownedTable, vectorPlane, H } from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    [left, right] = f.body.columns([3, 2], 'loose');
  const a = s.value(0),
    b = s.value(0),
    t = s.value(0);
  const p = vectorPlane(left, { title: 'password and reset', max: 1.5 });
  const horizontal = p.mark(() => [H[0][2][0] * a.value, 0], 'blue');
  const vertical = p.mark(
    () => [H[0][2][0] * a.value, H[0][2][1] * b.value],
    'pink',
    () => [H[0][2][0] * a.value, 0],
  );
  const vector = p.mark(() => [H[0][2][0] * a.value, H[0][2][1] * b.value]);
  const reset = p.mark(() => [1 - t.value, t.value], 'green');
  const table = ownedTable(right, {
    title: 'ordered coordinates',
    rows: ['password', 'construction', 'reset'],
    columns: ['first', 'second'],
    values: () => [H[0][2], [H[0][2][0] * a.value, H[0][2][1] * b.value], [1 - t.value, t.value]],
    colors: ['cyan', 'dim', 'green'],
  });
  const order = place(mono('[1, 0] → [0, 1]', { color: 'yellow' }), f.foot);
  s.add(f.title, p.nodes, table.nodes, horizontal, vertical);
  c.on('first-coordinate', () => s.play(a.to(1, { duration: 2 })));
  c.show('second-coordinate', vector, { after: true });
  c.on('second-coordinate', () => s.play(b.to(1, { duration: 2 })));
  c.show('look-reset', reset);
  c.on('swap-coordinates', () => s.play(t.to(1, { duration: 2 })));
  c.show('swap-coordinates', order, { after: true });
  c.clear(p.lines, 0.46, 0.2);
}
