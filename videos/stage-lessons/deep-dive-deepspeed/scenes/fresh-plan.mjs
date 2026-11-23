import { assertEqual, dynamic, line, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { paddedWorkingSet } from '../../../films/deep-dive-deepspeed/construction.mjs';
import { memoryRuler, stateText } from '../memory-ruler.mjs';

export default function fresh(s, c) {
  const lengths = [7, 11, 5],
    ranks = 3;
  const first = paddedWorkingSet(lengths, ranks, [1]);
  const both = paddedWorkingSet(lengths, ranks, [1, 0]);
  const last = paddedWorkingSet(lengths, ranks, [0]);
  const fullBudget = 30,
    tightBudget = fullBudget - 1;
  const peak = Math.max(first.total, last.total);
  assertEqual(first.resident, 9, 'three local shards');
  assertEqual(both.total, fullBudget, 'overlap fits the first allowance');
  assertEqual(both.total - tightBudget, 1, 'overlap misses the second allowance by one');
  assertEqual(peak, 21, 'peak with release before the next gather');
  assertEqual(last.total, 18, 'live slots after the second gather');

  const [inventory, rail, queue, answer] = area.inset('normal').rows([2, 2, 1, 0.85], 'normal');
  const step = s.value(0),
    travel = s.value(0),
    showPeak = s.value(0);
  const cards = inventory.columns(lengths.length, 'wide');
  const inventoryNodes = cards.map((card, layer) => {
    const [name, diagram, detail] = card.rows([0.8, 1, 0.7], 'tight');
    const count = lengths[layer],
      shard = first.shards[layer];
    const pitch = 36,
      gap = 10;
    const start = (n, gaps) => diagram.cx - (n * pitch + gaps * gap) / 2 + pitch / 2;
    return [
      place(mono(String.fromCharCode(65 + layer) + ' · ' + count + ' weights', { size: 40 }), name),
      dynamic(() => {
        const split = step.value > 0;
        const n = split ? shard * ranks : count;
        const first = start(n, split ? ranks - 1 : 0);
        return Array.from({ length: n }, (_, index) => {
          const rank = split ? Math.floor(index / shard) : 0;
          const color = rank ? 'dim' : 'blue';
          const padding = index >= count;
          return rect(pitch - 5, 42, {
            fill: padding ? 'surface' : color,
            stroke: color,
            ...(padding ? { dash: [6, 4] } : {}),
          }).moveTo([first + index * pitch + rank * gap, diagram.cy]);
        });
      }),
      stateText(
        detail,
        () => (step.value ? 'R0 keeps ' + shard + ' slots' : 'Split over 3 ranks'),
        { size: 32, color: 'blue' },
      ),
    ];
  });
  const { resident, padded } = first;
  const ruler = memoryRuler(rail, fullBudget, () => {
    const phase = step.value;
    const limit = phase >= 6 ? tightBudget : fullBudget;
    const blocks = [];
    if (phase >= 1)
      blocks.push({ start: 0, size: resident, name: 'Resident · ' + resident, color: 'blue' });
    if ((phase >= 2 && phase < 8) || phase >= 10)
      blocks.push({
        start: resident,
        size: padded[1],
        name: 'Full B · ' + padded[1],
        color: 'cyan',
      });
    if (phase === 4 || phase === 9)
      blocks.push({
        start: phase === 4 ? first.total : resident,
        size: padded[0],
        name: 'Full A · ' + padded[0],
        color: 'green',
      });
    return { blocks, limit, limitLabel: limit + ' parameter slots' };
  });

  const request = dynamic(() => {
    const phase = step.value;
    if (![3, 5, 6, 7, 8, 10, 11].includes(phase)) return [];
    const width = (rail.width * padded[0]) / fullBudget - 4;
    const start = phase === 8 ? resident : first.total;
    const target = rail.left + (rail.width * (start + padded[0] / 2)) / fullBudget;
    const p = travel.value;
    const center = [queue.cx + (target - queue.cx) * p, queue.cy + (rail.cy - queue.cy) * p];
    return [
      rect(width, 96, { fill: 'surface', stroke: 'yellow', width: 3, dash: [12, 6] }).moveTo(
        center,
      ),
      mono('A requests ' + padded[0], { size: 38, color: 'yellow' }).moveTo(center),
    ];
  });
  const state = [
    'How many local slots stay on rank zero?',
    '3 + 4 + 2 = 9 resident slots',
    '9 resident + 12 for B = 21 live slots',
    '21 live out of 30. Can A gather before B finishes?',
    '9 + 12 + 9 = 30 live slots',
    'Same tensors. B is still in use.',
    '21 live out of 29. Start A now, or wait for B?',
    '8 free slots  <  9 requested',
    'B released · 9 local slots remain',
    '9 resident + 9 for A = 18 live slots',
    '9 resident + 12 for B. What else is live at this instant?',
    'Add gradients, Adam state, activations and workspace.',
  ];
  const peakMark = dynamic(() => {
    if (!showPeak.value) return [];
    const x = rail.left + (rail.width * peak) / fullBudget;
    return [
      line([x, rail.cy + 53], [x, rail.cy + 94], { stroke: 'pink', width: 4 }),
      note('Peak with B · ' + peak, { size: 34, color: 'pink' }).moveTo([x, rail.cy + 129]),
    ];
  });
  s.add(
    heading(c.title),
    inventoryNodes,
    ruler,
    request,
    peakMark,
    stateText(answer, () => state[step.value], { size: 44 }),
  );
  c.after('resident', () => step.set(1));
  c.after('b', () => step.set(2));
  c.on('ask', () => step.set(3));
  c.after('exact', () => {
    s.play(travel.to(1, { duration: 0.8 }));
    step.set(4);
  });
  c.on('replay', () => {
    travel.set(0);
    step.set(5);
  });
  c.after('limit', () => step.set(6));
  c.after('wait', () => {
    step.set(7);
    s.play(travel.to(1, { duration: 0.8 }));
  });
  c.after('release', () => {
    travel.set(0);
    step.set(8);
  });
  c.on('admit', () => {
    s.play(travel.to(1, { duration: 0.8 }));
    step.set(9);
  });
  c.after('peak', () => showPeak.set(1));
  c.on('scope', () => {
    travel.set(0);
    step.set(10);
  });
  c.on('other', () => step.set(11));
}
