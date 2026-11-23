import { boxOf, dot, fadeIn, place, row, to } from 'vizmatic/stage';
import { chip, label, mono, tint } from '../../kit-narrated.mjs';
import { FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'request-limits');

  const [top, mid, low] = VIEW.rows(3, 'normal');
  const owner = place(mono('tenant A / J4 / generation 4', { color: 'cyan' }), top);
  const targets = ['placement', 'command', 'writable', 'capability'].map((x) =>
    chip(x, { color: 'dim' }),
  );
  place(row(targets, { gap: 'wide' }), mid);
  const budget = place(
    row([mono('1–4 vCPU'), mono('0.5–8 GiB'), mono('5 GiB scratch')], { gap: 'loose' }),
    low,
  );
  const stamps = targets.map((x) => dot(12, 'cyan').moveTo(boxOf(owner).point('bottom')));
  const noteA = place(
    label('Host RAM includes resident pages, page tables and the VMM', {
      color: 'yellow',
      size: 38,
    }),
    FOOT,
  );
  s.add(owner, targets);
  c.on('bind', () =>
    s.play(
      ...stamps.map((d) => fadeIn(d, { duration: 0.1 })),
      ...stamps.map((d, i) =>
        to(d, (n) => n.moveTo(boxOf(targets[i]).point('top')), { duration: 1.2 }),
      ),
      ...targets.map((x) => tint(x, 'cyan')),
    ),
  );
  c.show('profiles', budget);
  c.show('allowance', noteA, { after: true });
}
