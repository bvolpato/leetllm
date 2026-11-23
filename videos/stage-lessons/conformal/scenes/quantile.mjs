import { place } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import {
  DISPLAY_ORDER,
  FOOT,
  Q,
  RAIL,
  RESIDUALS,
  correctedThreshold,
  latencyRuler,
  scoreRail,
} from '../parts.mjs';

export default function quantile(s, c) {
  const higher = correctedThreshold(RESIDUALS, 0.85);
  const rail = scoreRail(s, { order: DISPLAY_ORDER });
  const ruler = latencyRuler(s);
  const equation = place(label('k = ceil((n + 1) × coverage)', { color: 'yellow' }), RAIL, 'top');
  const answer = place(mono('80% · k = ' + Q.rank, { color: 'yellow' }), FOOT, 'left');
  const radius = place(mono('q = ' + Q.threshold + ' ms', { color: 'yellow' }), FOOT, 'right');
  const nextRank = place(mono('85% · k = ' + higher.rank, { color: 'yellow' }), FOOT, 'left');
  const nextRadius = place(
    mono('q = ' + higher.threshold + ' ms', { color: 'yellow' }),
    FOOT,
    'right',
  );
  const rounding = place(mono('10 × 0.85 = 8.5     rank ?', { color: 'yellow' }), FOOT);
  s.add(heading(c.title), equation);
  c.take([rail.frame, rail.sticks, ruler.frame, ruler.point, ruler.limit]);
  c.show('future', rail.future);
  c.show('rank', answer, { after: true });
  c.on('sort', () => {
    rail.names.set(0);
    s.play(...rail.positions.map((v, i) => v.to(i, { duration: 2.5 })));
    rail.names.set(1);
  });
  c.after('value', () => rail.active.set(Q.index));
  c.show('value', radius, { after: true });
  c.swap('higher-target', [answer, radius], rounding);
  c.after('higher-target', () => rail.active.set(-1));
  c.swap('next-rank', rounding, [nextRank, nextRadius], { after: true });
  c.after('next-rank', () => rail.active.set(higher.index));
  c.swap('restore', [nextRank, nextRadius], [answer, radius]);
  c.on('restore', () => rail.active.set(Q.index));
  c.keep([rail.frame, rail.sticks, ruler.frame, ruler.point, ruler.limit]);
}
