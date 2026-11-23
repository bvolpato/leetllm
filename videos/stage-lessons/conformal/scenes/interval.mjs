import { place } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { FOOT, Q, RAIL, latencyRuler, scoreRail } from '../parts.mjs';

export default function interval(s, c) {
  const rail = scoreRail(s);
  const ruler = latencyRuler(s);
  const rule = place(
    label('80% target     |outcome − 40| ≤ 8 ms', { color: 'yellow' }),
    RAIL,
    'top',
  );
  const infiniteRule = place(
    label('95% target     |outcome − 40| ≤ ∞', { color: 'yellow' }),
    RAIL,
    'top',
  );
  const ask = place(mono('40 − 8 = ?     40 + 8 = ?', { color: 'yellow' }), FOOT);
  const width = place(mono('width = ' + Q.threshold * 2 + ' ms', { color: 'yellow' }), FOOT);
  const unbounded = place(label('q = ∞ · all finite outcomes', { color: 'yellow' }), FOOT);
  s.add(heading(c.title), rule, ruler.interval, ruler.actual, ask);
  s.add(rail.frame, rail.sticks, ruler.frame, ruler.point, ruler.limit);
  rail.active.set(Q.index);
  c.on('unfold', () => {
    rail.active.set(Q.index);
    ruler.seen.set(1);
    s.play(ruler.q.to(Q.threshold, { duration: 1.5 }));
  });
  c.after('endpoints', () => ruler.endpointOn.set(1));
  c.swap('endpoints', ask, width, { after: true });
  c.after('hit', () => {
    ruler.observed.set(44);
    ruler.observedOn.set(1);
  });
  c.after('miss', () => {
    ruler.outcomeLabelOn.set(0);
    s.play(ruler.observed.to(53, { duration: 0.6 }));
    ruler.outcomeLabelOn.set(1);
  });
  c.after('boundary', () => {
    ruler.outcomeLabelOn.set(0);
    s.play(ruler.observed.to(48, { duration: 1.1 }));
    ruler.outcomeLabelOn.set(1);
  });
  c.on('infinite', () => {
    ruler.endpointOn.set(0);
    s.play(ruler.q.to(60, { duration: 1.5 }));
    ruler.infinite.set(1);
  });
  c.swap('infinite', width, unbounded);
  c.swap('infinite', rule, infiniteRule);
  c.on('infinite', () => rail.active.set(-1));
}
