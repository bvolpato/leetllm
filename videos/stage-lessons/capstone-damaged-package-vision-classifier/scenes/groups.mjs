import { grid, group, indicate, place, rect, to } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { cast, parcel, work } from '../parts.mjs';
export default function scene(s, c) {
  const photoCast = cast(s, c);
  s.add(heading('Move the whole physical parcel into one split'));
  const [views, bins, foot] = work.rows([3, 3, 1], 'wide');
  const [a, b] = views.columns(2, 'wide');
  const viewA = parcel(a.inset('loose'));
  const viewB = parcel(b.inset('loose'));
  const tagA = place(mono('R-401 a', { color: 'cyan' }), a, 'bottom');
  const tagB = place(mono('R-401 b', { color: 'cyan' }), b, 'bottom');
  const targets = bins.columns(3, 'wide');
  const frames = targets.map((r) =>
    place(rect(r.width, r.height, { stroke: 'grid', fill: 'surface', width: 2 }), r),
  );
  const names = targets.map((r, i) =>
    place(label(['Train', 'Validation', 'Test'][i], { color: 'dim' }), r, 'top'),
  );
  const joined = targets[0].columns(2, 'normal');
  const leak = place(
    label('Same parcel leaks across evaluation', { color: 'red', size: 34 }),
    foot,
  );
  const repaired = place(label('One case. All views together.', { color: 'yellow' }), foot);
  s.add(frames, names, viewA, viewB, tagA, tagB);
  c.on('views', () => s.play(indicate([viewA, viewB], { scale: 1, color: 'cyan' })));
  c.hide('leak', [tagA, tagB, names]);
  c.show('leak', names, { after: true });
  c.on('leak', () =>
    s.play(
      to(viewA, (n) => { n.scale(0.34); place(n, joined[0]); }, { duration: 1.4 }),
      to(viewB, (n) => { n.scale(0.34); place(n, targets[1]); }, { duration: 1.4 }),
    ),
  );
  c.show('leak', leak, { after: true });
  c.on('group', () => s.play(to(viewB, (n) => place(n, joined[1]), { duration: 1.5 })));
  c.swap('together', leak, repaired, { after: true });
  c.on('hashes', () => s.play(indicate(viewB, { scale: 1, color: 'yellow' })));
}
