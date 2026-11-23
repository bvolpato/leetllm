import { assertEqual, dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { adam } from '../../../films/deep-dive-deepspeed/arithmetic.mjs';
import { ringSends } from '../../../films/deep-dive-deepspeed/construction.mjs';

export default function ring(s, c) {
  const letters = ['A', 'B', 'C', 'D'];
  const n = letters.length;
  const old = letters.map((_, i) => i + 1);
  const updated = old.map((w) => adam([w, 0, 0], w, 1)[0]);
  const perCollective = ringSends(n, n, 1);
  assertEqual(perCollective, 3, 'one rank sends three one-element chunks');
  const wrap = (index) => (index + n) % n;
  const phase = s.value(0),
    hop = s.value(0),
    schedule = s.value(0);
  const [context, body, operation, foot] = area
    .inset('normal')
    .rows([0.8, 4.7, 1.1, 0.8], 'normal');

  const intro = dynamic(() =>
    label(
      schedule.value >= 2
        ? 'One backward call    ·    equal element widths    ·    no extra gathers'
        : 'ZeRO 2    ·    one update owner per weight    ·    four compute replicas',
      { size: 40 },
    ).moveTo(context.point('center')),
  );
  const [head, ...rows] = body.rows([0.75, 1, 1, 1, 1], 'tight');
  const columns = (region) => region.columns([1.3, 1, 1, 1, 1], 'normal');
  const table = dynamic(() => {
    if (schedule.value >= 2) return [];
    const nodes = columns(head)
      .slice(1)
      .map((slot, i) =>
        place(mono(letters[i] + ' · owner R' + i, { size: 34, color: 'blue' }), slot),
      );
    rows.forEach((region, rank) => {
      const [name, ...slots] = columns(region);
      nodes.push(place(label('Replica R' + rank, { size: 39 }), name, 'left'));
      slots.forEach((slot, owner) => {
        const distance = wrap(rank - owner);
        const fresh = phase.value >= 1 && distance <= hop.value;
        const newest = fresh && distance === hop.value;
        const stroke = newest ? 'yellow' : fresh ? 'blue' : 'grid';
        const value = fresh ? '≈ ' + updated[owner].toFixed(2) : old[owner].toFixed(2);
        nodes.push(
          rect(slot.width, 70, { fill: 'surface', stroke, width: newest ? 4 : 2 }).moveTo(
            slot.point('center'),
          ),
          mono(value, { size: 40, color: fresh ? 'blue' : 'dim' }).moveTo(slot.point('center')),
        );
      });
    });
    return nodes;
  });

  const ringRead = dynamic(() => {
    if (schedule.value >= 2) return [];
    const h = hop.value;
    const line = h
      ? 'Hop ' +
        h +
        '     R0 sends ' +
        letters[wrap(1 - h)] +
        ' to R1     ·     R0 takes ' +
        letters[wrap(-h)] +
        ' from R3'
      : phase.value === 0
        ? 'First Adam step   ·   g = starting weight   ·   m = v = 0   ·   lr = 0.01'
        : phase.value === 1
          ? 'Which updated weights is R0 missing?'
          : 'R0 still needs the updated B, C and D.';
    return [
      label(schedule.value === 1 ? 'One all-gather sends 3 of the 4 elements per rank.' : line, {
        size: 40,
        color: 'yellow',
      }).moveTo(operation.point('center')),
      mono('Ring   R0 → R1 → R2 → R3 → R0        Elements sent by R0   ' + h, { size: 35 }).moveTo(
        foot.point('center'),
      ),
    ];
  });

  const [titles, ...lanes] = body.rows([0.7, 1, 1, 1], 'normal');
  const split = (r) => r.columns([1.05, 3.8, 0.85], 'normal');
  const schedules = [
    ['Replicated', ['RS gradients', 'AG gradients']],
    ['ZeRO 2', ['RS gradients', 'AG updated W']],
    ['ZeRO 3', ['AG forward W', 'AG backward W', 'RS gradients']],
  ];
  const comparison = dynamic(() => {
    if (schedule.value < 2) return [];
    const nodes = split(titles).map((r, i) =>
      place(
        label(['Schedule', 'Collective calls in order', 'R0 sends'][i], { size: 35, color: 'dim' }),
        r,
      ),
    );
    schedules.forEach(([name, calls], i) => {
      if (schedule.value < i + 2) return;
      const [kind, work, volume] = split(lanes[i]);
      nodes.push(place(label(name, { size: 40 }), kind, 'left'));
      const cells = work.columns(3, 'tight');
      calls.forEach((call, j) => {
        const color = call.includes(' W') ? 'blue' : 'cyan';
        nodes.push(
          rect(cells[j].width, 78, { fill: 'surface', stroke: color, width: 3 }).moveTo(
            cells[j].point('center'),
          ),
          place(label(call, { size: 31, color }), cells[j]),
        );
      });
      nodes.push(
        place(mono(String(ringSends(n, n, calls.length)), { size: 56, color: 'yellow' }), volume),
      );
    });
    nodes.push(
      mono('One call sends (N − 1) × P/N = 3 elements per rank here', { size: 37 }).moveTo(
        operation.point('center'),
      ),
      note(
        schedule.value < 5
          ? 'RS = reduce-scatter    ·    AG = all-gather'
          : 'Same bytes can expose different waits. Check overlap on the step timeline.',
        { size: 36, color: 'cyan' },
      ).moveTo(foot.point('center')),
    );
    return nodes;
  });
  s.add(heading(c.title), intro, table, ringRead, comparison);
  c.after('owners', () => phase.set(1));
  c.after('stale', () => phase.set(2));
  c.after('first', () => hop.set(1));
  c.after('second', () => hop.set(2));
  c.after('third', () => hop.set(3));
  c.after('unit', () => schedule.set(1));
  c.after('ddp', () => schedule.set(2));
  c.after('stage-two', () => schedule.set(3));
  c.after('stage-three', () => schedule.set(4));
  c.on('time', () => schedule.set(5));
}
