import { assertEqual, dynamic, group, line, place, polygon, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { PQ_PAIRS } from '../../../films/embedding-geometry/fixtures.mjs';
import { l2 } from '../../../films/embedding-geometry/arithmetic.mjs';

export default function pqCodebooks(s, c) {
  const books = PQ_PAIRS.map((pair) => [[0, 0], pair]);
  const ids = PQ_PAIRS.map((pair, i) => {
    const gaps = books[i].map((center) => l2(pair, center));
    return gaps.indexOf(Math.min(...gaps));
  });
  assertEqual(ids.join(','), '1,1,1,1', 'stored IDs used for the next lookup');

  const [picture] = area.rows([10, 1], 'none');
  const [input, work, stored] = picture.rows([1.3, 4.5, 1.3], 'wide');
  const lanes = (region) => region.columns([1.15, 1, 1, 1, 1], 'normal');
  const [inputLabel, ...pairs] = lanes(input);
  const [storageLabel, ...slots] = lanes(stored);
  const current = s.value(0);
  const bookIndex = () => Math.round(current.value);
  const outline = (region, color, width) =>
    rect(region.width - 12, 92, { fill: null, stroke: color, width, radius: 10 }).moveTo(
      region.point('center'),
    );

  const row = PQ_PAIRS.map((pair, i) => place(mono(pair.join('    '), { size: 45 }), pairs[i]));
  const pairEdges = pairs.map((r) => outline(r, 'faint', 2));
  const slotEdges = slots.map((r) => {
    const y = r.point('center')[1] + 44;
    return line([r.left + 12, y], [r.right - 12, y], { stroke: 'blue', width: 4 });
  });
  const activePair = dynamic(() => outline(pairs[bookIndex()], 'cyan', 5));

  const [book, caption] = work.columns([3, 1.3], 'loose');
  const [cx, cy] = book.point('center');
  const w = book.width * 0.45,
    h = book.height * 0.39;
  const page = (side) =>
    polygon(
      [
        [cx, cy - h + 20],
        [cx + side * w * 0.25, cy - h],
        [cx + side * w, cy - h],
        [cx + side * w, cy + h],
        [cx + side * w * 0.25, cy + h],
        [cx, cy + h + 20],
      ],
      { fill: 'surface', stroke: 'dim', width: 3 },
    );
  const centers = [0, 1].map((id) => [cx + (id ? 0.5 : -0.5) * w, cy]);
  const pages = group(
    page(-1),
    page(1),
    ...centers.map(([x, y], id) =>
      group(
        mono('ID ' + id, { size: 51, color: 'blue' }).moveTo([x, y - 70]),
        line([x - w * 0.35, y - 17], [x + w * 0.35, y - 17], { stroke: 'faint', width: 2 }),
      ),
    ),
  );
  const centerValues = centers.map(([x, y], id) =>
    dynamic(() =>
      mono('[' + books[bookIndex()][id].join(', ') + ']', { size: 51 }).moveTo([x, y + 42]),
    ),
  );
  const bookName = dynamic(() =>
    place(label('Book ' + (bookIndex() + 1), { size: 60, color: 'cyan' }), caption, 'left'),
  );
  const selectedCenter = dynamic(() => {
    const [x, y] = centers[ids[bookIndex()]];
    return line([x - w * 0.24, y + 88], [x + w * 0.24, y + 88], { stroke: 'yellow', width: 7 });
  });
  const sendId = (i) => {
    const [x, y] = centers[ids[i]];
    const mark = mono(String(ids[i]), { size: 54, color: 'yellow' }).moveTo([x, y + h + 56]);
    s.add(mark);
    s.play(to(mark, (n) => n.moveTo(slots[i].point('center')), { duration: 0.8 }));
  };

  const storage = place(label('Stored IDs', { size: 40, color: 'blue' }), storageLabel, 'left');
  s.add(
    heading(c.title),
    place(label('Input', { size: 40 }), inputLabel, 'left'),
    row,
    storage,
    slotEdges,
    pages,
  );
  c.show('split', pairEdges);
  c.show('nearest', [activePair, bookName, ...centerValues]);
  c.show('ids', selectedCenter, { after: true });
  c.after('ids', () => sendId(0));
  c.on('repeat', () => {
    for (let i = 1; i < books.length; i++) {
      s.play(current.to(i, { duration: 0 }));
      sendId(i);
      s.wait(0.35);
    }
  });
  c.swap(
    'store',
    storage,
    place(label('4 bytes', { size: 40, color: 'blue' }), storageLabel, 'left'),
    { after: true },
  );
}
