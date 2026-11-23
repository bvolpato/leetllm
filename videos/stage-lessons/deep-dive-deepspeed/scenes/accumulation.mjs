import { assertEqual, place } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { WORK, open, finish, windowPicture } from '../parts.mjs';
export default function accumulation(s, c) {
  const b = open(s, c, 'accumulation'),
    [main, foot] = WORK.rows([5, 1], 'normal');
  const win = windowPicture(s, main, 'W0: managed backward + step per microbatch');
  const microbatch = 2,
    accumulation = 8,
    dataRanks = 4,
    batch = microbatch * accumulation * dataRanks;
  assertEqual(batch, 64, 'effective batch uses data degree');
  const formula = place(
    mono(
      `${microbatch} examples × ${accumulation} microbatches × ${dataRanks} data ranks = ${batch}`,
      { size: 36 },
    ),
    foot,
  );
  s.add(win.nodes);
  c.on('first', () =>
    s.play(win.count.to(3, { duration: 2.4 }), win.buffer.to(3, { duration: 2.4 })),
  );
  c.on('next', () => s.play(win.count.to(7, { duration: 3 }), win.buffer.to(7, { duration: 3 })));
  c.show('batch', formula, { after: true });
  c.on('last', () => s.play(win.count.to(8, { duration: 1 }), win.buffer.to(8, { duration: 1 })));
  c.after('last', () =>
    s.play(win.updates.to(1, { duration: 0.5 }), win.buffer.to(0, { duration: 0.5 })),
  );
  finish(c, b, 'accumulation');
}
