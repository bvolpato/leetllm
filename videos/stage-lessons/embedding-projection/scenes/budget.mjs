import { assertEqual, dynamic, group, place, rect } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { BODY, FOOT, TOP, VECTOR_BYTES } from '../parts.mjs';

export default function budget(s, c) {
  const { dimensions, reduced, bytesPerCoordinate, records } = VECTOR_BYTES;
  const n = s.value(dimensions);
  const [legend, full, shorter] = BODY.rows([0.6, 1.3, 1.3], 'normal');
  const cells = (r) => r.columns([1.2, 3, 1.25, 1.25], 'normal');
  const head = cells(legend);
  const headings = ['Index', 'Coordinates per vector', 'Bytes per vector', 'Array (GB)'].map(
    (v, i) => place(label(v, { size: 34 }), head[i]),
  );
  const run = (r, name, current, color) => {
    const [who, bars, bytes, total] = cells(r);
    const frames = Array.from({ length: 6 }, (_, i) =>
      rect(bars.width / 6 - 6, 48, { fill: 'surface', stroke: 'dim' }).moveTo([
        bars.left + ((i + 0.5) * bars.width) / 6,
        bars.cy,
      ]),
    );
    const strip = dynamic(() => {
      const k = Math.round(current()),
        width = (bars.width * k) / dimensions;
      return group(
        rect(width, 48, { fill: color }).moveTo([bars.left + width / 2, bars.cy]),
        mono(k.toLocaleString('en-US'), { size: 36, color }).moveTo([bars.cx, bars.cy + 62]),
      );
    });
    return { base: [place(label(name, { size: 39 }), who), frames, strip], bytes, total };
  };
  const baseline = run(full, 'Original', () => dimensions, 'ink');
  const test = run(shorter, 'Candidate', () => n.value, 'cyan');
  const bytes = (k, r) =>
    place(mono((k * bytesPerCoordinate).toLocaleString('en-US'), { size: 45 }), r);
  const gb = (k, r) =>
    place(mono(((k * bytesPerCoordinate * records) / 1e9).toFixed(2), { size: 45 }), r);
  assertEqual(dimensions / reduced, 6, 'raw array storage ratio');
  s.add(
    heading(c.title),
    place(
      label('10,000,000 records     •     float32     •     4 bytes per coordinate', { size: 40 }),
      TOP,
    ),
    headings,
    baseline.base,
  );
  c.show('budget-beat-1-focus-1', bytes(dimensions, baseline.bytes), { after: true });
  c.show('budget-shrink', test.base);
  c.on('budget-shrink', () => s.play(n.to(reduced, { duration: 2 })));
  c.show('budget-small', bytes(reduced, test.bytes), { after: true });
  c.show('budget-totals', [gb(dimensions, baseline.total), gb(reduced, test.total)], {
    after: true,
  });
  c.show(
    'budget-beat-3-focus-1',
    place(
      label('The candidate needs 1/6 of the original raw storage.', { color: 'yellow', size: 39 }),
      FOOT,
    ),
    { after: true },
  );
}
