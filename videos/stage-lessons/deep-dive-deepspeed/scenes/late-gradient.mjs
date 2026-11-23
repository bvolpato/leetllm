import { assertEqual, boxOf, connector, dot, place, row } from 'vizmatic/stage';
import { area, heading, mono, namedBox, note } from '../../kit-narrated.mjs';
import { gradientGate } from '../../../films/deep-dive-deepspeed/construction.mjs';
export default function late(s, c) {
  const [top, gates, values, settings] = area.inset('normal').rows([2, 1, 2.5, 0.8], 'wide');
  const [a, ownerArea, z] = top.columns(3, 'loose');
  const r0 = place(namedBox('R0 received: 1', { width: 420, height: 90, color: 'cyan' }), a);
  const owner = place(
    namedBox('W0 owner R0', { width: 360, height: 90, color: 'blue' }),
    ownerArea,
  );
  const r1 = place(
    namedBox('R1 in transit: 3', { width: 420, height: 90, color: 'cyan', dash: true }),
    z,
  );
  const delivered = place(
    namedBox('R1 delivered: 3', { width: 420, height: 90, color: 'cyan' }),
    boxOf(r1),
  );
  const incoming = connector(r1, owner, { color: 'cyan' });
  const complete = namedBox('8 microbatches complete', { width: 650, height: 76, color: 'green' });
  const ready = namedBox('reduced gradient incomplete', { width: 650, height: 76, color: 'dim' });
  place(row([complete, ready], { gap: 'loose' }), gates);
  const [w, m, decision] = values.rows(3, 'tight');
  const before = place(mono('W0 = 1', { color: 'blue' }), w),
    moments = place(mono('m = 0     v = 0', { color: 'pink' }), m);
  const blocked = place(note('Hold the update.', { color: 'red' }), decision);
  const reduced = place(mono('reduced mean = 2', { color: 'cyan' }), decision);
  const result = gradientGate(true, [1, 3]);
  assertEqual(result.gradient, 2, 'late receipt completes reduced gradient');
  assertEqual(result.next[1], 0.2, 'first moment');
  assertEqual(result.next[2], 0.004, 'second moment');
  const after = place(mono(`W0 ≈ ${result.next[0].toFixed(2)}`, { color: 'blue' }), w);
  const nextMoments = place(
    mono(`m = ${result.next[1].toFixed(1)}     v = ${result.next[2].toFixed(3)}`, {
      color: 'pink',
    }),
    m,
  );
  const readyText = place(
    namedBox('reduced gradient ready', { width: 650, height: 76, color: 'green' }),
    boxOf(ready),
  );
  const recipe = place(
    mono('Adam step 1    lr = 0.01    β₁ = 0.9    β₂ = 0.999    ε = 10⁻⁸', { size: 35 }),
    settings,
  );
  s.add(heading(c.title), r0, owner, r1, incoming, complete, ready, before, moments);
  c.show('hold', blocked, { after: true });
  c.on('receipt', () => s.play(incoming.send(dot(12, 'cyan'), { duration: 1.3 })));
  c.swap('receipt', r1, delivered, { lead: -1.3 });
  c.swap('mean', blocked, reduced, { after: true });
  c.swap('mean', ready, readyText, { after: true });
  c.show('mean', recipe, { after: true });
  c.swap('weight', before, after, { after: true });
  c.hide('weight', moments, { after: true });
  c.show('moments', nextMoments, { after: true });
}
