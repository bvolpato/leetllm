import { arrow, boxOf, column, dot, fadeIn, place, to } from 'vizmatic/stage';
import { label, namedBox, tint } from '../../kit-narrated.mjs';
import { FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'boundary');

  const [left, right] = VIEW.columns(2, 'loose');
  const build = (region, name, color) => {
    const items = [
      namedBox(name, { width: 590, height: 85, color }),
      namedBox('guest kernel', { width: 590, height: 85, color }),
      namedBox('restricted VMM', { width: 590, height: 85, color: 'pink' }),
    ];
    place(column(items, { gap: 'wide' }), region);
    return items;
  };
  const a = build(left, 'A user script', 'cyan'),
    b = build(right, 'B user script', 'blue');
  const wires = [
    arrow(boxOf(a[0]).point('bottom'), boxOf(a[1]).point('top'), { stroke: 'cyan', pad: 10 }),
    arrow(boxOf(a[1]).point('bottom'), boxOf(a[2]).point('top'), { stroke: 'pink', pad: 10 }),
  ];
  const request = dot(12, 'yellow').moveTo(boxOf(a[0]).point('bottom'));
  const foot = place(label('Host kernel / KVM remains trusted', { color: 'pink' }), FOOT);
  s.add(a, b, wires, foot);
  c.on('guest', () =>
    s.play(
      fadeIn(request, { duration: 0.1 }),
      to(request, (n) => n.moveTo(boxOf(a[1]).point('top')), { duration: 1 }),
    ),
  );
  c.on('host', () =>
    s.play(
      to(request, (n) => n.moveTo(boxOf(a[2]).point('top')), { duration: 1 }),
      tint(a[2], 'yellow'),
    ),
  );
}
