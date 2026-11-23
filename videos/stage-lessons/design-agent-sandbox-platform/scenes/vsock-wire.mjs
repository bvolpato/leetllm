import { arrow, boxOf, dot, fadeIn, fadeOut, place, row, to } from 'vizmatic/stage';
import { mono, namedBox } from '../../kit-narrated.mjs';
import { FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'vsock-wire');

  const [top, bottom] = VIEW.rows([1, 2], 'wide');
  const ends = ['host AF_UNIX', 'Firecracker VMM', 'guest AF_VSOCK'].map((x) =>
    namedBox(x, { width: 460, height: 100, color: 'pink' }),
  );
  place(row(ends, { gap: 'wide' }), top);
  const wires = ends
    .slice(1)
    .map((n, i) =>
      arrow(boxOf(ends[i]).point('right'), boxOf(n).point('left'), { stroke: 'pink', pad: 16 }),
    );
  const command = place(mono('CONNECT 5000 ↵', { color: 'yellow', size: 48 }), bottom);
  const ack = place(mono('OK <assigned port> ↵', { color: 'pink', size: 48 }), bottom);
  const payload = place(mono('generation 4: bounded command', { color: 'cyan' }), bottom);
  const packet = dot(15, 'yellow').moveTo(boxOf(ends[0]).point('top'));
  const range = place(mono('2^30 ≤ assigned port < 2^31', { color: 'pink' }), FOOT);
  s.add(ends, wires, command);
  c.on('send', () =>
    s.play(
      fadeIn(packet, { duration: 0.1 }),
      to(packet, (n) => n.moveTo(boxOf(ends[2]).point('top')), { duration: 1.5 }),
    ),
  );
  c.swap('wait', command, ack);
  c.on('wait', () =>
    s.play(to(packet, (n) => n.moveTo(boxOf(ends[0]).point('top')), { duration: 1.5 })),
  );
  c.after('validated', () => {
    s.play(fadeOut(ack, { duration: 0.12 }));
    s.play(
      fadeIn(payload, { duration: 0.12 }),
      to(packet, (n) => n.moveTo(boxOf(ends[2]).point('top')), { duration: 1.4 }),
    );
  });
  c.show('range', range);
  c.clear(wires, 0.5, 0.2);
}
