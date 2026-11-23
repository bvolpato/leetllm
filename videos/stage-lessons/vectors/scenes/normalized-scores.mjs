import { assertEqual, place } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { frame, ownedTable, vectorPlane, H } from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    [left, right] = f.body.columns([3, 2], 'loose');
  const length = s.value(1),
    norm = s.value(0),
    angle = s.value(Math.PI / 4),
    zero = s.value(0),
    cosineReady = s.value(0);
  const base = H[0][2],
    originalLength = Math.hypot(...base);
  assertEqual(
    base.reduce((a, v) => a + v * v, 0),
    0.5,
    'password squared length',
  );
  const vector = () => {
    const r = originalLength * length.value * (1 - norm.value) + norm.value;
    return [
      Math.cos(angle.value) * r * (1 - zero.value),
      Math.sin(angle.value) * r * (1 - zero.value),
    ];
  };
  const p = vectorPlane(left, { title: 'vector and horizontal reference', min: -1.25, max: 1.5 });
  const reference = p.mark(() => [1, 0], 'dim'),
    v = p.mark(vector, 'cyan'),
    shadow = p.mark(() => [vector()[0], 0], 'blue');
  const table = ownedTable(right, {
    title: 'length and direction',
    rows: ['shown vector', 'length', 'dot vs →', 'cosine'],
    columns: ['x / value', 'y'],
    values: () => [
      [...vector()],
      [Math.hypot(...vector()), '—'],
      [vector()[0], '—'],
      [!cosineReady.value ? '' : zero.value === 1 ? 'n/a' : Math.cos(angle.value), '—'],
    ],
    colors: ['cyan', 'cyan', 'blue', 'yellow'],
  });
  const cosine = place(mono('cosine = 1/√2 ≈ 0.707', { color: 'yellow', size: 36 }), f.foot);
  const policy = place(
    mono('zero length → reject before normalization', { size: 36, color: 'red' }),
    f.foot,
  );
  s.add(f.title, p.nodes, table.nodes, reference, v, shadow);
  c.on('length-double', () => s.play(length.to(2, { duration: 3 })));
  c.after('cosine-result', () => cosineReady.set(1));
  c.show('cosine-result', cosine, { after: true });
  c.hide('cosine-perpendicular', cosine);
  c.on('unit-normalize', () => s.play(norm.to(1, { duration: 3 })));
  c.on('cosine-perpendicular', () => s.play(angle.to(Math.PI / 2, { duration: 1.5 })));
  c.on('cosine-opposite', () => s.play(angle.to(Math.PI, { duration: 1.5 })));
  c.on('shrink-arrow', () => s.play(zero.to(1, { duration: 1.5 })));
  c.show('zero-direction', policy, { after: true });
  c.clear(p.lines, 0.46, 0.2);
}
