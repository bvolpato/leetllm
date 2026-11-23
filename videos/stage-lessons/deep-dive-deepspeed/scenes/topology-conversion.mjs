import { assertEqual, boxOf, connector, dot, dynamic, place, rect } from 'vizmatic/stage';
import { mono, namedBox, note } from '../../kit-narrated.mjs';
import { WORK, open, finish, parameterStorage } from '../parts.mjs';
export default function topology(s, c) {
  const b = open(s, c, 'topology-conversion');
  const [shards, denseArea, nativeArea, foot] = WORK.rows([1, 2, 2, 0.7], 'normal');
  const pool = parameterStorage(s, shards, [
    { name: 'checkpoint shards', ids: ['R0', 'R1', 'R2', 'R3'], initial: 4, wholeRow: true },
  ]);
  const dense = denseArea.columns([2, 3, 4], 'loose');
  const source = place(namedBox('dense ZeRO', { width: 300, height: 76, color: 'blue' }), dense[0]);
  const utility = place(
    namedBox('FP32 reconstruction', { width: 430, height: 76, color: 'blue' }),
    dense[1],
  );
  const wire = connector(source, utility, { color: 'blue' });
  const [caption, allocation, read] = dense[2].rows([1, 1, 1], 'tight');
  const cpu = place(note('CPU: full dense weights', { color: 'blue' }), caption);
  const frame = place(rect(allocation.width, 32, { fill: 'surface', stroke: 'grid' }), allocation);
  const gb = s.value(0),
    fullGB = 1.5 * 4;
  assertEqual(fullGB, 6, 'dense FP32 weights in decimal GB');
  const memory = dynamic(() =>
    rect(Math.max(0.001, (allocation.width * gb.value) / fullGB), 32, {
      fill: 'blue',
      stroke: 'blue',
    }).moveTo([allocation.left + (allocation.width * gb.value) / fullGB / 2, allocation.cy]),
  );
  const amount = dynamic(() =>
    mono(gb.value.toFixed(1) + ' / ' + fullGB + ' GB', { size: 34 }).moveTo(read.point('center')),
  );
  const native = nativeArea.columns([2, 3, 4], 'loose');
  const ep = place(namedBox('AutoEP native', { width: 300, height: 76, color: 'blue' }), native[0]);
  const tool = place(
    namedBox('universal tool', { width: 430, height: 76, color: 'dim' }),
    native[1],
  );
  const target = place(
    namedBox('fresh target engine', { width: 480, height: 76, color: 'dim' }),
    native[2],
  );
  const conversion = connector(ep, tool, { color: 'blue' }),
    load = connector(tool, target, { color: 'blue' });
  const blocked = place(note('AutoEP → dense reconstruction: unavailable', { color: 'red' }), foot);
  s.add(
    pool.nodes,
    source,
    utility,
    wire,
    cpu,
    frame,
    memory,
    amount,
    ep,
    tool,
    target,
    conversion,
    load,
  );
  c.on('dense', () =>
    s.play(wire.send(dot(12, 'blue'), { duration: 1.2 }), gb.to(fullGB, { duration: 3 })),
  );
  c.show('autoep', blocked);
  c.on('universal', () => s.play(conversion.send(dot(12, 'blue'), { duration: 1.8 })));
  c.on('fresh', () => s.play(load.send(dot(12, 'blue'), { duration: 1.8 })));
  finish(c, b, 'topology-conversion');
}
