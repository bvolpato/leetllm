import {
  beside,
  boxOf,
  dot,
  fadeIn,
  indicate,
  line,
  place,
  rect,
  row,
  stateGrid,
  to,
} from 'vizmatic/stage';
import { label, namedBox, note } from '../../kit-narrated.mjs';
import { PAGE_LOOKS, FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'rng-window');
  const [head, tracks, application] = VIEW.rows([0.6, 2, 1], 'wide');
  const title = place(
    label('VMGenID notification → guest handling', { color: 'pink', size: 36 }),
    head,
  );
  const [names, lane, state] = tracks.columns([1.3, 4.5, 1.2], 'wide');
  const lanes = lane.rows(2, 'wide');
  const namesRows = names.rows(2, 'wide');
  const trackNames = ['vCPU execution', 'kernel handler'].map((x, i) =>
    place(label(x, { size: 34 }), namesRows[i]),
  );
  const wires = lanes.map((region) =>
    line(region.point('left'), region.point('right'), { stroke: 'dim', width: 4 }),
  );
  const resume = lane.left + lane.width * 0.16;
  const complete = lane.left + lane.width * 0.84;
  const window = rect(complete - resume, tracks.height, { stroke: 'red', fill: 'surface' })
    .moveTo([(resume + complete) / 2, tracks.point('center')[1]])
    .zIndex(-1);
  const race = place(note('race window', { color: 'red' }), lane, 'center');
  const resumed = label('resume', { color: 'cyan', size: 34 }).moveTo([resume, lanes[0].top]);
  resumed.moveTo([resume + boxOf(resumed).width / 2 + 24, lanes[0].top - 26]);
  const finished = label('reseed complete', { color: 'cyan', size: 34 }).moveTo([
    complete,
    lanes[1].bottom,
  ]);
  finished.moveTo([complete - boxOf(finished).width / 2 - 24, lanes[1].bottom + 32]);
  const cpu = dot(14, 'cyan').moveTo(lanes[0].point('left'));
  const handler = dot(14, 'pink').moveTo(lanes[1].point('left'));
  const kernel = place(
    stateGrid({ states: PAGE_LOOKS, columns: 3, rows: 2, cell: 35, initial: 'shared' }),
    state,
  );
  const kn = beside(note('kernel RNG'), kernel, 'under', 'normal');
  const app = place(
    row(
      ['PRNG seed', 'cached token', 'boot ID'].map((name) =>
        namedBox(`${name}: copied`, { width: 440, height: 74, color: 'green' }),
      ),
      { gap: 'wide' },
    ),
    application,
  );
  const caption = place(
    label('Application state still needs its separate repair', { color: 'yellow' }),
    FOOT,
  );
  const checks = place(
    note('Readiness: clock · kernel RNG · application · network · control'),
    FOOT,
  );
  s.add(title, trackNames, wires, window, race, kernel, kn, app);
  c.show('notify', resumed);
  c.on('notify', () =>
    s.play(
      fadeIn(cpu, { duration: 0.1 }),
      to(cpu, (n) => n.moveTo([complete, lanes[0].point('center')[1]]), { duration: 1.8 }),
    ),
  );
  c.on('reseed', () =>
    s.play(
      fadeIn(handler, { duration: 0.1 }),
      to(handler, (n) => n.moveTo([complete, lanes[1].point('center')[1]]), {
        duration: c.cue('reseed').end - c.cue('reseed').start,
      }),
    ),
  );
  c.after('reseed', () => s.play(kernel.change(() => true, 'copied', { duration: 0.6 })));
  c.show('reseed', finished, { after: true, lead: -0.6 });
  c.on('window', () => s.play(indicate(window, { scale: 1, color: 'red' })));
  c.show('app', caption, { after: true });
  c.swap('checks', caption, checks);
  c.clear(wires, 0.5, 0.2);
}
