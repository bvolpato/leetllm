import { beside, column, dynamic, indicate, place, rect, stateGrid, to } from 'vizmatic/stage';
import { label, note } from '../../kit-narrated.mjs';
import { PAGE_LOOKS, FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'capacity');

  const [top, bottom] = VIEW.rows(2, 'loose');
  const [names, bars] = top.columns([1, 3], 'wide');
  const labels = place(
    column(
      [label('private footprint', { color: 'cyan' }), label('memory slots', { color: 'green' })],
      { gap: 'loose' },
    ),
    names,
  );
  const tracks = bars.rows(2, 'wide');
  const growth = s.value(0);
  const privateBar = dynamic(() =>
    rect(tracks[0].width * (0.18 + 0.54 * growth.value), 55, {
      fill: 'cyan',
      stroke: 'cyan',
    }).moveTo([
      tracks[0].left + (tracks[0].width * (0.18 + 0.54 * growth.value)) / 2,
      tracks[0].point('center')[1],
    ]),
  );
  const slots = dynamic(() =>
    rect(tracks[1].width / (1 + 3 * growth.value), 55, { fill: 'green', stroke: 'green' }).moveTo([
      tracks[1].left + tracks[1].width / (1 + 3 * growth.value) / 2,
      tracks[1].point('center')[1],
    ]),
  );
  const cols = bottom.columns(2, 'loose');
  const cores = place(
    stateGrid({ states: PAGE_LOOKS, columns: 8, rows: 3, cell: 38, initial: 'absent' }),
    cols[0],
  );
  const queue = place(
    stateGrid({ states: PAGE_LOOKS, columns: 12, rows: 3, cell: 38, initial: 'absent' }),
    cols[1],
  );
  const cn = beside(note('schematic active cores'), cores, 'under', 'normal');
  const qn = beside(note('schematic waiting sessions'), queue, 'under', 'normal');
  const caption = place(label('Host reserve stays protected', { color: 'yellow' }), FOOT);
  s.add(labels, privateBar, slots, cores, queue, cn, qn, caption);
  c.on('dirty', () => s.play(growth.to(1, { duration: 2 })));
  c.on('wake', () =>
    s.play(
      cores.change(() => true, 'copied', { duration: 1.3 }),
      queue.change(() => true, 'dirty', { duration: 2 }),
    ),
  );
  c.on('admission', () => s.play(indicate(caption, { scale: 1, color: 'yellow' })));
}
