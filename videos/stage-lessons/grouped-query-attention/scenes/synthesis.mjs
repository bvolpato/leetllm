import { line } from 'vizmatic/stage';
import {
  C,
  body,
  compactMiB,
  foot,
  mono,
  note,
  place,
  point,
  readout,
  repeatedMiB,
  start,
} from '../parts.mjs';

export default function synthesis(s, c) {
  start(s, c.title);
  const peak = compactMiB + repeatedMiB;
  const [units, a, b, axis] = body.rows([1, 3, 3, 1], 'normal');
  s.add(
    place(
      note('Two possible allocation traces · live K/V arrays in MiB, one layer'),
      units,
      'left',
    ),
  );
  const split = (r) => r.columns([1, 5, 1], 'normal');
  for (const [i, lane] of [a, b].entries()) {
    const [name, track, result] = split(lane);
    const at = (x, v) => point(track, x, 0.86 - (v / peak) * 0.72);
    const segment = (x, v, z, w, color) => line(at(x, v), at(z, w), { stroke: color, width: 7 });
    s.add(
      place(mono('Trace ' + (i + 1), { size: 42 }), name, 'left'),
      segment(0, 0, 1, 0, 'grid'),
      segment(0, compactMiB, 0.24, compactMiB, C.key),
      segment(0.24, compactMiB, 0.24, peak, C.key),
      segment(0.24, peak, 0.68, peak, C.key),
    );
    c.show('ask', line(at(0.68, 0), at(0.68, peak), { stroke: C.result, width: 3, dash: [7, 6] }));
    const cue = i ? 'long' : 'short',
      after = i ? peak : compactMiB;
    const end = segment(0.68, after, 1, after, i ? C.position : C.value);
    c.show(cue, i ? end : [segment(0.68, peak, 0.68, after, C.value), end], { after: true });
    readout(
      s,
      c,
      result,
      [
        [null, peak + ' peak'],
        [cue, after + ' live', i ? C.position : C.value, true],
      ],
      { size: 34 },
    );
  }
  const [, track] = split(axis);
  for (const [x, label] of [
    [0.08, 'Before'],
    [0.42, 'In attention'],
    [0.83, 'After return'],
  ]) {
    s.add(note(label).moveTo(point(track, x, 0.5)));
  }
  readout(
    s,
    c,
    foot,
    [
      ['ask', 'Look at the live arrays at return. Do the repeated heads disappear?', C.result],
      ['peak', 'Same peak, different retained arrays. Inspect shape and ownership.', 'ink', true],
      ['parity', 'Cached vs full-prefix outputs · one query and a chunk'],
      ['quality', 'Converted vs original checkpoint · held-out task quality'],
      ['device', 'For admission, count the copies on each rank.'],
    ],
    { size: 37, align: 'center' },
  );
}
