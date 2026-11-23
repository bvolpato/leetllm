import { connector, indicate, place, table } from 'vizmatic/stage';
import { heading, label, namedBox } from '../../kit-narrated.mjs';
import { carryIdentity, evidenceFrame } from '../parts.mjs';
export default function pinnedBundle(s, c) {
  const f = evidenceFrame(c);
  const [bundleRoom, joinRoom] = f.work.rows([3, 4], 'wide');
  const bundle = place(
    table(
      ['part', 'A', 'B'],
      ['child index', 'parent store', 'manifest', 'retrieval config'].map((part) => ({
        id: part,
        part,
        A: { value: 'held', state: 'pass' },
        B: { value: 'candidate', state: 'pending' },
      })),
      { width: f.work.width, size: 29, leading: 1.6 },
    ),
    bundleRoom,
  );
  const [childRoom, parentsRoom] = joinRoom.rows([1, 1], 'loose');
  const [aRoom, bRoom] = parentsRoom.columns(2, 'loose');
  const child = place(
    namedBox('child A · pinned request', { width: 480, height: 96, color: 'blue' }),
    childRoom,
  );
  const parentA = place(namedBox('parent A', { width: 360, height: 96, color: 'cyan' }), aRoom);
  const parentB = place(namedBox('parent B', { width: 360, height: 96, color: 'dim' }), bRoom);
  const good = connector(child, parentA, { color: 'cyan' });
  const bad = connector(child, parentB, { color: 'red' });
  const pointerA = place(label('Serving pointer: A', { color: 'yellow' }), f.foot);
  const pointerB = place(
    label('Serving pointer: B · this request still holds A', { color: 'yellow' }),
    f.foot,
  );
  s.add(heading(c.title), f.nodes, bundle, child, parentA, parentB, pointerA);
  carryIdentity(c, f);
  c.on('pr-snapshot', () => s.play(bundle.light('manifest')));
  c.on('pr-pin', () => s.play(indicate(child, { scale: 1, color: 'yellow' })));
  c.swap('pr-pointer', pointerA, pointerB);
  c.show('pr-mixed', bad);
  c.on('pr-mixed', () => s.play(bad.pulse({ duration: 0.8 })), 0.6);
  c.swap('pr-repair', bad, good);
  c.on('pr-repair', () => s.play(good.pulse({ duration: 0.8 })), 0.6);
  c.on('pr-migration', () =>
    s.play(bundle.setCell('child index', 'B', { value: 'ready', state: 'pass' })),
  );
  c.on('pr-switch', () =>
    s.play(
      ...['parent store', 'manifest', 'retrieval config'].map((id) =>
        bundle.setCell(id, 'B', { value: 'ready', state: 'pass' }, { duration: 0.5 }),
      ),
    ),
  );
  c.clear([good, bad], 0.7, 0.2);
}
