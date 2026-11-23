import { line } from 'vizmatic/stage';
import {
  C,
  HEADS,
  cacheBytes,
  change,
  foot,
  measure,
  note,
  place,
  readout,
  right,
  start,
  wall,
} from '../parts.mjs';

export default function budget(s, c) {
  start(s, c.title);
  const cache = wall(s, c);
  const [axis, ...lanes] = right.rows([1, 2, 2, 2], 'normal');
  const max = cacheBytes({ kvHeads: HEADS.mhaKV, tokens: 4 });
  const limit = 256;
  const ticks = [];
  s.add(place(note('Raw K/V bytes · same scale in every row'), axis, 'left'));
  for (const [i, [name, heads, cue]] of [
    ['MHA', HEADS.mhaKV, 'mha'],
    ['GQA', HEADS.gqaKV, 'gqa'],
    ['MQA', HEADS.mqaKV, 'mqa'],
  ].entries()) {
    const [label, track] = lanes[i].rows(2, 'tight');
    const at = (t) => cacheBytes({ kvHeads: heads, tokens: t });
    const color = i === 1 ? C.value : C.key;
    const value = measure(s, track, { max, color, height: 40 });
    const x = track.left + (track.width * limit) / max;
    const y = track.point('center')[1];
    ticks.push(line([x, y - 34], [x, y + 34], { stroke: C.result, width: 5 }));
    readout(
      s,
      c,
      label,
      [
        [null, name + ' · ' + heads + (heads === 1 ? ' head' : ' heads')],
        [cue, name + '     ' + at(3) + ' B', 'ink', true],
        [
          i === 1 ? 'fourth' : 'compare',
          name + '     ' + at(3) + ' + ' + at(1) + ' = ' + at(4) + ' B',
          color,
          i === 1,
        ],
      ],
      { size: 39 },
    );
    change(s, c, cue, value, at(3), true, 0.55);
    change(s, c, i === 1 ? 'fourth' : 'compare', value, at(4), i === 1, 0.55);
  }
  c.show('limit', ticks);
  change(s, c, 'fourth', cache.tokens, 4, true, 0.55);
  readout(
    s,
    c,
    foot,
    [
      ['fixture', '1 head at 1 position:  2 arrays × width 4 × 2 B × 2 layers = 32 B', 'ink', true],
      ['limit', 'Gold mark  ·  256 B available for raw K/V'],
      ['ask', 'Fourth position:  192 B + (2 heads × 32 B)  ≤  256 B?', C.result],
      ['fit', 'GQA:  2 stored heads × 32 B = 64 B for one more position', C.result, true],
      ['scope', 'On a device, also budget for weights, temporaries, reservations and replicas.'],
    ],
    { size: 36, align: 'center' },
  );
}
