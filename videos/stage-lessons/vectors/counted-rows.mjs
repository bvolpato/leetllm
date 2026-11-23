import { dynamic, group, line, place, rect } from 'vizmatic/stage';
import { label, mono, note } from '../kit-narrated.mjs';
import { accumulators, fmt, vectorText } from './parts.mjs';

// Each check contributes one whole row to the numerator and one unit to the count.
export function tally(rows) {
  const included = rows.filter((row) => row.present && row.counted);
  const sum = rows[0].values.map((_, j) => included.reduce((n, row) => n + row.values[j], 0));
  return {
    sum,
    count: included.length,
    mean: included.length ? sum.map((v) => v / included.length) : null,
  };
}

export function countedRows(region, { rows, width, max, format = fmt, title, reference }) {
  const [sheet, gauge] = region.columns([1.08, 1], 'loose');
  const [sheetTitle, heads, ...slots] = sheet.rows([1, 0.85, ...rows().map(() => 1.4)], 'normal');
  const columns = (band) => band.columns([1, 2, 0.85], 'tight');
  const nodes = [place(label(title), sheetTitle)];
  for (const [j, name] of ['position', 'vector', 'in mean'].entries())
    nodes.push(place(note(name), columns(heads)[j]));
  slots.forEach((band, i) => {
    const [owner, value, vote] = columns(band);
    const size = Math.min(46, vote.height * 0.68);
    const [x, y] = vote.point('center');
    nodes.push(
      dynamic(() => {
        const row = rows()[i];
        if (!row.present) return place(mono('·', { color: 'dim' }), value);
        const color = row.counted ? 'cyan' : 'dim';
        const contents = [
          place(label(row.name, { size: 34, color }), owner, 'left'),
          place(mono(vectorText(row.values), { size: 37, color }), value),
          rect(size, size, { stroke: color, fill: 'surface', radius: 4 }).moveTo([x, y]),
        ];
        if (row.counted)
          contents.push(
            line([x - size * 0.3, y], [x - size * 0.08, y + size * 0.2], {
              stroke: color,
              width: 4,
            }),
            line([x - size * 0.08, y + size * 0.2], [x + size * 0.3, y - size * 0.23], {
              stroke: color,
              width: 4,
            }),
          );
        return group(...contents);
      }),
    );
  });

  const [calculation, bars] = gauge.rows([1, 3], 'wide');
  const [top, bottom] = calculation.rows(2, 'normal');
  const sum = dynamic(() =>
    place(mono('sum  ' + vectorText(tally(rows()).sum), { size: 39 }), top),
  );
  const count = dynamic(() =>
    place(mono('count  ' + tally(rows()).count, { size: 39, color: 'cyan' }), bottom),
  );
  const means = accumulators(bars, {
    title: 'Mean per coordinate',
    names: Array.from({ length: width }, (_, i) => 'f' + i),
    values: () => tally(rows()).mean ?? Array(width).fill('—'),
    max,
    format,
    reference,
  });
  return {
    sheet: nodes,
    sum,
    count,
    means: means.nodes,
    readings: means.readings,
    referenceMarks: means.referenceMarks,
  };
}
