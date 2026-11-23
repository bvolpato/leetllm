import { dynamic, place } from 'vizmatic/stage';
import { mono, note } from '../../kit-narrated.mjs';
import { WORK, open, finish, windowPicture } from '../parts.mjs';
export default function coalesced(s, c) {
  const b = open(s, c, 'coalesced-reduction'),
    [left, right] = WORK.columns(2, 'loose');
  const [a, af] = left.rows([5, 1], 'normal'),
    [z, zf] = right.rows([5, 1], 'normal');
  const normal = windowPicture(s, a, 'W0: reduce each backward');
  const deferred = windowPicture(s, z, 'W0: supported coalesced scope');
  const n = s.value(0),
    d = s.value(0);
  const normalRead = dynamic(() =>
    mono(`reductions ${Math.round(n.value)} · owned slice`, { size: 31 }).moveTo(
      af.point('center'),
    ),
  );
  const deferRead = dynamic(() =>
    mono(`reductions ${Math.round(d.value)} · ${d.value >= 1 ? 'owned slice' : 'full gradient'}`, {
      size: 31,
    }).moveTo(zf.point('center')),
  );
  s.add(normal.nodes, deferred.nodes, normalRead, deferRead);
  c.on('normal', () =>
    s.play(
      normal.count.to(8, { duration: 3 }),
      normal.buffer.to(2, { duration: 3 }),
      n.to(8, { duration: 3 }),
    ),
  );
  c.on('defer', () =>
    s.play(deferred.count.to(8, { duration: 3 }), deferred.buffer.to(8, { duration: 3 })),
  );
  c.after('scope', () =>
    s.play(d.to(1, { duration: 0.6 }), deferred.buffer.to(2, { duration: 0.6 })),
  );
  c.on('same', () =>
    s.play(normal.updates.to(1, { duration: 0.8 }), deferred.updates.to(1, { duration: 0.8 })),
  );
  finish(c, b, 'coalesced-reduction');
}
