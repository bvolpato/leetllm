import { assertEqual, dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { stateLedger } from '../../../films/deep-dive-deepspeed/arithmetic.mjs';

export default function ownership(s, c) {
  const [scope, table, cost, decision] = area.inset('normal').rows([0.85, 4, 1, 0.8], 'normal');
  const [headers, ...rows] = table.rows([0.8, 1, 1, 1, 1], 'tight');
  const columns = (region) => region.columns([1, 3, 3, 3], 'normal');
  const fields = ['Weights', 'Gradients', 'Master + both moments'];
  const colors = ['blue', 'cyan', 'pink'];
  const slices = ['A', 'B', 'C', 'D'];
  const stage = s.value(0),
    ask = s.value(0);
  const ledgers = [0, 1, 2, 3].map(stateLedger);
  const shardAt = [3, 2, 1];
  for (const [i, expected] of [24, 10.5, 8.25, 6].entries()) {
    assertEqual(ledgers[i].total, expected, 'persistent GB per rank at stage ' + i);
  }
  s.add(
    heading(c.title),
    place(label('Same model in four equal slices    ·    one row per data rank'), scope),
    columns(headers)
      .slice(1)
      .map((slot, i) => place(label(fields[i], { color: colors[i], size: 39 }), slot)),
  );
  rows.forEach((region, rank) => {
    const [name, ...groups] = columns(region);
    s.add(place(mono('R' + rank, { size: 44 }), name, 'left'));
    groups.forEach((group, field) => {
      const slots = group.columns(4, 'tight');
      s.add(
        dynamic(() =>
          slots.flatMap((slot, i) => {
            const kept = stage.value < shardAt[field] || i === rank;
            return [
              rect(slot.width, 62, {
                fill: kept ? colors[field] : 'surface',
                stroke: kept ? colors[field] : 'grid',
              }).moveTo(slot.point('center')),
              ...(kept
                ? [mono(slices[i], { size: 36, color: 'surface' }).moveTo(slot.point('center'))]
                : []),
            ];
          }),
        ),
      );
    });
  });
  s.add(
    dynamic(() => {
      const { parts, total } = ledgers[stage.value];
      const mode = stage.value ? 'ZeRO ' + stage.value : 'Replicated';
      return mono(mode + '     ' + parts.join(' + ') + ' = ' + total + ' GB per rank', {
        size: 46,
      }).moveTo(cost.point('center'));
    }),
    dynamic(() =>
      note(
        ask.value
          ? 'Measure the largest live gather on top of these shards.'
          : 'Each rank processes its own examples. A, B, C and D name quarters of the same model.',
        { size: 36 },
      ).moveTo(decision.point('center')),
    ),
  );
  c.after('optimizer', () => stage.set(1));
  c.after('gradient', () => stage.set(2));
  c.after('parameter', () => stage.set(3));
  c.on('peak', () => ask.set(1));
}
