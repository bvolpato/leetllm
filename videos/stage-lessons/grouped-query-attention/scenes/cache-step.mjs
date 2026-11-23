import { dynamic, arrow } from 'vizmatic/stage';
import { C, change, foot, note, place, point, readout, right, start, wall } from '../parts.mjs';
export default function cacheStep(s, c) {
  start(s, 'Append at the current request position');
  const cache = wall(s, c),
    [info, vectors, cursor, verdict] = right.rows([1, 3, 1, 2], 'normal');
  const angle = s.value(0),
    lanes = vectors.columns(3, 'normal');
  s.add(place(note('Current token · query, key and value'), info, 'left'));
  lanes.forEach((r, i) => {
    const [space, name] = r.rows([4, 1], 'normal'),
      origin = point(space, 0.3, 0.72);
    const length = space.width * 0.45;
    const color = [C.query, C.key, C.value][i];
    s.add(
      place(note(['Query', 'Key', 'Value'][i], { color }), name),
      dynamic(() => {
        const a = i === 2 ? 0 : angle.value;
        return arrow(origin, [origin[0] + length * Math.cos(a), origin[1] - length * Math.sin(a)], {
          stroke: color,
          width: 7,
          tip: 15,
        });
      }),
    );
  });
  readout(s, c, cursor, [
    [null, 'Request length     1'],
    ['advance', 'Request length     2', C.result, true],
  ]);
  change(s, c, 'own', cache.lit, 0);
  change(s, c, 'rotate', angle, Math.PI / 4);
  change(s, c, 'write', cache.tokens, 2, true);
  change(s, c, 'stale', cache.cursor, 1, false, 0.2);
  change(s, c, 'read', cache.lit, 2);
  readout(
    s,
    c,
    verdict,
    [
      ['read', 'Read positions 0 and 1'],
      ['stale', 'Attempted append at position 1'],
      ['reject', 'Rejected · expected position 2', C.failure, true],
      ['reorder', 'Each request owns its cursor.'],
    ],
    { size: 38 },
  );
  readout(
    s,
    c,
    foot,
    [
      ['project', '8 query heads    ·    2 new key heads    ·    2 new value heads'],
      ['reorder', 'Scheduler reordering must carry the cursor and the physical locations.'],
      ['parity', 'Compare each cached step with full-prefix logits in the same model.'],
      ['chunks', 'Include ragged requests and multi-token chunks.'],
    ],
    { align: 'center', size: 35 },
  );
}
