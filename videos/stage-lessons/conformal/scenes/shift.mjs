import { dot, dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, note } from '../../kit-narrated.mjs';
import { latencyRuler, mixture, TEST_OUTCOMES } from '../parts.mjs';

export default function shift(s, c) {
  const [upper, lower] = area.rows([1, 1], 'loose');
  const b = mixture(s, {
    region: upper,
    gap: 'tight',
    caption: 'mixture calculation · fixed group rates',
  });
  b.meterOn.set(1);
  const ruler = latencyRuler(s, { region: lower, center: 44, radius: 8 });
  const arrivals = s.value(0);
  // Each request keeps the group and outcome assigned when it enters.
  const records = Array.from({ length: 12 }, (_, i) => {
    const long = i < 8 ? i % 4 === 0 : i % 2 === 0;
    const outcome = long ? TEST_OUTCOMES[3] : TEST_OUTCOMES[i % 3];
    return { long, outcome, miss: Math.abs(outcome - 44) > 8 };
  });
  const stream = dynamic(() => {
    const n = Math.floor(arrivals.value);
    const stacks = new Map();
    return records.slice(0, n).flatMap(({ long, outcome, miss }) => {
      const level = stacks.get(outcome) ?? 0;
      stacks.set(outcome, level + 1);
      const point = [ruler.x(outcome), ruler.y - 22 - level * 40];
      return [
        dot(12, long ? 'pink' : 'blue').moveTo(point),
        ...(miss
          ? [rect(34, 34, { fill: null, stroke: 'red', width: 3, radius: 17 }).moveTo(point)]
          : []),
      ];
    });
  });
  const unchanged = place(note('fixed radius 8 ms', { color: 'yellow' }), lower, 'bottom right');
  const monitor = place(note('current labels + collection process'), lower, 'bottom right');
  const diagnose = place(
    note('bias · scale · mixture · fitting contamination'),
    lower,
    'bottom right',
  );
  const illustrative = place(note('illustrative arrivals · red ring = miss'), lower, 'top right');
  s.add(
    heading(c.title),
    b.frame,
    b.drawing,
    ruler.frame,
    ruler.point,
    ruler.interval,
    ruler.limit,
    stream,
    illustrative,
  );
  c.show('tail', unchanged);
  c.on('stream', () => s.play(arrivals.to(8, { duration: 4 })));
  c.on('drift', () => {
    s.play(b.long.to(0.5, { duration: 2 }), arrivals.to(12, { duration: 2 }));
  });
  c.swap('monitor', unchanged, monitor);
  c.swap('diagnose', monitor, diagnose);
}
