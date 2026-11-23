import { indicate, place, table } from 'vizmatic/stage';
import { heading, label } from '../../kit-narrated.mjs';
import { cast, caseBoard, work } from '../parts.mjs';
export default function scene(s, c) {
  const photoCast = cast(s, c);
  s.add(heading('A missing false negative can inflate observed recall'));
  const [head, body, foot] = work.rows([1.4, 4.6, 1], 'wide');
  const board = caseBoard(body);
  const clock = place(
    table(
      [
        { key: 'id', label: 'R-408 availability' },
        { key: 'day', label: 'Day' },
        { key: 'cutoff', label: 'Readout' },
      ],
      [{ id: 'Missed damage', day: 12, cutoff: 12 }],
      { size: 32, width: head.width },
    ),
    head,
  );
  const observed = place(
    label('Observed: precision 1/2 · recall 1 · incomplete', { color: 'red', size: 34 }),
    foot,
  );
  const restored = place(
    label('Day 13: recall 1/2 · routes unchanged', { color: 'yellow', size: 34 }),
    foot,
  );
  const empty = place(
    label('No outcomes → precision unknown · recall unknown', { color: 'red', size: 34 }),
    foot,
  );
  s.add(board.skeleton, board.tokens, clock);
  c.on('delay', () => s.play(clock.setCell('Missed damage', 'day', 13, { duration: 0.5 })));
  c.hide('delay', board.tokens[3], { after: true });
  c.show('observed', observed, { after: true });
  c.on('failed', () => s.play(indicate(clock, { scale: 1, color: 'red' })));
  c.on('restore', () => s.play(clock.setCell('Missed damage', 'cutoff', 13, { duration: 0.5 })));
  c.show('restore', board.tokens[3], { after: true });
  c.swap('restore', observed, restored, { after: true });
  c.hide('empty', board.tokens, { after: true });
  c.swap('empty', restored, empty, { after: true });
}
