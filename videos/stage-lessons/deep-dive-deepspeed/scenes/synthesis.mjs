import { indicate, place, steps } from 'vizmatic/stage';
import { namedBox, note, tint } from '../../kit-narrated.mjs';
import { WORK, open, finish, windowPicture } from '../parts.mjs';
export default function synthesis(s, c) {
  const b = open(s, c, 'synthesis'),
    [top, bottom] = WORK.rows([1, 4], 'wide');
  const life = place(
    steps(['gather W0', 'compute', 'reduce G0', 'owned update'], {
      width: top.width,
      current: 0,
      size: 34,
    }),
    top,
  );
  const [left, right] = bottom.columns([3, 2], 'loose');
  const win = windowPicture(s, left, 'W0 accumulation window');
  const cells = right.rows(3, 'wide');
  const complete = place(
    namedBox('window complete', { width: 600, height: 76, color: 'dim' }),
    cells[0],
  );
  const ready = place(
    namedBox('reduced gradient ready', { width: 600, height: 76, color: 'dim' }),
    cells[1],
  );
  const result = place(
    namedBox('permit one Adam update', { width: 600, height: 76, color: 'yellow' }),
    cells[2],
  );
  s.add(life, win.nodes, complete, ready);
  c.on('compute', () => s.play(life.go(1)));
  c.on('gradient', () => s.play(life.go(2), win.buffer.to(8, { duration: 1 })));
  c.after('gradient', () => s.play(tint(ready, 'green')));
  c.on('boundary', () => s.play(win.count.to(8, { duration: 1.5 })));
  c.show('boundary', result, { after: true });
  c.after('boundary', () =>
    s.play(
      tint(complete, 'green'),
      life.go(3),
      win.updates.to(1, { duration: 0.5 }),
      win.buffer.to(0, { duration: 0.5 }),
    ),
  );
  c.on('fail', () => s.play(indicate([complete, ready], { scale: 1, color: 'yellow' })));
  c.on('inspect', () => s.play(indicate(b.nodes, { scale: 1, color: 'yellow' })));
  finish(c, b, 'synthesis');
}
