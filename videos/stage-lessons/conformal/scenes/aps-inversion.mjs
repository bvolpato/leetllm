import { group, line, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { CALIBRATION_CLASS_ZERO } from '../parts.mjs';
import { cumulativeCut, massBoard } from '../cumulative-board.mjs';

export default function apsInversion(s, c) {
  const title = heading(c.title);
  const board = massBoard(s);
  const [description, scores, answer] = area.inset('wide').rows([1, 2, 1], 'wide');
  const slots = scores.columns(CALIBRATION_CLASS_ZERO.length, 'tight');
  const chosen = slots[cumulativeCut.index];
  const calibration = group(
    place(label('Cumulative scores of the nine true labels'), description),
    ...CALIBRATION_CLASS_ZERO.flatMap((p, i) => [
      mono('C' + (i + 1), { size: 34, color: 'cyan' }).moveTo([slots[i].cx, scores.cy - 65]),
      mono(p.toFixed(2), { size: 40 }).moveTo([slots[i].cx, scores.cy + 8]),
      note('rank ' + (i + 1), { size: 30 }).moveTo([slots[i].cx, scores.cy + 76]),
    ]),
  );
  const selection = group(
    line([chosen.left + 10, scores.cy + 44], [chosen.right - 10, scores.cy + 44], {
      stroke: 'yellow',
      width: 6,
    }),
    place(
      mono('ceil(10 × 0.80) = 8     q = ' + cumulativeCut.threshold.toFixed(2), {
        color: 'yellow',
      }),
      answer,
    ),
  );
  s.add(title, board.drawing);
  c.on('first', () => board.extend(1));
  c.on('third', () => board.extend(3, 1.3));
  c.swapAll('calibrate', calibration, { keep: [title] });
  c.show('threshold', selection, { after: true });
  c.swap('return', [calibration, selection], board.drawing, { lead: 0 });
  c.on('return', () => board.cutoffOn.set(1));
  c.on('last', () => {
    board.extend(4);
    board.askDirect.set(1);
  });
  c.after('three', () => board.baseOn.set(1));
  c.on('confident', () => board.reset(1));
  c.after('first-end', () => {
    board.extend(1);
    board.askDirect.set(1);
  });
  c.after('empty', () => {
    board.baseOn.set(1);
    board.extend(4, 1.2);
  });
  c.keep(board.drawing);
}
