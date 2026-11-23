import { column, fade, fadeIn, indicate, pictogram, place, rect, to, zone } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'namespace-identity');

  const [top, bottom] = VIEW.rows([3, 1], 'wide');
  const halves = top.columns(2, 'loose');
  const taps = ['A', 'B'].map((name, i) =>
    place(
      zone(
        column([
          pictogram('signal', { size: 75, color: i ? 'blue' : 'cyan' }),
          mono('tap0', { color: i ? 'blue' : 'cyan' }),
          note('same private address'),
        ]),
        { title: `clone ${name} TAP`, color: 'dim', titleSize: 34, padding: 24 },
      ),
      halves[i],
    ),
  );
  const collision = place(label('One namespace: name conflict', { color: 'red' }), bottom);
  const routing = place(
    label('Separate namespaces · explicit routes and filters', { color: 'yellow' }),
    bottom,
  );
  const control = place(label('Reconnect vsock for generation 4', { color: 'pink' }), FOOT);
  const common = place(
    rect(top.width - 20, top.height - 15, { stroke: 'red', fill: null, radius: 12 }),
    top,
  ).zIndex(-1);
  taps.forEach((t) => t.frame.opacity(0));
  s.add(taps, common, collision);
  c.on('conflict', () => s.play(...taps.map((x) => indicate(x, { scale: 1, color: 'red' }))));
  const movingWords = taps.flatMap((t) => [t.title, ...t.content.slice(1)]);
  c.hide('separate', movingWords, { fade: 0.1 });
  c.on('separate', () =>
    s.play(
      to(common, (n) => n.set('sx', 0.001), { duration: 1.4 }),
      to(taps[0].frame, (n) => n.opacity(1), { duration: 1.4 }),
      to(taps[1].frame, (n) => n.opacity(1), { duration: 1.4 }),
      to(taps[0].frame, (n) => n.stroke('cyan')),
      to(taps[1].frame, (n) => n.stroke('blue')),
    ),
  );
  c.show('separate', movingWords, { lead: -1.6 });
  c.hide('separate', common, { lead: -1.5 });
  c.hide('separate', collision);
  c.show('route', routing);
  c.show('control', control);
}
