import { dot, place, row, to } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { cast, caseBoard, photos, work } from '../parts.mjs';
export default function scene(s, c) {
  const photoCast = cast(s, c);
  s.add(heading('Two photos still count as one physical case'));
  const [top, body, foot] = work.rows([1, 5, 1], 'wide');
  const board = caseBoard(body);
  const duplicate = place(
    row(
      [
        mono('R-404 a', { color: 'cyan' }),
        mono('R-404 b', { color: 'cyan' }),
        label('→ one case', { color: 'dim' }),
      ],
      { gap: 'wide' },
    ),
    top,
  );
  const a = place(dot(18, 'pink'), top, 'left'),
    b = place(dot(18, 'pink'), top, 'right');
  const result = place(label('Precision 1/2 · recall 1/2', { color: 'yellow' }), foot);
  s.add(board.skeleton, duplicate, a, b);
  c.on('merge', () =>
    s.play(
      to(a, (n) => place(n, board.slots.TP, 'left'), { duration: 1.6 }),
      to(b, (n) => place(n, board.slots.TP, 'right'), { duration: 1.6 }),
    ),
  );
  c.show('tp', board.tokens[0], { after: true });
  c.hide('tp', [a, b], { after: true });
  c.show('fp', board.tokens[2], { after: true });
  c.show('fn', board.tokens[3], { after: true });
  c.show('tn', board.tokens[1], { after: true });
  c.show('metrics', result, { after: true });
}
