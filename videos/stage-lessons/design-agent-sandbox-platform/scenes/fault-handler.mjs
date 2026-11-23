import {
  boxOf,
  column,
  dot,
  fadeIn,
  indicate,
  pictogram,
  place,
  row,
  stateGrid,
  to,
} from 'vizmatic/stage';
import { chip, label } from '../../kit-narrated.mjs';
import { PAGE_LOOKS, FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'fault-handler');

  const [top, bottom] = VIEW.rows(2, 'wide');
  const positions = top.columns(3, 'loose');
  const access = place(
    column([pictogram('process', { size: 90, color: 'cyan' }), label('A page access')]),
    positions[0],
  );
  const page = place(
    stateGrid({ states: PAGE_LOOKS, columns: 1, rows: 1, cell: 100, initial: 'absent' }),
    positions[1],
  );
  const file = place(
    column([pictogram('disk', { size: 90, color: 'green' }), label('snapshot file')]),
    positions[2],
  );
  const detail = place(
    row(
      [
        chip('File backend', { color: 'green' }),
        chip('UFFD handler', { color: 'pink' }),
        chip('deadline', { color: 'red' }),
      ],
      { gap: 'loose' },
    ),
    bottom,
  );
  const payload = dot(15, 'green').moveTo(boxOf(file).point('left'));
  const paused = place(label('Missing page → access waits', { color: 'red' }), FOOT);
  s.add(access, page, file, detail);
  c.on('file', () =>
    s.play(
      fadeIn(payload, { duration: 0.1 }),
      to(payload, (n) => n.moveTo(boxOf(page).point('center')), { duration: 1.4 }),
      page.change(0, 'present', { duration: 1.4 }),
    ),
  );
  c.on('delegate', () =>
    s.play(
      page.change(0, 'absent'),
      to(payload, (n) => n.moveTo(boxOf(file).point('left')), { duration: 0.5 }),
    ),
  );
  c.show('stall', paused, { after: true });
  c.on('hold', () => s.play(indicate(page, { scale: 1, color: 'red' })));
}
