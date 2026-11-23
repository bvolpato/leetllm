import { dot, place, row, to } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { cast, caseBoard, work } from '../parts.mjs';
export default function scene(s, c) {
  const photoCast = cast(s, c);
  s.add(heading('Photo routes reduce to one case action'));
  const [top, body, foot] = work.rows([1, 5, 1], 'wide');
  const board = caseBoard(body);
  const labels = place(
    row(
      [
        mono('R-404 a · Priority', { color: 'pink', size: 34 }),
        mono('R-404 b · Priority', { color: 'pink', size: 34 }),
      ],
      { gap: 'wide' },
    ),
    top,
    'top',
  );
  const inputs = top.columns(2, 'loose');
  const a = place(dot(18, 'pink'), inputs[0], 'bottom'),
    b = place(dot(18, 'pink'), inputs[1], 'bottom');
  const priority = place(
    label('Any priority view → one priority case', { color: 'yellow', size: 34 }),
    foot,
  );
  const formulas = place(
    row(
      [
        mono('Precision = TP / (TP + FP)', { size: 32 }),
        mono('Recall = TP / (TP + FN)', { size: 32 }),
      ],
      { gap: 'wide' },
    ),
    foot,
  );
  s.add(board.skeleton, labels, a, b);
  c.on('precedence', () =>
    s.play(
      to(a, (n) => place(n, board.slots.TP, 'left'), { duration: 1.6 }),
      to(b, (n) => place(n, board.slots.TP, 'right'), { duration: 1.6 }),
    ),
  );
  c.show('once', board.tokens[0], { after: true });
  c.hide('once', [a, b], { after: true });
  c.show('once', priority, { after: true });
  c.show('cohort', board.tokens.slice(1));
  c.swap('precision', priority, formulas);
}
