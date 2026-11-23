import { assertEqual, place } from 'vizmatic/stage';
import { mono, note } from '../../kit-narrated.mjs';
import { frame, vectorPlane, ownedTable, extendedFrame } from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    [left, right] = f.body.columns([3, 2], 'loose');
  const shrink = s.value(0),
    update = s.value(0),
    reveal = s.value(0);
  const fixture = extendedFrame('latency-gradient', { beat: 2 }),
    gradient = fixture.gradient,
    rate = 0.1,
    initial = fixture.weights.map((v, i) => v + fixture.change[i]);
  assertEqual(initial[0] - rate * gradient[0], fixture.weights[0], 'first weight update');
  assertEqual(initial[1] - rate * gradient[1], fixture.weights[1], 'second weight update');
  const p = vectorPlane(left, {
    title: 'parameter coordinates',
    x: 'prompt coefficient',
    y: 'queue coefficient',
    max: 4.5,
  });
  const g = p.mark(() => gradient.map((v) => v * (1 - shrink.value * (1 - rate))), 'yellow');
  const fullGradient = p.mark(() => gradient, 'dim');
  const old = p.point(() => initial, 'dim');
  const weight = p.point(
    () => initial.map((v, i) => v - rate * gradient[i] * update.value),
    'cyan',
  );
  const step = p.mark(
    () => initial.map((v, i) => v - rate * gradient[i] * update.value),
    'yellow',
    () => initial,
  );
  const table = ownedTable(right, {
    title: 'different jobs and units',
    rows: ['weights', 'gradient', 'scaled change'],
    columns: ['prompt', 'queue'],
    values: () => [
      reveal.value === 1
        ? ['?', '?']
        : initial.map((v, i) => v - rate * gradient[i] * update.value),
      gradient,
      gradient.map((v) => v * (1 - shrink.value * (1 - rate))),
    ],
    colors: ['cyan', 'dim', 'yellow'],
  });
  const features = place(
    note('features: prompt length / 100 tokens; queue delay / seconds'),
    f.foot,
  );
  const scaling = place(mono('0.1 × [' + gradient.join(', ') + ']', { color: 'yellow' }), f.foot);
  const result = place(
    mono('weights = [' + fixture.weights.join(', ') + ']', { color: 'yellow' }),
    f.foot,
  );
  s.add(
    f.title,
    p.nodes,
    table.nodes.filter((node) => !table.numbers.flat().includes(node)),
  );
  c.show('gradient-features', features);
  c.show('gradient-weights', [table.numbers[0], old, weight, step], { after: true });
  c.show('gradient-slopes', [table.numbers[1], fullGradient], { after: true });
  c.swap('gradient-scale', features, scaling);
  c.show('gradient-scale', g);
  c.show('gradient-scale', table.numbers[2], { after: true });
  c.on('gradient-scale', () => s.play(shrink.to(1, { duration: 2 })));
  c.on('gradient-update', () => {
    reveal.set(1);
    s.play(update.to(1, { duration: 2 }));
  });
  c.after('gradient-result', () => reveal.set(2));
  c.swap('gradient-result', scaling, result, { after: true });
  c.clear(p.lines, 0.46, 0.2);
}
