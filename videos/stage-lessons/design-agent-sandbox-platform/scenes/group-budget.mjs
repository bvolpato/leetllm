import { assertEqual, dynamic, indicate, pictogram, place, rect, row, to } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'group-budget');

  const quota = 100000,
    period = 100000,
    spent = 60000;
  assertEqual(quota - spent, 40000, 'group remainder');
  assertEqual(quota / period, 1, 'mean core allowance');
  const [top, mid, bottom] = VIEW.rows([1, 1, 1], 'wide');
  const actors = place(
    row(
      [
        pictogram('thread', { size: 90, color: 'cyan' }),
        label('one shared cgroup'),
        pictogram('thread', { size: 90, color: 'cyan' }),
      ],
      { gap: 'loose' },
    ),
    top,
  );
  const allowance = s.value(quota);
  const rail = mid.inset('normal');
  const frame = place(rect(rail.width, 70, { stroke: 'dim', fill: 'surface' }), rail);
  const fill = dynamic(() =>
    rect((rail.width * allowance.value) / quota, 70, { fill: 'cyan', stroke: 'cyan' }).moveTo([
      rail.left + (rail.width * allowance.value) / quota / 2,
      rail.point('center')[1],
    ]),
  );
  const settings = place(mono(`${quota} / ${period} µs`), bottom);
  const remainder = place(
    mono(`${quota} − ${spent} = ${quota - spent} µs left`, { color: 'yellow' }),
    FOOT,
  );
  s.add(actors, frame, fill);
  c.on('shared', () => s.play(indicate(frame, { scale: 1, color: 'yellow' })));
  c.show('setting', settings);
  c.after('spend', () => s.play(allowance.to(quota - spent, { duration: 1.5 })));
  c.show('spend', remainder, { after: true, lead: -1.5 });
  c.on('memory', () => s.play(indicate(actors, { scale: 1, color: 'yellow' })));
}
