import { rect, place } from 'vizmatic/stage';
import { label, mono } from '../kit-narrated.mjs';

// An empty slot is capacity. There are no padding tokens in the serialized prompt.
export function allocation(region, shape, packed, { showFree = true } = {}) {
  const { capacity, rules, question, reserve } = shape;
  const sections = [
    { tag: 'Rules', units: rules, color: 'blue' },
    { tag: 'free', units: packed.remaining, color: 'dim', empty: true },
    ...[...packed.kept].sort((a, b) => a.order - b.order),
    { tag: 'Q', units: question, color: 'cyan' },
    { tag: 'Reply', units: reserve, color: 'pink' },
  ].filter(section => section.units > 0);
  const [names, rail] = region.rows([1, 1], 'tight');
  const pitch = rail.width / capacity;
  const nodes = [];
  let index = 0;
  for (const section of sections) {
    const { units, tag, color, empty } = section;
    const name = empty ? units + ' free' : tag + ' ' + units;
    const center = rail.left + pitch * (index + units / 2);
    if (!empty || showFree) nodes.push(label(name, { size: 32, color }).moveTo([center, names.cy]));
    for (let i = 0; i < units; i++) {
      nodes.push(rect(pitch - 3, Math.min(50, rail.height), {
        fill: empty ? null : color, stroke: empty ? color : null, width: 2, radius: 4,
      }).moveTo([rail.left + (index + i + 0.5) * pitch, rail.cy]));
    }
    index += units;
  }
  return nodes;
}

export function receipt(region, shape, packed) {
  return place(mono(`${packed.input} input  +  ${packed.output} reserved  =  ${packed.total} / ${shape.capacity}`,
    { size: 40 }), region);
}

export function detail(region, caption, value, color = 'ink') {
  const [name, content] = region.rows([1, 1.5], 'tight');
  return [place(label(caption, { size: 30, color: 'dim' }), name, 'bottom left'),
    place(label(value, { size: 48, color }), content, 'top left')];
}
