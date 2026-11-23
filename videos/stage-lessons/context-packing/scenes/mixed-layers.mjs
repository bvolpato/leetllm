import { column, dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { cachePayload, GiB } from '../../../films/context-packing/arithmetic.mjs';

export default function mixedLayers(s, c) {
  const [legend, localRow, fullRow, sum] = area.rows([0.9, 2, 2, 1.15], 'normal');
  const groups = [
    { name: 'Local', layers: 40, heads: 8, width: 256, limit: 1024, region: localRow, color: 'blue' },
    { name: 'Full', layers: 8, heads: 1, width: 512, limit: 131072, region: fullRow, color: 'cyan' },
  ];
  const exponent = s.value(0), phase = s.value(0);
  s.add(heading(c.title), place(label('Retained positions per layer   ·   log₂ scale', { size: 40 }), legend),
    dynamic(() => {
      const tokens = 2 ** exponent.value;
      const nodes = [];
      const terms = [];
      for (const group of groups) {
        const [name, plot, bytes] = group.region.columns([2, 4, 1.8], 'wide');
        const retained = Math.min(group.limit, Math.round(tokens));
        const value = cachePayload({ ...group, tokens: retained }) / GiB;
        terms.push(value);
        nodes.push(...place(column([label(group.layers + ' ' + group.name.toLowerCase() + ' layers', { size: 48, color: group.color }),
          note(group.heads + ' KV heads   ×   width ' + group.width)], { gap: 'normal' }), name, 'left').nodes);
        const [counter, bar] = plot.rows(2, 'tight');
        nodes.push(place(mono(retained.toLocaleString('en-US') + ' positions', { size: 39 }), counter, 'bottom left'));
        const span = plot.width * Math.log2(retained) / 17;
        nodes.push(rect(plot.width, 32, { fill: 'surface', stroke: 'dim', width: 2 }).moveTo([bar.cx, bar.cy]));
        if (span > 0.5) nodes.push(rect(span, 32, { fill: group.color, stroke: null }).moveTo([bar.left + span / 2, bar.cy]));
        if (phase.value >= 2) nodes.push(place(mono(value + ' GiB', { size: 42, color: group.color }), bytes, 'left'));
      }
      if (phase.value === 1 || phase.value === 2) nodes.push(place(note('Separate key and value arrays   ·   2 bytes per element'), sum));
      if (phase.value === 3) nodes.push(place(mono(`${terms[0]} + ${terms[1]} = ${terms[0] + terms[1]} GiB`, { size: 55, color: 'yellow' }), sum));
      if (phase.value === 4) nodes.push(place(label('Verify eviction at 1,024 positions in the local layers.', { size: 44 }), sum));
      return nodes;
    }));
  c.on('local-cap', () => { phase.set(1); s.play(exponent.to(10, { duration: 1.4 })); });
  c.on('full-growth', () => s.play(exponent.to(17, { duration: 2.5 })));
  c.onBeat(1, () => phase.set(2));
  c.after('layer-sum', () => phase.set(3));
  c.on('inspect-buffers', () => phase.set(4));
}
