import { dot, dynamic, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { PICTURE, FOOT, APPENDS, APPEND_EVENTS } from '../parts.mjs';
export default function append(s, c) {
  const [arrays, ledger] = PICTURE.columns([3, 1], 'loose');
  const bands = arrays.rows(3, 'wide'),
    capacities = [2, 4, 8];
  const cells = bands.map((b) => b.rows([1, 2], 'normal')[1].columns(8, 'tight'));
  const allocated = s.value(1);
  const progress = s.value(0);
  const snapshot = () => {
    const done = Math.floor(progress.value + 1e-7),
      event = APPEND_EVENTS[done];
    return {
      done,
      event,
      blocks: event ? event.before : APPEND_EVENTS.at(-1).after,
      fraction: progress.value - done,
    };
  };
  const blocks = dynamic(() =>
    snapshot()
      .blocks.filter((block) => block.id < allocated.value)
      .flatMap(({ capacity: cap, id: i }) => [
        label('capacity ' + cap, { color: 'blue' }).moveTo([
          (cells[i][0].left + cells[i][cap - 1].right) / 2,
          cells[i][0].cy - (cells[i][0].height * 0.65) / 2 - 48,
        ]),
        ...cells[i].slice(0, cap).map((slot) =>
          rect(slot.width, slot.height * 0.65, {
            fill: 'surface',
            stroke: 'blue',
            width: 2,
          }).moveTo(slot.point('center')),
        ),
      ]),
  );
  const values = dynamic(() =>
    snapshot().blocks.flatMap((block) =>
      block.values.map((value, slot) =>
        mono('ref ' + value, { size: 34, color: 'cyan' }).moveTo(
          cells[block.id][slot].point('center'),
        ),
      ),
    ),
  );
  const travel = dynamic(() => {
    const { event, fraction } = snapshot();
    if (!event || fraction <= 1e-7) return [];
    const target = event.before.find(
        (b) => b.capacity === Math.max(...event.before.map((b) => b.capacity)),
      ),
      to = cells[target.id][event.slot].point('center');
    const source =
      event.type === 'copy'
        ? cells[event.before[0].id][event.slot].point('center')
        : bands[target.id].point('right');
    const route =
      event.type === 'copy'
        ? [source, [arrays.right, source[1]], [arrays.right, to[1]], to]
        : [source, to];
    const leg = Math.min(route.length - 2, Math.floor(fraction * (route.length - 1)));
    const f = fraction * (route.length - 1) - leg;
    return [
      dot(12, 'yellow').moveTo(route[leg].map((v, axis) => v + (route[leg + 1][axis] - v) * f)),
    ];
  });
  const ledgerRows = ledger.rows(9, 'tight');
  const head = place(note('Arrival / writes / total'), ledgerRows[0]);
  const writes = dynamic(() => {
    const total = capacities[0] + snapshot().done;
    return APPENDS.flatMap((a, i) => {
      const before = a.totalWrites - a.writes;
      if (total <= before) return [];
      const charged = Math.min(total, a.totalWrites) - before;
      return [
        place(
          mono(a.arrival + ': +' + charged + ' → ' + (before + charged), {
            size: 34,
            color: a.copied ? 'pink' : 'dim',
          }),
          ledgerRows[i + 1],
        ),
      ];
    });
  });
  const bill = dynamic(() => {
    const done = snapshot().done;
    const copies = APPEND_EVENTS.slice(0, done).filter((e) => e.type === 'copy').length;
    const total = capacities[0] + done;
    return [
      place(
        mono(total - copies + ' new + ' + copies + ' copied = ' + total + ' writes', {
          color: 'yellow',
        }),
        FOOT,
      ),
    ];
  });
  const bound = place(
    label('Total Θ(n) → O(1) amortized per append · one resize can be O(n)'),
    FOOT,
  );
  s.add(heading(c.title), blocks, values, travel, head, writes, bill);
  c.on('append-resize', () => allocated.set(2));
  c.on('append-copy', () => s.play(progress.to(2), { duration: 1.65 }));
  c.on('append-write', () => s.play(progress.to(3), { duration: 0.7 }));
  c.on('append-fourth', () => s.play(progress.to(4), { duration: 0.65 }));
  c.on('append-sequence', () => {
    allocated.set(3);
    s.play(progress.to(APPEND_EVENTS.length), { duration: 5 });
  });
  const total = place(
    label('8 arrivals + 2 copied + 4 copied = 14 writes', { color: 'yellow' }),
    FOOT,
  );
  c.swap('append-total', bill, total);
  c.swap('append-bound', total, bound, { after: true });
}
