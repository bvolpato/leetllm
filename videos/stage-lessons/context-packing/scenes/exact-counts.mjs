import { dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { records } from '../../../films/context-packing/fixtures.mjs';
import { aggregate } from '../../../films/context-packing/model.mjs';

export default function exactCounts(s, c) {
  const [table, tally] = area.columns([1.25, 1], 'loose');
  const rows = table.rows(records.length + 1, 'tight');
  const [scope, a, b, verdict, sources] = tally.rows([1, 1.2, 1.2, 1, 1.3], 'normal');
  const matches = row => row.month === 'Mar' && row.type === 'timeout';
  const ranked = records.filter(matches).sort((x, y) => y.score - x.score).slice(0, 2);
  const rest = records.filter(row => !ranked.includes(row));
  const order = [...ranked, ...rest];
  const count = s.value(0), phase = s.value(0);
  s.add(heading(c.title), dynamic(() => {
    const checked = order.slice(0, Math.floor(count.value));
    const selected = checked.filter(matches);
    const result = aggregate(selected);
    const nodes = [place(label(phase.value < 2 ? 'Retrieved matches' : 'Checking all records', { size: 45 }), scope)];
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].columns([0.6, 0.9, 0.9, 1.2], 'tight');
      const r = records[i - 1];
      if (i && !checked.includes(r)) {
        nodes.push(place(mono(r.id, { size: 37, color: 'dim' }), cells[0], 'left'));
        if (i === 3 && phase.value < 2) nodes.push(label('Outside the retrieved set', { size: 33, color: 'dim' }).moveTo([rows[i].cx, rows[i].cy]));
        else nodes.push(rect(rows[i].width * 0.45, 3, { fill: 'dim', opacity: 0.38, stroke: null }).moveTo(rows[i].point('center')));
        continue;
      }
      const data = i ? [r.id, r.month, r.service, r.type] : ['ID', 'Month', 'Service', 'Event'];
      const color = !i ? 'dim' : selected.includes(r) ? r.service === 'A' ? 'blue' : 'green' : checked.includes(r) ? 'dim' : 'ink';
      data.forEach((word, j) => nodes.push(place(mono(word, { size: i ? 42 : 31, color }), cells[j], 'left')));
    }
    for (const [i, key] of ['A', 'B'].entries()) {
      const color = i ? 'green' : 'blue';
      const [name, marks] = [a, b][i].columns([1, 2], 'normal');
      nodes.push(place(mono(key + '  ' + result.counts[key], { color, size: 52 }), name, 'left'));
      const slots = marks.columns(3, 'tight');
      for (let j = 0; j < result.counts[key]; j++) nodes.push(rect(slots[j].width, 64, { fill: color, stroke: null }).moveTo(slots[j].point('center')));
    }
    if (phase.value === 0 && selected.length === 2) nodes.push(place(label('Can two rows settle the winner?', { size: 37 }), verdict));
    if (phase.value === 1) nodes.push(place(note('Only the ranked rows have been counted.'), verdict));
    if (phase.value >= 3) nodes.push(place(label(`Service ${result.winner} wins   ·   ${result.counts.B} to ${result.counts.A}`, { size: 49, color: 'green' }), verdict));
    if (phase.value >= 3) nodes.push(place(mono(phase.value === 4 ? selected.length + ' matching events / ' + checked.length + ' records' : result.sources.join('  '), { size: 34 }), sources));
    return nodes;
  }));
  c.on('rank-two', () => s.play(count.to(ranked.length, { duration: 0.85 })));
  c.on('show-scope', () => phase.set(1));
  c.on('tie', () => { phase.set(2); s.play(count.to(4, { duration: 0.9 })); });
  c.after('winner', () => count.set(5));
  c.on('exclude-rows', () => s.play(count.to(order.length, { duration: 1.1 })));
  c.after('complete-count', () => phase.set(3));
  c.on('provenance', () => phase.set(4));
}
