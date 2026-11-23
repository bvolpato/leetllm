// A column names a logical block or range. Its two cells belong to different ranks.
import { dynamic, place, rect } from 'vizmatic/stage';
import { label, mono, note } from '../kit-narrated.mjs';
import { COLOR } from './parts.mjs';

export function rankMap(region, { title, columns, blocksPerCell, read }) {
  const [name, axis, ...rows] = region.rows([1, 0.8, 2, 2], 'tight');
  const tracks = (band) => band.columns([0.75, 1, 1, 1], 'tight');
  const labels = [place(label(title), name, 'left')];
  columns.forEach((name, index) =>
    labels.push(place(mono(name, { size: 34, color: 'dim' }), tracks(axis)[index + 1])),
  );
  const cells = [];
  rows.forEach((row, rank) => {
    const [legend, ...blocks] = tracks(row);
    labels.push(place(note(`rank ${rank}`, { size: 35 }), legend, 'right'));
    cells.push(...blocks);
  });

  const marks = dynamic(() =>
    cells.flatMap((cell, index) => {
      const { count, outline = 'gridStrong', color = COLOR.state, dashed = false } = read(index);
      const width = cell.width - 8;
      const height = Math.min(cell.height - 12, width * 0.85);
      const frame = rect(width, height, {
        fill: 'surface',
        stroke: outline,
        width: 3,
        radius: 12,
        ...(dashed ? { dash: [9, 7] } : {}),
      }).at(cell.cx, cell.cy);
      const across = blocksPerCell === 1 ? 1 : 4;
      const down = Math.ceil(blocksPerCell / across);
      const pitch = Math.min((width - 24) / across, (height - 24) / down);
      const tiles = Array.from({ length: blocksPerCell }, (_, i) =>
        rect(pitch * 0.82, pitch * 0.82, {
          radius: 5,
          fill: i < count ? color : null,
          stroke: i < count ? null : 'grid',
          width: 2,
        }).at(
          cell.cx + ((i % across) - (across - 1) / 2) * pitch,
          cell.cy + (Math.floor(i / across) - (down - 1) / 2) * pitch,
        ),
      );
      return [frame, ...tiles];
    }),
  );
  return { nodes: [...labels, marks], cells };
}
