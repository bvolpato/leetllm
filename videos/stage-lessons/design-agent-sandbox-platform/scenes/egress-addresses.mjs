import {
  arrow,
  boxOf,
  column,
  dot,
  fadeIn,
  indicate,
  pictogram,
  place,
  row,
  to,
  zone,
} from 'vizmatic/stage';
import { label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import { FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'egress-addresses');
  const [top, bottom] = VIEW.rows([1, 1.7], 'wide');
  const cols = top.columns(3, 'loose');
  const request = place(
    column([
      pictogram('signal', { size: 60, color: 'cyan' }),
      mono('api.vendor.test', { size: 34 }),
    ]),
    cols[0],
  );
  const gate = place(
    namedBox('resolve + validate', { width: 430, height: 90, color: 'pink' }),
    cols[1],
  );
  const address = place(
    namedBox('resolved IP: public', { width: 450, height: 90, color: 'green' }),
    cols[2],
  );
  const privateName = place(
    namedBox('private IP: BLOCKED', { width: 450, height: 90, color: 'red' }),
    cols[2],
  );
  const packet = dot(15, 'cyan').moveTo(boxOf(request).point('right'));
  const second = dot(15, 'red').moveTo(boxOf(request).point('right'));
  const [lowerTitle, lowerPath] = bottom.rows([1, 3], 'normal');
  const lower = lowerPath.columns(3, 'loose');
  const cap = place(
    column([
      label('A capability', { color: 'cyan', size: 34 }),
      mono('J4 / g4', { color: 'pink', size: 34 }),
    ]),
    lower[0],
  );
  const broker = place(
    zone(
      column([
        label('authenticated broker', { color: 'pink', size: 34 }),
        note('secret stays inside', { color: 'pink' }),
      ]),
      { color: 'pink', padding: 24 },
    ),
    lower[1],
  );
  const api = place(
    column([
      pictogram('service', { size: 60, color: 'green' }),
      label('approved private API', { size: 34, color: 'green' }),
    ]),
    lower[2],
  );
  const authority = arrow(boxOf(cap).point('right'), boxOf(broker).point('left'), {
    stroke: 'pink',
    pad: 22,
  });
  const upstream = arrow(boxOf(broker).point('right'), boxOf(api).point('left'), {
    stroke: 'pink',
    pad: 22,
  });
  const tls = place(
    label('Broker-originated TLS · GET /summarize', { color: 'pink', size: 34 }),
    lowerTitle,
  );
  const capability = dot(13, 'pink').moveTo(boxOf(cap).point('right'));
  const tlsPacket = dot(14, 'pink').moveTo(boxOf(broker).point('right'));
  const scope = place(
    note('Check: tenant A · generation 4 · private API · GET /summarize · unexpired'),
    FOOT,
  );
  const empty = place(note('Guest egress and approved broker access are separate paths'), FOOT);
  s.add(request, gate, address, cap, broker, api, empty);
  c.on('connect', () =>
    s.play(
      fadeIn(packet, { duration: 0.1 }),
      to(packet, (n) => n.moveTo(boxOf(address).point('left')), { duration: 1.5 }),
    ),
  );
  c.hide('again', packet);
  c.swap('again', address, privateName);
  c.on('again', () =>
    s.play(
      fadeIn(second, { duration: 0.1 }),
      to(second, (n) => n.moveTo(boxOf(gate).point('left')), { duration: 1.4 }),
    ),
  );
  c.on('metadata', () => s.play(tint(privateName, 'red')));
  c.show('broker', authority);
  c.on('broker', () =>
    s.play(
      fadeIn(capability, { duration: 0.1 }),
      to(capability, (n) => n.moveTo(boxOf(broker).point('left')), { duration: 1.2 }),
    ),
  );
  c.swap('scope', empty, scope);
  c.after('scope', () => s.play(indicate(broker, { scale: 1, color: 'yellow' })));
  c.show('upstream', [tls, upstream]);
  c.on('upstream', () =>
    s.play(
      fadeIn(tlsPacket, { duration: 0.1 }),
      to(tlsPacket, (n) => n.moveTo(boxOf(api).point('left')), { duration: 1.8 }),
    ),
  );
  c.clear([authority, upstream], 0.5, 0.2);
}
