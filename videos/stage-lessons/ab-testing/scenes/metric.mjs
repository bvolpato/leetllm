import { dot, dynamic, indicate, place, row, to } from 'vizmatic/stage';
import { chip, heading, label, note } from '../../kit-narrated.mjs';
import { FOOT, SIDE, deadline, experiment } from '../parts.mjs';
export default function metric(s, c) {
  const b = experiment(s);
  const d = deadline(s, SIDE, ['usable answer', 'new human page']);
  const useful = dot(16, 'green').moveTo(d.axis.world(8, 2));
  const page = dot(16, 'red').moveTo(d.axis.world(10, 1));
  const result = place(
    row(
      [
        chip('usable by 10', { color: 'green' }),
        chip('no new page through 10', { color: 'green' }),
      ],
      { gap: 'wide' },
    ),
    FOOT,
  );
  const proxy = place(
    row([label('metric success'), note('Check actual service recovery too.')], { gap: 'wide' }),
    FOOT,
  );
  const failure = place(
    row(
      [
        label('new page → metric failure', { color: 'red' }),
        note('Escalation can still protect users.'),
      ],
      { gap: 'wide' },
    ),
    FOOT,
  );
  const cursor = dynamic(() =>
    [2, 1].map((y) => dot(9, 'dim').moveTo(d.axis.world(d.clock.value, y))),
  );
  s.add(cursor);
  s.add(heading('Define resolution before enrollment'), d.frame);
  c.take(b.standing);
  c.show('usable', useful);
  c.on('no-page', () => s.play(indicate(d.edge, { scale: 1 })));
  c.on('denominator', () => s.play(indicate(b.tiles, { scale: 1 })));
  c.on('mature', () => s.play(d.clock.to(10, { duration: 2 })));
  c.show('mature', result, { after: true });
  c.swap('proxy', result, proxy);
  c.show('failure', page);
  c.swap('failure', proxy, failure);
}
