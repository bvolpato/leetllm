import { column, dot, dynamic, group, line, place, rect, table } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { VALIDATION_STATES, BODY, bundle, open, RETAINED_RELEASES } from '../parts.mjs';
export default function strictLoader(s, c) {
  const [top, main, bottom] = BODY.rows([1, 5, 1], 'wide');
  const byteText = place(
    mono('{ schema: delay-v1, center: 5, range: 10, … }', { color: 'green', size: 34 }),
    top,
  );
  const [left, right] = main.columns([3, 2], 'loose');
  const fields = place(
    table(
      [
        { key: 'field', label: 'retained bytes' },
        { key: 'value', label: 'bound to', sample: 'training rows only' },
      ],
      [
        { id: 'input', field: 'input / transform', value: 'saved parameters' },
        { id: 'model', field: 'model / action', value: 'score + threshold' },
        { id: 'data', field: 'training digest', value: 'training rows only' },
        { id: 'fixture', field: 'fixture digest', value: 'includes outcomes' },
        { id: 'code', field: 'builder / Python', value: 'compatible runtime' },
      ],
      { states: VALIDATION_STATES, width: left.width, size: 34, leading: 2.1 },
    ),
    left,
  );
  const gates = place(
    table(
      [
        { key: 'gate', label: 'loader gate' },
        { key: 'state', label: 'decision', sample: 'STOP', marks: true },
      ],
      [
        { id: 'digest', gate: 'byte digest', state: 'pending' },
        { id: 'schema', gate: 'schema + keys', state: 'pending' },
        { id: 'numeric', gate: 'finite / scale > 0', state: 'pending' },
        { id: 'input', gate: 'input contract', state: 'pending' },
        { id: 'runtime', gate: 'code + dependencies', state: 'pending' },
      ],
      { states: VALIDATION_STATES, width: right.width, size: 34, leading: 2.1 },
    ),
    right,
  );
  const tampered = place(
    mono('{ schema: delay-v1, center: 5, range: 10, … } + SPACE', { color: 'cyan', size: 34 }),
    top,
  );
  const invalid = place(
    mono('{ schema: delay-v1, center: 5, range: 0, … }', { color: 'red', size: 34 }),
    top,
  );
  const booleanInput = place(
    mono('package range: 10 • request delay: true', { color: 'red', size: 34 }),
    top,
  );
  const numericStop = place(label('range 0 → numeric gate → STOP', { color: 'red' }), bottom);
  const inputStop = place(label('delay true → input gate → STOP', { color: 'red' }), bottom);
  const valid = place(label('Bytes match', { color: 'yellow' }), bottom);
  const stop = place(label('Changed bytes → stop reload', { color: 'red' }), bottom);
  const same = place(label('Reload → same predictions', { color: 'yellow' }), bottom);
  const impute = place(
    label('missing delay → saved 5 • serving batch never refits', { color: 'cyan' }),
    bottom,
  );
  const caution = place(
    note('Load trusted artifacts in their training environment · replay a known request'),
    bottom,
  );
  const gatePosition = s.value(0),
    packetOn = s.value(0),
    rejected = s.value(0);
  const ids = ['digest', 'schema', 'numeric', 'input', 'runtime'];
  const gatePacket = dynamic(() => {
    if (packetOn.value < 0.01) return [];
    const i = Math.min(3, Math.floor(gatePosition.value)),
      t = gatePosition.value - i;
    const a = gates.region(ids[i]).point('left'),
      b = gates.region(ids[i + 1]).point('left');
    return [
      dot(11, rejected.value ? 'red' : 'green').moveTo([a[0] - 24, a[1] + (b[1] - a[1]) * t]),
    ];
  });
  open(s, c);
  s.add(byteText, fields, gates, gatePacket);
  c.on('strict-model-loader-b1', () => s.play(fields.light('input')));
  c.show('loader-reload', same, { after: true });
  c.on('strict-model-loader-b2', () =>
    s.play(
      packetOn.to(1, { duration: 0.2 }),
      gates.light('digest'),
      gates.setCell('digest', 'state', { value: 'MATCH', state: 'pass' }),
    ),
  );
  c.swap('loader-space', byteText, tampered);
  c.hide('loader-space', same);
  c.on('loader-space', () =>
    s.play(gates.setCell('digest', 'state', { value: 'pending', state: 'pending' })),
  );
  c.show('loader-space', stop, { after: true });
  c.after('loader-space', () =>
    s.play(
      rejected.to(1, { duration: 0.1 }),
      gates.setCell('digest', 'state', { value: 'STOP', state: 'fail' }),
      gates.light('digest'),
    ),
  );
  c.swap('loader-contract', tampered, byteText, { after: true });
  c.swap('loader-contract', stop, valid, { after: true });
  c.after('loader-contract', () =>
    s.play(
      gates.setCell('digest', 'state', { value: 'MATCH', state: 'pass' }),
      rejected.to(0, { duration: 0.1 }),
      gatePosition.to(1, { duration: 0.5 }),
      gates.setCell('schema', 'state', { value: 'CHECK', state: 'pending' }),
      gates.light('schema'),
    ),
  );
  c.swap('loader-invalid', byteText, invalid);
  c.swap('loader-invalid', valid, numericStop);
  c.on('loader-invalid', () =>
    s.play(
      gates.setCell('schema', 'state', { value: 'OK', state: 'pass' }),
      rejected.to(1, { duration: 0.1 }),
      gatePosition.to(2, { duration: 0.5 }),
      gates.setCell('numeric', 'state', { value: 'STOP', state: 'fail' }),
      gates.light('numeric'),
    ),
  );
  c.swap('loader-input', invalid, booleanInput);
  c.swap('loader-input', numericStop, inputStop);
  c.on('loader-input', () =>
    s.play(
      gates.setCell('numeric', 'state', { value: 'OK', state: 'pass' }),
      gatePosition.to(3, { duration: 0.5 }),
      gates.setCell('input', 'state', { value: 'STOP', state: 'fail' }),
      gates.light('input'),
    ),
  );
  c.swap('loader-impute', booleanInput, byteText);
  c.swap('loader-impute', inputStop, impute);
  c.on('loader-impute', () =>
    s.play(
      rejected.to(0, { duration: 0.2 }),
      gates.setCell('input', 'state', { value: 'OK', state: 'pass' }),
      gates.light('input'),
    ),
  );
  c.on('strict-model-loader-b3', () =>
    s.play(gatePosition.to(4, { duration: 0.5 }), gates.light('runtime')),
  );
  c.swap('loader-runtime', impute, caution);
  c.on('loader-checksum-limit', () => s.play(gates.light('digest')));
}
