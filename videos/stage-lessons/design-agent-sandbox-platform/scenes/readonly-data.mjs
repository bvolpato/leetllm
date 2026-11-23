import {
  beside,
  arrow,
  boxOf,
  column,
  dot,
  fadeIn,
  pictogram,
  place,
  stateGrid,
  to,
} from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { PAGE_LOOKS, FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  const map = host(s, c, 'readonly-data');

  const [top, bottom] = VIEW.rows([1.2, 2], 'normal');
  const cols = top.columns(3, 'loose');
  const a = place(
    column([pictogram('process', { size: 64, color: 'cyan' }), label('A reads')]),
    cols[0],
  );
  const image = place(
    column([
      pictogram('disk', { size: 70, color: 'green' }),
      mono('50 GiB · read only', { size: 34 }),
    ]),
    cols[1],
  );
  const b = place(
    column([pictogram('process', { size: 90, color: 'blue' }), label('B reads')]),
    cols[2],
  );
  const rows = bottom.columns(3, 'loose');
  const cache = place(
    stateGrid({ states: PAGE_LOOKS, columns: 8, rows: 2, cell: 38, initial: 'absent' }),
    rows[0],
  );
  const heap = place(
    stateGrid({ states: PAGE_LOOKS, columns: 8, rows: 2, cell: 38, initial: 'shared' }),
    rows[1],
  );
  const privatePages = place(
    stateGrid({ states: PAGE_LOOKS, columns: 8, rows: 2, cell: 38, initial: 'absent' }),
    rows[2],
  );
  const cn = beside(note('read-only file cache'), cache, 'under', 'normal');
  const hn = beside(note('snapshot heap'), heap, 'under', 'normal');
  const pn = beside(note('A private heap'), privatePages, 'under', 'normal');
  const gc = beside(
    label('GC writes', { color: 'cyan', size: 34 }),
    privatePages,
    'above',
    'normal',
  );
  const allocate = arrow(boxOf(heap).point('right'), boxOf(privatePages).point('left'), {
    stroke: 'cyan',
    pad: 16,
  });
  const marks = [a, b].map((x) => dot(13, 'yellow').moveTo(boxOf(x).point('right')));
  const caption = place(
    label('Shared file I/O and private writes use different budgets', { color: 'yellow' }),
    FOOT,
  );
  const locator = map.locate(image);
  c.clear([locator], 0.5, 0.2);
  s.add(a, image, b, cache, heap, privatePages, cn, hn, pn);
  c.on('read', () =>
    s.play(
      ...marks.map((d) => fadeIn(d, { duration: 0.1 })),
      to(marks[0], (n) => n.moveTo(boxOf(image).point('left')), { duration: 1.2 }),
      to(marks[1], (n) => n.moveTo(boxOf(image).point('right')), { duration: 1.2 }),
    ),
  );
  c.on('fault', () => s.play(cache.change(() => true, 'present', { duration: 1.8 })));
  c.show('dirty', [gc, allocate]);
  c.on('dirty', () => s.play(privatePages.change([0, 1, 2, 3, 4, 5], 'copied', { duration: 1.4 })));
  c.show('measure', caption);
  c.clear([allocate], 0.5, 0.2);
}
