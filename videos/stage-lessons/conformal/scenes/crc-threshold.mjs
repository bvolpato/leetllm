import { place } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { router } from '../parts.mjs';

export default function crcThreshold(s, c) {
  const b = router(s, { lambda: 0.1 });
  b.resultOn.set(1);
  b.criterionOn.set(0);
  const fail = place(label('(2 + 1) / 10 = 30% > 25%', { color: 'red' }), b.plot, 'top');
  const pass = place(label('(1 + 1) / 10 = 20% ≤ 25%', { color: 'green' }), b.plot, 'top');
  const fallback = place(note('accept none · future joint loss = 0'), b.plot, 'top');
  s.add(heading(c.title));
  c.take([b.frame, b.drawing, b.threshold, b.readout]);
  const target = place(label('Target joint error ≤ 25%', { color: 'yellow' }), b.plot, 'top');
  s.add(target);
  c.swap('fail', target, fail, { after: true });
  c.after('fail', () => b.criterionOn.set(1));
  c.after('six', () => {
    b.resultOn.set(0);
    b.names.set(0);
    s.play(b.gate.to(0.6, { duration: 2 }));
    b.names.set(1);
  });
  c.swap('six', fail, target);
  c.after('pass', () => b.resultOn.set(1));
  c.swap('pass', target, pass, { after: true });
  c.on('fallback', () => {
    b.resultOn.set(0);
    b.names.set(0);
    s.play(b.gate.to(1, { duration: 1.5 }));
    b.names.set(1);
  });
  c.hide('fallback', pass);
  c.show('fallback', fallback, { after: true });
  c.after('fallback', () => {
    b.criterionOn.set(2);
    b.resultOn.set(1);
  });
}
