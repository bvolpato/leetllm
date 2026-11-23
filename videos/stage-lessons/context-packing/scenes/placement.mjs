import { dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { placeNeedle } from '../../../films/context-packing/model.mjs';

export default function placement(s, c) {
  const cases = [0, 0.5, 1].map(placeNeedle);
  const { document, needle, input, output, limit } = cases[0];
  const [task, labelBand, strip, results, foot] = area.rows([1.15, 0.7, 1.6, 1.2, 1], 'normal');
  const slots = strip.columns(document.length, 6);
  const [full, edge] = results.columns(2, 'wide');
  const position = s.value(0), edges = s.value(0), result = s.value(-1), transfer = s.value(0);
  s.add(heading(c.title), dynamic(() => {
    const nodes = [place(label('Who can find 99 followed by 98?', { size: 58 }), task)];
    slots.forEach((slot, i) => {
      const scans = i < 4 || i >= slots.length - 4;
      nodes.push(rect(slot.width, 100, { fill: edges.value && scans ? 'blue' : 'surface', stroke: 'dim', width: 2 })
        .moveTo([slot.cx, strip.cy]));
    });
    if (edges.value) for (const i of [1.5, 15.5]) {
      nodes.push(label('Edge reads 4', { size: 34, color: 'blue' }).moveTo([slots[0].cx + i * (slots[1].cx - slots[0].cx), labelBand.cy]));
    }
    needle.forEach((token, j) => {
      const x = slots[0].cx + (position.value + j) * (slots[1].cx - slots[0].cx);
      nodes.push(rect(slots[0].width - 6, 82, { fill: 'yellow', stroke: null }).moveTo([x, strip.cy]),
        mono(String(token), { size: 39, color: 'bg' }).moveTo([x, strip.cy]));
    });
    const known = result.value < 0 ? null : cases[result.value];
    for (const [region, name, key] of [[full, 'Full scan', 'full'], [edge, 'Edge scan', 'edge']]) {
      const verdict = known ? known[key] ? 'found' : 'missed' : '?';
      nodes.push(place(mono(name + '   ' + verdict, { size: 52, color: known ? known[key] ? 'green' : 'pink' : 'ink' }), region));
    }
    nodes.push(place(note(transfer.value ? 'Model test   /   move the fact, keep the question, score the answer' :
      `2 fixed + ${document.length} document = ${input} input     ·     ${output} for reply     ·     limit ${limit}`), foot));
    return nodes;
  }));
  const move = which => { result.set(-1); s.play(position.to(cases[which].index, { duration: 0.85 })); };
  c.on('edges', () => edges.set(1));
  c.after('head-result', () => result.set(0));
  c.on('middle-position', () => move(1));
  c.after('middle-result', () => result.set(1));
  c.on('tail-position', () => move(2));
  c.after('tail-result', () => result.set(2));
  c.on('model-test', () => transfer.set(1));
}
