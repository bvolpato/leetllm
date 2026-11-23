import {
  arrow,
  assertEqual,
  boxOf,
  column,
  dot,
  fadeIn,
  indicate,
  pictogram,
  place,
  row,
  to,
} from 'vizmatic/stage';
import { label, mono, namedBox } from '../../kit-narrated.mjs';
import { FOOT, VIEW, host, networkDecision } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'network');

  const [nameBand, pathBand, brokerBand] = VIEW.rows([1, 2, 1], 'normal');
  const nameSlots = nameBand.columns(3, 'loose');
  const name = place(mono('api.vendor.test', { color: 'cyan', size: 34 }), nameSlots[0]);
  const resolved = place(
    namedBox('resolved IP: pending', { width: 530, height: 72, color: 'dim' }),
    nameSlots[1],
  );
  const publicResolved = place(
    namedBox('resolved IP: public', { width: 530, height: 72, color: 'green' }),
    nameSlots[1],
  );
  const privateResolved = place(
    namedBox('resolved IP: private', { width: 530, height: 72, color: 'red' }),
    nameSlots[1],
  );
  const places = pathBand.columns(3, 'loose');
  const guest = place(
    column([pictogram('process', { size: 75, color: 'cyan' }), label('A request')]),
    places[0],
  );
  const gate = place(
    column([pictogram('signal', { size: 75, color: 'pink' }), label('address gate')]),
    places[1],
  );
  const api = place(
    column([pictogram('service', { size: 75, color: 'green' }), label('approved API')]),
    places[2],
  );
  const wires = [
    arrow(boxOf(guest).point('right'), boxOf(gate).point('left'), { stroke: 'dim', pad: 24 }),
    arrow(boxOf(gate).point('right'), boxOf(api).point('left'), { stroke: 'dim', pad: 24 }),
  ];
  const publicPacket = dot(16, 'green').moveTo(boxOf(guest).point('right'));
  const privatePacket = dot(16, 'red').moveTo(boxOf(guest).point('right'));
  const secret = place(
    row([
      pictogram('database', { size: 60, color: 'pink' }),
      label('broker: secret stays here', { color: 'pink', size: 36 }),
    ]),
    brokerBand,
  );
  const publicName = place(label('public address → connected', { color: 'green' }), FOOT);
  const denied = place(label('same name → private address → BLOCKED', { color: 'red' }), FOOT);
  const scoped = place(label('J4 · generation 4 · GET /summarize', { color: 'yellow' }), FOOT);
  const opaque = dot(12, 'pink').moveTo(boxOf(secret).point('left'));
  s.add(name, resolved, guest, gate, api, wires, secret);
  c.swap('public', resolved, publicResolved);
  c.swap('rebind', publicResolved, privateResolved, { lead: -1.4 });
  c.after('rebind', () =>
    s.play(
      indicate(privateResolved, { scale: 1, color: 'red' }),
      indicate(gate, { scale: 1, color: 'red' }),
    ),
  );
  c.on('public', () =>
    s.play(
      fadeIn(publicPacket, { duration: 0.1 }),
      to(publicPacket, (n) => n.moveTo(boxOf(api).point('left')), { duration: 1.8 }),
    ),
  );
  c.show('public', publicName, { after: true });
  c.on(
    'rebind',
    () =>
      s.play(
        fadeIn(privatePacket, { duration: 0.1 }),
        to(privatePacket, (n) => n.moveTo(boxOf(gate).point('left')), { duration: 1.5 }),
      ),
    1.9,
  );
  c.hide('rebind', publicName, { lead: -1.4 });
  c.show('rebind', denied, { after: true });
  c.on('opaque', () =>
    s.play(
      fadeIn(opaque, { duration: 0.1 }),
      to(opaque, (n) => n.moveTo(boxOf(guest.nodes[0]).point('top')), { duration: 1.4 }),
    ),
  );
  c.swap('scope', denied, scoped);
  c.swap('scope', privateResolved, publicResolved);
  c.hide('scope', privatePacket);
  c.on('inject', () => {
    assertEqual(
      networkDecision({
        publicAddress: true,
        allowlisted: true,
        job: 'J4',
        method: 'GET',
        operation: '/summarize',
      }).inject,
      true,
      'approved scoped connection',
    );
    s.play(indicate(api, { scale: 1, color: 'yellow' }));
  });
  c.clear(wires, 0.5, 0.2);
}
