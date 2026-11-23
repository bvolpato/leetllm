import { dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { cachePayload, GiB } from '../../../films/context-packing/arithmetic.mjs';

export default function cacheShape(s, c) {
  const [axes, measure, chart, reference, result] = area.rows([1.15, 1, 1.6, 1.1, 1.2], 'normal');
  const [names, bars] = chart.rows([1, 1.5], 'tight');
  const shape = { layers: 80, heads: 8, width: 128, tokens: 131072, bytes: 2 };
  const maximum = cachePayload({ ...shape, heads: 64 }) / GiB;
  const weightGiB = 70e9 * 2 / GiB;
  const plot = bars.inset('normal');
  const at = value => plot.left + value / maximum * plot.width;
  const phase = s.value(0);
  s.add(heading(c.title), dynamic(() => {
    const k = phase.value, heads = k >= 7 ? 64 : shape.heads;
    const payload = cachePayload({ ...shape, heads }) / GiB;
    const copies = k >= 3 && k < 6 ? 4 : 1;
    const nodes = [place(label(k === 5 ? 'Logical reads in one dense decode step' : 'Retained keys and values across requests', { size: 52 }), axes),
      place(mono(`80 layers    ${heads} KV heads    width 128    131,072 positions    2 bytes`, { size: 37 }), measure)];
    nodes.push(rect(plot.width, 86, { fill: 'surface', stroke: 'dim', width: 2 }).moveTo(plot.point('center')));
    for (let i = 0; i < copies; i++) {
      const start = i * payload;
      nodes.push(mono('R' + (i + 1), { size: 34 }).moveTo([at(start + payload / 2), names.cy]));
      for (const [j, color] of ['blue', 'cyan'].entries()) {
        const x = at(start + (j + 0.5) * payload / 2);
        const width = payload / (2 * maximum) * plot.width;
        nodes.push(rect(width - 3, 80, { fill: color, stroke: null }).moveTo([x, plot.cy]));
        if (k >= 1) nodes.push(mono(j ? 'V' : 'K', { size: 35, color: 'bg' }).moveTo([x, plot.cy]));
      }
    }
    if (k >= 3) {
      const x = at(weightGiB);
      nodes.push(rect(5, 35, { fill: 'yellow', stroke: null }).moveTo([x, plot.cy + 64]),
        label(k === 5 ? '≈130 GiB   ·   weights read once for the batch' : '≈130 GiB   ·   one copy of the weights', { size: 37, color: 'yellow' })
          .moveTo([x, reference.cy]));
    }
    if (k === 1) nodes.push(place(mono('2 × 80 × 8 × 128 × 131,072 × 2 bytes', { size: 46 }), result));
    if (k === 2 || k === 6 || k === 8) nodes.push(place(mono(payload + ' GiB per request', { size: 63, color: 'cyan' }), result));
    if (k === 4 || k === 5) nodes.push(place(mono(`4 × ${payload} = ${copies * payload} GiB`, { size: 64, color: 'cyan' }), result));
    return nodes;
  }));
  c.on('axes', () => phase.set(1));
  c.after('one-total', () => phase.set(2));
  c.on('four-requests', () => phase.set(3));
  c.after('four-total', () => phase.set(4));
  c.on('reads', () => phase.set(5));
  c.on('one-request', () => phase.set(6));
  c.on('many-heads', () => phase.set(7));
  c.after('many-total', () => phase.set(8));
}
