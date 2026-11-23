import { assertEqual, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { MAIN, footer } from '../parts.mjs';
import { outline } from '../inspection-desk.mjs';

export default function sessionAdmission(s, c) {
  const [manifest, worker] = MAIN.columns([1.05, 1], 'wide');
  const fields = manifest.inset('wide').rows(5, 'normal');
  const layers = worker.inset('wide').rows(5, 'normal');
  const requested = ['Reused profile', 'CI + mail', 'Read + deploy'];
  const admitted = ['Fresh profile', 'CI only', 'Read only'];
  const inScope = (spec) => spec.every((value, i) => value === admitted[i]);
  assertEqual(inScope(requested), false, 'overbroad session');
  assertEqual(inScope(admitted), true, 'restricted session');
  const name = (text, r) => place(label(text, { size: 43 }), r, 'left');
  const value = (text, r, color) => place(mono(text, { size: 36, color }), r, 'left');
  const current = requested.map((v, i) => value(v, fields[i + 1], 'yellow'));
  const fixed = admitted.map((v, i) => value(v, fields[i + 1], 'cyan'));
  const waiting = value('Closed', layers[1], 'dim');
  const ready = value('Read-only CI session', layers[1], 'green');
  const refused = value('Launch refused', fields[4], 'pink');
  const limits = value('Time, steps, storage capped', fields[4], 'blue');
  const auth = value('Broker → CI session', layers[2], 'blue');
  const view = value('Model sees the page', layers[3], 'cyan');
  const route = value('CI route only', layers[4], 'blue');
  const manifestTitle = name('Requested session', fields[0]);
  const isolation = footer(
    'Keep mail, host files and clipboard export outside the worker.',
    'yellow',
  );
  const audit = [
    name('Host audit', fields[0]),
    value('frame-2', fields[1], 'cyan'),
    value('open run: permitted', fields[2], 'green'),
    value('evidence: [redacted]', fields[3], 'ink'),
  ];
  s.add(
    heading(c.title),
    outline(manifest, 'dim'),
    outline(worker, 'blue'),
    manifestTitle,
    current,
    name('Worker', layers[0]),
    waiting,
  );
  c.show('refuse', refused, { after: true });
  c.swap('profile', current[0], fixed[0]);
  c.swap('domain', current[1], fixed[1]);
  c.swap('account', current[2], fixed[2]);
  c.swap('bounds', refused, limits);
  c.swap('launch', waiting, ready, { after: true });
  c.show('broker', auth);
  c.show('model-view', view);
  c.show('network', route);
  c.show('clipboard', isolation);
  c.swap('audit', [manifestTitle, fixed, limits], audit);
  c.swap(
    'stop',
    isolation,
    footer('Operator stop   ·   revoke access and remove session state', 'blue'),
  );
  c.swap('cleanup', [ready, auth, view, route], value('Session state removed', layers[1], 'dim'), {
    after: true,
  });
}
