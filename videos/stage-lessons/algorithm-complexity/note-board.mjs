import { dynamic, line, place, rect } from 'vizmatic/stage';
import { label, mono, note } from '../kit-narrated.mjs';
import { DOCS, NAMES, PICTURE, TERMS } from './parts.mjs';

export const [boardRegion, desk] = PICTURE.columns([1.15, 1], 'loose');
export const noteId = (index) => String.fromCharCode(65 + index);

// Both visits to the login question use the same rows and the same word tests.
export function noteBoard(comparisons, region = boardRegion, copy = false) {
  const [head, ...rows] = region.rows([0.8, 1, 1, 1, 1], 'normal');
  const cells = (r) => r.columns([2.7, 1, 1, 1], 'tight');
  const heads = cells(head);
  const labels = [
    place(note(copy ? 'Four more notes' : 'Authorized notes'), heads[0], 'left'),
    ...TERMS.map((term, j) => place(mono(term, { color: 'cyan', size: 36 }), heads[j + 1])),
  ];
  const body = dynamic(() =>
    rows.flatMap((r, i) => {
      const [name, ...checks] = cells(r);
      const read = Math.min(
        TERMS.length,
        Math.max(0, Math.floor(comparisons.value) - i * TERMS.length),
      );
      return [
        line(r.point('bottom left'), r.point('bottom right'), { stroke: 'grid', width: 2 }),
        place(
          label(noteId(i) + (copy ? '′   ' : '   ') + NAMES[i], {
            size: 36,
            color: read ? 'ink' : 'dim',
          }),
          name,
          'left',
        ),
        ...checks.flatMap((cell, j) => {
          const tested = j < read,
            match = tested && DOCS[i].words.includes(TERMS[j]);
          return [
            rect(cell.width * 0.76, 54, {
              fill: match ? 'blue' : 'surface',
              stroke: tested ? 'blue' : 'faint',
              width: 2,
            }).moveTo(cell.point('center')),
            ...(tested
              ? [place(mono(match ? '1' : '0', { size: 34, color: match ? 'bg' : 'dim' }), cell)]
              : []),
          ];
        }),
      ];
    }),
  );
  return { nodes: [labels, body], rows };
}
