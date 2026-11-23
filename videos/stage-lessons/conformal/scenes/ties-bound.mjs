import { group, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { FOOT, RAIL, latencyRuler, scoreRail } from '../parts.mjs';

export default function tiesBound(s, c) {
  const rail = scoreRail(s);
  const ruler = latencyRuler(s, { radius: 8, outcome: 48 });
  const equal = place(label('C2 = C3 = 3 ms', { color: 'yellow' }), RAIL, 'top');
  const zero = place(label('all scores = 0 · inclusive set', { color: 'yellow' }), RAIL, 'top');
  const conservative = place(mono('100% ≥ 80%', { color: 'green' }), FOOT);
  const distinct = place(label('distinct ranks: 8 / 10 = 80%', { color: 'yellow' }), FOOT);
  const bound = place(note('looser bound: 80% through 90%'), RAIL, 'top');
  const rankCaption = place(label('distinct future ranks', { color: 'yellow' }), RAIL, 'top');
  const scope = place(note('calibration sample + next outcome'), FOOT);
  const distinctMarks = group(
    ...rail.slots.flatMap((slot, i) => {
      const height = (i + 1) * rail.unit;
      const color = i < 8 ? 'green' : 'red';
      return [
        rect(38, height, { fill: color, stroke: null }).moveTo([
          slot.cx,
          rail.baseline - height / 2,
        ]),
        mono(String(i + 1), { color, size: 34 }).moveTo([slot.cx, rail.baseline - height - 30]),
      ];
    }),
  );
  s.add(
    heading(c.title),
    rail.frame,
    rail.sticks,
    ruler.frame,
    ruler.point,
    ruler.interval,
    ruler.actual,
    ruler.limit,
  );
  c.show('tie', equal);
  c.on('tie', () => s.play(rail.active.to(1, { duration: 0.2 })));
  c.on('zero', () => {
    ruler.observedOn.set(0);
    s.play(rail.zero.to(1, { duration: 1.4 }), ruler.q.to(0, { duration: 1.4 }));
    ruler.observed.set(40);
    ruler.observedOn.set(1);
  });
  c.swap('zero', equal, zero);
  c.show('hundred', conservative, { after: true });
  c.swap('distinct', conservative, distinct, { after: true });
  c.swap('distinct', rail.sticks, distinctMarks, { after: true });
  c.swap('distinct', zero, rankCaption, { after: true });
  c.hide('distinct', ruler.actual);
  c.swap('bound', rankCaption, bound, { after: true });
  c.swap('scope', distinct, scope);
}
