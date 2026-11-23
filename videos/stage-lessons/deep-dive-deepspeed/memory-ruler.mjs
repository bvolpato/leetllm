import { boxOf, dynamic, line, rect } from 'vizmatic/stage';
import { label, mono } from '../kit-narrated.mjs';

// Block widths and the limit use the same units. An outlined block is a request still outside memory.
export function memoryRuler(region, extent, read) {
  const x = (amount) => region.left + (region.width * amount) / extent;
  const y = region.cy;
  return dynamic(() => {
    const { blocks, limit, limitLabel } = read();
    const nodes = [
      rect(region.width, 104, { fill: 'surface', stroke: 'grid', width: 3 }).moveTo([region.cx, y]),
    ];
    for (const { start, size, name, color, proposed = false } of blocks) {
      const width = x(size) - x(0) - 4;
      const center = [x(start + size / 2), y];
      nodes.push(
        rect(width, 96, {
          fill: proposed ? 'surface' : color,
          stroke: color,
          width: 3,
          ...(proposed ? { dash: [12, 6] } : {}),
        }).moveTo(center),
        mono(name, { size: 33, color: proposed ? color : 'surface' }).moveTo(center),
      );
    }
    const mark = x(limit);
    const tag = label(limitLabel, { color: 'yellow', size: 37 });
    // Align the label to the inside of the edge when the last slot is the limit.
    nodes.push(
      tag.moveTo([Math.min(mark, region.right - boxOf(tag).width / 2), y - 108]),
      line([mark, y - 79], [mark, y - 51], { stroke: 'yellow', width: 5 }),
      line([mark, y + 51], [mark, y + 80], { stroke: 'yellow', width: 5 }),
    );
    return nodes;
  });
}

export function stateText(region, read, { size = 40, color = 'ink' } = {}) {
  return dynamic(() => label(read(), { color, size }).moveTo(region.point('center')));
}
